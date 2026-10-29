import { describe, expect, it } from "vitest";
import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import { BELEUCHTUNG_NULL_MAG_LX, FARBSCHWELLE_LX } from "./konstanten";
import { optik } from "./optik";
import { beleuchtungAmAugeLx, bvZuTemperatur, sternfarbe, temperaturZuRgb } from "./sternfarbe";
import { refraktorMitVergroesserung } from "./testdaten";

// Testwerte aus docs/recherche/wahrnehmung.md Abschnitt 5 und 6 (B-V zu T, Tabelle 5.3, Farbgrenze)
// und docs/recherche/physik.md Abschnitt 18.

/** Ohne Extinktion, wie die Rechnung der Farbgrenze in wahrnehmung.md 5.1. */
const OHNE_ATMOSPHAERE: Atmosphaere = { luftmasse: 1, seeingFwhmArcsec: 2, extinktionMag: 0, transmission: 1 };

/** Leuchtdichte Y des linearen sRGB (IEC 61966-2-1). */
function leuchtdichte(rgb: [number, number, number]): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** Magnitude, bei der die Beleuchtungsstaerke am Auge die Farbschwelle erreicht. */
function farbgrenzeMag(o: ReturnType<typeof optik>): number {
  return -2.5 * Math.log10(FARBSCHWELLE_LX / beleuchtungAmAugeLx(0, o, OHNE_ATMOSPHAERE));
}

describe("bvZuTemperatur: Ballesteros 2012, Gl. 14", () => {
  it("B-V 0,65 / 0 / 1,5 ergibt 5778 / 10 125 / 3794 K", () => {
    expect(bvZuTemperatur(0.65)).toBeCloseTo(5778, 0);
    expect(bvZuTemperatur(0)).toBeCloseTo(10125, 0);
    expect(bvZuTemperatur(1.5)).toBeCloseTo(3794, 0);
  });
  it("faellt streng mit B-V", () => {
    expect(bvZuTemperatur(-0.4)).toBeGreaterThan(bvZuTemperatur(-0.3));
    expect(bvZuTemperatur(1.9)).toBeGreaterThan(bvZuTemperatur(2.0));
  });
  it("wirft PhysikFehler bei NaN und am Pol -0,674", () => {
    expect(() => bvZuTemperatur(Number.NaN)).toThrow(PhysikFehler);
    expect(() => bvZuTemperatur(-0.62 / 0.92)).toThrow(PhysikFehler);
  });
});

describe("temperaturZuRgb: lineares sRGB (D65), Y = 1", () => {
  // Tabelle 5.3, Spalte "linear (Y = 1)"
  const TABELLE_5_3: [number, [number, number, number]][] = [
    [-0.3, [0.773, 0.991, 1.76]],
    [0.0, [0.869, 0.994, 1.44]],
    [0.6, [1.09, 0.979, 0.947]],
    [1.0, [1.251, 0.955, 0.706]],
    [1.5, [1.461, 0.915, 0.481]],
    [1.8, [1.591, 0.887, 0.376]]
  ];
  it.each(TABELLE_5_3)("B-V %s: Tabelle 5.3 auf 0,01", (bv, erwartet) => {
    const rgb = temperaturZuRgb(bvZuTemperatur(bv));
    erwartet.forEach((w, k) => expect(Math.abs(rgb[k]! - w)).toBeLessThan(0.01));
  });
  it("Y = 1 an allen Stuetzstellen -0,4 bis 2,0 (auf 1e-3)", () => {
    for (let i = 0; i <= 24; i++) {
      expect(leuchtdichte(temperaturZuRgb(bvZuTemperatur(-0.4 + 0.1 * i)))).toBeCloseTo(1, 3);
    }
  });
  it("zwischen den Stuetzstellen linear in B-V: Sonne 5778 K (B-V 0,65) ist das Mittel aus 0,6 und 0,7", () => {
    const sonne = temperaturZuRgb(5778);
    const a = temperaturZuRgb(bvZuTemperatur(0.6));
    const b = temperaturZuRgb(bvZuTemperatur(0.7));
    sonne.forEach((w, k) => expect(w).toBeCloseTo((a[k]! + b[k]!) / 2, 3));
  });
  it("Interpolationsfehler bei B-V 0,65 unter 0,001 gegen die direkte Rechnung (1,1095 / 0,9763 / 0,9133, ber.)", () => {
    const rgb = temperaturZuRgb(5778);
    [1.1095, 0.9763, 0.9133].forEach((w, k) => expect(Math.abs(rgb[k]! - w)).toBeLessThan(0.001));
  });
  it("ausserhalb der Tabelle gilt die Randzeile", () => {
    [0.7429, 0.9879, 1.8776].forEach((w, k) => expect(temperaturZuRgb(50000)[k]).toBeCloseTo(w, 12));
    [1.6787, 0.8673, 0.3167].forEach((w, k) => expect(temperaturZuRgb(2000)[k]).toBeCloseTo(w, 12));
    expect(sternfarbe(3.0, 1)).toEqual([1.6787, 0.8673, 0.3167]);
  });
  it("sehr hohe Temperatur (1e300, Infinity-nah) ergibt die blaue Randzeile statt eines Fehlers", () => {
    [0.7429, 0.9879, 1.8776].forEach((w, k) => expect(temperaturZuRgb(1e300)[k]).toBeCloseTo(w, 12));
    [0.7429, 0.9879, 1.8776].forEach((w, k) => expect(temperaturZuRgb(Number.MAX_VALUE)[k]).toBeCloseTo(w, 12));
  });
  it("am und unter dem Pol: bvZuTemperatur wirft, sternfarbe gibt die blaue Randzeile", () => {
    expect(() => bvZuTemperatur(-0.7)).toThrow(PhysikFehler);
    expect(sternfarbe(-0.7, 1)).toEqual([0.7429, 0.9879, 1.8776]);
  });
  it("wirft PhysikFehler bei t <= 0 und NaN", () => {
    expect(() => temperaturZuRgb(0)).toThrow(PhysikFehler);
    expect(() => temperaturZuRgb(Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("beleuchtungAmAugeLx: Z 10^(-0,4 m) a tau (1 - eps^2) (min(D, pV) / p)^2", () => {
  const auge = optik({ art: "auge" });
  it("blosses Auge ohne Atmosphaere: Z 10^(-0,4 m)", () => {
    expect(beleuchtungAmAugeLx(0, auge, OHNE_ATMOSPHAERE)).toBeCloseTo(BELEUCHTUNG_NULL_MAG_LX, 15);
    expect(beleuchtungAmAugeLx(5, auge, OHNE_ATMOSPHAERE)).toBeCloseTo(BELEUCHTUNG_NULL_MAG_LX / 100, 15);
  });
  it("Atmosphaere wirkt mit ihrem Transmissionsfaktor", () => {
    const atm: Atmosphaere = { ...OHNE_ATMOSPHAERE, extinktionMag: 0.2, transmission: Math.pow(10, -0.08) };
    expect(beleuchtungAmAugeLx(1, auge, atm) / beleuchtungAmAugeLx(1, auge, OHNE_ATMOSPHAERE)).toBeCloseTo(Math.pow(10, -0.08), 12);
  });
  it("80 mm Refraktor: volle Oeffnung ab V = D/p, darunter begrenzt die Augenpupille (p V)^2", () => {
    const bei = (v: number) => beleuchtungAmAugeLx(0, optik(refraktorMitVergroesserung(80, v)), OHNE_ATMOSPHAERE);
    expect(bei(80 / 6) / BELEUCHTUNG_NULL_MAG_LX).toBeCloseTo(0.9 * (80 / 6) ** 2, 9);
    expect(bei(40)).toBeCloseTo(bei(80 / 6), 15);
    expect(bei(10) / BELEUCHTUNG_NULL_MAG_LX).toBeCloseTo(0.9 * 100, 9);
    expect(bei(5) / bei(10)).toBeCloseTo(0.25, 12);
  });
  it("wirft PhysikFehler bei nicht endlicher Magnitude", () => {
    expect(() => beleuchtungAmAugeLx(Number.NaN, auge, OHNE_ATMOSPHAERE)).toThrow(PhysikFehler);
  });
});

describe("sternfarbe: Farbe nur ab Z 10^-0,92 = 3,05e-7 lx (A-P12)", () => {
  it("Schwelle Z 10^(-0,4 2,3) = 3,05e-7 lx, gerundet 3,1e-7", () => {
    expect(FARBSCHWELLE_LX).toBeCloseTo(3.054e-7, 10);
    expect(Number(FARBSCHWELLE_LX.toPrecision(2))).toBe(3.1e-7);
  });
  it("unter der Schwelle undefined, ab der Schwelle die Farbe aus B-V", () => {
    expect(sternfarbe(1.5, FARBSCHWELLE_LX * 0.999)).toBeUndefined();
    const farbe = sternfarbe(1.5, FARBSCHWELLE_LX);
    expect(farbe).toBeDefined();
    temperaturZuRgb(bvZuTemperatur(1.5)).forEach((w, k) => expect(farbe![k]).toBeCloseTo(w, 12));
  });
  it("Farbgrenze blosses Auge 2,3 mag", () => {
    expect(farbgrenzeMag(optik({ art: "auge" }))).toBeCloseTo(2.3, 10);
  });
  it("Farbgrenze 80 mm Refraktor (tau 0,9, V >= D/p) 7,8 mag (ber. 7,810)", () => {
    expect(farbgrenzeMag(optik(refraktorMitVergroesserung(80, 30)))).toBeCloseTo(7.81, 2);
  });
  it("Farbgrenze 200 mm Newton (tau 0,8, eps 0,25, V >= D/p) 9,6 mag (ber. 9,602)", () => {
    const newton = optik({
      art: "fernrohr",
      oeffnungMm: 200,
      brennweiteMm: 1000,
      obstruktion: 0.25,
      bauart: "newton",
      okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
    });
    expect(farbgrenzeMag(newton)).toBeCloseTo(9.6, 1);
  });
  it("Antares (1,0 mag, B-V 1,8) mit blossem Auge farbig, Albireo A (3,1 mag) grau (W4)", () => {
    const auge = optik({ art: "auge" });
    expect(sternfarbe(1.8, beleuchtungAmAugeLx(1.0, auge, OHNE_ATMOSPHAERE))).toBeDefined();
    expect(sternfarbe(1.09, beleuchtungAmAugeLx(3.1, auge, OHNE_ATMOSPHAERE))).toBeUndefined();
  });
  it("wirft PhysikFehler bei NaN", () => {
    expect(() => sternfarbe(Number.NaN, 1)).toThrow(PhysikFehler);
    expect(() => sternfarbe(0.6, Number.NaN)).toThrow(PhysikFehler);
  });
});
