# astobsim

Webanwendung, die zeigt, wie ein Himmelsobjekt (Mond, Jupiter, Saturn, ...) durch ein bestimmtes Fernrohr unter bestimmten Beobachtungsbedingungen aussieht.

1. Fernrohr waehlen (aus Liste) oder Parameter eingeben (Oeffnung, Brennweite, Obstruktion, Okular).
2. Bedingungen waehlen (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont).
3. Ergebnis: hochaufgeloeste Bilder der Objekte, heruntergerechnet auf Aufloesung und Kontrast, die mit 1 und 2 erreichbar sind.

Das Projekt dient ausserdem als Uebungsprojekt fuer die Entwicklung mit Claude Code, von der Planung bis zur Fertigstellung. Der Ablauf steht in [docs/prozess.md](docs/prozess.md).

## Stand

Phase 3 (Architektur) abgeschlossen. Stack: TypeScript, Vite, Vitest, Vanilla DOM mit Canvas und WebGL2 ([ADR-0001](docs/adr/0001-stack.md)); Simulationsmodell ([ADR-0002](docs/adr/0002-simulationsmodell.md)); Datenformat ([ADR-0003](docs/adr/0003-datenformat.md)). Modulschnitt in [docs/architektur.md](docs/architektur.md), Begriffe in [GLOSSARY.md](GLOSSARY.md). Der Wegwerf-Prototyp zur Faltung liegt auf dem Branch `prototyp-faltung`. Anforderungen in [docs/anforderungen.md](docs/anforderungen.md), Recherche in [docs/recherche/](docs/recherche/README.md). Naechster Schritt: Phase 4 (Zerlegung in Issues).

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/
```
