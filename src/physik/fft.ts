// Kleine Radix-2-FFT fuer den Kernbau (Issue #4, ADR-0001: selbst geschrieben, keine Bibliothek).
// Komplex, in place, Laengen sind Zweierpotenzen; der Kernbau nutzt 64 bis 256 Punkte je Achse.
// Vorzeichenkonvention: vorwaerts exp(-2 pi i k n / N), rueckwaerts exp(+2 pi i k n / N) mit 1/N.
// Vorlage: prototyp/faltung.html, Block logik (Branch prototyp-faltung); Abweichung: die
// Drehfaktoren kommen aus einer Tabelle statt aus einer Rekursion, damit sich kein Rundungsfehler
// ueber die Stufen aufsummiert.

import { PhysikFehler } from "./fehler";

/** Drehfaktoren exp(-2 pi i k / n) fuer k = 0 .. n/2 - 1, einmal je FFT-Groesse. */
interface Drehfaktoren {
  n: number;
  cos: Float64Array;
  sin: Float64Array;
}

function drehfaktoren(n: number): Drehfaktoren {
  const halb = n / 2;
  const cos = new Float64Array(halb);
  const sin = new Float64Array(halb);
  for (let k = 0; k < halb; k++) {
    const winkel = (-2 * Math.PI * k) / n;
    cos[k] = Math.cos(winkel);
    sin[k] = Math.sin(winkel);
  }
  return { n, cos, sin };
}

/** Wirft PhysikFehler, wenn n keine Zweierpotenz >= 2 ist. */
function pruefeZweierpotenz(n: number): void {
  if (!Number.isInteger(n) || n < 2 || (n & (n - 1)) !== 0) {
    throw new PhysikFehler("fft.n", n, "ist keine Zweierpotenz >= 2");
  }
}

/** Radix-2 in place mit vorbereiteten Drehfaktoren; re und im haben die Laenge w.n. */
function fftMitFaktoren(re: Float64Array, im: Float64Array, w: Drehfaktoren, invers: boolean): void {
  const n = w.n;
  // Bit-Umkehr-Permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]!;
      re[i] = re[j]!;
      re[j] = t;
      t = im[i]!;
      im[i] = im[j]!;
      im[j] = t;
    }
  }
  // Schmetterlinge; bei invers ist der Sinus gespiegelt
  const vorzeichen = invers ? -1 : 1;
  for (let laenge = 2; laenge <= n; laenge <<= 1) {
    const halb = laenge >> 1;
    const schritt = n / laenge;
    for (let start = 0; start < n; start += laenge) {
      for (let j = 0; j < halb; j++) {
        const wr = w.cos[j * schritt]!;
        const wi = vorzeichen * w.sin[j * schritt]!;
        const a = start + j;
        const b = a + halb;
        const xr = re[b]! * wr - im[b]! * wi;
        const xi = re[b]! * wi + im[b]! * wr;
        re[b] = re[a]! - xr;
        im[b] = im[a]! - xi;
        re[a] = re[a]! + xr;
        im[a] = im[a]! + xi;
      }
    }
  }
  if (invers) {
    for (let i = 0; i < n; i++) {
      re[i] = re[i]! / n;
      im[i] = im[i]! / n;
    }
  }
}

/**
 * Eindimensionale FFT in place. re und im sind gleich lang, die Laenge eine Zweierpotenz >= 2.
 * invers rechnet die Ruecktransformation einschliesslich 1/N.
 */
export function fft(re: Float64Array, im: Float64Array, invers = false): void {
  const n = re.length;
  pruefeZweierpotenz(n);
  if (im.length !== n) throw new PhysikFehler("fft.im.length", im.length, `ist ungleich re.length ${n}`);
  fftMitFaktoren(re, im, drehfaktoren(n), invers);
}

/**
 * Zweidimensionale FFT in place auf einem n x n Raster, zeilenweise abgelegt (re und im je n*n
 * Werte). Erst alle Zeilen, dann alle Spalten; die Drehfaktoren werden einmal berechnet.
 */
export function fft2d(re: Float64Array, im: Float64Array, n: number, invers = false): void {
  pruefeZweierpotenz(n);
  if (re.length !== n * n || im.length !== n * n) {
    throw new PhysikFehler("fft2d.length", re.length, `ist ungleich n*n = ${n * n}`);
  }
  const w = drehfaktoren(n);
  for (let y = 0; y < n; y++) {
    const o = y * n;
    fftMitFaktoren(re.subarray(o, o + n), im.subarray(o, o + n), w, invers);
  }
  const spalteRe = new Float64Array(n);
  const spalteIm = new Float64Array(n);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      spalteRe[y] = re[y * n + x]!;
      spalteIm[y] = im[y * n + x]!;
    }
    fftMitFaktoren(spalteRe, spalteIm, w, invers);
    for (let y = 0; y < n; y++) {
      re[y * n + x] = spalteRe[y]!;
      im[y * n + x] = spalteIm[y]!;
    }
  }
}
