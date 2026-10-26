import { describe, expect, it } from "vitest";
import { besselJ1 } from "./bessel";

// Tafelwerte aus docs/recherche/physik.md, Abschnitt 8 (Abramowitz-Stegun, Tabelle 9.1).
describe("Besselfunktion J1", () => {
  it("J1(1) ist 0,4400506", () => {
    expect(besselJ1(1)).toBeCloseTo(0.4400506, 7);
  });
  it("J1(2) ist 0,5767248", () => {
    expect(besselJ1(2)).toBeCloseTo(0.5767248, 7);
  });
  it("J1(5) ist -0,3275791", () => {
    expect(besselJ1(5)).toBeCloseTo(-0.3275791, 7);
  });
  it("J1(10) ist 0,0434727", () => {
    expect(besselJ1(10)).toBeCloseTo(0.0434727, 7);
  });
  it("erste Nullstelle bei 3,8317", () => {
    expect(Math.abs(besselJ1(3.8317))).toBeLessThan(1e-5);
  });
  it("ist ungerade: J1(-2) = -J1(2), J1(0) = 0", () => {
    expect(besselJ1(-2)).toBeCloseTo(-besselJ1(2), 12);
    expect(besselJ1(0)).toBe(0);
  });
});
