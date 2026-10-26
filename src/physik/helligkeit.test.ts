import { describe, expect, it } from "vitest";
import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import { bortleMagProArcsec2, helligkeit } from "./helligkeit";
import type { Optik } from "./optik";
import { MOND_Q1 as MOND } from "./testdaten";

// Optik und Atmosphaere direkt als Skalare, damit jeder Faktor einzeln sichtbar wird.
function optikMit(teil: Partial<Optik>): Optik {
  return {
    oeffnungMm: 80,
    vergroesserung: 100,
    obstruktion: 0,
    transmission: 1,
    austrittspupilleMm: 0.8,
    gesichtsfeld: { form: "kreis", breiteArcsec: 1800, hoeheArcsec: 1800 },
    ...teil
  };
}
const KLAR: Atmosphaere = { luftmasse: 1, seeingFwhmArcsec: 2, extinktionMag: 0, transmission: 1 };

// Testwerte aus docs/recherche/physik.md, Abschnitte 6.1, 6.2 und 8.
describe("helligkeit: Objektfaktor", () => {
  it("Austrittspupille 0,8 mm ohne weitere Verluste ist Faktor 0,01778", () => {
    expect(helligkeit(optikMit({}), KLAR, 5, MOND).faktorObjekt).toBeCloseTo(0.01778, 5);
  });
  it("Austrittspupille 7 mm ist durch die Pupille Faktor 1, nach oben begrenzt", () => {
    expect(helligkeit(optikMit({ austrittspupilleMm: 7 }), KLAR, 5, MOND).faktorObjekt).toBe(1);
  });
  it("Newton mit Obstruktion 0,33 und tau 0,8: Abschattung (1 - 0,33^2) genau einmal, mal Atmosphaere", () => {
    const a: Atmosphaere = { ...KLAR, extinktionMag: 0.3989, transmission: 0.6925 };
    const h = helligkeit(optikMit({ austrittspupilleMm: 7, obstruktion: 0.33, transmission: 0.8 }), a, 5, MOND);
    expect(h.faktorObjekt).toBeCloseTo(0.8 * (1 - 0.33 ** 2) * 0.6925, 10);
  });
});

describe("helligkeit: Hintergrund", () => {
  it("Bortle 8 (17,5) bei Austrittspupille 0,8 mm ist 21,875 mag je Quadratbogensekunde", () => {
    const h = helligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundMagProArcsec2).toBeCloseTo(17.5 + 4.375, 3);
  });
  it("Extinktion dunkelt das Objekt, nicht den Himmel", () => {
    const diesig: Atmosphaere = { ...KLAR, extinktionMag: 0.9, transmission: 0.4365 };
    const klar = helligkeit(optikMit({}), KLAR, 5, MOND);
    const dunst = helligkeit(optikMit({}), diesig, 5, MOND);
    expect(dunst.faktorObjekt).toBeCloseTo(klar.faktorObjekt * 0.4365, 10);
    expect(dunst.hintergrundMagProArcsec2).toBe(klar.hintergrundMagProArcsec2);
  });
  it("Hintergrund relativ zu Quellweiss 3,4 mag: 10^(-0,4 (21,875 - 3,4))", () => {
    const h = helligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundRelativ).toBeCloseTo(Math.pow(10, -0.4 * (h.hintergrundMagProArcsec2 - 3.4)), 12);
    expect(h.hintergrundRelativ).toBeCloseTo(4.07e-8, 10);
  });
  it("Bortle-Tabelle: 1 ist 21,9, 5 ist 20,0, 9 ist 17,0; 0, 10 und 5,5 sind Programmierfehler", () => {
    expect(bortleMagProArcsec2(1)).toBe(21.9);
    expect(bortleMagProArcsec2(5)).toBe(20.0);
    expect(bortleMagProArcsec2(9)).toBe(17.0);
    expect(() => bortleMagProArcsec2(0)).toThrow(PhysikFehler);
    expect(() => bortleMagProArcsec2(10)).toThrow(PhysikFehler);
    expect(() => bortleMagProArcsec2(5.5)).toThrow(PhysikFehler);
  });
});

describe("helligkeit: Schluessel", () => {
  it("ist gleich bei gleichen gerundeten Werten und verschieden bei anderem Bortle", () => {
    const h1 = helligkeit(optikMit({}), KLAR, 5, MOND);
    const h2 = helligkeit(optikMit({ austrittspupilleMm: 0.8000001 }), KLAR, 5, MOND);
    const h3 = helligkeit(optikMit({}), KLAR, 6, MOND);
    expect(h2.schluessel).toBe(h1.schluessel);
    expect(h3.schluessel).not.toBe(h1.schluessel);
  });
});
