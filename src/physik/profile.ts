// Radiale Profile der drei PSF-Komponenten und ihre Kombination. Quelle:
// docs/recherche/physik.md, Abschnitte 1.1, 2.2, 2.4 und 9. r und FWHM in Bogensekunden,
// Intensitaet unnormiert mit Spitze 1 bei r = 0; die Normierung macht der Kernbau (Issue #4).

import { airyAmplitude } from "./beugung";
import { ARCSEC_PRO_RAD, BETA_MOFFAT, WELLENLAENGE_M } from "./konstanten";

/** Umrechnung FWHM zu sigma einer Gaussfunktion: FWHM = 2 sqrt(2 ln 2) sigma = 2,3548 sigma (Abschnitt 2.2). */
const FWHM_PRO_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

/**
 * Airy-Profil der Ringoeffnung (Abschnitt 1.1 und 9, [1, 7]): I = Amplitude(v)^2 mit
 * v = pi D r / lambda, r in rad. Obstruktion steckt vollstaendig in der Annulus-Formel (A-P3).
 */
export function airyProfil(rArcsec: number, oeffnungMm: number, obstruktion: number): number {
  const v = (Math.PI * oeffnungMm * 1e-3 * (rArcsec / ARCSEC_PRO_RAD)) / WELLENLAENGE_M;
  return airyAmplitude(v, obstruktion) ** 2;
}

/**
 * Moffat-Profil (Abschnitt 2.2, [18, 19]): [1 + (r/alpha)^2]^-beta mit beta 4,765 und
 * alpha = FWHM / (2 sqrt(2^(1/beta) - 1)). Fluegel fallen als Potenzgesetz, wie die
 * Kolmogorov-Langzeit-PSF.
 */
export function moffatProfil(rArcsec: number, fwhmArcsec: number): number {
  const alpha = fwhmArcsec / (2 * Math.sqrt(Math.pow(2, 1 / BETA_MOFFAT) - 1));
  return Math.pow(1 + (rArcsec / alpha) ** 2, -BETA_MOFFAT);
}

/** Gauss-Profil exp(-r^2 / 2 sigma^2) mit sigma = FWHM / 2,3548 (Abschnitt 2.2); Augen-PSF. */
export function gaussProfil(rArcsec: number, fwhmArcsec: number): number {
  const sigma = fwhmArcsec / FWHM_PRO_SIGMA;
  return Math.exp(-(rArcsec * rArcsec) / (2 * sigma * sigma));
}

/**
 * Quadratursumme von Halbwertsbreiten (Abschnitt 2.4, [24]): sqrt(Summe FWHM^2). Nur fuer
 * Anzeige und Arbeitsmassstab; unterschaetzt die echte Faltung um bis zu 3 Prozent.
 */
export function quadratur(...fwhmArcsec: number[]): number {
  return Math.sqrt(fwhmArcsec.reduce((summe, fwhm) => summe + fwhm * fwhm, 0));
}
