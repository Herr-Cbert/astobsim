// Formular Geraet und Okular (A-F1 bis A-F8): Liste aus geraete.json, freie Eingabe, Okular-Presets.
// Platzhalter aus der Vorbereitung von Welle 3; Issue #17 fuellt diese Datei. starte ruft
// baueFormularGeraet(platz, steuerung) einmal nach dem Laden der Daten auf. Das Formular liest die Werte aus
// steuerung.konfiguration, haengt sich mit steuerung.beobachte an Aenderungen von aussen und
// meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die URL, rechnet neu).
// Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts.

import type { Steuerung } from "./steuerung";

export function baueFormularGeraet(_platz: HTMLElement, _steuerung: Steuerung): void {
  // Issue #17
}
