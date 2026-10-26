// Kernbau (Naht-Stufe 2): aus einer Kernbeschreibung entsteht deterministisch der diskrete Kern
// der Gesamt-PSF im Arbeitsmassstab (ADR-0002, docs/architektur.md Abschnitt 3, Issue #4).
// Gesamt-PSF = Airy(D, Obstruktion) gefaltet mit Moffat(Seeing-FWHM, beta 4,765) gefaltet mit
// Gauss(Augen-FWHM); Formeln in docs/recherche/physik.md, Abschnitte 1.1, 2.2, 3.2 und 9.
//
// Rechenweg wie im Prototyp (prototyp/faltung.html, Block logik, Branch prototyp-faltung):
// jede Komponente auf einem feinen Raster (Arbeitspixel / Ueberabtastung) abtasten, auf Summe 1
// normieren, per FFT multiplizieren, zuruecktransformieren und auf Arbeitspixel binnen.
// Abweichungen vom Prototyp, jeweils am Ort begruendet: Drehfaktortabelle in der FFT,
// punktsymmetrisches Binning, Ueberabtastung 2 statt 4 bei Kernen ueber 42 px, FFT-Groesse
// mindestens 64 und hoechstens 256, PhysikFehler statt Abschneiden bei Kernen ueber 81 px.
//
// Pur und deterministisch: gleiche Beschreibung, gleiche Daten; kein Cache, kein Zustand.

import type { Kern, Kernbeschreibung } from "../naht/simulationsparameter";
import { kernSchluessel } from "./arbeitsmassstab";
import { airyFwhmArcsec } from "./beugung";
import { PhysikFehler, pruefeBereich } from "./fehler";
import { fft2d } from "./fft";
import { airyProfil, gaussProfil, moffatProfil, quadratur } from "./profile";

/** Kleinster Kernradius in Arbeitspixeln; bei Sub-Pixel-PSF wird der Kern nahezu ein Delta (Hinweis aus #3). */
export const KERN_RADIUS_MIN = 2;

/** Groesste Kerngroesse in Arbeitspixeln (docs/architektur.md Abschnitt 3: ungerade, 5 bis 81). */
export const KERN_GROESSE_MAX = 81;

/**
 * Kernradius in Gesamt-FWHM (physik.md Abschnitt 9: etwa 3 Gesamt-FWHM plus Airy-Ringe bis zum
 * zweiten Minimum). Die Ringe sind damit immer drin: 3 FWHM_gesamt >= 3 * 1,029 lambda/D = 3,09 lambda/D,
 * das zweite Airy-Minimum liegt bei 2,23 lambda/D (Abschnitt 1.1) und rueckt mit Obstruktion nach innen.
 */
export const KERN_RADIUS_PRO_FWHM = 3;

/** Ueberabtastung je Arbeitspixel beim Aufbau der Komponenten (ADR-0002: vierfach). */
export const UEBERABTASTUNG = 4;

/** FFT-Groesse je Achse: Zweierpotenz zwischen 64 und 256 (Issue #4). */
export const FFT_MIN = 64;
export const FFT_MAX = 256;

/** Rand um den feinen Kern im FFT-Raster, damit die Fluegel nicht umlaufen (wie im Prototyp: Faktor 1,5). */
const FFT_RANDFAKTOR = 1.5;

/** Wirft PhysikFehler, wenn wert nicht endlich oder nicht positiv ist. */
function pruefePositiv(feld: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) {
    throw new PhysikFehler(feld, wert, "ist nicht endlich oder nicht positiv");
  }
}

function pruefeBeschreibung(b: Kernbeschreibung): void {
  pruefePositiv("kern.oeffnungMm", b.oeffnungMm);
  pruefeBereich("kern.obstruktion", b.obstruktion, 0, 0.5);
  pruefePositiv("kern.seeingFwhmArcsec", b.seeingFwhmArcsec);
  pruefePositiv("kern.augeFwhmArcsec", b.augeFwhmArcsec);
  pruefePositiv("kern.massstabArcsecProPx", b.massstabArcsecProPx);
}

/** Kleinste Zweierpotenz >= x. */
function zweierpotenzAb(x: number): number {
  let p = 1;
  while (p < x) p <<= 1;
  return p;
}

/**
 * Ueberabtastung und FFT-Groesse fuer eine Kerngroesse. Normalfall: vierfach, P = Zweierpotenz
 * >= 1,5 * 4 * groesse, mindestens 64. Ueber 42 px passt das nicht mehr in 256; dort wird
 * zweifach ueberabgetastet. Abweichung vom Prototyp (der liess P bis 1024 wachsen): haelt die
 * FFT bei hoechstens 256 Punkten und die Laufzeit des groessten Kerns unter 20 ms; bei solchen
 * Kernen ist die Gesamt-FWHM ueber 7 Arbeitspixel breit, zwei Feinpixel je Arbeitspixel reichen.
 */
function rasterwahl(groesse: number): { ueberabtastung: number; fftGroesse: number } {
  for (const ueberabtastung of [UEBERABTASTUNG, UEBERABTASTUNG / 2]) {
    const fftGroesse = Math.max(FFT_MIN, zweierpotenzAb(FFT_RANDFAKTOR * ueberabtastung * groesse));
    if (fftGroesse <= FFT_MAX) return { ueberabtastung, fftGroesse };
  }
  throw new PhysikFehler("kern.groesse", groesse, `passt nicht in eine FFT mit ${FFT_MAX} Punkten`);
}

/**
 * Tastet ein radiales Profil auf dem P x P FFT-Raster ab (Index 0 ist die Mitte, negative
 * Abstaende laufen von oben um), normiert auf Summe 1 und transformiert. Das Profil ist radial
 * symmetrisch, darum wird nur ein Quadrant gerechnet und gespiegelt.
 */
function komponenteSpektrum(profil: (rArcsec: number) => number, p: number, feinArcsec: number): { re: Float64Array; im: Float64Array } {
  const re = new Float64Array(p * p);
  const im = new Float64Array(p * p);
  const halb = p / 2;
  for (let dy = 0; dy <= halb; dy++) {
    const ySpiegel = (p - dy) % p;
    for (let dx = 0; dx <= halb; dx++) {
      const xSpiegel = (p - dx) % p;
      const wert = profil(Math.hypot(dx, dy) * feinArcsec);
      re[dy * p + dx] = wert;
      re[dy * p + xSpiegel] = wert;
      re[ySpiegel * p + dx] = wert;
      re[ySpiegel * p + xSpiegel] = wert;
    }
  }
  let summe = 0;
  for (let i = 0; i < re.length; i++) summe += re[i]!;
  for (let i = 0; i < re.length; i++) re[i] = re[i]! / summe;
  fft2d(re, im, p);
  return { re, im };
}

/**
 * Baut den Kern der Gesamt-PSF. Wirft PhysikFehler bei ungueltiger Beschreibung (nicht endliche
 * oder nicht positive Werte, Obstruktion ausserhalb 0 bis 0,5) und wenn der Massstab so fein
 * ist, dass der Kern mehr als 81 Arbeitspixel braeuchte. Der Sub-Pixel-Fall (Gesamt-FWHM unter
 * einem Arbeitspixel, z. B. 3'' bei 70''/px) ist gueltig: Radius 2, Groesse 5, Kern nahezu ein Delta.
 *
 * Mit dem Arbeitsmassstab aus arbeitsmassstab() (>= Gesamt-FWHM / 2,5) ist der Kern hoechstens
 * 17 px gross; die Grenze 81 greift nur bei direkt gewaehlten, zu feinen Massstaeben.
 */
export function baueKern(beschreibung: Kernbeschreibung): Kern {
  pruefeBeschreibung(beschreibung);
  const { oeffnungMm, obstruktion, seeingFwhmArcsec, augeFwhmArcsec, massstabArcsecProPx } = beschreibung;

  // Radius: 3 Gesamt-FWHM (Quadratur, physik.md 2.4 und 9), mindestens 2 Arbeitspixel.
  const gesamtFwhmArcsec = quadratur(airyFwhmArcsec(oeffnungMm), seeingFwhmArcsec, augeFwhmArcsec);
  const radius = Math.max(KERN_RADIUS_MIN, Math.ceil((KERN_RADIUS_PRO_FWHM * gesamtFwhmArcsec) / massstabArcsecProPx));
  const groesse = 2 * radius + 1;
  if (groesse > KERN_GROESSE_MAX) {
    throw new PhysikFehler(
      "kern.massstabArcsecProPx",
      massstabArcsecProPx,
      `ist zu fein fuer die Gesamt-FWHM ${gesamtFwhmArcsec.toFixed(3)}'': Kern braeuchte ${groesse} px, erlaubt sind ${KERN_GROESSE_MAX}`
    );
  }

  const { ueberabtastung: o, fftGroesse: p } = rasterwahl(groesse);
  const feinArcsec = massstabArcsecProPx / o;

  // Komponenten im Frequenzraum multiplizieren (Faltung im Ortsraum), dann zuruecktransformieren.
  const profile: ((rArcsec: number) => number)[] = [
    (r) => airyProfil(r, oeffnungMm, obstruktion),
    (r) => moffatProfil(r, seeingFwhmArcsec),
    (r) => gaussProfil(r, augeFwhmArcsec)
  ];
  const produktRe = new Float64Array(p * p).fill(1);
  const produktIm = new Float64Array(p * p);
  for (const profil of profile) {
    const { re, im } = komponenteSpektrum(profil, p, feinArcsec);
    for (let i = 0; i < p * p; i++) {
      const a = produktRe[i]!;
      const b = produktIm[i]!;
      produktRe[i] = a * re[i]! - b * im[i]!;
      produktIm[i] = a * im[i]! + b * re[i]!;
    }
  }
  fft2d(produktRe, produktIm, p, true);

  // Binning auf Arbeitspixel. Ein Arbeitspixel k deckt im Feinraster das Intervall
  // [k o - o/2, k o + o/2] ab; die Feinpixel an den beiden Raendern gehoeren je zur Haelfte dazu
  // (Gewichte 1/2, 1, ..., 1, 1/2; Summe o). Abweichung vom Prototyp, der die Feinpixel
  // k o - o/2 .. k o + o/2 - 1 voll zaehlt: das ist um ein halbes Feinpixel verschoben und
  // bricht die Punktsymmetrie. Hier wird nur die erste Haelfte gerechnet und gespiegelt, damit
  // die Symmetrie exakt gilt. Winzige negative Werte aus der FFT-Rundung werden auf 0 gesetzt.
  const halbO = o >> 1;
  const gewicht = (j: number): number => (Math.abs(j) === halbO ? 0.5 : 1);
  const anzahl = groesse * groesse;
  const daten = new Float32Array(anzahl);
  const roh = new Float64Array(anzahl);
  let summe = 0;
  for (let i = 0; i <= (anzahl - 1) / 2; i++) {
    const ky = Math.floor(i / groesse) - radius;
    const kx = (i % groesse) - radius;
    let s = 0;
    for (let jy = -halbO; jy <= halbO; jy++) {
      const fy = (((ky * o + jy) % p) + p) % p;
      const wy = gewicht(jy);
      for (let jx = -halbO; jx <= halbO; jx++) {
        const fx = (((kx * o + jx) % p) + p) % p;
        s += wy * gewicht(jx) * Math.max(0, produktRe[fy * p + fx]!);
      }
    }
    roh[i] = s;
    roh[anzahl - 1 - i] = s;
    summe += i === anzahl - 1 - i ? s : 2 * s;
  }
  for (let i = 0; i < anzahl; i++) daten[i] = roh[i]! / summe;

  return {
    schluessel: kernSchluessel(beschreibung),
    beschreibung: { ...beschreibung },
    groesse,
    radius,
    massstabArcsecProPx,
    daten
  };
}

/**
 * Test-Helfer: Kontrastuebertragung (MTF) des gebauten Kerns bei der Periode periodeArcsec,
 * Betrag der Fouriertransformierten entlang x (der Kern ist punktsymmetrisch, die MTF daher
 * reell): |Summe k(x, y) cos(2 pi x massstab / periode)|, auf 0 bis 1 begrenzt (physik.md 1.3:
 * MTF als normierte Transferfunktion). Periode unendlich liefert 1. Sinnvoll fuer Perioden ab
 * zwei Arbeitspixeln; darunter liegt die Frequenz ueber der Nyquist-Grenze des Rasters.
 */
export function kontrastUebertragung(kern: Kern, periodeArcsec: number): number {
  if (Number.isNaN(periodeArcsec) || periodeArcsec <= 0) {
    throw new PhysikFehler("kontrastUebertragung.periodeArcsec", periodeArcsec, "ist nicht positiv");
  }
  const { groesse, radius, massstabArcsecProPx, daten } = kern;
  const frequenz = 1 / periodeArcsec;
  let summe = 0;
  for (let x = 0; x < groesse; x++) {
    let spalte = 0;
    for (let y = 0; y < groesse; y++) spalte += daten[y * groesse + x]!;
    summe += spalte * Math.cos(2 * Math.PI * frequenz * (x - radius) * massstabArcsecProPx);
  }
  return Math.min(1, Math.abs(summe));
}

/**
 * Test-Helfer: Halbwertsbreite des gebauten Kerns in Bogensekunden. Radiales Profil aus allen
 * Pixeln (Mittel je Abstand vom Zentrum), erster Abstand, an dem es unter die halbe Mitte faellt,
 * linear interpoliert; FWHM = 2 r_halb * massstab. Bei Sub-Pixel-Kernen (Mitte nahe 1, Nachbarn
 * nahe 0) ergibt das etwa einen Arbeitspixel, die Aufloesung des Rasters.
 */
export function kernFwhmArcsec(kern: Kern): number {
  const { groesse, radius, massstabArcsecProPx, daten } = kern;
  // Mittel je Abstandsquadrat (ganzzahlig, weil Pixelkoordinaten ganz sind)
  const summen = new Map<number, { summe: number; anzahl: number }>();
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      const r2 = (x - radius) ** 2 + (y - radius) ** 2;
      const eintrag = summen.get(r2) ?? { summe: 0, anzahl: 0 };
      eintrag.summe += daten[y * groesse + x]!;
      eintrag.anzahl += 1;
      summen.set(r2, eintrag);
    }
  }
  const profil = [...summen.entries()]
    .map(([r2, { summe, anzahl }]) => ({ r: Math.sqrt(r2), wert: summe / anzahl }))
    .sort((a, b) => a.r - b.r);
  const halb = profil[0]!.wert / 2;
  for (let i = 1; i < profil.length; i++) {
    const vorher = profil[i - 1]!;
    const jetzt = profil[i]!;
    if (jetzt.wert < halb) {
      const anteil = (vorher.wert - halb) / (vorher.wert - jetzt.wert);
      return 2 * (vorher.r + anteil * (jetzt.r - vorher.r)) * massstabArcsecProPx;
    }
  }
  return groesse * massstabArcsecProPx;
}
