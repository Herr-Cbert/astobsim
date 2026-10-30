# Validierung (Phase 6)

Ergebnis von Issue #21: die sechs Beobachtungs-Testfaelle T1 bis T6 (`docs/anforderungen.md` Abschnitt 8, A-Q2) am Bild der Anwendung geprueft, die Kontrastschwelle "erkennbar" daraus abgeleitet und als Tabellen-Test eingefroren (`src/physik/validierung.test.ts`).

**Stand:** Urteile von Claude am 2026-10-27, von Herbert am 2026-10-27 freigegeben.

## 1. Vorgehen

- **Bilder:** `node scripts/validierung-bilder.mjs` nach `npm run build` (Chrome headless, SwiftShader, devicePixelRatio 2). Je Fall die Uebersicht (Gesichtsfeld) und die Zoomansicht (links Anblick, rechts Quellbild) unter `docs/validierung/`. Das Fenster ist 1400 x 1000 CSS-Pixel; der Zoom zeigt dann 270 CSS-Pixel je Bild. Bietet der Zoom ein Detail an (Mond, #77), dazu das Detail (120 Arbeitspixel breit, `DETAIL_ARBEITSPIXEL` in `src/ui/zoom.ts`), bei T3 mit Pfeiltasten an die gepruefte Stelle geschoben.
- **Konfigurationen:** freie Refraktoren ohne Obstruktion, damit Bild und Tabellen-Test dieselbe Optik haben; Bortle 5, klar, Hoehe 90 Grad (das Seeing gilt nur im Zenit ohne Hoehenfaktor X^0,6). Die Brennweite ist frei gewaehlt, sie wirkt nur ueber die Vergroesserung.
- **Urteil:** erfuellt, teilweise oder nicht, gegen die Erwartung aus A-Q2 und die Zahlen in `docs/recherche/objekte.md` Abschnitt 4. Zusaetzlich zum Augenschein Helligkeitsprofile durch die Screenshots.
- **Masszahl:** die Delle eines Stufenprofils nach der Faltung mit dem Kern (`profilDelle`, `docs/recherche/physik.md` 8.1; Profile in `objekte.md` 4.6). Abweichung vom Issue-Text, der die MTF bei der Periode 2 x Strukturbreite vorsah: die MTF trennt eine einzelne schmale Linie (Cassini-Teilung) nicht von flaechigem Detail, und die zuerst gewaehlte Balkenantwort mal Objektkontrast kennt die Umgebung der Struktur nicht (begruendet in physik.md 8.1). Entschieden mit Herbert am 2026-10-27.
- **Was eingefroren wird:** was das Bild zeigt, nicht die Beobachtungserfahrung. Weicht das Bild von der Erwartung ab, steht die Abweichung in Abschnitt 4 und wird ein Issue (A-Q2), keine stille Korrektur.

URL-Basis aller Faelle: `https://herr-cbert.github.io/astobsim/`, dahinter der Suchteil aus der Tabelle (Kurzform `R(D, f, ok)` = `a=fernrohr&ba=refraktor&d=D&f=f&o=0&ok=ok&sg=50`, `B` = `b=5&t=klar&h=90`).

## 2. Testfaelle

| Fall | Suchteil | Gesamt-FWHM | Delle | Bild |
|---|---|---|---|---|
| T1 | `?v=1&R(70,700,7)&z=jup_47&s=2&B` | 2,67'' | Baender 0,142 | [Uebersicht](validierung/T1-uebersicht.png), [Zoom](validierung/T1-zoom.png) |
| T2a | `?v=1&R(100,1200,8)&z=sat_20&s=1.5&B` | 1,94'' | Cassini 0,000 | [Uebersicht](validierung/T2a-uebersicht.png), [Zoom](validierung/T2a-zoom.png) |
| T2b | `?v=1&R(60,600,6)&z=sat_20&s=1.5&B` | 2,53'' | Cassini 0,000 | [Uebersicht](validierung/T2b-uebersicht.png), [Zoom](validierung/T2b-zoom.png) |
| T3 | `?v=1&R(80,800,8)&z=mond_ev&s=2&B` | 2,55'' | Krater 0,549, Hadley 0,058 | [Uebersicht](validierung/T3-uebersicht.png), [Zoom](validierung/T3-zoom.png), [Detail](validierung/T3-detail.png) |
| T4a | `?v=1&R(300,3000,15)&z=jup_47&s=3&B` | 3,04'' | Detail 1,5'' 0,066 | [Uebersicht](validierung/T4a-uebersicht.png), [Zoom](validierung/T4a-zoom.png) |
| T4b | `?v=1&R(100,1000,5)&z=jup_47&s=3&B` | 3,23'' | 0,061 | [Uebersicht](validierung/T4b-uebersicht.png), [Zoom](validierung/T4b-zoom.png) |
| T4c | `?v=1&R(300,3000,15)&z=jup_47&s=1&B` | 1,11'' | 0,139 | [Uebersicht](validierung/T4c-uebersicht.png), [Zoom](validierung/T4c-zoom.png) |
| T4d | `?v=1&R(100,1000,5)&z=jup_47&s=1&B` | 1,57'' | 0,112 | [Uebersicht](validierung/T4d-uebersicht.png), [Zoom](validierung/T4d-zoom.png) |
| T5a | `?v=1&R(150,1200,6)&z=mars_14&s=1.5&B` | 1,72'' | Syrtis 0,384 | [Uebersicht](validierung/T5a-uebersicht.png), [Zoom](validierung/T5a-zoom.png) |
| T5b | `?v=1&R(80,960,8)&z=mars_6&s=1.5&B` | 2,15'' | Syrtis 0,046 | [Uebersicht](validierung/T5b-uebersicht.png), [Zoom](validierung/T5b-zoom.png) |
| T6a | `?v=1&g=auge&z=mond_ev&s=2&B` | 63,1'' | Mare 0,398 | [Uebersicht](validierung/T6a-uebersicht.png), [Zoom](validierung/T6a-zoom.png) |
| T6b | `?v=1&g=auge&z=jup_47&s=2&B` | 63,1'' | - | [Uebersicht](validierung/T6b-uebersicht.png), [Zoom](validierung/T6b-zoom.png) |
| T6c | `?v=1&g=fernglas-10x50&z=jup_47&s=2&B` | 6,74'' | Baender 0,080 | [Uebersicht](validierung/T6c-uebersicht.png), [Zoom](validierung/T6c-zoom.png) |
| T12a | `?v=1&R(80,800,10)&z=mond_ev&s=2&B` | - | - | [Uebersicht](validierung/T12a-uebersicht.png), [Zoom](validierung/T12a-zoom.png), [Detail](validierung/T12a-detail.png) |
| T12b | `?v=1&g=auge&z=jup_47&s=2&B` (wie T6b) | - | - | [Uebersicht](validierung/T12b-uebersicht.png), [Zoom](validierung/T12b-zoom.png) |
| T12c | `?v=1&g=auge&z=mars_14&s=2&B` | - | - | [Uebersicht](validierung/T12c-uebersicht.png), [Zoom](validierung/T12c-zoom.png) |
| T12d | `?v=1&g=auge&z=sat_20&s=2&B` | - | - | [Uebersicht](validierung/T12d-uebersicht.png), [Zoom](validierung/T12d-zoom.png) |

T5b mit Seeing 1,5'' ist eine Annahme (A-Q2 nennt fuer Mars 6'' kein Seeing); fuer T4 ist die Vergroesserung 200-fach gewaehlt, fuer T5b 120-fach (1,5 D).

### T1: Jupiter 47'', 70 mm, 100-fach, Seeing 2''

Erwartung: zwei dunkle Aequatorbaender erkennbar, Grosser Roter Fleck (GRF) nur als Andeutung.

Bild: das nordliche Band ist klar, das suedliche schwaecher (Profil am Zentralmeridian: Dellen etwa 10 % und 5 % im Anzeigewert). Der GRF ist ein deutlicher roetlicher Fleck, mehr als eine Andeutung. Das Quellbild (Hubble, OPAL) ist kontrastreicher als die visuelle Photometrie: Baender etwa 0,7 der Zonenhelligkeit gegen 0,82 bei Orton (objekte.md 4.6), der GRF kraeftig orange.

**Urteil: teilweise.** Baender erfuellt, GRF zu deutlich. Abweichung 4 (#79).

**Nach #79 (2026-10-28): erfuellt.** Das Quellbild ist im Kontrast an Orton angeglichen (jeder Kanal in linearem Licht hoch 0,427; NEB gegen NTrZ 0,651 vorher, 0,820 nachher, `tools/strukturprofile.py`). Im neuen Bild zeigen beide Baender eine Delle von etwa 9 bis 10 % (linear), der GRF ist ein blasser Fleck mit 0,87 der Umgebungshelligkeit, also eine Andeutung. Der Tabellen-Test bleibt unveraendert (er rechnet mit Ortons 0,82).

### T2: Saturn 20'', Seeing 1,5'', 100 mm bei 150-fach gegen 60 mm bei 100-fach

Erwartung: Cassini-Teilung bei 100 mm an den Ringenden erkennbar, bei 60 mm nicht. Seit Issue #76: im Langzeitmittel bei beiden Oeffnungen nicht erkennbar, bei 100 mm nur in ruhigen Momenten (A-Q2 angepasst).

Bild: bei beiden Oeffnungen keine Teilung. Im Profil quer durch die Anse steigt die Helligkeit vom A-Ring zum B-Ring stetig an, ohne Minimum; der A-Ring ist schmal (2,4'') und halb so hell wie der aeussere B-Ring, die Delle der 0,76'' breiten Teilung geht in dieser Flanke unter. 60 mm erfuellt die Erwartung, 100 mm nicht.

**Urteil: nicht erfuellt** (100 mm). Abweichung 1 (#76).

**Nach #76 (2026-10-27): erfuellt** gegen die angepasste Erwartung. Bei 1,5'' besteht die Langzeit-FWHM am 100 mm fast nur aus Bildbewegung (1,46''); erst ohne sie entsteht eine Delle, und auch dann nur mit hellerem A-Ring als im Quellbild (physik.md 15). Bild und Tabellen-Test bleiben unveraendert.

**Nach #79 (2026-10-28): weiter erfuellt.** Das Saturnbild ist mit einer Tonkurve an Salo und French 2010 angeglichen (objekte.md 4.2): A-Ring innen 0,82, aussen 0,54, Cassini-Zone 0,17 des aeusseren B-Rings (vorher 0,50, 0,21, 0,06). Die Ringe wirken im Bild heller und breiter, eine Teilung zeigt sich bei keiner Oeffnung; Delle im Langzeitmittel 0,000 bei 100 und 60 mm. Im ruhigen Moment (Kurzzeit-FWHM nach physik.md 15.1, Arbeitsmassstab des Langzeitkerns, daher nur Anhalt) kaeme 100 mm auf 0,131, knapp ueber der Schwelle, 60 mm auf 0,017; das passt zur Erwartung nach #76.

### T3: Mond, 80 mm, 100-fach, Seeing 2''

Erwartung: Krater ab etwa 4 km Durchmesser am Terminator erkennbar, Rillen (Hadley-Rille) nicht.

Bild: am Terminator sind viele kleine Krater zu sehen, die kleinsten deutlich erkennbaren bei etwa 8 bis 10 km; keine Rillen. Die Grenze von 4 km (2,15'') ist im Bild nicht pruefbar: der Mond-Zoom zeigt etwa 900'' auf 535 Anzeigepixeln (1,7''/px), groeber als der Arbeitsmassstab (1,0''/px) und als die Gesamt-PSF; auch das Quellbild daneben zeigt bei diesem Massstab keine 4-km-Krater. Die Delle (Kraterschatten 0,549, Hadley 0,058) sagt: erkennbar bzw. nicht.

**Urteil: teilweise** (Rillen erfuellt, Kratergrenze im Bild nicht pruefbar). Abweichung 2 (#77).

Nachtrag #77 (2026-10-28): das Detail zeigt 122'' auf 270 CSS-Pixeln (0,45''/CSS-Pixel, gut 2 CSS-Pixel je Arbeitspixel), Mitte 61'' westlich der Scheibenmitte, knapp oestlich des Terminators. Krater ab etwa 7 km (3,8'') sind deutlich, Krater um 4 bis 5 km als Hell-Dunkel-Paar angedeutet, zum Terminator hin geht alles im Dunkel unter (sRGB-Wert im linken Rand etwa 15, rechts etwa 37). Kleinere Krater (unter etwa 1,5'') fehlen im Anblick, im Quellbild daneben sind sie zu sehen. Die Grenze liegt damit wie erwartet bei etwa 4 km; dass sie nur angedeutet ist, liegt an der dunklen Anzeige bei 0,8 mm Austrittspupille, nicht an der Aufloesung.

**Urteil nach #77: erfuellt** (Kratergrenze im Detail pruefbar, etwa 4 km angedeutet, ab etwa 7 km deutlich; keine Rillen).

### T4: Jupiter, 300 mm gegen 100 mm bei 200-fach, Seeing 3'' und 1''

Erwartung: bei 3'' zeigt der 300 mm kaum mehr Detail als der 100 mm, ist nur heller; bei 1'' ist der Unterschied deutlich.

Bild: bei 3'' sehen beide gleich aus (Baenderprofil: Dellen 7 % und 6 %), der 300 mm ist heller (Leuchtdichte neunfach, Anzeigewert 9^(1/3) = 2,08-fach). Bei 1'' zeigt der 300 mm Festons am Nordrand der EZ, weisse Ovale suedlich des GRF und die Struktur im NEB; der 100 mm zeigt die Baender und den GRF, feines Detail kaum.

**Urteil: erfuellt.**

### T5: Mars 14'', 150 mm, 200-fach, Seeing 1,5''; Mars 6'', 80 mm

Erwartung: bei 14'' Polkappe und Syrtis Major als dunkle Struktur erkennbar; bei 6'' im 80 mm nur ein Scheibchen mit angedeuteter Polkappe.

Bild: bei 14'' sind die dunklen Gebiete als schwache Strukturen zu sehen, bei 6'' nur ein Scheibchen. Eine Polkappe fehlt in beiden Bildern; schon das Quellbild (Hubble 2016-05-12, auch fuer mars_6) zeigt keine abgegrenzte Kappe, nur blaeuliche Randwolken.

**Urteil: teilweise** (dunkle Strukturen und Scheibchen erfuellt, Polkappe nicht pruefbar). Abweichung 3 (#78).

Nachtrag #78 (2026-10-28): neues Quellbild Hubble 25.02.1995 (mars_hst_19950225, Aphel-Opposition, Ls etwa 64, grosse Nordkappe 0,28 Scheibendurchmesser, Syrtis Major in der Mitte), Screenshots neu. Bei 14'' ist die Nordkappe als helle Flaeche am Nordrand deutlich (Leuchtdichte im Nord-Sued-Schnitt 0,122 in der Kappe gegen 0,074 suedlich davon, eigenes Maximum), Syrtis Major als dunkler Keil links der Mitte schwach (Delle 0,384). Bei 6'' im 80 mm ein Scheibchen ohne eigenes Maximum der Kappe, aber mit hellerem Nordrand (sRGB 33 gegen 24 und 46 gegen 34 im gleichen Abstand von der Mitte nach Norden und Sueden), also angedeutet; Syrtis nicht (0,046).

**Urteil nach #78: erfuellt** (Polkappe und Syrtis bei 14'' erkennbar, bei 6'' Scheibchen mit angedeuteter Kappe).

### T6: Mond und Jupiter mit blossem Auge, Jupiter im 10x50

Erwartung: Mond mit Mare als Flecken, keine Krater; Jupiter mit blossem Auge ein Punkt; im 10x50 ein winziges Scheibchen mit zwei bis vier Monden in einer Linie, keine Baender.

Bild: Mond mit klaren Mare-Flecken, keine Krater (T6a). Jupiter mit blossem Auge ein Punkt ohne Monde, die Blendungsregel unterdrueckt alle vier (T6b). Im 10x50 ein Scheibchen von etwa zwei Anzeigepixeln mit vier Monden in einer Linie, im Anzeigewert 49 bis 59 gegen den Himmel 16 (sRGB, linear etwa zehnfach); im Zoom ein schwacher Hauch des NEB (Delle 0,080, unter der Schwelle). Gesichtsfeld beim blossen Auge rechteckig.

**Urteil: erfuellt.**

## 3. Kontrastschwelle "erkennbar"

| Delle | Fall und Struktur | im Bild |
|---|---|---|
| 0,549 | T3 Kraterschatten 4 km | erkennbar (aus der Delle, im Bild nicht pruefbar) |
| 0,384 | T5a Syrtis Major 14'' (seit #78, vorher 0,429) | erkennbar |
| 0,398 | T6a Mare, blosses Auge | erkennbar |
| 0,142 | T1 Baender 70 mm | erkennbar |
| 0,139 | T4c Detail 1,5'', 300 mm, 1'' | erkennbar |
| 0,112 | T4d Detail 1,5'', 100 mm, 1'' | nicht (Herbert, 2026-10-27: "kaum" zaehlt als nicht) |
| 0,080 | T6c Baender 10x50 | nicht |
| 0,066 / 0,061 | T4a / T4b Detail 1,5'' bei 3'' | nicht |
| 0,046 | T5b Syrtis Major 6'' (seit #78, vorher 0,060) | nicht |
| 0,058 | T3 Hadley-Rille | nicht |
| 0,000 | T2a / T2b Cassini-Teilung | nicht |

Zulaessig ist jede Schwelle zwischen 0,112 und 0,139. **`SCHWELLE_ERKENNBAR` = 0,125** (geometrisches Mittel, `src/physik/konstanten.ts`). Der Abstand zu beiden Seiten ist etwa 10 %; die Tabellen-Tests werden also bei einer Modellaenderung rot, die eine Delle um mehr als etwa 10 % verschiebt. Gegenprobe: mit 0,25 schlagen T1 und T4c fehl, mit 0,0625 T4a, T4d und T6c.

Die Schwelle ist eine Kalibrierkonstante fuer die Tests, keine Physik: das Bild haengt nicht davon ab. Sie gilt fuer die Delle im linearen Leuchtdichteprofil; die Anzeige komprimiert das Niveau mit dem Exponenten 1/3, nicht den Kontrast innerhalb des Objekts (physik.md 12.3).

## 4. Abweichungen

Als Issues angelegt am 2026-10-27, Milestone M3 (Herbert, 2026-10-27):

1. **#76, T2: Cassini-Teilung bei 100 mm und Seeing 1,5'' nicht sichtbar.** Das Modell faltet mit dem Langzeit-Seeing (Moffat mit voller FWHM); Beobachter sehen die Teilung in Momenten ruhiger Luft. Zu klaeren, ob die Erwartung fuer Langzeit-Seeing zu optimistisch ist oder ob das Seeing-Modell fuer visuelle Beobachtung zu streng ist. Bezug: #29 (Kann: Umschalter ruhiger Moment), physik.md 2. **Erledigt 2026-10-27:** Erwartung zu optimistisch, Modell bleibt, A-Q2 T2 angepasst. Ein Tilt-Abzug haette T4d und T5b ueber die Schwelle gehoben (physik.md 15).
2. **#77, T3: Mond-Zoom zu grob fuer die Aufloesungsgrenze.** Der Zoom zeigt beim Mond das halbe Gesichtsfeld (`ZOOM_ANTEIL_GESICHTSFELD_MAX`); bei 80 mm und 100-fach sind das etwa 1,7'' je Anzeigepixel, die Optik loest etwa 1'' je Arbeitspixel auf. Die Grenze von A-Q2 (Krater ab 4 km) ist so nicht zu sehen. Vorschlag: zweite Zoomstufe oder Zoom bis zum Arbeitsmassstab. **Erledigt 2026-10-28:** zweite Ansicht "Detail" in der Zoomansicht (Herbert, 2026-10-28), 120 Arbeitspixel breit, nur angeboten, wo sie hoechstens drei Viertel des Zoomfensters zeigt (praktisch nur beim Mond); T3 erfuellt.
3. **#78, T5: Mars-Quellbild ohne Polkappe.** Hubble 2016-05-12 (mars_14 und mars_6) zeigt keine abgegrenzte Kappe; "Polkappe erkennbar" ist damit nicht pruefbar. Vorschlag: anderes Bild fuer die Aphel-Opposition (Nordfruehling, grosse Nordkappe, objekte.md 4.4). **Erledigt 2026-10-28:** Hubble WFPC2 vom 25.02.1995 (Ls etwa 64, 13,43'', Syrtis Major in der Mitte) fuer mars_14 und mars_6, Quellweiss neu geeicht (objekte.md 5.3), Syrtis-Verhaeltnis 0,47 statt 0,41 (objekte.md 4.6); T5 erfuellt.
4. **#79, T1: Quellbild Jupiter kontrastreicher als visuell.** Baender etwa 0,7 statt 0,82 der Zonenhelligkeit (Orton [56]), GRF kraeftig orange; der GRF erscheint im 70 mm deutlich statt angedeutet. Vorschlag: Kontrast und Farbsaettigung des Quellbilds in `tools/` an die Photometrie angleichen, oder die Erwartung begruenden. Aus #76 dazu: Saturn-A-Ring im Quellbild 0,50 (innen) und 0,21 (aussen) des aeusseren B-Rings, vermutlich ebenfalls zu dunkel; selbst im ruhigen Moment zeigt er die Cassini-Teilung kaum (physik.md 15.4). **Erledigt 2026-10-28:** Jupiter mit Exponent 0,427 an Orton angeglichen (NEB/NTrZ 0,82), Saturn mit einer Tonkurve an Salo und French 2010 (eine Potenzkurve passt dort nicht); Quellweiss neu geeicht, T1 erfuellt, T2 weiter erfuellt.

## 5. Pruefpunkte aus Welle 4a

- **Trabantenhelligkeit haengt am Arbeitsmassstab** (physik.md 14.7 Punkt 1, Anzeige proportional s^(-2/3)): im 10x50 sind die vier Monde deutlich sichtbar (49 bis 59 gegen 16), in T1 (70 mm) 58 bis 69 gegen 5. Plausibel; die Monde liegen in keinem der Zoomausschnitte, der Unterschied Zoom gegen Uebersicht ist hier nicht zu sehen. Kein Issue.
- **Mondmagnitude** (objekte.md 7.16): mond_ev hat -10,2 mag, Krisciunas und Schaefer geben fuer den Phasenwinkel 78,5 Grad -10,54. Der Unterschied ist Leuchtdichte 1,37-fach, im Anzeigewert 1,11-fach. In T3 und T6a wirkt der Mond weder zu hell noch zu dunkel; das Bild entscheidet die 0,34 mag nicht. Kein Issue, die Werte bleiben. Nachtrag #36 (Entscheidung Herbert 2026-10-29): `mond_ev` hat jetzt -10,51 nach Gl. 9 bei 79,3 Grad, Quellweiss 3,60.
- **Exponent 1/3 fuer Punktquellen** statt Stevens 0,5 (physik.md 14.7 Punkt 2): die Galileischen Monde sind im 70 mm und im 10x50 leicht zu sehen, wie in der Beobachtungserfahrung; mit 0,5 waeren sie dunkler, aber noch sichtbar. Kein Anlass zu aendern. Kein Issue.

- **Anzeigeweiss und Kompressionsexponent** (physik.md 12.5 Punkte 3 und 5, ADR-0002): der Mond ist mit blossem Auge heller (sRGB etwa 99) als im 80 mm bei 100-fach (etwa 46, Austrittspupille 0,8 mm), wie es A-P4 verlangt; kein Bild ist ausgebrannt oder unlesbar dunkel. Beibehalten, kein Issue.
- **Schleier des Himmels** (physik.md 12.5 Punkt 4): nicht sichtbar. Die Nachtseite des Mondes ist in T3 so dunkel wie der Himmel (sRGB 6), der Himmel beim blossen Auge ein mittleres Grau (18) wie bei Bortle 5 zu erwarten. Kein Issue.

## 6. Pruefung

| Wer | Wann | Ergebnis |
|---|---|---|
| Claude | 2026-10-27 | Urteile wie oben |
| Herbert | 2026-10-27 | Urteile wie oben |
| Herbert | 2026-10-27 | #76: T2-Erwartung an das Langzeitmittel angepasst, T2 erfuellt |
| Claude | 2026-10-28 | #79: Quellbilder Jupiter und Saturn angeglichen, T1 erfuellt, T2 weiter erfuellt, T4 und T6 unveraendert im Urteil |
| Claude | 2026-10-28 | #77: Detail in der Zoomansicht, T3 erfuellt |
| Claude | 2026-10-28 | #78: Quellbild Mars 1995 mit Nordkappe, T5 erfuellt |
| Herbert | 2026-10-28 | A-T3: Firefox funktioniert |
| Claude | 2026-10-29 | #36: Mondphasen P1 bis P3 (Abschnitt 9); `mond_ev` vereinheitlicht, T3 und T6a geaendert, uebrige T-Bilder byte-gleich mit main 15da6ee |
| Herbert | 2026-10-29 | #36: Kriterium Maria des Vollmonds mit blossem Auge aufgegeben (Grenze des Modells) |
| Claude | 2026-10-30 | #111: Anzeigeweiss 8,9 und Punktweiss 6,9 (Entscheidung Herbert), alle T- und P-Bilder neu, T12 erfuellt, T1 bis T6 weiter erfuellt (Abschnitt 13) |

## 7. Sicherheit (Issue #22)

Stand 2026-10-27, Branch `issue-22-sicherheit` auf `main` nach PR #80.

| Pruefpunkt | Ergebnis | Beleg |
|---|---|---|
| Keine Laufzeitabhaengigkeiten (ADR-0001) | erfuellt | `package.json` ohne `dependencies`, nur `typescript`, `vite`, `vitest` als Dev-Abhaengigkeiten |
| `npm audit` | 0 Befunde | `npm audit` am 2026-10-27 |
| Keine Cookies, kein Browserspeicher, kein Tracking (A-T4) | erfuellt | Suche ueber `src/` und `index.html`: kein `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`, `sendBeacon`; Konfiguration nur in der URL (A-D8) |
| Keine externen Ressourcen (A-T1, A-T4) | erfuellt | keine fremden URLs in `src/` und `index.html`; `fetch` nur unter `import.meta.env.BASE_URL + "daten/"` (`src/daten/pruefe.ts`, `src/daten/kachellader.ts`); Bildpfade kommen aus `daten/bilder.json`, nie aus der URL |
| URL-Parameter begrenzt und nie in HTML | erfuellt | gelesen nur in `ausUrl` (`src/zustand/url.ts`): Zahlen per `Number`, unbekannte Werte fallen auf die Voreinstellung, danach `begrenze` (A-F8); Zustands-ids nur als Schluessel im Katalog. Geschrieben per `history.replaceState`. Texte gelangen nur ueber `textContent` ins DOM, auch Fehlermeldungen (`src/ui/starte.ts`) |
| Keine Code-Ausfuehrung aus Daten | erfuellt | kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` in `src/` |
| Content-Security-Policy | neu | im Bau als meta-Tag: `default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'` (Plugin in `vite.config.ts`). GitHub Pages erlaubt keine eigenen Header; `frame-ancestors` (Einbetten in fremde Seiten) wirkt im meta-Tag nicht und bleibt offen, ohne Folgen fuer eine Seite ohne Konten und Eingaben an einen Server. Im Dev-Server keine CSP (Vite fuegt CSS als `<style>` ein). Geprueft: alle 13 Faelle von `scripts/validierung-bilder.mjs` ohne Konsolenfehler, Screenshots byte-gleich, `npm run test:browser` bestanden; Gegenprobe mit `connect-src 'none'`: das Skript meldet die Verstoesse und endet mit Exit 1 |

**Review der Aenderungen:** Der Skill `security-review` bricht auf `sam` ab, weil `git diff` ueber `diff.external` vimdiff startet; die Aenderungen des Branches (CSP-Plugin, Skript) sind deshalb von Hand nach derselben Methode geprueft. Befund: die lokalen Testserver in `scripts/browser-test.mjs` und `scripts/validierung-bilder.mjs` prueften den Pfad mit `startsWith(bau)` ohne Trennzeichen, `../dist-x/...` haette Dateien aus Nachbarordnern ausgeliefert, die mit `dist` beginnen. Beide Server lauschen nur auf 127.0.0.1; trotzdem behoben (`startsWith(bau + sep)`).

**Massnahmen:** CSP im Bau; `scripts/validierung-bilder.mjs` meldet Konsolenfehler und CSP-Verstoesse (Exit 1, das favicon an der Wurzel ausgenommen, das Chrome von sich aus anfragt); Pfadpruefung der Testserver gehaertet. Keine offenen Befunde.


## 8. Nachweis der Anforderungen (Issue #23, A-Q3)

Stand 2026-10-28. Je Muss-Anforderung aus `docs/anforderungen.md` das Issue mit PR und der Beleg im Repo (Test, Datei oder Abschnitt hier). Erhoben von einem Explore-Agenten aus Anforderungen, `docs/plan.md`, Git-Log und GitHub, die Belegdateien von Claude auf Existenz geprueft. "erfuellt" setzt bei A-X1, A-X3 und A-Q2 die Merges von PR #90 (#77) und #91 (#78) voraus.

| ID | Kurzform | Issue / PR | Beleg | Status |
|---|---|---|---|---|
| A-Z1 | Anblick am Okular fuer Geraet und Bedingungen | #9 / PR #54, #19 / PR #62 | Abschnitt 2, T1 bis T6 | erfuellt |
| A-Z2 | Einsteiger: Voreinstellungen und Hilfetexte | #16 / PR #53, #18 / PR #59 | `src/zustand/voreinstellung.ts`, `src/texte.ts` | erfuellt (qualitativ) |
| A-Z3 | Experten geben jede Zahl direkt ein | #17 / PR #58, #18 / PR #59 | `src/ui/feld.ts`, `src/ui/geraetewahl.test.ts` | erfuellt |
| A-Z4 | Mond, Jupiter, Saturn, Mars | #7 / PR #43, #12 / PR #56, #13 / PR #61 | `daten/objekte.json`, `src/daten/objekte.test.ts` | erfuellt |
| A-Z5 | Nur visueller Anblick | ADR-0002 | `docs/adr/0002-simulationsmodell.md` | erfuellt (Entwurf) |
| A-F1 | Oeffnung, Brennweite, Obstruktion, Bauart | #1 / PR #39, #11 / PR #47, #17 / PR #58 | `src/daten/geraete.test.ts`, `src/ui/geraetewahl.ts` | erfuellt |
| A-F2 | Liste oder freie Eingabe, 22 Fernrohre | #11 / PR #47, #17 / PR #58 | `daten/geraete.json` (26 Eintraege: 22 Fernrohre, Auge, 3 Fernglaeser) | erfuellt |
| A-F3 | Blosses Auge | #3 / PR #41, #11 / PR #47 | `src/physik/optik.test.ts`, T6a und T6b | erfuellt |
| A-F4 | Drei Ferngläser | #11 / PR #47 | `src/daten/geraete.test.ts`, T6c | erfuellt |
| A-F5 | Geraeteliste als Datendatei | #11 / PR #47 | `daten/geraete.json`, `src/daten/geraete.ts` | erfuellt |
| A-F6 | Okular mit Brennweite, Gesichtsfeld, Presets | #3 / PR #41, #17 / PR #58 | `src/physik/optik.test.ts`, `src/ui/formular_geraet.ts` | erfuellt |
| A-F7 | Vergroesserung direkt editierbar | #17 / PR #58, #63 / PR #82 | `src/ui/geraetewahl.test.ts` | erfuellt |
| A-F8 | Eingaben begrenzen mit Hinweis | #3 / PR #41, #64 / PR #67, #65 / PR #68 | `src/physik/begrenze.test.ts`, `src/zustand/url.test.ts` | erfuellt |
| A-B1 | Seeing 0,5 bis 5'' mit Wortstufe | #3 / PR #41, #18 / PR #59 | `src/ui/formular_bedingungen.test.ts` | erfuellt |
| A-B2 | Bortle 1 bis 9 | #3 / PR #41, #18 / PR #59, #55 / PR #60 | `src/physik/helligkeit.test.ts` | erfuellt |
| A-B3 | Transparenz dreistufig | #3 / PR #41, #18 / PR #59 | `src/physik/atmosphaere.test.ts` | erfuellt |
| A-B4 | Hoehe 10 bis 90 Grad | #3 / PR #41, #18 / PR #59 | `src/physik/atmosphaere.test.ts`, `src/physik/begrenze.test.ts` | erfuellt |
| A-P1 | Jede Formel mit Quelle | #2 bis #5 | `docs/recherche/physik.md`, Spielregel in `docs/plan.md` | erfuellt (Doku) |
| A-P2 | Drei Grenzen: Beugung, Seeing, Auge | #3 / PR #41, #4 / PR #44 | `src/physik/aufloesung.test.ts`, `src/physik/kern.test.ts` | erfuellt |
| A-P3 | Obstruktion senkt den Kontrast | #4 / PR #44 | `src/physik/beugung.test.ts`, `src/physik/kern.test.ts` | erfuellt |
| A-P4 | Helligkeit ueber Austrittspupille und Extinktion | #3 / PR #41, #55 / PR #60, #71 / PR #74 | `src/physik/helligkeit.test.ts`, Abschnitt 5 | erfuellt |
| A-P5 | Langzeitmittel statt bester Moment | ADR-0002, #76 / PR #87 | T2, `docs/recherche/physik.md` 15 | erfuellt |
| A-P6 | Punktquellen mit Blendungsregel | #14 / PR #69, #72 / PR #75 | `src/physik/punktquellen.test.ts`, `src/bild/punktebene.test.ts` | erfuellt |
| A-P7 | Reine, testbare Funktionen | #2 bis #5 | `src/physik/*.test.ts` | erfuellt |
| A-D1 | Gesichtsfeld rund, Auge rechteckig | #9 / PR #54, #19 / PR #62 | `src/ui/gesichtsfeld.ts`, T6 | erfuellt |
| A-D2 | Ausschnitt verschieben | #19 / PR #62 | `src/ui/verschieben.test.ts` | erfuellt |
| A-D3 | Zoomansicht mit Quellbild daneben | #20 / PR #70, #77 / PR #90 | `src/ui/zoom.test.ts`, T3 Detail | erfuellt |
| A-D4 | Infopanel mit Kennzahlen | #5 / PR #48, #19 / PR #62 | `src/ui/infopanel.test.ts` | erfuellt |
| A-D5 | Warnungen Austrittspupille und Vergroesserung | #5 / PR #48, #19 / PR #62 | `src/physik/auswerten.test.ts`, `src/ui/warnungen.test.ts` | erfuellt |
| A-D6 | Hilfetext fuer jeden Parameter und jede Zahl | #17, #18, #19 | `src/ui/infopanel.test.ts`, `src/texte.ts` | erfuellt (Test nur Infopanel) |
| A-D7 | Rechnung unter 0,5 s | #15 / PR #50, #19 / PR #62, #66 / PR #89 | `src/physik/auswerten.laufzeit.test.ts` | erfuellt |
| A-D8 | Alle Parameter in der URL | #16 / PR #53 | `src/zustand/url.test.ts` | erfuellt |
| A-D9 | Startkonfiguration | #16 / PR #53 | `src/zustand/voreinstellung.test.ts` | erfuellt |
| A-D10 | Deutsch, Texte in einer Datei | #9 / PR #54, PR #57 | `src/texte.ts`, `src/texte.test.ts` | erfuellt |
| A-D11 | Aufrecht, Norden oben | #8 / PR #49, #9 / PR #54 | `norden_oben` in `src/daten/bildnachweise.ts`, `src/ui/zeichne.ts` | erfuellt |
| A-X1 | Feste Zustaende, Mars-6-Hinweis | #7, #12, #13, #78 / PR #91 | `daten/objekte.json`, `src/daten/objektzustand.test.ts` | erfuellt |
| A-X2 | Galileische Monde, Titan, Rhea | #13 / PR #61, #14 / PR #69 | `src/daten/objekte.test.ts`, `src/physik/punktquellen.test.ts` | erfuellt |
| A-X3 | Nur echte Aufnahmen mit freier Lizenz | #7, #12, #13, #79 / PR #88, #78 / PR #91 | `daten/bilder.json`, `src/daten/bilddateien.test.ts`, `tools/bildnachweis_pruefen.py` | erfuellt |
| A-X4 | Bildnachweis in einer Datendatei | #8 / PR #49, #23 | `src/daten/bildnachweise.test.ts`, Seitenfuss `src/ui/bildnachweise.ts` | erfuellt |
| A-X5 | Quellaufloesung fein genug, Mond gekachelt | #7 / PR #43, #8 / PR #49, #12 / PR #56 | `bogensekunden_pro_pixel` in `daten/bilder.json`, ADR-0003 | erfuellt (Daten, kein Test) |
| A-X6 | Erstladen unter 5 MB, je Objekt unter 20 MB | #7, #8, #10 / PR #42 | `scripts/build-abschluss.mjs`, `src/daten/bilddateien.test.ts` | erfuellt |
| A-T1 | Nur Browser, kein Backend | ADR-0001, #10 / PR #42, #22 / PR #81 | Abschnitt 7 | erfuellt |
| A-T2 | GitHub Pages | #10 / PR #42 | `.github/workflows/pages.yml`, https://herr-cbert.github.io/astobsim/ | erfuellt |
| A-T3 | Chrome und Firefox (Desktop) | #15 / PR #50, #23 | Chrome: `scripts/browser-test.mjs`, `scripts/validierung-bilder.mjs`; Firefox: von Hand, Abschnitt 6 | erfuellt |
| A-T4 | Keine Konten, Cookies, Tracking | #16 / PR #53, #22 / PR #81 | Abschnitt 7 | erfuellt |
| A-T5 | MIT-Lizenz, Bilder mit eigener Lizenz | #23 | `LICENSE`, `package.json`, Seitenfuss | erfuellt |
| A-T6 | Stackwahl in Phase 3 | ADR-0001 | `docs/adr/0001-stack.md` | erfuellt |
| A-Q1 | Unit-Tests der Physik gegen bekannte Werte | #2 / PR #40, #3 / PR #41, #4 / PR #44 | `src/physik/aufloesung.test.ts`, `src/physik/atmosphaere.test.ts` | erfuellt |
| A-Q2 | T1 bis T6 geprueft, Abweichungen als Issues | #21 / PR #80, #76 bis #79 | Abschnitte 2 bis 4, `src/physik/validierung.test.ts` | erfuellt |
| A-Q3 | Version 1 fertig | #23 | dieser Abschnitt, Seite online | erfuellt |

**Firefox (A-T3):** Firefox 158 auf `sam` startet headless und zeigt Layout und Ladestatus (Screenshot beim Laden); `--screenshot` wartet nicht auf die Rechnung, ein voller Durchlauf ist so nicht pruefbar. Pruefpunkt von Hand (Herbert): https://herr-cbert.github.io/astobsim/ in Firefox oeffnen, Objekt und Geraet wechseln, Seeing-Regler ziehen, Zoom, beim Mond Detail und Verschieben, Bildnachweise aufklappen; Konsole ohne Fehler. Ergebnis in Abschnitt 6 eintragen. **Erledigt 2026-10-28:** Herbert, Firefox funktioniert.

**Kann-Punkte:** alle als Issues im Milestone "Nach Version 1": A-Z8 #24, A-Z9 #25, A-Z10 #26, A-F9 #27, A-B5 #28, A-B6 #29, A-P8 #30, A-D12 #31, A-D13 #32, A-D14 #33, A-D15 #34, A-D16 #35, A-X7 #36, A-X8 #37, eigenes Mond-Rendering (ADR-0002) #38.

## 9. Mondphasen (Issue #36)

Drei weitere Mondzustaende aus NASA SVS 5587 (`mond_sichel`, `mond_voll`, `mond_lv`, `docs/recherche/bilder-v2.md` 8.5). Bilder mit `node scripts/validierung-bilder.mjs P1a P1b P2a P2b P3a P3b` am 2026-10-29 (SwiftShader, Stand main 15da6ee plus #36). Die Faelle sind Sichtpruefungen der Daten, keine Testfaelle nach A-Q2. T1 bis T6 waren mit den drei neuen Zustaenden allein byte-gleich mit main 15da6ee (27 Dateien); seit der Vereinheitlichung von `mond_ev` aendern sich T3 und T6a (Nachtrag unten). Die eingecheckten T-Bilder waren aelter (vor #100); seit der Zusammenfuehrung von Welle 3 (2026-10-29) zeigen alle T- und P-Bilder den Stand nach #100, #127 (weicher Kernrand der Punktquellen, physik.md 24) und #128, erzeugt mit SwiftShader.

| Fall | Suchteil | Bild |
|---|---|---|
| P1a | `?v=1&g=auge&z=mond_sichel&s=2&B` | [Uebersicht](validierung/P1a-uebersicht.png), [Zoom](validierung/P1a-zoom.png) |
| P1b | `?v=1&g=fernglas-10x50&z=mond_sichel&s=2&B` | [Uebersicht](validierung/P1b-uebersicht.png), [Zoom](validierung/P1b-zoom.png), [Detail](validierung/P1b-detail.png) |
| P2a | `?v=1&g=auge&z=mond_voll&s=2&B` | [Uebersicht](validierung/P2a-uebersicht.png), [Zoom](validierung/P2a-zoom.png) |
| P2b | `?v=1&R(80,800,8)&z=mond_voll&s=2&B` | [Uebersicht](validierung/P2b-uebersicht.png), [Zoom](validierung/P2b-zoom.png), [Detail](validierung/P2b-detail.png) |
| P3a | `?v=1&g=auge&z=mond_lv&s=2&B` | [Uebersicht](validierung/P3a-uebersicht.png), [Zoom](validierung/P3a-zoom.png) |
| P3b | `?v=1&R(80,800,8)&z=mond_lv&s=2&B` | [Uebersicht](validierung/P3b-uebersicht.png), [Zoom](validierung/P3b-zoom.png), [Detail](validierung/P3b-detail.png) |

Grauwerte unten: Mittel der drei sRGB-Kanaele im Anblick des Zooms (linke Haelfte), gemessen an den PNG.

- **Sichel (P1a, P1b):** schmale Sichel rechts, Hoerner nach links, die konvexe Seite zur Sonne (westlich, bei Norden oben rechts). Mare Crisium als dunkles Oval nahe dem rechten Rand oberhalb der Mitte, im 10x50 mit Kratern am Terminator (P1b), mit blossem Auge als Fleck angedeutet (P1a, 16 % der Mondpixel ueber 250). Die Nachtseite ist so hell wie der Himmel (P1b: 49 gegen 49 in der Ecke); kein Erdlicht, wie im Hilfetext vermerkt. Das Detail liegt in der Scheibenmitte, also auf der Nachtseite, und zeigt nur Himmelsgrau.
- **Vollmond (P2a, P2b):** im 80 mm bei 100-fach (P2b) Maria, Tycho und Kopernikus mit Strahlen deutlich; das Hochland im Sueden und um die Mitte ist weiss abgeschnitten (51 % der Pixel ueber 250, Detail in der Mitte ganz 255). Mit blossem Auge (P2a) ist die Scheibe zu 84 % weiss abgeschnitten, die Maria sind hoechstens als schwacher Schatten oben links zu ahnen. **Das Kriterium "Vollmond mit blossem Auge zeigt die Maria als Flecken" ist aufgegeben (Entscheidung Herbert 2026-10-29), als bekannte Grenze des Modells.** Gerechnet im Review von PR #128: T12 verlangt Anzeigeweiss etwa 9,1 mag/arcsec$^2$ (`mond_ev` am 80 mm bei 1 mm Austrittspupille, hellstes Perzentil weiss). Die Maria des Vollmonds blieben mit blossem Auge erst bei Anzeigeweiss 6 oder weniger unter Weiss; Anteil weiss bei 9,2 / 8 / 7 / 6: 95 / 83 / 65 / 44 %. Grund: Komprimiert wird mit $n$ = 1/3 nur das Niveau, die Skala innerhalb des Bilds bleibt linear (`src/physik/helligkeit.ts`, Zeilen 99 bis 104). Die Maria des Vollmonds liegen bei etwa 4 mag/arcsec$^2$ (Quellweiss 2,29, Pixelwert um 0,2) und damit heller als das Hochland von `mond_ev` (etwa 4,4 seit #36).
- **Letztes Viertel (P3a, P3b):** linke Haelfte beleuchtet, Terminator nahe der Mitte, Norden oben (Mare Imbrium oben links, Kopernikus mit Strahlen links der Mitte, grosse Krater am Terminator, nach Lage vermutlich Ptolemaeus, Alphonsus und Arzachel). Nachtseite gleich Himmel (P3b-Zoom 24, Tagseite 120). Im Detail (P3b) stehen beleuchtete Gipfel und Kraterraender hinter dem Terminator als helle Punkte im Dunkel, wie im Quellbild; die Maske hat sie nicht geschwaerzt. Mit blossem Auge (P3a) 43 % abgeschnitten, Maria als Flecken erkennbar.

**Urteil:** Orientierung, Phase und schwarze Nachtseite erfuellt; Maria des Vollmonds mit blossem Auge als Kriterium aufgegeben (Grenze des Modells, siehe oben).

**Nachtrag `mond_ev` (Entscheidung Herbert 2026-10-29):** `mond_ev` hat jetzt -10,51 mag (Krisciunas und Schaefer bei 79,3 Grad), Quellweiss 3,60 und eine geschwaerzte Nachtseite (neue Kacheln). Damit aendern sich T3 und T6a; T1, T2, T4, T5, T6b und T6c bleiben byte-gleich mit main 15da6ee (Bilder am 2026-10-29 verglichen, die T-Bilder werden bei der Zusammenfuehrung neu erzeugt und hier nicht eingecheckt). T6a: die aschgraue Nachtseite (vorher 61 gegen Himmel 54 im Zoom) ist weg, sie hat jetzt Himmelsgrau 54; die Tagseite ist durch den um 0,31 mag helleren Quellweiss etwas staerker abgeschnitten (55 statt 51 % der Mondpixel ueber 250), Mare Crisium und die Maria am Terminator bleiben als Flecken sichtbar. T3: Nachtseite gleich Himmel (24), Tagseite im Median 118 statt 114.


## 10. M31 mit blossem Auge (Issue #106)

Pruefung des Quellbilds `m31_noirlab_lgs` (Pressebild, per Tonkurve gegen das Profil zurueckgerechnet, `docs/recherche/physik.md` 25) gegen den Prototyp (ADR-0004 Befund 2: mit $F$ = 1,4 bei Bortle 3 sichtbar mit 106' Ausdehnung, bei Bortle 5 knapp darunter mit 0,78, bei Bortle 7 unsichtbar mit 0,42).

**Gerechnet** mit `sichtbareIsophote` aus `src/physik/schwelle.ts` (blosses Auge, Transparenz klar, Zenit: Extinktion 0,20 mag, wie die Validierungsbilder), einmal mit der Flaechentabelle aus `daten/objekte.json`, einmal mit der Tabelle des unverschmierten Modells (`deep-sky.md` 1.2, 4''/px, 0,1-mag-Schritte). $C/C_\mathrm{th}$ ist das beste Verhaeltnis ueber alle Zeilen, die Ausdehnung die grosse Achse einer Ellipse mit $q$ = 0,27 und der Flaeche der sichtbaren Isophote.

| Bortle (Himmel) | Bild: $C/C_\mathrm{th}$, sichtbar bis | Modell: $C/C_\mathrm{th}$, sichtbar bis | Prototyp (ADR-0004) |
|---|---|---|---|
| 3 (21,4) | 1,58, 22,47 mag/arcsec$^2$, 102' | 1,42, 22,57, 110' | sichtbar, 106' |
| 5 (20,0) | 0,85 (Scheitel bei 21,4) | 0,78 (bei 21,0) | 0,78 |
| 7 (18,3) | 0,43 (bei 19,8) | 0,42 (bei 20,2) | 0,42 |

Das Modell reproduziert den Prototyp genau; das Bild weicht um +0,07 (Bortle 5), +0,01 (Bortle 7) und -4 % in der Ausdehnung (Bortle 3) ab. **Toleranz:** $C/C_\mathrm{th}$ auf 10 % und die Ausdehnung auf 10 %, begruendet mit der Flaechentabelle: das Bild hat in der Zone 21,3 bis 21,6 mag/arcsec$^2$, in der die Reserve bei Bortle 3 und 5 ihren Scheitel hat (Ring bei 10 kpc, im Modell nicht enthalten), 10 bis 20 % mehr Flaeche als das Modell (ueber alle Zeilen von 17,0 bis 22,5: 0,83 bis 1,38, `physik.md` 25); bei der flachen Reserve $d(\mu)$ von M31 aendert das $C/C_\mathrm{th}$ um wenige Prozent. Das Profil selbst ist in der Ausdehnung auf Faktor 1,5 unsicher (`deep-sky.md` 9 Punkt 1), die Toleranz ist also deutlich enger als die Unsicherheit der Vorlage. Ohne Extinktion (Zenit ohne Atmosphaere) liegt Bortle 5 beim Bild mit 1,01 knapp auf der Schwelle, beim Modell mit 0,94 knapp darunter; die Aussage "knapp" gilt in beiden Faellen.

**Geprueft (Sichtpruefung, Screenshots nicht eingecheckt)** mit einer Kopie von `scripts/validierung-bilder.mjs` und den Suchteilen `?v=1&g=auge&z=m31&s=2&b=3|5|7&t=klar&h=90` (SwiftShader; 2026-10-29, nach dem Review am 2026-10-30 mit der berichtigten Sternentfernung wiederholt, Grauwerte gleich bis auf 1 Kode). Grauwerte (Mittel der sRGB-Kanaele) in der Uebersicht, Kern / Scheibe nordoestlich der Mitte / Himmel:
- Bortle 3: laengliche Scheibe von oben links nach unten rechts (PA etwa 38 Grad, Norden oben, Osten links), M32 als Fleck suedlich des Kerns; 84 / 51 / 43.
- Bortle 5: Kern und innere Scheibe schwach, Aussenscheibe kaum vom Himmel zu trennen; 85 / 56 / 54.
- Bortle 7: nur der Kern als kleiner, undeutlicher Fleck, Scheibe gleich Himmel; 88 / 70 / 70.

Der Kern bleibt bei Bortle 7 als Fleck sichtbar, obwohl $C/C_\mathrm{th}$ = 0,43 ist. **Berichtigt 2026-10-30 (Issue #136):** Hier stand, die Deckkraft $P = \Phi((0{,}43-1)/0{,}484)$ = 0,12 wirke auf den Kernkontrast. Das ist falsch: $C/C_\mathrm{th}$ der Isophote legt nur $q^*$ fest (18,85 mag/arcsec$^2$ bei Bortle 7), die Deckkraft gilt je Pixel. Der gefaltete Kern hat 16,67 mag/arcsec$^2$, $q/q^*$ = 7,6, also $P$ = 1,0 (gerechnet). Der Kern erscheint nur deshalb als schwacher Hauch (sRGB 87 gegen 67), weil die Kubikwurzel der gemeinsamen Abbildung den Kontrast gegen den hellen Himmel staucht. Das entspricht Bortles Beschreibung fuer Klasse 7 ("may be glimpsed ... very indistinct", `deep-sky.md` 8 Punkt 2) und ist kein Fehler des Quellbilds.

**Entscheidungen Herbert (2026-10-30, Review PR #130):**
- Der im Pressebild gesaettigte Kern (flache Kuppe innerhalb etwa 30'', `physik.md` 25) wird **nicht** aus dem Modell aufgefuellt; den Hinweis fuer Benutzer bringt der Hilfetext aus #110.
- Der Kern als Hauch bei Bortle 7 ist gewollt (T11).
- M32 erscheint mit blossem Auge als kleiner Fleck suedlich des Kerns (Bortle 3: deutlich, Bortle 5: schwach). Ob er als Punktquelle gelten soll, ist ein Thema fuer #111, nicht fuer das Quellbild. (Behoben in #136: M32 ist ein Begleiter mit eigener Schwelle, siehe Nachtrag unten.)

**Offen (Review S1):** Am 80 mm bei 16-fach und Bortle 3 (`?v=1&a=fernrohr&ba=refraktor&d=80&f=400&o=0&ok=25&sg=50&z=m31&s=2&b=3&t=klar&h=90`) ist auf der Westseite die Treppe der Mosaikfelder als Kante der Aussenscheibe zu sehen. Der vorgeschlagene Schnitt an der groessten Ellipse im Mosaik ($q$ = 0,27, PA 37,5 Grad) ergibt nur 51,8' grosse Halbachse; am Bild (nur in `dist/` geprueft) zeigt er eine harte Ellipse von 104', M32 faellt weg, die Flaechentabelle endet bei 21,4, die Gesamthelligkeit faellt auf 3,68. Er ist deshalb im Werkzeug vorhanden (`ellipse`), fuer M31 aber nicht eingeschaltet (`physik.md` 25). **Entscheidung Herbert (2026-10-30):** Treppe bleibt, Ellipsenschnitt bleibt aus; M31 traegt dafuer `hinweis_hilfe` in `daten/objekte.json` (Mosaik mit gestufter Kante, Aussenscheibe fehlt ausserhalb, Kante bei kleiner Vergroesserung und dunklem Himmel sichtbar, Kern flach).

**Urteil:** erfuellt; M31 ist bei Bortle 3 sichtbar, bei 5 knapp darunter, bei 7 nicht (Scheibe), wie ADR-0004 Befund 2.

**Nachtrag 2026-10-30: M32 als Begleiter (Issue #136).** M32 bekam als Teil des M31-Bilds dessen Schwelle (ADR-0004 Befund 4) und war mit blossem Auge sichtbar. Jetzt ist er ein Begleiter mit eigenem Bild, eigener Flaechentabelle und eigener Deckkraft (ADR-0004 und ADR-0003 Nachtrag #136, `physik.md` 29). **Geprueft** am Produktionsbau (SwiftShader, Zenit, klar), vorher `origin/main` 29ef8c8, nachher Branch `issue-136-m32`; Uebersicht, sRGB (Mittel der Kanaele), M32 = hellstes Pixel im Kreis um M32, Umgebung = Median im Ring 5' bis 6' um M32, Kern = Mittel 5 x 5 px in der Bildmitte:

| Fall | M32 / Umgebung vorher | M32 / Umgebung nachher | Kern vorher / nachher |
|---|---|---|---|
| Auge, Bortle 3 | 68 / 43 | 45 / 43 | 82 / 82 |
| Auge, Bortle 5 | 70 / 51 | 52 / 51 | 82 / 82 |
| Auge, Bortle 7 | 75 / 67 | 67 / 67 | 84 / 84 |
| 10x50, Bortle 5 | 73 / 50 | 73 / 50 | 74 / 74 |
| 80 mm 16-fach, Bortle 3 | 81 / 44 | 83 / 44 | 81 / 81 |
| 80 mm 16-fach, Bortle 7 | 86 / 62 | 83 / 62 | 87 / 87 |
| 80 mm 40-fach, Bortle 5 | 64 / 34 | 63 / 34 | 64 / 64 |

Mit blossem Auge ist M32 bei Bortle 3, 5 und 7 verschwunden (45 gegen 43 bei Bortle 3 ist der Anstieg der M31-Scheibe zum Kern hin, kein Fleck); im 10x50 und am 80 mm bleibt er als ovaler Nebel mit hellem Kern sichtbar. Bei 40-fach und bei 16-fach unter Bortle 7 ist sein schwacher Hof kleiner als vorher, weil die eigene Schwelle von M32 strenger ist als die von M31 (gewollt). Ausserhalb 5' um M32 aendern sich die Uebersichten um hoechstens 1 Kode (neue Flaechentabelle von M31 ohne M32); der Kern bei Bortle 7 bleibt als Hauch (T11). Die Validierungsbilder T1 bis T6, T12 und P1 bis P3 sind bytegleich. Die Bilder liegen nicht im Repo (Faelle wie in Abschnitt 10, mit `scripts/validierung-bilder.mjs` und eigenen Suchteilen erzeugt).

## 11. M42 (Issue #107)

Geprueft am 2026-10-30 (nach dem Review von PR #132) mit Screenshots aus dem Produktionsbau (nicht eingecheckt, Bortle 5, Zenit, wie `scripts/validierung-bilder.mjs`): 10x50, Refraktor 80/400 mit 10 mm (40-fach), 200/1200 mit 25 mm (48-fach) und 8 mm (150-fach, Seeing 1,5"). Keine Konsolenfehler, keine CSP-Verstoesse.

- **Lage:** Objektmitte und Bildmitte sind Theta1 Ori C; das Trapez steht bei 40- und 150-fach in der Mitte des Anblicks. Die zwischenzeitliche Variante mit der Mitte des WFI-Felds ist verworfen (Trapez bei 150-fach am Rand).
- **Trapez:** Die vier hellen Sterne (C, A, D, B) stehen als Viereck mit Norden oben, Osten links (Lage aus Gaia DR3, `daten/sterne/m42.json`, Probe gegen die WDS-Abstaende auf 0,5"). Theta2 Ori A und B stehen suedoestlich, NU Ori in M43 im Norden. E und F (V 11,1 und 10,0) sind bei Bortle 5 im Nebel nicht abgesetzt; ihre Helligkeiten sind bis 1,5 mag unsicher.
- **Nebel:** Huygens-Region, Fischmaul, M43 und der Ostfluegel sind ab 40-fach erkennbar; Beugungsspikes des Trapezes und Hoefe heller Feldsterne sind entfernt (Kreismasken, Kern um das Trapez dadurch flach).
- **Grenze:** Das Quellbild endet 800" um das Trapez (26,7' x 26,7', das groesste Quadrat um C in den Daten). Der Nebel ist am Rand mit 19,5 bis 20 mag/arcsec$^2$ noch heller als der Himmel bei Bortle 5; der Rand ist bei 40- und 48-fach als Quadrat sichtbar (kein weicher Randabfall, Entscheidung Herbert; `hinweis_hilfe` nennt es).
- **Gesamthelligkeit und Literatur:** Bild 2,55 mag, mit den neun Katalogsternen 2,26 (objekte.json 2,26); innerhalb 2,5' um das Trapez trifft das Bild die Umrechnung von O'Dell und Harris 2010 auf 0,02 mag, weiter aussen ist es 0,3 bis 0,7 mag schwaecher (physik.md 26, offen).

## 12. M13 (Issue #108)

Sterne plus Restlicht (`docs/recherche/physik.md` 27): 531 Gaia-Mitglieder bis V 15 als Punktquellen, das Quellbild (NOIRLab, Mayall 4 m, V-Kanal) traegt nur das Restlicht. Sichtpruefung am 2026-10-30 nach dem Review von PR #131 (Restlicht als L^1,85 mal Radialfaktor, alle Gaia-Quellen maskiert, Modell ab 2', Auslauf 8' bis 10', Fix von `sterne_entfernen` aus #106) mit einer Kopie von `scripts/validierung-bilder.mjs` (gleiche Mechanik, SwiftShader, eigene Faelle, Bortle 4 wie der Vorschlag 4 in `deep-sky.md` 8, M6 Bortle 8). Die Bilder sind nicht eingecheckt. T1 bis T6 und P1 bis P3 liefen mit demselben Bau ohne Konsolen- oder CSP-Fehler und waren byte-gleich mit den eingecheckten.

| Fall | Suchteil (dazu `&t=klar&h=90`) | Befund |
|---|---|---|
| M1 | `?v=1&g=fernglas-10x50&z=m13&s=2&b=4` | kleiner, weicher Fleck mit hellerer Mitte im 5-Grad-Feld, keine Einzelsterne (Mitte 51 gegen Himmel 41) |
| M2 | `?v=1&R(80,600,8)&z=m13&s=2&b=4` (75-fach) | schwacher runder Schimmer etwa 5' gross, darin einzelne Sterne; 50 Spitzen mindestens 8 Grauwerte ueber der Umgebung (vorher 66); keine Stufe am Rand der Leinwand |
| M3 | `?v=1&g=newton-200-1200&ok=8&z=m13&s=1.5&b=4` (150-fach) | koerniger Haufen, Sterne bis in den Kern aufgeloest; 294 Spitzen (vorher 349) |
| M4 | `?v=1&g=newton-300-1500&ok=7&z=m13&s=1.5&b=4` (214-fach) | dicht aufgeloest, 592 Spitzen (vorher 692); der Kern bleibt ein Gewimmel auf hellerem Grund |
| M5 | `?v=1&g=auge&z=m13&s=2&b=4` | an der Grenze: ein sehr schwacher Fleck (Mitte 46 gegen Himmel 45) |
| M6 | `?v=1&g=newton-200-1200&ok=8&z=m13&s=1.5&b=8` | wie M3, aber nur noch 59 Spitzen; der Schimmer hebt sich kaum vom hellen Himmel ab |

Die Spitzen sind grob gezaehlt (lokale Maxima im Gesichtsfeld, mindestens 8 Grauwerte ueber dem Median im 15-px-Fenster) und zaehlen auch Sterne knapp ueber der Schwelle; sie sind kein Vergleich mit Beobachtungen. Vorschlag 4 in `deep-sky.md` 8 erwartet am 200 mm "einige Dutzend bis gut hundert" Sterne und am 80 mm "hoechstens eine Handvoll"; die Simulation zeigt in beiden Faellen mehr. Ob das an der Grenzgroesse des Modells (Abschnitt 19) oder an der Erwartung liegt, ist offen; die Daten (Lage, V) folgen `deep-sky.md` 3.3. Im Zoom ist das Quellbild (Vergleichsbild, linear) fast schwarz, weil es nur das Restlicht traegt; dort stehen die Katalogsterne als Punkte (`architektur.md` 5.7, Vergleichsbild bei Deep-Sky offen). Doppelte Sterne (Bildstern neben Katalogstern) sind in keinem Fall zu sehen; im Restlicht bleiben zwischen 20" und 300" zwei Spitzen heller als V 15 (V 14,6 und 14,7, physik.md 27.3).

## 13. Helligkeit T12 (Issue #111)

Konstanten seit #111: Anzeigeweiss 8,9, Punktweiss 6,9 mag/arcsec$^2$ (Entscheidung Herbert 2026-10-30, ADR-0004 Nachtrag, Varianten in `docs/recherche/helligkeit-v2.md` 1.1). Alle Bilder unter `docs/validierung/` (T1 bis T6, T12, P1 bis P3) sind damit neu erzeugt (SwiftShader, keine Konsolen- oder CSP-Fehler). Messung an der Uebersicht nach `helligkeit-v2.md` 1 (Mittel der sRGB-Kanaele; Himmel = Median der dunkelsten 30 % im Gesichtsfeld; Scheibe = mehr als 15 Kodes ueber dem Himmel; P99 = 99. Perzentil der Scheibe), T4a und T4c zusaetzlich im Zoom. In Klammern der Stand mit 9,2 und 6,4 (main ddeb87b).

| Fall | Himmel | Scheibe Mittel | P99 | Max | auf Weiss begrenzt |
|---|---|---|---|---|---|
| T1 | 21 (23) | 124 (130) | 209 (218) | 211 | 0 |
| T2a / T2b | 21 / 20 | 99 / 91 | 148 / 141 (154 / 148) | 149 / 142 | 0 |
| T3 | 23 (24) | 145 (151) | 237 (247) | 255 | 0,15 % |
| T4a | 30 (31) | 156 | 255 | 255 | Zoom 12 % (25 %) |
| T4b / T4d | 18 (19) | 112 / 135 | 189 / 192 (197 / 199) | 191 / 194 | 0 |
| T4c | 30 (31) | 191 | 255 | 255 | Zoom 16 % (28 %) |
| T5a / T5b | 22 / 21 | 130 / 84 | 213 / 160 (222 / 166) | 221 / 163 | 0 |
| T6a Mond, blosses Auge | 51 (54) | 211 | 255 | 255 | 46 % (49 %) |
| T6b = T12b Jupiter, blosses Auge | 51 | 102 | 225 | 236 (224) | 0 |
| T6c Jupiter, 10x50 | 46 (49) | 93 | 212 | 212 | 0 |
| T12a Mond, 80 mm, 80-fach (AP 1 mm) | 25 (26) | 157 | **253** (255) | 255 | 0,7 % (1,7 %) |
| T12c Mars 14'', blosses Auge | 51 | 97 | 202 | 212 (199) | 0 |
| T12d Saturn 20'', blosses Auge | 51 | 86 | 168 | 175 (165) | 0 |

Trabanten (hellstes Pixel ausserhalb der Scheibe): T1 119 (111), T4a 147 (138), T6c 106 (101). Zusatzfaelle aus einer Kopie des Skripts (nicht eingecheckt): Mars 25'' mit blossem Auge 241, Jupiter 35'' 220; Mond am 80 mm P99 182 / 255 / 255 / 255 bei AP 0,5 / 2 / 4 / 6 mm (begrenzt 0 / 16 / 37 / 44 %); M31 mit blossem Auge Kern gegen Himmel 84 / 40 (Bortle 3), 85 / 51 (5), 87 / 67 (7).

**T12:**
- Mond am 80 mm bei AP 1 mm: hellstes Perzentil 253, nahezu Bildschirmweiss (Lesart "nahezu", Entscheidung Herbert); die Zonen des Hochlands sind weiss, Struktur bleibt sichtbar. **Erfuellt.**
- Jupiter mit blossem Auge im Kern 236, nahezu weiss; Mars 14'' 212 und Saturn 175 dunkler, die Abstufung folgt der Magnitude (Mars 25'' mit -3,0 mag 241, heller als Jupiter). Mars 14'' liegt 24 Kodes unter Jupiter; mehr laesst die Kubikwurzel bei 1,3 mag Unterschied nicht zu (linear hoechstens 0,67-fach, ber.). **Erfuellt.**
- Himmel am Fernrohr bei Bortle 5: 18 (AP 0,5 mm) bis 30 (AP 1,5 mm), bei AP 1 mm 25; Prototyp 26 bis 28. Mit blossem Auge 40 / 51 / 67 bei Bortle 3 / 5 / 7 (Prototyp 42 / - / 70). **Erfuellt.**
- Monotonie in der AP (A-P4): P99 und Mittel des Monds steigen mit der AP. **Erfuellt.**

**T1 bis T6 mit den neuen Konstanten** (Sichtpruefung von T4a, T4c, T12a, T12b; die uebrigen Bilder sind nur heller oder dunkler, die Tabellen-Tests aus Abschnitt 3 haengen nicht an den Konstanten): T4a und T4c zeigen Baender, GRF in seiner Farbe und in T4c die weissen Ovale; in T4a sind die hellen Zonen teils auf Weiss begrenzt (etwa ein Achtel der Scheibe, ADR-0004 erwartete ein Fuenftel). Der Unterschied T4c gegen T4d (mehr Detail bei 300 mm) bleibt deutlich. Urteile wie in Abschnitt 2, alle **erfuellt**.

**Offen, eigene Issues:** das helle Quadrat (etwa 28 x 28 Anzeigepixel, Kante 90 gegen Himmel 51) um unaufgeloeste Planeten mit blossem Auge in T6b und T12b bis T12d (#135, behoben, siehe unten); M32 mit blossem Auge als sichtbarer Fleck (#136, behoben, Abschnitt 10 Nachtrag). Beides haengt nicht an den Konstanten (`helligkeit-v2.md` 1.1, Nebenbefunde).

**Quadrat um unaufgeloeste Planeten (Issue #135).** Ursache und Abhilfe in `physik.md` 28: der Mischanteil nimmt das Objekt, gefaltet mit dem Kern mal $w^{1/n}$. Messung an der Uebersicht wie oben (Mittel der Kanaele, Himmel 51), vorher = main 0c6fd21, nachher = dieser Stand, beide SwiftShader:

| Fall | Scheitel | Rand des Quadrats (Ring 13 bis 14 px) | Ecken des Quadrats (11 bis 13 px auf beiden Achsen) | Halo ueber Himmel + 2 |
|---|---|---|---|---|
| T6b = T12b Jupiter | 236 / 236 | 84 / 62 | 82 / 52 | 32 x 31 / 28 x 28 px |
| T12c Mars 14'' | 212 / 212 | 76 / 54 | 78 / 51 | 28 x 28 / 26 x 26 px |
| T12d Saturn 20'' | 175 / 175 | 71 / 57 | 69 / 51 | 30 x 28 / 28 x 24 px |

Die Kernwerte sind unveraendert (innen ist der Halokern bitgleich mit dem Kern). In den Ecken, wo vorher nur das Quadrat Licht hatte, liegt das Bild hoechstens 1 Kode ueber dem Himmel; der runde Halo laeuft auf der Achse ueber drei bis vier Pixel in Schritten von 9, 7, 3 und 1 Kodes auf den Himmel aus (T6b: 71, 62, 55, 52, 51). Am Rand der Achse liegt er noch im Ring des alten Quadrats, ist dort aber rund und ohne Stufe (Sichtpruefung der Uebersichten und Zooms von T6b, T12b bis T12d: kein Quadrat). **Erfuellt.**

Geaendert sind ausserdem T5b (Mars 6'' bei 120-fach, $g$ = 0,0147) und T6c (Jupiter im 10x50): beide liegen im Fall unaufgeloest, der schwache Mischanteil im aeusseren Drittel des Kerns faellt weg. Alle geaenderten Pixel werden dunkler, um hoechstens 2 (T5b) bzw. 1 Kode (T6c) in der Uebersicht und 2 bzw. 3 Kodes im Zoom, ueberwiegend im schwachen Halo (Median der alten Helligkeit an den geaenderten Pixeln im Zoom 27 bzw. 74); Scheitel 163 und 212 unveraendert. Alle uebrigen Bilder (T1 bis T5a, T6a, P1 bis P3, T12a) sind bytegleich. Sichtpruefung T1 und T4a: unveraendert.
