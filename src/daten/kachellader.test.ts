import { describe, expect, it } from "vitest";
import { DatenFehler } from "./fehler";
import { rgbaZuRaster, rgbaZuSrgb, srgbZuLinear } from "./kachellader";

describe("srgbZuLinear", () => {
  it("bildet die sRGB-Kennlinie ab (IEC 61966-2-1)", () => {
    expect(srgbZuLinear(0)).toBe(0);
    expect(srgbZuLinear(1)).toBeCloseTo(1, 12);
    expect(srgbZuLinear(0.5)).toBeCloseTo(0.214041, 6);
    // Linearer Abschnitt unter 0,04045 und stetiger Uebergang.
    expect(srgbZuLinear(0.04)).toBeCloseTo(0.04 / 12.92, 12);
    expect(srgbZuLinear(0.04045)).toBeCloseTo(srgbZuLinear(0.040451), 6);
  });
});

describe("rgbaZuRaster", () => {
  it("liefert drei lineare Kanaele, ignoriert Alpha, behaelt die Zeilenfolge", () => {
    // 2x1: links Weiss, rechts (128, 0, 255) mit Alpha 0.
    const raster = rgbaZuRaster(new Uint8ClampedArray([255, 255, 255, 255, 128, 0, 255, 0]), 2, 1);
    expect([raster.breite, raster.hoehe, raster.kanaele]).toEqual([2, 1, 3]);
    expect(raster.daten[0]).toBeCloseTo(1, 6);
    expect(raster.daten[3]).toBeCloseTo(srgbZuLinear(128 / 255), 6);
    expect(raster.daten[4]).toBe(0);
    expect(raster.daten[5]).toBeCloseTo(1, 6);
  });

  it("weist falsche Laengen ab", () => {
    expect(() => rgbaZuRaster(new Uint8ClampedArray(7), 1, 2)).toThrow(DatenFehler);
  });
});

describe("rgbaZuSrgb (Issue #66)", () => {
  it("laesst Alpha weg und behaelt die Kodewerte", () => {
    const k = rgbaZuSrgb(new Uint8ClampedArray([255, 128, 1, 7, 0, 64, 200, 255]), 2, 1);
    expect(k).toEqual({ breite: 2, hoehe: 1, srgb: new Uint8Array([255, 128, 1, 0, 64, 200]) });
  });
  it("wirft DatenFehler bei falscher Laenge", () => {
    expect(() => rgbaZuSrgb(new Uint8ClampedArray(7), 1, 2)).toThrow(DatenFehler);
  });
});
