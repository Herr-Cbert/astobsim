import { describe, expect, it } from "vitest";
import { srgbZuLinear } from "../daten/kachellader";
import { linearZuSrgb, linearZuSrgb8, rasterZuRgba } from "./zeichne";

describe("linearZuSrgb", () => {
  it("trifft die Stuetzwerte der sRGB-Kennlinie", () => {
    expect(linearZuSrgb(0)).toBe(0);
    expect(linearZuSrgb(1)).toBeCloseTo(1, 12);
    // 18 % Grau linear ist etwa Kodewert 118 von 255
    expect(Math.round(255 * linearZuSrgb(0.18))).toBe(118);
    // linearer Ast unterhalb 0,0031308
    expect(linearZuSrgb(0.001)).toBeCloseTo(0.01292, 10);
  });

  it("ist die Umkehrung der Linearisierung in daten", () => {
    for (let i = 0; i <= 255; i++) expect(255 * linearZuSrgb(srgbZuLinear(i / 255))).toBeCloseTo(i, 6);
  });

  it("begrenzt auf 0 bis 1", () => {
    expect(linearZuSrgb(-0.5)).toBe(0);
    expect(linearZuSrgb(3)).toBeCloseTo(1, 12);
  });
});

describe("linearZuSrgb8", () => {
  it("weicht hoechstens einen 8-Bit-Schritt von der Kennlinie ab", () => {
    let max = 0;
    for (let i = 0; i <= 10000; i++) {
      const w = (i / 10000) ** 3; // dicht im Dunkeln, wo die Kennlinie steil ist
      max = Math.max(max, Math.abs(linearZuSrgb8(w) - 255 * linearZuSrgb(w)));
    }
    expect(max).toBeLessThanOrEqual(1);
  });

  it("bildet die 8-Bit-Kodewerte nach der Linearisierung wieder auf sich ab", () => {
    for (let i = 0; i <= 255; i++) expect(linearZuSrgb8(srgbZuLinear(i / 255))).toBe(i);
  });

  it("macht NaN und negative Werte schwarz, Werte ueber 1 weiss", () => {
    expect(linearZuSrgb8(NaN)).toBe(0);
    expect(linearZuSrgb8(-1)).toBe(0);
    expect(linearZuSrgb8(1.7)).toBe(255);
  });
});

describe("rasterZuRgba", () => {
  it("kodiert drei Kanaele je Pixel, deckend, Zeile 0 zuerst", () => {
    const daten = new Float32Array([0, 0.18, 1, 2, -1, 0.5]);
    const rgba = rasterZuRgba({ breite: 1, hoehe: 2, kanaele: 3, daten });
    expect(Array.from(rgba)).toEqual([0, 118, 255, 255, 255, 0, linearZuSrgb8(0.5), 255]);
  });

  it("macht aus einem Kanal Grau", () => {
    const rgba = rasterZuRgba({ breite: 2, hoehe: 1, kanaele: 1, daten: new Float32Array([0.18, 0]) });
    expect(Array.from(rgba)).toEqual([118, 118, 118, 255, 0, 0, 0, 255]);
  });
});
