import { describe, expect, it } from "vitest";
import type { Kern, Simulationsparameter } from "../naht/simulationsparameter";
import { FalterJs, type Falter } from "./falter";
import { BildFehler } from "./fehler";
import { QuelleAusRaster } from "./quelle";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";
import { rendere, type Zwischenspeicher } from "./rendere";
import { deltaKern, kastenKern } from "./testkerne";

const N = 16;

/** Zaehlt die Faltungen, rechnet mit FalterJs. */
class FalterZaehlend implements Falter {
  aufrufe = 0;
  private readonly innen = new FalterJs();
  falte(raster: Raster, kern: Kern): Raster {
    this.aufrufe++;
    return this.innen.falte(raster, kern);
  }
}

/** Quelle 16x16 bei 1"/px: Wert 1 ueberall, heller Punkt 5 im Nordosten bei x = +5,5, y = +5,5. */
function quelle(): QuelleAusRaster {
  const raster = neuesRaster(N, N, 1, 1);
  raster.daten[pixelIndex(raster, 13, 2)] = 5;
  return new QuelleAusRaster(raster, 1);
}

function parameter(teil: Partial<Simulationsparameter> = {}): Simulationsparameter {
  return {
    quellbild: { schluessel: "q|0|0", objekt: "test", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punktquellen: [] },
    kern: deltaKern(5),
    helligkeit: { schluessel: "h1", faktorObjekt: 1, hintergrundRelativ: 0, hintergrundMagProArcsec2: 20 },
    gesichtsfeld: { form: "kreis", breiteArcsec: 100, hoeheArcsec: 100 },
    fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: N },
    ...teil
  };
}

const falter = new FalterJs();

describe("rendere", () => {
  it("Deltakern, Faktor 1, ohne Maske: Anblick ist die Quelle, Zeile 0 ist Norden, +x rechts", () => {
    const anblick = rendere(parameter(), quelle(), falter);
    expect(anblick.raster.breite).toBe(N);
    expect(anblick.raster.hoehe).toBe(N);
    expect(anblick.massstabArcsecProPx).toBe(1);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 13, 2)]).toBe(5);
    expect(summe(anblick.raster)).toBe(N * N + 4);
  });

  it("Tonwert: Objektfaktor multipliziert, Hintergrundgrau addiert", () => {
    const p = parameter({ helligkeit: { schluessel: "h2", faktorObjekt: 0.5, hintergrundRelativ: 0.1, hintergrundMagProArcsec2: 20 } });
    const anblick = rendere(p, quelle(), falter);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 0, 0)]).toBeCloseTo(0.6, 6);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 13, 2)]).toBeCloseTo(2.6, 6);
  });

  it("Maske Kreis schwaerzt ausserhalb, laesst innen unveraendert", () => {
    const p = parameter({ gesichtsfeld: { form: "kreis", breiteArcsec: 10, hoeheArcsec: 10 } });
    const anblick = rendere(p, quelle(), falter);
    const r = anblick.raster;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = i + 0.5 - N / 2;
        const y = N / 2 - (j + 0.5);
        const innen = x * x + y * y <= 25;
        expect(r.daten[pixelIndex(r, i, j)]).toBe(innen ? (i === 13 && j === 2 ? 5 : 1) : 0);
      }
    }
    expect(r.daten[pixelIndex(r, 0, 0)]).toBe(0);
    expect(r.daten[pixelIndex(r, 8, 8)]).toBe(1);
    expect(r.daten[pixelIndex(r, 13, 2)]).toBe(0); // x = 5,5, y = 5,5: Abstand 7,8 > 5
  });

  it("Maske Rechteck (blosses Auge): ausserhalb der Hoehe schwarz, Breite voll", () => {
    const p = parameter({ gesichtsfeld: { form: "rechteck", breiteArcsec: 100, hoeheArcsec: 8 } });
    const r = rendere(p, quelle(), falter).raster;
    expect(r.daten[pixelIndex(r, 0, 0)]).toBe(0);
    expect(r.daten[pixelIndex(r, 0, 3)]).toBe(0); // y = 4,5
    expect(r.daten[pixelIndex(r, 0, 4)]).toBe(1); // y = 3,5
    expect(r.daten[pixelIndex(r, 15, 11)]).toBe(1); // y = -3,5
    expect(r.daten[pixelIndex(r, 15, 12)]).toBe(0); // y = -4,5
  });

  it("Maske bleibt bei verschobenem Fenster auf Objektkoordinate 0/0 zentriert (Naht)", () => {
    const p = parameter({
      quellbild: { schluessel: "q|4|0", objekt: "test", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 4, mitteYArcsec: 0, punktquellen: [] },
      fenster: { breiteArcsec: N, mitteXArcsec: 4, mitteYArcsec: 0, px: N },
      gesichtsfeld: { form: "kreis", breiteArcsec: 4, hoeheArcsec: 4 }
    });
    const r = rendere(p, quelle(), falter).raster;
    // Objektkoordinate 0/0 liegt bei Spalte 4 (x = 4,5 - 8 + 4 = 0,5).
    expect(r.daten[pixelIndex(r, 4, 8)]).toBe(1);
    expect(r.daten[pixelIndex(r, 8, 8)]).toBe(0);
  });

  it("Kastenkern 3x3 verschmiert den hellen Punkt auf 3x3 Pixel", () => {
    const r = rendere(parameter({ kern: kastenKern(3) }), quelle(), falter).raster;
    expect(r.daten[pixelIndex(r, 13, 2)]).toBeCloseTo(1 + 4 / 9, 5);
    expect(r.daten[pixelIndex(r, 12, 1)]).toBeCloseTo(1 + 4 / 9, 5);
    expect(r.daten[pixelIndex(r, 11, 2)]).toBeCloseTo(1, 5);
    expect(summe(r)).toBeCloseTo(N * N + 4, 3);
  });

  it("Skalierung auf fenster.px: 16 Arbeitspixel werden 32 Anzeigepixel, Massstab halbiert", () => {
    const p = parameter({ fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: 32 } });
    const anblick = rendere(p, quelle(), falter);
    expect(anblick.raster.breite).toBe(32);
    expect(anblick.raster.hoehe).toBe(32);
    expect(anblick.massstabArcsecProPx).toBe(0.5);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 0, 0)]).toBeCloseTo(1, 6);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 27, 5)]).toBeGreaterThan(1);
  });

  it("drei Kanaele laufen durch die Pipeline", () => {
    const raster = neuesRaster(N, N, 3, 0.5);
    const q = new QuelleAusRaster(raster, 1);
    const anblick = rendere(parameter({ kern: kastenKern(3) }), q, falter);
    expect(anblick.raster.kanaele).toBe(3);
    for (const wert of anblick.raster.daten) expect(wert).toBeCloseTo(0.5, 6);
  });

  it("Wiederverwendung nach Stufenschluessel: Quelle und Falter werden nur bei neuem Schluessel gerufen", () => {
    const q = quelle();
    const f = new FalterZaehlend();
    const zwischen: Zwischenspeicher = {};
    const p = parameter();
    rendere(p, q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(p, q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ helligkeit: { ...p.helligkeit, schluessel: "h3", faktorObjekt: 0.3 } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ fenster: { ...p.fenster, px: 32 } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ kern: kastenKern(3) }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 2]);

    rendere(parameter({ quellbild: { ...p.quellbild, schluessel: "q|anders" }, kern: kastenKern(3) }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 3]);

    // Zurueck zum Deltakern: nur das letzte Ergebnis je Stufe wird behalten, also neu falten, Quelle bleibt.
    rendere(parameter({ quellbild: { ...p.quellbild, schluessel: "q|anders" } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 4]);
  });

  it("ohne Zwischenspeicher wird jedes Mal neu gerechnet", () => {
    const q = quelle();
    const f = new FalterZaehlend();
    rendere(parameter(), q, f);
    rendere(parameter(), q, f);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 2]);
  });

  it("wirft BildFehler bei verletzten Invarianten der Naht", () => {
    const p = parameter();
    expect(() => rendere(parameter({ quellbild: { ...p.quellbild, rasterPx: 15 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ kern: deltaKern(5, 2) }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ fenster: { ...p.fenster, mitteXArcsec: 1 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ fenster: { ...p.fenster, px: 0 } }), quelle(), falter)).toThrow(BildFehler);
  });
});
