// Feste Startkonfiguration nach A-D9: Refraktor 80/600, Okular 10 mm mit 50 Grad, Mond nach dem
// ersten Viertel (mond_ev), Seeing 2 Bogensekunden, Bortle 5, klar, Hoehe 45 Grad.
//
// Uebergang fuer den Durchstich (Issue #9): Diese Funktion entfaellt, sobald die UI mit #17/#18
// auf voreinstellung() aus src/zustand/ (Issue #16) umgestellt ist.

import type { Konfiguration } from "../physik";
import { type Bildnachweis, findeZustand, type Geraeteeintrag, mitOkular, type Objekt, objektzustand } from "../daten";

export const START_GERAET_ID = "refraktor-80-600-ed";
export const START_ZUSTAND_ID = "mond_ev";

/** Konfiguration und der Bildnachweis des Quellbilds (fuer die Kachelquelle). */
export interface Startkonfiguration {
  konfiguration: Konfiguration;
  nachweis: Bildnachweis;
}

/** Baut die Startkonfiguration aus den geladenen Listen; fehlt ein Eintrag, ist das ein Datenfehler. */
export function startkonfiguration(
  geraete: readonly Geraeteeintrag[],
  objekte: readonly Objekt[],
  nachweise: readonly Bildnachweis[]
): Startkonfiguration {
  const eintrag = geraete.find((g) => g.id === START_GERAET_ID);
  if (eintrag === undefined) throw new Error(`ui: Geraet "${START_GERAET_ID}" fehlt in der Geraeteliste`);
  const objekt = objektzustand(objekte, nachweise, START_ZUSTAND_ID);
  const bild = findeZustand(objekte, START_ZUSTAND_ID)?.zustand.bild;
  const nachweis = nachweise.find((n) => n.id === bild);
  if (objekt === undefined || nachweis === undefined) throw new Error(`ui: Zustand "${START_ZUSTAND_ID}" fehlt in den Objektdaten`);
  return {
    konfiguration: {
      geraet: mitOkular(eintrag.geraet, { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }),
      objekt,
      bedingungen: { seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 }
    },
    nachweis
  };
}
