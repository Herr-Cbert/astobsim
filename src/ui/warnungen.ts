// Warnungen neben dem Gesichtsfeld (A-D5): Austrittspupille ueber 6 mm, unter 0,5 mm,
// Vergroesserung ueber 2 D. Die Schwellen prueft physik (auswerten liefert Warnung[]); hier wird
// nur beschriftet. Unter 0,5 mm und ueber 2 D fallen zusammen (AP = D / V); dann erscheint eine
// Zeile mit beiden Werten statt zweier gleichbedeutender Zeilen.

import type { Warnung } from "../physik";
import { TEXTE } from "../texte";
import { hilfesymbol } from "./hilfe";
import { austrittspupille } from "./infopanel";
import { zahl } from "./format";

export interface Warnzeile {
  art: Warnung["art"];
  text: string;
  /** Hilfetext (A-D6) und Thema fuer die Beschriftung des Infosymbols. */
  hilfe: string;
  thema: string;
}

const W = TEXTE.warnungen;

const mm = austrittspupille;

/** Die Zeilen in fester Reihenfolge (Austrittspupille gross, Vergroesserung, Austrittspupille klein). */
export function warnzeilen(warnungen: readonly Warnung[]): Warnzeile[] {
  const ueber6 = warnungen.find((w) => w.art === "ap-ueber-6");
  const unter05 = warnungen.find((w) => w.art === "ap-unter-0-5");
  const v2d = warnungen.find((w) => w.art === "v-ueber-2d");
  const zeilen: Warnzeile[] = [];
  if (ueber6) zeilen.push({ art: ueber6.art, text: W.apUeber6(mm(ueber6.wert), zahl(ueber6.grenze, 0)), hilfe: W.apUeber6Hilfe, thema: W.apUeber6Thema });
  if (v2d) {
    const v = zahl(v2d.wert, 0);
    const grenze = zahl(v2d.grenze, 0);
    zeilen.push({
      art: v2d.art,
      text: unter05 ? W.vUeber2dMitAp(v, grenze, mm(unter05.wert)) : W.vUeber2d(v, grenze),
      hilfe: unter05 ? `${W.vUeber2dHilfe} ${W.apUnter05Hilfe}` : W.vUeber2dHilfe,
      thema: W.vUeber2dThema
    });
  } else if (unter05) {
    zeilen.push({ art: unter05.art, text: W.apUnter05(mm(unter05.wert), zahl(unter05.grenze, 1)), hilfe: W.apUnter05Hilfe, thema: W.apUnter05Thema });
  }
  return zeilen;
}

/** Zuletzt angezeigte Zeilen je Element (als JSON), damit gleiche Zeilen nichts neu bauen. */
const angezeigt = new WeakMap<HTMLElement, string>();

/**
 * Schreibt die Warnungen als Liste mit Infosymbol in das Element; ohne Warnung bleibt es leer und
 * verborgen. Gleiche Zeilen wie angezeigt aendern nichts (ein offener Tooltip bleibt stehen).
 */
export function zeigeWarnzeilen(element: HTMLElement, zeilen: readonly Warnzeile[]): void {
  const d = element.ownerDocument;
  const inhalt = JSON.stringify(zeilen);
  if (angezeigt.get(element) === inhalt) return;
  angezeigt.set(element, inhalt);
  if (zeilen.length === 0) {
    element.replaceChildren();
    element.hidden = true;
    return;
  }
  const liste = d.createElement("ul");
  liste.className = "warnungen-liste";
  liste.setAttribute("aria-label", W.ueberschrift);
  for (const z of zeilen) {
    const li = d.createElement("li");
    li.className = "warnung";
    li.dataset["art"] = z.art;
    const text = d.createElement("span");
    text.textContent = z.text;
    li.append(text, " ", hilfesymbol(d, `warnung-hilfe-${z.art}`, z.hilfe, z.thema));
    liste.append(li);
  }
  element.replaceChildren(liste);
  element.hidden = false;
}
