// Infopanel neben dem Gesichtsfeld (A-D4): Vergroesserung, wahres Gesichtsfeld, Austrittspupille,
// Beugungsgrenze (Rayleigh, Dawes), Seeing am Objekt, Augengrenze und die dominante Grenze.
// Die Werte rechnet physik (Anzeigewerte aus auswerten); hier wird nur beschriftet und formatiert.

import type { Anzeigewerte } from "../physik";
import { TEXTE } from "../texte";
import { zahl } from "./format";
import { hilfesymbol } from "./hilfe";

export interface Infozeile {
  beschriftung: string;
  wert: string;
  /** Hilfetext zur Zahl (A-D6, TEXTE.hilfe.anzeige aus #18); gesetzt, erscheint ein Infosymbol. */
  hilfe?: string;
}

const E = TEXTE.einheiten;

/** Bogensekunden mit zwei Nachkommastellen, z. B. 1,73 mit dem Bogensekundenzeichen aus TEXTE.einheiten. */
function bogensekunden(wert: number): string {
  return `${zahl(wert, 2)}${E.bogensekunde}`;
}

/** Austrittspupille ohne Einheit: unter 1 mm zwei Nachkommastellen (0,45 nicht als 0,5), sonst eine. */
export function austrittspupille(mm: number): string {
  return zahl(mm, apStellen(mm));
}

/** Stellen der Austrittspupille, gewaehlt am gerundeten Wert (0,996 wird 1,0, nicht 1,00). */
export function apStellen(mm: number): number {
  return Number(mm.toFixed(2)) < 1 ? 2 : 1;
}

/** Die Zeilen des Infopanels in fester Reihenfolge. */
export function infozeilen(anzeige: Anzeigewerte): Infozeile[] {
  const a = anzeige.aufloesung;
  const gf = anzeige.wahresGesichtsfeldGrad;
  const I = TEXTE.info;
  return [
    { beschriftung: I.vergroesserung, wert: `${zahl(anzeige.vergroesserung, 0)}${E.fach}` },
    { beschriftung: I.wahresGesichtsfeld, wert: `${zahl(gf, 2)}${E.grad} (${zahl(gf * 60, 0)}${E.bogenminute})` },
    { beschriftung: I.austrittspupille, wert: `${austrittspupille(anzeige.austrittspupilleMm)} ${E.mm}` },
    { beschriftung: I.rayleigh, wert: bogensekunden(a.rayleighArcsec) },
    { beschriftung: I.dawes, wert: bogensekunden(a.dawesArcsec) },
    { beschriftung: I.seeing, wert: bogensekunden(a.seeingFwhmArcsec) },
    { beschriftung: I.auge, wert: bogensekunden(a.augeFwhmArcsec) },
    { beschriftung: I.dominant, wert: TEXTE.grenzen[a.dominant] }
  ];
}

/**
 * Schreibt die Zeilen als Definitionsliste in das Element. Haben die Zeilen dieselben
 * Beschriftungen und Hilfetexte wie die angezeigten, werden nur die Werte ersetzt: ein offener
 * Tooltip bleibt beim Reglerzug stehen. Sonst wird die Liste neu gebaut.
 */
export function zeigeInfozeilen(element: HTMLElement, zeilen: readonly Infozeile[]): void {
  const dokument = element.ownerDocument;
  const form = JSON.stringify(zeilen.map((z) => [z.beschriftung, z.hilfe ?? null]));
  const vorhanden = element.querySelector<HTMLElement>(":scope > dl.info-liste");
  if (vorhanden !== null && vorhanden.dataset["form"] === form) {
    const werte = vorhanden.querySelectorAll(":scope > dd");
    zeilen.forEach((z, i) => {
      const dd = werte[i];
      if (dd !== undefined && dd.textContent !== z.wert) dd.textContent = z.wert;
    });
    return;
  }
  const liste = dokument.createElement("dl");
  liste.className = "info-liste";
  liste.dataset["form"] = form;
  zeilen.forEach((z, i) => {
    const dt = dokument.createElement("dt");
    dt.textContent = z.beschriftung;
    if (z.hilfe !== undefined) dt.append(" ", hilfesymbol(dokument, `info-hilfe-${i}`, z.hilfe, z.beschriftung));
    const dd = dokument.createElement("dd");
    dd.textContent = z.wert;
    liste.append(dt, dd);
  });
  element.replaceChildren(liste);
}
