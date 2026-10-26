// Kernbau (Naht-Stufe 2): aus einer Kernbeschreibung entsteht deterministisch der diskrete Kern
// der Gesamt-PSF im Arbeitsmassstab (ADR-0002 mit Nachtrag, docs/architektur.md Abschnitt 3,
// Issue #4). Gesamt-PSF = Airy(D, Obstruktion) gefaltet mit Moffat(Seeing-FWHM, beta 4,765)
// gefaltet mit Gauss(Augen-FWHM); Formeln in docs/recherche/physik.md, Abschnitte 1.1, 2.2, 3.2 und 9.
//
// Rechenweg wie im Prototyp (prototyp/faltung.html, Block logik, Branch prototyp-faltung):
// jede Komponente auf einem feinen Raster (Arbeitspixel / Ueberabtastung) abtasten, auf Summe 1
// normieren, per FFT multiplizieren, zuruecktransformieren und auf Arbeitspixel binnen.
// Abweichungen vom Prototyp, jeweils am Ort begruendet: Drehfaktortabelle in der FFT,
// punktsymmetrisches Binning, Ueberabtastung 2 statt 4 bei Kernen ueber 42 px, FFT-Groesse
// mindestens 64 und hoechstens 256, PhysikFehler statt Klemmung bei Kernen ueber 81 px.
//
// Pur und deterministisch: gleiche Beschreibung, gleiche Daten; kein Cache, kein Zustand.

import type { Kern, Kernbeschreibung } from "../naht/simulationsparameter";
import { kernSchluessel } from "./arbeitsmassstab";
import { airyFwhmArcsec } from "./beugung";
import { PhysikFehler, pruefeBereich, pruefePositiv } from "./fehler";
import { fft2d } from "./fft";
import { KERN_GROESSE_MAX, KERN_RADIUS_MIN, KERN_RADIUS_PRO_FWHM } from "./konstanten";
import { airyProfil, gaussProfil, moffatProfil, quadratur } from "./profile";

// Implementierungsparameter des Kernbaus, keine Modellkonstanten (die stehen in konstanten.ts).

/** Ueberabtastung je Arbeitspixel beim Aufbau der Komponenten (ADR-0002: vierfach). */
const UEBERABTASTUNG = 4;

/** FFT-Groesse je Achse: Zweierpotenz zwischen 64 und 256 (Issue #4). */
const FFT_MIN = 64;
const FFT_MAX = 256;

/** Rand um den feinen Kern im FFT-Raster, damit die Fluegel nicht umlaufen (wie im Prototyp: Faktor 1,5). */
const FFT_RANDFAKTOR = 1.5;

function pruefeBeschreibung(b: Kernbeschreibung): void {
  pruefePositiv("kern.oeffnungMm", b.oeffnungMm);
  pruefeBereich("kern.obstruktion", b.obstruktion, 0, 0.5);
  pruefePositiv("kern.seeingFwhmArcsec", b.seeingFwhmArcsec);
  pruefePositiv("kern.augeFwhmArcsec", b.augeFwhmArcsec);
  pruefePositiv("kern.massstabArcsecProPx", b.massstabArcsecProPx);
}

/** Kleinste Zweierpotenz >= x. */
function zweierpotenzAb(x: number): number {
  let potenz = 1;
  while (potenz < x) potenz <<= 1;
  return potenz;
}

/**
 * Ueberabtastung und FFT-Groesse fuer eine Kerngroesse. Normalfall: vierfach, FFT-Groesse die
 * Zweierpotenz >= 1,5 * 4 * groesse, mindestens 64. Ueber 42 px passt das nicht mehr in 256;
 * dort wird zweifach ueberabgetastet. Abweichung vom Prototyp (der liess die FFT bis 1024
 * wachsen): haelt die FFT bei hoechstens 256 Punkten und die Laufzeit des groessten Kerns unter
 * 20 ms; bei solchen Kernen ist die Gesamt-FWHM ueber 7 Arbeitspixel breit, zwei Feinpixel je
 * Arbeitspixel reichen.
 */
function rasterwahl(groesse: number): { ueberabtastung: number; fftGroesse: number } {
  for (const ueberabtastung of [UEBERABTASTUNG, UEBERABTASTUNG / 2]) {
    const fftGroesse = Math.max(FFT_MIN, zweierpotenzAb(FFT_RANDFAKTOR * ueberabtastung * groesse));
    if (fftGroesse <= FFT_MAX) return { ueberabtastung, fftGroesse };
  }
  throw new PhysikFehler("kern.groesse", groesse, `passt nicht in eine FFT mit ${FFT_MAX} Punkten`);
}

/**
 * Tastet ein radiales Profil auf dem FFT-Raster ab (Index 0 ist die Mitte, negative Abstaende
 * laufen von oben um), normiert auf Summe 1 und transformiert. Das Profil ist radial
 * symmetrisch, darum wird nur ein Quadrant gerechnet und gespiegelt.
 */
function komponenteSpektrum(profil: (rArcsec: number) => number, fftGroesse: number, feinArcsec: number): { re: Float64Array; im: Float64Array } {
  const re = new Float64Array(fftGroesse * fftGroesse);
  const im = new Float64Array(fftGroesse * fftGroesse);
  const halb = fftGroesse / 2;
  for (let dy = 0; dy <= halb; dy++) {
    const ySpiegel = (fftGroesse - dy) % fftGroesse;
    for (let dx = 0; dx <= halb; dx++) {
      const xSpiegel = (fftGroesse - dx) % fftGroesse;
      const wert = profil(Math.hypot(dx, dy) * feinArcsec);
      re[dy * fftGroesse + dx] = wert;
      re[dy * fftGroesse + xSpiegel] = wert;
      re[ySpiegel * fftGroesse + dx] = wert;
      re[ySpiegel * fftGroesse + xSpiegel] = wert;
    }
  }
  let summe = 0;
  for (let i = 0; i < re.length; i++) summe += re[i]!;
  for (let i = 0; i < re.length; i++) re[i] = re[i]! / summe;
  fft2d(re, im, fftGroesse);
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

  const { ueberabtastung, fftGroesse } = rasterwahl(groesse);
  const feinArcsec = massstabArcsecProPx / ueberabtastung;

  // Komponenten im Frequenzraum multiplizieren (Faltung im Ortsraum), dann zuruecktransformieren.
  const profile: ((rArcsec: number) => number)[] = [
    (r) => airyProfil(r, oeffnungMm, obstruktion),
    (r) => moffatProfil(r, seeingFwhmArcsec),
    (r) => gaussProfil(r, augeFwhmArcsec)
  ];
  const produktRe = new Float64Array(fftGroesse * fftGroesse).fill(1);
  const produktIm = new Float64Array(fftGroesse * fftGroesse);
  for (const profil of profile) {
    const { re, im } = komponenteSpektrum(profil, fftGroesse, feinArcsec);
    for (let i = 0; i < produktRe.length; i++) {
      const bisherRe = produktRe[i]!;
      const bisherIm = produktIm[i]!;
      produktRe[i] = bisherRe * re[i]! - bisherIm * im[i]!;
      produktIm[i] = bisherRe * im[i]! + bisherIm * re[i]!;
    }
  }
  fft2d(produktRe, produktIm, fftGroesse, true);

  // Binning auf Arbeitspixel. Ein Arbeitspixel k deckt im Feinraster das Intervall
  // [k u - u/2, k u + u/2] ab (u = Ueberabtastung); die Feinpixel an den beiden Raendern gehoeren
  // je zur Haelfte dazu (Gewichte 1/2, 1, ..., 1, 1/2; Summe u). Abweichung vom Prototyp, der die
  // Feinpixel k u - u/2 .. k u + u/2 - 1 voll zaehlt: das ist um ein halbes Feinpixel verschoben
  // und bricht die Punktsymmetrie. Hier wird nur die erste Haelfte gerechnet und gespiegelt, damit
  // die Symmetrie exakt gilt. Winzige negative Werte aus der FFT-Rundung werden auf 0 gesetzt.
  const halbeUeberabtastung = ueberabtastung >> 1;
  const gewicht = (abstand: number): number => (Math.abs(abstand) === halbeUeberabtastung ? 0.5 : 1);
  const anzahl = groesse * groesse;
  const gebinnt = new Float64Array(anzahl);
  let summe = 0;
  for (let i = 0; i <= (anzahl - 1) / 2; i++) {
    const ky = Math.floor(i / groesse) - radius;
    const kx = (i % groesse) - radius;
    let wert = 0;
    for (let jy = -halbeUeberabtastung; jy <= halbeUeberabtastung; jy++) {
      const fy = (((ky * ueberabtastung + jy) % fftGroesse) + fftGroesse) % fftGroesse;
      const gewichtY = gewicht(jy);
      for (let jx = -halbeUeberabtastung; jx <= halbeUeberabtastung; jx++) {
        const fx = (((kx * ueberabtastung + jx) % fftGroesse) + fftGroesse) % fftGroesse;
        wert += gewichtY * gewicht(jx) * Math.max(0, produktRe[fy * fftGroesse + fx]!);
      }
    }
    gebinnt[i] = wert;
    gebinnt[anzahl - 1 - i] = wert;
    summe += i === anzahl - 1 - i ? wert : 2 * wert;
  }
  const daten = new Float32Array(anzahl);
  for (let i = 0; i < anzahl; i++) daten[i] = gebinnt[i]! / summe;

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
      const abstandsquadrat = (x - radius) ** 2 + (y - radius) ** 2;
      const eintrag = summen.get(abstandsquadrat) ?? { summe: 0, anzahl: 0 };
      eintrag.summe += daten[y * groesse + x]!;
      eintrag.anzahl += 1;
      summen.set(abstandsquadrat, eintrag);
    }
  }
  const profil = [...summen.entries()]
    .map(([abstandsquadrat, { summe, anzahl }]) => ({ r: Math.sqrt(abstandsquadrat), wert: summe / anzahl }))
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
