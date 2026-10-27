// Vorwaermen des WebGL2-Falters: FalterWebgl2 uebersetzt je Kerngroesse und Kanalzahl beim ersten
// Gebrauch ein Programm (SwiftShader bis etwa 0,25 s, Hinweis aus den Reviews von PR #49 und #50).
// Faellt der erste Reglerzug auf eine neue Kerngroesse, reisst das A-D7 (unter 0,5 s). Darum wird
// nach dem ersten Anblick jede wahrscheinliche Kerngroesse einmal mit einem winzigen Raster
// gefaltet, eine je Leerlauf-Slot, damit die Seite bedienbar bleibt. Das geht ueber die
// bestehende Schnittstelle Falter.falte; bild braucht dafuer keine neue Funktion.

import type { Falter, Kanaele } from "../bild";
import { neuesRaster } from "../bild";
import type { Kern } from "../naht/simulationsparameter";

/**
 * Kerngroessen aus dem Arbeitsmassstab (ADR-0002, Nachtrag Issue #4): FWHM hoechstens 2,5
 * Arbeitspixel, Radius 3 FWHM, also 5 bis 17 px, nur ungerade.
 */
export const WAHRSCHEINLICHE_KERNGROESSEN: readonly number[] = [5, 7, 9, 11, 13, 15, 17];

/** Kantenlaenge des Rasters zum Vorwaermen; klein, damit nur die Uebersetzung kostet. */
const RASTER_PX = 8;

/** Delta-Kern der Groesse n (Summe 1, punktsymmetrisch): erfuellt die Pruefungen des Falters. */
function deltaKern(n: number): Kern {
  const daten = new Float32Array(n * n);
  const r = (n - 1) / 2;
  daten[r * n + r] = 1;
  return {
    schluessel: `vorwaermen|${n}`,
    beschreibung: { oeffnungMm: 1, obstruktion: 0, seeingFwhmArcsec: 0, augeFwhmArcsec: 0, massstabArcsecProPx: 1 },
    groesse: n,
    radius: r,
    massstabArcsecProPx: 1,
    daten
  };
}

export interface Vorwaermen {
  /** Kanalzahlen in Reihenfolge; die des ersten Anblicks zuerst. */
  kanaele: readonly Kanaele[];
  /** Ruft f im naechsten Leerlauf (Browser: requestIdleCallback, sonst setTimeout). */
  plane(f: () => void): void;
  /** Solange true, wird weitergewaermt (z. B. falterwahl.art === "webgl2"). */
  aktiv(): boolean;
  /** Zeit in ms; fuer das Protokoll am Ende. */
  uhr(): number;
  /** Wird am Ende mit Anzahl und Gesamtdauer der Faltungen gerufen. */
  fertig?(anzahl: number, ms: number): void;
}

/**
 * Faltet nacheinander je Kanalzahl jede Kerngroesse aus WAHRSCHEINLICHE_KERNGROESSEN einmal, ein
 * Auftrag je plane-Aufruf. Hoert auf, sobald aktiv() false liefert. Fehler beim Falten bricht das
 * Vorwaermen ab, ohne zu werfen (der Falter wechselt dann selbst auf JavaScript).
 */
export function waermeVor(falter: Falter, v: Vorwaermen): void {
  const auftraege = v.kanaele.flatMap((k) => WAHRSCHEINLICHE_KERNGROESSEN.map((n) => ({ k, n })));
  let i = 0;
  let ms = 0;
  const schritt = (): void => {
    if (i >= auftraege.length || !v.aktiv()) {
      v.fertig?.(i, Math.round(ms));
      return;
    }
    const { k, n } = auftraege[i]!;
    i++;
    const t0 = v.uhr();
    try {
      falter.falte(neuesRaster(RASTER_PX, RASTER_PX, k), deltaKern(n));
    } catch (e) {
      console.warn("Vorwaermen des Falters abgebrochen", e);
      v.fertig?.(i, Math.round(ms));
      return;
    }
    ms += v.uhr() - t0;
    v.plane(schritt);
  };
  v.plane(schritt);
}
