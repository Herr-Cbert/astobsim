import { describe, expect, it } from "vitest";
import { angezeigterWert, hinweisFuer, leseDezimal } from "./feld";

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

describe("angezeigterWert", () => {
  it("zeigt den verwendeten Wert, wenn das Feld ihn kennt", () => {
    expect(angezeigterWert(47, undefined, 45)).toBe(45);
    expect(angezeigterWert(95, { feld: "bedingungen.hoeheGrad", eingabe: 95, wert: 90 }, 90)).toBe(90);
  });

  it("zeigt sonst den Wert aus dem Hinweis oder die Eingabe", () => {
    expect(angezeigterWert(95, { feld: "bedingungen.hoeheGrad", eingabe: 95, wert: 90 })).toBe(90);
    expect(angezeigterWert(16.216, undefined)).toBe(16.216);
  });
});
