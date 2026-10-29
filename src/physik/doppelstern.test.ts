import { describe, expect, it } from "vitest";
import type { Paareingaben, Stern } from "../naht/konfiguration";
import { freiesPaar, gesamthelligkeit, ueberstrahlung } from "./doppelstern";

// Testwerte aus docs/recherche/physik.md Abschnitt 16 (eigene Rechnung) und
// docs/recherche/doppelsterne.md 3.2 (Vorgaben des freien Paars) und 5 (Katalogwerte).

/** Paar nach doppelsterne.md 3.1: A bei -rho/2, B bei +rho/2 Ost-West. */
function paar(trennungArcsec: number, magnitudeA: number, magnitudeB: number): Stern[] {
  return [
    { name: "A", dxArcsec: -trennungArcsec / 2, dyArcsec: 0, magnitude: magnitudeA, bv: 0.6 },
    { name: "B", dxArcsec: trennungArcsec / 2, dyArcsec: 0, magnitude: magnitudeB, bv: 0.6 }
  ];
}

const VORGABE: Paareingaben = { trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 };

describe("gesamthelligkeit: m = -2,5 log10(sum 10^(-0,4 m_i))", () => {
  it("zwei gleiche Sterne: m - 0,753", () => {
    expect(gesamthelligkeit([5, 5])).toBeCloseTo(5 - 0.753, 3);
    expect(gesamthelligkeit([-1, -1])).toBeCloseTo(-1 - 2.5 * Math.log10(2), 12);
  });
  it("ein Stern: seine Magnitude", () => {
    expect(gesamthelligkeit([3.19])).toBeCloseTo(3.19, 12);
  });
  it("Vorgabe 5 und 6 mag: 4,636; Antares 0,96 und 5,40: 0,942", () => {
    expect(gesamthelligkeit([5, 6])).toBeCloseTo(4.636, 3);
    expect(gesamthelligkeit([0.96, 5.4])).toBeCloseTo(0.942, 3);
  });
});

describe("freiesPaar (A-Z9, doppelsterne.md 3.2)", () => {
  it("Vorgabe 2'', 5 und 6 mag, B-V 0,6: Objektzustand des freien Paars", () => {
    const o = freiesPaar(VORGABE);
    expect(o).toEqual({
      kennung: "frei",
      klasse: "doppelstern",
      durchmesserArcsec: 2,
      magnitude: gesamthelligkeit([5, 6]),
      trabanten: [],
      sterne: [
        { name: "A", dxArcsec: -1, dyArcsec: 0, magnitude: 5, bv: 0.6 },
        { name: "B", dxArcsec: 1, dyArcsec: 0, magnitude: 6, bv: 0.6 }
      ],
      paar: VORGABE
    });
    expect(o).not.toHaveProperty("quelle");
    expect(o).not.toHaveProperty("isophoten");
  });

  it("Abstand der Sterne gleich Trennung, Mitte im Ursprung, B-V je Stern", () => {
    const o = freiesPaar({ trennungArcsec: 0.55, magnitudeA: 6.2, magnitudeB: 6.2, bvA: -0.4, bvB: 2 });
    const [a, b] = o.sterne;
    expect(Math.abs(b!.dxArcsec - a!.dxArcsec)).toBeCloseTo(0.55, 12);
    expect(a!.dxArcsec + b!.dxArcsec).toBe(0);
    expect([a!.bv, b!.bv]).toEqual([-0.4, 2]);
    expect(o.magnitude).toBeCloseTo(6.2 - 0.753, 3);
  });

  it("A schwaecher als B ist erlaubt; paar ist eine Kopie der Eingabe", () => {
    const e: Paareingaben = { ...VORGABE, magnitudeA: 9, magnitudeB: 4 };
    const o = freiesPaar(e);
    expect(o.sterne.map((s) => s.magnitude)).toEqual([9, 4]);
    expect(o.paar).toEqual(e);
    expect(o.paar).not.toBe(e);
  });
});

describe("ueberstrahlung (A-Z9, Entscheidung 5 in docs/recherche/README.md)", () => {
  it("Antares (Delta m 4,44, 2,579'') loest die Warnung aus", () => {
    expect(ueberstrahlung(paar(2.579, 0.96, 5.4))).toEqual([{ art: "ueberstrahlung", wert: 4.44, grenze: 4, sterne: ["A", "B"] }]);
  });

  it("Albireo (Delta m 1,49, 34,3'') nicht", () => {
    expect(ueberstrahlung(paar(34.3, 3.19, 4.68))).toEqual([]);
  });

  it("Polaris (Delta m 6,56, aber 18,4'') nicht: nur unter 10''", () => {
    expect(ueberstrahlung(paar(18.4, 2.04, 8.6))).toEqual([]);
  });

  it("Grenzen: Delta m genau 4 ja, 3,9 nein; Abstand 9,95'' ja, 10'' nein; A schwaecher als B ja", () => {
    expect(ueberstrahlung(paar(2, 2.1, 6.1))).toHaveLength(1);
    expect(ueberstrahlung(paar(2, 2.1, 6))).toEqual([]);
    expect(ueberstrahlung(paar(9.95, 1, 6))).toHaveLength(1);
    expect(ueberstrahlung(paar(10, 1, 6))).toEqual([]);
    expect(ueberstrahlung(paar(2, 8, 3))).toEqual([{ art: "ueberstrahlung", wert: 5, grenze: 4, sterne: ["A", "B"] }]);
  });

  it("prueft jedes Paar der Liste, auch in y; ein Stern oder keiner ergibt nichts", () => {
    const sterne: Stern[] = [
      { name: "A", dxArcsec: -100, dyArcsec: 0, magnitude: 5, bv: 0.6 },
      { name: "B", dxArcsec: -98, dyArcsec: 0, magnitude: 6, bv: 0.6 },
      { name: "C", dxArcsec: 100, dyArcsec: 0, magnitude: 5, bv: 0.6 },
      { name: "D", dxArcsec: 100, dyArcsec: 3, magnitude: 10, bv: 0.6 }
    ];
    expect(ueberstrahlung(sterne)).toEqual([{ art: "ueberstrahlung", wert: 5, grenze: 4, sterne: ["C", "D"] }]);
    expect(ueberstrahlung(sterne.slice(0, 1))).toEqual([]);
    expect(ueberstrahlung([])).toEqual([]);
  });

  it("das freie Paar liefert seine Sterne passend fuer ueberstrahlung", () => {
    expect(ueberstrahlung(freiesPaar({ ...VORGABE, magnitudeA: 1, magnitudeB: 5.5 }).sterne)).toHaveLength(1);
    expect(ueberstrahlung(freiesPaar(VORGABE).sterne)).toEqual([]);
  });
});
