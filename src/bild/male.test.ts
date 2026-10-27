import { describe, expect, it } from "vitest";
import type { Punktquelle, Quellbild } from "../naht/simulationsparameter";
import { BildFehler } from "./fehler";
import { malePunktquellen } from "./male";
import { faltePunkte } from "./punktebene";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";
import { deltaKern } from "./testkerne";

// Arbeitsraster 32 x 32 bei 1''/px, Mitte 0/0: Pixel (i, j) deckt x in [i - 16, i - 15),
// y in (16 - j - 1, 16 - j]. Ein Scheibchen mit d Pixeln traegt den Fluss h pi (d/2)^2.

const N = 32;

function quellbild(punktquellen: Punktquelle[], teil: Partial<Quellbild> = {}): Quellbild {
  return { schluessel: "q", objekt: "test", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punktquellen, ...teil };
}

function punkt(teil: Partial<Punktquelle> = {}): Punktquelle {
  return { name: "Io", xArcsec: 0.5, yArcsec: -0.5, durchmesserArcsec: 8, helligkeitRelativ: 1.5, sichtbar: true, ...teil };
}

const fluss = (p: Punktquelle, massstab = 1): number => p.helligkeitRelativ * Math.PI * (p.durchmesserArcsec / massstab / 2) ** 2;

/** Die gemalten Scheibchen ohne Faltung (Deltakern) in der Punktebene, leere Ebene wenn keins ins Raster faellt. */
function ebene(q: Quellbild): Raster {
  return faltePunkte(malePunktquellen(q), deltaKern(1, q.massstabArcsecProPx), q.rasterPx) ?? neuesRaster(q.rasterPx, q.rasterPx);
}

/** Pixel im Inneren tragen helligkeitRelativ bis auf den Flaechenfehler der 8x8-Unterabtastung (unter 1 %). */
function erwarteInnen(wert: number | undefined, helligkeit: number): void {
  expect(Math.abs((wert ?? 0) / helligkeit - 1)).toBeLessThan(0.01);
}

describe("malePunktquellen", () => {
  it("ohne sichtbare Punktquelle keine Scheibchen; geblendete werden nicht gemalt", () => {
    expect(malePunktquellen(quellbild([]))).toEqual([]);
    expect(malePunktquellen(quellbild([punkt({ sichtbar: false, grund: "blendung" })]))).toEqual([]);
  });

  it("grosses Scheibchen: innen helligkeitRelativ, Fluss h pi (d/2)^2, aussen 0", () => {
    const p = punkt();
    const [s] = malePunktquellen(quellbild([p]));
    expect(s).toBeDefined();
    expect(s!.daten.reduce((a, b) => a + b, 0)).toBeCloseTo(fluss(p), 4);
    const ergebnis = ebene(quellbild([p]));
    // Mitte (0,5, -0,5) ist die Mitte von Pixel (16, 16).
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 16, 16)], 1.5);
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 13, 16)], 1.5);
    expect(ergebnis.daten[pixelIndex(ergebnis, 21, 16)]).toBe(0);
    expect(ergebnis.daten[pixelIndex(ergebnis, 16, 11)]).toBe(0);
    expect(summe(ergebnis)).toBeCloseTo(fluss(p), 4);
  });

  it("Lage: +x rechts, +y Norden (Zeile 0), Mitte des Quellbilds beruecksichtigt", () => {
    const p = punkt({ xArcsec: 10.5, yArcsec: 12.5, durchmesserArcsec: 1 });
    const ergebnis = ebene(quellbild([p]));
    expect(ergebnis.daten[pixelIndex(ergebnis, 26, 3)]).toBeCloseTo(fluss(p), 6);
    const verschoben = ebene(quellbild([p], { mitteXArcsec: 10, mitteYArcsec: 12 }));
    expect(verschoben.daten[pixelIndex(verschoben, 16, 15)]).toBeCloseTo(fluss(p), 6);
  });

  it("Scheibchen unter einem Pixel: Fluss bleibt, flaechig auf mindestens ein Pixel verteilt", () => {
    // Mitte auf der Ecke von vier Pixeln: jedes bekommt ein Viertel.
    const p = punkt({ xArcsec: 0, yArcsec: 0, durchmesserArcsec: 0.2, helligkeitRelativ: 2 });
    const ergebnis = ebene(quellbild([p]));
    expect(summe(ergebnis)).toBeCloseTo(fluss(p), 7);
    for (const [i, j] of [[15, 15], [16, 15], [15, 16], [16, 16]] as const) {
      expect(ergebnis.daten[pixelIndex(ergebnis, i, j)]).toBeCloseTo(fluss(p) / 4, 7);
    }
  });

  it("Massstab 0,25''/px: Durchmesser in Arbeitspixeln ist d / massstab", () => {
    const p = punkt({ xArcsec: 0.125, yArcsec: -0.125, durchmesserArcsec: 2 });
    const ergebnis = ebene(quellbild([p], { massstabArcsecProPx: 0.25 }));
    expect(summe(ergebnis)).toBeCloseTo(fluss(p, 0.25), 4);
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 16, 16)], 1.5);
  });

  it("Feld wird nicht am Raster abgeschnitten: ausserhalb liegt es ganz draussen, am Rand ragt es hinaus", () => {
    const [aussen] = malePunktquellen(quellbild([punkt({ xArcsec: 40 })]));
    expect(aussen!.spalte).toBeGreaterThanOrEqual(N);
    expect(summe(ebene(quellbild([punkt({ xArcsec: 40 })])))).toBe(0);
    const [rand] = malePunktquellen(quellbild([punkt({ xArcsec: 16 })]));
    expect(rand!.spalte + rand!.breite).toBeGreaterThan(N);
    expect(rand!.daten.reduce((a, b) => a + b, 0)).toBeCloseTo(fluss(punkt()), 4);
    const r = ebene(quellbild([punkt({ xArcsec: 16 })]));
    erwarteInnen(r.daten[pixelIndex(r, 31, 16)], 1.5);
    expect(summe(r)).toBeGreaterThan(0.4 * fluss(punkt()));
    expect(summe(r)).toBeLessThan(0.6 * fluss(punkt()));
  });

  it("wirft BildFehler bei Durchmesser 0, negativer Helligkeit oder Position NaN", () => {
    expect(() => malePunktquellen(quellbild([punkt({ durchmesserArcsec: 0 })]))).toThrow(BildFehler);
    expect(() => malePunktquellen(quellbild([punkt({ helligkeitRelativ: -1 })]))).toThrow(BildFehler);
    expect(() => malePunktquellen(quellbild([punkt({ xArcsec: Number.NaN })]))).toThrow(BildFehler);
  });
});
