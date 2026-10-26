import { describe, expect, it } from "vitest";
import { DatenFehler } from "./fehler";
import { alsListe, alsObjekt, optional, text, wahl, zahl } from "./pruefe";

const ort = { datei: "test.json", eintrag: "mond" };

function fehlerVon(f: () => unknown): DatenFehler {
  try {
    f();
  } catch (e) {
    if (e instanceof DatenFehler) return e;
    throw e;
  }
  throw new Error("kein DatenFehler geworfen");
}

describe("pruefe", () => {
  it("liefert gueltige Werte unveraendert", () => {
    const obj = alsObjekt({ name: "Mond", d: 1865, art: "flaeche" }, ort, "objekt");
    expect(text(obj, "name", ort)).toBe("Mond");
    expect(zahl(obj, "d", ort, 0, 10000)).toBe(1865);
    expect(wahl(obj, "art", ort, ["flaeche", "punkt"] as const)).toBe("flaeche");
    expect(alsListe([1, 2], ort, "liste")).toEqual([1, 2]);
    expect(optional(obj, "fehlt", (o, f) => zahl(o, f, ort))).toBeUndefined();
    expect(optional(obj, "d", (o, f) => zahl(o, f, ort))).toBe(1865);
  });

  it("nennt Datei, Eintrag und Feld im Fehler", () => {
    const f = fehlerVon(() => zahl({ d: -1 }, "d", ort, 0));
    expect([f.datei, f.eintrag, f.feld]).toEqual(["test.json", "mond", "d"]);
    expect(f.message).toContain("test.json");
    expect(f.message).toContain("mond");
  });

  it("weist falsche Typen und Werte ab", () => {
    expect(() => alsObjekt(null, ort, "x")).toThrow(DatenFehler);
    expect(() => alsObjekt([], ort, "x")).toThrow(DatenFehler);
    expect(() => alsListe({}, ort, "x")).toThrow(DatenFehler);
    expect(() => text({ name: " " }, "name", ort)).toThrow(DatenFehler);
    expect(() => zahl({ d: "3" }, "d", ort)).toThrow(DatenFehler);
    expect(() => zahl({ d: Number.NaN }, "d", ort)).toThrow(DatenFehler);
    expect(() => zahl({ d: 11 }, "d", ort, 0, 10)).toThrow(DatenFehler);
    expect(() => wahl({ art: "linie" }, "art", ort, ["flaeche"] as const)).toThrow(DatenFehler);
  });
});
