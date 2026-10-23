import { describe, expect, it } from "vitest";
import { dawes, rayleigh } from "./optik";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8.
describe("Beugungsgrenzen", () => {
  it("Rayleigh fuer 100 mm bei 550 nm ist 1,384 Bogensekunden", () => {
    expect(rayleigh(100)).toBeCloseTo(1.384, 3);
  });
  it("Dawes fuer 100 mm ist 1,158 Bogensekunden", () => {
    expect(dawes(100)).toBeCloseTo(1.158, 3);
  });
});
