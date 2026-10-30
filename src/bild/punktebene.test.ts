import { describe, expect, it } from "vitest";
import type { Helligkeit, Punktquelle, Quellbild } from "../naht/simulationsparameter";
import { FalterJs } from "./falter";
import { BildFehler } from "./fehler";
import { malePunktquellen } from "./male";
import { ausgeblendetKern, faltePunkte, halokern } from "./punktebene";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";
import { tonwert } from "./rendere";
import { deltaKern, kastenKern, kernAusDaten, verschobenerDeltaKern } from "./testkerne";

// Arbeitsraster 32 x 32 bei 1''/px, Mitte 0/0 wie in male.test.ts.
const N = 32;

function quellbild(punktquellen: Punktquelle[], teil: Partial<Quellbild> = {}): Quellbild {
  return { schluessel: "q", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punkte: { schluessel: "p", punktquellen }, ...teil };
}

function punkt(teil: Partial<Punktquelle> = {}): Punktquelle {
  return { name: "Io", xArcsec: 3.3, yArcsec: -2.1, durchmesserArcsec: 1.2, helligkeitRelativ: 0.5, sichtbar: true, ...teil };
}

const fluss = (p: Punktquelle): number => p.helligkeitRelativ * Math.PI * (p.durchmesserArcsec / 2) ** 2;

/** Gaussfoermiger Kern 9 x 9 (Sigma 1,5 px), Summe 1, wie ihn physik etwa liefert. */
function gaussKern(): ReturnType<typeof deltaKern> {
  const g = 9;
  const daten = new Float32Array(g * g);
  let s = 0;
  for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) s += daten[j * g + i] = Math.exp(-((i - 4) ** 2 + (j - 4) ** 2) / (2 * 1.5 ** 2));
  for (let k = 0; k < daten.length; k++) daten[k] = (daten[k] as number) / s;
  return kernAusDaten(g, daten, "gauss9");
}

function helligkeit(teil: Partial<Helligkeit> = {}): Helligkeit {
  return { schluessel: "h", faktorObjekt: 0.5, hintergrundRelativ: 0.01, hintergrundMagProArcsec2: 20, punktFaktor: 1, punktExponent: 1, mischgewicht: 0, ...teil };
}

describe("faltePunkte", () => {
  it("ohne Scheibchen keine Punktebene", () => {
    expect(faltePunkte([], gaussKern(), N)).toBeUndefined();
  });

  it("Fluss bleibt nach der lokalen Faltung erhalten (Kasten, Gauss)", () => {
    const p = punkt();
    const s = malePunktquellen(quellbild([p]));
    expect(summe(faltePunkte(s, kastenKern(5), N)!)).toBeCloseTo(fluss(p), 6);
    expect(summe(faltePunkte(s, gaussKern(), N)!)).toBeCloseTo(fluss(p), 6);
  });

  it("gleich der Faltung des ganzen Rasters mit FalterJs und dem ausgeblendeten Kern, auch unsymmetrisch (Richtung)", () => {
    const q = quellbild([punkt(), punkt({ name: "Europa", xArcsec: -7.7, yArcsec: 5.2, durchmesserArcsec: 3, helligkeitRelativ: 0.2 })]);
    const gemalt = faltePunkte(malePunktquellen(q), deltaKern(1), N)!;
    for (const kern of [gaussKern(), verschobenerDeltaKern(1, 2, 5)]) {
      const lokal = faltePunkte(malePunktquellen(q), kern, N)!;
      const ganz = new FalterJs().falte(gemalt, kernAusDaten(kern.groesse, ausgeblendetKern(kern), "aus"));
      for (let i = 0; i < lokal.daten.length; i++) expect(lokal.daten[i]).toBeCloseTo(ganz.daten[i] as number, 6);
    }
  });

  it("Trabant knapp ausserhalb des Fensters: nur die Fluegel reichen hinein; weit ausserhalb keine Ebene", () => {
    const knapp = faltePunkte(malePunktquellen(quellbild([punkt({ xArcsec: 17.5, yArcsec: 0.5, durchmesserArcsec: 0.5 })])), gaussKern(), N)!;
    expect(summe(knapp)).toBeGreaterThan(0);
    expect(summe(knapp)).toBeLessThan(0.5 * fluss(punkt({ durchmesserArcsec: 0.5 })));
    expect(knapp.daten[pixelIndex(knapp, 31, 15)]).toBeGreaterThan(knapp.daten[pixelIndex(knapp, 28, 15)] as number);
    expect(faltePunkte(malePunktquellen(quellbild([punkt({ xArcsec: 40 })])), gaussKern(), N)).toBeUndefined();
  });

  it("Trabant am Rand: angeschnittener Kern, innen dieselben Werte wie im groesseren Raster (keine Neunormierung)", () => {
    const p = punkt({ xArcsec: 15.5, yArcsec: 0.5 });
    const rand = faltePunkte(malePunktquellen(quellbild([p])), gaussKern(), N)!;
    // Raster 64 px mit Mitte x = +16'': linker Rand bei -16'' wie im kleinen Raster, oberer Rand
    // bei +32'' statt +16'', also gleiche Spalten, Zeilen um 16 weiter unten.
    const gross = faltePunkte(malePunktquellen(quellbild([p], { rasterPx: 2 * N, mitteXArcsec: 16 })), gaussKern(), 2 * N)!;
    for (let j = 10; j < 22; j++) {
      for (let i = 24; i < N; i++) expect(rand.daten[pixelIndex(rand, i, j)]).toBeCloseTo(gross.daten[pixelIndex(gross, i, j + 16)] as number, 7);
    }
    expect(summe(rand)).toBeLessThan(0.7 * fluss(p));
  });

  it("ausgeblendeter Kern (Issue #109): Summe erhalten, innen nur skaliert, rund, zum Rand stetig gegen 0", () => {
    // Breiter Gauss 17 x 17 (Sigma 4 px): am harten Rand noch deutlich ueber 0, wie die Seeing-Fluegel.
    const g = 17;
    const r = 8;
    const roh = new Float32Array(g * g);
    let s = 0;
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) s += roh[j * g + i] = Math.exp(-((i - r) ** 2 + (j - r) ** 2) / (2 * 4 ** 2));
    for (let k = 0; k < roh.length; k++) roh[k] = (roh[k] as number) / s;
    const kern = kernAusDaten(g, roh, "breit");
    const k = ausgeblendetKern(kern);
    expect(ausgeblendetKern(kern)).toBe(k);
    expect(k.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    // Innen (rho <= 2/3 r) ein gemeinsamer Faktor >= 1.
    const faktor = (k[r * g + r] as number) / (roh[r * g + r] as number);
    expect(faktor).toBeGreaterThanOrEqual(1);
    expect((k[r * g + r + 5] as number) / (roh[r * g + r + 5] as number)).toBeCloseTo(faktor, 5);
    // Ecken (rho > r + 0,5) sind 0, auf der Achse am Rand knapp ueber 0, deutlich unter dem rohen Wert.
    expect(k[0]).toBe(0);
    expect(k[g * g - 1]).toBe(0);
    expect(k[r * g + 2 * r] as number).toBeGreaterThan(0);
    expect(k[r * g + 2 * r] as number).toBeLessThan(0.1 * (roh[r * g + 2 * r] as number));
    // Entlang der Achse monoton fallend (kein Sprung).
    for (let a = r; a < 2 * r; a++) expect(k[r * g + a + 1] as number).toBeLessThan(k[r * g + a] as number);
    // Ein Delta bleibt ein Delta (Vergleichsbild).
    expect(Array.from(ausgeblendetKern(deltaKern(1)))).toEqual([1]);
  });

  it("halokern (Issue #135): innen bitgleich, Rand mal w^(1/n), Ecken 0, nicht neu normiert, eigener Schluessel", () => {
    const g = 17;
    const r = 8;
    const roh = new Float32Array(g * g);
    let s = 0;
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) s += roh[j * g + i] = Math.exp(-((i - r) ** 2 + (j - r) ** 2) / (2 * 4 ** 2));
    for (let k = 0; k < roh.length; k++) roh[k] = (roh[k] as number) / s;
    const kern = kernAusDaten(g, roh, "breit");
    const halo = halokern(kern, 1 / 3);
    expect(halokern(kern, 1 / 3)).toBe(halo);
    expect(halo.schluessel).toBe("breit|halo|0.3333333333333333");
    expect([halo.groesse, halo.radius, halo.massstabArcsecProPx]).toEqual([g, r, kern.massstabArcsecProPx]);
    // Innen (rho <= 2/3 r) dieselben Werte, der Scheitel einer Faltung bleibt also gleich.
    for (let a = r; a <= r + 5; a++) expect(halo.daten[r * g + a]).toBe(roh[r * g + a]);
    // Am Rand der Achse w^3 mit dem Fenster aus Abschnitt 24 (w(r) = sin^2(pi/2 * 0,5 / (r + 0,5 - 2r/3))).
    const w = Math.sin(((Math.PI / 2) * 0.5) / (r + 0.5 - (2 * r) / 3)) ** 2;
    expect(halo.daten[r * g + 2 * r]).toBeCloseTo((roh[r * g + 2 * r] as number) * w ** 3, 12);
    expect(halo.daten[0]).toBe(0);
    expect(halo.daten.reduce((x, y) => x + y, 0)).toBeLessThan(1);
    for (let a = r; a < 2 * r; a++) expect(halo.daten[r * g + a + 1] as number).toBeLessThan(halo.daten[r * g + a] as number);
    // Exponent 1: dasselbe Fenster wie ausgeblendetKern, nur ohne Normierung.
    const linear = halokern(kern, 1);
    const faktor = (ausgeblendetKern(kern)[r * g + r] as number) / (roh[r * g + r] as number);
    for (let i = 0; i < roh.length; i++) expect(ausgeblendetKern(kern)[i]).toBeCloseTo((linear.daten[i] as number) * faktor, 8);
    expect(Array.from(halokern(deltaKern(1), 1 / 3).daten)).toEqual([1]);
  });

  it("wirft BildFehler bei unstimmigem Kern oder Scheibchen", () => {
    const s = malePunktquellen(quellbild([punkt()]));
    expect(() => faltePunkte(s, { ...gaussKern(), radius: 3 }, N)).toThrow(BildFehler);
    expect(() => faltePunkte([{ ...s[0]!, breite: 99 }], gaussKern(), N)).toThrow(BildFehler);
  });
});

describe("tonwert mit Punktebene", () => {
  const objekt = (kanaele: 1 | 3 = 1): Raster => neuesRaster(4, 4, kanaele, 0.2);
  const punkte = (): Raster => {
    const r = neuesRaster(4, 4);
    r.daten[5] = 0.02;
    r.daten[6] = 3;
    return r;
  };

  it("ohne Punktebene bitgleich mit faktorObjekt * objekt + hintergrundRelativ", () => {
    const o = objekt(3);
    o.daten[7] = 0.123456;
    const h = helligkeit({ faktorObjekt: 0.31, hintergrundRelativ: 0.0037 });
    expect(tonwert(o, undefined, h).daten).toEqual(Float32Array.from(o.daten, (v) => 0.31 * v + 0.0037));
    // Leere Punktebene (alles 0) ebenso.
    expect(tonwert(o, neuesRaster(4, 4), h).daten).toEqual(Float32Array.from(o.daten, (v) => 0.31 * v + 0.0037));
  });

  it("Spitze = min(1, (punktFaktor * p)^punktExponent), additiv in allen Kanaelen", () => {
    const h = helligkeit({ punktFaktor: 4, punktExponent: 1 / 3 });
    for (const k of [1, 3] as const) {
      const t = tonwert(objekt(k), punkte(), h);
      const basis = 0.5 * 0.2 + 0.01;
      for (let c = 0; c < k; c++) {
        expect(t.daten[5 * k + c]).toBeCloseTo(basis + Math.pow(4 * 0.02, 1 / 3), 6);
        expect(t.daten[6 * k + c]).toBeCloseTo(basis + 1, 6);
        expect(t.daten[0 * k + c]).toBeCloseTo(basis, 7);
      }
    }
  });

  it("Kompression hebt schwache Punkte: p = 0,001 bei punktFaktor 1 gibt 0,1 statt 0,001", () => {
    const r = neuesRaster(4, 4);
    r.daten[0] = 0.001;
    const t = tonwert(neuesRaster(4, 4), r, helligkeit({ hintergrundRelativ: 0, punktExponent: 1 / 3 }));
    expect(t.daten[0]).toBeCloseTo(0.1, 6);
    const linear = tonwert(neuesRaster(4, 4), r, helligkeit({ hintergrundRelativ: 0 }));
    expect(linear.daten[0]).toBeCloseTo(0.001, 7);
  });

  it("Punktebene mit falschen Massen ist ein Programmierfehler", () => {
    expect(() => tonwert(objekt(), neuesRaster(5, 4), helligkeit())).toThrow(BildFehler);
    expect(() => tonwert(objekt(), neuesRaster(4, 4, 3), helligkeit())).toThrow(BildFehler);
  });
});
