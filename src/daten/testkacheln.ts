// Test-Adapter QuelleRaster (Issue #8): eine QuelleKacheln, deren Kacheln aus Rastern im Speicher
// geschnitten werden, ohne DOM und ohne fetch. Je Stufe ein Raster; pyramideAusRaster baut die
// groeberen Stufen durch 2x2-Flaechenmittel wie tools/mond_kacheln.py. Der Lader zaehlt, welche
// Kacheln geholt wurden (Cache-Tests).

import type { Kanaele, Raster } from "../naht/raster";
import { QuelleKacheln, type Kacheladresse } from "./kacheln";

/** Halbiert ein Raster durch 2x2-Flaechenmittel; ungerade Raender zaehlen die vorhandenen Pixel. */
export function halbiere(raster: Raster): Raster {
  const { breite, hoehe, kanaele, daten } = raster;
  const b = Math.ceil(breite / 2);
  const h = Math.ceil(hoehe / 2);
  const aus = new Float32Array(b * h * kanaele);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < b; x++) {
      for (let c = 0; c < kanaele; c++) {
        let summe = 0;
        let n = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = 2 * x + dx;
            const sy = 2 * y + dy;
            if (sx < breite && sy < hoehe) {
              summe += daten[(sy * breite + sx) * kanaele + c]!;
              n++;
            }
          }
        }
        aus[(y * b + x) * kanaele + c] = summe / n;
      }
    }
  }
  return { breite: b, hoehe: h, kanaele, daten: aus };
}

/** Stufe 0 bis anzahl - 1, jede die halbierte vorige. */
export function pyramideAusRaster(raster: Raster, anzahl: number): Raster[] {
  const stufen = [raster];
  while (stufen.length < anzahl) stufen.push(halbiere(stufen[stufen.length - 1]!));
  return stufen;
}

/** Schneidet die Kachel (x, y) mit Kantenlaenge k aus; Randkacheln kleiner. */
export function schneideKachel(raster: Raster, k: number, x: number, y: number): Raster {
  const { breite, hoehe, kanaele, daten } = raster;
  const x0 = x * k;
  const y0 = y * k;
  const b = Math.min(k, breite - x0);
  const h = Math.min(k, hoehe - y0);
  if (b <= 0 || h <= 0) throw new Error(`Kachel ${x}_${y} liegt ausserhalb des Rasters`);
  const aus = new Float32Array(b * h * kanaele);
  for (let zeile = 0; zeile < h; zeile++) {
    const von = ((y0 + zeile) * breite + x0) * kanaele;
    aus.set(daten.subarray(von, von + b * kanaele), zeile * b * kanaele);
  }
  return { breite: b, hoehe: h, kanaele, daten: aus };
}

export interface QuelleRaster {
  quelle: QuelleKacheln;
  /** Jede vom Lader geholte Kachel in Aufrufreihenfolge, als "stufe/x_y". */
  geladen: string[];
}

/**
 * Test-Adapter: QuelleKacheln ueber Stufenrastern im Speicher. massstab0 ist der Massstab von
 * Stufe 0; Stufe n hat den Massstab nach dem Verhaeltnis der Breiten. fehlschlagen nennt
 * Kacheln ("stufe/x_y"), deren Laden scheitert.
 */
export function quelleRaster(
  stufen: Raster[],
  massstab0: number,
  kachelPx: number,
  optionen: { maxKacheln?: number; fehlschlagen?: ReadonlySet<string> } = {}
): QuelleRaster {
  const geladen: string[] = [];
  const kanaele: Kanaele = stufen[0]!.kanaele;
  const geometrie = {
    kachelPx,
    kanaele,
    stufen: stufen.map((r) => ({ breitePx: r.breite, hoehePx: r.hoehe, massstabArcsecProPx: (massstab0 * stufen[0]!.breite) / r.breite }))
  };
  const lader = async (stufe: number, x: number, y: number): Promise<Raster> => {
    const name = adresseText({ stufe, x, y });
    geladen.push(name);
    if (optionen.fehlschlagen?.has(name)) throw new Error(`Kachel ${name} absichtlich nicht ladbar`);
    return schneideKachel(stufen[stufe]!, kachelPx, x, y);
  };
  return { quelle: new QuelleKacheln(geometrie, lader, optionen.maxKacheln), geladen };
}

export function adresseText(a: Kacheladresse): string {
  return `${a.stufe}/${a.x}_${a.y}`;
}
