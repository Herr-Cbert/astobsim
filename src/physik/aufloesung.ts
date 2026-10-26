// Aufloesung: die drei Grenzen Beugung, Seeing und Auge als Winkel am Objekt, ihre
// Quadratursumme und die dominante Grenze (A-P2, A-D4). Quelle: docs/recherche/physik.md,
// Abschnitte 3.2 und 9. Alle Winkel in Bogensekunden.

import type { Atmosphaere } from "./atmosphaere";
import { airyFwhmArcsec, dawesArcsec, rayleighArcsec } from "./beugung";
import { AUGE_AUFLOESUNG_ARCSEC } from "./konstanten";
import type { Optik } from "./optik";
import { quadratur } from "./profile";

export type Aufloesungsgrenze = "beugung" | "seeing" | "auge";

/**
 * Rayleigh und Dawes fuer die Anzeige, dazu die drei Halbwertsbreiten: Beugung 1,029 lambda/D
 * (ohne Obstruktion; die steckt im Kern), Seeing am Objekt, Auge 60''/V. gesamtFwhmArcsec ist
 * die Quadratursumme, nur fuer Anzeige und Arbeitsmassstab; dominant ist die groesste der drei.
 */
export interface Aufloesung {
  rayleighArcsec: number;
  dawesArcsec: number;
  beugungFwhmArcsec: number;
  seeingFwhmArcsec: number;
  augeFwhmArcsec: number;
  gesamtFwhmArcsec: number;
  dominant: Aufloesungsgrenze;
}

/** Abschnitt 3.2 und 9: FWHM_Airy = 116,8''/D, FWHM_Auge = 60''/V, Gesamt = Quadratur, dominant = Maximum. */
export function aufloesung(o: Optik, a: Atmosphaere): Aufloesung {
  const beugungFwhmArcsec = airyFwhmArcsec(o.oeffnungMm);
  const seeingFwhmArcsec = a.seeingFwhmArcsec;
  const augeFwhmArcsec = AUGE_AUFLOESUNG_ARCSEC / o.vergroesserung;
  const grenzen: [Aufloesungsgrenze, number][] = [
    ["beugung", beugungFwhmArcsec],
    ["seeing", seeingFwhmArcsec],
    ["auge", augeFwhmArcsec]
  ];
  let dominant: Aufloesungsgrenze = "beugung";
  let groesste = -Infinity;
  for (const [grenze, fwhm] of grenzen) {
    if (fwhm > groesste) {
      groesste = fwhm;
      dominant = grenze;
    }
  }
  return {
    rayleighArcsec: rayleighArcsec(o.oeffnungMm),
    dawesArcsec: dawesArcsec(o.oeffnungMm),
    beugungFwhmArcsec,
    seeingFwhmArcsec,
    augeFwhmArcsec,
    gesamtFwhmArcsec: quadratur(beugungFwhmArcsec, seeingFwhmArcsec, augeFwhmArcsec),
    dominant
  };
}
