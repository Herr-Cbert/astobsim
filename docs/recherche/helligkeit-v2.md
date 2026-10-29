# Recherche: Anzeigehelligkeit fuer Version 2 (A-P13)

**Datum:** 2026-10-29. **Kennungen:** A-P13, A-P4, A-P10, T1 bis T6. **Frage:** `docs/anforderungen.md` Abschnitt 10, Frage 1 (und der Helligkeitsteil von Frage 4). Ergaenzt `physik.md` Abschnitte 12 und 14; deren Modell bleibt (A-P4 V2), nur die Konstanten werden nachgestellt. Die Zahlenwerte legt Herbert fest (A-P13).

## 1. Messung

**Aufbau:** `npm run build`, `node scripts/validierung-bilder.mjs` (Chrome headless, SwiftShader, devicePixelRatio 2, Bortle 5, klar, Zenit, Seeing wie im Fall), dazu eine Kopie des Skripts mit Zusatzfaellen (Mond am 80/800 mit Okular 5 bis 60 mm, also AP 0,5 bis 6 mm; Mond im 10x50; Mars 25'', Mars 14'', Saturn 20'', Jupiter 35'' mit blossem Auge). Ausgewertet wird die Uebersicht (Gesichtsfeld-Canvas). Himmel = Median der dunkelsten 30 % im Gesichtsfeld, Scheibe = alle Pixel mehr als 15 Kodewerte ueber dem Himmel, Mittel der drei Kanaele. "P99" ist das 99. Perzentil der Scheibe ("hellstes Perzentil" aus A-P13). Stand: `main` 6167652, Konstanten `ANZEIGE_WEISS_MAG_PRO_ARCSEC2` = 3,35, `KOMPRESSIONSEXPONENT` = 1/3.

Die neu erzeugten Validierungsbilder weichen von den eingecheckten um hoechstens 3 Kodewerte ab (SwiftShader-Rundung), sie wurden nicht uebernommen.

| Fall | AP [mm] | $\mu_\mathrm{obj}$ (ber.) | Himmel | Scheibe Mittel | Scheibe P99 | Max |
|---|---|---|---|---|---|---|
| T1 Jupiter 47'', 70/700, 100x | 0,70 | 9,81 | 5 | 59 | 96 | 97 |
| T2a Saturn 20'', 100/1200, 150x | 0,67 | 10,93 | 4 | 48 | 66 | 66 |
| T2b Saturn 20'', 60/600, 100x | 0,60 | 11,16 | 4 | 45 | 62 | 63 |
| T3 Mond, 80/800, 100x | 0,80 | 8,60 | 6 | 63 | 105 | 123 |
| T4a Jupiter, 300/3000, 200x, Seeing 3'' | 1,50 | 8,15 | 8 | 74 | 122 | 123 |
| T4b Jupiter, 100/1000, 200x, Seeing 3'' | 0,50 | 10,54 | 4 | 57 | 86 | 87 |
| T4c Jupiter, 300/3000, 200x, Seeing 1'' | 1,50 | 8,15 | 8 | 89 | 124 | 125 |
| T4d Jupiter, 100/1000, 200x, Seeing 1'' | 0,50 | 10,54 | 4 | 62 | 87 | 88 |
| T5a Mars 14'', 150/1200, 200x | 0,75 | 7,58 | 5 | 64 | 99 | 102 |
| T5b Mars 6'', 80/960, 120x | 0,67 | 8,39 | 4 | 44 | 72 | 73 |
| T6a Mond, blosses Auge | 6 | 4,11 | 18 | 114 | 182 | 198 |
| T6b Jupiter 47'', blosses Auge | 6 | 5,03 | 18 | 55 | 81 | 81 |
| T6c Jupiter 47'', 10x50 | 5 | 5,60 | 16 | 50 | 109 | 109 |
| Mond 80/800, AP 0,5 | 0,5 | 9,62 | 4 | 44 | 79 | 104 |
| Mond 80/800, AP 1 | 1 | 8,12 | 6 | 69 | 113 | 132 |
| Mond 80/800, AP 2 | 2 | 6,61 | 9 | 86 | 140 | 162 |
| Mond 80/800, AP 4 | 4 | 5,10 | 14 | 105 | 170 | 195 |
| Mond 80/800, AP 6 | 6 | 4,22 | 16 | 113 | 181 | 207 |
| Mond 10x50 | 5 | 4,68 | 16 | 110 | 177 | 195 |
| Mars 25'', blosses Auge | 6 | 1,88 | 18 | 37 | 40 | 40 |
| Mars 14'', blosses Auge | 6 | 2,95 | 18 | keine Scheibe 15 ueber dem Himmel | | |
| Saturn 20'', blosses Auge | 6 | 6,05 | 18 | 36 | 39 | 39 |
| Jupiter 35'', blosses Auge | 6 | 5,03 | 18 | 48 | 64 | 64 |

$\mu_\mathrm{obj}$ ist die Flaechenhelligkeit von Quellweiss im Okular nach `physik.md` 9 (Quellweiss aus `daten/objekte.json`, $\tau$ 0,90 Refraktor / 0,85 Fernglas / 1 Auge, $k$ = 0,20, $X$ = 1). Die Werte von T3 bis T6 passen zu `physik.md` 12.4 und 14.5 (Unterschiede durch Zenit statt 45 Grad und Quellweiss nach #71 und #78).

**Gegen die Zielkriterien:**

- **(i) Mond:** P99 erreicht bei AP 1 mm nur sRGB 113 (linear 0,16), selbst mit blossem Auge nur 182 (0,47). Bildschirmweiss erreicht das hellste Pixel in keinem Fall. Kriterium (i) ist heute deutlich verfehlt, Faktor 6,2 linear bei AP 1 mm.
- **(ii) Planeten mit blossem Auge:** Jupiter 47'' im Kern 81, Jupiter 35'' 64, Saturn 39, Mars 25'' 40, Mars 14'' nicht ueber dem Himmel. Die Scheibe wird auf das Arbeitsraster von 25'' je Pixel verschmiert und als Flaeche abgebildet; die Abstufung nach Magnitude fehlt (Mars 25'' mit -3,0 mag ist dunkler als Jupiter mit -2,7). Das ist kein Konstantenproblem, sondern A-P10: unaufgeloest muss der Planet als Punktquelle mit Gesamtfluss erscheinen (Abschnitt 3).
- **(iii) Monotonie:** gilt, P99 steigt am Mond streng mit der AP (79, 105, 113, 140, 170, 181). Das Verhaeltnis AP 6 zu AP 1 ist 2,9 linear, erwartet $6^{2/3}$ = 3,3 (ber.); der Rest ist Beugung und Seeing bei kleiner AP.

## 2. Konstanten fuer Kriterium (i)

Die Abbildung ist $\mathrm{Pixel} = q \cdot w(\mu_\mathrm{obj})$ mit $w(\mu) = 10^{-0{,}4\,n\,(\mu - \mu_\mathrm{weiss})}$ (`physik.md` 12.3), begrenzt je Pixel auf 1. Aus der Messung folgt $q_{99}$ je Fall ($q_{99} = P99_\mathrm{linear} / w_\mathrm{alt}$, ber.: Mond 0,70, Jupiter 0,83). Fuer neue Konstanten $(n', \mu'_\mathrm{weiss})$ wird jedes gemessene Pixel mit $w'/w$ skaliert (ber., Skript `konst.py` im Scratchpad der Session, nicht im Repo). $\mu'_\mathrm{weiss}$ ist so gewaehlt, dass P99 des Mondes bei AP 1 mm genau 1 wird.

| Fall | heute: Mittel / P99 | A: $n$ = 1/3, $\mu_\mathrm{weiss}$ = 9,23 | B: $n$ = 0,25, $\mu_\mathrm{weiss}$ = 9,60 | C: $n$ = 0,20, $\mu_\mathrm{weiss}$ = 9,98 |
|---|---|---|---|---|
| Mond AP 0,5 | 45 / 79 | 111 / 183, 0 % | 117 / 193, 0 % | 121 / 199, 0 % |
| T3 Mond AP 0,8 | 65 / 104 | 154 / 236, 0,2 % | 156 / 240, 0,3 % | 158 / 243, 0,4 % |
| Mond AP 1 | 72 / 113 | 169 / 255, 1,1 % | 169 / 255, 1,1 % | 169 / 255, 1,0 % |
| Mond AP 2 | 90 / 139 | 206 / 255, 20 % | 196 / 255, 12 % | 190 / 255, 8 % |
| Mond AP 6 | 118 / 180 | 255 / 255, 49 % | 233 / 255, 35 % | 215 / 255, 26 % |
| T6a Mond blosses Auge | 120 / 181 | 255 / 255, 51 % | 236 / 255, 38 % | 218 / 255, 29 % |
| T1 Jupiter 70 mm | 64 / 95 | 152 / 218, 0 % | 162 / 231, 0 % | 167 / 239, 0 % |
| T2b Saturn 60 mm | 46 / 62 | 113 / 146, 0 % | 126 / 163, 0 % | 134 / 173, 0 % |
| T4a Jupiter 300 mm, AP 1,5 | 82 / 121 | 190 / 255, 19 % | 190 / 255, 19 % | 190 / 255, 20 % |
| T4b Jupiter 100 mm, AP 0,5 | 60 / 85 | 144 / 196, 0 % | 157 / 213, 0 % | 165 / 224, 0 % |
| T5a Mars 14'' | 67 / 98 | 159 / 224, 0 % | 156 / 220, 0 % | 154 / 217, 0 % |
| T5b Mars 6'' | 46 / 71 | 114 / 167, 0 % | 115 / 169, 0 % | 115 / 170, 0 % |

Prozent = Anteil der Scheibenpixel, die auf 1 begrenzt werden.

**Beobachtungen:**

1. Kriterium (i) verlangt eine Aufhellung um den Faktor 6,2 linear bei AP 1 mm. Mit $n$ = 1/3 heisst das $\mu_\mathrm{weiss}$ = 9,23 statt 3,35, rund 6 mag. Der Wert hat dann keine physikalische Deutung mehr ("Vollmond ohne Verluste"), sondern ist "die Flaechenhelligkeit, die am Fernrohr als Bildschirmweiss gezeigt wird", etwa die des hellen Mondhochlands bei 1 mm AP.
2. **Zielkonflikt bei grosser AP:** Ein Mond, dessen hellstes Prozent bei 1 mm weiss ist, wird bei 6 mm zur Haelfte weiss abgeschnitten (A), mit kleinerem Exponenten zu einem Viertel (C). Kleinere $n$ machen den Verlauf in der AP flacher (A-P4 bleibt erfuellt, aber schwaecher: Mittel von AP 1 zu 6 steigt bei C nur noch von 169 auf 215).
3. **Jupiter bei grosser AP:** T4a (300 mm, AP 1,5 mm) verliert 19 % der Scheibe an die Begrenzung, unabhaengig vom Exponenten, weil Jupiter dort so hell ist wie der Mond bei 1,2 mm. Die Baender bleiben erkennbar (NEB, SEB liegen unter der Grenze), die hellen Zonen verlieren aber ihre Struktur. Die Tabellen-Tests T1 bis T5 rechnen auf dem linearen Anblick vor der Begrenzung und bleiben unberuehrt; das Bild in `docs/validierung/` aendert sich.
4. **Weiche Schulter** statt hartem Abschneiden (linear bis 0,7, darueber exponentiell gegen 1) aendert wenig: sie verschiebt $\mu_\mathrm{weiss}$ auf 9,95 und laesst dieselben Anteile ueber 0,95 (ber.). Sie ist keine Loesung des Zielkonflikts, nur eine Glaettung.

## 3. Kriterium (ii): unaufgeloeste Planeten als Punktquelle

Mit A-P10 erscheint ein unaufgeloester Planet als Punktquelle in der Punktebene (`physik.md` 14.2): Pixel = $\min(1, (a\,p)^n)$. Im Scheitel einer Gauss-PSF des Auges (FWHM 60'') ist $a\,p = 10^{-0{,}4\,(m + kX - \mu_\mathrm{weiss})} / (1{,}133 \cdot 60^2)$ (ber., Fluss in Quellweiss-Einheiten, Arbeitspixel vernachlaessigt). Damit (ber., $k X$ = 0,20, sRGB-Kodewert):

| $\mu_\mathrm{weiss}$ | Jupiter 47'' (-2,7) | Jupiter 35'' (-2,0) | Mars 25'' (-3,0) | Mars 14'' (-1,4) | Mars 6'' (1,0) | Saturn 20'' (-0,1) |
|---|---|---|---|---|---|---|
| 3,35 (heute) | 165 | 150 | 172 | 138 | 98 | 113 |
| 6,36 | 249 | 227 | 255 | 209 | 150 | 175 |
| 9,23 (Variante A) | 255 | 255 | 255 | 255 | 223 | 255 |

- Mit dem Anzeigeweiss aus Abschnitt 2 (9,23) sind alle hellen Planeten weiss, die Abstufung nach Magnitude (ii) geht verloren.
- Kriterium (ii) wird bei etwa 6,4 erfuellt: Jupiter 47'' fast weiss, Mars 14'' und Saturn deutlich abgestuft.
- Folge: (i) und (ii) sind mit **einem** gemeinsamen $\mu_\mathrm{weiss}$ fuer Flaechen und Punkte nicht gleichzeitig erreichbar (Unterschied etwa 2,9 mag). Entweder bekommt die Punktebene ein eigenes Weiss (bzw. einen eigenen Exponenten, Stevens nennt fuer Punktquellen 0,5 [`physik.md` 53]), oder Herbert gewichtet eines der beiden Kriterien niedriger. Der Peak haengt zudem davon ab, wie A-P10 den Uebergang malt (Arbeitspixel, PSF des Auges); die Zahlen sind eine Abschaetzung, keine Messung.

## 4. Empfehlung fuer astobsim

**Entschieden von Herbert am 2026-10-29:** Empfehlung angenommen. `KOMPRESSIONSEXPONENT` bleibt 1/3; Anzeigeweiss fuer Objekt und Himmel etwa 9,2 mag/arcsec$^2$ (Variante A); die Punktebene bekommt ein eigenes Weiss bei etwa 6,4 mag/arcsec$^2$. Die genauen Werte werden nach der Umsetzung von A-P10 nachgemessen; ob der Himmel getrennt abgebildet bleibt, entscheidet ADR-0004 (Punkt 3).

1. **Variante A** ($n$ = 1/3 bleibt, $\mu_\mathrm{weiss}$ neu etwa 9,2 fuer die Objektebene): am wenigsten Eingriff, das Modell und alle Verhaeltnisse aus `physik.md` 12 bleiben; Kriterium (i) wird genau erfuellt. Der Preis, der abgeschnittene Mond bei grosser AP und mit blossem Auge, entspricht dem Eindruck am Okular (blendend, A-P9 schliesst Blendung aus, das Weiss ist der naechste erlaubte Ausdruck). Variante C nur, wenn Herbert bei T6a die Hochlandstruktur behalten will.
2. **Punktebene mit eigenem Weiss** (etwa 6,4) fuer Kriterium (ii), festgelegt zusammen mit A-P10 in ADR-0004; die Ebenen bleiben je fuer sich monoton.
3. **Himmel:** dieselbe Verschiebung wie das Objekt, damit die Verhaeltnisse Objekt zu Himmel aus 12.3 erhalten bleiben. Der Himmel wird dann um den Faktor $10^{0{,}4 \cdot 5{,}88/3}$ = 6,1 heller (A-D9 Bortle 5 von linear 0,0021 auf 0,013, sRGB von 7 auf etwa 30; Fernglas 10x50 Bortle 9 von 30 auf etwa 80, ber. aus `physik.md` 12.4). Das ist der Punkt, an dem Frage 4 (`wahrnehmung.md`) und ADR-0004 entscheiden muessen, ob Himmel und Objekt gemeinsam statt getrennt abgebildet werden; ein mittelgrauer Himmel im Fernglas bei Bortle 9 waere vertretbar, ein sichtbar grauer Himmel am Fernrohr bei Bortle 5 eher nicht.
4. Nach der Festlegung: `physik.md` 12.4 und 14.3 bekommen neue Testwerte, die Validierungsbilder werden neu erzeugt und die Messung dieser Datei wiederholt.

## 5. Unsicher oder zu pruefen (fuer Herbert)

1. Zielkriterium (i) in der Lesart "P99 der Scheibe bei AP 1 mm = sRGB 255". Bei "nahe Weiss" (z. B. 240) wird $\mu_\mathrm{weiss}$ etwa 0,3 mag kleiner und die Begrenzung bei AP 6 mm etwas kleiner.
2. Die Messung nutzt SwiftShader und die Uebersicht bei devicePixelRatio 2; Perzentile haengen leicht vom Schwellwert der Scheibe (15 Kodewerte) ab. Fuer die Mondfaelle ist das unkritisch, fuer Mars 14'' mit blossem Auge nicht messbar.
3. Abschnitt 3 ist eine Rechnung, keine Messung; sie haengt von der Umsetzung von A-P10 ab.
4. Ob die Anhebung des Himmels (Empfehlung Punkt 3) mit T1 bis T6 vereinbar ist, entscheidet sich erst mit dem Modell aus `wahrnehmung.md`.
