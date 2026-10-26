import { describe, expect, it } from "vitest";
import { FalterJs } from "./falter";
import { BildFehler } from "./fehler";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";
import { deltaKern, kastenKern, kernAusDaten, verschobenerDeltaKern } from "./testkerne";

function zufallsRaster(breite: number, hoehe: number, kanaele: 1 | 3 = 1, saat = 12345): Raster {
  const raster = neuesRaster(breite, hoehe, kanaele);
  let z = saat;
  for (let i = 0; i < raster.daten.length; i++) {
    z = (z * 1103515245 + 12345) % 2147483648;
    raster.daten[i] = z / 2147483648;
  }
  return raster;
}

/** Kante: links 0, ab Spalte kante 1. */
function kantenRaster(breite: number, hoehe: number, kante: number): Raster {
  const raster = neuesRaster(breite, hoehe);
  for (let y = 0; y < hoehe; y++) for (let x = kante; x < breite; x++) raster.daten[pixelIndex(raster, x, y)] = 1;
  return raster;
}

const falter = new FalterJs();

describe("FalterJs", () => {
  it("Deltakern laesst ein Raster unveraendert, ein und drei Kanaele", () => {
    for (const kanaele of [1, 3] as const) {
      const raster = zufallsRaster(13, 9, kanaele);
      const ergebnis = falter.falte(raster, deltaKern(5));
      expect(ergebnis).not.toBe(raster);
      expect(ergebnis.breite).toBe(13);
      expect(ergebnis.hoehe).toBe(9);
      expect(ergebnis.kanaele).toBe(kanaele);
      expect(Array.from(ergebnis.daten)).toEqual(Array.from(raster.daten));
    }
  });

  it("Kastenkern 3x3 glaettet eine Kante zu 1/3 und 2/3", () => {
    const ergebnis = falter.falte(kantenRaster(8, 4, 4), kastenKern(3));
    for (let y = 0; y < 4; y++) {
      const zeile = Array.from(ergebnis.daten.subarray(y * 8, y * 8 + 8));
      expect(zeile[0]).toBeCloseTo(0, 6);
      expect(zeile[2]).toBeCloseTo(0, 6);
      expect(zeile[3]).toBeCloseTo(1 / 3, 6);
      expect(zeile[4]).toBeCloseTo(2 / 3, 6);
      expect(zeile[5]).toBeCloseTo(1, 6);
      expect(zeile[7]).toBeCloseTo(1, 6);
    }
  });

  it("Rand geklemmt: konstantes Raster bleibt konstant, Summe unveraendert", () => {
    const raster = neuesRaster(10, 7, 1, 0.7);
    const ergebnis = falter.falte(raster, kastenKern(7));
    for (const wert of ergebnis.daten) expect(wert).toBeCloseTo(0.7, 6);
    expect(summe(ergebnis)).toBeCloseTo(summe(raster), 4);
  });

  it("Rand geklemmt: Kante am Rand wird vom Kasten nicht abgedunkelt", () => {
    const ergebnis = falter.falte(kantenRaster(6, 3, 3), kastenKern(5));
    expect(ergebnis.daten[pixelIndex(ergebnis, 5, 1)]).toBeCloseTo(1, 6);
    expect(ergebnis.daten[pixelIndex(ergebnis, 0, 1)]).toBeCloseTo(0, 6);
  });

  it("ist eine Faltung: Delta rechts der Mitte rueckt das Bild nach rechts, Delta noerdlich rueckt es nach Norden", () => {
    const raster = neuesRaster(5, 5);
    raster.daten[pixelIndex(raster, 2, 2)] = 1;
    const rechts = falter.falte(raster, verschobenerDeltaKern(1, 0));
    expect(rechts.daten[pixelIndex(rechts, 3, 2)]).toBe(1);
    expect(summe(rechts)).toBe(1);
    const norden = falter.falte(raster, verschobenerDeltaKern(0, -1));
    expect(norden.daten[pixelIndex(norden, 2, 1)]).toBe(1);
    expect(summe(norden)).toBe(1);
  });

  it("Kastenkern 5x5 verteilt ein helles Pixel in der Mitte gleichmaessig auf 5x5 Pixel, Summe bleibt 1", () => {
    const raster = neuesRaster(9, 9);
    raster.daten[pixelIndex(raster, 4, 4)] = 1;
    const ergebnis = falter.falte(raster, kastenKern(5));
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const innen = Math.abs(x - 4) <= 2 && Math.abs(y - 4) <= 2;
        expect(ergebnis.daten[pixelIndex(ergebnis, x, y)]).toBeCloseTo(innen ? 1 / 25 : 0, 6);
      }
    }
    expect(summe(ergebnis)).toBeCloseTo(1, 5);
  });

  it("wirft BildFehler bei geradem Kern oder falscher Datenlaenge", () => {
    const raster = neuesRaster(4, 4);
    expect(() => falter.falte(raster, kernAusDaten(4, new Float32Array(16), "gerade"))).toThrow(BildFehler);
    expect(() => falter.falte(raster, kernAusDaten(3, new Float32Array(8), "kurz"))).toThrow(BildFehler);
    expect(() => falter.falte({ ...raster, daten: new Float32Array(3) }, deltaKern(3))).toThrow(BildFehler);
  });

  it("Laufzeit 1024 px mit Kern 25 px (Ziel unter 0,6 s, ADR-0002; nur protokolliert)", () => {
    const raster = zufallsRaster(1024, 1024);
    const kern = kastenKern(25);
    const start = performance.now();
    const ergebnis = falter.falte(raster, kern);
    const sekunden = (performance.now() - start) / 1000;
    console.log(`FalterJs 1024x1024 mit Kern 25x25: ${sekunden.toFixed(3)} s`);
    expect(ergebnis.daten.length).toBe(1024 * 1024);
  });
});
