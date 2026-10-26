// Faltung des Arbeitsrasters mit dem Kern (Stufe 2, ADR-0002: direkte Faltung mit kleinem Kern,
// Rand geklemmt). Falter ist die Naht fuer die zwei Adapter: FalterJs hier (Tests, Fallback),
// FalterWebgl2 in falter_webgl2.ts (Produktion, dort auch waehleFalter). Beide muessen bis auf eine
// 8-Bit-Stufe dasselbe Ergebnis liefern (Gleichheitstest im Browser: npm run test:browser).

import type { Kern } from "../naht/simulationsparameter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import { neuesRaster, pruefeRaster, type Raster } from "./raster";

export interface Falter {
  /** Liefert ein neues Raster gleicher Masse: das Raster gefaltet mit dem Kern, Rand geklemmt. */
  falte(raster: Raster, kern: Kern): Raster;
}

/**
 * Wirft BildFehler, wenn der Kern in sich unstimmig ist (Groesse ungerade, radius, Datenlaenge).
 * Abweichung von der Naht: sie verlangt Groesse 5 bis 81, hier sind auch 1 und 3 erlaubt, damit
 * die synthetischen Testkerne (Delta, Kasten 3x3) durchlaufen; die Faltung ist davon unabhaengig.
 */
export function pruefeKern(kern: Kern): void {
  const { groesse, radius, daten } = kern;
  pruefePositivGanz("Kerngroesse", groesse);
  if (groesse % 2 === 0) throw new BildFehler(`Kerngroesse muss ungerade sein, nicht ${groesse}`);
  if (groesse !== 2 * radius + 1) throw new BildFehler(`Kern: groesse ${groesse} passt nicht zu radius ${radius}`);
  if (daten.length !== groesse * groesse) throw new BildFehler(`Kern: ${groesse * groesse} Werte erwartet, ${daten.length} vorhanden`);
}

/**
 * Direkte Faltung in JavaScript. Echte Faltung (Kern gespiegelt): Ausgabe(x, y) =
 * Summe ueber (s, t) von kern[t][s] * Eingabe(x - s + radius, y - t + radius). Fuer die
 * punktsymmetrischen Kerne der Naht ist das gleich der Korrelation. Ausserhalb des Rasters
 * gilt der naechste Randwert (geklemmt), so bleibt ein konstantes Raster konstant.
 * Mehrere Kanaele werden einzeln gefaltet.
 */
export class FalterJs implements Falter {
  falte(raster: Raster, kern: Kern): Raster {
    pruefeRaster(raster);
    pruefeKern(kern);
    const { breite, hoehe, kanaele } = raster;
    const ergebnis = neuesRaster(breite, hoehe, kanaele);
    if (kanaele === 1) {
      falteEbene(raster.daten, breite, hoehe, kern, ergebnis.daten);
      return ergebnis;
    }
    const ebene = new Float32Array(breite * hoehe);
    const gefaltet = new Float32Array(breite * hoehe);
    for (let c = 0; c < kanaele; c++) {
      for (let p = 0; p < ebene.length; p++) ebene[p] = raster.daten[p * kanaele + c] as number;
      falteEbene(ebene, breite, hoehe, kern, gefaltet);
      for (let p = 0; p < ebene.length; p++) ergebnis.daten[p * kanaele + c] = gefaltet[p] as number;
    }
    return ergebnis;
  }
}

/**
 * Faltet eine Ebene. Legt die Eingabe mit geklemmtem Rand in einen Puffer, dann braucht die
 * innere Schleife keine Randabfragen. Rechnet acht Ausgabepixel je Durchlauf mit Akkumulatoren
 * in lokalen Variablen (Register-Blocking); das ist in V8 etwa doppelt so schnell wie ein
 * Zeilenakkumulator im Typed Array (gemessen: 1024 px, Kern 25 px, 0,28 s statt 0,53 s).
 */
function falteEbene(eingabe: Float32Array, breiteRoh: number, hoeheRoh: number, kern: Kern, ausgabe: Float32Array): void {
  // Masse sind nach pruefeKern und pruefeRaster ganzzahlig. "| 0" zwingt V8 trotzdem zu
  // ganzzahligen Indexrechnungen: hat ein frueherer Kern mit ungueltigem radius (z. B. 1,5 im
  // Fehlertest) das Feld einmal als Gleitkommazahl gepraegt, liefe die Schleife sonst dauerhaft
  // halb so schnell (gemessen: 1024 px, Kern 25 px, 0,63 s nach dem Fehlertest gegen 0,27 s mit "| 0").
  const n = kern.groesse | 0;
  const r = kern.radius | 0;
  const breite = breiteRoh | 0;
  const hoehe = hoeheRoh | 0;
  const breitePuffer = breite + 2 * r;
  const puffer = new Float32Array(breitePuffer * (hoehe + 2 * r));
  for (let y = 0; y < hoehe + 2 * r; y++) {
    const yq = Math.min(hoehe - 1, Math.max(0, y - r));
    const von = yq * breite;
    const zeile = y * breitePuffer;
    puffer.fill(eingabe[von] as number, zeile, zeile + r);
    puffer.set(eingabe.subarray(von, von + breite), zeile + r);
    puffer.fill(eingabe[von + breite - 1] as number, zeile + r + breite, zeile + breitePuffer);
  }
  // Gespiegelter Kern in doppelter Genauigkeit: gewicht[t][s] wirkt auf Puffer(x + s, y + t).
  const gewicht = new Float64Array(n * n);
  for (let t = 0; t < n; t++) {
    for (let s = 0; s < n; s++) gewicht[t * n + s] = kern.daten[(n - 1 - t) * n + (n - 1 - s)] as number;
  }
  for (let y = 0; y < hoehe; y++) {
    const aus = y * breite;
    let x = 0;
    for (; x + 7 < breite; x += 8) {
      let a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0, a6 = 0, a7 = 0;
      for (let t = 0; t < n; t++) {
        const von = (y + t) * breitePuffer + x;
        const kv = t * n;
        for (let s = 0; s < n; s++) {
          const w = gewicht[kv + s] as number;
          const i = von + s;
          a0 += w * (puffer[i] as number);
          a1 += w * (puffer[i + 1] as number);
          a2 += w * (puffer[i + 2] as number);
          a3 += w * (puffer[i + 3] as number);
          a4 += w * (puffer[i + 4] as number);
          a5 += w * (puffer[i + 5] as number);
          a6 += w * (puffer[i + 6] as number);
          a7 += w * (puffer[i + 7] as number);
        }
      }
      ausgabe[aus + x] = a0;
      ausgabe[aus + x + 1] = a1;
      ausgabe[aus + x + 2] = a2;
      ausgabe[aus + x + 3] = a3;
      ausgabe[aus + x + 4] = a4;
      ausgabe[aus + x + 5] = a5;
      ausgabe[aus + x + 6] = a6;
      ausgabe[aus + x + 7] = a7;
    }
    // Rest der Zeile, wenn die Breite kein Vielfaches von 8 ist.
    for (; x < breite; x++) {
      let a = 0;
      for (let t = 0; t < n; t++) {
        const von = (y + t) * breitePuffer + x;
        const kv = t * n;
        for (let s = 0; s < n; s++) a += (gewicht[kv + s] as number) * (puffer[von + s] as number);
      }
      ausgabe[aus + x] = a;
    }
  }
}
