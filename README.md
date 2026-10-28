# astobsim

Webanwendung, die zeigt, wie ein Himmelsobjekt (Mond, Jupiter, Saturn, ...) durch ein bestimmtes Fernrohr unter bestimmten Beobachtungsbedingungen aussieht.

1. Fernrohr waehlen (aus Liste) oder Parameter eingeben (Oeffnung, Brennweite, Obstruktion, Okular).
2. Bedingungen waehlen (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont).
3. Ergebnis: hochaufgeloeste Bilder der Objekte, heruntergerechnet auf Aufloesung und Kontrast, die mit 1 und 2 erreichbar sind.

Die Seite laeuft unter <https://herr-cbert.github.io/astobsim/> und zeigt den Stand von `main`.

Das Projekt dient ausserdem als Uebungsprojekt fuer die Entwicklung mit Claude Code, von der Planung bis zur Fertigstellung. Der Ablauf steht in [docs/prozess.md](docs/prozess.md).

## Stand

Phase 6 (Validierung, #21, PR #80) ist abgeschlossen: Testfaelle T1 bis T6 am Bild beurteilt, Kontrastschwelle "erkennbar" als Tabellen-Test eingefroren, Ergebnis in [docs/validierung.md](docs/validierung.md), Abweichungen als Issues #76 bis #79. Phase 5 (Umsetzung) ist bis M2 abgeschlossen; Stufe A (Issues #1 bis #3: Naht-Typen, Physik Stufe 0 und 1), Stufe B, Welle 1 (Issues #4 Kern, #6 JavaScript-Falter, #7 Mondkacheln, #10 CI und Deploy; PRs #42 bis #45) und die Folge-Issues (#5 auswerten, #8 Daten-Modul, #11 Geraeteliste, #15 WebGL2-Falter; Vorbereitung PR #46, PRs #47 bis #50) Welle 2 (#9 Durchstich, #16 URL, #12 Mars; Vorbereitung PR #52, PRs #53, #54, #56) und Welle 3 (#13 Jupiter und Saturn, #17 und #18 Formulare, #19 Gesichtsfeld, #55 Leuchtdichte; Vorbereitung PR #57, PRs #58 bis #62) Welle 3b (#14 Trabanten, #20 Zoom, #64 Rundung in begrenze, #65 Hinweistext; PRs #67 bis #70) und Welle 4a (#51 Kachelstufen linear, #71 Quellweiss geeicht, #72 Trabanten als eigene Punktebene; PRs #73 bis #75) sind gemerged; Milestones M1 und M2 sind erreicht, die Seite zeigt Mond, Mars, Jupiter und Saturn mit Trabanten, voller Bedienung, Verschieben, Zoomansicht mit Vergleichsbild und WebGL2-Faltung. Die Arbeitspakete fuer Version 1 liegen als Issues #1 bis #23 in drei Milestones (M1 "Mond im 80 mm Refraktor sichtbar", M2 "Alle Objekte und volle Bedienung", M3 "Version 1") auf GitHub, die Kann-Punkte als #24 bis #38 im Milestone "Nach Version 1". Reihenfolge, Abhaengigkeiten und Spielregeln in [docs/plan.md](docs/plan.md). Architektur: Stack ([ADR-0001](docs/adr/0001-stack.md)), Simulationsmodell ([ADR-0002](docs/adr/0002-simulationsmodell.md)), Datenformat ([ADR-0003](docs/adr/0003-datenformat.md)), Modulschnitt in [docs/architektur.md](docs/architektur.md), Begriffe in [GLOSSARY.md](GLOSSARY.md). Anforderungen in [docs/anforderungen.md](docs/anforderungen.md), Recherche in [docs/recherche/](docs/recherche/README.md). Der Wegwerf-Prototyp liegt auf dem Branch `prototyp-faltung`. #22 (Sicherheit und Vereinfachung, PRs #81 bis #86, mit #63) ist erledigt; CSP im Bau, Pruefliste in docs/validierung.md Abschnitt 7. #76 (Cassini-Teilung und Seeing) ist entschieden: Erwartung T2 an das Langzeitmittel angepasst, Modell unveraendert (physik.md 15). #79 (PR #88): Quellbilder Jupiter und Saturn an die Photometrie angeglichen (Orton 1975, Salo und French 2010), T1 erfuellt. Naechster Schritt: M3 mit #66, #77, #78 und zuletzt #23; #63 und #66 sind fuer M3 vorgesehen. Hinweise aus den Reviews fuer M3 stehen als Kommentar in #22.

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/, kopiert daten/ mit und prueft die Groesse des Erstladens
```

GitHub Actions (`.github/workflows/`) fuehrt bei jedem Pull Request Tests und Build aus und veroeffentlicht jeden Push auf `main` auf GitHub Pages.
