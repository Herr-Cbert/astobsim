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

---

# Recherche Version 2 (Phase 2, 2026-10-29)

Input war `docs/anforderungen.md` Abschnitt 10. Vier Recherche-Auftraege liefen parallel, die Messung der Anzeigehelligkeit in der Hauptsession. Aufbau je Datei wie in Version 1.

| Datei | Auftrag | Kennungen |
|---|---|---|
| [helligkeit-v2.md](helligkeit-v2.md) | Messung sRGB in T1 bis T6, Konstanten der Abbildung, Planeten als Punktquelle | A-P13, A-P4, A-P10 |
| [wahrnehmung.md](wahrnehmung.md) | Kontrastschwelle (Blackwell, Crumey), Grenzgroesse, Uebergang Flaeche zu Punkt, gemeinsame oder getrennte Abbildung, Sternfarbe | A-P10, A-P11, A-P12, A-B2 |
| [doppelsterne.md](doppelsterne.md) | Katalogliste aus WDS, ORB6, Hipparcos, BSC; Modellrechnung der Trennung; Datenformat | A-Z9, A-D18 |
| [deep-sky.md](deep-sky.md) | Groessen, Helligkeiten, Profile von M31, M42, M13, M57; Sterne von M45, Trapez, M13 aus Gaia DR3; Datenformat | A-Z10, A-X9 |
| [bilder-v2.md](bilder-v2.md) | Quellbilder M31, M42, M13, M57 mit Lizenz; Mondphasen aus NASA SVS 5587; Bildnachweise | A-X7, A-X11, A-Z10 |

**Stichproben bei der Zusammenfuehrung** (alle stimmten): Harris 2010 fuer M13 ($V_t$ 5,78, $\mu_V(0)$ 16,59, $r_c$ 0,62', $c$ 1,53) im Katalog `mwgc.dat`; ESO eso1103a (Credit, 8948 x 8597 px, 35,49' x 34,10', WFI, Filter); Bildnummern der drei Mondphasen und von `mond_ev` gegen `data/roh/mooninfo_2026.json` (Zeit, Phase, Alter, Durchmesser); Ballesteros 2012 (B-V 0,65 ergibt 5778 K, nachgerechnet); Gaia/Hipparcos-Lizenz CC BY-NC 3.0 IGO in den ESA-Bedingungen der Weltraum-Archive; Crumey 2014 als MNRAS-Artikel (arXiv 1405.4209). Nicht pruefbar war die NOIRLab-Bildseite von M13 (Seite leer abgerufen); die Aussage "Kern nicht ueberbelichtet" bleibt bis zum Blick in die Datei offen.

## Antworten auf die offenen Fragen aus Anforderungen Abschnitt 10

| Nr | Frage | Antwort in Kurzform | Wo |
|---|---|---|---|
| 1 | Helligkeit A-P13 | Gemessen: Mond P99 bei AP 1 mm sRGB 113, mit blossem Auge 182; Jupiter mit blossem Auge 81. (i) braucht Faktor 6,2 linear. **Entschieden:** $n$ = 1/3 bleibt, Anzeigeweiss etwa 9,2 mag/arcsec$^2$ fuer Objekt und Himmel, Punktebene eigenes Weiss etwa 6,4; nach A-P10 nachmessen. | helligkeit-v2.md 1 bis 4 |
| 2 | Uebergang Flaeche zu Punkt (A-P10) | Zwei Kriterien: Sichtbarkeit an der Schwelle ueber die Ricco-Flaeche (in Crumeys Formel enthalten), Form heller Objekte ueber die Sehschaerfe 1'. Mischgewicht $g = 1/(1 + 0{,}3466\,x^2)$, $x = \theta V / 60''$ (eigene Herleitung): Jupiter blosses Auge 0,83, 10x 0,045. | wahrnehmung.md 3 |
| 3 | Kontrastschwelle (A-P11) | Crumey 2014 Gl. 47 (Auge), Gl. 77 bis 88 (Fernrohr), gueltig 1e-5 bis 3,4e-2 cd/m$^2$. **Entschieden:** Feldfaktor $F$ = 2 (typischer Beobachter). Grenzgroesse blosses Auge 6,2 / 6,0 / 5,5 / 5,0 / 4,8 bei Bortle 1/3/5/7/9; 80 mm 10,4 bis 12,7, 200 mm 12,1 bis 14,3. Bei dunklem Himmel 1 bis 2 mag unter Bortle (geuebter Beobachter). | wahrnehmung.md 1, 2, 7 |
| 4 | Getrennte oder gemeinsame Abbildung | Getrennt haengt der angezeigte Kontrast an Quellweiss (M31-Aussenbereich Faktor 15 zu schwach), gemeinsam allein bleiben Objekte an der Schwelle 0 bis 2 sRGB-Stufen ueber dem Himmel. Vorschlag: Deep-Sky-Ebene gemeinsam mit dem Himmel, Sonnensystem getrennt wie bisher, Schwelle per Isophote vor der Abbildung, gleitend nach Blackwell, Mindestsichtbarkeit je Objekt. Entwurf ADR-0004. | wahrnehmung.md 4, `docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md` |
| 5 | Sternfarbe (A-P12) | B-V ueber Ballesteros zu $T$, Planck und CIE 1931 zu sRGB (D65). Farbe ab $3{,}1\cdot10^{-7}$ lx am Auge, entspricht 2,3 mag mit blossem Auge, etwa 7,8 mag am 80 mm, 9,6 mag am 200 mm (Quelle duenn). | wahrnehmung.md 5 |
| 6 | Doppelsternliste (A-Z9) | 14 Objekte, 16 Paare von Albireo (34,3'') bis 52 Ari (0,56''), ungleiche Paare Zeta Her, Antares ($\Delta m$ 4,44), Polaris; Bahnpaare mit ORB6-Ephemeride 2027,0. Ausgeschlossen: Sirius, Rigel, 44 Boo, Eta CrB, Lambda Cas, Zeta Boo. | doppelsterne.md 2, 5 |
| 7 | Deep-Sky-Bilder und Sternkataloge | M31 NOIRLab LGS-Panorama (CC BY 4.0, auf 4''/px), M42 ESO eso1103a (CC BY 4.0, V-Kanal, Rohdaten CC BY 4.0), M13 NOIRLab Mayall 4 m (CC BY 4.0, Kern laut Seite nicht ueberbelichtet), M57 Hubble heic1310a bzw. linear OIII aus MAST. Profile: M31 Modell (Courteau 2011 + angepasste Scheibe), M13 King nach Harris 2010, M42 und M57 nur sekundaer. Sterne aus Gaia DR3: M45 44 Mitglieder bis V 8,5, Trapez A bis F, M13 2105 Mitglieder. | bilder-v2.md, deep-sky.md |
| 8 | Mondphasen SVS 5587 | Frames 6173 (Sichel 4,0 d, 17 %), 6449 (Vollmond), 6615 (letztes Viertel), derselbe Umlauf wie `mond_ev` (6285). Nachtseite im Rendering etwa zehnfach heller als Erdlicht. | bilder-v2.md 8 |
| 9 | Testfaelle T7 bis T12 | Unten, von Herbert bestaetigt. | wahrnehmung.md 8, doppelsterne.md 6, deep-sky.md 8, bilder-v2.md 10 |

## Testfaelle T7 bis T12 (A-Q5)

Bestaetigt von Herbert am 2026-10-29 (Phase 4 Version 2), ebenso A-Q4. T11 ist mit dem Feldfaktor $F$ = 1,4 aus ADR-0004 nachgerechnet (`wahrnehmung.md` 2.3, 8), die uebrigen Faelle haengen nicht an $F$.

Bedingungen wie T1 bis T6, falls nicht anders genannt: klar, Bortle 5, Zenit.

| Nr | Fall | Erwartung | Quelle |
|---|---|---|---|
| T7 | Pi Aql (1,40'') und Epsilon Ari (1,27''): 80 mm gegen 150 mm, Seeing 0,5'' | 80 mm: beide nicht getrennt (laenglich); 150 mm: beide getrennt | Dawes 1867, Haas; doppelsterne.md TD2 |
| T8 | Epsilon Lyrae im 10x50 und am 80 mm bei 160x | 10x50: zwei runde Sterne; 80 mm, Seeing 0,5'': beide engen Paare getrennt; Seeing 2'': im Langzeitmittel nicht (wie T2) | Haas, Beobachtungsfuehrer; doppelsterne.md TD1 |
| T9 | Antares am 150 mm, 200x | Seeing 0,5'': Begleiter getrennt, Hinweis "Ueberstrahlung nicht simuliert"; Seeing 1,5'' oder 15 Grad Hoehe: nicht getrennt | Haas, Lord; doppelsterne.md TD3 |
| T10 | M57 am 80 mm, etwa 80x, und am 150 mm | 80 mm: kleines Oval sichtbar, Loch hoechstens angedeutet; 150 mm: Ring mit dunkler Mitte | Beobachtungsfuehrer (sekundaer, uneins); deep-sky.md 8 Punkt 1 |
| T11 | Blosses Auge: M31 und Plejaden bei Bortle 3 und 7 | Bortle 3: M31 sichtbar, laenglich, 1,5 bis 3 Grad (Prototyp 106'); Plejaden 11 bis 14 Sterne (Grenze 6,2 zwischen den Zaehlstufen 6,0 und 6,5 in deep-sky.md 4.2; die Literatur nennt bis 14). Bortle 7: M31 hoechstens als Hauch des Kerns (bestes $C/C_\mathrm{th}$ 0,42, Deckkraft um 0,1); Plejaden sechs Sterne, Pleione mit Atlas verschmolzen. Infopanel-Grenzgroesse etwa 6,2 bzw. 5,2 (mit 0,2 mag Extinktion im Zenit) | Bortle 2001, Crumey 2014; wahrnehmung.md W1, W2; deep-sky.md 8 Punkte 2, 3 |
| T12 | Helligkeit (A-P13) | Mond am 80 mm bei AP 1 mm: hellstes Perzentil Bildschirmweiss; Jupiter mit blossem Auge im Kern nahezu weiss, Mars 14'' und Saturn deutlich dunkler; T1 bis T6 weiter erfuellt | A-P13, helligkeit-v2.md |

Reserve, falls Herbert tauschen will: M13 am 200 mm gegen 80 mm (Rand aufgeloest, deep-sky.md 8 Punkt 4), Trapez am 80 mm gegen 200 mm (E und F, Punkt 5), Grenzgroesse am 200 mm bei 50/100/200x (wahrnehmung.md W3), Sternfarbe Antares und Albireo (W4), Zeta Her (TD4).

## Entschieden von Herbert am 2026-10-29

- Konstanten der Abbildung (Frage 1): Empfehlung aus helligkeit-v2.md 4 angenommen.
- Feldfaktor $F$ = 2 (wahrnehmung.md 7). **Geaendert in Phase 3 Version 2 (2026-10-29): $F$ = 1,4** nach dem Prototyp (M31 mit blossem Auge, ADR-0004); Tabellen und Testwerte mit $F$ = 2 in wahrnehmung.md werden in Phase 4 umgerechnet (Grenzgroesse plus 0,39 mag); erledigt am 2026-10-29.
- Entscheidungen 1 bis 7 unten: 1 ja (Sterndaten mit eigener Lizenz), 2 ja (lineare Archivdaten fuer M42, M57, M13; M31 per Tonkurve gegen das Profil), 3 Testfaelle mit Seeing 0,5'', A-B6 bleibt Kann, der Hilfetext nennt das Langzeitmittel, 4 Begriff "Mehrfachstern" fuer Systeme mit mehr als zwei Sternen (GLOSSARY), 5 ja, 6 Nachtseite auf Schwarz, 7 ja (Polaris B 8,6 mag).
- Issue #100 (PR #126), drei Punkte zu `auswerten`: (a) Warnung `ueberstrahlung` nur bei Doppelsternen, nicht bei Deep-Sky (Trapez in M42); (b) die Grenzgroesse rechnet mit der Seeing-FWHM am Objekt (Zenitwert mal $X^{0{,}6}$); (c) Sterne und Trabanten zeigen die Deckkraft $P' = (P - P_0)/(1 - P_0)$, `unter_schwelle` bei $P'$ unter $10^{-3}$ (5,02 mag unter der Grenzgroesse), an der Grenzgroesse 0,49; Deep-Sky-Ebene bis #111 weiter mit $P$ (ADR-0004, Nachtrag Issue #100; `physik.md` 20). Die Startwerte Anzeigeweiss 9,2 und Punktweiss 6,4 bleiben bis #111.

## Entscheidungen vor Phase 3 (alle entschieden, siehe oben)

1. **Lizenz der Sterndaten.** Gaia DR3 und Hipparcos stehen unter CC BY-NC 3.0 IGO (nicht kommerziell); der Code steht unter MIT. Vorschlag: Sterndaten unter `daten/` behalten ihre eigene Lizenz wie die Bilder, Nachweis in den Daten und ein Abschnitt "Sterndaten" in README und Seitenfuss. Alternative ohne NC (WDS gemeinfrei, Yale BSC bis etwa 6,5 mag) deckt M13 und die schwachen Plejaden nicht. deep-sky.md 6, doppelsterne.md 3.
2. **Linearitaet der Deep-Sky-Bilder.** Alle Pressebilder sind nichtlinear gestreckt, die Eichung von Quellweiss (objekte.md 5.3) setzt lineare Pixel voraus. Vorschlag: lineare Archivdaten, wo die Lizenz belegt ist (M42 ESO-Archiv, M57 MAST, M13 NOIRLab-Archiv), fuer M31 das Pressebild per Tonkurve gegen das Profil aus deep-sky.md zurueckrechnen. bilder-v2.md Unsicher 1.
3. **Ruhiger Moment (A-B6).** Bei der Voreinstellung 2'' trennt das Langzeitmodell weder Epsilon Lyrae am 80 mm noch Paare an der Dawes-Grenze, wie bei der Cassini-Teilung (physik.md 15). Fuer Einsteiger ist "trenne ich Epsilon Lyrae?" die typische Frage. Optionen: A-B6 auf Muss V2 hochstufen, oder die Testfaelle mit Seeing 0,5'' fuehren und den Hilfetext ergaenzen. Ausserdem liegt die Schwelle "getrennt" ($\delta \ge$ 0,125) etwas hinter Dawes und Haas (Epsilon Ari am 100 mm auch ohne Seeing nicht getrennt). doppelsterne.md 4, 7.
4. **Epsilon Lyrae mit vier Sternen** widerspricht GLOSSARY "Doppelstern: zwei Sterne", und die feste Ost-West-Lage (A-Z9) passt bei vier Sternen nicht. Vorschlag: Glossar "zwei oder mehr Sterne eines Systems", fuer Mehrfachsysteme die echte Geometrie (Norden oben), Paare weiter Ost-West. doppelsterne.md 7.
5. **Blendungsregel fuer Sterne.** A-P6 (Abstand scheinbar unter 10', Unterschied ueber 6 mag) unterdrueckt Polaris B unter 33x. Vorschlag: Regel gilt auch fuer Sterne; der 4-mag-Hinweis nur bei Paaren unter etwa 10'' Trennung.
6. **Nachtseite des Mondes** in den SVS-Bildern: Vorschlag auf Schwarz setzen (Erdlicht ist A-X8, Kann), Vermerk in `bearbeitung`. bilder-v2.md 8.
7. **Polaris B:** WDS 9,10, SIMBAD 8,20, Usenko 8,60 mag; Vorschlag 8,6.

## Fachliche Luecken

- M31: Zentralhelligkeit der Scheibe ($\mu_{0,V}$ 20,2) an RC3 angepasst, nicht gemessen; sichtbare Ausdehnung etwa Faktor 1,5 unsicher (deep-sky.md 1).
- M42 und M57: keine V-Profile aus der Fachliteratur, M57 V 8,8 nur sekundaer; ob bei Emissionsnebeln visuell die Leuchtdichte Y oder der Gruenkanal zaehlt, ist offen.
- Uebergangsfunktion Flaeche zu Punkt: eigene Herleitung, belegt ist nur die Groessenordnung 1'.
- Farbschwelle 2,3 mag nur aus einer Fussnote (Protte & Hoffmann 2020); Uebertragung aufs Fernrohr ist Annahme.
- Blackwell, Knoll, Hecht, Clark und CIE 191:2010 nur ueber Crumey gelesen; Haas, Lord und Treanor nur ueber eine Amateur-Zusammenstellung.
- Trapez E und F: Gaia und WDS bis 1,5 mag verschieden; B-V roter Sterne aus Gaia nur extrapoliert.
- Mondbilder: Massstab 0,643''/px angenommen, nach dem Laden nachmessen; `tools/mond_kacheln.py` hat Frame 6285 fest eingebaut.

## Was Phase 3 aus der Recherche Version 2 uebernimmt

- ADR-0004 (Entwurf) mit den Entscheidungen oben; Glossar fuer Deep-Sky-Ebene, Isophote, Feldfaktor.
- Formeln und Testwerte: wahrnehmung.md 6, helligkeit-v2.md, doppelsterne.md 4.
- Datenformat: doppelsterne.md 3 (`typ: "doppelstern"`, `sterne[]`), deep-sky.md 7 (`typ: "deep_sky"`, `profil`, `sterne[]`); als Nachtrag zu ADR-0003.
- Bildnachweise als JSON-Vorschlag: bilder-v2.md 9. Bilder erst nach Lizenzfreigabe holen.

Ergebnis von Phase 3 Version 2 (2026-10-29): `docs/architektur.md` Abschnitt 5, ADR-0004 angenommen, ADR-0003 Nachtrag V2; Feldfaktor auf 1,4 geaendert (siehe oben).
