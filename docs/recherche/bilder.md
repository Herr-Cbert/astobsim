# Recherche: Bilder und Lizenzen

- Auftrag: Quellbilder fuer Mond, Mars, Jupiter und Saturn finden, die echte Aufnahmen sind, eine Lizenz mit Weitergabe und Bearbeitung haben und die Aufloesungsmesslatte aus A-X5 erfuellen. Lizenzen beim Datenhalter belegen.
- Datum: 2026-10-23 (Phase 2)
- Zugeordnete Kennungen: A-X1, A-X3, A-X4, A-X5, A-X6, A-X9. Offene Frage 1 aus Abschnitt 9 der Anforderungen.
- Vorgehen: Nur Webseiten der Datenhalter gelesen (Photojournal/science.nasa.gov, LROC, USGS Astrogeology, ESA/Hubble, ESA, NASA SVS, JPL Horizons). Es wurde kein Bild heruntergeladen. Pixelmasse, die eine Seite nicht nennt, sind aus TIFF-Dateigroesse oder Grad-Abdeckung gerechnet und als "geschaetzt" markiert.
- Wikimedia Commons diente nur als Fundstelle fuer Amateuraufnahmen; dort ist die Dateiseite des Urhebers zugleich die Lizenzquelle.

## Kurzfassung

- Planeten: Fuer alle sieben Planetenzustaende gibt es echte Aufnahmen mit freier Lizenz, die die Messlatte A-X5 um Faktor 3 bis 12 uebertreffen. Empfohlen: Hubble/OPAL-Einzelbilder (Jupiter 2019, Saturn 2021, Mars 2003 und 2016), als Alternative ohne CC-Frage Cassini PIA04866 fuer Jupiter.
- Mond: Kein Bild erfuellt zugleich A-X3 (echte Aufnahme), A-X5 (0,25" echte Aufloesung) und den Zustand "kurz nach dem ersten Viertel". Orbiter-Mosaike (LROC WAC 100 m/px) haben keinen Terminator, Erdfotos erreichen die Aufloesung nicht, das SVS-Rendering widerspricht A-X9. Es gibt aber ein echtes Foto des ersten Viertels mit 13 454 px unter CC BY-SA 4.0 (Amateur, Commons) und ein CC0-Foto mit etwa 3000 px Scheibe. Entscheidung noetig (Abschnitt 2.3).
- Lizenzen: NASA/JPL/USGS/SVS gemeinfrei mit erbetener Nennung; ESA/Hubble CC BY 4.0 (Lesart gegen NASA-Gemeinfreiheit zu klaeren, praktisch gleichwertig); ESA-Standardlizenz ungeeignet (nicht-kommerziell); Mars Express CC BY-SA 3.0 IGO und Amateur CC BY-SA 4.0 sind Copyleft; Hope/EXI, Tianwen-1 und Kaguya ohne belegte freie Lizenz.
- Dateigroesse: Planeten zusammen unter 3 MB. Mondscheibe mit 7600 px als eine JPEG-Datei 14 bis 22 MB, also nur mit AVIF/Graustufe oder Kacheln unter 20 MB.

## 1. Messlatte fuer die Quellaufloesung (A-X5)

Beste simulierte Aufloesung: 300 mm Oeffnung, Rayleigh bei 550 nm = 138/300 = 0,46 Bogensekunden; mit Seeing 0,5" quadratisch kombiniert etwa 0,6". Quelle mindestens doppelt so fein: **0,25" pro Pixel am Objekt**, und zwar als echte Aufloesung, nicht nur als Pixelmass (hochskalierte Pressebilder zaehlen nicht).

| Objekt, Zustand | Winkelgroesse | Noetige Pixel ueber das Objekt | 0,25" entspricht am Objekt |
|---|---|---|---|
| Mars 6" | 6" | 24 px | 283 km |
| Mars 14" | 14" | 56 px | 121 km |
| Mars 25" | 25" | 100 px | 68 km |
| Jupiter 35" | 35" | 140 px | 1020 km |
| Jupiter 47" | 47" | 188 px | 760 km |
| Saturn 16" Scheibe / Ringe | 16" / 36,3" | 64 px / 145 px | 1880 km |
| Saturn 20" Scheibe / Ringe | 20" / 45,4" | 80 px / 182 px | 1510 km |
| Mond | 1900" | 7600 px | 0,457 km |

Rechenbasis: Mars 6792 km, Jupiter 142 984 km, Saturn 120 536 km, A-Ring-Aussendurchmesser etwa 2,27 Scheibendurchmesser (273 600 km), Mond 3474 km.

Folgerung:
- Planeten: Hubble WFC3/UVIS hat 0,04"/px und eine Beugungsaufloesung von etwa 0,05 bis 0,08". Das ist 3- bis 6-mal feiner als die Messlatte, selbst bei Mars 25" (Hubble loest dort 27 bis 30 km auf, gefordert sind 68 km). Raumsondenmosaike (Cassini) liegen um Faktor 10 und mehr darueber. Die Planeten sind unkritisch.
- Mond: 0,25" echte Aufloesung ist vom Erdboden nicht erreichbar (beste Amateur-Mosaike mit 350 mm und Lucky Imaging erreichen in Spitzen 0,4 bis 0,6", typisch 0,8 bis 1,5"). Nur Orbiter-Daten (LROC WAC 100 m/px) erfuellen A-X5. Orbiter-Mosaike haben aber keinen Terminator (Abschnitt 2.1). Hier kollidieren A-X5, A-X9 und der Zustand "kurz nach dem ersten Viertel".

## 2. Mond, Zustand "kurz nach dem ersten Viertel"

### 2.1 Grundproblem

Ein Orbiter in polarer Bahn fotografiert jeden Streifen bei etwa gleicher Ortszeit. Globale Mosaike haben deshalb ueberall denselben Sonnenstand (niedrig: Relief ueberall; hoch: Albedo ueberall), die LROC-Produkte sind ausserdem photometrisch auf eine gemeinsame Geometrie normiert (Hapke-Modell). Den Anblick des ersten Viertels (Schatten am Terminator, flach beleuchteter Rand) erzeugt daraus nur ein Rendering mit Hoehenmodell, genau das, was A-X9 ausschliesst. Echte Fotos mit Terminator gibt es nur von der Erde (Amateure, Sternwarten) oder aus der Erdumlaufbahn (ISS, kleine Mondscheibe).

### 2.2 Kandidaten

| Kandidat | Pixelmass, Groesse | Projektion, Beleuchtung | Lizenz | Bewertung |
|---|---|---|---|---|
| LROC WAC Global Morphologic Map (`WAC_GLOBAL`) [Q10] | 100 m/px; 256 px/Grad; global rechnerisch 109 164 x 54 582 px; 8 Kacheln 60 x 90 Grad (ca. 15 360 x 23 040 px) plus 2 Polkacheln | Aequirektangular, polarstereografisch und **orthographische Hemisphaeren** (zentriert 0, 60, 120, 180, 240, 300 Grad Laenge); 643 nm, Hapke-normiert, Beta-Winkel 53 bis 69 Grad; Format PYR.TIF; als ISIS-Cube 19,2 GB [Q12] | NASA/GSFC/ASU, PDS-Daten, gemeinfrei (USGS-Kopie als "Public domain" gefuehrt, Abschnitt 6.6) | Erfuellt A-X5 (100 m gegen 457 m). Kein Terminator, gleichmaessig schraeges Licht. Orthographische Kachel ist eine Kartenprojektion echter Fotos, aber kein Foto einer Phase. |
| LROC WAC Nearside "no-slew" Mosaik [Q11] | 24 000 x 24 000 px, 3474 km Bildbreite, also 145 m/px; PNG | Vollscheibe der Nahseite, Dez 2010, 1300 Bilder, Einfallswinkel am Aequator 69 bis 82 Grad (Sonne 8 bis 21 Grad hoch) | NASA/GSFC/Arizona State University | Niedrige Sonne ueberall, sieht wie ein Reliefmodell aus, nicht wie ein Halbmond. Erfuellt A-X5 (145 m). Download nur als PNG im News-Beitrag. |
| LROC WAC Nearside Dawn Mosaic [Q12] | 643 nm, Dez 2010 bis Dez 2011, 9,8 GB ISIS-Cube | wie oben, Kartenprodukt | wie oben | wie oben, fuer Browser ungeeignet ohne eigene Aufbereitung |
| LROC WAC Farside Dusk (`WAC_ROI_FARSIDE_DUSK`) [Q13] | 100 m/px | Rueckseite | wie oben | Nicht relevant (Rueckseite) |
| PIA13516 "Moon seen from the East" [Q14] | TIFF 864 KB, also klein | WAC-Mosaik, 90 Grad Ost zentriert, Sonnenstand aendert sich um 28 Grad ueber das Mosaik | NASA/GSFC/ASU | Zu klein, falsche Zentrierung |
| NASA SVS "Moon Phase and Libration" 2026 (ID 5587) und 2025 (ID 5415) [Q15][Q16] | Frames 5760 x 3240 (auch EXR), benannte Phasen 3240 x 3240 TIFF; Monddurchmesser nicht angegeben, geschaetzt 2900 bis 3200 px | **Rendering** aus LOLA-Hoehenmodell und LROC-WAC-Farbmosaik mit DE421-Ephemeride, stundengenaue Phase und Libration, "A rendering of the Moon showing its phase and libration" | SVS: "All of our content is in the public domain (unless otherwise noted)" [Q17] | Einzige Quelle mit physikalisch richtigem Terminator und freier Lizenz. Verstoss gegen A-X9 (Kugel aus Karte und Hoehenmodell). Unter 4000 px. |
| Kaguya TC Global Orthomosaic 474 m [Q18] | 23 040 x 11 520 px, 16 Bit, 506 MB | Aequirektangular, Morgen- und Abendbeleuchtung der Quellkacheln | (c) JAXA/SELENE, Verweis auf JAXA-Nutzungsbedingungen, keine CC-Lizenz | Verfehlt A-X5 knapp (474 m gegen 457 m), Lizenz unklar, Karte |
| Commons "20260423 - First Quarter Moon Mosaic.png" [Q19] | 13 454 x 12 234 px, 188,65 MB PNG; nominell 0,28 km/px | Echtes Foto, erstes Viertel, 23.04.2026, Mosaik; Geraet und Kachelzahl nicht angegeben | **CC BY-SA 4.0**, Urheber "Yoships or MuonMan" (Own work) | Groesstes gefundenes echtes Foto des ersten Viertels. Echte Aufloesung unbekannt (Amateur, vermutlich 0,5 bis 1"), Herkunft duenn dokumentiert. Copyleft. |
| Commons "Moon in Torva.png" [Q20] | 4818 x 3204 px; Mondscheibe geschaetzt 3000 px | Echtes Foto, erstes Viertel, 17.04.2024, Celestron EdgeHD 9.25, ZWO ASI071MC Pro | **CC0 1.0**, Taavi Niittee (Torva Astronomy Club) | Freieste Lizenz, Geraet dokumentiert, unter 4000 px |
| Commons "Thomas Bresson - Premier quartier de Lune (by).jpg" [Q21] | 4991 x 5901 px | Echtes Foto, 03.04.2009, Celestron C8 afokal mit Kompaktkamera, Mosaik | **CC BY 2.0**, Thomas Bresson | Ueber 4000 px, aber Afokaltechnik 2009, echte Aufloesung vermutlich deutlich unter dem Pixelmass |
| ISS-Fotos des ersten Viertels (Commons, z. B. iss071e081873) | 4928 x 2768, Mond darin klein | Echtes Foto aus dem Orbit | NASA, gemeinfrei | Mondscheibe wenige hundert Pixel, ungeeignet |
| Apollo, Clementine, Galileo | - | Apollo-Fernaufnahmen zeigen den Mond nahe voll oder stark konvex; Clementine ist ein Hochsonnen-Kartenprodukt (UVVIS, USGS, gemeinfrei) | gemeinfrei | Keine Aufnahme des ersten Viertels gefunden |

### 2.3 Klare Aussage

- Ein echtes Foto des ersten Viertels mit mindestens 4000 px Durchmesser und freier Lizenz **existiert**: das Commons-Mosaik vom 23.04.2026 (13 454 px, CC BY-SA 4.0) und mit Abstrichen Bresson 2009 (4991 px, CC BY 2.0). Beide stammen von Amateuren, beide erfuellen A-X5 nach Pixelmass, aber mit hoher Wahrscheinlichkeit **nicht nach echter Aufloesung** (0,25" vom Boden ist nicht erreichbar).
- Ein Produkt, das A-X5 wirklich erfuellt (LROC WAC 100 m/px) und zugleich einen echten Terminator zeigt, gibt es nicht und kann es physikalisch nicht geben (Abschnitt 2.1).
- Herbert muss fuer den Mond eine von drei Lockerungen waehlen: (a) A-X5 fuer den Mond auf "beste erreichbare Amateuraufloesung" senken und ein CC-Mosaik verwenden, (b) A-X9 fuer den Mond lockern und das SVS-Rendering (gemeinfrei, physikalisch korrekt, aber nur etwa 3000 px) oder ein eigenes Rendering aus WAC und LOLA nehmen, (c) den Zustand aendern (z. B. Vollmond aus LROC-Orthographie, was aber ebenfalls kein Phasenfoto ist).
- Ein vierter Weg: einen Amateur mit dokumentierter Ausruestung (z. B. 300 bis 400 mm, Lucky Imaging) um ein Mosaik unter CC BY 4.0 bitten. Dann sind Geraet, Datum und Bearbeitung fuer den Bildnachweis sauber.

## 3. Mars 6", 14", 25"

Ephemeride fuer die Aufnahmedaten (JPL Horizons, geozentrisch) [Q22]: 2003-08-26: 25,12", subterrestrische Breite -19,0 Grad (Suedpolkappe zugewandt). 2016-05-12: 17,51", +8,6 Grad. 1995-02-25 (Nachtrag #78): 13,46" bis 13,40" ueber den Tag, +17,6 Grad, Positionswinkel der Nordpolachse 2,6 Grad, Phasenwinkel 11,3 Grad.

Nachtrag 2026-10-28 (Issue #78): mars_14 und mars_6 nutzen seit #78 Hubble WFPC2 vom 25.02.1995 ("Mars at Opposition 1995 (Syrtis Major Region)", NASA https://science.nasa.gov/asset/hubble/mars-2/, ESA opo9516d, pixelgleich, 800 x 800 px, Scheibe 618 px, etwa 295 px native). Grund: heic1609a (2016, Ls etwa 151) zeigt keine abgegrenzte Nordkappe, T5 verlangt eine; 1995 liegt bei Ls etwa 64 (Aphel-Opposition, Nordfruehling) mit grosser Nordkappe und Syrtis Major in der Mitte. Credit "Philip James (University of Toledo), Steven Lee (University of Colorado), NASA" (ESA: "... NASA / ESA"). Verworfen bei der Suche: 1999 PIA01592 (Sommer-Restkappe, schaerfer), 1997 opo9715c und opo9709b (Montagen mit Text, JPEG), 2024 heic2505b (Kappe unter Polhaube, UV-Anteil), 2007 und 2001 (Polhaube bzw. Staubsturm).

| Kandidat | Datum, Instrument | Groesse, Aufloesung | Sichtbar | Lizenz, Credit | Bewertung |
|---|---|---|---|---|---|
| Hubble "Close Encounter with Mars", 26.08.2003 [Q23][Q24] | WFPC2, 11 h vor der groessten Annaeherung, 55,76 Mio. km | Downloads 800 x 800 (TIF 1,84 MB, JPG); Original WFPC2-PC-Chip 0,0455"/px, also etwa 550 px native; kleinste Strukturen ca. 27 km | **Syrtis Major** (Haifischflosse rechts), Hellas, Sinus Meridiani, Huygens-Krater, Suedpolkappe mit Staubstreifen, Nordpol unter Wolken | Credit "NASA, J. Bell (Cornell University), and M. Wolff (Space Science Institute)"; Nachtrag 2026-10-26 (Issue #12), woertlich auf der NASA-Seite: "NASA, J. Bell (Cornell U.) and M. Wolff (SSI); Additional image processing and analysis support from: K. Noll and A. Lubenow (STScI); M. Hubbard (Cornell U.); R. Morris (NASA/JSC); P. James (U. Toledo); S. Lee (U. Colorado); and T. Clancy, B. Whitney and G. Videen (SSI); and Y. Shkuratov (Kharkov U.)", ESA-Kopie "NASA/ESA, J. Bell (Cornell U.) and M. Wolff (SSI)"; NASA-Veroeffentlichung, gemeinfrei (Abschnitt 6.3); ESA-Kopie opo0322a unter CC BY 4.0 | **Beste Wahl fuer 25"** und brauchbar fuer T5 (Syrtis Major plus Polkappe). 800 px gegen 100 px Messlatte. |
| Hubble 27.08.2003 (zweite Haelfte, 11 h spaeter) [Q24] | WFPC2 | 800 x 800 | Olympus Mons, Solis Lacus, Suedpolkappe | wie oben | Alternative Hemisphaere ohne Syrtis Major |
| Hubble heic1609a "Mars in Opposition 2016", 12.05.2016 [Q25][Q26] | WFC3/UVIS, 0,04"/px | Datei 2000 x 2000 px (TIF 1,5 MB); native etwa 440 px; kleinste Strukturen 30 km | Syrtis Major am rechten Rand, Hellas, Arabia Terra, Sinus Meridiani, kleine Nordpolkappe, Wolken ueber Suedpol | "NASA, ESA, the Hubble Heritage Team (STScI/AURA), J. Bell (ASU), and M. Wolff (Space Science Institute)"; auf esahubble CC BY 4.0, auf hubblesite NASA-gemeinfrei (Abschnitt 6.3, zu klaeren) | **Beste Wahl fuer 14"** (aphelnahe Oppositionen zeigen wie hier die Nordhalbkugel). Syrtis Major randnah, fuer T5 weniger guenstig. |
| Hubble PIA01592 "A closer Hubble encounter with Mars: Syrtis Major", 27.04. bis 06.05.1999 [Q27] | WFPC2, 87 Mio. km, also etwa 16" | TIFF 749 KB, geschaetzt 500 x 500 px; Strukturen 19 km | Syrtis Major **zentral**, Hellas mit Frost, Elysium-Wolken | "Steve Lee (University of Colorado), Jim Bell (Cornell University), Mike Wolff (Space Science Institute), and NASA"; gemeinfrei | Ideal fuer T5 bei 14", aber kleine Datei; 500 px gegen 56 px reicht rechnerisch |
| Hubble heic1814c "Stormy Mars in opposition 2018", 18.07.2018 [Q28] | WFC3, 36,9 Mio. Meilen | 2239 x 882 (Doppelbild mit Saturn) | Globaler Staubsturm, Oberflaeche verwaschen | NASA, ESA, STScI | Ungeeignet (Staubsturm), nur als Kuriosum |
| Viking PIA00407 "Global Color Views of Mars" [Q29] | Viking Orbiter 1, Mosaik aus etwa 1000 Bildern | 1 km/px, orthographisch, zentriert 20 Grad N / 60 Grad W; TIFF 75,26 MB, geschaetzt 5000 x 5000 px | Nordpolkappe, Valles Marineris, Tharsis; **kein Syrtis Major** | NASA/JPL/USGS, gemeinfrei | Echtes Mosaik, aber falsche Hemisphaere fuer T5 und ohne Atmosphaere/Phase; kein Jahreszeiten-Bezug |
| Viking MDIM 2.1 Colorized Global Mosaic 232 m [Q30] | Viking Orbiter, ca. 4600 Bilder | 92 160 x 46 080 px, GeoTIFF 12 GB, Simple Cylindrical | alles | USGS: "Public domain", Nutzungsbedingungen "None" | Karte, braucht Rendering (A-X9). Nur als Lieferant fuer Texturen, falls A-X9 fuer Mars gelockert wird. |
| Mars Express HRSC [Q31][Q32] | Zeilenkamera, nahe Oberflaeche | Streifen, nahezu globale Ansichten nur aus hohem Apozentrum (Juni 2019, bis etwa 40 Grad Sued) | - | **CC BY-SA 3.0 IGO**, Credit "ESA/DLR/FU Berlin" | Kein echtes Vollscheibenbild in Oppositionsgeometrie; VMC-Vollscheiben sind klein (etwa 640 px) |
| Rosetta OSIRIS "True colour image of Mars", 24.02.2007 [Q33] | OSIRIS NAC, 240 000 km, 5 km/px | 2205 x 2205 px (1,2 MB) | Vollscheibe, Phase nicht voll | Copyright "ESA/MPS for OSIRIS Team MPS/UPD/LAM/IAA/RSSD/INTA/UPM/DASP/IDA"; nur ESA-Standardlizenz (nicht-kommerziell). Eine Zweifarb-Variante soll unter CC BY-SA 3.0 IGO stehen (open.esa.int am Recherchetag nicht erreichbar) | Lizenz **zu klaeren**; 5 km/px ist 13-mal feiner als die Messlatte bei 25" |
| Emirates Mars Mission EXI (Hope) | EXI-Vollscheiben ab 2021, 12-Megapixel-Kamera, Mars fuellt einige tausend Pixel | Daten im EMM Science Data Center (sdc.emiratesmarsmission.ae) | Vollscheiben mit Syrtis Major und Polkappen vorhanden | **Keine Lizenzangabe gefunden**: SDC-Seite ohne Datenrichtlinie, Missionsseite nach space.gov.ae umgezogen [Q34] | Fachlich attraktiv (echte Vollscheibe, hohe Aufloesung), lizenzrechtlich offen. Nicht ohne schriftliche Klaerung verwenden. |
| Tianwen-1 (CNSA) | Vollscheiben 2021 | - | - | Keine Lizenzangabe, nicht weiter verfolgt | ungeeignet ohne Klaerung |
| Mars Global Surveyor MOC Global | Weitwinkel-Tageskarten 7,5 km/px, zylindrisch | Karte | - | NASA/JPL/MSSS, gemeinfrei | Karte (A-X9), zu grob; nicht weiter geprueft |

Antwort auf die Frage "reicht Hubble bei 25" mit etwa 500 px": Ja. Gefordert sind 100 px ueber die Scheibe bzw. 68 km echte Aufloesung; Hubble liefert etwa 550 bis 625 px native und 27 bis 30 km. Fuer Mars 6" ist jede der Hubble-Aufnahmen weit ueberdimensioniert; sie wird in der Anwendung auf 24 px Scheibendurchmesser heruntergerechnet.

## 4. Jupiter 35" und 47"

Ephemeride [Q22]: 2019-06-27: 45,67"; 2020-08-25: 45,13". Beide nahe an 47" (Opposition Juli 2020: 47,6").

| Kandidat | Datum, Instrument | Groesse, Aufloesung | GRF, Baender | Lizenz, Credit | Bewertung |
|---|---|---|---|---|---|
| Hubble heic1914a "Jupiter's Colourful Palette", 27.06.2019 [Q35] | WFC3, 0,04"/px | **3050 x 3050 px** (TIF 5,9 MB); native etwa 1140 px; echte Aufloesung etwa 0,08" = 240 km | GRF, Baender, Oval BA, Wirbel | "NASA, ESA, A. Simon (GSFC), and M.H. Wong (UC Berkeley)"; esahubble CC BY 4.0, NASA-Seite gemeinfrei (zu klaeren) | **Beste Wahl fuer 47" und 35"** (ein Bild, zwei Skalierungen). Winkelgroesse 45,7" fast identisch mit 47". |
| Hubble heic2017a "Jupiter and Europa", 25.08.2020 [Q36] | WFC3, Filter 395/502/631 nm | 1663 x 1375 px | GRF, neuer Sturm, Europa | wie oben plus OPAL-Team | Kleiner, Europa im Bild (stoert A-X2, feste Mondstellungen) |
| Hubble heic2113b, 04.09.2021 [Q37] | WFC3 | 1483 x 1483 px | GRF, tieforange Aequatorzone, Barges | wie oben | Kleiner, ungewoehnliche Faerbung |
| Hubble heic2404a, 05./06.01.2024 [Q38] | WFC3 | 2625 x 1311 px, zwei Ansichten | GRF, Red Spot Jr., Io am Rand | NASA, ESA, J. DePasquale (STScI), A. Simon (NASA-GSFC) | Zwei Halbbilder, Io stoert |
| Cassini PIA04866 "Cassini Jupiter Portrait", 29.12.2000 [Q39] | ISS NAC, 10 Mio. km, 27 Bilder (9 Positionen x RGB), Echtfarbe | Kleinste Strukturen 60 km; TIFF 7,19 MB, geschaetzt etwa 1500 x 1500 px | GRF, Baender, weisse Ovale, blaue Aequatorregionen | NASA/JPL/Space Science Institute, gemeinfrei (JPL-Richtlinie, Abschnitt 6.2) | Sehr gute Alternative ohne CC-Auflagen; Aufloesung 12-mal feiner als Messlatte. Phase nahe 0, erdaehnlich. Pixelmass vor Verwendung pruefen. |
| Cassini PIA07782 "Cassini's Best Maps of Jupiter (Cylindrical)", 11./12.12.2000 [Q40] | ISS NAC, 36 Bilder, 750 und 451 nm | Strukturen 120 km; TIFF 18,56 MB, geschaetzt 3600 x 1800 px; 180 x 360 Grad planetozentrisch | GRF, Baender, Ovale; Pole schlecht | NASA/JPL/Space Science Institute | Karte: Kugel muesste gerendert werden (A-X9). Nur falls Rendering fuer Planeten zugelassen wird. |
| Hubble OPAL Global Maps (MAST HLSP, DOI 10.17909/T9G593) [Q41] | WFC3, jaehrlich ab 2015, FITS/TIF/PNG | Zylinderkarten je Rotation | alles | NASA/STScI-Daten, gemeinfrei | Karte (A-X9), wissenschaftlich wertvoll, fuer astobsim nur mit Rendering |
| Juno JunoCam [Q42] | Perijove-Nahaufnahmen, Rohbilder oeffentlich | Vollscheiben nur aus dem Anflug 2016 in niedriger Aufloesung | - | Rohdaten NASA/SwRI/MSSS; bearbeitete Bilder teils "CC BY" durch Bearbeiter; keine formale Lizenzseite | Perspektive und Phase nicht erdaehnlich, ungeeignet |
| Voyager 1/2 (1979), z. B. PIA01353, PIA00400 [Q43] | ISS Vidicon 800 x 800 | Vollscheiben um 800 px, Farbkalibrierung uneinheitlich | GRF, Baender | NASA/JPL, gemeinfrei | Historisch, aber Hubble und Cassini sind besser; nicht im Detail geprueft |

Messlatte: 47" braucht 188 px bzw. 760 km. Hubble (240 km) und Cassini (60 km) erfuellen sie um Faktor 3 bzw. 12. Testfall T1 (zwei Aequatorbaender, GRF als Andeutung) ist mit beiden Quellen abdeckbar; die Hubble-Aufnahme 2019 zeigt den GRF auf der Scheibenmitte-Suedhaelfte.

## 5. Saturn 16" und 20" mit mittlerer Ringoeffnung

### 5.1 Ringoeffnung je Jahr

JPL Horizons liefert fuer Saturn die planetodetische subterrestrische Breite [Q22]. Die Ringoeffnung B ist die planetozentrische Breite: tan B = (1 - f)^2 tan(phi_d) mit f = 0,098, also Faktor 0,814. Werte an den Hubble-Aufnahmedaten (zwischen den Zwei-Monats-Stuetzstellen interpoliert, Genauigkeit etwa 0,5 Grad):

| Datum | Winkeldurchmesser | phi_d (Horizons) | B (gerechnet) | Einordnung |
|---|---|---|---|---|
| 2018-06-06 | 18,2" | 30,7 | 25,8 | weit offen |
| 2019-06-20 | 18,2" | 28,7 | 24,0 | weit offen |
| 2020-07-04 | 18,4" | 25,7 | 21,4 | oberer Rand "mittel" |
| 2021-09-12 | 18,3" | 22,9 | **19,0** | **mittel** |
| 2022-09 | 18,5" | 18,0 | **14,8** | unterer Rand "mittel" |
| 2023-10-22 | 18,3" | 12,5 | 10,2 | flach |
| 2024-08-22 | 18,8" | 3,3 | 2,7 | fast Kante |
| 2008-07-23 (Cassini PIA11141) | - | Kamera 6 Grad suedlich | - | flach |
| 2016-04-25 (Cassini PIA21046) | - | Kamera 30 Grad noerdlich | - | weit offen |

Zu pruefen: ob Horizons fuer 699 wirklich planetodetisch ausgibt (Kopfzeile sagt es); sonst entfaellt die Umrechnung und alle B-Werte sind etwa 4 Grad groesser.

### 5.2 Kandidaten

| Kandidat | Datum, Instrument | Groesse, Aufloesung | Ringe, Cassini-Teilung | Lizenz, Credit | Bewertung |
|---|---|---|---|---|---|
| Hubble heic2113c / NASA "Saturn 2021", 12.09.2021 [Q44][Q45] | WFC3, Filter 395/502/631 nm | 1802 x 1087 px (TIF 1,1 MB; NASA auch PNG); native fuer 41,5" Ringspanne etwa 1040 px, also hochskaliert um 1,7 | B = 19 Grad; Cassini-Teilung (4800 km = etwa 18 native px) klar; Hexagon; Baenderfarben | "NASA, ESA, A. Simon (GSFC), M.H. Wong (UC Berkeley), and the OPAL Team"; esahubble CC BY 4.0, NASA gemeinfrei (zu klaeren) | **Beste Wahl fuer 20" und 16"**: einzige gefundene Pressebild-Aufnahme mit B im Bereich 15 bis 20 Grad. Ringe etwa 1600 px breit, Scheibe etwa 700 px; Messlatte 182 px. |
| Hubble OPAL Saturn, September 2022 (Speichen-Saison) [Q46] | WFC3 | Pressebild vom Februar 2023 am Recherchetag nicht abrufbar (HTTP 403); Rohdaten in MAST | B = 15 Grad, Speichen sichtbar (stoeren einen "typischen" Anblick leicht) | wie oben | Zweite Wahl, Bildseite nachholen |
| Hubble "A Saturnian Summer", 04.07.2020 [Q47] | WFC3 | 1592 x 1137 px | B = 21 Grad; Mimas und Enceladus im Bild (stoeren A-X2) | NASA, ESA, A. Simon, M.H. Wong, OPAL-Team | Dritte Wahl |
| Hubble heic1917a "Latest Saturn Portrait", 20.06.2019 [Q48][Q49] | WFC3, 1,36 Mrd. km | **2505 x 1592 px** (groesste Hubble-Datei) | B = 24 Grad, Ringe weit offen; Ringlets, Hexagon | NASA, ESA, A. Simon, M.H. Wong | Bestes Pixelmass, aber Ringoeffnung ueber "mittel" |
| Hubble heic1814a, 06.06.2018 [Q28] | WFC3 | 2239 x 882 (zusammen mit Mars) | B = 26 Grad, Monde im Bild | NASA, ESA, A. Simon (GSFC), OPAL-Team, J. DePasquale (STScI) | Zu weit offen |
| Hubble heic2416a "Decade of OPAL", 2024 [Q50] | Montage 2014 bis 2024 | 5918 x 3329 px, sieben Saturn-Ansichten 2018 bis 2024 | B von 26 bis 3 Grad | NASA, ESA, A. Simon, M.H. Wong, J. DePasquale | Nur Uebersicht; Einzelbilder klein |
| Cassini PIA11141 "Saturn ... Four Years On", 23.07.2008 [Q51] | ISS WAC, 1,1 Mio. km, 30 Bilder RGB | 70 km/px; TIFF 29,47 MB, geschaetzt 4000 x 2450 px; Ringe etwa 3900 px breit | Kamera 6 Grad suedlich der Ringebene, Phase 20 Grad; Cassini-Teilung ja, Ringe fast Kante, sechs Monde im Bild | NASA/JPL/Space Science Institute, gemeinfrei | Hervorragende Aufloesung, aber Ringoeffnung passt nicht zu "mittel" |
| Cassini PIA21046 "Approaching Northern Summer", 25.04.2016 [Q52] | ISS WAC, 3 Mio. km | 178 km/px; TIFF 2,47 MB, geschaetzt 1100 x 750 px | 30 Grad ueber Ringebene, Phase 55 Grad (Schattenwurf unrealistisch fuer Erdblick) | NASA/JPL-Caltech/Space Science Institute | Zu klein, Phase und Oeffnung passen nicht |
| Cassini PIA17172 "The Day the Earth Smiled", 19.07.2013 [Q53] | ISS WAC+NAC Mosaik | 72 km/px; TIFF 90 MB, Bildbreite 651 591 km, geschaetzt 9050 px breit | Unbeleuchtete Ringseite, 17 Grad unter der Ringebene, Gegenlicht | NASA/JPL-Caltech/SSI | Unbrauchbar (Gegenlicht, E-Ring) |
| Cassini PIA06193 "Greatest Saturn Portrait ... Yet", 06.10.2004 [Q54] | ISS NAC, 126 Bilder, 6,3 Mio. km | 8888 x 4544 px, Strukturen 38 km | Phase 72 Grad, halbe Scheibe beleuchtet | NASA/JPL/SSI | Unbrauchbar fuer Erdblick (Phase) |
| Cassini PIA08388 (2007, 39 Grad unbeleuchtete Seite), PIA11453 (2008, 6 Bilder) [Q55] | ISS | - | ungeeignete Geometrie bzw. klein | NASA/JPL/SSI | ungeeignet |
| Voyager 2 PIA00400 (1981) [Q43] | ISS | etwa 800 px | Ringe, Monde | NASA/JPL | historisch, zu klein |

Ergebnis: Cassini hat kein Vollscheibenmosaik mit erdaehnlicher Geometrie (Phase unter 6 Grad) und mittlerer Ringoeffnung gefunden; die Sonde stand fast immer bei grossen Phasenwinkeln oder nahe der Ringebene. Hubble 2021 ist die passende Quelle. Testfall T2 (Cassini-Teilung an den Ringenden bei 100 mm) ist damit abgedeckt: die Teilung ist im Quellbild etwa 18 native Pixel breit, also 10-mal feiner als die Messlatte.

## 6. Lizenzen

### 6.1 NASA Media Usage Guidelines [Q1]

URL: https://www.nasa.gov/nasa-brand-center/images-and-media/
Wortlaut (Auszuege): "NASA content ... generally are not subject to copyright in the United States." "You may use this material for educational or informational purposes." "NASA should be acknowledged as the source of the material." "NASA occasionally uses copyright-protected material of third parties with permission on its website. Those images will be marked identified as copyright protected with the name of the copyright holder. NASA's use does not convey any rights to others to use the same material." "it must not explicitly or implicitly convey NASA's endorsement of commercial goods or services."
Bewertung: Gemeinfrei (US-Bundeswerk), Nennung erbeten, keine Einschraenkung der Bearbeitung. Vorsicht bei Credits, die Partner nennen (ESA, Space Science Institute, Universitaeten): Partnerbeitraege koennen Rechte Dritter sein; bei Cassini-Bildern ist das Space Science Institute Auftragnehmer der NASA, JPL-Richtlinie gilt (6.2). Bei NASA/ESA-Hubble-Bildern siehe 6.3.
hubblesite.org/copyright leitet seit 2024/2025 auf diese NASA-Seite weiter; eine eigene STScI-Copyright-Seite gibt es nicht mehr.

### 6.2 JPL Image Use Policy (Photojournal, Cassini, Viking) [Q2]

URL: https://www.jpl.nasa.gov/jpl-image-use-policy/
Wortlaut: Bilder duerfen "for any purpose without prior permission, subject to the special cases noted below" verwendet werden. Credit: "Courtesy NASA/JPL-Caltech", "Unless otherwise noted in the caption information". "Some image and video materials on JPL public web sites are owned by organizations other than JPL or NASA." Dann Rechteinhaber laut Bildunterschrift kontaktieren.
Bewertung: PIA04866, PIA07782, PIA11141, PIA00407 tragen Credits NASA/JPL(-Caltech)/SSI bzw. NASA/JPL/USGS, keine Fremdrechte vermerkt. Gemeinfrei.

### 6.3 Hubble: NASA/STScI gegen ESA/Hubble [Q3]

- esahubble.org/copyright: "released under the Creative Commons Attribution 4.0 International license", nutzbar "provided they are clearly and visibly credited", Credit "ESA/Hubble" bzw. die Credit-Zeile des Bildes, "with the wording unaltered". Bei starken Aenderungen: "the changes are mentioned after the credit line". Nicht erfasst: Logos.
- Dieselben OPAL-Bilder erscheinen auf science.nasa.gov/hubblesite mit identischem Credit ("NASA, ESA, A. Simon ...") ohne CC-Vermerk, also unter den NASA-Richtlinien (gemeinfrei).
- Zwei Lesarten, **zu klaeren**: (1) Das Bild ist ein NASA-Werk, ESA ist Partner, Nutzung gemeinfrei mit Nennung; (2) ueber ESA bezogene Kopien stehen unter CC BY 4.0. Praktisch ist der Unterschied gering, denn beide verlangen bzw. erbitten dieselbe Credit-Zeile und erlauben Bearbeitung und kommerzielle Nutzung. Empfehlung: Credit-Zeile vollstaendig und unveraendert uebernehmen, Lizenzfeld "CC BY 4.0 (ESA/Hubble) / Public Domain (NASA)" eintragen und die Quelle angeben, von der die Datei geladen wurde.
- Hubble-Bilder von 2003 und 1999 (Mars) nennen nur NASA und Universitaeten; ESA-Kopien (opo0322a) ebenfalls CC BY 4.0.

### 6.4 ESA Standard Licence gegen CC BY-SA 3.0 IGO [Q4][Q5][Q31]

- ESA-Nutzungsbedingungen (esa.int): "Images and videos available on the ESA Website can be used, reproduced, broadcasted and publicly performed for educational, editorial or informational purposes", aber "shall not be used for a commercial purpose", "A commercial use requires a separate written authorisation by ESA." Credit "always credit the copyright". Einige Bilder: "licensed under Creative Commons (CC BY-SA 3.0 IGO) licence. Such images or videos shall be used in accordance with the terms and conditions of such licence".
- Mars Express HRSC (DLR-Blog 2014): "The licence we apply is the same one used for Rosetta NAVCAM images: CC BY-SA IGO 3.0", "with Attribution to ESA/DLR/FU Berlin", "We will also apply the licence to all HRSC images released to date." Credit-Beispiel: "Credit: ESA/DLR/FU Berlin, CC BY-SA 3.0 IGO".
- Bewertung: Die ESA-Standardlizenz (nicht-kommerziell, keine Bearbeitungsfreigabe) erfuellt A-X3 **nicht**. CC BY-SA 3.0 IGO erfuellt A-X3, ist aber Copyleft: bearbeitete Bilder muessen unter derselben Lizenz weitergegeben werden. Fuer ein MIT-Projekt zulaessig, wenn Bilddateien und Code getrennt lizenziert sind (A-T5 sieht das vor). Rosetta-OSIRIS-Mars: Echtfarbbild nur Standardlizenz, Zweifarbvariante angeblich CC (nicht belegt).

### 6.5 Amateurbilder (Creative Commons auf Wikimedia Commons) [Q19][Q20][Q21]

- CC BY-SA 4.0 (Mosaik 2026): Namensnennung, Lizenzlink, Aenderungen kennzeichnen, Weitergabe der Bearbeitung unter CC BY-SA 4.0. Copyleft-Hinweis fuer Herbert.
- CC0 1.0 (Niittee 2024): keine Bedingungen; Nennung trotzdem vorgesehen (A-X4).
- CC BY 2.0 (Bresson 2009): Namensnennung "Photo : Thomas Bresson" nahe am Bild.
- Risiko: Bei Commons-Uploads ist nur die Selbstauskunft des Uploaders die Lizenzquelle. Beim 2026-Mosaik fehlen Geraet und Entstehung; vor Verwendung den Uploader kontaktieren und die Angaben fuer den Bildnachweis einholen.

### 6.6 USGS Astrogeology [Q30][Q6]

- Produktseite Viking MDIM 2.1: Rechte "Public domain", Nutzungsbedingungen "None". Dasselbe Schema gilt fuer die USGS-Kopien der LROC-WAC-Mosaike (Seite am Recherchetag nicht erreichbar, Timeout).
- USGS-FAQ (per Suchauszug): USGS behandelt eigene Daten als gemeinfrei, bittet um Credit "Credit: U.S. Geological Survey"; Fremdmaterial ist gekennzeichnet. Die Seite "Copyrights and Credits" (usgs.gov/information-policies-and-instructions/copyrights-and-credits) war am Recherchetag dreimal nicht erreichbar; Wortlaut vor der Freigabe nachlesen.
- Kaguya-Mosaik bei USGS: Ausnahme, "(c) JAXA/SELENE" mit Verweis auf JAXA-Bedingungen; keine freie Lizenz belegt.

### 6.7 LROC (ASU) [Q10][Q11]

- Produktseiten nennen Credit "NASA/GSFC/Arizona State University" und eine Zitiervorgabe (Speyerer et al. 2011, LPSC 42, #2387), aber keine Lizenz. Die Daten sind PDS-Archivdaten einer NASA-Mission und damit gemeinfrei. Die Galerie-Seiten tragen einen Footer "(c) 2026 NASA/GSFC/LROC ... All rights reserved" (Webseiten-Boilerplate). **Zu klaeren**, ob Herbert eine kurze Bestaetigung bei LROC einholen will, falls das Nearside-Mosaik verwendet wird.

### 6.8 NASA SVS [Q17]

"All of our content is in the public domain (unless otherwise noted)", "free to download, use, and redistribute for whatever purposes you see fit". Ausnahme: lizenzierte Musik in manchen Videos; Einzelbilder sind davon nicht betroffen.

## 7. Dateigroesse (A-X6)

Annahmen: Planetenbilder sind glatt mit schwarzem Hintergrund (JPEG q85 etwa 0,6 bis 1,2 bit/px; WebP etwa 60 Prozent, AVIF etwa 40 Prozent davon). Mondoberflaeche ist hochfrequent texturiert (JPEG q85 etwa 2 bis 3 bit/px, nahezu farblos, Graustufe spart 20 bis 30 Prozent). Referenz: heic1609a 2000 x 2000 als "Large JPEG" 242 KB, heic1914a 3050 x 3050 als 895 KB.

| Objekt, Bild | Pixel | JPEG q85 | WebP | AVIF |
|---|---|---|---|---|
| Mars, Hubble 2003, 800 x 800 (oder 2016, 2000 x 2000) | 0,64 bis 4 Mpx | 0,1 bis 0,6 MB | 0,06 bis 0,35 MB | 0,04 bis 0,25 MB |
| Jupiter, heic1914a 3050 x 3050 | 9,3 Mpx | 0,9 bis 1,5 MB | 0,5 bis 0,9 MB | 0,35 bis 0,6 MB |
| Jupiter, auf 1200 px reduziert (6-mal Messlatte) | 1,4 Mpx | 0,15 bis 0,25 MB | 0,1 MB | 0,07 MB |
| Saturn, heic2113c 1802 x 1087 | 2 Mpx | 0,2 bis 0,35 MB | 0,12 bis 0,2 MB | 0,08 bis 0,15 MB |
| Mond, Vollscheibe 7600 px, quadratisch 7600 x 7600 | 57,8 Mpx (45 Mpx Scheibe) | **14 bis 22 MB** | 9 bis 14 MB | 6 bis 10 MB |
| Mond, Graustufe 7600 px | wie oben | 10 bis 16 MB | 7 bis 10 MB | 5 bis 7 MB |
| Mond, Vollscheibe 4000 px (Kompromiss) | 16 Mpx | 4 bis 6 MB | 2,5 bis 4 MB | 1,8 bis 3 MB |
| Mond, Commons-Mosaik 13 454 x 12 234 unveraendert | 165 Mpx | 40 bis 60 MB | - | - |

Folgerung: Die Mondscheibe mit 7600 px passt als einzelne JPEG-Datei nicht sicher unter 20 MB; mit AVIF oder Graustufen-WebP knapp. Mit Kacheln (z. B. 512 px, 3 bis 4 Stufen) laedt die Startansicht fuer 80 mm bei 100-fach nur die Stufe mit etwa 2000 px (unter 2 MB), die Detailstufe wird erst beim Zoom geholt. Entscheidung in Phase 3; die Zahlen oben sind die Grundlage. Alle Planetenbilder zusammen bleiben deutlich unter 5 MB.

## 8. Datenformat fuer den Bildnachweis (A-X4)

Eine JSON-Datei `daten/bilder.json` (Name in Phase 3 festlegen) mit einer Liste von Eintraegen. Felder:

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | Schluessel des Eintrags, Ziel des Verweises `bild` aus `objekte.json`, z. B. `mond_svs5587_6285` |
| `objekt` | string | `mond`, `mars`, `jupiter`, `saturn` |
| `zustand` | string | Schluessel aus A-X1, z. B. `mars_25`, `saturn_20_mittel`, `mond_erstes_viertel` |
| `datei` | string | Pfad im Repo relativ zur Bilddatenwurzel; bei Kacheln das Verzeichnis |
| `quelle_url` | string | Seite des Datenhalters, von der geladen wurde |
| `mission` | string | z. B. `Hubble Space Telescope`, `Cassini`, `LRO`, `Amateur` |
| `instrument` | string | z. B. `WFC3/UVIS`, `ISS NAC`, `WAC`, `Celestron EdgeHD 9.25 + ASI071MC` |
| `aufnahmedatum` | string | ISO 8601, Tag oder Zeitraum (`2019-06-27`, `2010-12-01/2010-12-14`) |
| `lizenz` | string | SPDX-aehnlich: `Public Domain (NASA)`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC0-1.0`, `CC-BY-SA-3.0-IGO` |
| `lizenz_url` | string | Lizenztext bzw. Richtlinienseite |
| `namensnennung` | string | Credit-Zeile woertlich wie vom Datenhalter verlangt |
| `pixel_breite`, `pixel_hoehe` | int | Masse der Datei im Repo (nach Bearbeitung) |
| `winkelgroesse_arcsec` | number | Winkelgroesse des Objekts (Scheibe) zum Aufnahmezeitpunkt, bei Saturn zusaetzlich `ringe_arcsec` |
| `bogensekunden_pro_pixel` | number | Winkel pro Pixel am Objekt in der Repo-Datei (abgeleitet aus Scheibendurchmesser in Pixeln) |
| `objekt_durchmesser_px` | int | Scheibendurchmesser in Pixeln in der Repo-Datei; Grundlage fuer die Skalierung in der Anwendung |
| `norden_oben` | bool | Orientierung nach Bearbeitung (A-D11) |
| `sub_erde_breite_grad` | number | optional; bei Saturn Ringoeffnung B, bei Mars Polkappen-Sicht |
| `bearbeitung` | string | Freitext: Zuschnitt, Drehung, Skalierung, Hintergrund geschwaerzt, Farbkorrektur, Monde retuschiert |
| `original_pixel` | string | Masse der Quelldatei, z. B. `3050x3050` |
| `hinweise` | string | optional, z. B. offene Lizenzfragen, Satellit im Bild |
| `kacheln` | object | nur bei Kachelpyramiden: `kachel_px`, `format`, `qualitaet`, `muster` (z. B. `{stufe}/{x}_{y}.webp`, relativ zu `datei`), `gesamt_bytes`, `stufen[]` mit je `stufe`, `breite_px`, `hoehe_px`, `bogensekunden_pro_pixel`, `kacheln_x`, `kacheln_y`; Stufe n hat das 2^n-fache Pixelmass von Stufe 0, Randkacheln duerfen kleiner als `kachel_px` sein |
| `datei_bytes` | int | nur bei Einzelbildern (ohne `kacheln`), Pflicht: Groesse der Datei in Byte fuer die Grenze von 20 MB je Objekt (A-X6). Nachtrag 2026-10-26 (Issue #12); geprueft gegen die Datei von `tools/bildnachweis_pruefen.py` und `src/daten/bilddateien.test.ts` |

Konvention: `winkelgroesse_arcsec` im Bildnachweis ist die Groesse zum Aufnahme- oder Rendering-Zeitpunkt; die Anzeigegroesse steht im Objektzustand (`objekte.json`, `winkelgroesse_arcsec`), und die Anwendung skaliert die Scheibe von `objekt_durchmesser_px` auf die Winkelgroesse des Zustands.

Beispiel:

```json
[
  {
    "objekt": "jupiter",
    "zustand": "jupiter_47",
    "datei": "jupiter/hubble_2019-06-27.avif",
    "quelle_url": "https://esahubble.org/images/heic1914a/",
    "mission": "Hubble Space Telescope (OPAL)",
    "instrument": "WFC3/UVIS",
    "aufnahmedatum": "2019-06-27",
    "lizenz": "CC-BY-4.0",
    "lizenz_url": "https://esahubble.org/copyright/",
    "namensnennung": "NASA, ESA, A. Simon (Goddard Space Flight Center), and M.H. Wong (University of California, Berkeley)",
    "pixel_breite": 1400,
    "pixel_hoehe": 1400,
    "original_pixel": "3050x3050",
    "winkelgroesse_arcsec": 45.7,
    "objekt_durchmesser_px": 1200,
    "bogensekunden_pro_pixel": 0.038,
    "norden_oben": true,
    "sub_erde_breite_grad": -3.1,
    "bearbeitung": "Auf 1400 px verkleinert, Hintergrund ausserhalb der Scheibe auf Schwarz gesetzt, keine Farbaenderung.",
    "hinweise": "Lizenz-Lesart NASA gemeinfrei gegen ESA/Hubble CC BY 4.0, siehe docs/recherche/bilder.md Abschnitt 6.3."
  },
  {
    "objekt": "mond",
    "zustand": "mond_erstes_viertel",
    "datei": "mond/kacheln/",
    "quelle_url": "https://commons.wikimedia.org/wiki/File:20260423_-_First_Quarter_Moon_Mosaic.png",
    "mission": "Amateur",
    "instrument": "unbekannt, beim Urheber erfragen",
    "aufnahmedatum": "2026-04-23",
    "lizenz": "CC-BY-SA-4.0",
    "lizenz_url": "https://creativecommons.org/licenses/by-sa/4.0/",
    "namensnennung": "Yoships or MuonMan, Wikimedia Commons, CC BY-SA 4.0",
    "pixel_breite": 7600,
    "pixel_hoehe": 7600,
    "original_pixel": "13454x12234",
    "winkelgroesse_arcsec": 1900,
    "ringe_arcsec": null,
    "objekt_durchmesser_px": 7600,
    "bogensekunden_pro_pixel": 0.25,
    "norden_oben": true,
    "bearbeitung": "Gedreht (Norden oben), auf 7600 px Scheibendurchmesser verkleinert, in 512-px-Kacheln mit 4 Stufen zerlegt.",
    "hinweise": "Echte Aufloesung unter der Messlatte A-X5; Copyleft."
  }
]
```

## 9. Pruefschritte nach der Lizenzfreigabe

Erst wenn Herbert die Lizenzen freigegeben hat, werden Dateien geladen. Dann je Bild:

1. Originaldatei (TIFF oder PNG, nicht das Vorschau-JPEG) laden und Pruefsumme notieren; Quelle, Datum des Abrufs und Dateigroesse ins Feld `hinweise`.
2. Pixelmasse aus dem Dateikopf lesen und gegen die Schaetzungen in diesem Dokument pruefen (betrifft PIA04866, PIA07782, PIA11141, PIA00407).
3. Scheibendurchmesser in Pixeln messen (Mars, Jupiter: Aequatordurchmesser; Saturn: Scheibe und A-Ring-Aussenkante; Mond: Rand zu Rand senkrecht zum Terminator) und daraus `bogensekunden_pro_pixel` berechnen. Bei Pressebildern den Hochskalierungsfaktor gegen die native Instrumentenaufloesung (WFC3 0,04"/px, WFPC2-PC 0,0455"/px) festhalten.
4. Orientierung: Norden oben und Osten links (Himmelsansicht) herstellen, bei Hubble-Bildern aus der Pressefassung meist bereits so; bei Cassini und Amateurmosaiken pruefen und im Feld `bearbeitung` dokumentieren. Nachtrag 2026-10-26: "Norden oben" heisst bei Planeten Planetennorden (Rotationsachse senkrecht), beim Mond Himmelsnorden (ADR-0003, Festlegungen); der Positionswinkel der Achse am Himmel steht in `positionswinkel_achse_grad`. Nachtrag 2026-10-27 (#13): Pressebilder ohne senkrechte Achse dreht `tools/bild_aufbereiten.py` per `drehung_grad`/`spiegeln`; den Winkel bestimmen bei Jupiter die Baender, bei Saturn der Ringrand (ADR-0003, Nachtrag).
5. Hintergrund ausserhalb der Scheibe auf Schwarz setzen, Beschriftungen, Massstabsbalken und Monde entfernen (Feld `bearbeitung`).
6. Farbe: keine Saettigungs- oder Kontrastaenderung ohne Grund; falls doch (z. B. OPAL-Schmalbandfilter wirken farbverstaerkt), Begruendung ins Feld `bearbeitung`.
7. Auf die Zielgroesse bringen (Planeten etwa 6-fache Messlatte, also 600 bis 1200 px Scheibe; Mond 7600 px oder die in Phase 3 beschlossene Kachelstufe) und in das in Phase 3 gewaehlte Format (AVIF oder WebP) schreiben; JPEG nur als Rueckfall. Nachtrag 2026-10-27 (Issue #51): Groebere Stufen einer Kachelpyramide entstehen als 2x2-Flaechenmittel in linearer Helligkeit (sRGB-Kodewerte nach IEC 61966-2-1 linearisieren, mitteln, zurueck nach sRGB 8 Bit), nicht als Mittel der sRGB-Kodewerte; sonst werden helle Kanten (Terminator, Kraterraender) in den groben Stufen zu dunkel, und `QuelleKacheln`, die beim Laden linearisiert, saehe je Stufe eine andere Helligkeit. `tools/mond_kacheln.py` prueft das vor dem Schreiben (2x2-Block gegen Pixel der naechsten Stufe, Toleranz eine 8-Bit-Stufe). Konvention fuer die Lage: Objektmitte ist die Bildmitte als Randkoordinate (`breite_px / 2`, die Grenze zwischen zwei Pixeln, nicht ein Pixelzentrum), in jeder Stufe und bei Einzelbildern (`src/daten/kacheln.ts`, `src/daten/quelle_einzelbild.ts`). Beim Mond liegt die Scheibenmitte bei Pixelindex 1536 der Stufe 0 (Zentrum 1536,5), also 0,5 px (0,3") neben der Bildmitte; vernachlaessigbar und nicht korrigiert.
8. Credit-Zeile woertlich vom Datenhalter uebernehmen, Lizenz und Lizenz-URL eintragen, bei CC-Lizenzen den Aenderungshinweis ("bearbeitet: ...") in die Nennung aufnehmen.
9. Beim Mond zusaetzlich: Terminatorlage gegen die Ephemeride des Aufnahmedatums pruefen (Kolongitude) und die Libration notieren, damit spaetere Phasen (A-X7, A-X8) konsistent bleiben.

Was ein eigenes Rendering fuer den Mond braeuchte (nur falls A-X9 fuer den Mond gelockert wird): LROC WAC Hapke-normiertes Farbmosaik (6,5 GB ISIS-Cube, Q12) oder die 100-m-Morphologiekarte als Albedo, LOLA/GLD100-Hoehenmodell (5,3 GB, Q12) fuer Schattenwurf, Sonnen- und Erdposition aus Horizons fuer einen festen Zeitpunkt etwa 1 Tag nach dem ersten Viertel, Rendering mit Hapke- oder Lommel-Seeliger-Reflexion. Das ist genau der Weg des NASA SVS; der Unterschied zum SVS-Produkt waere nur die hoehere Ausgabeaufloesung (7600 statt etwa 3000 px). Aufwand: hoch, eigenes Werkzeug ausserhalb der Webanwendung.

## Empfehlung fuer astobsim

| Objekt, Zustand | Empfohlenes Bild | URL | Lizenz | Aufloesung | Bearbeitungsaufwand |
|---|---|---|---|---|---|
| Mond, kurz nach erstem Viertel | **Keine Empfehlung ohne Entscheidung von Herbert.** Option A: Commons-Mosaik 2026 (echtes Foto, CC BY-SA 4.0). Option B: NASA SVS 5587, Einzelframe fuer den Zeitpunkt etwa 1 Tag nach dem ersten Viertel (Rendering, gemeinfrei). Option C: CC0-Bild Niittee 2024 als Zwischenloesung. | A: https://commons.wikimedia.org/wiki/File:20260423_-_First_Quarter_Moon_Mosaic.png ; B: https://svs.gsfc.nasa.gov/5587 ; C: https://commons.wikimedia.org/wiki/File:Moon_in_T%C3%B5rva.png | A: CC BY-SA 4.0; B: Public Domain; C: CC0 | A: 13 454 px nominal, echte Aufloesung unbekannt; B: etwa 3000 px (unter 4000); C: etwa 3000 px Scheibe | A: hoch (Urheber kontaktieren, Qualitaet pruefen, drehen, Kacheln); B: mittel (Frame waehlen, Kacheln), aber A-X9-Konflikt; C: gering |
| Mars 25" | Hubble WFPC2, 26.08.2003 | https://science.nasa.gov/asset/hubble/hubbles-close-encounter-with-mars-august-26-2003 (ESA-Kopie: https://esahubble.org/images/opo0322a/) | Public Domain (NASA) bzw. CC BY 4.0 (ESA/Hubble), zu klaeren | 800 x 800 px Datei, etwa 550 px native, 27 km | gering: Hintergrund schwaerzen, Norden pruefen |
| Mars 14" | Hubble WFC3 heic1609a, 12.05.2016 (17,5"); seit #78 Hubble WFPC2 25.02.1995 (Abschnitt 3, Nachtrag) | https://esahubble.org/images/heic1609a/ ; seit #78 https://science.nasa.gov/asset/hubble/mars-2/ | wie oben | 2000 x 2000 px Datei, etwa 440 px native, 30 km; 1995: 800 x 800 px, etwa 295 px native | gering; fuer T5 alternativ PIA01592 (Syrtis Major zentral) oder das 2003-Bild verkleinert |
| Mars 6" | dasselbe Bild wie 14", in der Anwendung auf 24 px skaliert | wie oben | wie oben | weit ueber Messlatte | keiner |
| Jupiter 47" | Hubble WFC3 heic1914a, 27.06.2019 (45,7") | https://esahubble.org/images/heic1914a/ | wie oben | 3050 x 3050 px, etwa 1140 px native, 240 km | gering; Alternative ohne CC-Frage: Cassini PIA04866 (gemeinfrei, 60 km) |
| Jupiter 35" | dasselbe Bild, skaliert | wie oben | wie oben | - | keiner |
| Saturn 20", mittlere Ringoeffnung | Hubble WFC3, 12.09.2021 (B = 19 Grad) | https://esahubble.org/images/heic2113c/ bzw. https://science.nasa.gov/asset/hubble/saturn-5 | wie oben | 1802 x 1087 px, etwa 1040 px native ueber die Ringe, Cassini-Teilung 18 px | gering: Hintergrund schwaerzen; Monde sind laut Beschreibung nicht im Bild (pruefen) |
| Saturn 16" | dasselbe Bild, skaliert | wie oben | wie oben | - | keiner |

Bildnachweis: JSON-Format aus Abschnitt 8.

Antwort auf offene Frage 1: Fuer Mars (3 Zustaende), Jupiter (2) und Saturn (2) gibt es echte Aufnahmen mit freier Lizenz und ausreichender Aufloesung. Fuer den Mond gibt es echte Aufnahmen mit freier Lizenz (Amateur), aber keine, die A-X5 nach echter Aufloesung erfuellt; die einzige A-X5-taugliche Quelle (LROC WAC) hat keinen Terminator. Die Zustandsliste muss nicht geaendert werden, aber A-X5 oder A-X9 fuer den Mond.

## Unsicher oder zu pruefen (fuer Herbert)

1. **Mond-Grundsatzentscheidung**: A-X5 lockern (Amateurfoto) oder A-X9 lockern (SVS-Rendering oder eigenes Rendering aus LROC WAC + LOLA). Siehe 2.3.
2. **Commons-Mosaik 2026**: Urheber "Yoships or MuonMan", keine Geraeteangaben, keine Beschreibung. Vor Verwendung kontaktieren, Ausruestung und Bearbeitung erfragen, Qualitaet am Terminator pruefen (Kachelnaehte, Schaerfung). Copyleft CC BY-SA 4.0: bearbeitete Mondkacheln muessen unter CC BY-SA 4.0 stehen.
3. **Hubble-Lizenz-Lesart**: NASA gemeinfrei gegen ESA/Hubble CC BY 4.0 (6.3). Empfehlung: Credit-Zeile woertlich, Lizenzfeld mit beiden Angaben.
4. **USGS-Copyright-Seite** und **USGS-Seite des LROC-WAC-Mosaiks** waren am Recherchetag nicht erreichbar; Wortlaut nachlesen, falls LROC- oder Viking-Produkte verwendet werden.
5. **LROC-Footer "All rights reserved"**: Boilerplate der Webseite gegen PDS-Gemeinfreiheit; bei Verwendung des Nearside-Mosaiks kurz bei LROC nachfragen.
6. **Saturn-Ringoeffnung**: B-Werte beruhen auf Horizons-Zwei-Monats-Stuetzstellen plus Umrechnung planetodetisch zu planetozentrisch; fuer den Bildnachweis mit tagesgenauer Horizons-Abfrage bestaetigen.
7. **Saturn 2022 (B = 15 Grad)**: NASA-Seiten zum Speichen-Bild (Februar 2023) lieferten HTTP 403; Bildgroesse und Credit nachholen, falls ein flacherer Ring gewuenscht ist.
8. **Cassini-Pixelmasse**: PIA04866, PIA07782, PIA11141 nennen keine Pixelmasse; Schaetzungen aus TIFF-Groesse. Vor Verwendung die TIFF-Kopfdaten pruefen (erst nach Lizenzfreigabe).
9. **Hope/EXI**: fachlich beste Mars-Vollscheiben, Lizenz nirgends belegt (SDC ohne Richtlinie, Missionsseite umgezogen). Nur mit schriftlicher Freigabe.
10. **Rosetta OSIRIS Mars**: Echtfarbbild nur ESA-Standardlizenz (nicht-kommerziell), CC-Zweifarbvariante nicht verifiziert (open.esa.int nicht erreichbar).
11. **Monde im Bild**: heic2017a (Europa), heic2404a (Io), Saturn 2020 (Mimas, Enceladus), PIA11141 (sechs Monde) widersprechen A-X2 (feste Mondstellungen); bei Wahl dieser Bilder retuschieren und im Feld `bearbeitung` vermerken.
12. **Orthographische LROC-Produkte**: Kartenprojektion echter Fotos; ob das unter A-X9 ("Kugel aus Karte") faellt, ist Auslegungssache. Fuer Vollmond (A-X7) waere es die naheliegende Quelle.

## Quellen

1. [Q1] NASA Media Usage Guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/ (hubblesite.org/copyright leitet hierher weiter)
2. [Q2] JPL Image Use Policy: https://www.jpl.nasa.gov/jpl-image-use-policy/
3. [Q3] ESA/Hubble Copyright (CC BY 4.0): https://esahubble.org/copyright/
4. [Q4] ESA Terms and conditions of use of images and videos: https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website
5. [Q5] DLR-Blog 2014, Mars Express HRSC unter CC BY-SA 3.0 IGO: https://www.dlr.de/en/blog/archive/2014/simpler-usage-rights-as-of-today-mars-express-hrsc-images-licensed-under-creative-commons-licence
6. [Q6] USGS Copyrights and Credits (am 2026-10-23 nicht erreichbar): https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits ; FAQ: https://www.usgs.gov/faqs/are-usgs-reports-copyrighted
7. [Q10] LROC WAC Global Morphologic Map (WAC_GLOBAL): https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_GLOBAL
8. [Q11] LROC Nearside WAC Mosaik (24 000 px, Dez 2010): https://www.lroc.im-ldi.com/posts/293 ; Galerie: https://lroc.im-ldi.com/visit/exhibits/1/gallery/17
9. [Q12] LROC Curated Downloads (Global Morphologic 19,2 GB, Nearside Dawn 9,8 GB): https://www.lroc.im-ldi.com/images/downloads
10. [Q13] LROC WAC Farside Dusk: https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_ROI_FARSIDE_DUSK
11. [Q14] PIA13516 Moon seen from the East: https://science.nasa.gov/photojournal/moon-seen-from-the-east
12. [Q15] NASA SVS 5587 Moon Phase and Libration 2026: https://svs.gsfc.nasa.gov/5587
13. [Q16] NASA SVS 5415 Moon Phase and Libration 2025: https://svs.gsfc.nasa.gov/5415/
14. [Q17] NASA SVS Help/FAQ (Public Domain): https://svs.gsfc.nasa.gov/help/
15. [Q18] USGS Moon SELENE Kaguya TC Global Orthomosaic 474m: https://astrogeology.usgs.gov/search/map/moon_selene_kaguya_tc_global_orthomosaic_474m
16. [Q19] Commons, First Quarter Moon Mosaic 2026-04-23 (CC BY-SA 4.0): https://commons.wikimedia.org/wiki/File:20260423_-_First_Quarter_Moon_Mosaic.png
17. [Q20] Commons, Moon in Torva, Taavi Niittee (CC0): https://commons.wikimedia.org/wiki/File:Moon_in_T%C3%B5rva.png
18. [Q21] Commons, Thomas Bresson, Premier quartier de Lune (CC BY 2.0): https://commons.wikimedia.org/wiki/File:Thomas_Bresson_-_Premier_quartier_de_Lune_(by).jpg
19. [Q22] JPL Horizons API (Winkeldurchmesser, subterrestrische Breite; Saturn 2018 bis 2024 in 2-Monats-Schritten, Mars 2003-08-26 und 2016-05-12, Jupiter 2019-06-27 und 2020-08-25): https://ssd.jpl.nasa.gov/api/horizons.api
20. [Q23] NASA Hubble, Close Encounter with Mars, 26.08.2003: https://science.nasa.gov/asset/hubble/hubbles-close-encounter-with-mars-august-26-2003
21. [Q24] NASA Hubble, Mars Close Approach 2003 (Doppelbild 26./27.08.): https://science.nasa.gov/image-detail/hubble-mars-close-approach-2003/ ; ESA-Kopie: https://esahubble.org/images/opo0322a/
22. [Q25] ESA/Hubble heic1609, Mars 2016: https://esahubble.org/news/heic1609/
23. [Q26] ESA/Hubble heic1609a (Formate, 2000 x 2000): https://esahubble.org/images/heic1609a/
24. [Q27] PIA01592 Hubble Mars Syrtis Major 1999: https://science.nasa.gov/photojournal/a-closer-hubble-encounter-with-mars-syrtis-major
25. [Q28] ESA/Hubble heic1814a Mars und Saturn 2018: https://esahubble.org/images/heic1814a/ ; Mars-Staubsturm heic1814c: https://esahubble.org/images/heic1814c/
26. [Q29] PIA00407 Global Color Views of Mars (Viking): https://science.nasa.gov/photojournal/global-color-views-of-mars
27. [Q30] USGS Mars Viking Colorized Global Mosaic 232m (Public domain): https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m
28. [Q31] ESA Mars Express HRSC Lizenzhinweis (siehe Q5) und DLR 2019 Globalansichten: https://www.dlr.de/content/en/articles/news/2019/03/20190919_mars-marvellous-from-north-pole-to-southern-highlands.html
29. [Q32] Creative Commons Blog zur ESA-Lizenz: https://creativecommons.org/2014/12/19/european-space-agency-shares-mars-express-images-and-videos-under-cc/
30. [Q33] ESA Rosetta OSIRIS View of Mars 2007: https://sci.esa.int/web/rosetta/-/40734-osiris-view-of-mars
31. [Q34] EMM Science Data Center (ohne Richtlinie): https://sdc.emiratesmarsmission.ae/ ; Mission: https://space.gov.ae/en/projects-and-initiatives/space-exploration/emirates-mars-mission ; LASP EXI: https://lasp.colorado.edu/instruments/exi/
32. [Q35] ESA/Hubble heic1914a Jupiter 2019 (3050 x 3050): https://esahubble.org/images/heic1914a/
33. [Q36] ESA/Hubble heic2017a Jupiter und Europa 2020: https://esahubble.org/images/heic2017a/
34. [Q37] ESA/Hubble heic2113b Jupiter 2021: https://esahubble.org/images/heic2113b/
35. [Q38] ESA/Hubble heic2404a Jupiter Januar 2024: https://esahubble.org/images/heic2404a/
36. [Q39] PIA04866 Cassini Jupiter Portrait: https://science.nasa.gov/photojournal/cassini-jupiter-portrait
37. [Q40] PIA07782 Cassini Cylindrical Map of Jupiter: https://science.nasa.gov/photojournal/cassinis-best-maps-of-jupiter-cylindrical-map
38. [Q41] MAST HLSP OPAL (Global Maps, DOI 10.17909/T9G593): https://archive.stsci.edu/hlsp/opal (Zertifikatsfehler am Recherchetag; Spiegel https://stdatu.stsci.edu/hlsp/opal)
39. [Q42] JunoCam Processing (Nutzungshinweise): https://www.missionjuno.swri.edu/junocam/processing
40. [Q43] Voyager Photojournal, z. B. PIA01353 (Jupiter), PIA00400 (Saturn 1981): https://photojournal.jpl.nasa.gov/catalog/PIA00400
41. [Q44] ESA/Hubble heic2113c Saturn 12.09.2021 (1802 x 1087): https://esahubble.org/images/heic2113c/
42. [Q45] NASA Hubble Saturn 2021 (TIFF/PNG 1802 x 1087): https://science.nasa.gov/asset/hubble/saturn-5
43. [Q46] NASA Hubble Speichen-Saison (Bilder Sept 2022 und Okt 2023; HTTP 403 am Recherchetag): https://science.nasa.gov/missions/hubble/nasas-hubble-watches-spoke-season-on-saturn
44. [Q47] NASA Hubble A Saturnian Summer, 04.07.2020 (1592 x 1137): https://www.nasa.gov/image-detail/stsci-h-p2043a-f-1592x1137-1
45. [Q48] ESA/Hubble heic1917 Saturn 2019: https://esahubble.org/news/heic1917/
46. [Q49] ESA/Hubble heic1917a (2505 x 1592): https://esahubble.org/images/heic1917a/
47. [Q50] ESA/Hubble heic2416a Decade of OPAL: https://esahubble.org/images/heic2416a/
48. [Q51] PIA11141 Saturn Four Years On: https://science.nasa.gov/photojournal/saturn-four-years-on
49. [Q52] PIA21046 Saturn Approaching Northern Summer: https://science.nasa.gov/photojournal/saturn-approaching-northern-summer
50. [Q53] PIA17172 The Day the Earth Smiled: https://science.nasa.gov/photojournal/the-day-the-earth-smiled
51. [Q54] PIA06193 The Greatest Saturn Portrait Yet (8888 x 4544): https://pds-rings.seti.org/press_releases/pages/PIA06xxx/PIA06193.html
52. [Q55] PIA08388 On the Final Frontier: https://science.nasa.gov/photojournal/on-the-final-frontier/ ; PIA11453 Shadow of Demarcation: https://science.nasa.gov/photojournal/shadow-of-demarcation/
53. ESA/Hubble heic2113a Grand Tour 2021 (Montage 4800 x 2700): https://esahubble.org/images/heic2113a/
54. NASA Hubble OPAL Saturn August 2024 (Video): https://science.nasa.gov/asset/hubble/opal-saturn-observations-august-2024/
55. LROC WAC Nearside low-sun Anaglyph (Hinweis auf Low-Sun-Mosaik): https://www.lroc.im-ldi.com/images/733
