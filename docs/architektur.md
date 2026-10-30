# Architektur: Modulschnitt und Naht Physik zu Bild

Ergebnis von Phase 3 (2026-10-23). Begriffe nach `GLOSSARY.md`, Entscheidungen in `docs/adr/`. Vokabular fuer den Schnitt: ein **Modul** hat ein **Interface** (alles, was ein Aufrufer wissen muss) und eine Implementierung; die **Naht** ist der Ort des Interface; ein **Adapter** erfuellt ein Interface an einer Naht; ein Modul ist **tief**, wenn viel Verhalten hinter kleinem Interface liegt.

## 1. Module

| Modul | Ordner | Interface (Kurzform) | Versteckt | Adapter und Testzugang |
|---|---|---|---|---|
| physik | `src/physik/` | `auswerten(konfiguration, optionen) -> Auswertung` (mit `Anzeigewerte` und `Warnung`; diese Typen liegen in physik, weil sie physik-Typen enthalten und nicht per postMessage gehen), `begrenze(konfiguration)`, dazu die Einzelformeln (Stufe 0) | Formelsammlung aus physik.md 9, Tabellen (Transmission, Extinktion, Bortle, Seeing-Stufen), Arbeitsmassstab, Kernaufbau (Bessel, Airy, Moffat, Gauss, kleine FFT), Blendungsregel | Keine Adapter, keine Abhaengigkeiten. Vitest ruft Einzelformeln (A-Q1) und `auswerten` direkt; Tabellen-Tests T1 bis T6 ueber `kontrastUebertragung(kern, periode)` |
| naht | `src/naht/` | nur Typen: `Konfiguration` (mit `Geraet`, `Objektzustand`; ab Version 2 mit `Stern`, `Isophote`, `Paareingaben`), `Fenster`, `Simulationsparameter`, `Raster`, `Quelle` | nichts; die Dateien sind der Vertrag | wird von physik geschrieben, von bild und ui gelesen; `Quelle` implementiert daten, ruft bild; strukturiert klonbar |
| bild | `src/bild/` | `rendere(parameter, quelle, falter, zwischen) -> Anblick`; `Falter` mit `falte(raster, kern)`; `waehleFalter() -> Falterwahl` (ein `Falter`, der WebGL2 oder JavaScript nutzt und Art, Grund und Anzeigegrenze meldet) | Ausschnitt mitteln (Integralbild oder Kachelzugriff), Trabanten malen, Faltung, Tonwert, Maske, Skalierung auf Fenster; Wiederverwendung nach Stufenschluessel | Zwei Adapter fuer `Falter`: WebGL2 (Produktion) und JavaScript (Tests, Fallback). Tests mit synthetischen Rastern und Kernen (Delta, Kasten), ohne physik |
| daten | `src/daten/` | `ladeGeraete() -> Geraeteeintrag[]` mit `mitOkular(eintrag.geraet, okular) -> Geraet`, `ladeBildnachweise()`, `ladeObjekte(nachweise)`, `QuelleKacheln` mit `lade(mitte, breite, massstab)` (asynchron, Kacheln holen) und `ausschnitt(mitte, breite, massstab)` (synchron, Vertrag `Quelle`) | JSON-Validierung, Kachelpyramide, Stufenwahl, Nachladen, Cache | Adapter fuer Tests: Quelle aus synthetischem Bild im Speicher |
| zustand | `src/zustand/` | `ausUrl(search, kataloge) -> { konfiguration, hinweise }` (Hinweise aus `begrenze`), `inUrl(konfiguration, kataloge) -> string`, `voreinstellung(kataloge)`, `listeneintragZu(geraete, geraet)` (Issue #63, gemeinsam fuer URL und Auswahlliste) mit `Kataloge = { geraete, objekte, nachweise }` aus daten (Issue #16: die Konfiguration traegt volles Geraet und vollen Objektzustand, die URL nur ids und Zahlen; Parameter in `src/zustand/LIESMICH.md`) | Parameter-Namen in der URL, Defaults A-D9, Rueckfall je Parameter, Rueckwaertskompatibilitaet (`v=1`) | reine Funktionen, Rundreise-Tests mit echtem und synthetischem Katalog |
| ui | `src/ui/` | `starte(wurzelElement)` | Formular, Regler, Gesichtsfeld-Canvas, Zoomansicht, Infopanel, Seitenfuss mit Lizenz und Bildnachweisen (`bildnachweise.ts`), Tooltips aus `src/texte.ts`, Worker-Anbindung; `Steuerung` (`steuerung.ts`) haelt Konfiguration, die letzte Auswertung (deren Parameter als `vorher` an auswerten gehen) und den `Zwischenspeicher` je Quelle: `aendere` begrenzt, schreibt die URL und rechnet hoechstens einmal pro Frame | Browser-Test in Phase 6 von Hand; die Steuerung mit injizierter Umgebung in Vitest; Logik bleibt in physik und zustand |
| tools | `tools/` (Python) | Skripte: `bild_aufbereiten.py`, `mond_kacheln.py`, `bildnachweis_pruefen.py` | Zuschneiden, Nordrichtung, Skalieren, Kacheln, WebP | laufen offline; Ergebnis liegt unter `daten/` |

Abhaengigkeitsrichtung: `ui -> zustand, physik, bild, daten`; `bild -> naht`; `physik -> naht`; `daten -> naht` (Typen fuer Geraet, Objektzustand, Raster und Quelle); `zustand -> naht, daten, physik` (Kataloge und `objektzustand` aus daten, nur `begrenze` aus physik). `bild` importiert `physik` nicht; der Kern kommt als Daten ueber die Naht. Der Worker fuer `bild` ist ein Ausfuehrungsort, keine eigene Naht: dieselben Typen gehen per postMessage.

## 2. Design it twice: drei Entwuerfe fuer die Naht

Drei Subagenten haben die Naht physik zu bild unabhaengig entworfen (Volltexte in `docs/entwuerfe/naht-variante-1.md` bis `-3.md`).

**Variante 1, minimal:** eine Funktion `simuliere(konfiguration, ansicht) -> Simulation` mit normierter Konfiguration, Anzeigewerten, Hinweisen und `Simulationsparameter` (Gesichtsfeld, Arbeitsraster, Kern als Float32Array, Helligkeitsfaktoren, sichtbare Trabanten). Zustandslos, Memoisierung Sache des Aufrufers. Staerke: ui kennt keine Formel, bild keine Physik; die Naht ist schmal in Funktionen. Schwaeche: breit in Daten (rund 30 Felder), jeder Reglerzug zahlt den Kernaufbau, Hinweis-Codes als stilles Vokabular.

**Variante 2, flexibel:** die Naht traegt eine Szenenbeschreibung aus offenen Vereinigungstypen: PSF als Liste von Komponenten (Airy, Moffat, Gauss) mit Farbkanaelen, Ebenen (Hintergrund, Flaeche, Punktquelle), Nachbearbeitungen, Orientierung; bild baut den Kern selbst ueber `physik.baueKern`. Jeder Kann-Punkt (Strehl, Dispersion, Purkinje, Doppelsterne, Deep-Sky) ist ein neuer Listeneintrag. Staerke: Erweiterungen ohne Nahtaenderung, Photometrie fuer Flaeche und Punktquelle einheitlich hergeleitet. Schwaeche: rund 20 Typen, vier `switch` in bild mit zwei Adaptern, Vorhalte, die in Version 1 leer bleiben; bild importiert physik.

**Variante 3, haeufigster Aufrufer:** die Naht besteht aus vier Stufen, die den Arbeitsschritten von bild entsprechen (Quellbild-Ausschnitt mit Punktquellen, Kern, Helligkeit, Fenster), jede mit einem Schluessel aus den gerundeten Eingangsgroessen; bild ueberspringt Stufen mit gleichem Schluessel, physik ueberspringt den Kernaufbau ueber ein gereichtes `vorher`. `optik(geraet)` ist die einzige Stelle, die ueber Fernrohr, Fernglas und Auge verzweigt; danach gibt es nur Skalare. Zoom und Verschieben sind nur ein anderes `Fenster`. Tabellen-Tests ueber `kontrastUebertragung(kern, periode)` ohne Pixel. Staerke: Normalfall `auswerten(konfig)` trivial, Wiederverwendung ist die Form des Datentyps, Sonderfaelle sauber eingeebnet. Schwaeche: physik muss das Fenster kennen; Zoom loest Kernaufbau aus; nur ein `vorher` statt Cache.

Ausnahmen von "`optik()` verzweigt allein ueber die Geraeteart", die nichts aus der Art berechnen, sondern nur Felder je Art behandeln: `begrenze()` in physik (schneidet die Felder je Art), `mitOkular()` in daten (Okular nur beim Fernrohr) und die URL-Serialisierung in zustand (`inUrl`/`ausUrl` schreiben und lesen je Art andere Parameter).

### Vergleich

- **Tiefe**: Variante 1 und 3 liefern bild einen fertigen Kern und machen bild tief und dumm; Variante 2 verlagert Kernaufbau und Fallunterscheidungen nach bild und macht die Naht breit. Variante 3 hat zusaetzlich Tiefe in `optik()`, wo die Geraetearten verschwinden.
- **Lokalitaet**: In 1 und 3 liegt alle Physik in physik; in 2 stehen Formeln in physik, aber die Interpretation der Szene (Ebenenarten, Kanaele) in beiden Modulen. Variante 3 legt Caches dorthin, wo die Zwischenergebnisse liegen (Kern bei physik ueber `vorher`, Texturen bei bild ueber Schluessel).
- **Nahtlage**: 1 und 3 legen die Naht hinter den Kernaufbau (Daten wandern), 2 davor (Rezept wandert). Fuer zwei Falt-Adapter und einen Worker ist "Daten wandern" einfacher: der Worker braucht keine Physik, Bild-Tests brauchen keine Physik.
- **Erweiterbarkeit**: 2 gewinnt auf dem Papier, zahlt aber jetzt. Die Kann-Punkte, die am ehesten kommen (Strehl, ruhiger Moment, Schleier), passen in 1 und 3 ohne Nahtaenderung in Kernbeschreibung und Helligkeit; Dispersion braucht in allen drei Varianten einen Kern je Farbkanal und ist der einzige teure Umbau.

## 3. Entscheidung: Variante 3 als Grundgeruest, Buendelung aus Variante 1

Wir nehmen die vier Stufen mit Schluesseln, `optik()`, `Fenster` und die Testhelfer aus Variante 3 und uebernehmen aus Variante 1 die Rueckgabe der normierten Konfiguration und der Hinweise im selben Aufruf, damit Felder und URL (A-F7, A-F8, A-D8) aus einer Quelle geschrieben werden. Aus Variante 2 uebernehmen wir die Punktquellen mit `sichtbar: false` und `grund: "blendung"` (ui kann die Blendungsregel erklaeren) und die Photometrie-Konvention "relativ zu Quellweiss". Vorhalte fuer Kanaele, Ebenenlisten und Nachbearbeitung lassen wir weg; sie kommen, wenn ein Kann-Punkt sie braucht.

### Die Naht (Zielbild, verbindlich fuer Phase 4 und 5; Details in `docs/entwuerfe/naht-variante-3.md`, Abschnitt 1)

```ts
// src/naht/simulationsparameter.ts: nur Typen, strukturiert klonbar
export interface Fenster { breiteArcsec: number; mitteXArcsec: number; mitteYArcsec: number; px: number }

export interface Quellbild {      // Stufe 1: Ausschnitt mitteln, Trabanten in die Punktebene malen
  schluessel: string; massstabArcsecProPx: number; rasterPx: number;
  mitteXArcsec: number; mitteYArcsec: number; punktquellen: Punktquelle[];
}
export interface Punktquelle { name: string; xArcsec: number; yArcsec: number; durchmesserArcsec: number;
  helligkeitRelativ: number; sichtbar: boolean; grund?: "blendung" }
export interface Kern {           // Stufe 2: Faltung
  schluessel: string; beschreibung: Kernbeschreibung; groesse: number; radius: number;
  massstabArcsecProPx: number; daten: Float32Array;   // Summe 1, punktsymmetrisch, >= 0
}
export interface Kernbeschreibung { oeffnungMm: number; obstruktion: number; seeingFwhmArcsec: number;
  augeFwhmArcsec: number; massstabArcsecProPx: number }   // auf 4 Stellen gerundet
export interface Helligkeit {     // Stufe 3: Tonwert
  schluessel: string; faktorObjekt: number; hintergrundRelativ: number; hintergrundMagProArcsec2: number;
  punktFaktor: number; punktExponent: number }          // Punktebene, Issue #72
export interface Gesichtsfeld { form: "kreis" | "rechteck"; breiteArcsec: number; hoeheArcsec: number }
export interface Simulationsparameter { quellbild: Quellbild; kern: Kern; helligkeit: Helligkeit;
  gesichtsfeld: Gesichtsfeld; fenster: Fenster }        // Stufe 4: Anzeige
```

```ts
// src/physik/index.ts: Einstieg fuer ui und Tests
export function begrenze(k: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] };  // A-F8, wirft nie
export function auswerten(k: Konfiguration, o?: { fenster?: Fenster; anzeigePx?: number; vorher?: Simulationsparameter }): Auswertung;
export interface Auswertung { parameter: Simulationsparameter; anzeige: Anzeigewerte; warnungen: Warnung[] }
// Stufe 0 (Einzelformeln, A-Q1), Stufe 1 (optik, atmosphaere, aufloesung, helligkeit, punktquellen,
// arbeitsmassstab, kernbeschreibung), Stufe 2 (baueKern) und die Testhelfer kontrastUebertragung,
// kernFwhmArcsec sind ebenfalls exportiert; siehe Variante 3, Abschnitt 1.3.
```

Vertrag fuer bild: Anblick = tonwert(falte(mittele(quelle, quellbild), kern), faltePunkte(punktquellen, kern), helligkeit), maskiert mit `gesichtsfeld` (zentriert auf die Fenstermitte: die Feldblende bleibt in der Mitte, beim Verschieben nach A-D2 wandert das Objekt; Entscheidung 2026-10-26, Issue #6), gezeichnet in `fenster`. Gleicher Schluessel einer Stufe heisst gleiches Ergebnis; bild darf Zwischenergebnisse behalten. Koordinaten: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Bogensekunden. Helligkeiten relativ zu Quellweiss (1,0 = Flaechenhelligkeit, die Weiss im Quellbild bedeutet), linear. Ausnahme Stufe 3: `Helligkeit.faktorObjekt` und `hintergrundRelativ` sind Anzeigehelligkeiten (GLOSSARY: linear, 1 = Bildschirmweiss), physik bildet die Flaechenhelligkeit im Okular darauf ab (Issue #55, ADR-0002 Nachtrag 2026-10-27, physik.md Abschnitt 12); `faktorObjekt` darf 1 uebersteigen, begrenzt wird erst das Pixel beim Zeichnen (Issue #72). Punktquellen werden nicht ins Objektraster gemalt, sondern in eine eigene Punktebene, die bild lokal mit dem Kern faltet und je Arbeitspixel mit `Helligkeit.punktFaktor` (Leuchtdichte von Quellweiss im Okular relativ zu Anzeigeweiss) und `punktExponent` abbildet: Pixel = faktorObjekt * objekt + hintergrundRelativ + min(1, (punktFaktor * punkt)^punktExponent) (Issue #72, ADR-0002 Nachtrag, physik.md Abschnitt 14). Die Punktebene liegt im Zwischenspeicher unter demselben Schluessel wie Stufe 2.

Invarianten, die Tests absichern: Kern Summe 1 (Toleranz 1e-6), ungerade Groesse 5 bis 81, Symmetrie; `rasterPx * massstab = fenster.breiteArcsec`; Arbeitsmassstab >= Gesamt-FWHM / 2,5; Schluessel gleich genau dann, wenn gerundete Felder gleich; `begrenze` wirft nie, `auswerten` wirft `PhysikFehler` nur bei Programmierfehlern (NaN, unbegrenzte Eingaben).

### Was das fuer die Umsetzung heisst

1. `src/naht/simulationsparameter.ts` und `src/physik/` zuerst (Stufe 0 mit Tests, dann Stufe 1 bis 3, dann `auswerten`). Der Kernaufbau wird aus dem Prototyp (`prototyp/faltung.html`, Block `logik`, Branch `prototyp-faltung`) nach TypeScript uebertragen und gegen die Prototyp-Werte getestet (Kern-FWHM 2,52" fuer 80 mm bei 2", Energie im Airy-Kern 0,838 bei 0 % Obstruktion).
2. `src/bild/` mit JavaScript-Falter und synthetischen Tests, danach WebGL2-Falter mit dem Gleichheitstest aus dem Prototyp (maximale Abweichung 1 Stufe).
3. `src/daten/` mit JSON-Validierung und Quelle aus Einzelbild; Kachelpyramide, sobald das Mondbild aufbereitet ist.
4. `src/zustand/` und `src/ui/` zuletzt; die UI haelt `letzte` fuer `vorher` und baut `Fenster` fuer Uebersicht, Zoom und Verschieben.

Erster durchgehender Pfad (Milestone M1 in Phase 4): Mond im 80 mm Refraktor, feste Konfiguration, JavaScript-Falter, ein Fenster, ohne Trabanten.

## 4. Offen fuer Phase 4

- Grenze der Kerngroesse 81 px gegen sehr grosse Anzeigen (2048 px) bei blossem Auge: Arbeitsmassstab faengt das ab, Test noetig. **Erledigt (Issue #4):** der Kern aus dem Arbeitsmassstab ist hoechstens 17 px (blosses Auge, 5 Grad auf 2048 px: 25''/px, 17 px; selbst mit reinem Fenstermassstab 45 px), Test in `src/physik/kern.test.ts`; Details im Nachtrag zu ADR-0002.
- Worker oder Hauptthread fuer bild: mit WebGL2 reicht der Hauptthread (Faltung in Millisekunden); der Worker ist nur fuer den JavaScript-Fallback interessant. Vorschlag: Version 1 ohne Worker, Naht bleibt klonbar.
- Kalibrierkonstante fuer die Tabellen-Tests T1 bis T5 (Kontrastschwelle "erkennbar") wird in Phase 6 am Bild festgelegt, die Tests frieren sie danach ein. **Erledigt (Issue #21):** `SCHWELLE_ERKENNBAR` = 0,125 fuer die Delle eines gefalteten Stufenprofils (`profilDelle`, physik.md 8.1) statt der MTF; Tests fuer T1 bis T6 in `src/physik/validierung.test.ts`, Herleitung in `docs/validierung.md`.
- Speicher des Kachel-Caches (Issue #66, Messung aus PR #62: Mond-Pyramide 149 MB Float32, JS-Heap bis 345 MB). **Erledigt (Issue #66):** Kacheln aus dem Browser liegen als 8-Bit-sRGB im Cache (`KachelSrgb`) und werden erst in `QuelleKacheln.ausschnitt` ueber dieselbe Tabelle wie `rgbaZuRaster` linearisiert; der Ausschnitt ist bitgleich (Test in `kacheln.test.ts`). Gemessen in Node mit der Mond-Geometrie: Pyramide 148,6 statt 37,2 MB, feinste Stufe 113,2 statt 28,3 MB; Ausschnitt (Median aus 20) bei 300-fach (600'') 2,5 -> 4,7 ms, bei 150-fach (1200'') 11,4 -> 19,7 ms, ganze Scheibe auf Stufe 0 30,0 -> 52,7 ms. Eine Grenze in Bytes haette nicht geholfen: die Kacheln einer laufenden Anfrage sind geschuetzt.

## 5. Version 2: Erweiterung der Naht (Phase 3 Version 2, 2026-10-29)

Neu in Version 2: Objektklassen Doppelstern und Deep-Sky-Objekt (A-Z9, A-Z10), Sterne mit Farbe (A-P12), Wahrnehmungsschwelle (A-P11), unaufgeloeste Zustaende (A-P10), neue Konstanten der Anzeige (A-P13). Modell und Konstanten stehen in ADR-0004, Datenformat im Nachtrag zu ADR-0003. Die vier Stufen aus Abschnitt 3 bleiben.

### 5.1 Design it twice

Zwei Subagenten haben die Erweiterung unabhaengig entworfen (Volltexte `docs/entwuerfe/naht-v2-variante-a.md` und `-b.md`).

**Variante A, minimal-additiv:** optionale Felder an `Objektzustand` (`klasse`, `sterne`, `isophoten?`, `paar?`, `quelle?`) und `Helligkeit` (`mischgewicht`, `deepSky?`); eine Pixelformel mit drei Faellen; Deckkraft ueber einen Schwellenwert q* je Objekt. Staerke: kleinster Umbau, V1-Ausdruck als Sonderfall nachweisbar, Sterne laufen durch den Pfad der Trabanten. Schwaeche: gueltige Feldkombinationen haengen an `klasse`, die Typen schliessen falsche nicht aus; Deckkraft und Farbe der Sterne stecken im Schluessel von Stufe 1, ein Zug an Bortle faltet bei M42 und M45 das Objektraster neu.

**Variante B, Ebenenliste:** Stufe 3 wird `Abbildung` = Himmel + Liste typisierter Ebenen (`sonnensystem`, `deep_sky`, `punkte`); ein unaufgeloester Zustand ist zwei Ebenen auf demselben Inhalt; `Objektzustand.flaeche?` als Union; Deckkraft als Stuetzkurve je Isophote; Stufe 1 getrennt in Objekt und Punkte. Staerke: die drei Ebenen aus ADR-0004 als drei Typen, Kann-Punkte (Erdlicht) als weitere Ebene, Bortle-Zug rechnet nur die Punktebene neu. Schwaeche: Bruch `quelle` -> `flaeche?.quelle` quer durch alle Module, rund acht neue Typen, Reihenfolgekonvention traegt die Bitgleichheit.

Gemeinsam (in beiden unabhaengig gefunden, damit gesetzt): Flaechentabelle aus `tools/` statt Histogramm in daten oder bild; Schwelle je Objekt, Anwendung je Pixel; Punktebene bleibt einkanalig (Fluss fuer die Kompression), Farbe und Deckkraft in einer optionalen dreikanaligen Faerbung, die `punktebene.ts` in JavaScript faltet; Falter (JS, WebGL2) unveraendert; die Objektmitte blendet nur bei Sonnensystem-Objekten (sonst blendete M13 seine eigenen Sterne); T5 Mars 6'' bei kleiner Vergroesserung und T6 aendern sich gewollt (A-P10).

### 5.2 Entscheidung: Hybrid (Herbert, 2026-10-29)

Variante A als Geruest. Aus Variante B: Stufe 1 getrennt in Objekt- und Punkte-Schluessel; fester Bezug 0 mag/arcsec^2 fuer `helligkeitRelativ` bei Zustaenden ohne Quellbild. Aus dem Prototyp (ADR-0004): additiver Sockel statt Verstaerkungsfaktor G. Gruende: die Ebenenliste zahlt jetzt fuer Kann-Punkte, die nicht kommen (dieselbe Abwaegung wie bei Variante 2 in Version 1); die Deckkraft ueber q* ist im Prototyp erprobt und braucht in bild zwei Zahlen; ohne getrennten Punkte-Schluessel faltete der JavaScript-Fallback bei jedem Bortle-Zug das Objektraster neu (bis 0,6 s).

### 5.3 Die Naht Version 2 (Zielbild, verbindlich fuer Phase 4 und 5)

```ts
// src/naht/konfiguration.ts (Ergaenzungen)
export const OBJEKTKLASSEN = ["sonnensystem", "doppelstern", "deep_sky"] as const;
export type Objektklasse = (typeof OBJEKTKLASSEN)[number];
/** Stern eines Doppel-, Mehrfachsterns oder Deep-Sky-Objekts: Lage wie Trabant, kein Durchmesser, B-V. */
export interface Stern { name: string; dxArcsec: number; dyArcsec: number; magnitude: number; bv: number }
/** Zeile der Flaechentabelle: Isophote am Himmel (mag/arcsec^2, V) und eingeschlossene Flaeche (arcsec^2). */
export interface Isophote { magProArcsec2: number; flaecheArcsec2: number }
/** Eingaben des freien Paars (A-Z9); Quelle der Wahrheit fuer URL und begrenze. */
export interface Paareingaben { trennungArcsec: number; magnitudeA: number; magnitudeB: number; bvA: number; bvB: number }
export interface Objektzustand {
  kennung: string;
  klasse: Objektklasse;          // aus objekte.json "typ": mond, planet -> sonnensystem
  durchmesserArcsec: number;     // Doppelstern: groesster Sternabstand (nur Anzeige)
  magnitude: number;             // Doppelstern: Gesamthelligkeit
  quelle?: { breitePx: number; hoehePx: number; massstabArcsecProPx: number; weissMagProArcsec2: number };  // fehlt: Doppelstern, M45
  trabanten: Trabant[];          // nur sonnensystem
  sterne: Stern[];               // doppelstern, deep_sky; sonst []
  isophoten?: Isophote[];        // nur deep_sky mit Quellbild; mag aufsteigend, Flaeche steigend
  paar?: Paareingaben;           // nur das freie Paar (kennung "frei")
}
```

```ts
// src/naht/simulationsparameter.ts (Aenderungen)
export interface Quellbild {
  schluessel: string;            // Objektraster: kennung, massstab, rasterPx, mitte; OHNE Punktquellen
  massstabArcsecProPx: number; rasterPx: number; mitteXArcsec: number; mitteYArcsec: number;
  punkte: { schluessel: string; punktquellen: Punktquelle[] };   // Stufe 1b: Lage, Fluss, Deckkraft, Farbe
}
export interface Punktquelle {
  name: string; xArcsec: number; yArcsec: number; durchmesserArcsec: number;
  helligkeitRelativ: number;     // relativ zu Quellweiss; ohne Quellbild relativ zu 0 mag/arcsec^2
  sichtbar: boolean;
  grund?: "blendung" | "unter_schwelle";   // unter_schwelle: gezeigte Deckkraft P' unter 1e-3, nicht gemalt
  deckkraft?: number;            // (0, 1], Blackwell; fehlt = 1
  farbe?: [number, number, number];        // linear sRGB (D65), Y = 1 (A-P12); fehlt = grau
}
export interface Helligkeit {
  schluessel: string;
  faktorObjekt: number;          // f: Anzeigehelligkeit von Quellweiss, Anzeigeweiss 9,2 (A-P13 i)
  hintergrundRelativ: number;    // h = min(1, s^n)
  hintergrundMagProArcsec2: number;
  punktFaktor: number;           // aP: Leuchtdichte des Bezugs im Okular relativ zum Punktweiss 6,4 (A-P13 ii)
  punktExponent: number;         // n = 1/3; f = aP^n gilt nicht mehr (zwei Weiss)
  mischgewicht: number;          // g in [0, 1) (A-P10), nur sonnensystem; 0 = Flaeche wie Version 1
  deepSky?: {                    // nur deep_sky mit Quellbild (ADR-0004 Ebene b)
    faktor: number;              // a: Leuchtdichte von Quellweiss im Okular relativ zum Anzeigeweiss
    himmel: number;              // s: Leuchtdichte des Himmels im Okular relativ zum Anzeigeweiss
    schwelleRelativ: number;     // q*: Pixelwert (relativ zu Quellweiss) an der sichtbaren Isophote
    breite: number;              // 0,484 (Blackwell); Konstante aus physik, nicht in bild
    sockel: number;              // Anzeigehelligkeit, >= 0 (Mindestsichtbarkeit, ADR-0004)
  };
}
// Stufe 2 (Kern) und 4 (Gesichtsfeld, Fenster) unveraendert.
```

```ts
// src/physik/auswerten.ts (Ergaenzungen)
export interface Anzeigewerte { /* Version-1-Felder */
  grenzgroesseMag: number;                     // Sterne am Okular, mit Extinktion (A-P11)
  isophote?: { magProArcsec2: number; flaecheArcsec2: number; alleSichtbar: boolean };  // deep_sky
  mischgewicht?: number;                       // sonnensystem, fuer den Hilfetext "unaufgeloest"
}
export interface Warnung {
  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d" | "ueberstrahlung";  // wert |Delta m|, grenze 4
  wert: number; grenze: number;
  sterne?: [string, string];                   // nur ueberstrahlung
}
```

**Vertrag fuer bild (`tonwert`, je Arbeitspixel).** Eingaben: q gefaltetes Objektraster (1 oder 3 Kanaele; fehlt ohne Quellbild, dann q = 0), p gefaltete Punktebene (1 Kanal, Fluss), optional c gefaltete Faerbung (3 Kanaele: Summe je Stern Fluss mal Deckkraft mal Farbe). Mit f, h, aP, n, g, d = deepSky aus `Helligkeit`:

| Fall | Flaechenanteil F_k |
|---|---|
| d fehlt, g = 0 | `f * q_k + h` (Version 1, gleicher Ausdruck, gleiche Reihenfolge) |
| d fehlt, g > 0 | `(1 - g) * f * q_k + h + g * min(1, (aP * qH_k)^n)`; qH ist das Objektraster mit `halokern` gefaltet (Issue #135, physik.md 28; ohne qH gilt q) |
| d vorhanden | `P = Phi((q / d.schwelleRelativ - 1) / d.breite)`; `F = h + P * (min(1, (d.faktor * q + d.himmel)^n) - h + d.sockel)` |

Punktanteil, nur wo p > 0: `W = min(1, (aP * p)^n)`; `Pixel_k = F_k + (c ? c_k / p : 1) * W`. Ohne c (alle Punktquellen grau, Deckkraft 1) ist das der Ausdruck aus Version 1. Gibt es c, hat das Ergebnis 3 Kanaele. Phi (Normalverteilung) ist Mathematik in bild, alle physikalischen Konstanten kommen ueber die Naht. Begrenzt wird wie bisher erst das Pixel beim Zeichnen.

**Bitgleichheit.** `mischgewicht` ist stetig abgeschnitten, `g = max(0, (g_roh - 0,005) / 0,995)`, also exakt 0 fuer x = theta V / 60'' > 24. Damit rechnen T1 bis T4 und T5 Mars 14'' den Ausdruck aus Version 1; ein Regressionstest mit den alten Konstanten (beide Weiss 3,35) prueft gleiche Bytes. Gewollt anders: T6 und Mars 6'' bei V < 240.

### 5.4 Neue reine Funktionen in physik

| Datei | Funktion | Quelle |
|---|---|---|
| `schwelle.ts` | `leuchtdichteCdM2(mu)`, `kontrastschwelle(flaecheSr, bCdM2)` (Gl. 47, F = 1, Nullhintergrund 1e-5), `schwelleAmOkular(optik, atmosphaere, muHimmel, flaecheArcsec2)` (Gl. 77 bis 80 mit F und F_T), `grenzgroesse(optik, atmosphaere, muHimmel, seeingFwhmArcsec)` (Gl. 68/88, Scheibe 2,8 FWHM), `sichtbareIsophote(isophoten, optik, atmosphaere, muHimmel)` (Vorzeichenwechsel, linear in mu und log Flaeche interpoliert, stetig in V und Bortle), `deckkraft(verhaeltnis)`, `deckkraftStern(m, mLim)` | wahrnehmung.md 1, 2, 4.4 |
| `mischung.ts` | `mischgewicht(winkelgroesseArcsec, vergroesserung)` mit Schnitt, `sockel(a, s, qStern, deltaMinKodes, n)` (sRGB-Kodierung als reine Funktion) | wahrnehmung.md 3.2; ADR-0004 |
| `sternfarbe.ts` | `bvZuTemperatur(bv)`, `temperaturZuRgb(t)` (Y = 1, Tabelle in 0,1 B-V), `beleuchtungAmAugeLx(m, optik, atmosphaere)`, `sternfarbe(bv, lx)` (undefined unter Z * 10^-0,92 = 3,05e-7 lx, aus 2,3 mag; frueher gerundet 3,1e-7; Nachtrag 2026-10-29) | wahrnehmung.md 5 |
| `doppelstern.ts` | `freiesPaar(e: Paareingaben): Objektzustand`, `ueberstrahlung(sterne): Warnung[]` (Abstand unter 10'', abs(Delta m) >= 4) | doppelsterne.md 3.2, 5 |

`freiesPaar` liegt in physik, weil `begrenze` (einzige Stelle fuer Bereiche, A-F8) nach dem Schneiden von `paar` die Sterne neu bilden muss und physik daten nicht importiert; die Gesamthelligkeit ist eine Formel. zustand liest `z=frei` mit den Paar-Parametern und ruft `freiesPaar`, ui ebenso aus dem Formular; analog zu `mitOkular` beim freien Geraet.

Reihenfolge in `auswerten`: optik -> atmosphaere -> aufloesung -> fenster -> arbeitsmassstab (ohne `quelle` faellt die Quellgrenze weg) -> kernbeschreibung -> baueKern -> **grenzgroesse** -> punktquellen (Trabanten und Sterne; Sterne mit `STERN_DURCHMESSER_ARCSEC` = 0,01'', Deckkraft, Farbe) -> helligkeit (intern **mischgewicht**, bei deep_sky **sichtbareIsophote** und **sockel**) -> anzeige -> warnungen mit **ueberstrahlung**.

Schluessel: Stufe 1 Objekt ohne Punktquellen (Bortle, Transparenz und Seeing aendern ihn nicht ueber die Punktquellen; Seeing kann ihn aber ueber den Arbeitsmassstab aendern, ADR-0002: Gesamt-FWHM / 2,5, z. B. Jupiter am 300 mm im Zoomfenster bei Seeing 1'' gegen 3''; Bortle und Transparenz nie); Stufe 1b Punkte mit Lage, Fluss, Deckkraft und Farbe je gemalter Punktquelle; Stufe 2 unveraendert, bild haelt `kern|quellbild` und `kern|punkte` getrennt; Stufe 3 zusaetzlich `mischgewicht` und die `deepSky`-Felder; Stufe 4 unveraendert.

### 5.5 Folgen fuer die Module

| Modul | Aenderung |
|---|---|
| daten | `objekte.ts`: Typen `doppelstern`, `deep_sky`; Felder nach ADR-0003 Nachtrag V2; Pruefung je Klasse (deep_sky mit Bild braucht `isophoten`, streng monoton; Doppelstern ohne Bild; Paar: abs(dx_B - dx_A) = Trennung). `objektzustand()` setzt `klasse`, `sterne`, `isophoten`, `quelle` nur mit Bild. `bildnachweise.ts`: `kennlinie` (log) mit Dekodierung ueber eine 256er-Tabelle wie `srgb.ts`; Einzelbild und Kacheln behalten 8 Bit im Cache. Neue `QuelleLeer` fuer Zustaende ohne Bild. Nachweis der Sterndaten. |
| zustand | `z=frei` mit Paar-Parametern (Namen in `LIESMICH.md`), Rueckfall auf die Vorgaben 2'', 5, 6, 0,6, 0,6; `v=1` bleibt, alte Links gueltig. |
| ui | Objektauswahl gruppiert nach `klasse` (A-D18), Paar-Eingaben nur bei `frei`; Infopanel mit Grenzgroesse, sichtbarer Isophote, Satz zu "unaufgeloest", Warnung `ueberstrahlung`; Hilfetext zu `grund`; Steuerung waehlt `QuelleLeer` ohne `quelle`; Vergleichsbild der Zoomansicht fuer Deep-Sky offen (5.7). |
| bild | `tonwert` nach 5.3; `male.ts` liefert je Scheibchen Deckkraft und Farbe; `punktebene.ts` faltet bei Bedarf die Faerbung mit; getrennte Zwischenspeicher fuer Objekt und Punkte; ohne Quellbild kein `mittele`/`falte`. |
| Falter | unveraendert (Deep-Sky-Raster einkanalig). |
| tools | Deep-Sky-Aufbereitung (Linearisieren, Tonkurve gegen Profil, Quellweiss, log-Kennlinie, Flaechentabelle am dekodierten, sternbereinigten Bild in 0,1-mag-Schritten), Sternlisten aus Gaia/Hipparcos/WDS, `mond_kacheln.py` mit Frame als Parameter. |

### 5.6 Zuordnung der Anforderungen

| Anforderung | Feld oder Funktion |
|---|---|
| A-Z9 Doppelsterne, freies Paar | `klasse "doppelstern"`, `sterne`, `Paareingaben`, `freiesPaar`, `ueberstrahlung`; Kern wie bisher |
| A-Z10 Deep-Sky | `klasse "deep_sky"`, `isophoten`, `Helligkeit.deepSky`, `sichtbareIsophote`, `sockel`; Sterne von M45, Trapez, M13 ueber `sterne` |
| A-P10 unaufgeloest | `mischgewicht`, Fall 2 der Pixelformel, `Anzeigewerte.mischgewicht` |
| A-P11 Schwelle, Grenzgroesse | `schwelle.ts`, `Punktquelle.deckkraft`, `grund "unter_schwelle"`, `Anzeigewerte.grenzgroesseMag` |
| A-P12 Farbe | `sternfarbe.ts`, `Punktquelle.farbe`, Faerbung; Deep-Sky einkanalig grau |
| A-P13, A-P4 V2 | `ANZEIGE_WEISS_MAG_PRO_ARCSEC2` 9,2, `PUNKT_WEISS_MAG_PRO_ARCSEC2` 6,4 |
| A-B2 V2, A-P9 V2 | Bortle wirkt ueber `schwelle.ts`; Beobachter als Konstante `FELDFAKTOR` 1,4 |
| A-D18 | `klasse`, URL `z=frei` |
| A-X7 Mondphasen | nur Daten und `tools/mond_kacheln.py`, keine Nahtaenderung |
| A-X11 grobe Deep-Sky-Bilder | `arbeitsmassstab` begrenzt schon ueber `quelle.massstabArcsecProPx`; Hilfetext |

### 5.7 Offen fuer Phase 4 und 5

- Vergleichsbild der Zoomansicht bei Deep-Sky: linear mit Quellweiss = Bildschirmweiss zeigt den schwachen Halo kaum; Vorschlag beim ui-Issue.
- M13: Quellbild plus Katalogsterne zaehlt doppelt; Bild maskieren oder Sterne plus Restlicht (deep-sky.md 3.4), Entscheidung beim Daten-Issue. Entschieden (Herbert 2026-10-29, Issue #108): Sterne plus Restlicht, Umsetzung in physik.md 27.
- Deckkraft auf das gefaltete q mit einer Tabelle aus dem ungefalteten Bild ist eine Naeherung; bei M57 am 80 mm (T10) pruefen.
- Faerbung mischt ueberlappende Sterne flussgewichtet (Antares B im Halo von A bekommt eine Mischfarbe); hinnehmen oder beim Doppelstern-Issue pruefen.
- Punktebene mit weichem Kernrand (Issue #109, physik.md Abschnitt 24): bild faltet Punktquellen und Faerbung mit dem Kern mal einem cos²-Fenster ueber das aeussere Drittel des Radius, neu normiert. Grund: Unter der Kubikwurzel des Tonwerts wurde der harte, quadratische Kernrand als Quadrat bzw. Farbkante sichtbar. Die Naht bleibt unveraendert.
- Mischanteil im Fall unaufgeloest mit weichem Kernrand (Issue #135, physik.md Abschnitt 28): bild faltet das Objektraster ein zweites Mal mit dem Kern mal $w^{1/n}$ (dasselbe Fenster, nicht neu normiert) und nimmt das Ergebnis nur fuer `g * min(1, (aP * qH)^n)`; Zwischenspeicher `halo`. Grund: das Quadrat um Planeten mit blossem Auge. Die Naht bleibt unveraendert.

Reihenfolge fuer Phase 4: (1) Vorbereitungs-PR Naht-Typen und Konstanten (wie #46 in Version 1), (2) physik `schwelle.ts`, `mischung.ts`, `sternfarbe.ts`, `doppelstern.ts` parallel, (3) bild `tonwert` und Faerbung, daten Kennlinie und neue Typen parallel, (4) Daten und tools je Objekt (Doppelsterne, M45, Mondphasen zuerst, da ohne Kennlinie), (5) zustand und ui, (6) Validierung T1 bis T12 und Nachmessen der Konstanten.
