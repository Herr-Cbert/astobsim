// Konstanten des Modells, jede genau einmal. Quelle: docs/recherche/physik.md, Abschnitt 9
// (Konstanten) und die dort genannten Abschnitte. Ohne diese Datei stuenden 138,4 und 116,8
// als nackte Zahlen im Code; sie folgen hier aus Wellenlaenge und Faktor.

import type { Transparenz } from "./konfiguration";

/** Wellenlaenge des Modells in Metern (gruen, Maximum der Augenempfindlichkeit), Abschnitt 9. */
export const WELLENLAENGE_M = 550e-9;

/** Bogensekunden je Radiant, Abschnitt 8: 1 rad = 206 264,8''. */
export const ARCSEC_PRO_RAD = 206264.8;

/** Feste Augenpupille p in mm (A-F3, Abschnitt 5.1). */
export const PUPILLE_MM = 6;

/** Aufloesung des Auges in Bogensekunden, eine Bogenminute (A-P2, Abschnitt 3.1). */
export const AUGE_AUFLOESUNG_ARCSEC = 60;

/** Moffat-Exponent beta, beste Anpassung an die Kolmogorov-Langzeit-PSF (Abschnitt 2.2, [18]). */
export const BETA_MOFFAT = 4.765;

/** Rayleigh-Grenze und Radius des ersten Airy-Minimums: 1,22 lambda/D (Abschnitt 1.1, 1.2). */
export const RAYLEIGH_FAKTOR = 1.22;

/** Halbwertsbreite des Airy-Kerns: 1,029 lambda/D (Abschnitt 1.1). */
export const AIRY_FWHM_FAKTOR = 1.029;

/** Seeing-FWHM = 0,98 lambda / r0 (Abschnitt 2.1, [16] Gl. 5). */
export const SEEING_FAKTOR = 0.98;

/** Dawes-Grenze: 4,56'' bei 1 Zoll Oeffnung (Abschnitt 1.2, [3]). */
export const DAWES_ARCSEC_ZOLL = 4.56;
export const MM_PRO_ZOLL = 25.4;

/** Hoechste sinnvolle Vergroesserung: 2 D in mm, d. h. Austrittspupille 0,5 mm (Abschnitt 4). */
export const VERGROESSERUNG_MAX_PRO_MM = 2;

/** Extinktionskoeffizient k in mag je Luftmasse fuer die drei Transparenzstufen (Abschnitt 5.4). */
export const EXTINKTION_MAG_PRO_LUFTMASSE: Readonly<Record<Transparenz, number>> = {
  klar: 0.2,
  "leicht-diesig": 0.3,
  diesig: 0.45
};

/** Koeffizienten der Luftmassenformel von Kasten und Young 1989 (Abschnitt 5.3, [39]). */
export const KASTEN_YOUNG = { a: 0.50572, b: 6.07995, c: -1.6364 } as const;

/** lambda/D in Bogensekunden fuer eine Oeffnung D in mm; Grundmass aller Beugungsgroessen. */
export function lambdaDurchDArcsec(oeffnungMm: number): number {
  return (WELLENLAENGE_M / (oeffnungMm * 1e-3)) * ARCSEC_PRO_RAD;
}
