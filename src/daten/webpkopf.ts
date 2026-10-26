// Masse eines WebP aus dem Dateikopf (RIFF-Container, Google "WebP Container Specification"), ohne
// Dekodierung. Gebraucht von bilddateien.test.ts, das daten/bilder.json gegen die Dateien prueft,
// ohne Bildbibliothek und ohne node:fs. Drei Formen des ersten Chunks:
// - "VP8 " (verlustbehaftet): Startcode 9d 01 2a an Byte 3 der Chunkdaten, danach Breite und Hoehe
//   je 14 Bit (Little Endian, die oberen 2 Bit sind die Skalierung).
// - "VP8L" (verlustfrei): Signatur 0x2f, danach 14 Bit Breite - 1 und 14 Bit Hoehe - 1, bitweise.
// - "VP8X" (erweitert): Leinwandbreite - 1 und -hoehe - 1 je 24 Bit ab Byte 4 der Chunkdaten.

import { DatenFehler } from "./fehler";

export interface WebpMasse {
  breite: number;
  hoehe: number;
  /** Erster Chunk: "VP8 ", "VP8L" oder "VP8X". */
  art: string;
}

export function webpMasse(bytes: Uint8Array, name = "WebP"): WebpMasse {
  const text = (von: number, laenge: number) => String.fromCharCode(...bytes.subarray(von, von + laenge));
  const fehler = (grund: string) => new DatenFehler(name, "-", "Dateikopf", grund);
  if (bytes.length < 30 || text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP") throw fehler("kein RIFF/WEBP-Kopf");
  const art = text(12, 4);
  const d = 20; // Beginn der Chunkdaten
  const u16 = (i: number) => bytes[i]! | (bytes[i + 1]! << 8);
  const u24 = (i: number) => bytes[i]! | (bytes[i + 1]! << 8) | (bytes[i + 2]! << 16);
  if (art === "VP8 ") {
    if (bytes[d + 3] !== 0x9d || bytes[d + 4] !== 0x01 || bytes[d + 5] !== 0x2a) throw fehler("VP8-Startcode fehlt");
    return { art, breite: u16(d + 6) & 0x3fff, hoehe: u16(d + 8) & 0x3fff };
  }
  if (art === "VP8L") {
    if (bytes[d] !== 0x2f) throw fehler("VP8L-Signatur fehlt");
    const bits = (bytes[d + 1]! | (bytes[d + 2]! << 8) | (bytes[d + 3]! << 16) | (bytes[d + 4]! << 24)) >>> 0;
    return { art, breite: (bits & 0x3fff) + 1, hoehe: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (art === "VP8X") return { art, breite: u24(d + 4) + 1, hoehe: u24(d + 7) + 1 };
  throw fehler(`unbekannter erster Chunk "${art}"`);
}

/** Bytes aus einer data:-URL mit Base64 (Vite-Import mit ?inline). */
export function bytesAusDataUrl(url: string): Uint8Array {
  const komma = url.indexOf(",");
  if (!url.startsWith("data:") || komma < 0 || !url.slice(0, komma).endsWith(";base64")) {
    throw new DatenFehler("data-URL", "-", "-", "data:...;base64,... erwartet");
  }
  const roh = atob(url.slice(komma + 1));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}
