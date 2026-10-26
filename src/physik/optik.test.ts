import { describe, expect, it } from "vitest";
import { austrittspupilleMm, flaechenhelligkeitsfaktor, vergroesserungsgrenzen } from "./optik";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8.
describe("Optikgroessen", () => {
  it("Austrittspupille 80 mm bei 56-fach ist 1,4286 mm", () => {
    expect(austrittspupilleMm(80, 560 / 10)).toBeCloseTo(1.4286, 4);
  });
  it("Vergroesserungsgrenzen fuer 200 mm sind 33x und 400x", () => {
    const grenzen = vergroesserungsgrenzen(200);
    expect(grenzen.min).toBeCloseTo(33.33, 2);
    expect(grenzen.max).toBe(400);
  });
});

describe("Flaechenhelligkeit am Okular", () => {
  it("Austrittspupille 0,8 mm bei Pupille 6 mm ist Faktor 0,01778, also +4,375 mag", () => {
    const faktor = flaechenhelligkeitsfaktor(0.8);
    expect(faktor).toBeCloseTo(0.01778, 5);
    expect(-2.5 * Math.log10(faktor)).toBeCloseTo(4.375, 3);
  });
  it("Austrittspupille 7 mm ist Faktor 1, nicht heller als das Auge", () => {
    expect(flaechenhelligkeitsfaktor(7)).toBe(1);
    expect(flaechenhelligkeitsfaktor(6)).toBe(1);
  });
});
