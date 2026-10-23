<!-- Entwurf eines Subagenten (Design it twice, Variante 1), 2026-10-23, unveraendert uebernommen. Vergleich und Entscheidung: docs/architektur.md -->

# Entwurf Variante 1: Minimales Interface fuer `physik` (ein Einstiegspunkt)

Leitidee: `physik` hat an der Naht zu `ui` und `bild` genau **eine Funktion** `simuliere` und drei Datentypen (`Konfiguration` hinein, `Simulation` heraus, darin `Simulationsparameter` fuer `bild`). Alles Rechnen, Begrenzen, Zuordnen und der komplette Kernaufbau liegen hinter dieser Naht. Die Unterfunktionen (Rayleigh, Luftmasse, Bessel, Airy, Moffat, FFT, Kern) sind reine Funktionen in `physik/intern/*` und werden dort einzeln getestet (A-P7, A-Q1), sind aber kein Teil der Naht: `ui` und `bild` importieren nur `physik/index.ts`.

## 1. Interface

```ts
// physik/index.ts: der einzige oeffentliche Import fuer ui und bild.
// Einheiten durchgehend: Winkel in Bogensekunden (arcsec), Laengen in mm,
// Helligkeit in mag bzw. mag/arcsec2, Grad nur dort, wo das Feld "Grad" heisst.

// ---------- Eingabe ----------
export type Bauart = 'refraktor' | 'newton' | 'schmidt_cassegrain' | 'maksutov';
export type Transparenz = 'klar' | 'leicht_diesig' | 'diesig';

// Geraet: aufgeloeste Zahlenwerte, keine Listen-IDs. Wer die Geraeteliste
// (geraete.json) in diese Werte uebersetzt, ist ui bzw. ein Modul daten.
export type Geraet =
  | { art: 'fernrohr'; oeffnungMm: number; brennweiteMm: number;
      obstruktion?: number;          // 0..0,5; fehlt: Vorschlag aus Bauart
      bauart: Bauart; okular: Okular }
  | { art: 'fernglas'; oeffnungMm: number; vergroesserung: number;
      wahresGesichtsfeldGrad: number }
  | { art: 'auge' };                 // 6 mm, V = 1, Rechteck 5 Grad (A-D1)

// A-F7: der Aufrufer sagt, welche Groesse zuletzt bearbeitet wurde,
// physik leitet die andere ab. Die Normierung liefert immer beide zurueck.
export type Okular =
  | { art: 'brennweite'; brennweiteMm: number; scheinbaresGesichtsfeldGrad: number }
  | { art: 'vergroesserung'; vergroesserung: number; scheinbaresGesichtsfeldGrad: number };

export interface Trabant {            // aus objekte.json, unveraendert
  name: string; dxArcsec: number; dyArcsec: number;
  durchmesserArcsec: number; magnitude: number;
}
export interface Objektzustand {      // aus objekte.json, aufgeloest
  id: string;                         // z. B. 'jupiter_47'
  winkelgroesseArcsec: number;        // aequatorialer Durchmesser
  magnitude: number;                  // Gesamthelligkeit (Blendungsregel)
  flaechenhelligkeitMag: number;      // mag/arcsec2 des weissesten Quellpixels
  quelle: { massstabArcsecProPx: number; breitePx: number; hoehePx: number };
  trabanten: Trabant[];
}
export interface Bedingungen {
  seeingFwhmArcsec: number;           // Zenit, 0,5..5 (A-B1)
  bortle: number;                     // 1..9, ganzzahlig
  transparenz: Transparenz;
  hoeheGrad: number;                  // 10..90
}
export interface Konfiguration {
  geraet: Geraet; objekt: Objektzustand; bedingungen: Bedingungen;
}

// Was gezeigt werden soll: nur Geometrie, keine Physik. Noetig, weil der
// Arbeitsmassstab von der Anzeigegroesse abhaengt (Prototyp, Schritt 2).
export interface Ansicht {
  breitePx: number;                   // Anzeigebreite in Geraetepixeln
  feldArcsec?: number;                // Breite des gezeigten Ausschnitts;
                                      // fehlt: wahres Gesichtsfeld (Auge: 5 Grad)
}

// ---------- Ausgabe ----------
// Alles plain data: nur number, string, boolean, Arrays, Float32Array.
// Strukturiert klonbar (postMessage), deterministisch, ohne Verweise auf Eingabeobjekte.
export interface Simulation {
  konfiguration: Konfiguration;       // normiert: begrenzt, Okular mit beiden Werten,
                                      // Obstruktion gesetzt; ui schreibt sie zurueck (Felder, URL)
  anzeige: Anzeigewerte;              // A-D4, A-B1
  hinweise: Hinweis[];                // A-D5, A-F8, Blendungsregel
  bild: Simulationsparameter;         // Naht zu bild
}

export interface Anzeigewerte {
  vergroesserung: number;
  wahresGesichtsfeldGrad: number;
  austrittspupilleMm: number;
  rayleighArcsec: number; dawesArcsec: number;
  seeingArcsec: number;               // am Objekt, nach Hoehenskalierung X^0.6
  augeArcsec: number;                 // 60/V
  gesamtFwhmArcsec: number;           // Quadratursumme, nur Anzeige
  dominanteGrenze: 'beugung' | 'seeing' | 'auge';
  seeingStufe: { wort: 'ausgezeichnet' | 'gut' | 'mittel' | 'schlecht';
                 pickering: [number, number]; antoniadi: string };  // Zenitwert, Tab. 2.5
  luftmasse: number; extinktionMag: number;
}

// Codes statt Texte: die Texte liegen in einer Datei bei ui (A-D10).
export type Hinweis =
  | { art: 'warnung'; code: 'ap_gross' | 'ap_klein' | 'v_hoch'; wert: number }
  | { art: 'begrenzt'; feld: string; eingabe: number; wert: number }   // A-F8
  | { art: 'info'; code: 'trabant_geblendet'; name: string };          // A-P6

export interface Simulationsparameter {
  gesichtsfeld: { form: 'kreis' | 'rechteck'; feldArcsec: number };   // gezeigter Ausschnitt
  arbeitsraster: { massstabArcsecProPx: number; breitePx: number };  // quadratisch
  // Kern der Gesamt-PSF in Arbeitspixeln. Invarianten: breite ungerade, 3..81,
  // Mittelpunkt bei (R,R) mit R=(breite-1)/2, Summe 1 +- 1e-6, punktsymmetrisch, >= 0.
  kern: { breite: number; daten: Float32Array; fwhmPx: number };
  helligkeit: {
    faktor: number;                   // 0 < f <= 1: a*tau*(1-eps^2)*min(1,(AP/p)^2),
                                      // multipliziert die lineare Quellintensitaet
    referenzMag: number;              // mag/arcsec2 von Quellwert 1,0 nach Faktor
    hintergrundMag: number;           // mu_Okular, mag/arcsec2
    hintergrundRelativ: number;       // 10^(-0,4 (hintergrundMag - referenzMag)):
                                      // Pixel = faktor*quelle + hintergrundRelativ, dann Tonkurve in bild
  };
  // Punktquellen: Scheibe malen, mit demselben Kern falten (physik.md Abschn. 7).
  // Nur sichtbare Trabanten (Blendungsregel angewendet). Position relativ zur
  // Objektmitte, Norden oben, Osten links (A-D11); Energie = helligkeit * pi d^2/4
  // in Einheiten "Quellwert 1,0 * arcsec2", damit bild sie rasterunabhaengig verteilt.
  trabanten: { name: string; dxArcsec: number; dyArcsec: number;
               durchmesserArcsec: number; flaechenhelligkeitRelativ: number }[];
}

// ---------- Der Einstiegspunkt ----------
// Rein, synchron, ohne Zustand, ohne Cache, ohne DOM.
// Begrenzt Eingaben statt sie abzulehnen (A-F8) und meldet das in hinweise.
// Wirft TypeError nur bei Programmierfehlern: nicht-endliche Zahlen, unbekannte
// Literale, leere Quelle, breitePx < 64. Fachlich falsche Werte werfen nie.
// Leistung: dominiert vom Kernaufbau (FFT bis 1024^2 bei 4-facher Ueberabtastung):
// typisch 1 bis 20 ms auf Desktop, obere Schranke ca. 100 ms; Ergebnis < 50 kB.
// Gleiche Eingabe liefert bitgleiche Ausgabe (Snapshot-Tests, Memoisierung durch Aufrufer).
export function simuliere(konfiguration: Konfiguration, ansicht: Ansicht): Simulation;
```

Reihenfolge und Lebensdauer: kein Aufbau, kein Abbau. `simuliere` darf beliebig oft und von beliebiger Stelle (auch im Worker) gerufen werden. Jede Aenderung eines Parameters oder der Ansicht ist ein neuer Aufruf; es gibt keine Teilaktualisierung ueber die Naht.

## 2. Beispiel

```ts
// ui/steuerung.ts
import { simuliere, type Konfiguration } from '../physik';
import { texte } from './texte';

function aktualisiere(roh: Konfiguration, breitePx: number, zoom: boolean) {
  const feld = zoom ? 1.5 * roh.objekt.winkelgroesseArcsec : undefined;
  const s = simuliere(roh, { breitePx, feldArcsec: feld });
  felder.schreibe(s.konfiguration);                 // begrenzte Werte, V und f_ok beide
  url.schreibe(s.konfiguration);                    // A-D8
  tafel.zeige(s.anzeige);                           // A-D4
  tafel.hinweise(s.hinweise.map(h => texte.hinweis(h)));
  worker.postMessage({ typ: 'rendere', parameter: s.bild,
                       quelleId: s.konfiguration.objekt.id, mitteArcsec: schwenk.mitte });
}

// bild/worker.ts (Adapter WebGL2 oder JavaScript, beide gleich bedient)
onmessage = ({ data }) => {
  const p: Simulationsparameter = data.parameter;   // kam per structured clone
  const quelle = quellen.hole(data.quelleId);       // Kacheln, von bild verwaltet
  const arbeit = raster.ausschnitt(quelle, data.mitteArcsec, p.arbeitsraster);
  raster.maleTrabanten(arbeit, p.trabanten, p.arbeitsraster);
  const gefaltet = falter.falte(arbeit, p.kern);     // WebGL2 oder JS
  const anblick = ton.abbilden(gefaltet, p.helligkeit);
  postMessage(anzeige.maskiere(anblick, p.gesichtsfeld), [anblick.buffer]);
};
```

## 3. Was die Implementierung versteckt

- Optikformeln: V, AP, wGF, Rayleigh 138,4/D, Dawes 115,8/D, Airy-FWHM 116,8/D, Augengrenze 60/V, Quadratursumme, dominante Grenze.
- Atmosphaere: Kasten-Young, k(t) = 0,20/0,30/0,45, FWHM_s = FWHM_0 X^0,6, Extinktionsfaktor.
- Gesamt-PSF: Bessel J1, Annulus-Airy mit eps, Moffat beta 4,765, Gauss, 4-fache Ueberabtastung, kleine FFT, Binning, Kernradius 3 FWHM, Obergrenze 40 px. Ein Wechsel auf den Frequenzraum (Kolmogorov-OTF statt Moffat) aendert nichts an der Naht, solange ein Ortsraum-Kern herauskommt.
- Arbeitsmassstab: max(Quelle, FWHM/2,5 px, Anzeige). bild muss die Regel nicht kennen.
- Helligkeit: Transmission je Bauart (0,90/0,80/0,85/1,0), (1-eps^2) genau einmal, Bortle-Tabelle 6.1, mu_Okular, Punktquellenfluss ueber 10^(-0,4 m) D^2, Umrechnung in Flaechenhelligkeit der Scheibe.
- Regeln: Grenzen aus A-F8, Vorschlagsobstruktion je Bauart, V-f_ok-Kopplung (A-F7), Warnschwellen A-D5, Blendungsregel A-P6, Seeing-Zuordnung Tab. 2.5.
- Spaetere Kann-Punkte ohne Nahtaenderung: Strehl (A-F9, neues optionales Feld in Geraet), ruhiger Moment (A-B6, Feld in Bedingungen), Doppelsterne (A-Z9: Objektzustand ohne Quelle, nur Trabanten). Mit Nahtaenderung: Dispersion (A-B5) braucht einen Kern je Farbkanal; Purkinje (A-P8) ein Feld `saettigung` in helligkeit.

## 4. Abhaengigkeiten und Adapter

- `physik` haengt von nichts ab: keine Datendateien, kein DOM, kein Worker. Listen-IDs (Geraet, Objektzustand) werden vor der Naht von `ui` bzw. einem Modul `daten` in Zahlen aufgeloest; dadurch bleibt `physik` auch dann testbar, wenn die Datendateien sich aendern.
- Ueber die Naht variiert: der Falt-Adapter von `bild` (WebGL2 in Produktion, JavaScript fuer Tests und Fallback), der Ausfuehrungsort (Haupt-Thread oder Worker), die Ansicht (Uebersicht, Zoom, Vergleichsbild A-D3), spaeter die Tonkurve. Alle sehen denselben `Simulationsparameter`.
- Ueber die Naht variiert nicht: Kerndarstellung (quadratisch, ungerade, Float32Array, Summe 1, Arbeitspixel), Einheitenkonvention, Bedeutung von `faktor` und `hintergrundRelativ`, Koordinatensystem der Trabanten.
- Adapter an der Naht in Tests: Vitest ruft `simuliere` direkt; `bild` wird mit dem JavaScript-Falter und einem synthetischen Quellbild (Punkt, Kante) gegen den Kern geprueft. Ein zweiter Adapter von `physik` ist nicht vorgesehen; die Naht existiert wegen Lokalitaet (Modellwissen an einem Ort) und Klonbarkeit, nicht wegen Austauschbarkeit.
- Memoisierung ist Sache des Aufrufers (Schluessel: JSON der Eingabe), weil `simuliere` zustandslos ist. Fuer die Zoomansicht genuegt ein zweiter Aufruf mit anderer `Ansicht`.

## 5. Abwaegung

Hohe Hebelwirkung:
- Ein Aufruf ersetzt bei `ui` etwa zehn Einzelrechnungen plus Begrenzung plus Warnlogik; `ui` kennt keine Formel und keine Schwelle. Aenderungen am Modell (Moffat gegen Kolmogorov, Transmissionswerte, Bortle-Tabelle) bleiben in `physik`.
- `bild` erhaelt einen fertigen Kern in Arbeitspixeln und das Arbeitsraster: beide Falt-Adapter sind reine Schleifen ohne Modellwissen; das Prototyp-Ergebnis (gleiches Bild in WebGL2 und JS) laesst sich ueber die Naht direkt als Test formulieren.
- Normierte `konfiguration` im Ergebnis loest A-F7 und A-F8 fuer Felder und URL an einer Stelle.

Duenn oder teuer:
- `Ansicht` als Eingabe koppelt Anzeigegeometrie an die Physik. Das ist dem Arbeitsmassstab geschuldet und begruendet, aber `ui` muss die Pixelbreite kennen, bevor es Anzeigewerte bekommt, und zahlt den Kernaufbau (ms) auch, wenn es nur die Tafel aktualisieren will. Bei 60 Hz Regler-Betrieb vermutlich unkritisch; sonst ist `berechneAnzeige(konfiguration)` als zweiter Einstieg die vorgesehene Aufspaltung.
- Das Interface ist schmal in Funktionen, aber breit in Daten: `Simulation` hat rund 30 Felder. Jedes Feld ist ein Versprechen; die Invarianten des Kerns und die Bedeutung der Helligkeitsgroessen muessen dokumentiert und getestet werden, sonst wandert Wissen stillschweigend ueber die Naht.
- Die Tonkurve (physikalische mag/arcsec2 nach Bildschirmgrau) liegt bei `bild`. Damit ist "Helligkeit" ueber die Naht geteilt: `physik` sagt wie hell, `bild` sagt wie es aussieht. Phase 5 kann das umkehren (Faktor fuer Anzeigegrau aus `physik`); dann wandert `referenzMag` in eine fertige Skala.
- Hinweis-Codes sind ein stilles Vokabular zwischen `physik` und `ui`; ein neuer Code bricht nichts, wird aber ohne Text angezeigt. Trabanten, die der Blendungsregel unterliegen, fehlen in der Liste und tauchen nur als Info auf.
- Hinter der Naht ist der Kern immer ein Ortsraum-Kern. Ein kanalabhaengiger Kern (Dispersion) oder ein ortsvariabler Kern (Koma, Nicht-Ziel) passt nicht ohne Nahtaenderung.

Tests ueber die Naht:
- Pruefbar: Anzeigewerte gegen bekannte Zahlen (Rayleigh 100 mm = 1,384"; AP; Luftmasse 30 Grad = 1,994); Kern-Invarianten (Summe, Symmetrie, ungerade Breite); gemessene FWHM des Kerns gegen `gesamtFwhmArcsec` (Toleranz ca. 10 Prozent, Moffat-Fluegel); Grenzfaelle (Seeing 0,5" und 300 mm bei 25-fach: Kern nahe Gauss des Auges; blosses Auge: Kern nahe Gauss 60"); Monotonie (mehr Seeing, breiterer Kern; kleinere AP, kleinerer Faktor); Begrenzung mit Hinweis fuer jede Grenze aus A-F8; Warnschwellen A-D5; Blendungsregel in T6 (Jupiter mit Auge: keine Trabanten, 10x50: vier); Rundreise durch `structuredClone`; Determinismus per Snapshot.
- Nicht pruefbar ueber die Naht: die Modellgueltigkeit (Moffat gegen Langzeit-Kolmogorov, Transmissionswerte, Pickering-Zuordnung) und der Bildeindruck T1 bis T6; die Genauigkeit von Bessel-Naeherung, Airy-Minima und FFT (Tests in `physik/intern`); die Laufzeit auf echter GPU; die Tonkurve und der Gesichtsfeldrand, die in `bild` liegen.
