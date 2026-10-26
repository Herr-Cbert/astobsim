// Arbeitsmassstab und Kernbeschreibung (Naht-Stufe 2). Quelle: ADR-0002 (Arbeitsmassstab),
// docs/architektur.md Abschnitt 3 (Rundung auf 4 Stellen, Schluessel). Massstaebe in
// Bogensekunden je Pixel.

import type { Fenster, Kernbeschreibung } from "../naht/simulationsparameter";
import type { Atmosphaere } from "./atmosphaere";
import type { Aufloesung } from "./aufloesung";
import { pruefeBereich } from "./fehler";
import type { Objektzustand } from "./konfiguration";
import { ARBEITSPIXEL_PRO_FWHM } from "./konstanten";
import type { Optik } from "./optik";
import { rundeSignifikant, schluessel } from "./schluessel";

/** Kleinste Kantenlaenge eines Fensters in Anzeigepixeln (naht-variante-3.md 1.3, Fehlerfaelle). */
const FENSTER_MIN_PX = 16;

/**
 * ADR-0002: Arbeitsmassstab = max(Quellmassstab, Gesamt-FWHM / 2,5, Fenstermassstab). Nie feiner
 * als das Quellbild, nie feiner als noetig fuer die Gesamt-PSF, nie feiner als die Anzeige.
 * Folge: die Gesamt-FWHM ist hoechstens 2,5 Arbeitspixel breit, der Kern bleibt klein.
 * Wirft PhysikFehler bei Fenster mit px < 16 oder Breite <= 0.
 */
export function arbeitsmassstab(aufl: Aufloesung, quelle: Objektzustand["quelle"], fenster: Fenster): number {
  pruefeBereich("fenster.px", fenster.px, FENSTER_MIN_PX, Infinity);
  pruefeBereich("fenster.breiteArcsec", fenster.breiteArcsec, Number.MIN_VALUE, Infinity);
  return Math.max(quelle.massstabArcsecProPx, aufl.gesamtFwhmArcsec / ARBEITSPIXEL_PRO_FWHM, fenster.breiteArcsec / fenster.px);
}

/**
 * Die fuenf Groessen des Kerns, auf 4 signifikante Stellen gerundet, damit Gleitkommarauschen
 * keinen Kernbau ausloest. Der Kern aendert sich genau dann, wenn eines der Felder sich aendert.
 */
export function kernbeschreibung(o: Optik, a: Atmosphaere, aufl: Aufloesung, massstabArcsecProPx: number): Kernbeschreibung {
  return {
    oeffnungMm: rundeSignifikant(o.oeffnungMm),
    obstruktion: rundeSignifikant(o.obstruktion),
    seeingFwhmArcsec: rundeSignifikant(a.seeingFwhmArcsec),
    augeFwhmArcsec: rundeSignifikant(aufl.augeFwhmArcsec),
    massstabArcsecProPx: rundeSignifikant(massstabArcsecProPx)
  };
}

/** Schluessel der Kern-Stufe aus den fuenf gerundeten Feldern. */
export function kernSchluessel(b: Kernbeschreibung): string {
  return schluessel("kern", b.oeffnungMm, b.obstruktion, b.seeingFwhmArcsec, b.augeFwhmArcsec, b.massstabArcsecProPx);
}
