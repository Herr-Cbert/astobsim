# astobsim

Simulation des Anblicks von Himmelsobjekten durch ein Fernrohr unter gegebenen Bedingungen. Webanwendung, laeuft komplett im Browser.

## Arbeitsweise

- Antworten, Kommentare, Bezeichner, Dokumente und Commit-Messages auf Deutsch. Keine Umlaute im Code und in Dateinamen (ae, oe, ue, ss). Ausnahme: Oberflaechentexte in `src/texte.ts` mit echten Umlauten (UTF-8); Bezeichner, Kommentare und Dateinamen bleiben ASCII.
- Das Projekt folgt dem Phasenplan in `docs/prozess.md`. Vor dem Umsetzen pruefen, in welcher Phase das Projekt steht (siehe `README.md`, Abschnitt Stand).
- Jede Phase beginnt im Plan-Modus. Ergebnis jeder Phase ist eine Datei in `docs/`.
- Anforderungen: `docs/anforderungen.md`. Begriffe: `GLOSSARY.md` (verbindlich fuer Bezeichner). Architekturentscheidungen: `docs/adr/`. Modulschnitt: `docs/architektur.md`. Recherche mit Formeln und Quellen: `docs/recherche/`.
- Issues und Pull Requests laufen ueber GitHub (`herr-cbert/astobsim`). Jedes Issue folgt der Schablone in `docs/prozess.md`.
- Keine neuen Abhaengigkeiten ohne Ruecksprache. Zur Laufzeit gibt es keine; Dev-Abhaengigkeiten nur TypeScript, Vite, Vitest.

## Stack und Befehle (ADR-0001)

- TypeScript, Vite, Vitest. Kein UI-Framework: Vanilla DOM, Canvas, WebGL2 fuer die Faltung.
- Node 22 ueber nvm (`source ~/.nvm/nvm.sh`, in neuen Shells automatisch).
- `npm install` einmalig, `npm run dev` startet den Dev-Server, `npm test` fuehrt Vitest einmal aus, `npm run build` baut nach `dist/`, kopiert `daten/` nach `dist/daten/` und bricht ab, wenn das Erstladen (alles in `dist/` ohne `daten/`) 5 MB uebersteigt (A-X6), `npm run preview` zeigt den Build unter `http://localhost:4173/astobsim/` (Dev-Server unter `/`).
- `npm run test:browser` baut `test/browser/` (eigene Vite-Konfiguration, nach `test/browser/dist/`) und startet Chrome headless mit SwiftShader (`scripts/browser-test.mjs`, Chrome ueber `CHROME` oder `google-chrome`, mit `-- --gpu` echte GPU statt SwiftShader): Gleichheit FalterWebgl2 gegen FalterJs, Zeit, Kontextverlust. Nicht Teil von `npm test` und CI; bei Aenderungen am WebGL2-Falter von Hand laufen lassen.
- `node scripts/validierung-bilder.mjs [fall ...]` nach `npm run build`: Screenshots der Testfaelle T1 bis T6 (Uebersicht und Zoom) nach `docs/validierung/`, Chrome headless ueber das DevTools-Protokoll (`--gpu` wie oben). Nicht Teil von CI; nach Modellaenderungen laufen lassen und `docs/validierung.md` pruefen.
- Daten zur Laufzeit immer ueber `import.meta.env.BASE_URL + "daten/..."` laden, nie ueber einen festen Pfad `/astobsim/`.
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
- `scripts/`: Node-Skripte ohne Pakete fuer Build und Tests: `build-abschluss.mjs` (Groessenpruefung A-X6, Kopie `daten/` nach `dist/daten/`), `browser-test.mjs` (Browsertest, siehe oben), `validierung-bilder.mjs` (Screenshots der Validierung).
- `test/browser/`: Testseiten fuer den Browsertest, nicht im Produktionsbau.
- `.github/workflows/`: `ci.yml` (Tests und Build bei Pull Request und Push auf `main`), `pages.yml` (Deploy nach GitHub Pages bei Push auf `main`).
- `prototyp/`: nur auf dem Branch `prototyp-faltung`, nicht auf `main`.

## Nicht tun

- Keine Bilder ohne geklaerte Lizenz und Eintrag in `daten/bilder.json` ins Repo. Rohbilder nie committen.
- Keine Physik-Formel ohne Quelle in `docs/recherche/physik.md`; neue Formeln dort nachtragen.
- Keine Laufzeitabhaengigkeiten, keine Analyse-Dienste, keine Cookies (A-T4).
