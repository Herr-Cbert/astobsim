// Atmosphaere: Luftmasse, Seeing in der Hoehe, Fried-Parameter, Extinktion.
// Quelle: docs/recherche/physik.md, Abschnitte 2.1, 5.3, 5.4 und 9. Hoehe in Grad,
// Winkel in Bogensekunden bei 550 nm.

import type { Transparenz } from "./konfiguration";
import { ARCSEC_PRO_RAD, EXTINKTION_MAG_PRO_LUFTMASSE, KASTEN_YOUNG, SEEING_FAKTOR, WELLENLAENGE_M } from "./konstanten";

/**
 * Luftmasse X nach Kasten und Young 1989 (Abschnitt 5.3, [39]):
 * X = 1 / [sin h + 0,50572 (h + 6,07995)^-1,6364], h in Grad.
 * Im Zenit 0,9997, nicht 1.
 */
export function luftmasse(hoeheGrad: number): number {
  const { a, b, c } = KASTEN_YOUNG;
  return 1 / (Math.sin((hoeheGrad * Math.PI) / 180) + a * Math.pow(hoeheGrad + b, c));
}

/** Seeing-FWHM am Objekt: FWHM_Zenit mal X^0,6 (Abschnitt 2.1, [16, 22]). */
export function seeingAmObjektArcsec(fwhmZenitArcsec: number, luftmasse: number): number {
  return fwhmZenitArcsec * Math.pow(luftmasse, 0.6);
}

/** Fried-Parameter r0 in cm aus der Seeing-FWHM: r0 = 0,98 lambda / FWHM, FWHM in rad (Abschnitt 2.1, [16] Gl. 5). */
export function friedParameterCm(fwhmArcsec: number): number {
  return ((SEEING_FAKTOR * WELLENLAENGE_M) / (fwhmArcsec / ARCSEC_PRO_RAD)) * 100;
}

/** Extinktion in mag: k(Transparenz) mal Luftmasse, k = 0,20 / 0,30 / 0,45 (Abschnitt 5.4, [42]). */
export function extinktionMag(transparenz: Transparenz, luftmasse: number): number {
  return EXTINKTION_MAG_PRO_LUFTMASSE[transparenz] * luftmasse;
}

/** Transmissionsfaktor der Atmosphaere aus der Extinktion: 10^(-0,4 mag) (Abschnitt 5.4). */
export function extinktionFaktor(extinktionMag: number): number {
  return Math.pow(10, -0.4 * extinktionMag);
}
