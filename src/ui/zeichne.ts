// Zeichnen des Anblicks auf ein Canvas. Der Anblick aus rendere ist lineare Anzeigehelligkeit
// (1 = Bildschirmweiss, GLOSSARY; Abbildung in physik, #55); fuer die Anzeige wird auf 0..1 begrenzt und mit
// der sRGB-Kennlinie (IEC 61966-2-1) kodiert, sonst wirkt das Bild zu dunkel. Zeile 0 des
// Rasters ist Norden und landet oben im Canvas (A-D11). Die Maske des Gesichtsfelds hat bild
// schon angewandt; das Canvas bekommt fuer einen sauberen Rand zusaetzlich die Form per CSS.

import type { Anblick, Raster } from "../bild";
import type { Gesichtsfeld } from "../naht/simulationsparameter";

/** Lineare Helligkeit 0..1 in sRGB-Kodewert 0..1 (IEC 61966-2-1), ausserhalb begrenzt. */
export function linearZuSrgb(wert: number): number {
  const w = Math.min(1, Math.max(0, wert));
  return w <= 0.0031308 ? 12.92 * w : 1.055 * w ** (1 / 2.4) - 0.055;
}

/** Stuetzstellen der Nachschlagetabelle; 2^14 halten die Abweichung unter einem 8-Bit-Schritt. */
const TABELLE_STUFEN = 16384;
const SRGB_8BIT = Uint8ClampedArray.from({ length: TABELLE_STUFEN + 1 }, (_, i) => Math.round(255 * linearZuSrgb(i / TABELLE_STUFEN)));

/** Linearer Wert in 8-Bit-sRGB ueber die Tabelle (NaN wird Schwarz). */
export function linearZuSrgb8(wert: number): number {
  if (!(wert > 0)) return 0;
  if (wert >= 1) return 255;
  return SRGB_8BIT[Math.round(wert * TABELLE_STUFEN)]!;
}

/** Lineares Raster (1 oder 3 Kanaele) in RGBA-Bytes, deckend; ein Kanal wird Grau. */
export function rasterZuRgba(raster: Raster): Uint8ClampedArray<ArrayBuffer> {
  const { breite, hoehe, kanaele, daten } = raster;
  const n = breite * hoehe;
  const rgba = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (kanaele === 3) {
      rgba[o] = linearZuSrgb8(daten[i * 3]!);
      rgba[o + 1] = linearZuSrgb8(daten[i * 3 + 1]!);
      rgba[o + 2] = linearZuSrgb8(daten[i * 3 + 2]!);
    } else {
      const g = linearZuSrgb8(daten[i]!);
      rgba[o] = g;
      rgba[o + 1] = g;
      rgba[o + 2] = g;
    }
    rgba[o + 3] = 255;
  }
  return rgba;
}

/** Zeichnet den Anblick 1:1 in das Canvas (Canvasgroesse = fenster.px) mit der Form des Gesichtsfelds. */
export function zeichneAnblick(canvas: HTMLCanvasElement, anblick: Anblick, gesichtsfeld: Gesichtsfeld): void {
  const { raster } = anblick;
  // Groesse nur bei Aenderung setzen: jede Zuweisung leert Bitmap und Kontext. putImageData deckt
  // das ganze Canvas deckend ab, das Ergebnis bleibt gleich.
  if (canvas.width !== raster.breite) canvas.width = raster.breite;
  if (canvas.height !== raster.hoehe) canvas.height = raster.hoehe;
  const kontext = canvas.getContext("2d", { colorSpace: "srgb" });
  if (kontext === null) throw new Error("ui: kein 2D-Kontext fuer das Gesichtsfeld verfuegbar");
  kontext.putImageData(new ImageData(rasterZuRgba(raster), raster.breite, raster.hoehe), 0, 0);
  canvas.dataset["form"] = gesichtsfeld.form;
}
