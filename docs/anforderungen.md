# Anforderungen astobsim

Ergebnis von Phase 1 (Interview am 2026-10-23). Dieses Dokument ist der einzige Input fuer Phase 2 (Recherche) und die Referenz fuer alle Issues. Am 2026-10-23 nach Phase 2 angepasst (A-F2, A-F4, A-P6, A-D9, A-X1, A-X9) und nach Phase 3 (A-X5), Begruendung in `docs/recherche/README.md`. Jede Anforderung hat eine Kennung, eine Stufe und einen pruefbaren Satz.

Stufen: **Muss** (Version 1 ist ohne sie nicht fertig), **Kann** (nach Version 1, wird als Issue angelegt, nicht umgesetzt), **Nicht-Ziel** (bewusst ausgeschlossen).

Kennungen: A-Z Zweck, A-F Fernrohr und Geraete, A-B Bedingungen, A-P Physik und Modell, A-D Darstellung und Bedienung, A-X Daten und Bilder, A-T Technik, A-Q Qualitaet und Abnahme.

## 1. Zweck und Zielgruppe

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-Z1 | Muss | astobsim zeigt, wie ein Himmelsobjekt mit dem Auge am Okular eines gegebenen Geraets unter gegebenen Bedingungen aussieht. |
| A-Z2 | Muss | Hauptzielgruppe sind Einsteiger, die vor dem Kauf oder der ersten Beobachtung wissen wollen, was realistisch zu sehen ist. Alle Voreinstellungen und Hilfetexte richten sich an sie. |
| A-Z3 | Muss | Erfahrene Beobachter koennen jeden Parameter direkt als Zahl eingeben, ohne durch Vereinfachungen fuer Einsteiger behindert zu werden. |
| A-Z4 | Muss | Version 1 umfasst die Objekte Mond, Jupiter, Saturn und Mars. |
| A-Z5 | Muss | Simuliert wird ausschliesslich der visuelle Anblick am Okular, kein Kamerabild. |
| A-Z6 | Nicht-Ziel | Fotografie (Belichtung, Stacking, Sensoren). |
| A-Z7 | Nicht-Ziel | Sonne, Kometen, beliebige Katalogobjekte. |
| A-Z8 | Kann | Venus als weiteres Objekt. |
| A-Z9 | Kann | Doppelsterne (Trennung nach Airy-Scheibchen und Seeing) als eigene Objektklasse. |
| A-Z10 | Kann | Ein bis zwei Deep-Sky-Objekte (z. B. M42, M13) mit eigenem Modell fuer Flaechenhelligkeit und Himmelshintergrund. |

## 2. Fernrohr und Geraete

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-F1 | Muss | Ein Geraet wird beschrieben durch Oeffnung (mm), Brennweite (mm), Obstruktion (Prozent des Oeffnungsdurchmessers) und Bauart (Refraktor, Newton, Schmidt-Cassegrain, Maksutov). Die Bauart setzt einen Vorschlagswert fuer die Obstruktion. |
| A-F2 | Muss | Das Geraet kann aus einer Liste gewaehlt oder frei eingegeben werden. Die Liste enthaelt herstellerneutrale Klassen (z. B. "80 mm f/7,5 ED-Refraktor", "200 mm f/6 Newton", "8 Zoll Schmidt-Cassegrain"), die 22 Fernrohre der Kernliste aus `docs/recherche/geraete.md` (60 mm bis 300 mm). |
| A-F3 | Muss | Die Liste enthaelt den Eintrag "Blosses Auge": Oeffnung 6 mm, Vergroesserung fest 1, keine Okularwahl. |
| A-F4 | Muss | Die Liste enthaelt drei Fernglaeser (8x42, 10x50, 15x70) mit fester Vergroesserung und typischem wahren Gesichtsfeld (8x42 etwa 7,2 Grad, 10x50 etwa 6,5 Grad, 15x70 etwa 4,4 Grad), ohne Okularwahl. |
| A-F5 | Muss | Die Geraeteliste liegt als eine von Hand erweiterbare Datendatei im Repo (Name, Typ, Bauart, Oeffnung, Brennweite, Obstruktion, bei Fernglaesern Vergroesserung und Gesichtsfeld). |
| A-F6 | Muss | Das Okular wird durch Brennweite (mm) und scheinbares Gesichtsfeld (Grad) beschrieben, mit Presets (z. B. Ploessl 50 Grad, Weitwinkel 68 Grad, 82 Grad). Vergroesserung und wahres Gesichtsfeld werden daraus berechnet. |
| A-F7 | Muss | Die Vergroesserung ist alternativ direkt editierbar; die Okularbrennweite wird dann angepasst. |
| A-F8 | Muss | Freie Eingaben werden auf sinnvolle Bereiche begrenzt und bei Ueberschreitung abgeschnitten, mit Hinweis, nicht abgelehnt: Oeffnung 6 bis 300 mm, Brennweite 200 bis 4000 mm, Obstruktion 0 bis 50 Prozent, Okularbrennweite 2 bis 50 mm, scheinbares Gesichtsfeld 40 bis 100 Grad, Vergroesserung mindestens 1. |
| A-F9 | Kann | Optikqualitaet als Strehl-Wert unter "Erweitert", Standard 0,95. |
| A-F10 | Nicht-Ziel | Farbfehler von Achromaten, Koma, Justagefehler, Barlow-Linse (durch Okularbrennweite abgedeckt), Herstellernamen und Produktmodelle. |

## 3. Bedingungen

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-B1 | Muss | Seeing wird als Halbwertsbreite der Langzeit-PSF in Bogensekunden eingegeben (Bereich 0,5 bis 5). Daneben werden Wortstufe (ausgezeichnet, gut, mittel, schlecht) und Pickering-Stufe angezeigt. |
| A-B2 | Muss | Himmelshelligkeit wird als Bortle-Stufe 1 bis 9 eingegeben. In Version 1 wirkt sie auf die Hintergrundhelligkeit im Gesichtsfeld und den Kontrast des Objekts gegen den Hintergrund. Das Dokument und der Hilfetext sagen, dass die volle Wirkung erst mit Deep-Sky-Objekten kommt. |
| A-B3 | Muss | Transparenz wird dreistufig gewaehlt (klar, leicht diesig, diesig) und als zusaetzliche Extinktion in Magnituden umgesetzt: Helligkeitsverlust und leichter Kontrastverlust. |
| A-B4 | Muss | Hoehe ueber dem Horizont wird in Grad eingegeben (10 bis 90). Sie erhoeht die Luftmasse (Extinktion) und verschlechtert das Seeing. |
| A-B5 | Kann | Atmosphaerische Dispersion bei niedriger Hoehe als Farbverschiebung (oben blau, unten rot). |
| A-B6 | Kann | Umschalter "ruhiger Moment", der den Seeing-Anteil reduziert und den Anblick in kurzen ruhigen Phasen zeigt. |
| A-B7 | Nicht-Ziel | Flackern, Animation des Seeings, Zeitverlauf. |

## 4. Physik und Modell

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-P1 | Muss | Das Modell ist physikalisch begruendet. Jede Formel ist in `docs/recherche/` mit Quelle belegt. Massstab ist Uebereinstimmung mit Beobachtungserfahrung (Abschnitt 8), nicht wissenschaftliche Publikationsreife. |
| A-P2 | Muss | Die Aufloesung wird durch drei Grenzen bestimmt: Beugung (Airy-Scheibchen bzw. MTF der Oeffnung mit Obstruktion), Seeing (Langzeit-PSF mit der Halbwertsbreite aus A-B1, skaliert mit der Hoehe) und das Auge (fest 1 Bogenminute, durch die Vergroesserung geteilt). |
| A-P3 | Muss | Die Kontrastuebertragung beruecksichtigt die Obstruktion (Absenkung mittlerer Ortsfrequenzen). |
| A-P4 | Muss | Die Bildhelligkeit skaliert mit der Austrittspupille relativ zur festen Augenpupille von 6 mm und mit der Extinktion aus Transparenz und Hoehe. Nach oben ist sie begrenzt; Blendung wird nicht simuliert. |
| A-P5 | Muss | Der Nutzer sieht den typischen Anblick (Langzeitmittel), nicht den besten Moment. |
| A-P6 | Muss | Punktquellen (Monde) werden ueber ein eigenes Modell dargestellt: Airy-Scheibchen plus Seeing-PSF, Helligkeit aus der Magnitude, bei grossen Oeffnungen als kleine Scheibchen mit ihrem Winkeldurchmesser. Da Blendung nicht simuliert wird (A-P9), gilt eine Blendungsregel: eine Punktquelle wird nicht gezeigt, wenn sie weniger als 10 Bogenminuten von einem Objekt entfernt steht, das mehr als 6 Magnituden heller ist (Jupitermonde mit blossem Auge). |
| A-P7 | Muss | Die Physik ist als reine, einzeln testbare Funktionen implementiert (siehe A-Q1). |
| A-P8 | Kann | Farbsaettigung nimmt bei dunklem Bild ab (Purkinje-Effekt). |
| A-P9 | Nicht-Ziel | Alter des Beobachters, variable Augenpupille, Blendung, Dunkeladaption, beidaeugiges Sehen. |

## 5. Darstellung und Bedienung

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-D1 | Muss | Hauptansicht ist das Gesichtsfeld als Kreis, in dem das Objekt im wahren Groessenverhaeltnis zum wahren Gesichtsfeld erscheint. Beim blossen Auge wird stattdessen ein rechteckiger Ausschnitt von etwa 5 Grad gezeigt. |
| A-D2 | Muss | Ist das Objekt groesser als das Gesichtsfeld, laesst sich der Ausschnitt mit der Maus verschieben. Das Objekt startet zentriert. |
| A-D3 | Muss | Per Klick ist eine Zoomansicht auf das Objekt moeglich; daneben wird das unverschlechterte Originalbild zum Vergleich gezeigt. |
| A-D4 | Muss | Neben dem Bild stehen: Vergroesserung, wahres Gesichtsfeld, Austrittspupille, Beugungsgrenze (Rayleigh und Dawes), seeingbegrenzte Aufloesung, Augengrenze, und welche der drei Grenzen dominiert. |
| A-D5 | Muss | Warnungen erscheinen bei Austrittspupille ueber 6 mm, unter 0,5 mm und bei Vergroesserung ueber dem Zweifachen der Oeffnung in mm. |
| A-D6 | Muss | Jeder Parameter und jede Zahl der Anzeige hat einen kurzen Hilfetext (Tooltip oder Infosymbol). |
| A-D7 | Muss | Das Ergebnis wird beim Aendern eines Parameters live neu berechnet, Zielwert unter 0,5 s bei typischer Bildgroesse. |
| A-D8 | Muss | Alle Parameter stehen in der URL, so dass eine Konfiguration als Link weitergegeben werden kann. |
| A-D9 | Muss | Startkonfiguration: 80 mm f/7,5 Refraktor (80/600), Okular 10 mm mit 50 Grad, Mond nach dem ersten Viertel, Seeing 2 Bogensekunden, Bortle 5, Transparenz klar, Hoehe 45 Grad. |
| A-D10 | Muss | Oberflaeche auf Deutsch. Alle Texte liegen gesammelt in einer Datei, damit eine Uebersetzung spaeter moeglich ist. |
| A-D11 | Muss | Orientierung: aufrecht, Norden oben, unabhaengig von der Bauart. |
| A-D12 | Kann | Bildorientierung je Bauart (Newton umgekehrt, Refraktor mit Zenitspiegel seitenverkehrt). |
| A-D13 | Kann | Zwei Konfigurationen nebeneinander vergleichen. |
| A-D14 | Kann | Seite "Wie rechnet astobsim" mit den Formeln. |
| A-D15 | Kann | Englische Oberflaeche. |
| A-D16 | Kann | Dunkles Farbschema, Tablet-Tauglichkeit. |
| A-D17 | Nicht-Ziel | Smartphone-Optimierung, Offline-Betrieb (PWA), Screenreader-Konzept. Barrierefreiheit beschraenkt sich auf Tastaturbedienung der Regler und ausreichende Kontraste. |

## 6. Daten und Bilder

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-X1 | Muss | Jedes Objekt hat feste, repraesentative Zustaende mit Winkelgroesse, die aus einer Liste gewaehlt werden: Mond kurz nach dem ersten Viertel; Mars 6, 14 und 25 Bogensekunden; Jupiter 35 und 47 Bogensekunden; Saturn 16 und 20 Bogensekunden mit Ringoeffnung 19 Grad. Mars 6 Bogensekunden wird als Vollscheibe gezeigt, obwohl Mars in dieser Groesse real gibbos ist (etwa 90 Prozent beleuchtet); der Hilfetext nennt das. |
| A-X2 | Muss | Jupiter wird mit den vier Galileischen Monden gezeigt, Saturn mit Titan und Rhea, jeweils in einer festen typischen Stellung. Jeder Mond hat in der Objektdatei Position relativ zum Planeten (Bogensekunden), Winkeldurchmesser und Magnitude. |
| A-X3 | Muss | Verwendet werden nur echte Aufnahmen (Raumsonden, Mosaike) mit einer Lizenz, die Weitergabe und Bearbeitung erlaubt. Kein Bild kommt ohne geklaerte Lizenz ins Repo. |
| A-X4 | Muss | Jedes Bild ist in einer Datendatei mit Quelle, Lizenz, Winkelgroesse und ggf. Bearbeitung nachgewiesen. |
| A-X5 | Muss | Die Quellaufloesung darf bei 300 mm Oeffnung und 0,5 Bogensekunden Seeing nicht der begrenzende Faktor sein (Quellaufloesung mindestens doppelt so fein wie die beste simulierte Aufloesung). Ausnahme Mond in Version 1: das NASA-SVS-Rendering hat 0,643 Bogensekunden je Pixel, der Mond ist damit ab etwa 200 mm bei sehr gutem Seeing quellbegrenzt; der Hilfetext nennt das (Entscheidung 2026-10-23, ADR-0002). Speicherung als Kachelpyramide (ADR-0003). |
| A-X6 | Muss | Erstladen der Seite unter 5 MB. Bilder werden pro Objekt nachgeladen, pro Objekt unter 20 MB. |
| A-X7 | Kann | Vollmond und weitere Mondphasen. |
| A-X8 | Kann | Datum und Ephemeriden fuer Phase, Libration, Winkelgroesse, Ringneigung, Mondstellungen. |
| A-X9 | Nicht-Ziel | Gerenderte Bilder (Kugel aus Karte oder Hoehenmodell), Hintergrundsterne, Marsmonde. Ausnahme Mond: das NASA-SVS-Rendering aus LRO-Daten (LOLA-Hoehenmodell und WAC-Mosaik) ist zugelassen, weil kein echtes Foto des ersten Viertels A-X5 erfuellt. |

## 7. Technik und Betrieb

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-T1 | Muss | Alles laeuft im Browser, kein Server-Backend, keine serverseitige Bildverarbeitung. |
| A-T2 | Muss | Hosting als statische Seite auf GitHub Pages. |
| A-T3 | Muss | Unterstuetzt werden aktuelle Desktop-Versionen von Chrome und Firefox. Safari und Edge sollten laufen, werden nicht getestet. |
| A-T4 | Muss | Keine Nutzerkonten, keine Cookies, kein Tracking, keine Analyse-Dienste. Konfigurationen werden nur ueber die URL gespeichert (A-D8). |
| A-T5 | Muss | Code unter MIT-Lizenz. Bilder behalten ihre eigene Lizenz (A-X4). |
| A-T6 | Muss | Die Wahl des Stacks (Sprache, Canvas/WebGL/WASM) erfolgt in Phase 3 (ADR-001) und wird durch A-D7 und A-X5 getrieben. |

## 8. Qualitaet und Abnahme

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-Q1 | Muss | Alle Physik-Funktionen haben Unit-Tests gegen bekannte Werte (z. B. Rayleigh-Grenze fuer 100 mm bei 550 nm, Austrittspupille, Luftmasse). |
| A-Q2 | Muss | Die sechs Beobachtungs-Testfaelle unten werden in Phase 6 visuell geprueft. Abweichungen werden Issues. |
| A-Q3 | Muss | Version 1 ist fertig, wenn alle Muss-Anforderungen erfuellt sind, die Seite oeffentlich erreichbar ist und Phase 6 abgeschlossen ist. Kann-Punkte werden als Issues fuer "nach Version 1" angelegt. |

### Beobachtungs-Testfaelle

| Nr | Konfiguration | Erwartung |
|---|---|---|
| T1 | Jupiter 47", 70 mm Refraktor, 100-fach, Seeing 2" | Zwei dunkle Aequatorbaender erkennbar, Grosser Roter Fleck nur als Andeutung. |
| T2 | Saturn 20", Seeing 1,5", 100 mm bei 150-fach gegen 60 mm | Cassini-Teilung bei 100 mm an den Ringenden erkennbar, bei 60 mm nicht. |
| T3 | Mond, 80 mm, 100-fach, Seeing 2" | Krater ab etwa 4 km Durchmesser am Terminator erkennbar, Rillen (z. B. Hadley-Rille) nicht. |
| T4 | Jupiter, 300 mm gegen 100 mm, Seeing 3" und Seeing 1" | Bei 3" zeigt der 300 mm kaum mehr Detail als der 100 mm, ist nur heller. Bei 1" ist der Unterschied deutlich. |
| T5 | Mars 14", 150 mm, 200-fach, Seeing 1,5"; Mars 6", 80 mm | Bei 14" Polkappe und Syrtis Major als dunkle Struktur erkennbar. Bei 6" im 80 mm nur Scheibchen mit angedeuteter Polkappe. |
| T6 | Mond und Jupiter mit blossem Auge; Jupiter im 10x50 | Mond: Mare als Flecken, keine Krater. Jupiter: mit blossem Auge ein Punkt; im 10x50 winziges Scheibchen mit zwei bis vier Monden in einer Linie, keine Baender. |

## 9. Offene Fragen fuer Phase 2

1. Gibt es fuer jeden Zustand aus A-X1 eine echte Aufnahme mit freier Lizenz und ausreichender Aufloesung (A-X5)? Sonst Liste der Zustaende anpassen.
2. Typische Obstruktionswerte je Bauart fuer A-F1 (Newton, Schmidt-Cassegrain, Maksutov).
3. Inhalt der Geraeteliste (A-F2): welche Klassen, mit welchen Werten. Erledigt (Issue #11): die 22 Fernrohre der Kernliste in `docs/recherche/geraete.md`, A-F2 angepasst.
4. Zuordnung Seeing in Bogensekunden zu Wortstufe und Pickering-Skala (A-B1).
5. Skalierung des Seeings mit der Luftmasse und Extinktionskoeffizienten fuer die Transparenzstufen (A-B3, A-B4).
6. Form der Seeing-PSF (Gauss, Moffat, Kolmogorov-Langzeit) und wie Beugung, Seeing und Auge zu einer Gesamt-PSF kombiniert werden (A-P2).
7. Wirkung der Bortle-Stufe auf Hintergrundhelligkeit im Okular bei gegebener Austrittspupille (A-B2).
8. Typische Stellungen, Durchmesser und Magnituden der Monde fuer A-X2.
9. Zahlenwerte fuer die Testfaelle T1 bis T6 (Kraterdurchmesser, Trennung der Cassini-Teilung), um die Erwartungen quantitativ zu untermauern.
