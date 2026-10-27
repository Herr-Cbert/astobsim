import { describe, expect, it } from "vitest";
import { BEDINGUNGEN_A_D9 } from "../physik/testdaten";
import type { Konfiguration } from "../physik";
import { TEXTE } from "../texte";
import { aufRaster, bortleanzeige, istTransparenz, luftmasseanzeige, mitBedingungen, rundeAuf, rundeImBereich, seeinganzeige } from "./formular_bedingungen";

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
    const T = TEXTE.bedingungen;
    expect(bortleanzeige(1)).toBe(T.bortleStufe(T.bortleStufen[0], "21,9"));
    expect(bortleanzeige(5)).toBe(T.bortleStufe(T.bortleStufen[4], "20,0"));
    expect(bortleanzeige(9)).toBe(T.bortleStufe(T.bortleStufen[8], "17,0"));
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

describe("rundeImBereich", () => {
  it("rundet nur, wenn der gerundete Wert in den Grenzen liegt", () => {
    const g = { min: 0.5, max: 5 };
    expect(rundeImBereich(1.25, 1, g)).toBe(1.3);
    expect(rundeImBereich(0.44, 1, g)).toBe(0.44);
    expect(rundeImBereich(5.04, 1, g)).toBe(5);
    expect(rundeImBereich(9.6, 0, { min: 1, max: 9 })).toBe(9.6);
    expect(rundeImBereich(9.4, 0, { min: 1, max: 9 })).toBe(9);
  });
});

describe("aufRaster", () => {
  it("bringt Zwischenwerte aus einem Link aufs Raster der Felder", () => {
    const b = { ...BEDINGUNGEN_A_D9, seeingFwhmArcsec: 1.25, hoeheGrad: 45.5 };
    expect(aufRaster(b)).toEqual({ ...BEDINGUNGEN_A_D9, seeingFwhmArcsec: 1.3, hoeheGrad: 46 });
    expect(aufRaster(BEDINGUNGEN_A_D9)).toEqual(BEDINGUNGEN_A_D9);
  });
});
