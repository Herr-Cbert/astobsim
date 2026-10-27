import { describe, expect, it } from "vitest";
import { TEXTE } from "../texte";
import { hinweisFuer, hinweistext, leseDezimal } from "./feld";

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

describe("hinweistext", () => {
  const text = TEXTE.feld.geschnitten;

  it("nennt die Eingabe mit ihren Stellen und den verwendeten Wert mit den Feldstellen", () => {
    expect(hinweistext({ feld: "geraet.okular.vergroesserung", eingabe: 300.4, wert: 300 }, 0)).toBe(text("300,4", "300"));
    expect(hinweistext({ feld: "bedingungen.seeingFwhmArcsec", eingabe: 0.44, wert: 0.5 }, 1)).toBe(text("0,44", "0,5"));
    expect(hinweistext({ feld: "bedingungen.bortle", eingabe: 9.6, wert: 9 }, 0)).toBe(text("9,6", "9"));
    expect(hinweistext({ feld: "geraet.oeffnungMm", eingabe: 1000, wert: 300 }, 0)).toBe(text("1000", "300"));
  });

  it("zeigt hoechstens 3 Nachkommastellen und keine Gleitkommareste", () => {
    expect(hinweistext({ feld: "bedingungen.seeingFwhmArcsec", eingabe: 0.12345, wert: 0.5 }, 1)).toBe(text("0,123", "0,5"));
    // Obstruktion in Prozent: 0,7 * 100 ist 70,00000000000001.
    expect(hinweistext({ feld: "geraet.obstruktion", eingabe: 0.7 * 100, wert: 50 }, 1)).toBe(text("70", "50,0"));
    expect(hinweistext({ feld: "bedingungen.hoeheGrad", eingabe: -5, wert: 10 }, 0)).toBe(text("-5", "10"));
  });
});
