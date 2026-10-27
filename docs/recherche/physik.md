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

Zahlen bei 550 nm, 2'' Seeing ($r_0$ = 5,6 cm), eigene Rechnung: 60 mm: $\sigma$ = 0,94'' (mit 2,355 $\sigma$ = 2,2'' praktisch die ganze Langzeit-FWHM); 100 mm: 0,86''; 200 mm: 0,77''; 300 mm: 0,72''. Bei $D/r_0 \lesssim 1$ besteht die Langzeit-PSF also fast nur aus Bewegung des weitgehend intakten Beugungsbilds; Sacek: Speckle-Struktur ab $D/r_0 \approx 3$, deutlich ab 4; Tilt "nicht schaedlich" unterhalb von etwa 100 mm Oeffnung [20]. Umgekehrt heisst das: der *Langzeit*-Anblick (A-P5) eines 80-mm-Refraktors bei 2'' Seeing ist eine verschmierte Scheibe mit FWHM $\approx$ 2,5'' (Abschnitt 2.5), der *Momentan*-Anblick ist ein zitterndes, aber scharfes Bild. Beides ist richtig, astobsim zeigt per A-P5 den Langzeitfall. Fuer den Kann-Punkt A-B6 ("ruhiger Moment") bietet sich an, die Bewegungsvarianz quadratisch abzuziehen: $\mathrm{FWHM}_\mathrm{kurz}^2 \approx \mathrm{FWHM}_\mathrm{lang}^2 - (2{,}355\,\sigma_\alpha)^2$, begrenzt nach unten durch die Beugung. Das ist eine Heuristik (Tokovinin benutzt dieselbe Idee fuer die aeussere Skala [16]), keine Theorie.

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

(Eigene Rechnung mit Abschnitt 9: Refraktor $\tau$ = 0,90, Fernglas 0,85, $X$ = 1,4126, $k$ = 0,20, Quellweiss Mond 3,35, Mars 14'' 4,1 mag/arcsec$^2$ aus `daten/objekte.json`.)

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

- **Objekt:** $\mu_\mathrm{obj} = \mu_\mathrm{Quellweiss} - 2{,}5\log_{10} F$ mit dem physikalischen Faktor $F$ aus Abschnitt 9; die Anzeigehelligkeit von Quellweiss ist $w(\mu_\mathrm{obj})$. Das Quellbild bleibt linear: ein Pixel mit Wert $q$ relativ zu Quellweiss wird $q \cdot w(\mu_\mathrm{obj})$. Nur das Niveau wird komprimiert, nicht der Kontrast innerhalb des Quellbilds (Faltung, Tabellen-Tests T1 bis T5 und das Aussehen des Quellbilds bleiben unberuehrt).
- **Himmel:** $w(\mu_\mathrm{ok})$ mit $\mu_\mathrm{ok}$ aus Abschnitt 6.2, additiv wie bisher (A-B2).
- **Weiss:** $\mu_\mathrm{weiss}$ = 3,35 ist der Vollmond ohne Verluste (etwa 4900 cd/m$^2$), das hellste Objekt in Version 1; ohne Verluste waere er gerade Bildschirmweiss. Hellere Flaechen (etwa Venus) wuerden auf 1 begrenzt (A-P4: nach oben begrenzt).
- **Exponent:** $n$ = 1/3 ist Stevens' Exponent fuer ausgedehnte Felder [53]. Er dient als Kompressionsstaerke, nicht als Modell des Auges am Okular; Stevens begruendet nur die Groessenordnung der Kompression, keine Gleichheit der Empfindung, denn der Betrachter komprimiert den Bildschirm selbst noch einmal. Im Code heisst er `KOMPRESSIONSEXPONENT`. Eigenschaft: gleiche Leuchtdichteverhaeltnisse ergeben gleiche Anzeigeverhaeltnisse ($r \mapsto r^{1/3}$), unabhaengig von Objekt und Geraet. Die Spanne vom Mond mit blossem Auge bis Mars bei 200x (Faktor 500, 2,7 Dekaden) wird zu Faktor 8 (0,92 bis 0,116 linear, sRGB 245 bis 95), passt also in den Bereich, in dem das Bild auf dem Bildschirm noch erkennbar ist.
- **Monotonie:** $w$ faellt streng in $\mu$; da $\mu_\mathrm{obj}$ in der Austrittspupille bis 6 mm streng faellt (Abschnitt 5.1), steigt die Anzeigehelligkeit streng mit der Austrittspupille bis 6 mm und bleibt darueber konstant.
- **Hintergrund dunkler als das Objekt:** Transmission, Abschattung und Austrittspupille wirken auf beide Ebenen gleich, die Extinktion nur auf das Objekt (Abschnitt 6.2). Damit ist $\mu_\mathrm{Himmel,ok} - \mu_\mathrm{obj,ok} = \mu_\mathrm{Bortle} - \mu_\mathrm{Quellweiss} - k X$, unabhaengig vom Geraet. In Version 1 fuer Mond und Mars mindestens $17{,}0 - 4{,}5 - 2{,}51 = 10{,}0$ mag (Bortle 9, Mars 6'', diesig, 10 Grad Hoehe: $X$ = 5,586, $kX$ = 2,514), angezeigt also mindestens um den Faktor $10^{0{,}4 \cdot 10{,}0/3} = 21{,}5$ dunkler. Gilt nur fuer Mond und Mars: Jupiter (Quellweiss etwa 5,4) und Saturn (etwa 6,6) erreichen im selben Grenzfall nur Faktor 16 bzw. 11.

Verworfen:

- **Linear relativ zu Quellweiss ($n$ = 1, Stand #9):** A-D9 sRGB 52, 200x sRGB 10; das Bild verschwindet, sobald die Austrittspupille klein wird.
- **Absolut ($L_\mathrm{Anzeige} = L_\mathrm{Okular}$, Ward [57] mit festem Adaptionsniveau ist ebenfalls ein fester linearer Faktor):** Mond bis etwa 1,5 mm Austrittspupille abgeschnitten, das Bild ginge verloren; ein fester Faktor ist nur eine andere Wahl von $\mu_\mathrm{weiss}$ bei $n$ = 1.
- **Adaptionsabhaengig (Tumblin & Rushmeier [55], Ward [57] mit dem Niveau der Szene):** das ist ein Modell der Helligkeitsadaption des Auges, A-P9 schliesst es aus; die Konstanten konnte ich nicht am Original pruefen.
- **Automatische Belichtung (Reinhard Gl. 2 [58], entspricht $n$ = 0):** jede Austrittspupille saehe gleich hell aus, widerspricht A-P4.
- **Kompression je Pixel ($L/(1+L)$ nach Reinhard Gl. 3 oder $L^{1/3}$ auf jedes Pixel):** veraendert den Kontrast im Bild (Maria gegen Hochland, Planetendetail), den die Faltung gerade richtig wiedergeben soll; $L/(1+L)$ saettigt zudem oben, Fernglas und blosses Auge waeren kaum zu unterscheiden.
- **Logarithmisch (Fechner):** braucht eine willkuerliche untere Grenze und ist nach [53] fuer ueberschwellige Helligkeit widerlegt.

### 12.4 Testwerte (A-Q1)

Eigene Rechnung, 45 Grad, klar, Bortle 5, Quellweiss Mond 3,35, Mars 14'' 4,1 mag/arcsec$^2$; sRGB-Kodewert mit der Kennlinie aus [59] auf 8 Bit gerundet.

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

### 12.5 Unsicher

1. **Stevens & Stevens [54]:** Bibliographie nur aus [56], Band und Jahr widersprechen sich; fuer die Entscheidung nicht noetig, weil kein Adaptionsniveau eingeht.
2. **Exponent fuer Planetenscheibchen:** Mars mit 14'' erscheint bei 120x unter etwa 0,5 Grad, kleiner als Stevens' 5-Grad-Feld; fuer kleine Felder naehert sich der Exponent dem Punktquellenwert 0,5 [53]. Fuer die Anzeige bleibt ein Exponent fuer alle Objekte, damit Verhaeltnisse zwischen Objekten erhalten bleiben.
3. **Wahl von $\mu_\mathrm{weiss}$:** Bildschirm, Umgebungslicht und Helligkeitseinstellung des Nutzers sind unbekannt; die Wahl ist am Bild in Phase 6 zu pruefen. Eine Konstante in `src/physik/konstanten.ts` aendert alle Anzeigewerte gemeinsam.
4. **Schleier des Himmels:** Weil Objekt und Himmel getrennt komprimiert werden, hebt die Abbildung den Himmel relativ zum Objekt um den Faktor $(L_\mathrm{obj}/L_\mathrm{Himmel})^{2/3}$ an. Ueber dunklen Bildteilen wirkt er wie ein Schleier: in A-D9 zeigt ein Pixel mit $q$ = 0,01 (relativ zu Quellweiss) 0,0032, der Himmel 0,0021. Physikalisch waere der Himmel dort um Groessenordnungen dunkler. Am Bild in Phase 6 pruefen (Abhilfe waere etwa, den Himmel mit der Anzeigehelligkeit des Objekts linear mitzufuehren).
5. **Exponent:** 1/3 ist eine Groessenordnung nach Stevens, keine Herleitung; wie $\mu_\mathrm{weiss}$ in Phase 6 am Bild zu pruefen.

## 13. Trabanten als Punktquellen (Issue #14)

**Datum:** 2026-10-27. **Kennungen:** A-P6, A-X2, T6. Ergaenzt Abschnitt 7 und 9 (Punktquelle).

### 13.1 Helligkeit relativ zu Quellweiss

Die Naht verlangt fuer jede Punktquelle eine Flaechenhelligkeit relativ zu Quellweiss, ohne den gemeinsamen Faktor `Helligkeit.faktorObjekt` (`docs/architektur.md` Abschnitt 3). bild malt den Trabanten als gleichmaessig helle Scheibe mit seinem Winkeldurchmesser $d$ ins Arbeitsraster. Seine mittlere Flaechenhelligkeit folgt aus Magnitude und Flaeche [60] (dieselbe Formel, mit der `objekte.md` 5.2 die mittlere Flaechenhelligkeit der Planetenscheibe rechnet):

$$\mu_\mathrm{T} = m + 2{,}5\log_{10}\!\left(\pi\,\frac{d^2}{4}\right), \qquad h_\mathrm{rel} = 10^{-0{,}4\,(\mu_\mathrm{T} - \mu_\mathrm{weiss})}$$

mit $\mu_\mathrm{weiss}$ = `weissMagProArcsec2` des Objektzustands. Das setzt voraus, dass der Wert 1,0 im Quellbild wirklich $\mu_\mathrm{weiss}$ bedeutet; bei Jupiter und Saturn ist das derzeit nicht der Fall (13.5 Punkt 4, Issue #71). Der Fluss der gemalten Scheibe ist $h_\mathrm{rel}\,\pi d^2/4 = 10^{-0{,}4\,(m - \mu_\mathrm{weiss})}$ Quadratbogensekunden Quellweiss, haengt also nur von der Magnitude ab; der Durchmesser bestimmt nur, wie flaechig der Fluss vor der Faltung liegt.

Warum Atmosphaere, Transmission, Abschattung und Oeffnung nicht in $h_\mathrm{rel}$ stehen (das Issue nennt sie): nach Abschnitt 7 und 9 ist der Punktquellenfluss am Auge $\propto 10^{-0{,}4 m}\,a\,\tau\,(1-\epsilon^2)\,D^2$, bei $AP > p$ begrenzt die Augenpupille auf $(pV)^2$. Das Bild auf der Netzhaut ist um $V$ vergroessert, seine Flaeche waechst mit $V^2$. Die Flaechenhelligkeit des Trabantenbilds ist damit $\propto a\,\tau\,(1-\epsilon^2)\,\min(D, pV)^2/V^2 = a\,\tau\,(1-\epsilon^2)\,\min(AP, p)^2$, derselbe Faktor wie fuer die Planetenflaeche (Abschnitt 5.1, 9). Er steckt fuer beide in `faktorObjekt` und wird mit derselben Anzeigeabbildung (Abschnitt 12) auf den Bildschirm gebracht. Die Oeffnung wirkt ueber die PSF: die Faltung verteilt den festen Fluss auf die Flaeche der Gesamt-PSF, kleine Oeffnung und schlechtes Seeing machen den Punkt breiter und dunkler (Abschnitt 7, "Spitzenwert $\propto$ Fluss / Flaeche der PSF").

### 13.2 Malen ins Arbeitsraster

Ein Trabant ist kleiner als die Gesamt-FWHM, oft kleiner als ein Arbeitspixel (Rhea 0,25'' gegen 1 bis 25''/px). bild verteilt den Fluss $h_\mathrm{rel}\,\pi (d/2s)^2$ ($s$ Arbeitsmassstab) nach Flaechenanteilen auf die Pixel eines Kreises mit Durchmesser $\max(d/s, 1)$ Arbeitspixel (Unterabtastung 8 x 8 je Pixel, normiert auf den Fluss). So bleibt der Fluss auch unter einem Pixel erhalten und die Lage ist subpixelgenau; ab $d/s > 1$ zeigt das Raster die Scheibe mit $h_\mathrm{rel}$. Danach faltet bild mit derselben Gesamt-PSF wie das Objekt (ADR-0002), "Scheibchen oder Punkt" ergibt sich ohne Fallunterscheidung (Abschnitt 7).

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

| Trabant (Zustand, Quellweiss) | $m$ | $d$ | $\mu_\mathrm{T}$ | $h_\mathrm{rel}$ |
|---|---|---|---|---|
| Io (jup_47, 5,3) | 5,0 | 1,20'' | 5,1336 | 1,1656 |
| Europa | 5,3 | 1,03'' | 5,1019 | 1,2002 |
| Ganymed | 4,6 | 1,73'' | 5,5280 | 0,8106 |
| Kallisto | 5,7 | 1,58'' | 6,4310 | 0,3529 |
| Titan (sat_20, 6,6) | 8,3 | 0,85'' | 7,6848 | 0,3682 |
| Rhea (sat_20, 6,6) | 9,5 | 0,25'' | 6,2274 | 1,4094 |

$h_\mathrm{rel} > 1$ ist erlaubt (Io, Europa, Rhea haben hoehere Albedo als die mittlere Planetenscheibe); begrenzt wird erst beim Zeichnen.

### 13.5 Unsicher und offen

1. **Ergaenzung im Issue zu T6 ("80 mm zeigt Titan, Rhea nur bei groesserer Oeffnung als Punkt"):** stand nicht in T6 (`docs/anforderungen.md`) und folgt nicht aus der Blendungsregel, denn die haengt an der Vergroesserung, nicht an der Oeffnung: an 80 mm ist Rhea (Saturn 20'') ab $V$ = 9,45 sichtbar, also bei jeder Austrittspupille bis 8,5 mm; nach der Grenzgroesse (Abschnitt 7, $7{,}7 + 5\log_{10} 8 = 12{,}2$ mag) ebenfalls. Der Satz ist im Issue gestrichen (Herbert, 2026-10-27). Getestet ist, was das Modell hergibt: Titan und Rhea sichtbar bei $V \ge 9{,}45$, Rhea geblendet darunter.
2. **Sichtbarkeit im Bild:** Gemessen mit `rendere` (Fenster 400'', 1024 px, 45 Grad, klar, Bortle 5, Anzeigewert nach sRGB): Saturn 20'' an 80 mm bei 60x und 2'' Seeing Himmel 7, Titan 11, Rhea 9; an 300 mm bei 200x und 1'' Himmel 8, Titan 25, Rhea 15. Jupiter 47'' im 10x50 im ganzen Gesichtsfeld (22,85''/Arbeitspixel): Himmel 16, Trabanten 17 bis 18; an 80 mm bei 60x (2,9''/px) Himmel 7, Trabanten 18 bis 36. Am Fernrohr sind diese Trabanten leicht zu sehen. Hauptursachen (Review PR #69): (a) Die Anzeigeabbildung (Abschnitt 12) bildet Objekt und Himmel je Ebene ab und hebt den Himmel dabei relativ um $(L_\mathrm{obj}/L_\mathrm{Himmel})^{2/3}$ an (12.5 Punkt 4), waehrend verduennte Teile der Objektebene linear klein bleiben; ein Io-Pixel im 10x50, selbst mit $w(\mu)$ abgebildet, gaebe etwa sRGB 67 statt 17. (b) Im 10x50-Standardfenster ist ein Arbeitspixel 22,85'' und damit rund viermal groeber als die Augenaufloesung $60''/V$ = 6''; der Fluss verteilt sich auf ein viel zu grosses Pixel. Die Loesung kommt mit Issue #72, nicht in #14.
3. **Gleichmaessig helle Scheibe:** keine Randverdunklung, keine Phase; bei Durchmessern unter der Gesamt-FWHM ohne sichtbaren Einfluss.
4. **Quellweiss bei Jupiter und Saturn falsch geeicht (Review PR #69, Issue #71):** `weiss_mag_arcsec2` in `daten/objekte.json` ist die mittlere Flaechenhelligkeit der Scheibe (`objekte.md` 5.2), das Scheibenmittel im Quellbild liegt aber bei etwa 0,38 statt 1,0. Folge: die Planetenflaeche ist im Arbeitsraster um 1,07 mag (Jupiter) bzw. 1,27 mag (Saturn, Kugel plus Ring) zu dunkel, die Trabanten sind gegenueber dem Planeten 2,7- bis 3,2-mal zu hell. Die Formel in 13.1 bleibt richtig; falsch ist der Bezug $\mu_\mathrm{weiss}$. Die Korrektur der Eichung kommt mit Issue #71, `objekte.json` bleibt in #14 unveraendert.
