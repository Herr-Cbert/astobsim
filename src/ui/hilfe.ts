// Infosymbol mit Hilfetext (A-D6): ein Button mit Tooltip, erreichbar per Maus und Tastatur
// (Fokus zeigt den Text, Escape blendet ihn aus). Hier liegt nur der Mechanismus; die Texte
// stehen in src/texte.ts (Abschnitt hilfe, Issue #18, und bei den Feldern ihrer Formulare).

import { TEXTE } from "../texte";

/**
 * Infosymbol mit Tooltip; id ist die des Tooltips (fuer aria-describedby), eindeutig auf der Seite,
 * thema benennt den Knopf ("Hilfe zu Seeing").
 */
export function hilfesymbol(d: Document, id: string, text: string, thema: string): HTMLElement {
  const huelle = d.createElement("span");
  huelle.className = "hilfe";
  const knopf = d.createElement("button");
  knopf.type = "button";
  knopf.className = "hilfe-knopf";
  knopf.textContent = TEXTE.hilfe.symbol;
  knopf.setAttribute("aria-label", TEXTE.hilfe.beschriftung(thema));
  knopf.setAttribute("aria-describedby", id);
  const tip = d.createElement("span");
  tip.className = "hilfe-text";
  tip.id = id;
  tip.setAttribute("role", "tooltip");
  tip.textContent = text;
  huelle.append(knopf, tip);

  // Escape blendet aus, solange der Tooltip offen ist, egal wo der Fokus steht (WCAG 1.4.13);
  // er erscheint wieder, wenn Maus oder Fokus das Symbol neu erreichen.
  const escape = (e: KeyboardEvent): void => {
    if (e.key === "Escape") huelle.classList.add("zu");
  };
  const oeffne = (): void => {
    huelle.classList.remove("zu");
    d.addEventListener("keydown", escape);
  };
  const schliesse = (): void => {
    if (huelle.matches(":hover") || huelle.contains(d.activeElement)) return;
    d.removeEventListener("keydown", escape);
  };
  huelle.addEventListener("mouseenter", oeffne);
  huelle.addEventListener("focusin", oeffne);
  huelle.addEventListener("mouseleave", schliesse);
  huelle.addEventListener("focusout", () => setTimeout(schliesse, 0));
  return huelle;
}
