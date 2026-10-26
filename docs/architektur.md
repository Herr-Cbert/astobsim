# Architektur: Modulschnitt und Naht Physik zu Bild

Ergebnis von Phase 3 (2026-10-23). Begriffe nach `GLOSSARY.md`, Entscheidungen in `docs/adr/`. Vokabular fuer den Schnitt: ein **Modul** hat ein **Interface** (alles, was ein Aufrufer wissen muss) und eine Implementierung; die **Naht** ist der Ort des Interface; ein **Adapter** erfuellt ein Interface an einer Naht; ein Modul ist **tief**, wenn viel Verhalten hinter kleinem Interface liegt.

## 1. Module

| Modul | Ordner | Interface (Kurzform) | Versteckt | Adapter und Testzugang |
|---|---|---|---|---|
| physik | `src/physik/` | `auswerten(konfiguration, optionen) -> Auswertung` (mit `Anzeigewerte` und `Warnung`; diese Typen liegen in physik, weil sie physik-Typen enthalten und nicht per postMessage gehen), `begrenze(konfiguration)`, dazu die Einzelformeln (Stufe 0) | Formelsammlung aus physik.md 9, Tabellen (Transmission, Extinktion, Bortle, Seeing-Stufen), Arbeitsmassstab, Kernaufbau (Bessel, Airy, Moffat, Gauss, kleine FFT), Blendungsregel | Keine Adapter, keine Abhaengigkeiten. Vitest ruft Einzelformeln (A-Q1) und `auswerten` direkt; Tabellen-Tests T1 bis T6 ueber `kontrastUebertragung(kern, periode)` |
| naht | `src/naht/` | nur Typen: `Konfiguration` (mit `Geraet`, `Objektzustand`), `Fenster`, `Simulationsparameter`, `Raster`, `Quelle` | nichts; die Dateien sind der Vertrag | wird von physik geschrieben, von bild und ui gelesen; `Quelle` implementiert daten, ruft bild; strukturiert klonbar |
| bild | `src/bild/` | `rendere(parameter, quelle, falter, zwischen) -> Anblick`; `Falter` mit `falte(raster, kern)`; `waehleFalter() -> Falterwahl` (ein `Falter`, der WebGL2 oder JavaScript nutzt und Art, Grund und Anzeigegrenze meldet) | Ausschnitt mitteln (Integralbild oder Kachelzugriff), Trabanten malen, Faltung, Tonwert, Maske, Skalierung auf Fenster; Wiederverwendung nach Stufenschluessel | Zwei Adapter fuer `Falter`: WebGL2 (Produktion) und JavaScript (Tests, Fallback). Tests mit synthetischen Rastern und Kernen (Delta, Kasten), ohne physik |
| daten | `src/daten/` | `ladeGeraete() -> Geraeteeintrag[]` mit `mitOkular(eintrag.geraet, okular) -> Geraet`, `ladeBildnachweise()`, `ladeObjekte(nachweise)`, `QuelleKacheln` mit `lade(mitte, breite, massstab)` (asynchron, Kacheln holen) und `ausschnitt(mitte, breite, massstab)` (synchron, Vertrag `Quelle`) | JSON-Validierung, Kachelpyramide, Stufenwahl, Nachladen, Cache | Adapter fuer Tests: Quelle aus synthetischem Bild im Speicher |
| zustand | `src/zustand/` | `ausUrl(search) -> Konfiguration`, `inUrl(konfiguration) -> string`, `voreinstellung()` | Parameter-Namen in der URL, Defaults A-D9, Rueckwaertskompatibilitaet | reine Funktionen, Rundreise-Tests |
| ui | `src/ui/` | `starte(wurzelElement)` | Formular, Regler, Gesichtsfeld-Canvas, Zoomansicht, Infopanel, Tooltips aus `src/texte.ts`, Worker-Anbindung | Browser-Test in Phase 6 von Hand; Logik bleibt in physik und zustand |
| tools | `tools/` (Python) | Skripte: `bild_aufbereiten.py`, `mond_kacheln.py`, `bildnachweis_pruefen.py` | Zuschneiden, Nordrichtung, Skalieren, Kacheln, WebP | laufen offline; Ergebnis liegt unter `daten/` |

Abhaengigkeitsrichtung: `ui -> zustand, physik, bild, daten`; `bild -> naht`; `physik -> naht`; `daten -> naht` (Typen fuer Geraet, Objektzustand, Raster und Quelle). `bild` importiert `physik` nicht; der Kern kommt als Daten ueber die Naht. Der Worker fuer `bild` ist ein Ausfuehrungsort, keine eigene Naht: dieselben Typen gehen per postMessage.

## 2. Design it twice: drei Entwuerfe fuer die Naht

Drei Subagenten haben die Naht physik zu bild unabhaengig entworfen (Volltexte in `docs/entwuerfe/naht-variante-1.md` bis `-3.md`).

**Variante 1, minimal:** eine Funktion `simuliere(konfiguration, ansicht) -> Simulation` mit normierter Konfiguration, Anzeigewerten, Hinweisen und `Simulationsparameter` (Gesichtsfeld, Arbeitsraster, Kern als Float32Array, Helligkeitsfaktoren, sichtbare Trabanten). Zustandslos, Memoisierung Sache des Aufrufers. Staerke: ui kennt keine Formel, bild keine Physik; die Naht ist schmal in Funktionen. Schwaeche: breit in Daten (rund 30 Felder), jeder Reglerzug zahlt den Kernaufbau, Hinweis-Codes als stilles Vokabular.

**Variante 2, flexibel:** die Naht traegt eine Szenenbeschreibung aus offenen Vereinigungstypen: PSF als Liste von Komponenten (Airy, Moffat, Gauss) mit Farbkanaelen, Ebenen (Hintergrund, Flaeche, Punktquelle), Nachbearbeitungen, Orientierung; bild baut den Kern selbst ueber `physik.baueKern`. Jeder Kann-Punkt (Strehl, Dispersion, Purkinje, Doppelsterne, Deep-Sky) ist ein neuer Listeneintrag. Staerke: Erweiterungen ohne Nahtaenderung, Photometrie fuer Flaeche und Punktquelle einheitlich hergeleitet. Schwaeche: rund 20 Typen, vier `switch` in bild mit zwei Adaptern, Vorhalte, die in Version 1 leer bleiben; bild importiert physik.

**Variante 3, haeufigster Aufrufer:** die Naht besteht aus vier Stufen, die den Arbeitsschritten von bild entsprechen (Quellbild-Ausschnitt mit Punktquellen, Kern, Helligkeit, Fenster), jede mit einem Schluessel aus den gerundeten Eingangsgroessen; bild ueberspringt Stufen mit gleichem Schluessel, physik ueberspringt den Kernaufbau ueber ein gereichtes `vorher`. `optik(geraet)` ist die einzige Stelle, die ueber Fernrohr, Fernglas und Auge verzweigt; danach gibt es nur Skalare. Zoom und Verschieben sind nur ein anderes `Fenster`. Tabellen-Tests ueber `kontrastUebertragung(kern, periode)` ohne Pixel. Staerke: Normalfall `auswerten(konfig)` trivial, Wiederverwendung ist die Form des Datentyps, Sonderfaelle sauber eingeebnet. Schwaeche: physik muss das Fenster kennen; Zoom loest Kernaufbau aus; nur ein `vorher` statt Cache.

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

export interface Quellbild {      // Stufe 1: Ausschnitt mitteln, Trabanten malen
  schluessel: string; objekt: string; massstabArcsecProPx: number; rasterPx: number;
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
  schluessel: string; faktorObjekt: number; hintergrundRelativ: number; hintergrundMagProArcsec2: number }
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

Vertrag fuer bild: Anblick = tonwert(falte(male(mittele(quelle, quellbild)), kern), helligkeit), maskiert mit `gesichtsfeld` (zentriert auf die Fenstermitte: die Feldblende bleibt in der Mitte, beim Verschieben nach A-D2 wandert das Objekt; Entscheidung 2026-10-26, Issue #6), gezeichnet in `fenster`. Gleicher Schluessel einer Stufe heisst gleiches Ergebnis; bild darf Zwischenergebnisse behalten. Koordinaten: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Bogensekunden. Helligkeiten relativ zu Quellweiss (1,0 = Flaechenhelligkeit, die Weiss im Quellbild bedeutet), linear.

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
- Kalibrierkonstante fuer die Tabellen-Tests T1 bis T5 (Kontrastschwelle "erkennbar") wird in Phase 6 am Bild festgelegt, die Tests frieren sie danach ein.
