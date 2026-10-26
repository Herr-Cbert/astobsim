import { describe, expect, it } from "vitest";
import { atmosphaere, extinktionFaktor, extinktionMag, friedParameterCm, luftmasse, seeingAmObjektArcsec, seeingstufe } from "./atmosphaere";
import { PhysikFehler } from "./fehler";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8.
describe("Luftmasse nach Kasten-Young", () => {
  it("bei 45 Grad ist 1,4126", () => {
    expect(luftmasse(45)).toBeCloseTo(1.4126, 4);
  });
  it("bei 30 Grad ist 1,9943", () => {
    expect(luftmasse(30)).toBeCloseTo(1.9943, 4);
  });
  it("bei 90 Grad ist 0,9997, nicht genau 1", () => {
    expect(luftmasse(90)).toBeCloseTo(0.9997, 4);
    expect(luftmasse(90)).toBeCloseTo(1.0, 2);
  });
});

describe("Seeing", () => {
  it("Seeing-Faktor bei 30 Grad Hoehe ist 1,513", () => {
    expect(seeingAmObjektArcsec(1, 1.9943)).toBeCloseTo(1.513, 3);
  });
  it("2 Bogensekunden Seeing entsprechen r0 5,56 cm", () => {
    expect(friedParameterCm(2)).toBeCloseTo(5.56, 2);
  });
  it("r0 10 cm entspricht FWHM 1,112 Bogensekunden", () => {
    expect(friedParameterCm(1.112)).toBeCloseTo(10.0, 2);
  });
});

describe("Extinktion", () => {
  it("bei 30 Grad ist 0,3989 / 0,5983 / 0,8974 mag fuer klar / leicht diesig / diesig", () => {
    const x = luftmasse(30);
    expect(extinktionMag("klar", x)).toBeCloseTo(0.3989, 4);
    expect(extinktionMag("leicht-diesig", x)).toBeCloseTo(0.5983, 4);
    expect(extinktionMag("diesig", x)).toBeCloseTo(0.8974, 4);
  });
  it("0,499 mag (k 0,25 bei 30 Grad) sind Faktor 0,632", () => {
    expect(0.25 * luftmasse(30)).toBeCloseTo(0.499, 3);
    expect(extinktionFaktor(0.499)).toBeCloseTo(0.632, 3);
  });
});

describe("atmosphaere", () => {
  it("30 Grad, klar, Seeing 2'': Luftmasse 1,9943, Seeing 3,026'', Extinktion 0,3989 mag, Transmission 0,6925", () => {
    const a = atmosphaere({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 30 });
    expect(a.luftmasse).toBeCloseTo(1.9943, 4);
    expect(a.seeingFwhmArcsec).toBeCloseTo(2 * 1.513, 3);
    expect(a.extinktionMag).toBeCloseTo(0.3989, 4);
    expect(a.transmission).toBeCloseTo(Math.pow(10, -0.4 * 0.3989), 4);
  });
  it("Bortle aendert nichts an der Atmosphaere", () => {
    const a5 = atmosphaere({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "diesig", hoeheGrad: 45 });
    const a9 = atmosphaere({ seeingFwhmArcsec: 2, bortle: 9, transparenz: "diesig", hoeheGrad: 45 });
    expect(a9).toEqual(a5);
  });
  it("wirft PhysikFehler bei Hoehe 95 Grad, Hoehe NaN und Seeing 0", () => {
    expect(() => atmosphaere({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 95 })).toThrow(PhysikFehler);
    expect(() => atmosphaere({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: NaN })).toThrow(PhysikFehler);
    expect(() => atmosphaere({ seeingFwhmArcsec: 0, bortle: 5, transparenz: "klar", hoeheGrad: 45 })).toThrow(PhysikFehler);
  });
});

describe("Seeing-Stufen nach Abschnitt 2.5", () => {
  it.each([
    [0.9, "ausgezeichnet", 8, 10],
    [1.0, "gut", 6, 7],
    [2.0, "mittel", 4, 5],
    [3.0, "schlecht", 1, 3],
    [5.0, "schlecht", 1, 3]
  ] as const)("%s Bogensekunden sind %s, Pickering %i bis %i", (fwhm, wortstufe, von, bis) => {
    expect(seeingstufe(fwhm)).toEqual({ wortstufe, pickeringVon: von, pickeringBis: bis });
  });
});
