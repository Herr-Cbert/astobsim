---
status: accepted
datum: 2026-10-23
---

# Stack: TypeScript, Vite, Vitest, Vanilla DOM mit Canvas und WebGL2, Python fuer die Bildaufbereitung

astobsim laeuft komplett im Browser als statische Seite auf GitHub Pages (A-T1, A-T2) und muss den Anblick bei jedem Reglerzug unter 0,5 s neu rechnen (A-D7). Wir schreiben die Anwendung in TypeScript, bauen mit Vite, testen mit Vitest, verwenden kein UI-Framework (Formular und Anzeige in Vanilla DOM, Bild auf Canvas, Faltung in WebGL2 mit JavaScript-Fallback) und bereiten die Bilddaten offline mit Python-Skripten (numpy, Pillow) unter `tools/` auf. Zur Laufzeit gibt es keine Abhaengigkeiten; Dev-Abhaengigkeiten sind Vite, Vitest und TypeScript.

Warum: Typen tragen die Physik (Einheiten, Invarianten) und helfen Agenten, die spaeter parallel an Modulen arbeiten. Vite und Vitest sind die Standard-Toolchain fuer statische Seiten und erlauben Unit-Tests der reinen Physik-Funktionen ohne Browser (A-Q1). Die Oberflaeche ist ein Formular mit Reglern und ein Canvas; ein Framework brachte dafuer keine Tiefe, nur eine Abhaengigkeit. WebGL2 ist in Chrome und Firefox verfuegbar (A-T3) und laut Prototyp (siehe ADR-0002) der einzige Weg, der die 0,5 s mit Reserve schafft. Python ist auf dem Entwicklungsrechner mit numpy und Pillow vorhanden und fuer das Zuschneiden, Skalieren und Kacheln der Quellbilder besser geeignet als Node; die Skripte laufen nicht im Browser.

## Verworfene Optionen

- **Plain JavaScript ohne Build**: keine Typen, kein Bundling, Tests nur ueber den Node-Testrunner. Spart die Toolchain, kostet Sicherheit bei der Physik.
- **Rust nach WASM fuer die Faltung**: schnellste CPU-Variante, aber zweite Toolchain und unnoetig, weil WebGL2 die Faltung ohnehin auf die GPU bringt.
- **Svelte, Preact, React**: Komfort fuer reaktive Regler, dafuer Abhaengigkeit und Build-Komplexitaet fuer eine einzige Seite.
- **Python-Backend fuer die Bildverarbeitung**: durch A-T1 ausgeschlossen.

## Folgen

- Node 22 per nvm auf dem Entwicklungsrechner (Node 18 im System ist End-of-Life und hat kein npm).
- `CLAUDE.md` bekommt die Befehle und die Ordnerstruktur, damit jeder Agent bauen und testen kann.
- Browser ohne WebGL2 bekommen die JavaScript-Faltung mit kleinerer Anzeige; das ist ein Fallback, kein getesteter Pfad (A-T3).
