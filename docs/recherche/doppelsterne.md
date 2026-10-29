# Recherche: Doppelsterne (Katalogliste, Daten, Format, Testfaelle)

- Auftrag: Feste Katalogliste der Doppelsterne fuer A-Z9 mit WDS-Daten (Trennung, Positionswinkel, Epoche, V-Magnituden, B-V), Pruefung der Bahnpaare im Sixth Orbit Catalog, Nutzungsbedingungen der Datenquellen, Datenformat fuer `daten/objekte.json` und Testfall-Vorschlaege fuer A-Q5. Beantwortet die offenen Fragen 6 und (teilweise) 9 aus `docs/anforderungen.md`, Abschnitt 10.
- Datum: 2026-10-29
- Zugeordnete Kennungen: A-Z9, A-P6, A-P9, A-P11, A-P12, A-D12, A-D18, A-X9, A-Q5
- Konventionen: Trennung $\rho$ in Bogensekunden ('') , Positionswinkel $\theta$ in Grad (Nord ueber Ost), $D$ Oeffnung in mm, $\Delta m = m_\mathrm{B} - m_\mathrm{A}$. Quellen in eckigen Klammern verweisen auf die Liste in Abschnitt 9; "(ber.)" sind eigene Rechnungen aus den zitierten Daten (Skripte im Scratchpad, nicht im Repo). Die Katalogwerte sind am 2026-10-29 direkt abgefragt: WDS, Tycho Double Star Catalogue, Hipparcos und Bright Star Catalogue ueber den VizieR-Spiegel `vizier.idia.ac.za` (der Hauptserver in Strassburg war nicht erreichbar), SIMBAD ueber den Spiegel `simbad.cfa.harvard.edu`, die Ephemeriden des Sixth Orbit Catalog als Datei von `astro.gsu.edu`. Primaer sind damit alle Werte ausser den in Abschnitt 7 genannten.

---

## 1. Datenquellen

### 1.1 WDS

Der Washington Double Star Catalog (WDS) ist der Hauptkatalog fuer visuelle Doppelsterne, gepflegt am U.S. Naval Observatory [1]. Stand der Webseite: 13.10.2026, 157 990 Systeme aus 2 243 347 Mittelwerten [2]. VizieR fuehrt ihn als `B/wds/wds` und aktualisiert ihn laufend [3]. Je Paar stehen dort: WDS-Bezeichnung (Koordinaten J2000, z. B. `18443+3940`), Discoverer-Code (z. B. `STF2382`, Struve), Komponenten (`AB`, `A,BC`), erste und letzte Epoche (`Obs1`, `Obs2`), Zahl der Messungen, Positionswinkel und Trennung der ersten und **letzten** Messung (`pa2`, `sep2`), Magnituden beider Komponenten, Spektraltyp, Anmerkungen (Flag `O`: Bahn im Sixth Orbit Catalog).

Die WDS-Magnituden sind gemischter Herkunft (oft Tycho $V_T$, teils aeltere visuelle Schaetzungen) und ohne Fehlerangabe [1]; fuer die meisten Paare der Liste stimmen sie auf 0,01 mag mit $V_T$ aus dem TDSC ueberein (ber., Tabelle 2.2). Einen Farbindex enthaelt der WDS nicht.

### 1.2 Sixth Orbit Catalog (ORB6)

Fuer Paare mit Bahn liefert ORB6 Bahnelemente und Ephemeriden fuer 2025,0 bis 2029,0, jeweils mit Note 1 (definitiv) bis 5 (unbestimmt) [4, 5]; Stand der Seite ebenfalls 13.10.2026 [5]. Bei Bahnpaaren ist die letzte WDS-Messung nicht die beste Angabe fuer "heute": $\zeta$ Her dreht sich um 4,5 Grad pro Jahr, 44 Boo oeffnet sich von 0,84'' (2026,0) auf 0,99'' (2027,0) [4]. Fuer $\varepsilon^1$ Lyr gibt ORB6 zwei Bahnen, die sich um 0,22'' unterscheiden (WSI2004b: 2,256''; Doc2020e: 2,038'' fuer 2026,0); die letzte Messung 2025 mit 2,10'' [3] passt zur neueren Bahn Doc2020e, die die Liste deshalb nimmt.

**Empfehlung Epoche:** Alle Bahnpaare mit der ORB6-Ephemeride **2027,0** (ein Wert aus der Quelle, nicht interpoliert), alle anderen mit der letzten WDS-Messung. Fuer die Darstellung ist die Abweichung bis 2030 bei allen Paaren der Liste kleiner als 0,07'' (ber. aus den Ephemeriden 2025 bis 2029 [4]), also unterhalb jeder sichtbaren Wirkung; die Epoche steht trotzdem in den Daten.

### 1.3 Farben: TDSC, Hipparcos, BSC, SIMBAD

- **Tycho Double Star Catalogue (TDSC)** [6]: $B_T$ und $V_T$ je Komponente fuer Paare ab etwa 0,3'' (aus den Tycho-Rohdaten neu reduziert). Das ist fuer die meisten engen Paare die einzige Quelle getrennter Farben. Umrechnung ins Johnson-System nach ESA 1997 [7, Abschn. 1.3, Gl. 1.3.20]:
  $$B-V = 0{,}850\,(B_T - V_T), \qquad V = V_T - 0{,}090\,(B_T - V_T)$$
  gueltig etwa fuer $-0{,}2 < B_T - V_T < 1{,}8$ und unverroetete Hauptreihensterne; fuer heisse Sterne weicht sie um bis zu 0,2 mag ab (Albireo B: TDSC ergibt +0,15, Hipparcos misst $-0{,}10$; ber. aus [6, 8]).
- **Hipparcos-Hauptkatalog** [8]: Johnson $B-V$ je HIP-Eintrag. Brauchbar nur, wenn die Komponente einen eigenen Eintrag hat (Albireo A und B, $\gamma$ Del A und B); sonst ist es der Wert des ganzen Systems.
- **Bright Star Catalogue (BSC)** [9]: getrennte Eintraege fuer helle Komponenten (Mizar A/B, Castor A/B, $\gamma^1$/$\gamma^2$ And), Johnson $B-V$ aus der photoelektrischen Literatur. Fuer diese Paare primaer.
- **SIMBAD** [10]: fuer Antares B und Polaris B, die in TDSC, BSC und Hipparcos fehlen.

Plausibilitaetspruefung: Die mit den Helligkeitsanteilen gewichtete Mischung der TDSC-Farben trifft den Hipparcos-Systemwert, z. B. $\varepsilon^1$ Lyr 0,16 gegen 0,170, $\pi$ Aql 0,55 gegen 0,546 (ber.). Die Werte sind also konsistent; die absolute Unsicherheit der Umrechnung (rund 0,05 mag) ist fuer A-P12 ohne Belang, weil B-V dort nur die Farbe waehlt.

### 1.4 Nutzungsbedingungen

| Quelle | Bedingung | Folge fuer astobsim |
|---|---|---|
| WDS, ORB6 (USNO) | Bitte um die Danksagung "This research has made use of the Washington Double Star Catalog maintained at the U.S. Naval Observatory" [2]; im US-Datenkatalog als "U.S. Government Works", Zugang "public" [11]. Zitierung Mason et al. 2001 [1], Hartkopf et al. 2001 [4]. | Werke der US-Bundesregierung sind in den USA gemeinfrei; Uebernahme in ein MIT-Repo ist unbedenklich. Danksagung und Zitat in `docs/` und im Hilfetext. |
| Hipparcos, Tycho, TDSC (ESA) | "distributed under the CC BY-NC 3.0 IGO licence", Pflicht "Credit: ESA" [12]. | astobsim ist nicht kommerziell. Einzelne Zahlenwerte (hier rund 20 Farbindizes) sind Fakten und kein schutzfaehiger Teil der Datenbank; trotzdem "Credit: ESA" und ESA 1997 [7] nennen. Die MIT-Lizenz des Codes erstreckt sich nicht auf diese Werte; im Kommentar der Datei sagen. |
| VizieR, SIMBAD (CDS) | Datensaetze aus oeffentlichen Daten unter offener Lizenz (ODbL bzw. CC BY), sonst die Lizenz des Autors; gewuenschte Danksagung mit DOI 10.26093/cds/vizier bzw. Wenger et al. 2000 [13] (Seite nicht erreichbar, Wortlaut sekundaer aus der Suchzusammenfassung). | Danksagung an CDS; Lizenz richtet sich nach dem Ursprungskatalog (WDS, ESA, BSC). |
| BSC (Yale, 5. Aufl.) | ueber VizieR, keine eigene Lizenz gefunden. | Zitat Hoffleit & Warren [9]. |

Ergebnis: Eine Lizenz, die die Aufnahme der Werte in `daten/objekte.json` verbietet, gibt es nicht. Pflicht ist die Quellenangabe; Vorschlag: ein Abschnitt "Sterndaten" neben den Bildnachweisen im Fuss der Seite (WDS/USNO, ORB6, ESA Hipparcos/Tycho, CDS).

---

## 2. Auswahl der Paare

### 2.1 Grenzen je Oeffnung

Nach physik.md 1.2 (550 nm):

$$\theta_\mathrm{D} = \frac{116''}{D_\mathrm{mm}}, \qquad \theta_\mathrm{R} = \frac{138''}{D_\mathrm{mm}}, \qquad \theta_\mathrm{S} = \frac{107''}{D_\mathrm{mm}}$$

| $D$ | 50 | 80 | 100 | 150 | 200 | 250 | 300 |
|---|---|---|---|---|---|---|---|
| Dawes | 2,32'' | 1,45'' | 1,16'' | 0,77'' | 0,58'' | 0,46'' | 0,39'' |
| Rayleigh | 2,76'' | 1,73'' | 1,38'' | 0,92'' | 0,69'' | 0,55'' | 0,46'' |

Umgekehrt braucht ein Paar mit $\rho$ die Oeffnung $D_\mathrm{D} = 116/\rho$ (Dawes) bzw. $D_\mathrm{R} = 138/\rho$ (Rayleigh) (ber.).

**Ungleiche Paare.** Dawes gilt fuer gleich helle Sterne um 6 mag [14]. Fuer $\Delta m > 0$ braucht es mehr Abstand. Drei empirische Ansaetze, alle sekundaer ueber die Zusammenstellung [16]:
- Treanor 1946 [17]: beobachtete Grenze als Vielfaches der Dawes-Grenze, je nach $\Delta m$; grosse Fernrohre schneiden relativ schlechter ab.
- Haas 2006 [15, Tab. 5 und 6], aus Beobachtungen der *Revue des Constellations*, Hauptstern 4,5 mag: $\Delta m$ = 0: 60 mm 2,0'', 100 mm 1,2'', 150 mm 0,8'', 200 mm 0,6''; $\Delta m$ = 2,5: 3,5 / 2,0 / 1,4 / 1,3''; $\Delta m$ = 4: 4,5 / 2,6 / 2,0 / 1,9''. Bei gleich hellen Paaren ist das etwa $120''/D$, also Dawes.
- Lord 1979 [18], Kontrastmodell: $\rho_\mathrm{grenz} = n(\Delta m)/D_\mathrm{mm}$ mit $n$ = 115 (0 mag), 169 (1), 230 (2), 302 (3), 391 (4), 499 (5), 640 (6), 804 (7), fuer 3 Zoll und Antoniadi I [16].

Lord ist strenger als Haas, bei $\Delta m$ = 4 um etwa den Faktor 1,5 (ber.: Lord 391/60 = 6,5'' gegen Haas 4,5'' bei 60 mm; bei 100 mm 3,9'' gegen 2,6''); bei $\Delta m$ = 0 stimmen beide mit Dawes ueberein. Peterson 1954 [16] verknuepft die Grenze mit der Grenzgroesse des Begleiters und gilt bis 6 Zoll; fuer die Liste nicht noetig.

### 2.2 Katalogwerte

Abfrage 2026-10-29. Spalten: $\rho$, $\theta$ mit Epoche (ORB6-Ephemeride "E2027" oder letzte WDS-Messung "M2025"); $V_\mathrm{A}$, $V_\mathrm{B}$ aus dem WDS [3]; $B-V$ je Komponente mit Quelle (T = TDSC umgerechnet (ber.) [6, 7], H = Hipparcos [8], Y = BSC [9], S = SIMBAD [10]).

| Paar | WDS | Disc., Komp. | $\rho$ | $\theta$ | Epoche | $V_\mathrm{A}$ | $V_\mathrm{B}$ | $B-V$ A / B | Quelle Farbe |
|---|---|---|---|---|---|---|---|---|---|
| Albireo ($\beta$ Cyg) | 19307+2758 | STFA 43 AB | 34,3 | 54 | M2025 | 3,19 | 4,68 | 1,09 / $-0$,10 | H / H |
| Mizar ($\zeta$ UMa) | 13239+5456 | STF1744 AB | 14,4 | 153 | M2022 | 2,23 | 3,88 | 0,02 / 0,13 | Y / Y |
| $\gamma$ And (Alamak) | 02039+4220 | STF 205 A,BC | 9,5 | 63 | M2024 | 2,31 | 5,02 | 1,37 / 0,03 | Y / Y |
| Castor ($\alpha$ Gem) | 07346+3153 | STF1110 AB | 5,772 | 48,9 | E2027 | 1,93 | 2,97 | 0,03 / 0,04 | Y / Y |
| Porrima ($\gamma$ Vir) | 12417-0127 | STF1670 AB | 3,664 | 350,0 | E2027 | 3,48 | 3,53 | 0,33 / 0,33 | T / T |
| $\zeta$ Aqr | 22288-0001 | STF2909 AB | 2,481 | 150,0 | E2027 | 4,34 | 4,49 | 0,38 / 0,34 | T / T |
| $\varepsilon^1$ Lyr | 18443+3940 | STF2382 AB | 2,011 | 341,4 | E2027 | 5,15 | 6,10 | 0,12 / 0,28 | T / T |
| $\varepsilon^2$ Lyr | 18443+3940 | STF2383 CD | 2,421 | 71,3 | E2027 | 5,25 | 5,38 | 0,16 / 0,21 | T / T |
| $\varepsilon^1$-$\varepsilon^2$ Lyr | 18443+3940 | STFA 37 AB,CD | 209,4 | 172 | M2021 | 4,67 | 4,56 | (Systeme) | |
| $\pi$ Aql | 19487+1149 | STF2583 AB | 1,40 | 104 | M2021 | 6,34 | 6,75 | 0,94 / 0,04 | T / T |
| $\varepsilon$ Ari | 02592+2120 | STF 333 AB | 1,266 | 210,7 | E2027 | 5,17 | 5,57 | 0,05 / 0,04 | T / T |
| 52 Ori | 05480+0627 | STF 795 | 0,944 | 221,8 | E2027 | 5,99 | 6,03 | 0,27 / 0,16 | T / T |
| 52 Ari | 03054+2515 | STF 346 AB | 0,557 | 260,2 | E2027 | 6,21 | 6,19 | $-0$,03 / $-0$,03 | T (System) |
| $\zeta$ Her | 16413+3136 | STF2084 | 1,542 | 72,2 | E2027 | 2,95 | 5,40 | 0,61 / 0,77 | T / T |
| Antares ($\alpha$ Sco) | 16294-2626 | GNT 1 | 2,579 | 276,7 | E2027 | 0,96 | 5,40 | 1,87 / $-0$,2 | H / S |
| Polaris ($\alpha$ UMi) | 02318+8916 | STF 93 AB | 18,4 | 236 | M2016 | 2,04 | 9,10 | 0,64 / 0,42 | H / [19] |

Anmerkungen zu einzelnen Zeilen:
- **Albireo:** A ist selbst eng doppelt (Aa,Ac 0,3'' [3]); $V_\mathrm{A}$ 3,19 und $B-V$ 1,09 gelten fuer A gesamt (HIP 95947, im TDSC aufgeloest in 3,37 und 5,16 [6]). Fuer astobsim ist A ein Stern.
- **$\gamma$ And:** BC ist eng doppelt (STT 38, 0,37'' fuer 2027,0 [4]), fuer die Liste ein Stern. BSC gibt fuer $\gamma^2$ V = 4,84 [9], der WDS 5,02; die Liste nimmt den WDS-Wert (einheitliche Quelle), der Unterschied ist fuer die Darstellung belanglos.
- **Castor:** Bahn Note 3, CIA2022d [4]; C (YY Gem, 9 mag, 70'') gehoert zum System, entfaellt aber: zwei Sterne genuegen (A-Z9), und bei hoher Vergroesserung liegt C ausserhalb des Zoomfensters.
- **Porrima:** Bahn Note 2, Periode rund 169 Jahre, Periastron 2005 mit 0,4''; 2027 3,66'' und wachsend [4]. Zeigt, dass Paare ihre Trennung aendern (Hilfetext).
- **$\pi$ Aql:** WDS nennt den Spektraltyp "A3V+F9III", SIMBAD "G8III+A3V" [10]; die TDSC-Farben (heller Stern rot, 0,94; Begleiter weiss, 0,04) passen zu SIMBAD und zum Systemwert 0,546 [8]. Keine Bahn in ORB6, Trennung seit 1783 1,4'' [3].
- **52 Ari:** im TDSC nicht aufgeloest (Eintrag AB) [6]; beide Komponenten B7V, also gleicher Wert fuer beide (ber. aus $B_T - V_T$ = $-0{,}03$ des Systems; Hipparcos $-0{,}031$ [8]). Bahn Note 3 von 1981 (Hei1981a) [4]; die Ephemeride ist entsprechend unsicher (WDS 2024: 0,50'' [3]).
- **Antares:** $B-V$ von A ist der Hipparcos-Systemwert 1,865 [8] (BSC 1,83 [9]); B traegt bei 4,4 mag Unterschied weniger als 2 % zum Fluss bei. B nach SIMBAD $B$ = 5,0, $V$ = 5,2 mit Qualitaet E [10], also $-0{,}2$; der Spektraltyp B2,5V [10] passt dazu.
- **Polaris:** A-Farbe Hipparcos-Systemwert 0,636 [8] (Ab mit 0,2'' eingeschlossen). Fuer B gibt es drei Helligkeiten: WDS 9,10 [3], SIMBAD 8,20 (Lee 2008) [10], Usenko und Klochkova 2007 8,60 mit $B-V$ = 0,42 nach Turner 2005 [19]. Die Literatur ueber Polaris nennt meist 8,6 bis 8,7. Empfehlung: **8,6** (Usenko), nicht der WDS-Wert; Begruendung im Kommentar der Datei.

### 2.3 Begruendung je Paar

| Paar | Rolle | Was es zeigt |
|---|---|---|
| Albireo | leicht | Farbkontrast gelb gegen blau ($B-V$ 1,09 / $-0$,10) bei jeder Vergroesserung ab 20x; prueft A-P12 (Farbe aus B-V, Leuchtdichteschwelle) an hellen Sternen. Im 10x50: 34'' x 10 = 5,7' scheinbar, getrennt (ber.). |
| Mizar A-B | leicht | helles weisses Paar 14,4''; im 10x50 knapp (144'' scheinbar, gut 2' gegen die Augenaufloesung 1') (ber.), ab etwa 20x leicht. Bekanntestes Testpaar fuer Einsteiger. |
| $\gamma$ And | leicht, ungleich | 9,5'', $\Delta m$ 2,7, Farbkontrast orange gegen blauweiss; zeigt, dass ein grosser Abstand $\Delta m$ unwichtig macht. |
| Castor | mittel | sehr helles, fast gleiches Paar 5,8'', schon am 50-mm-Sucher bei 30x trennbar ($D_\mathrm{D}$ = 20 mm, ber.); Bahnpaar. |
| Porrima | mittel | gleich helles Paar 3,7'', Bahn mit schneller Aenderung in den letzten 20 Jahren. |
| $\zeta$ Aqr | mittel | fast gleiches Paar 2,5'' ($D_\mathrm{D}$ = 47 mm), Uebergang zum Seeing: bei 2'' Seeing im Langzeitmittel nicht getrennt (Abschnitt 4). |
| $\varepsilon^1$, $\varepsilon^2$ Lyr | mittel | der klassische Test (A-Z9, A-Q5): weites Paar 209'' fuer Auge und Fernglas, jede Komponente 2,0 bzw. 2,4'' fuer das Fernrohr. Senkrecht zueinander orientiert ($\theta$ 341 und 71 Grad). |
| $\pi$ Aql | Grenze 80 mm | 1,40'' knapp unter Dawes am 80 mm (1,45''), $\Delta m$ 0,4; Farbkontrast. |
| $\varepsilon$ Ari | Grenze 100 mm | 1,27'', fast gleich; am 80 mm nicht, am 100 mm (Dawes 1,16'') gerade. |
| 52 Ori | Grenze 120 bis 150 mm | 0,94'', gleich hell 6,0 mag, also genau Dawes' Bedingung; $D_\mathrm{D}$ = 123 mm (ber.). |
| 52 Ari | Grenze 200 mm | 0,56'', gleich hell; $D_\mathrm{D}$ = 208 mm, prueft die groessten Oeffnungen der Geraeteliste. |
| $\zeta$ Her | ungleich nahe Grenze | 1,54'', $\Delta m$ 2,45: als gleiches Paar am 75 mm trennbar, nach Haas erst ab etwa 150 mm, nach Lord 171 mm (ber.). Prueft, ob das Bildmodell die Verschlechterung fuer ungleiche Paare von selbst zeigt. Schnelle Bahn (34,5 Jahre, Note 1). |
| Antares | grosser $\Delta m$ | 2,58'', $\Delta m$ 4,44: loest den Hinweis "Ueberstrahlung nicht simuliert" aus; Farbkontrast rot gegen blau. Siehe 2.4. |
| Polaris | sehr grosser $\Delta m$, weit | 18,4'', $\Delta m$ 6,6: leicht trennbar, schwierig ist nur die Helligkeit des Begleiters; prueft Grenzgroesse (A-P11) und Blendungsregel (A-P6). |

Zusammen: 4 leichte, 5 mittlere (mit $\varepsilon$ Lyr als einem Objekt), 4 an der Aufloesungsgrenze, 2 mit grossem $\Delta m$, also 14 Objekte mit 16 Paaren.

### 2.4 Ausgeschlossen

| Paar | Daten [3] | Grund |
|---|---|---|
| Sirius A-B | AGC 1, 11,1'' (2024), $-1$,47 / 8,44, $\Delta m$ 9,9 | Sichtbarkeit haengt ganz an der Ueberstrahlung (A-Z9 nennt ihn). Ohne Blendung zeigt das Modell B in jedem Fernrohr. |
| Rigel A-BC | STF 668, 9,4'', 0,30 / 6,80, $\Delta m$ 6,5 | Ueberstrahlung entscheidet; ausserdem greift die Blendungsregel (A-P6, $\Delta m > 6$) unterhalb $V$ = 600/9,4 = 64-fach (ber.), am Fernrohr ist B aber schon bei 50x zu sehen. |
| $\delta$ Cyg | STF2579 AB, 2,82'' (E2027), 2,89 / 6,27, $\Delta m$ 3,4 | unter der 4-mag-Schwelle, aber bekannt schwierig, weil B im ersten Ring von A sitzt. Haas: 100 mm 2,4'' bei $\Delta m$ 3,5 [15], also im Prinzip am 100 mm trennbar. Moeglicher Ersatz fuer $\zeta$ Her, nicht beides. |
| 44 Boo, $\eta$ CrB | STF1909: 0,84'' (2026) bis 1,29'' (2029); STF1937 0,78 bis 0,96'' [4] | Trennung aendert sich so schnell, dass die Liste jaehrlich nachgefuehrt werden muesste. |
| $\lambda$ Cas, $\zeta$ Boo | um 0,2 bis 0,5'' [3] | unter der Aufloesung von 200 mm, mit 52 Ari ist die Grenze bereits abgedeckt. |
| $\gamma$ Del | STF2727, 8,74'' (E2027), 4,36 / 5,03, $B-V$ 1,04 / 0,49 (H, H) | gut, aber doppelt zu $\gamma$ And und Albireo; Ersatz, falls ein leichtes Farbpaar fehlt. |

**Antares und der 4-mag-Hinweis:** Antares bleibt sinnvoll. Das Modell ohne Blendung zeigt B (Abschnitt 4: am 150 mm erst bei Seeing $\le$ 0,75'') etwa dort, wo die Erfahrung ihn sieht (Haas $\Delta m$ 4: 150 mm 2,0'' [15]; Berichte: 4- bis 5-Zoll bei sehr ruhiger Luft [20]). Haas' Tabelle gilt fuer einen Hauptstern von 4,5 mag; Antares ist 3,5 mag heller, die Ueberstrahlung ist also staerker als in der Tabelle. Genau das sagt der Hinweis. Zweiter Grund, der fuer die Liste spricht: Antares steht von Mitteleuropa aus tief ($\delta = -26{,}4^\circ$, Kulmination in 50 Grad Breite bei 13,6 Grad, Luftmasse etwa 4,2 (ber., $1/\sin h$)); mit der Hoehe aus A-B4 zeigt astobsim, warum er hier selten getrennt wird. Polaris loest den Hinweis ebenfalls aus, B ist dort aber durch den Abstand trivial getrennt; der Hinweis sollte dort deshalb abhaengig vom Abstand sein (Abschnitt 7, Punkt 4).

---

## 3. Datenformat

### 3.1 Vorschlag

Doppelsterne folgen dem Muster der Trabanten (`monde[]` in `objekte.md` 6.2): ein Objekt mit `typ` "doppelstern" und genau einem Zustand, der die Sterne als Liste mit Lage und Helligkeit traegt. Damit kann bild die Sterne wie Trabanten in die Punktebene malen (physik.md 13.2, 14). Neue Felder:

- Objekt: `typ: "doppelstern"`; die Objektklasse (A-D18) folgt aus `typ` (mond, planet: Sonnensystem; doppelstern; deepsky).
- Zustand: `sterne[]` statt `monde[]`; keine `winkelgroesse_arcsec`, kein `bild`. `katalog[]` je Paar als Nachweis: `wds`, `komponenten`, `trennung_arcsec`, `positionswinkel_grad`, `epoche`, `quelle` (Text, z. B. "ORB6 Doc2020e, Ephemeride 2027,0").
- Stern: `name`, `dx_arcsec`, `dy_arcsec`, `magnitude` (V), `b_v`, `quelle_farbe` (Kuerzel wie in 2.2).
- Lage: Mitte des Paars im Ursprung, A bei $-\rho/2$, B bei $+\rho/2$ auf der x-Achse (Ost-West, A-Z9); `dy_arcsec` = 0. Der Positionswinkel steht nur im Nachweis (A-D12 ist Kann). `dx_arcsec` wiederholt die Trennung; das ist eine bewusste Ausnahme von "nichts doppelt speichern", denn `katalog` ist der Nachweis, `sterne` das Modell. Ein Unit-Test prueft $|dx_\mathrm{B} - dx_\mathrm{A}| = \rho$.
- Fuer $\varepsilon$ Lyr vier Sterne: die Paare in 209'' Abstand, $\varepsilon^1$ bei $x = -104{,}7''$, $\varepsilon^2$ bei $+104{,}7''$, jedes Unterpaar ebenfalls Ost-West (Abweichung von der Wirklichkeit: dort stehen die Paare fast Nord-Sued und die Unterpaare senkrecht zueinander).

Beispiel (Zahlen mit Punkt wie in der Datei):

```json
{
  "id": "zeta_her",
  "name": "Zeta Herculis",
  "typ": "doppelstern",
  "quelle_physik": "docs/recherche/doppelsterne.md",
  "zustaende": [
    {
      "id": "zeta_her_2027",
      "name": "Zeta Herculis (1,5\", 2,9 und 5,4 mag)",
      "katalog": [
        { "wds": "16413+3136", "komponenten": "STF2084", "trennung_arcsec": 1.542,
          "positionswinkel_grad": 72.2, "epoche": 2027.0,
          "quelle": "ORB6 Izm2019 (Note 1), Ephemeride 2027,0; Magnituden WDS" }
      ],
      "sterne": [
        { "name": "A", "dx_arcsec": -0.771, "dy_arcsec": 0, "magnitude": 2.95, "b_v": 0.61, "quelle_farbe": "TDSC" },
        { "name": "B", "dx_arcsec":  0.771, "dy_arcsec": 0, "magnitude": 5.40, "b_v": 0.77, "quelle_farbe": "TDSC" }
      ],
      "kommentar": "B-V aus TDSC (Fabricius et al. 2002) umgerechnet mit 0,850 (BT-VT), ESA 1997. Credit: ESA."
    }
  ]
}
```

### 3.2 Freies Paar

Ein Objekt `frei` mit `typ` "doppelstern" ohne Katalogeintrag; die Sterne entstehen aus den Eingaben (A-Z9, A-D18). Vorschlag fuer Grenzen und Vorgaben (die Grenzen sind eigene Wahl, Abschnitt 7):

| Eingabe | Vorgabe | Bereich | Schritt |
|---|---|---|---|
| Trennung | 2,0'' | 0,1 bis 600'' | 0,05'' unter 10'', sonst 1'' |
| Magnitude A | 5,0 | $-1{,}5$ bis 12 | 0,1 |
| Magnitude B | 6,0 | $-1{,}5$ bis 15 | 0,1 |
| B-V A, B | 0,6 | $-0{,}4$ bis 2,0 | 0,05 |

Die Vorgabe 0,6 (A-Z9) ist sonnenaehnlich (G0 bis G2; die Sonne hat $B-V$ = 0,65), also fast weiss. Die Obergrenze 600'' entspricht der Blendungsregel (10' scheinbar bei $V$ = 1); $-0{,}4$ bis 2,0 umfasst alle Sterne der Liste ($-0{,}10$ bis 1,87). Ein Stern A schwaecher als B ist erlaubt (dann ist "B" der Hauptstern; der Hinweis aus A-Z9 nimmt $|\Delta m|$).

---

## 4. Modellrechnung: Einsattelung im Langzeitbild

Eigene Rechnung (Python, numpy), um die Testfaelle vorab gegen das Modell aus physik.md 3.2 zu pruefen: Kern = Airy($D$, ohne Obstruktion) $\otimes$ Moffat(FWHM Seeing, $\beta$ = 4,765) $\otimes$ Gauss($60''/V$), Raster 0,02''. Zwei Kerne im Abstand $\rho$ mit Flussverhaeltnis $10^{-0{,}4\,\Delta m}$, Profil entlang der Verbindungslinie. Mass:

$$\delta = 1 - \frac{I_\mathrm{min}}{I_\mathrm{B}}$$

mit $I_\mathrm{min}$ dem Minimum zwischen den beiden Maxima und $I_\mathrm{B}$ dem Maximum beim Begleiter; $\delta$ = 0, wenn der Begleiter kein eigenes Maximum hat. Als Schwelle "getrennt" nehme ich wie fuer die Delle in `docs/validierung.md` 3 den Wert 0,125 (Annahme; die Schwelle dort ist fuer Flaechendetail abgeleitet). Seeing ist die FWHM in Zenitnaehe (keine Luftmasse), Vergroesserung $V = 2D$ (in mm) ausser wo angegeben.

| Paar ($\rho$, $\Delta m$) | $D$, $V$ | Seeing 0 | 0,5'' | 0,75'' | 1,0'' | 1,5'' | 2,0'' |
|---|---|---|---|---|---|---|---|
| $\varepsilon^1$ Lyr (2,01, 0,95) | 80, 100x | 0,201 | 0,089 | 0,011 | 0 | 0 | 0 |
| $\varepsilon^1$ Lyr | 80, 160x | 0,282 | 0,152 | 0,047 | 0 | 0 | 0 |
| $\varepsilon^2$ Lyr (2,42, 0,13) | 80, 100x | 0,668 | 0,569 | 0,467 | 0,352 | 0,138 | 0,012 |
| $\varepsilon^1$ Lyr | 150, 300x | 0,978 | 0,847 | | 0,393 | 0,006 | 0 |
| $\zeta$ Aqr (2,48, 0,15) | 80, 160x | 0,758 | 0,658 | | 0,429 | 0,191 | 0,032 |
| $\pi$ Aql (1,40, 0,41) | 80, 160x | 0 | 0 | 0 | 0 | 0 | 0 |
| $\pi$ Aql | 100, 200x | 0,124 | 0,019 | 0 | 0 | 0 | 0 |
| $\pi$ Aql | 150, 300x | 0,805 | 0,488 | | 0,043 | 0 | 0 |
| $\varepsilon$ Ari (1,27, 0,40) | 100, 200x | 0 | 0 | 0 | 0 | 0 | 0 |
| $\varepsilon$ Ari | 120, 240x | 0,265 | 0,075 | 0 | 0 | 0 | 0 |
| $\varepsilon$ Ari | 150, 300x | 0,685 | 0,351 | | 0 | 0 | 0 |
| 52 Ori (0,94, 0,04) | 150, 300x | 0,247 | 0,050 | | 0 | 0 | 0 |
| 52 Ori | 200, 400x | 0,700 | 0,265 | | 0 | 0 | 0 |
| 52 Ari (0,56, 0) | 200, 400x | 0,004 | 0 | | 0 | 0 | 0 |
| 52 Ari | 250, 500x | 0,249 | 0 | | | | |
| $\zeta$ Her (1,54, 2,45) | 100, 200x | 0,100 | 0 | | 0 | 0 | 0 |
| $\zeta$ Her | 150, 300x | 0,805 | 0,203 | 0 | 0 | 0 | 0 |
| $\zeta$ Her | 200, 300x | 0,912 | 0,433 | 0,025 | 0 | 0 | 0 |
| Antares (2,58, 4,44) | 100, 200x | 0,678 | 0,085 | 0 | 0 | 0 | 0 |
| Antares | 150, 200x | 0,876 | 0,532 | 0,202 | 0 | 0 | 0 |
| Antares | 200, 250x | 0,950 | 0,724 | 0,424 | 0,045 | 0 | 0 |
| $\delta$ Cyg (2,82, 3,38) | 100, 200x | 0,887 | 0,532 | | 0,049 | 0 | 0 |

Befunde:
1. **Im Langzeitmittel trennt das Modell Paare an der Dawes-Grenze nur bei Seeing $\lesssim$ 0,5''.** Schon $\varepsilon^1$ Lyr (1,4fach Dawes am 80 mm) braucht 0,5'' und mehr als 100x. Das ist dieselbe Lage wie bei der Cassini-Teilung (physik.md 15): Beobachter trennen enge Paare in den ruhigen Momenten, in denen die Bildbewegung herausfaellt (physik.md 2.3, 15.1); das Langzeitmittel (A-P5) enthaelt diese Bewegung. Dawes' Grenze stammt aus Beobachtungen "unter maessig guenstiger Luft" [14], also aus dem Momentan-Anblick. Fuer die Testfaelle folgt: entweder Seeing 0,5'' ("ausgezeichnet", physik.md 2.5) setzen oder den ruhigen Moment (A-B6) verwenden.
2. **Auch ohne Seeing liegt das Modell etwas hinter Dawes:** $\varepsilon$ Ari (1,09fach Dawes am 100 mm) und $\pi$ Aql (0,97fach Dawes am 80 mm) zeigen keinen zweiten Gipfel; noetig sind etwa 1,15- bis 1,2fach Dawes. Ursachen: Augen-Gauss (0,3'' bei 200x), $\Delta m$ 0,4 und die Schwelle 0,125. Dawes' geuebte Beobachter erkannten wenige Prozent Einsattelung (physik.md 1.2). Haas' Werte (etwa $120''/D$ [15]) passen zum Modell bei Seeing 0 besser als Dawes.
3. **Ungleiche Paare kommen ohne eigene Regel richtig heraus:** $\zeta$ Her ist am 100 mm nicht, am 150 mm bei 0,5'' getrennt, wie bei Haas (100 mm 2,0'', 150 mm 1,4'' fuer $\Delta m$ 2,5 [15]). Ein eigenes Kriterium (Treanor, Lord) braucht das Bild nicht; fuer die Zahlenanzeige (A-D4) kann man Lords Formel mit Quelle zeigen.

---

## 5. Empfehlung fuer astobsim

Liste fuer `daten/objekte.json` (14 Objekte, 16 Paare). Spalte "Hinweis": $|\Delta m| \ge 4$ zeigt "Ueberstrahlung nicht simuliert" (A-Z9); "Blendung": $V_\mathrm{grenz} = 600''/\rho$ nur bei $\Delta m > 6$, falls die Blendungsregel aus A-P6 auch fuer Sterne gilt (Abschnitt 7, Punkt 3). $D_\mathrm{D}$ und $D_\mathrm{R}$ (ber.) fuer gleich helle Paare; "noetig" fuer ungleiche Paare nach Haas [15] bzw. Lord [18] (ber.).

| id | Name | $\rho$ [''] | $\theta$ | Epoche | $V_\mathrm{A}$ | $V_\mathrm{B}$ | $B-V$ A | $B-V$ B | $D_\mathrm{D}$ / $D_\mathrm{R}$ [mm] | Hinweis |
|---|---|---|---|---|---|---|---|---|---|---|
| albireo | Albireo | 34,3 | 54 | 2025 | 3,19 | 4,68 | 1,09 | $-0$,10 | 3 / 4 | |
| mizar | Mizar | 14,4 | 153 | 2022 | 2,23 | 3,88 | 0,02 | 0,13 | 8 / 10 | |
| gamma_and | Gamma Andromedae | 9,5 | 63 | 2024 | 2,31 | 5,02 | 1,37 | 0,03 | 12 / 15 | |
| castor | Castor | 5,772 | 48,9 | 2027,0 | 1,93 | 2,97 | 0,03 | 0,04 | 20 / 24 | |
| porrima | Porrima | 3,664 | 350,0 | 2027,0 | 3,48 | 3,53 | 0,33 | 0,33 | 32 / 38 | |
| zeta_aqr | Zeta Aquarii | 2,481 | 150,0 | 2027,0 | 4,34 | 4,49 | 0,38 | 0,34 | 47 / 56 | |
| eps_lyr | Epsilon Lyrae: $\varepsilon^1$ | 2,011 | 341,4 | 2027,0 | 5,15 | 6,10 | 0,12 | 0,28 | 58 / 69 | |
| | $\varepsilon^2$ | 2,421 | 71,3 | 2027,0 | 5,25 | 5,38 | 0,16 | 0,21 | 48 / 57 | |
| | $\varepsilon^1$-$\varepsilon^2$ | 209,4 | 172 | 2021 | | | | | | |
| pi_aql | Pi Aquilae | 1,40 | 104 | 2021 | 6,34 | 6,75 | 0,94 | 0,04 | 83 / 99 | |
| eps_ari | Epsilon Arietis | 1,266 | 210,7 | 2027,0 | 5,17 | 5,57 | 0,05 | 0,04 | 92 / 109 | |
| 52_ori | 52 Orionis | 0,944 | 221,8 | 2027,0 | 5,99 | 6,03 | 0,27 | 0,16 | 123 / 146 | |
| 52_ari | 52 Arietis | 0,557 | 260,2 | 2027,0 | 6,21 | 6,19 | $-0$,03 | $-0$,03 | 208 / 248 | |
| zeta_her | Zeta Herculis | 1,542 | 72,2 | 2027,0 | 2,95 | 5,40 | 0,61 | 0,77 | noetig 150 (Haas) / 171 (Lord) | |
| antares | Antares | 2,579 | 276,7 | 2027,0 | 0,96 | 5,40 | 1,87 | $-0$,20 | noetig 100 bis 150 (Haas) / 171 (Lord) | ja ($\Delta m$ 4,44) |
| polaris | Polaris | 18,4 | 236 | 2016 | 2,04 | 8,60 | 0,64 | 0,42 | noetig 40 (Lord) | ja ($\Delta m$ 6,56); Blendung unter 33x |

- Die id `52_ori` und `52_ari` beginnen mit einer Ziffer; falls ids als Bezeichner dienen, `ori_52` und `ari_52`.
- Namen im UI aus `src/texte.ts` mit echten Umlauten und griechischen Buchstaben ("ε Lyrae"); die Datei bleibt ASCII.
- Polaris B mit 8,60 [19] statt WDS 9,10 (2.2).
- Danksagung im Fuss: WDS/USNO [1, 2], ORB6 [4], "Credit: ESA" fuer Hipparcos/Tycho [7, 12], CDS VizieR/SIMBAD [13], BSC [9].

---

## 6. Testfall-Vorschlaege (A-Q5)

Nummern vorlaeufig als TD1 bis TD4; die Nummern T7 bis T12 teilen sich Doppelsterne, Deep-Sky und Helligkeit, Herbert ordnet zu. Fuer alle: 45 Grad Hoehe (ausser TD3c), klar, Bortle 5, Urteil "getrennt" bei $\delta \ge$ 0,125 im Bild (Abschnitt 4, Annahme). Die Modellwerte stammen aus Abschnitt 4 ohne Luftmasse; bei 45 Grad wird das Seeing um $1{,}41^{0{,}6}$ = 1,23 breiter (ber., physik.md 3.2). Fuer die Faelle mit Seeing 0,5'' ist deshalb 0,4'' im Zenit gemeint, oder die Tests setzen 90 Grad.

**TD1: Epsilon Lyrae im Fernglas und am 80 mm.**
- Quellen: Fernglas trennt das weite Paar leicht, blosses Auge nur bei sehr guten Augen und klarer Nacht [21, 22, 23]; 60 mm reicht fuer beide Paare bei mittlerer bis hoher Vergroesserung [21], "hohe Vergroesserung und ruhige Luft" [23], ein gut justierter 6-Zoll zeigt beide sicher [22].
- (a) 10x50: zwei Sterne, jeder rund. Rechnung (ber.): 209'' x 10 = 35' scheinbar, $\delta$ = 1,0; $\varepsilon^1$ 2,0'' x 10 = 20'', ein Drittel der Augenaufloesung von 1', also punktfoermig.
- (b) 80 mm, 160x, Seeing 0,4'' im Zenit (bzw. 0,5'' bei 90 Grad): beide Paare getrennt ($\varepsilon^2$ $\delta$ = 0,6; $\varepsilon^1$ 0,15). Bei 100x ist $\varepsilon^1$ mit 0,09 knapp darunter; das passt zu "mittlere bis hohe Vergroesserung" [21].
- (c) 80 mm, 160x, Seeing 2'' (Voreinstellung): im Langzeitmittel keines der Paare getrennt ($\delta \le$ 0,012). Getrennt erst im ruhigen Moment (A-B6, Issue #29). Erwartung wie T2 (physik.md 15.3): die Erfahrung beschreibt den ruhigen Moment.
- Blosses Auge: das Modell trennt das weite Paar sicher (209'' = 3,5 Augen-FWHM), die Quellen nennen es einen Grenzfall [21, 23]. Kein Testfall, aber in Phase 6 ansehen (Abschnitt 7, Punkt 5).

**TD2: Paar an der Dawes-Grenze, 80 mm gegen 150 mm.**
- Quellen: Dawes 1867, 4,56''/Zoll fuer gleiche Paare um 6 mag [14] (80 mm: 1,45''); Haas, gleich helle Paare: 60 mm 2,0'', 100 mm 1,2'' [15] (fuer 80 mm interpoliert in $1/D$: 1,5'', ber.).
- (a) $\pi$ Aql (1,40'') am 80 mm, 160x, Seeing 0,5'' bei 90 Grad: nicht getrennt, laenglich ($\delta$ = 0). Literatur: unter beiden Grenzen, Grenzfall.
- (b) $\pi$ Aql am 150 mm, 300x, gleiches Seeing: getrennt ($\delta$ = 0,49). Literatur: Haas 0,8'' fuer 150 mm, also klar.
- (c) $\varepsilon$ Ari (1,27'') am 80 mm: nicht getrennt bei jedem Seeing; am 150 mm, 0,5'': getrennt ($\delta$ = 0,35).
- Keine Aussage am 100 mm fuer $\varepsilon$ Ari: Haas trennt dort (1,2''), das Modell nicht ($\delta$ = 0 selbst ohne Seeing), siehe Abschnitt 4, Befund 2. Herbert entscheidet, ob das so bleibt.

**TD3: Antares nur bei sehr ruhiger Luft.**
- Quellen: Haas $\Delta m$ 4: 100 mm 2,6'', 150 mm 2,0'' (Hauptstern 4,5 mag) [15]; Lord fuer $\Delta m$ 4,44: $n$ = 441, also 171 mm fuer 2,58'' (ber. aus [16, 18], lineare Interpolation zwischen 4 und 5 mag); Erfahrungsberichte: 4-Zoll-Refraktor "unter guenstigen Bedingungen", 5-Zoll-Newton "bei sehr ruhiger Luft nicht schwer" [20] (Forum, schwache Quelle).
- (a) 150 mm, 200x, Seeing 0,5'' bei 90 Grad: B getrennt ($\delta$ = 0,53), Infopanel zeigt "Ueberstrahlung nicht simuliert".
- (b) 150 mm, 200x, Seeing 1,5'': B nicht getrennt ($\delta$ = 0).
- (c) Hoehe 15 Grad (Mitteleuropa), Seeing 0,5'' im Zenit: Seeing im Bild $0{,}5 \cdot 3{,}86^{0{,}6}$ = 1,13'' ($X = 1/\sin 15^\circ$ = 3,86, ber.), B am 150 mm nicht getrennt (vgl. 1,0'' in Abschnitt 4: $\delta$ = 0).

**TD4 (optional): ungleiches Paar Zeta Herculis.**
- Quellen: Haas $\Delta m$ 2,5: 100 mm 2,0'', 150 mm 1,4'' [15]; Lord 171 mm (ber. [18]); Dawes fuer ein gleiches Paar 75 mm (ber.).
- (a) 100 mm, 200x, Seeing 0,5'' bei 90 Grad: nicht getrennt ($\delta$ = 0), obwohl 1,54'' weit ueber Dawes (1,16'') liegt.
- (b) 150 mm, 300x, gleiches Seeing: getrennt ($\delta$ = 0,20).
- Zeigt, dass das Bildmodell die Schwierigkeit ungleicher Paare ohne eigene Regel abbildet. Bahn: Trennung 2025 bis 2029 zwischen 1,56 und 1,46'' [4], der Test haengt nicht an der Epoche.

---

## 7. Unsicher oder zu pruefen

1. **Langzeitmittel gegen Momentan-Anblick:** Nach Abschnitt 4 trennt das Modell Paare an der Dawes-Grenze nur bei 0,5'' Seeing oder besser. Bei der Voreinstellung 2'' bleiben $\varepsilon^1$ und $\varepsilon^2$ Lyr am 80 mm ungetrennt, was jeder Beobachter anders kennt. Das ist folgerichtig nach A-P5 und physik.md 15, macht aber Doppelsterne zum staerksten Argument fuer den ruhigen Moment (A-B6, Kann). Vorschlag: A-B6 fuer Version 2 hochstufen oder im Hilfetext der Doppelsterne sagen, dass die Trennung im Langzeitmittel gezeigt wird.
2. **Schwelle 0,125 fuer "getrennt":** fuer Flaechendetail abgeleitet, fuer zwei Punkte ungeprueft. Dawes entspricht nach physik.md 1.2 wenigen Prozent Einsattelung; mit 0,05 wuerde das Modell naeher an Dawes und Haas liegen (Abschnitt 4, Befund 2). Am Bild in Phase 6 pruefen; die Testfaelle sind so gewaehlt, dass beide Schwellen dasselbe Urteil geben, ausser TD1(b) bei 100x.
3. **Blendungsregel fuer Sterne:** A-P6 nennt Punktquellen allgemein. Gilt sie fuer Doppelsterne, wird Polaris B unter 33x unterdrueckt (am 80 mm erst ab 33x sichtbar), Rigel B unter 64x. Bei Polaris passt das ungefaehr zur Erfahrung (B ist im kleinen Fernrohr bei niedriger Vergroesserung schwer), belegt habe ich es nicht. Entscheidung noetig: Regel fuer Sterne anwenden oder nur den Hinweis aus A-Z9 zeigen.
4. **Hinweis ab 4 mag und weite Paare:** Polaris loest den Hinweis aus, obwohl Ueberstrahlung bei 18'' kaum zaehlt. Vorschlag: Hinweis nur, wenn zusaetzlich $\rho$ kleiner als etwa Lords Grenze fuer das Geraet ist, sonst immer bei $|\Delta m| \ge 4$ (einfach, A-Z9 woertlich). Herbert entscheidet.
5. **Blosses Auge bei $\varepsilon$ Lyr:** 209'' gegen 1' Augenaufloesung (A-P2) trennt im Modell sicher, die Quellen nennen einen Grenzfall [21, 23]. Das Auge hat bei 4,6 mag Sternen ausserhalb der Fovea eher Staebchenaufloesung (physik.md 3.1: ueber 5'); A-P2 legt 1' fest. Kein Handlungsbedarf, aber Hilfetext.
6. **Epsilon Lyrae mit vier Sternen:** GLOSSARY.md definiert Doppelstern als "zwei Sterne". Vorschlag: Glossar ergaenzen ("zwei oder, bei Epsilon Lyrae, vier Sterne") oder $\varepsilon$ Lyr als zwei Objekte ($\varepsilon^1$, $\varepsilon^2$) plus Testfall TD1(a) mit dem freien Paar (209'', 4,7 und 4,6 mag). Ebenso die Ost-West-Lage aller Unterpaare (3.1).
7. **Sekundaere oder schwache Werte:** Antares B $B-V$ $-0{,}2$ (SIMBAD Qualitaet E, ohne Bibcode) [10]; Polaris B 8,60/0,42 aus einer Arbeit ueber Polaris [19], WDS 9,10 und SIMBAD 8,20 widersprechen; 52 Ari Bahn von 1981 (Note 3); die Umrechnung TDSC nach Johnson [7] habe ich aus der Erinnerung an ESA 1997 Bd. 1 uebernommen, nicht im PDF nachgeschlagen. Haas' Tabellen und Lords $n$-Werte stammen aus einer Zusammenstellung eines Amateurs [16], nicht aus Haas' Buch [15] oder Lords Berichten [18]; Treanors Seitenzahl (255 oder 265) ist unklar [17]. CDS-Lizenzangaben sekundaer (Seite nicht erreichbar) [13].
8. **Helligkeitsbezug der Sterne:** Die Punktebene braucht $h_\mathrm{rel}$ relativ zu Quellweiss (physik.md 13.1); Doppelsterne haben kein Quellbild. Vorschlag: fester Bezug $\mu_\mathrm{weiss}$ = 3,35 fuer alle Sternobjekte (dann $a$ = Faktor des Okulars wie in 14.2). Gehoert zur Helligkeitsrecherche (A-P13), hier nur genannt.
9. **Bahnpaare veralten:** Ephemeride 2027,0; bis 2030 aendert sich keine Trennung um mehr als 0,07'' ($\zeta$ Her: 1,56 auf 1,46'' bis 2029 [4]). Nach etwa 2032 die Liste mit ORB6 erneuern.

---

## 8. Kurzfassung der Rechnungen (ber.)

- $D_\mathrm{D} = 116/\rho$, $D_\mathrm{R} = 138/\rho$ fuer alle Paare in Abschnitt 5.
- Lord: $n(2{,}45) = 230{,}4 + 0{,}45 \cdot (303{,}5 - 230{,}4) = 263$, $\zeta$ Her $263/1{,}542 = 171$ mm; $n(4{,}44) = 392{,}8 + 0{,}44 \cdot (503{,}1 - 392{,}8) = 441$, Antares $441/2{,}579 = 171$ mm; $n(6{,}56) = 640{,}6 + 0{,}56 \cdot 172{,}0 = 737$, Polaris $737/18{,}4 = 40$ mm (berechnete $n$-Werte aus [16]).
- Blendungsregel: Polaris $600/18{,}4 = 32{,}6$-fach; Rigel $600/9{,}4 = 64$-fach.
- Luftmasse: $X = 1/\sin h$, Seeingfaktor $X^{0{,}6}$ (physik.md 3.2): 45 Grad 1,23; 15 Grad 2,25; Antares-Kulmination in 50 Grad Breite $90 - 50 - 26{,}4 = 13{,}6$ Grad.
- TDSC-Farben: $B-V = 0{,}850\,(B_T - V_T)$ mit den Werten aus [6]: $\varepsilon^1$ A 5,15/5,01, B 6,43/6,10; $\varepsilon^2$ C 5,44/5,25, D 5,63/5,38; $\pi$ Aql A 7,44/6,34, B 6,81/6,76; $\varepsilon$ Ari A 5,23/5,17, B 5,62/5,57; 52 Ori A 6,31/5,99, B 6,22/6,03; $\zeta$ Her A 3,67/2,95, B 6,31/5,40; $\zeta$ Aqr A 4,79/4,34, B 4,89/4,49; Porrima A 3,87/3,48, B 3,92/3,53; 52 Ari AB 5,43/5,46 (jeweils $B_T$/$V_T$).

---

## 9. Quellen

1. Mason, B. D., Wycoff, G. L., Hartkopf, W. I., Douglass, G. G., Worley, C. E.: "The 2001 US Naval Observatory Double Star CD-ROM. I. The Washington Double Star Catalog", AJ 122, 3466 (2001), https://doi.org/10.1086/323920
2. The Washington Double Star Catalog, Webseite (Stand 13.10.2026, Danksagungstext), https://www.astro.gsu.edu/wds/ (abgerufen 2026-10-29)
3. VizieR B/wds/wds, Washington Double Star Catalog (laufend aktualisiert), abgefragt 2026-10-29 ueber den Spiegel https://vizier.idia.ac.za/viz-bin/VizieR?-source=B/wds/wds
4. Hartkopf, W. I., Mason, B. D., Worley, C. E.: "The 2001 US Naval Observatory Double Star CD-ROM. II. The Fifth Catalog of Orbits of Visual Binary Stars", AJ 122, 3472 (2001), https://doi.org/10.1086/323921 ; Sixth Catalog of Orbits, Ephemeriden 2025,0 bis 2029,0, https://www.astro.gsu.edu/wds/orb6/orb6ephem.txt (abgerufen 2026-10-29; Bahn-Kuerzel wie Doc2020e, Izm2019, CIA2022d stehen dort)
5. Matson, R. A., Williams, S. J., Hartkopf, W. I., Mason, B. D.: Sixth Catalog of Orbits of Visual Binary Stars, Katalogseite mit Notenschema, https://www.astro.gsu.edu/wds/orb6.html (Stand 13.10.2026)
6. Fabricius, C., Hoeg, E., Makarov, V. V., Mason, B. D., Wycoff, G. L., Urban, S. E.: "The Tycho double star catalogue", A&A 384, 180 (2002); VizieR I/276, https://vizier.idia.ac.za/viz-bin/VizieR?-source=I/276
7. ESA: *The Hipparcos and Tycho Catalogues*, ESA SP-1200 (1997), Bd. 1, Abschn. 1.3 (Umrechnung Tycho nach Johnson), https://www.cosmos.esa.int/documents/532822/552851/vol1_all.pdf (Gleichung aus der Erinnerung, nicht nachgeschlagen)
8. ESA 1997, Hipparcos-Hauptkatalog, VizieR I/239/hip_main, https://vizier.idia.ac.za/viz-bin/VizieR?-source=I/239
9. Hoffleit, D., Warren, W. H.: *The Bright Star Catalogue*, 5. Aufl. (1991), VizieR V/50, https://vizier.idia.ac.za/viz-bin/VizieR?-source=V/50
10. SIMBAD (Wenger, M. et al., A&AS 143, 9 (2000)), Spiegel https://simbad.cfa.harvard.edu/simbad/ (Abfragen "Mizar B", "alf Sco B", "alf UMi B", "pi Aql", "52 Ari", "gam02 And", 2026-10-29)
11. data.gov, Eintrag "Washington Double Star Catalog" (License: U.S. Government Works, Access Level: public), https://catalog.data.gov/dataset/washington-double-star-catalog
12. ESA Cosmos, "The Hipparcos and Tycho Catalogues" (Lizenz CC BY-NC 3.0 IGO, "Credit: ESA"), https://www.cosmos.esa.int/web/hipparcos/catalogues
13. CDS, General Terms and Conditions, https://cds.unistra.fr/legals/ , und Acknowledgement, https://cds.unistra.fr/help/acknowledgement (nicht erreichbar, Inhalt aus der Suchzusammenfassung)
14. Dawes, W. R.: MNRAS 27, 217 (1867), wie physik.md [3], https://articles.adsabs.harvard.edu/pdf/1867MNRAS..27..217D
15. Haas, S.: *Double Stars for Small Telescopes*, Sky Publishing 2006, S. 5 bis 6, Tabellen der Aufloesungsgrenze nach $\Delta m$ (nicht eingesehen, zitiert nach [16])
16. Fisher, K. (vermutlich, Seite ohne Autornamen): "Limits for splitting double stars", https://fisherka.csolutionshosting.net/astronote/astromath/ueb/Unequalbinaries.html (Zusammenstellung von Haas 2006, Lord 1979/1994, Treanor 1946, Peterson 1954)
17. Treanor, P. J.: "On the Telescopic Resolution of Unequal Binaries", The Observatory 66, 255 (1946) (Seitenzahl in [16] uneinheitlich; nicht eingesehen)
18. Lord, C.: "Contrast & Definition" (1979) und "A Report on the Analysis of the Telescopic Resolution of Unequal Binaries" (1994), Brayebrook Observatory (nicht eingesehen, nach [16])
19. Usenko, I. A., Klochkova, V. G.: "Polaris B, an optical companion of the Polaris (alpha UMi) system: atmospheric parameters, chemical composition, distance and mass", arXiv:0708.0333 (2007), https://arxiv.org/abs/0708.0333 (V = 8,60, B-V = 0,42 nach Turner 2005; Autorenliste aus der Erinnerung)
20. IceInSpace-Forum, Beitraege zu Antares B (4-Zoll-Refraktor, 5-Zoll-Newton bei ruhiger Luft), https://www.iceinspace.com.au/forum/showthread.php?p=132015 und https://www.iceinspace.com.au/forum/showthread.php?p=1568608 (nur ueber die Suchzusammenfassung, nicht geoeffnet)
21. Armstrong, M.: "The Double Double: Detach Lyra's multiple-star gem", Astronomy Now, 13.06.2022, https://astronomynow.com/2022/06/13/the-double-double-detach-lyras-multiple-star-gem/
22. Lawrence, P.: "A guide to star Epsilon Lyrae, the Double Double", BBC Sky at Night Magazine, 30.08.2022 (zuerst Juli 2017), https://www.skyatnightmagazine.com/advice/epsilon-lyrae
23. Jodrell Bank Centre for Astrophysics, Explore Astronomy, "Lyra" (Hrsg. I. Morison, Stand 2008), https://www.jb.man.ac.uk/astronomy/nightsky/AList/Lyra.html
