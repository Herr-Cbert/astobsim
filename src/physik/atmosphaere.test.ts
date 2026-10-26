import { describe, expect, it } from "vitest";
import { extinktionFaktor, extinktionMag, friedParameterCm, luftmasse, seeingAmObjektArcsec } from "./atmosphaere";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8.
describe("Luftmasse nach Kasten-Young", () => {
  it("bei 45 Grad ist 1,4126", () => {
    expect(luftmasse(45)).toBeCloseTo(1.4126, 4);
  });
  it("bei 30 Grad ist 1,9943", () => {
    expect(luftmasse(30)).toBeCloseTo(1.9943, 4);
  });
  it("bei 90 Grad ist 0,9997, nicht genau 1", () => {
    expect(luftmasse(90)).toBeCloseTo(0.9997, 4);
    expect(luftmasse(90)).toBeCloseTo(1.0, 2);
  });
});

describe("Seeing", () => {
  it("Seeing-Faktor bei 30 Grad Hoehe ist 1,513", () => {
    expect(seeingAmObjektArcsec(1, 1.9943)).toBeCloseTo(1.513, 3);
  });
  it("2 Bogensekunden Seeing entsprechen r0 5,56 cm", () => {
    expect(friedParameterCm(2)).toBeCloseTo(5.56, 2);
  });
  it("r0 10 cm entspricht FWHM 1,112 Bogensekunden", () => {
    expect(friedParameterCm(1.112)).toBeCloseTo(10.0, 2);
  });
});

describe("Extinktion", () => {
  it("bei 30 Grad ist 0,3989 / 0,5983 / 0,8974 mag fuer klar / leicht diesig / diesig", () => {
    const x = luftmasse(30);
    expect(extinktionMag("klar", x)).toBeCloseTo(0.3989, 4);
    expect(extinktionMag("leicht-diesig", x)).toBeCloseTo(0.5983, 4);
    expect(extinktionMag("diesig", x)).toBeCloseTo(0.8974, 4);
  });
  it("0,499 mag (k 0,25 bei 30 Grad) sind Faktor 0,632", () => {
    expect(0.25 * luftmasse(30)).toBeCloseTo(0.499, 3);
    expect(extinktionFaktor(0.499)).toBeCloseTo(0.632, 3);
  });
});
