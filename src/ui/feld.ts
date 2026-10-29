// Hilfsmodul fuer Formularfelder (gemeinsam fuer #17 und #18): Zahlenfeld mit Hinweisplatz,
// Regler gekoppelt mit Zahlenfeld, Auswahlliste mit Gruppen. Vanilla DOM, kein Framework
// (ADR-0001). Die Felder kennen nur ihren Pfad in der Konfiguration (wie begrenze ihn im Hinweis
// nennt) und einen Rueckruf; was eine Aenderung bedeutet, entscheidet das Formular ueber die
// Steuerung. Zahlen erscheinen mit Dezimalkomma (format.ts), gelesen wird Komma oder Punkt.

import type { Hinweis } from "../physik";
import { TEXTE } from "../texte";
import { zahl } from "./format";
import { hilfesymbol } from "./hilfe";

/** Liest eine Dezimalzahl mit Komma oder Punkt, Leerzeichen am Rand erlaubt; sonst NaN. */
export function leseDezimal(text: string): number {
  const t = text.trim().replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return Number.NaN;
  return Number(t);
}

/**
 * Wert, den das Feld nach einer Eingabe zeigt: der Wert, mit dem gerechnet wird (verwendet, aus
 * der begrenzten Konfiguration), sonst bei einem Schnitt der Wert aus dem Hinweis, sonst die
 * Eingabe. So zeigt die Hoehe nach der Eingabe 47 die verwendeten 45 und das Seeing nach 1,15
 * die verwendeten 1,2 (toFixed allein zeigte 1,1), auch wenn sich die Konfiguration nicht aendert
 * und kein Beobachter das Feld nachzieht.
 */
export function angezeigterWert(eingabe: number, hinweis: Hinweis | undefined, verwendet?: number): number {
  return verwendet ?? hinweis?.wert ?? eingabe;
}

/**
 * Text des Hinweises neben dem Feld (A-F8): die Eingabe mit so vielen Nachkommastellen, wie sie
 * hat (hoechstens 3, ohne Nullen am Ende; 0,44 nicht als 0,4), der verwendete Wert mit den
 * Stellen des Felds.
 */
export function hinweistext(h: Hinweis, stellen: number): string {
  const eingabe = Math.round(h.eingabe * 1000) / 1000;
  const nachkomma = /\.(\d+)$/.exec(String(eingabe))?.[1]?.length ?? 0;
  return TEXTE.feld.geschnitten(zahl(eingabe, nachkomma), zahl(h.wert, stellen));
}

/** Der Hinweis von begrenze zu genau diesem Feld, sonst undefined. */
export function hinweisFuer(hinweise: readonly Hinweis[], feld: string): Hinweis | undefined {
  return hinweise.find((h) => h.feld === feld);
}

interface Feldbasis {
  /** id des Eingabeelements, eindeutig auf der Seite. */
  id: string;
  beschriftung: string;
  /** Hilfetext fuer das Infosymbol (A-D6); ohne Angabe kein Symbol. */
  hilfe?: string;
}

export interface ZahlOptionen extends Feldbasis {
  /** Pfad in der Konfiguration wie in Hinweis.feld, z. B. "bedingungen.seeingFwhmArcsec". */
  feld: string;
  einheit?: string;
  min: number;
  max: number;
  schritt: number;
  /** Nachkommastellen der Anzeige. */
  stellen: number;
  /**
   * Ab grob.ab ein groeberer Schritt mit weniger Nachkommastellen (Grenze.grob aus physik, die
   * Trennung des freien Paars: 0,05'' unter 10'', 1'' ab 10''). Ohne Angabe gelten schritt und stellen.
   * Nur fuer zahlenfeld, nicht fuer regler.
   */
  grob?: { ab: number; schritt: number; stellen: number };
  wert: number;
  /** Gueltige Eingabe uebernehmen; liefert die Hinweise von Steuerung.aendere. */
  beiAenderung(wert: number): readonly Hinweis[];
  /**
   * Wert im Mass des Felds, mit dem nach beiAenderung gerechnet wird (begrenzt und auf den
   * Schritt gerundet); das Feld zeigt ihn statt der Eingabe. Ohne Angabe oder bei undefined
   * zeigt es den Wert aus dem Hinweis oder die Eingabe.
   */
  verwendet?(): number | undefined;
}

export interface Zahlenfeld {
  element: HTMLElement;
  eingabe: HTMLInputElement;
  /** Setzt den angezeigten Wert, ohne beiAenderung zu rufen (z. B. nach einer anderen Aenderung). */
  setzeWert(wert: number): void;
}

export interface Regler extends Zahlenfeld {
  regler: HTMLInputElement;
}

export interface AuswahlOption {
  wert: string;
  text: string;
}

export interface AuswahlGruppe {
  /** Beschriftung der optgroup; ohne Angabe stehen die Optionen ohne Gruppe. */
  beschriftung?: string;
  optionen: readonly AuswahlOption[];
}

export interface AuswahlOptionen extends Feldbasis {
  gruppen: readonly AuswahlGruppe[];
  wert: string;
  beiAenderung(wert: string): void;
}

export interface Auswahl {
  element: HTMLElement;
  auswahl: HTMLSelectElement;
  setzeWert(wert: string): void;
}

/**
 * Schritt und Nachkommastellen eines Felds beim Wert wert: ab grob.ab die groben, sonst die des
 * Felds. Dieselbe Regel wie begrenze (physik), damit das Zahlenfeld genau den Wert zeigt, mit dem
 * gerechnet wird (34 statt 34,05).
 */
export function rasterBei(o: Pick<ZahlOptionen, "schritt" | "stellen" | "grob">, wert: number): { schritt: number; stellen: number } {
  return o.grob !== undefined && wert >= o.grob.ab ? { schritt: o.grob.schritt, stellen: o.grob.stellen } : { schritt: o.schritt, stellen: o.stellen };
}

/** Zeile mit Beschriftung (und Infosymbol) ueber dem Eingabeteil. */
function feldrahmen(d: Document, o: Feldbasis): { element: HTMLElement; zeile: HTMLElement } {
  const element = d.createElement("div");
  element.className = "feld";
  const kopf = d.createElement("div");
  kopf.className = "feld-kopf";
  const label = d.createElement("label");
  label.htmlFor = o.id;
  label.textContent = o.beschriftung;
  kopf.append(label);
  if (o.hilfe !== undefined) kopf.append(hilfesymbol(d, `${o.id}-hilfe`, o.hilfe, o.beschriftung));
  const zeile = d.createElement("div");
  zeile.className = "feld-zeile";
  element.append(kopf, zeile);
  return { element, zeile };
}

/** Textfeld fuer Zahlen samt Einheit und Hinweisplatz; uebernimmt beim Verlassen (change). */
function zahlteil(d: Document, o: ZahlOptionen, zeile: HTMLElement, element: HTMLElement, beiWert?: (wert: number) => void): Zahlenfeld {
  const eingabe = d.createElement("input");
  eingabe.type = "text";
  eingabe.inputMode = "decimal";
  eingabe.id = o.id;
  eingabe.className = "feld-zahl";
  eingabe.autocomplete = "off";
  zeile.append(eingabe);
  if (o.einheit !== undefined) {
    const einheit = d.createElement("span");
    einheit.className = "feld-einheit";
    einheit.textContent = o.einheit;
    zeile.append(einheit);
  }
  const hinweis = d.createElement("p");
  hinweis.className = "feld-hinweis";
  hinweis.id = `${o.id}-hinweis`;
  hinweis.hidden = true;
  hinweis.setAttribute("aria-live", "polite");
  element.append(hinweis);

  let aktuell = o.wert;
  const zeigeHinweis = (h: Hinweis | undefined): void => {
    hinweis.hidden = h === undefined;
    hinweis.textContent = h === undefined ? "" : hinweistext(h, rasterBei(o, h.wert).stellen);
    if (h === undefined) eingabe.removeAttribute("aria-describedby");
    else eingabe.setAttribute("aria-describedby", hinweis.id);
  };
  const zeigeWert = (wert: number): void => {
    aktuell = wert;
    eingabe.value = zahl(wert, rasterBei(o, wert).stellen);
    beiWert?.(wert);
  };
  // Ein Wert von aussen (anderes Feld, Beobachter) macht einen alten Hinweis ungueltig.
  const setzeWert = (wert: number): void => {
    zeigeHinweis(undefined);
    zeigeWert(wert);
  };
  const uebernimm = (wert: number): void => {
    const h = hinweisFuer(o.beiAenderung(wert), o.feld);
    zeigeHinweis(h);
    zeigeWert(angezeigterWert(wert, h, o.verwendet?.()));
  };

  zeigeWert(o.wert);
  eingabe.addEventListener("change", () => {
    const wert = leseDezimal(eingabe.value);
    // Unlesbares wird verworfen; der alte Wert erscheint wieder.
    if (Number.isNaN(wert)) setzeWert(aktuell);
    else uebernimm(wert);
  });
  return { element, eingabe, setzeWert };
}

/** Zahlenfeld mit Beschriftung, Einheit und Hinweis bei geschnittenen Werten (A-F8). */
export function zahlenfeld(d: Document, o: ZahlOptionen): Zahlenfeld {
  const { element, zeile } = feldrahmen(d, o);
  return zahlteil(d, o, zeile, element);
}

/**
 * Regler mit Zahlenfeld daneben (z. B. Seeing, A-B1). grob gilt nur fuer das Zahlenfeld: der
 * Browser zaehlt die Schritte eines Reglers ab min, ein Wechsel des Schritts passt nicht dazu. Der Regler rechnet beim Ziehen live
 * (input, A-D7), das Zahlenfeld beim Verlassen; beide zeigen immer denselben Wert.
 */
export function regler(d: Document, o: ZahlOptionen): Regler {
  const { element, zeile } = feldrahmen(d, o);
  const r = d.createElement("input");
  r.type = "range";
  r.className = "feld-regler";
  r.min = String(o.min);
  r.max = String(o.max);
  r.step = String(o.schritt);
  r.setAttribute("aria-label", o.beschriftung);
  zeile.append(r);
  const feld = zahlteil(d, o, zeile, element, (wert) => {
    r.value = String(wert);
  });
  // Der Regler bleibt in den Grenzen; Hinweise gibt es nur aus dem Zahlenfeld. Eine Aenderung
  // mit gleichem Wert (change nach input) verwirft die Steuerung, deshalb genuegt input.
  r.addEventListener("input", () => {
    const wert = Number(r.value);
    feld.setzeWert(wert);
    o.beiAenderung(wert);
  });
  return { ...feld, regler: r };
}

/** option-Elemente zu den Eintraegen, fuer select oder optgroup. */
export function optionselemente(d: Document, optionen: readonly AuswahlOption[]): HTMLOptionElement[] {
  return optionen.map((o) => {
    const e = d.createElement("option");
    e.value = o.wert;
    e.textContent = o.text;
    return e;
  });
}

/** Auswahlliste mit optionalen Gruppen (z. B. Auge, Fernglaeser, Fernrohre, A-F2). */
export function auswahl(d: Document, o: AuswahlOptionen): Auswahl {
  const { element, zeile } = feldrahmen(d, o);
  const s = d.createElement("select");
  s.id = o.id;
  s.className = "feld-auswahl";
  for (const g of o.gruppen) {
    let ziel: HTMLSelectElement | HTMLOptGroupElement = s;
    if (g.beschriftung !== undefined) {
      ziel = d.createElement("optgroup");
      ziel.label = g.beschriftung;
      s.append(ziel);
    }
    ziel.append(...optionselemente(d, g.optionen));
  }
  zeile.append(s);
  const setzeWert = (wert: string): void => {
    s.value = wert;
  };
  setzeWert(o.wert);
  s.addEventListener("change", () => o.beiAenderung(s.value));
  return { element, auswahl: s, setzeWert };
}
