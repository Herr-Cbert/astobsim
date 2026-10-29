---
status: accepted
datum: 2026-10-29
---

# Helligkeit und Wahrnehmungsschwelle: drei Ebenen mit eigener Abbildung, Schwelle nach Crumey vor der Abbildung

Entwurf aus Phase 2 Version 2 (`docs/recherche/helligkeit-v2.md`, `docs/recherche/wahrnehmung.md` Abschnitt 4.4), in Phase 3 Version 2 am Prototyp geprueft und mit Herberts Entscheidungen vom 2026-10-29 angenommen. Ergaenzt ADR-0002 (Simulationsmodell) und `docs/recherche/physik.md` Abschnitte 12 und 14, ersetzt sie nicht. Die Naht dazu steht in `docs/architektur.md` Abschnitt 5.

Version 1 bildet Objekt und Himmel getrennt mit einer Stevens-Potenz ab (`physik.md` 12.3), Punktquellen je Pixel (14.2). Fuer Version 2 kommen drei Dinge dazu: Deep-Sky-Flaechen nahe der Himmelshelligkeit (A-Z10), eine Wahrnehmungsschwelle fuer alle Objekte (A-P11) und unaufgeloeste Zustaende als Punktquelle (A-P10). Die getrennte Abbildung traegt fuer Deep-Sky nicht: der angezeigte Kontrast haengt an der willkuerlichen Wahl von Quellweiss, der Aussenbereich von M31 erschiene bis Faktor 15 zu schwach (`wahrnehmung.md` 4.2). Eine gemeinsame Abbildung fuer alle Objekte wuerde den Binnenkontrast von Mond und Planeten je Pixel komprimieren, den die Faltung richtig wiedergeben soll (`physik.md` 12.3, verworfen).

## Festlegungen

- **Drei Ebenen.** (a) Sonnensystem-Flaechen wie bisher: Pixel $= q \cdot w(\mu_\mathrm{obj}) + w(\mu_\mathrm{Himmel})$, Binnenkontrast linear. (b) Deep-Sky-Flaechen gemeinsam mit dem Himmel: Zuwachs $\min\big(1, (a\,q + s)^{n}\big) - s^n$ mit $a$ und $s$ als Leuchtdichte von Quellweiss und Himmel im Okular relativ zum Anzeigeweiss. (c) Punktquellen (Trabanten, Sterne, unaufgeloeste Planeten) je Pixel wie `physik.md` 14.2.
- **Konstanten:** `KOMPRESSIONSEXPONENT` $n$ = 1/3 fuer alle Ebenen. Anzeigeweiss 9,2 mag/arcsec$^2$ fuer die Flaechenebenen und den Himmel (A-P13 i), Punktweiss 6,4 mag/arcsec$^2$ fuer die Punktebene (A-P13 ii). Nach der Umsetzung von A-P10 am Bild nachmessen (`helligkeit-v2.md`).
- **Schwelle vor der Abbildung, in physik.** Kontrastschwelle nach Crumey 2014 (Gl. 47 Auge und Fernglas, Gl. 77 bis 88 Fernrohr), **Feldfaktor $F$ = 1,4** (geaendert am 2026-10-29 nach dem Prototyp, vorher 2; siehe unten), $F_T = \sqrt2$ am Fernrohr. Deep-Sky: die schwaechste sichtbare Isophote nach Crumeys Verfahren (Isophote mit eingeschlossener Flaeche gegen die Schwelle dieser Flaeche). Die Flaechen liefert eine **Flaechentabelle** je Zustand (Isophote in mag/arcsec$^2$ gegen eingeschlossene Flaeche), die `tools/` am aufbereiteten Quellbild misst; physik bleibt pixelfrei und die Schwelle haengt nicht vom Fenster ab. Sterne: Grenzgroesse aus Gl. 68 bzw. 88 mit Seeing-Scheibchen. Sonnensystem: liegt in Version 2 stets ueber der Schwelle, die Schwelle wirkt dort nur auf Trabanten.
- **Gleitend.** Deckkraft nach Blackwells Wahrscheinlichkeitskurve $P = \Phi\big((C/C_\mathrm{th} - 1)/0{,}484\big)$. Deep-Sky: $C_\mathrm{th}$ der sichtbaren Isophote gilt fuer das ganze Objekt, angewandt je Pixel; weil $C$ linear in $q$ ist, gilt $C/C_\mathrm{th} = q/q^*$ mit $q^*$ dem Pixelwert an der sichtbaren Isophote. Ist keine Isophote sichtbar, gilt die guenstigste (P < 0,5 ueberall, das Objekt verblasst gleitend). Sterne: $C/C_\mathrm{th} = 10^{-0{,}4(m - m_\mathrm{lim})}$. Kein Sprung beim Aendern der Vergroesserung.
- **Mindestsichtbarkeit als additiver Sockel** (geaendert nach dem Prototyp, vorher Faktor G): Deep-Sky-Pixel $= h + P\,\big(\min(1,(a q + s)^n) - h + \sigma\big)$ mit $h = s^n$ und dem Sockel $\sigma \ge 0$ je Objekt und Konfiguration so, dass ein Pixel an der Schwelle ($P$ = 0,5) mindestens $\Delta_\mathrm{min}$ = **3 sRGB-Kodes** ueber dem Himmel liegt. Der Sockel hebt die schwachen Teile, der Kern bleibt nahezu unveraendert; monoton in $q$.
- **Unaufgeloest (A-P10).** Mischung zwischen Flaechen- und Punktebene mit $g = 1/(1 + 0{,}3466\,x^2)$, $x = \theta V / 60''$; stetig abgeschnitten $g' = \max(0, (g - 0{,}005)/0{,}995)$, damit T1 bis T4 den Ausdruck aus Version 1 rechnen. Der Fluss bleibt erhalten.
- **Sternfarbe (A-P12).** B-V ueber Ballesteros 2012 zu $T$, $T$ ueber Planck und CIE 1931 zu linearem sRGB (D65, $Y$ = 1); Farbe nur ab $Z\cdot10^{-0{,}92} = 3{,}05\cdot10^{-7}$ lx am Auge (aus 2,3 mag; frueher gerundet 3,1e-7; Nachtrag 2026-10-29, Issue #98), darunter grau. Deep-Sky-Flaechen grau.

## Prototyp (Phase 3 Version 2)

Python-Prototyp auf dem Branch `prototyp-deep-sky` (`prototyp/deep_sky.py`): Modellbilder aus den Profilen in `deep-sky.md` (M31 Sersic plus Scheibe, M57 elliptischer Ring mit Loch 1,5 mag unter dem Ring), Gauss-Kern, Crumey-Schwelle ueber die Flaechentabelle des gefalteten Modellbilds, gemeinsame Abbildung, Deckkraft und Mindestsichtbarkeit; Faelle M31 mit blossem Auge bei Bortle 1 bis 7 und im 10x50, M57 am 80 mm (80x) und 150 mm (120x) bei Bortle 5.

Befunde:
1. **Die Pipeline traegt.** Isophote, Deckkraft und Abbildung ergeben ein stetiges, plausibles Bild; M57 als Ring, M31 laenglich mit gleitendem Rand.
2. **Feldfaktor.** Mit $F$ = 2 und dem M31-Profil aus `deep-sky.md` 1.2 bleibt M31 mit blossem Auge schon bei Bortle 3 unter der Schwelle (bestes $C/C_\mathrm{th}$ 0,99) und wird erst bei einem Himmel dunkler als 21,5 mag/arcsec$^2$ sichtbar; Crumey nennt fuer $F$ = 2 "gerade sichtbar bei 19,2". Entweder ist das Profil innen zu schwach (Scheibe an RC3 angepasst, nicht gemessen) oder $F$ fuer Flaechen zu streng. **Entscheidung Herbert:** $F$ = 1,4 fuer alle (erfahrenerer Beobachter). Damit M31 bei Bortle 3 sichtbar mit 106' Ausdehnung, bei Bortle 5 knapp darunter (0,78), bei Bortle 7 unsichtbar (0,42); die Grenzgroesse steigt um 0,39 mag (mit blossem Auge etwa 6,4 bei Bortle 3, 5,4 bei Bortle 7), die Plejaden zeigen bei Bortle 3 dreizehn Sterne bis 6,4 mag (`deep-sky.md` 4.2). Die Erwartungswerte von T11 und die Tabellen in `wahrnehmung.md` (mit $F$ = 2) werden in Phase 4 nachgerechnet.
3. **Mindestsichtbarkeit.** Ein Faktor G auf den ganzen Zuwachs hebt helle Kerne mit (M31 im 10x50: G = 5,5 bei 3 Kodes, 11 bei 6); der additive Sockel hebt nur die schwachen Teile (Kern 86 -> 88 bei 3 Kodes). Herbert: Sockel, $\Delta_\mathrm{min}$ = 3.
4. **Binnendetails.** Die Schwelle ueber die Isophote entscheidet "Objekt gegen Himmel", nicht die Sichtbarkeit dunkler Details im Objekt. Ob das Loch von M57 sichtbar ist (T10), haengt allein am Kontrast im Quellbild und an der Faltung.

## Folgen

- T1 bis T6 bleiben im Modell gueltig (Ebene a unveraendert bis auf das Anzeigeweiss); die Validierungsbilder werden heller und neu erzeugt, in T4a (300 mm, AP 1,5 mm) wird ein Fuenftel der Jupiterscheibe auf Weiss begrenzt. T6 und Mars 6'' bei kleiner Vergroesserung aendern sich gewollt (A-P10).
- Der Himmel wird mit dem neuen Anzeigeweiss heller (im Prototyp sRGB 26 bis 28 am Fernrohr bei Bortle 5, 42 mit blossem Auge bei Bortle 3, 70 bei Bortle 7); am Bild pruefen.
- Neue reine Funktionen in `src/physik/` (`docs/architektur.md` 5.4); Testwerte aus `wahrnehmung.md` 6, Werte mit $F$ = 2 dort auf 1,4 umrechnen.
- Daten: Flaechentabelle je Deep-Sky-Zustand (ADR-0003 Nachtrag V2).

## Verworfen

- Getrennte Abbildung auch fuer Deep-Sky (Kontrast haengt an Quellweiss).
- Gemeinsame Abbildung fuer alle Objekte (Binnenkontrast je Pixel komprimiert, T1 bis T5 neu).
- Gemeinsame Abbildung ohne eigenen Schwellenschritt (Objekte knapp ueber der Schwelle auf dem Schirm unsichtbar).
- Harter Schnitt an der Schwelle (Spruenge beim Aendern der Vergroesserung).
- Schwelle je Pixel mit fester Detailgroesse (um Groessenordnungen zu streng fuer grosse schwache Flaechen).
- Deckkraft je Objekt statt je Pixel (M31 erschiene ganz oder gar nicht, T11 verlangt den raeumlichen Schnitt).
- Stuetzkurve der Deckkraft je Isophote (Variante B der Naht): genauer je Bereich, aber mehr Naht; der eine Wert $q^*$ ist im Prototyp erprobt.
- Flaechen aus einem Histogramm in daten oder bild (Physik in bild, bei Kacheln alle Kacheln noetig, haengt am Ausschnitt).
- Verstaerkungsfaktor G fuer die Mindestsichtbarkeit (hebt helle Kerne mit, Prototyp Befund 3).
- Adaptionsabhaengiges Tone-Mapping (Adaption ist nach A-P9 keine Eingabe).
- Ein gemeinsames Weiss fuer Flaechen und Punkte (A-P13 i und ii nicht zugleich erreichbar, `helligkeit-v2.md` 3).
