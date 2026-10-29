// Sternfarbe aus B-V (A-P12, ADR-0004): B-V zu Farbtemperatur nach Ballesteros 2012, Farbtemperatur
// zu linearem sRGB (D65) mit Y = 1 ueber eine Tabelle, Beleuchtungsstaerke am Auge und die Schwelle
// des Farbsehens. Quelle: docs/recherche/wahrnehmung.md Abschnitt 5, docs/recherche/physik.md
// Abschnitt 13.1 und 18. Deep-Sky-Flaechen bleiben grau, nur Sterne bekommen eine Farbe.

import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import type { Optik } from "./optik";
import { PUPILLE_MM } from "./konstanten";

/** Beleuchtungsstaerke eines Sterns der Magnitude 0 ausserhalb der Atmosphaere in lx (wahrnehmung.md, Konventionen; Crumey 2014). */
export const BELEUCHTUNG_NULL_MAG_LX = 2.54e-6;

/** Grenze des Farbsehens mit blossem Auge: Sterne ab etwa 2,3 mag sind farbig (wahrnehmung.md 5.1, [13]). */
export const FARBGRENZE_AUGE_MAG = 2.3;

/**
 * Schwelle des Farbsehens als Beleuchtungsstaerke am Auge: Z 10^(-0,4 2,3) = 3,05e-7 lx, in der
 * Recherche gerundet 3,1e-7 (wahrnehmung.md 5.1). Aus der Magnitude gerechnet, damit die Grenze
 * mit blossem Auge genau 2,3 mag ist.
 */
export const FARBSCHWELLE_LX = BELEUCHTUNG_NULL_MAG_LX * Math.pow(10, -0.4 * FARBGRENZE_AUGE_MAG);

/** Erste Stuetzstelle und Schrittweite der Farbtabelle in B-V. */
const BV_ERSTE = -0.4;
const BV_SCHRITT = 0.1;

/**
 * Lineares sRGB (D65) mit Y = 1 je B-V von -0,4 bis 2,0 in 0,1-Schritten (wahrnehmung.md 5.3, Tabelle
 * und Rezept). Erzeugt mit tools/sternfarbe_tabelle.py: T nach Ballesteros, Planck-Spektrum 360 bis
 * 830 nm in 1-nm-Schritten, CIE 1931 2 Grad (Naeherung Wyman, Sloan, Shirley 2013), XYZ auf Y = 1,
 * Matrix IEC 61966-2-1. Kanaele ueber 1 sind gewollt, begrenzt wird erst das Pixel beim Zeichnen.
 */
const FARBTABELLE: readonly (readonly [number, number, number])[] = [
  [0.7429, 0.9879, 1.8776], // -0,4  21707 K
  [0.7728, 0.9909, 1.7596], // -0,3  16602 K
  [0.8038, 0.993, 1.6475], //  -0,2  13585 K
  [0.8361, 0.9942, 1.5411], // -0,1  11573 K
  [0.8695, 0.9944, 1.4404], //  0,0  10125 K
  [0.904, 0.9937, 1.3453], //   0,1   9028 K
  [0.9394, 0.9923, 1.2556], //  0,2   8163 K
  [0.9758, 0.99, 1.1711], //    0,3   7462 K
  [1.0131, 0.9869, 1.0917], //  0,4   6880 K
  [1.0511, 0.9832, 1.0169], //  0,5   6389 K
  [1.0899, 0.9787, 0.9468], //  0,6   5968 K
  [1.1293, 0.9737, 0.8809], //  0,7   5602 K
  [1.1693, 0.968, 0.819], //    0,8   5281 K
  [1.2098, 0.9618, 0.7609], //  0,9   4996 K
  [1.2508, 0.9551, 0.7065], //  1,0   4743 K
  [1.2922, 0.948, 0.6554], //   1,1   4515 K
  [1.334, 0.9404, 0.6074], //   1,2   4309 K
  [1.3762, 0.9324, 0.5625], //  1,3   4121 K
  [1.4187, 0.924, 0.5203], //   1,4   3950 K
  [1.4615, 0.9153, 0.4807], //  1,5   3794 K
  [1.5045, 0.9063, 0.4436], //  1,6   3649 K
  [1.5478, 0.8969, 0.4088], //  1,7   3516 K
  [1.5912, 0.8873, 0.3761], //  1,8   3392 K
  [1.6349, 0.8774, 0.3454], //  1,9   3277 K
  [1.6787, 0.8673, 0.3167] //   2,0   3169 K
];

/**
 * Farbtemperatur in K aus B-V nach Ballesteros 2012, Gl. 14 (wahrnehmung.md 5.2):
 * T = 4600 K (1 / (0,92 (B-V) + 1,7) + 1 / (0,92 (B-V) + 0,62)). Wirft PhysikFehler bei NaN und
 * bei B-V am oder unter dem Pol -0,674 (0,92 (B-V) + 0,62 <= 0).
 */
export function bvZuTemperatur(bv: number): number {
  if (!Number.isFinite(bv) || 0.92 * bv + 0.62 <= 0) {
    throw new PhysikFehler("bv", bv, "ist nicht endlich oder liegt am Pol der Ballesteros-Formel");
  }
  return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
}

/**
 * Umkehrung von bvZuTemperatur: mit a = 0,92 (B-V) und u = T / 4600 K ist
 * u a^2 + (2,32 u - 2) a + (1,054 u - 2,32) = 0; die groessere Wurzel liegt rechts vom Pol.
 */
function temperaturZuBv(t: number): number {
  const u = t / 4600;
  const p = 2.32 * u - 2;
  const a = (-p + Math.sqrt(p * p - 4 * u * (1.054 * u - 2.32))) / (2 * u);
  return a / 0.92;
}

/**
 * Lineare Interpolation in der Farbtabelle; ausserhalb -0,4 bis 2,0 gilt die Randzeile. NaN (aus
 * temperaturZuBv bei sehr hohem T, wenn p * p ueberlaeuft) gilt als sehr heiss: blaue Randzeile.
 */
function farbeAusTabelle(bv: number): [number, number, number] {
  if (Number.isNaN(bv)) {
    bv = BV_ERSTE;
  }
  const x = Math.min(Math.max((bv - BV_ERSTE) / BV_SCHRITT, 0), FARBTABELLE.length - 1);
  const i = Math.min(Math.floor(x), FARBTABELLE.length - 2);
  const w = x - i;
  const a = FARBTABELLE[i]!;
  const b = FARBTABELLE[i + 1]!;
  return [a[0] + w * (b[0] - a[0]), a[1] + w * (b[1] - a[1]), a[2] + w * (b[2] - a[2])];
}

/**
 * Lineares sRGB (D65) mit Y = 1 zur Farbtemperatur t in K (wahrnehmung.md 5.3): Tabelle in
 * 0,1-Schritten von B-V, linear interpoliert in B-V; unter 3169 K und ueber 21 707 K die Randzeile.
 * Wirft PhysikFehler bei t nicht endlich oder nicht positiv.
 */
export function temperaturZuRgb(t: number): [number, number, number] {
  if (!Number.isFinite(t) || t <= 0) {
    throw new PhysikFehler("t", t, "ist nicht endlich oder nicht positiv");
  }
  return farbeAusTabelle(temperaturZuBv(t));
}

/**
 * Beleuchtungsstaerke eines Sterns der Magnitude m am Auge in lx (physik.md 13.1, wahrnehmung.md 5.1):
 * Z 10^(-0,4 m) a tau (1 - eps^2) (min(D, p V) / p)^2 mit a der Atmosphaere. Ab AP >= p begrenzt
 * die Augenpupille; das blosse Auge (D = p, V = 1, tau = 1) ergibt Z 10^(-0,4 m) a.
 */
export function beleuchtungAmAugeLx(m: number, optik: Optik, atmosphaere: Atmosphaere): number {
  if (!Number.isFinite(m)) {
    throw new PhysikFehler("m", m, "ist nicht endlich");
  }
  const wirksamMm = Math.min(optik.oeffnungMm, PUPILLE_MM * optik.vergroesserung);
  return (
    BELEUCHTUNG_NULL_MAG_LX *
    Math.pow(10, -0.4 * m) *
    atmosphaere.transmission *
    optik.transmission *
    (1 - optik.obstruktion * optik.obstruktion) *
    (wirksamMm / PUPILLE_MM) ** 2
  );
}

/**
 * Farbe eines Sterns (A-P12): lineares sRGB mit Y = 1 aus B-V, wenn die Beleuchtungsstaerke am Auge
 * mindestens FARBSCHWELLE_LX ist; darunter undefined (grau, Punktquelle.farbe fehlt). Fester
 * Schnitt, ein gleitender Uebergang gehoert zu A-P8. Liest die Tabelle direkt mit B-V: anders als
 * bvZuTemperatur wirft sie am und unter dem Pol -0,674 nicht, sondern gibt die blaue Randzeile
 * (B-V -0,4), wie fuer jedes B-V unter -0,4.
 */
export function sternfarbe(bv: number, lx: number): [number, number, number] | undefined {
  if (Number.isNaN(lx)) {
    throw new PhysikFehler("lx", lx, "ist NaN");
  }
  if (!Number.isFinite(bv)) {
    throw new PhysikFehler("bv", bv, "ist nicht endlich");
  }
  if (lx < FARBSCHWELLE_LX) {
    return undefined;
  }
  return farbeAusTabelle(bv);
}
