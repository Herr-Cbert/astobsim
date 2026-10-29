import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import { pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { pruefeObjekte } from "./objekte";
import { findeZustand, nachweisZu, objektzustand } from "./objektzustand";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);

describe("objektzustand", () => {
  it("baut mond_ev aus den echten Dateien", () => {
    const z = objektzustand(objekte, nachweise, "mond_ev")!;
    expect(z.kennung).toBe("mond_ev");
    expect(z.durchmesserArcsec).toBe(1865);
    expect(z.magnitude).toBe(-10.2);
    expect(z.quelle!.breitePx).toBe(3072);
    expect(z.quelle!.hoehePx).toBe(3072);
    // 1865'' / 2758 px, Faktor 1,051 gegen den Nachweis (0,643''/px)
    expect(z.quelle!.massstabArcsecProPx).toBeCloseTo(0.67621, 5);
    expect(z.quelle!.weissMagProArcsec2).toBe(3.91);
    expect(z.trabanten).toEqual([]);
    // Sonnensystem: Klasse aus typ mond, keine Sterne, keine Isophoten.
    expect(z.klasse).toBe("sonnensystem");
    expect(z.sterne).toEqual([]);
    expect(z.isophoten).toBeUndefined();
  });

  it("baut die Mondphasen aus Issue #36 (Bild, Massstab, Quellweiss, Magnitude)", () => {
    // [Zustand, Bildnachweis, Scheibe px, Quellweiss, Magnitude]; Quellweiss geeicht mit
    // tools/quellweiss_eichen.py, die Probe am Bild prueft tools/test_mond_kacheln.py.
    const faelle: [string, string, number, number, number][] = [
      ["mond_sichel", "mond_svs5587_6173", 2817, 3.99, -8.15],
      ["mond_voll", "mond_svs5587_6449", 2930, 2.29, -12.66],
      ["mond_lv", "mond_svs5587_6615", 3004, 3.48, -10.12]
    ];
    const ids = objekte.find((o) => o.id === "mond")!.zustaende.map((z) => z.id);
    expect(ids).toEqual(["mond_ev", "mond_sichel", "mond_voll", "mond_lv"]);
    for (const [id, bild, scheibePx, weiss, magnitude] of faelle) {
      const z = objektzustand(objekte, nachweise, id)!;
      expect(nachweisZu(objekte, nachweise, id)?.id).toBe(bild);
      expect(z.durchmesserArcsec).toBe(1865);
      expect(z.quelle!.breitePx).toBe(3072);
      expect(z.quelle!.massstabArcsecProPx).toBeCloseTo(1865 / scheibePx, 9);
      expect(z.quelle!.weissMagProArcsec2).toBe(weiss);
      expect(z.magnitude).toBe(magnitude);
      expect(z.klasse).toBe("sonnensystem");
      // Magnitude nach Krisciunas und Schaefer 1991, Gl. 9 (physik.md 23) beim Phasenwinkel des
      // Zustands, auf 0,01 mag; Phase und Phasenwinkel passen ueber k = (1 + cos i) / 2 zusammen.
      const eintrag = findeZustand(objekte, id)!.zustand;
      const a = eintrag.phasenwinkelGrad!;
      expect(Math.abs(-12.73 + 0.026 * a + 4e-9 * a ** 4 - magnitude)).toBeLessThanOrEqual(0.01);
      expect(Math.abs((1 + Math.cos((a * Math.PI) / 180)) / 2 - eintrag.phase!)).toBeLessThanOrEqual(0.002);
    }
  });

  it("ist strukturiert klonbar", () => {
    const z = objektzustand(objekte, nachweise, "mond_ev")!;
    expect(structuredClone(z)).toEqual(z);
  });

  it("liefert undefined fuer einen unbekannten Zustand", () => {
    expect(objektzustand(objekte, nachweise, "pluto_1")).toBeUndefined();
    expect(findeZustand(objekte, "pluto_1")).toBeUndefined();
    expect(findeZustand(objekte, "mond_ev")?.objekt.id).toBe("mond");
  });

  it("wirft DatenFehler, wenn der Bildnachweis fehlt", () => {
    expect(() => objektzustand(objekte, [], "mond_ev")).toThrow(DatenFehler);
  });
});

describe("nachweisZu", () => {
  it("liefert den Bildnachweis des Zustands, undefined bei unbekannter id", () => {
    for (const o of objekte) for (const z of o.zustaende) expect(nachweisZu(objekte, nachweise, z.id)?.id).toBe(z.bild);
    expect(nachweisZu(objekte, nachweise, "gibt-es-nicht")).toBeUndefined();
  });
});
