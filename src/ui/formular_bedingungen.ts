// Formular Bedingungen (A-B1 bis A-B4): Seeing, Bortle, Transparenz, Hoehe.
// Platzhalter aus der Vorbereitung von Welle 3; Issue #18 fuellt diese Datei. starte ruft
// baueFormularBedingungen(platz, steuerung) einmal nach dem Laden der Daten auf. Das Formular liest die Werte aus
// steuerung.konfiguration, haengt sich mit steuerung.beobachte an Aenderungen von aussen und
// meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die URL, rechnet neu).
// Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts.

import type { Steuerung } from "./steuerung";

export function baueFormularBedingungen(_platz: HTMLElement, _steuerung: Steuerung): void {
  // Issue #18
}
