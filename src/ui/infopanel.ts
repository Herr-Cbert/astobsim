// Infopanel neben dem Gesichtsfeld (A-D4): Vergroesserung, wahres Gesichtsfeld, Austrittspupille,
// Beugungsgrenze (Rayleigh, Dawes), Seeing am Objekt, Augengrenze und die dominante Grenze.
// Die Werte rechnet physik (Anzeigewerte aus auswerten); hier wird nur beschriftet und formatiert.

import type { Anzeigewerte } from "../physik";
import { TEXTE } from "../texte";
import { zahl } from "./format";

export interface Infozeile {
  beschriftung: string;
  wert: string;
}

const E = TEXTE.einheiten;

/** Bogensekunden mit zwei Nachkommastellen, z. B. 1,73'' (als Zeichen ″). */
function bogensekunden(wert: number): string {
  return `${zahl(wert, 2)}${E.bogensekunde}`;
}

/** Die Zeilen des Infopanels in fester Reihenfolge. */
export function infozeilen(anzeige: Anzeigewerte): Infozeile[] {
  const a = anzeige.aufloesung;
  const gf = anzeige.wahresGesichtsfeldGrad;
  const I = TEXTE.info;
  return [
    { beschriftung: I.vergroesserung, wert: `${zahl(anzeige.vergroesserung, 0)}${E.fach}` },
    { beschriftung: I.wahresGesichtsfeld, wert: `${zahl(gf, 2)}${E.grad} (${zahl(gf * 60, 0)}${E.bogenminute})` },
    { beschriftung: I.austrittspupille, wert: `${zahl(anzeige.austrittspupilleMm, 1)} ${E.mm}` },
    { beschriftung: I.rayleigh, wert: bogensekunden(a.rayleighArcsec) },
    { beschriftung: I.dawes, wert: bogensekunden(a.dawesArcsec) },
    { beschriftung: I.seeing, wert: bogensekunden(a.seeingFwhmArcsec) },
    { beschriftung: I.auge, wert: bogensekunden(a.augeFwhmArcsec) },
    { beschriftung: I.dominant, wert: TEXTE.grenzen[a.dominant] }
  ];
}

/** Schreibt die Zeilen als Definitionsliste in das Element (ersetzt den bisherigen Inhalt). */
export function zeigeInfozeilen(element: HTMLElement, zeilen: readonly Infozeile[]): void {
  const dokument = element.ownerDocument;
  const liste = dokument.createElement("dl");
  liste.className = "info-liste";
  for (const z of zeilen) {
    const dt = dokument.createElement("dt");
    dt.textContent = z.beschriftung;
    const dd = dokument.createElement("dd");
    dd.textContent = z.wert;
    liste.append(dt, dd);
  }
  element.replaceChildren(liste);
}
