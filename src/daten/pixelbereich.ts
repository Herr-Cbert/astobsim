// Gemeinsame Geometrie von QuelleKacheln und QuelleEinzelbild (Issue #22): die Bildmitte
// (Randkoordinate breitePx / 2) ist die Objektmitte 0/0, Zeile 0 ist Norden (A-D11). Der
// angefragte Bereich bekommt einen Pixel Rand fuer das bilineare Vergroessern in bild (wie
// QuelleAusRaster in src/bild/quelle.ts, das daten nicht importieren darf).

import type { Objektpunkt } from "../naht/quelle";
import type { Kanaele, Raster } from "../naht/raster";
import type { Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { OBJEKTE_DATEI } from "./objekte";

/** Pixelbereich eines Bilds, halboffen [x0, x1) x [y0, y1), auf das Bild begrenzt. */
export interface Pixelbereich {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * Linke und obere Bildkante in Bogensekunden und der angefragte Bereich (Mitte, Breite) in Pixeln
 * eines Bilds mit breitePx x hoehePx und Massstab ms, mit einem Pixel Rand; bereich null, wenn er
 * das Bild nicht trifft.
 */
export function pixelbereich(
  mitte: Objektpunkt,
  breiteArcsec: number,
  breitePx: number,
  hoehePx: number,
  ms: number
): { links: number; oben: number; bereich: Pixelbereich | null } {
  const links = -(breitePx * ms) / 2;
  const oben = (hoehePx * ms) / 2;
  const x0 = klemme(Math.floor((mitte.xArcsec - breiteArcsec / 2 - links) / ms) - 1, 0, breitePx);
  const x1 = klemme(Math.ceil((mitte.xArcsec + breiteArcsec / 2 - links) / ms) + 1, 0, breitePx);
  const y0 = klemme(Math.floor((oben - (mitte.yArcsec + breiteArcsec / 2)) / ms) - 1, 0, hoehePx);
  const y1 = klemme(Math.ceil((oben - (mitte.yArcsec - breiteArcsec / 2)) / ms) + 1, 0, hoehePx);
  return { links, oben, bereich: x1 <= x0 || y1 <= y0 ? null : { x0, x1, y0, y1 } };
}

/**
 * Massstab des feinsten Bilds (Einzelbild, Stufe 0 der Pyramide) fuer einen Zustand:
 * Winkelgroesse des Zustands / objekt_durchmesser_px (die Anwendung skaliert die Scheibe auf den
 * Zustand, bilder.md Abschnitt 8).
 */
export function massstabFuerZustand(nachweis: Bildnachweis, winkelgroesseArcsec: number): number {
  if (!(winkelgroesseArcsec > 0)) throw new DatenFehler(OBJEKTE_DATEI, nachweis.zustand, "winkelgroesse_arcsec", "muss positiv sein");
  return winkelgroesseArcsec / nachweis.objektDurchmesserPx;
}

export function schwarz(breite: number, hoehe: number, kanaele: Kanaele): Raster {
  return { breite, hoehe, kanaele, daten: new Float32Array(breite * hoehe * kanaele) };
}

/** Klemmt wert auf [min, max]; nicht begrenze, das ist der Nahtbegriff aus physik. */
function klemme(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}
