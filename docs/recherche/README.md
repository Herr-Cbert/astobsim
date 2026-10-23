# Recherche (Phase 2)

Ergebnis von Phase 2, erstellt am 2026-10-23. Input war `docs/anforderungen.md`. Vier Recherche-Auftraege liefen parallel; jede Datei hat denselben Aufbau: Fachteil, "Empfehlung fuer astobsim", "Unsicher oder zu pruefen", nummerierte Quellen.

| Datei | Auftrag | Kennungen |
|---|---|---|
| [physik.md](physik.md) | Beugung, Seeing, Auge, Optikgroessen, Helligkeit, Himmelshintergrund, Punktquellen, Testwerte | A-P1 bis A-P6, A-B1 bis A-B4, A-D4, A-D5, A-Q1 |
| [geraete.md](geraete.md) | Obstruktion je Bauart, Geraeteliste, Fernglaeser, Okulare, Augenpupille, Datenformat | A-F1 bis A-F8 |
| [bilder.md](bilder.md) | Bildquellen je Objekt und Zustand, Lizenzen, Aufloesung, Dateigroesse, Bildnachweis | A-X1, A-X3 bis A-X6, A-X9 |
| [objekte.md](objekte.md) | Winkelgroessen, Zustaende, Monde, Zahlen fuer die Testfaelle, Magnituden, Datenformat | A-X1, A-X2, A-P6, A-Q2 |

Stichproben der Quellen (je Datei drei) und Nachrechnung der Testwerte wurden bei der Zusammenfuehrung gemacht und stimmten. Die fachliche Pruefung durch Herbert steht aus; Gesichertes wandert danach ins Second Brain.

## Antworten auf die offenen Fragen aus Anforderungen Abschnitt 9

| Nr | Frage | Antwort in Kurzform | Wo |
|---|---|---|---|
| 1 | Echte Aufnahme mit freier Lizenz und Aufloesung je Zustand? | Mars (3), Jupiter (2), Saturn (2): ja, Hubble WFC3/WFPC2 (NASA gemeinfrei bzw. ESA/Hubble CC BY 4.0), Cassini als Alternative. Mond erstes Viertel: nein. Orbitermosaike (LROC WAC 100 m/px) haben keinen Terminator, echte Fotos mit Terminator sind Amateuraufnahmen unter der geforderten Aufloesung, das SVS-Rendering ist gerendert (A-X9). Entscheidung noetig, siehe unten. | bilder.md Abschn. 2.3, Empfehlung |
| 2 | Obstruktion je Bauart | Refraktor 0 %, Newton 25 % (32 % bei Oeffnung bis 150 mm und f/5), Schmidt-Cassegrain 34 %, Maksutov 31 %. Belegt mit Herstellerangaben, Spannen 22 bis 37 %. | geraete.md Abschn. 1, Empfehlung |
| 3 | Inhalt der Geraeteliste | 22 Fernrohre von 60 bis 300 mm plus Auge und drei Fernglaeser, mit Belegprodukten; Streichkandidaten fuer 20 benannt. Okular-Presets 50/68/82/100 Grad. JSON empfohlen. | geraete.md Empfehlung |
| 4 | Seeing in Bogensekunden zu Wortstufe und Pickering | < 1" ausgezeichnet (P 8 bis 10, Antoniadi I), 1 bis 2" gut (P 6 bis 7, II), 2 bis 3" mittel (P 4 bis 5, III), 3 bis 5" schlecht (P 1 bis 3, IV bis V). Zuordnung ist weich, Pickering ist nicht als FWHM definiert; Ableitung ueber D/r0 am 5-Zoll-Refraktor. | physik.md Abschn. 2.5 |
| 5 | Seeing-Skalierung mit Luftmasse, Extinktionskoeffizienten | FWHM ~ X^0,6 (r0 ~ X^-0,6, Kolmogorov). Luftmasse nach Kasten-Young 1989. Extinktion k in mag pro Luftmasse: klar 0,20, leicht diesig 0,30, diesig 0,45 (Green 1992, Schaefer). Kontrastverlust durch Dunst: nur Heuristik, unbelegt. | physik.md Abschn. 2.3, 5.2, 5.3 |
| 6 | Form der Seeing-PSF und Kombination | Langzeit-Kolmogorov, FWHM = 0,98 lambda/r0. Im Ortsraum Moffat mit beta 4,765 (Trujillo 2001), im Frequenzraum direkt die Kolmogorov-OTF exp[-3,44 (lambda f/r0)^(5/3)]. Gauss nur fuer das Auge. Gesamt-PSF = Airy(D, eps) gefaltet mit Moffat gefaltet mit Gauss(60"/V); Quadratursumme der FWHM nur fuer die Anzeige (Fehler bis 3 %). Obstruktion ueber Pupillenautokorrelation, Daumenregel D(1-eps) gilt nur bis etwa 0,3 der Grenzfrequenz. | physik.md Abschn. 1.4, 2.2, 2.4, 3, 9 |
| 7 | Bortle zu Hintergrundhelligkeit im Okular | Tabelle Bortle 1 bis 9 zu 21,9 bis 17,0 mag/arcsec^2 (Stufen 8 und 9 geschaetzt). Im Okular dunkler um 5 log(p/AP). Planeten liegen 11 bis 18 mag ueber dem Himmel; Bortle wirkt in Version 1 nur auf den Feldgrauton und schwache Monde. | physik.md Abschn. 6 |
| 8 | Monde: Stellungen, Durchmesser, Magnituden | Io 1,20" / 5,0 mag, Europa 1,03" / 5,3, Ganymed 1,73" / 4,6, Kallisto 1,58" / 5,7 bei Jupiter 47"; Titan 0,85" / 8,4, Rhea 0,25" / 9,6 bei Saturn 20". Feste Stellungen als dx/dy in Bogensekunden vorgeschlagen, kleine Zustaende linear skaliert. | objekte.md Abschn. 3, Empfehlung |
| 9 | Zahlen fuer die Testfaelle | 1 km am Mond = 0,537", 4-km-Krater = 2,15", Hadley-Rille 0,64" breit. Cassini-Teilung 4550 km = 0,76" bei 20", 0,60" bei 16" (Linienkontrast, nicht Aufloesung). NEB/SEB 3,4" / 3,8" breit, GRF 4,6" x 3,3" bei 47". Syrtis Major 3,1" x 2,1" bei 14", 1,3" x 0,9" bei 6"; Polkappen 4 bis 6" bei 14". Mare 5' bis 23'. Mondelongationen Jupiter bis 10'. | objekte.md Abschn. 4 |

## Entscheidungen vor Phase 3

Punkte, die die Anforderungen beruehren oder zwischen den Dateien abgestimmt werden muessen. Die Detailbegruendung steht jeweils im Abschnitt "Unsicher oder zu pruefen" der genannten Datei.

**Entschieden von Herbert am 2026-10-23** (in `docs/anforderungen.md` eingearbeitet):

- Punkt 1 Mond: NASA-SVS-Rendering (Option b). A-X9 bekommt die Ausnahme.
- Punkt 2 Mars 6": Vollscheibe, Hilfetext nennt die reale Phase. A-X1 ergaenzt.
- Punkt 3 Saturn: Ringoeffnung 19 Grad, folgt dem Hubble-Bild 2021. A-X1 ergaenzt.
- Punkte 5 und 6: reale Werte, also 80 mm f/7,5 (80/600) in A-F2 und A-D9, Fernglas-Gesichtsfelder 7,2 / 6,5 / 4,4 Grad in A-F4.
- Punkt 8: Blendungsregel in A-P6 aufgenommen (Abstand unter 10', Helligkeitsunterschied ueber 6 mag).

Noch offen: Punkte 4 (Hubble-Lizenz-Lesart), 7 (A-F8-Grenzen), 9 (Monddurchmesser 1865"), 10 (Benennung der Zustaende Jupiter 35" und Saturn 16"). Vorschlaege stehen jeweils dabei; ohne Widerspruch uebernimmt Phase 3 die Vorschlaege.

1. **Mond erstes Viertel (A-X5 gegen A-X9).** Kein Bild erfuellt beides. Optionen: (a) A-X5 fuer den Mond auf Amateuraufloesung senken und ein CC-Mosaik nehmen (Commons 2026, CC BY-SA 4.0, Herkunft duenn; Niittee 2024, CC0, etwa 3000 px), (b) A-X9 fuer den Mond lockern und das NASA-SVS-Rendering (gemeinfrei, LOLA plus WAC, etwa 3000 px) nehmen, (c) einen Amateur um ein dokumentiertes Mosaik unter CC BY 4.0 bitten. bilder.md 2.3.
2. **Mars 6" ist gibbos** (beleuchtet etwa 0,90). objekte.md empfiehlt, das realistisch zu zeigen; bilder.md schlaegt vor, das 14"-Bild verkleinert zu nehmen (Vollscheibe). Entweder einen kuenstlichen Terminator zulassen (grenzt an A-X9) oder die Vollscheibe akzeptieren und im Hilfetext benennen. objekte.md Punkt 1.
3. **Saturn-Ringoeffnung.** objekte.md schlaegt B = 15 Grad vor, das empfohlene Hubble-Bild von 2021 hat etwa 19 Grad. Vorschlag: der Wert folgt dem Bild (A-X3 hat Vorrang), also 19 Grad in der Objektdatei; alternativ das Hubble-Bild 2022 (B etwa 15 Grad) nachrecherchieren, dessen NASA-Seite nicht erreichbar war. bilder.md Punkt 6 und 7, objekte.md Punkt 3.
4. **Hubble-Lizenz.** Dieselben Bilder sind bei NASA gemeinfrei und bei ESA/Hubble CC BY 4.0. Vorschlag: Credit-Zeile woertlich uebernehmen und beide Angaben im Bildnachweis fuehren. bilder.md 6.3.
5. **Startkonfiguration A-D9 "80 mm f/7".** Reale 80-mm-ED-Refraktoren sind meist 80/600 (f/7,5). Name oder Brennweite angleichen. geraete.md Empfehlung.
6. **A-F4 Fernglas 15x70.** Wahres Gesichtsfeld ist einheitlich 4,4 Grad, nicht 6 bis 7. Anforderung anpassen. geraete.md Abschn. 3.
7. **A-F8 Grenzen.** Oeffnung bis 310 mm (305-mm-Dobson), Okularbrennweite bis 60 mm (55/56-mm-Ploessl), scheinbares Gesichtsfeld bis 110 Grad, falls gewuenscht. geraete.md Abschn. 7.
8. **Jupitermonde mit blossem Auge (T6).** Ohne Blendung (A-P9) zeigt das Punktquellenmodell Ganymed und Kallisto neben Jupiter, die real nicht sichtbar sind. Eine einfache Regel ist noetig (z. B. Monde unterdruecken bei Abstand unter 10' und Helligkeitsunterschied ueber 6 mag). objekte.md Punkt 13.
9. **Monddurchmesser.** 1865" (Jahrbuchwert, Rechnung aus 3474,8 km und 384 400 km) gegen 1896" im NASA Fact Sheet. Vorschlag 1865". objekte.md Punkt 4.
10. **Zustaende Jupiter 35" und Saturn 16"** sind keine Oppositionen, sondern "Planet fern von Opposition" (5,6 bzw. 10,4 AE). Vorschlag: Werte belassen, im Hilfetext so benennen. objekte.md Punkt 2.

## Fachliche Luecken (nur sekundaer belegt oder geschaetzt)

- Pickering zu FWHM: eigene Ableitung, keine gemessene Zuordnung (physik.md 2.5).
- Bortle 8 und 9 in mag/arcsec^2: geschaetzt (physik.md 6.1).
- Kontrastverlust durch Dunst (A-B3): Schleier-Heuristik ohne Quelle (physik.md 5.3).
- Transmission je Bauart (0,90 Refraktor, 0,80 Newton und SC/Mak, 0,85 Fernglas): Groessenordnung aus Schichtreflexionen (physik.md 5.1).
- Jupiter-Bandkontrast 0,82 nur aus Orton 1975 als Sekundaerzitat; GRF-Groesse aus Hubble 2024, Simon et al. 2018 nicht im Volltext (objekte.md Punkt 9, 10).
- Mars-Polkappengroesse je Jahreszeit: Schaetzung aus ALPO-Angaben (objekte.md Punkt 12).
- Mond-Magnitude am ersten Viertel und Albedowerte: Groessenordnung ohne Primaerquelle (objekte.md Punkt 7, 8).
- Obstruktion Celestron C5, C90, NexStar 127SLT: vom Hersteller nicht angegeben (geraete.md "Unsicher").
- Cassini-Pixelmasse: aus TIFF-Groesse geschaetzt, erst nach Lizenzfreigabe am Original pruefen (bilder.md Punkt 8).

## Was Phase 3 aus der Recherche uebernimmt

- Formelsammlung mit Konstanten, Eingangs- und Ausgangsgroessen: physik.md Abschnitt 9. Testwerte fuer A-Q1: physik.md Abschnitt 8.
- Geraeteliste als Tabelle und JSON-Vorschlag: geraete.md Empfehlung und Abschnitt 6.
- Objektzustaende, Mondstellungen und JSON-Vorschlag: objekte.md Abschnitt 6.
- Empfohlene Bilder je Zustand mit URL, Lizenz, Pixelmass und Bildnachweis-Format: bilder.md Empfehlung und Abschnitt 8. Bilder werden erst nach Lizenzfreigabe geholt (bilder.md Abschnitt 9 nennt die Pruefschritte).
- Mond: 7600 px Durchmesser bei 0,25"/px, als eine Datei 14 bis 22 MB JPEG; Kacheln oder Stufen sind fuer A-X6 noetig (bilder.md Abschnitt 7). Entscheidung in ADR-003.
