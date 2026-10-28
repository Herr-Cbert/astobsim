// sRGB-Kennlinie (IEC 61966-2-1) fuer die Bild-Lader und den Kachel-Cache (Issue #66): die Kacheln
// bleiben im Cache 8-Bit-Kodewerte und werden erst im Ausschnitt ueber dieselbe Tabelle linearisiert.

/** sRGB-Kodewert 0..1 in lineare Helligkeit 0..1 (IEC 61966-2-1). */
export function srgbZuLinear(wert: number): number {
  return wert <= 0.04045 ? wert / 12.92 : ((wert + 0.055) / 1.055) ** 2.4;
}

/** Nachschlagetabelle fuer 8-Bit-Kodewerte. */
export const LINEAR_8BIT = Float32Array.from({ length: 256 }, (_, i) => srgbZuLinear(i / 255));
