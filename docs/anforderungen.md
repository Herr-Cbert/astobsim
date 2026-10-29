# Anforderungen astobsim

Ergebnis von Phase 1 (Interview am 2026-10-23). Dieses Dokument ist der einzige Input fuer Phase 2 (Recherche) und die Referenz fuer alle Issues. Am 2026-10-23 nach Phase 2 angepasst (A-F2, A-F4, A-P6, A-D9, A-X1, A-X9) und nach Phase 3 (A-X5), Begruendung in `docs/recherche/README.md`; am 2026-10-27 A-P6 praezisiert (scheinbarer Abstand, Issue #14, ADR-0002 Nachtrag). Am 2026-10-29 fuer Version 2 ergaenzt (Interview mit Herbert, Phase 1 Version 2): Stufe Muss V2, Abschnitt 9 und die mit "V2" markierten Nachtraege. Jede Anforderung hat eine Kennung, eine Stufe und einen pruefbaren Satz.

Stufen: **Muss** (Version 1 ist ohne sie nicht fertig), **Muss V2** (Version 2 ist ohne sie nicht fertig), **Kann** (nach Version 1, wird als Issue angelegt, nicht umgesetzt), **Nicht-Ziel** (bewusst ausgeschlossen).

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
| A-Z7 | Nicht-Ziel | Sonne, Kometen, beliebige Katalogobjekte. V2: Doppelsterne und Deep-Sky-Objekte gibt es nur als feste Liste (A-Z9, A-Z10); einzige Ausnahme ist das freie Doppelsternpaar (A-Z9). |
| A-Z8 | Kann | Venus als weiteres Objekt. |
| A-Z9 | Muss V2 | Doppelsterne als eigene Objektklasse: zwei Sterne als Punktquellen mit Airy-Scheibchen und Seeing-PSF (A-P6). Auswahl aus einer festen Katalogliste (Daten aus dem WDS), die die Spanne von leicht (Albireo, Mizar) ueber mittel (Epsilon Lyrae, Gamma Andromedae) bis zur Aufloesungsgrenze (Paare um 1 Bogensekunde) und grossen Helligkeitsunterschied (Antares) abdeckt, oder als freies Paar mit Trennung (Bogensekunden), zwei Magnituden und je Stern B-V (Vorgabe 0,6). Positionswinkel fest Ost-West (Orientierung ist A-D12). Paare, bei denen Ueberstrahlung die Sichtbarkeit entscheidet (Sirius B), stehen nicht in der Liste; ab etwa 4 mag Helligkeitsunterschied zeigt das Infopanel "Ueberstrahlung nicht simuliert" (A-P9). |
| A-Z10 | Muss V2 | Die Deep-Sky-Objekte M31, M42, M13, M45 und M57 mit eigenem Modell fuer Flaechenhelligkeit gegen den Himmelshintergrund und Wahrnehmungsschwelle (A-P11). Sterne, die zum Objekt gehoeren (M45, Trapez in M42), kommen als Punktquellen aus einem Katalog (Gaia DR3 oder Hipparcos); M13 als Quellbild, wenn die Recherche ein freies Foto ohne ausgebrannten Kern findet, sonst Katalogsterne plus Restlicht. Der Reflexionsnebel um M45 wird nicht gezeigt. |

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
| A-F8 | Muss | Freie Eingaben werden auf sinnvolle Bereiche begrenzt und bei Ueberschreitung abgeschnitten, mit Hinweis, nicht abgelehnt: Oeffnung 6 bis 300 mm, Brennweite 200 bis 4000 mm, Obstruktion 0 bis 50 Prozent, Okularbrennweite 2 bis 50 mm, scheinbares Gesichtsfeld 40 bis 100 Grad, Vergroesserung mindestens 1; beim Fernglas Vergroesserung 1 bis 1000 und wahres Gesichtsfeld 1 bis 30 Grad. |
| A-F9 | Kann | Optikqualitaet als Strehl-Wert unter "Erweitert", Standard 0,95. |
| A-F10 | Nicht-Ziel | Farbfehler von Achromaten, Koma, Justagefehler, Barlow-Linse (durch Okularbrennweite abgedeckt), Herstellernamen und Produktmodelle. |

## 3. Bedingungen

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-B1 | Muss | Seeing wird als Halbwertsbreite der Langzeit-PSF in Bogensekunden eingegeben (Bereich 0,5 bis 5). Daneben werden Wortstufe (ausgezeichnet, gut, mittel, schlecht) und Pickering-Stufe angezeigt. |
| A-B2 | Muss | Himmelshelligkeit wird als Bortle-Stufe 1 bis 9 eingegeben. In Version 1 wirkt sie auf die Hintergrundhelligkeit im Gesichtsfeld und den Kontrast des Objekts gegen den Hintergrund. Das Dokument und der Hilfetext sagen, dass die volle Wirkung erst mit Deep-Sky-Objekten kommt. V2: Sie wirkt zusaetzlich ueber die Wahrnehmungsschwelle (A-P11); der Satz zur vollen Wirkung entfaellt im Hilfetext. |
| A-B3 | Muss | Transparenz wird dreistufig gewaehlt (klar, leicht diesig, diesig) und als zusaetzliche Extinktion in Magnituden umgesetzt: Helligkeitsverlust und leichter Kontrastverlust. |
| A-B4 | Muss | Hoehe ueber dem Horizont wird in Grad eingegeben (10 bis 90, in Schritten von 5 Grad). Sie erhoeht die Luftmasse (Extinktion) und verschlechtert das Seeing. |
| A-B5 | Kann | Atmosphaerische Dispersion bei niedriger Hoehe als Farbverschiebung (oben blau, unten rot). |
| A-B6 | Kann | Umschalter "ruhiger Moment", der den Seeing-Anteil reduziert und den Anblick in kurzen ruhigen Phasen zeigt. |
| A-B7 | Nicht-Ziel | Flackern, Animation des Seeings, Zeitverlauf. |

## 4. Physik und Modell

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-P1 | Muss | Das Modell ist physikalisch begruendet. Jede Formel ist in `docs/recherche/` mit Quelle belegt. Massstab ist Uebereinstimmung mit Beobachtungserfahrung (Abschnitt 8), nicht wissenschaftliche Publikationsreife. |
| A-P2 | Muss | Die Aufloesung wird durch drei Grenzen bestimmt: Beugung (Airy-Scheibchen bzw. MTF der Oeffnung mit Obstruktion), Seeing (Langzeit-PSF mit der Halbwertsbreite aus A-B1, skaliert mit der Hoehe) und das Auge (fest 1 Bogenminute, durch die Vergroesserung geteilt). |
| A-P3 | Muss | Die Kontrastuebertragung beruecksichtigt die Obstruktion (Absenkung mittlerer Ortsfrequenzen). |
| A-P4 | Muss | Die Bildhelligkeit skaliert mit der Austrittspupille relativ zur festen Augenpupille von 6 mm und mit der Extinktion aus Transparenz und Hoehe. Nach oben ist sie begrenzt; Blendung wird nicht simuliert. V2: Das Modell der Abbildung auf den Bildschirm (`docs/recherche/physik.md` 12 und 14) bleibt, seine Konstanten werden auf die Zielkriterien aus A-P13 nachgestellt. |
| A-P5 | Muss | Der Nutzer sieht den typischen Anblick (Langzeitmittel), nicht den besten Moment. |
| A-P6 | Muss | Punktquellen (Monde) werden ueber ein eigenes Modell dargestellt: Airy-Scheibchen plus Seeing-PSF, Helligkeit aus der Magnitude, bei grossen Oeffnungen als kleine Scheibchen mit ihrem Winkeldurchmesser. Da Blendung nicht simuliert wird (A-P9), gilt eine Blendungsregel: eine Punktquelle wird nicht gezeigt, wenn sie scheinbar (Abstand am Himmel mal Vergroesserung) weniger als 10 Bogenminuten von einem Objekt entfernt steht, das mehr als 6 Magnituden heller ist (Jupitermonde mit blossem Auge). Nachtrag 2026-10-27 (Issue #14): "scheinbar" ergaenzt, Begruendung in ADR-0002. |
| A-P7 | Muss | Die Physik ist als reine, einzeln testbare Funktionen implementiert (siehe A-Q1). |
| A-P8 | Kann | Farbsaettigung nimmt bei dunklem Bild ab (Purkinje-Effekt). |
| A-P9 | Nicht-Ziel | Alter des Beobachters, variable Augenpupille, Blendung, Dunkeladaption, beidaeugiges Sehen. V2: Die Wahrnehmungsschwelle (A-P11) nimmt einen festen, voll dunkeladaptierten Beobachter an; die Adaption ist eine Konstante, keine Eingabe und kein Zeitverlauf. Ueberstrahlung heller Sterne gehoert zur Blendung. |
| A-P10 | Muss V2 | Ein unaufgeloester Zustand (Winkelgroesse mal Vergroesserung unter der Aufloesung des Auges, z. B. Jupiter mit blossem Auge) wird als Punktquelle dargestellt, deren Helligkeit aus dem Gesamtfluss folgt. Der Uebergang zwischen Flaeche und Punkt ist gleitend, damit sich der Anblick beim Aendern der Vergroesserung nicht sprunghaft aendert. |
| A-P11 | Muss V2 | Wahrnehmungsschwelle: Was fuer einen festen, voll dunkeladaptierten Normalbeobachter unter der Kontrastschwelle gegen den Himmel liegt (nach Blackwell, abhaengig von der Himmelsleuchtdichte im Okular und der Ausdehnung des Details), zeigt der Anblick als Himmel. Fuer Sterne folgt daraus eine Grenzgroesse. Gilt fuer alle Objekte. |
| A-P12 | Muss V2 | Farbe: Deep-Sky-Flaechen werden grau gezeigt. Sterne bekommen ihre Farbe aus B-V, aber nur ueber einer festen Leuchtdichteschwelle, darunter grau. Ein gleitender Uebergang gehoert zu A-P8. |
| A-P13 | Muss V2 | Zielkriterien der Anzeigehelligkeit: (i) Mond am Fernrohr: das hellste Perzentil der Scheibe erreicht bis zu einer Austrittspupille von etwa 1 mm Bildschirmweiss; (ii) Jupiter mit blossem Auge ist im Kern nahezu weiss, Mars und Saturn nach Magnitude abgestuft; (iii) A-P4 (Monotonie in der Austrittspupille) und T1 bis T6 gelten weiter. Die Zahlenwerte legt Herbert nach einer Messung der sRGB-Werte in T1 bis T6 fest. |

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
| A-D18 | Muss V2 | Die Objektauswahl ist nach Objektklasse gruppiert (Sonnensystem, Doppelsterne, Deep-Sky). Beim freien Doppelsternpaar erscheinen dessen Eingaben (A-Z9); sie stehen wie alle Parameter in der URL (A-D8). |

## 6. Daten und Bilder

| Kennung | Stufe | Anforderung |
|---|---|---|
| A-X1 | Muss | Jedes Objekt hat feste, repraesentative Zustaende mit Winkelgroesse, die aus einer Liste gewaehlt werden: Mond kurz nach dem ersten Viertel; Mars 6, 14 und 25 Bogensekunden; Jupiter 35 und 47 Bogensekunden; Saturn 16 und 20 Bogensekunden mit Ringoeffnung 19 Grad. Mars 6 Bogensekunden wird als Vollscheibe gezeigt, obwohl Mars in dieser Groesse real gibbos ist (etwa 90 Prozent beleuchtet); der Hilfetext nennt das. |
| A-X2 | Muss | Jupiter wird mit den vier Galileischen Monden gezeigt, Saturn mit Titan und Rhea, jeweils in einer festen typischen Stellung. Jeder Mond hat in der Objektdatei Position relativ zum Planeten (Bogensekunden), Winkeldurchmesser und Magnitude. |
| A-X3 | Muss | Verwendet werden nur echte Aufnahmen (Raumsonden, Mosaike) mit einer Lizenz, die Weitergabe und Bearbeitung erlaubt. Kein Bild kommt ohne geklaerte Lizenz ins Repo. |
| A-X4 | Muss | Jedes Bild ist in einer Datendatei mit Quelle, Lizenz, Winkelgroesse und ggf. Bearbeitung nachgewiesen. |
| A-X5 | Muss | Die Quellaufloesung darf bei 300 mm Oeffnung und 0,5 Bogensekunden Seeing nicht der begrenzende Faktor sein (Quellaufloesung mindestens doppelt so fein wie die beste simulierte Aufloesung). Ausnahme Mond in Version 1: das NASA-SVS-Rendering hat 0,643 Bogensekunden je Pixel, der Mond ist damit ab etwa 200 mm bei sehr gutem Seeing quellbegrenzt; der Hilfetext nennt das (Entscheidung 2026-10-23, ADR-0002). Speicherung als Kachelpyramide (ADR-0003). |
| A-X6 | Muss | Erstladen der Seite unter 5 MB. Bilder werden pro Objekt nachgeladen, pro Objekt unter 20 MB. |
| A-X7 | Muss V2 | Weitere Mondzustaende als feste Auswahl: zunehmende Sichel (etwa 4 Tage), erstes Viertel (vorhanden), Vollmond, letztes Viertel. Alle aus NASA SVS 5587 wie der Zustand nach dem ersten Viertel, mit derselben Aufbereitung und Eichung von Quellweiss. Ein stufenloser Phasenwinkel gehoert zu A-X8. |
| A-X8 | Kann | Datum und Ephemeriden fuer Phase, Libration, Winkelgroesse, Ringneigung, Mondstellungen. |
| A-X9 | Nicht-Ziel | Gerenderte Bilder (Kugel aus Karte oder Hoehenmodell), Hintergrundsterne, Marsmonde. Ausnahme Mond: das NASA-SVS-Rendering aus LRO-Daten (LOLA-Hoehenmodell und WAC-Mosaik) ist zugelassen, weil kein echtes Foto des ersten Viertels A-X5 erfuellt. V2: Sterne, die zu einem Objekt gehoeren (Doppelsterne, M45, Trapez, ggf. M13), sind zugelassen; Feldsterne um das Objekt bleiben Nicht-Ziel. |
| A-X10 | Kann | Erdlicht (aschgraues Licht) auf der Nachtseite der Mondsichel. Bis dahin bleibt die Nachtseite schwarz. |
| A-X11 | Muss V2 | Ausnahme zu A-X5 fuer grosse Deep-Sky-Objekte (M31, M45, M42): das Quellbild ist nur so fein, wie es fuer kleine Vergroesserungen noetig ist (fuer M31 etwa 3 bis 5 Bogensekunden je Pixel); bei hoher Vergroesserung zeigt der Anblick die Grenze des Quellbilds, der Hilfetext nennt das. Keine Begrenzung der Vergroesserung je Objekt. Kacheln nur, wenn die Groesse es verlangt. |

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
| A-Q4 | Muss V2 | Version 2 ist fertig, wenn alle Muss-V2-Anforderungen erfuellt sind, T1 bis T6 und die neuen Testfaelle T7 bis T12 bestehen, die Seite auf GitHub Pages erreichbar ist und der Tag `v2.0` gesetzt ist. Die uebrigen Kann-Punkte bleiben im Milestone "Spaeter". |
| A-Q5 | Muss V2 | Die Testfaelle T7 bis T12 schlaegt Claude in der Recherche mit Quellen aus der Beobachtungsliteratur vor, Herbert bestaetigt sie. Sie decken Doppelsterne, Deep-Sky-Objekte und die Helligkeit (A-P13) ab. |

### Beobachtungs-Testfaelle

| Nr | Konfiguration | Erwartung |
|---|---|---|
| T1 | Jupiter 47", 70 mm Refraktor, 100-fach, Seeing 2" | Zwei dunkle Aequatorbaender erkennbar, Grosser Roter Fleck nur als Andeutung. |
| T2 | Saturn 20", Seeing 1,5", 100 mm bei 150-fach gegen 60 mm | Cassini-Teilung im Langzeitmittel bei beiden Oeffnungen nicht erkennbar; bei 100 mm nur in ruhigen Momenten (A-B6), bei 60 mm auch dann nicht. Angepasst nach Issue #76 (Herbert, 2026-10-27, Begruendung `docs/recherche/physik.md` 15); vorher: bei 100 mm an den Ringenden erkennbar. |
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

## 10. Offene Fragen fuer die Recherche zu Version 2

1. Helligkeit (A-P13): sRGB-Werte (Mittel und hellstes Perzentil der Scheibe) in T1 bis T6 messen; daraus Vorschlag fuer Zahlenwerte der Zielkriterien und fuer die Konstanten (Anzeigeweiss, Kompressionsexponent).
2. Gleitender Uebergang Flaeche zu Punkt fuer unaufgeloeste Zustaende (A-P10): Kriterium und Uebergangsfunktion mit Quelle.
3. Kontrastschwelle nach Blackwell (A-P11): Daten, Abhaengigkeit von Himmelsleuchtdichte und Detailgroesse, daraus Grenzgroesse fuer Sterne; Vergleich mit gaengigen Formeln fuer die Grenzgroesse am Fernrohr.
4. Abbildung von Deep-Sky-Flaechen nahe der Himmelshelligkeit: traegt die getrennte Kompression je Ebene (physik.md 12.3) dort, oder braucht es eine gemeinsame Abbildung von Objekt und Himmel? Ergebnis als ADR-0004 "Helligkeit und Wahrnehmungsschwelle".
5. Leuchtdichteschwelle fuer die Sternfarbe und Abbildung von B-V auf sRGB (A-P12).
6. Katalogliste der Doppelsterne (A-Z9) mit WDS-Daten (Trennung, Magnituden, B-V).
7. Quellbilder mit freier Lizenz fuer M31, M42, M13, M57 und Flaechenhelligkeiten; Sternkatalog fuer M45 und das Trapez (A-Z10, A-X11).
8. Quellbilder der Mondphasen aus NASA SVS 5587 (A-X7).
9. Testfaelle T7 bis T12 mit Quellen (A-Q5), z. B. Paar nahe der Dawes-Grenze am 80 mm, Epsilon Lyrae im 10x50 und bei 100x, M57 am 80 mm bei Bortle 5, M31 mit blossem Auge bei Bortle 3 und 7, Sternzahl in M45 mit blossem Auge, M13 am 200 mm am Rand aufgeloest, Jupiter mit blossem Auge, Mond bei 1 mm Austrittspupille.
