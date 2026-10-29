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
