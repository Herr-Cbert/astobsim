// Voreinstellung: die Startkonfiguration nach A-D9 (80/600-Refraktor, Okular 10 mm 50 Grad,
// Mond nach dem ersten Viertel, Seeing 2", Bortle 5, klar, Hoehe 45 Grad). Geraet und
// Objektzustand kommen aus den Katalogen, damit die Werte nur in daten/ stehen. Fehlt der
// Starteintrag, sind die Daten kaputt: DatenFehler, kein stiller Ersatz.

import { DatenFehler, GERAETE_DATEI, mitOkular, OBJEKTE_DATEI, objektzustand } from "../daten";
import type { Bedingungen, Konfiguration, Okular, Paareingaben } from "../naht/konfiguration";
import type { Kataloge } from "./kataloge";

/** Startwerte nach A-D9; Geraet und Zustand als id in den Katalogen. */
export const VOREINSTELLUNG = {
  geraetId: "refraktor-80-600-ed",
  okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 },
  zustandId: "mond_ev",
  bedingungen: { seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 }
} as const satisfies { geraetId: string; okular: Okular; zustandId: string; bedingungen: Bedingungen };

/**
 * Vorgaben des freien Paars (A-Z9, docs/recherche/doppelsterne.md 3.2): Trennung 2'', Magnituden 5
 * und 6, B-V je 0,6. Rueckfall der URL je Parameter und Startwerte, wenn das Formular auf das
 * freie Paar wechselt.
 */
export const PAAR_VORGABE = {
  trennungArcsec: 2,
  magnitudeA: 5,
  magnitudeB: 6,
  bvA: 0.6,
  bvB: 0.6
} as const satisfies Paareingaben;

/** Startkonfiguration A-D9 als frische Kopie; wirft DatenFehler, wenn Geraet oder Zustand fehlen. */
export function voreinstellung(kataloge: Kataloge): Konfiguration {
  const eintrag = kataloge.geraete.find((e) => e.id === VOREINSTELLUNG.geraetId);
  if (eintrag === undefined) {
    throw new DatenFehler(GERAETE_DATEI, VOREINSTELLUNG.geraetId, "id", "Startgeraet A-D9 fehlt");
  }
  const objekt = objektzustand(kataloge.objekte, kataloge.nachweise, VOREINSTELLUNG.zustandId);
  if (objekt === undefined) {
    throw new DatenFehler(OBJEKTE_DATEI, VOREINSTELLUNG.zustandId, "id", "Startzustand A-D9 fehlt");
  }
  return {
    geraet: mitOkular(eintrag.geraet, VOREINSTELLUNG.okular),
    objekt,
    bedingungen: { ...VOREINSTELLUNG.bedingungen }
  };
}
