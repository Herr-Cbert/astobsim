// Raster: Pixelbild in Fliesskommawerten fuer die Bildpipeline. Werte sind Helligkeiten relativ
// zu Quellweiss, linear (docs/architektur.md Abschnitt 3); die Bit-Tiefe entsteht erst beim
// Zeichnen auf den Canvas. Zeilenweise gespeichert: Zeile 0 ist Norden, Spalte 0 ist links
// (+x rechts, +y Norden, A-D11). Bei drei Kanaelen liegen die Kanaele je Pixel hintereinander.

import { BildFehler } from "./fehler";

export type Kanaele = 1 | 3;

export interface Raster {
  breite: number;
  hoehe: number;
  kanaele: Kanaele;
  /** breite * hoehe * kanaele Werte, zeilenweise, Kanaele je Pixel verschraenkt. */
  daten: Float32Array;
}

/** Neues Raster, mit fuellwert belegt (Standard 0, also Schwarz). */
export function neuesRaster(breite: number, hoehe: number, kanaele: Kanaele = 1, fuellwert = 0): Raster {
  if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite <= 0 || hoehe <= 0) {
    throw new BildFehler(`Rastermasse muessen positive ganze Zahlen sein, nicht ${breite} x ${hoehe}`);
  }
  const daten = new Float32Array(breite * hoehe * kanaele);
  if (fuellwert !== 0) daten.fill(fuellwert);
  return { breite, hoehe, kanaele, daten };
}

/** Wirft BildFehler, wenn Masse, Kanaele und Datenlaenge nicht zusammenpassen. */
export function pruefeRaster(raster: Raster, name = "Raster"): void {
  const { breite, hoehe, kanaele, daten } = raster;
  if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite <= 0 || hoehe <= 0) {
    throw new BildFehler(`${name}: Masse muessen positive ganze Zahlen sein, nicht ${breite} x ${hoehe}`);
  }
  if (kanaele !== 1 && kanaele !== 3) {
    throw new BildFehler(`${name}: 1 oder 3 Kanaele erwartet, nicht ${String(kanaele)}`);
  }
  if (daten.length !== breite * hoehe * kanaele) {
    throw new BildFehler(`${name}: ${breite * hoehe * kanaele} Werte erwartet, ${daten.length} vorhanden`);
  }
}

/** Index des ersten Kanals des Pixels in Spalte x (von links) und Zeile y (von Norden). */
export function pixelIndex(raster: Raster, x: number, y: number): number {
  return (y * raster.breite + x) * raster.kanaele;
}

/** Summe aller Werte (fuer Tests und Erhaltungspruefungen), in doppelter Genauigkeit. */
export function summe(raster: Raster): number {
  let s = 0;
  const d = raster.daten;
  for (let i = 0; i < d.length; i++) s += d[i] as number;
  return s;
}
