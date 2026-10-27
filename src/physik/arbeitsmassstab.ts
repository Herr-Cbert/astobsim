// Arbeitsmassstab und Kernbeschreibung (Naht-Stufe 2). Quelle: ADR-0002 (Arbeitsmassstab),
// docs/architektur.md Abschnitt 3 (Rundung auf 4 Stellen, Schluessel). Massstaebe in
// Bogensekunden je Pixel.

import type { Fenster, Kernbeschreibung } from "../naht/simulationsparameter";
import type { Atmosphaere } from "./atmosphaere";
import type { Aufloesung } from "./aufloesung";
import { pruefeBereich } from "./fehler";
import type { Objektzustand } from "../naht/konfiguration";
import { ARBEITSPIXEL_PRO_FWHM, FENSTER_MIN_PX } from "./konstanten";
import type { Optik } from "./optik";
import { rundeSignifikant, schluessel } from "./schluessel";

/**
 * Arbeitsmassstab ohne Anzeige: max(Quellmassstab, Gesamt-FWHM / 2,5) (ADR-0002). Der feinste
 * Massstab, den ein Fenster bekommen kann; die UI waehlt damit die kleinste Zoombreite.
 */
export function arbeitsmassstabOhneFenster(aufloesung: Aufloesung, quelle: Objektzustand["quelle"]): number {
  return Math.max(quelle.massstabArcsecProPx, aufloesung.gesamtFwhmArcsec / ARBEITSPIXEL_PRO_FWHM);
}

/**
 * ADR-0002: Arbeitsmassstab = max(Quellmassstab, Gesamt-FWHM / 2,5, Fenstermassstab). Nie feiner
 * als das Quellbild, nie feiner als noetig fuer die Gesamt-PSF, nie feiner als die Anzeige.
 * Folge: die Gesamt-FWHM ist hoechstens 2,5 Arbeitspixel breit, der Kern bleibt klein.
 * Wirft PhysikFehler bei Fenster mit px < 16 oder Breite <= 0.
 */
export function arbeitsmassstab(aufloesung: Aufloesung, quelle: Objektzustand["quelle"], fenster: Fenster): number {
  pruefeBereich("fenster.px", fenster.px, FENSTER_MIN_PX, Infinity);
  pruefeBereich("fenster.breiteArcsec", fenster.breiteArcsec, Number.MIN_VALUE, Infinity);
  return Math.max(arbeitsmassstabOhneFenster(aufloesung, quelle), fenster.breiteArcsec / fenster.px);
}

/**
 * Die fuenf Groessen des Kerns, auf 4 signifikante Stellen gerundet, damit Gleitkommarauschen
 * keinen Kernbau ausloest. Der Kern aendert sich genau dann, wenn eines der Felder sich aendert.
 */
export function kernbeschreibung(optik: Optik, atmosphaere: Atmosphaere, aufloesung: Aufloesung, massstabArcsecProPx: number): Kernbeschreibung {
  return {
    oeffnungMm: rundeSignifikant(optik.oeffnungMm),
    obstruktion: rundeSignifikant(optik.obstruktion),
    seeingFwhmArcsec: rundeSignifikant(atmosphaere.seeingFwhmArcsec),
    augeFwhmArcsec: rundeSignifikant(aufloesung.augeFwhmArcsec),
    massstabArcsecProPx: rundeSignifikant(massstabArcsecProPx)
  };
}

/** Schluessel der Kern-Stufe aus den fuenf gerundeten Feldern. */
export function kernSchluessel(beschreibung: Kernbeschreibung): string {
  const { oeffnungMm, obstruktion, seeingFwhmArcsec, augeFwhmArcsec, massstabArcsecProPx } = beschreibung;
  return schluessel("kern", oeffnungMm, obstruktion, seeingFwhmArcsec, augeFwhmArcsec, massstabArcsecProPx);
}
