# astobsim

Webanwendung, die zeigt, wie ein Himmelsobjekt (Mond, Jupiter, Saturn, ...) durch ein bestimmtes Fernrohr unter bestimmten Beobachtungsbedingungen aussieht.

1. Fernrohr waehlen (aus Liste) oder Parameter eingeben (Oeffnung, Brennweite, Obstruktion, Okular).
2. Bedingungen waehlen (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont).
3. Ergebnis: hochaufgeloeste Bilder der Objekte, heruntergerechnet auf Aufloesung und Kontrast, die mit 1 und 2 erreichbar sind.

Das Projekt dient ausserdem als Uebungsprojekt fuer die Entwicklung mit Claude Code, von der Planung bis zur Fertigstellung. Der Ablauf steht in [docs/prozess.md](docs/prozess.md).

## Stand

Phase 5 (Umsetzung) laeuft; Stufe A (Issues #1 bis #3: Naht-Typen, Physik Stufe 0 und 1) ist gemerged. Die Arbeitspakete fuer Version 1 liegen als Issues #1 bis #23 in drei Milestones (M1 "Mond im 80 mm Refraktor sichtbar", M2 "Alle Objekte und volle Bedienung", M3 "Version 1") auf GitHub, die Kann-Punkte als #24 bis #38 im Milestone "Nach Version 1". Reihenfolge, Abhaengigkeiten und Spielregeln in [docs/plan.md](docs/plan.md). Architektur: Stack ([ADR-0001](docs/adr/0001-stack.md)), Simulationsmodell ([ADR-0002](docs/adr/0002-simulationsmodell.md)), Datenformat ([ADR-0003](docs/adr/0003-datenformat.md)), Modulschnitt in [docs/architektur.md](docs/architektur.md), Begriffe in [GLOSSARY.md](GLOSSARY.md). Anforderungen in [docs/anforderungen.md](docs/anforderungen.md), Recherche in [docs/recherche/](docs/recherche/README.md). Der Wegwerf-Prototyp liegt auf dem Branch `prototyp-faltung`. Naechster Schritt: Stufe B parallel mit Worktrees und Subagenten, Welle 1: #4 (Kern), #6 (Bild), #7 (Mondkacheln), #10 (CI und Deploy).

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/
```
