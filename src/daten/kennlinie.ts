// Logarithmische Kennlinie der Deep-Sky-Bilder (ADR-0003 Nachtrag Version 2, Kodierung): 8-Bit-
// Grauwert, Kode v = 1 bis 255 bedeutet mu(v) = mag_dunkel - (v - 1) / 254 * (mag_dunkel - mag_hell)
// mag/arcsec^2, Kode 0 ist Schwarz. Wie srgb.ts eine Nachschlagetabelle fuer die 256 Kodewerte;
// Einzelbild und Kacheln behalten die 8-Bit-Kodewerte und dekodieren erst im Ausschnitt.
//
// Quellweiss eines Bilds mit log-Kennlinie ist mag_hell: Kode 255 dekodiert zu 1,0 (wie 255 bei
// sRGB), sonst linear relativ dazu 10^(-0,4 (mu - mag_hell)) (docs/recherche/physik.md 13.4).
// pruefeVerweise verlangt deshalb weiss_mag_arcsec2 des Zustands gleich mag_hell.

import type { Bildnachweis } from "./bildnachweise";
import { LINEAR_8BIT } from "./srgb";

/** Kennlinie aus bilder.json: Flaechenhelligkeit von Kode 255 (hell) und Kode 1 (dunkel) in mag/arcsec^2. */
export interface Kennlinie {
  art: "log";
  magHell: number;
  magDunkel: number;
}

/** Flaechenhelligkeit in mag/arcsec^2 zum Kode 1 bis 255; Kode 0 (Schwarz) hat keine, Infinity. */
export function kodeZuMag(kode: number, kennlinie: Kennlinie): number {
  if (kode <= 0) return Infinity;
  const { magHell, magDunkel } = kennlinie;
  return magDunkel - ((kode - 1) / 254) * (magDunkel - magHell);
}

/** Kode 0 bis 255 in lineare Helligkeit relativ zu Quellweiss (mag_hell = 1,0); Kode 0 ist 0. */
export function logZuLinear(kode: number, kennlinie: Kennlinie): number {
  if (kode <= 0) return 0;
  return 10 ** (-0.4 * (kodeZuMag(kode, kennlinie) - kennlinie.magHell));
}

/** Nachschlagetabelle der 256 Kodewerte fuer eine log-Kennlinie. */
export function logTabelle(kennlinie: Kennlinie): Float32Array {
  return Float32Array.from({ length: 256 }, (_, i) => logZuLinear(i, kennlinie));
}

/** Tabelle fuer die Kodewerte eines Bilds: log-Kennlinie, wenn der Nachweis eine traegt, sonst sRGB. */
export function kodetabelle(nachweis: Bildnachweis): Float32Array {
  return nachweis.kennlinie === undefined ? LINEAR_8BIT : logTabelle(nachweis.kennlinie);
}
