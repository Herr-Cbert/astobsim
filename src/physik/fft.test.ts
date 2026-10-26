import { describe, expect, it } from "vitest";
import { PhysikFehler } from "./fehler";
import { fft, fft2d } from "./fft";

// Bekannte Transformierte: Delta wird Konstante, Konstante wird Delta, Kosinus wird Linienpaar.
// Konvention vorwaerts exp(-2 pi i k n / N), rueckwaerts mit 1/N.

function reell(werte: number[]): { re: Float64Array; im: Float64Array } {
  return { re: Float64Array.from(werte), im: new Float64Array(werte.length) };
}

describe("fft eindimensional", () => {
  it("Delta bei 0 ergibt ueberall 1 fuer 64, 128 und 256 Punkte", () => {
    for (const n of [64, 128, 256]) {
      const { re, im } = reell(Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0)));
      fft(re, im);
      for (let k = 0; k < n; k++) {
        expect(re[k]).toBeCloseTo(1, 12);
        expect(im[k]).toBeCloseTo(0, 12);
      }
    }
  });
  it("Konstante 1 ergibt N bei Frequenz 0 und sonst 0", () => {
    const n = 128;
    const { re, im } = reell(new Array<number>(n).fill(1));
    fft(re, im);
    expect(re[0]).toBeCloseTo(n, 10);
    for (let k = 1; k < n; k++) {
      expect(Math.hypot(re[k]!, im[k]!)).toBeLessThan(1e-10);
    }
  });
  it("Kosinus mit 5 Perioden ergibt N/2 bei k = 5 und k = N - 5", () => {
    const n = 64;
    const { re, im } = reell(Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * 5 * i) / n)));
    fft(re, im);
    for (let k = 0; k < n; k++) {
      const erwartet = k === 5 || k === n - 5 ? n / 2 : 0;
      expect(re[k]).toBeCloseTo(erwartet, 9);
      expect(im[k]).toBeCloseTo(0, 9);
    }
  });
  it("Sinus mit 3 Perioden ergibt -i N/2 bei k = 3 und +i N/2 bei k = N - 3", () => {
    const n = 64;
    const { re, im } = reell(Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 3 * i) / n)));
    fft(re, im);
    expect(re[3]).toBeCloseTo(0, 9);
    expect(im[3]).toBeCloseTo(-n / 2, 9);
    expect(im[n - 3]).toBeCloseTo(n / 2, 9);
  });
  it("Delta bei Index 1 hat Betrag 1 und Phase -2 pi k / N", () => {
    const n = 64;
    const { re, im } = reell(Array.from({ length: n }, (_, i) => (i === 1 ? 1 : 0)));
    fft(re, im);
    for (let k = 0; k < n; k++) {
      expect(re[k]).toBeCloseTo(Math.cos((-2 * Math.PI * k) / n), 12);
      expect(im[k]).toBeCloseTo(Math.sin((-2 * Math.PI * k) / n), 12);
    }
  });
  it("Hin- und Ruecktransformation geben die Eingabe zurueck, Parseval gilt", () => {
    const n = 256;
    const eingabe = Array.from({ length: n }, (_, i) => Math.exp(-((i - 100) ** 2) / 50) + 0.1 * Math.cos(i));
    const { re, im } = reell(eingabe);
    fft(re, im);
    let spektrum = 0;
    for (let k = 0; k < n; k++) spektrum += re[k]! ** 2 + im[k]! ** 2;
    const zeit = eingabe.reduce((s, x) => s + x * x, 0);
    expect(spektrum / n).toBeCloseTo(zeit, 9);
    fft(re, im, true);
    for (let i = 0; i < n; i++) {
      expect(re[i]).toBeCloseTo(eingabe[i]!, 12);
      expect(im[i]).toBeCloseTo(0, 12);
    }
  });
  it("wirft PhysikFehler bei Laengen, die keine Zweierpotenz sind, und bei ungleichen Laengen", () => {
    expect(() => fft(new Float64Array(96), new Float64Array(96))).toThrow(PhysikFehler);
    expect(() => fft(new Float64Array(1), new Float64Array(1))).toThrow(PhysikFehler);
    expect(() => fft(new Float64Array(64), new Float64Array(32))).toThrow(PhysikFehler);
  });
});

describe("fft2d", () => {
  it("Delta in der Ecke ergibt ueberall 1, Ruecktransformation stellt das Delta wieder her", () => {
    const n = 64;
    const re = new Float64Array(n * n);
    const im = new Float64Array(n * n);
    re[0] = 1;
    fft2d(re, im, n);
    for (let i = 0; i < n * n; i++) {
      expect(re[i]).toBeCloseTo(1, 12);
      expect(im[i]).toBeCloseTo(0, 12);
    }
    fft2d(re, im, n, true);
    expect(re[0]).toBeCloseTo(1, 12);
    let rest = 0;
    for (let i = 1; i < n * n; i++) rest = Math.max(rest, Math.hypot(re[i]!, im[i]!));
    expect(rest).toBeLessThan(1e-12);
  });
  it("Produkt von Kosinus in x und Konstante in y hat Linien bei kx = 4 und kx = N - 4, ky = 0", () => {
    const n = 64;
    const re = new Float64Array(n * n);
    const im = new Float64Array(n * n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) re[y * n + x] = Math.cos((2 * Math.PI * 4 * x) / n);
    }
    fft2d(re, im, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const erwartet = y === 0 && (x === 4 || x === n - 4) ? (n * n) / 2 : 0;
        expect(re[y * n + x]).toBeCloseTo(erwartet, 7);
        expect(im[y * n + x]).toBeCloseTo(0, 7);
      }
    }
  });
  it("Verschiebung um (3, 5) ist Multiplikation mit exp(-2 pi i (3 kx + 5 ky) / N)", () => {
    const n = 64;
    const re = new Float64Array(n * n);
    const im = new Float64Array(n * n);
    re[5 * n + 3] = 1;
    fft2d(re, im, n);
    for (let ky = 0; ky < n; ky += 7) {
      for (let kx = 0; kx < n; kx += 5) {
        const phase = (-2 * Math.PI * (3 * kx + 5 * ky)) / n;
        expect(re[ky * n + kx]).toBeCloseTo(Math.cos(phase), 11);
        expect(im[ky * n + kx]).toBeCloseTo(Math.sin(phase), 11);
      }
    }
  });
  it("wirft PhysikFehler bei falscher Feldlaenge", () => {
    expect(() => fft2d(new Float64Array(64 * 63), new Float64Array(64 * 63), 64)).toThrow(PhysikFehler);
    expect(() => fft2d(new Float64Array(96 * 96), new Float64Array(96 * 96), 96)).toThrow(PhysikFehler);
  });
});
