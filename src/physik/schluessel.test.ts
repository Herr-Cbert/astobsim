import { describe, expect, it } from "vitest";
import { rundeSignifikant, schluessel } from "./schluessel";

describe("Rundung auf 4 signifikante Stellen", () => {
  it("80,00001 wird 80, 1,42857 wird 1,429, 0,017778 wird 0,01778", () => {
    expect(rundeSignifikant(80.00001)).toBe(80);
    expect(rundeSignifikant(1.42857)).toBe(1.429);
    expect(rundeSignifikant(0.017778)).toBe(0.01778);
  });
  it("laesst 0, NaN und Unendlich unveraendert", () => {
    expect(rundeSignifikant(0)).toBe(0);
    expect(rundeSignifikant(NaN)).toBeNaN();
    expect(rundeSignifikant(Infinity)).toBe(Infinity);
  });
});

describe("Schluessel", () => {
  it("ist gleich genau dann, wenn die gerundeten Felder gleich sind", () => {
    expect(schluessel("kern", 80, 0, 2, 1.0714, 0.5)).toBe(schluessel("kern", 80.00001, 0, 2.00001, 1.07143, 0.5));
    expect(schluessel("kern", 80, 0, 2, 1.0714, 0.5)).not.toBe(schluessel("kern", 80.01, 0, 2, 1.0714, 0.5));
    expect(schluessel("kern", 80, 0, 2, 1.0714, 0.5)).not.toBe(schluessel("kern", 80, 0.01, 2, 1.0714, 0.5));
  });
  it("traegt Praefix und Textfelder unveraendert", () => {
    expect(schluessel("quellbild", "mond-q1", 1.2, 853)).toBe("quellbild|mond-q1|1.2|853");
  });
});
