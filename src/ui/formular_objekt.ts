// Formular Objekt und Zustand (A-X1): Auswahl aus objekte.json, gruppiert nach Objektklasse
// (A-D18), dazu das freie Paar (A-Z9) mit seinen fuenf Eingaben.
// starte ruft baueFormularObjekt(platz, steuerung) einmal nach dem Laden der Daten auf. Das
// Formular liest die Werte aus steuerung.konfiguration, haengt sich mit steuerung.beobachte an
// Aenderungen von aussen und meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die
// URL, rechnet neu). Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts.
// Objekte und Zustaende kommen generisch aus dem Katalog: ein neues Objekt in objekte.json
// erscheint ohne Codeaenderung. Ein Objektwechsel waehlt den ersten Zustand; solange die
// Steuerung dessen Bild nachlaedt (Phase laedt), steht unter der Auswahl ein Ladehinweis.
// Das freie Paar steht als eigener Eintrag (Wert KENNUNG_FREIES_PAAR) am Ende der Doppelsterne;
// ist es gewaehlt, ersetzen seine Eingaben die Zustandsauswahl. Den Zustand bildet freiesPaar aus
// physik, begrenzt wird wie ueberall ueber begrenze in Steuerung.aendere.

import { findeZustand, type Objekt, objektzustand, type ZustandEintrag } from "../daten";
import { freiesPaar, GRENZEN, type Hinweis, KENNUNG_FREIES_PAAR, type Konfiguration, OBJEKTKLASSEN, type Paareingaben } from "../physik";
import { TEXTE } from "../texte";
import { type Kataloge, PAAR_VORGABE } from "../zustand";
import { auswahl, type AuswahlGruppe, type AuswahlOption, optionselemente, rasterBei, type Zahlenfeld, zahlenfeld, type ZahlOptionen } from "./feld";
import { zahl } from "./format";
import type { Steuerung } from "./steuerung";

const T = TEXTE.objekt;

/**
 * Gruppen der Objektauswahl nach Objektklasse (A-D18) in der Reihenfolge von OBJEKTKLASSEN, darin die
 * Objekte in Katalogreihenfolge; leere Gruppen fallen weg. Das freie Paar steht immer am Ende der
 * Doppelsterne.
 */
export function objektgruppen(objekte: readonly Objekt[]): AuswahlGruppe[] {
  const gruppen: AuswahlGruppe[] = [];
  for (const klasse of OBJEKTKLASSEN) {
    const optionen: AuswahlOption[] = objekte.filter((o) => o.klasse === klasse).map((o) => ({ wert: o.id, text: o.name }));
    if (klasse === "doppelstern") optionen.push({ wert: KENNUNG_FREIES_PAAR, text: T.freiesPaar });
    if (optionen.length > 0) gruppen.push({ beschriftung: T.klassen[klasse], optionen });
  }
  return gruppen;
}

/** Optionen der Zustandsauswahl eines Objekts in der Reihenfolge des Katalogs. */
export function zustandsoptionen(objekt: Objekt): AuswahlOption[] {
  return objekt.zustaende.map((z) => ({ wert: z.id, text: z.name }));
}

/**
 * Kopie von k mit dem Zustand zustandId; undefined, wenn es den Zustand nicht gibt. Wirft
 * DatenFehler bei fehlendem Bildnachweis (schliesst ladeObjekte schon aus).
 */
export function mitZustand(kataloge: Kataloge, k: Konfiguration, zustandId: string): Konfiguration | undefined {
  const objekt = objektzustand(kataloge.objekte, kataloge.nachweise, zustandId);
  return objekt === undefined ? undefined : { ...k, objekt };
}

/**
 * Kopie von k mit dem freien Paar; teil ueberschreibt einzelne Eingaben. Die uebrigen kommen aus dem
 * Paar von k, ist k kein freies Paar, aus PAAR_VORGABE (A-Z9). Nicht begrenzt, das tut die Steuerung.
 */
export function mitPaar(k: Konfiguration, teil: Partial<Paareingaben> = {}): Konfiguration {
  return { ...k, objekt: freiesPaar({ ...(k.objekt.paar ?? PAAR_VORGABE), ...teil }) };
}

/**
 * Kopie von k mit dem ersten Zustand des Objekts objektId; undefined, wenn es Objekt oder Zustand
 * nicht gibt. KENNUNG_FREIES_PAAR waehlt das freie Paar (mitPaar).
 */
export function mitObjekt(kataloge: Kataloge, k: Konfiguration, objektId: string): Konfiguration | undefined {
  if (objektId === KENNUNG_FREIES_PAAR) return mitPaar(k);
  const erster = kataloge.objekte.find((o) => o.id === objektId)?.zustaende[0];
  return erster === undefined ? undefined : mitZustand(kataloge, k, erster.id);
}

/** Objekt und Zustandseintrag zur aktuellen Konfiguration; undefined, wenn der Zustand nicht im Katalog steht. */
export function gewaehlt(kataloge: Kataloge, k: Konfiguration): { objekt: Objekt; zustand: ZustandEintrag } | undefined {
  return findeZustand(kataloge.objekte, k.objekt.kennung);
}

/** Wert der Objektauswahl zu k: KENNUNG_FREIES_PAAR beim freien Paar, sonst die Objekt-id, unbekannt "". */
export function objektwert(kataloge: Kataloge, k: Konfiguration): string {
  if (k.objekt.paar !== undefined) return KENNUNG_FREIES_PAAR;
  return gewaehlt(kataloge, k)?.objekt.id ?? "";
}

/** Die fuenf Eingaben des freien Paars: Schluessel in Paareingaben, Grenze, Nachkommastellen, Texte. */
const PAARFELDER = [
  { schluessel: "trennungArcsec", grenze: GRENZEN.trennungArcsec, stellen: 2, grobStellen: 0, beschriftung: T.paar.trennung, hilfe: T.paar.trennungHilfe, einheit: TEXTE.einheiten.bogensekunde },
  { schluessel: "magnitudeA", grenze: GRENZEN.magnitudeA, stellen: 1, beschriftung: T.paar.magnitudeA, hilfe: T.paar.magnitudeHilfe, einheit: T.paar.einheitMag },
  { schluessel: "magnitudeB", grenze: GRENZEN.magnitudeB, stellen: 1, beschriftung: T.paar.magnitudeB, hilfe: T.paar.magnitudeHilfe, einheit: T.paar.einheitMag },
  { schluessel: "bvA", grenze: GRENZEN.bvA, stellen: 2, beschriftung: T.paar.bvA, hilfe: T.paar.bvHilfe, einheit: T.paar.einheitMag },
  { schluessel: "bvB", grenze: GRENZEN.bvB, stellen: 2, beschriftung: T.paar.bvB, hilfe: T.paar.bvHilfe, einheit: T.paar.einheitMag }
] as const;

/** Schluessel einer Eingabe des freien Paars. */
export type Paarschluessel = (typeof PAARFELDER)[number]["schluessel"];

/**
 * Feldoptionen einer Eingabe des freien Paars: Bereich und Schritt aus GRENZEN (begrenze), bei der
 * Trennung auch der grobe Schritt ab 10'' (Grenze.grob) mit 0 Nachkommastellen, damit das Feld
 * 34 zeigt, wenn 34,05 eingegeben und auf 34 gerundet wurde.
 */
export function paarfeldOptionen(
  schluessel: Paarschluessel,
  wert: number,
  beiAenderung: (wert: number) => readonly Hinweis[],
  verwendet?: () => number | undefined
): ZahlOptionen {
  const f = PAARFELDER.find((p) => p.schluessel === schluessel)!;
  const g = f.grenze;
  const grob = "grob" in g && "grobStellen" in f ? { ab: g.grob.ab, schritt: g.grob.schritt, stellen: f.grobStellen } : undefined;
  return {
    id: `objekt-paar-${schluessel}`,
    feld: g.feld,
    beschriftung: f.beschriftung,
    hilfe: f.hilfe,
    einheit: f.einheit,
    min: g.min,
    max: g.max,
    schritt: g.schritt,
    stellen: f.stellen,
    ...(grob === undefined ? {} : { grob }),
    wert,
    beiAenderung,
    ...(verwendet === undefined ? {} : { verwendet })
  };
}

/** Ersetzt die Optionen eines select. */
function setzeOptionen(s: HTMLSelectElement, optionen: readonly AuswahlOption[]): void {
  s.replaceChildren(...optionselemente(s.ownerDocument, optionen));
}

export function baueFormularObjekt(platz: HTMLElement, steuerung: Steuerung): void {
  const d = platz.ownerDocument;
  const H = TEXTE.hilfe;
  const kataloge = steuerung.kataloge;
  const start = gewaehlt(kataloge, steuerung.konfiguration);

  // Eine Aenderung, die an kaputten Daten scheitert, laesst die Konfiguration stehen; der
  // Abgleich unten stellt die Auswahl dann auf den alten Wert zurueck.
  const uebernimm = (baue: () => Konfiguration | undefined): void => {
    let neu: Konfiguration | undefined;
    try {
      neu = baue();
    } catch (e) {
      console.error(e);
    }
    if (neu !== undefined) steuerung.aendere(neu);
    else gleicheAb(steuerung.konfiguration);
  };

  const ueberschrift = d.createElement("h2");
  ueberschrift.className = "formular-ueberschrift";
  ueberschrift.textContent = T.ueberschrift;

  const objekt = auswahl(d, {
    id: "objekt-wahl",
    beschriftung: T.objekt,
    hilfe: H.objekt,
    gruppen: objektgruppen(kataloge.objekte),
    wert: objektwert(kataloge, steuerung.konfiguration),
    beiAenderung: (id) => uebernimm(() => mitObjekt(kataloge, steuerung.konfiguration, id))
  });

  const zustand = auswahl(d, {
    id: "objekt-zustand",
    beschriftung: T.zustand,
    hilfe: H.zustand,
    gruppen: [{ optionen: start === undefined ? [] : zustandsoptionen(start.objekt) }],
    wert: start?.zustand.id ?? "",
    beiAenderung: (id) => uebernimm(() => mitZustand(kataloge, steuerung.konfiguration, id))
  });

  // Hinweis des Zustands aus objekte.json (hinweis_hilfe, z. B. Mars 6" gibbos, A-X1).
  const hinweis = d.createElement("p");
  hinweis.className = "feld-anzeige";
  hinweis.id = "objekt-zustand-hinweis";
  zustand.element.append(hinweis);
  zustand.auswahl.setAttribute("aria-describedby", hinweis.id);

  const laedt = d.createElement("p");
  laedt.className = "objekt-laedt";
  laedt.textContent = T.laedt;
  laedt.hidden = true;
  // Die Statuszeile meldet das Laden schon per aria-live; hier nur fuer das Auge.
  laedt.setAttribute("aria-hidden", "true");

  // Eingaben des freien Paars (A-Z9), sichtbar nur, wenn es gewaehlt ist.
  const paar = d.createElement("div");
  paar.className = "objekt-paar";
  paar.id = "objekt-paar";
  const startPaar = steuerung.konfiguration.objekt.paar ?? PAAR_VORGABE;
  const paarfelder = new Map<Paarschluessel, { feld: Zahlenfeld; optionen: ZahlOptionen; bekannt: number }>();
  for (const { schluessel } of PAARFELDER) {
    const optionen = paarfeldOptionen(
      schluessel,
      startPaar[schluessel],
      (wert) => steuerung.aendere(mitPaar(steuerung.konfiguration, { [schluessel]: wert })),
      () => steuerung.konfiguration.objekt.paar?.[schluessel]
    );
    const feld = zahlenfeld(d, optionen);
    paarfelder.set(schluessel, { feld, optionen, bekannt: startPaar[schluessel] });
    paar.append(feld.element);
  }

  platz.replaceChildren(ueberschrift, objekt.element, zustand.element, paar, laedt);

  let objektId = start?.objekt.id;
  function gleicheAb(k: Konfiguration): void {
    const fund = gewaehlt(kataloge, k);
    if (fund?.objekt.id !== objektId) {
      objektId = fund?.objekt.id;
      setzeOptionen(zustand.auswahl, fund === undefined ? [] : zustandsoptionen(fund.objekt));
    }
    const wert = objektwert(kataloge, k);
    if (objekt.auswahl.value !== wert) objekt.setzeWert(wert);
    if (zustand.auswahl.value !== (fund?.zustand.id ?? "")) zustand.setzeWert(fund?.zustand.id ?? "");
    const frei = k.objekt.paar;
    zustand.element.hidden = frei !== undefined;
    paar.hidden = frei === undefined;
    // Wie abgleich in formular_bedingungen.ts: nur ein neuer Wert ersetzt den Text, so bleiben
    // Hinweis und angefangene Eingabe bei einer Meldung der Rechnung stehen.
    if (frei !== undefined) {
      for (const [schluessel, p] of paarfelder) {
        const neu = frei[schluessel];
        if (neu === p.bekannt) continue;
        p.bekannt = neu;
        if (p.feld.eingabe.value !== zahl(neu, rasterBei(p.optionen, neu).stellen)) p.feld.setzeWert(neu);
      }
    }
    const text = fund?.zustand.hinweisHilfe ?? "";
    if (hinweis.textContent !== text) hinweis.textContent = text;
    hinweis.hidden = text === "";
  }

  steuerung.beobachte((stand) => {
    gleicheAb(stand.konfiguration);
    laedt.hidden = stand.phase !== "laedt";
  });
}
