# Recherche: Deep-Sky-Objekte (Flaechenhelligkeit, Profile, Sterne)

**Datum:** 2026-10-29. **Phase:** 2 (Recherche) fuer Version 2. **Kennungen:** A-Z10, A-X9, A-X11, A-P10, A-P11, A-P12, A-B2, A-Q5; Fragen 7 und 9 aus `docs/anforderungen.md` Abschnitt 10 (Objektdaten; die Quellbilder stehen in `bilder-v2.md`, die Wahrnehmungsschwelle in `wahrnehmung.md`).

Alle Flaechenhelligkeiten sind Himmelswerte im Johnson-V-Band in mag/arcsec$^2$, ohne Extinktion und ohne Fernrohr. Die Umrechnung ans Okular folgt `physik.md` 5.1 und 6.2. Koordinaten: $dx$ positiv nach Osten, $dy$ positiv nach Norden, in Bogensekunden relativ zur Objektmitte (wie die Trabanten, `objekte.md` 3.3):

$$dx = (\alpha - \alpha_0)\cos\delta_0 \cdot 3600, \qquad dy = (\delta - \delta_0)\cdot 3600 \quad (\alpha, \delta \text{ in Grad})$$

Gerechnet habe ich mit Python-Skripten im Scratchpad (nicht im Repo). Die Kataloge kamen ueber den VizieR-Spiegel `vizier.idia.ac.za`; die Abfragen stehen in Abschnitt 6.

---

## 1. M31 (Andromedagalaxie, NGC 224)

### 1.1 Grunddaten (RC3)

Aus dem RC3-Eintrag (VizieR VII/155, PGC 2557) [8]:

| Groesse | RC3-Feld | Wert | Umgerechnet |
|---|---|---|---|
| Durchmesser der Isophote $\mu_B$ = 25 | $\log D_{25}$ = 3,28 (0,1') | | $D_{25}$ = 190,5' (ber.) |
| Achsenverhaeltnis | $\log R_{25}$ = 0,49 | | $b/a$ = 0,32, kleine Achse 61,7' (ber.) |
| Positionswinkel grosse Achse | PA | 35 Grad | |
| Gesamthelligkeit B | $B_T$ | 4,36 mag | |
| Farbe | $(B-V)_T$ | 0,92 | $V_T$ = 3,44 mag (ber.) |
| effektiver Durchmesser (halbes Licht) | $\log A_e$ = 2,62 | | $A_e$ = 41,7' (ber.) |
| mittlere Flaechenhelligkeit in $D_{25}$ | $m'_{25}$ = 14,37 mag/arcmin$^2$ | | 23,26 B, also 22,3 V (ber., +8,89 und $-(B-V)_T$) |
| mittlere Flaechenhelligkeit in $A_e$ | $m'_e$ = 12,93 mag/arcmin$^2$ | | 21,82 B, also 20,9 V (ber.) |

Die Umrechnung von mag/arcmin$^2$ nach mag/arcsec$^2$ ist $+2{,}5\log_{10} 3600 = +8{,}89$. Mit dem mittleren $B-V$ fuer die Flaechenwerte nehme ich an, dass die Farbe ueber die Scheibe gleich bleibt; in Wirklichkeit ist der Kern roeter (Bulge) und die Aussenscheibe blauer.

### 1.2 Radialprofil

Ein V-Profil in Tabellenform aus einer Primaerquelle habe ich nicht im Original lesen koennen. Walterbos & Kennicutt 1987 [11] haben Profile in UBVR auf Fotoplatten gemessen, die Tabellen sind nicht in VizieR (geprueft: `J/A+AS/69/311` gibt es nicht). Ich setze das Profil daher aus zerlegten Modellen zusammen:

- **Bulge (Courteau et al. 2011 [9], Tabelle 2, Modell N, I-Band):** Sersic-Index $n$ = 2,0, $R_e$ = 1,0 kpc, $\mu_{e,I}$ = 18,2 mag/arcsec$^2$. Das Paper gibt einen Lichtanteil von 23 % fuer den Bulge [9, Abschn. VII.4]. Mit $V-I$ = 1,2 fuer die alte Bulge-Population (Annahme, nicht belegt) ist $\mu_{e,V}$ = 19,4.
- **Scheibe:** exponentiell, R-Band-Skalenlaenge 5,6 kpc und Zentralwert $\mu_{0,R}$ = 19,0, ohne Korrektur fuer Staub und Neigung, aus dem R-Profil von [11] angepasst (Chemin et al. 2009 [10]; nur im Suchergebnis gelesen, nicht im Volltext). Courteau gibt im I-Band 5,8 kpc und $\mu_{0,I}$ = 19,0 [9, Tabelle 2]; Skalenlaenge im B-Band 6,4 kpc (nach [10]).
- **Massstab:** 1'' = 0,0038 kpc bei 785 kpc [9, Abschn. I]. Damit $R_e$ = 263'' = 4,4', $R_d$ = 1474'' = 24,6' (ber.).

$$\mu(r) = -2{,}5\log_{10}\!\left[10^{-0{,}4\,\mu_e}\, e^{-b_n\left((r/R_e)^{1/n}-1\right)} + 10^{-0{,}4\,\mu_0}\, e^{-r/R_d}\right], \qquad b_n \approx 1{,}9992\,n - 0{,}3271$$

$r$ ist der Abstand auf der grossen Achse. Fuer die Flaeche gelten die Achsenverhaeltnisse 0,27 (Scheibe, Elliptizitaet 0,73 [9]) und 0,8 (Bulge, Annahme).

**Abgleich (ber.):** Mit $\mu_{0,V}$ = 19,6 ($V-R$ = 0,6 angenommen) ergibt das Modell $V_T$ = 2,90, 0,5 mag heller als RC3; die Isophote 24,1 V (entspricht $\mu_B$ = 25 bei $B-V$ = 0,9) laege bei 204'. Mit $\mu_{0,V}$ = 20,2 ergeben sich $V_T$ = 3,34 und 176' fuer die Isophote 24,1, beides nahe an RC3 (3,44 und 190,5'). Ich empfehle **$\mu_{0,V}$ = 20,2** als an RC3 angepasste Groesse. Die reine Exponentialscheibe ist innen zu hell, weil die echte Scheibe innerhalb des Rings bei etwa 10 kpc (44') ausduennt und Staub sie abschwaecht.

| $r$ (grosse Achse) | 0' | 1' | 2' | 5' | 10' | 20' | 30' | 45' | 60' | 80' | 95' |
|---|---|---|---|---|---|---|---|---|---|---|---|
| $\mu_V$ (ber., $\mu_{0,V}$ = 20,2) | 15,4 | 17,3 | 18,0 | 19,2 | 20,2 | 21,0 | 21,5 | 22,2 | 22,9 | 23,7 | 24,4 |

Ausdehnung (grosse mal kleine Achse) der Isophote, ber. mit dem Modell:

| Isophote $\mu_V$ | 17,5 | 18,3 | 19,0 | 20,0 | 21,0 | 21,4 | 22,0 | 23,0 | 24,1 |
|---|---|---|---|---|---|---|---|---|---|
| grosse Achse | 3' | 5' | 9' | 17' | 40' | 55' | 82' | 127' | 176' |
| kleine Achse (Scheibe 0,27) | 1' | 2' | 3' | 5' | 11' | 15' | 22' | 34' | 48' |

**Kern:** Der Sersic-Bulge ergibt in der Mitte 15,4. Der Kern (Doppelkern P1/P2, Bogensekunden gross) ist heller, um 13 bis 14 V (nicht belegt, nur Groessenordnung). Fuer astobsim spielt er bei den Vergroesserungen, in denen M31 Sinn ergibt, keine Rolle: ein Kern unter etwa 5'' ist am Fernrohr ein Punkt im Bulge.

Der Wert, der fuer A-P11 zaehlt, ist die Flaechenhelligkeit, bei der das Profil unter die Schwelle faellt. Diese Schwelle haengt vom Himmel ab und kommt aus `wahrnehmung.md`. Die Tabelle oben liefert dann die sichtbare Ausdehnung.

### 1.3 Begleiter

M32 ($V$ etwa 8,1) und M110 ($V$ etwa 8,1) liegen im Gesichtsfeld des Fernglases. A-Z10 nennt sie nicht. Sie sind keine Feldsterne, gehoeren aber auch nicht zum Objekt M31. Vorschlag: so zeigen, wie sie im Quellbild stehen, und keine eigenen Daten anlegen (offen fuer Herbert, Abschnitt 9).

---

## 2. M42 (Orionnebel, NGC 1976) und Trapez

### 2.1 Grunddaten

| Groesse | Wert | Quelle |
|---|---|---|
| Gesamthelligkeit | V = 4,0 | SEDS, ueber Wikipedia [19a] (Sekundaerquelle) |
| Ausdehnung | 65' x 60' | Steinicke RNGC, ueber Wikipedia [19a] |
| Huygens-Region (heller Kern um das Trapez) | etwa 5' (0,7 pc bei 440 pc) | O'Dell & Harris 2010 [13] |
| Entfernung | 389 pc | Kounkel et al. 2017, ueber [19a] |
| Hoechste Flaechenhelligkeit (Kern) | etwa 17 mag/arcsec$^2$ | Clark 2004 [14] (Digitalkamera, Gruenkanal, auf Wega geeicht, also V-nah) |
| Aeussere Schleife | etwa 21,3 mag/arcsec$^2$ (blau, aehnlich gruen) | Clark 2004 [14] |
| mittlere Flaechenhelligkeit in 65' x 60' | 4,0 + 2,5 log10(pi/4 · 3900 · 3600) = 21,8 (ber.) | |

Ein V-Radialprofil aus einer Primaerquelle habe ich nicht gefunden. Die Messungen von O'Dell beziehen sich auf Emissionslinien (H-alpha, H-beta, [O III], [N II]) in erg cm$^{-2}$ s$^{-1}$ sr$^{-1}$, nicht auf V. Der Nebel ist nicht kreissymmetrisch (Huygens-Region, Dunkelbucht "Fischmaul", Flügel). Ein Radialprofil hilft deshalb wenig. Vorschlag: das Quellbild traegt die Verteilung, geeicht auf zwei Anker: den Kern bei etwa 17 und die Gesamthelligkeit 4,0 (Abschnitt 7.2).

**Visuell gegen V:** Das Licht von M42 und M57 kommt fast ganz aus Emissionslinien. Das dunkeladaptierte Auge (skotopisch, Maximum bei 507 nm) sieht [O III] 496/501 nm und H-beta 486 nm staerker als das V-Band, H-alpha 656 nm sieht es kaum. Rote Bildbereiche wirken im Okular deshalb schwaecher, als die V-Werte vermuten lassen. Fuer astobsim (grau, A-P12) folgt daraus: die Helligkeit aus dem Gruenkanal oder aus [O III] nehmen, nicht aus der Leuchtdichte Y mit hohem Rotanteil. Gehoert zu `bilder-v2.md`, siehe Abschnitt 9.

### 2.2 Trapez (Theta1 Orionis A bis F) und Theta2 Orionis A

Positionen aus Gaia DR3 (I/355, Epoche 2016,0, Kegel 22'' um Theta1 Ori C) [2]. Mitte des Objekts ist Theta1 Ori C (RA 83,818620, Dec -5,389696 Grad). Helligkeiten: C, D und Theta2 A aus Hipparcos [4]; A, B, E und F aus Gaia $G$ und $G_{BP}-G_{RP}$ mit der Beziehung aus 6.3 (ber.), weil der Hipparcos-Wert fuer A offensichtlich das Licht von C mitzaehlt (V = 4,98 ohne B-V, HIP 26220). Zum Vergleich die Werte aus WDS (STF 748) [16]:

| Stern | $dx$ ['']  | $dy$ [''] | V (empfohlen) | V WDS | B-V | Bemerkung |
|---|---|---|---|---|---|---|
| Theta1 Ori C | 0,0 | 0,0 | 5,13 (HIP) | 5,06 | 0,02 (HIP) | O6, hellster Stern |
| Theta1 Ori A | -9,6 | 8,6 | 6,66 (Gaia, ber.) | 6,55 | 0,10 (ber.) | Bedeckungsveraenderlicher (V1016 Ori) |
| Theta1 Ori B | -5,0 | 16,1 | 7,91 (Gaia, ber.) | 7,49 | 0,38 (ber.) | Bedeckungsveraenderlicher (BM Ori), Mehrfachsystem |
| Theta1 Ori D | 11,8 | 6,3 | 6,71 (HIP) | 6,38 | 0,08 (HIP) | |
| Theta1 Ori E | -10,4 | 13,0 | 11,1 (WDS) | 11,10 | 1,0 (ber., unsicher) | Gaia ergibt 10,06; stark gerötet, veraenderlich |
| Theta1 Ori F | 3,9 | -2,3 | 10,0 (Gaia, ber.) | 11,50 | 0,29 (ber.) | 4,5'' von C |
| Theta2 Ori A | 96,0 | -94,9 | 4,98 (HIP) | | -0,10 (HIP) | 2,3' suedoestlich |

Probe gegen WDS (ber.): Abstand und Positionswinkel von A nach C 12,9'' / 132 Grad (WDS 12,8'' / 132 Grad); C nach F 4,5'' / 120 Grad (WDS 4,6'' / 121 Grad); A nach E 4,5'' / 350 Grad (WDS 4,5'' / 350 Grad). Die Positionen stimmen also.

B-V der Trapezsterne ist durch die Roetung im Nebel ($E(B-V)$ um 0,3 bis 0,5, nicht belegt) positiv, obwohl die Sterne O- und B-Sterne sind. Fuer A-P12 ist das richtig so: es zaehlt die beobachtete Farbe.

Weitere Sterne der Gruppe: Theta2 Ori B (V etwa 6,4, nicht abgefragt) und die schwachen Komponenten G, H (V 14 bis 16, WDS [16]). Vorschlag: nur A bis F und Theta2 A, Theta2 B ergaenzen, wenn das Quellbild die Gegend zeigt.

---

## 3. M13 (Herkuleshaufen, NGC 6205)

### 3.1 Struktur (Harris 1996, Ausgabe 2010)

| Groesse | Ausgabe 2010 [1] | Ausgabe 1996 (VizieR VII/202) [1] |
|---|---|---|
| Mitte (J2000) | 16 41 41,24 +36 27 35,5 | 16 41 41,5 +36 27 37 |
| $V_t$ (Gesamt) | 5,78 | 5,78 |
| $(B-V)_t$ | 0,68 | 0,68 |
| $E(B-V)$ | 0,02 | 0,02 |
| Konzentration $c = \log_{10}(r_t/r_c)$ | 1,53 | 1,49 |
| Kernradius $r_c$ | 0,62' | 0,88' |
| Halblichtradius $r_h$ | 1,69' | 1,49' |
| zentrale Flaechenhelligkeit $\mu_V(0)$ | 16,59 mag/arcsec$^2$ | 16,80 |
| Elliptizitaet | 0,11 | |
| Gezeitenradius $r_t = r_c \cdot 10^c$ | 21,0' (ber.) | 27,2' (ber.) |

Ich empfehle die Ausgabe 2010.

### 3.2 King-Profil

King 1962 [24]:

$$I(r) = I_0 \frac{\left[(1+(r/r_c)^2)^{-1/2} - (1+(r_t/r_c)^2)^{-1/2}\right]^2}{\left[1 - (1+(r_t/r_c)^2)^{-1/2}\right]^2}, \qquad \mu(r) = \mu_V(0) - 2{,}5\log_{10}\frac{I(r)}{I_0}$$

Mit den Werten von 2010: $r_c$ = 37,2'', $r_t$ = 1260''. **Probe (ber.):** Das Integral ueber die Flaeche ergibt $V$ = 5,88, 0,10 mag schwaecher als $V_t$ = 5,78. Der Halblichtradius im Modell ist 1,89' (Harris 1,69'). Die Parameter passen also zueinander. Harris' $r_c$ ist der Kernradius des King-Modells; dass das Modell nicht genau King 1962 ist, erklaert die 0,1 mag.

| $r$ | 0 | 0,25' | 0,5' | 1' | 1,5' | 2' | 3' | 4' | 5' | 6' | 8' | 10' | 12' | 15' |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| $\mu_V$ (ber.) | 16,59 | 16,76 | 17,15 | 18,04 | 18,79 | 19,40 | 20,34 | 21,06 | 21,67 | 22,20 | 23,13 | 23,97 | 24,80 | 26,17 |

Der Kern ist mit 16,6 deutlich heller als jeder Himmel bis Bortle 9 (17,0, `physik.md` 6.1). Der Rand mit 22 bei 6' liegt bei Bortle 3 nahe am Himmel. Der sichtbare Durchmesser haengt deshalb stark vom Himmel ab: am Fernrohr typisch 8' bis 15'.

### 3.3 Hellste Sterne und Leuchtkraftfunktion (Gaia DR3)

Abfrage: Gaia DR3, Kegel 15' um die Mitte, $G$ < 17 (6.2), 3085 Quellen. Mitglieder: Eigenbewegung innerhalb 1,2 mas/a um $(\mu_{\alpha*}, \mu_\delta)$ = (-3,15; -2,57) mas/a und Parallaxe unter 1,0 mas. Das ergibt 2105 Sterne. Den Wert der Eigenbewegung habe ich aus Vasiliev & Baumgardt 2021 [22] im Kopf und nicht nachgelesen; im Abfrageergebnis haeufen sich die Sterne genau dort. V aus $G$ und $G_{BP}-G_{RP}$ (6.3, ber.).

- **Hellste Rote Riesen:** V = 11,92; 11,97; 11,98; 12,01; 12,06 ... (Farbe $G_{BP}-G_{RP}$ 1,6 bis 1,8, B-V etwa 1,2 bis 1,4, ber. aus 6.3 und damit unsicher). Die vier hellsten liegen 0,7' bis 1,4' von der Mitte, die naechsten bis 4,5'.
- **Anzahl der Mitglieder je Intervall** (ber., Gaia im Kern unvollstaendig, siehe unten):

| V | 11,5-12 | 12-12,5 | 12,5-13 | 13-13,5 | 13,5-14 | 14-14,5 | 14,5-15 | 15-15,5 | 15,5-16 | 16-16,5 | 16,5-17 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| alle | 3 | 19 | 40 | 53 | 73 | 113 | 230 | 320 | 328 | 345 | 427 |
| $r$ < 1' | 1 | 4 | 17 | 20 | 22 | 36 | 62 | 62 | 69 | 52 | 33 |
| 1' bis 2' | 2 | 5 | 11 | 12 | 24 | 31 | 63 | 87 | 89 | 100 | 119 |
| 2' bis 4' | 0 | 8 | 10 | 17 | 16 | 32 | 50 | 92 | 100 | 116 | 169 |
| 4' bis 8' | 0 | 2 | 2 | 3 | 9 | 11 | 40 | 59 | 56 | 57 | 84 |
| ueber 8' | 0 | 0 | 0 | 1 | 2 | 3 | 15 | 20 | 14 | 20 | 22 |

Summe bis V: 22 (12,5), 62 (13,0), 115 (13,5), 188 (14,0), 301 (14,5), 531 (15,0), 1179 (16,0).

Anteil der Sterne am Gesamtlicht ($V_t$ = 5,78), ber.: Sterne bis V 13 tragen 12,6 %, bis 14 22,8 %, bis 15 33,5 %, bis 16 42,1 %, bis 17 46,0 %. Die Kurve flacht oberhalb von 15 ab. Ein Teil davon ist echt (das meiste Licht kommt von den Riesen), ein Teil ist die Unvollstaendigkeit von Gaia im Kern: unter 1' faellt die Zahl ab V 16 wieder, obwohl die Leuchtkraftfunktion steigt. Der RGB-Bump liegt bei V = 14,75 (Paltrinieri et al., nach Suchergebnis), der Horizontalast bei $V_{HB}$ = 14,90 [1]. Deshalb springt die Zahl zwischen 14,5 und 15 auf das Doppelte.

### 3.4 Vorschlag "Katalogsterne plus Restlicht" (falls kein Quellbild nach A-Z10)

1. **Sterne:** alle Gaia-Mitglieder bis V = 15,0 (531 Sterne) als Punktquellen mit $dx$, $dy$, V und B-V (ber.). Die Grenze liegt etwa 1 mag unter der Grenzgroesse eines 300-mm-Fernrohrs bei dunklem Himmel (Bortle: 12,5 Zoll erreichen 15,5 bis 17,5 [15]). Was darunter liegt, verschwindet ohnehin unter der Wahrnehmungsschwelle oder wird Restlicht. Im Kern ($r$ < 1') fehlen Gaia-Sterne; das Restlicht gleicht das aus.
2. **Restlicht:** ein glattes King-Profil (3.2) mit demselben $r_c$ und $r_t$, aber mit dem Rest des Flusses: $I_\mathrm{rest}(r) = I_\mathrm{King}(r) - \sum_\mathrm{Sterne}$ (geglaettet). Einfacher: King-Profil mit $\mu_V(0)$ = 16,59 + 2,5 log10(1/(1-0,335)) = 17,03 (ber., 33,5 % Licht in den Katalogsternen). Das ist nur dann richtig, wenn die Sterne radial wie das Licht verteilt sind. Sie sind es nicht (im Kern fehlen sie). Besser ist es, das Restlicht in Ringen zu eichen: je Ring Sollfluss aus King minus Fluss der Katalogsterne, mindestens null. Das kann `tools/` einmal rechnen und als Tabelle oder Bild ablegen.
3. **Farbe:** Restlicht grau (A-P12, Deep-Sky-Flaeche), Sterne mit B-V.

---

## 4. M45 (Plejaden)

### 4.1 Grunddaten

Gesamthelligkeit V = 1,6, Ausdehnung etwa 2 Grad, Entfernung 136 pc (Wikipedia [17], Sekundaerquelle). Den Reflexionsnebel zeigt astobsim nicht (A-Z10). M45 braucht deshalb nur Sterne und kein Quellbild.

### 4.2 Sternliste

Abfrage: Hipparcos (I/239, V und B-V) und Hipparcos-Neureduktion (I/311, Parallaxe) im Kegel 1,3 Grad um RA 56,75, Dec +24,1167 Grad (03 47 00, +24 07 00) bis V = 8,5; dazu Gaia DR3 bis $G$ = 9,0 (6.2).

Mitglieder (ber.): Eigenbewegung in Gaia innerhalb $(20 \pm 4{,}5;\ -45{,}5 \pm 5{,}5)$ mas/a und Parallaxe 6,4 bis 8,5 mas, **oder** Hipparcos-2-Parallaxe 7,3 bis 9,9 mas. Das Oder ist noetig, weil Gaia fuer Sterne heller als etwa 5 mag gestoerte Astrometrie hat (Merope: Eigenbewegung 13 statt 20, Taygeta: Parallaxe 9,5; Alkyone: keine Astrometrie). Damit fallen drei helle Feldsterne heraus: HD 23712 (V 6,44, K5, Parallaxe 4,4 mas, Hintergrund), HD 23822 (V 6,47, F0, 13,4 mas, Vordergrund), HD 23609 (V 6,98, F8, 16,1 mas, Vordergrund). Sie sind Feldsterne und damit Nicht-Ziel (A-X9).

V und B-V: aus Hipparcos, wo es den Stern gibt; sonst aus Gaia (6.3, ber.). Offset zur Mitte 03 47 00, +24 07 00.

| Nr. | Stern | $dx$ [''] | $dy$ [''] | V | B-V | Katalog |
|---|---|---|---|---|---|---|
| 1 | Alkyone (eta Tau, HIP 17702) | 398 | -42 | 2,85 | -0,09 | HIP |
| 2 | Atlas (27 Tau, HIP 17847) | 1777 | -229 | 3,62 | -0,07 | HIP |
| 3 | Elektra (17 Tau, HIP 17499) | -1745 | -13 | 3,72 | -0,10 | HIP |
| 4 | Maia (20 Tau, HIP 17573) | -963 | 903 | 3,87 | -0,06 | HIP |
| 5 | Merope (23 Tau, HIP 17608) | -553 | -607 | 4,14 | -0,05 | HIP |
| 6 | Taygeta (19 Tau, HIP 17531) | -1471 | 1261 | 4,30 | -0,11 | HIP |
| 7 | Pleione (28 Tau, HIP 17851) | 1797 | 71 | 5,05 | -0,08 | HIP, veraenderlich |
| 8 | HD 23753 (HIP 17776) | 1107 | -2504 | 5,44 | -0,07 | HIP |
| 9 | Kelaeno (16 Tau, HIP 17489) | -1804 | 621 | 5,45 | -0,03 | HIP |
| 10 | 18 Tau (HIP 17527) | -1509 | 2600 | 5,66 | -0,06 | HIP |
| 11 | Asterope (21 Tau, HIP 17579) | -897 | 1575 | 5,76 | -0,04 | HIP |
| 12 | HD 23923 (HIP 17900) | 2239 | -1458 | 6,17 | -0,05 | HIP |
| 13 | 24 Tau (Gaia DR3 66715105696289024) | 288 | -2 | 6,33 (ber.) | -0,01 (ber.) | Gaia |
| 14 | 22 Tau (HIP 17588) | -781 | 1480 | 6,43 | -0,02 | HIP |
| 15 | HD 23873 (HIP 17862) | 1941 | 951 | 6,62 | -0,03 | HIP |
| 16 | HIP 17923 | 2438 | -966 | 6,73 | 0,06 | HIP |
| 17 | HIP 17664 | -8 | 1452 | 6,83 | 0,02 | HIP |
| 18 | HIP 17704 | 404 | 617 | 6,83 | 0,07 | HIP |
| 19 | HIP 17572 | -974 | -3491 | 6,85 | 0,06 | HIP |
| 20 | HIP 17999 | 3182 | -560 | 6,95 | 0,08 | HIP |
| 21 | HIP 17791 | 1234 | 823 | 6,96 | 0,13 | HIP |
| 22 | HIP 17692 | 287 | -1129 | 6,99 | 0,03 | HIP |
| 23 | Gaia DR3 65207709611941376 | 335 | -728 | 7,31 (ber.) | 0,01 (ber.) | Gaia |
| 24 | Gaia DR3 65231486552803328 | -448 | 497 | 7,38 (ber.) | 0,08 (ber.) | Gaia |
| 25 | HIP 17403 | -2694 | 3470 | 7,52 | 0,14 | HIP |
| 26 | Gaia DR3 66746441777612416 | 1873 | 1005 | 7,55 (ber.) | 0,08 (ber.) | Gaia |
| 27 | Gaia DR3 66558249192653952 | 2418 | 836 | 7,57 (ber.) | 0,05 (ber.) | Gaia |
| 28 | Gaia DR3 65007083101413888 | 368 | -1579 | 7,78 (ber.) | 0,14 (ber.) | Gaia |
| 29 | Gaia DR3 65221487868870784 | -936 | -281 | 7,87 (ber.) | 0,18 (ber.) | Gaia |
| 30 | HIP 17401 | -2717 | -1684 | 7,93 | 0,35 | HIP |
| 31 | Gaia DR3 66555985749157760 | 1999 | 471 | 7,99 (ber.) | 0,16 (ber.) | Gaia |

Bis V = 8,5 sind es 44 Mitglieder im Kegel 1,3 Grad; die Sterne 32 bis 44 (V 8,06 bis 8,39) erzeugt `tools/` mit derselben Abfrage. Der groesste Abstand von der Mitte ist 4568'' (HIP 17729, V 8,32), innerhalb der Pruefgrenze 7200'' fuer $dx$, $dy$ in `src/daten/objekte.ts`.

**Hipparcos ist ab V etwa 7,3 unvollstaendig:** Von den Mitgliedern mit V 7,3 bis 8,0 stehen nur zwei in Hipparcos, sieben kommen allein aus Gaia. Fuer V bis 8,5 ist deshalb Gaia noetig.

**Sternzahl bis zur Grenzgroesse** (ber., Kegel 1 Grad / 1,3 Grad):

| V hoechstens | 4,5 | 5,0 | 5,5 | 6,0 | 6,5 | 7,0 | 7,5 | 8,0 | 8,5 |
|---|---|---|---|---|---|---|---|---|---|
| Anzahl | 6 / 6 | 6 / 6 | 9 / 9 | 11 / 11 | 14 / 14 | 21 / 22 | 23 / 24 | 29 / 31 | 40 / 44 |

Zwischen Taygeta (4,30) und Pleione (5,05) liegt eine Luecke von 0,75 mag. Bis Grenzgroesse 5,0 bleibt es bei sechs Sternen. Das ist die "sechs oder sieben" der Literatur [17]. Pleione steht 5' neben Atlas (ber.) und ist 1,4 mag schwaecher; mit blossem Auge verschmilzt sie mit Atlas. 24 Tau steht 1,8' neben Alkyone und ist 3,5 mag schwaecher; ohne Fernrohr ist sie nicht zu trennen. Diese Paare sind ein Fall fuer die Aufloesung des Auges (A-P10, `physik.md` 3.1), nicht fuer den Katalog.

**Epoche:** Gaia-Positionen gelten fuer 2016,0, Hipparcos (ICRS) fuer 1991,25. Mit der Eigenbewegung der Plejaden von etwa 50 mas/a ist der Unterschied zu J2000 hoechstens 1'' und bei Offsets von Bogenminuten belanglos.

---

## 5. M57 (Ringnebel, NGC 6720)

| Groesse | Wert | Quelle |
|---|---|---|
| Hauptring, Achsen | 88'' x 60'' (Halbachsen 44'' und 30'') | O'Dell et al. 2013 [12, Abschn. III.1, III.3] |
| Positionswinkel grosse Achse | etwa 60 Grad | [12] |
| innerer Halo | Boegen bis etwa 65'' vom Zentralstern | [12, Abschn. III.4] |
| aeusserer Halo | Radius 115'' | [12] |
| H-alpha Hauptring zu innerem Halo | Faktor 362 (6,4 mag) | [12, Abschn. III.4] |
| Gesamthelligkeit | V = 8,8 | Wikipedia [19] und Beobachtungsfuehrer (Sekundaerquellen, Herkunft nicht gefunden) |
| Zentralstern | V = 15,75 | Wikipedia [19] (Sekundaerquelle) |
| mittlere Flaechenhelligkeit in 88'' x 60'' | 8,8 + 2,5 log10(pi · 44 · 30) = 17,8 (ber.) | |
| innerer Halo (H-alpha-Verhaeltnis auf V uebertragen) | etwa 17,8 + 6,4 = 24 (ber., grobe Naeherung) | |

Den Kontrast zwischen Ring und Loch habe ich nicht als Zahl aus einer Primaerquelle gefunden. Das Loch ist kein leeres Feld: dort leuchtet He II und [O III] schwaecher. Vorschlag: den Kontrast traegt das Quellbild, geeicht auf V = 8,8 im Hauptring. Den Halo kann astobsim weglassen: mit etwa 24 mag/arcsec$^2$ liegt er unter jedem Himmel ausser Bortle 1 und ist visuell nicht zu sehen. Der Zentralstern (15,75) ist ein Punkt fuer grosse Fernrohre; er gehoert zum Objekt (A-X9, Ausnahme).

---

## 6. Kataloge, Umrechnung, Lizenzen

### 6.1 Eignung

| Katalog | Inhalt | Eignung fuer astobsim |
|---|---|---|
| Hipparcos (ESA 1997, I/239) [4] | Johnson V, B-V, Position, vollstaendig bis V etwa 7,3 bis 9 | beste Quelle fuer V und B-V der hellen Sterne (M45 bis V 7, Trapez C und D, Theta2 A). Fehler bei engen Paaren (Theta1 Ori A) |
| Hipparcos-Neureduktion (van Leeuwen 2007, I/311) [5] | Hp, B-V, V-I, bessere Parallaxen, **kein V** | nur fuer Mitgliedschaft (Parallaxe) |
| Gaia DR3 (I/355) [2] | $G$, $G_{BP}-G_{RP}$, Positionen auf mas, Eigenbewegung | fuer schwache Sterne (M45 ab V 7, M13, Trapez A, B, E, F); unter etwa $G$ = 5 Astrometrie unzuverlaessig, V und B-V nur umgerechnet |
| WDS (B/wds) [16] | Trennung, Positionswinkel, Helligkeiten aus vielen Quellen | Probe fuer das Trapez, Helligkeiten zu grob |
| Harris 2010 [1] | Strukturparameter der Kugelhaufen | King-Profil M13 |

### 6.2 VizieR-Abfragen (fuer `tools/`)

Die Abfrage beim CDS (`vizier.cds.unistra.fr`) ging aus der Sandbox nicht (Verbindung abgelehnt bzw. Zeitueberschreitung), der Harvard-Spiegel lief in die Zeitueberschreitung. Der Spiegel `vizier.idia.ac.za` beantwortete alle Abfragen. Alle Spiegel nehmen dieselben ASU-Parameter an:

```
# M45 Hipparcos (V, B-V)
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/239/hip_main&-c=056.75%2B24.1167&-c.rd=1.3&-out=HIP,HD,RAICRS,DEICRS,Vmag,B-V,Plx,SpType&Vmag=%3C8.5&-sort=Vmag&-out.max=300
# M45 Hipparcos-2 (Parallaxe fuer Mitgliedschaft)
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/311/hip2&-c=056.75%2B24.1167&-c.rd=1.3&-out=HIP,RArad,DErad,Hpmag,B-V,V-I,Plx&Hpmag=%3C8.6&-sort=Hpmag&-out.max=300
# M45 Gaia DR3
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/355/gaiadr3&-c=056.75%2B24.1167&-c.rd=1.3&-out=Source,RA_ICRS,DE_ICRS,Gmag,BP-RP,Plx,pmRA,pmDE&Gmag=%3C9.0&-sort=Gmag&-out.max=500
# Trapez Gaia DR3 (22'') und Hipparcos (6')
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/355/gaiadr3&-c=083.8187-05.3897&-c.rd=0.006&-out=Source,RA_ICRS,DE_ICRS,Gmag,BP-RP,RUWE&-sort=Gmag
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/239/hip_main&-c=083.8187-05.3897&-c.rd=0.1&-out=HIP,HD,RAICRS,DEICRS,Vmag,B-V,SpType&-sort=Vmag
# Trapez WDS
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=B/wds/wds&WDS=05353-0523&-out=WDS,Disc,Comp,Obs2,pa2,sep2,mag1,mag2
# M13 Gaia DR3 (15', G < 17, etwa 3100 Zeilen)
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=I/355/gaiadr3&-c=250.42183%2B36.45986&-c.rd=0.25&-out=Source,RA_ICRS,DE_ICRS,Gmag,BP-RP,Plx,pmRA,pmDE,RUWE&Gmag=%3C17&-out.max=20000
# M13 Harris (Ausgabe 1996; Ausgabe 2010 als Textdatei [1])
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=VII/202/catalog&ID=NGC%206205&-out.all
# M31 RC3
https://vizier.idia.ac.za/viz-bin/asu-tsv?-source=VII/155/rc3&-c=010.6847%2B41.2690&-c.rd=0.2&-out.all
```

Die M13-Abfrage dauert etwa eine Minute. `tools/` sollte die Antwort einmal als Text unter `data/roh/` ablegen (gitignored) und daraus die Sternlisten fuer `objekte.json` erzeugen, mit Abrufdatum und Abfrage im Kommentar.

### 6.3 Umrechnung Gaia nach V und B-V

Riello et al. 2021 (Gaia EDR3, photometrischer Inhalt) [3, Tabelle 8, Bereich Tabelle 7], gueltig fuer $-0{,}5 < G_{BP}-G_{RP} < 5{,}0$, Streuung 0,030 mag:

$$G - V = -0{,}02704 + 0{,}01424\,x - 0{,}2156\,x^2 + 0{,}01426\,x^3, \qquad x = G_{BP} - G_{RP}$$

Probe an den Plejaden (ber.): Fuer die 25 Hipparcos-Mitglieder mit V 2,9 bis 8,3 weicht V aus Gaia im Mittel um 0,03 mag ab, hoechstens um 0,11 mag (HIP 17923), ausser bei Pleione (veraenderlich, 0,18).

Fuer B-V gibt [3] keine direkte Beziehung zu $G_{BP}-G_{RP}$, nur $G-V$ als Funktion von $B-V$ (-0,04749; -0,0124; -0,2901; 0,02008; Streuung 0,048). Aus beiden Polynomen laesst sich B-V bei blauen Sternen nicht eindeutig bestimmen ($G-V$ haengt dort kaum von der Farbe ab). Ich habe stattdessen eine Gerade an die 25 Plejaden-Mitglieder mit Hipparcos-B-V angepasst (ber.):

$$B - V = -0{,}022 + 0{,}763\,(G_{BP} - G_{RP}), \qquad \text{Streuung } 0{,}042 \text{ mag},\ \text{geprueft fuer } -0{,}11 < B-V < 0{,}35$$

Fuer rote Sterne (M13-Riesen, $x$ = 1,6 bis 1,8; Trapez E) ist die Gerade eine Extrapolation; dort geben gaengige Tabellen B-V etwa 1,2 bis 1,4 (nicht belegt). Fuer A-P12 reicht das, weil die Farbe nur oberhalb einer Leuchtdichteschwelle gezeigt wird.

> Nachtrag 2026-10-29 (Issue #104): Die Gaia-DR3-Dokumentation, Kapitel 5.5.1, Tabelle 5.9, gibt $G_{BP}-G_{RP} = f(B-V)$ (Streuung 0,066). `tools/m45_sterne.py` nimmt deren Umkehrung statt der Geraden; Formeln und Probe in `physik.md` 22. Die Zuordnung Gaia zu Hipparcos laeuft ueber die Lage, weil `gaiadr3.hipparcos2_best_neighbour` Merope, Taygeta, HIP 17791, HIP 17401 und HIP 17694 nicht fuehrt. Ergebnis wie in 4.2: 44 Mitglieder, Zaehlung 6 / 6 / 9 / 11 / 14 / 22 / 24 / 31 / 44.

### 6.4 Lizenzen und Folge fuer das Repo

- **Gaia:** "Gaia data are distributed under the CC BY-NC 3.0 IGO license" (ESA Gaia-Lizenzseite [6]). Nicht CC BY-SA. Namensnennung "ESA/Gaia/DPAC"; fuer kommerzielle Nutzung ist eine Genehmigung bei ESA noetig (data.licences@esa.int) [7]. CC BY-SA 3.0 IGO gilt bei ESA fuer Bilder und Videos, nicht fuer Archivdaten [7].
- **Hipparcos:** liegt ebenfalls in den ESA-Archiven und faellt unter dieselben Bedingungen (CC BY-NC 3.0 IGO, Namensnennung "ESA") [7]. Die Kopie bei VizieR aendert daran nichts.
- **WDS, Harris, RC3:** ohne eigene Lizenzangabe; uebliche wissenschaftliche Zitierpflicht.
- **Folge:** Der Code steht unter MIT (`LICENSE`), die Bilder haben schon heute eigene Lizenzen (README, Abschnitt Lizenz). Eine Sternliste aus Gaia oder Hipparcos in `daten/objekte.json` ist ein abgeleitetes Datenprodukt unter CC BY-NC 3.0 IGO. Das passt zu einer nichtkommerziellen Webseite, aber nicht zu MIT fuer das ganze Repo. Vorschlag: README und Bildnachweis-Fuss um einen Abschnitt "Sterndaten" ergaenzen ("Sternpositionen und Helligkeiten: ESA/Gaia/DPAC und ESA Hipparcos, CC BY-NC 3.0 IGO"), MIT ausdruecklich nur fuer den Code. Ob wenige Dutzend gerundete Positionen und Helligkeiten ueberhaupt schutzfaehig sind (Fakten), kann ich nicht beurteilen; offen fuer Herbert (9).

---

## 7. Empfehlung fuer astobsim

### 7.1 Datentabellen je Objekt

| Objekt | Zustand-ID (Vorschlag) | Ausdehnung | PA | V gesamt | Flaechenhelligkeit (Himmel, V) | Modell | Sterne |
|---|---|---|---|---|---|---|---|
| M31 | m31 | 190,5' x 61,7' ($D_{25}$) | 35 | 3,44 | Mitte 15,4; 5' 19,2; 20' 21,0; 60' 22,9; 95' 24,4 | Sersic $n$ = 2, $R_e$ = 263'', $\mu_e$ = 19,4 plus Scheibe $R_d$ = 1474'', $\mu_0$ = 20,2 (1.2) | keine |
| M42 | m42 | 65' x 60', Kern 5' | | 4,0 | Kern etwa 17, aeussere Schleife etwa 21,3, Mittel 21,8 | Quellbild | Trapez A bis F, Theta2 A (2.2) |
| M13 | m13 | Gezeitenradius 21'; sichtbar 8' bis 15' | | 5,78 | King: $\mu_V(0)$ = 16,59, $r_c$ = 37,2'', $r_t$ = 1260'' (3.2) | Quellbild oder Sterne plus Restlicht (3.4) | hellste V 11,9; 531 bis V 15 |
| M45 | m45 | etwa 2 Grad | | 1,6 | (kein Nebel) | nur Sterne | 31 bis V 8,0, 44 bis V 8,5 (4.2) |
| M57 | m57 | 88'' x 60'' | 60 | 8,8 | Mittel 17,8; Halo etwa 24 | Quellbild | Zentralstern V 15,75 |

### 7.2 Eichung des Quellbilds

Quellweiss wird bei den Planeten ueber den Gesamtfluss des Bilds geeicht (`objekte.md` 5.3). Bei Deep-Sky-Bildern reicht das nicht: Astrofotos sind fast immer nichtlinear gestreckt (Kern gestaucht, Aussenbereiche angehoben). Mit nur einem Anker stimmt die Gesamthelligkeit, aber der Kern ist zu dunkel und der Rand zu hell. Fuer A-P11 ist gerade der Rand wichtig. Vorschlag fuer `tools/`:

1. Bild linearisieren wie bisher (sRGB nach linear).
2. Mittleres Radialprofil (bzw. entlang der grossen Achse bei M31) im Bild messen und eine monotone Tonkurve $q \mapsto q'$ anpassen, sodass das Profil dem Literaturprofil folgt (M31: 1.2; M13: 3.2; M42: zwei Anker, Kern 17 und Gesamt 4,0; M57: Gesamt 8,8 im Ring).
3. Dann Quellweiss ueber den Gesamtfluss wie in 5.3, mit der Gesamthelligkeit aus 7.1 als Probe.
4. Sterne im Bild: Feldsterne sind Nicht-Ziel (A-X9), auf Fotos aber vorhanden. Entweder entfernen (Bearbeitung im Bildnachweis vermerken) oder als Teil des Bilds hinnehmen; Herbert entscheidet (9). Die Katalogsterne von M42 (Trapez) sind im Bild ausgebrannt; das Bild sollte dort durch Punktquellen ersetzt werden (Kern maskieren), sonst zaehlen sie doppelt.

### 7.3 Datenformat-Vorschlag (`objekte.json`)

> Nachtrag 2026-10-29: Das gueltige Format steht in ADR-0003 (Nachtrag Version 2) und `src/daten/objekte.ts`. Abweichungen von diesem Vorschlag: Farbindex heisst `b_v`, Sternlisten liegen in `daten/sterne/<objekt>.json` (`sterne_datei`), und Deep-Sky-Zustaende mit Bild haben kein `weiss_mag_arcsec2`, Quellweiss ist `kennlinie.mag_hell` im Bildnachweis (PR #122).

Passend zu ADR-0003 und `objekte.md` 6.2: Einheiten im Feldnamen, Dezimalpunkt, keine doppelt gespeicherten Groessen. Neu ist `typ: "deep_sky"` (Objektklasse Deep-Sky-Objekt, GLOSSARY). Die Felder `winkelgroesse_arcsec` und `polar_arcsec` behalten ihre Bedeutung als grosse und kleine Achse; dazu kommen `positionswinkel_grad`, `profil` und `sterne[]`. Ein Stern hat anders als ein Trabant keinen Durchmesser, dafuer `bv`.

```json
{
  "id": "m13",
  "name": "M13 (Herkuleshaufen)",
  "typ": "deep_sky",
  "quelle_physik": "docs/recherche/deep-sky.md",
  "zustaende": [
    {
      "id": "m13",
      "name": "M13",
      "winkelgroesse_arcsec": 2520,
      "polar_arcsec": 2240,
      "positionswinkel_grad": 0,
      "magnitude": 5.78,
      "weiss_mag_arcsec2": 16.4,
      "bild": "m13_xyz",
      "profil": {
        "art": "king",
        "mu0_mag_arcsec2": 16.59,
        "rc_arcsec": 37.2,
        "rt_arcsec": 1260,
        "quelle": "Harris 2010"
      },
      "sterne": [
        { "name": "Gaia DR3 ...", "dx_arcsec": -56.0, "dy_arcsec": -60.0, "magnitude": 11.92, "bv": 1.3 }
      ],
      "kommentar": "Profil zur Eichung des Quellbilds bzw. als Restlicht (deep-sky.md 3.4)."
    }
  ]
}
```

- `profil.art`: `"king"` (M13), `"sersic_exp"` (M31: `n`, `re_arcsec`, `mue_mag_arcsec2`, `rd_arcsec`, `mu0_mag_arcsec2`, `q_bulge`, `q_scheibe`), `"keins"` (M42, M57, M45). Das Profil dient `tools/` zur Eichung, der Anwendung nur dann, wenn ohne Quellbild gerendert wird (M13-Ausweichloesung).
- `weiss_mag_arcsec2`: wie bisher Quellweiss, geeicht nach 7.2; bei M45 ohne Bild entfaellt das Feld (oder `bild` fehlt). Der Wert 16,4 im Beispiel ist ein Platzhalter.
- `sterne[]`: `name`, `dx_arcsec`, `dy_arcsec`, `magnitude` (V), `bv`; optional `katalog` ("HIP 17702", "Gaia DR3 ...") fuer die Herkunft. Grenzen pruefen wie bei Trabanten ($|dx|, |dy| \le 7200$, das reicht fuer M45 bis 4600'').
- Fuer M45 nur `sterne[]` und `magnitude` = 1,6 (informativ, Summe der Sterne ber. pruefen), kein `bild`, kein `profil`.
- Begrenzung der Liste: M45 bis V 8,5 (44 Sterne), M13 bis V 15 (531, als eigene Datei `daten/sterne_m13.json`, wenn objekte.json sonst unuebersichtlich wird), Trapez 7 Sterne, M57 ein Stern.

---

## 8. Testfall-Vorschlaege (A-Q5)

Die Nummern T7 bis T12 vergibt Herbert. Die Erwartung ist der Anblick, die Begruendung nennt Zahlen aus diesem Dokument. Ob ein Detail ueber der Schwelle liegt, entscheidet das Modell aus `wahrnehmung.md`; die Faelle pruefen es.

1. **M57 am 80-mm-Refraktor, etwa 80-fach, Bortle 5.** Erwartung: kleines, klar sichtbares Oval, 1,5' x 1,0', scheinbar 2,0 x 1,3 Grad; der Ring (dunklere Mitte) ist angedeutet, aber nicht sicher. Begruendung: mittlere Flaechenhelligkeit 17,8 gegen Himmel 20,0 (Bortle 5), im Okular bei 1 mm Austrittspupille beide um 3,9 mag dunkler. Die Literatur ist uneins: "even a 7.5 cm telescope will reveal its elliptical ring shape" [19]; "visible in a 3-inch telescope as an elongated hazy spot ... a 6-inch scope will reveal the famous smoke ring structure" [20]; 80 mm bei 50 bis 60x "tiny grey smoke-ring", bei Bortle 4 oder besser [21]. Alle drei sind Sekundaer- bzw. Beobachtungsquellen. Vorschlag: Testkriterium "Oval sichtbar" fest, "Loch sichtbar" bei 80 mm offen, bei 150 mm sichtbar.
2. **M31 mit blossem Auge, Bortle 3 und Bortle 7.** Erwartung Bortle 3 (21,4): deutlich sichtbar, laenglich, Ausdehnung 1,5 bis 3 Grad. Erwartung Bortle 7 (18,3): nur der Kern als kleiner, sehr undeutlicher Fleck. Begruendung: Bortle 2001: Klasse 6 "M31 is only modestly apparent to the unaided eye", Klasse 7 "M44 or M31 may be glimpsed with the unaided eye but are very indistinct", Klasse 8 "M44 and M31 may be barely glimpsed by an experienced observer on good nights" [15]. Fuer die Ausdehnung nennen Beobachtungsberichte bei dunklem Himmel etwa 2,5 Grad, das Foto 3 x 1 Grad (Foren, Sekundaerquellen, [25]). Modell: die Isophote 23 V hat 127' (ber., 1.2). Mit blossem Auge ist M31 unaufgeloest im Sinne der Augenschaerfe nur fuer den Kern (A-P10); die Scheibe ist gross genug.
3. **Sternzahl der Plejaden mit blossem Auge.** Erwartung: Bortle 7 (Grenzgroesse 4,6 bis 5,0) sechs Sterne; Bortle 5 (5,6 bis 6,0) 9 bis 11; Bortle 3 (6,6 bis 7,0) 14 bis 21; Pleione nicht getrennt von Atlas, 24 Tau nicht getrennt von Alkyone. Begruendung: Zaehlung 4.2 (ber.); "brightest six or seven being easily visible to the naked eye", "up to 14 ... depending on conditions" [17]; Grenzgroessen je Stufe aus Bortle [15]. Die Luecke zwischen V 4,30 und 5,05 erklaert die stabile Zahl sechs.
4. **M13 am 200-mm-Newton, etwa 150-fach, Bortle 4.** Erwartung: heller, koerniger Kern, am Rand (ab etwa 1,5' bis 2' vom Zentrum) einzelne Sterne, insgesamt einige Dutzend bis gut hundert. Gegenprobe am 80 mm: hoechstens eine Handvoll Sterne am Rand, sonst Nebelball. Begruendung: Grenzgroesse am 200 mm bei Bortle 4 etwa 13,5 bis 14 (aus Bortle: 12,5 Zoll erreichen 15,5 [15], 200 mm etwa 1 mag weniger, ber.); bis V 14 gibt es 188 Mitglieder, davon 124 ausserhalb 1' (3.3). Am 80 mm (Grenze etwa 12 bis 12,5) sind es bis 12,5 nur 22 Sterne, 10 davon ausserhalb 2'. Beobachtungsliteratur (sekundaer): "at least four inches of telescope aperture will allow resolving the stars in M13's outer extents", 8 Zoll bei 150 bis 200x "hundreds of pinpoint stars" [21].
5. **Trapez am 80 mm, 100-fach, Seeing 2''.** Erwartung: A, B, C, D getrennt (Abstaende 8,8'' bis 21,4'', V 5,1 bis 7,9); E (V 11,1, 4,5'' von A) und F (V 10 bis 11,5, 4,6'' von C) nicht sichtbar. Am 200 mm sind E und F sichtbar. Begruendung: Positionen und Helligkeiten 2.2; Wikipedia: Fernrohre um 130 mm zeigen bei gutem Seeing sechs Sterne [18]. Der Fall prueft Punktquellen nahe einem viel helleren Stern im Nebel, also Wahrnehmungsschwelle gegen hellen Hintergrund.

---

## 9. Unsicher oder zu pruefen (fuer Herbert)

1. **M31-Scheibe:** $\mu_{0,V}$ = 20,2 ist an RC3 angepasst, nicht gemessen. Das R-Band-Modell mit $V-R$ = 0,6 gaebe 19,6 und eine 0,5 mag zu helle Galaxie. Primaer waere die Tabelle V bei Walterbos & Kennicutt 1987 [11]; ich konnte sie nicht lesen. Fehler in der sichtbaren Ausdehnung: bei Isophote 21,4 etwa 55' gegen 82' (Faktor 1,5).
2. **Bulge-Farbe** $V-I$ = 1,2 angenommen. Bei 1,0 waere der Bulge 0,2 mag heller.
3. **M42-Flaechenhelligkeit:** nur Clark [14] (Digitalkamera, Sekundaerquelle im Sinne eines Amateurs mit Methode). Kein V-Profil aus der Fachliteratur gefunden.
4. **M57-Gesamthelligkeit 8,8** ohne Primaerquelle. Die Linienfluesse bei O'Dell et al. 2013 [12] liessen sich in V umrechnen; das ist aufwendig und habe ich nicht gemacht.
5. **Visuell gegen V bei Emissionsnebeln** (2.1): ob astobsim fuer M42 und M57 die Leuchtdichte Y oder den Gruenkanal nimmt, ist eine Entscheidung fuer `bilder-v2.md` bzw. ADR-0004.
6. **Trapez E und F:** V aus Gaia (10,1 und 10,0) und WDS (11,1 und 11,5) widersprechen sich um bis zu 1,5 mag. E ist veraenderlich und rot, Gaia im Nebel und neben hellen Sternen gestoert (RUWE 1,5). Fuer den Testfall 5 aendert das nichts (beide bleiben am 80 mm unsichtbar), fuer die Grenze am 150 mm schon.
7. **B-V fuer rote Sterne** (M13-Riesen, Trapez E) aus einer Geraden fuer blaue Sterne extrapoliert.
8. **Mitgliedschaft M45:** einfache Schnitte in Eigenbewegung und Parallaxe. Gaia-Mitgliederlisten (z. B. Gaia Collaboration 2018, Babusiaux et al.) waeren sauberer; das Ergebnis aendert sich bis V 8 hoechstens um einzelne Sterne.
9. **Lizenz:** Gaia und Hipparcos stehen unter CC BY-NC 3.0 IGO (6.4). Will Herbert die Sterndaten im Repo haben, braucht README einen eigenen Lizenzabschnitt fuer Daten; alternativ Herkunft und Abfrage nur in `tools/` und die Daten erst im Bau erzeugen (aendert an der Weitergabe nichts).
10. **Feldsterne in Quellbildern** (7.2, Punkt 4) und die Begleiter M32 und M110 (1.3): zeigen oder entfernen?
11. **Testfaelle 1, 2, 4** stuetzen sich auf Beobachtungsberichte und Fuehrer (Sekundaerquellen). Clark 1990, O'Meara und Burnham habe ich nicht im Volltext gesehen. Bortle 2001 [15] habe ich nur als Nachdruck gelesen.
12. **Eigenbewegung M13** (3.3) aus dem Gedaechtnis [22]; die Daten bestaetigen den Wert, die Zahl selbst ist nicht nachgelesen.

---

## 10. Quellen

1. Harris, W. E. (1996, Ausgabe 2010): A Catalog of Parameters for Globular Clusters in the Milky Way. AJ 112, 1487; Datei der Ausgabe Dezember 2010: https://physics.mcmaster.ca/~harris/mwgc.dat (gelesen 2026-10-29); Ausgabe 1996 als VizieR VII/202: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=VII/202
2. Gaia Collaboration, Vallenari, A. et al. (2023): Gaia Data Release 3. Summary of the content and survey properties. A&A 674, A1. VizieR I/355: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/355 (abgefragt ueber vizier.idia.ac.za, 2026-10-29)
3. Riello, M., De Angeli, F., Evans, D. W. et al. (2021): Gaia Early Data Release 3: Photometric content and validation (im Auftrag "Riley et al." genannt; die Polynome dort gehen auf C. Riley zurueck, nicht nachgeprueft). A&A 649, A3. arXiv:2012.01916, Tabellen 7 und 8 gelesen ueber https://ar5iv.labs.arxiv.org/html/2012.01916
4. ESA (1997): The Hipparcos and Tycho Catalogues. ESA SP-1200. VizieR I/239: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/239
5. van Leeuwen, F. (2007): Validation of the new Hipparcos reduction. A&A 474, 653. VizieR I/311: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/311
6. ESA Gaia, License: https://www.cosmos.esa.int/web/gaia-users/license (gelesen 2026-10-29)
7. ESA ESDC, Terms and Conditions for the use of data in the ESA Space Science Archives: https://www.cosmos.esa.int/web/esdc/terms-and-conditions (gelesen 2026-10-29)
8. de Vaucouleurs, G. et al. (1991): Third Reference Catalogue of Bright Galaxies (RC3). VizieR VII/155: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=VII/155
9. Courteau, S., Widrow, L. M., McDonald, M. et al. (2011): The Luminosity Profile and Structural Parameters of the Andromeda Galaxy. ApJ 739, 20. arXiv:1106.3564, gelesen ueber https://ar5iv.labs.arxiv.org/html/1106.3564
10. Chemin, L., Carignan, C., Foster, T. (2009): HI kinematics and dynamics of Messier 31. ApJ 705, 1395. arXiv:0909.3846, https://arxiv.org/abs/0909.3846 (nur Suchergebnis-Auszug gelesen)
11. Walterbos, R. A. M., Kennicutt, R. C. (1987): Multi-color photographic surface photometry of the Andromeda galaxy. A&AS 69, 311. https://ui.adsabs.harvard.edu/abs/1987A%26AS...69..311W (nicht gelesen, zitiert nach [9], [10])
12. O'Dell, C. R., Ferland, G. J., Henney, W. J., Peimbert, M. (2013): Studies of NGC 6720 with Calibrated HST/WFC3 Emission-Line Filter Images. I. Structure and Evolution. AJ 145, 92. arXiv:1301.6636, gelesen ueber https://ar5iv.labs.arxiv.org/html/1301.6636
13. O'Dell, C. R., Harris, J. A. (2010): Spectrophotometry of the Huygens Region of the Orion Nebula, the Extended Orion Nebula, and M43. AJ 140, 985. arXiv:1008.1002, https://arxiv.org/abs/1008.1002 (Auszug)
14. Clark, R. N. (2004): Surface Brightness of Deep Sky Objects. https://www.clarkvision.com/astro/surface-brightness-profiles/introduction.html (gelesen 2026-10-29)
15. Bortle, J. E. (2001): Gauging Light Pollution: The Bortle Dark-Sky Scale. Sky & Telescope, Februar 2001. Nachdruck: https://frostydrew.org/papers.dc/papers/paper-bortle (gelesen 2026-10-29; Original bei S&T nicht erreichbar)
16. Mason, B. D. et al.: The Washington Double Star Catalog. VizieR B/wds: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=B/wds (Eintrag 05353-0523, STF 748)
17. Wikipedia: Pleiades. https://en.wikipedia.org/wiki/Pleiades (Sekundaerquelle; Sternzahl mit blossem Auge, V gesamt, Ausdehnung)
18. Wikipedia: Trapezium Cluster. https://en.wikipedia.org/wiki/Trapezium_Cluster (Sekundaerquelle)
19. Wikipedia: Ring Nebula. https://en.wikipedia.org/wiki/Ring_Nebula (Sekundaerquelle; V 8,8, Zentralstern 15,75, Ring im 75-mm-Fernrohr)
19a. Wikipedia: Orion Nebula. https://en.wikipedia.org/wiki/Orion_Nebula (Sekundaerquelle; V 4,0 nach SEDS, 65' x 60' nach Steinicke, Entfernung nach Kounkel et al. 2017)
20. Skyhound, The Ring Nebula (M 57). https://observing.skyhound.com/archives/jul/M_57.html (Beobachtungsfuehrer)
21. Telescope Advisor: Ring Nebula M57 telescope guide, https://www.telescopeadvisor.com/ring-nebula-m57-telescope-guide/; Hercules Globular Cluster M13, https://www.telescopeadvisor.com/hercules-globular-cluster-m13-telescope/ (Beobachtungsfuehrer, Sekundaerquelle)
22. Vasiliev, E., Baumgardt, H. (2021): Gaia EDR3 view on galactic globular clusters. MNRAS 505, 5978. arXiv:2102.09568, https://arxiv.org/abs/2102.09568 (nicht nachgelesen, siehe 9 Punkt 12)
23. Sandquist, E. L. et al. (2010): A Comprehensive Study of the Rare Evolved Stars of M13. AJ 139, 2374. VizieR J/AJ/139/2374 (Alternative fuer die hellen Riesen, nicht ausgewertet)
24. King, I. (1962): The structure of star clusters. I. An empirical density law. AJ 67, 471. https://ui.adsabs.harvard.edu/abs/1962AJ.....67..471K
25. Beobachtungsberichte zur Ausdehnung von M31 mit blossem Auge: Stargazers Lounge, https://stargazerslounge.com/topic/324988-quick-naked-eye-report-and-a-bit-of-darkness-quality ; Sterngucker, https://www.sterngucker.de/en/galaxy/andromeda-galaxy/ (Sekundaerquellen)
