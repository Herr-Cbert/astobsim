// Bild-Lader fuer den Browser (Kacheln und Einzelbilder): fetch ueber BASE_URL + "daten/bilder/" (holeDaten),
// Dekodierung mit createImageBitmap, Pixel ueber einen (Offscreen-)Canvas, Umrechnung in ein Raster.
//
// Kacheln und Einzelbilder sind 8-Bit-WebP ohne Farbprofil, also sRGB-kodiert (das SVS-Rendering
// ist ein Anzeigebild; tools/mond_kacheln.py aendert keine Farben, tools/bild_aufbereiten.py rechnet
// eingebettete Profile wie Adobe RGB nach sRGB um). Die Naht verlangt lineare
// Helligkeiten relativ zu Quellweiss (src/naht/raster.ts); deshalb wird mit der sRGB-Kennlinie
// (IEC 61966-2-1) linearisiert, 255 = Quellweiss = 1,0. Einzelbilder werden beim Laden linearisiert
// (rgbaZuRaster), Kacheln bleiben 8-Bit-sRGB (rgbaZuSrgb) und werden erst in QuelleKacheln.ausschnitt
// linearisiert (Issue #66: ein Viertel des Speichers). Beide Funktionen sind rein und in Node getestet.
//
// Deep-Sky-Bilder sind 8-Bit-Grauwert-WebP mit log-Kennlinie (bilder.json kennlinie, kennlinie.ts):
// Einzelbild und Kacheln bleiben als Kodewerte mit einem Kanal (rgbaZuKodes, Rot-Kanal des
// Grauwerts) und werden im Ausschnitt ueber die Tabelle der Kennlinie dekodiert.

import type { Quelle } from "../naht/quelle";
import type { Kanaele, Raster } from "../naht/raster";
import type { Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { kachelPfad, type KachelLader, type KachelSrgb, pyramidengeometrie, QuelleKacheln } from "./kacheln";
import { kodetabelle } from "./kennlinie";
import { holeDaten } from "./pruefe";
import { quelleBegleiter } from "./quelle_begleiter";
import { quelleEinzelbild, type QuelleEinzelbild } from "./quelle_einzelbild";

import { LINEAR_8BIT } from "./srgb";

export { srgbZuLinear } from "./srgb";

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

/**
 * RGBA-Bytes in 8-Bit-sRGB mit drei Kanaelen fuer den Kachel-Cache (Issue #66): Alpha faellt weg,
 * die Kodewerte bleiben unveraendert; linearisiert wird erst in QuelleKacheln.ausschnitt.
 */
export function rgbaZuSrgb(rgba: Uint8ClampedArray | Uint8Array, breite: number, hoehe: number): KachelSrgb {
  if (rgba.length !== breite * hoehe * 4) {
    throw new DatenFehler("Kachel", "-", "Pixel", `${breite * hoehe * 4} Bytes RGBA erwartet, ${rgba.length} geliefert`);
  }
  const srgb = new Uint8Array(breite * hoehe * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    srgb[j] = rgba[i]!;
    srgb[j + 1] = rgba[i + 1]!;
    srgb[j + 2] = rgba[i + 2]!;
  }
  return { breite, hoehe, srgb };
}

/**
 * RGBA-Bytes in 8-Bit-Kodewerte mit kanaele Kanaelen: 3 wie rgbaZuSrgb, 1 fuer Grauwertbilder
 * (log-Kennlinie; der Canvas liefert R = G = B, genommen wird Rot).
 */
export function rgbaZuKodes(rgba: Uint8ClampedArray | Uint8Array, breite: number, hoehe: number, kanaele: Kanaele): KachelSrgb {
  if (kanaele === 3) return rgbaZuSrgb(rgba, breite, hoehe);
  if (rgba.length !== breite * hoehe * 4) {
    throw new DatenFehler("Kachel", "-", "Pixel", `${breite * hoehe * 4} Bytes RGBA erwartet, ${rgba.length} geliefert`);
  }
  const kodes = new Uint8Array(breite * hoehe);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) kodes[j] = rgba[i]!;
  return { breite, hoehe, kanaele: 1, srgb: kodes };
}

/** Kanaele der Kodewerte eines Bilds: 1 bei log-Kennlinie (Grauwert), sonst 3 (sRGB). */
function kanaeleFuer(nachweis: Bildnachweis): Kanaele {
  return nachweis.kennlinie === undefined ? 3 : 1;
}

/** Laedt daten/bilder/<pfad> (nur im Browser) und liefert es als lineares Raster mit drei Kanaelen. */
async function ladeRasterBrowser(pfad: string, nachweisId: string): Promise<Raster> {
  const { rgba, breite, hoehe } = await ladeRgbaBrowser(pfad, nachweisId);
  return rgbaZuRaster(rgba, breite, hoehe);
}

/** Laedt und dekodiert daten/bilder/<pfad> (nur im Browser) zu RGBA-Bytes. */
async function ladeRgbaBrowser(pfad: string, nachweisId: string): Promise<{ rgba: Uint8ClampedArray; breite: number; hoehe: number }> {
  const antwort = await holeDaten("bilder/" + pfad, pfad, nachweisId);
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
    return { rgba: kontext.getImageData(0, 0, breite, hoehe).data, breite, hoehe };
  } finally {
    bitmap.close();
  }
}

/** Lader fuer die Kachelpyramide eines Bildnachweises (nur im Browser). */
function kachelLaderBrowser(nachweis: Bildnachweis): KachelLader {
  // async, damit auch ein Fehler in kachelPfad als abgelehntes Promise ankommt (Vertrag KachelLader).
  return async (stufe, x, y) => {
    const { rgba, breite, hoehe } = await ladeRgbaBrowser(kachelPfad(nachweis, { stufe, x, y }), nachweis.id);
    return rgbaZuKodes(rgba, breite, hoehe, kanaeleFuer(nachweis));
  };
}

/** QuelleKacheln fuer einen Zustand im Browser: Geometrie skaliert auf winkelgroesseArcsec. */
export function quelleKachelnBrowser(nachweis: Bildnachweis, winkelgroesseArcsec: number): QuelleKacheln {
  const geometrie = pyramidengeometrie(nachweis, winkelgroesseArcsec, kanaeleFuer(nachweis));
  return new QuelleKacheln(geometrie, kachelLaderBrowser(nachweis), undefined, kodetabelle(nachweis));
}

/**
 * QuelleEinzelbild fuer einen Zustand im Browser: laedt das Bild einmal und linearisiert es (sRGB)
 * oder behaelt die Kodewerte (log-Kennlinie); ausschnitt ist danach synchron.
 */
export async function quelleEinzelbildBrowser(nachweis: Bildnachweis, winkelgroesseArcsec: number): Promise<QuelleEinzelbild> {
  if (nachweis.kennlinie === undefined) {
    return quelleEinzelbild(nachweis, winkelgroesseArcsec, await ladeRasterBrowser(nachweis.datei, nachweis.id));
  }
  const { rgba, breite, hoehe } = await ladeRgbaBrowser(nachweis.datei, nachweis.id);
  return quelleEinzelbild(nachweis, winkelgroesseArcsec, rgbaZuKodes(rgba, breite, hoehe, 1));
}

/**
 * Quelle eines Begleiters im Browser (Issue #136): laedt das Begleiterbild einmal (8-Bit-Kodes,
 * log-Kennlinie) und legt es mit dem Versatz dx/dy relativ zum Quellweiss des Hauptobjekts an
 * (quelleBegleiter).
 */
export async function quelleBegleiterBrowser(nachweis: Bildnachweis, weissHauptMagProArcsec2: number, dxArcsec: number, dyArcsec: number): Promise<Quelle> {
  const { rgba, breite, hoehe } = await ladeRgbaBrowser(nachweis.datei, nachweis.id);
  return quelleBegleiter(nachweis, weissHauptMagProArcsec2, dxArcsec, dyArcsec, rgbaZuKodes(rgba, breite, hoehe, 1));
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
