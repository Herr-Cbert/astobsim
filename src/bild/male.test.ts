import { describe, expect, it } from "vitest";
import type { Punktquelle, Quellbild } from "../naht/simulationsparameter";
import { FalterJs } from "./falter";
import { BildFehler } from "./fehler";
import { malePunktquellen } from "./male";
import { neuesRaster, pixelIndex, summe } from "./raster";
import { deltaKern, kastenKern } from "./testkerne";

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

/** Pixel im Inneren tragen helligkeitRelativ bis auf den Flaechenfehler der 8x8-Unterabtastung (unter 1 %). */
function erwarteInnen(wert: number | undefined, helligkeit: number): void {
  expect(Math.abs((wert ?? 0) / helligkeit - 1)).toBeLessThan(0.01);
}

describe("malePunktquellen", () => {
  it("ohne sichtbare Punktquelle kommt das Raster unveraendert zurueck; geblendete werden nicht gemalt", () => {
    const raster = neuesRaster(N, N, 1, 0.25);
    expect(malePunktquellen(raster, quellbild([]))).toBe(raster);
    expect(malePunktquellen(raster, quellbild([punkt({ sichtbar: false, grund: "blendung" })]))).toBe(raster);
  });

  it("grosses Scheibchen: innen helligkeitRelativ, Fluss h pi (d/2)^2, aussen 0, Eingabe bleibt", () => {
    const raster = neuesRaster(N, N);
    const p = punkt();
    const ergebnis = malePunktquellen(raster, quellbild([p]));
    expect(summe(raster)).toBe(0);
    // Mitte (0,5, -0,5) ist die Mitte von Pixel (16, 16).
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 16, 16)], 1.5);
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 13, 16)], 1.5);
    expect(ergebnis.daten[pixelIndex(ergebnis, 21, 16)]).toBe(0);
    expect(ergebnis.daten[pixelIndex(ergebnis, 16, 11)]).toBe(0);
    expect(summe(ergebnis)).toBeCloseTo(fluss(p), 4);
  });

  it("Lage: +x rechts, +y Norden (Zeile 0), Mitte des Quellbilds beruecksichtigt", () => {
    const p = punkt({ xArcsec: 10.5, yArcsec: 12.5, durchmesserArcsec: 1 });
    const ergebnis = malePunktquellen(neuesRaster(N, N), quellbild([p]));
    expect(ergebnis.daten[pixelIndex(ergebnis, 26, 3)]).toBeCloseTo(fluss(p), 6);
    const verschoben = malePunktquellen(neuesRaster(N, N), quellbild([p], { mitteXArcsec: 10, mitteYArcsec: 12 }));
    expect(verschoben.daten[pixelIndex(verschoben, 16, 15)]).toBeCloseTo(fluss(p), 6);
  });

  it("Scheibchen unter einem Pixel: Fluss bleibt, flaechig auf mindestens ein Pixel verteilt", () => {
    // Mitte auf der Ecke von vier Pixeln: jedes bekommt ein Viertel.
    const p = punkt({ xArcsec: 0, yArcsec: 0, durchmesserArcsec: 0.2, helligkeitRelativ: 2 });
    const ergebnis = malePunktquellen(neuesRaster(N, N), quellbild([p]));
    expect(summe(ergebnis)).toBeCloseTo(fluss(p), 7);
    for (const [i, j] of [[15, 15], [16, 15], [15, 16], [16, 16]] as const) {
      expect(ergebnis.daten[pixelIndex(ergebnis, i, j)]).toBeCloseTo(fluss(p) / 4, 7);
    }
  });

  it("Massstab 0,25''/px: Durchmesser in Arbeitspixeln ist d / massstab", () => {
    const p = punkt({ xArcsec: 0.125, yArcsec: -0.125, durchmesserArcsec: 2 });
    const ergebnis = malePunktquellen(neuesRaster(N, N), quellbild([p], { massstabArcsecProPx: 0.25 }));
    expect(summe(ergebnis)).toBeCloseTo(fluss(p, 0.25), 4);
    erwarteInnen(ergebnis.daten[pixelIndex(ergebnis, 16, 16)], 1.5);
  });

  it("drei Kanaele: in jedem Kanal derselbe Wert, auf das Quellbild addiert", () => {
    const p = punkt({ durchmesserArcsec: 1 });
    const ergebnis = malePunktquellen(neuesRaster(N, N, 3, 0.5), quellbild([p]));
    const i = pixelIndex(ergebnis, 16, 16);
    expect(Array.from(ergebnis.daten.subarray(i, i + 3)).map((w) => w - 0.5)).toEqual(Array(3).fill(Math.fround(0.5 + fluss(p)) - 0.5));
  });

  it("ausserhalb des Fensters nicht gemalt, am Rand nur der innere Teil mit voller Helligkeit", () => {
    const aussen = malePunktquellen(neuesRaster(N, N), quellbild([punkt({ xArcsec: 40 })]));
    expect(summe(aussen)).toBe(0);
    const rand = malePunktquellen(neuesRaster(N, N), quellbild([punkt({ xArcsec: 16 })]));
    erwarteInnen(rand.daten[pixelIndex(rand, 31, 16)], 1.5);
    expect(summe(rand)).toBeGreaterThan(0.4 * fluss(punkt()));
    expect(summe(rand)).toBeLessThan(0.6 * fluss(punkt()));
  });

  it("Gesamtfluss bleibt bei Faltung mit Deltakern erhalten, mit Kastenkern im Inneren ebenso", () => {
    const p = punkt({ durchmesserArcsec: 1.2, xArcsec: 3.3, yArcsec: -2.1 });
    const gemalt = malePunktquellen(neuesRaster(N, N), quellbild([p]));
    const falter = new FalterJs();
    expect(summe(falter.falte(gemalt, deltaKern(5)))).toBeCloseTo(fluss(p), 6);
    expect(summe(falter.falte(gemalt, kastenKern(5)))).toBeCloseTo(fluss(p), 6);
  });

  it("wirft BildFehler bei Durchmesser 0, negativer Helligkeit oder Position NaN", () => {
    const raster = neuesRaster(N, N);
    expect(() => malePunktquellen(raster, quellbild([punkt({ durchmesserArcsec: 0 })]))).toThrow(BildFehler);
    expect(() => malePunktquellen(raster, quellbild([punkt({ helligkeitRelativ: -1 })]))).toThrow(BildFehler);
    expect(() => malePunktquellen(raster, quellbild([punkt({ xArcsec: Number.NaN })]))).toThrow(BildFehler);
  });
});
