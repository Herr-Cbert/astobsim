import { describe, expect, it } from "vitest";
import { PhysikFehler } from "./fehler";
import { BAUARTEN, type Fernrohr } from "./konfiguration";
import { ARCSEC_PRO_GRAD, TRANSMISSION } from "./konstanten";
import { austrittspupilleMm, flaechenhelligkeitsfaktor, optik, vergroesserungsgrenzen } from "./optik";

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

const REFRAKTOR_80_560: Fernrohr = {
  art: "fernrohr",
  oeffnungMm: 80,
  brennweiteMm: 560,
  obstruktion: 0,
  bauart: "refraktor",
  okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
};

describe("optik: Fernrohr", () => {
  it("80/560 mit 10 mm Okular: 56-fach, Austrittspupille 1,4286 mm, Kreis 50/56 Grad", () => {
    const o = optik(REFRAKTOR_80_560);
    expect(o.oeffnungMm).toBe(80);
    expect(o.vergroesserung).toBe(56);
    expect(o.austrittspupilleMm).toBeCloseTo(1.4286, 4);
    expect(o.obstruktion).toBe(0);
    expect(o.transmission).toBe(0.9);
    expect(o.gesichtsfeld.form).toBe("kreis");
    expect(o.gesichtsfeld.breiteArcsec).toBeCloseTo((50 / 56) * ARCSEC_PRO_GRAD, 6);
    expect(o.gesichtsfeld.hoeheArcsec).toBe(o.gesichtsfeld.breiteArcsec);
  });
  it.each(BAUARTEN)("Bauart %s hat ihre Transmission aus Abschnitt 5.2, Obstruktion bleibt getrennt", (bauart) => {
    const o = optik({ ...REFRAKTOR_80_560, bauart, obstruktion: 0.33 });
    expect(o.transmission).toBe(TRANSMISSION[bauart]);
    expect(o.obstruktion).toBe(0.33);
  });
});

describe("optik: Fernglas", () => {
  it("10x50 mit 6,5 Grad: Austrittspupille 5 mm, Kreis 6,5 Grad, Transmission 0,85, keine Obstruktion", () => {
    const o = optik({ art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 });
    expect(o.oeffnungMm).toBe(50);
    expect(o.vergroesserung).toBe(10);
    expect(o.austrittspupilleMm).toBe(5);
    expect(o.obstruktion).toBe(0);
    expect(o.transmission).toBe(0.85);
    expect(o.gesichtsfeld).toEqual({ form: "kreis", breiteArcsec: 6.5 * ARCSEC_PRO_GRAD, hoeheArcsec: 6.5 * ARCSEC_PRO_GRAD });
  });
});

describe("optik: blosses Auge", () => {
  it("6 mm, 1-fach, Austrittspupille 6 mm, Rechteck 5 Grad, Transmission 1", () => {
    const o = optik({ art: "auge" });
    expect(o.oeffnungMm).toBe(6);
    expect(o.vergroesserung).toBe(1);
    expect(o.austrittspupilleMm).toBe(6);
    expect(o.obstruktion).toBe(0);
    expect(o.transmission).toBe(1);
    expect(o.gesichtsfeld).toEqual({ form: "rechteck", breiteArcsec: 5 * ARCSEC_PRO_GRAD, hoeheArcsec: 5 * ARCSEC_PRO_GRAD });
  });
});

describe("optik: Programmierfehler", () => {
  it("wirft PhysikFehler bei Oeffnung 0, Obstruktion 0,6, Vergroesserung unter 1 und NaN", () => {
    expect(() => optik({ ...REFRAKTOR_80_560, oeffnungMm: 0 })).toThrow(PhysikFehler);
    expect(() => optik({ ...REFRAKTOR_80_560, obstruktion: 0.6 })).toThrow(PhysikFehler);
    expect(() => optik({ art: "fernglas", oeffnungMm: 50, vergroesserung: 0.5, wahresGesichtsfeldGrad: 6.5 })).toThrow(PhysikFehler);
    expect(() => optik({ ...REFRAKTOR_80_560, brennweiteMm: NaN })).toThrow(PhysikFehler);
  });
});
