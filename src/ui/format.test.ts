import { describe, expect, it } from "vitest";
import { TEXTE } from "../texte";
import { zahl } from "./format";

describe("zahl", () => {
  it("setzt das Dezimalkomma und rundet auf die Stellen", () => {
    expect(zahl(1.7346, 2)).toBe("1,73");
    expect(zahl(60, 0)).toBe("60");
    expect(zahl(0.8333, 2)).toBe("0,83");
    expect(zahl(1.25, 1)).toBe("1,3");
  });

  it("zeigt -0 und kleine negative Werte als 0", () => {
    expect(zahl(-0, 1)).toBe("0,0");
    expect(zahl(-0.001, 2)).toBe("0,00");
    expect(zahl(-1.5, 1)).toBe("-1,5");
  });

  it("zeigt nicht endliche Werte als Fehlwert aus texte.ts", () => {
    expect(zahl(NaN, 2)).toBe(TEXTE.fehlwert);
    expect(zahl(Infinity, 0)).toBe(TEXTE.fehlwert);
  });
});
