---
status: proposed
datum: 2026-10-29
---

# Helligkeit und Wahrnehmungsschwelle: drei Ebenen mit eigener Abbildung, Schwelle nach Crumey vor der Abbildung

Entwurf aus Phase 2 Version 2 (`docs/recherche/helligkeit-v2.md`, `docs/recherche/wahrnehmung.md` Abschnitt 4.4). Phase 3 uebernimmt oder ueberarbeitet ihn; entschieden sind bisher nur die mit "entschieden" markierten Punkte. Ergaenzt ADR-0002 (Simulationsmodell) und `docs/recherche/physik.md` Abschnitte 12 und 14, ersetzt sie nicht.

Version 1 bildet Objekt und Himmel getrennt mit einer Stevens-Potenz ab (`physik.md` 12.3), Punktquellen je Pixel (14.2). Fuer Version 2 kommen drei Dinge dazu: Deep-Sky-Flaechen nahe der Himmelshelligkeit (A-Z10), eine Wahrnehmungsschwelle fuer alle Objekte (A-P11) und unaufgeloeste Zustaende als Punktquelle (A-P10). Die getrennte Abbildung traegt fuer Deep-Sky nicht: der angezeigte Kontrast haengt an der willkuerlichen Wahl von Quellweiss, der Aussenbereich von M31 erschiene bis Faktor 15 zu schwach (`wahrnehmung.md` 4.2). Eine gemeinsame Abbildung fuer alle Objekte wuerde den Binnenkontrast von Mond und Planeten je Pixel komprimieren, den die Faltung richtig wiedergeben soll (`physik.md` 12.3, verworfen).

## Festlegungen

- **Drei Ebenen.** (a) Sonnensystem-Flaechen wie bisher: Pixel $= q \cdot w(\mu_\mathrm{obj}) + w(\mu_\mathrm{Himmel})$, Binnenkontrast linear. (b) Deep-Sky-Flaechen gemeinsam mit dem Himmel: Pixel $= \min\big(1, (a\,q + s)^{n}\big)$ mit $a$ und $s$ als Leuchtdichte von Quellweiss und Himmel im Okular relativ zum Anzeigeweiss. (c) Punktquellen (Trabanten, Sterne, unaufgeloeste Planeten) je Pixel wie `physik.md` 14.2.
- **Konstanten (entschieden, Herbert 2026-10-29):** `KOMPRESSIONSEXPONENT` $n$ = 1/3 fuer alle Ebenen. Anzeigeweiss etwa 9,2 mag/arcsec$^2$ fuer die Flaechenebenen und den Himmel (Mond am Fernrohr bei AP 1 mm: hellstes Perzentil Bildschirmweiss, A-P13 i), eigenes Weiss der Punktebene etwa 6,4 mag/arcsec$^2$ (Jupiter mit blossem Auge nahezu weiss, Mars und Saturn abgestuft, A-P13 ii). Die genauen Werte werden nach der Umsetzung von A-P10 am Bild nachgemessen (`helligkeit-v2.md`).
- **Schwelle vor der Abbildung, in physik.** Kontrastschwelle nach Crumey 2014 (Gl. 47 Auge und Fernglas, Gl. 77 bis 88 Fernrohr), Feldfaktor $F$ = 2 (entschieden, typischer Beobachter), $F_T = \sqrt2$ am Fernrohr. Deep-Sky: die schwaechste sichtbare Isophote nach Crumeys Verfahren (Isophote mit eingeschlossener Flaeche gegen die Schwelle dieser Flaeche); darunter zeigt der Anblick Himmel. Sterne: Grenzgroesse aus Gl. 68 bzw. 88 mit Seeing-Scheibchen. Sonnensystem: liegt in Version 2 stets ueber der Schwelle (Himmel mindestens 8,9 mag dunkler), die Schwelle wirkt dort nur auf Trabanten.
- **Gleitend.** Deckkraft nach Blackwells Wahrscheinlichkeitskurve $P = \Phi\big((C/C_\mathrm{th} - 1)/0{,}484\big)$, fuer Sterne mit $C/C_\mathrm{th} = 10^{-0{,}4(m - m_\mathrm{lim})}$; kein Sprung beim Aendern der Vergroesserung.
- **Mindestsichtbarkeit.** Ein Deep-Sky-Pixel an der Schwelle liegt mindestens $\Delta_\mathrm{min}$ sRGB-Kodes ueber dem Himmel (Vorschlag 3); dafuer ein fester Verstaerkungsfaktor $G \ge 1$ je Objekt und Konfiguration, der die Monotonie im Objekt erhaelt. $\Delta_\mathrm{min}$ legt Herbert am Bild fest.
- **Unaufgeloest (A-P10).** Mischung zwischen Flaechen- und Punktebene mit $g = 1/(1 + 0{,}3466\,x^2)$, $x = \theta V / 60''$ ($\theta$ Winkelgroesse, $V$ Vergroesserung); der Fluss bleibt erhalten.
- **Sternfarbe (A-P12).** B-V ueber Ballesteros 2012 zu $T$, $T$ ueber Planck und CIE 1931 zu linearem sRGB (D65, $Y$ = 1); Farbe nur ab $3{,}1\cdot10^{-7}$ lx am Auge, darunter grau. Deep-Sky-Flaechen grau.

## Folgen

- T1 bis T6 bleiben im Modell gueltig (Ebene a unveraendert bis auf das Anzeigeweiss); die Validierungsbilder werden heller und neu erzeugt, in T4a (300 mm, AP 1,5 mm) wird ein Fuenftel der Jupiterscheibe auf Weiss begrenzt.
- Der Himmel wird mit dem neuen Anzeigeweiss etwa sechsfach heller (am 80/600 bei Bortle 5 sRGB etwa 30 statt 7); am Bild pruefen.
- Neue reine Funktionen in `src/physik/`: Kontrastschwelle, Grenzgroesse, sichtbare Isophote, Deckkraft, Mischgewicht, Sternfarbe; Testwerte aus `wahrnehmung.md` 6.

## Verworfen

- Getrennte Abbildung auch fuer Deep-Sky (Kontrast haengt an Quellweiss).
- Gemeinsame Abbildung fuer alle Objekte (Binnenkontrast je Pixel komprimiert, T1 bis T5 neu).
- Gemeinsame Abbildung ohne eigenen Schwellenschritt (Objekte knapp ueber der Schwelle auf dem Schirm unsichtbar).
- Harter Schnitt an der Schwelle (Spruenge beim Aendern der Vergroesserung).
- Schwelle je Pixel mit fester Detailgroesse (um Groessenordnungen zu streng fuer grosse schwache Flaechen).
- Adaptionsabhaengiges Tone-Mapping (Adaption ist nach A-P9 keine Eingabe).
- Ein gemeinsames Weiss fuer Flaechen und Punkte (A-P13 i und ii nicht zugleich erreichbar, `helligkeit-v2.md` 3).
