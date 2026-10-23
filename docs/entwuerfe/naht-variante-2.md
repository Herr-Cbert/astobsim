<!-- Entwurf eines Subagenten (Design it twice, Variante 2), 2026-10-23, unveraendert uebernommen. Vergleich und Entscheidung: docs/architektur.md -->

# Entwurf Variante 2: Interface `physik` und Naht `physik` -> `bild`, Leitlinie Flexibilitaet

Grundidee: Die Naht traegt keine fertigen Zahlen fuer einen Renderpfad, sondern eine **Szenenbeschreibung** aus offenen, diskriminierten Vereinigungstypen (`art`-Feld). Jede Kann-Erweiterung ist ein neuer Eintrag in einer Liste (PSF-Komponente, Ebene, Nachbearbeitung, Anzeigewert), nicht ein neues Feld an der Naht. Der Kernaufbau (Bessel, FFT, Ueberabtastung) ist eine reine Funktion von `physik`, die `bild` im Worker aufruft; so bleibt die Naht klein und klonbar, und das Wissen ueber die PSF liegt an einem Ort.

## 1. Interface

### 1.1 Eingang: Konfiguration (von `ui` und `daten` zusammengestellt)

```ts
// Alle Winkel am Objekt (Himmel) in Bogensekunden, Laengen in mm, Helligkeiten in mag.
export type Geraet =
  | { art: "fernrohr"; oeffnung_mm: number; brennweite_mm: number; obstruktion: number;   // 0..0,5
      bauart: "refraktor" | "newton" | "sc" | "mak"; transmission?: number }             // Default je Bauart
  | { art: "fernglas"; oeffnung_mm: number; vergroesserung: number; wahres_gf_grad: number; transmission?: number }
  | { art: "auge" };                                                                     // 6 mm, V = 1, 5 Grad Ausschnitt

export interface Okular { brennweite_mm: number; scheinbares_gf_grad: number }           // nur bei art "fernrohr"

export interface Bedingungen { seeing_fwhm_arcsec: number; bortle: 1|2|3|4|5|6|7|8|9;
  transparenz: "klar" | "leicht_diesig" | "diesig"; hoehe_grad: number }

export interface Trabant { name: string; dx_arcsec: number; dy_arcsec: number; durchmesser_arcsec: number; magnitude: number }
export interface Objektzustand {                       // 1:1 aus objekte.json (Recherche objekte.md 6.2)
  id: string; objekt: "mond" | "mars" | "jupiter" | "saturn" | string;
  winkelgroesse_arcsec: number; polar_arcsec?: number; magnitude: number;
  flaechenhelligkeit_mag_arcsec2: number;              // Bezug fuer Quellbild-Weiss (mittlere Scheibe)
  ringe_arcsec?: number; monde: Trabant[];
  quellbild: { id: string; bogensekunden_pro_pixel: number; durchmesser_px: number; norden_oben: boolean } }

// Offener Sack fuer Modellschalter: jeder Kann-Punkt kommt als optionales Feld mit Default hinein.
export interface Modelloptionen { strehl?: number; ruhiger_moment?: boolean; dispersion?: boolean;
  purkinje?: boolean; orientierung?: "aufrecht" | "bauart" }

export interface Konfiguration { geraet: Geraet; okular?: Okular; objekt: Objektzustand;
  bedingungen: Bedingungen; optionen?: Modelloptionen }

export interface Anzeigerahmen { anzeige_px: number; px_je_fwhm?: number;              // Default 2,5
  arbeitsmassstab_arcsec_px?: number }                                                  // erzwingen (Vergleich A-D13)
```

### 1.2 Funktionen von `physik` (alle rein, deterministisch, synchron)

```ts
export function begrenze(k: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] }; // A-F8, nie werfen
export function berechneOptik(g: Geraet, ok?: Okular): Optikwerte;            // V, AP, wGF, Rayleigh, Dawes, Airy-FWHM
export function berechneAtmosphaere(b: Bedingungen): Atmosphaerenwerte;       // X, k, a, FWHM_s (Hoehe), r0
export function berechneAufloesung(o: Optikwerte, a: Atmosphaerenwerte, opt?: Modelloptionen): Aufloesungsgrenzen;
export function berechneHelligkeit(g: Geraet, o: Optikwerte, a: Atmosphaerenwerte, b: Bedingungen): Helligkeitswerte;
export function berechneAnzeige(k: Konfiguration): Anzeige;                                     // fuer ui
export function berechneSimulation(k: Konfiguration, r: Anzeigerahmen): Simulationsparameter;   // fuer bild
export function baueKern(psf: PsfBeschreibung, massstab_arcsec_px: number): Kern[];             // fuer bild, im Worker
```

Reihenfolge: `begrenze` zuerst (die anderen setzen begrenzte Werte voraus und werfen `PhysikFehler` bei NaN, Werten ausserhalb der A-F8-Grenzen, fehlendem Okular bei `fernrohr`). `berechneAnzeige` und `berechneSimulation` sind Kompositionen der vier Teilfunktionen; die Teilfunktionen bleiben oeffentlich fuer A-Q1-Tests und fuer "Wie rechnet astobsim" (A-D14).

Leistung: `begrenze` bis `berechneSimulation` ohne Arrays, zusammen unter 0,1 ms. `baueKern` 1 bis 20 ms je Kanal (FFT 64 bis 1024, Prototyp), Kerngroesse 5 bis 81 px, Obergrenze Radius 40 Arbeitspixel; darueber `PhysikFehler("kern_zu_gross")`, was bei korrektem Arbeitsmassstab nicht vorkommt (Invariante: Arbeitsmassstab >= Gesamt-FWHM / px_je_fwhm).

### 1.3 Naht: `Simulationsparameter` (strukturiert klonbar: nur Zahlen, Strings, Booleans, Arrays, Objekte, Float32Array)

```ts
export interface Simulationsparameter {
  version: 1;                                   // Naht-Version, fuer Tests und spaetere Migration
  gesichtsfeld: Gesichtsfeld;
  massstab: { arbeit_arcsec_px: number; anzeige_arcsec_px: number; arbeitsraster_px: number };
  psf: PsfBeschreibung;                         // Gesamt-PSF als Rezept, nicht als Zahlen
  photometrie: Photometrie;
  ebenen: Ebene[];                              // Renderreihenfolge, Hintergrund ist Ebene 0
  nachbearbeitung: Nachbearbeitung[];           // nach der Faltung, in Reihenfolge
  protokoll: Aufloesungsgrenzen;                // nur zur Diagnose, bild liest es nicht
}

export interface Gesichtsfeld {
  form: "kreis" | "rechteck"; durchmesser_arcsec: number;            // bei rechteck: Kantenlaenge
  orientierung: { spiegeln_x: boolean; spiegeln_y: boolean; drehung_grad: number } }  // V1: Identitaet (A-D11)

export interface PsfBeschreibung { komponenten: PsfKomponente[]; kanaele: Farbkanal[] }
export type PsfKomponente =
  | { art: "airy";   oeffnung_mm: number; obstruktion: number }       // Wellenlaenge kommt vom Kanal
  | { art: "moffat"; fwhm_arcsec: number; beta: number }              // Seeing, beta 4,765
  | { art: "gauss";  fwhm_arcsec: number };                           // Auge 60"/V
  // spaeter: | { art: "strehlhof"; strehl: number; fwhm_arcsec: number }
export interface Farbkanal { kanal: "rgb" | "r" | "g" | "b"; wellenlaenge_nm: number; versatz_arcsec: [number, number] }
// V1: genau ein Kanal { kanal: "rgb", wellenlaenge_nm: 550, versatz_arcsec: [0, 0] }

export type Ebene =
  | { art: "hintergrund"; strahldichte_rel: number }                  // gleichmaessig, nicht gefaltet
  | { art: "flaeche"; quellbild_id: string; mitte_arcsec: [number, number];
      durchmesser_arcsec: number; quellmassstab_arcsec_px: number; weiss_rel: number }   // Pixel 1,0 = weiss_rel
  | { art: "punktquelle"; name: string; position_arcsec: [number, number];
      durchmesser_arcsec: number; fluss_rel: number; sichtbar: boolean; grund?: "blendung" };

export interface Photometrie {
  einheit: "relativ";                 // 1,0 = Strahldichte der Objektflaeche bei AP >= 6 mm, tau = 1, a = 1
  bezug_mag_arcsec2: number;          // welche Flaechenhelligkeit 1,0 bedeutet
  helligkeitsfaktor: number;          // tau (1-eps^2) a min(1,(AP/p)^2), auf alle gefalteten Ebenen
  schleier: number;                   // Anteil Objektlicht als Hof, V1: 0 (Recherche 10.5)
  tonabbildung: { art: "linear_begrenzt"; weiss_rel: 1 } }   // spaeter: { art: "log"; ... } fuer Deep-Sky

export type Nachbearbeitung = { art: "saettigung"; faktor: number };  // V1: leere Liste; offen fuer weitere Arten

export interface Kern { kanal: Farbkanal["kanal"]; daten: Float32Array; groesse: number; radius: number }
```

Invarianten der Naht: alle Positionen relativ zur Gesichtsfeldmitte, Norden oben und Osten links **vor** Anwendung von `orientierung`; `bild` wendet `orientierung` auf alle Ebenen gleich an. Kerne sind auf Summe 1 normiert; Faltung ist kommutativ, die Reihenfolge der Komponenten ist nur Konvention (Airy, Moffat, Gauss) fuer Tests. `fluss_rel` ist in Einheiten von (weiss_rel x arcsec²), damit Flaeche und Punktquelle nach Faltung dieselbe Skala haben (Herleitung: Faktor (AP/p)² gilt fuer beide, weil der Anblick in Himmelswinkeln gerendert wird). `strahldichte_rel` des Hintergrunds enthaelt `tau (1-eps^2) min(1,(AP/p)^2)` ohne Extinktion `a`; `helligkeitsfaktor` wird nur auf Ebenen mit `art != "hintergrund"` angewandt. `arbeitsraster_px = round(durchmesser_arcsec / arbeit_arcsec_px)`, hoechstens 1536.

Fehlerfaelle an der Naht: `bild` wirft `BildFehler("unbekannte_art")` bei einer `art`, die der Adapter nicht kennt (streng, kein stilles Ignorieren); `physik` haengt Punktquellen auch mit `sichtbar: false` an (Blendungsregel A-P6), damit `ui` sie erklaeren kann.

### 1.4 Anzeige fuer `ui` (offene Liste, Texte in der Textdatei A-D10)

```ts
export type Anzeigeschluessel = "vergroesserung" | "wahres_gf" | "austrittspupille" | "rayleigh" | "dawes"
  | "fwhm_beugung" | "fwhm_seeing" | "fwhm_auge" | "fwhm_gesamt" | "dominante_grenze"
  | "seeing_wortstufe" | "seeing_pickering" | "luftmasse" | "extinktion_mag" | "hintergrund_mag_arcsec2";
export interface Messwert { schluessel: Anzeigeschluessel; wert: number | string; einheit: "" | "x" | "grad" | "mm" | "arcsec" | "mag" | "mag_arcsec2" }
export type Warnungsart = "ap_zu_gross" | "ap_zu_klein" | "v_zu_hoch";
export interface Warnung { art: Warnungsart; wert: number; schwelle: number }
export interface Hinweis { feld: string; eingabe: number; begrenzt_auf: number }
export interface Anzeige { werte: Messwert[]; warnungen: Warnung[]; hinweise: Hinweis[] }
```

## 2. Beispiel

```ts
// ui: bei jeder Parameteraenderung (synchron, Hauptthread)
const { konfiguration, hinweise } = physik.begrenze(ausUrl(location));
zeigeAnzeige(physik.berechneAnzeige(konfiguration), hinweise);            // Werte, Warnungen, Hinweise
const sim = physik.berechneSimulation(konfiguration, { anzeige_px: canvas.width });
worker.postMessage({ typ: "rendern", sim });                             // strukturierter Klon

// bild (Worker oder Hauptthread, Adapter WebGL2 oder JavaScript, identischer Ablauf)
function rendern(sim: Simulationsparameter, adapter: Falter): Anblick {
  const kerne = physik.baueKern(sim.psf, sim.massstab.arbeit_arcsec_px);   // 1 Kern (V1) oder 3 (Dispersion)
  const raster = leeresRaster(sim.massstab.arbeitsraster_px);
  for (const e of sim.ebenen) switch (e.art) {
    case "hintergrund":  fuelle(raster, e.strahldichte_rel); break;
    case "flaeche":      zeichneFlaeche(raster, quellbilder.get(e.quellbild_id), e, sim); break;
    case "punktquelle":  if (e.sichtbar) zeichneScheibe(raster, e); break;
    default: throw new BildFehler("unbekannte_art", (e as Ebene).art);
  }
  let bild = adapter.falte(raster, kerne, sim.psf.kanaele, sim.photometrie);  // Faltung + Faktor + Tonabbildung
  for (const n of sim.nachbearbeitung) bild = wende(bild, n);
  return orientiere(bild, sim.gesichtsfeld);
}
```

## 3. Was die Implementierung hinter der Naht versteckt

- Die gesamte Formelsammlung: Kasten-Young, Extinktionsstufen, Seeing-Skalierung X^0,6, Moffat-Beta, Augen-FWHM, Transmission je Bauart, Bortle-Tabelle, Blendungsregel, Wortstufen und Pickering. `bild` kennt keine dieser Zahlen.
- Die Wahl des Arbeitsmassstabs (max aus Quelle, FWHM/2,5, Anzeige) und damit die Leistungsstrategie des Prototyps.
- Der Kernaufbau in `baueKern`: Bessel J1, Annulus-Formel, 4-fache Ueberabtastung, FFT-Groesse, Binning, Normierung. Ob dort spaeter die numerische Pupillenautokorrelation statt der Airy-Formel rechnet, sieht niemand.
- Die Photometrie-Herleitung (warum derselbe Faktor fuer Flaeche und Punktquelle gilt) und der Bezug `bezug_mag_arcsec2`.
- Welche Modelloptionen welche Komponenten erzeugen: `bild` sieht nur Komponenten, nie Schalter.

## 4. Abhaengigkeiten, Adapter, Kann-Punkte

Ueber die Naht variiert: der `bild`-Adapter (WebGL2, JavaScript), der Ausfuehrungsort (Worker oder nicht), die Anzahl der Ebenen, Kanaele, Komponenten und Nachbearbeitungen. Nicht variiert: Einheiten (arcsec, relativ), die Zuordnung "Himmelswinkel vor Orientierung", die Normierung des Kerns, der Vertrag "unbekannte `art` wirft". `physik` haengt von nichts ab (kein DOM, keine Bilddaten; es kennt Quellbilder nur ueber `quellbild_id` und Massstab). `bild` haengt von `physik` nur ueber die Typen und `baueKern` ab. `ui` haengt von `physik` ueber `Anzeige` und `Konfiguration` ab, von `bild` nur ueber `postMessage`.

Kann-Punkte, je ein Satz:
- **A-F9 Strehl:** `optionen.strehl` erzeugt eine zusaetzliche PSF-Komponente `strehlhof` (Anteil 1-S als breiter Hof); Naht und `bild` unveraendert, `baueKern` bekommt einen Fall.
- **A-B5 Dispersion:** `psf.kanaele` erhaelt drei Eintraege mit Wellenlaenge und Versatz `[0, +-d]` aus Hoehe; `baueKern` liefert drei Kerne, der Adapter faltet je Kanal mit Versatz; Typ unveraendert, Laufzeit mal drei.
- **A-B6 Ruhiger Moment:** `physik` ersetzt die Moffat-FWHM durch die Kurzzeit-FWHM (Recherche 2.3) und fuegt den Messwert `fwhm_seeing_kurz` hinzu; Naht unveraendert.
- **A-P8 Purkinje:** `physik` berechnet aus `bezug_mag_arcsec2` und `helligkeitsfaktor` einen Saettigungsfaktor und haengt `{ art: "saettigung" }` an `nachbearbeitung`; `bild` hat den Fall schon ab V1 (ein Fall, der leer bleibt, kostet wenig).
- **A-Z9 Doppelsterne:** Objektzustand ohne Quellbild, zwei Punktquellen-Ebenen; keine Flaechen-Ebene; Naht unveraendert.
- **A-Z10 Deep-Sky:** Flaechen-Ebene mit `weiss_rel` aus der Flaechenhelligkeit, Hintergrund hoeher, `tonabbildung.art = "log"` als neue Variante; die Bortle-Wirkung kommt ohne neuen Nahtbegriff.
- **A-D12 Bildorientierung:** `gesichtsfeld.orientierung` wird aus der Bauart gesetzt; `bild` wendet sie bereits in V1 an (Identitaet).
- **A-D13 Vergleich:** `ui` ruft `berechneSimulation` zweimal, beim zweiten Mal mit `arbeitsmassstab_arcsec_px` des ersten, und rendert zwei Anblicke; die Naht traegt eine Konfiguration und bleibt wie sie ist.

## 5. Abwaegung

Hohe Hebelwirkung: `baueKern` als eine reine Funktion fuer beide Adapter und alle Kanaele (Tiefe: Bessel, FFT, Binning hinter einer Signatur); die Ebenenliste, die Planeten, Trabanten, Doppelsterne und Deep-Sky mit einem Renderpfad abdeckt; die einheitliche Photometrie, die den Sonderfall "Punktquelle relativ zur Flaeche" aufloest, den der Prototyp noch offen hatte. Die Lokalitaet ist gut: jede Formel steht in genau einer Teilfunktion, jede Erweiterung an einer Stelle in `physik` plus hoechstens einem `case` in `bild`.

Duenne Hebelwirkung: `Farbkanal`, `orientierung`, `nachbearbeitung` und `tonabbildung` sind in V1 leer oder Identitaet; sie sind Vorhalte, die nur zahlen, wenn die Kann-Punkte kommen. `Modelloptionen` als offener Sack ist bequem, verfuehrt aber dazu, Verhalten ueber Schalter statt ueber Typen zu steuern. Die Anzeige als Liste mit Schluesseln ist flexibler als eine Struktur, verlagert aber Vollstaendigkeit (sind alle A-D4-Werte da?) aus dem Typsystem in einen Test.

Kosten: Das Interface hat rund 20 Typen statt etwa 8 einer schlanken Variante; `bild` muss vier `switch` pflegen und bei jeder neuen `art` zwei Adapter anfassen (der Vertrag "unbekannt wirft" macht das sichtbar, aber nicht billiger). Testaufwand: die Teilfunktionen sind mit den Tabellenwerten aus Recherche Abschnitt 8 direkt testbar (gut), `berechneSimulation` braucht Golden-Tests auf die Struktur (Ebenenzahl, Komponenten, Faktoren), `baueKern` einen Vergleich gegen den Prototyp-Kern und gegen die Energie-im-Airy-Kern-Werte; die Kanal- und Nachbearbeitungs-Pfade in `bild` brauchen ab V1 Tests fuer Faelle, die noch niemand nutzt. Wer die Kann-Punkte nicht fuer wahrscheinlich haelt, zahlt hier Komplexitaet ohne Gegenwert; wer drei oder mehr davon erwartet, spart jeweils einen Umbau der Naht.
