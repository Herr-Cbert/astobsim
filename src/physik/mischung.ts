// Mischgewicht und Sockel (Stufe 1, Version 2): Mischung zwischen Flaechen- und Punktebene fuer
// unaufgeloeste Zustaende (A-P10) und additiver Sockel fuer die Mindestsichtbarkeit der
// Deep-Sky-Ebene (ADR-0004). Quelle: docs/recherche/wahrnehmung.md 3.2 (Uebergangsfunktion) und
// 4.4 Punkt 4, ADR-0004, docs/architektur.md 5.3 (Pixelformel, Bitgleichheit); Herleitung und
// Testwerte in docs/recherche/physik.md Abschnitt 17 (Mischgewicht und Sockel). Reine Funktionen, keine Pixel.

import { PhysikFehler, pruefeBereich, pruefePositiv } from "./fehler";
import { AUGE_AUFLOESUNG_ARCSEC, MISCHGEWICHT_SCHNITT, SOCKEL_RESERVE_KODES } from "./konstanten";

/**
 * Faktor ln 2 / 2 = 0,3466 der Uebergangsfunktion g(x) = 1/(1 + 0,3466 x^2): Varianz der Gauss-PSF
 * des Auges (FWHM theta_A, theta_A^2 / (8 ln 2)) gegen die einer gleichmaessigen Scheibe
 * (d^2 / 16) mit x = d / theta_A (wahrnehmung.md 3.2, eigene Herleitung).
 */
const UEBERGANG_FAKTOR = Math.LN2 / 2;

/** Hoechster sRGB-Kode bei 8 Bit; der Sockel rechnet mit Kodes als stetiger Groesse. */
const SRGB_KODE_MAX = 255;

/**
 * Uebergangsfunktion vor dem Schnitt: Anteil der Punktebene g(x) = 1/(1 + 0,3466 x^2) mit
 * x = theta V / 60'' (scheinbare Winkelgroesse in Einheiten der Augenaufloesung). 1 fuer x = 0,
 * streng fallend in x (wahrnehmung.md 3.2, Testwerte 6). Wirft PhysikFehler bei x < 0 oder NaN.
 */
export function uebergang(x: number): number {
  pruefeBereich("x", x, 0, Infinity);
  return 1 / (1 + UEBERGANG_FAKTOR * x * x);
}

/**
 * Mischgewicht g' in [0, 1] zwischen Flaechen- (0) und Punktebene (1) fuer einen Zustand mit
 * Winkelgroesse theta in Bogensekunden bei Vergroesserung V (A-P10; blosses Auge V = 1):
 * g' = max(0, (g(x) - 0,005) / 0,995) mit x = theta V / 60''. Stetig und monoton fallend in theta
 * und V; exakt 0 fuer x > 24, dann gilt der Ausdruck aus Version 1 (architektur.md 5.3). Fuer
 * theta = 0 genau 1; reale Zustaende haben theta > 0. Wirft PhysikFehler bei theta < 0 oder
 * V < 1 (Programmierfehler, begrenze schneidet die Eingaben vorher).
 */
export function mischgewicht(winkelgroesseArcsec: number, vergroesserung: number): number {
  pruefeBereich("winkelgroesseArcsec", winkelgroesseArcsec, 0, Infinity);
  pruefeBereich("vergroesserung", vergroesserung, 1, Infinity);
  const g = uebergang((winkelgroesseArcsec * vergroesserung) / AUGE_AUFLOESUNG_ARCSEC);
  return Math.max(0, (g - MISCHGEWICHT_SCHNITT) / (1 - MISCHGEWICHT_SCHNITT));
}

/**
 * sRGB-Kodierung (IEC 61966-2-1, physik.md [59]): linearer Wert in [0, 1] zum kodierten Wert in
 * [0, 1]; 12,92 L bis 0,0031308, darueber 1,055 L^(1/2,4) - 0,055. Werte ausserhalb [0, 1] werden
 * begrenzt wie beim Zeichnen. Gleiche Kennlinie wie linearZuSrgb in src/ui/zeichne.ts; physik
 * importiert ui nicht (architektur.md Abschnitt 4).
 */
export function srgbKodierung(linear: number): number {
  if (Number.isNaN(linear)) throw new PhysikFehler("linear", linear, "ist NaN");
  const l = Math.min(1, Math.max(0, linear));
  return l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
}

/** Umkehrung von srgbKodierung (IEC 61966-2-1): kodierter Wert in [0, 1] zum linearen Wert, ausserhalb begrenzt. */
export function srgbDekodierung(kodiert: number): number {
  if (Number.isNaN(kodiert)) throw new PhysikFehler("kodiert", kodiert, "ist NaN");
  const v = Math.min(1, Math.max(0, kodiert));
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Sockel sigma >= 0 der Deep-Sky-Ebene (ADR-0004, Mindestsichtbarkeit): Pixel
 * h + P (min(1, (a q + s)^n) - h + sigma) mit h = min(1, s^n). Gesucht ist der kleinste Sockel, mit
 * dem ein Pixel an der Schwelle (q = q*, Deckkraft P = 0,5) mindestens Delta_min sRGB-Kodes ueber
 * dem Himmel liegt:
 *   sigma = max(0, 2 (L_ziel - h) - (min(1, (a q* + s)^n) - h)),
 *   L_ziel = linear(min(255, Kode(h) + Delta_min + 0,15) / 255),
 * mit Kode(h) = 255 srgbKodierung(h) als stetiger Groesse (wie der Prototyp) und der Reserve
 * SOCKEL_RESERVE_KODES gegen das Runden beim Zeichnen. "Ueber dem Himmel" meint h ohne Sockel
 * (ADR-0004, Nachtrag). 0, wenn die Abbildung den Abstand schon
 * leistet. Eingaben: a, s Leuchtdichte von Quellweiss und Himmel im Okular relativ zum Anzeigeweiss,
 * qStern Pixelwert (relativ zu Quellweiss) an der sichtbaren Isophote, n Kompressionsexponent.
 * Wirft PhysikFehler bei a, qStern, n <= 0, s < 0 oder Delta_min ausserhalb 0 bis 255.
 */
export function sockel(a: number, s: number, qStern: number, deltaMinKodes: number, n: number): number {
  pruefePositiv("a", a);
  if (!Number.isFinite(s) || s < 0) throw new PhysikFehler("s", s, "ist nicht endlich oder negativ");
  pruefePositiv("qStern", qStern);
  pruefeBereich("deltaMinKodes", deltaMinKodes, 0, SRGB_KODE_MAX);
  pruefePositiv("n", n);
  const h = Math.min(1, Math.pow(s, n));
  const anSchwelle = Math.min(1, Math.pow(a * qStern + s, n));
  const kodeHimmel = SRGB_KODE_MAX * srgbKodierung(h);
  const ziel = srgbDekodierung(Math.min(SRGB_KODE_MAX, kodeHimmel + deltaMinKodes + SOCKEL_RESERVE_KODES) / SRGB_KODE_MAX);
  return Math.max(0, 2 * (ziel - h) - (anSchwelle - h));
}
