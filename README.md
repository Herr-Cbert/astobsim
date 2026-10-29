# astobsim

Webanwendung, die zeigt, wie ein Himmelsobjekt (Mond, Jupiter, Saturn, ...) durch ein bestimmtes Fernrohr unter bestimmten Beobachtungsbedingungen aussieht.

1. Fernrohr waehlen (aus Liste) oder Parameter eingeben (Oeffnung, Brennweite, Obstruktion, Okular).
2. Bedingungen waehlen (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont).
3. Ergebnis: hochaufgeloeste Bilder der Objekte, heruntergerechnet auf Aufloesung und Kontrast, die mit 1 und 2 erreichbar sind.

Die Seite laeuft unter <https://herr-cbert.github.io/astobsim/> und zeigt den Stand von `main`.

Das Projekt dient ausserdem als Uebungsprojekt fuer die Entwicklung mit Claude Code, von der Planung bis zur Fertigstellung. Der Ablauf steht in [docs/prozess.md](docs/prozess.md).

## Bedienung

Links ein Fernrohr, Fernglas oder das blosse Auge aus der Liste waehlen oder Oeffnung, Brennweite und Okular direkt eingeben; darunter Objekt und Bedingungen (Seeing, Himmelshelligkeit, Transparenz, Hoehe) einstellen. Das Bild in der Mitte zeigt den Anblick im wahren Gesichtsfeld, rechts stehen die Kennzahlen mit der Grenze, die gerade begrenzt; jedes Feld und jede Zahl hat einen Hilfetext. Ein Klick aufs Bild oeffnet die Zoomansicht mit dem Quellbild daneben, beim Mond zusaetzlich das Detail bis zur Aufloesungsgrenze, und laesst sich dort ziehen; die Einstellungen stehen in der URL und lassen sich als Link weitergeben.

## Grenzen

- Der Mond ist quellbegrenzt: das Quellbild hat 0,64'' je Pixel, ab etwa 200 mm Oeffnung zeigt die Simulation nicht mehr Detail, obwohl das Fernrohr es koennte.
- Die Himmelshelligkeit (Bortle) wirkt nur auf den Hintergrund; bei Mond und Planeten aendert sie praktisch nichts.
- Gezeigt wird das Langzeitmittel des Seeings, nicht der ruhige Moment, in dem Beobachter feinste Details erhaschen.
- Jedes Objekt hat feste Zustaende mit einem festen Quellbild, ohne Datum und Ephemeriden; Mars bei 6'' ist vereinfacht voll beleuchtet.
- Unterstuetzt werden aktuelle Desktop-Versionen von Chrome und Firefox (A-T3); Safari, Edge und Tablets sollten laufen, werden aber nicht geprueft.

## Stand

**Version 1** (2026-10-28): alle Muss-Anforderungen sind nachgewiesen ([docs/validierung.md](docs/validierung.md) Abschnitt 8), die Beobachtungs-Testfaelle T1 bis T6 erfuellt. Die Phasen 1 bis 7 aus [docs/prozess.md](docs/prozess.md) sind abgeschlossen; Arbeitspakete und Reihenfolge in [docs/plan.md](docs/plan.md), Rueckblick mit Aufwand je Phase in [docs/retrospektive.md](docs/retrospektive.md). Die uebrigen Kann-Punkte liegen im Milestone "Spaeter".

**Version 2** (begonnen 2026-10-29): Phase 1 abgeschlossen, Anforderungen der Stufe Muss V2 in [docs/anforderungen.md](docs/anforderungen.md) (offene Fragen in Abschnitt 10). Umfang im Milestone "Version 2": Helligkeitskorrektur (#93), Mondphasen (#36), Doppelsterne (#25), Deep-Sky-Objekte M31, M42, M13, M45, M57 (#26). Phase 2 abgeschlossen (2026-10-29): Recherche in [docs/recherche/](docs/recherche/README.md) Abschnitt "Recherche Version 2", Testfaelle T7 bis T12 (von Herbert bestaetigt in Phase 4), Entwurf [ADR-0004](docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md). Phase 3 abgeschlossen (2026-10-29): Naht Version 2 in [docs/architektur.md](docs/architektur.md) Abschnitt 5 (Hybrid aus zwei Entwuerfen), [ADR-0004](docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md) angenommen (Feldfaktor 1,4, Sockel, Flaechentabelle), Datenformat im Nachtrag zu [ADR-0003](docs/adr/0003-datenformat.md); der Wegwerf-Prototyp zum Deep-Sky-Anblick liegt auf dem Branch `prototyp-deep-sky`. Phase 4 abgeschlossen (2026-10-29): 20 Arbeitspakete #95 bis #114 plus #36, Wellen und Abhaengigkeiten in [docs/plan.md](docs/plan.md) Abschnitte 7 bis 9; #93, #25, #26 sind Sammel-Issues. Phase 5 laeuft: Welle 0 (#95) und Welle 1 (#96 bis #99, #101, #102) gemerged (2026-10-29), naechstes Arbeitspaket #100 (auswerten Version 2), parallel moeglich #103 bis #105 und #36 nach #100.

Architektur: Stack ([ADR-0001](docs/adr/0001-stack.md)), Simulationsmodell ([ADR-0002](docs/adr/0002-simulationsmodell.md)), Datenformat ([ADR-0003](docs/adr/0003-datenformat.md)), Modulschnitt in [docs/architektur.md](docs/architektur.md), Begriffe in [GLOSSARY.md](GLOSSARY.md). Anforderungen in [docs/anforderungen.md](docs/anforderungen.md), Recherche mit Formeln und Quellen in [docs/recherche/](docs/recherche/README.md). Der Wegwerf-Prototyp aus Phase 3 liegt auf dem Branch `prototyp-faltung`.

## Lizenz

Der Code steht unter der MIT-Lizenz ([LICENSE](LICENSE)). Die Bilder unter `daten/bilder/` behalten ihre eigene Lizenz (NASA gemeinfrei bzw. ESA/Hubble CC BY 4.0); Quelle, Credit und Bearbeitung stehen je Bild in [daten/bilder.json](daten/bilder.json) und auf der Seite im Fuss unter "Bildnachweise".

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/, kopiert daten/ mit und prueft die Groesse des Erstladens
```

GitHub Actions (`.github/workflows/`) fuehrt bei jedem Pull Request Tests und Build aus und veroeffentlicht jeden Push auf `main` auf GitHub Pages.
