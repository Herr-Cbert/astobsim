import { describe, expect, it } from "vitest";
import { airyFwhmArcsec, airyRadiusArcsec, lambdaDurchDArcsec } from "./beugung";
import { airyProfil, gaussProfil, moffatProfil, quadratur } from "./profile";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8 (Quadratur) sowie 1.1 und 1.4 (Airy-Nullstellen).
describe("Airy-Profil", () => {
  it("hat Spitze 1 und Halbwert 0,5 bei FWHM/2 fuer 100 mm", () => {
    expect(airyProfil(0, 100, 0)).toBe(1);
    expect(airyProfil(airyFwhmArcsec(100) / 2, 100, 0)).toBeCloseTo(0.5, 2);
  });
  it("hat die erste Nullstelle beim Airy-Radius 1,22 lambda/D fuer 100 mm", () => {
    expect(airyProfil(airyRadiusArcsec(100), 100, 0)).toBeLessThan(1e-4);
  });
  it("mit Obstruktion 0,33 liegt die erste Nullstelle bei 1,098 lambda/D", () => {
    const r = 1.098 * lambdaDurchDArcsec(100);
    expect(airyProfil(r, 100, 0.33)).toBeLessThan(1e-4);
    expect(airyProfil(0, 100, 0.33)).toBe(1);
  });
});

describe("Moffat- und Gauss-Profil", () => {
  it("haben Spitze 1 und Halbwert 0,5 bei FWHM/2 fuer FWHM 2 Bogensekunden", () => {
    expect(moffatProfil(0, 2)).toBe(1);
    expect(moffatProfil(1, 2)).toBeCloseTo(0.5, 6);
    expect(gaussProfil(0, 2)).toBe(1);
    expect(gaussProfil(1, 2)).toBeCloseTo(0.5, 6);
  });
  it("Moffat hat bei 3 FWHM staerkere Fluegel als Gauss", () => {
    expect(moffatProfil(6, 2)).toBeGreaterThan(gaussProfil(6, 2) * 100);
  });
});

describe("Quadratur", () => {
  it("80 mm mit 2 Bogensekunden Seeing ist 2,476 Bogensekunden", () => {
    expect(quadratur(airyFwhmArcsec(80), 2)).toBeCloseTo(2.476, 3);
  });
  it("mit drei Komponenten 3, 4, 12 ist 13", () => {
    expect(quadratur(3, 4, 12)).toBeCloseTo(13, 12);
  });
});
