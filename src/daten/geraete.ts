// Geraeteliste: laedt und prueft daten/geraete.json (A-F1 bis A-F5, ADR-0003, Felder nach
// docs/recherche/geraete.md Abschnitt 6). Jede Pruefung wirft DatenFehler mit Datei, Eintrag
// und Feld. Die Pruefung ist nur grobe Plausibilitaet; die Bereiche nach A-F8 setzt
// begrenze() in physik, der Vitest-Test prueft die Datei dagegen.
//
// Umrechnung: Obstruktion in der Datei in Prozent des Oeffnungsdurchmessers, in der
// Konfiguration als Verhaeltnis 0 bis 0,5. Die Bauart bleibt Bauart; die Transmission
// leitet physik daraus ab, nicht daten.

import type { Auge, Bauart, Fernglas, Fernrohr, Geraet, Okular } from "../naht/konfiguration";
import { BAUARTEN } from "../naht/konfiguration";
import { DatenFehler } from "./fehler";
import type { Ort } from "./pruefe";
import { alsListe, alsObjekt, ladeJson, optional, text, wahl, zahl } from "./pruefe";

const DATEI = "geraete.json";
const TYPEN = ["fernrohr", "fernglas", "auge"] as const;

/**
 * Vorschlagswerte der Obstruktion je Bauart in Prozent (A-F1, geraete.md Empfehlung).
 * Gilt bei freier Eingabe; Listeneintraege tragen ihre eigenen Werte.
 */
export const OBSTRUKTION_VORSCHLAG_PROZENT = {
  refraktor: 0,
  newton: 25,
  "schmidt-cassegrain": 34,
  maksutov: 31
} as const satisfies Record<Bauart, number>;

/** Verfeinerung fuer kleine schnelle Newtons: Oeffnung bis 150 mm und Blendenzahl f/D bis 5. */
export const OBSTRUKTION_VORSCHLAG_NEWTON_KLEIN = {
  prozent: 32,
  maxOeffnungMm: 150,
  maxBlendenzahl: 5
} as const;

/** Vorschlagswert der Obstruktion in Prozent fuer Bauart, Oeffnung und Brennweite in mm. */
export function vorschlagObstruktionProzent(bauart: Bauart, oeffnungMm: number, brennweiteMm: number): number {
  const klein = OBSTRUKTION_VORSCHLAG_NEWTON_KLEIN;
  if (bauart === "newton" && oeffnungMm <= klein.maxOeffnungMm && brennweiteMm / oeffnungMm <= klein.maxBlendenzahl) {
    return klein.prozent;
  }
  return OBSTRUKTION_VORSCHLAG_PROZENT[bauart];
}

/**
 * Geraet, wie es in der Liste steht. Ein Fernrohr hat hier noch kein Okular: Die Liste
 * enthaelt keine Okulare, das Okular waehlt der Nutzer getrennt (A-F6). mitOkular()
 * macht daraus das Geraet der Konfiguration.
 */
export type Listengeraet = Omit<Fernrohr, "okular"> | Fernglas | Auge;

/** Ein Eintrag der Geraeteliste: id fuer die URL (A-D8), Anzeigename, Hinweis fuer Pflegende. */
export interface Geraeteeintrag {
  id: string;
  name: string;
  kommentar?: string;
  geraet: Listengeraet;
}

/** Geraet der Konfiguration aus einem Listengeraet; das Okular gilt nur fuer Fernrohre. */
export function mitOkular(geraet: Listengeraet, okular: Okular): Geraet {
  return geraet.art === "fernrohr" ? { ...geraet, okular: { ...okular } } : { ...geraet };
}

/** Laedt daten/geraete.json und prueft sie. */
export async function ladeGeraete(): Promise<Geraeteeintrag[]> {
  return pruefeGeraete(await ladeJson(DATEI));
}

/** Prueft den rohen Inhalt von geraete.json und liefert die typisierten Eintraege. */
export function pruefeGeraete(roh: unknown): Geraeteeintrag[] {
  const liste = alsListe(roh, { datei: DATEI, eintrag: "-" }, "-");
  const ids = new Set<string>();
  return liste.map((wert, index) => {
    const obj = alsObjekt(wert, { datei: DATEI, eintrag: String(index) }, "-");
    const eintrag = pruefeEintrag(obj, index);
    if (ids.has(eintrag.id)) {
      throw new DatenFehler(DATEI, eintrag.id, "id", "doppelt vergeben");
    }
    ids.add(eintrag.id);
    return eintrag;
  });
}

function pruefeEintrag(obj: Record<string, unknown>, index: number): Geraeteeintrag {
  const id = text(obj, "id", { datei: DATEI, eintrag: String(index) });
  const ort: Ort = { datei: DATEI, eintrag: id };
  if (!/^[a-z0-9-]+$/.test(id)) throw new DatenFehler(DATEI, id, "id", "nur a-z, 0-9 und - erlaubt");
  const name = text(obj, "name", ort);
  const kommentar = optional(obj, "kommentar", (o, f) => text(o, f, ort));
  const typ = wahl(obj, "typ", ort, TYPEN);

  let geraet: Listengeraet;
  switch (typ) {
    case "fernrohr": {
      const oeffnungMm = zahl(obj, "oeffnung_mm", ort, 1, 1000);
      geraet = {
        art: "fernrohr",
        oeffnungMm,
        brennweiteMm: zahl(obj, "brennweite_mm", ort, 1, 10000),
        obstruktion: zahl(obj, "obstruktion_prozent", ort, 0, 50) / 100,
        bauart: wahl(obj, "bauart", ort, BAUARTEN)
      };
      leer(obj, "vergroesserung", ort, typ);
      leer(obj, "gesichtsfeld_grad", ort, typ);
      break;
    }
    case "fernglas":
      geraet = {
        art: "fernglas",
        oeffnungMm: zahl(obj, "oeffnung_mm", ort, 1, 1000),
        vergroesserung: zahl(obj, "vergroesserung", ort, 1, 100),
        wahresGesichtsfeldGrad: zahl(obj, "gesichtsfeld_grad", ort, 0.1, 30)
      };
      leer(obj, "bauart", ort, typ);
      leer(obj, "brennweite_mm", ort, typ);
      ohneObstruktion(obj, ort);
      break;
    case "auge":
      // Oeffnung und Vergroesserung des Auges sind fest (A-F3); die Datei nennt sie nur
      // zur Dokumentation und darf nicht davon abweichen.
      zahl(obj, "oeffnung_mm", ort, 6, 6);
      zahl(obj, "vergroesserung", ort, 1, 1);
      leer(obj, "bauart", ort, typ);
      leer(obj, "brennweite_mm", ort, typ);
      leer(obj, "gesichtsfeld_grad", ort, typ);
      ohneObstruktion(obj, ort);
      geraet = { art: "auge" };
      break;
  }

  return kommentar === undefined ? { id, name, geraet } : { id, name, kommentar, geraet };
}

/** Feld, das beim Typ nicht vorkommt: fehlt oder null. */
function leer(obj: Record<string, unknown>, feld: string, ort: Ort, typ: string): void {
  if (obj[feld] !== undefined && obj[feld] !== null) {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, `gehoert nicht zu typ ${typ}, null erwartet`);
  }
}

/** Obstruktion bei Fernglas und Auge: fehlt, null oder 0. */
function ohneObstruktion(obj: Record<string, unknown>, ort: Ort): void {
  optional(obj, "obstruktion_prozent", (o, f) => zahl(o, f, ort, 0, 0));
}
