// Infosymbol mit Hilfetext (A-D6): ein Button mit Tooltip, erreichbar per Maus und Tastatur
// (Fokus zeigt den Text, Escape blendet ihn aus). Hier liegt nur der Mechanismus; die Texte
// stehen in src/texte.ts (Abschnitt hilfe, Issue #18, und bei den Feldern ihrer Formulare).

import { TEXTE } from "../texte";

/** Infosymbol mit Tooltip; id ist die des Tooltips (fuer aria-describedby), eindeutig auf der Seite. */
export function hilfesymbol(d: Document, id: string, text: string): HTMLElement {
  const huelle = d.createElement("span");
  huelle.className = "hilfe";
  const knopf = d.createElement("button");
  knopf.type = "button";
  knopf.className = "hilfe-knopf";
  knopf.textContent = TEXTE.hilfe.symbol;
  knopf.setAttribute("aria-label", TEXTE.hilfe.beschriftung);
  knopf.setAttribute("aria-describedby", id);
  const tip = d.createElement("span");
  tip.className = "hilfe-text";
  tip.id = id;
  tip.setAttribute("role", "tooltip");
  tip.textContent = text;
  huelle.append(knopf, tip);
  // Escape blendet aus, bis der Fokus das Symbol verlaesst (WAI-ARIA Tooltip-Muster).
  knopf.addEventListener("keydown", (e) => {
    if (e.key === "Escape") huelle.classList.add("zu");
  });
  knopf.addEventListener("blur", () => huelle.classList.remove("zu"));
  return huelle;
}
