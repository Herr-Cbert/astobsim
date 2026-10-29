<!-- Entwurf eines Subagenten (Design it twice, Version 2, Variante A "minimal-additiv"), 2026-10-29. Vergleich mit Variante B und Entscheidung: docs/architektur.md -->

# Naht physik -> bild fuer Version 2, Variante A: minimal-additiv

Leitidee: Die vier Stufen aus `docs/architektur.md` 3 bleiben, kein neuer Typ an der Naht ausser `Objektklasse`, `Stern`, `Isophote` und `Paareingaben`. Ein Objekt ist genau einer Objektklasse; deshalb braucht bild keine Ebenenliste, sondern **ein** Objektraster, **eine** Punktebene und **eine** Pixelformel, die an genau zwei optionalen Feldern von `Helligkeit` verzweigt (`deepSky` vorhanden, `mischgewicht > 0`). Fehlen die neuen Felder, rechnet bild den Ausdruck aus Version 1 Zeichen fuer Zeichen.

## 1. Typen (Diff gegen `src/naht/`)

```ts
// src/naht/konfiguration.ts
+export const OBJEKTKLASSEN = ["sonnensystem", "doppelstern", "deep_sky"] as const;
+export type Objektklasse = (typeof OBJEKTKLASSEN)[number];
+/** Stern eines Doppelsterns oder Deep-Sky-Objekts: Lage wie Trabant, ohne Durchmesser, mit B-V. */
+export interface Stern { name: string; dxArcsec: number; dyArcsec: number; magnitude: number; bv: number }
+/** Eine Zeile der Flaechentabelle: Isophote (mag/arcsec^2, Himmel V) und eingeschlossene Flaeche. */
+export interface Isophote { magProArcsec2: number; flaecheArcsec2: number }
+/** Eingaben des freien Paars (A-Z9); Quelle der Wahrheit fuer URL und begrenze. */
+export interface Paareingaben { trennungArcsec: number; magnitudeA: number; magnitudeB: number; bvA: number; bvB: number }
 export interface Objektzustand {
   kennung: string;
+  klasse: Objektklasse;                // aus objekte.json "typ": mond|planet -> sonnensystem
   durchmesserArcsec: number;           // Doppelstern: groesster Sternabstand (nur Anzeige)
   magnitude: number;                   // Doppelstern: Gesamthelligkeit
-  quelle: { breitePx; hoehePx; massstabArcsecProPx; weissMagProArcsec2 };
+  quelle?: { breitePx; hoehePx; massstabArcsecProPx; weissMagProArcsec2 };  // fehlt: Doppelstern, M45
   trabanten: Trabant[];                // nur sonnensystem
+  sterne: Stern[];                     // doppelstern, deep_sky; sonst []
+  isophoten?: Isophote[];              // nur deep_sky mit Quellbild; mag aufsteigend, Flaeche steigend
+  paar?: Paareingaben;                 // nur das freie Paar (kennung "frei")
 }
```

```ts
// src/naht/simulationsparameter.ts
 export interface Punktquelle {
   name: string; xArcsec: number; yArcsec: number; durchmesserArcsec: number; helligkeitRelativ: number;
   sichtbar: boolean;
-  grund?: "blendung";
+  grund?: "blendung" | "unter_schwelle";   // unter_schwelle: deckkraft < 1e-3, nicht gemalt
+  deckkraft?: number;                      // (0, 1], Blackwell; fehlt = 1
+  farbe?: [number, number, number];        // linear sRGB, Y = 1 (A-P12); fehlt = grau
 }
 export interface Helligkeit {
   schluessel: string;
-  faktorObjekt: number; hintergrundRelativ: number; hintergrundMagProArcsec2: number;
-  punktFaktor: number; punktExponent: number;   // faktorObjekt = punktFaktor^punktExponent
+  faktorObjekt: number;          // f: Anzeigehelligkeit von Quellweiss, Anzeigeweiss 9,2 (A-P13 i)
+  hintergrundRelativ: number;    // h = min(1, s^n)
+  hintergrundMagProArcsec2: number;
+  punktFaktor: number;           // aP: Leuchtdichte Quellweiss relativ zum Punktweiss 6,4 (A-P13 ii)
+  punktExponent: number;         // n = 1/3; die Gleichung f = aP^n gilt nicht mehr (zwei Weiss)
+  mischgewicht: number;          // g in [0, 1) (A-P10); 0 = Flaeche wie V1; nur sonnensystem
+  deepSky?: {                    // nur deep_sky mit Isophoten (ADR-0004 Ebene b)
+    faktor: number;              // G * a: Leuchtdichte Quellweiss im Okular rel. Anzeigeweiss, verstaerkt
+    himmel: number;              // s: Leuchtdichte Himmel im Okular rel. Anzeigeweiss, linear
+    schwelleRelativ: number;     // q*: Pixelwert (rel. Quellweiss) an der sichtbaren Isophote
+    breite: number;              // 0,484 aus Blackwells Kurve (physik-Konstante, nicht in bild)
+  };
 }
```

```ts
// src/physik/auswerten.ts
 export interface Anzeigewerte { /* V1-Felder unveraendert */
+  grenzgroesseMag: number;                       // Sterne am Okular, inkl. Extinktion (A-P11)
+  isophote?: { magProArcsec2: number; flaecheArcsec2: number; alleSichtbar: boolean };  // deep_sky
 }
 export interface Warnung {
-  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d";
+  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d" | "ueberstrahlung";  // wert |Delta m|, grenze 4
   wert: number; grenze: number;
+  sterne?: [string, string];                     // nur ueberstrahlung: welches Paar
 }
```

**Freies Paar: physik baut, zustand und ui rufen.** `freiesPaar(e: Paareingaben): Objektzustand` (physik, rein) setzt `kennung "frei"`, `klasse "doppelstern"`, A bei -rho/2, B bei +rho/2 (Ost-West), Gesamtmagnitude, `paar: e`. Gruende: die Gesamtmagnitude ist eine Formel (physik), und `begrenze` als einzige Stelle fuer Bereiche (A-F8) muss nach dem Schneiden von `paar` die Sterne neu bilden; physik darf daten nicht importieren. daten liefert nichts (kein Katalogeintrag), zustand liest `z=frei` plus Zahlen und ruft `freiesPaar`, ui ebenso aus dem Formular. Analog zu `mitOkular` beim freien Geraet.

## 2. Pixelformel (Vertrag fuer `tonwert`, je Arbeitspixel)

Eingaben: `q` gefaltetes Objektraster (1 oder 3 Kanaele, rel. Quellweiss), `p` gefaltete Punktebene (1 Kanal, Fluss), neu optional `w` gefaltete **Faerbung** (3 Kanaele: Summe je Stern Fluss mal Deckkraft mal Farbe, mit demselben Kern lokal in `punktebene.ts` gefaltet). Abkuerzungen aus `Helligkeit`: f, h, aP, n, g, d = deepSky.

| Fall | Flaechenanteil `F_k` |
|---|---|
| `d` fehlt, g = 0 | `f * q_k + h` (V1, gleicher Ausdruck, gleiche Reihenfolge) |
| `d` fehlt, g > 0 | `(1 - g) * f * q_k + h + g * min(1, (aP * q_k)^n)` |
| `d` vorhanden | `P = Phi((q / d.schwelleRelativ - 1) / d.breite)`; `F = h + P * (min(1, (d.faktor * q + d.himmel)^n) - h)` |

Punktanteil, nur wo `p > 0`: `W = min(1, (aP * p)^n)`; `Pixel_k = F_k + (w ? w_k / p : 1) * W`. Ohne `w` (alle Punktquellen grau und Deckkraft 1) ist das der V1-Ausdruck. Gibt es `w`, hat das Ergebnis 3 Kanaele (ein 1-Kanal-`q` wird verbreitert). `Phi` (Normalverteilung) ist allgemeine Mathematik in bild; alle physikalischen Konstanten kommen ueber die Naht.

**Bitgleichheit T1 bis T6.** `mischgewicht` ist stetig abgeschnitten: `g = max(0, (g_roh - g0) / (1 - g0))`, `g0 = 0,005`, also exakt 0 fuer `x = theta V / 60'' > 24` ohne Sprung. Damit ist g = 0 fuer T1 (Jupiter 100x, x = 78), T2 (Saturn 150x, x = 50), T3 (Mond), T4 (Jupiter ab etwa 100x) und T5 Mars 14'' (200x, x = 47); dort bleibt `tonwert` bitgleich bis auf die neuen Konstanten f, h und aP. Regressionstest: mit `ANZEIGE_WEISS = 3,35` und `PUNKT_WEISS = 3,35` liefert V2 fuer T1 bis T5 dieselben Bytes wie V1. Gewollt anders: T6 (Jupiter mit blossem Auge g = 0,82, im 10x50 g = 0,04) und T5 Mars 6'' am 80 mm, falls V < 240 (x < 24, g bis 0,03).

## 3. Neue reine Funktionen in `src/physik/`

| Datei | Funktion | Quelle |
|---|---|---|
| `schwelle.ts` | `leuchtdichteCdM2(magProArcsec2): number` | wahrnehmung.md 6 |
| | `kontrastschwelle(flaecheArcmin2: number, bCdM2: number): number` (Gl. 47, F = 1, Nullhintergrund 1e-5) | 1.2 |
| | `schwelleAmOkular(o: Optik, a: Atmosphaere, muHimmel: number, flaecheArcsec2: number): number` (Gl. 77 bis 80, F = 2, F_T = sqrt 2 nur Fernrohr) | 1.4 |
| | `grenzgroesse(o: Optik, a: Atmosphaere, muHimmel: number, seeingFwhmArcsec: number): number` (Gl. 68/88, Scheibe 2,8 FWHM, Extinktion) | 2.1, 2.2 |
| | `sichtbareIsophote(t: Isophote[], o, a, muHimmel): { magProArcsec2; flaecheArcsec2; kontrastSchwelle; alleSichtbar }` | 4.4 Punkt 2 |
| | `deckkraft(verhaeltnis: number): number` = Phi((r - 1)/0,484); `deckkraftStern(m, mLim)` mit r = 10^(-0,4 (m - mLim)) | 4.4 Punkt 3 |
| `mischung.ts` | `mischgewicht(winkelgroesseArcsec: number, vergroesserung: number): number` (mit Schnitt g0) | 3.2 |
| | `verstaerkung(a: number, s: number, qSchwelle: number, deltaMinSrgb: number, n: number): number` (G >= 1) | 4.4 Punkt 4 |
| `sternfarbe.ts` | `bvZuTemperatur(bv)`, `temperaturZuRgb(t): [r,g,b]` (Y = 1, Tabelle in 0,1-Schritten B-V), `beleuchtungAmAugeLx(m, o, a)`, `sternfarbe(bv, lx): [r,g,b] \| undefined` (undefined unter 3,1e-7 lx) | 5.1 bis 5.3 |
| `doppelstern.ts` | `freiesPaar(e: Paareingaben): Objektzustand`, `ueberstrahlung(sterne: Stern[]): Warnung[]` (Abstand < 10'' und \|Delta m\| >= 4) | doppelsterne.md 3.2, 5 |

`sichtbareIsophote` geht die Tabelle von hell nach schwach und sucht den Vorzeichenwechsel von `mu_i - mu_lim(alpha_i)`; der Schnittpunkt wird linear in mu und log alpha interpoliert, damit q* stetig in V und Bortle ist. Ist alles sichtbar, gilt die letzte Zeile (`alleSichtbar`); ist nichts sichtbar, die erste (dann P < 0,5 ueberall, Objekt verblasst gleitend). Daraus `q* = 10^(-0,4 (mu* - weiss))`; G aus der Bedingung "bei P = 0,5 liegt das Pixel `deltaMinSrgb` Kodes ueber h": `0,5 ((G a q* + s)^n - h) >= Delta_lin`, `Delta_lin = linear(srgb(h) + Delta_min) - h` (sRGB-Kodierung als reine Funktion in physik).

**Aufrufe in `auswerten`** (Reihenfolge V1, Ergaenzungen fett):
`optik -> atmosphaere -> aufloesung -> fenster -> arbeitsmassstab` (ohne `quelle` faellt die Quellgrenze weg) `-> kernbeschreibung -> baueKern ->` **`grenzgroesse`** `-> punktquellen(objekt, o, a, mLim)` (Trabanten **und Sterne**; Sterne mit `STERN_DURCHMESSER_ARCSEC = 0,001`, `deckkraftStern`, `sternfarbe`; Objektmitte ist Blender nur bei `sonnensystem`) `-> helligkeit(o, a, bortle, objekt)` (intern **`mischgewicht`**, bei deep_sky **`sichtbareIsophote`**, **`verstaerkung`**) `-> anzeige -> warnungen +` **`ueberstrahlung`**. Ohne `quelle` gilt fuer `helligkeitRelativ` die Bezugsflaeche `PUNKT_WEISS`.

**Schluessel:**

| Stufe | Aenderung |
|---|---|
| 1 Quellbild | je gemalter Punktquelle zusaetzlich `deckkraft` und `farbe`; Kennung bleibt `objekt.kennung` (`frei` mit den Paareingaben im Schluessel) |
| 2 Kern | unveraendert; bild bildet weiter `kern|quellbild` |
| 3 Helligkeit | zusaetzlich `mischgewicht` und die vier `deepSky`-Felder; neue Konstanten wirken ueber f, h, aP |
| 4 Fenster | unveraendert |

## 4. Wo die Deckkraft wirkt

Deep-Sky: **Schwelle je Objekt, Anwendung je Pixel.** Die Schwelle haengt an der Flaeche des zusammenhaengenden Gebiets, nicht am Pixel (wahrnehmung.md 4.4, "Schwelle je Pixel mit fester Detailgroesse" verworfen: um Groessenordnungen zu streng). physik bestimmt deshalb aus der Isophotentabelle einen Schwellenkontrast je Objekt und Konfiguration und reicht ihn als Pixelwert q* weiter; da `C = a q / s` linear in q ist, gilt `C / C_th = q / q*`, und bild braucht weder a noch s fuer die Deckkraft. Eine reine Objekt-Deckkraft wuerde M31 nur im Ganzen ein- und ausblenden; T11 (Bortle 7: "nur Kern sehr undeutlich") verlangt den raeumlichen Schnitt an der Isophote. Sterne und Trabanten: Deckkraft je Punktquelle aus `m - m_lim`, ueber die Faerbung als flussgewichtete Deckkraft je Pixel. Sonnensystem-Flaechen: keine Deckkraft (stets ueber der Schwelle, ADR-0004).

## 5. Auswirkungen auf die Module

| Modul | Aenderung |
|---|---|
| daten | `objekte.ts`: `OBJEKTTYPEN` + `doppelstern`, `deep_sky`; Felder `sterne` (`b_v`), `isophoten` (`[{mag_arcsec2, flaeche_arcsec2}]`, streng monoton), `positionswinkel_grad`, `profil`, `katalog`; `bild` optional fuer doppelstern und M45. `objektzustand()` setzt `klasse`, `sterne`, `isophoten`, `quelle` nur mit Bild. `bildnachweise.ts`: `kennlinie: { art: "log", mag_hell, mag_dunkel }`; Dekodierung 8 Bit -> `10^(-0,4 (mu(v) - weiss))`, v = 0 -> 0, als 256er-Tabelle wie `srgb.ts`, Einzelbild und Kacheln behalten 8 Bit im Cache. Neue `QuelleLeer` (Schwarz) fuer Zustaende ohne Bild. Nachweis der Sterndaten (CC BY-NC 3.0 IGO). Pruefung: Isophoten-Bereich liegt in der Kennlinie des Bilds. |
| zustand | `z=frei` mit `ds` (Trennung), `ma`, `mb`, `ca`, `cb` (B-V), nur bei `z=frei` geschrieben; Rueckfall auf die Vorgaben 2'', 5, 6, 0,6, 0,6. `v=1` bleibt (rein additiv, alte Links gueltig). `begrenze` schneidet `paar` und baut die Sterne neu. |
| ui | Objektauswahl gruppiert nach `klasse` (A-D18, `<optgroup>`), Paar-Eingaben nur bei `frei`; Infopanel: Grenzgroesse, bei deep_sky sichtbare Isophote, Warnung `ueberstrahlung`, Punktquellen mit `grund` unter_schwelle/blendung im Hilfetext; Steuerung waehlt `QuelleLeer` ohne `quelle`. Texte in `texte.ts`. |
| bild | `tonwert` nach Abschnitt 2; `male.ts` liefert je Scheibchen zusaetzlich Deckkraft und Farbe; `punktebene.ts` faltet bei Bedarf die 3-Kanal-Faerbung mit (Fehlt sie, unveraendert). Zwischenspeicher Stufe 2 bekommt `faerbung`. |
| Falter | **unveraendert.** WebGL2 und JS falten nur das Objektraster (Deep-Sky 1 Kanal, geht heute schon); Punktebene und Faerbung faltet `punktebene.ts` in JS. Punktebene bleibt 1 Kanal (Fluss fuer die Kompression), Farbe und Deckkraft stecken in der optionalen Faerbung. |

## 6. Zuordnung Muss-V2-Anforderungen

| Anforderung | Feld oder Funktion |
|---|---|
| A-Z9 Doppelsterne, freies Paar | `klasse "doppelstern"`, `sterne`, `Paareingaben`, `freiesPaar`, `ueberstrahlung` -> `Warnung "ueberstrahlung"`; Punktebene wie Trabanten |
| A-Z10 Deep-Sky | `klasse "deep_sky"`, `isophoten`, `Helligkeit.deepSky`, `sichtbareIsophote`, `verstaerkung`; Sterne M45/Trapez ueber `sterne` |
| A-P10 unaufgeloest | `mischgewicht` -> `Helligkeit.mischgewicht`, Zeile 2 der Pixelformel |
| A-P11 Schwelle, Grenzgroesse | `kontrastschwelle`, `schwelleAmOkular`, `grenzgroesse` -> `Anzeigewerte.grenzgroesseMag`, `deckkraft`, `grund "unter_schwelle"` |
| A-P12 Farbe | `sternfarbe` -> `Punktquelle.farbe`, Faerbung; Deep-Sky 1 Kanal grau |
| A-P13, A-P4 V2 | Konstanten `ANZEIGE_WEISS_MAG_PRO_ARCSEC2 = 9,2`, neu `PUNKT_WEISS_MAG_PRO_ARCSEC2 = 6,4` in `helligkeit()`; Monotonie in AP unveraendert |
| A-B2 V2 | `muHimmel` aus Bortle geht in `schwelleAmOkular`, `grenzgroesse`, `sichtbareIsophote` |
| A-P9 V2 | Adaption als Konstante in `kontrastschwelle` (F = 2, skotopisch), keine Eingabe |
| A-D18 | `Objektzustand.klasse` (bzw. `objektklasse(typ)` in daten fuer die Liste), URL `z=frei` + `ds ma mb ca cb` |
| A-X7 Mondphasen | nur Daten (`objekte.json`, `bilder.json`, `tools/mond_kacheln.py`), keine Nahtaenderung |
| A-X11 grosse Deep-Sky-Bilder | keine Nahtaenderung: `arbeitsmassstab` begrenzt schon durch `quelle.massstabArcsecProPx`; Hilfetext |

## 7. Bewertung

**Isophotentabelle (bewertet):** gut, beibehalten. Pixelfrei, rechnet in physik in Mikrosekunden (20 bis 60 Zeilen), unabhaengig vom Fenster (ein Zoom aendert die Schwelle nicht, eine Messung am Arbeitsraster schon). Alternativen verworfen: Profilparameter (nur M31 und M13 haben eins), Histogramm in bild (Physik in bild, haengt am Ausschnitt). Verfeinerungen: `tools/` misst die Tabelle am dekodierten, sternbereinigten Bild (Trapez maskiert), in 0,1-mag-Schritten, und schreibt sie in `objekte.json` neben `weiss_mag_arcsec2`; ein Test in daten prueft, dass die Gesamtflaeche der schwaechsten Zeile hoechstens die Bildflaeche ist.

**Staerken**
- Kleinster Umbau: Falter, Kern, Fenster, Quelle, Stufe 2 und 4 unveraendert; ein Arbeitsraster fuer das Objekt wie bisher.
- Sterne laufen durch den vorhandenen Pfad der Trabanten (male, punktebene, Blendungsregel).
- V1-Pfad als Sonderfall der Formel nachweisbar (Regressionstest mit alten Konstanten).
- Deckkraft ohne Physik in bild: ein Pixelwert q* und eine Breite.

**Schwaechen**
- `Objektzustand` und `Helligkeit` tragen optionale Felder, deren gueltige Kombination von `klasse` abhaengt (z. B. deep_sky ohne `isophoten`, doppelstern mit `quelle`); die Typen schliessen sie nicht aus, daten und physik muessen pruefen. Stille Fallunterscheidung in bild ueber "Feld vorhanden".
- Deckkraft und Farbe der Sterne stecken in Stufe 1: Bortle oder Transparenz aendern bei M42/M45 den Quellbild-Schluessel und damit die Faltung des Objektrasters (WebGL2 ms, JS-Fallback bis 0,6 s).
- Ein Objekt je Szene: Planet vor Deep-Sky, Feldsterne oder mehrere Flaechenarten (Kann-Punkte) brauchen dann doch Ebenen.
- Faerbung mischt ueberlappende Sterne flussgewichtet (Antares B im Halo von A bekommt Mischfarbe); unaufgeloeste RGB-Planeten werden je Kanal komprimiert (leicht entsaettigt).

**Offene Fragen (Herbert)**
1. Schnitt g0 = 0,005: aendert T5 Mars 6'' bei V < 240 geringfuegig; akzeptiert?
2. G im Leuchtdichteraum (`d.faktor = G a`) oder als Verstaerkung des Anzeigezuwachses? Entwurf: Leuchtdichteraum (ein Faktor, bild unberuehrt).
3. Objektmitte als Blender nur fuer `sonnensystem` (sonst blendet die Gesamtmagnitude eines Doppelsterns B ab 6 mag Unterschied auch unter 33x, M42 die Trapezsterne E, F)?
4. Gilt A-P10 auch fuer M57 (88'') bei kleiner Vergroesserung, oder genuegt dort die Schwelle?
5. Bezugsweiss `PUNKT_WEISS` fuer Zustaende ohne `quelle` als Konstante in physik, oder `quelle` mit `weissMagProArcsec2` und ohne Bild?

**Grobe Schaetzung Phase 5** (rund 30 geaenderte, 12 neue Dateien ohne Daten):
naht: `konfiguration.ts`, `simulationsparameter.ts` (+Test). physik: `konstanten.ts`, `helligkeit.ts`, `punktquellen.ts`, `auswerten.ts`, `arbeitsmassstab.ts`, `begrenze.ts`, `index.ts`; neu `schwelle.ts`, `mischung.ts`, `sternfarbe.ts`, `doppelstern.ts` mit Tests. bild: `rendere.ts`, `male.ts`, `punktebene.ts` (+Tests). daten: `objekte.ts`, `objektzustand.ts`, `bildnachweise.ts`, `quelle_einzelbild.ts`, `kacheln.ts`, neu `kennlinie.ts`, `quelle_leer.ts`. zustand: `url.ts`, `LIESMICH.md`. ui: `formular_objekt.ts`, `infopanel.ts`, `warnungen.ts`, `steuerung.ts`, `hilfe.ts`, `bildnachweise.ts`, `texte.ts`. Daten und Werkzeuge: `objekte.json`, `bilder.json`, `tools/` (Kennlinie, Isophoten, Sterne). Doku: `architektur.md` 3, `physik.md` (neue Abschnitte), ADR-0003/0004 Nachtrag.
