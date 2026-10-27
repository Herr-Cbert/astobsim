import { describe, expect, it } from "vitest";
import { hinweisFuer, leseDezimal } from "./feld";

describe("leseDezimal", () => {
  it("liest Komma und Punkt", () => {
    expect(leseDezimal("2,5")).toBe(2.5);
    expect(leseDezimal("2.5")).toBe(2.5);
    expect(leseDezimal(" 10 ")).toBe(10);
    expect(leseDezimal(",5")).toBe(0.5);
    expect(leseDezimal("-3")).toBe(-3);
    expect(leseDezimal("7,")).toBe(7);
  });

  it("liefert NaN fuer Unlesbares", () => {
    for (const t of ["", "abc", "1,2,3", "1e3", "2 mm", "Infinity", "--1"]) expect(leseDezimal(t)).toBeNaN();
  });
});

describe("hinweisFuer", () => {
  it("findet den Hinweis zum Feld", () => {
    const hinweise = [
      { feld: "bedingungen.bortle", eingabe: 12, wert: 9 },
      { feld: "bedingungen.hoeheGrad", eingabe: 5, wert: 10 }
    ];
    expect(hinweisFuer(hinweise, "bedingungen.hoeheGrad")?.wert).toBe(10);
    expect(hinweisFuer(hinweise, "bedingungen.seeingFwhmArcsec")).toBeUndefined();
  });
});
