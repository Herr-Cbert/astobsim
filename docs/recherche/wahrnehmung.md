# Recherche Wahrnehmung: Kontrastschwelle, Grenzgroesse, Flaeche zu Punkt, Abbildung, Sternfarbe

**Auftrag:** Grundlagen fuer die Wahrnehmungsschwelle und die Helligkeit in Version 2 belegen (Phase 2 nach `docs/prozess.md`, Version 2). Grundlage ist `docs/anforderungen.md`, A-P4, A-P6, A-P8 bis A-P13, A-B2, A-Z9, A-Z10.
**Datum:** 2026-10-29
**Zugeordnete Kennungen:** A-P10, A-P11, A-P12, A-P13 (nur Hinweise), A-B2, A-Q5. Offene Fragen 2, 3, 4, 5 und 9 aus `docs/anforderungen.md` Abschnitt 10.
**Konventionen:** wie `docs/recherche/physik.md`. $B$ Leuchtdichte in cd/m$^2$, $\mu$ Flaechenhelligkeit in mag/arcsec$^2$, Umrechnung $\mu = 12{,}58 - 2{,}5\log_{10} B$ [1, Abschn. 1.3]; Beleuchtungsstaerke $\Delta I$ in lx, Magnitude $m = -2{,}5\log_{10}(\Delta I / Z)$ mit $Z = 2{,}54\cdot10^{-6}$ lx [1]. $A$ Flaeche des Ziels in Steradiant, $\alpha$ in Quadratbogenminuten. $V$ Vergroesserung, $AP$ Austrittspupille, $p$ = 6 mm Augenpupille (A-P4), $\tau$ Transmission ($F_t = 1/\tau$). Werte mit "(ber.)" habe ich mit einem Python-Skript nachgerechnet (nicht im Repo); jede Rechnung ist aus den angegebenen Formeln nachvollziehbar. Quellen in eckigen Klammern, Liste am Ende. Begriffe nach `GLOSSARY.md` (Wahrnehmungsschwelle, Punktquelle, Unaufgeloest, Punktebene, Quellweiss, Anzeigehelligkeit).

---

## 1. Kontrastschwelle (A-P11)

### 1.1 Blackwell 1946

Blackwell [2] ist die groesste und massgebliche Messreihe der Kontrastschwelle (nach Crumey [1, Abschn. 1.2]): 19 trainierte Beobachterinnen (19 bis 26 Jahre), beidaeugig, direkt oder indirekt, unbegrenzte Zeit, voll adaptiert; gleichmaessig helle, unbunte Scheiben mit sieben Durchmessern von 0,595' bis 6 Grad auf Hintergruenden von 3426 cd/m$^2$ bis null; Lichtquelle 2850 K. Ausgewertet ist die 50-%-Schwelle der Entdeckung aus erzwungener Wahl (8 Orte bzw. ja/nein bei wenig Licht), gemittelt ueber etwa 90 000 Beobachtungen (Tabelle 7, geglaettet Tabelle 8) [1, 2].

Befunde (nach [1, Abschn. 2.1], Abb. 3 und 4):
- Kontrast $C = \Delta B / B$, bei Licht durch den Himmel hindurch $\Delta B = B_\mathrm{Objekt}$ [1, Gl. 1].
- Bei Tageslicht gilt Weber ($C$ konstant), bei sehr wenig Licht strebt $\Delta B$ gegen einen festen Wert; unter etwa $10^{-5}$ cd/m$^2$ (25,08 mag/arcsec$^2$) wirkt der Hintergrund wie null [1, Abschn. 2.1; ebenso Crawford 1937 nach 1]. Das ist der Wert, den `physik.md` 6.2 als Nullhintergrund nennt.
- Fuer kleine Ziele gilt Ricco: $C\,A = R$, die Schwelle haengt nur am Gesamtfluss [1, Gl. 21]. Fuer grosse Ziele strebt $C$ gegen $C_\infty$. Ricco-Flaeche $A_R = R/C_\infty$ [1, Gl. 22]. Beide werden mit sinkender Leuchtdichte groesser.

### 1.2 Analytisches Modell nach Crumey 2014 (skotopisch)

Crumey [1] findet empirisch, dass $\sqrt{R}$ und $C_\infty$ fast linear in $B^{-1/4}$ sind, und setzt die beiden Asymptoten mit einer Potenznorm zusammen [1, Gl. 23, 35, 41]. Fuer den astronomisch relevanten Bereich (skotopisch) ist die vollstaendige Formel [1, Gl. 47 bis 49]:

$$C(A,B) = \left[\left(\frac{(r_1 B^{-1/4} + r_2)^2}{A}\right)^{q} + \left(k_1 B^{-1/4} + k_2\right)^{q}\right]^{1/q}$$

$$r_1 = 6{,}505\cdot10^{-4},\quad r_2 = -8{,}461\cdot10^{-4},\quad k_1 = 7{,}633\cdot10^{-3},\quad k_2 = -7{,}174\cdot10^{-3},\quad q = 0{,}6$$

- Gueltig fuer $10^{-5} \le B \le 3{,}426\cdot10^{-2}$ cd/m$^2$ (25,08 bis 16,2 mag/arcsec$^2$) [1, Gl. 47]. $q$ = 0,6 gilt fuer $B < 0{,}193$ cd/m$^2$ [1, Gl. 44].
- Fuer $0 < B \le 10^{-5}$ wird $B = 10^{-5}$ eingesetzt (Konstanten $\xi_1 = 1{,}150\cdot10^{-4}$, $\xi_2 = 1{,}286\cdot10^{-1}$) [1, Gl. 50 bis 52]. Die geglaettete Variante mit echter Null-Asymptote (Gl. 46) bringt laut Crumey praktisch nichts.
- Die Fernrohr-Anwendungen in [1] beschraenken sich auf Himmel dunkler als etwa $3\cdot10^{-3}$ cd/m$^2$ (18,9 mag/arcsec$^2$) und Ziele innerhalb etwa 1 mag ueber der Schwelle, weil darueber Zapfen mitwirken (mesopisch, CIE 191:2010: 0,005 bis 5 cd/m$^2$) [1, Abschn. 1.3]. Bortle 7 bis 9 mit blossem Auge (18,3 bis 17,0) liegen damit am Rand.
- $C_\infty$ stammt aus Taylor 1960 (obere Schranken), nicht aus Blackwell, und ist laut Crumey weniger belastbar als $R$ [1, Abschn. 2.3].
- Fotopisch und mesopisch gibt es weitere Zweige (Gl. 24, 25, 27, 28, 36, 39, 40, 42, 43); fuer astobsim nicht noetig, weil der Himmel im Okular immer skotopisch ist (`physik.md` 6.2).
- Farbkorrektur: der Himmel ohne Lichtverschmutzung hat etwa das S/P-Verhaeltnis von Blackwells Lichtquelle (1,38 gegen 1,41), Blackwells Hintergrund ist also repraesentativ [1, Abschn. 1.3]. Zwischen Sternen verschiedener Farbe verschiebt sich die Schwelle um $m_1 - m_2 = 0{,}27\,(c_2 - c_1)$, $c$ = B-V [1, Gl. 18]: blaue Sterne sind an der Schwelle bis etwa 0,5 mag "heller" als rote.

Schwelle im Gebrauch mit Feldfaktor $F$ (Abschnitt 1.3): $C_\mathrm{th} = F\,C(A,B)$; das Objekt ist sichtbar, wenn sein Kontrast $C = B_\mathrm{Objekt}/B_\mathrm{Himmel} \ge C_\mathrm{th}$. In Magnituden: sichtbar, wenn $\mu_\mathrm{Objekt} \le \mu_\mathrm{Himmel} - 2{,}5\log_{10} C_\mathrm{th}$.

Werte der Formel ohne Feldfaktor ($F$ = 1), Zielflaeche als Scheibe mit Durchmesser $d$ (ber.):

| $\mu_\mathrm{Himmel}$ | $B$ [cd/m$^2$] | $d$ = 1' | 3' | 10' | 30' | 100' | 360' | $C_\infty$ | Ricco-Radius |
|---|---|---|---|---|---|---|---|---|---|
| 25,08 (Null) | 1,00e-5 | 1739 | 196 | 18,9 | 2,60 | 0,477 | 0,188 | 0,129 | 58' (ber.) |
| 21,83 | 2,00e-4 | 325 | 37,1 | 3,71 | 0,577 | 0,140 | 0,0723 | 0,0571 | 37,6' |
| 21,0 | 4,29e-4 | 205 | 23,5 | 2,39 | 0,388 | 0,102 | 0,0564 | 0,0459 | 33,3' |
| 20,0 | 1,08e-3 | 115 | 13,2 | 1,38 | 0,238 | 0,0694 | 0,0416 | 0,0350 | 28,5' |
| 19,0 | 2,70e-3 | 61,6 | 7,14 | 0,767 | 0,143 | 0,0469 | 0,0303 | 0,0263 | 24,0' |
| 18,3 | 5,15e-3 | 38,4 | 4,48 | 0,495 | 0,0981 | 0,0353 | 0,0241 | 0,0213 | 21,0' |
| 17,0 | 1,71e-2 | 14,1 | 1,68 | 0,200 | 0,0463 | 0,0202 | 0,0152 | 0,0140 | 15,7' |

Lesehilfe: ein Detail von 10' auf einem Bortle-5-Himmel (20,0) braucht mit $F$ = 2 den Kontrast 2,8, also 1,1 mag heller als der Himmel; eine Flaeche von 6 Grad nur 8 % ueber dem Himmel. Crumeys eigene Kontrollwerte bei 21,83 mag/arcsec$^2$ ($F$ = 1): Grenzgroesse 6,93, Grenzflaechenhelligkeit $\mu_\infty$ = 24,94, Ricco-Radius 37,6' [1, Abschn. 3.1, Gl. 63]; die Tabelle trifft alle drei (ber.: 6,936 / 24,939 / 37,57'). Blackwells "kritischer Sehwinkel" (Beginn der Abweichung von Ricco) ist bei diesem Himmel nur etwa 4,5' Radius [1, nach Abb. 17 in 2]; die Ricco-Flaeche als Schnittpunkt der Asymptoten ist die groessere, konventionelle Groesse [1].

### 1.3 Feldfaktor: 50-%-Schwelle gegen sichere Wahrnehmung

- Blackwells Schwelle ist eine statistische Normierung (50 % richtige Antworten bei erzwungener Wahl), nicht "zur Haelfte der Zeit sichtbar" (Fehldeutung bei Clark 1994) und nicht "zu 50 % sicher" (Schaefer 1990) [1, Abschn. 1.2].
- Andere Wahrscheinlichkeiten $P$: Faktor $f = 1 + (\sigma/M)\,z$ mit $z$ dem Normalquantil von $P$ (Blackwell 1952a, nach [1]). Blackwells Beobachterinnen waren sich erst ab etwa 90 % sicher, das entspricht $f$ = 1,62 [1]; daraus $\sigma/M = 0{,}62/1{,}2816 = 0{,}484$ (ber.). Blackwell & Blackwell 1971 schlagen fuer "commonsense seeing" den Faktor 2,4 vor [1].
- Alter: weiterer Faktor, 1 fuer die Haelfte der 20-Jaehrigen bis 6,92 fuer 95 % der 65-Jaehrigen [1, nach Blackwell & Blackwell 1971]. A-P9 schliesst das Alter aus; es steckt im festen $F$.
- Crumey fasst alles (Laborskalierung, Beobachter, Ziel, Medium) in einen Feldfaktor $F$; er verschiebt die Schwellenkurve auf log-Achsen nur nach oben oder unten, die Form bleibt [1, Abschn. 1.2]. Mit realen Grenzgroessen um 6,0 bis 6,6 bei dunklem Himmel liegt $F$ zwischen 2,4 und 1,4; als typischen Wert nimmt Crumey $F$ = 2 (Grenzgroesse 6,18 bei 21,83) [1, Abschn. 3.1]. Bowen (49 Jahre) ergibt $F$ = 2,74, Herschel 2,36 [1, Abschn. 3.2, 3.3].
- Fernrohr: zusaetzlich $F_T = \sqrt2$ (einaeugig statt beidaeugig, Lythgoe & Phillips 1938 nach [1]) und $F_M$ = 1 (bis zur Grenze, ab der das Auge selbst beugungsbegrenzt ist) [1, Abschn. 1.6.4]. Beim Fernglas und blossen Auge ist $F_T$ = 1 (beidaeugig).

Folge fuer den "festen Normalbeobachter" aus A-P9: $F$ = 2 (blosses Auge, Fernglas), $\varphi = \sqrt2\,F = 2{,}83$ (Fernrohr). Das ist ein typischer erwachsener Beobachter, deutlich schwaecher als die Bortle-Grenzgroessen (Abschnitt 2.4).

### 1.4 Wirkung der Vergroesserung

Ein Fernrohr aendert Groesse und Hintergrund, nicht den Kontrast [1, Abschn. 3.3, Gl. 77 bis 80]:

$$C_\mathrm{th} = \varphi\left[\left(\frac{R_a}{A_a}\right)^q + C_a^q\right]^{1/q},\quad A_a = V^2 A,\quad B_a = \left(\frac{\min(AP,p)}{p}\right)^2 \frac{B}{F_t},\quad R_a = (r_1 B_a^{-1/4} + r_2)^2,\quad C_a = k_1 B_a^{-1/4} + k_2$$

- Der Kontrast $C$ eines Objekts gegen den Himmel ist von $V$ unabhaengig: beide Flaechenhelligkeiten werden gleich abgeschwaecht (`physik.md` 6.2; die Extinktion wirkt nur auf das Objekt).
- Mehr Vergroesserung vergroessert das scheinbare Detail ($A_a = V^2 A$, die Schwelle sinkt im Ricco-Bereich mit $1/A_a$), macht aber den Himmel im Okular dunkler ($B_a$ sinkt, $R_a$ und $C_a$ steigen). Daraus folgt eine guenstigste Vergroesserung je Objekt; ein Objekt kann bei mittlerer Vergroesserung sichtbar und bei kleiner und grosser unsichtbar sein [1, Abschn. 3.4, Abb. 17]. Unter $B_a = 10^{-5}$ cd/m$^2$ bringt mehr Vergroesserung nur noch Groesse: Grenzaustrittspupille $d_0 = p\sqrt{10^{-5} F_t / B}$ [1, Gl. 70], bei Bortle 5 und $\tau$ = 0,75 etwa 0,7 mm (ber.).
- "Teleskopische Ricco-Flaeche" am Himmel $A_{TR} = R_a/(V^2 C_a)$ [1, Gl. 81]; Grenzflaechenhelligkeit und Grenzgroesse eines Ziels der Flaeche $\alpha$:

$$\mu_\mathrm{lim} = \mu_\infty - \frac{2{,}5}{q}\log_{10}\!\left[\left(\frac{\alpha_{TR}}{\alpha}\right)^q + 1\right],\qquad m_\mathrm{lim} = m_0 - \frac{2{,}5}{q}\log_{10}\!\left[\left(\frac{\alpha}{\alpha_{TR}}\right)^q + 1\right],\qquad \mu_\infty = \mu_\mathrm{Himmel} - 2{,}5\log_{10}(\varphi\,C_a)$$

[1, Gl. 84, 86, 88]. Kontrollwert Herschel (475 mm, $V$ = 157, $p$ = 5,08 mm, $F_t$ = 1,6, 21,83, $F$ = 2,36): $\mu_{157} = 23{,}18 - 4{,}167\log_{10}(0{,}468\,\alpha^{-0{,}6} + 1)$ und Sterngrenze 15,66 mag [1, Gl. 89]; nachgerechnet 23,180, $\alpha_{TR}^{0{,}6}$ = 0,468, 15,667 (ber.).

### 1.5 Aeltere Modelle

- Knoll, Tousey & Hulburt 1946 [3]: $\Delta I = c\,(1 + K B)^{1/2}$, $c = 1{,}076\cdot10^{-9}$ lx, $K = 10^5$; Ziel etwa 1', Einstellverfahren (gibt hoehere Schwellen als die erzwungene Wahl, Faktor etwa 2) [1, Gl. 19, Abschn. 1.4].
- Hecht 1947 [4]: $\Delta I = c\,(1 + (K B)^{1/2})^2$, zwei Zweige mit Sprung bei $1{,}645\cdot10^{-2}$ cd/m$^2$; Grundlage von Schaefer 1990, Garstang und den verbreiteten Online-Rechnern [1, Gl. 20]. Im skotopischen Bereich hat Hechts Kurve die falsche Kruemmung und ist schlechter als Knoll [1, Abschn. 1.5].
- Schaefer 1990 [5]: vollstaendiges Modell der teleskopischen Grenzgroesse auf Hecht-Basis mit einzeln geschaetzten Faktoren (Extinktion, Farbe, Alter, Pupille, Stiles-Crawford, einaeugig, Seeing), getestet an 314 Beobachtungen, Fehler typisch 0,5 mag nach Abzug der Erfahrung [5, Abstract]. Crumey zeigt an Bowens Daten (Mount Wilson 1947) einen mittleren Fehler von 0,37 mag fuer Schaefer gegen 0,09 mag fuer sein Modell [1, Abschn. 3.2]. Schaefers Formel fuer das blosse Auge im Zenit: $m_z = 8{,}68 - 2{,}5\log_{10} F_s - 1{,}2\,k_v - 5\log_{10}(1 + 0{,}158\,B_s^{1/2})$ mit $B_s = 34{,}08\,\exp(20{,}7233 - 0{,}92104\,\mu)$ in nL [5, Gl. 17, 18].
- Clark 1990 [6] zeichnet Blackwells Kurven fuer Deep-Sky-Vorhersagen grafisch; Crumey ersetzt das durch Formeln [1]. Clark nicht im Buch eingesehen.

**Empfehlung:** Crumey Gl. 47 bzw. 77 als einzige Schwellenformel, mit $F$ = 2 und $F_T = \sqrt2$ am Fernrohr.

---

## 2. Grenzgroesse fuer Sterne

### 2.1 Punktquellen: Ricco-Bereich und Schwellen-Beleuchtungsstaerke

Ein Stern ist ein Ziel im Ricco-Bereich, solange sein scheinbarer Durchmesser unter der Ricco-Flaeche liegt; skotopisch ist das bis etwa 10' der Fall [1, Abschn. 2.2 und 1.6.2], Schaefer nennt 15' als kritische Groesse [5, S. 214]. Die Schwelle ist dann eine Beleuchtungsstaerke am Auge, $\Delta I = A\,\Delta B = B\,R$ [1, Gl. 32]:

$$\Delta I = F\,(r_1 B^{1/4} + r_2 B^{1/2})^2\quad\text{(blosses Auge, ausserhalb der Atmosphaere)}\quad[1,\ \text{Gl. } 53]$$

Naeherungen in Magnituden [1, Gl. 54, 55]: $m_0 = 0{,}3834\,\mu - 1{,}4400 - 2{,}5\log_{10} F$ (20 bis 22 mag/arcsec$^2$, Fehler 0,01 mag); $m_0 = 0{,}4260\,\mu - 2{,}3650 - 2{,}5\log_{10} F$ (21 bis 25, Fehler 0,04 mag). Die Extinktion des Sterns kommt hinzu (im Zenit mit $k$ = 0,20 etwa 0,2 mag, `physik.md` 5.4).

### 2.2 Fernrohr

Crumey nach Tousey & Hulburt 1948 [1, Gl. 66 bis 72], $D$ und $\delta$ in gleichen Einheiten, $\delta_\mathrm{min} = \min(AP,p)$, $\delta_\mathrm{max} = \max(AP,p)$:

$$\Delta I = \left(\frac{\delta_\mathrm{max}}{D}\right)^2 F_t\,F_M\,F_T\,F\,(r_1 B_a^{1/4} + r_2 B_a^{1/2})^2,\qquad B_a \ge 10^{-5}\ \text{cd/m}^2$$

Unter dem Nullhintergrund bleibt die Schwelle fest: $m_\mathrm{cut} = 5\log_{10} D - 2{,}5\log_{10}(Z^{-1}\zeta\,p^2 F_t F_M F_T F)$ mit $\zeta = 1{,}150\cdot10^{-9}$ lx [1, Gl. 71, 72]. Mit $p$ = 7 mm, $\tau$ = 0,75, $F_T = \sqrt2$, $F$ = 2 folgt die Faustformel $m_\mathrm{cut} = 7{,}69 + 5\log_{10} D_\mathrm{cm}$ [1, Gl. 73], gleich Sinnotts 7,7 [nach 1]. In mm: $2{,}7 + 5\log_{10} D_\mathrm{mm}$; die gelegentlich genannte Form $2 + 5\log_{10} D_\mathrm{mm}$ entspricht $F \approx 3{,}8$, also einem schwaecheren Beobachter oder hellerem Himmel.

Der Verlauf ueber der Austrittspupille hat drei Geraden: Steigung 5 fuer $AP \ge p$, 2,131 fuer $p \ge AP \ge d_0$, 0 darunter; Bowens Messungen am 6-Zoll-Refraktor: $m_0 = -5\log d + 1{,}02$ / $-2{,}131\log d + 7{,}57$ / 13,96 ($d$ in m) [1, Gl. 74]. Wird das Seeing-Scheibchen im Auge groesser als etwa 10', ist der Stern kein Punkt mehr; Crumey behandelt ihn dann als Flaeche mit Durchmesser 2,8 FWHM (99 bis 100 % des Lichts einer Gauss-Scheibe) in Gl. 88 [1, Abschn. 1.6.2, 3.3]. Schaefer korrigiert mit $F_r = (2\theta V/900'')^{0{,}5}$ fuer $2\theta V > 900''$ [5, Gl. 7].

### 2.3 Tabelle Grenzgroesse (ber.)

Annahmen: Zenit, ohne Extinktion, $p$ = 6 mm (A-P4), $F$ = 2, Fernrohr $F_T = \sqrt2$, $F_M$ = 1; 80 mm Refraktor $\tau$ = 0,90; 150 und 200 mm Newton $\tau = 0{,}80\cdot(1 - 0{,}25^2) = 0{,}75$ (`physik.md` 5.2); Seeing 2'' als Scheibe 2,8 FWHM mit Gl. 88; $\mu$ nach `physik.md` 6.1 (Spalte Vorschlag astobsim). Je Oeffnung zwei Vergroesserungen: AP 2 mm und AP 1 mm.

| Bortle | $\mu$ | NELM Bortle [7] | Crumey $F$=2 | Schaefer Gl. 18 | 80 mm 40x | 80 mm 80x | 150 mm 75x | 150 mm 150x | 200 mm 100x | 200 mm 200x |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 21,9 | 7,6 bis 8,0 | 6,21 | 6,71 | 12,40 | 12,68 | 13,62 | 13,77 | 14,22 | 14,34 |
| 3 | 21,4 | 6,6 bis 7,0 | 6,01 | 6,42 | 12,17 | 12,68 | 13,39 | 13,77 | 13,99 | 14,34 |
| 5 | 20,0 | 5,6 bis 6,0 | 5,49 | 5,48 | 11,55 | 12,18 | 12,76 | 13,35 | 13,35 | 13,92 |
| 7 | 18,3 | 4,6 bis 5,0 | 4,98 | 4,10 | 10,85 | 11,41 | 12,04 | 12,56 | 12,61 | 13,11 |
| 9 | 17,0 | <= 4,0 | 4,78 | 2,94 | 10,38 | 10,86 | 11,54 | 11,98 | 12,10 | 12,51 |

Faustformeln (nur Oeffnung): $7{,}7 + 5\log_{10} D_\mathrm{cm}$ ergibt 12,21 / 13,57 / 14,20, $2 + 5\log_{10} D_\mathrm{mm}$ 11,52 / 12,88 / 13,51 fuer 80 / 150 / 200 mm (ber.). Schaefer Gl. 18 mit $k_v$ = 0,2, $F_s$ = 1.

Beobachtungen zur Tabelle:
- Bei Bortle 1 und 3 erreicht 80 mm bei 80x den Nullhintergrund (gleiche Werte); die Formel ist ab dort nur noch von der Oeffnung abhaengig.
- Bei 200x und 2'' Seeing ist das Sternscheibchen im Auge 18,7' gross (2,8 x 2'' x 200), die Grenze faellt um 0,2 bis 0,35 mag gegen den Punktwert (ber.). Abtastung 200 mm, Bortle 5: 25x 11,86, 50x 12,78, 100x 13,35, 200x 13,92, 300x 14,23, 400x 14,12 (ber.); das Maximum liegt beim Nullhintergrund (AP etwa 0,7 mm), danach verliert das Seeing.
- Fernglas 10x50, $\tau$ = 0,85, beidaeugig: Bortle 5 10,1 mag, Bortle 3 10,7 mag (ber.).

### 2.4 Vergleich mit Bortle

Bortle [7] nennt fuer jede Klasse auch die Grenze eines 32-cm-Reflektors (12,5 Zoll): Klasse 1 17,5 "with effort", 2 16 bis 17, 3 16, 4 15,5, 5 14,5 bis 15, 6 14,0 bis 14,5, 7 knapp 14, 8 kaum besser als 13. Das Modell (320 mm, $\tau$ = 0,75, 160x, 2'' Seeing, ber.) ergibt 15,2 / 15,1 / 14,9 / 14,8 / 14,3 / 13,8 / 13,5 / 13,2 fuer die Klassen 1 bis 8.

- Bei dunklem Himmel liegt das Modell mit $F$ = 2 um 1 bis 2 mag (blosses Auge) bzw. 1 bis 2,3 mag (32 cm) unter Bortle; um Bortle zu treffen, braeuchte es $F \approx 0{,}5$, also besser als Blackwells 50-%-Laborschwelle. Crumey: Bortle ueberschaetzt den typischen Beobachter, Werte ueber 7 sind meist Szintillations-Aufblitzer oder Ausnahmebeobachter [1, Abschn. 1.6.5; 8].
- Bei Bortle 5 bis 7 passen Modell und Bortle (Abweichung unter 0,5 mag). Bei Bortle 8 und 9 ist das Modell heller als Bortle; dort sind die Himmelswerte geschaetzt (`physik.md` 10 Punkt 6) und der Himmel ist mesopisch, also ausserhalb von Crumeys Anwendungsbereich.
- Schaefers Formel ist bei hellem Himmel viel steiler (Bortle 9: 2,9); das ist Hechts zweiter Zweig.

---

## 3. Gleitender Uebergang Flaeche zu Punkt (A-P10)

### 3.1 Zwei verschiedene Kriterien

1. **Erkennbarkeit (Schwelle):** Unterhalb der Ricco-Flaeche ist ein schwaches Ziel vom Punkt nicht zu unterscheiden; NGC-Eintraege, die sich als Sterne erwiesen, zeigen das [1, Abschn. 2.1]. Skotopisch bis etwa 10' (Crumey) bzw. 15' (Schaefer) scheinbar. Den Uebergang der Schwelle beschreibt Gl. 88 (Abschnitt 1.4) vollstaendig und gleitend; dafuer braucht es keine eigene Fallunterscheidung. Die Ricco-Flaeche ist eine Groesse der Schwelle, nicht der Form ueberschwelliger Objekte.
2. **Form (Aufloesung):** Ob ein helles Objekt als Scheibchen oder Punkt erscheint, entscheidet die Sehschaerfe bei der Leuchtdichte des Objekts. Jupiter hat etwa 5,5 mag/arcsec$^2$ (`physik.md` 6.3), also etwa 680 cd/m$^2$ (ber.), mit blossem Auge und im Fernglas weit fotopisch; dort ist die Aufloesung etwa 1' (`physik.md` 3.1; Blackwells kritischer Sehwinkel bei Licht 0,7' [2 nach 6]), fuer schwache Flaechen deutlich groeber (Blackwells kritischer Sehwinkel bei dunklem Himmel etwa 9' Durchmesser [1]). Crumey: bei Tageslicht reicht der Ricco-Bereich nur bis etwa 1' [1, Abschn. 2.2].

Fuer A-P10 (Planeten und Monde, alle hell) gilt Kriterium 2 mit $\theta_A$ = 60'' (A-P2), Kennzahl $x = \theta\,V/\theta_A$ mit $\theta$ dem Winkeldurchmesser.

### 3.2 Uebergangsfunktion

Gesucht ist ein Gewicht $g(x)$ von 1 (Punkt) nach 0 (Flaeche). Belegte Formen fuer das Zusammensetzen der Punkt- und der Flaechen-Asymptote:
- Crumey/Adrian: Potenznorm $C = (C_\mathrm{Punkt}^q + C_\mathrm{Flaeche}^q)^{1/q}$, $q$ = 0,6 skotopisch, Adrian 1989 und CIE 1981 mit $q$ = 2 [1, Abschn. 2.1, Gl. 41]. Als Anteil der Punkt-Asymptote: $g = 1/(1 + (\alpha/\alpha_R)^q) = 1/(1 + x^{2q})$ (ber.).
- Schaefer: Punkt bis zur kritischen Groesse, darueber Schwelle $\propto$ (Groesse)$^{0{,}5}$ [5, Gl. 7]; das hat einen Knick.

Vorschlag (eigene Herleitung, ber.): $g$ als Anteil der Augen-PSF an der Breite des Bilds auf der Netzhaut. Eine gleichmaessige Scheibe mit Durchmesser $d$ hat je Achse die Varianz $d^2/16$, die Gauss-PSF des Auges mit FWHM $\theta_A$ die Varianz $\theta_A^2/(8\ln2)$. Damit

$$g(x) = \frac{\sigma_\mathrm{Auge}^2}{\sigma_\mathrm{Auge}^2 + \sigma_\mathrm{Scheibe}^2} = \frac{1}{1 + \frac{\ln 2}{2}\,x^2} = \frac{1}{1 + 0{,}3466\,x^2},\qquad x = \frac{\theta V}{\theta_A}$$

| Fall | $x$ | $g$ (Vorschlag) | $g$ Crumey-Form $1/(1+x^{1{,}2})$ |
|---|---|---|---|
| Jupiter 47'' blosses Auge | 0,783 | 0,825 | 0,574 |
| Jupiter 47'' 10x | 7,83 | 0,045 | 0,078 |
| Jupiter 47'' 50x | 39,2 | 0,0019 | 0,012 |
| Mars 6'' blosses Auge | 0,10 | 0,997 | 0,94 |
| Saturn 20'' im 10x50 | 3,33 | 0,21 | 0,19 |

Der Vorschlag ist streng monoton, glatt in $V$ und ergibt fuer T6 einen Punkt mit blossem Auge und ein Scheibchen im 10x50. Die Crumey-Form (mit $q$ = 0,6) ist fuer die Schwelle gemacht und fuer die Form zu flach: Jupiter mit blossem Auge waere nur zu 57 % Punkt.

Anwendung (Vorschlag fuer Phase 3): das gefaltete Objektraster $q$ wird gemischt aus der linearen Objektabbildung und der Punktebenen-Abbildung (`physik.md` 14.2): $\mathrm{Pixel} = (1-g)\,w_\mathrm{obj}\,q + g\,\min(1, (a\,q)^n) + w_\mathrm{Himmel}$. Bei $g$ = 1 verhaelt sich der Planet wie ein Trabant, seine Helligkeit folgt aus dem Gesamtfluss (A-P10); bei $g$ = 0 bitgleich mit heute. Zahlen fuer Jupiter mit blossem Auge (ber.; Quellweiss 4,83, 45 Grad, $k$ = 0,20, Fluss $10^{-0{,}4(-2{,}7-4{,}83)}$ = 1028 arcsec$^2$ Quellweiss, Augen-PSF 60'' plus Scheibe, Varianz 787 arcsec$^2$): Spitze $q \approx 0{,}21$, $a$ = 0,197, linear $w_\mathrm{obj}\,q$ = 0,12 (sRGB 98), als Punkt $(a q)^{1/3}$ = 0,35 (sRGB 159). "Im Kern nahezu weiss" (A-P13 ii) erreicht auch die Punktabbildung mit den heutigen Konstanten nicht; das gehoert zur Nachstellung der Konstanten (A-P4 V2, offene Frage 1).

---

## 4. Getrennte oder gemeinsame Abbildung von Objekt und Himmel (offene Frage 4)

### 4.1 Was die getrennte Abbildung tut

`physik.md` 12.3: Objektpixel $q\,a^{n}$ (Niveau komprimiert, Binnenkontrast linear), Himmel $s^{n}$, mit $a = L_\mathrm{Quellweiss,ok}/L_\mathrm{weiss}$, $s = L_\mathrm{Himmel,ok}/L_\mathrm{weiss}$, $n$ = 1/3. Ein Pixel hat physikalisch $L = q\,a\,L_\mathrm{weiss}$, der Kontrast gegen den Himmel ist $C = q\,a/s$. Angezeigt wird (ber.)

$$C_\mathrm{Anzeige} = \frac{q\,a^{1/3}}{s^{1/3}} = C^{1/3}\,q^{2/3}$$

Der angezeigte Kontrast haengt also an $q$, das heisst an der willkuerlichen Wahl von Quellweiss: wird Quellweiss um $\Delta$ mag heller gewaehlt, faellt jedes Objektpixel in der Anzeige um den Faktor $10^{-0{,}4\cdot2\Delta/3}$, obwohl sich physikalisch nichts aendert. Fuer Planeten ist das ohne Folge, weil der Himmel $10^4$- bis $10^7$-mal dunkler ist (`physik.md` 6.3, 12.3: "Hintergrund dunkler als das Objekt"). Fuer Deep-Sky-Flaechen nahe der Himmelshelligkeit ist es die entscheidende Groesse.

### 4.2 Zahlen (ber.)

Beispiele mit $\mu_\mathrm{weiss}$ = 3,35, $n$ = 1/3, ohne Extinktion beim blossen Auge; sRGB-Kode nach [9]. Die Deep-Sky-Werte sind Beispielwerte zur Begruendung, keine Objektdaten (die liefert die Deep-Sky-Recherche): "M31-artig" = Kern 17,0 und Aussenscheibe 22,5 mag/arcsec$^2$ auf Bortle 3 (21,4); M57 als Ring mit etwa 17,8 mag/arcsec$^2$ (8,8 mag auf 1,4' x 1,0', ber.) an 80 mm bei 50x (AP 1,6 mm, $\tau$ = 0,9, Faktor +2,98 mag) auf Bortle 5. Schwelle mit Crumey Gl. 47 / 77 fuer die scheinbare Groesse, $F$ = 2 bzw. $\varphi$ = 2,83.

| Fall | $C$ physikalisch | Schwelle $C_\mathrm{th}$ | $C/C_\mathrm{th}$ | Quellweiss | getrennt: $C_\mathrm{Anzeige}$ | gemeinsam: $(1+C)^{1/3} - 1$ | sRGB Himmel / Objekt+Himmel getrennt / gemeinsam |
|---|---|---|---|---|---|---|---|
| M31-artig Aussenscheibe, 60' | 0,363 | 0,384 | 0,95 | 17,0 (Kern) | 0,024 | 0,109 | 12,7 / 13,0 / 13,9 |
| dasselbe | 0,363 | 0,384 | 0,95 | 19,3 | 0,100 | 0,109 | 12,7 / 13,8 / 13,9 |
| M31-artig Kern, 10' | 57,5 | 5,9 | 9,7 | 17,0 | 3,86 | 2,88 | 12,7 / 37,6 / 33,0 |
| M57 80 mm 50x, 60' scheinbar | 5,86 | 1,06 | 5,5 | 17,3 (Ring) | 1,33 | 0,90 | 7,9 / 17,0 / 14,5 |
| Flaeche $C$ = 0,1 am M57-Himmel | 0,10 | 1,06 | 0,09 | 17,3 | 0,023 | 0,032 | 7,9 / 8,1 / 8,2 |

Folgen:
1. **Abhaengigkeit von der Eichung:** dieselbe Aussenscheibe erscheint getrennt abgebildet mit 2,4 % oder 10 % Kontrast, je nachdem ob Quellweiss auf den Kern oder 2,3 mag tiefer gelegt wird. Gemeinsam abgebildet ist der angezeigte Kontrast eine feste Funktion von $C$: $(1+C)^{1/3} - 1$, unabhaengig von Quellweiss.
2. **Unterdrueckung schwacher Teile:** getrennt wird der Aussenbereich gegen den physikalischen Kontrast um den Faktor 15 gedrueckt (0,024 statt 0,363), gemeinsam um den Faktor 3,3. Die gemeinsame Abbildung komprimiert alle kleinen Kontraste gleichmaessig um etwa $n$ = 1/3 ($\mathrm{d}\ln w = n\,\mathrm{d}\ln L$).
3. **Schwelle und Bildschirm:** auf dem dunklen Himmelsgrau braucht ein sRGB-Kode Stufe 9 % (Kode 13) bzw. 15 % (Kode 7) Leuchtdichteunterschied (ber. aus [9]). Ein Objekt knapp ueber der Schwelle wird gemeinsam abgebildet nur 1 bis 2 Kodes heller als der Himmel; bei hellem Himmel (Bortle 7 bis 9, grosse Flaechen, $C_\mathrm{th}$ um 0,02 bis 0,05) ergibt $(1+C_\mathrm{th})^{1/3} - 1$ = 0,7 bis 1,6 % und damit gar keinen Kode. Weder getrennte noch gemeinsame Kompression bringt "sichtbar genau dann, wenn ueber der Schwelle" auf den Schirm; dafuer braucht es einen eigenen Schritt.

### 4.3 Bezug zur Literatur

Ward 1994 [10] und Ward Larson et al. 1997 [11] (`physik.md` [56, 57]) bilden so ab, dass eine Schwelle in der Szene einer Schwelle auf der Anzeige entspricht ("visibility matching"); Ward mit einem festen Faktor am Adaptionspunkt. Das ist genau die Forderung von A-P11: der Adaptionspunkt ist hier fest der Himmel im Okular, es gibt kein Adaptionsmodell im Sinn von A-P9. Die Formeln von [10] habe ich nicht im Original gesehen (wie in `physik.md` 12.5).

### 4.4 Empfehlung als Grundlage fuer ADR-0004 "Helligkeit und Wahrnehmungsschwelle"

1. **Deep-Sky-Ebene gemeinsam mit dem Himmel abbilden.** Deep-Sky-Flaechen (A-Z10) bekommen eine eigene Ebene im Arbeitsraster; je Pixel $w = \min(1, (a\,q + s)^{n})$ statt $q\,a^n + s^n$. Sonnensystem-Flaechen bleiben getrennt wie in `physik.md` 12.3 (T1 bis T6 bitgleich, Binnenkontrast linear; dort ist der Himmel um mindestens 8,9 mag dunkler und die Frage stellt sich nicht). Begruendung: unabhaengig von Quellweiss, Kontrast monoton in $C$, Himmel und Objekt verschmelzen am Rand stetig.
2. **Schwelle physikalisch, vor der Abbildung.** Fuer jedes Deep-Sky-Objekt sucht physik die schwaechste sichtbare Isophote nach Crumeys Verfahren fuer M33 und M31 [1, Abschn. 3.1, Abb. 12]: fuer Isophoten $\mu_i$ mit eingeschlossener Flaeche $\alpha_i$ ist die Isophote sichtbar, wenn $\mu_i \le \mu_\mathrm{lim}(\alpha_i)$ (Gl. 84 mit $V$, $B_a$, $\varphi$). Pixel unter der sichtbaren Isophote zeigt der Anblick als Himmel. Fuer Sterne (Doppelsterne, M45, Trapez, Trabanten) gilt die Grenzgroesse $m_\mathrm{lim}$ aus Gl. 68 bzw. 88 mit dem Seeing-Scheibchen.
3. **Gleitend statt Sprung.** Ausblenden nach Blackwells Wahrscheinlichkeitskurve [1, Abschn. 1.2]: Deckkraft $P = \Phi\big((C/C_\mathrm{th} - 1)/0{,}484\big)$ mit $C_\mathrm{th}$ bei $F$ = 2; fuer Sterne mit $C/C_\mathrm{th} = 10^{-0{,}4(m - m_\mathrm{lim})}$. 10 % bei 1,05 mag unter, 90 % bei 0,52 mag ueber der Schwelle (ber.).
4. **Mindestsichtbarkeit auf dem Schirm.** Je Objekt und Konfiguration ein fester Verstaerkungsfaktor $G \ge 1$ fuer den Zuwachs ueber dem Himmel, so dass ein Pixel an der Schwelle mindestens $\Delta_\mathrm{min}$ sRGB-Kodes ueber dem Himmel liegt (Vorschlag 3 Kodes); $G$ = 1, wenn die Abbildung das schon leistet. Ein Faktor je Objekt erhaelt die Monotonie im Objekt. $\Delta_\mathrm{min}$ legt Herbert am Bild fest, wie $\mu_\mathrm{weiss}$ (`physik.md` 12.5 Punkt 3).
5. **Konstanten:** $F$ = 2, $F_T = \sqrt2$ (Fernrohr) bzw. 1 (Fernglas, Auge), $F_M$ = 1, $q$ = 0,6, Nullhintergrund $10^{-5}$ cd/m$^2$, Seeing-Scheibe 2,8 FWHM.

Verworfen:
- **Getrennte Abbildung auch fuer Deep-Sky:** angezeigter Kontrast haengt an Quellweiss (Faktor 4 bei 2,3 mag Eichunterschied), schwache Teile bis Faktor 15 zu schwach (4.2).
- **Gemeinsame Abbildung fuer alle Objekte:** komprimiert den Binnenkontrast der Planeten und des Mondes je Pixel, in `physik.md` 12.3 verworfen; T1 bis T5 waeren neu zu pruefen.
- **Nur gemeinsame Abbildung, Schwelle ohne eigenen Schritt:** Objekte knapp ueber der Schwelle sind auf dem Schirm unsichtbar, bei hellem Himmel auch deutlich ueberschwellige (4.2 Punkt 3).
- **Schwelle als harter Schnitt:** Objekte und Sterne springen beim Aendern der Vergroesserung, widerspricht dem Sinn von A-P10.
- **Schwelle je Pixel mit fester Detailgroesse:** die Schwelle haengt an der Flaeche des zusammenhaengenden Gebiets, nicht am Pixel; eine feste Groesse (z. B. Augenaufloesung) waere fuer schwache Flaechen um Groessenordnungen zu streng (Tabelle 1.2: 1' gegen 100').
- **Adaptionsabhaengiges Tone-Mapping (Tumblin & Rushmeier, Ward Larson mit Histogramm):** Adaptionsmodell, A-P9.

---

## 5. Sternfarbe (A-P12)

### 5.1 Schwelle des Farbsehens

- CIE 191:2010: mesopischer Bereich 0,005 bis 5 cd/m$^2$; darunter skotopisch, nur Staebchen, keine Farbe [1, Abschn. 1.3 nach CIE 2010]. Fuer Flaechen gibt Clark den Uebergang zu Zapfen bei etwa 19 bis 20 mag/arcsec$^2$ an, abhaengig von Kontrast und Groesse [12]; die Milchstrasse um 20 mag/arcsec$^2$ zeigt bei ihm Farbe. A-P12 zeigt Deep-Sky-Flaechen ohnehin grau.
- Punktquellen haben keine Leuchtdichte im Auge; die Schwelle ist eine Beleuchtungsstaerke. Mit blossem Auge sind Sterne ab etwa 2,3 mag farbig, "aus Beobachtungserfahrung, nicht scharf definiert" [13, Fussnote 3]. Schaefer 1996: am Fernrohr sind Sterne nur bis etwa 1 mag ueber der Schwelle rein skotopisch [1, Abschn. 1.3]; das ist die Grenze der Zapfenbeteiligung, nicht des Farbsehens.
- Schwelle als Beleuchtungsstaerke am Auge (ber.): $E_\mathrm{Farbe} = Z \cdot 10^{-0{,}4\cdot2{,}3} = 3{,}1\cdot10^{-7}$ lx. Am Fernrohr erreicht ein Stern der Magnitude $m$ am Auge $Z\,10^{-0{,}4m}\,\tau\,(1-\epsilon^2)\,(\min(D, pV)/p)^2$ (`physik.md` 13.1), die Farbgrenze liegt also bei $m_\mathrm{Farbe} = 2{,}3 + 5\log_{10}(\min(D,pV)/p) + 2{,}5\log_{10}[\tau(1-\epsilon^2)]$: 80 mm Refraktor 7,8 mag, 200 mm Newton 9,6 mag (ber.).

### 5.2 B-V zu Farbtemperatur

Ballesteros 2012 [14, Gl. 14], aus der Schwarzkoerper-Naeherung mit angepassten effektiven Wellenlaengen:

$$T = 4600\,\mathrm{K}\left(\frac{1}{0{,}92\,(B-V) + 1{,}7} + \frac{1}{0{,}92\,(B-V) + 0{,}62}\right)$$

Kontrolle: B-V = 0,65 (Sonne) ergibt 5778 K (ber.). Die Formel liefert eine Farbtemperatur, keine Effektivtemperatur; fuer die angezeigte Farbe ist das die richtige Groesse.

### 5.3 Farbtemperatur zu sRGB

Rezept (ber.): Planck-Spektrum von 360 bis 830 nm in 1-nm-Schritten, gewichtet mit den CIE-1931-2-Grad-Normspektralwertfunktionen (hier die analytische Naeherung von Wyman, Sloan & Shirley 2013 [15]), $XYZ$ nach linearem sRGB mit der Matrix aus IEC 61966-2-1 (Weisspunkt D65) [9], dann auf den groessten Kanal 1 normiert (wie Charity [16]) oder auf $Y$ = 1 (fuer die Helligkeitsrechnung). Gegen Charitys Tabelle (CIE 1931 mit Judd-Vos-Korrektur, sRGB) [16]: 5800 K 255/241/235 gegen 255/241/231, 10 000 K 205/217/255 gegen 207/218/255, 3500 K 255/200/140 gegen 255/201/135; Unterschied hoechstens 5 Kodes im blauen Kanal (ber.).

| B-V | $T$ [K] | $x$, $y$ | linear (max = 1) | linear ($Y$ = 1) | sRGB 8 Bit | hex |
|---|---|---|---|---|---|---|
| -0,3 | 16 600 | 0,2610 / 0,2634 | 0,439 / 0,563 / 1 | 0,773 / 0,991 / 1,760 | 177 / 198 / 255 | #b1c6ff |
| 0,0 | 10 130 | 0,2800 / 0,2875 | 0,604 / 0,690 / 1 | 0,869 / 0,994 / 1,440 | 204 / 217 / 255 | #ccd9ff |
| 0,6 | 5970 | 0,3226 / 0,3325 | 1 / 0,898 / 0,869 | 1,090 / 0,979 / 0,947 | 255 / 243 / 240 | #fff3f0 |
| 1,0 | 4740 | 0,3525 / 0,3579 | 1 / 0,764 / 0,565 | 1,251 / 0,955 / 0,706 | 255 / 226 / 198 | #ffe2c6 |
| 1,5 | 3790 | 0,3894 / 0,3830 | 1 / 0,626 / 0,329 | 1,461 / 0,915 / 0,481 | 255 / 207 / 155 | #ffcf9b |
| 1,8 | 3390 | 0,4108 / 0,3944 | 1 / 0,558 / 0,236 | 1,591 / 0,887 / 0,376 | 255 / 197 / 133 | #ffc585 |

Alle Werte liegen im sRGB-Gamut (kein negativer Kanal). Die Spalte "$Y$ = 1" ist fuer astobsim die passende: Farbe multipliziert die Anzeigehelligkeit, ohne die Leuchtdichte zu aendern; Kanaele ueber 1 begrenzt `zeichne.ts` je Pixel. Die Farben sind blass, wie am Fernrohr; deutlich farbig wirken am Okular vor allem Kontrastpaare (Albireo) durch simultanen Kontrast, den astobsim nicht modelliert.

---

## 6. Testwerte fuer Unit-Tests (A-Q1)

| Groesse | Eingabe | Erwartung | Herkunft |
|---|---|---|---|
| $\mu \to B$ | 21,83 / 25,08 | 1,995e-4 / 1,00e-5 cd/m$^2$ | [1, Abschn. 1.3] |
| $m_0$ blosses Auge, $F$ = 1 | 21,83 | 6,93 (ber. 6,936) | [1, Abschn. 3.1] |
| $m_0$, $F$ = 2 | 21,83 / 20,0 / 18,3 | 6,18 / 5,49 / 4,98 | [1]; ber. |
| $\mu_\infty$, $F$ = 1 | 21,83 | 24,94 (ber. 24,939) | [1, Gl. 56] |
| Ricco-Radius | 21,83 | 37,6' (ber. 37,57') | [1, Gl. 63] |
| $C(A,B)$, $F$ = 1 | $B$ = 2e-4, $d$ = 1' / 10' / 100' | 325,2 / 3,713 / 0,1395 | ber. aus [1, Gl. 47] |
| $C(A,B)$ | $B$ = 1e-5, $d$ = 10'; $B$ = 5e-7 wie 1e-5 | 18,85 | ber.; Nullhintergrund [1, Gl. 50] |
| $C_\infty$ | $B$ = 1e-5 / 2e-4 | 0,1286 / 0,05705 | ber. ($\xi_2$ = 0,1286 [1, Gl. 52]) |
| Herschel | 475 mm, 157x, $p$ 5,08, $F_t$ 1,6, 21,83, $F$ 2,36 | $m_0$ 15,66; $\mu_\infty$ 23,18; $\alpha_{TR}^{0{,}6}$ 0,468 | [1, Abschn. 3.3, Gl. 89] |
| Nullhintergrund | 100 mm, $F_t F_M F_T F$ = 3,77, $p$ 7 mm | $m_\mathrm{cut}$ 12,7 (ber. 12,69) | [1, Abb. 13] |
| Faustformel | $D$ = 10 cm, $F$ = 2, $p$ 7, $\tau$ 0,75 | 12,70 | [1, Gl. 73] |
| Tabelle 2.3 | 200 mm, $\tau$ 0,75, Bortle 5, 100x, 2'' | 13,35 (Punkt 13,47) | ber. |
| Ausblenden | $C/C_\mathrm{th}$ = 1 / 1,62 / 0,5 | $P$ = 0,5 / 0,90 / 0,15 | ber. aus [1, Abschn. 1.2] |
| Uebergang | $x$ = 0 / 0,783 / 7,83 | $g$ = 1 / 0,825 / 0,045 | ber. (3.2) |
| B-V zu T | 0,65 / 0 / 1,5 | 5778 / 10 125 / 3794 K | [14]; ber. |
| T zu sRGB | 5800 K / 10 000 K | 255/241/235 / 205/217/255 (Charity 255/241/231, 207/218/255) | ber.; [16] |
| Farbgrenze | 80 mm, $\tau$ 0,9, $V \ge D/p$ | 7,8 mag | ber. (5.1) |

---

## 7. Empfehlung fuer astobsim

**Entschieden von Herbert am 2026-10-29:** Feldfaktor $F$ = 2 (typischer Beobachter, Abschnitt 1.3), nicht der geuebte Beobachter der Bortle-Grenzgroessen.

1. **Schwelle (A-P11):** Crumey Gl. 47 (blosses Auge, Fernglas) und Gl. 77 bis 88 (Fernrohr) als reine Funktionen in `src/physik/`; Eingaben $\mu_\mathrm{Himmel}$ (aus `physik.md` 6.1), $V$, $AP$, $\tau$, $D$, Flaeche des Ziels. Fester Beobachter $F$ = 2, $F_T = \sqrt2$ am Fernrohr. Gueltig skotopisch; fuer $B_a < 10^{-5}$ den Nullhintergrund einsetzen; fuer $B > 3{,}4\cdot10^{-2}$ cd/m$^2$ (nur blosses Auge bei hellstem Stadthimmel) mit dem Randwert rechnen und im Hilfetext sagen, dass das Modell dort unsicher ist.
2. **Grenzgroesse (A-P11, Infopanel):** $m_\mathrm{lim}$ aus Gl. 68 bzw. 88 mit Seeing-Scheibe 2,8 FWHM und Extinktion; im Infopanel anzeigen ("Grenzgroesse etwa 12,2 mag"). Hilfetext: typischer Beobachter, geuebte erreichen 0,5 bis 1 mag mehr (Bortle-Werte).
3. **Unaufgeloest (A-P10):** Mischgewicht $g(x) = 1/(1 + 0{,}3466\,x^2)$ mit $x = \theta V/60''$ zwischen linearer Objektabbildung und Punktebenen-Abbildung.
4. **Abbildung (offene Frage 4):** Deep-Sky-Ebene gemeinsam mit dem Himmel komprimieren, Sonnensystem unveraendert getrennt; Schwelle per Isophote, Ausblenden nach Blackwells Kurve, Verstaerkung je Objekt fuer Mindestsichtbarkeit (4.4). Als ADR-0004 festhalten.
5. **Sternfarbe (A-P12):** B-V ueber Ballesteros zu $T$, $T$ ueber Planck und CIE 1931 zu linearem sRGB mit $Y$ = 1 (Tabelle 5.3 als Stuetzstellen oder Rechnung zur Laufzeit; eine kleine Tabelle in 0,1-Schritten von B-V reicht). Farbe nur, wenn die Beleuchtungsstaerke am Auge $\ge 3{,}1\cdot10^{-7}$ lx (entspricht 2,3 mag mit blossem Auge), sonst grau; gleitend gehoert zu A-P8.
6. **Farbkorrektur der Schwelle:** $m_\mathrm{lim}(c) = m_\mathrm{lim} + 0{,}27\,(0{,}7 - c)$ [1, Gl. 18, Bezug B-V 0,7 nach Cinzano]; klein (hoechstens 0,3 mag), als Kann-Punkt.

---

## 8. Testfall-Vorschlaege (A-Q5)

| Vorschlag | Konfiguration | Erwartung | Quelle |
|---|---|---|---|
| W1 Grenzgroesse blosses Auge | Blosses Auge, Zenit (90 Grad), klar, Bortle 3 und Bortle 7; Infopanel und ein Sternfeld (z. B. M45) | Infopanel etwa 6,0 bzw. 5,0 mag; Bortle nennt 6,6 bis 7,0 bzw. 4,6 bis 5,0. Bei Bortle 7 Uebereinstimmung, bei Bortle 3 bewusst etwa 0,6 bis 1 mag unter Bortle (typischer statt geuebter Beobachter) | Bortle 2001 [7]; Crumey [1, Abschn. 3.1] |
| W2 M31 mit blossem Auge | Blosses Auge, M31, Bortle 3, 5 und 8 | Bortle 3 und 5: sichtbar als laenglicher Nebel, bei 3 groesser; Bortle 8: Kern hoechstens angedeutet bzw. unsichtbar. Crumey: mit $F$ = 2 gerade sichtbar bei etwa 19,2 mag/arcsec$^2$ (zwischen Bortle 5 und 6) | Bortle [7]: Klasse 6 "M31 only modestly apparent", Klasse 7 "may be glimpsed ... very indistinct", Klasse 8 "barely glimpsed by an experienced observer"; Crumey [1, Abschn. 3.1, Abb. 12] |
| W3 Grenzgroesse am Fernrohr | 200 mm Newton, Bortle 5, Seeing 2'', 100x; dasselbe Feld bei 50x und 200x | Grenzgroesse steigt mit der Vergroesserung (50x etwa 12,8, 100x 13,4, 200x 13,9 mag). Vergleich Bortle: 32 cm bei Bortle 5 "about 14,5 to 15", auf 200 mm umgerechnet ($-5\log(320/200)$ = $-1{,}0$) etwa 13,5 bis 14 | Bortle [7]; Crumey [1, Abschn. 3.2, Bowen-Daten Abb. 14] |
| W4 (optional) Sternfarbe | Antares und Albireo mit blossem Auge; Albireo im 80 mm bei 30x | Antares (etwa 1 mag, B-V 1,8) mit blossem Auge orange, Albireo (3 mag) grau; im 80 mm Albireo A gelb-orange, B blaeulich | Farbgrenze 2,3 mag [13]; Albireo-Farben als Standardbeschreibung der Beobachtungsliteratur (Quelle in der Doppelstern-Recherche festlegen) |

Jupiter mit blossem Auge (Punkt) und im 10x50 (Scheibchen) ist schon T6; der Uebergang (3.2) erfuellt ihn. Der Mond bei 1 mm Austrittspupille gehoert zu A-P13 (i) und offener Frage 1, nicht zur Schwelle.

---

## 9. Unsicher oder zu pruefen

1. **Feldfaktor und Bortle:** $F$ = 2 ist Crumeys "notional" Wert; die Bortle-Grenzen verlangen $F \approx 0{,}5$. Entschieden von Herbert am 2026-10-29: astobsim zeigt den typischen Beobachter, $F$ = 2 (Abschnitt 7 Punkt 1). Mit $F$ = 1 lagen alle Grenzen 0,75 mag tiefer; die Form der Kurven bleibt.
2. **Uebergangsfunktion A-P10:** $g(x) = 1/(1 + 0{,}3466\,x^2)$ ist eine eigene Herleitung aus Varianzen (Augen-PSF gegen Scheibe), keine Messung; belegt ist nur die Groessenordnung des Kriteriums (1' bei Licht). Die belegte Potenznorm nach Crumey ist fuer die Schwelle gemacht und fuer die Form zu flach. Am Bild in Phase 6 pruefen (T6).
3. **Farbschwelle 2,3 mag:** stammt aus einer Fussnote ("aus Beobachtungserfahrung") [13]; eine Messung fuer Punktquellen habe ich nicht gefunden. Die Uebertragung aufs Fernrohr ueber die Beleuchtungsstaerke setzt voraus, dass die Farbwahrnehmung am dunklen Okularhimmel genauso von der Beleuchtungsstaerke abhaengt wie mit blossem Auge.
4. **$C_\infty$ (grosse Ziele):** aus Taylor 1960 (obere Schranken, andere Methode), weniger belastbar als die Punktdaten [1, Abschn. 2.3]; trifft M31, M42 im Fernglas.
5. **Ungleichmaessige Ziele:** Blackwell mass gleichmaessige Scheiben; Crumeys Isophoten-Verfahren fuer Galaxien ist eine Naeherung [1, Abschn. 3.1]. Seitenverhaeltnis bis 7 ist nach Lamar 1948 unerheblich [1, Abschn. 1.6.3]; M31 (etwa 3:1) passt.
6. **Mesopischer Himmel:** Bortle 7 bis 9 mit blossem Auge liegen ausserhalb von Crumeys astronomischem Anwendungsbereich (18,9 mag/arcsec$^2$); die Werte dort sind unsicher, Bortle 8 und 9 zusaetzlich geschaetzt (`physik.md` 10 Punkt 6).
7. **Seeing-Scheibe als gleichmaessige Flaeche 2,8 FWHM:** Crumeys Naeherung; mit Bowens 60-Zoll-Wert gut vereinbar [1, Abschn. 3.3], sonst nicht geprueft.
8. **Mindestsichtbarkeit $\Delta_\mathrm{min}$:** 3 sRGB-Kodes ist ein Vorschlag ohne Quelle; Bildschirm, Umgebungslicht und Helligkeitseinstellung sind unbekannt.
9. **Schaefer Gl. 18:** Einheit nL und Faktoren nach [5]; $k_v$ = 0,2 meine Wahl. Schaefers vollstaendiges Fernrohrmodell habe ich nicht nachgerechnet.
10. **Clark 1990, Blackwell 1946, Knoll 1946, Hecht 1947, CIE 191:2010:** nicht im Original eingesehen, Inhalte nach Crumey [1] bzw. Clarks Webartikel [12]. Ricco 1877, Piper und Barlow (raeumliche Summation) ebenfalls nur ueber [1]; fuer die Formeln nicht noetig, weil Crumeys Modell Ricco enthaelt.
11. **CIE-Funktionen:** Wyman et al. ist eine Naeherung der CIE-1931-Tabellen; Charity nutzt die Judd-Vos-Korrektur. Unterschied bis 5 Kodes im Blau; fuer A-P12 ohne Belang, fuer exakte Tests die Tabelle 5.3 als Bezug nehmen.
12. **Bortle-Wortlaut:** zitiert nach einer Wiedergabe des S&T-Artikels (Frosty Drew [7]), die S&T-Seite war nicht abrufbar (403).

---

## 10. Quellen

1. Crumey, A.: "Human Contrast Threshold and Astronomical Visibility", MNRAS 442, 2600 (2014), https://arxiv.org/abs/1405.4209 (Volltext arXiv v1 eingesehen: Gl. 1, 18, 21 bis 23, 41 bis 89, Abschn. 1.2 Blackwell-Methodik und Faktoren 1,62 und 2,4, Abschn. 1.3 Einheiten und CIE 2010, Abschn. 1.6 Feldfaktoren, Abschn. 3 Anwendungen, Tabelle 1).
2. Blackwell, H. R.: "Contrast Thresholds of the Human Eye", J. Opt. Soc. Am. 36, 624 (1946), https://doi.org/10.1364/JOSA.36.000624 (nicht eingesehen; Inhalt nach [1] und [12]).
3. Knoll, H. A., Tousey, R., Hulburt, E. O.: "Visual Thresholds of Steady Point Sources of Light in Fields of Brightness from Dark to Daylight", J. Opt. Soc. Am. 36, 480 (1946), https://doi.org/10.1364/JOSA.36.000480 (nicht eingesehen; nach [1]).
4. Hecht, S.: "Visual Thresholds of Steady Point Sources of Light in Fields of Brightness from Dark to Daylight", J. Opt. Soc. Am. 37, 59 (1947), https://doi.org/10.1364/JOSA.37.000059 (nicht eingesehen; Formel nach [1, Gl. 20]).
5. Schaefer, B. E.: "Telescopic Limiting Magnitudes", PASP 102, 212 (1990), https://articles.adsabs.harvard.edu/pdf/1990PASP..102..212S ; https://doi.org/10.1086/132629 (eingesehen: Abstract, S. 214 Gl. 7, S. 216 Gl. 17 und 18).
6. Clark, R. N.: *Visual Astronomy of the Deep Sky*, Cambridge University Press und Sky Publishing 1990, https://clarkvision.com/visastro/omva1/ (nicht eingesehen; nach [1] und `physik.md` [29]).
7. Bortle, J. E.: "Gauging Light Pollution: The Bortle Dark-Sky Scale", Sky & Telescope, Februar 2001, S. 126, https://skyandtelescope.org/astronomy-resources/light-pollution-and-astronomy-the-bortle-dark-sky-scale/ ; Wortlaut nach der Wiedergabe https://frostydrew.org/papers.dc/papers/paper-bortle ; Tabelle https://en.wikipedia.org/wiki/Bortle_scale
8. Crumey, A.: "Astronomical Visibility" (Begleitseite zu [1]), https://crumey.co.uk/astronomy/astro.html (wie `physik.md` [46]).
9. IEC 61966-2-1:1999, sRGB (Matrix XYZ zu linearem sRGB, Weisspunkt D65, Kennlinie; wie `physik.md` [59]).
10. Ward, G.: "A Contrast-Based Scalefactor for Luminance Display", in *Graphics Gems IV*, Academic Press 1994 (nicht eingesehen; wie `physik.md` [57]).
11. Ward Larson, G., Rushmeier, H., Piatko, C.: "A Visibility Matching Tone Reproduction Operator for High Dynamic Range Scenes", IEEE TVCG 3(4), 291 (1997), https://graphics.cs.yale.edu/sites/default/files/1997tvcg_hdr_tonemapping.pdf (wie `physik.md` [56]).
12. Clark, R. N.: "Color Vision at Night", https://www.clarkvision.com/articles/color-vision-at-night/ (Abschnitt "Photometry and Threshold Color Perception": Zapfen ab etwa 19 bis 20 mag/arcsec$^2$, nach Blackwell [2]).
13. Protte, P., Hoffmann, S. M.: "Accuracy of magnitudes in pre-telescopic star catalogues", Astronomische Nachrichten 341 (2020), https://doi.org/10.1002/asna.202013803 ; https://arxiv.org/abs/2008.04967 (Fussnote 3: Farbsehen ab etwa 2,3 mag aus Beobachtungserfahrung).
14. Ballesteros, F. J.: "New insights into black bodies", EPL 97, 34008 (2012), https://doi.org/10.1209/0295-5075/97/34008 ; https://arxiv.org/abs/1201.1809 (Gl. 14, Volltext eingesehen).
15. Wyman, C., Sloan, P.-P., Shirley, P.: "Simple Analytic Approximations to the CIE XYZ Color Matching Functions", Journal of Computer Graphics Techniques 2(2), 1 (2013), https://jcgt.org/published/0002/02/01/ (Mehrfach-Gauss-Naeherung der CIE-1931-2-Grad-Funktionen; Koeffizienten aus dem Gedaechtnis verwendet, gegen [16] geprueft).
16. Charity, M.: "What color is a blackbody? Some pixel rgb values", Datei `bbr_color.txt`, Version 2001-06-22, http://www.vendian.org/mncharity/dir3/blackbody/ ; Tabelle http://www.vendian.org/mncharity/dir3/blackbody/UnstableURLs/bbr_color.html (CIE 1931 2 Grad mit Judd-Vos, sRGB).
