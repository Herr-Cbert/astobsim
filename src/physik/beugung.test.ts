import { describe, expect, it } from "vitest";
import {
  airyAmplitude,
  airyFwhmArcsec,
  airyRadiusArcsec,
  dawesArcsec,
  energieImAiryKern,
  lambdaDurchDArcsec,
  mtfPupille,
  rayleighArcsec
} from "./beugung";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8; MTF-Tabelle in Abschnitt 1.3, Energie in 1.4.
describe("Beugungsgrenzen", () => {
  it("lambda/D fuer 200 mm ist 0,567 Bogensekunden", () => {
    expect(lambdaDurchDArcsec(200)).toBeCloseTo(0.567, 3);
  });
  it("Rayleigh fuer 100 mm bei 550 nm ist 1,384 Bogensekunden", () => {
    expect(rayleighArcsec(100)).toBeCloseTo(1.384, 3);
  });
  it("Dawes fuer 100 mm ist 1,158 Bogensekunden", () => {
    expect(dawesArcsec(100)).toBeCloseTo(1.158, 3);
  });
  it("Airy-Radius fuer 200 mm ist 0,692 Bogensekunden", () => {
    expect(airyRadiusArcsec(200)).toBeCloseTo(0.692, 3);
  });
  it("Airy-FWHM fuer 200 mm ist 0,584 Bogensekunden", () => {
    expect(airyFwhmArcsec(200)).toBeCloseTo(0.584, 3);
  });
});

describe("MTF der Pupille", () => {
  it("freie Oeffnung bei nu 0,5 ist 0,3910", () => {
    expect(mtfPupille(0.5, 0)).toBeCloseTo(0.391, 4);
  });
  it("ist 1 bei nu 0 und 0 ab nu 1", () => {
    expect(mtfPupille(0, 0)).toBe(1);
    expect(mtfPupille(0, 0.33)).toBe(1);
    expect(mtfPupille(1, 0)).toBe(0);
    expect(mtfPupille(1.2, 0.33)).toBe(0);
  });
  it("Obstruktion 0,33 bei nu 0,35 ist 0,70 mal frei, Toleranz 2 Prozent", () => {
    const verhaeltnis = mtfPupille(0.35, 0.33) / mtfPupille(0.35, 0);
    expect(verhaeltnis).toBeGreaterThan(0.7 * 0.98);
    expect(verhaeltnis).toBeLessThan(0.7 * 1.02);
  });
  it("Tabellenwerte: Obstruktion 0,2 bei nu 0,3 ist 0,567, Obstruktion 0,4 bei nu 0,7 ist 0,224", () => {
    expect(Math.abs(mtfPupille(0.3, 0.2) - 0.567)).toBeLessThan(0.005);
    expect(Math.abs(mtfPupille(0.7, 0.4) - 0.224)).toBeLessThan(0.005);
  });
  it("Obstruktion liegt bei nu 0,7 ueber der freien Oeffnung", () => {
    expect(mtfPupille(0.7, 0.33)).toBeGreaterThan(mtfPupille(0.7, 0));
  });
});

describe("Airy-Amplitude der Ringoeffnung", () => {
  it("ist 1 bei v 0 und hat die Nullstelle bei 3,8317 ohne Obstruktion, bei 3,449 mit 0,33", () => {
    expect(airyAmplitude(0, 0)).toBe(1);
    expect(airyAmplitude(0, 0.33)).toBe(1);
    expect(Math.abs(airyAmplitude(3.8317, 0))).toBeLessThan(1e-5);
    expect(Math.abs(airyAmplitude(1.098 * Math.PI, 0.33))).toBeLessThan(1e-3);
  });
});

describe("Energie im Airy-Kern", () => {
  it("ist 0,838 / 0,764 / 0,682 / 0,584 fuer Obstruktion 0 / 0,2 / 0,3 / 0,4", () => {
    expect(energieImAiryKern(0)).toBeCloseTo(0.838, 3);
    expect(energieImAiryKern(0.2)).toBeCloseTo(0.764, 3);
    expect(energieImAiryKern(0.3)).toBeCloseTo(0.682, 3);
    expect(energieImAiryKern(0.4)).toBeCloseTo(0.584, 3);
  });
});
