import { describe, expect, it } from "vitest";
import { atmosphaere } from "./atmosphaere";
import { begrenze, GRENZEN } from "./begrenze";
import type { Fernglas, Fernrohr, Konfiguration } from "./konfiguration";
import { optik } from "./optik";
import { KONFIGURATION_A_D9 as START } from "./testdaten";

function mitFernrohr(teil: Partial<Fernrohr>, okular: Partial<Fernrohr["okular"]> = {}): Konfiguration {
  const g = START.geraet as Fernrohr;
  return { ...START, geraet: { ...g, ...teil, okular: { ...g.okular, ...okular } } };
}

function mitBedingungen(teil: Partial<Konfiguration["bedingungen"]>): Konfiguration {
  return { ...START, bedingungen: { ...START.bedingungen, ...teil } };
}

const FERNGLAS: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };

describe("begrenze (A-F8)", () => {
  it("laesst die Startkonfiguration A-D9 unveraendert und meldet nichts", () => {
    const { konfiguration, hinweise } = begrenze(START);
    expect(hinweise).toEqual([]);
    expect(konfiguration).toEqual(START);
    expect(konfiguration).not.toBe(START);
  });

  it.each([
    ["Oeffnung 400 wird 300", mitFernrohr({ oeffnungMm: 400 }), "geraet.oeffnungMm", 400, 300],
    ["Oeffnung 3 wird 6", mitFernrohr({ oeffnungMm: 3 }), "geraet.oeffnungMm", 3, 6],
    ["Brennweite 100 wird 200", mitFernrohr({ brennweiteMm: 100 }), "geraet.brennweiteMm", 100, 200],
    ["Brennweite 5000 wird 4000", mitFernrohr({ brennweiteMm: 5000 }), "geraet.brennweiteMm", 5000, 4000],
    ["Obstruktion 0,7 wird 0,5", mitFernrohr({ obstruktion: 0.7 }), "geraet.obstruktion", 0.7, 0.5],
    ["Obstruktion -0,1 wird 0", mitFernrohr({ obstruktion: -0.1 }), "geraet.obstruktion", -0.1, 0],
    ["Okular 1 mm wird 2", mitFernrohr({}, { brennweiteMm: 1 }), "geraet.okular.brennweiteMm", 1, 2],
    ["Okular 60 mm wird 50", mitFernrohr({}, { brennweiteMm: 60 }), "geraet.okular.brennweiteMm", 60, 50],
    ["Scheinbares Gesichtsfeld 30 wird 40", mitFernrohr({}, { scheinbaresGesichtsfeldGrad: 30 }), "geraet.okular.scheinbaresGesichtsfeldGrad", 30, 40],
    ["Scheinbares Gesichtsfeld 120 wird 100", mitFernrohr({}, { scheinbaresGesichtsfeldGrad: 120 }), "geraet.okular.scheinbaresGesichtsfeldGrad", 120, 100],
    ["Seeing 0,2 wird 0,5", mitBedingungen({ seeingFwhmArcsec: 0.2 }), "bedingungen.seeingFwhmArcsec", 0.2, 0.5],
    ["Seeing 7 wird 5", mitBedingungen({ seeingFwhmArcsec: 7 }), "bedingungen.seeingFwhmArcsec", 7, 5],
    ["Bortle 0 wird 1", mitBedingungen({ bortle: 0 }), "bedingungen.bortle", 0, 1],
    ["Bortle 12 wird 9", mitBedingungen({ bortle: 12 }), "bedingungen.bortle", 12, 9],
    ["Bortle 5,4 wird 5", mitBedingungen({ bortle: 5.4 }), "bedingungen.bortle", 5.4, 5],
    ["Hoehe 5 wird 10", mitBedingungen({ hoeheGrad: 5 }), "bedingungen.hoeheGrad", 5, 10],
    ["Hoehe 95 wird 90", mitBedingungen({ hoeheGrad: 95 }), "bedingungen.hoeheGrad", 95, 90]
  ])("%s mit genau einem Hinweis", (_name, eingabe, feld, vorher, nachher) => {
    const { konfiguration, hinweise } = begrenze(eingabe);
    expect(hinweise).toEqual([{ feld, eingabe: vorher, wert: nachher }]);
    expect(() => optik(konfiguration.geraet)).not.toThrow();
    expect(() => atmosphaere(konfiguration.bedingungen)).not.toThrow();
  });

  it("Fernglas: Vergroesserung 0,5 wird 1, Oeffnung 400 wird 300, Gesichtsfeld 0 wird 1 Grad", () => {
    const { konfiguration, hinweise } = begrenze({ ...START, geraet: { ...FERNGLAS, vergroesserung: 0.5, oeffnungMm: 400, wahresGesichtsfeldGrad: 0 } });
    expect(konfiguration.geraet).toEqual({ ...FERNGLAS, vergroesserung: 1, oeffnungMm: 300, wahresGesichtsfeldGrad: 1 });
    expect(hinweise.map((h) => h.feld)).toEqual(["geraet.oeffnungMm", "geraet.vergroesserung", "geraet.wahresGesichtsfeldGrad"]);
  });

  it("Fernglas 10x50 und blosses Auge bleiben ohne Hinweis", () => {
    expect(begrenze({ ...START, geraet: FERNGLAS }).hinweise).toEqual([]);
    const auge = begrenze({ ...START, geraet: { art: "auge" } });
    expect(auge.hinweise).toEqual([]);
    expect(auge.konfiguration.geraet).toEqual({ art: "auge" });
  });

  it("wirft nie: NaN in jedem Zahlenfeld wird zur Untergrenze mit Hinweis", () => {
    const eingabe: Konfiguration = {
      ...mitFernrohr({ oeffnungMm: NaN, brennweiteMm: NaN, obstruktion: NaN }, { brennweiteMm: NaN, scheinbaresGesichtsfeldGrad: NaN }),
      bedingungen: { seeingFwhmArcsec: NaN, bortle: NaN, transparenz: "klar", hoeheGrad: NaN }
    };
    const { konfiguration, hinweise } = begrenze(eingabe);
    expect(hinweise).toHaveLength(8);
    expect(hinweise.every((h) => Number.isNaN(h.eingabe))).toBe(true);
    expect(konfiguration.geraet).toEqual({
      art: "fernrohr",
      oeffnungMm: 6,
      brennweiteMm: 200,
      obstruktion: 0,
      bauart: "refraktor",
      okular: { brennweiteMm: 2, scheinbaresGesichtsfeldGrad: 40 }
    });
    expect(konfiguration.bedingungen).toEqual({ seeingFwhmArcsec: 0.5, bortle: 1, transparenz: "klar", hoeheGrad: 10 });
    expect(() => optik(konfiguration.geraet)).not.toThrow();
    expect(() => atmosphaere(konfiguration.bedingungen)).not.toThrow();
  });

  it("meldet -0 nicht als Schnitt und nennt jedes Feld unter seinem Pfad aus GRENZEN", () => {
    expect(begrenze(mitFernrohr({ obstruktion: -0 })).hinweise).toEqual([]);
    expect(begrenze(mitFernrohr({ obstruktion: 0.9 })).hinweise[0]?.feld).toBe(GRENZEN.obstruktion.feld);
  });

  it("veraendert die Eingabe nicht und meldet mehrere Schnitte in Feldreihenfolge", () => {
    const eingabe = mitFernrohr({ oeffnungMm: 400 }, { brennweiteMm: 60 });
    const kopie = structuredClone(eingabe);
    const { hinweise } = begrenze(eingabe);
    expect(eingabe).toEqual(kopie);
    expect(hinweise.map((h) => h.feld)).toEqual(["geraet.oeffnungMm", "geraet.okular.brennweiteMm"]);
  });
});
