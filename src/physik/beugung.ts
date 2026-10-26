// Beugung an der Kreis- und Ringoeffnung: Grenzen, MTF, Energie im Airy-Kern.
// Quelle: docs/recherche/physik.md, Abschnitte 1.1 bis 1.4, 8 und 9. Alle Winkel in
// Bogensekunden bei 550 nm, Oeffnung D in mm, Obstruktion als Verhaeltnis 0 bis 0,5.

import { besselJ1 } from "./bessel";
import {
  AIRY_FWHM_FAKTOR,
  DAWES_ARCSEC_ZOLL,
  MM_PRO_ZOLL,
  RAYLEIGH_FAKTOR,
  lambdaDurchDArcsec
} from "./konstanten";

/** Rayleigh-Grenze 1,22 lambda/D = 138,4''/D (Abschnitt 1.2, [2]). */
export function rayleighArcsec(oeffnungMm: number): number {
  return RAYLEIGH_FAKTOR * lambdaDurchDArcsec(oeffnungMm);
}

/** Dawes-Grenze 4,56''/D_Zoll = 115,8''/D (Abschnitt 1.2, [3]). */
export function dawesArcsec(oeffnungMm: number): number {
  return (DAWES_ARCSEC_ZOLL * MM_PRO_ZOLL) / oeffnungMm;
}

/** Halbwertsbreite des Airy-Kerns 1,029 lambda/D = 116,8''/D (Abschnitt 1.1). */
export function airyFwhmArcsec(oeffnungMm: number): number {
  return AIRY_FWHM_FAKTOR * lambdaDurchDArcsec(oeffnungMm);
}

/** Radius des ersten Airy-Minimums 1,22 lambda/D, gleich der Rayleigh-Grenze (Abschnitt 1.1, [1]). */
export function airyRadiusArcsec(oeffnungMm: number): number {
  return RAYLEIGH_FAKTOR * lambdaDurchDArcsec(oeffnungMm);
}

/**
 * Linsenflaeche zweier Kreise mit Radien r1, r2 und Mittelpunktsabstand d
 * (Abschnitt 1.3 Rezept B, [52]).
 */
function linsenflaeche(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const b = (d * d + r2 * r2 - r1 * r1) / (2 * d);
  return (
    r1 * r1 * Math.acos(a / r1) - a * Math.sqrt(r1 * r1 - a * a) + r2 * r2 * Math.acos(b / r2) - b * Math.sqrt(r2 * r2 - b * b)
  );
}

/**
 * MTF der Ringpupille bei der normierten Ortsfrequenz nu = f / f_c, f_c = D / lambda
 * (Abschnitt 1.3, [6, 9]): normierte Autokorrelation der Pupillenfunktion. Die Pupille ist
 * Kreis(1) minus Kreis(obstruktion); ihre Autokorrelation bei Verschiebung d = 2 nu ist
 * L(1,1,d) - 2 L(1,e,d) + L(e,e,d) mit der Linsenflaeche L, normiert auf die Pupillenflaeche
 * pi (1 - e^2). Fuer e = 0 identisch mit (2/pi)[arccos nu - nu sqrt(1 - nu^2)].
 * Ergebnis 1 bei nu = 0, 0 ab nu = 1.
 */
export function mtfPupille(nu: number, obstruktion: number): number {
  if (nu <= 0) return 1;
  if (nu >= 1) return 0;
  const e = obstruktion;
  const d = 2 * nu;
  const autokorrelation = linsenflaeche(1, 1, d) - 2 * linsenflaeche(1, e, d) + linsenflaeche(e, e, d);
  return autokorrelation / (Math.PI * (1 - e * e));
}

/**
 * Amplitude des Beugungsbilds der Ringoeffnung bei v = pi D sin(theta) / lambda, Spitze 1
 * (Abschnitt 9, Annulus-Formel [1, 7]): [2 J1(v)/v - e^2 2 J1(e v)/(e v)] / (1 - e^2).
 * Die Intensitaet ist das Quadrat davon.
 */
export function airyAmplitude(v: number, obstruktion: number): number {
  if (v < 1e-9) return 1;
  const e = obstruktion;
  let t = (2 * besselJ1(v)) / v;
  if (e > 0) t -= (e * e * 2 * besselJ1(e * v)) / (e * v);
  return t / (1 - e * e);
}

/** Erste Nullstelle der Airy-Amplitude in v, Bisektion in (2,5; 3,9) (Abschnitt 1.4: 1,22 pi bei e = 0, 1,00 pi bei e = 0,5). */
function ersteNullstelleV(obstruktion: number): number {
  let unten = 2.5;
  let oben = 3.9;
  for (let i = 0; i < 60; i++) {
    const mitte = (unten + oben) / 2;
    if (airyAmplitude(mitte, obstruktion) > 0) unten = mitte;
    else oben = mitte;
  }
  return (unten + oben) / 2;
}

/**
 * Energieanteil innerhalb des ersten Minimums (Abschnitt 1.4, [7, 8]): Simpson-Integral von
 * I(v) v dv ueber 0 bis v1, geteilt durch die Gesamtenergie 2 / (1 - e^2). Die Gesamtenergie
 * folgt aus Parseval: proportional zur Pupillenflaeche (1 - e^2), Spitze proportional
 * (1 - e^2)^2 [8], und fuer e = 0 ist das Integral 2 [1, Kap. 8.5.2].
 * Ergebnis 0,838 bei e = 0, 0,584 bei e = 0,4.
 */
export function energieImAiryKern(obstruktion: number): number {
  const e = obstruktion;
  const v1 = ersteNullstelleV(e);
  const schritte = 2000;
  const h = v1 / schritte;
  let summe = 0;
  for (let i = 0; i <= schritte; i++) {
    const v = i * h;
    const gewicht = i === 0 || i === schritte ? 1 : i % 2 ? 4 : 2;
    summe += gewicht * airyAmplitude(v, e) ** 2 * v;
  }
  const integral = (summe * h) / 3;
  return integral / (2 / (1 - e * e));
}
