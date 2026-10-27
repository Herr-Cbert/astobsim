// Formular Objekt und Zustand (A-X1): Auswahl aus objekte.json.
// starte ruft baueFormularObjekt(platz, steuerung) einmal nach dem Laden der Daten auf. Das
// Formular liest die Werte aus steuerung.konfiguration, haengt sich mit steuerung.beobachte an
// Aenderungen von aussen und meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die
// URL, rechnet neu). Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts.
// Objekte und Zustaende kommen generisch aus dem Katalog: ein neues Objekt in objekte.json
// erscheint ohne Codeaenderung. Ein Objektwechsel waehlt den ersten Zustand; solange die
// Steuerung dessen Bild nachlaedt (Phase laedt), steht unter der Auswahl ein Ladehinweis.

import { findeZustand, type Objekt, objektzustand, type ZustandEintrag } from "../daten";
import type { Konfiguration } from "../physik";
import { TEXTE } from "../texte";
import type { Kataloge } from "../zustand";
import { auswahl, type AuswahlOption } from "./feld";
import type { Steuerung } from "./steuerung";

const T = TEXTE.objekt;

/** Optionen der Objektauswahl in der Reihenfolge des Katalogs. */
export function objektoptionen(objekte: readonly Objekt[]): AuswahlOption[] {
  return objekte.map((o) => ({ wert: o.id, text: o.name }));
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

/** Kopie von k mit dem ersten Zustand des Objekts objektId; undefined, wenn es Objekt oder Zustand nicht gibt. */
export function mitObjekt(kataloge: Kataloge, k: Konfiguration, objektId: string): Konfiguration | undefined {
  const erster = kataloge.objekte.find((o) => o.id === objektId)?.zustaende[0];
  return erster === undefined ? undefined : mitZustand(kataloge, k, erster.id);
}

/** Objekt und Zustandseintrag zur aktuellen Konfiguration; undefined, wenn der Zustand nicht im Katalog steht. */
export function gewaehlt(kataloge: Kataloge, k: Konfiguration): { objekt: Objekt; zustand: ZustandEintrag } | undefined {
  return findeZustand(kataloge.objekte, k.objekt.kennung);
}

/** Ersetzt die Optionen eines select. */
function setzeOptionen(s: HTMLSelectElement, optionen: readonly AuswahlOption[]): void {
  const d = s.ownerDocument;
  s.replaceChildren(
    ...optionen.map((o) => {
      const e = d.createElement("option");
      e.value = o.wert;
      e.textContent = o.text;
      return e;
    })
  );
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
    gruppen: [{ optionen: objektoptionen(kataloge.objekte) }],
    wert: start?.objekt.id ?? "",
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

  platz.replaceChildren(ueberschrift, objekt.element, zustand.element, laedt);

  let objektId = start?.objekt.id;
  function gleicheAb(k: Konfiguration): void {
    const fund = gewaehlt(kataloge, k);
    if (fund?.objekt.id !== objektId) {
      objektId = fund?.objekt.id;
      setzeOptionen(zustand.auswahl, fund === undefined ? [] : zustandsoptionen(fund.objekt));
    }
    if (objekt.auswahl.value !== (fund?.objekt.id ?? "")) objekt.setzeWert(fund?.objekt.id ?? "");
    if (zustand.auswahl.value !== (fund?.zustand.id ?? "")) zustand.setzeWert(fund?.zustand.id ?? "");
    const text = fund?.zustand.hinweisHilfe ?? "";
    if (hinweis.textContent !== text) hinweis.textContent = text;
    hinweis.hidden = text === "";
  }

  steuerung.beobachte((stand) => {
    gleicheAb(stand.konfiguration);
    laedt.hidden = stand.phase !== "laedt";
  });
}
