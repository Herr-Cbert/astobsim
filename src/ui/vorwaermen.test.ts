import { describe, expect, it } from "vitest";
import { FalterJs, type Falter, type Raster } from "../bild";
import type { Kern } from "../naht/simulationsparameter";
import { waermeVor, WAHRSCHEINLICHE_KERNGROESSEN } from "./vorwaermen";

/** Protokolliert Kerngroesse und Kanalzahl jedes Auftrags und faltet mit FalterJs. */
class ProtokollFalter implements Falter {
  readonly auftraege: string[] = [];
  private readonly js = new FalterJs();
  falte(raster: Raster, kern: Kern): Raster {
    this.auftraege.push(`${kern.groesse}|${raster.kanaele}`);
    return this.js.falte(raster, kern);
  }
}

describe("waermeVor", () => {
  it("faltet jede wahrscheinliche Kerngroesse je Kanalzahl einmal, ein Auftrag je Slot", () => {
    const falter = new ProtokollFalter();
    const slots: (() => void)[] = [];
    let ende: number | undefined;
    waermeVor(falter, { kanaele: [3, 1], plane: (f) => slots.push(f), aktiv: () => true, uhr: () => 0, fertig: (n) => (ende = n) });
    let schritte = 0;
    while (slots.length > 0) {
      slots.shift()!();
      schritte++;
      expect(falter.auftraege.length).toBeLessThanOrEqual(schritte);
    }
    expect(falter.auftraege).toEqual([...WAHRSCHEINLICHE_KERNGROESSEN.map((n) => `${n}|3`), ...WAHRSCHEINLICHE_KERNGROESSEN.map((n) => `${n}|1`)]);
    expect(ende).toBe(2 * WAHRSCHEINLICHE_KERNGROESSEN.length);
    expect(Math.max(...WAHRSCHEINLICHE_KERNGROESSEN)).toBe(17);
  });

  it("hoert auf, sobald aktiv false liefert", () => {
    const falter = new ProtokollFalter();
    const slots: (() => void)[] = [];
    let aktiv = true;
    waermeVor(falter, { kanaele: [3], plane: (f) => slots.push(f), aktiv: () => aktiv, uhr: () => 0 });
    slots.shift()!();
    slots.shift()!();
    aktiv = false;
    while (slots.length > 0) slots.shift()!();
    expect(falter.auftraege).toHaveLength(2);
  });

  it("ein Fehler des Falters bricht ab, ohne zu werfen", () => {
    const slots: (() => void)[] = [];
    let ende: number | undefined;
    const falter: Falter = {
      falte: () => {
        throw new Error("kaputt");
      }
    };
    const warn = console.warn;
    console.warn = () => {};
    try {
      waermeVor(falter, { kanaele: [1], plane: (f) => slots.push(f), aktiv: () => true, uhr: () => 0, fertig: (n) => (ende = n) });
      while (slots.length > 0) slots.shift()!();
    } finally {
      console.warn = warn;
    }
    expect(ende).toBe(1);
  });
});
