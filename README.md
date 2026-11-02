# astobsim

Webanwendung, die zeigt, wie ein Himmelsobjekt (Mond, Planeten, Doppelsterne, Deep-Sky-Objekte) durch ein bestimmtes Fernrohr unter bestimmten Beobachtungsbedingungen aussieht.

1. Fernrohr waehlen (aus Liste) oder Parameter eingeben (Oeffnung, Brennweite, Obstruktion, Okular).
2. Bedingungen waehlen (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont).
3. Ergebnis: hochaufgeloeste Bilder der Objekte, heruntergerechnet auf Aufloesung und Kontrast, die mit 1 und 2 erreichbar sind.

Die Seite laeuft unter <https://herr-cbert.github.io/astobsim/> und zeigt den Stand von `main`.

Das Projekt dient ausserdem als Uebungsprojekt fuer die Entwicklung mit Claude Code, von der Planung bis zur Fertigstellung. Der Ablauf steht in [docs/prozess.md](docs/prozess.md).

## Bedienung

Links ein Fernrohr, Fernglas oder das blosse Auge aus der Liste waehlen oder Oeffnung, Brennweite und Okular direkt eingeben; darunter Objekt (nach Sonnensystem, Doppelsternen und Deep-Sky gruppiert, dazu ein freies Doppelsternpaar mit eigenen Werten) und Bedingungen (Seeing, Himmelshelligkeit, Transparenz, Hoehe) einstellen. Das Bild in der Mitte zeigt den Anblick im wahren Gesichtsfeld, rechts stehen die Kennzahlen mit der Grenze, die gerade begrenzt; jedes Feld und jede Zahl hat einen Hilfetext. Ein Klick aufs Bild oeffnet die Zoomansicht mit dem Quellbild daneben, wo es mehr zeigt (Mond, Sterne, Deep-Sky) zusaetzlich das Detail bis zur Aufloesungsgrenze, und laesst sich dort ziehen; die Einstellungen stehen in der URL und lassen sich als Link weitergeben.

## Objekte

- **Sonnensystem:** Mond (zunehmende Sichel, erstes Viertel, Vollmond, letztes Viertel), Mars (6'', 14'', 25''), Jupiter (35'', 47'') mit den Galileischen Monden, Saturn (16'', 20'') mit Titan und Rhea.
- **Doppelsterne:** Albireo, Mizar, Gamma Andromedae, Castor, Porrima, Zeta Aquarii, Epsilon Lyrae (Doppel-Doppelstern), Pi Aquilae, Epsilon Arietis, 52 Orionis, 52 Arietis, Zeta Herculis, Antares, Polaris; dazu ein freies Paar mit Abstand, zwei Helligkeiten und zwei Farbindizes.
- **Deep-Sky:** M31 (Andromedagalaxie, mit M32), M42 (Orionnebel, mit dem Trapez), M13 (Herkuleshaufen, 531 Sterne plus Restlicht), M45 (Plejaden, 44 Sterne), M57 (Ringnebel).

Jedes Objekt hat feste Zustaende ohne Datum und Ephemeriden; Liste und Daten in [daten/objekte.json](daten/objekte.json).

## Grenzen

- Der Mond ist quellbegrenzt: das Quellbild hat 0,64'' je Pixel, ab etwa 200 mm Oeffnung zeigt die Simulation nicht mehr Detail, obwohl das Fernrohr es koennte.
- Die Himmelshelligkeit (Bortle) wirkt auf den Hintergrund und ueber die Wahrnehmungsschwelle; bei Mond und Planeten aendert sie praktisch nichts, bei Deep-Sky-Objekten und schwachen Sternen entscheidet sie, was sichtbar bleibt.
- Gezeigt wird das Langzeitmittel des Seeings, nicht der ruhige Moment, in dem Beobachter feinste Details erhaschen.
- Jedes Objekt hat feste Zustaende mit einem festen Quellbild, ohne Datum und Ephemeriden; Mars bei 6'' ist vereinfacht voll beleuchtet. Beim Vollmond zeigt das blosse Auge keine Maria.
- Die Wahrnehmungsschwelle gilt fuer einen festen, voll dunkeladaptierten Beobachter. Ueberstrahlung heller Sterne wird nicht simuliert (das Infopanel weist darauf hin); Deep-Sky-Flaechen sind grau, Feldsterne um die Objekte fehlen.
- Die Quellbilder von M31 (4'' je Pixel) und M42 (1'') sind fuer kleine Vergroesserungen gemacht; bei hoher Vergroesserung zeigt der Anblick die Grenze des Quellbilds. M31 zeigt bei kleiner Vergroesserung die Kante des Mosaiks, M42 die Kante des Bildausschnitts.
- Bekannte Abweichungen von der Beobachtungserfahrung, als Issues im Milestone "Spaeter": bei Bortle 7 sieben statt sechs Plejaden mit blossem Auge (#147), zu viele Sterne in M13 am kleinen Fernrohr (#148), M43 mit blossem Auge als eigener Fleck (#143).
- Unterstuetzt werden aktuelle Desktop-Versionen von Chrome und Firefox (A-T3); Safari, Edge und Tablets sollten laufen, werden aber nicht geprueft.

## Stand

**Version 1** (2026-10-28): alle Muss-Anforderungen sind nachgewiesen ([docs/validierung.md](docs/validierung.md) Abschnitt 8), die Beobachtungs-Testfaelle T1 bis T6 erfuellt. Die Phasen 1 bis 7 aus [docs/prozess.md](docs/prozess.md) sind abgeschlossen; Arbeitspakete und Reihenfolge in [docs/plan.md](docs/plan.md), Rueckblick mit Aufwand je Phase in [docs/retrospektive.md](docs/retrospektive.md). Die uebrigen Kann-Punkte liegen im Milestone "Spaeter".

**Version 2** (2026-10-29 bis 2026-11-02): Doppelsterne, Deep-Sky-Objekte, Mondphasen und eine nachgestellte Helligkeit mit Wahrnehmungsschwelle (Anforderungen der Stufe Muss V2 in [docs/anforderungen.md](docs/anforderungen.md), Milestone "Version 2"). Die Phasen 1 bis 6 sind abgeschlossen: Recherche in [docs/recherche/](docs/recherche/README.md) Abschnitt "Recherche Version 2", Naht Version 2 in [docs/architektur.md](docs/architektur.md) Abschnitt 5 und [ADR-0004](docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md), Arbeitspakete in [docs/plan.md](docs/plan.md) Abschnitte 7 bis 9, Umsetzung in fuenf Wellen (PRs #115 bis #157). Alle Muss-V2-Anforderungen sind nachgewiesen ([docs/validierung.md](docs/validierung.md) Abschnitt 16), T1 bis T12 bestanden, T11d als dokumentierte Modellgrenze (#147) (Abschnitte 13 und 14), Sicherheit und Vereinfachung in Abschnitt 15. Offen fuer den Abschluss (#114): Firefox-Pruefung von Hand (Abschnitt 17), Tag `v2.0`. Rueckblick mit Aufwand je Welle in [docs/retrospektive.md](docs/retrospektive.md) ab Abschnitt 8. Der Wegwerf-Prototyp zum Deep-Sky-Anblick liegt auf dem Branch `prototyp-deep-sky`.

Architektur: Stack ([ADR-0001](docs/adr/0001-stack.md)), Simulationsmodell ([ADR-0002](docs/adr/0002-simulationsmodell.md)), Datenformat ([ADR-0003](docs/adr/0003-datenformat.md)), Helligkeit und Wahrnehmungsschwelle ([ADR-0004](docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md)), Modulschnitt in [docs/architektur.md](docs/architektur.md), Begriffe in [GLOSSARY.md](GLOSSARY.md). Anforderungen in [docs/anforderungen.md](docs/anforderungen.md), Recherche mit Formeln und Quellen in [docs/recherche/](docs/recherche/README.md). Der Wegwerf-Prototyp aus Phase 3 liegt auf dem Branch `prototyp-faltung`.

## Lizenz

Der Code steht unter der MIT-Lizenz ([LICENSE](LICENSE)). Die Bilder unter `daten/bilder/` behalten ihre eigene Lizenz (NASA und MAST gemeinfrei, ESA/Hubble, NOIRLab und ESO-Archiv CC BY 4.0); Quelle, Credit und Bearbeitung stehen je Bild in [daten/bilder.json](daten/bilder.json), auf der Seite im Fuss unter "Bildnachweise" und im Abschnitt "Bildnachweise" unten. Auch die Sterndaten in [daten/objekte.json](daten/objekte.json) und `daten/sterne/` behalten die Lizenz ihrer Quelle, siehe Abschnitt "Sterndaten"; die Daten aus Gaia und Hipparcos stehen unter CC BY-NC 3.0 IGO und duerfen nur nach Genehmigung der ESA kommerziell genutzt werden.

## Bildnachweise

Alle 13 Bilder aus [daten/bilder.json](daten/bilder.json), die Namensnennung woertlich (Lizenzbedingung), Bilder mit gleicher Quelle und Namensnennung zusammengefasst. Die Bearbeitung steht ausfuehrlich je Bild im Feld `bearbeitung` und auf der Seite im Fuss unter "Bildnachweise"; erzeugt werden die Bilder von den Skripten in `tools/`.

- **Mond, 1 Tag nach erstem Viertel; Mond, zunehmende Sichel (4 Tage); Vollmond; Mond, letztes Viertel** (`mond_svs5587_6285`, `mond_svs5587_6173`, `mond_svs5587_6449`, `mond_svs5587_6615`; LRO / NASA SVS). Namensnennung: NASA Scientific Visualization Studio. Visualizer: Ernie Wright (USRA). Planetary scientist: Noah Petro (NASA/GSFC). Producer: James Tralie (eMITS). Lizenz: [Public Domain (NASA)](https://svs.gsfc.nasa.gov/help/). Quelle: <https://svs.gsfc.nasa.gov/5587>.
- **Mars Perihel-Opposition (25")** (`mars_hst_20030826`; Hubble Space Telescope, 2003-08-26). Namensnennung: NASA, J. Bell (Cornell U.) and M. Wolff (SSI); Additional image processing and analysis support from: K. Noll and A. Lubenow (STScI); M. Hubbard (Cornell U.); R. Morris (NASA/JSC); P. James (U. Toledo); S. Lee (U. Colorado); and T. Clancy, B. Whitney and G. Videen (SSI); and Y. Shkuratov (Kharkov U.); bearbeitet: zugeschnitten, skaliert. Lizenz: [Public Domain (NASA) / CC-BY-4.0 (ESA/Hubble)](https://www.nasa.gov/nasa-brand-center/images-and-media/). Quelle: <https://science.nasa.gov/asset/hubble/hubbles-close-encounter-with-mars-august-26-2003>.
- **Jupiter fern (35"); Jupiter Opposition (47")** (`jupiter_hst_20190627`; Hubble Space Telescope (OPAL), 2019-06-27). Namensnennung: NASA, ESA, A. Simon (Goddard Space Flight Center), and M.H. Wong (University of California, Berkeley); bearbeitet: gedreht (Planetennorden oben), zugeschnitten, skaliert, Kontrast angepasst. Lizenz: [CC-BY-4.0 (ESA/Hubble) / Public Domain (NASA)](https://esahubble.org/copyright/). Quelle: <https://esahubble.org/images/heic1914a/>.
- **Saturn fern (16"); Saturn Opposition (20")** (`saturn_hst_20210912`; Hubble Space Telescope (OPAL), 2021-09-12). Namensnennung: NASA, ESA, A. Simon (Goddard Space Flight Center), and M.H. Wong (University of California, Berkeley) and the OPAL team; bearbeitet: gedreht, zugeschnitten, skaliert, Trabanten entfernt, nach sRGB umgerechnet, Kontrast angepasst. Lizenz: [CC-BY-4.0 (ESA/Hubble) / Public Domain (NASA)](https://esahubble.org/copyright/). Quelle: <https://esahubble.org/images/heic2113c/>.
- **Mars klein (6"); Mars Aphel-Opposition (14")** (`mars_hst_19950225`; Hubble Space Telescope, 1995-02-25). Namensnennung: Philip James (University of Toledo), Steven Lee (University of Colorado), NASA; bearbeitet: zugeschnitten, skaliert. Lizenz: [Public Domain (NASA) / CC-BY-4.0 (ESA/Hubble)](https://www.nasa.gov/nasa-brand-center/images-and-media/). Quelle: <https://science.nasa.gov/asset/hubble/mars-2/>.
- **M57** (`m57_hst_20110919`; Hubble Space Telescope, 2011-09-19). Namensnennung: Based on observations made with the NASA/ESA Hubble Space Telescope obtained from the Space Telescope Science Institute, which is operated by the Association of Universities for Research in Astronomy, Inc., under NASA contract NAS5-26555. These observations are associated with program 12309 (PI C. R. O'Dell). Lizenz: [Public Domain (MAST, HST-Archivdaten)](https://archive.stsci.edu/publishing/data-use). Quelle: <https://www.stsci.edu/hst-program-info/program/?program=12309>.
- **M31 mit Begleiter M32** (`m31_noirlab_lgs`, `m31_noirlab_lgs_m32`; KPNO Mayall 4 m, Local Group Survey). Namensnennung: Local Group Survey Team and T.A. Rector (University of Alaska Anchorage); bearbeitet: gedreht (Norden oben), Graustufe aus dem Grünkanal, per Tonkurve gegen ein Flächenhelligkeitsprofil linearisiert, skaliert, Sterne entfernt. Lizenz: [CC-BY-4.0](https://noirlab.edu/public/copyright/). Quelle: <https://noirlab.edu/public/images/noao-m31lgs_ubvIha/>.
- **M42** (`m42_wfi_20050102`; MPG/ESO-2,2-m-Teleskop, La Silla, 2005-01-02). Namensnennung: Based on observations collected at the European Southern Observatory under ESO programme 273.C-5042(A); ESO Science Archive Facility; bearbeitet: aus den Rohdaten kalibriert, gestapelt, Himmel abgezogen, auf 1"/px gebracht, Sterne entfernt, log-kodiert (astobsim). Lizenz: [CC-BY-4.0 (ESO Science Archive)](https://archive.eso.org/cms/eso-data-access-policy.html). Quelle: <https://archive.eso.org/wdb/wdb/eso/eso_archive_main/query?prog_id=273.C-5042(A)>.
- **M13** (`m13_noirlab_mayall`; NSF Nicholas U. Mayall 4-meter Telescope, Kitt Peak National Observatory, nicht angegeben (Bildseite veröffentlicht 2020-06-30)). Namensnennung: T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA); bearbeitet: gedreht (Norden oben), zugeschnitten, skaliert, Graustufe aus dem V-Kanal, Tonkurve auf ein Flächenhelligkeitsprofil, Sterne entfernt, außerhalb 2' bis 3' durch ein Profilmodell ersetzt. Lizenz: [CC BY 4.0 (NOIRLab)](https://noirlab.edu/public/copyright/). Quelle: <https://noirlab.edu/public/images/noao-m13kpno4m/>.

## Sterndaten

Abstand, Positionswinkel, Helligkeit und Farbindex B-V der Sterne stammen aus den folgenden Katalogen; je Stern und Paar steht die Herkunft in `daten/objekte.json` (`katalog`, `quelle_farbe`, `kommentar`), bei Sternlisten unter `daten/sterne/` in der Liste selbst (`quelle`, `lizenz`, `katalog`), auf der Seite im Fuss unter "Sterndaten". Lizenz und Danksagung stehen so, wie die Quelle sie nennt (gelesen am 2026-10-29).

- **Washington Double Star Catalog (WDS)**, U.S. Naval Observatory (Mason et al. 2001, AJ 122, 3466), <https://www.astro.gsu.edu/wds/>: Abstand, Positionswinkel und Helligkeit der Doppelsterne (ausser Albireo B und Polaris B). Lizenz laut [data.gov](https://catalog.data.gov/dataset/washington-double-star-catalog) (Eintrag der HEASARC): U.S. Government Works ("License: https://www.usa.gov/government-works", "Access Level: public"); an der Quelle selbst keine Lizenzangabe. Danksagung: "This research has made use of the Washington Double Star Catalog maintained at the U.S. Naval Observatory."
- **Sixth Catalog of Orbits of Visual Binary Stars (ORB6)**, U.S. Naval Observatory (Matson, Williams, Hartkopf und Mason), <https://www.astro.gsu.edu/wds/orb6.html>: Abstand und Positionswinkel der Bahnpaare, Ephemeride 2027,0. An der Quelle keine Lizenzangabe; Katalog des USNO wie der WDS.
- **Hipparcos- und Tycho-Kataloge**, ESA (Hipparcos-Hauptkatalog, ESA 1997; Tycho Double Star Catalogue, Fabricius et al. 2002, A&A 384, 180), abgefragt im Hipparcos and Tycho Legacy Archive, <https://www.cosmos.esa.int/web/hipparcos/catalogues>: B-V der Doppelsterne, dazu V von Albireo B; V und B-V von 25 Plejaden-Sternen (M45) und von Theta1 Ori C und D und Theta2 Ori A (M42), diese abgefragt im Gaia-Archiv. "The Hipparcos and Tycho Catalogues are distributed under the [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/deed.en) licence and the Terms and Conditions for the use of these data require users to acknowledge ESA using “Credit: ESA”." Credit: ESA.
- **Bright Star Catalogue**, 5. Ausgabe (Hoffleit und Warren 1991), abgefragt bei der HEASARC, <https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html>: B-V von Mizar, Castor und Gamma Andromedae. An der Quelle keine Lizenzangabe.
- **SIMBAD**, CDS Strassburg (Wenger et al. 2000, A&AS 143, 9), Spiegel <https://simbad.cfa.harvard.edu/simbad/>: B und V von Antares B. "Use of SIMBAD service is free without any registration under ODbL licence. We request that users cite the original paper reference." Danksagung: "This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France".
- **Usenko und Klochkova**, Polaris B, <https://arxiv.org/abs/0708.0333>: V 8,60 und B-V 0,42 (nach Turner 2005) von Polaris B (Entscheidung 7 in [docs/recherche/README.md](docs/recherche/README.md)).
- **Gaia DR3**, ESA, mit Hipparcos fuer M45 (Plejaden), [daten/sterne/m45.json](daten/sterne/m45.json): 44 Mitglieder bis V 8,5 aus ESA Gaia DR3 und Hipparcos (ESA 1997, Neureduktion van Leeuwen 2007), abgefragt im Gaia-Archiv, erzeugt von `tools/m45_sterne.py`. Fuer M13 (Herkuleshaufen), [daten/sterne/m13.json](daten/sterne/m13.json): 531 Mitglieder bis V 15 aus Gaia DR3, erzeugt von `tools/m13_aufbereiten.py`. Fuer M42 (Orionnebel), [daten/sterne/m42.json](daten/sterne/m42.json): Trapez (Theta1 Ori A bis F), Theta2 Ori A und B und NU Ori aus Gaia DR3 und Hipparcos, V von Theta1 Ori E aus dem WDS, erzeugt von `tools/m42_sterne.py`. Credit: ESA, Gaia DPAC; Hipparcos: ESA. Lizenz [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/) (ESA Space Science Archives, https://www.cosmos.esa.int/web/gaia-users/license); kommerzielle Nutzung nur nach Genehmigung der ESA. This work has made use of data from the European Space Agency (ESA) mission Gaia (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis Consortium (DPAC, https://www.cosmos.esa.int/web/gaia/dpac/consortium). Funding for the DPAC has been provided by national institutions, in particular the institutions participating in the Gaia Multilateral Agreement.

## Entwicklung

```
source ~/.nvm/nvm.sh   # Node 22
npm install
npm run dev            # Dev-Server
npm test               # Vitest
npm run build          # nach dist/, kopiert daten/ mit und prueft die Groesse des Erstladens
```

GitHub Actions (`.github/workflows/`) fuehrt bei jedem Pull Request Tests und Build aus und veroeffentlicht jeden Push auf `main` auf GitHub Pages.
