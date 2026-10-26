---
status: accepted
datum: 2026-10-23
---

# Datenformat: drei JSON-Dateien fuer Geraete, Objekte und Bildnachweise, Mond als Kachelpyramide, Texte in einer TypeScript-Datei

Geraeteliste (A-F5), Objekte mit Zustaenden und Trabanten (A-X1, A-X2) und Bildnachweise (A-X4) liegen als drei von Hand gepflegte JSON-Dateien unter `daten/` im Repo: `geraete.json`, `objekte.json`, `bilder.json`. Quellbilder liegen unter `daten/bilder/<objekt>/`; Planeten als ein Bild je Zustand, der Mond als Kachelpyramide (Kacheln 512 px, Stufen halbierend von der vollen Aufloesung bis unter 1024 px Gesamtbreite). Alle Oberflaechentexte stehen in `src/texte.ts` (A-D10). Die Felder folgen den Vorschlaegen in `docs/recherche/geraete.md` Abschnitt 6, `objekte.md` Abschnitt 6.2 und `bilder.md` Abschnitt 8.

Warum JSON: im Browser ohne Bibliothek ladbar, von Hand erweiterbar (A-F5), als Modul in Vite importierbar und damit typpruefbar; Kommentare landen im Feld `kommentar`. CSV und YAML brauchten einen Parser oder verlieren die Verschachtelung (Zustaende mit Trabanten).

Warum Kachelpyramide fuer den Mond: Das Mondbild muss bei 0,25"/px rund 7600 px Durchmesser haben (A-X5), als eine Datei 14 bis 22 MB (bilder.md Abschnitt 7) und damit ueber dem Limit von 20 MB je Objekt (A-X6). Der Anblick braucht aber nie das ganze Bild in voller Aufloesung: der Arbeitsmassstab (ADR-0002) legt die Stufe fest, das wahre Gesichtsfeld den Ausschnitt (A-D2). Eine Pyramide laedt genau die Kacheln der passenden Stufe im sichtbaren Bereich, wie eine Landkarte. Planeten sind mit 200 bis 3000 px klein genug fuer Einzelbilder.

## Festlegungen

- Einheiten stehen im Feldnamen (`oeffnung_mm`, `winkelgroesse_arcsec`, `obstruktion_prozent`); Dezimalzahlen mit Punkt.
- Jeder Zustand verweist ueber `bild` auf einen Eintrag in `bilder.json`; jeder Bildeintrag hat Lizenz, Lizenz-URL, Namensnennung, Pixelmassstab in Bogensekunden je Pixel, Nordrichtung und Bearbeitung.
- Kacheln und skalierte Planetenbilder werden ausschliesslich von Skripten unter `tools/` aus den Rohbildern in `data/roh/` (gitignored) erzeugt; das Skript schreibt den Bildnachweis mit. Kein Bild ohne Eintrag in `bilder.json` (A-X3).
- Bildformat der Kacheln und Planetenbilder: WebP verlustbehaftet mit hoher Qualitaet; JPEG als Reserve, falls WebP in `tools/` Probleme macht. Entscheidung beim ersten Kachel-Issue, Groessenziel A-X6 bleibt massgeblich.
- Nordrichtung (A-D11, Nachtrag 2026-10-26, Entscheidung Herbert zu Issue #12): `norden_oben` heisst bei Planeten Planetennorden oben (Rotationsachse senkrecht, wie in den Hubble-Pressebildern), beim Mond Himmelsnorden oben. Planetenbilder werden dafuer nicht gedreht; die Zustaende haben keinen Zeitpunkt, der Positionswinkel der Achse zum Aufnahmezeitpunkt steht dokumentierend in `positionswinkel_achse_grad`.
- Das Mondbild aus NASA SVS hat 0,643"/px (Durchmesser rund 2760 px); die Pyramide hat damit vorerst drei bis vier Stufen. Ein feineres Rendering spaeter aendert nur die Anzahl der Stufen, nicht das Format.

## Verworfene Optionen

- **Ein Bild je Objekt in voller Aufloesung**: beim Mond zu gross (A-X6) und unnoetig, weil der Arbeitsmassstab fast nie die volle Aufloesung braucht.
- **Stufenbilder ohne Kacheln** (ganze Scheibe in drei Aufloesungen): einfacher, aber die feinste Stufe ist allein schon zu gross und laedt immer ganz, auch wenn nur ein Krater sichtbar ist.
- **Ephemeriden statt fester Zustaende**: durch A-X8 auf spaeter verschoben; feste Zustaende reichen fuer die Testfaelle.
