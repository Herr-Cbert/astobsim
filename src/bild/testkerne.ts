// Synthetische Kerne fuer Tests des Moduls bild (docs/architektur.md Abschnitt 1: Delta, Kasten).
// Kein Import aus physik; die Kerne erfuellen die Invarianten der Naht (Summe 1, ungerade Groesse).

import type { Kern } from "../naht/simulationsparameter";

export function kernAusDaten(groesse: number, daten: Float32Array, schluessel: string, massstabArcsecProPx = 1): Kern {
  return {
    schluessel,
    beschreibung: { oeffnungMm: 80, obstruktion: 0, seeingFwhmArcsec: 2, augeFwhmArcsec: 1.5, massstabArcsecProPx },
    groesse,
    radius: (groesse - 1) / 2,
    massstabArcsecProPx,
    daten
  };
}

/** Delta: 1 in der Mitte, sonst 0. Laesst jedes Raster unveraendert. */
export function deltaKern(groesse = 5, massstabArcsecProPx = 1): Kern {
  const daten = new Float32Array(groesse * groesse);
  const r = (groesse - 1) / 2;
  daten[r * groesse + r] = 1;
  return kernAusDaten(groesse, daten, `delta${groesse}`, massstabArcsecProPx);
}

/** Delta um (dx, dy) Pixel aus der Mitte verschoben, +dx rechts, +dy nach Sueden (Kernzeile 0 ist Norden). */
export function verschobenerDeltaKern(dx: number, dy: number, groesse = 5, massstabArcsecProPx = 1): Kern {
  const daten = new Float32Array(groesse * groesse);
  const r = (groesse - 1) / 2;
  daten[(r + dy) * groesse + (r + dx)] = 1;
  return kernAusDaten(groesse, daten, `delta${groesse}|${dx}|${dy}`, massstabArcsecProPx);
}

/** Kasten: alle Werte gleich, Summe 1. */
export function kastenKern(groesse = 3, massstabArcsecProPx = 1): Kern {
  const daten = new Float32Array(groesse * groesse).fill(1 / (groesse * groesse));
  return kernAusDaten(groesse, daten, `kasten${groesse}`, massstabArcsecProPx);
}
