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
| T5a | `?v=1&R(150,1200,6)&z=mars_14&s=1.5&B` | 1,72'' | Syrtis 0,429 | [Uebersicht](validierung/T5a-uebersicht.png), [Zoom](validierung/T5a-zoom.png) |
| T5b | `?v=1&R(80,960,8)&z=mars_6&s=1.5&B` | 2,15'' | Syrtis 0,060 | [Uebersicht](validierung/T5b-uebersicht.png), [Zoom](validierung/T5b-zoom.png) |
| T6a | `?v=1&g=auge&z=mond_ev&s=2&B` | 63,1'' | Mare 0,398 | [Uebersicht](validierung/T6a-uebersicht.png), [Zoom](validierung/T6a-zoom.png) |
| T6b | `?v=1&g=auge&z=jup_47&s=2&B` | 63,1'' | - | [Uebersicht](validierung/T6b-uebersicht.png), [Zoom](validierung/T6b-zoom.png) |
| T6c | `?v=1&g=fernglas-10x50&z=jup_47&s=2&B` | 6,74'' | Baender 0,080 | [Uebersicht](validierung/T6c-uebersicht.png), [Zoom](validierung/T6c-zoom.png) |

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

### T6: Mond und Jupiter mit blossem Auge, Jupiter im 10x50

Erwartung: Mond mit Mare als Flecken, keine Krater; Jupiter mit blossem Auge ein Punkt; im 10x50 ein winziges Scheibchen mit zwei bis vier Monden in einer Linie, keine Baender.

Bild: Mond mit klaren Mare-Flecken, keine Krater (T6a). Jupiter mit blossem Auge ein Punkt ohne Monde, die Blendungsregel unterdrueckt alle vier (T6b). Im 10x50 ein Scheibchen von etwa zwei Anzeigepixeln mit vier Monden in einer Linie, im Anzeigewert 49 bis 59 gegen den Himmel 16 (sRGB, linear etwa zehnfach); im Zoom ein schwacher Hauch des NEB (Delle 0,080, unter der Schwelle). Gesichtsfeld beim blossen Auge rechteckig.

**Urteil: erfuellt.**

## 3. Kontrastschwelle "erkennbar"

| Delle | Fall und Struktur | im Bild |
|---|---|---|
| 0,549 | T3 Kraterschatten 4 km | erkennbar (aus der Delle, im Bild nicht pruefbar) |
| 0,429 | T5a Syrtis Major 14'' | erkennbar |
| 0,398 | T6a Mare, blosses Auge | erkennbar |
| 0,142 | T1 Baender 70 mm | erkennbar |
| 0,139 | T4c Detail 1,5'', 300 mm, 1'' | erkennbar |
| 0,112 | T4d Detail 1,5'', 100 mm, 1'' | nicht (Herbert, 2026-10-27: "kaum" zaehlt als nicht) |
| 0,080 | T6c Baender 10x50 | nicht |
| 0,066 / 0,061 | T4a / T4b Detail 1,5'' bei 3'' | nicht |
| 0,060 | T5b Syrtis Major 6'' | nicht |
| 0,058 | T3 Hadley-Rille | nicht |
| 0,000 | T2a / T2b Cassini-Teilung | nicht |

Zulaessig ist jede Schwelle zwischen 0,112 und 0,139. **`SCHWELLE_ERKENNBAR` = 0,125** (geometrisches Mittel, `src/physik/konstanten.ts`). Der Abstand zu beiden Seiten ist etwa 10 %; die Tabellen-Tests werden also bei einer Modellaenderung rot, die eine Delle um mehr als etwa 10 % verschiebt. Gegenprobe: mit 0,25 schlagen T1 und T4c fehl, mit 0,0625 T4a, T4d und T6c.

Die Schwelle ist eine Kalibrierkonstante fuer die Tests, keine Physik: das Bild haengt nicht davon ab. Sie gilt fuer die Delle im linearen Leuchtdichteprofil; die Anzeige komprimiert das Niveau mit dem Exponenten 1/3, nicht den Kontrast innerhalb des Objekts (physik.md 12.3).

## 4. Abweichungen

Als Issues angelegt am 2026-10-27, Milestone M3 (Herbert, 2026-10-27):

1. **#76, T2: Cassini-Teilung bei 100 mm und Seeing 1,5'' nicht sichtbar.** Das Modell faltet mit dem Langzeit-Seeing (Moffat mit voller FWHM); Beobachter sehen die Teilung in Momenten ruhiger Luft. Zu klaeren, ob die Erwartung fuer Langzeit-Seeing zu optimistisch ist oder ob das Seeing-Modell fuer visuelle Beobachtung zu streng ist. Bezug: #29 (Kann: Umschalter ruhiger Moment), physik.md 2. **Erledigt 2026-10-27:** Erwartung zu optimistisch, Modell bleibt, A-Q2 T2 angepasst. Ein Tilt-Abzug haette T4d und T5b ueber die Schwelle gehoben (physik.md 15).
2. **#77, T3: Mond-Zoom zu grob fuer die Aufloesungsgrenze.** Der Zoom zeigt beim Mond das halbe Gesichtsfeld (`ZOOM_ANTEIL_GESICHTSFELD_MAX`); bei 80 mm und 100-fach sind das etwa 1,7'' je Anzeigepixel, die Optik loest etwa 1'' je Arbeitspixel auf. Die Grenze von A-Q2 (Krater ab 4 km) ist so nicht zu sehen. Vorschlag: zweite Zoomstufe oder Zoom bis zum Arbeitsmassstab. **Erledigt 2026-10-28:** zweite Ansicht "Detail" in der Zoomansicht (Herbert, 2026-10-28), 120 Arbeitspixel breit, nur angeboten, wo sie hoechstens drei Viertel des Zoomfensters zeigt (praktisch nur beim Mond); T3 erfuellt.
3. **#78, T5: Mars-Quellbild ohne Polkappe.** Hubble 2016-05-12 (mars_14 und mars_6) zeigt keine abgegrenzte Kappe; "Polkappe erkennbar" ist damit nicht pruefbar. Vorschlag: anderes Bild fuer die Aphel-Opposition (Nordfruehling, grosse Nordkappe, objekte.md 4.4).
4. **#79, T1: Quellbild Jupiter kontrastreicher als visuell.** Baender etwa 0,7 statt 0,82 der Zonenhelligkeit (Orton [56]), GRF kraeftig orange; der GRF erscheint im 70 mm deutlich statt angedeutet. Vorschlag: Kontrast und Farbsaettigung des Quellbilds in `tools/` an die Photometrie angleichen, oder die Erwartung begruenden. Aus #76 dazu: Saturn-A-Ring im Quellbild 0,50 (innen) und 0,21 (aussen) des aeusseren B-Rings, vermutlich ebenfalls zu dunkel; selbst im ruhigen Moment zeigt er die Cassini-Teilung kaum (physik.md 15.4). **Erledigt 2026-10-28:** Jupiter mit Exponent 0,427 an Orton angeglichen (NEB/NTrZ 0,82), Saturn mit einer Tonkurve an Salo und French 2010 (eine Potenzkurve passt dort nicht); Quellweiss neu geeicht, T1 erfuellt, T2 weiter erfuellt.

## 5. Pruefpunkte aus Welle 4a

- **Trabantenhelligkeit haengt am Arbeitsmassstab** (physik.md 14.7 Punkt 1, Anzeige proportional s^(-2/3)): im 10x50 sind die vier Monde deutlich sichtbar (49 bis 59 gegen 16), in T1 (70 mm) 58 bis 69 gegen 5. Plausibel; die Monde liegen in keinem der Zoomausschnitte, der Unterschied Zoom gegen Uebersicht ist hier nicht zu sehen. Kein Issue.
- **Mondmagnitude** (objekte.md 7.16): mond_ev hat -10,2 mag, Krisciunas und Schaefer geben fuer den Phasenwinkel 78,5 Grad -10,54. Der Unterschied ist Leuchtdichte 1,37-fach, im Anzeigewert 1,11-fach. In T3 und T6a wirkt der Mond weder zu hell noch zu dunkel; das Bild entscheidet die 0,34 mag nicht. Kein Issue, die Werte bleiben.
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

