import { describe, expect, it } from "vitest";
import { BEDINGUNGEN_A_D9 } from "../physik/testdaten";
import type { Konfiguration } from "../physik";
import { bortleanzeige, istTransparenz, luftmasseanzeige, mitBedingungen, rundeAuf, seeinganzeige } from "./formular_bedingungen";

describe("seeinganzeige", () => {
  it("nennt Wortstufe und Pickering nach physik.md 2.5", () => {
    expect(seeinganzeige(0.5)).toBe("ausgezeichnet, Pickering 8 bis 10");
    expect(seeinganzeige(1)).toBe("gut, Pickering 6 bis 7");
    expect(seeinganzeige(2)).toBe("mittel, Pickering 4 bis 5");
    expect(seeinganzeige(2.9)).toBe("mittel, Pickering 4 bis 5");
    expect(seeinganzeige(5)).toBe("schlecht, Pickering 1 bis 3");
  });
});

describe("bortleanzeige", () => {
  it("nennt Kurzbeschreibung und Himmelshelligkeit je Stufe", () => {
    expect(bortleanzeige(1)).toBe("ausgezeichneter Dunkelhimmel, 21,9 mag/″²");
    expect(bortleanzeige(5)).toBe("vorstädtisch, 20,0 mag/″²");
    expect(bortleanzeige(9)).toBe("Innenstadt, 17,0 mag/″²");
  });

  it("hat fuer jede Stufe 1 bis 9 einen Text und sonst keinen", () => {
    for (let b = 1; b <= 9; b++) expect(bortleanzeige(b)).not.toBe("");
    for (const b of [0, 10, 4.5, Number.NaN]) expect(bortleanzeige(b)).toBe("");
  });
});

describe("luftmasseanzeige", () => {
  it("zeigt die Luftmasse nach Kasten-Young (physik.md 5.3)", () => {
    expect(luftmasseanzeige(90)).toBe("Luftmasse 1,00");
    expect(luftmasseanzeige(45)).toBe("Luftmasse 1,41");
    expect(luftmasseanzeige(30)).toBe("Luftmasse 1,99");
    expect(luftmasseanzeige(10)).toBe("Luftmasse 5,59");
  });
});

describe("rundeAuf", () => {
  it("rundet ohne Gleitkommareste", () => {
    expect(rundeAuf(2.3000000000000003, 1)).toBe(2.3);
    expect(rundeAuf(0.55, 1)).toBe(0.6);
    expect(rundeAuf(4.6, 0)).toBe(5);
    expect(rundeAuf(12, 0)).toBe(12);
  });
});

describe("mitBedingungen", () => {
  it("aendert nur den genannten Teil", () => {
    const k = { bedingungen: BEDINGUNGEN_A_D9 } as Konfiguration;
    const neu = mitBedingungen(k, { bortle: 3 });
    expect(neu.bedingungen).toEqual({ ...BEDINGUNGEN_A_D9, bortle: 3 });
    expect(k.bedingungen.bortle).toBe(5);
  });
});

describe("istTransparenz", () => {
  it("kennt genau die drei Stufen", () => {
    for (const t of ["klar", "leicht-diesig", "diesig"]) expect(istTransparenz(t)).toBe(true);
    expect(istTransparenz("neblig")).toBe(false);
  });
});
