// Atmosphaere: Luftmasse, Seeing in der Hoehe, Fried-Parameter, Extinktion, Seeing-Stufen,
// und atmosphaere(): die Bedingungen als Skalare. Quelle: docs/recherche/physik.md,
// Abschnitte 2.1, 2.5, 5.3, 5.4 und 9. Hoehe in Grad, Winkel in Bogensekunden bei 550 nm.

import { pruefeBereich } from "./fehler";
import type { Bedingungen, Transparenz } from "../naht/konfiguration";
import {
  ARCSEC_PRO_RAD,
  EXTINKTION_MAG_PRO_LUFTMASSE,
  KASTEN_YOUNG,
  SEEING_FAKTOR,
  SEEING_STUFEN,
  type Seeingwortstufe,
  WELLENLAENGE_M
} from "./konstanten";

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
export function seeingAmObjektArcsec(fwhmZenitArcsec: number, luftmasseX: number): number {
  return fwhmZenitArcsec * Math.pow(luftmasseX, 0.6);
}

/** Fried-Parameter r0 in cm aus der Seeing-FWHM: r0 = 0,98 lambda / FWHM, FWHM in rad (Abschnitt 2.1, [16] Gl. 5). */
export function friedParameterCm(fwhmArcsec: number): number {
  return ((SEEING_FAKTOR * WELLENLAENGE_M) / (fwhmArcsec / ARCSEC_PRO_RAD)) * 100;
}

/** Extinktion in mag: k(Transparenz) mal Luftmasse, k = 0,20 / 0,30 / 0,45 (Abschnitt 5.4, [42]). */
export function extinktionMag(transparenz: Transparenz, luftmasseX: number): number {
  return EXTINKTION_MAG_PRO_LUFTMASSE[transparenz] * luftmasseX;
}

/** Transmissionsfaktor der Atmosphaere aus der Extinktion: 10^(-0,4 mag) (Abschnitt 5.4). */
export function extinktionFaktor(mag: number): number {
  return Math.pow(10, -0.4 * mag);
}

/** Die Bedingungen als Skalare: Luftmasse, Seeing-FWHM am Objekt in Bogensekunden, Extinktion in mag, Transmissionsfaktor a. */
export interface Atmosphaere {
  luftmasse: number;
  seeingFwhmArcsec: number;
  extinktionMag: number;
  transmission: number;
}

/**
 * Luftmasse aus der Hoehe, Seeing mit X^0,6 auf die Hoehe skaliert (A-B4), Extinktion aus
 * Transparenz und Luftmasse (A-B3), Abschnitt 9. Wirft PhysikFehler bei Hoehe ausserhalb
 * 0 bis 90 Grad oder Seeing <= 0.
 */
export function atmosphaere(bedingungen: Bedingungen): Atmosphaere {
  pruefeBereich("hoeheGrad", bedingungen.hoeheGrad, 0, 90);
  pruefeBereich("seeingFwhmArcsec", bedingungen.seeingFwhmArcsec, Number.MIN_VALUE, Infinity);
  const x = luftmasse(bedingungen.hoeheGrad);
  const mag = extinktionMag(bedingungen.transparenz, x);
  return {
    luftmasse: x,
    seeingFwhmArcsec: seeingAmObjektArcsec(bedingungen.seeingFwhmArcsec, x),
    extinktionMag: mag,
    transmission: extinktionFaktor(mag)
  };
}

/** Wortstufe und Pickering-Bereich zur Seeing-FWHM im Zenit (A-B1, Tabelle in Abschnitt 2.5). */
export interface Seeingstufe {
  wortstufe: Seeingwortstufe;
  pickeringVon: number;
  pickeringBis: number;
}

/** Seeing-Anzeige nach Abschnitt 2.5: unter 1'' ausgezeichnet, 1 bis 2'' gut, 2 bis 3'' mittel, darueber schlecht. */
export function seeingstufe(fwhmZenitArcsec: number): Seeingstufe {
  const zeile = SEEING_STUFEN.find((stufe) => fwhmZenitArcsec < stufe.bisArcsec) ?? SEEING_STUFEN[SEEING_STUFEN.length - 1]!;
  return { wortstufe: zeile.wortstufe, pickeringVon: zeile.pickeringVon, pickeringBis: zeile.pickeringBis };
}
