// Wahrnehmungsschwelle (A-P11, A-B2 V2, A-P9 V2): Kontrastschwelle nach Crumey 2014, Schwelle am
// Okular, Grenzgroesse fuer Sterne, sichtbare Isophote von Deep-Sky-Objekten und Deckkraft nach
// Blackwells Wahrscheinlichkeitskurve. Quelle: docs/recherche/wahrnehmung.md, Abschnitte 1, 2 und
// 4.4; Testwerte Abschnitt 6; Formelnummern in docs/recherche/physik.md, Abschnitt
// "Wahrnehmungsschwelle (Issue #96)".
// Flaechenhelligkeiten in mag/arcsec^2, Leuchtdichten in cd/m^2, Beleuchtungsstaerken in lx.

import type { Isophote } from "../naht/konfiguration";
import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler, pruefeBereich, pruefePositiv } from "./fehler";
import { ARCSEC_PRO_RAD, BELEUCHTUNG_NULL_MAG_LX, BLACKWELL_BREITE, FELDFAKTOR, FELDFAKTOR_FERNROHR, NULLHINTERGRUND_CD_M2, PUPILLE_MM } from "./konstanten";
import { flaechenhelligkeitsfaktor, type Optik } from "./optik";

// Koeffizienten des skotopischen Zweigs (Crumey Gl. 47 bis 49, wahrnehmung.md 1.2). Nur hier
// verwendet, darum nicht in konstanten.ts.
const R1 = 6.505e-4;
const R2 = -8.461e-4;
const K1 = 7.633e-3;
const K2 = -7.174e-3;
const Q = 0.6;

/** Obere Gueltigkeitsgrenze von Gl. 47 in cd/m^2 (16,2 mag/arcsec^2); darueber gilt der Randwert (wahrnehmung.md 7 Punkt 1). */
const B_MAX_CD_M2 = 3.426e-2;

/** Leuchtdichte von 0 mag/arcsec^2 ist 10^(12,58 / 2,5) cd/m^2 (wahrnehmung.md, Konventionen, [1, Abschn. 1.3]). */
const MU_NULLPUNKT = 12.58;

/** Durchmesser der Seeing-Scheibe in Seeing-FWHM, 99 bis 100 % des Lichts (wahrnehmung.md 2.2, [1, Abschn. 3.3]). */
const SEEING_SCHEIBE_PRO_FWHM = 2.8;

/**
 * Fester Beobachter der Schwelle (A-P9 V2): Feldfaktor F und Augenpupille p in mm. Die Vorgabe ist
 * der Normalbeobachter von astobsim; andere Werte nur fuer die Literaturkontrollen (Crumey F = 1
 * und 2, Herschel F = 2,36 mit p = 5,08 mm).
 */
export interface Beobachter {
  feldfaktor: number;
  pupilleMm: number;
}

export const NORMALBEOBACHTER: Beobachter = { feldfaktor: FELDFAKTOR, pupilleMm: PUPILLE_MM };

/** Leuchtdichte B in cd/m^2 zur Flaechenhelligkeit mu: mu = 12,58 - 2,5 log10 B (wahrnehmung.md, Konventionen). */
export function leuchtdichteCdM2(magProArcsec2: number): number {
  if (Number.isNaN(magProArcsec2)) throw new PhysikFehler("magProArcsec2", magProArcsec2, "ist keine Zahl");
  return Math.pow(10, (MU_NULLPUNKT - magProArcsec2) / 2.5);
}

/**
 * Ricco-Konstante R und Kontrast grosser Ziele C_inf zur Leuchtdichte (Gl. 47 bis 49):
 * R = (r1 B^-1/4 + r2)^2, C_inf = k1 B^-1/4 + k2. B unter 1e-5 cd/m^2 wirkt wie der
 * Nullhintergrund (Gl. 50), ueber 3,426e-2 gilt der Randwert.
 */
function crumey(bCdM2: number): { ricco: number; kontrastGross: number } {
  const b = Math.min(B_MAX_CD_M2, Math.max(NULLHINTERGRUND_CD_M2, bCdM2));
  const w = Math.pow(b, -0.25);
  return { ricco: (R1 * w + R2) ** 2, kontrastGross: K1 * w + K2 };
}

/** Potenznorm der beiden Asymptoten: [(R / A)^q + C_inf^q]^(1/q) (Gl. 47). */
function potenznorm(ricco: number, flaecheSr: number, kontrastGross: number): number {
  return Math.pow(Math.pow(ricco / flaecheSr, Q) + Math.pow(kontrastGross, Q), 1 / Q);
}

/**
 * Kontrastschwelle C(A, B) ohne Feldfaktor (F = 1) fuer eine gleichmaessige Flaeche A in
 * Steradiant auf dem Hintergrund B (Gl. 47, wahrnehmung.md 1.2): kleine Ziele Ricco (C A = R),
 * grosse C_inf. Bezug ist max(B, 1e-5): unter dem Nullhintergrund gilt C relativ zu 1e-5 cd/m^2,
 * Delta B = C max(B, 1e-5) bleibt fest (Gl. 50, wahrnehmung.md 1.1). Wirft PhysikFehler bei A <= 0
 * oder B < 0 oder NaN.
 */
export function kontrastschwelle(flaecheSr: number, bCdM2: number): number {
  pruefePositiv("flaecheSr", flaecheSr);
  pruefeBereich("bCdM2", bCdM2, 0, Infinity);
  const { ricco, kontrastGross } = crumey(bCdM2);
  return potenznorm(ricco, flaecheSr, kontrastGross);
}

/** Flaeche in Quadratbogensekunden als Raumwinkel in Steradiant. */
function steradiant(flaecheArcsec2: number): number {
  return flaecheArcsec2 / ARCSEC_PRO_RAD ** 2;
}

/**
 * Himmel im Okular und gesamter Feldfaktor (Gl. 78 bis 80): B_a = min(1, (AP/p)^2) B / F_t mit
 * 1/F_t = tau (1 - eps^2), dieselbe Transmission wie der Hintergrund in okularhelligkeit()
 * (physik.md 6.2; zweite Stelle des Abschattungsfaktors neben okularhelligkeit()); phi = F F_T F_M mit F_T = sqrt 2 einaeugig, 1 beidaeugig, F_M = 1.
 */
function okular(optik: Optik, muHimmel: number, beobachter: Beobachter): { bOkular: number; transmission: number; phi: number } {
  const transmission = optik.transmission * (1 - optik.obstruktion ** 2);
  const bOkular = leuchtdichteCdM2(muHimmel) * transmission * flaechenhelligkeitsfaktor(optik.austrittspupilleMm, beobachter.pupilleMm);
  const phi = beobachter.feldfaktor * (optik.beidaeugig ? 1 : FELDFAKTOR_FERNROHR);
  return { bOkular, transmission, phi };
}

/**
 * Schwelle einer Flaeche am Okular: kontrast ist C_th = B_Objekt / B_Himmel am Boden, ab dem das
 * Objekt sichtbar ist (Kontrast ist von V unabhaengig, beide werden gleich abgeschwaecht);
 * grenzMagProArcsec2 die Flaechenhelligkeit ausserhalb der Atmosphaere an dieser Schwelle,
 * mu_lim = mu_Himmel - 2,5 log10 C_th - Extinktion (die Extinktion wirkt nur auf das Objekt).
 */
export interface Schwelle {
  kontrast: number;
  grenzMagProArcsec2: number;
}

/**
 * Crumey Gl. 77 bis 80 (wahrnehmung.md 1.4): C_th = phi [(R_a / A_a)^q + C_a^q]^(1/q) mit
 * A_a = V^2 A (Flaeche im Auge), R_a, C_a bei B_a, phi = F F_T. Blosses Auge (V = 1, AP = p,
 * tau = 1) ergibt Gl. 47 mit dem Feldfaktor. flaecheArcsec2 ist die Flaeche am Himmel. Unter dem
 * Nullhintergrund (B_a < 1e-5) gilt C_th relativ zu 1e-5 und wird mit 1e-5 / B_a auf den echten
 * Himmel umgerechnet: Delta B bleibt fest, mehr Vergroesserung bringt dann nur noch Groesse, und
 * fuer eine Scheibe gilt m_lim = mu_lim(alpha) - 2,5 log10 alpha wie in grenzgroesse().
 */
export function schwelleAmOkular(
  optik: Optik,
  atmosphaere: Atmosphaere,
  muHimmel: number,
  flaecheArcsec2: number,
  beobachter: Beobachter = NORMALBEOBACHTER
): Schwelle {
  pruefePositiv("flaecheArcsec2", flaecheArcsec2);
  const { bOkular, phi } = okular(optik, muHimmel, beobachter);
  const { ricco, kontrastGross } = crumey(bOkular);
  // Unter dem Nullhintergrund bleibt Delta B fest (Gl. 50, 71): der Kontrast gegen den dunkleren
  // echten Himmel B_a waechst mit 1e-5 / B_a, wie die feste Schwelle in grenzgroesse().
  const nullbezug = Math.max(NULLHINTERGRUND_CD_M2, bOkular) / bOkular;
  const kontrast = phi * potenznorm(ricco, optik.vergroesserung ** 2 * steradiant(flaecheArcsec2), kontrastGross) * nullbezug;
  return { kontrast, grenzMagProArcsec2: muHimmel - 2.5 * Math.log10(kontrast) - atmosphaere.extinktionMag };
}

/**
 * Grenzgroesse fuer Sterne ausserhalb der Atmosphaere (wahrnehmung.md 2.2, Gl. 68 und 88):
 * Punktgrenze m_0 = -2,5 log10(dI / Z) mit dI = (delta_max / D)^2 F_t phi (r1 B_a^1/4 + r2 B_a^1/2)^2,
 * delta_max = max(AP, p); dazu die Seeing-Scheibe (Durchmesser 2,8 FWHM, Flaeche alpha) gegen die
 * teleskopische Ricco-Flaeche alpha_TR = R_a / (V^2 C_a):
 * m_lim = m_0 - (2,5 / q) log10[(alpha / alpha_TR)^q + 1] - Extinktion.
 * Unter dem Nullhintergrund bleibt dI fest (Gl. 71). Seeing 0 ergibt die Punktgrenze.
 */
export function grenzgroesse(
  optik: Optik,
  atmosphaere: Atmosphaere,
  muHimmel: number,
  seeingFwhmArcsec: number,
  beobachter: Beobachter = NORMALBEOBACHTER
): number {
  pruefeBereich("seeingFwhmArcsec", seeingFwhmArcsec, 0, Infinity);
  const { bOkular, transmission, phi } = okular(optik, muHimmel, beobachter);
  const { ricco, kontrastGross } = crumey(bOkular);
  const bWirksam = Math.min(B_MAX_CD_M2, Math.max(NULLHINTERGRUND_CD_M2, bOkular));
  // dI am Auge = phi B_a R_a (Gl. 32, 53), auf die Oeffnung umgerechnet (Gl. 68).
  const deltaMax = Math.max(optik.austrittspupilleMm, beobachter.pupilleMm);
  const beleuchtungLx = ((deltaMax / optik.oeffnungMm) ** 2 / transmission) * phi * bWirksam * ricco;
  const punktgrenze = -2.5 * Math.log10(beleuchtungLx / BELEUCHTUNG_NULL_MAG_LX);
  const scheibeSr = steradiant(Math.PI * ((SEEING_SCHEIBE_PRO_FWHM * seeingFwhmArcsec) / 2) ** 2);
  const riccoFlaecheSr = ricco / (optik.vergroesserung ** 2 * kontrastGross);
  const scheibe = (2.5 / Q) * Math.log10(Math.pow(scheibeSr / riccoFlaecheSr, Q) + 1);
  return punktgrenze - scheibe - atmosphaere.extinktionMag;
}

/**
 * Sichtbare Isophote eines Deep-Sky-Objekts: Flaechenhelligkeit (ausserhalb der Atmosphaere) und
 * eingeschlossene Flaeche, alleSichtbar wenn auch die schwaechste Zeile der Tabelle sichtbar ist,
 * verhaeltnis = C / C_th an dieser Stelle (1 am Vorzeichenwechsel, unter 1 wenn keine sichtbar,
 * ueber 1 moeglich bei alleSichtbar). schwelleMagProArcsec2 ist mu_lim(alpha) an dieser Stelle,
 * also die Flaechenhelligkeit, die dort genau Deckkraft 0,5 haette: in allen drei Faellen gilt
 * verhaeltnis = 10^(-0,4 (magProArcsec2 - schwelleMagProArcsec2)), am Vorzeichenwechsel sind beide
 * gleich. Daraus q* = 10^(-0,4 (schwelleMagProArcsec2 - Quellweiss)) fuer Helligkeit.deepSky.
 */
export interface SichtbareIsophote {
  magProArcsec2: number;
  flaecheArcsec2: number;
  alleSichtbar: boolean;
  verhaeltnis: number;
  schwelleMagProArcsec2: number;
}

/**
 * Reserve d als stetige Funktion des Zeilenindex x in [0, n - 1]: kubische Hermite-Interpolation
 * mit Catmull-Rom-Steigungen (d_(k+1) - d_(k-1)) / 2, am Rand einseitig. Je Intervall
 * [k, k + 1] ist d(k + t) = a t^3 + b t^2 + c t + e. Die Knotenwerte haengen stetig von V und
 * mu_Himmel ab, die Koeffizienten also auch (physik.md, Abschnitt "Wahrnehmungsschwelle (Issue #96)").
 */
function reserveKurve(reserve: readonly number[]): { wert: (x: number) => number; kritisch: (k: number) => number[] } {
  const n = reserve.length;
  const d = (k: number): number => reserve[Math.min(n - 1, Math.max(0, k))]!;
  const steigung = (k: number): number => (k === 0 ? d(1) - d(0) : k === n - 1 ? d(n - 1) - d(n - 2) : (d(k + 1) - d(k - 1)) / 2);
  const koeffizienten = (k: number): [number, number, number, number] => {
    const m0 = steigung(k);
    const m1 = steigung(k + 1);
    return [2 * (d(k) - d(k + 1)) + m0 + m1, 3 * (d(k + 1) - d(k)) - 2 * m0 - m1, m0, d(k)];
  };
  const wert = (x: number): number => {
    if (n === 1) return d(0);
    const k = Math.min(n - 2, Math.floor(x));
    const t = x - k;
    const [a, b, c, e] = koeffizienten(k);
    return ((a * t + b) * t + c) * t + e;
  };
  // Nullstellen von d' = 3 a t^2 + 2 b t + c im Inneren von (0, 1), aufsteigend, als x.
  const kritisch = (k: number): number[] => {
    const [a, b, c] = koeffizienten(k);
    const loesungen: number[] = [];
    if (Math.abs(a) < 1e-15) {
      if (Math.abs(b) > 1e-15) loesungen.push(-c / (2 * b));
    } else {
      const diskriminante = b * b - 3 * a * c;
      if (diskriminante >= 0) {
        const w = Math.sqrt(diskriminante);
        loesungen.push((-b - w) / (3 * a), (-b + w) / (3 * a));
      }
    }
    return loesungen.filter((t) => t > 0 && t < 1).sort((u, v) => u - v).map((t) => k + t);
  };
  return { wert, kritisch };
}

/**
 * Crumeys Verfahren fuer M31 und M33 (wahrnehmung.md 4.4 Punkt 2, [1, Abschn. 3.1]): die Isophote
 * mu_i mit eingeschlossener Flaeche alpha_i ist sichtbar, wenn mu_i <= mu_lim(alpha_i). Mit der
 * Reserve d_i = mu_lim(alpha_i) - mu_i gilt C / C_th = 10^(0,4 d_i). Zwischen den Zeilen ist d
 * kubisch ueber dem Zeilenindex x interpoliert (reserveKurve), mu und log10 alpha linear in x.
 * Gesucht ist die schwaechste sichtbare Stelle, das groesste x mit d(x) >= 0 (letzter
 * Vorzeichenwechsel). Ist nirgends d >= 0, gilt der Scheitel der Kurve, die guenstigste Stelle,
 * auch zwischen zwei Zeilen; so springt die Lage nicht, wenn zwei Zeilen gleich guenstig werden,
 * und der Uebergang zum Vorzeichenwechsel (Scheitel bei d = 0) ist stetig. Am Tabellenrand ist die
 * Randzeile selbst die Stelle. Alles ist stetig in V und mu_Himmel, solange die Reserve nur einen
 * Scheitel hat. isophoten: mu aufsteigend, Flaeche steigend (ADR-0003 Nachtrag V2). Wirft
 * PhysikFehler bei leerer Tabelle oder Flaeche <= 0.
 */
export function sichtbareIsophote(
  isophoten: readonly Isophote[],
  optik: Optik,
  atmosphaere: Atmosphaere,
  muHimmel: number,
  beobachter: Beobachter = NORMALBEOBACHTER
): SichtbareIsophote {
  if (isophoten.length === 0) throw new PhysikFehler("isophoten.length", 0, "ist leer");
  const reserve = isophoten.map(
    (i) => schwelleAmOkular(optik, atmosphaere, muHimmel, i.flaecheArcsec2, beobachter).grenzMagProArcsec2 - i.magProArcsec2
  );
  const letzte = isophoten.length - 1;
  const kurve = reserveKurve(reserve);
  // Stelle x mit Reserve dX: mu und log10 alpha linear zwischen den Nachbarzeilen.
  const stelle = (x: number, dX: number, alleSichtbar: boolean): SichtbareIsophote => {
    const k = Math.min(Math.max(letzte - 1, 0), Math.floor(x));
    const t = x - k;
    const a = isophoten[k]!;
    const b = isophoten[Math.min(letzte, k + 1)]!;
    const mu = a.magProArcsec2 + t * (b.magProArcsec2 - a.magProArcsec2);
    return {
      magProArcsec2: mu,
      flaecheArcsec2: Math.pow(10, Math.log10(a.flaecheArcsec2) + t * (Math.log10(b.flaecheArcsec2) - Math.log10(a.flaecheArcsec2))),
      alleSichtbar,
      verhaeltnis: dX === 0 ? 1 : Math.pow(10, 0.4 * dX),
      schwelleMagProArcsec2: mu + dX
    };
  };
  if (reserve[letzte]! >= 0) return stelle(letzte, reserve[letzte]!, true);
  // Stuetzstellen: Zeilen und Extrema der Kurve; dazwischen ist d monoton.
  const stuetzen: number[] = [];
  for (let k = 0; k < letzte; k++) stuetzen.push(k, ...kurve.kritisch(k));
  stuetzen.push(letzte);
  // Von hinten: die letzte Stuetzstelle mit d >= 0; dahinter faellt d monoton unter 0.
  for (let j = stuetzen.length - 2; j >= 0; j--) {
    if (kurve.wert(stuetzen[j]!) < 0) continue;
    let unten = stuetzen[j]!;
    let oben = stuetzen[j + 1]!;
    for (let schritt = 0; schritt < 60; schritt++) {
      const mitte = (unten + oben) / 2;
      if (kurve.wert(mitte) >= 0) unten = mitte;
      else oben = mitte;
    }
    return stelle(unten, 0, false);
  }
  // Keine Stelle sichtbar: der Scheitel, die Stuetzstelle mit der groessten Reserve.
  let beste = stuetzen[0]!;
  for (const x of stuetzen) if (kurve.wert(x) > kurve.wert(beste)) beste = x;
  return stelle(beste, kurve.wert(beste), false);
}

/**
 * Standardnormalverteilung Phi(x) = (1 + erf(x / sqrt 2)) / 2 mit erf nach Abramowitz und Stegun
 * 7.1.26 (Fehler unter 1,5e-7; physik.md, Abschnitt "Wahrnehmungsschwelle (Issue #96)").
 */
function normalverteilung(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const polynom = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - polynom * Math.exp(-z * z);
  return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * Deckkraft nach Blackwells Wahrscheinlichkeitskurve (wahrnehmung.md 1.3 und 4.4 Punkt 3):
 * P = Phi((v - 1) / 0,484) mit v = C / C_th; 0,5 an der Schwelle, 0,90 bei v = 1,62.
 */
export function deckkraft(verhaeltnis: number): number {
  if (Number.isNaN(verhaeltnis)) throw new PhysikFehler("verhaeltnis", verhaeltnis, "ist keine Zahl");
  return normalverteilung((verhaeltnis - 1) / BLACKWELL_BREITE);
}

/** Deckkraft eines Sterns der Magnitude m bei der Grenzgroesse mLim: v = 10^(-0,4 (m - mLim)) (wahrnehmung.md 4.4 Punkt 3). */
export function deckkraftStern(magnitude: number, grenzgroesseMag: number): number {
  return deckkraft(Math.pow(10, -0.4 * (magnitude - grenzgroesseMag)));
}
