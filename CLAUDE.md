# astobsim

Simulation des Anblicks von Himmelsobjekten durch ein Fernrohr unter gegebenen Bedingungen. Webanwendung, laeuft komplett im Browser.

## Arbeitsweise

- Antworten, Kommentare, Bezeichner, Dokumente und Commit-Messages auf Deutsch. Keine Umlaute im Code und in Dateinamen (ae, oe, ue, ss).
- Das Projekt folgt dem Phasenplan in `docs/prozess.md`. Vor dem Umsetzen pruefen, in welcher Phase das Projekt steht (siehe `README.md`, Abschnitt Stand).
- Jede Phase beginnt im Plan-Modus. Ergebnis jeder Phase ist eine Datei in `docs/`.
- Anforderungen: `docs/anforderungen.md`. Begriffe: `GLOSSARY.md` (verbindlich fuer Bezeichner). Architekturentscheidungen: `docs/adr/`. Modulschnitt: `docs/architektur.md`. Recherche mit Formeln und Quellen: `docs/recherche/`.
- Issues und Pull Requests laufen ueber GitHub (`herr-cbert/astobsim`). Jedes Issue folgt der Schablone in `docs/prozess.md`.
- Keine neuen Abhaengigkeiten ohne Ruecksprache. Zur Laufzeit gibt es keine; Dev-Abhaengigkeiten nur TypeScript, Vite, Vitest.

## Stack und Befehle (ADR-0001)

- TypeScript, Vite, Vitest. Kein UI-Framework: Vanilla DOM, Canvas, WebGL2 fuer die Faltung.
- Node 22 ueber nvm (`source ~/.nvm/nvm.sh`, in neuen Shells automatisch).
- `npm install` einmalig, `npm run dev` startet den Dev-Server, `npm test` fuehrt Vitest einmal aus, `npm run build` baut nach `dist/`, `npm run preview` zeigt den Build.
- Vor jedem Commit: `npm test` und `npm run build` muessen durchlaufen.

## Ordner

- `src/physik/`: reine Funktionen (Optik, Atmosphaere, PSF, Helligkeit, Grenzen). Jede Funktion hat einen Unit-Test gegen bekannte Werte (`docs/recherche/physik.md`, Abschnitt 8). Kein DOM, kein Canvas, kein Worker.
- `src/bild/`: Bildpipeline (Arbeitsmassstab, Kern, Faltung, Trabanten). Zwei Adapter: WebGL2 (Produktion) und JavaScript (Tests, Fallback), die dasselbe Ergebnis liefern muessen.
- `src/daten/`: Laden und Validieren der JSON-Dateien, Kachel-Loader.
- `src/zustand/`: Konfiguration, Voreinstellungen, Begrenzung der Eingaben, URL-Serialisierung.
- `src/ui/`: Formular, Gesichtsfeld-Canvas, Zoomansicht, Infopanel. Alle Texte aus `src/texte.ts`.
- `daten/`: `geraete.json`, `objekte.json`, `bilder.json` und die aufbereiteten Bilder (ADR-0003).
- `data/roh/`: Rohbilder, gitignored, mit `LIESMICH.md` zur Herkunft.
- `tools/`: Python-Skripte (numpy, Pillow) zur Bildaufbereitung. Nur sie erzeugen Bilder unter `daten/` und schreiben den Bildnachweis.
- `prototyp/`: nur auf dem Branch `prototyp-faltung`, nicht auf `main`.

## Nicht tun

- Keine Bilder ohne geklaerte Lizenz und Eintrag in `daten/bilder.json` ins Repo. Rohbilder nie committen.
- Keine Physik-Formel ohne Quelle in `docs/recherche/physik.md`; neue Formeln dort nachtragen.
- Keine Laufzeitabhaengigkeiten, keine Analyse-Dienste, keine Cookies (A-T4).
