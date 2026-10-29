<!-- Entwurf eines Subagenten (Design it twice, Version 2, Variante B "Ebenenliste"), 2026-10-29. Vergleich und Entscheidung: docs/architektur.md -->

# Entwurf Naht V2, Variante B: Ebenenliste

Grundidee: Stufe 3 (`Helligkeit`) wird zu `Abbildung` = Himmel + Liste typisierter Ebenen. Jede Ebene nennt ihren **Inhalt** (welches gefaltete Raster: `"objekt"` oder `"punkte"`) und ihre **Abbildungsvorschrift** (`art`). bild faengt mit dem Himmel an und addiert die Beitraege der Ebenen in Listenreihenfolge. Ein unaufgeloester Planet ist kein Sonderfall der Pixelformel, sondern zwei Ebenen auf demselben Inhalt (`sonnensystem` mit Faktor (1-g), `punkte` mit Gewicht g). Physik bleibt in physik: jede Ebene traegt nur Zahlen (Faktor, Exponent, Gewicht, Verstaerkung, Stuetzkurve); bild importiert physik weiterhin nicht. Unterschied zu Variante 2 aus V1 (verworfen wegen rund 20 Typen, vier `switch` mit zwei Adaptern, leerer Vorhalte, bild baut den Kern ueber physik): hier eine Union mit drei Arten, alle drei in V2 belegt, ein einziger `switch` in `tonwert` (nur JavaScript, die Falter sehen keine Ebenen), Kern weiter als Daten.

## 1. Typen (Diff gegen `src/naht/`)

```diff
// src/naht/konfiguration.ts
+export const OBJEKTKLASSEN = ["sonnensystem", "doppelstern", "deep_sky"] as const;   // A-D18, GLOSSARY Objektklasse
+export type Objektklasse = (typeof OBJEKTKLASSEN)[number];
+/** Stern eines Doppel-, Mehrfachsterns oder Deep-Sky-Objekts; kein Durchmesser, dafuer B-V. */
+export interface Stern { name: string; dxArcsec: number; dyArcsec: number; magnitude: number; bv: number }
+/** Isophoten des Quellbilds (tools/): mag/arcsec^2 am Himmel aufsteigend, eingeschlossene Flaeche arcsec^2 steigend. */
+export interface Flaechentabelle { magProArcsec2: number[]; flaecheArcsec2: number[] }
+export interface Quellangaben { breitePx: number; hoehePx: number; massstabArcsecProPx: number; weissMagProArcsec2: number }
+/** Die Flaeche eines Zustands; art entscheidet die Abbildung (ADR-0004 Ebene a oder b). */
+export type Flaeche =
+  | { art: "sonnensystem"; quelle: Quellangaben }
+  | { art: "deep_sky"; quelle: Quellangaben; flaechentabelle: Flaechentabelle };
+/** Eingaben des freien Paars (A-Z9), begrenzt durch begrenzePaar in physik. */
+export interface PaarEingabe { trennungArcsec: number; magnitudeA: number; magnitudeB: number; bvA: number; bvB: number }
 export interface Objektzustand {
   kennung: string;
+  klasse: Objektklasse;
   durchmesserArcsec: number;
   magnitude: number;
-  quelle: { breitePx: number; hoehePx: number; massstabArcsecProPx: number; weissMagProArcsec2: number };
+  flaeche?: Flaeche;            // fehlt bei Doppelstern und M45: kein Quellbild
   trabanten: Trabant[];         // nur sonnensystem
+  sterne: Stern[];              // doppelstern, deep_sky; Mehrfachstern mit echter Lage
+  frei?: PaarEingabe;           // nur kennung "frei"; sterne sind daraus gebaut, zustand liest hier fuer inUrl
 }
```

```diff
// src/naht/simulationsparameter.ts
+export type Farbe = [number, number, number];          // linear RGB (sRGB-Primaervalenzen, D65), Y = 1; grau [1, 1, 1]
+/** Rec. 709: Y = 0,2126 R + 0,7152 G + 0,0722 B (IEC 61966-2-1); Normierung, keine Physik. */
+export const LEUCHTDICHTE_GEWICHTE: Farbe = [0.2126, 0.7152, 0.0722];
 export interface Quellbild {
-  schluessel: string; ...; punktquellen: Punktquelle[];
+  schluessel: string;           // Objektraster: kennung, massstab, rasterPx, mitte (ohne Punktquellen)
+  flaeche: boolean;             // false: kein Objektraster (Doppelstern, M45), bild fragt die Quelle nicht
+  massstabArcsecProPx: number; rasterPx: number; mitteXArcsec: number; mitteYArcsec: number;
+  punkte: Punktbild;
 }
+/** Stufe 1b, eigener Schluessel: Bortle aendert Deckkraft und Farbe, aber nicht das Objektraster. */
+export interface Punktbild { schluessel: string; punktquellen: Punktquelle[] }
 export interface Punktquelle {
   name: string; xArcsec: number; yArcsec: number;
-  durchmesserArcsec: number; helligkeitRelativ: number; sichtbar: boolean; grund?: "blendung";
+  durchmesserArcsec: number;    // Stern: STERN_DURCHMESSER_ARCSEC (0,01'', weit unter jedem Kern)
+  helligkeitRelativ: number;    // relativ zu Quellweiss, ohne Flaeche relativ zu BEZUG_OHNE_QUELLBILD (0 mag/arcsec^2)
+  farbe: Farbe;                 // grau unter der Farbschwelle (A-P12), Trabanten immer grau
+  deckkraft: number;            // Blackwell, 0..1; ueber 1 - 1e-3 genau 1, unter 1e-3 nicht gemalt
+  sichtbar: boolean;
+  grund?: "blendung" | "unter_schwelle";
 }
-export interface Helligkeit { schluessel; faktorObjekt; hintergrundRelativ; hintergrundMagProArcsec2; punktFaktor; punktExponent }
+/** Stufe 3: Pixel = himmel + Summe der Beitraege der Ebenen in Listenreihenfolge (Abschnitt 2). */
+export interface Abbildung {
+  schluessel: string;
+  himmel: number;               // Anzeigehelligkeit des Himmels, (0, 1], = min(1, s^n)
+  hintergrundMagProArcsec2: number;
+  ebenen: Ebene[];              // Reihenfolge: hoechstens eine Flaechenebene, dann punkte(objekt), dann punkte(punkte)
+}
+export type Ebene = EbeneSonnensystem | EbeneDeepSky | EbenePunkte;
+/** ADR-0004 (a): linear, Binnenkontrast bleibt. faktor = (1 - g) * Anzeigehelligkeit von Quellweiss. */
+export interface EbeneSonnensystem { art: "sonnensystem"; inhalt: "objekt"; faktor: number }
+/** ADR-0004 (b): gemeinsam mit dem Himmel, Deckkraft je Pixel ueber q, Verstaerkung G >= 1. */
+export interface EbeneDeepSky {
+  art: "deep_sky"; inhalt: "objekt";
+  faktor: number;               // a: Leuchtdichte von Quellweiss im Okular / Anzeigeweiss
+  himmelLeuchtdichte: number;   // s: Leuchtdichte des Himmels im Okular / Anzeigeweiss
+  exponent: number;             // n = 1/3
+  verstaerkung: number;         // G >= 1 (Mindestsichtbarkeit Delta_min)
+  deckkraft: Stuetzkurve;       // x = q (relativ zu Quellweiss) aufsteigend, y = Deckkraft 0..1, monoton
+}
+/** ADR-0004 (c): je Pixel wie eine eigene Flaeche, eigenes Punktweiss. */
+export interface EbenePunkte {
+  art: "punkte"; inhalt: "punkte" | "objekt";   // "objekt": unaufgeloester Zustand (A-P10)
+  faktor: number;               // Leuchtdichte des Bezugs im Okular / Punktweiss (6,4 mag/arcsec^2)
+  exponent: number;             // n = 1/3
+  gewicht: number;              // 1 fuer Trabanten und Sterne, g fuer den unaufgeloesten Zustand
+}
+/** Stueckweise linear; unter x[0] gilt y[0], ueber x[last] gilt y[last]. */
+export interface Stuetzkurve { x: number[]; y: number[] }
 export interface Simulationsparameter {
-  quellbild: Quellbild; kern: Kern; helligkeit: Helligkeit; gesichtsfeld: Gesichtsfeld; fenster: Fenster;
+  quellbild: Quellbild; kern: Kern; abbildung: Abbildung; gesichtsfeld: Gesichtsfeld; fenster: Fenster;
 }
```

```diff
// src/physik/auswerten.ts
 export interface Anzeigewerte {
   ...
+  grenzgroesseMag: number;                    // A-P11, am Himmel (mit Extinktion), typischer Beobachter F = 2
+  sichtbareIsophoteMagProArcsec2?: number;    // nur deep_sky mit Flaeche; undefined: nichts sichtbar
+  mischgewicht?: number;                      // nur sonnensystem, g fuer den Hilfetext "unaufgeloest"
 }
 export interface Warnung {
-  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d";
+  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d" | "ueberstrahlung";  // wert = |Delta m|, grenze = 4
   wert: number; grenze: number;
 }
```

**Freies Paar:** daten baut, physik begrenzt, zustand serialisiert. `daten.freiesPaar(e: PaarEingabe): Objektzustand` (neben `objektzustand()`, der einzigen Stelle, die Objektzustaende baut: `kennung "frei"`, `klasse "doppelstern"`, A bei -rho/2, B bei +rho/2, dy 0, `frei: e`). `physik.begrenzePaar(e) -> { eingabe, hinweise }` haelt A-F8 an einem Ort (Grenzen aus doppelsterne.md 3.2 in `GRENZEN`). zustand: `ausUrl` liest die Paar-Parameter, ruft `begrenzePaar`, dann `freiesPaar`; `inUrl` liest `objekt.frei`. physik baut keinen Objektzustand.

## 2. Pixelformel (Vertrag fuer bild, je Arbeitspixel)

Inhalte: `q` = gefaltetes Objektraster (1 oder 3 Kanaele, relativ zu Quellweiss); `Y` = gefaltete Punktebene (1 Kanal, Fluss relativ zum Bezug); `F` = gefaltete Faerbung (3 Kanaele, Fluss mal Deckkraft mal Farbe), nur wenn eine gemalte Punktquelle Farbe != grau oder Deckkraft != 1 hat. `lum(q)` = q bei 1 Kanal, sonst Skalarprodukt mit `LEUCHTDICHTE_GEWICHTE`.

```ts
erg[c] = abbildung.himmel                                    // je Kanal c
for (const e of abbildung.ebenen) switch (e.art) {
  case "sonnensystem": erg[c] = e.faktor * q[c] + erg[c]; break;                 // V1: f*q + h, gleiche Operationen
  case "deep_sky": {                                                              // q einkanalig (Grauwert-WebP)
    const d = stuetz(e.deckkraft, q);
    if (d > 0) erg[c] += e.verstaerkung * d * (Math.min(1, Math.pow(e.himmelLeuchtdichte + e.faktor * q, e.exponent)) - abbildung.himmel);
    break; }
  case "punkte": {
    const y = e.inhalt === "punkte" ? Y : lum(q);
    if (!(y > 0)) break;
    let w = Math.min(1, Math.pow(e.faktor * y, e.exponent));                      // V1: min(1, (a p)^n)
    if (e.gewicht !== 1) w *= e.gewicht;
    const chroma = e.inhalt === "punkte" ? (F ? F[c] / y : 1) : (q3 ? q[c] / y : 1);
    erg[c] += chroma === 1 ? w : w * chroma; break; }
}
```

- Ergebnis hat 3 Kanaele, sobald `q` oder `F` 3 Kanaele hat, sonst 1. Ohne Objektraster (`quellbild.flaeche` false) beginnt bild mit einem Raster voll `himmel`.
- **Deckkraft** wirkt nach der Abbildung auf den Zuwachs ueber dem Himmel (Blackwell ist eine Sehwahrscheinlichkeit, kein Leuchtdichtefaktor: vor der Potenz wuerde P = 0,1 nur zu 0,46). Bei Punktquellen geht sie ueber `F/Y` flussgewichtet in den Beitrag, damit ueberlappende Sterne richtig mischen.
- **Bitgleichheit T1 bis T6** (gegen einen Stand, der nur das Anzeigeweiss aendert): Sonnensystem-Ebene rechnet `faktor * q + himmel` wie V1, mit g = 0 ist `faktor = (1 - 0) * faktorObjekt` exakt. Trabanten sind grau mit Deckkraft genau 1 (Rand 1e-3, in T1 bis T6 mindestens 2 mag ueber der Grenze), also kein `F`, `gewicht` 1, keine Multiplikation. physik laesst die Ebene `punkte(objekt)` weg, wenn g < `MISCHGEWICHT_MIN` (1e-3); Sprung hoechstens 1e-3 Anzeigehelligkeit. T1 bis T4 (x >= 78, g <= 5e-4) bleiben bitgleich. **T5b und T6 aendern sich gewollt** (A-P10): Mars 6'' am 80 mm bei 100x g = 0,028, Jupiter im 10x50 g = 0,045, mit blossem Auge 0,825. Tests in `rendere.test.ts`: Ebenenliste aus V1-Werten gegen eingefrorene V1-Ausgabe.

## 3. Neue reine Funktionen in `src/physik/` (Stufe 0 und 1)

| Datei | Signatur | Quelle | Aufruf in `auswerten` |
|---|---|---|---|
| `schwelle.ts` | `himmelLeuchtdichteCdM2(mu: number): number` | wahrnehmung.md 1.2 | in `schwellenlage` |
| `schwelle.ts` | `schwellenlage(o: Optik, a: Atmosphaere, bortle: number): Schwellenlage` (V, AP, tau, D, B_a, F_T, phi) | 1.4 | nach `aufloesung` |
| `schwelle.ts` | `kontrastschwelle(flaecheArcsec2: number, l: Schwellenlage): number` (C_th = F C(A_a, B_a), Gl. 47/77, Nullhintergrund) | 1.2, 1.4 | in `sichtbareIsophote` |
| `schwelle.ts` | `grenzgroesse(l: Schwellenlage, seeingAmObjektFwhmArcsec: number, extinktionMag: number): number` (Gl. 68/88, Scheibe 2,8 FWHM) | 2.2 | einmal, fuer Punktquellen und `Anzeigewerte` |
| `schwelle.ts` | `sichtbareIsophote(t: Flaechentabelle, objektVersatzMag: number, l: Schwellenlage): { magProArcsec2: number; flaecheArcsec2: number; kontrastschwelle: number } \| undefined` | 4.4 Punkt 2 | in `abbildung` (deep_sky) |
| `schwelle.ts` | `deckkraft(kontrastVerhaeltnis: number): number` (Phi((r - 1)/0,484), Raender 1e-3 auf 0/1) | 4.4 Punkt 3 | Punktquellen, Kurve |
| `schwelle.ts` | `deckkraftKurve(t: Flaechentabelle, weissMag: number, objektVersatzMag: number, l: Schwellenlage): Stuetzkurve` | 4.4 | in `abbildung` (deep_sky) |
| `mischung.ts` | `mischgewicht(winkelgroesseArcsec: number, vergroesserung: number): number` (1/(1 + 0,3466 x^2)) | 3.2 | in `abbildung` (sonnensystem) |
| `sternfarbe.ts` | `farbtemperatur(bv: number): number`; `sternfarbe(bv: number): Farbe` (Planck, CIE 1931, Y = 1, Tabelle 0,1-Schritte) | 5.2, 5.3 | in `punktquellen` |
| `sternfarbe.ts` | `beleuchtungsstaerkeAmAugeLx(magnitude: number, o: Optik, a: Atmosphaere): number` | 5.1 | in `punktquellen` (Farbe nur ab 3,1e-7 lx) |
| `helligkeit.ts` | `verstaerkung(himmel: number, zuwachsAnSchwelle: number, deltaMinKodes: number): number` (sRGB-Kodierung IEC 61966-2-1) | 4.4 Punkt 4 | in `abbildung` (deep_sky) |
| `helligkeit.ts` | `abbildung(o, a, bortle, objekt, l: Schwellenlage): Abbildung` ersetzt `helligkeit()` | 12, 14, ADR-0004 | statt `helligkeit` |
| `punktquellen.ts` | `punktquellen(objekt, o, a, mLim): Punktquelle[]` (Trabanten und Sterne; Blender nur Sonnensystem-Flaeche und Punkte) | 13, 2, 5 | wie bisher |
| `begrenze.ts` | `begrenzePaar(e: PaarEingabe): { eingabe: PaarEingabe; hinweise: Hinweis[] }` | doppelsterne.md 3.2 | von zustand und ui |
| `auswerten.ts` | `ueberstrahlung(sterne: Stern[]): Warnung[]` (Paare < 10'' mit abs(Delta m) >= 4) | A-Z9, README Entsch. 5 | in `warnungen` |

`objektVersatzMag` = Extinktion plus Verlust im Okular des Objekts gegenueber dem Himmel (Extinktion wirkt nur aufs Objekt). Neue Konstanten in `konstanten.ts`: `FELDFAKTOR` 2, `FELDFAKTOR_FERNROHR` sqrt 2, Crumey r1, r2, k1, k2, q, `NULLHINTERGRUND_CD_M2` 1e-5, `BLACKWELL_STREUUNG` 0,484, `MISCH_KOEFFIZIENT` ln 2 / 2, `FARBSCHWELLE_LX` 3,1e-7, `ANZEIGE_WEISS_MAG_PRO_ARCSEC2` 9,2 (bisher 3,35), `PUNKT_WEISS_MAG_PRO_ARCSEC2` 6,4, `DELTA_MIN_KODES` 3, `MISCHGEWICHT_MIN` 1e-3, `DECKKRAFT_RAND` 1e-3, `UEBERSTRAHLUNG_DELTA_MAG` 4, `UEBERSTRAHLUNG_ABSTAND_ARCSEC` 10, `STERN_DURCHMESSER_ARCSEC` 0,01, `BEZUG_OHNE_QUELLBILD_MAG_PRO_ARCSEC2` 0.

**Reihenfolge in `auswerten`:** optik -> atmosphaere -> aufloesung -> fenster -> arbeitsmassstab (`flaeche?.quelle`, ohne Flaeche nur FWHM und Anzeige) -> Arbeitsraster -> kernbeschreibung -> Kern -> `schwellenlage` -> `grenzgroesse` -> `punktquellen` -> Quellbild/Punktbild -> `abbildung` -> Anzeigewerte -> Warnungen.

**Schluessel:**

| Stufe | V1 | V2 |
|---|---|---|
| 1 Objekt (`quellbild.schluessel`) | kennung, massstab, rasterPx, mitte, alle gemalten Punktquellen | kennung, massstab, rasterPx, mitte; **ohne** Punktquellen. Bortle, Transparenz, Seeing aendern ihn nicht mehr |
| 1 Punkte (`punkte.schluessel`, neu) | (in Stufe 1) | massstab, rasterPx, mitte, je gemalter Punktquelle name, x, y, d, h, farbe (3), deckkraft auf 4 Stellen |
| 2 Kern | unveraendert | unveraendert; bild haelt `kern|quellbild` und `kern|punkte` getrennt |
| 3 Abbildung | 5 Zahlen | himmel, Hintergrund-mag, je Ebene art, inhalt und alle Zahlen inkl. Stuetzkurve |

## 4. Wo die Deckkraft wirkt

**Deep-Sky je Pixel, Schwelle je Objekt (ueber die Isophotentabelle).** wahrnehmung.md 4.4 verwirft die Schwelle je Pixel mit fester Detailgroesse (Faktor 100 zu streng) und verlangt die Flaeche des zusammenhaengenden Gebiets. Daher rechnet physik je Isophote i der Tabelle das Verhaeltnis r_i = C_i / C_th(alpha_i) (C_i = Isophote gegen Himmel im Okular, alpha_i ihre eingeschlossene Flaeche) und daraus P_i = `deckkraft(r_i)`; die Stuetzkurve (x = q_i, y = P_i, von schwach nach hell kumulativ maximiert, also monoton) geht an bild. Ein Pixel bekommt die Deckkraft der Isophote, auf der es liegt. Folge: bei Bortle 7 blendet M31 von aussen nach innen gleitend aus, nur der Kern bleibt (T11); eine Deckkraft je Objekt dagegen zeigte entweder den ganzen Halo oder nichts. `sichtbareIsophote` (P = 0,5) und G beziehen sich auf denselben Punkt der Kurve. Sterne: je Punktquelle `deckkraft(10^(-0,4 (m - mLim)))`.

## 5. Auswirkungen auf die anderen Module

| Modul | Aenderung |
|---|---|
| daten | `OBJEKTTYPEN` + `doppelstern`, `deep_sky`; Felder `sterne` (`b_v`), `katalog`, `positionswinkel_grad`, `profil`, `flaechentabelle`; `bild` optional (Pflicht ausser doppelstern und M45). Pruefungen: Tabelle streng monoton, Flaeche > 0, nur bei deep_sky mit Bild; Paar mit zwei Sternen: abs(dxB - dxA) = rho aus `katalog`; Sterne nur bei doppelstern/deep_sky, Trabanten nur bei planet. `bilder.json`: `kodierung: { art: "log_grau", mag_hell, mag_dunkel }`; Dekodierung ueber eine 256er-Tabelle je Bild (wie `KachelSrgb` heute), Kode 0 = 0, sonst q = 10^(-0,4 (mu(v) - weiss)); Quelle liefert weiter lineares `Raster`. `objektzustand()` baut `klasse` und `flaeche`, neu `freiesPaar()`. `QuelleLeer` fuer Zustaende ohne Flaeche (oder ui ruft die Quelle gar nicht). |
| zustand | URL `o=frei&pt=2&pma=5&pmb=6&pba=0.6&pbb=0.6` (Namen in `LIESMICH.md`), Rueckfall je Parameter auf die Vorgaben 2,0/5,0/6,0/0,6/0,6; `v=1`-URLs bleiben gueltig. `Kataloge` unveraendert; `listeneintragZu` analog fuer Objekte nach Klasse. |
| ui | Objektauswahl mit `optgroup` je `klasse` (A-D18), Paar-Eingaben nur bei `frei`; Infopanel: Grenzgroesse, sichtbare Isophote, Mischgewicht als Satz, Warnung `ueberstrahlung`, Punktquellen mit `grund` "unter_schwelle"; `zoom.ts` Vergleichsbild: neutrale Abbildung je art (`sonnensystem` faktor 1, `deep_sky` als `sonnensystem` faktor 1, `punkte` faktor 1 exponent 1 gewicht 1, himmel 0); `steuerung` fragt die Bildquelle nur bei `flaeche`. |
| bild | `tonwert` iteriert Ebenen (ein `switch`), `stuetz()` Interpolation; `male` malt Y und, falls noetig, F; `faltePunkte` faltet beide (3 Kanaele mehr nur fuer F); `rendere` mit getrennten Zwischenspeichern Objekt/Punkte, ohne Flaeche kein `mittele`/`falte`; `pruefeParameter` prueft Ebenen (inhalt "objekt" nur mit `quellbild.flaeche`, deep_sky nur einkanalig, Stuetzkurve aufsteigend, G >= 1). |
| Falter (JS, WebGL2) | **unveraendert.** Gefaltet wird nur das Objektraster (Deep-Sky grau, 1 Kanal). Die Punktebene bleibt lokal in JS: 1 Kanal Leuchtdichte, bei Farbe oder Deckkraft zusaetzlich 3 Kanaele Faerbung (M13: 531 Sterne mal Kern bis 17 px, wenige ms). Nicht die Farbe je Kanal potenzieren: (a p r)^(1/3) entsaettigt; daher Leuchtdichte abbilden, Farbe als Verhaeltnis. |

## 6. Zuordnung Muss-V2 -> Feld oder Funktion

| Anforderung | Feld oder Funktion |
|---|---|
| A-Z9 Doppelsterne, freies Paar, Hinweis | `klasse "doppelstern"`, `Objektzustand.sterne`, `frei`, `daten.freiesPaar`, `begrenzePaar`, `Warnung "ueberstrahlung"`, `ueberstrahlung()`; Airy und Seeing ueber den bestehenden `Kern` |
| A-Z10 Deep-Sky mit Schwelle | `Flaeche "deep_sky"`, `Flaechentabelle`, `EbeneDeepSky`, `sichtbareIsophote`, `deckkraftKurve`, `verstaerkung`; Sterne von M45/Trapez/M13 als `sterne` |
| A-P10 unaufgeloest | `mischgewicht`, `EbeneSonnensystem.faktor` = (1-g) f, `EbenePunkte { inhalt "objekt", gewicht g }`, `Anzeigewerte.mischgewicht` |
| A-P11 Schwelle, Grenzgroesse | `schwellenlage`, `kontrastschwelle`, `grenzgroesse`, `deckkraft`, `Punktquelle.deckkraft`, `grund "unter_schwelle"`, `Anzeigewerte.grenzgroesseMag` |
| A-P12 Farbe | `sternfarbe`, `farbtemperatur`, `beleuchtungsstaerkeAmAugeLx`, `Punktquelle.farbe`, Faerbung F; Deep-Sky grau (1 Kanal) |
| A-P13, A-P4 V2 Konstanten | `ANZEIGE_WEISS_MAG_PRO_ARCSEC2` 9,2, `PUNKT_WEISS_MAG_PRO_ARCSEC2` 6,4 (`EbenePunkte.faktor`), n in `exponent` |
| A-B2 V2 | `bortle` -> `schwellenlage` -> Deckkraft, Grenzgroesse, Isophote |
| A-P9 V2 | fester Beobachter in `FELDFAKTOR`, keine Eingabe; Ueberstrahlung nur als `Warnung` |
| A-D18 Gruppierung, URL | `Objektzustand.klasse` / `Objekt.typ`, zustand-Parameter des Paars |
| A-X7 Mondphasen | nur daten (neue Zustaende, `flaeche "sonnensystem"`); keine Nahtaenderung |
| A-X11 grobe Deep-Sky-Bilder | `arbeitsmassstab` = max(Quellmassstab, ...) wie V1; Hilfetext; keine Nahtaenderung |

## 7. Bewertung

**Staerken**
- Die drei Ebenen aus ADR-0004 stehen als drei Typen da; g ist kein Sonderfall der Formel, sondern Gewichtung zweier Ebenen auf demselben Inhalt. Jede Ebene ist in bild mit synthetischen Zahlen testbar.
- Kuenftige Kann-Punkte als neue Ebene oder neuer Inhalt: Erdlicht = Inhalt "nachtseite" + `EbeneSonnensystem`; Farbkanaele der Flaeche = Faerbung wie bei Punkten; Strehl-Hof = weiterer Kern, nicht weitere Ebene.
- Stufe 1 getrennt in Objekt und Punkte: Bortle- und Transparenzzug rechnet nur die Punktebene neu (V2 macht die Punktquellen bedingungsabhaengig, in V1 haette das das Objektraster mit neu gemittelt).
- bild bleibt physikfrei (Zahlen, Stuetzkurve, Rec.-709-Gewichte), Falter-Adapter unberuehrt, Kern bleibt Daten.

**Schwaechen**
- Ein `switch` in bild und eine Reihenfolgekonvention, die Bitgleichheit traegt; falsch sortierte Liste rechnet still anders (pruefeParameter muss die Reihenfolge pruefen).
- `Objektzustand.quelle` -> `flaeche?.quelle` ist ein Bruch quer durch physik, daten, zustand, ui und viele Tests.
- Die Union erlaubt unsinnige Listen (zwei Flaechenebenen, deep_sky auf 3 Kanaelen); nur Laufzeitpruefung.
- Mehr Naht als Variante A: rund 8 neue Typen, Stuetzkurve als Naeherung (Aufloesung der Tabelle bestimmt die Glattheit).

**Offene Fragen**
1. Flaechentabelle aus `tools/` (empfohlen: pruefbar, Testwerte im Repo, zur geeichten Kennlinie passend) oder Histogramm in daten beim Dekodieren (immer konsistent zum Bild, aber bei Kacheln alle Kacheln noetig, zaehlt nicht zusammenhaengende Flaechen). Beide ergeben fuer M31/M57 fast dasselbe.
2. Delta_min fuer G bei P = 0,5 oder bei P = 0,9 definieren? Wert 3 Kodes legt Herbert am Bild fest.
3. `MISCHGEWICHT_MIN` 1e-3 (Abschneiden fuer T1 bis T4 bitgleich) gegen exakt die Formel ohne Schnitt (alle Jupiterfaelle aendern sich minimal).
4. Deckkraft-Kurve auf das gefaltete q anwenden ist eine Naeherung (Tabelle aus dem ungefalteten Bild); fuer Deep-Sky-Strukturen weit ueber der PSF unkritisch, bei M57 am 80 mm pruefen (T10).
5. M13: Quellbild plus Katalogsterne zaehlt doppelt; Bild maskieren oder nur Sterne plus Restlicht (deep-sky.md 3.4).
6. Vergleichsbild der Zoomansicht fuer Deep-Sky: linear mit Quellweiss = Bildschirmweiss zeigt den schwachen Halo kaum.

**Dateien in Phase 5 (grob, ohne Tests):** naht `konfiguration.ts`, `simulationsparameter.ts`; physik `schwelle.ts` (neu), `mischung.ts` (neu), `sternfarbe.ts` (neu), `helligkeit.ts`, `punktquellen.ts`, `auswerten.ts`, `arbeitsmassstab.ts`, `begrenze.ts`, `konstanten.ts`, `index.ts`; bild `rendere.ts`, `male.ts`, `punktebene.ts`, `index.ts`; daten `objekte.ts`, `objektzustand.ts`, `bildnachweise.ts`, `quelle_einzelbild.ts`, `kacheln.ts`, `srgb.ts` (Tabelle log_grau), `index.ts`; zustand `url.ts`, `voreinstellung.ts`, `LIESMICH.md`; ui `formular_objekt.ts`, `infopanel.ts`, `warnungen.ts`, `zoom.ts`, `steuerung.ts`, `hilfe.ts`, `src/texte.ts`; tools `deep_sky_aufbereiten.py` (neu, Kennlinie und Flaechentabelle); Doku `GLOSSARY.md`, ADR-0003/0004 Nachtrag, `physik.md` 12 und 14. Rund 30 Quelldateien plus etwa 20 Testdateien.
