# Recherche: Objektdaten (Winkelgroessen, Zustaende, Monde, Testfall-Zahlen)

- Auftrag: Zahlenbasis fuer die festen Objektzustaende (A-X1), die Monde (A-X2), das Punktquellenmodell (A-P6) und die quantitative Untermauerung der Beobachtungs-Testfaelle T1 bis T6 (A-Q2). Beantwortet die offenen Fragen 8 und 9 aus `docs/anforderungen.md`, Abschnitt 9.
- Datum: 2026-10-23
- Zugeordnete Kennungen: A-X1, A-X2, A-P6, A-Q2
- Konventionen: Winkel in Bogensekunden (") bzw. Bogenminuten ('). 1 AE = 149 597 871 km, 1 rad = 206 265". Umrechnung Winkel = Laenge / Entfernung * 206 265. Alle mit "ber." markierten Werte sind aus den zitierten Quelldaten selbst gerechnet (Skript-Lauf vom 2026-10-23), nicht aus einer Quelle abgeschrieben. Quellen in eckigen Klammern verweisen auf die nummerierte Liste am Ende.

## 1. Winkelgroessen der vier Objekte

### 1.1 Grunddaten

| Objekt | Aequatorradius km | Polradius km | Abplattung | Entfernung min / max | Scheinbarer Durchmesser min / max | Quelle |
|---|---|---|---|---|---|---|
| Mond | 1738,1 | - | - | 363 300 / 405 500 km (Perigaeum/Apogaeum), Mittel 384 400 km | 1768" / 1974" (ber.), Mittel 1865" (ber.) | [1] |
| Mars | 3396,2 | 3376,2 | 0,00589 | 54,6 / 401,4 Mio. km | 3,5" / 25,6" (Fact Sheet) | [2] |
| Jupiter | 71 492 | 66 854 | 0,06487 | 588,5 / 968,5 Mio. km | 30,5" / 50,1" (Fact Sheet, aequatorial) | [3] |
| Saturn | 60 268 | 54 364 | 0,09796 | 1205,5 / 1658,6 Mio. km | 14,5" / 19,9" (Fact Sheet; ber. aus Minimalentfernung 20,6") | [4] |

Anmerkungen:
- Mond: Das Fact Sheet [1] nennt als "mittleren" scheinbaren Durchmesser 1896"; aus 2 * 1738,1 km / 384 400 km folgen 1865" (31' 05"). Der Wert 1865" entspricht dem geozentrischen Mittel der Astronomischen Jahrbuecher; 1896" duerfte ein anderer Mittelwertbegriff sein (siehe Abschnitt "Unsicher"). Fuer astobsim: 1865" als Mittel, Spanne 1768" bis 1974".
- Jupiter: Polarer Durchmesser = aequatorialer * (1 - 0,06487). Bei 47" aequatorial also 44,0", bei 35" aequatorial 32,7" (ber.).
- Saturn: Polarer Durchmesser = aequatorialer * (1 - 0,09796). Bei 20" also 18,0", bei 16" 14,4" (ber.). Das Fact Sheet gibt 19,9" als Maximum an; aus der dort genannten Minimalentfernung folgen 20,6", und Perihel-Oppositionen (2003, 2032/33) erreichen ca. 20,6" bis 20,7" (ber. aus Perihel 9,04 AE minus 1 AE).
- Aeussere Ringkante (A-Ring) bei 136 770 km = 2,269 Saturnradien [6]; Ringdurchmesser also 2,27-mal Scheibendurchmesser: bei 20" 45,4", bei 16" 36,3" (ber.).

### 1.2 Entsprechung der festen Zustaende aus A-X1

| Zustand | Entfernung (ber.) | Entspricht | Belege |
|---|---|---|---|
| Mars 25" | 0,375 AE | Perihel-Opposition: 2003-08 (25,1"), 2018-07 (24,2", globaler Staubsturm), 2035-09 (24,5"); naechste 2050 (Maximum -2,94 mag) | [7], [8], [9] |
| Mars 14" | 0,669 AE | Aphel-Opposition: 2012-03 (13,9"), 2025-01 (14,5"), 2027-02 (13,8") | [7] |
| Mars 6" | 1,56 AE | Kein Oppositionswert. Mars steht so etwa drei bis vier Monate vor oder nach einer Opposition (bzw. den groessten Teil der Zeit zwischen 3,5" und 7"). Phasenwinkel dann 36 bis 39 Grad, beleuchteter Anteil ca. 0,89 bis 0,90 (ber. fuer Sonnenabstand 1,45 bis 1,65 AE). Der Zustand 6" ist also **deutlich gibbos**, siehe Abschnitt "Unsicher". | [2], [9] |
| Jupiter 47" | 4,195 AE | Mittlere Opposition (a = 5,2028 AE -> mittlere Oppositionsentfernung 4,20 AE -> 46,9", ber.). Beispiele: 2014-01 46,8", 2019-06 46,0", 2026-01 46,5"; Perihel-Oppositionen 2010 49,9", 2022-09 49,8", 2024-12 48,2"; Aphel-Oppositionen 2016/2017 44,3" bis 44,4" | [3], [10], [11], [12] |
| Jupiter 35" | 5,63 AE | Kein Oppositionswert; Jupiter etwa vier Monate vor/nach Opposition bzw. zwei Monate nach Konjunktion (Quadratur: ca. 5,3 AE / 37"). Phasenwinkel bis 11 Grad, Phaseneffekt vernachlaessigbar (Beleuchtung > 0,99). | [3] |
| Saturn 20" | 8,31 AE | Opposition nahe Perihel: 2026-10 19,7", 2003-12 ca. 20,6", 2032/33 ca. 20,6" (ber.). Die mittlere Opposition (9,58 - 1 AE) ergibt 19,4", die Aphel-Opposition 18,2" (ber.). | [4], [13] |
| Saturn 16" | 10,39 AE | Kein Oppositionswert; Saturn etwa drei Monate nach Konjunktion oder vor Konjunktion. Phasenwinkel ca. 6 Grad. Eine Aphel-Opposition (z. B. 2018/2019) haette 18,2" bis 18,4". | [4] |

Fazit: Die Zustaende Mars 14"/25", Jupiter 47" und Saturn 20" sind die typischen Oppositionsanblicke. Die kleinen Zustaende (Mars 6", Jupiter 35", Saturn 16") sind "Nicht-Oppositions"-Anblicke und als solche fuer Einsteiger sehr sinnvoll (so sieht man die Planeten meistens). Die Ringneigung ist von der Groesse unabhaengig; siehe 1.3.

### 1.3 Ringneigung Saturn (Zyklus)

- Die Ringebene ist um 26,73 Grad gegen die Bahn geneigt [4]; die von der Erde gesehene Ringoeffnung B schwankt mit der Saturn-Umlaufzeit 29,5 Jahre zwischen etwa -27 und +27 Grad [14].
- Ringkantenstellung 2025-03-23; danach Suedseite sichtbar (negatives B). Werte aus dem PDS-Ring-Ephemeridengenerator [14]: Opposition 2026-10 ca. -7,5 Grad; 2027: -11,7 bis -14,4; 2028: -16,9 bis -19,2; 2029: -21,4 bis -23,0; 2030: -24,7 bis -25,5; Maximum -26,94 Grad am 2032-05-12; wieder 0 Grad am 2038-10-15.
- "Mittlere Ringoeffnung" (A-X1) = etwa 13 bis 16 Grad. Das entspricht den Oppositionen 2027/2028 und 2035/2036 (Suedseite) bzw. 2013/2014 und 2021/2022 (Nordseite). Empfehlung: B = 15 Grad.
- Projizierte kleine Ringachse = 45,4" * sin B: bei B = 15 Grad 11,7" (20") bzw. 9,4" (16"); bei B = 7,5 Grad nur 5,9"/4,7"; bei 27 Grad 20,6"/16,5" (ber.).

## 2. Mond kurz nach dem ersten Viertel

### 2.1 Phase, beleuchteter Anteil, Kolongitude

- Beleuchteter Anteil k = (1 + cos i) / 2 mit Phasenwinkel i [15]. Erstes Viertel: i = 90 Grad, k = 0,5.
- Selenographische Kolongitude C der Sonne = 90 Grad minus selenographische Laenge des subsolaren Punktes; der Morgenterminator liegt (ohne Libration) bei selenographischer Laenge -C, also bei C Grad westlicher Laenge [15]. Ein Merkmal bei oestlicher Laenge L (Ost positiv) hat Sonnenaufgang bei C = -L (mod 360). C waechst um ca. 12,2 Grad pro Tag.
- Naeherung k = (1 + sin C) / 2 (ber. aus beiden Definitionen, Libration vernachlaessigt):

| C (Grad) | k | Phasenwinkel | Zeit nach erstem Viertel |
|---|---|---|---|
| 0 | 0,50 | 90,0 | 0,0 d |
| 5,7 | 0,55 | 84,3 | 0,5 d |
| 10 | 0,59 | 80,0 | 0,8 d |
| 12 | 0,60 | 78,0 | 1,0 d |
| 15 | 0,63 | 75,0 | 1,2 d |

"Kurz nach dem ersten Viertel" mit 55 bis 60 % Beleuchtung bedeutet also C = 6 bis 12 Grad, etwa 0,5 bis 1 Tag nach dem geometrischen ersten Viertel. Empfehlung: Zielwert C = 10 bis 12 Grad (k = 0,59 bis 0,60); das Quellbild soll eine Kolongitude in diesem Bereich haben (bei der Bildrecherche aus Datum/Uhrzeit pruefen).

### 2.2 Strukturen am Terminator (Gazetteer-Koordinaten, Sonnenaufgangs-Kolongitude ber.)

| Struktur | Koordinaten (Gazetteer) | Groesse km | Sonnenaufgang bei C | Sichtbar bei C = 10 bis 12 | Quelle |
|---|---|---|---|---|---|
| Vallis Alpes (Alpental) | 49,2 N, 3,6 E | 155 lang, ca. 10 breit | 356 | ja, 14 bis 16 Grad nach Sonnenaufgang, Schatten noch lang | [16] |
| Montes Apenninus | ca. 19 N, 3 W (Zentrum) | ca. 600 lang | ca. 3 | ja, Kette steht knapp hinter dem Terminator | [17] (Koordinaten gerundet) |
| Rima Hadley | 25,7 N, 3,15 E | 80 (Punktwert) bzw. 116 (Polygon) lang, ca. 1,2 breit | 357 | ja (klassischer Termin: 1 Tag nach erstem Viertel) | [18], Breite [19] |
| Hadley C | 25,5 N, 2,8 E | 5,80 | 357 | ja | [20] |
| Aratus | 23,6 N, 4,5 E | 10,23 | 355,5 | ja | [21] |
| Triesnecker | 4,2 N, 3,6 E | 24,97 | 356,4 | ja | [22] |
| Hyginus | 7,8 N, 6,3 E | 8,70 | 353,7 | ja | [23] |
| Ptolemaeus / Alphonsus / Arzachel | 9,3 S, 1,8 W / 13,4 S, 2,85 W / 18,2 S, 1,9 W | 153,7 / 110,5 / ca. 97 | 1,8 / 2,9 / 1,9 | ja, Boden gerade beleuchtet, Waelle werfen lange Schatten | [24], [25] |
| Archimedes | 29,7 N, 4,0 W | 81,0 | 4 | ja | [26] |
| Beer / Feuillee (Kraterpaar in Mare Imbrium) | 27,1 N, 9,1 W / 27,4 N, 9,5 W | 9,06 / 8,94 | 9,1 / 9,5 | ja, direkt am Terminator | [27], [28] |
| Kirch | 39,3 N, 5,6 W | 11,71 | 5,6 | ja | [29] |
| Plato | 51,6 N, 9,3 W | 100,7 | 9,3 | gerade im Sonnenaufgang | [30] |
| Eratosthenes | 14,5 N, 11,3 W | 58,8 | 11,3 | am Terminator | [31] |
| Clavius | 58,4 S, 14,4 W | 230,8 | 14,4 | erst ab C ca. 14, also am 1,2. Tag nach dem Viertel; bei C = 10 noch dunkel | [32] |
| Copernicus | 9,6 N, 20,1 W | ca. 93 | 20 | nein, noch in der Nacht | [33] |
| Birt | 22,4 S, 8,6 W | 15,81 | 8,6 | ja (Rupes Recta daneben) | [34] |
| Bessel | 21,7 N, 17,9 E | 15,56 | 342 | ja, voll beleuchtet im Mare Serenitatis | [35] |
| Linne | 27,75 N, 11,8 E | 2,23 | 348 | als heller Fleck, kein Krater erkennbar | [36] |

Koordinaten ohne eigene Quellenangabe (Apenninen, Ptolemaeus, Arzachel, Archimedes, Plato, Eratosthenes, Clavius, Copernicus) wurden nicht einzeln im Gazetteer abgerufen, sondern aus den Suchergebnissen bzw. den gaengigen Atlaswerten gerundet uebernommen; die Durchmesser stammen aus dem Gazetteer [24], [26], [30], [31], [32]. Pruefung siehe Abschnitt "Unsicher".

### 2.3 Mare-Groessen fuer T6 (blosses Auge)

Gazetteer-Durchmesser [37] bis [43], Winkel bei 384 400 km (1 km = 0,5366", ber.):

| Mare | Durchmesser km (Gazetteer, erster Wert / Alternativwert) | Winkel bei mittlerer Entfernung | Beleuchtet bei C = 10 bis 12 |
|---|---|---|---|
| Oceanus Procellarum | 2592 / 2568 | 23,2' | nein (westlich, noch dunkel) |
| Mare Imbrium | 1145,5 / 1123 | 10,2' | nur Ostteil |
| Mare Tranquillitatis | 875,8 / 873 | 7,8' | ja |
| Mare Fecunditatis | 840,4 / 909 | 7,5' | ja |
| Mare Serenitatis | 674,3 / 707 | 6,0' | ja |
| Mare Crisium | 555,9 / 418 | 5,0' (bzw. 3,7') | ja, nahe Ostrand (randnah verkuerzt) |
| Mare Humorum | 419,7 | 3,8' | nein |
| Mare Nectaris | nicht abgerufen | - | ja |

Zum Vergleich: Augenaufloesung 1' (A-P2). Serenitatis, Tranquillitatis, Fecunditatis und Crisium sind mit 5' bis 8' klar ueber der Augengrenze; der groesste Krater Clavius (231 km = 124" = 2,1') liegt zwar knapp ueber 1', hat aber als Struktur ohne Albedokontrast keine Chance, was die Erwartung "Mare als Flecken, keine Krater" stuetzt. Albedo: Mond geometrisch 0,12 im Mittel [1]; Mare-Albedo etwa 0,07 bis 0,10, Hochland 0,11 bis 0,18 (Groessenordnung, nicht einzeln belegt, siehe "Unsicher").

## 3. Monde fuer A-X2

### 3.1 Physische und Bahndaten

| Mond | Mittlerer Radius km | Durchmesser km | Bahnhalbachse km | in Planetenradien (ber.) | Umlauf d | Bahnneigung zum Planetenaequator | V bei mittlerer Opposition | Geometr. Albedo | Quellen |
|---|---|---|---|---|---|---|---|---|---|
| Io | 1821,49 | 3643 | 421 800 | 5,90 R_J | 1,769 | 0,04 | 5,02 | 0,62 | [44], [45], [46] |
| Europa | 1560,80 | 3122 | 671 100 | 9,39 R_J | 3,551 | 0,47 | 5,29 | 0,68 | [44], [45], [46] |
| Ganymed | 2631,20 | 5262 | 1 070 400 | 14,97 R_J | 7,155 | 0,18 | 4,61 | 0,44 | [44], [45], [46] |
| Kallisto | 2410,30 | 4821 | 1 882 700 | 26,33 R_J | 16,689 | 0,19 | 5,65 | 0,19 | [44], [45], [46] |
| Titan | 2574,76 | 5150 | 1 221 870 | 20,27 R_S | 15,945 | 0,33 | 8,4 | 0,22 | [44], [47], [46] |
| Rhea | 763,50 | 1527 | 527 040 | 8,74 R_S | 4,518 | 0,35 | 9,6 | 0,7 | [44], [47], [46] |

Magnituden: Die JPL-Seite [44] fuehrt heute keine V0-Spalte mehr; die Werte stammen aus der Satellitendatenbank des Sternberg-Instituts [46], die Morrison et al. 1974 (Jupiter) und Morrison et al. 1984 (Saturn) zitiert. Aeltere JPL-Tabellen nannten Titan 8,28 und Rhea 9,7; Horizons liefert tagesaktuelle Werte (Titan typisch 8,3 bis 8,5, Rhea 9,7 bis 10,0). Fuer astobsim genuegen die Mittelwerte; bei Jupiter 35" bzw. Saturn 16" kommen +0,6 bzw. +0,4 mag Entfernungskorrektur dazu (ber. ueber 5 log10(r d) relativ zur mittleren Opposition).

### 3.2 Winkeldurchmesser und maximale Elongation je Zustand (ber.)

| Mond | Jupiter 47" (4,195 AE) Durchmesser / Elongation | Jupiter 35" (5,63 AE) Durchmesser / Elongation |
|---|---|---|
| Io | 1,20" / 138,6" = 2,3' | 0,89" / 103,2" = 1,7' |
| Europa | 1,03" / 220,6" = 3,7' | 0,76" / 164,3" = 2,7' |
| Ganymed | 1,73" / 351,8" = 5,9' | 1,29" / 262,0" = 4,4' |
| Kallisto | 1,58" / 618,9" = 10,3' | 1,18" / 460,9" = 7,7' |

| Mond | Saturn 20" (8,31 AE) Durchmesser / Elongation | Saturn 16" (10,39 AE) Durchmesser / Elongation |
|---|---|---|
| Titan | 0,85" / 202,7" = 3,4' | 0,68" / 162,2" = 2,7' |
| Rhea | 0,25" / 87,4" = 1,5' | 0,20" / 70,0" = 1,2' |

Bezug zu A-P6: Ganymed (1,7") und Kallisto (1,6") liegen bei 47" ueber der Rayleigh-Grenze eines 200-mm-Geraets (0,69" bei 550 nm) und werden ab etwa 150 bis 200 mm Oeffnung bei gutem Seeing als Scheibchen erkennbar; Io (1,2") und Europa (1,0") brauchen 250 bis 300 mm. Titan (0,85") ist nur im 300-mm-Geraet bei bestem Seeing grenzwertig als Scheibchen, Rhea (0,25") ist in jedem Fall Punktquelle. Fuer den Unterschied Scheibchen/Punkt ist in A-P6 das Seeing (0,5" bis 5") meist der Flaschenhals.

### 3.3 Vorschlag fester typischer Stellungen

Koordinaten: dx positiv = Osten (bei "Norden oben" links im Bild, A-D11), dy positiv = Norden, Angaben in Bogensekunden relativ zur Planetenmitte. Die Bahnebene der Galileischen Monde liegt praktisch im Jupiteraequator; Jupiters Achsneigung von 3,1 Grad [3] laesst die Monde bis zu ca. 3 Grad aus der Linie treten. Gewaehlt: Neigung 2 Grad, Bahnphase so, dass alle vier Monde sichtbar, keiner vor oder hinter der Scheibe, Anordnung unsymmetrisch (zwei westlich, zwei oestlich, Io innen). Die dy-Werte folgen aus dy = sqrt(1 - (dx/E)^2) * E * sin(2 Grad) mit E = maximaler Elongation; Vorzeichen frei gewaehlt (ber.).

Jupiter 47":

| Mond | dx " | dy " | Durchmesser " | Magnitude |
|---|---|---|---|---|
| Io | -110 | +2,9 | 1,20 | 5,0 |
| Europa | +175 | -4,7 | 1,03 | 5,3 |
| Ganymed | +330 | +4,3 | 1,73 | 4,6 |
| Kallisto | -520 | -11,7 | 1,58 | 5,7 |

Jupiter 35" (gleiche Konfiguration, linear mit 35/47 skaliert):

| Mond | dx " | dy " | Durchmesser " | Magnitude |
|---|---|---|---|---|
| Io | -82 | +2,2 | 0,89 | 5,6 |
| Europa | +130 | -3,5 | 0,76 | 5,9 |
| Ganymed | +246 | +3,2 | 1,29 | 5,2 |
| Kallisto | -387 | -8,7 | 1,18 | 6,3 |

Gesamtausdehnung bei 47": 850" = 14,2' (Kallisto bis Ganymed); im 10x50 mit 6,5 Grad Gesichtsfeld problemlos, die Monde stehen 1,8' bis 8,7' vom Planeten (T6). Bei 1' Augenaufloesung und 10-fach (6" effektiv) sind alle vier getrennt sichtbar; Io mit 110" = 1,8' Abstand ist der kritische Fall gegen die Ueberstrahlung des Planeten. Will man fuer T6 "zwei bis vier Monde", ist diese Stellung mit vier Monden die obere Grenze; realistischer Alltag sind drei sichtbare Monde (einer verdeckt oder im Schatten). Variante fuer drei Monde: Io weglassen (Durchgang), Rest unveraendert.

Saturn 20" mit Ringoeffnung B = 15 Grad, Bahnebene = Ringebene. Monde laufen auf Ellipsen mit Halbachsen E und E sin B; Titan links unten (suedlich, "vor" dem Planeten), Rhea rechts oben (noerdlich, hinter dem Planeten). Rhea bei dx = -60" steht ausserhalb der Ringansen (A-Ring aussen 22,7") und wird nicht verdeckt (ber.).

| Mond | dx " | dy " | Durchmesser " | Magnitude |
|---|---|---|---|---|
| Titan | +150 | -35 | 0,85 | 8,3 |
| Rhea | -60 | +17 | 0,25 | 9,5 |

Saturn 16" (skaliert mit 16/20):

| Mond | dx " | dy " | Durchmesser " | Magnitude |
|---|---|---|---|---|
| Titan | +120 | -28 | 0,68 | 8,8 |
| Rhea | -48 | +13 | 0,20 | 10,0 |

Die Magnituden bei Saturn 20" sind gegenueber der mittleren Opposition um 0,1 mag heller (Entfernung 8,31 statt 8,54 AE), bei 16" um 0,4 mag schwaecher (ber.).

Nachtrag 2026-10-27 (Issue #13, PR #61, Entscheidung Herbert): Das Quellbild heic2113c hat B = 19 Grad (Horizons 19,2 Grad, gemessen 19,15 Grad), deshalb gilt in `objekte.json` `ringneigung_grad: 19` statt der Empfehlung 15 Grad aus 1.3 (A-X3 hat Vorrang, siehe 7 Punkt 3). Die dy-Werte sind mit derselben Formel dy = sqrt(1 - (dx/E)^2) * E * sin B fuer B = 19 Grad neu gerechnet: Saturn 20" Titan +150/-44,4, Rhea -60/+20,7; Saturn 16" Titan +120/-35,5, Rhea -48/+16,6 (ber., im Review von PR #61 nachgerechnet). dx, Durchmesser und Mondmagnituden bleiben.

## 4. Zahlen fuer die Testfaelle

### 4.1 T1: Jupiter 47", 70 mm, 100-fach, Seeing 2"

Breitengrenzen der Baender (planetographisch; Fletcher et al. 2017 nennen NEB 6,8 bis 17,1 Grad N [48]; Fletcher et al. 2017b nennen SEB 7 bis 17 Grad S planetozentrisch [49], umgerechnet mit tan(phi_g) = (R_e/R_p)^2 tan(phi_c): 8,0 bis 19,3 Grad S, ber.). Die BAA-Definition legt Baender ueber die Jetstrom-Breiten fest [50]. Die SEB kann in "Fade"-Phasen (zuletzt 2010) fast verschwinden [49]; das Quellbild muss eine normale SEB zeigen.

Projizierte Breite am Zentralmeridian (ber. mit polarer Halbachse, Breite in planetozentrischer Breite projiziert):

| Band | Breite planetogr. | Breite 47" | Breite 35" | Abstand vom Aequator (47") |
|---|---|---|---|---|
| NEB | 6,8 N bis 17,1 N | 3,4" | 2,6" | 2,3" bis 5,7" nach Norden |
| SEB | 8,0 S bis 19,3 S | 3,8" | 2,8" | 2,7" bis 6,4" nach Sueden |
| EZ dazwischen | 8 S bis 7 N | ca. 5,0" | ca. 3,7" | - |

Grosser Roter Fleck (GRF): Zentrum 22,5 bis 23 Grad S planetographisch [51]. Groesse laut Hubble/WFC3-Windfeldmessungen (Wong et al. 2021, Tabelle 1 [52]): grosse Achse 2009 15,6 * 10^3 km (13,3 Grad Laenge), 2017 bis 2019 13,0 bis 14,0 * 10^3 km (11,1 bis 11,9 Grad), 2020 12,4 * 10^3 km (10,6 Grad); kleine Achse durchgehend ca. 10 bis 11 * 10^3 km (8,2 bis 9,2 Grad Breite). Simon et al. 2024 (Hubble, Dez. 2023 bis Maerz 2024, Tabelle 3 [51]): rote Ellipse 13,3 bis 14,2 * 10^3 km mal 9,7 bis 10,2 * 10^3 km, dynamische Ellipse 10,7 bis 12,8 mal 8,8 bis 10,8 * 10^3 km, Achsenverhaeltnis ca. 1,35 bis 1,46. Simon et al. 2018 [53] (im Volltext nicht zugaenglich) werden von Sanchez-Lavega et al. 2018 mit "21 Grad Laenge zur Voyager-Zeit, 14 Grad in den letzten Jahren" zitiert [54]; die NASA-Pressemitteilung von 2014 nannte 16 500 km [55]. Fuer astobsim: GRF 14 000 x 10 000 km (rote Ellipse 2024).

| Zustand | GRF 14 000 x 10 000 km | GRF 12 400 x 10 000 km (dynamisch 2020) |
|---|---|---|
| 47" | 4,6" x 3,3" | 4,1" x 3,3" |
| 35" | 3,4" x 2,4" | 3,0" x 2,4" |

Bei 47" und 70 mm: Rayleigh 1,98", Dawes 1,66" (bei 550 nm); die Baender (3,4" bis 3,8" breit, Kontrastkante ueber 40" Laenge) liegen klar darueber, der GRF (4,6" x 3,3") nur knapp darueber und hat geringen Kontrast gegen die SEB: Erwartung "Baender ja, GRF Andeutung" passt. Bei Seeing 2" FWHM ist die Gesamt-PSF ca. 2,5" bis 3", der GRF dann nur noch ein Hauch.

Kontrast: Quantitative I/F-Werte (Reflektivitaet) fuer Baender/Zonen im Sichtbaren: Orton 1975 gibt effektive Reflektivitaeten STrZ 0,76, NEB und SEB 0,62 bis 0,63, GRF 0,64 (Mittel 339 bis 840 nm) [56], also Band/Zone etwa 0,82 (Helligkeitsverhaeltnis), Kontrast (Z-B)/(Z+B) ca. 0,10 im Breitband; im Blau ist der Kontrast deutlich hoeher, im Rot geringer. Pellier (ALPO-Japan) misst in Amateurphotometrie ein aehnliches Verhaeltnis [57]. Hinweis: Kontrast 0,10 bei 3,5" Breite ist fuer das Auge am 70-mm-Geraet gerade noch gut; das ist der Grund, warum die Baender bei Einsteigern oft "grau in grau" erscheinen.

### 4.2 T2: Saturn 20", Seeing 1,5", 100 mm gegen 60 mm

Ringgrenzen (PDS Ring-Moon Systems Node [6]; NASA Ring Fact Sheet [5] weicht leicht ab):

| Struktur | Innen km | Aussen km | Breite km | in R_S (ber.) |
|---|---|---|---|---|
| C-Ring | 74 491 | 91 975 | 17 484 | 1,236 bis 1,526 |
| B-Ring | 91 975 | 117 570 (Fact Sheet 117 507) | 25 595 | 1,526 bis 1,951 |
| Cassini-Teilung | 117 500 | 122 050 (Fact Sheet A-Ring innen 122 340) | 4550 (Fact Sheet: 4833) | 1,950 bis 2,025 |
| A-Ring | 122 050 | 136 770 (Fact Sheet 136 780) | 14 720 | 2,025 bis 2,269 |
| Encke-Teilung | 133 423 | 133 745 | 322 | 2,216 |
| Keeler-Teilung | 136 487 | 136 522 | 35 | 2,265 |

Winkelwerte an den Ringenden (radiale Richtung, dort unverkuerzt; ber.):

| Zustand | km pro " | Cassini 4550 km | Cassini 4833 km | Encke 322 km | Cassini-Radius (Mitte 119 800 km) vom Planetenzentrum |
|---|---|---|---|---|---|
| 20" | 6027 | 0,755" | 0,80" | 0,053" | 19,9" (Ringende 22,7") |
| 16" | 7534 | 0,604" | 0,64" | 0,043" | 15,9" (Ringende 18,2") |

Auf der Vorder- und Rueckseite des Rings ist die Teilung um sin B verkuerzt (bei 15 Grad: 0,2"), daher "an den Ringenden erkennbar" (A-Q2). Vergleich: Rayleigh 100 mm = 1,38", 60 mm = 2,31", Dawes 100 mm = 1,16". Die Cassini-Teilung (0,76") liegt unter beiden Grenzen; sie wird dennoch gesehen, weil sie eine dunkle Linie zwischen hellen Flaechen ist (Linienkontrast, kein Doppelsternkriterium): sichtbar, sobald die ueber die PSF verschmierte Helligkeitsdelle den Schwellenkontrast des Auges (einige Prozent) uebersteigt. Bei 100 mm mit Seeing 1,5" (Gesamt-PSF ca. 2,0") bleibt eine Delle von grob 0,76/2,0 * Tiefe; bei 60 mm (Gesamt-PSF ca. 2,8") etwa halb so tief. Encke (0,05") bleibt in jeder Amateuroeffnung unter der Schwelle, wird aber mit 250 bis 300 mm bei exzellentem Seeing als Kontrastkante am A-Ring-Rand photographisch erreicht; visuell ein Gegenbeispiel, das astobsim nicht zeigen darf.

Albedo/optische Tiefe aus dem Fact Sheet [5]: B-Ring optische Tiefe 0,4 bis 2,5, Albedo 0,4 bis 0,6; A-Ring 0,4 bis 1,0; Cassini-Teilung 0 bis 0,1, Albedo 0,2 bis 0,4; C-Ring 0,05 bis 0,35, Albedo 0,12 bis 0,30 (im Bild halbtransparent, "Krepp-Ring").

### 4.3 T3: Mond, 80 mm, 100-fach, Seeing 2"

- Bei 384 400 km: 1 km = 0,537" (ber.). 4 km = 2,15", 10 km = 5,4".
- Rayleigh 80 mm = 1,73", Dawes 1,45". Ein 4-km-Krater (2,15") ist mit dem Schattenwurf am Terminator (Kontrast nahe 1) gerade erkennbar; Gesamt-PSF mit Seeing 2" liegt bei ca. 2,6", also an der Grenze, passend zur Erwartung.
- Rima Hadley: Laenge 80 km (Gazetteer-Punktwert) bzw. 116 km (Gazetteer-Polygon) [18], Breite ca. 1,2 km (Apollo-15-Literatur: 1 bis 1,5 km, Tiefe 300 m) [19]. In Winkeln: 43" (bzw. 62") lang, 0,64" breit. Als dunkle Linie unter der PSF prinzipiell wie die Cassini-Teilung sichtbar, aber der Kontrast ist viel geringer (flache Mare-Rille, nur der Schattenrand); Erfahrung: ab 100 bis 150 mm bei gutem Seeing. Fuer 80 mm bei Seeing 2" "nicht sichtbar" ist plausibel.
- Beispielkrater 4 bis 12 km am Terminator bei C = 10 bis 12 (Gazetteer): Hadley C 5,8 km = 3,1" [20]; Hyginus 8,7 km = 4,7" [23]; Feuillee 8,9 km = 4,8" [28]; Beer 9,1 km = 4,9" [27]; Aratus 10,2 km = 5,5" [21]; Kirch 11,7 km = 6,3" [29]. Gegenbeispiel Linne 2,2 km = 1,2" [36]. Mittelgross: Birt 15,8 km = 8,5" [34], Bessel 15,6 km = 8,4" [35], Triesnecker 25,0 km = 13,4" [22].
- Vallis Alpes: 155 km lang (83"), die Rille im Talboden ist ca. 0,5 bis 1 km breit (< 0,5") und ein klassischer Test fuer 200 mm und mehr [16] (Rillenbreite aus Literatur, nicht aus dem Gazetteer).

### 4.4 T5: Mars 14" (150 mm, 200-fach, Seeing 1,5") und Mars 6" (80 mm)

- Massstab (ber.): 14" -> 485 km pro "; 6" -> 1132 km pro "; 25" -> 272 km pro ".
- Syrtis Major: Albedostruktur zentriert bei ca. 290 W, 10 N; keilfoermig, ca. 1500 km Nord-Sued, ca. 1000 km Ost-West [58]; Gazetteer "Syrtis Major Planum" 1350 km (zweiter Wert 1215 km) [59]. Die Breite schwankt saisonal und nach Staubstuermen (ALPO: seit 1990 schmaler und stumpfer) [60]. In Winkeln: 14" -> 3,1" x 2,1"; 6" -> 1,3" x 0,9"; 25" -> 5,5" x 3,7". Rayleigh 150 mm = 0,92": Syrtis bei 14" (3") ist klar aufloesbar, bei 6" im 80 mm (1,3" gegen Rayleigh 1,7") nur ein Hauch von Dunkelheit, passend zu "nur Scheibchen".
- Polkappen: Nordkappe (Wassereis-Restkappe) ca. 1000 km Durchmesser im Nordsommer [61]; Suedkappe Restkappe ca. 400 km (350 bis 500 km, um ca. 200 km vom Pol versetzt) [61], [62]. Saisonale Kappen: Suedkappe im Winter bis unter 55 S (ALPO) [63] bzw. bis 40 S (Mars Express bei Ls 80 bis 90) [64]; Nordkappe maximal etwa 53 Grad Durchmesser (Kante ca. 63 N) [63], Sommerrest bei ca. 79 bis 80 N [63].
- Jahreszeit der Zustaende: Mars 25" = Perihel-Opposition, Ls ca. 250 (2003) bzw. 220 (2018): Suedkappe im Rueckzug, Kante etwa 80 bis 82 S [65] -> ca. 1000 bis 1200 km -> 3,7" bis 4,4" bei 25" (ber.). Mars 14" = Aphel-Opposition, Ls ca. 35 (2025) bis 65 (2027), Nordfruehling: Nordkappe noch gross, Kante grob 65 bis 72 N (Schaetzung aus [63], siehe "Unsicher") -> 2100 bis 3000 km -> 4,3" bis 6,2" Breite bei 14", in der Hoehe durch Neigung verkuerzt. Mars 6" (80 mm): Nordkappe 2000 km -> 1,8", Restkappe 1000 km -> 0,9". Die "angedeutete Polkappe" bei 6" ist damit ein heller Punkt am Rand, nicht mehr.
- Albedokontrast: Mars geometrische Albedo 0,17 (Gesamt) [2]; dunkle Gebiete etwa 0,10 bis 0,15, helle 0,25 bis 0,30, Polkappe > 0,5 (Groessenordnung, siehe "Unsicher").

### 4.5 T6: Mond und Jupiter mit blossem Auge, Jupiter im 10x50

- Mond: Mare 5' bis 8' (Abschnitt 2.3), Clavius 2,1' ohne Albedokontrast; Augengrenze 1' -> "Mare als Flecken, keine Krater" erfuellt.
- Jupiter mit blossem Auge: 47" = 0,78' < 1' -> Punkt; Magnitude -2,7 [66]. Die Monde (Ganymed 4,6 mag) stehen 2,3' bis 10,3' vom Planeten, werden aber durch Blendung ueberstrahlt (A-P4 begrenzt Helligkeit, Blendung wird nicht simuliert, A-P9); astobsim muss die Monde beim blossen Auge also entweder unterdruecken oder als nicht sichtbar begruenden (siehe "Unsicher").
- Jupiter im 10x50: Scheibe 47" * 10 = 7,8' scheinbar -> "winziges Scheibchen". Monde bei 10-fach: Io 1,8' (scheinbar 18'), Europa 2,9', Ganymed 5,5', Kallisto 8,7' vom Planeten; Baender 3,5" * 10 = 35" scheinbar, unter der Augengrenze (1') -> "keine Baender" erfuellt.

## 5. Magnituden und Flaechenhelligkeiten

### 5.1 Magnituden (Mallama und Hilton 2018 [66])

Formeln (V in mag, r = Sonnenabstand AE, d = Erdabstand AE, alpha = Phasenwinkel Grad):
- Mars (alpha <= 50): V = 5 log10(r d) - 1,601 + 0,02267 alpha - 0,0001302 alpha^2 (+ kleine Terme fuer Rotations- und Jahreszeitenlage, Spanne 0,11 bzw. 0,15 mag).
- Jupiter (alpha <= 12): V = 5 log10(r d) - 9,395 - 3,7e-4 alpha + 6,16e-4 alpha^2.
- Saturn (alpha < 6,5, Ringe inklusive): V = 5 log10(r d) - 8,914 - 1,825 sin B + 0,026 alpha - 0,378 sin B exp(-2,25 alpha); B = effektive Ringneigung (geometrisches Mittel aus Erd- und Sonnensicht).
- Statistik (Tabellen 3 bis 5): Mars hellste -2,94, mittlere Opposition -2,09 (nominal) / -1,98 (statistisch), schwaechste +1,86. Jupiter hellste -2,94, mittlere Opposition -2,70, schwaechste -1,66. Saturn hellste -0,55, mittlere Opposition +0,05, schwaechste +1,17 (Ringe kantig).

Werte fuer die Zustaende (ber. mit den Formeln oben):

| Zustand | r / d AE | alpha | V | Bemerkung |
|---|---|---|---|---|
| Mars 25" | 1,38 / 0,375 | 0 | -3,0 | 2003 beobachtet -2,9 |
| Mars 14" | 1,67 / 0,669 | 0 | -1,4 | 2025: -1,4 [7] |
| Mars 6" | 1,45 bis 1,65 / 1,56 | 36 bis 39 | +0,9 bis +1,1 | gibbos, k = 0,89 bis 0,90 |
| Jupiter 47" | 5,20 / 4,195 | 0,5 | -2,7 | |
| Jupiter 35" | 5,20 / 5,63 | 10 | -2,0 | |
| Saturn 20", B = 15 | 9,3 / 8,31 | 0,5 | +0,0 | nur Kugel: +0,5; B = 7,5: +0,3; B = 27: -0,3 |
| Saturn 16", B = 15 | 9,4 / 10,39 | 6 | +0,7 | nur Kugel: +1,2 |
| Saturn 20", B = 19 | 9,3 / 8,31 | 0,5 | -0,1 | Nachtrag 2026-10-27 (#13): in objekte.json verwendet |
| Saturn 16", B = 19 | 9,4 / 10,39 | 6 | +0,6 | Nachtrag 2026-10-27 (#13): in objekte.json verwendet |
| Mond voll | - | 0 | -12,74 | Fact Sheet [1] |
| Mond erstes Viertel | - | 78 bis 84 | ca. -10,0 bis -10,4 | nicht primaer belegt, siehe "Unsicher" |

### 5.2 Flaechenhelligkeit (mag pro Quadratbogensekunde, ber.: S = V + 2,5 log10(Flaeche in Quadratbogensekunden))

| Objekt | V | Flaeche | S mag/"^2 |
|---|---|---|---|
| Vollmond (1865") | -12,74 | 2,73e6 | 3,35 |
| Mond erstes Viertel, beleuchtete Haelfte | -10,0 bis -10,4 | 1,37e6 | 4,9 bis 5,3 (Mittel; am Terminator deutlich dunkler, nahe Rand heller) |
| Mars 25" | -2,9 | 491 | 3,8 |
| Mars 14" | -1,4 | 154 | 4,1 |
| Mars 6" (k = 0,9) | +1,0 | 25 | 4,5 |
| Jupiter 47" x 44" | -2,7 | 1624 | 5,3 |
| Jupiter 35" x 33" | -2,0 | 899 | 5,4 |
| Saturn Kugel 20" x 18" | +0,5 | 283 | 6,6 |
| Saturn Kugel + Ring (B = 15) | 0,0 | ca. 560 | ca. 6,8 (Ring und Kugel aehnlich hell; B-Ring heller als Kugel) |

Die Flaechenhelligkeit der Planeten ist nahezu entfernungsunabhaengig (nur Phase und Albedo), daher sind die Mars-Werte bei 6" nur durch die Phase etwas geringer. Die Werte dienen als Eingang fuer A-P4 (Bildhelligkeit ueber Austrittspupille) und als Plausibilitaetsrahmen; die Verteilung innerhalb der Scheibe (Randverdunklung, Albedostrukturen) kommt aus dem Bild.

Nachtrag 2026-10-27 (Issue #71): Die Werte dieser Tabelle sind mittlere Flaechenhelligkeiten der Scheibe, nicht Quellweiss. Bis #71 standen sie als `weiss_mag_arcsec2` in `objekte.json`; seit #71 ist Quellweiss auf den Pixelwert 1,0 geeicht (5.3).

### 5.3 Quellweiss: Eichung auf den Pixelwert 1,0 (Issue #71)

**Definition (GLOSSARY: Quellweiss):** `weiss_mag_arcsec2` ist die Flaechenhelligkeit, die der lineare Pixelwert 1,0 im Quellbild eines Zustands bedeutet. Ein Pixel mit Wert $q$ hat dann $\mu = \mu_\mathrm{weiss} - 2{,}5\log_{10} q$; die Trabanten (physik.md 13.1) und die Anzeige (physik.md 12) beziehen sich darauf.

**Rechenweg** (eigene Rechnung, Werkzeug `tools/quellweiss_eichen.py`, liest nur `daten/`):

1. Quellbild linear wie die Anwendung: 8-Bit-sRGB mit der Kennlinie nach IEC 61966-2-1, 255 = 1,0 (`srgbZuLinear` in `src/daten/kachellader.ts`). Helligkeit eines Pixels ist die Leuchtdichte $Y = 0{,}2126\,R + 0{,}7152\,G + 0{,}0722\,B$ (IEC 61966-2-1; Weiss hat $Y$ = 1, ein graues Pixel wie ein Trabant hat $Y$ gleich seinem Kanalwert). V-Magnituden sind visuell, deshalb $Y$ und nicht das Kanalmittel.
2. Massstab des Zustands wie die Anwendung: $s$ = `winkelgroesse_arcsec` des Zustands / `objekt_durchmesser_px` des Bildnachweises (`einzelbildMassstab`, `pyramidengeometrie`). Zustaende ohne eigenes Bild (Mars 6", Jupiter 35", Saturn 16") skalieren das Bild auf ihre Winkelgroesse. Beim Mond die feinste Stufe 0 der Kachelpyramide (3072 px), aus allen 36 Kacheln zusammengesetzt; die groeberen Stufen sind daraus gemittelt und aendern den Fluss nicht.
3. Gesamtfluss in Quellweiss-Quadratbogensekunden: $F = s^2 \sum Y$ ueber das ganze Bild. Ausserhalb von Scheibe (und Saturnring) ist das Bild schwarz (Maske aus `bild_aufbereiten.py` bzw. `mond_kacheln.py`); Saturn ist damit Kugel plus Ring, wie die Magnitude nach Mallama und Hilton (5.1).
4. $\mu_\mathrm{weiss} = m + 2{,}5\log_{10} F$ mit $m$ = `magnitude` des Zustands, auf 0,01 gerundet. Probe: $\mu_\mathrm{weiss} - 2{,}5\log_{10} F$ trifft $m$ auf 0,05 mag (Akzeptanzkriterium #71; mit den Werten unten auf 0,005 mag).

| Zustand | Bild | $s$ ["/px] | $F$ ["^2] | $m$ | bis #71 | Quellweiss neu | Differenz |
|---|---|---|---|---|---|---|---|
| mond_ev | mond_svs5587_6285 (Stufe 0) | 0,676215 | 442 399 | -10,2 | 3,35 | 3,91 | +0,56 |
| mars_6 | mars_hst_20160512 | 0,006667 | 6,93 | +1,0 | 4,5 | 3,10 | -1,40 |
| mars_14 | mars_hst_20160512 | 0,015556 | 37,73 | -1,4 | 4,1 | 2,54 | -1,56 |
| mars_25 | mars_hst_20030826 | 0,035714 | 74,33 | -3,0 | 3,8 | 1,68 | -2,12 |
| jup_35 | jupiter_hst_20190627 | 0,029167 | 346,1 | -2,0 | 5,4 | 4,35 | -1,05 |
| jup_47 | jupiter_hst_20190627 | 0,039167 | 624,1 | -2,7 | 5,3 | 4,29 | -1,01 |
| sat_16 | saturn_hst_20210912 | 0,026667 | 96,25 | +0,6 | 6,6 | 5,56 | -1,04 |
| sat_20 | saturn_hst_20210912 | 0,033333 | 150,4 | -0,1 | 6,6 | 5,34 | -1,26 |

Lesart: Das Scheibenmittel im Quellbild ist $10^{-0{,}4\,(S - \mu_\mathrm{weiss})}$ mit $S$ aus 5.2: Mars 25" etwa 0,14, Mars 14" 0,24, Jupiter 47" 0,39. Die Planetenbilder sind also deutlich dunkler als Weiss, Mars 2003 am staerksten. Bei Mars, Jupiter und Saturn wird Quellweiss um 1,0 bis 2,1 mag heller, die Planetenflaeche im Arbeitsraster entsprechend heller; beim Mond wird er 0,56 mag dunkler.

Anmerkungen:

- **Kanalmittel statt Leuchtdichte:** Das Issue hatte mit dem Mittel der drei Kanaele gerechnet (Jupiter 594, Saturn 148 "^2 bei den Massstaeben von jup_47 und sat_20). Mit $Y$ sind es 624 und 150; Quellweiss liegt dadurch bei Jupiter 0,05 mag, bei allen anderen Zustaenden hoechstens 0,03 mag dunkler.
- **Mars 6" (Vollscheibe statt gibbos):** Gerechnet ist nach dem Kriterium von #71: Der Fluss der vollen Bildscheibe bei 6" ergibt die Magnitude des gibbosen Mars (+1,0). Die Flaechenhelligkeit der Scheibe liegt damit um $2{,}5\log_{10}(1/0{,}9)$ = 0,11 mag unter der des beleuchteten Teils am Himmel. Mit dem Bezug "beleuchteter Teil" (wie bis #71 in 5.2 mit k = 0,9) waere Quellweiss 2,99 statt 3,10. Offen fuer Herbert (7, Punkt 16).
- **Mond, Nachtseite:** Die schwach aufgehellte Nachtseite des Renderings (bilder.json) traegt 0,6 Prozent zum Fluss bei (0,006 mag), vernachlaessigt. Der beleuchtete Teil (Pixel ueber 0,01) bedeckt 57 Prozent der Scheibe (Bild: Phase 0,593) mit einem Mittel von 0,28; seine mittlere Flaechenhelligkeit ist $3{,}91 + 2{,}5\log_{10}(1/0{,}28)$ = 5,3 mag/"^2, am hellen Ende der Spanne 4,9 bis 5,3 aus 5.2.
- **Mond, Magnitude des Zustands:** Krisciunas und Schaefer [68, Gl. 9] geben $m = -12{,}73 + 0{,}026\,\alpha + 4\cdot10^{-9}\,\alpha^4$; beim Phasenwinkel des Zustands $\alpha$ = 78,5 Grad sind das -10,54 mag, 0,34 mag heller als -10,2 (6.1, nicht primaer belegt, 7 Punkt 7). Mit -10,54 waere Quellweiss 3,58 statt 3,91. `objekte.json` behaelt -10,2 und 3,91, bis Herbert entscheidet (7, Punkt 7).
- **Vollmond und Anzeigeweiss:** Die bisherige Begruendung fuer 3,35 ("die Tagseite zeigt im Bild volle Vollmondhelligkeit") traegt nicht: mit 3,35 ergaebe das Bild -10,77 mag, heller als beide Phasenmagnituden. 3,35 bleibt die mittlere Flaechenhelligkeit des Vollmonds (5.2) und ist so in `ANZEIGE_WEISS_MAG_PRO_ARCSEC2` verwendet (physik.md 12.3), ist aber nicht mehr Quellweiss des Mondzustands.

## 6. Empfehlung fuer astobsim

### 6.1 Datentabellen je Objekt und Zustand

| Objekt | Zustand-ID | Name (UI) | Aequatorial " | Polar " | Phase k | Ringneigung Grad | V mag | Entfernung AE | Bemerkung |
|---|---|---|---|---|---|---|---|---|---|
| mond | mond_ev | Mond, 1 Tag nach erstem Viertel | 1865 | 1865 | 0,60 | - | -10,2 | 0,00257 (384 400 km) | Kolongitude 10 bis 12 Grad |
| mars | mars_6 | Mars klein (6") | 6,0 | 5,96 | 0,90 | - | +1,0 | 1,56 | gibbos, Nordkappe klein |
| mars | mars_14 | Mars Aphel-Opposition (14") | 14,0 | 13,9 | 1,00 | - | -1,4 | 0,669 | Nordfruehling, Nordkappe gross |
| mars | mars_25 | Mars Perihel-Opposition (25") | 25,0 | 24,9 | 1,00 | - | -3,0 | 0,375 | Suedsommer, Suedkappe klein |
| jupiter | jup_35 | Jupiter fern (35") | 35,0 | 32,7 | 0,99 | - | -2,0 | 5,63 | |
| jupiter | jup_47 | Jupiter Opposition (47") | 47,0 | 44,0 | 1,00 | - | -2,7 | 4,195 | mittlere Opposition |
| saturn | sat_16 | Saturn fern (16") | 16,0 | 14,4 | 1,00 | 15 | +0,7 | 10,39 | Ringe 36,3" x 9,4" |
| saturn | sat_20 | Saturn Opposition (20") | 20,0 | 18,0 | 1,00 | 15 | 0,0 | 8,31 | Ringe 45,4" x 11,7" |

Zusatzfelder, die Phase 3 fuer die Bildzuordnung braucht: Bildmassstab in km pro Pixel bzw. " pro Pixel (aus A-X4), Nordrichtung im Bild, bei Saturn der aeussere Ringrand in Pixeln (dient als Massstab 2,269 R_S), bei Jupiter die Lage des GRF (Laenge System III) nur informativ.

Feste Mondstellungen: siehe Tabellen in 3.3 (Jupiter: Io -110/+2,9; Europa +175/-4,7; Ganymed +330/+4,3; Kallisto -520/-11,7 bei 47"; Saturn: Titan +150/-35, Rhea -60/+17 bei 20"; kleine Zustaende linear skaliert). Nachtrag 2026-10-27: Saturn mit B = 19 Grad nach dem Quellbild, Titan +150/-44,4, Rhea -60/+20,7, Magnituden Saturn -0,1 (20") und +0,6 (16"), siehe 3.3 und 5.1.

### 6.2 Datenformat-Vorschlag (JSON, eine Datei `objekte.json`)

Felder je Objekt: `id`, `name`, `typ` ("mond" | "planet"), `quelle_physik` (Verweis auf diese Datei), `zustaende[]`.
Felder je Zustand: `id`, `name`, `winkelgroesse_arcsec` (aequatorial), `polar_arcsec`, `phase` (beleuchteter Anteil 0 bis 1), `phasenwinkel_grad`, `ringneigung_grad` (nur Saturn, sonst weglassen), `ring_aussen_arcsec` (nur Saturn), `magnitude`, `entfernung_au`, `bild` (Verweis auf Bildnachweis in der Bilddatendatei nach A-X4), `monde[]`.
Felder je Mond: `name`, `dx_arcsec`, `dy_arcsec`, `durchmesser_arcsec`, `magnitude`.
Nachtrag 2026-10-26 (Welle 2): Pflichtfeld `weiss_mag_arcsec2` je Zustand, die Flaechenhelligkeit in mag/"^2, die Weiss im Quellbild bedeutet (Werte aus 5.2: Mond 3,35 als Vollmond, weil die Tagseite im Bild volle Helligkeit hat; Mars 3,8 / 4,1 / 4,5; Jupiter 5,3 / 5,4; Saturn 6,6). Nachtrag 2026-10-27 (Issue #71): seit #71 auf den Pixelwert 1,0 des Quellbilds geeicht (5.3): Mond 3,91; Mars 3,10 / 2,54 / 1,68; Jupiter 4,35 / 4,29; Saturn 5,56 / 5,34.
Nachtrag 2026-10-26 (Issue #12): optionales Feld `hinweis_hilfe` je Zustand, ein Satz fuer den Hilfetext dieses Zustands (A-Z2), den ui anzeigt; `kommentar` bleibt reine Dokumentation der Datei. Erster Fall: `mars_6` ("real gibbos, etwa 90 Prozent beleuchtet, als Vollscheibe gezeigt", A-X1). `phase` und `phasenwinkel_grad` beschreiben auch bei `mars_6` den realen Zustand (0,90 und 37 Grad aus 1.2), nicht das Bild.
Nachtrag 2026-10-26 (Issue #12), geteilte Bilder: Zwei Zustaende eines Objekts duerfen ueber `bild` denselben Bildnachweis nutzen (`mars_6` und `mars_14` nutzen `mars_hst_20160512`). Der Nachweis nennt in `zustand` genau einen Zustand, den, fuer den das Bild ausgewaehlt wurde (`mars_14`); die Pruefung (`pruefeVerweise`) verlangt nur, dass dieser Zustand zum selben Objekt gehoert. Die Datei liegt einmal im Repo, der Massstab folgt je Zustand aus dessen Winkelgroesse und `objekt_durchmesser_px`.
Einheiten stehen im Feldnamen; Zahlen als Dezimalzahlen mit Punkt; keine berechenbaren Groessen doppelt speichern (Polar-Durchmesser wird trotzdem gespeichert, weil Bild und Modell ihn direkt brauchen).

Beispiel Jupiter 47" mit vier Monden:

```json
{
  "id": "jupiter",
  "name": "Jupiter",
  "typ": "planet",
  "zustaende": [
    {
      "id": "jup_47",
      "name": "Jupiter in Opposition (47\")",
      "winkelgroesse_arcsec": 47.0,
      "polar_arcsec": 44.0,
      "phase": 1.0,
      "phasenwinkel_grad": 0.5,
      "magnitude": -2.7,
      "entfernung_au": 4.195,
      "bild": "jupiter_opal_2024",
      "monde": [
        { "name": "Io",       "dx_arcsec": -110.0, "dy_arcsec":   2.9, "durchmesser_arcsec": 1.20, "magnitude": 5.0 },
        { "name": "Europa",   "dx_arcsec":  175.0, "dy_arcsec":  -4.7, "durchmesser_arcsec": 1.03, "magnitude": 5.3 },
        { "name": "Ganymed",  "dx_arcsec":  330.0, "dy_arcsec":   4.3, "durchmesser_arcsec": 1.73, "magnitude": 4.6 },
        { "name": "Kallisto", "dx_arcsec": -520.0, "dy_arcsec": -11.7, "durchmesser_arcsec": 1.58, "magnitude": 5.7 }
      ]
    }
  ]
}
```

Fuer Saturn kommen `ringneigung_grad: 15` (umgesetzt: 19, Nachtrag in 3.3) und `ring_aussen_arcsec: 45.4` hinzu; die Monde Titan (+150, -35, 0.85, 8.3) und Rhea (-60, +17, 0.25, 9.5) wie in 3.3. Fuer den Mond entfaellt `monde`, dafuer `kolongitude_grad: 11` als Dokumentation des Bildzustands.

## 7. Unsicher oder zu pruefen (fuer Herbert)

1. **Mars 6" ist gibbos** (k ca. 0,90, Phasenwinkel 36 bis 39 Grad). A-X1 sagt dazu nichts; entweder akzeptiert man eine gibbose Darstellung (realistisch), oder das 6"-Bild wird aus einer Vollscheibe mit kuenstlichem Terminator erzeugt (grenzt an A-X9 "gerenderte Bilder"). Entscheidung noetig, bevor die Bildrecherche das 6"-Bild sucht.
2. **Jupiter 35" / Saturn 16" sind keine Oppositionszustaende** (5,6 bzw. 10,4 AE). Sie sind als "so sieht man den Planeten die meiste Zeit" sinnvoll; alternativ waeren 44" (Aphel-Opposition) und 18" (Aphel-Opposition) die Gegenstuecke zu Mars 14". Vorschlag: Werte belassen, im Hilfetext benennen.
3. **Saturn-Ringneigung 15 Grad** als "mittlere Ringoeffnung" ist meine Wahl (Spanne 13 bis 16). Die Oppositionen 2026 (7,5 Grad) bis 2030 (25 Grad) decken alles ab; wenn ein freies Bild nur bei anderer Neigung existiert, muss der Wert dem Bild folgen (A-X3 hat Vorrang).
4. **Mond mittlerer Durchmesser**: Fact Sheet nennt 1896", Rechnung 1865". Die 1865" sind der uebliche Jahrbuchwert; bitte bestaetigen, dass astobsim 1865" verwendet.
5. **Kolongitude des Mondbilds**: Zielwert C = 10 bis 12 Grad ist aus der 55-bis-60-%-Vorgabe abgeleitet. Die Sonnenaufgangs-Kolongituden in 2.2 sind aus den Gazetteer-Laengen ohne Libration gerechnet; Libration verschiebt sie um bis zu +-8 Grad. Clavius ist bei C < 14 noch dunkel; wer Clavius im Bild will, braucht C >= 16 (k >= 0,64).
6. **Krater-Koordinaten** fuer Apenninen, Ptolemaeus, Arzachel, Archimedes, Plato, Eratosthenes, Clavius, Copernicus wurden nicht einzeln im Gazetteer abgerufen (Durchmesser schon). Mare Nectaris fehlt in der Tabelle.
7. **Mond-Magnitude am ersten Viertel** (-10,0 bis -10,4) stammt aus dem allgemeinen Wissen ueber die Mondphasenkurve (Viertelmond etwa ein Zehntel der Vollmondhelligkeit), nicht aus einer abgerufenen Primaerquelle. Fuer A-P4 ist der Wert nur ein Plausibilitaetsrahmen; Herbert bitte gegen Jahrbuch oder Allen pruefen. Nachtrag 2026-10-27 (Issue #71): Krisciunas und Schaefer [68, Gl. 9] ergeben beim Phasenwinkel des Zustands (78,5 Grad) -10,54 mag. Seit #71 haengt Quellweiss des Mondes an diesem Wert (5.3): mit -10,2 ist er 3,91, mit -10,54 waere er 3,58. Entscheidung offen; `objekte.json` behaelt -10,2.
8. **Albedowerte** von Mare/Hochland und Mars-Dunkelgebieten sind Groessenordnungen aus dem Gedaechtnis und nicht belegt. Da die Albedoverteilung aus dem Quellbild kommt, braucht astobsim sie nur zur Plausibilitaet der Bildhelligkeit.
9. **Jupiter-Bandkontrast** 0,82 (Band/Zone) beruht auf Orton 1975 (Breitband, Sekundaerzitat in einer Suchzusammenfassung); aktuelle I/F-Werte aus OPAL habe ich nicht gefunden. Visuell wirkt der Kontrast staerker als 10 %, weil das Auge Kanten sieht; fuer das Modell ist der Kontrast ohnehin eine Bildeigenschaft.
10. **GRF-Groesse** 14 000 x 10 000 km ist der Hubble-Wert 2024 (rote Ellipse); der Fleck schrumpft weiter (ca. 0,17 Grad Laenge pro Jahr), ein Bild von 2014 bis 2016 zeigt ihn 15 bis 20 % laenger. Simon et al. 2018 selbst konnte ich nicht lesen (nur Zitate).
11. **SEB-Grenzen** aus planetozentrisch 7 bis 17 S umgerechnet (8,0 bis 19,3 S planetographisch); die BAA-Tabelle der Jet-Breiten (Figure 1 des BAA-Guides) war im PDF nicht als Text lesbar.
12. **Polkappen-Groesse je Jahreszeit**: Die Nordkappen-Kante bei Ls 35 bis 65 (65 bis 72 N) ist eine Schaetzung aus den ALPO-Angaben (max. ca. 63 N, Sommerrest 79 bis 80 N); die Rueckzugstabellen (ALPO Tabelle 3-1, USGS SP-Recession) liegen nur als Bilder vor. Suedkappe bei Ls 250 (80 bis 82 S) nach UAI 2003 und ALPO (Novus Mons loest sich bei 250 bis 260). Ein Bildvergleich mit Herbert's eigener Beobachtungserfahrung ist hier wertvoller als weitere Recherche.
13. **Sichtbarkeit der Jupitermonde mit blossem Auge**: Nach Winkelabstand und Helligkeit waeren Ganymed und Kallisto theoretisch sichtbar; in der Praxis verhindert Jupiters Blendung das. Da astobsim Blendung nicht simuliert (A-P9), braucht das Punktquellenmodell (A-P6) beim blossen Auge eine Regel (z. B. Monde unterdruecken, wenn Abstand < 10' und Helligkeitsunterschied > 6 mag), sonst zeigt T6 Monde, die niemand sieht.
14. **Cassini-Sichtbarkeit** ist keine Aufloesungs-, sondern eine Linienkontrastfrage (0,76" < Rayleigh 1,38"). Das Modell aus A-P2/A-P3 (PSF-Faltung des Bildes) liefert das automatisch, wenn die Ringe im Quellbild scharf genug sind (A-X5: mindestens 0,25" pro Pixel bei 20").
15. **Mondmagnituden** Titan 8,4 / Rhea 9,6 (Morrison 1984 via Sternberg-Datenbank); Horizons zeigt Titan meist 8,3 bis 8,5. Differenz unerheblich.
16. **Quellweiss bei Mars 6" (Issue #71):** Das Bild zeigt eine Vollscheibe, der Zustand ist gibbos (k = 0,9). Geeicht ist auf den Gesamtfluss (Vollscheibe ergibt +1,0 mag, Quellweiss 3,10); auf die Flaechenhelligkeit des beleuchteten Teils geeicht waere er 2,99, die Scheibe also 0,11 mag heller (5.3). Bitte entscheiden.

## 8. Quellen

1. NASA NSSDCA, Moon Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (abgerufen 2026-10-23)
2. NASA NSSDCA, Mars Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
3. NASA NSSDCA, Jupiter Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html
4. NASA NSSDCA, Saturn Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html
5. NASA NSSDCA, Saturnian Rings Fact Sheet. https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html
6. PDS Ring-Moon Systems Node, Saturn's Ring System: Tables (Ringgrenzen in km, mit Referenzen). https://pds-rings.seti.org/saturn/saturn_tables.html
7. Naked Eye Planets, Mars Oppositions 2012 bis 2027 (Entfernung, Durchmesser, Magnitude). https://nakedeyeplanets.com/mars-oppositions.htm
8. Explore Scientific, Oppositions of Mars (2022: 17,0"/17,2"; 2033: 21,8"/22,1"; 2035: 24,5"/24,6"). https://explorescientific.com/pages/oppositions-of-mars
9. Mallama, A., Hilton, J. L. (2018): Computing Apparent Planetary Magnitudes for The Astronomical Almanac. Astronomy and Computing 25, 10-24. arXiv:1808.01973 (PDF gelesen; Gl. 6, 8, 10; Tabellen 3 bis 5)
10. FreeStarCharts, Jupiter-Oppositionen 2012 bis 2019 mit scheinbarem Durchmesser (2012 48,5"; 2014 46,8"; 2016 44,4"; 2017 44,3"; 2018 44,8"; 2019 46,0"; 2010 49,9"). https://freestarcharts.com/jupiter-reaches-opposition-on-april-7-2017 und Schwesterseiten
11. Obliquity SkyEye, Jupiter 2022 (Opposition 2022-09-26, 49,8"). https://obliquity.com/skyeye/archive/2022/jupiter.html
12. Obliquity SkyEye, Jupiter 2026 (Opposition 2026-01-10, 46,54", -2,68 mag; Minimalentfernung 4,2317 AE). https://obliquity.com/skyeye/archive/2026/jupiter.html
13. telescopeschool.com, Best Time to See Planets 2026 (Saturn-Opposition 2026-10-04, 19,7", +0,3 mag). https://telescopeschool.com/best-time-to-see-planets-2026/
14. Abrams Planetarium (MSU), Appearance of Saturn's Rings 2025-2039 (Daten aus PDS Saturn Ephemeris Generator 3.0). https://abramsplanetarium.natsci.msu.edu/_assets/files/Sky_Cal_PDFS/BobCorner/Appearance_of_Saturn_Rings_2025-2039.pdf
15. Meeus, J.: Astronomical Algorithms, 2. Aufl. 1998, Kap. 48 (Phase, beleuchteter Anteil) und Kap. 53 (selenographische Kolongitude). Nicht online abgerufen; Standardwerk.
16. IAU/USGS Gazetteer of Planetary Nomenclature, Vallis Alpes (155,42 km; 49,21 N, 3,63 E). https://planetarynames.wr.usgs.gov/Feature/6290
17. Gazetteer, Montes Apenninus. https://planetarynames.wr.usgs.gov/Feature/4004 (nur Treffer, Seite nicht abgerufen)
18. Gazetteer, Rima Hadley (116,09 km Polygon; 80 km Punkt; 25,72 N, 3,15 E). https://planetarynames.wr.usgs.gov/Feature/5064
19. Hadley Rille, Breite ca. 1,2 km, Laenge ca. 80 km: Britannica, "Hadley Rille" (https://www.britannica.com/place/Hadley-Rille) und the-moon.us Wiki (https://the-moon.us/wiki/Hadley_Rille, zitiert Greeley 1971). Sekundaer.
20. Gazetteer, Hadley C (5,80 km; 25,48 N, 2,80 E). https://planetarynames.wr.usgs.gov/Feature/Hadley%20C
21. Gazetteer, Aratus (10,23 km; 23,58 N, 4,51 E). https://planetarynames.wr.usgs.gov/Feature/344
22. Gazetteer, Triesnecker (24,97 km; 4,18 N, 3,60 E). https://planetarynames.wr.usgs.gov/Feature/Triesnecker
23. Gazetteer, Hyginus (8,70 km; 7,76 N, 6,27 E). https://planetarynames.wr.usgs.gov/Feature/2606
24. Gazetteer, Ptolemaeus (153,67 km). https://planetarynames.wr.usgs.gov/Feature/4860
25. Gazetteer, Alphonsus (110,54 km; 13,39 S, 2,85 W). https://planetarynames.wr.usgs.gov/Feature/Alphonsus
26. Gazetteer, Archimedes (81,04 km). https://planetarynames.wr.usgs.gov/Feature/350
27. Gazetteer, Beer (9,06 km; 27,07 N, 9,10 W). https://planetarynames.wr.usgs.gov/Feature/658
28. Gazetteer, Feuillee (8,94 km; 27,37 N, 9,46 W). https://planetarynames.wr.usgs.gov/Feature/Feuill%C3%A9e
29. Gazetteer, Kirch (11,71 km; 39,27 N, 5,62 W). https://planetarynames.wr.usgs.gov/Feature/Kirch
30. Gazetteer, Plato (100,68 km). https://planetarynames.wr.usgs.gov/Feature/4757
31. Gazetteer, Eratosthenes (58,77 km). https://planetarynames.wr.usgs.gov/Feature/1820
32. Gazetteer, Clavius (230,77 km). https://planetarynames.wr.usgs.gov/Feature/1236
33. Copernicus (Mond): Durchmesser ca. 93 km, 9,6 N, 20,1 W; Gazetteer-Seite nicht abgerufen (Namenssuche lieferte den Marskrater), Wert aus Standardatlas.
34. Gazetteer, Birt (15,81 km; 22,36 S, 8,59 W). https://planetarynames.wr.usgs.gov/Feature/Birt
35. Gazetteer, Bessel (15,56 km; 21,73 N, 17,92 E). https://planetarynames.wr.usgs.gov/Feature/Bessel
36. Gazetteer, Linne (2,23 km; 27,75 N, 11,80 E). https://planetarynames.wr.usgs.gov/Feature/Linn%C3%A9
37. Gazetteer, Mare Imbrium (1145,53 km / 1123 km). https://planetarynames.wr.usgs.gov/Feature/3678
38. Gazetteer, Mare Serenitatis (674,28 km / 707 km). https://planetarynames.wr.usgs.gov/Feature/3686
39. Gazetteer, Mare Tranquillitatis (875,75 km / 873 km). https://planetarynames.wr.usgs.gov/Feature/3691
40. Gazetteer, Mare Crisium (555,92 km / 418 km). https://planetarynames.wr.usgs.gov/Feature/Mare%20Crisium
41. Gazetteer, Mare Fecunditatis (840,35 km / 909 km). https://planetarynames.wr.usgs.gov/Feature/3673
42. Gazetteer, Oceanus Procellarum (2592,24 km / 2568 km). https://planetarynames.wr.usgs.gov/Feature/Oceanus%20Procellarum
43. Gazetteer, Mare Humorum (419,67 km). https://planetarynames.wr.usgs.gov/Feature/3677
44. JPL SSD, Planetary Satellite Physical Parameters (mittlere Radien nach Archinal et al. 2018; GM aus JUP365/SAT441). https://ssd.jpl.nasa.gov/sats/phys_par/
45. NASA NSSDCA, Jovian Satellite Fact Sheet (Halbachsen, Perioden, Neigungen, Albedo). https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html
46. Sternberg Astronomical Institute (SAI MSU), Natural Satellites Data Center, Physical parameters (V bei mittlerer Opposition: Io 5,02, Europa 5,29, Ganymed 4,61, Kallisto 5,65 nach Morrison et al. 1974, Icarus 23, 399; Titan 8,4, Rhea 9,6 nach Morrison et al. 1984, in "Saturn", Univ. Arizona Press, 609). https://www.sai.msu.ru/neb/nss/parcoe.htm
47. NASA NSSDCA, Saturnian Satellite Fact Sheet (Halbachsen, Perioden, Neigungen, Albedo). https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html
48. Fletcher, L. N. et al. (2017): Jupiter's North Equatorial Belt expansion and thermal wave activity ahead of Juno's arrival. Geophys. Res. Lett. 44, 7140-7148. arXiv:1708.05179 (NEB 6,8 bis 17,1 N planetographisch; Expansion bis 20 N)
49. Fletcher, L. N. et al. (2017): Jovian temperature and cloud variability during the 2009-2010 fade of the South Equatorial Belt. Icarus 286, 94-117. arXiv:1701.00957 (SEB 7 bis 17 S planetozentrisch; GRF 19,5 S planetozentrisch)
50. British Astronomical Association, Jupiter Section: Guide to Jupiter's atmosphere (2026, PDF). Definition der Baender ueber Jet-Breiten, planetographisch. https://britastro.org/wp-content/uploads/2026/06/Jupiter_Guide-for-website_2026_v4Figs.pdf
51. Simon, A. A., Wong, M. H., Marcus, P. S., Irwin, P. G. J. (2024): A detailed study of Jupiter's Great Red Spot over a 90-day oscillation cycle. Planetary Science Journal (ESA/Hubble heic2412). Tabelle 2 (Breite -22,5 bis -23,3 planetographisch), Tabelle 3 (Groessen). https://esahubble.org/static/science_papers/heic2412/heic2412.pdf
52. Wong, M. H. et al. (2021): Evolution of the Horizontal Winds in Jupiter's Great Red Spot from One Jovian Year of HST/WFC3 Maps. Geophys. Res. Lett. 48, e2021GL093982. Tabelle 1 (GRF-Achsen 2009 bis 2020). https://ntrs.nasa.gov/api/citations/20210021164/downloads/wong-GRSflakes_ACCEPTED.pdf
53. Simon, A. A., Tabataba-Vakili, F., Cosentino, R., Beebe, R. F., Wong, M. H., Orton, G. S. (2018): Historical and Contemporary Trends in the Size, Drift, and Color of Jupiter's Great Red Spot. Astron. J. 155, 151. (Volltext nicht zugaenglich; nur Sekundaerzitate)
54. Sanchez-Lavega, A. et al. (2018): The Rich Dynamics of Jupiter's Great Red Spot from JunoCam. Astron. J. 156, 162 (zitiert [53]: 21 Grad Laenge zur Voyager-Zeit, 14 Grad in den letzten Jahren). https://www.researchgate.net/publication/327737778
55. NASA/Hubble (2014): Hubble shows Jupiter's Great Red Spot is smaller than ever measured (10 250 Meilen = 16 500 km; 1800er: 41 000 km; Voyager 1979: 23 300 km). https://science.nasa.gov/missions/hubble/nasas-hubble-shows-jupiters-great-red-spot-is-smaller-than-ever-measured
56. Orton, G. S. (1975): Dissertation Caltech (effektive Reflektivitaeten STrZ 0,76, NEB/SEB 0,62 bis 0,63, GRF 0,64; 339 bis 840 nm). https://thesis.caltech.edu/4308/ (Sekundaerzitat aus Suchzusammenfassung)
57. Pellier, C. (2018): Jupiter photometry of belts and zones (ALPO-Japan). https://alpo-j.sakura.ne.jp/kk18/j181112r.htm
58. Sky and Telescope, Januar 2025, S. 52 (Syrtis Major ca. 1500 km N-S, ca. 1000 km O-W, Zentrum 290 W, 10 N); Wikipedia "Syrtis Major Planum" nennt dieselben Werte. Sekundaer.
59. Gazetteer, Syrtis Major Planum (1350 km / 1214,86 km; 8,4 N, 69,5 E planetozentrisch). https://planetarynames.wr.usgs.gov/Feature/Syrtis%20Major%20Planum
60. ALPO, J. Beish: Observing Mars, Kap. 4 Surface Features (Syrtis-Breite saisonal, max. bei Ls 145; seit 1990 schmaler). https://alpo-astronomy.org/jbeish/Observing_Mars_4.html
61. Wikipedia, Martian polar ice caps (Nordrestkappe ca. 1000 km, Suedrestkappe ca. 350 bis 400 km); Primaerbeleg fuer 400 km: NASA/JPL Photojournal PIA00301 (Viking-Mosaik der Suedrestkappe). https://photojournal.jpl.nasa.gov/catalog/PIA00301
62. Greve, R. et al. (Hokkaido Univ.): Nordrestkappe ca. 1000 km, Suedrestkappe 300 bis 500 km, ca. 200 km vom Pol versetzt. https://eprints.lib.hokudai.ac.jp/repo/huscap/all/34722/GREVE.pdf
63. ALPO, J. Beish: Observing Mars, Kap. 3 The Polar Regions (SPC bis unter 55 S; NPC max. ca. 53 Grad Ausdehnung; Sommerrest 79 bis 80 N; Novus Mons loest sich bei 217 bis 220 Ls und verschwindet 250 bis 260 Ls). https://www.alpo-astronomy.org/jbeish/Observing_Mars_3.html
64. Giuranna, M. et al. (2008): PFS/MEX observations of the condensing CO2 south polar cap of Mars. Icarus 197, 386-402 (maximale Ausdehnung bis 40 S bei Ls 80 bis 90). https://oro.open.ac.uk/16197
65. Tanga, P., Bardelli, S. (UAI, 2008): La regressione della calotta polare sud di Marte 2003 (Rueckzugskurve aus Amateur-CCD, Uebereinstimmung mit Mars Express innerhalb 1 bis 2 Grad). https://pianeti.uai.it/images/Calotta_Marte_2003_3-2008.pdf
66. = [9] (Mallama und Hilton 2018), hier fuer Jupiter-Magnitude -2,70 bei mittlerer Opposition.
67. Universe Today / EarthSky zur Ringkantenstellung 2025-03-23 und zum 29,5-Jahre-Zyklus (nur Einstieg; Zahlen aus [14]).
68. Krisciunas, K., Schaefer, B. E. (1991): A Model of the Brightness of Moonlight. PASP 103, 1033-1039, doi:10.1086/132921; Gl. 9 (V-Magnitude des Mondes ueber den Phasenwinkel). Formel geprueft an der Umsetzung in specsim (`krisciunas_schaefer`, Kommentar "eqn. 9"), https://github.com/desihub/specsim/blob/main/specsim/atmosphere.py (abgerufen 2026-10-27); das Original habe ich nicht gelesen.
