// Raster: Pixelbild in Fliesskommawerten, Teil der Naht zwischen daten und bild (Quelle liefert
// Raster, bild rechnet darauf). Werte sind Helligkeiten relativ zu Quellweiss, linear
// (docs/architektur.md Abschnitt 3). Zeilenweise gespeichert: Zeile 0 ist Norden, Spalte 0 ist
// links (+x rechts, +y Norden, A-D11). Bei drei Kanaelen liegen die Kanaele je Pixel
// hintereinander. Funktionen dazu (neuesRaster, pruefeRaster, pixelIndex) liegen in bild.

export type Kanaele = 1 | 3;

export interface Raster {
  breite: number;
  hoehe: number;
  kanaele: Kanaele;
  /** breite * hoehe * kanaele Werte, zeilenweise, Kanaele je Pixel verschraenkt. */
  daten: Float32Array;
}
