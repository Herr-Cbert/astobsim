// Bild-Lader fuer den Browser (Kacheln und Einzelbilder): fetch ueber BASE_URL + "daten/bilder/",
// Dekodierung mit createImageBitmap, Pixel ueber einen (Offscreen-)Canvas, Umrechnung in ein Raster.
//
// Kacheln und Einzelbilder sind 8-Bit-WebP ohne Farbprofil, also sRGB-kodiert (das SVS-Rendering
// ist ein Anzeigebild; tools/mond_kacheln.py aendert keine Farben, tools/bild_aufbereiten.py rechnet
// eingebettete Profile wie Adobe RGB nach sRGB um). Die Naht verlangt lineare
// Helligkeiten relativ zu Quellweiss (src/naht/raster.ts); deshalb wird mit der sRGB-Kennlinie
// (IEC 61966-2-1) linearisiert, 255 = Quellweiss = 1,0. rgbaZuRaster ist rein und in Node getestet.

import type { Raster } from "../naht/raster";
import type { Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { kachelPfad, pyramidengeometrie, QuelleKacheln, type KachelLader } from "./kacheln";
import { quelleEinzelbild, type QuelleEinzelbild } from "./quelle_einzelbild";

/** sRGB-Kodewert 0..1 in lineare Helligkeit 0..1 (IEC 61966-2-1). */
export function srgbZuLinear(wert: number): number {
  return wert <= 0.04045 ? wert / 12.92 : ((wert + 0.055) / 1.055) ** 2.4;
}

/** Nachschlagetabelle fuer 8-Bit-Kodewerte. */
const LINEAR_8BIT = Float32Array.from({ length: 256 }, (_, i) => srgbZuLinear(i / 255));

/**
 * RGBA-Bytes (ImageData, zeilenweise, Zeile 0 oben = Norden) in ein lineares Raster mit drei
 * Kanaelen. Alpha wird ignoriert: die Kacheln sind deckend, der Himmel ist schon Schwarz.
 */
export function rgbaZuRaster(rgba: Uint8ClampedArray | Uint8Array, breite: number, hoehe: number): Raster {
  if (rgba.length !== breite * hoehe * 4) {
    throw new DatenFehler("Kachel", "-", "Pixel", `${breite * hoehe * 4} Bytes RGBA erwartet, ${rgba.length} geliefert`);
  }
  const daten = new Float32Array(breite * hoehe * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    daten[j] = LINEAR_8BIT[rgba[i]!]!;
    daten[j + 1] = LINEAR_8BIT[rgba[i + 1]!]!;
    daten[j + 2] = LINEAR_8BIT[rgba[i + 2]!]!;
  }
  return { breite, hoehe, kanaele: 3, daten };
}

/** Laedt daten/bilder/<pfad> (nur im Browser) und liefert es als lineares Raster mit drei Kanaelen. */
async function ladeRasterBrowser(pfad: string, nachweisId: string): Promise<Raster> {
  const url = import.meta.env.BASE_URL + "daten/bilder/" + pfad;
  let antwort: Response;
  try {
    antwort = await fetch(url);
  } catch (e) {
    throw new DatenFehler(pfad, nachweisId, "-", `nicht erreichbar (${String(e)})`);
  }
  if (!antwort.ok) throw new DatenFehler(pfad, nachweisId, "-", `HTTP ${antwort.status}`);
  let bitmap: ImageBitmap;
  try {
    // Kein Farbmanagement und kein Vormultiplizieren: die Kodewerte sollen unveraendert ankommen.
    bitmap = await createImageBitmap(await antwort.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  } catch (e) {
    throw new DatenFehler(pfad, nachweisId, "-", `nicht dekodierbar (${String(e)})`);
  }
  try {
    const { width: breite, height: hoehe } = bitmap;
    const kontext = zeichenflaeche(breite, hoehe);
    kontext.drawImage(bitmap, 0, 0);
    return rgbaZuRaster(kontext.getImageData(0, 0, breite, hoehe).data, breite, hoehe);
  } finally {
    bitmap.close();
  }
}

/** Lader fuer die Kachelpyramide eines Bildnachweises (nur im Browser). */
function kachelLaderBrowser(nachweis: Bildnachweis): KachelLader {
  // async, damit auch ein Fehler in kachelPfad als abgelehntes Promise ankommt (Vertrag KachelLader).
  return async (stufe, x, y) => ladeRasterBrowser(kachelPfad(nachweis, { stufe, x, y }), nachweis.id);
}

/** QuelleKacheln fuer einen Zustand im Browser: Geometrie skaliert auf winkelgroesseArcsec. */
export function quelleKachelnBrowser(nachweis: Bildnachweis, winkelgroesseArcsec: number): QuelleKacheln {
  return new QuelleKacheln(pyramidengeometrie(nachweis, winkelgroesseArcsec), kachelLaderBrowser(nachweis));
}

/**
 * QuelleEinzelbild fuer einen Zustand im Browser: laedt das Bild einmal und linearisiert es;
 * ausschnitt ist danach synchron.
 */
export async function quelleEinzelbildBrowser(nachweis: Bildnachweis, winkelgroesseArcsec: number): Promise<QuelleEinzelbild> {
  return quelleEinzelbild(nachweis, winkelgroesseArcsec, await ladeRasterBrowser(nachweis.datei, nachweis.id));
}

/** 2D-Kontext zum Auslesen der Pixel: OffscreenCanvas (auch im Worker), sonst ein DOM-Canvas. */
function zeichenflaeche(breite: number, hoehe: number): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const optionen: CanvasRenderingContext2DSettings = { willReadFrequently: true, colorSpace: "srgb" };
  let kontext: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (typeof OffscreenCanvas !== "undefined") {
    kontext = new OffscreenCanvas(breite, hoehe).getContext("2d", optionen);
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = breite;
    canvas.height = hoehe;
    kontext = canvas.getContext("2d", optionen);
  }
  if (kontext === null) throw new DatenFehler("Kachel", "-", "-", "kein 2D-Kontext zum Dekodieren verfuegbar");
  return kontext;
}
