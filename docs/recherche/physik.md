# Recherche Physik: Beugung, Seeing, Auge, Helligkeit

**Auftrag:** Physikalische Grundlagen fuer das Modell von astobsim belegen (Phase 2 nach `docs/prozess.md`). Grundlage ist `docs/anforderungen.md`, Abschnitte 3, 4, 5, 8 und 9.
**Datum:** 2026-10-23
**Zugeordnete Kennungen:** A-P1 bis A-P6 (Abschnitt 12: A-P4, A-P9, Issue #55), A-B1 bis A-B4, A-D4, A-D5, A-Q1. Offene Fragen 4, 5, 6, 7 aus Abschnitt 9.
**Konventionen:** Wellenlaenge $\lambda = 550\,\mathrm{nm}$ (photopisches Maximum, Mond und Planeten sind hell genug fuer Zapfensehen). $D$ Oeffnung, $\epsilon = d/D$ lineares Obstruktionsverhaeltnis, $V$ Vergroesserung, $X$ Luftmasse, $1\,\mathrm{rad} = 206\,265''$. Quellen stehen in eckigen Klammern und sind am Ende nummeriert. Werte, die ich selbst numerisch nachgerechnet habe, sind als "eigene Rechnung" markiert; die Skripte liegen nicht im Repo.

---

## 1. Beugung

### 1.1 Airy-Scheibchen

Intensitaetsverteilung einer kreisfoermigen Oeffnung im Fokus [1, Kap. 8.5.2]:

$$I(\theta) = I_0 \left[\frac{2 J_1(v)}{v}\right]^2, \qquad v = \frac{\pi D \sin\theta}{\lambda}$$

- Erstes Minimum bei $v = 3{,}8317$, also $\theta_1 = 1{,}2197\,\lambda/D$ (ueblich: $1{,}22\,\lambda/D$) [1].
- Energieanteil innerhalb des ersten Minimums: 83,8 % [1, Kap. 8.5.2]; eigene Rechnung: 0,838. Weitere 7,2 % im ersten Ring, Rest aussen.
- Halbwertsbreite (FWHM) des Airy-Kerns: $1{,}03\,\lambda/D$ (eigene Rechnung: 1,029; gleiche Zahl bei Sacek [8]). Fuer die Kombination mit dem Seeing (Abschnitt 2.5) ist die FWHM die passende Groesse, nicht der Radius des ersten Minimums.
- Zweites Minimum bei $v = 7{,}0156$, der zweiten Nullstelle von $J_1$ [51, Tabelle 9.5], also $\theta_2 = 2{,}233\,\lambda/D$ [1, Kap. 8.5.2]. Mit Obstruktion rueckt das erste Minimum nach innen (Tabelle 1.4, nach [7, 8]); fuer das zweite gilt laut Mahajan [7] dasselbe, hier nicht einzeln nachgerechnet. Eingeschlossene Energie innerhalb $v$ [1, Kap. 8.5.2]: $L(v) = 1 - J_0^2(v) - J_1^2(v)$, also 0,838 im Scheibchen, 0,910 innerhalb des zweiten Minimums, 0,938 innerhalb des dritten. Die Fluegel konvergieren langsam ($L \approx 1 - 2/(\pi v)$): ein auf $3{,}1\,\lambda/D$ (3 Airy-FWHM) abgeschnittener Kern enthaelt nur etwa 94 % der Energie (eigene Rechnung, Issue #4). Nach Normierung auf Summe 1 liest man aus einem solchen Kern deshalb etwa 0,89 statt 0,838 im Scheibchen ab; testbar bleibt das Verhaeltnis Scheibchen zu zweitem Minimum, $0{,}838 / 0{,}910 = 0{,}921$.

In Bogensekunden bei 550 nm, $D$ in mm:

$$\theta_1 = 1{,}22 \cdot \frac{550 \cdot 10^{-9}}{D/1000} \cdot 206\,265'' = \frac{138{,}4''}{D_\mathrm{mm}}, \qquad \mathrm{FWHM}_\mathrm{Airy} = \frac{116{,}8''}{D_\mathrm{mm}}$$

### 1.2 Rayleigh-, Dawes- und Sparrow-Grenze

| Kriterium | Definition | Formel ($\lambda$ = 550 nm) | Herkunft |
|---|---|---|---|
| Rayleigh | Maximum des einen Sterns liegt im ersten Minimum des anderen; Einsattelung ca. 26 % | $\theta_R = 1{,}22\,\lambda/D = 138/D_\mathrm{mm}$ Bogensekunden | Lord Rayleigh 1879, Phil. Mag. [2]; ausdruecklich als Vergleichsmass fuer Instrumente gedacht, nicht als physikalische Grenze |
| Dawes | Empirisch: 1-Zoll-Oeffnung trennt zwei Sterne 6. Groesse bei 4,56'' Abstand "unter maessig guenstiger Luft" | $\theta_D = 4{,}56''/D_\mathrm{Zoll} = 115{,}8''/D_\mathrm{mm} \approx 116/D_\mathrm{mm}$ | Dawes 1867, MNRAS 27, 217 [3]; Wortlaut zitiert in S&T 9/2016 [3] |
| Sparrow | Einsattelung zwischen den Maxima verschwindet gerade | $\theta_S \approx 0{,}95\,\lambda/D \approx 107''/D_\mathrm{mm}$ | Sparrow 1916, ApJ 44, 76 [4] |

Dawes ist 0,84 Rayleigh. Bei diesem Abstand betraegt die Einsattelung nur noch wenige Prozent (Sacek gibt bei Abstand $\lambda/D$ ca. 1,7 % Intensitaetseinbruch an [9]); Dawes' Wert gilt fuer gleich helle Paare um 6 mag und ist fuer ungleiche oder sehr helle Paare nicht uebertragbar [3]. Fuer die Anzeige (A-D4) sind beide Zahlen informativ; fuer das Bildmodell ist keines der Kriterien noetig, dort zaehlt die MTF.

### 1.3 MTF der Kreisoeffnung ohne und mit Obstruktion

Die MTF ist die normierte Autokorrelation der Pupillenfunktion [6, Kap. 10/11; 9]. Grenzfrequenz $f_c = D/\lambda$ (Perioden pro Radian), unabhaengig von der Obstruktion [9]. Mit $\nu = f/f_c$:

Ohne Obstruktion (geschlossen):

$$T(\nu) = \frac{2}{\pi}\left[\arccos\nu - \nu\sqrt{1-\nu^2}\right], \quad 0 \le \nu \le 1$$

Mit Obstruktion: geschlossene, abschnittsweise Formel bei O'Neill 1956 [5]; sie ist unhandlich (drei Bereiche, Fallunterscheidungen nach $\epsilon$). **Rezept fuer die numerische Berechnung** (eigene Rechnung, in Phase 3 direkt umsetzbar):

1. Pupillenmaske $P(x,y) = 1$ fuer $\epsilon R \le r \le R$, sonst 0, auf einem Raster von z. B. $1024^2$ mit $R \approx 200$ Pixel.
2. Autokorrelation $A = P \star P$ (ueber FFT: $A = \mathcal{F}^{-1}\{|\mathcal{F}\{P\}|^2\}$), normiert auf $A(0) = 1$.
3. Radiales Profil; die Pixelkoordinate $2R$ entspricht $\nu = 1$.

Kontrollwert: $T(0{,}5) = 0{,}391$ (analytisch 0,3910, FFT 0,3910).

**Rezept B, geschlossen (in astobsim umgesetzt, `src/physik/beugung.ts`):** Die Autokorrelation der Ringpupille ist die Ueberlappungsflaeche zweier um $d$ verschobener Ringe. Mit $R = 1$, $d = 2\nu$ und der Linsenflaeche $L(r_1, r_2, d)$ zweier Kreise [52] gilt

$$T(\nu) = \frac{L(1,1,d) - 2\,L(1,\epsilon,d) + L(\epsilon,\epsilon,d)}{\pi\,(1-\epsilon^2)}, \qquad L(r_1,r_2,d) = r_1^2 \arccos\frac{a}{r_1} - a\sqrt{r_1^2-a^2} + r_2^2 \arccos\frac{b}{r_2} - b\sqrt{r_2^2-b^2}$$

mit $a = (d^2 + r_1^2 - r_2^2)/2d$, $b = (d^2 + r_2^2 - r_1^2)/2d$; fuer $d \ge r_1 + r_2$ ist $L = 0$, fuer $d \le |r_1 - r_2|$ ist $L = \pi \min(r_1,r_2)^2$. Fuer $\epsilon = 0$ ergibt das genau die geschlossene Formel oben (0,39100 bei $\nu$ = 0,5); gegen die FFT-Tabelle stimmt es auf 0,003 (eigene Rechnung: $\epsilon$ = 0,33 bei $\nu$ = 0,35 liefert 0,393 gegen frei 0,564, Verhaeltnis 0,697). Das FFT-Rezept bleibt als Kontrolle.

Ergebnis fuer verschiedene Obstruktionen (eigene Rechnung; die letzten beiden Spalten sind unobstruierte Oeffnungen mit Durchmesser $D(1-\epsilon)$, in Einheiten der Grenzfrequenz der vollen Oeffnung):

| $\nu = f/f_c$ | frei | $\epsilon$ = 0,20 | 0,25 | 0,30 | 0,33 | 0,40 | frei, $0{,}67\,D$ | frei, $0{,}75\,D$ |
|---|---|---|---|---|---|---|---|---|
| 0,05 | 0,936 | 0,921 | 0,915 | 0,909 | 0,905 | 0,894 | 0,905 | 0,915 |
| 0,10 | 0,873 | 0,842 | 0,832 | 0,819 | 0,811 | 0,789 | 0,811 | 0,831 |
| 0,15 | 0,810 | 0,766 | 0,750 | 0,731 | 0,718 | 0,685 | 0,717 | 0,747 |
| 0,20 | 0,747 | 0,695 | 0,671 | 0,645 | 0,628 | 0,583 | 0,626 | 0,665 |
| 0,25 | 0,685 | 0,630 | 0,598 | 0,563 | 0,541 | 0,484 | 0,536 | 0,584 |
| 0,30 | 0,624 | 0,567 | 0,532 | 0,488 | 0,460 | 0,389 | 0,450 | 0,505 |
| 0,40 | 0,505 | 0,442 | 0,413 | 0,382 | 0,361 | 0,307 | 0,288 | 0,355 |
| 0,50 | 0,391 | 0,367 | 0,354 | 0,337 | 0,325 | 0,291 | 0,147 | 0,219 |
| 0,60 | 0,285 | 0,296 | 0,298 | 0,294 | 0,289 | 0,274 | 0,040 | 0,104 |
| 0,70 | 0,188 | 0,196 | 0,201 | 0,207 | 0,211 | 0,224 | 0 | 0,020 |
| 0,80 | 0,104 | 0,108 | 0,111 | 0,114 | 0,117 | 0,124 | 0 | 0 |
| 0,90 | 0,037 | 0,039 | 0,040 | 0,041 | 0,042 | 0,044 | 0 | 0 |

Groesster relativer Kontrastverlust gegenueber der freien Oeffnung (eigene Rechnung): $\epsilon$ = 0,20: Faktor 0,88 bei $\nu \approx 0{,}41$; 0,25: 0,82 bei 0,39; 0,30: 0,75 bei 0,36; 0,33: 0,70 bei 0,35; 0,40: 0,59 bei 0,36. Das deckt sich mit Sacek: staerkster Einbruch "um 1/3 der normierten Frequenz", oberhalb von etwa 0,6 liegt die obstruierte Oeffnung sogar leicht ueber der freien [8, 9].

### 1.4 Energie im Airy-Kern je Obstruktion

Spitzenintensitaet relativ zur freien Oeffnung gleichen Durchmessers: $(1-\epsilon^2)^2$; Lichtverlust durch Abschattung: $(1-\epsilon^2)$ [8]. Energieanteil innerhalb des ersten Minimums (Tabelle 10 bei Sacek nach Mahajan [7, 8]; eigene Rechnung identisch bis auf Rundung):

| $\epsilon$ | 0 | 0,10 | 0,20 | 0,25 | 0,30 | 0,33 | 0,40 | 0,50 |
|---|---|---|---|---|---|---|---|---|
| Energie im Kern | 0,838 | 0,818 | 0,764 | 0,726 | 0,682 | 0,655 | 0,584 | 0,479 |
| Radius 1. Minimum in $\lambda/D$ | 1,220 | | 1,167 | 1,142 | 1,115 | 1,098 | 1,058 | 1,001 |

Faustformel nach Sacek: verlorener Kernanteil $\approx 2\epsilon^2$ bis $\epsilon \approx 0{,}4$ [8]. S&T-Errata 2023 nennen fuer 33 % Obstruktion 65 % im Kern [12], passt.

**Rechenweg in astobsim** (`energieImAiryKern`, eigene Rechnung): Amplitude der Ringoeffnung $A(v) = [2J_1(v)/v - \epsilon^2\,2J_1(\epsilon v)/(\epsilon v)]/(1-\epsilon^2)$ (Abschnitt 9, [1, 7]), erste Nullstelle $v_1$ per Bisektion in $(2{,}5;\ 3{,}9)$, dann Simpson-Integral $\int_0^{v_1} A(v)^2\, v\, dv$ mit 2000 Schritten, geteilt durch die Gesamtenergie $2/(1-\epsilon^2)$. Die Gesamtenergie folgt aus Parseval: sie ist proportional zur Pupillenflaeche $(1-\epsilon^2)$, die Spitze proportional $(1-\epsilon^2)^2$ [8], und fuer $\epsilon = 0$ ist $\int_0^\infty (2J_1(v)/v)^2\, v\, dv = 2$ [1, Kap. 8.5.2]. Ergebnis 0,8378 / 0,7638 / 0,6824 / 0,5843 fuer $\epsilon$ = 0 / 0,2 / 0,3 / 0,4, Nullstellen 1,2197 / 1,1665 / 1,1145 / 1,0577 $\lambda/D$, wie die Tabelle. $J_1$ nach Abramowitz-Stegun 9.4.4 und 9.4.6 [51], Fehler unter $1{,}3 \cdot 10^{-8}$.

### 1.5 Daumenregel "Obstruktion $\epsilon$ wirkt wie Oeffnung $D(1-\epsilon)$"

Herkunft: William Zmek, Sky & Telescope Juli und September 1993 ("Rules of Thumb for Planetary Scopes") [10]; S&T fasst sein Ergebnis so zusammen, dass ein obstruiertes Fernrohr bei kontrastarmem Detail wie ein etwas kleineres unobstruiertes arbeitet [10]. Thierry Legault formuliert sie als $D_\mathrm{eff} = D - d$ fuer Kontrast und Schaerfe, daneben $\sqrt{D^2-d^2}$ fuer die Lichtsammlung [11]. Sacek haelt die Regel fuer "weitgehend Spekulation" [8]; Suiter wird haeufig als weitere Quelle genannt, das habe ich nicht am Buch geprueft [13].

**Gueltigkeitsgrenzen aus der MTF-Tabelle oben (eigene Rechnung):** Fuer $\nu \le 0{,}3$ stimmt die MTF der obstruierten Oeffnung mit der freien Oeffnung $D(1-\epsilon)$ auf 0,01 ueberein (Spalten $\epsilon$ = 0,33 und "frei, 0,67 D" sowie 0,25 und "frei, 0,75 D"). Ab $\nu \approx 0{,}4$ weichen sie auseinander: die obstruierte Oeffnung behaelt die volle Grenzfrequenz und ist bei feinem, kontrastreichem Detail (Doppelsterne, Mondrillen) besser als die verkleinerte freie. Die Regel gilt also fuer niedrige und mittlere Ortsfrequenzen, d. h. fuer flaechige, kontrastarme Planetendetails, nicht fuer die Aufloesungsgrenze. Fuer astobsim ist sie entbehrlich, weil die MTF direkt gerechnet wird; als Hilfetext ist sie brauchbar.

---

## 2. Seeing

### 2.1 Fried-Parameter und Langzeit-PSF

Fried-Parameter [14; Definition zitiert nach 22]:

$$r_0 = \left[0{,}423\,k^2 \sec z \int C_n^2(h)\,dh\right]^{-3/5}, \quad k = 2\pi/\lambda$$

Daraus folgen die Skalierungen $r_0 \propto \lambda^{6/5}$ und $r_0 \propto (\cos z)^{3/5} = X^{-3/5}$ (plan-parallel; Tokovinin: "it is well known that $r_0 \propto \lambda^{6/5}$ and $\epsilon_0 \propto \lambda^{-1/5}$" [16, Gl. 5]).

Langzeit-OTF der Atmosphaere nach Kolmogorov (Roddier 1981 [15], hier nach Tokovinin [16, Gl. 15, 16]):

$$D_\phi(r) = 6{,}88\,(r/r_0)^{5/3}, \qquad T_0(f) = \exp\left[-\tfrac{1}{2} D_\phi(\lambda f)\right] = \exp\left[-3{,}44\,(\lambda f/r_0)^{5/3}\right]$$

mit $f$ in Perioden pro Radian. Die PSF ist die Fouriertransformierte davon; es gibt keine geschlossene Form [16]. Halbwertsbreite [16, Gl. 5]:

$$\mathrm{FWHM}_\mathrm{seeing} = \epsilon_0 = 0{,}98\,\frac{\lambda}{r_0}$$

(manche Arbeiten schreiben 0,976; Rundungskonvention). Halbenergie-Durchmesser $1{,}15\,\lambda/r_0$ [16, Gl. 17]. Zahlen bei 550 nm: $r_0$ = 10 cm ergibt 1,11''; 2'' Seeing entspricht $r_0$ = 5,6 cm, 1'' entspricht 11,1 cm (eigene Rechnung). Sacek nennt fuer 2'' rund 70 mm, fuer 1'' 144 mm [20]; die Differenz kommt von seinem Faktor $\lambda/r_0$ ohne 0,98 und anderer Rundung. Tokovinin empfiehlt, Seeing immer bei 500 nm und im Zenit anzugeben und von dort umzurechnen [16].

Skalierung mit der Hoehe: $\mathrm{FWHM}(X) = \mathrm{FWHM}_\mathrm{Zenit}\cdot X^{3/5}$ [16; 22]. Bei 45 Grad Hoehe Faktor 1,23, bei 30 Grad 1,51, bei 10 Grad 2,81 (eigene Rechnung mit Kasten-Young-Luftmasse, Abschnitt 5.3).

Aeussere Skala $L_0$: Tokovinin zeigt, dass eine endliche $L_0$ (typisch 20 m) die FWHM in grossen Teleskopen um 10 bis 20 % verkleinert, Formel $(\epsilon_{vK}/\epsilon_0)^2 \approx 1 - 2{,}183\,(r_0/L_0)^{0{,}356}$ [16, Gl. 19]. Bei $r_0$ = 5 bis 10 cm und $L_0$ = 20 m sind das 12 bis 16 % weniger FWHM. Fuer astobsim ohne Belang, weil der Nutzer die FWHM direkt eingibt (A-B1); erwaehnt, damit man Seeing-Monitor-Werte (DIMM, Kolmogorov-Konvention) richtig einordnet.

### 2.2 PSF-Formen: Gauss, Moffat, Kolmogorov

| Form | Formel | Fluegel | Bewertung |
|---|---|---|---|
| Gauss | $\exp(-r^2/2\sigma^2)$, FWHM $= 2{,}355\,\sigma$ | fallen exponentiell, viel zu schwach | Kern brauchbar, Fluegel falsch [17; Robo-AO-Vergleich in 24] |
| Moffat | $I_0\,[1+(r/\alpha)^2]^{-\beta}$, FWHM $= 2\alpha\sqrt{2^{1/\beta}-1}$ [19] | Potenzgesetz $r^{-2\beta}$ | $\beta \approx 4{,}765$ ist die beste Anpassung an die Kolmogorov-Langzeit-PSF [18]; $\beta \to \infty$ ergibt Gauss |
| Kolmogorov | nur numerisch (FT von $T_0$) | $r^{-11/3}$, Varianz divergiert | exakt im Rahmen der Theorie; Racine findet gute Uebereinstimmung mit Beobachtungen, zusaetzlich eine Aureole durch Streuung [17] |

**Empfehlung:** Fuer eine Faltung im Browser ist Moffat mit $\beta = 4{,}765$ die richtige Wahl, wenn man im Ortsraum faltet (analytischer Kern, endliche Energie, realistische Fluegel, 2 bis 4 FWHM Kernradius genuegen). Rechnet man im Frequenzraum (FFT), nimmt man direkt $T_0(f)$, dann braucht man gar keine Naeherung. Gauss nur als Augen-PSF (Abschnitt 3).

### 2.3 Langzeit gegen Kurzzeit, Bildbewegung bei kleinen Oeffnungen

Fried 1966 [14]: Kurzzeit-Aufloesung kann deutlich besser sein als Langzeit, weil die Bildbewegung (Tilt) herausfaellt. Varianz der Bildbewegung einer Achse fuer die volle Oeffnung (Fried 1965, zitiert nach [21]):

$$\sigma_\alpha^2 = 0{,}182\,\lambda^2\,D^{-1/3}\,r_0^{-5/3} = 0{,}182\,(D/r_0)^{5/3}\,(\lambda/D)^2$$

Zahlen bei 550 nm, 2'' Seeing ($r_0$ = 5,6 cm), eigene Rechnung: 60 mm: $\sigma$ = 0,94'' (mit 2,355 $\sigma$ = 2,2'' praktisch die ganze Langzeit-FWHM); 100 mm: 0,86''; 200 mm: 0,77''; 300 mm: 0,72''. Bei $D/r_0 \lesssim 1$ besteht die Langzeit-PSF also fast nur aus Bewegung des weitgehend intakten Beugungsbilds; Sacek: Speckle-Struktur ab $D/r_0 \approx 3$, deutlich ab 4; Tilt "nicht schaedlich" unterhalb von etwa 100 mm Oeffnung [20]. Umgekehrt heisst das: der *Langzeit*-Anblick (A-P5) eines 80-mm-Refraktors bei 2'' Seeing ist eine verschmierte Scheibe mit FWHM $\approx$ 2,5'' (Abschnitt 2.5), der *Momentan*-Anblick ist ein zitterndes, aber scharfes Bild. Beides ist richtig, astobsim zeigt per A-P5 den Langzeitfall. Fuer den Kann-Punkt A-B6 ("ruhiger Moment") bietet sich an, die Bewegungsvarianz quadratisch abzuziehen: $\mathrm{FWHM}_\mathrm{kurz}^2 \approx \mathrm{FWHM}_\mathrm{lang}^2 - (2{,}355\,\sigma_\alpha)^2$, begrenzt nach unten durch die Beugung. Das ist eine Heuristik (Tokovinin benutzt dieselbe Idee fuer die aeussere Skala [16]), keine Theorie. Zahlen dazu fuer Validierung T2 (Cassini-Teilung) in Abschnitt 15.

Fuer $D/r_0 \gg 1$ ist auch die Kurzzeit-PSF ein Speckle-Haufen mit Huelle $\approx \lambda/r_0$; Fried [14] gibt fuer die Kurzzeit-OTF $\exp[-3{,}44(\lambda f/r_0)^{5/3}(1-(\lambda f/D)^{1/3})]$ an (zitiert nach [24]). Testfall T4 (300 mm gegen 100 mm bei 3'' und 1'') ist mit dem Langzeitmodell abgedeckt: bei 3'' ($r_0$ = 3,7 cm) liegt die Gesamt-FWHM fuer beide bei etwa 3,1 bis 3,2'', bei 1'' ($r_0$ = 11 cm) bei 1,07'' gegen 1,54''.

### 2.4 Kombination Beugung + Seeing

Exakt: PSF$_\mathrm{gesamt}$ = PSF$_\mathrm{Teleskop}$ $\otimes$ PSF$_\mathrm{Seeing}$, im Frequenzraum $T_\mathrm{gesamt}(f) = T_\mathrm{Pupille}(f)\cdot T_0(f)$ [15, 16]. Das gilt fuer den Langzeitfall unabhaengig von $D/r_0$.

Naeherung $\mathrm{FWHM}_\mathrm{gesamt} \approx \sqrt{\mathrm{FWHM}_\mathrm{Airy}^2 + \mathrm{FWHM}_\mathrm{seeing}^2}$: exakt nur fuer zwei Gaussfunktionen, in der Praxis ueblich (Rubin: Systemanteil 0,39'' quadratisch addiert [24]). Eigene Rechnung, 2D-Faltung Airy $\otimes$ Moffat($\beta$ = 4,765):

| $D$ | Seeing | FWHM Airy | Faltung | Quadratur | Fehler |
|---|---|---|---|---|---|
| 80 mm | 0,5'' | 1,46'' | 1,55'' | 1,54'' | 0,3 % |
| 80 mm | 1,0'' | 1,46'' | 1,78'' | 1,77'' | 0,7 % |
| 80 mm | 2,0'' | 1,46'' | 2,52'' | 2,48'' | 1,8 % |
| 200 mm | 1,0'' | 0,58'' | 1,19'' | 1,16'' | 2,4 % |
| 200 mm | 2,0'' | 0,58'' | 2,15'' | 2,08'' | 3,0 % |
| 300 mm | 2,0'' | 0,39'' | 2,09'' | 2,04'' | 2,5 % |

Die Quadratur unterschaetzt die FWHM um hoechstens 3 %; fuer die Anzeige "welche Grenze dominiert" (A-D4) reicht sie, fuer das Bild soll die echte Faltung bzw. das MTF-Produkt verwendet werden.

### 2.5 Wortstufen, Pickering, Antoniadi

**Pickering-Skala** (1 bis 10, entwickelt an einem 5-Zoll-Refraktor; Beschreibung nach S&T [23] und Peach [23], gekuerzt): 1: Sternbild etwa doppelter Durchmesser des 3. Beugungsrings (13''). 2: gelegentlich so gross. 3: Bild etwa Durchmesser des 3. Rings (6,7''), zur Mitte heller. 4: Airy-Scheibchen oft sichtbar, Ringbogen zeitweise. 5: Scheibchen immer sichtbar, Bogen haeufig. 6: Scheibchen immer, kurze Bogen staendig. 7: Scheibchen zeitweise scharf, Ringe als lange Bogen oder geschlossen. 8: Scheibchen staendig scharf, Ringe in Bewegung. 9: innerer Ring ruhig. 10: ganzes Beugungsbild ruhig. S&T: 1 bis 3 sehr schlecht, 4 bis 5 schlecht, 6 bis 7 gut, 8 bis 10 ausgezeichnet [23]; S&T weist darauf hin, dass die Ring-Beschreibungen fuer andere Oeffnungen angepasst werden muessen.

**Antoniadi-Skala** (I bis V) [25]: I perfekt ohne Zittern; II leichte Wallungen, ruhige Momente von mehreren Sekunden; III maessig, groessere Luftunruhe; IV schlecht, staendige stoerende Wallungen; V sehr schlecht, selbst grobe Skizze unmoeglich.

**Zuordnung zu FWHM:** Keine der Skalen ist als FWHM definiert. Es gibt aeltere Skalen, die Bilddurchmesser nennen: Mt.-Wilson-Skala (Michelson 1922): Stufe 1 = 3 bis 5'', 2 = 2'', 3 = 1'', 4 < 1'', 5 = 0,6 bis 0,7'' [26]; Tombaugh/Smith 1958: Stufe 0 = 7,9'', 1 = 5,0'', 2 = 3,2'', 3 = 2,0'', 4 = 1,3'', 5 = 0,79'' [26]; Environment Canada ordnet fuer 6 Zoll Oeffnung zu: V < 0,8'', IV 0,8 bis 2,0'', III 2,0 bis 5,0'', II 5 bis 8'', I > 8'' (dort ist V das beste) [26]. "Bilddurchmesser" bedeutet in diesen Skalen den sichtbaren Gesamtdurchmesser, grob das Doppelte der FWHM [32, Abschn. 1.6.2].

Eigene Ableitung fuer Pickering am 5-Zoll (127 mm, $\lambda/D$ = 0,89''), mit Sacek's Aussage, dass das zentrale Maximum unterhalb $D/r_0 \approx 3$ wieder "Integritaet gewinnt" [20]: Stufen 4 bis 5 (Scheibchen sichtbar, Ringe in Fetzen) entsprechen $D/r_0 \approx 2$ bis 3, also $r_0$ = 4 bis 6 cm, FWHM 1,9 bis 2,8''; Stufen 6 bis 7 $D/r_0 \approx 1{,}5$ bis 2, FWHM 1,3 bis 1,9''; Stufen 8 bis 10 $D/r_0 \lesssim 1{,}3$, FWHM < 1,2''; Stufe 3 (Bild = 3. Ring, 6,7'') FWHM etwa 3 bis 4''; Stufen 1 bis 2 (13'') FWHM ab etwa 5''.

Vorschlag fuer A-B1 (weich, Begruendung oben; Wortstufen nach Anforderung):

| FWHM (Zenit, 550 nm) | Wortstufe | Pickering | Antoniadi |
|---|---|---|---|
| < 1,0'' | ausgezeichnet | 8 bis 10 | I |
| 1,0 bis 2,0'' | gut | 6 bis 7 | II |
| 2,0 bis 3,0'' | mittel | 4 bis 5 | III |
| 3,0 bis 5,0'' | schlecht | 1 bis 3 | IV bis V |

Typische Werte: Profi-Standorte unter 1'' [27]; Amateure meist 2 bis 5'' [27]; Sacek nennt 2'' als "durchschnittlich" [20]; AstroBin-Forum (informell): < 1,5'' ausgezeichnet, 1,5 bis 2,5'' gut, 2,5 bis 4'' maessig, > 4'' sehr schlecht [27]. Voreinstellung 2'' (A-D9) liegt damit an der Grenze gut/mittel, was fuer einen mitteleuropaeischen Durchschnittsabend plausibel ist.

---

## 3. Auge

### 3.1 Aufloesung

- Hochkontrast-Punktaufloesung (Doppelsterntest): etwa 1 Bogenminute; Snellen 20/20 ist so definiert (Buchstabe 5', Strichbreite 1') [28]. Gitteraufloesung typisch 2', Buchstaben 5' [28].
- Beugung und Aberrationen des Auges: bei 2 mm Pupille FWHM 0,6 bis 0,7' im Labor, praktisch "1' bestenfalls, meist etwas mehr"; Staebchen ueber 5' [30]. Blackwells "kritischer Sehwinkel" in hellem Licht etwa 0,7' [29, Clark 1990 nach Blackwell 1946].
- Kontrastabhaengigkeit: Kontrastempfindlichkeitsfunktion nach Campbell & Robson 1968 [31]: Maximum bei 3 bis 5 Perioden/Grad, Grenzfrequenz etwa 60 Perioden/Grad (= 0,5' Strichbreite) bei vollem Kontrast; bei niedrigem Kontrast sinkt die Grenzfrequenz stark. Klinische Messung: zwischen 90 % und 8 % Buchstabenkontrast verschlechtert sich die Sehschaerfe um etwa 2,5 logMAR-Zeilen [33], das ist Faktor $10^{0{,}25} \approx 1{,}8$, also von 1' auf rund 1,8' bei 8 % Kontrast; bei 5 % entsprechend 2 bis 3'.
- Leuchtdichte: Sehschaerfe faellt bei abnehmender Leuchtdichte; Shlaer 1937 hat das gemessen [34]; bei Planeten im Okular (photopisch bis mesopisch) ist der Effekt klein, bei sehr kleiner Austrittspupille relevant. Nicht modellieren (A-P9).

**Umrechnung auf das Objekt:** Ein Augenwinkel $\theta_\mathrm{Auge}$ entspricht am Objekt $\theta_\mathrm{Auge}/V$. Mit 1' und $V$ = 100 sind das 0,6''. Fuer A-P2 ist 1' festgelegt; der Hilfetext sollte sagen, dass kontrastarmes Planetendetail eher 2 bis 3' braucht, weshalb Beobachter mit mehr Vergroesserung arbeiten, als die Beugung verlangt.

### 3.2 Vorschlag Gesamt-PSF auf dem Objekt

Alle drei Grenzen als Winkel am Objekt:

$$\mathrm{FWHM}_\mathrm{Airy} = \frac{116{,}8''}{D_\mathrm{mm}}\ (\text{obstruiert: schmaler, Energie in Ringen}),\quad \mathrm{FWHM}_\mathrm{seeing} = \mathrm{FWHM}_0\,X^{3/5},\quad \mathrm{FWHM}_\mathrm{Auge} = \frac{60''}{V}$$

Bild: $T_\mathrm{gesamt}(f) = T_\mathrm{Pupille}(f; D, \epsilon) \cdot T_0(f; r_0) \cdot T_\mathrm{Auge}(f; V)$ mit $T_\mathrm{Auge}$ als Gauss mit FWHM $60''/V$. Alternativ im Ortsraum: Kern = Airy($D,\epsilon$) $\otimes$ Moffat(FWHM$_\mathrm{seeing}$, 4,765) $\otimes$ Gauss(60''/V). Anzeige "dominierende Grenze": die groesste der drei FWHM; Gesamt-FWHM als Quadratur fuer die Zahl, nicht fuers Bild.

Das Auge als Gauss-PSF ist eine grobe Vereinfachung (das Auge ist eher ein Kontrast-Schwellenfilter als ein Tiefpass), reicht aber fuer A-P2.

---

## 4. Optikgroessen

| Groesse | Formel | Quelle |
|---|---|---|
| Vergroesserung | $V = f_\mathrm{obj}/f_\mathrm{ok}$ | [35] |
| Austrittspupille | $AP = D/V = f_\mathrm{ok}/N$ mit $N = f_\mathrm{obj}/D$ | [35] |
| Wahres Gesichtsfeld, einfach | $wGF \approx sGF/V$ | [36]; Fehler einige Prozent, weil $sGF$ nominell ist und die Okularverzeichnung eingeht |
| Wahres Gesichtsfeld, genau | $wGF = 57{,}3^\circ \cdot d_\mathrm{Feldblende}/f_\mathrm{obj}$ | [36]; Feldblende meist nur von wenigen Herstellern angegeben |
| Minimale sinnvolle Vergroesserung | $V_\mathrm{min} = D/AP_\mathrm{max}$, $AP_\mathrm{max}$ = 6 bis 7 mm | [35, 32] |
| Maximale sinnvolle Vergroesserung | $V_\mathrm{max} \approx 2\,D_\mathrm{mm}$ (50x pro Zoll), d. h. $AP$ = 0,5 mm | Thompson 1940er nach [35]; Jacobs et al. 1992: unter 0,5 mm dominiert die Beugung des Auges [33 in 32] |

Begruendung der 2x-Regel: Bei $V = 2 D_\mathrm{mm}$ erscheint der Airy-Durchmesser $276''/D_\mathrm{mm}$ unter $2 D \cdot 276''/D = 552'' = 9{,}2'$, die Rayleigh-Distanz unter 4,6'. Beides liegt weit ueber der Augenaufloesung, selbst der kontrastarmen (2 bis 3'); die Beugungsstruktur ist also vollstaendig "ausvergroessert", mehr bringt nur ein dunkleres, groesseres Bild. Sacek: Aufloesungsgrenze praktisch bei etwa 50x/Zoll erreicht, bis 70x/Zoll kleine Gewinne [35]. Schon bei $V \approx 0{,}5 D$ (AP 2 mm) erreicht die Rayleigh-Distanz 1,15' und ist fuer das Auge trennbar; kontrastarmes Detail braucht nach Abschnitt 3 das Zwei- bis Dreifache, also $V \approx 1$ bis $1{,}5 D$. Das stuetzt die Warnschwellen in A-D5 (6 mm, 0,5 mm, $2D$).

Die Obstruktion macht das Airy-Scheibchen etwas schmaler (Tabelle 1.4); an der 2x-Regel und den Schwellen in A-D5 aendert das nichts Merkliches.

---

## 5. Helligkeit

### 5.1 Flaechenhelligkeit am Okular

Fuer ausgedehnte Objekte gilt (Tousey & Hulburt 1948, nach Crumey [32, Gl. 66]):

$$B_\mathrm{Okular} = \left(\frac{\min(AP, p)}{p}\right)^2 \frac{B}{F_t}$$

mit $p$ Augenpupille (astobsim: 6 mm fest), $F_t^{-1}$ Transmission. Fuer $AP \ge p$ ist der Faktor 1: kein Fernrohr zeigt eine Flaeche heller als das blosse Auge, das Ueberschussbuendel wird an der Iris abgeschnitten [37]. In Magnituden: $\Delta m = 5 \log_{10}(p/AP) + 2{,}5 \log_{10} F_t$ fuer $AP < p$.

### 5.2 Transmission typischer Optiken

- Aluminium-Spiegel, geschuetzt: 82 bis 92 % bei 550 nm [38]; "enhanced" 93 bis 94 % [38]; Crumey leitet aus Bowens Daten 85 % pro Spiegel ab, Maximum 89 % [32, Abschn. 3.2].
- Verguetete Glas-Luft-Flaeche: etwa 1 % Verlust; unverguetet etwa 4 bis 5 % [32].
- Crumey rechnet in Beispielen mit 95 % (Refraktor), 85 % (10x50-Fernglas), 75 % (Reflektor) [32, Fig. 18]; fuer die allgemeine Grenzgroessenformel 75 % [32, Gl. 73].

Vorschlag fuer die Bauarten (einschliesslich Okular und Zenitspiegel/-prisma, Groessenordnung, nicht gemessen): Refraktor 0,90; Newton 0,80 (zwei Spiegel $0{,}88^2 = 0{,}77$ plus Okular, bei besseren Schichten etwas mehr); Schmidt-Cassegrain und Maksutov 0,80 (zwei Spiegel plus Korrektor, bei hochwertigen Schichten um 0,85, Herstellerangaben nennen bis 89 % [38]); Fernglas 0,85; blosses Auge 1,0. Der Lichtverlust durch die Obstruktion $(1-\epsilon^2)$ kommt bei Newton, SC und Mak hinzu (33 %: Faktor 0,89).

### 5.3 Luftmasse

Kasten & Young 1989 [39], Hoehe $h$ in Grad:

$$X(h) = \frac{1}{\sin h + 0{,}50572\,(h + 6{,}07995)^{-1{,}6364}}$$

Hardie 1962 [40] mit $s = \sec z$: $X = s - 0{,}0018167(s-1) - 0{,}002875(s-1)^2 - 0{,}0008083(s-1)^3$, brauchbar bis etwa 85 Grad Zenitdistanz. Plan-parallel $X = 1/\cos z$ ist bis etwa 60 bis 75 Grad Zenitdistanz brauchbar [41]. Vergleich (eigene Rechnung):

| Hoehe | Kasten-Young | Hardie | $1/\cos z$ | Fehler $1/\cos z$ |
|---|---|---|---|---|
| 90 | 0,9997 | 1,0000 | 1,0000 | 0,03 % |
| 60 | 1,1540 | 1,1543 | 1,1547 | 0,06 % |
| 45 | 1,4126 | 1,4129 | 1,4142 | 0,11 % |
| 30 | 1,9943 | 1,9945 | 2,0000 | 0,29 % |
| 20 | 2,9031 | 2,9039 | 2,9238 | 0,71 % |
| 10 | 5,5860 | 5,5979 | 5,7588 | 3,1 % |

Im Bereich 10 bis 90 Grad (A-B4) waere $1/\cos z$ ausreichend; Kasten-Young kostet nichts und wird empfohlen (Standard in pvlib u. a.). Kasten-Young liefert im Zenit 0,9997 statt 1; fuer Tests den Wert mit Toleranz pruefen oder auf 1 normieren.

### 5.4 Extinktionskoeffizient

Green 1992 [42] (ICQ-Standardverfahren, Werte fuer 510 nm, Meereshoehe $h_\mathrm{km}$):

- Rayleigh: $A_\mathrm{Ray} = 0{,}1451\,\exp(-h_\mathrm{km}/7{,}996)$ mag/Luftmasse.
- Ozon: 0,016 mag/Luftmasse.
- Aerosol: $A_\mathrm{aer} = 0{,}120\,\exp(-h_\mathrm{km}/1{,}5)$ als Mittelwert; trockener Winter 0,084, feuchter Sommer 0,156 (A0 = 0,035 bzw. 0,065 statt 0,05).
- Summe Meereshoehe, Mittel: $k \approx 0{,}28$; Green zitiert Schaefer: 0,15 am Cerro Tololo (2,2 km), 0,30 fuer einen Ost-US-Standort auf Meereshoehe; "durchschnittliche Nacht auf einem Berg oder gute Nacht an trockenem Meeresstandort" 0,20; in feuchtem Klima 0,25 / 0,3 / 0,4 fuer gute / durchschnittliche / schlechte Naechte [42, nach Schaefer 1985, 1987].
- Visuelle Extinktion "grob 0,2 mag pro Luftmasse" [42, nach Schaefer 1985]. Schaefer 1993 [43] habe ich nicht im Volltext; die Werte oben stammen aus seinen frueheren Arbeiten ueber Green.

Vorschlag fuer A-B3 (Mitteleuropa, geringe Hoehe): klar $k$ = 0,20, leicht diesig 0,30, diesig 0,45 mag/Luftmasse. Abschwaechung $10^{-0{,}4\,k\,X}$. Beispiele mit $k$ = 0,25: 45 Grad 0,35 mag, 30 Grad 0,50 mag, 10 Grad 1,40 mag (eigene Rechnung). Der "leichte Kontrastverlust" aus A-B3 ist physikalisch Vorwaertsstreuung des Objektlichts in einen Hof; eine einfache Heuristik ist, einen Anteil $s$ des Objektlichts gleichmaessig ueber das Gesichtsfeld zu verteilen ($s$ = 0 / 0,03 / 0,08), belegen kann ich das nicht (siehe Abschnitt 10).

---

## 6. Himmelshintergrund

### 6.1 Bortle-Stufe zu Flaechenhelligkeit

Bortle 2001 [44] definiert die Klassen ueber visuelle Merkmale und Grenzgroesse (NELM), nicht ueber mag/arcsec$^2$. Die verbreitete SQM-Spalte stammt von Dark Skies Awareness (Nomogramm) und ist in Wikipedia uebernommen [45]:

| Bortle | Bezeichnung | NELM (Bortle) | mag/arcsec$^2$ (DSA) | Vorschlag astobsim |
|---|---|---|---|---|
| 1 | ausgezeichneter Dunkelhimmel | 7,6 bis 8,0 | 21,76 bis 22,0 | 21,9 |
| 2 | typischer dunkler Standort | 7,1 bis 7,5 | 21,6 bis 21,75 | 21,7 |
| 3 | laendlich | 6,6 bis 7,0 | 21,3 bis 21,6 | 21,4 |
| 4 | laendlich/vorstaedtisch | 6,3 bis 6,5 | 20,8 bis 21,3 | 21,0 |
| 5 | vorstaedtisch | 5,6 bis 6,0 | 19,25 bis 20,3 | 20,0 |
| 6 | helle Vorstadt | 5,1 bis 5,5 | 18,5 bis 19,25 | 19,0 |
| 7 | Vorstadt/Stadt | 4,6 bis 5,0 | 18,0 bis 18,5 | 18,3 |
| 8 | Stadt | 4,1 bis 4,5 | < 18,0 | 17,5 |
| 9 | Innenstadt | <= 4,0 | (nicht angegeben) | 17,0 |

Crumey [32]: dunkelster natuerlicher Zenithimmel etwa 22,0 mag/arcsec$^2$, "repraesentativ dunkel" 21,83; Bortle ueberschaetze die Leistung des typischen Beobachters (NELM ueber 7 ist selten), und die Skala sei "interessant, aber problematisch" [32, 46]. Stadthimmel bei Wien 15 bis 19,25 [32]. Die Stufen 8 und 9 sind daher Schaetzwerte (16 bis 18).

### 6.2 Hintergrund im Okular

Mit Abschnitt 5.1: $\mu_\mathrm{Okular} = \mu_\mathrm{Himmel} + 5\log_{10}(p/AP) + 2{,}5\log_{10} F_t$ fuer $AP < p$, sonst $\mu_\mathrm{Himmel} + 2{,}5\log_{10}F_t$. Beispiel Bortle 8 (17,5), 80 mm bei 100x (AP 0,8 mm): $17{,}5 + 5\log(7{,}5) = 17{,}5 + 4{,}4 = 21{,}9$, also dunkler als ein Bortle-1-Himmel mit blossem Auge. Bei 10x50 (AP 5 mm) nur +0,4 mag. Das Okularfeld wird bei planetarischen Vergroesserungen immer tief dunkelgrau; Crumey setzt unterhalb $10^{-5}$ cd/m$^2$ (etwa 25 mag/arcsec$^2$) eine Nullhintergrund-Grenze [32, Gl. 70].

### 6.3 Kontrast bei hellen Objekten

Flaechenhelligkeiten (eigene Rechnung aus Magnitude und Scheibchenflaeche): Vollmond ca. 3,4 mag/arcsec$^2$; Jupiter (−2,5 mag, 45'') ca. 5,5; Mars (−1 mag, 14'') ca. 4,5; Saturn-Scheibe ca. 6,5 bis 7. Gegen einen Himmel von 17 bis 22 mag/arcsec$^2$ sind das 11 bis 18 mag, Faktor $10^4$ bis $10^7$. Der Weber-Kontrast der Planetenscheibe gegen den Hintergrund aendert sich durch Bortle praktisch nicht; Bortle wirkt in Version 1 nur auf den Grauton des Felds und auf schwache Punktquellen (Monde 4,6 bis 10 mag) bei grosser Austrittspupille (Fernglas, blosses Auge). Das deckt sich mit A-B2 ("volle Wirkung erst mit Deep-Sky"). Fuer das Bild empfiehlt sich: Hintergrundpegel aus $\mu_\mathrm{Okular}$, Objekt additiv darueber.

---

## 7. Punktquellen (A-P6)

- **Erscheinung eines Sterns:** Beugungsbild mit Durchmesser $276''/D_\mathrm{mm}$ (erstes Minimum), gefaltet mit der Seeing-PSF, gefaltet mit dem Auge. Scheinbarer Winkel im Auge $V \cdot \mathrm{FWHM}_\mathrm{gesamt}$. Das Airy-Scheibchen wird als Scheibchen wahrgenommen, wenn sein scheinbarer Durchmesser 1 bis 2' erreicht: $V \gtrsim 0{,}22$ bis $0{,}43\,D_\mathrm{mm}$ (AP 4,6 bis 2,3 mm), bei gutem Seeing; bei $D/r_0 \gtrsim 3$ ist stattdessen ein Seeing-Scheibchen mit FWHM $\approx 0{,}98\lambda/r_0$ zu sehen [20]. Pickering-Stufen 4 bis 10 beschreiben genau diesen Uebergang (Abschnitt 2.5).
- **Helligkeit:** Punktquellenfluss $\propto 10^{-0{,}4 m}\,D^2\,(1-\epsilon^2)\,F_t^{-1}\,10^{-0{,}4 k X}$; im Bild als Gesamtenergie des PSF-Kerns, Spitzenwert $\propto$ Fluss / Flaeche der PSF (helle Sterne werden im Seeing nicht groesser, nur die sichtbaren Fluegel reichen weiter).
- **Visuelle Grenzgroesse:** einfache Form $m_\mathrm{lim} = N + 5\log_{10} D_\mathrm{cm}$ mit $N$ in der Literatur zwischen 6,8 und 8,7 [32, Gl. 64 nach Garstang 2000]; Crumey leitet mit 75 % Transmission, 7 mm Pupille, Feldfaktor $F$ = 2 ab: $m_\mathrm{lim} = 5\log_{10}D_\mathrm{cm} + 8{,}45 - 2{,}5\log_{10}F = 7{,}69 + 5\log_{10}D_\mathrm{cm}$ [32, Gl. 73], gueltig im dunklen Himmel und ohne Vergroesserungsabhaengigkeit; die vollstaendige Form mit Himmel und Austrittspupille ist Gl. 69 bei Crumey; Schaefer 1990 [47] ist das aeltere, komplexere Modell. Fuer astobsim genuegt $7{,}7 + 5\log_{10} D_\mathrm{cm}$ als Hinweis ("Galileische Monde 4,6 bis 5,6 mag sind in jedem Fernglas sichtbar"), fuer das Bild ist die Formel nicht noetig.
- **Mondscheibchen statt Punkt:** Ganymed 1,7 bis 1,8'' [48]. Ein Scheibchen ist sinnvoll vom Punkt unterscheidbar, wenn sein Durchmesser etwa die Gesamt-FWHM erreicht (eigenes Kriterium): 150 mm, 1'' Seeing: FWHM$_\mathrm{gesamt}$ = $\sqrt{0{,}78^2+1^2}$ = 1,27'', Ganymed 1,7'' leicht aufgeloest; 80 mm: 1,77'', punktfoermig. Astronomy.com: ab 6 Zoll bei gutem Seeing zeigen sich die Scheibchen aller vier Monde [48]. Empfehlung: Monde immer als Scheibe mit Winkeldurchmesser rendern und mit derselben PSF falten; kleine Scheiben werden automatisch zu Punkten, es braucht keine Fallunterscheidung (A-P6 "bei grossen Oeffnungen als kleine Scheibchen" ergibt sich von selbst).

---

## 8. Testwerte fuer Unit-Tests (A-Q1)

Alle mit $\lambda$ = 550 nm, 1 rad = 206 264,8''.

| Test | Rechenweg | Ergebnis |
|---|---|---|
| Rayleigh 100 mm | $1{,}22 \cdot 550\cdot10^{-9} / 0{,}100 \cdot 206\,265$ | 1,384'' (mit 138/D: 1,38) |
| Dawes 100 mm | $4{,}56 \cdot 25{,}4 / 100$ | 1,158'' (mit 116/D: 1,16) |
| Airy-Radius 200 mm | $1{,}22 \cdot 550\cdot10^{-9} / 0{,}200 \cdot 206\,265$ | 0,692'' |
| Airy-FWHM 200 mm | $1{,}029 \cdot 550\cdot10^{-9} / 0{,}200 \cdot 206\,265$ | 0,584'' |
| Austrittspupille 80 mm, f 560 mm, Okular 10 mm | $V = 56$, $AP = 80/56$ | 1,4286 mm |
| Luftmasse 45 Grad (Kasten-Young) | $1/(\sin 45^\circ + 0{,}50572\,(51{,}07995)^{-1{,}6364})$ | 1,4126 |
| Luftmasse 30 Grad (Kasten-Young) | $1/(\sin 30^\circ + 0{,}50572\,(36{,}07995)^{-1{,}6364})$ | 1,9943 |
| Luftmasse 90 Grad (Kasten-Young) | | 0,9997 (Toleranz!) |
| FWHM bei $r_0$ = 10 cm | $0{,}98 \cdot 550\cdot10^{-9} / 0{,}10 \cdot 206\,265$ | 1,112'' |
| $r_0$ fuer 2'' Seeing | $0{,}98 \lambda / (2/206\,265)$ | 5,56 cm |
| Seeing-Faktor 30 Grad Hoehe | $1{,}9943^{0{,}6}$ | 1,513 |
| Extinktion $k$ = 0,25, 30 Grad | $0{,}25 \cdot 1{,}9943$ | 0,499 mag, Faktor 0,632; mit den Stufen klar / leicht diesig / diesig (0,20 / 0,30 / 0,45): 0,3989 / 0,5983 / 0,8974 mag |
| MTF frei bei $\nu$ = 0,5 | $\frac{2}{\pi}[\arccos 0{,}5 - 0{,}5\sqrt{0{,}75}]$ | 0,3910 |
| MTF $\epsilon$ = 0,33 bei $\nu$ = 0,35 | numerisch | 0,70 $\times$ MTF frei (0,41 gegen 0,565), Toleranz 2 % |
| Energie im Airy-Kern | $\epsilon$ = 0 / 0,2 / 0,3 / 0,4 | 0,838 / 0,764 / 0,682 / 0,584 |
| Flaechenhelligkeit Okular | AP 0,8 mm, p 6 mm | Faktor 0,01778, +4,375 mag |
| $V_\mathrm{min}$, $V_\mathrm{max}$ 200 mm | $200/6$, $2 \cdot 200$ | 33x, 400x |
| Quadratur 80 mm, 2'' | $\sqrt{1{,}459^2 + 2^2}$ | 2,476'' (echte Faltung 2,52'') |
| Bessel $J_1$ | $J_1(1)$, $J_1(2)$, $J_1(5)$, $J_1(10)$ nach [51], Tabelle 9.1 | 0,4400506 / 0,5767248 / -0,3275791 / 0,0434727; erste Nullstelle 3,8317 |
| Airy-Nullstelle $\epsilon$ = 0,33 | Tabelle 1.4 | 1,098 $\lambda/D$ (Intensitaet dort unter $10^{-4}$) |
| MTF-Tabelle 1.3 | $\epsilon$ = 0,2 bei $\nu$ = 0,3; $\epsilon$ = 0,4 bei $\nu$ = 0,7 | 0,567; 0,224 (Toleranz 0,005) |
| Kern-FWHM 80 mm, 2'' (Issue #4) | `baueKern` ohne Augenanteil, Massstab 0,25''/px, FWHM aus dem radialen Profil | 2,52'' (Tabelle 2.4; Toleranz 1 %; bei 2,5 px je FWHM liest man wegen der Pixelintegration 2,65'') |
| Airy-Kern aus `baueKern`, $\epsilon$ = 0 | Energie innerhalb 1,22 $\lambda/D$ geteilt durch Energie innerhalb 2,233 $\lambda/D$ | 0,838 / 0,910 = 0,921 (Toleranz 1 %) |
| MTF des Airy-Kerns aus `baueKern` | `kontrastUebertragung` bei $\nu$ = 0,9 und $\nu \ge 1$, $\epsilon$ = 0 und 0,33, Kern 75 px (zweifach) und 41 px (vierfach ueberabgetastet) | gleich `mtfPupille`(0,9; $\epsilon$), Toleranz 0,003; unter 0,01 ab $\nu$ = 1 |
| Obstruktion im Airy-Kern | `kontrastUebertragung`($\epsilon$ = 0,33) / `kontrastUebertragung`($\epsilon$ = 0) bei $\nu$ = 0,35 | gleich `mtfPupille`(0,35; 0,33) / `mtfPupille`(0,35; 0) = 0,70, Toleranz 0,05 (abgeschnittene Fluegel heben niedrige Frequenzen an) |
| Sub-Pixel-Kern | 3'' Gesamt-FWHM bei 70''/px | Groesse 5, Mitte > 0,999, Summe 1 |
| Anzeige der Leuchtdichte (Issue #55) | $w(\mu) = \min(1, 10^{-0{,}4(\mu - 3{,}35)/3})$ | Tabelle 12.4 (A-D9: 0,3248; Fernglas 10x50: 0,7692; 80 mm bei 200x: 0,1456) |
| Trabanten (Issue #14) | $\mu = m + 2{,}5\log_{10}(\pi d^2/4)$, relativ $10^{-0{,}4(\mu - \mu_\mathrm{weiss})}$ | Tabelle 13.4 (Io 5,1336 mag/arcsec$^2$, 1,1656; Rhea 6,2274, 1,4094) |

### 8.1 Testhelfer profilDelle (Issue #21)

Die Tabellen-Tests der Validierung (`src/physik/validierung.test.ts`, `docs/validierung.md`) fragen, ob eine Struktur nach der Faltung noch als Delle im Helligkeitsverlauf steht. Ein Stufenprofil $p(x)$ quer zur Struktur (stueckweise konstant, aussen ein Grundwert) wird mit der Linienbildfunktion des Kerns gefaltet; das Bild einer in $y$ ausgedehnten Struktur ist die eindimensionale Faltung mit der LSF [61]:

$$\mathrm{LSF}(x) = \int \mathrm{PSF}(x, y)\,dy, \qquad g(x) = (p * \mathrm{LSF})(x).$$

Im diskreten Kern ist die LSF die Spaltensumme; jeder Arbeitspixel zaehlt als Kasten seiner Breite, $g$ wird in Achtelpixeln abgetastet. Die Delle eines lokalen Minimums an $x_0$ ist

$$\delta = 1 - \frac{g(x_0)}{\min(\max_{x<x_0} g,\ \max_{x>x_0} g)},$$

gesucht nur in einem vom Aufrufer genannten Bereich (der flache Himmel neben einer Scheibe waere sonst eine Delle). Ohne lokales Minimum ist $\delta = 0$. Sonderfall: ein dunkler Balken der Breite $b$ mit Objektkontrast $C$ in gleichmaessiger Umgebung gibt $\delta = C \int_{-b/2}^{b/2} \mathrm{LSF}\,dx$; bei Gauss-PSF mit $\sigma$ ist das $C\,\mathrm{erf}(b/(2\sqrt{2}\,\sigma))$.

Warum nicht die MTF bei der Periode $2b$ (`kontrastUebertragung`, so im Issue-Text vorgesehen): eine einzelne schmale Linie ist keine Periode. Die Cassini-Teilung (0,76'') haette am 100 mm bei Seeing 1,5'' eine MTF um 0,007, die Baender in T1 0,43, eine gemeinsame Schwelle gaebe es nicht. Unterhalb von zwei Arbeitspixeln Periode misst die MTF ausserdem Aliasing (Hadley-Rille 0,27 gegen Krater 0,18). Auch die Balkenantwort allein reicht nicht: sie kennt die Umgebung nicht, die Cassini-Teilung liegt aber zwischen dem hellen B-Ring und dem halb so hellen, schmalen A-Ring, Syrtis Major bei 6'' auf einer Scheibe, die kaum breiter ist als die PSF. Das Profil traegt diese Umgebung mit.

Testwerte (Kern-Tests in `kern.test.ts`): Delta-Kern, Balken mit Helligkeit 0,4: $\delta$ = 0,6; Gauss-Kern $\sigma$ = 3 px bei 1''/px, Balken 6'' schwarz: 0,683, mit Helligkeit 0,5: 0,341, 12'' schwarz: 0,954 (Toleranz 0,005); Treppe ohne Minimum: 0.

---

## 9. Empfehlung fuer astobsim (Formelsammlung fuer Phase 3)

**Konstanten:** $\lambda$ = 550 nm; $p$ = 6 mm; Augenaufloesung 60''; $\beta$ = 4,765; $c_1$ = 0,98; Rayleigh 138,4''·mm; Dawes 115,8''·mm; Airy-FWHM 116,8''·mm.

**Eingangsgroessen:** $D$ [mm], $f_\mathrm{obj}$ [mm], $\epsilon$ [0..0,5], Bauart (Transmission $\tau$), $f_\mathrm{ok}$ [mm], $sGF$ [Grad] (bei Fernglas und Auge: $V$, $wGF$ direkt), $\mathrm{FWHM}_0$ [''] (Zenit, A-B1), Bortle $b$, Transparenz $t \in$ {klar, leicht diesig, diesig}, Hoehe $h$ [Grad].

**Optik (A-D4, A-D5):**
- $V = f_\mathrm{obj}/f_\mathrm{ok}$; $AP = D/V$; $wGF = sGF/V$.
- $\theta_R = 138{,}4/D$; $\theta_D = 115{,}8/D$ ['' , D in mm].
- Warnungen: $AP > 6$, $AP < 0{,}5$, $V > 2D$.

**Atmosphaere (A-B3, A-B4):**
- $X = 1/[\sin h + 0{,}50572\,(h+6{,}07995)^{-1{,}6364}]$.
- $k(t)$ = 0,20 / 0,30 / 0,45 mag pro Luftmasse; Transmissionsfaktor Atmosphaere $a = 10^{-0{,}4\,k\,X}$.
- $\mathrm{FWHM}_s = \mathrm{FWHM}_0 \cdot X^{0{,}6}$; $r_0 = 0{,}98\,\lambda/\mathrm{FWHM}_s$ (FWHM in rad).

**Aufloesung (A-P2, A-D4):**
- $\mathrm{FWHM}_\mathrm{Airy} = 116{,}8/D$; $\mathrm{FWHM}_\mathrm{Auge} = 60/V$; $\mathrm{FWHM}_\mathrm{gesamt} \approx \sqrt{\mathrm{FWHM}_\mathrm{Airy}^2 + \mathrm{FWHM}_s^2 + \mathrm{FWHM}_\mathrm{Auge}^2}$ (nur Anzeige).
- Dominante Grenze: Maximum der drei.

**Bild (A-P2, A-P3, A-P5):** Objektbild $O(\theta)$ in ''/Pixel; Ergebnis $I = O \otimes \mathrm{PSF}$, wahlweise
- Frequenzraum: $T(f) = T_\mathrm{Pupille}(f; D, \epsilon) \cdot \exp[-3{,}44 (\lambda f / r_0)^{5/3}] \cdot \exp[-(\pi f \sigma_e)^2 \cdot 2]$ mit $\sigma_e = \mathrm{FWHM}_\mathrm{Auge}/2{,}355$ (in rad), $T_\mathrm{Pupille}$ geschlossen aus der Pupillenautokorrelation (Abschnitt 1.3, Rezept B); oder
- Ortsraum: Kern = Airy$(D,\epsilon)$ $\otimes$ Moffat($\mathrm{FWHM}_s$, 4,765) $\otimes$ Gauss($\mathrm{FWHM}_\mathrm{Auge}$), Kernradius etwa $3\,\mathrm{FWHM}_\mathrm{gesamt}$ plus Airy-Ringe bis zum 2. Minimum.
Beide Wege sind physikalisch gleichwertig (Langzeit-Kolmogorov); der Frequenzraum braucht keine Moffat-Naeherung, der Ortsraum ist einfacher zu testen. Die Obstruktion steckt vollstaendig in $T_\mathrm{Pupille}$ bzw. im Airy-Kern der Annulus-Formel $[(2J_1(v)/v - \epsilon^2\,2J_1(\epsilon v)/(\epsilon v))/(1-\epsilon^2)]^2$ [1, 7].

**Diskreter Kern (`src/physik/kern.ts`, Issue #4, eigene Rechnung nach dem Prototyp):** Jede Komponente wird auf einem Feinraster (Arbeitspixel / 4, ueber 42 px Kerngroesse / 2) punktweise abgetastet, auf Summe 1 normiert und per FFT (64 bis 256 Punkte) multipliziert; die Ruecktransformierte wird auf Arbeitspixel gebinnt, Randfeinpixel je zur Haelfte, und erneut auf Summe 1 normiert. Kernradius $\lceil 3\,\mathrm{FWHM}_\mathrm{gesamt} / s \rceil$ Arbeitspixel, mindestens 2; damit sind die Moffat-Fluegel zu 99,9 % enthalten, die Airy-Fluegel nur zu etwa 94 % (Abschnitt 1.1), was bei beugungsbegrenzten Faellen die MTF bei niedrigen Frequenzen um einige Prozent anhebt (bei $\nu$ = 0,1: 0,93 statt 0,87). Testhelfer: MTF des Kerns $T(f) = |\sum_{x,y} k(x,y)\cos(2\pi f\,x\,s)|$ (diskrete Fouriertransformierte entlang einer Achse, reell wegen Punktsymmetrie [6]); FWHM aus dem radialen Profil (Mittel je Abstand), erste Unterschreitung der halben Mitte linear interpoliert. Das Binning verbreitert die FWHM um etwa $\sqrt{1 + s^2/(12\sigma^2)}$ (Varianz der Rechteckfunktion $s^2/12$), bei 2,5 px je FWHM um 4 bis 5 %.

**Helligkeit (A-P4):**
- Flaechenhelligkeit Objekt: $L = L_0\,a\,\tau\,(1-\epsilon^2)\,\min(1,(AP/p)^2)$ mit $AP = D/V$ aus dem vollen Durchmesser $D$; der Abschattungsfaktor $(1-\epsilon^2)$ steht genau einmal hier (nicht zusaetzlich in $\tau$).
- Hintergrund: $\mu_\mathrm{ok} = \mu(b) - 2{,}5\log_{10}[\tau\,(1-\epsilon^2)\,\min(1,(AP/p)^2)]$, $\mu(b)$ aus Tabelle 6.1 (Spalte "Vorschlag astobsim").
- Punktquelle (Mond) mit Magnitude $m$: Fluss $\propto 10^{-0{,}4m}\,a\,\tau\,(1-\epsilon^2)\,D^2$, als Scheibe mit Winkeldurchmesser gerendert und mit derselben PSF gefaltet; Umrechnung in Pixelhelligkeit relativ zur Planetenflaeche ueber dieselbe Skala (Phase 3). Umgesetzt in Issue #14, Herleitung und Blendungsregel in Abschnitt 13.
- Obergrenze: Faktor 1 bei $AP \ge p$, keine Blendung.

**Anzeige der Helligkeit (A-P4, Issue #55):** Objekt und Himmel werden je Ebene mit $w(\mu) = \min(1, 10^{-0{,}4 (\mu - 3{,}35)/3})$ auf lineare Anzeigewerte abgebildet, das Quellbild bleibt linear; Begruendung und Testwerte in Abschnitt 12.

**Anzeige Seeing (A-B1):** Tabelle in Abschnitt 2.5.

---

## 10. Unsicher oder zu pruefen

1. **Suiter als Quelle der D(1-ε)-Regel:** nicht am Buch geprueft; die Regel ist bei Zmek 1993 und Legault belegt, Seitenzahlen der S&T-Artikel (Juli 1993 S. 91, September 1993 S. 83) sind aus Sekundaerquellen und ungeprueft [10]. Herbert hat Suiter vielleicht im Regal: Kapitel "Obstruction" (2. Aufl. Kap. 10?) nachsehen.
2. **Pickering zu FWHM:** meine Ableitung ueber $D/r_0$ am 5-Zoll ist eine Schaetzung; die Zuordnung in der Tabelle 2.5 ist auf eine halbe Pickering-Stufe und etwa 0,5'' unsicher. Besser waere eine Reihe von Pickering-Beschreibungen gegen DIMM-Messungen, die habe ich nicht gefunden.
3. **Wortstufen:** "ausgezeichnet/gut/mittel/schlecht" gegen 1/2/3'' sind Konvention, keine Messung. Fuer Einsteiger (A-Z2) duerfte die Bedeutung "schlecht ab 3''" eher zu streng sein, viele Abende in Mitteleuropa liegen bei 3 bis 4''.
4. **Extinktionsstufen 0,20 / 0,30 / 0,45:** Rahmen aus Green/Schaefer, Stufung meine Wahl. Ob die Transparenz zusaetzlich die Seeing-FWHM aendern soll (Dunst korreliert mit ruhiger Luft), ist eine Modellentscheidung.
5. **Kontrastverlust durch Dunst (A-B3):** keine Quelle fuer ein einfaches Modell gefunden; Vorschlag "Anteil $s$ des Objektlichts als Schleier" ist frei erfunden und als solcher zu kennzeichnen oder wegzulassen.
6. **Bortle 8 und 9 in mag/arcsec$^2$:** Dark Skies Awareness gibt fuer 8 nur "< 18" und fuer 9 nichts; 17,5 und 17,0 sind Schaetzungen aus Crumeys Wiener Werten (15 bis 19,25).
7. **Augenaufloesung bei niedrigem Kontrast:** 2 bis 3' stuetzt sich auf klinische Buchstabentests (2,5 logMAR-Zeilen zwischen 90 % und 8 % Kontrast [33]) und die Form der CSF; eine Zahl speziell fuer Planetendetail (Sidgwick o. ae.) habe ich nicht belegt.
8. **Transmissionswerte je Bauart:** Groessenordnung aus Spiegel- und Flaechenverlusten, keine Messreihe. Fuer das Bild ist der Unterschied 0,80 gegen 0,90 kaum sichtbar.
9. **O'Neill 1956:** Bibliographie (JOSA 46, 285) aus einer Uebersichtsarbeit, die Formel selbst habe ich nicht eingesehen; fuer astobsim durch die Pupillenautokorrelation als Linsenflaechen-Formel ersetzt (Abschnitt 1.3, Rezept B).
10. **Moffat 1969:** Bibcode 1969A&A.....3..455M aus Erinnerung, nicht abgerufen.
11. **Rayleigh 1879:** Phil. Mag. (5) 8, 261 wird meist zitiert; Sparrow 1916 zitiert "(5) 9, 266, 1880" [4]. Die Arbeit erschien in mehreren Teilen in Band 8 und 9.
12. **Kurzzeit-Heuristik fuer A-B6:** quadratisches Abziehen der Bildbewegung ist plausibel, aber nicht aus Fried abgeleitet; vor Umsetzung mit Fried 1966 Kurzzeit-OTF vergleichen.
13. **Kasten-Young im Zenit = 0,9997:** Tests mit Toleranz oder Normierung; Formel gilt fuer die scheinbare Hoehe (Refraktion), fuer astobsim ohne Bedeutung.
14. **Airy-FWHM 1,029 $\lambda/D$ und Annulus-Minima:** eigene Rechnung, stimmt mit Sacek [8, 9] ueberein, nicht gegen Born & Wolf geprueft.

---

## 11. Quellen

1. Born, M., Wolf, E.: *Principles of Optics*, 7. Aufl., Cambridge 1999, Kap. 8.5.2 (Fraunhofer-Beugung an der Kreisoeffnung, Airy-Muster, 83,8 % im ersten Minimum), Kap. 8.6.2 (Ringoeffnung).
2. Lord Rayleigh (J. W. Strutt): "Investigations in optics, with special reference to the spectroscope", Phil. Mag. (5) 8, 261 (1879) und Folgeteile; Einordnung als Vergleichsmass: SPIE JM3 19, 040501 (2020), https://proceedings.spiedigitallibrary.org/journals/journal-of-micro-nanolithography-mems-and-moems/volume-19/issue-4/040501/Rayleigh-or-Abbe-Origin-and-naming-of-the-resolution-formula/10.1117/1.JMM.19.4.040501.full
3. Dawes, W. R.: "Catalogue of Micrometrical Measurements of Double Stars", MNRAS 27, 217 (1867), https://articles.adsabs.harvard.edu/pdf/1867MNRAS..27..217D ; Wortlaut zitiert in Sky & Telescope, September 2016, S. 30, https://www.nxtbook.com/nxtbooks/aas/st_201609/index.php?startid=30
4. Sparrow, C. M.: "On Spectroscopic Resolving Power", ApJ 44, 76 (1916), https://articles.adsabs.harvard.edu/pdf/1916ApJ....44...76S ; Einstieg: https://en.wikipedia.org/wiki/Sparrow%27s_resolution_limit
5. O'Neill, E. L.: "Transfer Function for an Annular Aperture", J. Opt. Soc. Am. 46, 285 (1956); genannt in arXiv:2509.06354 (historische Uebersicht), https://arxiv.org/pdf/2509.06354
6. Schroeder, D. J.: *Astronomical Optics*, 2. Aufl., Academic Press 2000, Kapitel zu Transferfunktionen (Sacek [8] zitiert die 1. Aufl., S. 205, fuer die MTF-Gleichungen).
7. Mahajan, V. N.: *Aberration Theory Made Simple*, SPIE Press 1991, Kap. 9 (Annular and Gaussian pupils), https://www.springerprofessional.de/ebooks/TT/Aberration-Theory-Made-Simple/9/Optical-Systems-with-Annular-and-Gaussian-Pupils/10.1117/3.43000.ch9 ; Tabelle der Kernenergie zitiert nach [8].
8. Sacek, V.: telescope-optics.net, "Central obstruction", https://telescope-optics.net/obstruction.htm (Quellen dort: Mahajan [7], Schroeder [6]).
9. Sacek, V.: telescope-optics.net, "Central obstruction effect", https://telescope-optics.net/central_obstruction_effect.htm (ohne externe Quellenangaben; Autokorrelationsrezept, Grenzfrequenz).
10. Zmek, W.: "Rules of Thumb for Planetary Scopes", Sky & Telescope Juli 1993 (S. 91) und September 1993 (S. 83); Zusammenfassung in Sky & Telescope, "What makes a good planetary telescope", https://skyandtelescope.org/astronomy-equipment/what-makes-a-good-planetary-telescope/ (Seitenzahlen ungeprueft).
11. Legault, T.: Obstruktion und MTF, zusammengefasst auf SEDS, https://spider.seds.org/scopes/obstruct.html
12. Sky & Telescope Errata 2023 (65 % im Airy-Scheibchen bei 33 % Obstruktion), https://skyandtelescope.org/sky-and-telescope-magazine/sky-telescope-errata-2023/
13. Suiter, H. R.: *Star Testing Astronomical Telescopes*, 2. Aufl., Willmann-Bell 2008, Kapitel zur Obstruktion (nicht eingesehen).
14. Fried, D. L.: "Optical Resolution Through a Randomly Inhomogeneous Medium for Very Long and Very Short Exposures", J. Opt. Soc. Am. 56, 1372 (1966), https://doi.org/10.1364/JOSA.56.001372
15. Roddier, F.: "The Effects of Atmospheric Turbulence in Optical Astronomy", Progress in Optics 19, 281 (1981); zitiert nach [16].
16. Tokovinin, A.: "From Differential Image Motion to Seeing", PASP 114, 1156 (2002), https://iopscience.iop.org/article/10.1086/342683/pdf (Gl. 5: FWHM = 0,98 λ/r0; Gl. 15 bis 17: Strukturfunktion, OTF, d50; Gl. 19: aeussere Skala).
17. Racine, R.: "The Telescope Point Spread Function", PASP 108, 699 (1996), https://iopscience.iop.org/article/10.1086/133788 (Kolmogorov-PSF bestaetigt, Aureole).
18. Trujillo, I., Aguerri, J. A. L., Cepa, J., Gutierrez, C. M.: "The effects of seeing on Sersic profiles - II. The Moffat PSF", MNRAS 328, 977 (2001), https://arxiv.org/abs/astro-ph/0109067 (β = 4,765).
19. Moffat, A. F. J.: "A Theoretical Investigation of Focal Stellar Images in the Photographic Emulsion", A&A 3, 455 (1969) (Bibcode aus Erinnerung).
20. Sacek, V.: telescope-optics.net, "Seeing and aperture", https://telescope-optics.net/seeing_and_aperture.htm (D/r0-Schwellen, Beispielwerte r0; ohne externe Quellenangaben).
21. Max, C.: Vorlesung "Lecture 6: SNR, Detectors, Image Motion", UC Santa Cruz 2020, https://www.ucolick.org/~max/289/Lectures%202020/Lecture%206%20-%20SNR%20and%20Detectors/Lecture6%20SNR%20Detectors%20Image%20Motion.pdf (σ² = 0,182 (D/r0)^(5/3) (λ/D)², nach Tyson, *Principles of Adaptive Optics*; Ursprung Fried, JOSA 55, 1427 (1965)).
22. Definition r0 mit sec γ und λ-Skalierung: arXiv:2402.09144 (Paranal-Turbulenzprofiler), https://arxiv.org/pdf/2402.09144 ; Seeing ∝ Luftmasse^0,6: arXiv:1811.07561, https://arxiv.org/pdf/1811.07561
23. Pickering-Skala: Sky & Telescope, "A Scale of Seeing", https://skyandtelescope.org/astronomy-resources/a-scale-of-seeing/ ; Peach, D.: https://www.damianpeach.com/pickering.htm ; Einstieg https://en.wikipedia.org/wiki/Pickering_scale
24. Quadratische Addition und Gauss-/Moffat-Vergleich: Rubin seeing model (0,39'' Systemanteil), https://rubin-scheduler.lsst.io/_modules/rubin_scheduler/site_models/seeing_model.html ; Robo-AO (Gauss im Kern gut, in den Fluegeln schlecht), https://arxiv.org/pdf/1712.01468 ; Fried-Kurzzeit-OTF zitiert in https://arxiv.org/pdf/astro-ph/9912181
25. Antoniadi-Skala: Isaac Newton Group, https://www.ing.iac.es/Astronomy/instruments/naomi/antoniadi.html (nach Astronomy Now, Nov. 2002, S. 76).
26. MacEvoy, B.: handprint.com, "Astronomical seeing, part 2: seeing measurement methods", https://www.handprint.com/ASTRO/seeing2.html (Douglass/Pickering-Original, Mt.-Wilson-Skala nach Michelson 1922, Tombaugh/Smith 1958, Environment-Canada-Zuordnung; Quellen dort angegeben).
27. Typische Seeingwerte: Wikipedia "Astronomical seeing" (Einstieg), https://en.wikipedia.org/wiki/Astronomical_seeing ; ZWO-Artikel (2 bis 5'' fuer Amateure), https://us.zwoastro.com/blogs/product-information/seeing-in-dso-astrography-does-really-matter ; AstroBin-Forum (informelle Stufen), https://app.astrobin.com/forum/topic/214703?page=1
28. Snellen-Definition und Sehschaerfe-Typen: McGill Vision Research, https://www.mcgill.ca/mvr/files/mvr/visualacuity_4.pdf ; University of Arizona, Visual Optics Lab, Class 04, https://wp.optics.arizona.edu/visualopticslab/wp-content/uploads/sites/52/2016/08/Class04_08.pdf
29. Blackwell, H. R.: "Contrast Thresholds of the Human Eye", J. Opt. Soc. Am. 36, 624 (1946); kritischer Sehwinkel 0,7' zitiert nach Clark, R. N.: *Visual Astronomy of the Deep Sky* (1990), https://clarkvision.com/visastro/omva1/
30. Sacek, V.: telescope-optics.net, "The eye", https://telescope-optics.net/eye.htm (ohne externe Quellenangaben).
31. Campbell, F. W., Robson, J. G.: "Application of Fourier Analysis to the Visibility of Gratings", J. Physiol. 197, 551 (1968), https://www.cns.nyu.edu/~msl/courses/2223/Readings/campbellrobson68.pdf ; Zusammenfassung (Maximum 4 Perioden/Grad, Grenze ca. 60) https://en.wikipedia.org/wiki/Contrast_(vision)
32. Crumey, A.: "Human Contrast Threshold and Astronomical Visibility", MNRAS 442, 2600 (2014), https://arxiv.org/abs/1405.4209 (Gl. 55: NELM gegen Himmelshelligkeit; Gl. 64 bis 73: teleskopische Grenzgroesse; Gl. 66: Flaechenhelligkeit mit Austrittspupille nach Tousey & Hulburt, JOSA 38, 886 (1948); Abschn. 1.6.2: Seeing-Scheibe; Abschn. 3.2: Transmissionen aus Bowen 1947). Begleitseite https://crumey.co.uk/astronomy/astro.html
33. Niedrigkontrast-Sehschaerfe: Uebersicht in Pluhacek et al. 2022 (2,5 Bailey-Lovie-Zeilen zwischen 8 % und 90 % Kontrast), https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9522725/ ; Jacobs, R. J., Bailey, I. L., Bullimore, M. A.: Appl. Opt. 31, 3668 (1992), 0,5-mm-Austrittspupille, zitiert nach [32].
34. Shlaer, S.: "The Relation Between Visual Acuity and Illumination", J. Gen. Physiol. 21, 165 (1937), https://pmc.ncbi.nlm.nih.gov/articles/PMC2141937
35. Sacek, V.: telescope-optics.net, "Telescope magnification", https://telescope-optics.net/telescope_magnification.htm (Thompson, *Making Your Own Telescope*, S. 173 f., fuer 50x/Zoll).
36. Gesichtsfeld und Feldblende: Sky & Telescope, "Simple Formulas for the Telescope Owner", https://skyandtelescope.org/stargazing-and-observing/stargazers-corner/simple-formulas-for-the-telescope-owner/ ; Astronomics, "Determining field of view", https://astronomics.com/pages/determining-field-of-view
37. Flaechenhelligkeit und Austrittspupille (Sekundaerquellen, konsistent mit [32] Gl. 66): https://milwaukeeastro.org/Stargazing/Telescope/SurfaceBrightness.html ; Sky & Telescope, "A Pupil Primer", https://skyandtelescope.org/astronomy-equipment/a-pupil-primer/
38. Spiegelreflexion: Layertec, Aluminium-Schichten, https://layertec.de/en/coatings/metallic-coatings/aluminum-coatings ; CTA-Spiegelentwicklung, arXiv:1307.4563, https://arxiv.org/pdf/1307.4563 ; SCT-Gesamttransmission ca. 89 % (Herstellerangabe), https://www.astronomics.com/support/starbright-xlt-optics/
39. Kasten, F., Young, A. T.: "Revised optical air mass tables and approximation formula", Applied Optics 28, 4735 (1989), https://doi.org/10.1364/AO.28.004735 ; Formel mit Koeffizienten nach https://en.wikipedia.org/wiki/Air_mass_(astronomy)
40. Hardie, R. H.: in Hiltner (Hrsg.), *Astronomical Techniques*, Univ. of Chicago Press 1962, S. 184 ff.; Formel nach [39, Wikipedia].
41. Gueltigkeit von sec z: Wikipedia "Air mass (astronomy)" (bis 60 bis 75 Grad Zenitdistanz); eigene Zahlen in Tabelle 5.3.
42. Green, D. W. E.: "Magnitude Corrections for Atmospheric Extinction", International Comet Quarterly 14, 55 (1992), http://www.icq.eps.harvard.edu/ICQExtinct.html (Rayleigh-, Ozon-, Aerosolkoeffizienten nach Hayes & Latham 1975 und Schaefer 1985/1987/1992).
43. Schaefer, B. E.: "Astronomy and the Limits of Vision", Vistas in Astronomy 36, 311 (1993) (nicht eingesehen).
44. Bortle, J. E.: "Gauging Light Pollution: The Bortle Dark-Sky Scale", Sky & Telescope, Februar 2001, S. 126, https://skyandtelescope.org/astronomy-resources/light-pollution-and-astronomy-the-bortle-dark-sky-scale/
45. Bortle-Tabelle mit SQM-Spalte: https://en.wikipedia.org/wiki/Bortle_scale (SQM-Werte dort aus Dark Skies Awareness, Nomogramm, Archivlink in der Wikipedia-Fussnote).
46. Crumey, A.: "Astronomical Visibility" (Begleitseite zu [32], Bortle "interesting but problematic"), https://crumey.co.uk/astronomy/astro.html
47. Schaefer, B. E.: "Telescopic Limiting Magnitudes", PASP 102, 212 (1990), https://doi.org/10.1086/132629 ; NASA NTRS https://ntrs.nasa.gov/citations/19900039111
48. Galileische Monde als Scheibchen: Astronomy.com, "A brief history of Jupiter's Galilean moons, and how to observe them", https://www.astronomy.com/science/a-brief-history-of-jupiters-galilean-moons-and-how-to-observe-them/ ; ALPO Japan, Ganymed 1,8'', https://alpo-j.sakura.ne.jp/kk23/j231016r.htm
49. Encircled-Energy-Formel fuer Ringoeffnung (Anhang): arXiv:1708.01257, https://arxiv.org/pdf/1708.01257
50. Wikipedia "Fried parameter" (Einstieg, Bibliographie Fried 1966), https://en.wikipedia.org/wiki/Fried_parameter
51. Abramowitz, M., Stegun, I. A. (Hrsg.): *Handbook of Mathematical Functions*, Dover 1972 (Nachdruck der NBS-Ausgabe 1964), Formeln 9.4.4 und 9.4.6 (Polynomnaeherungen fuer $J_1$, $|x| < 3$ bzw. $|x| \ge 3$, Fehler unter $1{,}3 \cdot 10^{-8}$), Tabelle 9.1 (Tafelwerte), https://personal.math.ubc.ca/~cbm/aands/page_370.htm
52. Weisstein, E. W.: "Circle-Circle Intersection", MathWorld, https://mathworld.wolfram.com/Circle-CircleIntersection.html (Linsenflaeche zweier Kreise fuer die Pupillenautokorrelation, Abschnitt 1.3 Rezept B).
53. Stevens, S. S.: "To Honor Fechner and Repeal His Law", Science 133, 80 (1961), https://doi.org/10.1126/science.133.3446.80 ; Volltext http://languagelog.ldc.upenn.edu/myl/Science-1961-Stevens-80-6.pdf (S. 84, Tabelle 1 "Representative exponents": Helligkeit 0,33 fuer ein etwa 5 Grad grosses Feld, dunkeladaptiertes Auge, 0,5 fuer eine Punktquelle; S. 83: Exponent 0,5 fuer Punktquellen gegen 0,33 fuer groessere Felder; S. 81: 0,33 bei Verhaeltnisskalierung leuchtender Felder im Dunkeln, Bisektion ergibt etwa 0,3).
54. Stevens, S. S., Stevens, J. C.: "Brightness Function: Parametric Effects of Adaptation and Contrast", J. Opt. Soc. Am. (Abstract), zitiert nach [56] als "vol. 53, p. 1139, 1960" (Band und Jahr passen nicht zusammen; nicht eingesehen). Inhalt nach [56]: der Zusammenhang Helligkeit zu Leuchtdichte verschiebt sich mit dem Adaptionsniveau.
55. Tumblin, J., Rushmeier, H.: "Tone Reproduction for Realistic Images", IEEE Computer Graphics and Applications 13(6), 42 (1993), https://doi.org/10.1109/38.252554 (nicht eingesehen; Inhalt nach [56] und [58]).
56. Ward Larson, G., Rushmeier, H., Piatko, C.: "A Visibility Matching Tone Reproduction Operator for High Dynamic Range Scenes", IEEE Trans. Visualization and Computer Graphics 3(4), 291 (1997), https://graphics.cs.yale.edu/sites/default/files/1997tvcg_hdr_tonemapping.pdf (Abschn. 2: Einordnung von Tumblin & Rushmeier [55] und Ward [57]; Abschn. 4: Steigung begrenzt auf das Verhaeltnis der Schwellen, bei Ward ein globaler Skalierungsfaktor).
57. Ward, G.: "A Contrast-Based Scalefactor for Luminance Display", in Heckbert, P. S. (Hrsg.): *Graphics Gems IV*, Academic Press 1994 (nicht eingesehen; Inhalt nach [56]: linearer Skalierungsfaktor, der die Sichtbarkeit am Adaptionspunkt erhaelt, sehr helle und dunkle Werte werden abgeschnitten).
58. Reinhard, E., Stark, M., Shirley, P., Ferwerda, J.: "Photographic Tone Reproduction for Digital Images", ACM Trans. Graphics 21(3), 267 (2002); Technischer Bericht UUCS-02-001, University of Utah, https://users.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf (Gl. 1: logarithmischer Mittelwert der Leuchtdichte als "Key"; Gl. 2: $L = a\,L_w/\bar L_w$ mit $a$ = 0,18; Gl. 3: $L_d = L/(1+L)$; Gl. 4 mit $L_\mathrm{white}$).
59. IEC 61966-2-1:1999, Multimedia systems and equipment, Colour measurement and management, Part 2-1: Default RGB colour space, sRGB (Referenzanzeige 80 cd/m$^2$, Kennlinie wie in `src/ui/zeichne.ts`).
60. Wikipedia: "Surface brightness", https://en.wikipedia.org/wiki/Surface_brightness (Flaechenhelligkeit $S = m + 2{,}5\log_{10} A$ mit $A$ der Flaeche in Quadratbogensekunden, folgt direkt aus der Definition der Magnitude; dieselbe Rechnung wie fuer die Quellweiss-Werte in `docs/recherche/objekte.md` 5.2).
61. Linienbildfunktion (line spread function) als Integral der PSF ueber eine Richtung und Bild einer Linie als eindimensionale Faltung: Standardbegriff der linearen, verschiebungsinvarianten Abbildung, dargestellt z. B. in Boreman, G. D.: Modulation Transfer Function in Optical and Electro-Optical Systems, SPIE Press (2001), Kap. 1 (nicht am Buch geprueft).

---

## 12. Abbildung der Leuchtdichte auf den Bildschirm (Issue #55)

**Datum:** 2026-10-27. **Kennungen:** A-P4, A-P9, A-B2. Die Abbildung ist eine Anzeigeentscheidung, kein Augenmodell: kein Adaptionszustand, keine Zeit, keine Blendung (A-P9).

### 12.1 Problem

Bis Issue #9 multipliziert bild das lineare Quellbild (1,0 = Quellweiss) mit dem physikalischen Faktor aus Abschnitt 9 und zeichnet das Ergebnis mit der sRGB-Kennlinie [59]. Die Leuchtdichte im Okular reicht bei den Objekten ueber 2,4 Dekaden, mit dem Himmel ueber etwa 8 (Umrechnung $\mu_V = 12{,}58 - 2{,}5\log_{10} L$ mit $L$ in cd/m$^2$ [32, Abschn. 1.3]):

| Anblick (45 Grad, klar) | $\mu$ im Okular | $L$ [cd/m$^2$] | physikalischer Faktor | sRGB linear abgebildet |
|---|---|---|---|---|
| Mond mit blossem Auge | 3,63 | 3790 | 0,771 | 227 |
| Mond im Fernglas 10x50 (AP 5 mm) | 4,21 | 2240 | 0,455 | 180 |
| Mond A-D9 (80/600, 10 mm, AP 1,33 mm) | 7,01 | 169 | 0,0343 | 52 |
| Mars 14'' an 80 mm bei 120x (AP 0,67 mm) | 9,27 | 21 | 0,0086 (relativ zu 4,1) | 23 |
| Mond an 80 mm bei 200x (AP 0,4 mm) | 9,63 | 15 | 0,0031 | 10 |
| Himmel Bortle 5 bei A-D9 | 23,4 | 4,7e-5 | | 0 |

(Eigene Rechnung mit Abschnitt 9: Refraktor $\tau$ = 0,90, Fernglas 0,85, $X$ = 1,4126, $k$ = 0,20, Quellweiss Mond 3,35, Mars 14'' 4,1 mag/arcsec$^2$ aus `daten/objekte.json`, Stand vor #71; seit Issue #71 ist Quellweiss auf den Pixelwert 1,0 geeicht, Mond 3,91, Mars 14'' 2,54, `objekte.md` 5.3.)

Linear relativ zu Quellweiss wirkt der Mond in A-D9 dunkelgrau, bei 200x ist er fast schwarz; am Fernrohr ist er blendend hell. Eine absolute Abbildung ($L$ auf dem Bildschirm gleich $L$ im Okular) scheitert an der Anzeige: die sRGB-Referenzanzeige hat 80 cd/m$^2$ [59], A-D9 laege mit 169 cd/m$^2$ darueber, Fernglas und blosses Auge ebenfalls; alles ueber 80 cd/m$^2$ wuerde abgeschnitten und verloere das Bild.

### 12.2 Literatur

- **Stevens [53]:** Die empfundene Helligkeit $\psi$ eines leuchtenden Felds folgt einer Potenz der Leuchtdichte, $\psi = k\,L^{n}$, mit $n$ = 0,33 fuer ein etwa 5 Grad grosses Feld beim dunkeladaptierten Auge und $n$ = 0,5 fuer eine Punktquelle (Tabelle 1). Bisektionsversuche ergeben etwa 0,3. Ein Leuchtdichteverhaeltnis $r$ wird als Helligkeitsverhaeltnis $r^{1/3}$ empfunden, unabhaengig vom Absolutwert.
- **Stevens & Stevens [54]:** Exponent und Achsenabschnitt der Helligkeitsfunktion haengen vom Adaptionsniveau ab (nach [56]).
- **Tumblin & Rushmeier [55]:** Tone-Mapping, das den Gesamteindruck der Helligkeit erhaelt, mit der Helligkeitsfunktion nach [54] und je einem Adaptionsniveau fuer Szene und Anzeige; sehr helle und dunkle Bereiche werden abgeschnitten [56, Abschn. 2]. Die Konstanten habe ich nicht im Original gesehen.
- **Ward [57]:** ein linearer Skalierungsfaktor aus den Adaptionsniveaus von Szene und Anzeige, der Kontrastschwellen am Adaptionspunkt erhaelt; Werte ausserhalb werden abgeschnitten [56, Abschn. 2 und 4].
- **Reinhard et al. [58]:** Skalierung auf den logarithmischen Mittelwert der Szene, $L = a\,L_w/\bar L_w$ mit $a$ = 0,18 (Gl. 1 und 2), dann Kompression $L_d = L/(1+L)$ (Gl. 3). Gl. 2 ist eine automatische Belichtung: jede Szene erscheint gleich hell.

### 12.3 Entscheidung

Je Ebene (Objekt, Himmel) wird die Flaechenhelligkeit im Okular $\mu$ (Abschnitt 9) mit einer Potenz nach Stevens auf eine Anzeigehelligkeit abgebildet (GLOSSARY: linear, 1 = Bildschirmweiss, danach sRGB in ui):

$$w(\mu) = \min\!\left(1,\ \left(\frac{L}{L_\mathrm{weiss}}\right)^{n}\right) = \min\!\left(1,\ 10^{-0{,}4\,n\,(\mu - \mu_\mathrm{weiss})}\right), \qquad n = \tfrac13,\ \mu_\mathrm{weiss} = 3{,}35\ \mathrm{mag/arcsec^2}$$

Nachtrag Issue #72 (14.4): Fuer das Objekt entfaellt das $\min(1, \cdot)$, die Anzeigehelligkeit von Quellweiss darf 1 uebersteigen; begrenzt wird erst das Pixel beim Zeichnen. Der Himmel bleibt begrenzt. Punktquellen bilden eine eigene Ebene, die je Pixel mit derselben Potenz abgebildet wird (Abschnitt 14).

- **Objekt:** $\mu_\mathrm{obj} = \mu_\mathrm{Quellweiss} - 2{,}5\log_{10} F$ mit dem physikalischen Faktor $F$ aus Abschnitt 9; die Anzeigehelligkeit von Quellweiss ist $w(\mu_\mathrm{obj})$. Das Quellbild bleibt linear: ein Pixel mit Wert $q$ relativ zu Quellweiss wird $q \cdot w(\mu_\mathrm{obj})$. Nur das Niveau wird komprimiert, nicht der Kontrast innerhalb des Quellbilds (Faltung, Tabellen-Tests T1 bis T5 und das Aussehen des Quellbilds bleiben unberuehrt).
- **Himmel:** $w(\mu_\mathrm{ok})$ mit $\mu_\mathrm{ok}$ aus Abschnitt 6.2, additiv wie bisher (A-B2).
- **Weiss:** $\mu_\mathrm{weiss}$ = 3,35 ist der Vollmond ohne Verluste (etwa 4900 cd/m$^2$), das hellste Objekt in Version 1; ohne Verluste waere er gerade Bildschirmweiss. Hellere Flaechen (etwa Venus) wuerden auf 1 begrenzt (A-P4: nach oben begrenzt). Nachtrag Issue #71: 3,35 ist die mittlere Flaechenhelligkeit des Vollmonds (`objekte.md` 5.2), aber nicht mehr Quellweiss des Mondzustands (3,91, `objekte.md` 5.3); ohne Verluste erscheint Quellweiss des Mondes jetzt mit $w(3{,}91)$ = 0,84. Quellweiss von Mars (1,68 bis 3,10) ist seit #71 heller als 3,35 und erreichte die Begrenzung (12.5 Punkt 6); seit #72 wird sie nicht mehr auf das Niveau angewandt (14.4).
- **Exponent:** $n$ = 1/3 ist Stevens' Exponent fuer ausgedehnte Felder [53]. Er dient als Kompressionsstaerke, nicht als Modell des Auges am Okular; Stevens begruendet nur die Groessenordnung der Kompression, keine Gleichheit der Empfindung, denn der Betrachter komprimiert den Bildschirm selbst noch einmal. Im Code heisst er `KOMPRESSIONSEXPONENT`. Eigenschaft: gleiche Leuchtdichteverhaeltnisse ergeben gleiche Anzeigeverhaeltnisse ($r \mapsto r^{1/3}$), unabhaengig von Objekt und Geraet. Die Spanne vom Mond mit blossem Auge bis Mars bei 200x (Faktor 500, 2,7 Dekaden) wird zu Faktor 8 (0,92 bis 0,116 linear, sRGB 245 bis 95), passt also in den Bereich, in dem das Bild auf dem Bildschirm noch erkennbar ist (Stand vor #71; mit Quellweiss nach #71 reicht die Spanne der Faelle aus 12.4 vom Mond mit blossem Auge, 0,772 bzw. sRGB 227, bis zum Mond an 80 mm bei 200x, 0,123 bzw. sRGB 98: Faktor 250 in der Leuchtdichte, 6,3 in der Anzeige).
- **Monotonie:** $w$ faellt streng in $\mu$; da $\mu_\mathrm{obj}$ in der Austrittspupille bis 6 mm streng faellt (Abschnitt 5.1), steigt die Anzeigehelligkeit streng mit der Austrittspupille bis 6 mm und bleibt darueber konstant, solange $w$ unter der Begrenzung auf 1 bleibt (seit #71 nicht mehr fuer Mars 14'' und 25'' bei grosser Austrittspupille, 12.5 Punkt 6). Seit #72 ist das Niveau nicht mehr begrenzt (14.4), die Monotonie gilt fuer alle Objekte der Version 1.
- **Hintergrund dunkler als das Objekt:** Transmission, Abschattung und Austrittspupille wirken auf beide Ebenen gleich, die Extinktion nur auf das Objekt (Abschnitt 6.2). Damit ist $\mu_\mathrm{Himmel,ok} - \mu_\mathrm{obj,ok} = \mu_\mathrm{Bortle} - \mu_\mathrm{Quellweiss} - k X$, unabhaengig vom Geraet. Mit Quellweiss nach Issue #71 (`objekte.md` 5.3) in Version 1 mindestens $17{,}0 - 5{,}56 - 2{,}51 = 8{,}9$ mag (Bortle 9, Saturn 16'', diesig, 10 Grad Hoehe: $X$ = 5,586, $kX$ = 2,514), angezeigt also mindestens um den Faktor $10^{0{,}4 \cdot 8{,}93/3} = 15{,}5$ dunkler als Quellweiss; Saturn 20'' 16,6, Jupiter (35'') 22,5, Mond 25,7, Mars (6'') 33. Stand vor #71 (Quellweiss Mond 3,35, Mars 6'' 4,5, Jupiter 5,4, Saturn 6,6): Mond und Mars mindestens 21,5, Jupiter 16, Saturn 11.

Verworfen:

- **Linear relativ zu Quellweiss ($n$ = 1, Stand #9):** A-D9 sRGB 52, 200x sRGB 10; das Bild verschwindet, sobald die Austrittspupille klein wird.
- **Absolut ($L_\mathrm{Anzeige} = L_\mathrm{Okular}$, Ward [57] mit festem Adaptionsniveau ist ebenfalls ein fester linearer Faktor):** Mond bis etwa 1,5 mm Austrittspupille abgeschnitten, das Bild ginge verloren; ein fester Faktor ist nur eine andere Wahl von $\mu_\mathrm{weiss}$ bei $n$ = 1.
- **Adaptionsabhaengig (Tumblin & Rushmeier [55], Ward [57] mit dem Niveau der Szene):** das ist ein Modell der Helligkeitsadaption des Auges, A-P9 schliesst es aus; die Konstanten konnte ich nicht am Original pruefen.
- **Automatische Belichtung (Reinhard Gl. 2 [58], entspricht $n$ = 0):** jede Austrittspupille saehe gleich hell aus, widerspricht A-P4.
- **Kompression je Pixel ($L/(1+L)$ nach Reinhard Gl. 3 oder $L^{1/3}$ auf jedes Pixel):** veraendert den Kontrast im Bild (Maria gegen Hochland, Planetendetail), den die Faltung gerade richtig wiedergeben soll; $L/(1+L)$ saettigt zudem oben, Fernglas und blosses Auge waeren kaum zu unterscheiden.
- **Logarithmisch (Fechner):** braucht eine willkuerliche untere Grenze und ist nach [53] fuer ueberschwellige Helligkeit widerlegt.

### 12.4 Testwerte (A-Q1)

Eigene Rechnung, 45 Grad, klar, Bortle 5, Quellweiss Mond 3,35, Mars 14'' 4,1 mag/arcsec$^2$; sRGB-Kodewert mit der Kennlinie aus [59] auf 8 Bit gerundet. Stand vor #71: die Tabelle sind die festen Eingaben der Unit-Tests (`src/physik/helligkeit.test.ts`) und bleibt so; die Werte nach #71 stehen darunter.

| Fall | $\mu$ | Anzeige $w$ | sRGB | vorher (linear) |
|---|---|---|---|---|
| $w(3{,}35)$, $w(5{,}85)$, $w(10{,}85)$ | | 1; $10^{-1/3}$ = 0,4642; 0,1 | | |
| Quellweiss 3,4, AP 0,8 mm ohne Verluste | 7,775 | 0,2570 | | |
| Mond blosses Auge | 3,633 | 0,9169 | 245 | 227 |
| Mond Fernglas 10x50 | 4,205 | 0,7692 | 227 | 180 |
| Mond A-D9 | 7,013 | 0,3248 | 154 | 52 |
| Mars 14'' an 80 mm bei 120x | 9,268 | 0,1625 | 112 | 23 |
| Mond an 80 mm bei 200x | 9,627 | 0,1456 | 106 | 10 |
| Mars 14'' an 80 mm bei 200x | 10,377 | 0,1156 | 95 | 10 |
| Himmel A-D9, Bortle 1 / 5 / 9 | 25,28 / 23,38 / 20,38 | 0,00119 / 0,00213 / 0,00536 | 4 / 7 / 16 | 0 |
| Himmel Fernglas 10x50, Bortle 1 / 9 | 22,47 / 17,57 | 0,00282 / 0,0127 | 9 / 30 | 0 |
| Himmel 21,875 mag/arcsec$^2$ (Bortle 8, AP 0,8 mm) | 21,875 | 0,003388 | | |

Nach #71 (Quellweiss Mond 3,91, Mars 14'' 2,54, `objekte.md` 5.3; $\mu$ verschiebt sich um die Differenz, der Himmel bleibt):

| Fall | $\mu$ | Anzeige $w$ | sRGB |
|---|---|---|---|
| Mond blosses Auge | 4,193 | 0,7720 | 227 |
| Mond Fernglas 10x50 | 4,765 | 0,6476 | 210 |
| Mond A-D9 | 7,573 | 0,2735 | 143 |
| Mars 14'' an 80 mm bei 120x | 7,708 | 0,2624 | 140 |
| Mond an 80 mm bei 200x | 10,187 | 0,1226 | 98 |
| Mars 14'' an 80 mm bei 200x | 8,817 | 0,1867 | 120 |

Mond A-D9 und Mars 14'' bei 120x sind mit `rendere` nachgemessen (`faktorObjekt` 0,2735 bzw. 0,2624).

Version 2 (Issue #100, Anzeigeweiss 9,2 und Punktweiss 6,4, A-P13): dieselben Eingaben wie in der ersten Tabelle (Quellweiss Mond 3,35, Mars 14'' 4,1); $w$ waechst um den festen Faktor $10^{(0{,}4/3)(9{,}2 - 3{,}35)} = 6{,}0256$, der Punktfaktor $a$ (Abschnitt 14.2) um $10^{0{,}4(6{,}4 - 3{,}35)} = 16{,}596$ (ber.). Werte ber. mit $w = 10^{-0{,}4 n (\mu - 9{,}2)}$, $a = 10^{-0{,}4(\mu - 6{,}4)}$, $n$ = 1/3, $\mu$ aus Abschnitt 9 (45 Grad, klar, Kasten-Young); Unit-Tests in `src/physik/helligkeit.test.ts`, die Werte mit 3,35 in `src/physik/regression_v1.test.ts`.

| Fall | $\mu$ | Anzeige $w$ (Version 1) | sRGB |
|---|---|---|---|
| $w(9{,}2)$, $w(11{,}7)$, $w(16{,}7)$, $w(7{,}35)$ | | 1; 0,4642; 0,1; 1,7647 | |
| Quellweiss 3,4, AP 0,8 mm ohne Verluste | 7,7753 | 1,5487 (0,2570); $a$ = 0,28176 | |
| Himmel 21,875 mag/arcsec$^2$ (Bortle 8, AP 0,8 mm) | 21,875 | 0,020415 (0,003388) | |
| Mond A-D9 | 7,013 | 1,9571 (0,3248) | |
| Mond Fernglas 10x50 | 4,205 | 4,6346 (0,7692) | |
| Mond an 80 mm bei 200x | 9,627 | 0,8770 (0,1456) | |
| Mond blosses Auge | 3,633 | 5,5250 (0,9169) | |
| Mars 14'' (4,1) an 80 mm bei 120x | 9,268 | 0,9793 (0,1625) | |
| Himmel Fernglas 10x50, Bortle 1 / 9 | 22,47 / 17,57 | 0,0170 / 0,0765 (0,00282 / 0,0127) | 35 / 78 |
| Jupiter 47'' (4,29) im 10x50 | 5,144 | 3,4728 (0,5763); $a$ = 3,1772 (0,1914) | |
| Io auf einem Arbeitspixel 22,85'', $p$ = 0,000996 (14.3) | | $\min(1, (a p)^{1/3})$ = 0,1468 (0,0576); linear $w p$ = 0,0035 | 107 (68); 11 |
| Mars 14'' (2,54) / 25'' (1,68) bei AP 6 mm am 80 mm (14.4) | | 6,840 / 8,907 (1,135 / 1,478) | |
| Himmel bei AP 6 mm am 80 mm, Bortle 5 | 20,114 | 0,03505 | |

### 12.5 Unsicher

1. **Stevens & Stevens [54]:** Bibliographie nur aus [56], Band und Jahr widersprechen sich; fuer die Entscheidung nicht noetig, weil kein Adaptionsniveau eingeht.
2. **Exponent fuer Planetenscheibchen:** Mars mit 14'' erscheint bei 120x unter etwa 0,5 Grad, kleiner als Stevens' 5-Grad-Feld; fuer kleine Felder naehert sich der Exponent dem Punktquellenwert 0,5 [53]. Fuer die Anzeige bleibt ein Exponent fuer alle Objekte, damit Verhaeltnisse zwischen Objekten erhalten bleiben.
3. **Wahl von $\mu_\mathrm{weiss}$:** Bildschirm, Umgebungslicht und Helligkeitseinstellung des Nutzers sind unbekannt; die Wahl ist am Bild in Phase 6 zu pruefen (**geprueft, beibehalten:** `docs/validierung.md` 5). Eine Konstante in `src/physik/konstanten.ts` aendert alle Anzeigewerte gemeinsam.
4. **Schleier des Himmels:** Weil Objekt und Himmel getrennt komprimiert werden, hebt die Abbildung den Himmel relativ zum Objekt um den Faktor $(L_\mathrm{obj}/L_\mathrm{Himmel})^{2/3}$ an. Ueber dunklen Bildteilen wirkt er wie ein Schleier (fuer Trabanten seit #72 durch die Punktebene aufgehoben, Abschnitt 14): in A-D9 zeigt ein Pixel mit $q$ = 0,01 (relativ zu Quellweiss) 0,0032, der Himmel 0,0021. Physikalisch waere der Himmel dort um Groessenordnungen dunkler. Am Bild in Phase 6 pruefen (Abhilfe waere etwa, den Himmel mit der Anzeigehelligkeit des Objekts linear mitzufuehren). **Geprueft in Phase 6 (`docs/validierung.md` 5):** kein sichtbarer Schleier, die Nachtseite des Mondes in T3 ist so dunkel wie der Himmel.
5. **Exponent:** 1/3 ist eine Groessenordnung nach Stevens, keine Herleitung; wie $\mu_\mathrm{weiss}$ in Phase 6 am Bild zu pruefen (**geprueft, beibehalten:** `docs/validierung.md` 5).
6. **Begrenzung bei Mars (seit Issue #71):** Quellweiss von Mars 25'' (1,68) und 14'' (2,54) ist heller als $\mu_\mathrm{weiss}$ = 3,35. `anzeigefaktor` begrenzt das Niveau auf 1, sobald $\mu_\mathrm{obj} < 3{,}35$: am 80-mm-Refraktor (45 Grad, klar, eigene Rechnung aus `faktorObjekt` bei 60x) fuer Mars 25'' ab etwa 3,3 mm Austrittspupille, fuer Mars 14'' ab etwa 5,0 mm; Mars 6'' (3,10) erreicht die Grenze nicht. Darueber ist die Anzeige konstant, A-P4 (heller mit groesserer Austrittspupille) gilt dort fuer Mars nicht mehr. Kein Pixel wird abgeschnitten, das Scheibenmittel liegt bei 0,14 bis 0,24 (`objekte.md` 5.3). Abhilfe waere, statt des Niveaus erst das Pixel $q \cdot w$ zu begrenzen (Anzeigehelligkeit von Quellweiss darf 1 uebersteigen, `Anblick` erlaubt Werte ueber 1), oder $\mu_\mathrm{weiss}$ heller zu waehlen; offen fuer Herbert, nicht in #71 (`src/` bleibt). **Erledigt mit Issue #72 (Herbert, 2026-10-27):** erste Abhilfe umgesetzt, Begrenzung erst je Pixel beim Zeichnen (14.4).

## 13. Trabanten als Punktquellen (Issue #14)

**Datum:** 2026-10-27. **Kennungen:** A-P6, A-X2, T6. Ergaenzt Abschnitt 7 und 9 (Punktquelle).

### 13.1 Helligkeit relativ zu Quellweiss

Die Naht verlangt fuer jede Punktquelle eine Flaechenhelligkeit relativ zu Quellweiss, ohne den gemeinsamen Faktor `Helligkeit.faktorObjekt` (`docs/architektur.md` Abschnitt 3). bild malt den Trabanten als gleichmaessig helle Scheibe mit seinem Winkeldurchmesser $d$ ins Arbeitsraster. Seine mittlere Flaechenhelligkeit folgt aus Magnitude und Flaeche [60] (dieselbe Formel, mit der `objekte.md` 5.2 die mittlere Flaechenhelligkeit der Planetenscheibe rechnet):

$$\mu_\mathrm{T} = m + 2{,}5\log_{10}\!\left(\pi\,\frac{d^2}{4}\right), \qquad h_\mathrm{rel} = 10^{-0{,}4\,(\mu_\mathrm{T} - \mu_\mathrm{weiss})}$$

mit $\mu_\mathrm{weiss}$ = `weissMagProArcsec2` des Objektzustands. Das setzt voraus, dass der Wert 1,0 im Quellbild wirklich $\mu_\mathrm{weiss}$ bedeutet; seit Issue #71 ist Quellweiss so geeicht (`objekte.md` 5.3, 13.5 Punkt 4). Der Fluss der gemalten Scheibe ist $h_\mathrm{rel}\,\pi d^2/4 = 10^{-0{,}4\,(m - \mu_\mathrm{weiss})}$ Quadratbogensekunden Quellweiss, haengt also nur von der Magnitude ab; der Durchmesser bestimmt nur, wie flaechig der Fluss vor der Faltung liegt.

Warum Atmosphaere, Transmission, Abschattung und Oeffnung nicht in $h_\mathrm{rel}$ stehen (das Issue nennt sie): nach Abschnitt 7 und 9 ist der Punktquellenfluss am Auge $\propto 10^{-0{,}4 m}\,a\,\tau\,(1-\epsilon^2)\,D^2$, bei $AP > p$ begrenzt die Augenpupille auf $(pV)^2$. Das Bild auf der Netzhaut ist um $V$ vergroessert, seine Flaeche waechst mit $V^2$. Die Flaechenhelligkeit des Trabantenbilds ist damit $\propto a\,\tau\,(1-\epsilon^2)\,\min(D, pV)^2/V^2 = a\,\tau\,(1-\epsilon^2)\,\min(AP, p)^2$, derselbe Faktor wie fuer die Planetenflaeche (Abschnitt 5.1, 9). Er steckt fuer beide in `faktorObjekt` und wird mit derselben Anzeigeabbildung (Abschnitt 12) auf den Bildschirm gebracht. Die Oeffnung wirkt ueber die PSF: die Faltung verteilt den festen Fluss auf die Flaeche der Gesamt-PSF, kleine Oeffnung und schlechtes Seeing machen den Punkt breiter und dunkler (Abschnitt 7, "Spitzenwert $\propto$ Fluss / Flaeche der PSF").

### 13.2 Malen ins Arbeitsraster

Ein Trabant ist kleiner als die Gesamt-FWHM, oft kleiner als ein Arbeitspixel (Rhea 0,25'' gegen 1 bis 25''/px). bild verteilt den Fluss $h_\mathrm{rel}\,\pi (d/2s)^2$ ($s$ Arbeitsmassstab) nach Flaechenanteilen auf die Pixel eines Kreises mit Durchmesser $\max(d/s, 1)$ Arbeitspixel (Unterabtastung 8 x 8 je Pixel, normiert auf den Fluss). So bleibt der Fluss auch unter einem Pixel erhalten und die Lage ist subpixelgenau; ab $d/s > 1$ zeigt das Raster die Scheibe mit $h_\mathrm{rel}$. Danach faltet bild mit derselben Gesamt-PSF wie das Objekt (ADR-0002), "Scheibchen oder Punkt" ergibt sich ohne Fallunterscheidung (Abschnitt 7). Seit Issue #72 nicht mehr ins Objektraster, sondern in eine eigene Punktebene desselben Rasters (Abschnitt 14).

### 13.3 Blendungsregel

A-P6: unterdrueckt, wenn der Trabant weniger als 10' von einem mehr als 6 mag helleren Objekt entfernt steht (Vorschlag `objekte.md` Punkt 13, `docs/recherche/README.md` Punkt 8). Der Abstand ist der **scheinbare**, $V \cdot r$ mit $r$ dem Mittenabstand am Himmel, wie in `docs/entwuerfe/naht-variante-3.md` Abschnitt 3. Mit dem Abstand am Himmel waeren auch im 10x50 alle vier Jupitertrabanten (1,8' bis 8,7') unterdrueckt, entgegen T6. Blender sind das Objekt (Mitte 0/0) und die anderen Trabanten; in Version 1 erfuellt nur der Planet $\Delta m > 6$. Kein Quellenbeleg fuer die Schwellen 10' und 6 mag: sie sind eine Modellentscheidung ohne Quelle (A-P6), Ersatz fuer die nicht simulierte Blendung (A-P9). Der scheinbare Abstand ist von Herbert am 2026-10-27 bestaetigt (ADR-0002, Nachtrag; A-P6 nachgetragen).

Grenzvergroesserung $V_\mathrm{grenz} = 600''/r$ (eigene Rechnung, Werte `daten/objekte.json`):

| Zustand | Trabant | $r$ | $\Delta m$ | $V_\mathrm{grenz}$ |
|---|---|---|---|---|
| Jupiter 47'' (-2,7) | Io / Europa / Ganymed / Kallisto | 110,0 / 175,1 / 330,0 / 520,1'' | 7,7 / 8,0 / 7,3 / 8,4 | 5,45 / 3,43 / 1,82 / 1,15 |
| Saturn 20'' (-0,1) | Titan / Rhea | 156,4 / 63,5'' | 8,4 / 9,6 | 3,84 / 9,45 |
| Saturn 16'' (0,6) | Titan / Rhea | 125,1 / 50,8'' | 8,2 / 9,4 | 4,79 / 11,81 |

Blosses Auge ($V$ = 1): alle Trabanten unterdrueckt. 10x50: alle vier Jupitertrabanten sichtbar, bei Saturn 20'' auch Rhea (knapp), bei Saturn 16'' ist Rhea unterdrueckt.

### 13.4 Testwerte (A-Q1)

Spalte "vor #71": Quellweiss jup_47 5,3 und sat_20 6,6, Stand vor #71; das sind die festen Eingaben der Unit-Tests (`src/physik/punktquellen.test.ts`) und bleiben so. Spalte "nach #71": Quellweiss 4,29 bzw. 5,34 (`objekte.md` 5.3). Seit Issue #79 sind es 4,83 (Jupiter) und 5,85 (Saturn), weil die Quellbilder im Kontrast angeglichen sind; die Rechnungen in 13.4 und 14 bleiben als Beispiele mit 4,29 stehen.

| Trabant (Zustand) | $m$ | $d$ | $\mu_\mathrm{T}$ | $h_\mathrm{rel}$ vor #71 | $h_\mathrm{rel}$ nach #71 |
|---|---|---|---|---|---|
| Io (jup_47) | 5,0 | 1,20'' | 5,1336 | 1,1656 | 0,4598 |
| Europa | 5,3 | 1,03'' | 5,1019 | 1,2002 | 0,4734 |
| Ganymed | 4,6 | 1,73'' | 5,5280 | 0,8106 | 0,3198 |
| Kallisto | 5,7 | 1,58'' | 6,4310 | 0,3529 | 0,1392 |
| Titan (sat_20) | 8,3 | 0,85'' | 7,6848 | 0,3682 | 0,1154 |
| Rhea (sat_20) | 9,5 | 0,25'' | 6,2274 | 1,4094 | 0,4416 |

$h_\mathrm{rel} > 1$ ist erlaubt (begrenzt wird erst beim Zeichnen); vor #71 kam es vor, weil Quellweiss zu dunkel geeicht war, nach #71 liegen alle Trabanten unter 1.

### 13.5 Unsicher und offen

1. **Ergaenzung im Issue zu T6 ("80 mm zeigt Titan, Rhea nur bei groesserer Oeffnung als Punkt"):** stand nicht in T6 (`docs/anforderungen.md`) und folgt nicht aus der Blendungsregel, denn die haengt an der Vergroesserung, nicht an der Oeffnung: an 80 mm ist Rhea (Saturn 20'') ab $V$ = 9,45 sichtbar, also bei jeder Austrittspupille bis 8,5 mm; nach der Grenzgroesse (Abschnitt 7, $7{,}7 + 5\log_{10} 8 = 12{,}2$ mag) ebenfalls. Der Satz ist im Issue gestrichen (Herbert, 2026-10-27). Getestet ist, was das Modell hergibt: Titan und Rhea sichtbar bei $V \ge 9{,}45$, Rhea geblendet darunter.
2. **Sichtbarkeit im Bild:** Gemessen mit `rendere` (Fenster 400'', 1024 px, 45 Grad, klar, Bortle 5, Anzeigewert nach sRGB): Saturn 20'' an 80 mm bei 60x und 2'' Seeing Himmel 7, Titan 11, Rhea 9; an 300 mm bei 200x und 1'' Himmel 8, Titan 25, Rhea 15. Jupiter 47'' im 10x50 im ganzen Gesichtsfeld (22,85''/Arbeitspixel): Himmel 16, Trabanten 17 bis 18; an 80 mm bei 60x (2,9''/px) Himmel 7, Trabanten 18 bis 36. Am Fernrohr sind diese Trabanten leicht zu sehen. Hauptursachen (Review PR #69): (a) Die Anzeigeabbildung (Abschnitt 12) bildet Objekt und Himmel je Ebene ab und hebt den Himmel dabei relativ um $(L_\mathrm{obj}/L_\mathrm{Himmel})^{2/3}$ an (12.5 Punkt 4), waehrend verduennte Teile der Objektebene linear klein bleiben; ein Io-Pixel im 10x50, selbst mit $w(\mu)$ abgebildet, gaebe etwa sRGB 67 statt 17. (b) Im 10x50-Standardfenster ist ein Arbeitspixel 22,85'' und damit rund viermal groeber als die Augenaufloesung $60''/V$ = 6''; der Fluss verteilt sich auf ein viel zu grosses Pixel. Die Loesung kommt mit Issue #72, nicht in #14. Nachtrag Issue #71: Mit dem geeichten Quellweiss sinkt $h_\mathrm{rel}$ um $\Delta\mu_\mathrm{weiss}$, die Anzeigehelligkeit von Quellweiss steigt nur um $\Delta\mu_\mathrm{weiss}/3$; die Trabanten werden in der Anzeige um $2/3\,\Delta\mu_\mathrm{weiss}$ dunkler (Jupiter 0,67 mag, Saturn 20'' 0,84 mag), der Planet um $\Delta\mu_\mathrm{weiss}/3$ heller. Nachgemessen wie oben (Fenster 400'', 1024 px, 80 mm bei 60x, Spitze im Gruenkanal, sRGB): Io 32 auf 23, Europa 31 auf 23, Titan 11 auf 9, Rhea 9 auf 8. Das Verhaeltnis Trabant zu Planet stimmt jetzt; die Sichtbarkeit bleibt Aufgabe von #72. **Erledigt mit Issue #72 (2026-10-27):** Punktquellen liegen in einer eigenen Ebene, die je Pixel mit der Potenz aus 12.3 abgebildet wird (Abschnitt 14); gemessen 10x50 Himmel 16, Monde 62 bis 72, 80 mm bei 60x Himmel 7, Titan 47, Rhea 40 (14.5).
3. **Gleichmaessig helle Scheibe:** keine Randverdunklung, keine Phase; bei Durchmessern unter der Gesamt-FWHM ohne sichtbaren Einfluss.
4. **Erledigt mit Issue #71 (2026-10-27):** Quellweiss ist fuer alle Zustaende auf den Pixelwert 1,0 geeicht (`objekte.md` 5.3, Werkzeug `tools/quellweiss_eichen.py`, Probe 0,05 mag): Jupiter 4,29 / 4,35, Saturn 5,34 / 5,56 (Kugel plus Ring), dazu Mond 3,91 und Mars 1,68 bis 3,10. Die Werte in 13.4 sind nachgetragen, der urspruengliche Befund folgt. **Quellweiss bei Jupiter und Saturn falsch geeicht (Review PR #69, Issue #71):** `weiss_mag_arcsec2` in `daten/objekte.json` ist die mittlere Flaechenhelligkeit der Scheibe (`objekte.md` 5.2), das Scheibenmittel im Quellbild liegt aber bei etwa 0,38 statt 1,0. Folge: die Planetenflaeche ist im Arbeitsraster um 1,07 mag (Jupiter) bzw. 1,27 mag (Saturn, Kugel plus Ring) zu dunkel, die Trabanten sind gegenueber dem Planeten 2,7- bis 3,2-mal zu hell. Die Formel in 13.1 bleibt richtig; falsch ist der Bezug $\mu_\mathrm{weiss}$. Die Korrektur der Eichung kommt mit Issue #71, `objekte.json` bleibt in #14 unveraendert.

## 14. Trabanten auf dem Bildschirm: Punktebene (Issue #72)

**Datum:** 2026-10-27. **Kennungen:** A-P6, A-P4, T6. Ergaenzt Abschnitt 12 (Abbildung) und 13 (Trabanten). Ansatz entschieden von Herbert am 2026-10-27.

### 14.1 Problem

Gemessen in 13.5 Punkt 2: die Trabanten sind richtig gemalt und gefaltet, auf dem Schirm aber kaum vom Himmel zu unterscheiden (10x50: Himmel 16, Monde 16 bis 17; 80 mm bei 60x: Himmel 7, Titan 9, Rhea 8). Zwei Ursachen: (a) Abschnitt 12 komprimiert Objekt und Himmel je Ebene mit $n$ = 1/3 und hebt den Himmel dabei um $(L_\mathrm{obj}/L_\mathrm{Himmel})^{2/3}$ an, ein Trabant ist aber ein verduennter Teil der Objektebene und bleibt linear ($q \cdot w(\mu_\mathrm{obj})$ mit $q \ll 1$); (b) das Arbeitspixel verduennt den Fluss: im 10x50 ist es 22,85'' gross, rund viermal groeber als die Augenaufloesung $60''/V$ = 6''.

### 14.2 Entscheidung

Punktquellen bekommen eine **eigene Ebene** (Punktebene) im Arbeitsraster, die wie Objekt und Himmel mit der Abbildung aus Abschnitt 12 auf die Anzeige kommt, aber **je Pixel**:

$$\mathrm{Pixel} = w_\mathrm{obj}\,q + w_\mathrm{Himmel} + \min\!\left(1,\ (a\,p)^{n}\right), \qquad a = \frac{L_\mathrm{Quellweiss,ok}}{L_\mathrm{weiss}} = 10^{-0{,}4\,(\mu_\mathrm{obj} - \mu_\mathrm{weiss})}, \quad n = \tfrac13$$

- $q$: gefaltetes Objektraster, $p$: gefaltete Punktebene, beide relativ zu Quellweiss (Fluss je Arbeitspixel geteilt durch die Pixelflaeche, wie in 13.2). $\mu_\mathrm{obj}$ ist die Flaechenhelligkeit von Quellweiss im Okular (Abschnitt 9, 12.3), $\mu_\mathrm{weiss}$ = 3,35, $n$ = `KOMPRESSIONSEXPONENT`. In der Naht heissen $a$ und $n$ `Helligkeit.punktFaktor` und `punktExponent`; es gilt $w_\mathrm{obj} = a^{n}$ (`faktorObjekt`).
- **Begruendung:** Ein Pixel der Punktebene mit dem Wert $p$ hat im Okular die Leuchtdichte $p \cdot L_\mathrm{Quellweiss,ok}$. Bildet man es wie eine eigene Flaeche mit $w(\mu)$ aus 12.3 ab, ergibt sich $(a\,p)^{n}$. Das ist dieselbe Stevens-Potenz [53] wie fuer Objekt und Himmel, jetzt auf den Trabanten als eigene leuchtende Flaeche gegen den Himmel angewandt statt als Teil des Objektbilds. Dessen Binnenkontrast bleibt linear (12.3); ein Trabant gehoert nicht zum Binnenkontrast der Planetenscheibe, sondern steht wie der Himmel fuer sich. Damit hebt die Abbildung den Trabanten gegen den Himmel genauso an wie den Himmel gegen das Objekt, Ursache (a) entfaellt. Stevens nennt fuer Punktquellen $n$ = 0,5 [53]; wir bleiben bei einem Exponenten fuer alle Ebenen (12.5 Punkt 2), damit Verhaeltnisse zwischen den Ebenen erhalten bleiben.
- **Faltung:** bild malt die Trabanten wie bisher (13.2, Fluss erhalten), aber nicht ins Objektraster, sondern je Trabant in ein kleines Feld, und faltet es lokal in JavaScript direkt mit dem Kern (Kern hoechstens 81 px, Scheibchen wenige Pixel). Am Rand wird der Kern nicht neu normiert: was ausserhalb des Rasters faellt, fehlt, ein Trabant knapp ausserhalb des Fensters reicht mit seinen Fluegeln hinein. Die Falter fuer das Objekt (JavaScript, WebGL2) bleiben unveraendert.
- **Ort der Kompression:** je Arbeitspixel in `tonwert`, vor dem Hochskalieren auf die Anzeige; das Arbeitsraster ist nie feiner als die Anzeige.
- **Ueberlappung:** Trabant vor der Scheibe oder im Saturnring: die Beitraege werden addiert, ueber 1 begrenzt erst `zeichne.ts`.
- **Oberhalb 1:** $\min(1, \cdot)$ je Pixel der Punktebene; eine Punktquelle allein wird hoechstens Bildschirmweiss.
- **Flaechige Objekte unveraendert:** ohne sichtbare Punktquelle im Fenster ist die Punktebene leer und der Anblick bitgleich mit dem Stand vor #72 (Test in `src/bild/rendere.test.ts`; gemessen fuer Mond A-D9 und Jupiter bei 200x, 14.5). Mit Trabanten aendern sich nur Pixel in der Naehe der Trabanten, keines der Planetenscheibe.
- **Vergleichsbild (Zoom, A-D3):** neutrale Helligkeit $a$ = 1, $n$ = 1, also linear wie bisher (nur je Pixel auf 1 begrenzt).

### 14.3 Testwerte (A-Q1)

Eigene Rechnung, 45 Grad, klar, Bortle 5 (Abschnitt 9, 12.3); Unit-Tests in `src/physik/helligkeit.test.ts` und `src/bild/punktebene.test.ts`.

| Fall | Wert |
|---|---|
| $a$ fuer $\mu$ = 3,35 / 5,85 / 0,85 | 1 / 0,1 / 10 |
| Quellweiss 3,4, AP 0,8 mm ohne Verluste ($\mu_\mathrm{obj}$ = 7,775) | $a$ = 0,01698, $a^{1/3}$ = 0,2570 = `faktorObjekt` |
| Jupiter 47'' im 10x50 (Quellweiss 4,29, $\mu_\mathrm{obj}$ = 5,144) | $a$ = 0,1914, `faktorObjekt` 0,5763 |
| Io ganz auf einem Arbeitspixel 22,85'': $p = 10^{-0{,}4(5{,}0 - 4{,}29)}/22{,}85^2$ | $p$ = 0,000996; $(a\,p)^{1/3}$ = 0,0576 (sRGB 68); linear waeren es $w_\mathrm{obj}\,p$ = 0,00057 (sRGB 7) |
| Tonwert synthetisch, $a$ = 4, $n$ = 1/3: $p$ = 0,02 / 3 | 0,431 / 1 (begrenzt) |
| Tonwert synthetisch, $a$ = 1, $n$ = 1/3: $p$ = 0,001 | 0,1 statt 0,001 |

### 14.4 Mars: Begrenzung erst je Pixel

Nach #71 ist Quellweiss von Mars 25'' (1,68) und 14'' (2,54) heller als $\mu_\mathrm{weiss}$ = 3,35. Die Begrenzung von $w$ auf 1 in 12.3 liess die Anzeige von Mars am 80-mm-Refraktor ab etwa 3,3 mm (25'') bzw. 5 mm (14'') Austrittspupille konstant, A-P4 war dort verletzt (12.5 Punkt 6). Entscheidung (Herbert, 2026-10-27): `anzeigefaktor` begrenzt nicht mehr, `faktorObjekt` darf 1 uebersteigen; begrenzt wird erst das Pixel $q \cdot w_\mathrm{obj}$ beim Zeichnen (`src/ui/zeichne.ts` tat das schon, `Anblick` erlaubt Werte ueber 1). Der Himmel bleibt auf 1 begrenzt (praktisch nie erreicht), die Punktebene je Pixel (14.2). Weil das Scheibenmittel im Quellbild bei 0,14 bis 0,24 liegt (`objekte.md` 5.3), wird auch bei `faktorObjekt` 1,48 kaum ein Pixel abgeschnitten.

`faktorObjekt` am 80/600-Refraktor (45 Grad, klar, eigene Rechnung, Test `helligkeit.test.ts`):

| AP [mm] | 0,5 | 1 | 2 | 3 | 3,33 | 4 | 5 | 6 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Mars 14'' (2,54) | 0,2166 | 0,3438 | 0,5458 | 0,7151 | 0,7672 | 0,8663 | 1,0053 | 1,1352 | 1,1352 |
| Mars 25'' (1,68) | 0,2820 | 0,4477 | 0,7107 | 0,9312 | 0,9990 | 1,1281 | 1,3091 | 1,4782 | 1,4782 |

Bis #72 waren dieselben Werte auf 1 begrenzt (Mars 25'' ab AP 3,33 mm, Mars 14'' ab 5 mm). Damit steigt die Anzeige von Quellweiss fuer alle Objekte der Version 1 streng mit der Austrittspupille bis 6 mm (12.3, Monotonie). Abweichung zu `anzeigefaktor`-Test 12.4: $w(1{,}5)$ ist jetzt 1,7647 statt 1.

### 14.5 Messung am Bild

`rendere` mit den echten Daten und Bildern (`daten/`), JavaScript-Falter, 45 Grad, klar, Bortle 5, Seeing 2'', Anzeige 1024 px; Werte im Gruenkanal als sRGB-Kodewert (8 Bit). Himmel im Gesichtsfeld abseits der Objekte, Trabant = groesster Wert in einer Umgebung von 3 x 3 (10x50, Auge) bzw. 7 x 7 Anzeigepixeln um seine Position, Scheibe = Mitte.

| Anblick | Arbeitspixel | Himmel | Trabanten vor #72 | Trabanten nach #72 | Scheibe (vor = nach) |
|---|---|---|---|---|---|
| Jupiter 47'' im 10x50, ganzes Gesichtsfeld | 22,85'' | 16 | Io 16, Europa 16, Ganymed 17, Kallisto 16 | Io 63, Europa 64, Ganymed 72, Kallisto 62 | 115 |
| Jupiter 47'' mit blossem Auge (alle geblendet) | 25,28'' | 18 | keiner | keiner (bitgleich) | 70 |
| Saturn 20'' an 80/600 bei 60x, Fenster 400'' | 1,22'' | 7 | Titan 9, Rhea 8 | Titan 47, Rhea 40 | 75 |
| Saturn 20'' an 80/600 bei 60x, ganzes Gesichtsfeld | 2,93'' | 7 | Titan 8, Rhea 7 | Titan 43, Rhea 37 | 77 |
| Jupiter 47'' an 80/600 bei 60x, Fenster 400'' | 1,22'' | 7 | Io 23, Europa 23 | Io 77, Europa 77 | 117 |
| Mond A-D9, ganzes Gesichtsfeld | 2,93'' | | | bitgleich | |
| Jupiter 47'' an 80/600 bei 200x, Fenster 100'' (keine Trabanten im Fenster) | 1,16'' | 3 | | bitgleich | 79 |

Beim Mars aendert sich nur die Anzeige ab der frueheren Grenze (14.4): Scheibenmitte Mars 25'' bei AP 4 / 5 / 6 mm vorher 100 / 101 / 103, nachher 106 / 114 / 123; Mars 14'' bei AP 5 / 6 mm vorher 134 / 130, nachher 134 / 138. Unterhalb der Grenze bitgleich. Laufzeit: Malen und lokale Faltung der Punktebene 0,02 bis 0,3 ms (Raster bis 1024 px, Kern bis 17 px), `rendere` insgesamt unveraendert (10x50 etwa 106 ms in Node).

### 14.6 Verworfen

- **Abtastung an der Augenaufloesung ausrichten** (Arbeitspixel hoechstens $60''/V$): im 10x50 waeren fuer das ganze Gesichtsfeld 23 400''/6'' = etwa 3900 Arbeitspixel je Achse noetig, Faltung und Speicher wuechsen um den Faktor 15; Ursache (a) bliebe ausserdem bestehen: Io gaebe linear selbst mit dem ganzen Fluss in einem 6''-Pixel nur etwa sRGB 30 gegen den Himmel 16.
- **Verstaerkung in physik ueber einen geschaetzten Spitzenanteil** (`helligkeitRelativ` so erhoehen, dass die Spitze nach der Faltung $w$ trifft): nur eine Naeherung (Spitzenanteil haengt von Lage im Pixel und PSF ab) und koppelt Stufe 1 an die Helligkeit, ein Wechsel der Austrittspupille muesste Stufe 1 und 2 neu rechnen.
- **Trabanten im Objektraster lassen und das ganze Bild je Pixel komprimieren:** veraendert den Binnenkontrast des Objekts (12.3, verworfen).

### 14.7 Unsicher

1. **Abhaengigkeit vom Arbeitsmassstab:** Solange die Gesamt-PSF kleiner als ein Arbeitspixel ist, ist $p \propto$ Fluss / Pixelflaeche, die Anzeige also $\propto s^{-2/3}$ ($s$ Arbeitsmassstab). Ein Trabant erscheint im Zoom (feineres Raster) heller als im ganzen Gesichtsfeld (Saturn 80 mm: Titan 47 gegen 43); ist das Pixel feiner als die PSF, haengt die Spitze nicht mehr am Raster. Im 10x50 bleibt Ursache (b): gegenueber einer Abtastung an der Augenaufloesung (6'') sind die Monde um $(22{,}85/6)^{2/3}$ = 2,4 dunkler. T6 ist trotzdem erfuellt (vier Monde sRGB 62 bis 72 gegen den Himmel 16, linear etwa zehnmal heller). Am Bild in Phase 6 pruefen. **Geprueft in Phase 6 (`docs/validierung.md` 5):** plausibel, kein Issue.
2. **Exponent fuer Punktquellen:** Stevens' Wert fuer Punktquellen ist 0,5 [53]; mit 1/3 werden schwache Trabanten staerker angehoben. Bewusst ein Exponent fuer alle Ebenen (14.2); wie 12.5 Punkt 5 in Phase 6 am Bild pruefen. **Geprueft in Phase 6 (`docs/validierung.md` 5):** die Monde sind im 70 mm und im 10x50 sichtbar wie in der Erfahrung, kein Anlass zu aendern.
3. **Grosse Trabantenscheibchen:** Ab $d/s > 1$ zeigt die Punktebene die Scheibe des Trabanten mit $h_\mathrm{rel}$; ihr Inneres wird dann mit $(a\,h_\mathrm{rel})^{1/3}$ abgebildet, nicht linear wie die Planetenscheibe. In Version 1 sind alle Trabanten (hoechstens 1,73'') kleiner als die Gesamt-FWHM, ohne sichtbare Folge.

## 15. Cassini-Teilung unter Langzeit-Seeing (Issue #76)

Anlass: Validierung T2 (`docs/validierung.md`, Abweichung 1). Bei Saturn 20'', 100 mm, 150-fach und Seeing 1,5'' zeigt das Bild keine Cassini-Teilung (Delle 0,000, 8.1), A-Q2 erwartete sie. Zu entscheiden war, ob die Erwartung fuer das Langzeitmittel (A-P5) zu optimistisch ist oder das Seeing-Modell fuer visuelle Beobachtung zu streng.

### 15.1 Bildbewegung als Anteil der Langzeit-FWHM

Mit der Tilt-Varianz aus 2.3 [14, 21] und $r_0 = 0{,}98\,\lambda/\mathrm{FWHM}$ (2.1) ergibt sich bei 1,5'' ($r_0$ = 7,4 cm, $D/r_0$ = 1,35 am 100 mm) eine Bildbewegung von $2{,}355\,\sigma_\alpha$ = 1,46'' am 100 mm und 1,59'' am 60 mm (eigene Rechnung). Die Langzeit-FWHM besteht hier fast nur aus Bewegung; die Heuristik aus 2.3 ergibt als Kurzzeit-FWHM 0,33'' (100 mm) und 0,10'' (60 mm, praktisch beugungsbegrenzt). Das passt zu Sacek: unterhalb $D/r_0 \approx 3$ bleibt das Beugungsbild weitgehend intakt [20].

### 15.2 Delle mit und ohne Bildbewegung

Eigene Rechnung mit `baueKern` und `profilDelle` (8.1), Arbeitsmassstab Gesamt-FWHM/2,5, Profile wie in `src/physik/validierung.test.ts`. Abgezogen wird der Anteil $f$ der Tilt-Varianz: $\mathrm{FWHM}^2 = \mathrm{FWHM}_\mathrm{lang}^2 - f\,(2{,}355\,\sigma_\alpha)^2$. Schwelle "erkennbar" 0,125 (`docs/validierung.md` 3).

| Fall | $f$ = 0 (Langzeit) | $f$ = 0,5 | $f$ = 1 (Kurzzeit) |
|---|---|---|---|
| T2a 100 mm, Quellprofil (A-Ring innen 0,50, aussen 0,21) | 0,000 | 0,000 | 0,029 |
| T2a 100 mm, A-Ring 0,7 / 0,6 (angenommen) | 0,000 | 0,059 | 0,224 |
| T2b 60 mm, A-Ring 0,7 / 0,6 | 0,000 | 0,007 | 0,043 |
| T4d Detail 1,5'', 100 mm, 1'' (Urteil: nicht) | 0,112 | 0,128 | 0,147 |
| T5b Syrtis Major, Mars 6'', 80 mm (Urteil: nicht) | 0,060 | 0,129 | 0,231 |
| T1, T3, T4a bis T4c, T5a, T6c | Urteile in allen Spalten unveraendert |

Zum Vergleich mit Langzeit-Seeing allein (100 mm, A-Ring 0,7 / 0,6): die Delle uebersteigt die Schwelle erst unterhalb von etwa 0,8''.

### 15.3 Entscheidung

**Die Erwartung war fuer das Langzeitmittel zu optimistisch; das Modell bleibt** (Herbert, 2026-10-27). Begruendung:

1. Unter Langzeit-Seeing 1,5'' entsteht am 100 mm auch mit hellerem A-Ring keine Delle. Sichtbar wird die Teilung erst, wenn die Bildbewegung herausfaellt, also in ruhigen Momenten. Die Beobachtungserfahrung beschreibt den Momentan-Anblick (2.3), A-P5 verlangt das Langzeitmittel; den ruhigen Moment deckt A-B6 ab (#29).
2. Ein fuer visuelle Beobachtung entschaerftes Seeing (Tilt-Abzug ueber die Integrationszeit des Auges) hebt schon bei halbem Abzug T4d und T5b ueber die Schwelle, gegen die freigegebenen Urteile. Es waere eine Aenderung von A-P5 und ADR-0002 mit neuer Schwellenableitung, nicht eine Korrektur.
3. 60 mm zeigt die Teilung in keiner Variante; T2b bleibt erfuellt.

A-Q2 T2 ist entsprechend angepasst (`docs/anforderungen.md`).

### 15.4 Folgen fuer andere Issues

- **Quellbild sat_20 (#79):** Der A-Ring ist im Hubble-Bild 0,50 (innen) und 0,21 (aussen) des aeusseren B-Rings hell (`tools/strukturprofile.py`). Damit zeigt selbst der ruhige Moment die Teilung kaum (0,029). Visuell wirkt der A-Ring heller; vermutlich ist das Pressebild nichtlinear gestreckt wie das Jupiterbild in #79. Photometrische Werte fuer das Verhaeltnis A zu B mit Quelle stehen noch aus. **Nachtrag #79 (2026-10-28):** Werte nach Salo und French 2010 (`objekte.md` 4.2): A innen 0,83, A aussen 0,56, Cassini-Zone 0,15. Das Bild ist mit einer Tonkurve angeglichen (eine Potenzkurve, die die A-Ringe trifft, haette die Teilung drei- bis viermal zu hell gemacht). Mit den neuen Stufen (A 0,82 / 0,54, Cassini 0,17) bleibt die Delle im Langzeitmittel 0,000; im ruhigen Moment ergibt sich am 100 mm 0,131 (Anhalt, Arbeitsmassstab des Langzeitkerns), am 60 mm 0,017.
- **Ruhiger Moment (#29):** Der Tilt-Abzug aus 2.3 veraendert nicht nur Cassini, sondern auch T4d und T5b (15.2). Eine Umsetzung braucht eigene Erwartungen fuer den ruhigen Moment und darf die Schwelle nicht aus den Langzeit-Urteilen uebernehmen.

## 16. Freies Doppelsternpaar (Issue #99)

Das freie Paar (A-Z9, `docs/recherche/doppelsterne.md` 3.2) wird in `src/physik/doppelstern.ts` zum Objektzustand; Lage Ost-West wie in doppelsterne.md 3.1 (A bei $-\rho/2$, B bei $+\rho/2$).

**Gesamthelligkeit.** Die Beleuchtungsstaerken der Sterne am Auge addieren sich; mit $m = -2{,}5\log_{10}(\Delta I / Z)$ (wahrnehmung.md, Konventionen, [1] dort) folgt

$$m_\mathrm{ges} = -2{,}5\log_{10}\sum_i 10^{-0{,}4\,m_i}.$$

Zwei gleiche Sterne: $m - 2{,}5\log_{10}2 = m - 0{,}753$.

**Hinweis Ueberstrahlung.** "Ueberstrahlung nicht simuliert" (Warnung `ueberstrahlung`) fuer jedes Sternpaar mit Abstand am Himmel unter 10'' und $|\Delta m| \ge 4$ (A-Z9, doppelsterne.md 5 und 7 Punkt 4, Entscheidung 5 in `docs/recherche/README.md`).

| Test | Rechenweg | Ergebnis |
|---|---|---|
| Zwei gleiche Sterne, 5 mag | $5 - 2{,}5\log_{10}2$ | 4,247 |
| Vorgabe freies Paar 5 und 6 mag | $-2{,}5\log_{10}(10^{-2} + 10^{-2{,}4})$ | 4,636 |
| Antares 0,96 und 5,40 mag | $-2{,}5\log_{10}(10^{-0{,}384} + 10^{-2{,}16})$ | 0,942 |
| Antares 2,579'', $\Delta m$ 4,44 | unter 10'', ab 4 mag | Warnung |
| Albireo 34,3'', $\Delta m$ 1,49 | | keine Warnung |
| Polaris 18,4'', $\Delta m$ 6,56 | nicht unter 10'' | keine Warnung |

## 17. Mischgewicht und Sockel (Issue #97)

Umsetzung der Festlegungen "Unaufgeloest" und "Mindestsichtbarkeit als additiver Sockel" aus ADR-0004 in `src/physik/mischung.ts`; Pixelformel und Bitgleichheit in `docs/architektur.md` 5.3.

### 17.1 Mischgewicht (A-P10)

Uebergangsfunktion nach `wahrnehmung.md` 3.2 (eigene Herleitung aus den Varianzen von Augen-PSF und Scheibe, keine Messung): $g(x) = 1/(1 + \tfrac{\ln 2}{2}\,x^2)$, $x = \theta V / 60''$ mit der Augenaufloesung 60'' (`AUGE_AUFLOESUNG_ARCSEC`, 3.1). Der Faktor steht im Code als $\ln 2/2$ = 0,34657, gerundet 0,3466 wie in ADR-0004. Stetiger Schnitt nach ADR-0004: $g' = \max\big(0, (g - 0{,}005)/0{,}995\big)$; $g' = 0$ genau fuer $x \ge \sqrt{199 \cdot 2/\ln 2} = 23{,}96$ (ber.), also fuer $\theta V \ge 1438''$.

### 17.2 Sockel (Mindestsichtbarkeit)

Deep-Sky-Pixel nach ADR-0004: $h + P\,(w(q) - h + \sigma)$ mit $w(q) = \min(1, (a q + s)^n)$, $h = \min(1, s^n)$. An der Schwelle ist $q = q^*$ und $P$ = 0,5. Gefordert ist, dass dort das Pixel mindestens $\Delta_\mathrm{min}$ sRGB-Kodes ueber dem Himmel $h$ (ohne Sockel, ADR-0004 Nachtrag) liegt: $h + \tfrac12\,(w(q^*) - h + \sigma) \ge L_\mathrm{ziel}$ mit $L_\mathrm{ziel} = \mathrm{lin}\big(\min(255, K(h) + \Delta_\mathrm{min} + 0{,}15)/255\big)$, $K(h) = 255\,\mathrm{sRGB}(h)$. Der kleinste Sockel ist (ber.)

$$\sigma = \max\big(0,\; 2\,(L_\mathrm{ziel} - h) - (w(q^*) - h)\big).$$

Der Kode des Himmels geht stetig ein, nicht gerundet (wie im Prototyp). **Reserve 0,15 Kodes** (`SOCKEL_RESERVE_KODES`, Review PR #118): beim Zeichnen werden Himmel und Schwellenpixel einzeln gerundet, aus einem Float32-Raster und ueber die Tabelle in `src/ui/zeichne.ts`. Ohne Reserve blieben bei etwa 0,6 % der Himmelskodes ($K$ = 0,5 bis 240, $C = a q^*/s$ = 0,135, $\Delta_\mathrm{min}$ = 3) nur 2 statt 3 Kodes Abstand, und zwar dort, wo der Nachkommateil von $K$ um 0,43 bis 0,58 liegt, meist bei $K < 40$. Mit der Reserve ergibt der Test ueber denselben Bereich (Schritt 0,003, Float32 und Tabelle nachgebaut) ueberall mindestens 3 (ber.). sRGB-Kennlinie und Umkehrung nach IEC 61966-2-1 [59] als reine Funktionen in `mischung.ts` (dieselbe Kennlinie wie `src/ui/zeichne.ts` und `src/daten/srgb.ts`; physik importiert diese Module nicht). $\Delta_\mathrm{min}$ = 3 (`SOCKEL_DELTA_KODES`) ist ein Vorschlag ohne Quelle, am Bild festgelegt (`wahrnehmung.md` 9 Punkt 8).

### 17.3 Testwerte (A-Q1)

| Groesse | Eingabe | Erwartung | Herkunft |
|---|---|---|---|
| $g$ vor dem Schnitt | $x$ = 0 / 0,783 / 7,83 | 1 / 0,825 / 0,045 | `wahrnehmung.md` 3.2, 6 |
| $g$ vor dem Schnitt | $x$ = 0,10 / 3,33 / 39,2 | 0,997 / 0,21 / 0,0019 | `wahrnehmung.md` 3.2 |
| $g'$ | Jupiter 47'' mit $V$ = 1 / 10 | 0,8238 / 0,0401 | ber. ($x$ = 0,7833 / 7,833) |
| $g'$ | T5b Mars 6'' bei 120x ($x$ = 12) | 0,0147 | ber. |
| $g'$ | T1, T2a, T2b, T3, T4, T5a ($x$ = 33 bis 3100) | 0 | ADR-0004; ber. |
| sRGB | linear 0,5 / 0,18; kodiert 0,5 | 0,73536 / 0,46136; 0,21404 | [59]; ber. |
| $\sigma$ | Prototyp M31 im 10x50, Bortle 5: $a$ = 7,566e-4 (Kern = 1), $s$ = 2,825e-5, $q^*$ = 5,040e-3, $\Delta_\mathrm{min}$ = 3, $n$ = 1/3 | 0,006279 mit Reserve (Prototyp ohne Reserve 0,005905); Kern sRGB 86 -> 88 (stetig 88,41) | ADR-0004 Befund 3; `prototyp/deep_sky.py` mit `additiv.py` nachgerechnet, ohne Reserve stellengleich (mit $F$ = 1,4 ohne Reserve: $q^*$ = 3,43e-3, $\sigma$ = 0,00631, Kern ebenfalls 88) |
| $\sigma$ | $a q^*$ = 10 $s$, $\Delta_\mathrm{min}$ = 3 | 0 (Abstand an der Schwelle etwa 14 Kodes) | ber. |

### 17.4 Unsicher

1. **Uebergangsfunktion:** eigene Herleitung, siehe `wahrnehmung.md` 9 Punkt 2; am Bild bei T6 pruefen.
2. **Sockel bei hellem Himmel:** liegt $K(h) + \Delta_\mathrm{min}$ ueber 255, wird das Ziel auf Weiss begrenzt; dann ist der Abstand kleiner als $\Delta_\mathrm{min}$. Kommt erst bei einem Himmel nahe Bildschirmweiss vor, also nicht in den Testfaellen.
3. **Quantisierung beim Zeichnen:** durch die Reserve abgedeckt (17.2); geprueft nur fuer $C$ = 0,135 und $K \le 240$, die Tabelle in `src/ui/zeichne.ts` ist im Test nachgebaut, nicht importiert.
4. **Sockel hebt den Himmel:** bei $q$ = 0 ist $P_0 = \Phi(-1/0{,}484)$ = 0,019, der gemalte Himmel liegt also um $P_0\,\sigma$ ueber $h$ (ADR-0004 Nachtrag).

---

## 18. Sternfarbe (Issue #98)

**Datum:** 2026-10-29. **Kennungen:** A-P12, ADR-0004. Umsetzung in `src/physik/sternfarbe.ts`; Herleitung, Tabelle und Unsicherheiten in `docs/recherche/wahrnehmung.md` 5 und 9 Punkt 3 und 11, hier nur die Formeln mit Quelle.

| Groesse | Formel | Quelle |
|---|---|---|
| Farbtemperatur | $T = 4600\,\mathrm{K}\,\bigl(1/(0{,}92\,(B-V) + 1{,}7) + 1/(0{,}92\,(B-V) + 0{,}62)\bigr)$, Pol bei $B-V = -0{,}674$ | Ballesteros 2012, Gl. 14 (wahrnehmung.md [14]) |
| Farbe | Planck 360 bis 830 nm (1 nm), CIE 1931 2 Grad (Naeherung Wyman, Sloan, Shirley 2013), $XYZ$ mit $Y$ = 1, Matrix IEC 61966-2-1 (D65) [59]; Tabelle in 0,1-Schritten von B-V = -0,4 bis 2,0 (3169 bis 21 707 K), linear in B-V interpoliert, ausserhalb die Randzeile | wahrnehmung.md 5.3 (wahrnehmung.md [15], [16]); Erzeugung `tools/sternfarbe_tabelle.py` |
| Beleuchtungsstaerke am Auge | $E = Z\,10^{-0{,}4m}\,a\,\tau\,(1-\epsilon^2)\,(\min(D, pV)/p)^2$, $Z = 2{,}54\cdot10^{-6}$ lx | Abschnitt 13.1; Crumey 2014 [32] fuer $Z$ |
| Schwelle des Farbsehens | $E_\mathrm{Farbe} = Z\,10^{-0{,}4\cdot2{,}3} = 3{,}05\cdot10^{-7}$ lx (gerundet 3,1e-7), darunter grau | Protte und Hoffmann 2020, Fussnote 3 (wahrnehmung.md [13]) |

**Testwerte (A-Q1, ber. mit `tools/sternfarbe_tabelle.py`):** B-V 0,65 / 0 / 1,5 ergibt 5778 / 10 125 / 3794 K; Tabelle wahrnehmung.md 5.3 (Spalte $Y$ = 1) auf 0,01 getroffen, an den sechs Stuetzstellen sogar auf 0,001; Interpolationsfehler bei B-V 0,65 gegen die direkte Rechnung (1,1095 / 0,9763 / 0,9133) unter 0,001. Farbgrenze ohne Extinktion: blosses Auge 2,30 mag, 80 mm Refraktor ($\tau$ 0,9, $AP \le p$) 7,81 mag, 200 mm Newton ($\tau$ 0,8, $\epsilon$ 0,25) 9,60 mag.

**Modellentscheidung:** Die Schwelle ist aus 2,3 mag gerechnet (3,054e-7 lx), nicht der gerundete Wert 3,1e-7 aus ADR-0004; der Unterschied ist 0,016 mag.

## 19. Wahrnehmungsschwelle (Issue #96)

Formeln, Herleitung und Quellen stehen in `docs/recherche/wahrnehmung.md` (dort [1] = Crumey 2014, MNRAS 442, 2600); hier nur die Zuordnung zu `src/physik/schwelle.ts`. Konstanten $F$ = 1,4, $F_T = \sqrt2$, 0,484 und Nullhintergrund $10^{-5}$ cd/m$^2$ in `konstanten.ts` (ADR-0004); die Koeffizienten $r_1, r_2, k_1, k_2, q$ von Gl. 47 bis 49, $Z = 2{,}54\cdot10^{-6}$ lx und die Seeing-Scheibe 2,8 FWHM nur in `schwelle.ts`.

| Funktion | Formel | Quelle |
|---|---|---|
| `leuchtdichteCdM2(mu)` | $B = 10^{(12{,}58 - \mu)/2{,}5}$ | wahrnehmung.md, Konventionen; [1, Abschn. 1.3] |
| `kontrastschwelle(A, B)` | $C = [((r_1 B^{-1/4} + r_2)^2/A)^q + (k_1 B^{-1/4} + k_2)^q]^{1/q}$, $F$ = 1; $B$ auf $10^{-5}$ bis $3{,}426\cdot10^{-2}$ cd/m$^2$ begrenzt | wahrnehmung.md 1.2 und 7 Punkt 1; [1, Gl. 47 bis 50] |
| `schwelleAmOkular` | $C_\mathrm{th} = \varphi[(R_a/A_a)^q + C_a^q]^{1/q}$, $A_a = V^2 A$, $B_a = \min(1, (AP/p)^2)\,\tau(1-\epsilon^2)\,B$, $\varphi = F F_T$ ($F_T$ = 1 bei Fernglas und Auge), fuer $B_a < 10^{-5}$ mal $10^{-5}/B_a$; $\mu_\mathrm{lim} = \mu_\mathrm{Himmel} - 2{,}5\log_{10} C_\mathrm{th} - $ Extinktion | wahrnehmung.md 1.3, 1.4; [1, Gl. 77 bis 80, 84] |
| `grenzgroesse` | $m_0 = -2{,}5\log_{10}(\Delta I/Z)$, $\Delta I = (\delta_\mathrm{max}/D)^2 F_t\,\varphi\,B_a R_a$; Scheibe 2,8 FWHM: $m_\mathrm{lim} = m_0 - (2{,}5/q)\log_{10}[(\alpha/\alpha_{TR})^q + 1] - $ Extinktion, $\alpha_{TR} = R_a/(V^2 C_a)$ | wahrnehmung.md 2.2; [1, Gl. 68, 71, 81, 88] |
| `sichtbareIsophote` | Reserve $d_i = \mu_\mathrm{lim}(\alpha_i) - \mu_i$ kubisch ueber dem Zeilenindex interpoliert, $\mu$ und $\log_{10}\alpha$ linear; groesstes $x$ mit $d(x) \ge 0$ (letzter Vorzeichenwechsel); keine sichtbar: Scheitel von $d(x)$ | wahrnehmung.md 4.4 Punkt 2; [1, Abschn. 3.1]; Interpolation unten |
| `deckkraft(v)`, `deckkraftStern(m, m_lim)` | $P = \Phi((v - 1)/0{,}484)$, Stern $v = 10^{-0{,}4(m - m_\mathrm{lim})}$; $\Phi$ ueber erf nach Abramowitz und Stegun 7.1.26 (Fehler unter $1{,}5\cdot10^{-7}$) | wahrnehmung.md 1.3, 4.4 Punkt 3; [A&S] |

Testwerte: wahrnehmung.md 6 (Crumey-Kontrollwerte mit $F$ = 1, 2, 2,36; Tabelle 2.3 mit $F$ = 1,4). Gegenprobe ohne Literaturwert: fuer eine Scheibe der Flaeche $\alpha$ gilt $m_\mathrm{lim} = \mu_\mathrm{lim}(\alpha) - 2{,}5\log_{10}\alpha$ (Gl. 88 gegen Gl. 77), auch unter dem Nullhintergrund, wenn $C_\mathrm{th}$ dort relativ zu $10^{-5}$ cd/m$^2$ gilt und mit $10^{-5}/B_a$ auf den echten Himmel umgerechnet wird ($\Delta B$ fest, wahrnehmung.md 1.1); die beiden Nullpunkte 12,58 mag/arcsec$^2$ und $Z$ passen bis auf 0,004 mag zusammen.

Interpolation der Reserve (Entscheidung Herbert zu PR #121): Mit "keine sichtbar = beste Zeile" sprang die Lage um eine Zeile (0,1 mag), sobald zwei Zeilen gleich guenstig wurden. Jetzt ist $d(x)$ ueber dem Zeilenindex $x$ eine kubische Hermite-Kurve mit Catmull-Rom-Steigungen $m_k = (d_{k+1} - d_{k-1})/2$ (am Rand einseitig $d_1 - d_0$ bzw. $d_{n-1} - d_{n-2}$), je Intervall $d(k+t) = a t^3 + b t^2 + c t + e$ mit $e = d_k$, $c = m_k$, $b = 3(d_{k+1} - d_k) - 2m_k - m_{k+1}$, $a = 2(d_k - d_{k+1}) + m_k + m_{k+1}$. Ist nirgends $d \ge 0$, gilt der Scheitel (Extrema aus $d' = 0$, am Rand die Randzeile), sonst das groesste $x$ mit $d(x) \ge 0$ (Bisektion auf dem monotonen Stueck). Ergebnis $\mu(x)$, $\alpha(x)$, Schwelle $\mu + d(x)$, Verhaeltnis $10^{0{,}4\,d(x)}$; stetig in $V$ und $\mu_\mathrm{Himmel}$ in allen drei Faellen und an den Uebergaengen, solange $d$ nur einen Scheitel hat (Test mit feiner Abtastung). Verworfen: die Parabel durch die beste Zeile und ihre beiden Nachbarn. Sie macht die Lage beim Wechsel der besten Zeile stetig ($k + 1/2$ aus beiden Tripeln), den Scheitelwert aber nicht: bei $d_k = d_{k+1} = b$ ergibt das Tripel um $k$ den Wert $b + (b - d_{k-1})/8$, das um $k+1$ den Wert $b + (b - d_{k+2})/8$ (eig. Rechnung). Ausserdem kann ihr Scheitel ueber 0 liegen, waehrend alle Zeilen unter 0 liegen; die Faelle "keine sichtbar" und "Vorzeichenwechsel" muessen dieselbe Kurve benutzen, sonst springt das Verhaeltnis am Uebergang. Darum dieselbe Kurve fuer beide Faelle; der Vorzeichenwechsel ist damit kubisch statt linear in $d$ interpoliert (Unterschied bei 0,1-mag-Zeilen unter 0,01 mag).

Korrektur: wahrnehmung.md 2.3, Fernglas 10x50 bei Bortle 3 mit $F$ = 1,4, von 11,1 auf 11,0 mag (ungerundet 11,05).

Quelle [A&S]: Abramowitz, M., Stegun, I. A.: *Handbook of Mathematical Functions*, NBS Applied Mathematics Series 55, 1964, Formel 7.1.26.

## 20. Auswerten Version 2: gezeigte Deckkraft der Punktquellen (Issue #100)

**Datum:** 2026-10-29. **Kennungen:** A-P11, A-P6, A-P12; `docs/architektur.md` 5.3 und 5.4, ADR-0004. Umsetzung in `src/physik/punktquellen.ts` (`deckkraftPunktquelle`) und `src/physik/auswerten.ts`; alle anderen Formeln von `auswerten` stehen in den Abschnitten 12 bis 19.

**Problem.** Blackwells Wahrscheinlichkeitskurve $P(v) = \Phi\big((v - 1)/0{,}484\big)$ mit $v = 10^{-0{,}4(m - m_\mathrm{lim})}$ (Abschnitt 19, `wahrnehmung.md` 1.3) endet fuer $v \to 0$ nicht bei 0, sondern bei $P_0 = \Phi(-1/0{,}484) = 0{,}0194$: die Kurve beschreibt Treffer im Laborversuch, $P_0$ ist der Anteil "gesehen" ohne Reiz. Als Deckkraft genommen bekaeme jeder noch so schwache Stern 1,9 % Deckkraft, und der Grund `unter_schwelle` (Deckkraft unter $10^{-3}$, `docs/architektur.md` 5.3) traete nie ein (Hinweis aus PR #121).

**Festlegung (entschieden von Herbert am 2026-10-29, ADR-0004 Nachtrag Issue #100).** Gezeigt wird $P$ ohne diesen Sockel, dieselbe Korrektur, die ADR-0004 (Nachtrag 2026-10-29) fuer die Deep-Sky-Ebene nennt:

$$P'(v) = \frac{P(v) - P_0}{1 - P_0},\qquad P_0 = P(0).$$

$P'$ ist stetig und monoton in $v$ (streng, bis sie 1 erreicht), $P'(0) = 0$, $P'$ = 1 genau wo $P$ = 1 ist (in Gleitkomma ab 1,75 mag ueber der Grenze; alle Trabanten der Testfaelle T1 bis T6, die Simulationsparameter bleiben dort gleich). An der Grenzgroesse ist $P'(1) = 0{,}4901$ statt 0,5, ein Unterschied von 0,01 in der Deckkraft (ber.). Unter $P' < 10^{-3}$ ist die Punktquelle `unter_schwelle` und wird nicht gemalt; das ist bei $v = 0{,}00985$, also 5,02 mag unter der Grenzgroesse (ber., `statistics.NormalDist`). Die Deckkraft steht nur in der Naht, wenn sie unter 1 liegt (fehlt = 1).

| Groesse | Eingabe | Erwartung | Herkunft |
|---|---|---|---|
| $P_0$ | $v$ = 0 | 0,0194 | ber. |
| $P'$ | $m - m_\mathrm{lim}$ = 0 / +1 / -1 | 0,4901 / 0,0891 / 0,9991 | ber. |
| Schnitt | $P'$ = $10^{-3}$ | $m - m_\mathrm{lim}$ = 5,017 | ber. |
| $P'$ | $m - m_\mathrm{lim}$ = -1,745 | 1 (in Gleitkomma, ab hier) | ber. |

Rechenweg: $P$ mit $\Phi$ aus `statistics.NormalDist` (Python), $P_0 = \Phi(-1/0{,}484)$, $v = 10^{-0{,}4(m - m_\mathrm{lim})}$; Schnitt aus $P = P_0 + 10^{-3}(1 - P_0)$, $v = 1 + 0{,}484\,\Phi^{-1}(P) = 0{,}00985$. Unit-Tests in `src/physik/punktquellen.test.ts`.

Testwerte `auswerten` (Unit-Tests in `src/physik/auswerten.test.ts`, ber.):

| Groesse | Eingabe | Erwartung | Rechenweg |
|---|---|---|---|
| Grenzgroesse | A-D9: 80 mm, 60x, Bortle 5, klar, 45 Grad, Seeing 2'' im Zenit (2,46'' am Objekt) | 12,00 mag | Abschnitt 19 `grenzgroesse`; Kontrolle wahrnehmung.md 2.3 (Zenit, ohne Extinktion: 11,94 bei 40x, 12,56 bei 80x), Extinktion 0,2 X = 0,28 mag |
| Farbgrenze | 80 mm, $\tau$ 0,9, 60x, 45 Grad, klar / diesig | 7,53 / 7,17 mag | $2{,}3 + 5\log_{10}(\min(D, pV)/p) + 2{,}5\log_{10}\tau - kX$ (Abschnitt 18, wahrnehmung.md 5.1), $k$ = 0,2 / 0,45, $X$ = 1,413 |
| Fluss eines Sterns ohne Quellbild | $m$ = 5 / 6, Durchmesser 0,01'' | $h \cdot \pi (0{,}005)^2$ = 0,01 / $10^{-2{,}4}$ | Abschnitt 13.1 mit Bezug 0 mag/arcsec$^2$: $h = 10^{-0{,}4(m + 2{,}5\log_{10}(\pi\,0{,}005^2))}$ |
| Farbe B-V 0,6 / 1,5 | ueber der Farbgrenze | 1,0899 / 0,9787 / 0,9468; 1,4615 rot | Tabelle in `sternfarbe.ts` (Abschnitt 18) |
| Blendung eines Sterns | A 5 mag, B 12 mag, 8'' | geblendet bis $V$ = 600''/8'' = 75 | Abschnitt 13.3 |
| Schwellenkontrast Deep-Sky | $a q^*/s$ | $10^{-0{,}4(\mu_\mathrm{Schwelle} - \mu_\mathrm{Himmel} + kX)}$ | $a = \tau' A\,10^{-0{,}4(W - 9{,}2)}$, $s = \tau' 10^{-0{,}4(\mu_\mathrm{Himmel} - 9{,}2)}$ mit $\tau'$ = Transmission mal AP-Faktor, $A = 10^{-0{,}4kX}$; $q^*$ wie Abschnitt 19 |
| Mischgewicht | Jupiter 47'' $V$ 1 / 10; Mars 6'' 120x / 60x / 240x | 0,8238 / 0,0401; 0,0147 / 0,0696 / 0 | Abschnitt 17.1 |

**Verworfen.** (a) Schnitt bei $P < P_0 + 10^{-3}$ ohne Korrektur: Sterne bis 5 mag unter der Grenze blieben mit 1,9 % Deckkraft gemalt und sprangen dann auf 0; bei vielen Katalogsternen (M13, M45) ein Schleier. (b) Schnitt an einem festen Abstand zur Grenzgroesse: eine zweite Konstante neben $10^{-3}$, gleiche Wirkung wie die Korrektur ohne deren Stetigkeit.

**Weitere Festlegungen in `auswerten` (entschieden von Herbert am 2026-10-29, keine neue Formel).** Grenzgroesse mit der Seeing-FWHM am Objekt (`Atmosphaere.seeingFwhmArcsec`, Zenitwert mal $X^{0{,}6}$, Abschnitt 2.1), wie im Kern. Die Schwelle gilt auch fuer Trabanten (ADR-0004: "die Schwelle wirkt dort nur auf Trabanten"); die Blendungsregel (Abschnitt 13.3) auch fuer Sterne, mit der Objektmitte als Blender nur bei Sonnensystem-Objekten. Warnung `ueberstrahlung` nur bei Doppelsternen (Abschnitt 16). Ohne Quellbild Bezug 0 mag/arcsec$^2$ (`docs/architektur.md` 5.2).

## 21. Farbindex aus Tycho-Photometrie (Issue #103)

Fuer die Doppelsterne ohne eigenen Johnson-Wert je Komponente (Porrima, Zeta Aqr, Epsilon Lyrae, Pi Aql, Epsilon Ari, 52 Ori, 52 Ari, Zeta Her) rechnet `tools/doppelsterne.py` $B_T$ und $V_T$ aus dem Tycho Double Star Catalogue [TDSC] ins Johnson-System um (doppelsterne.md 1.3, 2.2):

$$(B-V)_J = 0{,}850\,(B_T - V_T)$$

Quelle: ESA 1997 [ESA97], Bd. 1, Abschn. 1.3 Anhang 4, Gl. 1.3.20 (im PDF nachgeschlagen am 2026-10-29), abgeleitet an 8000 Standardsternen fuer $-0{,}2 < (B-V)_T < 1{,}8$, "giving errors generally below 0.015 mag in $V_J$ and below 0.05 mag in $(B-V)_J$. The transformations apply to unreddened stars and ignore variations due to luminosity class. They should not be applied to M-type stars". Die Begleitgleichung $V_J = V_T - 0{,}090\,(B-V)_T$ dient nur als Beleg fuer Albireo B (Tycho-Hauptkatalog $B_T$ 5,01, $V_T$ 5,082: $V_J$ = 5,09, ber.; Entscheidung Herbert 2026-10-29: 5,1 statt WDS 4,68); sonst kommen die Magnituden aus dem WDS. Kein Stern der Liste mit TDSC-Farbe ist vom Typ M; der Fehler von bis zu 0,05 mag ist fuer die Sternfarbe (Abschnitt 18) ohne Belang. Gerundet auf 0,01. Bei Albireo B ergibt der TDSC +0,15, Hipparcos misst $-0{,}095$. Die Abweichung kommt aus der TDSC-Photometrie von B ($B_T - V_T$ = 0,18), nicht aus Gl. 1.3.20: mit $B_T - V_T$ = $-0{,}072$ aus dem Hipparcos-Hauptkatalog (HIP 95951) ergibt die Gleichung $-0{,}06$ (ber.). Albireo hat getrennte Hipparcos-Eintraege, deshalb nimmt astobsim dort den Hipparcos-Wert.

Testwert (A-Q1, ber.): Zeta Her B, $B_T$ 6,31, $V_T$ 5,40: $0{,}850 \cdot 0{,}91 = 0{,}774$, gerundet 0,77 (`src/daten/doppelsterne.test.ts`).

Quellen: [TDSC] Fabricius, C. et al.: "The Tycho double star catalogue", A&A 384, 180 (2002), abgefragt als `tycho2.tdsc_catalogue` im Hipparcos and Tycho Legacy Archive der ESA (TAP https://esaskylegacy.esac.esa.int/esasky-legacy-sl-tap/tap). [ESA97] ESA: *The Hipparcos and Tycho Catalogues*, ESA SP-1200 (1997), Bd. 1, https://www.cosmos.esa.int/documents/532822/552851/vol1_all.pdf
## 22. Gaia nach Johnson V und B-V (Issue #104)

Fuer Sterne, die nur in Gaia DR3 stehen (M45 ab V etwa 7,3, deep-sky.md 4.2), rechnet `tools/m45_sterne.py` Johnson V und B-V aus $G$ und $x = G_{BP} - G_{RP}$. Beide Beziehungen stammen aus der Gaia-DR3-Dokumentation, Kapitel 5.5.1 (Carrasco, Bellazzini), Tabelle 5.9 "Johnson-Cousins relationships", Gueltigkeit aus Tabelle 5.10 [GDR3-5.5.1]; die Koeffizienten fuer $G - V$ sind dieselben wie bei Riello et al. 2021, Tabelle C2 (deep-sky.md [3], dort zitiert als Tabelle 8).

| Groesse | Formel | Gueltig | Streuung |
|---|---|---|---|
| V | $G - V = -0{,}02704 + 0{,}01424\,x - 0{,}2156\,x^2 + 0{,}01426\,x^3$ | $-0{,}5 < x < 5{,}0$ | 0,030 mag |
| B-V | $x = 0{,}06483 + 1{,}575\,y - 0{,}7815\,y^2 + 0{,}5707\,y^3 - 0{,}176\,y^4 + 0{,}01916\,y^5$, $y = B - V$, nach $y$ aufgeloest (Bisektion) | $-0{,}5 < y < 3{,}5$ | 0,066 mag (in $x$) |

Die Umkehrung ist eindeutig: das Polynom steigt im ganzen Gueltigkeitsbereich (eig. Rechnung, Bisektion auf 60 Schritte, Probe im Python-Test auf $10^{-9}$). Testwerte: $x$ = 0 gibt $V = G + 0{,}02704$, $x$ = 1 gibt $V = G + 0{,}21414$; $B-V$ = 0 gehoert zu $x$ = 0,06483.

**Probe an den Plejaden (ber., `tools/m45_sterne.py --bericht`):** 25 Mitglieder haben V und B-V aus Hipparcos. Gaia minus Hipparcos: V im Mittel +0,030, Streuung 0,041, groesste Abweichung +0,18 (Pleione, veraenderlich); ohne Pleione und Alkyone (Gaia ohne Astrometrie, $G$ = 2,9 gesaettigt) +0,021, Streuung 0,025, groesste +0,10. B-V im Mittel -0,022, Streuung 0,044, groesste +0,14 (Alkyone); ohne die beiden -0,031, Streuung 0,028. Beides liegt innerhalb der Streuung der Beziehungen.

**Abweichung von deep-sky.md 6.3:** Dort steht, die Dokumentation gebe fuer B-V keine direkte Beziehung zu $G_{BP}-G_{RP}$, und B-V kam aus einer an die Plejaden angepassten Geraden $B-V = -0{,}022 + 0{,}763\,x$. Tabelle 5.9 der DR3-Dokumentation enthaelt aber $x = f(B-V)$; deren Umkehrung hat eine Quelle und ist fuer blaue Sterne eindeutig ($dx/dy \approx 1{,}6$ bei $y$ = 0). Sie liefert B-V im Mittel 0,03 mag blauer als Hipparcos, die Gerade trifft das Mittel per Konstruktion. Fuer die Sternfarbe (Abschnitt 18) ist der Unterschied unerheblich: B-V -0,01 statt +0,01 aendert die Farbtemperatur bei 10 000 K um etwa 2,5 Prozent (eig. Rechnung mit Ballesteros, Abschnitt 18).

V und B-V aus Hipparcos (ESA 1997) gelten, wo der Stern dort steht; Gaia nur, wo nicht. Die Herkunft steht je Stern in `katalog` (V) und `quelle_farbe` (B-V) in `daten/sterne/m45.json`.

Quelle [GDR3-5.5.1]: Carrasco, J. M., Bellazzini, M.: Photometric relationships with other photometric systems. In: Gaia Data Release 3 Documentation, release 1.3, Kapitel 5.5.1, https://gea.esac.esa.int/archive/documentation/GDR3/Data_processing/chap_cu5pho/cu5pho_sec_photSystem/cu5pho_ssec_photRelations.html (gelesen 2026-10-29, Tabellen 5.9 und 5.10).

## 23. Mondhelligkeit ueber den Phasenwinkel (Issue #36)

Fuer die Mondzustaende `mond_sichel`, `mond_voll` und `mond_lv` kommt die V-Magnitude aus der Phasenkurve von Krisciunas und Schaefer [KS91], Gl. 9:

$$m(\alpha) = -12{,}73 + 0{,}026\,|\alpha| + 4\cdot10^{-9}\,\alpha^4,\qquad \alpha \text{ in Grad}.$$

Quelle im Original gelesen am 2026-10-29 (S. 1035, ueber ADS): "(see page 144 of Allen 1976) ... Equation (9) gives m = -12.73 for full Moon, in agreement with the results of Lane & Irvine 1973 *extrapolated* to $\alpha$ = 0. However, this ignores the 'opposition effect'. For $|\alpha| < 7°$ the brightness of the Moon deviates from this relation ... When the Moon is exactly full it is about 35% brighter than the extrapolation would predict". S. 1036: die Formel gilt fuer den mittleren Abstand; Perigaeum und Apogaeum aendern die Helligkeit um bis zu $\pm 0{,}12$ mag. Sie ist eine Anpassung an die Tabelle bei Allen 1976, die auf Lane und Irvine 1973 beruht (dort zitiert, nicht eingesehen).

Den Phasenwinkel liefert der beleuchtete Anteil $k$ der Ephemeride ueber $k = (1 + \cos\alpha)/2$ (objekte.md 2.1), also $\alpha = \arccos(2k - 1)$.

| Zustand | $k$ (SVS-Tabelle) | $\alpha$ (ber.) | $m$ (ber.) |
|---|---|---|---|
| mond_sichel (Frame 6173) | 0,1729 | 130,86 Grad | -8,155, verwendet -8,15 |
| mond_voll (Frame 6449) | 0,9994 | 2,81 Grad | -12,657, verwendet -12,66 |
| mond_lv (Frame 6615) | 0,4985 | 90,17 Grad | -10,121, verwendet -10,12 |
| mond_ev (Frame 6285) | 0,5927 | 79,32 Grad | -10,509, verwendet -10,51 |
| Kontrolle: $\alpha$ = 0 | 1 | 0 | -12,73 (Quelle) |

Festlegungen (eigene, Issue #36):
- Die Zustaende behalten den mittleren Durchmesser 1865'' wie `mond_ev`, passend zum mittleren Abstand der Formel. Die Quellbilder zeigen 1814,9'' bis 1936,4''; mit diesen Groessen aenderte sich die Magnitude um $-5\log_{10}(D/1865'')$, von +0,06 mag (Sichel, dunkler) bis -0,08 mag (letztes Viertel, heller; ber.), innerhalb der $\pm 0{,}12$ mag der Quelle.
- Beim Vollmond ($\alpha$ = 2,8 Grad) ist der Oppositionseffekt nicht eingerechnet. Die Quelle nennt nur den Faktor 1,35 bei $\alpha$ = 0 und "between 1.00 and 1.35" innerhalb eines Tages um Vollmond, keine Kurve; ein Wert bei 2,8 Grad waere geraten. Schlimmstenfalls ist der Vollmond um $2{,}5\log_{10} 1{,}35$ = 0,33 mag zu dunkel (ber., obere Grenze).
- `mond_ev` (Frame 6285, $k$ = 0,5927, $\alpha$ = 79,32 Grad) bekommt seit #36 ebenfalls Gl. 9: -10,509, verwendet -10,51 (vorher -10,2; Entscheidung Herbert 2026-10-29, objekte.md 7 Punkt 7). Oppositionseffekt weglassen und 1865'' fuer alle Zustaende sind ebenfalls von Herbert entschieden (objekte.md 5.3).

Testwerte (Unit-Tests in `src/daten/objektzustand.test.ts` und `tools/test_mond_kacheln.py`): $m$(130,9) = -8,15, $m$(2,8) = -12,66, $m$(90,2) = -10,12, jeweils auf 0,01 mag; $k$ aus $\alpha$ auf 0,002 gleich `phase`.

### 23.1 Tag- und Nachtseite im Quellbild (Werkzeug)

`tools/mond_kacheln.py` schwaerzt bei allen vier Frames die Nachtseite (ADR-0003 Nachtrag V2) und prueft die Orientierung. Dafuer die Sonnenhoehe $h$ je Pixel auf einer glatten Kugel in orthografischer Projektion (eigene Herleitung, ohne Relief):

- Selenografische Einheitsvektoren $\vec v(\beta, \lambda) = (\cos\beta\cos\lambda, \cos\beta\sin\lambda, \sin\beta)$; $\vec E$ zum Sub-Erde-Punkt, $\vec S$ zum Sub-Sonne-Punkt (SVS-Tabelle `subearth`, `subsolar`).
- Bildachsen vor der Drehung: $\vec o$ = Nordpol $(0,0,1)$ senkrecht zu $\vec E$ projiziert und normiert, $\vec r = \vec o \times \vec E$ (Laenge +90 Grad, IAU-Osten, erscheint rechts). Ein Pixel mit normierten Bildkoordinaten $(x, y)$ (rechts, oben; Einheit Scheibenradius) wird um den Positionswinkel $P$ der Achse zurueckgedreht: $u = x\cos P + y\sin P$, $v = -x\sin P + y\cos P$ ($P$ von Himmelsnorden ueber Osten, bei Norden oben gegen den Uhrzeigersinn).
- Oberflaechenpunkt $\vec p = u\vec r + v\vec o + w\vec E$ mit $w = \sqrt{1 - u^2 - v^2}$, $\sin h = \vec p \cdot \vec S$.

Probe am Bild (gemessen 2026-10-29): der Anteil der Scheibe mit $h > 0$ trifft die Phase der SVS-Tabelle bei allen vier Frames auf 0,001 (6173: 0,1724 gegen 0,1729; 6285: 0,5928 gegen 0,5927; 6449: 0,9998 gegen 0,9994; 6615: 0,4984 gegen 0,4985). Beleuchtete Gipfel reichen im Rendering bis etwa 4 Grad hinter den Terminator (Leuchtdichte bis 0,42); ab 6 Grad liegt bei 6173 und 6615 kein Pixel ueber 0,02. Fuer einen Gipfel der Hoehe $H$ ueber der Umgebung ist der Horizont um $\sqrt{2H/R}$ abgesenkt, bei $H$ = 5 km und $R$ = 1737 km 4,3 Grad (ber.), passend dazu.

Quelle [KS91]: Krisciunas, K., Schaefer, B. E.: "A Model of the Brightness of Moonlight", PASP 103, 1033-1039 (1991), doi:10.1086/132921, https://ui.adsabs.harvard.edu/link_gateway/1991PASP..103.1033K/ADS_PDF (gelesen 2026-10-29, Gl. 9 auf S. 1035, Einschraenkungen auf S. 1035 und 1036).

## 24. Weicher Rand des Kerns fuer Punktquellen (Issue #109)

**Problem (gerechnet im Review von PR #127).** Der Kern endet hart beim Radius $3\,\mathrm{FWHM_{gesamt}}$ (Abschnitt 9, `KERN_RADIUS_PRO_FWHM`), und zwar quadratisch. Fuer die Flaeche ist der Randwert (etwa $8{,}5\cdot10^{-4}$ des Scheitels bei Seeing-Fluegeln) unsichtbar. Die Punktebene geht aber durch $W = \min(1, (a_P\,p)^{1/3})$ (Abschnitt 14, ADR-0004). Die Kubikwurzel hebt den Randwert auf $(8{,}5\cdot10^{-4})^{1/3} \approx 9{,}5\,\%$ des Scheitels, danach faellt $W$ hart auf 0. Um helle Sterne entsteht so ein Quadrat. Zwischen zwei Sternen endet das Quadrat des einen mitten im Halo des anderen, so dass die Faerbung $c_k/p$ dort springt (Farbkante).

**Modellannahme.** Nur fuer die Punktebene und die Faerbung (`src/bild/punktebene.ts`, `ausgeblendetKern`) wird der Kern mit einem Fenster multipliziert:

$$w(\rho) = \begin{cases} 1 & \rho \le \rho_0 \\ \cos^2\!\left(\dfrac{\pi}{2}\,\dfrac{\rho-\rho_0}{\rho_E-\rho_0}\right) & \rho_0 < \rho < \rho_E \\ 0 & \rho \ge \rho_E \end{cases}, \qquad \rho_0 = \tfrac{2}{3}\,r,\ \rho_E = r + 0{,}5\ \mathrm{px}.$$

Dabei ist $\rho$ der Abstand zur Kernmitte in Arbeitspixeln und $r$ der Kernradius. Das aeussere Drittel von $r = \lceil 3\,\mathrm{FWHM}/\text{Massstab}\rceil$ ist etwa die aeussere Gesamt-FWHM. Danach wird auf die alte Summe normiert, der Fluss bleibt also erhalten. Innen ($\rho \le \rho_0$) aendert sich die Form nicht, die Werte steigen nur um den Normierungsfaktor (bei Seeing-Fluegeln wenige Prozent, eig. Rechnung). Das Fenster ist rund, die Ecken des quadratischen Kerns fallen weg.

**Warum ein cos²-Fenster.** Ein groesserer Radius allein verschiebt die Kante nur, weil die Kubikwurzel jeden Randwert sichtbar macht. Die Alternative $k' = \max(0, k - k_\text{Rand})$ geht nur linear gegen 0, unter der Kubikwurzel also wie $d^{1/3}$ (bei 10 % der Strecke noch 46 % des Werts). Das cos²-Fenster geht quadratisch gegen 0, also wie $d^{2/3}$ (bei 10 % noch 21 %). Der Halo laeuft damit sichtbar weich aus.

**Grenzen.** Die Punktquellen verlieren Licht jenseits von etwa 2 Gesamt-FWHM an den Kern innen. Das ist dieselbe Groessenordnung, die der harte Schnitt bei 3 FWHM ohnehin abschneidet. Das Fenster ist ein Darstellungsfenster, keine Physik. Die Flaeche (Falter JS und WebGL2) faltet weiter mit dem unveraenderten Kern. Trabanten gehen ebenfalls durch die Punktebene; ihre Werte aendern sich deshalb in T1, T2, T4 und T6 geringfuegig (siehe PR #127).

## 25. Tonkurve eines Pressebilds gegen ein Flaechenhelligkeitsprofil (Issue #106)

**Zweck.** Fuer M31 gibt es kein lineares Archivbild mit belegter Lizenz (`bilder-v2.md` 2); Entscheidung 2 in `docs/recherche/README.md`: das NOIRLab-Pressebild (nichtlinear gestreckt) wird per Tonkurve gegen das Profil aus `deep-sky.md` 1.2 zurueckgerechnet. Umgesetzt in `tools/deep_sky_aufbereiten.py` (`tonkurve_aus_profil`, `tonkurve_anpassen`, `tonkurve_anwenden`), Parameter `tools/parameter/m31_noirlab_lgs.json`.

**Modell.** Sersic-Bulge plus exponentielle Scheibe wie `deep-sky.md` 1.2, ausserhalb der grossen Achse mit eigenen Achsenverhaeltnissen (Annahme aus `deep-sky.md` 1.2: $q_b$ = 0,8, $q_d$ = 0,27):

$$\mu(u, v) = -2{,}5\log_{10}\!\left[10^{-0{,}4\,\mu_e}\, e^{-b_n\left((r_b/R_e)^{1/n}-1\right)} + 10^{-0{,}4\,\mu_0}\, e^{-r_d/R_d}\right],\quad r_b = \sqrt{u^2 + (v/q_b)^2},\ r_d = \sqrt{u^2 + (v/q_d)^2}$$

mit $u$, $v$ dem Abstand auf grosser und kleiner Achse und den Werten aus `daten/objekte.json` (`profil`, eine Quelle fuer Werkzeug und Daten). Auf der grossen Achse ($v$ = 0) trifft die Formel die Tabelle in `deep-sky.md` 1.2 auf 0,05 mag (Test `test_modell_wie_deep_sky_tabelle`).

**Tonkurve (Rechenweg, eigene Festlegung).**
1. Ringe auf der grossen Achse (PA 37,5 Grad, am Bild gemessen): Kanten 0 bis 200'' fest, dann 30 geometrische Ringe bis 6500''; Streifen $|v| < \max(10'', 0{,}03\,r_1)$, beide Seiten, M32 (Kreis 4') ausgenommen.
2. Je Ring der Median des Kodes $g_i$ und der Median des Modells $\mu_i$ (Mediane, damit Sterne, Staubbaender und HII-Knoten das Paar nicht verschieben).
3. Ringe mit gleichem Kode werden gemittelt; ueber fallendem Kode wird $\mu$ isoton steigend gemacht (Pool Adjacent Violators); Kodes mit danach gleichem $\mu$ werden ein Knoten. Ergebnis: Knoten $(g_k, \mu_k)$ mit streng fallendem $\mu$ (M31: 38 Knoten von Kode 10 bei 24,63 bis Kode 255 bei 16,22).
4. Zwischen den Knoten ist $\mu$ linear in $g$; ueber dem hellsten Knoten gilt dessen $\mu$ (Saettigung); unter dem dunkelsten Knoten ist die Helligkeit linear in $g$ bis 0 beim Schwarzpunkt $g_0$ (Himmel des Pressebilds, M31: Kode 7, Median der Mosaikecken):
$$L(g) = 10^{-0{,}4\,\mu_\mathrm{min}}\ \frac{g - g_0}{g_\mathrm{min} - g_0}\quad (g_0 < g < g_\mathrm{min}),\qquad L(g) = 0\quad (g \le g_0).$$
5. Pixel $\to L(g)$ in absoluten Einheiten $10^{-0{,}4\mu}$, dann wie bei den FITS-Bildern ausrichten, auf 4''/px mitteln, Sterne entfernen, log-kodieren. Quellweiss `mag_hell` ist das hellste Pixel dieser Werte (`eichung.art` "tonkurve"); eine Eichung auf $V_T$ entfaellt, sie dient als Probe.

**Restfehler (gerechnet, Lauf vom 2026-10-29).** Am fertigen Bild (dekodiertes WebP, 4''/px, sternbereinigt), Streifen auf der grossen Achse bei PA 37,5 Grad, Ring $\pm\max(6'', 5\,\%)$ um $r$, Median beider Seiten; in Klammern das Mittel:

| $r$ | 0,5' | 1' | 2' | 5' | 10' | 20' | 30' | 45' | 60' | 80' | 95' |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Modell | 16,72 | 17,25 | 17,97 | 19,23 | 20,21 | 21,01 | 21,51 | 22,18 | 22,85 | 23,74 | 24,40 |
| Bild - Modell | -0,50 (-0,39) | -0,12 (-0,08) | +0,02 (+0,02) | 0,00 (-0,02) | -0,03 (-0,01) | 0,00 (0,00) | +0,03 (+0,04) | -0,12 (-0,17) | +0,07 (+0,06) | -0,04 (-0,09) | +0,01 (+0,02) |

Bei PA 35 Grad (RC3) dieselben Werte auf 0,08 mag. Innerhalb von 1' liegt der Fehler am gesaettigten Kern: alle drei Kanaele des Pressebilds stehen innerhalb etwa 30'' auf Kode 255, das Bild hat dort eine flache Kuppe bei 16,22 statt des Anstiegs auf 15,4 (Modell) bzw. 13 bis 14 (Kern, `deep-sky.md` 1.2). Die Ringe der Anpassung selbst (1,3''/px) treffen das Modell zwischen 40'' und 6500'' per Konstruktion (Abweichung 0,00); je Seite einzeln (NO gegen SW) bleiben -0,20 bis +0,20 mag bis 5150'', am aeussersten Ring -0,40 / +0,44.

**Unabhaengige Proben (gerechnet).**
- Kleine Achse (nicht angepasst), gegen das 2D-Modell an denselben Pixeln: -0,51 bis +0,25 mag bis 283'' (Ring in Einheiten der grossen Achse, $|v| = r\,q_d$; das Bulge-Achsenverhaeltnis 0,8 ist angenommen), +0,04 bis +0,48 mag von 283'' bis 4086'' (die Scheibe ist auf der kleinen Achse schwaecher als mit $q$ = 0,27); darueber +0,65, +1,09 und dann kein Licht mehr (Mosaikkante und Schwarzpunkt).
- Gesamthelligkeit des dekodierten Bilds 3,426 mag gegen RC3 $V_T$ = 3,44 (`deep-sky.md` 1.1): -0,014 mag, ohne dass $V_T$ in die Eichung eingeht. Das Modell selbst ergibt 3,34 (`deep-sky.md` 1.2), das Bild endet an der Mosaikkante und ist im Kern gesaettigt.
- Flaechentabelle gegen das unverschmierte Modell bei 4''/px: Verhaeltnis der Flaechen 0,88 bis 1,19 zwischen 17,0 und 22,5 mag/arcsec$^2$ (20,5 und 21,0: 0,88; 21,5: 1,19, der Ring bei 10 kpc), unter 17,0 bis 3,2 (gesaettigter Kern). Die Tabelle endet bei 22,9, vor der ersten Isophote, die mehr als 1 % der Mosaikkante erreicht (`flaechentabelle(..., rand_maske)`).

**Grenzen.** Die Tonkurve ist eine Funktion des Kodes allein. Wo das Pressebild lokal anders gestreckt ist (Mosaikfelder, lokale Kontrastverstaerkung), bleibt der Fehler; die Seitenunterschiede oben (bis 0,2 mag) sind die Obergrenze dafuer zusammen mit echter Asymmetrie. Das Profil selbst ist auf Faktor 1,5 in der Ausdehnung unsicher (`deep-sky.md` 9 Punkt 1); die Tonkurve uebertraegt diese Unsicherheit unveraendert ins Bild.
