<!-- Entwurf eines Subagenten (Design it twice, Variante 3), 2026-10-23, unveraendert uebernommen. Vergleich und Entscheidung: docs/architektur.md -->

# Entwurf Variante 3: Interface `physik` und Naht `Simulationsparameter`, optimiert fuer die haeufigsten Aufrufer

Leitidee: Die Naht traegt nicht "die Physik", sondern **vier Stufen, die genau den vier Arbeitsschritten der Bildpipeline entsprechen**, jede mit einem eigenen Schluessel. `bild` vergleicht nur Schluessel und ueberspringt, was gleich geblieben ist. Damit ist Wiederverwendung kein Sonderpfad, sondern die Form des Datentyps. Sonderfaelle (Auge, Fernglas, Zoom) werden **vor** der Naht in Skalare eingeebnet und kommen in keiner Stufe mehr vor.

## 1. Interface

### 1.1 Eingang: Konfiguration (Typen in `physik/konfiguration.ts`)

```ts
export type Bauart = 'refraktor' | 'newton' | 'schmidt-cassegrain' | 'maksutov';
export interface Okular { brennweiteMm: number; scheinbaresGesichtsfeldGrad: number; }

// Das Okular haengt am Fernrohr, nicht an der Konfiguration: Fernglas und Auge haben keins,
// und so gibt es im Normalfall kein nullable Feld.
export type Geraet =
  | { art: 'fernrohr'; oeffnungMm: number; brennweiteMm: number; obstruktion: number; bauart: Bauart; okular: Okular }
  | { art: 'fernglas'; oeffnungMm: number; vergroesserung: number; wahresGesichtsfeldGrad: number }
  | { art: 'auge' };                                   // 6 mm, V = 1, Rechteck 5 Grad (A-F3, A-D1)

export type Transparenz = 'klar' | 'leicht-diesig' | 'diesig';
export interface Bedingungen { seeingFwhmArcsec: number; bortle: number; transparenz: Transparenz; hoeheGrad: number; }

export interface Trabant { name: string; dxArcsec: number; dyArcsec: number; durchmesserArcsec: number; magnitude: number; }
export interface Objektzustand {
  kennung: string;                                     // 'jupiter-47', 'mond-q1'; bild laedt danach das Quellbild
  durchmesserArcsec: number; magnitude: number;        // Magnitude fuer die Blendungsregel A-P6
  quelle: { breitePx: number; hoehePx: number; massstabArcsecProPx: number; weissMagProArcsec2: number };
  trabanten: Trabant[];
}
export interface Konfiguration { geraet: Geraet; objekt: Objektzustand; bedingungen: Bedingungen; }

// Fenster = was angezeigt wird: Breite am Himmel, Mitte in Objektkoordinaten (Planetenmitte 0/0,
// +x rechts, +y Norden, A-D11), Kantenlaenge in Anzeigepixeln. Zoom und Verschieben sind nur andere Fenster.
export interface Fenster { breiteArcsec: number; mitteXArcsec: number; mitteYArcsec: number; px: number; }
```

Invarianten: `Konfiguration` ist bereits begrenzt (A-F8); `begrenzeKonfiguration` ist dafuer die einzige Stelle. `weissMagProArcsec2` ist die Flaechenhelligkeit, die Weiss (1,0) im Quellbild bedeutet; alle Helligkeiten an der Naht sind relativ dazu (1 = Quellweiss, linear). `obstruktion` ist ein Verhaeltnis 0..0,5 (nicht Prozent). Bogensekunden ueberall, Grad nur in Gesichtsfeld-Eingaben und -Anzeigen.

### 1.2 Naht: `Simulationsparameter` (in `naht/simulationsparameter.ts`, nur Typen, strukturiert klonbar)

```ts
export interface Quellbild {                           // Stufe 1: Ausschnitt mitteln + Trabanten malen (17..40 ms)
  schluessel: string;
  objekt: string;                                      // Objektzustand.kennung
  massstabArcsecProPx: number;                         // Arbeitsmassstab
  rasterPx: number;                                    // Arbeitsraster nA x nA, rasterPx * massstab = fenster.breiteArcsec
  mitteXArcsec: number; mitteYArcsec: number;          // = Fenster.mitte
  punktquellen: Punktquelle[];                         // vor der Faltung als Scheibchen ins Arbeitsraster malen
}
export interface Punktquelle { name: string; xArcsec: number; yArcsec: number; durchmesserArcsec: number;
  helligkeitRelativ: number;                           // Flaechenhelligkeit relativ zu Quellweiss, OHNE den gemeinsamen Faktor
  sichtbar: boolean; grund?: 'blendung'; }             // Blendungsregel A-P6, bereits entschieden
export interface Kern {                                // Stufe 2: Faltung (teuerste Stufe in bild)
  schluessel: string;
  beschreibung: Kernbeschreibung;                      // fuer Tests und Anzeige, nicht fuer bild
  groesse: number; radius: number;                     // G = 2R+1, 5 <= G <= 81
  massstabArcsecProPx: number;                         // === Quellbild.massstabArcsecProPx
  daten: Float32Array;                                 // G*G, Summe 1 +- 1e-6, punktsymmetrisch, keine negativen Werte
}
export interface Kernbeschreibung { oeffnungMm: number; obstruktion: number; seeingFwhmArcsec: number;
  augeFwhmArcsec: number; massstabArcsecProPx: number; } // alle Felder auf 4 signifikante Stellen gerundet
export interface Helligkeit {                          // Stufe 3: Tonwert (billig, nur Multiplikation und Addition)
  schluessel: string;
  faktorObjekt: number;                                // a*tau*(1-eps^2)*min(1,(AP/p)^2), in (0, 1]
  hintergrundRelativ: number;                          // Grauton des Felds relativ zu Quellweiss
  hintergrundMagProArcsec2: number;                    // nur Anzeige/Hilfetext
}
export interface Gesichtsfeld { form: 'kreis' | 'rechteck'; breiteArcsec: number; hoeheArcsec: number; }
export interface Simulationsparameter {
  quellbild: Quellbild; kern: Kern; helligkeit: Helligkeit;
  gesichtsfeld: Gesichtsfeld;                          // Maske, zentriert auf Objektkoordinate 0/0 [Nachtrag 2026-10-26: korrigiert auf Fenstermitte, Issue #6]
  fenster: Fenster;                                    // Stufe 4: Anzeige (Skalierung, Maske), immer billig
}
```

Vertrag fuer `bild`: Anblick = tonwert(falte(male(mittele(quelle, quellbild)), kern), helligkeit), maskiert mit `gesichtsfeld`, gezeichnet in `fenster`. Gleicher Schluessel heisst: die Stufe liefert dasselbe Ergebnis wie beim letzten Mal; `bild` darf ihr Zwischenergebnis (Float-Puffer, Textur) behalten. Der Schluessel ist aus den gerundeten Feldern gebildet, d. h. gleicher Schluessel genau dann, wenn gleiche Felder.

### 1.3 Funktionen (`physik/index.ts`)

```ts
// Stufe 0: Formeln, jede einzeln testbar (A-Q1). Kosten: Mikrosekunden. Reine Zahl rein, Zahl raus.
export function rayleighArcsec(oeffnungMm: number): number;          // 138,4 / D
export function dawesArcsec(oeffnungMm: number): number;             // 115,8 / D
export function airyFwhmArcsec(oeffnungMm: number): number;          // 116,8 / D
export function airyRadiusArcsec(oeffnungMm: number): number;        // 1,22 lambda / D
export function austrittspupilleMm(oeffnungMm: number, vergroesserung: number): number;
export function luftmasse(hoeheGrad: number): number;                // Kasten-Young, Zenit 0,9997
export function seeingAmObjektArcsec(fwhmZenit: number, luftmasse: number): number;  // * X^0,6
export function friedParameterCm(fwhmArcsec: number): number;
export function extinktionMag(transparenz: Transparenz, luftmasse: number): number;  // k = 0,20 / 0,30 / 0,45
export function mtfPupille(nu: number, obstruktion: number): number; // numerische Autokorrelation
export function energieImAiryKern(obstruktion: number): number;
export function flaechenhelligkeitsfaktor(austrittspupilleMm: number, pupilleMm?: number): number;
export function vergroesserungsgrenzen(oeffnungMm: number): { min: number; max: number };
export function quadratur(...fwhmArcsec: number[]): number;
export function airyProfil(rArcsec: number, oeffnungMm: number, obstruktion: number): number;
export function moffatProfil(rArcsec: number, fwhmArcsec: number): number;   // beta 4,765
export function gaussProfil(rArcsec: number, fwhmArcsec: number): number;

// Stufe 1: Konfiguration -> Zwischengroessen. Kosten: Mikrosekunden. Hier enden die Sonderfaelle.
export interface Optik { oeffnungMm: number; vergroesserung: number; obstruktion: number; transmission: number;
  austrittspupilleMm: number; gesichtsfeld: Gesichtsfeld; }
export function optik(geraet: Geraet): Optik;                        // EINZIGE Stelle, die ueber Geraet.art verzweigt
export interface Atmosphaere { luftmasse: number; seeingFwhmArcsec: number; extinktionMag: number; transmission: number; }
export function atmosphaere(b: Bedingungen): Atmosphaere;
export interface Aufloesung { rayleighArcsec: number; dawesArcsec: number; beugungFwhmArcsec: number;
  seeingFwhmArcsec: number; augeFwhmArcsec: number; gesamtFwhmArcsec: number; dominant: 'beugung' | 'seeing' | 'auge'; }
export function aufloesung(o: Optik, a: Atmosphaere): Aufloesung;
export function helligkeit(o: Optik, a: Atmosphaere, bortle: number, objekt: Objektzustand): Helligkeit;
export function punktquellen(objekt: Objektzustand, o: Optik): Punktquelle[];    // inkl. Blendungsregel
export function arbeitsmassstab(aufl: Aufloesung, quelle: Objektzustand['quelle'], fenster: Fenster): number;
export function kernbeschreibung(o: Optik, a: Atmosphaere, aufl: Aufloesung, massstab: number): Kernbeschreibung;

// Stufe 2: der teure Schritt. 1 bis 20 ms (FFT 64..256, 4-fach ueberabgetastet), Speicher <= 26 KB.
export function baueKern(b: Kernbeschreibung): Kern;                  // pur, deterministisch, kein Cache

// Stufe 3: Buendel fuer ui und Tests. Normalfall: auswerten(konfig).
export interface Anzeigewerte { vergroesserung: number; wahresGesichtsfeldGrad: number; austrittspupilleMm: number;
  aufloesung: Aufloesung; seeingWortstufe: string; pickering: string; luftmasse: number; extinktionMag: number; }
export type Warnung = { art: 'ap-ueber-6' | 'ap-unter-0-5' | 'v-ueber-2d'; wert: number; grenze: number };
export interface Auswertung { parameter: Simulationsparameter; anzeige: Anzeigewerte; warnungen: Warnung[]; }
export interface Auswertoptionen { fenster?: Fenster; anzeigePx?: number; vorher?: Simulationsparameter; }
export function auswerten(k: Konfiguration, o?: Auswertoptionen): Auswertung;
export function begrenzeKonfiguration(k: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] };  // A-F8

// Test-Helfer (pur, arbeiten nur auf Kern.daten)
export function kontrastUebertragung(kern: Kern, periodeArcsec: number): number;  // MTF des gebauten Kerns, 0..1
export function kernFwhmArcsec(kern: Kern): number;
```

Reihenfolge und Kosten von `auswerten`: `optik -> atmosphaere -> aufloesung -> fenster (Standard: ganzes Gesichtsfeld, anzeigePx 1024) -> arbeitsmassstab -> kernbeschreibung`; dann **nur wenn** `vorher?.kern.schluessel` nicht passt `baueKern`; dann `helligkeit`, `punktquellen`, Schluessel. Ohne Kernbau unter 0,1 ms. Der Kern aendert sich genau dann, wenn eine der fuenf Groessen der `Kernbeschreibung` sich (gerundet) aendert: D, Obstruktion, Seeing am Objekt (also Seeing oder Hoehe), Augen-FWHM (also V) oder Arbeitsmassstab (also Fenster oder Quelle). Bortle, Transparenz, Verschieben: kein Kernbau.

Fehlerfaelle: `auswerten` und die Stufe-1-Funktionen werfen `PhysikFehler { feld: string; wert: number }` bei NaN, D <= 0, V < 1, Obstruktion ausserhalb 0..0,5, Hoehe ausserhalb 0..90, Fenster mit px < 16 oder breite <= 0. Das sind Programmierfehler; Nutzereingaben gehen vorher durch `begrenzeKonfiguration`, das nie wirft, sondern schneidet und Hinweise liefert. `baueKern` wirft, wenn das Raster den Kern nicht fassen kann (R < 2): passiert nicht, wenn der Massstab aus `arbeitsmassstab` kommt (Invariante: FWHM >= 2,5 Arbeitspixel). [Nachtrag 2026-10-26: Die Invariante lautet umgekehrt FWHM hoechstens 2,5 Arbeitspixel (Arbeitsmassstab >= FWHM / 2,5, ADR-0002); baueKern traegt den Sub-Pixel-Fall, Issue #4.]

## 2. Beispiele

### 2.1 Normalfall in der UI (Reglerzug)

```ts
let letzte: Simulationsparameter | undefined;
function beiReglerzug(konfig: Konfiguration) {
  const a = auswerten(konfig, { vorher: letzte });   // Bortle-Zug: kein Kernbau; Seeing-Zug: 1..20 ms
  letzte = a.parameter;
  anzeige.zeige(a.anzeige, a.warnungen);
  bild.rendere(a.parameter);                           // bild: Schluessel vergleichen, nur geaenderte Stufen rechnen
}
// Zoom (A-D3) und Verschieben (A-D2) sind nur ein anderes Fenster, von der UI gebaut:
auswerten(konfig, { vorher: letzte, fenster: { breiteArcsec: 1.4 * konfig.objekt.durchmesserArcsec, mitteXArcsec: 0, mitteYArcsec: 0, px: 768 } });
```

### 2.2 Unit-Test gegen Abschnitt 8

```ts
test('Luftmasse Kasten-Young', () => {
  expect(luftmasse(45)).toBeCloseTo(1.4126, 4);
  expect(luftmasse(30)).toBeCloseTo(1.9943, 4);
  expect(luftmasse(90)).toBeCloseTo(1.0, 3);           // 0,9997, Toleranz laut physik.md
});
test('Austrittspupille 80/560 mit 10 mm', () => {
  const o = optik({ art: 'fernrohr', oeffnungMm: 80, brennweiteMm: 560, obstruktion: 0, bauart: 'refraktor',
                    okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 } });
  expect(o.vergroesserung).toBe(56);
  expect(o.austrittspupilleMm).toBeCloseTo(1.4286, 4);
});
test('Kern 80 mm, 2 Zoll Seeing: echte Faltung breiter als Quadratur', () => {
  const k = baueKern({ oeffnungMm: 80, obstruktion: 0, seeingFwhmArcsec: 2, augeFwhmArcsec: 0.6, massstabArcsecProPx: 0.5 });
  expect(kernFwhmArcsec(k)).toBeCloseTo(2.52, 1);      // Abschnitt 8: 2,476 Quadratur, 2,52 Faltung
  expect(Array.from(k.daten).reduce((s, v) => s + v, 0)).toBeCloseTo(1, 6);
});
```

### 2.3 Tabellen-Test T2 ueber die Naht

```ts
const CASSINI_ARCSEC = 0.8;                            // 4800 km bei Saturn 20 Zoll
const SCHWELLE_ERKENNBAR = 0.15;                       // Kalibrierkonstante, in Phase 6 am Bild festgelegt (A-Q2)
const faelle = [
  { oeffnungMm: 100, vergroesserung: 150, erwartet: 'erkennbar' },
  { oeffnungMm: 60,  vergroesserung: 100, erwartet: 'nicht erkennbar' },
];
test.each(faelle)('T2 Saturn 20", Seeing 1,5": $oeffnungMm mm -> $erwartet', ({ oeffnungMm, vergroesserung, erwartet }) => {
  const konfig: Konfiguration = {
    geraet: fernrohrMitVergroesserung(oeffnungMm, 10 * oeffnungMm, vergroesserung),   // Testhelfer: Okular aus V
    objekt: SATURN_20, bedingungen: { seeingFwhmArcsec: 1.5, bortle: 5, transparenz: 'klar', hoeheGrad: 45 },
  };
  const { parameter } = auswerten(konfig);
  const k = kontrastUebertragung(parameter.kern, 2 * CASSINI_ARCSEC);
  if (erwartet === 'erkennbar') expect(k).toBeGreaterThan(SCHWELLE_ERKENNBAR); else expect(k).toBeLessThan(SCHWELLE_ERKENNBAR);
});
```

Dieselbe Form fuer T1 bis T5 (Periode = doppelte Strukturbreite: Aequatorband, Krater 4 km, Syrtis); T6 prueft stattdessen `parameter.quellbild.punktquellen` (Auge: alle vier `sichtbar: false`, Grund `blendung`; 10x50: sichtbar) und `parameter.gesichtsfeld.form === 'rechteck'`. Wer Pixel sehen will, haengt den JavaScript-Adapter von `bild` mit einem synthetischen Quellbild (Balkenmuster) dahinter; der Datentyp ist derselbe.

## 3. Was die Implementierung hinter der Naht versteckt

- Den ganzen Rechenweg des Kerns: Bessel J1, Airy mit Annulus-Formel, Moffat mit beta 4,765, Gauss, Ueberabtastung 4x, FFT-Groesse P, Kernradius 3 FWHM (begrenzt 2..40), Binnen, Normierung, Klemmen negativer Werte. `bild` sieht nur ein Float32-Quadrat.
- Die Arbeitsmassstab-Regel max(Quelle, FWHM/2,5, Anzeige) und die Rundung der Kernbeschreibung auf 4 Stellen (verhindert Kernbau durch Gleitkommarauschen bei V = f/f_ok).
- Alle Tabellen: Transmission je Bauart, k je Transparenz, Bortle zu mag/arcsec2, Wortstufe und Pickering zu FWHM, Hoehenabhaengigkeit X^0,6, Augenaufloesung 60", Pupille 6 mm, lambda 550 nm.
- Dass Anzeige-FWHM per Quadratur, der Kern aber per echter Faltung entsteht (2,48 gegen 2,52").
- Die Blendungsregel (scheinbarer Abstand V * d < 10' und Delta m > 6) und die Umrechnung Trabant-Magnitude in Flaechenhelligkeit relativ zu Quellweiss.
- Die Koordinatenkonvention und die Entscheidung, Trabanten vor der Faltung als Scheibchen zu malen (A-P6 ergibt sich dann von selbst, keine Punkt/Scheibe-Fallunterscheidung).

## 4. Abhaengigkeiten und Adapter

- `physik` importiert nichts ausser den Typdateien. Kein DOM, kein Canvas, kein Worker, kein Zustand (der einzige "Cache" ist das vom Aufrufer gereichte `vorher`).
- `naht/simulationsparameter.ts` enthaelt nur Typen und wird von `physik` erzeugt und von `bild` gelesen. `bild` importiert `physik` nicht; es braucht fuer Tests keine Physik, ein Delta-Kern (G = 1, daten [1]) oder ein Kastenkern genuegt.
- `ui` importiert `physik` (auswerten, begrenzeKonfiguration, Anzeigewerte, Warnungscodes; Texte kommen aus der Textdatei A-D10) und `bild` (rendere). `ui` baut Fenster und haelt `letzte`.
- Was ueber die Naht variiert: die zwei Adapter von `bild` (WebGL2 mit Texturen je Schluessel, JavaScript mit Float32-Puffern je Schluessel), der Ort (Hauptthread oder Worker, `daten` ist transferierbar), spaeter das Vergleichsbild (A-D3: `bild` rendert dasselbe `quellbild` mit Delta-Kern, kein zweiter Physik-Aufruf).
- Was nicht variiert: die vier Stufen, die Einheiten (arcsec, arcsec/px, relativ zu Quellweiss), die Schluessel-Semantik, die Koordinatenkonvention.
- Erweiterungen bleiben lokal: Strehl (A-F9) und "ruhiger Moment" (A-B6) aendern nur `Kernbeschreibung` und `baueKern`; Schleier durch Dunst wird ein Feld `schleierRelativ` in `Helligkeit`; Dispersion (A-B5) wuerde `Kern` um eine Verschiebung je Farbkanal erweitern, Stufe 2 bleibt.

## 5. Abwaegung

Hebelwirkung hoch:
- `optik()`: eine Funktion ebnet drei Geraetearten in sechs Skalare ein; danach existieren Auge und Fernglas nirgends mehr. Auge wird ein 6-mm-Fernrohr mit V = 1 und Rechteckfeld, der Kern (Airy 19", Auge 60") entsteht auf demselben Weg.
- Stufenschluessel: `bild` ueberspringt Arbeit, ohne eine Formel zu kennen; `physik` ueberspringt den Kernbau ueber `vorher`, ohne Zustand zu halten. Beide Caches liegen bei dem, der das Zwischenergebnis besitzt (Lokalitaet).
- Kern als Daten statt Beschreibung: `bild` ist tief und dumm, Worker ohne Physik-Import, Bild-Tests mit synthetischen Kernen, Tabellen-Tests mit `kontrastUebertragung` ohne ein einziges Pixel.
- Helligkeit als ein Faktor plus Hintergrundpegel relativ zu Quellweiss: Transparenz- und Bortle-Zuege kosten nur die Tonwertstufe.

Hebelwirkung duenn, bewusst akzeptiert:
- `Fenster` ist ein Anzeigebegriff, den `physik` kennen muss, weil der Arbeitsmassstab davon abhaengt und der Kern vom Arbeitsmassstab. Alternative waere, dass `bild` den Massstab waehlt und dann selbst den Kern baut; das zieht `physik` in `bild`. Preis hier: Zoom und Anzeigegroesse loesen einen Kernbau aus (1 bis 20 ms), obwohl die Optik gleich bleibt.
- `vorher` statt LRU: bei schnellem Hin und Her zwischen zwei Seeing-Werten wird jedes Mal gebaut. Ein begrenzter Cache nach Schluessel laesst sich spaeter in `auswerten` nachruesten, ohne das Interface zu aendern.
- `Auswertung` buendelt Naht-Daten, Anzeige und Warnungen in einem Aufruf; nur `parameter` geht per postMessage. Fuer die UI ist das bequem, fuer die Tests egal.
- Die Schwellen der Tabellen-Tests (T1 bis T5) sind Kalibrierkonstanten, keine Physik; sie frieren das Phase-6-Urteil gegen Regression ein, mehr nicht.

Wo die Sonderfaelle landen: Blosses Auge und Fernglas in `Geraet` und `optik()`; Zoom und Verschieben in `Auswertoptionen.fenster` (UI); Vergleichsbild in `bild`; direkte Vergroesserungseingabe (A-F7) in der UI als Umrechnung auf `okular.brennweiteMm`; Begrenzung (A-F8) in `begrenzeKonfiguration`; Blendungsregel in `punktquellen()`. Im Normalfall `auswerten(konfig)` bleibt davon nichts sichtbar.
