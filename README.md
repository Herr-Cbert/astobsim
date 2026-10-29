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

Der Code steht unter der MIT-Lizenz ([LICENSE](LICENSE)). Die Bilder unter `daten/bilder/` behalten ihre eigene Lizenz (NASA gemeinfrei bzw. ESA/Hubble CC BY 4.0); Quelle, Credit und Bearbeitung stehen je Bild in [daten/bilder.json](daten/bilder.json) und auf der Seite im Fuss unter "Bildnachweise". Auch die Sterndaten in [daten/objekte.json](daten/objekte.json) behalten die Lizenz ihrer Quelle, siehe den folgenden Abschnitt.

## Sterndaten

Abstand, Positionswinkel, Helligkeit und Farbindex B-V der Sterne stammen aus den folgenden Katalogen; je Stern und Paar steht die Herkunft in `daten/objekte.json` (`katalog`, `quelle_farbe`, `kommentar`), auf der Seite im Fuss unter "Sterndaten". Lizenz und Danksagung stehen so, wie die Quelle sie nennt (gelesen am 2026-10-29).

- **Washington Double Star Catalog (WDS)**, U.S. Naval Observatory (Mason et al. 2001, AJ 122, 3466), <https://www.astro.gsu.edu/wds/>: Abstand, Positionswinkel und Helligkeit der Doppelsterne (ausser Albireo B und Polaris B). Lizenz laut [data.gov](https://catalog.data.gov/dataset/washington-double-star-catalog) (Eintrag der HEASARC): U.S. Government Works ("License: https://www.usa.gov/government-works", "Access Level: public"); an der Quelle selbst keine Lizenzangabe. Danksagung: "This research has made use of the Washington Double Star Catalog maintained at the U.S. Naval Observatory."
- **Sixth Catalog of Orbits of Visual Binary Stars (ORB6)**, U.S. Naval Observatory (Matson, Williams, Hartkopf und Mason), <https://www.astro.gsu.edu/wds/orb6.html>: Abstand und Positionswinkel der Bahnpaare, Ephemeride 2027,0. An der Quelle keine Lizenzangabe; Katalog des USNO wie der WDS.
- **Hipparcos- und Tycho-Kataloge**, ESA (Hipparcos-Hauptkatalog, ESA 1997; Tycho Double Star Catalogue, Fabricius et al. 2002, A&A 384, 180), abgefragt im Hipparcos and Tycho Legacy Archive, <https://www.cosmos.esa.int/web/hipparcos/catalogues>: B-V, dazu V von Albireo B. "The Hipparcos and Tycho Catalogues are distributed under the [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/deed.en) licence and the Terms and Conditions for the use of these data require users to acknowledge ESA using “Credit: ESA”." Credit: ESA.
- **Bright Star Catalogue**, 5. Ausgabe (Hoffleit und Warren 1991), abgefragt bei der HEASARC, <https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html>: B-V von Mizar, Castor und Gamma Andromedae. An der Quelle keine Lizenzangabe.
- **SIMBAD**, CDS Strassburg (Wenger et al. 2000, A&AS 143, 9), Spiegel <https://simbad.cfa.harvard.edu/simbad/>: B und V von Antares B. "Use of SIMBAD service is free without any registration under ODbL licence. We request that users cite the original paper reference." Danksagung: "This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France".
- **Usenko und Klochkova**, Polaris B, <https://arxiv.org/abs/0708.0333>: V 8,60 und B-V 0,42 (nach Turner 2005) von Polaris B (Entscheidung 7 in [docs/recherche/README.md](docs/recherche/README.md)).

## Sterndaten

Sterndaten unter `daten/` behalten wie die Bilder ihre eigene Lizenz (ADR-0003, Nachtrag Version 2); der Nachweis steht je Liste in den Daten (`quelle`, `lizenz`, `katalog` je Stern).

- M45 (Plejaden), [daten/sterne/m45.json](daten/sterne/m45.json): 44 Mitglieder bis V 8,5 aus ESA Gaia DR3 und Hipparcos (ESA 1997, Neureduktion van Leeuwen 2007), abgefragt im Gaia-Archiv, erzeugt von `tools/m45_sterne.py`. Credit: ESA, Gaia DPAC; Hipparcos: ESA. Lizenz [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/) (ESA Space Science Archives, https://www.cosmos.esa.int/web/gaia-users/license); kommerzielle Nutzung nur nach Genehmigung der ESA. This work has made use of data from the European Space Agency (ESA) mission Gaia (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis Consortium (DPAC, https://www.cosmos.esa.int/web/gaia/dpac/consortium). Funding for the DPAC has been provided by national institutions, in particular the institutions participating in the Gaia Multilateral Agreement.

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/, kopiert daten/ mit und prueft die Groesse des Erstladens
```

GitHub Actions (`.github/workflows/`) fuehrt bei jedem Pull Request Tests und Build aus und veroeffentlicht jeden Push auf `main` auf GitHub Pages.
