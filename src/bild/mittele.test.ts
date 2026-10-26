import { describe, expect, it } from "vitest";
import type { Quellbild } from "../naht/simulationsparameter";
import { mittele, mittleFlaechig, skaliere } from "./mittele";
import { QuelleAusRaster } from "./quelle";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";

function quellbild(teil: Partial<Quellbild> = {}): Quellbild {
  return { schluessel: "test", objekt: "test", massstabArcsecProPx: 1, rasterPx: 4, mitteXArcsec: 0, mitteYArcsec: 0, punktquellen: [], ...teil };
}

/** Raster mit Wert zeile * 10 + spalte. */
function zaehlRaster(breite: number, hoehe: number): Raster {
  const raster = neuesRaster(breite, hoehe);
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) raster.daten[pixelIndex(raster, x, y)] = y * 10 + x;
  return raster;
}

describe("mittleFlaechig", () => {
  it("mittelt 4x4 mit Schritt 2 auf 2x2 Bloecke", () => {
    const ergebnis = mittleFlaechig(zaehlRaster(4, 4), 2, 2, 0, 2, 0, 2);
    expect(Array.from(ergebnis.daten)).toEqual([5.5, 7.5, 25.5, 27.5]);
  });

  it("mittelt mit halben Pixeln und Versatz", () => {
    const ergebnis = mittleFlaechig(zaehlRaster(4, 1), 2, 1, 0.5, 1.5, 0, 1);
    // Ziel 0 deckt [0,5, 2): 0,5 * 0 + 1 * 1 = 1 / 1,5; Ziel 1 deckt [2, 3,5): 2 + 0,5 * 3 = 3,5 / 1,5.
    expect(ergebnis.daten[0]).toBeCloseTo(1 / 1.5, 6);
    expect(ergebnis.daten[1]).toBeCloseTo(3.5 / 1.5, 6);
  });

  it("ausserhalb der Quelle ist Schwarz", () => {
    const ergebnis = mittleFlaechig(neuesRaster(2, 2, 1, 1), 4, 4, -1, 1, -1, 1);
    expect(summe(ergebnis)).toBe(4);
    expect(ergebnis.daten[pixelIndex(ergebnis, 0, 0)]).toBe(0);
    expect(ergebnis.daten[pixelIndex(ergebnis, 1, 1)]).toBe(1);
    expect(ergebnis.daten[pixelIndex(ergebnis, 2, 2)]).toBe(1);
    expect(ergebnis.daten[pixelIndex(ergebnis, 3, 3)]).toBe(0);
  });

  it("behandelt drei Kanaele getrennt", () => {
    const raster = neuesRaster(2, 1, 3);
    raster.daten.set([1, 2, 3, 3, 4, 5]);
    const ergebnis = mittleFlaechig(raster, 1, 1, 0, 2, 0, 1);
    expect(Array.from(ergebnis.daten)).toEqual([2, 3, 4]);
  });
});

describe("mittele (Stufe 1) und Koordinaten", () => {
  it("gleicher Massstab und gleiche Lage: Kopie des Ausschnitts", () => {
    const quelle = new QuelleAusRaster(zaehlRaster(4, 4), 1);
    const ergebnis = mittele(quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 4, 1), quellbild());
    expect(Array.from(ergebnis.daten)).toEqual(Array.from(zaehlRaster(4, 4).daten));
  });

  it("heller Punkt im Nordosten der Quelle landet oben rechts (Zeile 0 ist Norden, +x rechts)", () => {
    const raster = neuesRaster(4, 4);
    raster.daten[pixelIndex(raster, 3, 0)] = 1; // Objektkoordinaten x = +1,5, y = +1,5
    const quelle = new QuelleAusRaster(raster, 1);
    const fein = mittele(quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 4, 1), quellbild());
    expect(fein.daten[pixelIndex(fein, 3, 0)]).toBe(1);
    expect(summe(fein)).toBe(1);
    const grob = mittele(quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 4, 2), quellbild({ massstabArcsecProPx: 2, rasterPx: 2 }));
    expect(grob.daten[pixelIndex(grob, 1, 0)]).toBeCloseTo(0.25, 6);
    expect(summe(grob)).toBeCloseTo(0.25, 6);
  });

  it("verschobene Mitte: Arbeitsraster mit Mitte (+1, +1) zeigt den Nordost-Quadranten der Quelle", () => {
    const quelle = new QuelleAusRaster(zaehlRaster(4, 4), 1);
    const q = quellbild({ rasterPx: 2, mitteXArcsec: 1, mitteYArcsec: 1 });
    const ergebnis = mittele(quelle.ausschnitt({ xArcsec: 1, yArcsec: 1 }, 2, 1), q);
    expect(Array.from(ergebnis.daten)).toEqual([2, 3, 12, 13]);
  });

  it("Arbeitsraster groesser als die Quelle: Rand schwarz, Mitte erhalten", () => {
    const quelle = new QuelleAusRaster(neuesRaster(2, 2, 1, 1), 1);
    const ergebnis = mittele(quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 6, 1), quellbild({ rasterPx: 6 }));
    expect(summe(ergebnis)).toBe(4);
    expect(ergebnis.daten[pixelIndex(ergebnis, 2, 2)]).toBe(1);
    expect(ergebnis.daten[pixelIndex(ergebnis, 0, 0)]).toBe(0);
  });

  it("Quelle feiner als Arbeitsmassstab, nicht ganzzahliges Verhaeltnis: Summe bleibt erhalten", () => {
    const raster = neuesRaster(9, 9, 1, 0.5);
    const quelle = new QuelleAusRaster(raster, 0.6);
    const ergebnis = mittele(quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 5.4, 0.9), quellbild({ massstabArcsecProPx: 0.9, rasterPx: 6 }));
    // 9 * 0,6 = 5,4 Bogensekunden = 6 * 0,9: gleiche Flaeche, gleiche Lichtmenge je Flaeche.
    expect(summe(ergebnis) / 36).toBeCloseTo(0.5, 6);
    for (const wert of ergebnis.daten) expect(wert).toBeCloseTo(0.5, 5);
  });
});

describe("QuelleAusRaster", () => {
  it("schneidet den angefragten Bereich mit einem Pixel Rand aus und zaehlt Aufrufe", () => {
    const quelle = new QuelleAusRaster(zaehlRaster(8, 8), 1);
    const a = quelle.ausschnitt({ xArcsec: 0, yArcsec: 0 }, 2, 1);
    expect(quelle.aufrufe).toBe(1);
    expect(a.raster.breite).toBe(4);
    expect(a.raster.hoehe).toBe(4);
    expect(a.linksXArcsec).toBe(-2);
    expect(a.obenYArcsec).toBe(2);
    expect(a.raster.daten[0]).toBe(22);
  });

  it("Bereich ausserhalb des Bilds liefert ein schwarzes Pixel", () => {
    const quelle = new QuelleAusRaster(zaehlRaster(4, 4), 1);
    const a = quelle.ausschnitt({ xArcsec: 100, yArcsec: 0 }, 2, 1);
    expect(a.raster.breite).toBe(1);
    expect(a.raster.daten[0]).toBe(0);
  });
});

describe("skaliere (Stufe 4)", () => {
  it("gleiche Groesse: gibt das Raster zurueck", () => {
    const raster = neuesRaster(3, 3);
    expect(skaliere(raster, 3)).toBe(raster);
  });

  it("vergroessert bilinear, Rampe 0..1 wird 0, 0,25, 0,75, 1", () => {
    const raster = neuesRaster(2, 2);
    raster.daten.set([0, 1, 0, 1]);
    const ergebnis = skaliere(raster, 4);
    expect(Array.from(ergebnis.daten.subarray(0, 4)).map((v) => Math.round(v * 100) / 100)).toEqual([0, 0.25, 0.75, 1]);
    expect(Array.from(ergebnis.daten.subarray(12, 16)).map((v) => Math.round(v * 100) / 100)).toEqual([0, 0.25, 0.75, 1]);
  });

  it("konstantes Raster bleibt beim Vergroessern und Verkleinern konstant", () => {
    const raster = neuesRaster(5, 5, 3, 0.3);
    for (const wert of skaliere(raster, 12).daten) expect(wert).toBeCloseTo(0.3, 6);
    for (const wert of skaliere(raster, 2).daten) expect(wert).toBeCloseTo(0.3, 6);
  });

  it("verkleinert flaechig gemittelt", () => {
    const ergebnis = skaliere(zaehlRaster(4, 4), 2);
    expect(Array.from(ergebnis.daten)).toEqual([5.5, 7.5, 25.5, 27.5]);
  });
});
