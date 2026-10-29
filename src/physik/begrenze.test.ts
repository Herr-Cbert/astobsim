import { describe, expect, it } from "vitest";
import { atmosphaere } from "./atmosphaere";
import { aufSchritt, begrenze, GRENZEN } from "./begrenze";
import type { Fernglas, Fernrohr, Konfiguration, Paareingaben } from "../naht/konfiguration";
import { freiesPaar } from "./doppelstern";
import { optik } from "./optik";
import { KONFIGURATION_A_D9 as START } from "./testdaten";

function mitFernrohr(teil: Partial<Fernrohr>, okular: Partial<Fernrohr["okular"]> = {}): Konfiguration {
  const g = START.geraet as Fernrohr;
  return { ...START, geraet: { ...g, ...teil, okular: { ...g.okular, ...okular } } };
}

function mitBedingungen(teil: Partial<Konfiguration["bedingungen"]>): Konfiguration {
  return { ...START, bedingungen: { ...START.bedingungen, ...teil } };
}

/** Startkonfiguration mit dem freien Paar; Vorgabe 2'', 5, 6, 0,6, 0,6 (doppelsterne.md 3.2). */
const PAAR_VORGABE: Paareingaben = { trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 };
function mitPaar(teil: Partial<Paareingaben>): Konfiguration {
  return { ...START, objekt: freiesPaar({ ...PAAR_VORGABE, ...teil }) };
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
    ["Bortle 9,6 wird gerundet 10 und geschnitten 9", mitBedingungen({ bortle: 9.6 }), "bedingungen.bortle", 9.6, 9],
    ["Seeing 0,44 wird gerundet 0,4 und geschnitten 0,5", mitBedingungen({ seeingFwhmArcsec: 0.44 }), "bedingungen.seeingFwhmArcsec", 0.44, 0.5],
    ["Hoehe 5 wird 10", mitBedingungen({ hoeheGrad: 5 }), "bedingungen.hoeheGrad", 5, 10],
    ["Hoehe 95 wird 90", mitBedingungen({ hoeheGrad: 95 }), "bedingungen.hoeheGrad", 95, 90],
    ["Hoehe 7 wird gerundet 5 und geschnitten 10", mitBedingungen({ hoeheGrad: 7 }), "bedingungen.hoeheGrad", 7, 10],
    // Schnitt an der rohen Eingabe: auch wenn das Runden schon in den Bereich fuehrt.
    ["Hoehe 7,5 wird 10", mitBedingungen({ hoeheGrad: 7.5 }), "bedingungen.hoeheGrad", 7.5, 10],
    ["Hoehe 92 wird 90", mitBedingungen({ hoeheGrad: 92 }), "bedingungen.hoeheGrad", 92, 90],
    ["Seeing 0,45 wird 0,5", mitBedingungen({ seeingFwhmArcsec: 0.45 }), "bedingungen.seeingFwhmArcsec", 0.45, 0.5],
    ["Bortle 9,4 wird 9", mitBedingungen({ bortle: 9.4 }), "bedingungen.bortle", 9.4, 9],
    ["Oeffnung 300,4 wird 300", mitFernrohr({ oeffnungMm: 300.4 }), "geraet.oeffnungMm", 300.4, 300],
    ["Bortle 0,5 wird 1", mitBedingungen({ bortle: 0.5 }), "bedingungen.bortle", 0.5, 1],
    ["Obstruktion 0,5004 wird 0,5", mitFernrohr({ obstruktion: 0.5004 }), "geraet.obstruktion", 0.5004, 0.5]
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

  it("Fernglas: Vergroesserung und Gesichtsfeld aus einem Link (1e400) werden auf 1000 und 30 Grad geschnitten", () => {
    const { konfiguration, hinweise } = begrenze({ ...START, geraet: { ...FERNGLAS, vergroesserung: Infinity, wahresGesichtsfeldGrad: Infinity } });
    expect(konfiguration.geraet).toEqual({ ...FERNGLAS, vergroesserung: 1000, wahresGesichtsfeldGrad: 30 });
    expect(hinweise).toEqual([
      { feld: "geraet.vergroesserung", eingabe: Infinity, wert: 1000 },
      { feld: "geraet.wahresGesichtsfeldGrad", eingabe: Infinity, wert: 30 }
    ]);
    expect(() => optik(konfiguration.geraet)).not.toThrow();
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

describe("begrenze rundet auf den Schritt ohne Hinweis (A-F8, A-B1, A-B2, A-B4)", () => {
  it("Link s=1.25, h=45.5, b=4.6 ergibt 1,3 / 45 / 5 ohne Hinweis", () => {
    const { konfiguration, hinweise } = begrenze(mitBedingungen({ seeingFwhmArcsec: 1.25, hoeheGrad: 45.5, bortle: 4.6 }));
    expect(hinweise).toEqual([]);
    expect(konfiguration.bedingungen).toEqual({ ...START.bedingungen, seeingFwhmArcsec: 1.3, hoeheGrad: 45, bortle: 5 });
  });

  it.each([
    ["Seeing 2,3000000000000003 wird genau 2,3", mitBedingungen({ seeingFwhmArcsec: 2.3000000000000003 }), (k: Konfiguration) => k.bedingungen.seeingFwhmArcsec, 2.3],
    ["Seeing 1,15 wird 1,2", mitBedingungen({ seeingFwhmArcsec: 1.15 }), (k: Konfiguration) => k.bedingungen.seeingFwhmArcsec, 1.2],
    ["Seeing 4,96 wird 5", mitBedingungen({ seeingFwhmArcsec: 4.96 }), (k: Konfiguration) => k.bedingungen.seeingFwhmArcsec, 5],
    ["Hoehe 87,5 wird 90", mitBedingungen({ hoeheGrad: 87.5 }), (k: Konfiguration) => k.bedingungen.hoeheGrad, 90],
    ["Bortle 5,4 wird 5", mitBedingungen({ bortle: 5.4 }), (k: Konfiguration) => k.bedingungen.bortle, 5],
    ["Bortle 8,6 wird 9", mitBedingungen({ bortle: 8.6 }), (k: Konfiguration) => k.bedingungen.bortle, 9],
    ["Hoehe 47,5 wird 50", mitBedingungen({ hoeheGrad: 47.5 }), (k: Konfiguration) => k.bedingungen.hoeheGrad, 50],
    ["Hoehe 33,3 wird 35", mitBedingungen({ hoeheGrad: 33.333333333333336 }), (k: Konfiguration) => k.bedingungen.hoeheGrad, 35],
    ["Oeffnung 299,6 wird 300", mitFernrohr({ oeffnungMm: 299.6 }), (k: Konfiguration) => (k.geraet as Fernrohr).oeffnungMm, 300],
    ["Brennweite 987,6 wird 988", mitFernrohr({ brennweiteMm: 987.6 }), (k: Konfiguration) => (k.geraet as Fernrohr).brennweiteMm, 988],
    ["Obstruktion 0,2714 wird 0,271", mitFernrohr({ obstruktion: 0.2714 }), (k: Konfiguration) => (k.geraet as Fernrohr).obstruktion, 0.271],
    ["Okular 16,216 mm wird 16,22", mitFernrohr({}, { brennweiteMm: 600 / 37 }), (k: Konfiguration) => (k.geraet as Fernrohr).okular.brennweiteMm, 16.22],
    ["Scheinbares Gesichtsfeld 67,6 wird 68", mitFernrohr({}, { scheinbaresGesichtsfeldGrad: 67.6 }), (k: Konfiguration) => (k.geraet as Fernrohr).okular.scheinbaresGesichtsfeldGrad, 68]
  ])("%s", (_name, eingabe, lies, erwartet) => {
    const { konfiguration, hinweise } = begrenze(eingabe);
    expect(hinweise).toEqual([]);
    expect(lies(konfiguration)).toBe(erwartet);
  });

  it("Fernglas: Vergroesserung 10,4 wird 10, Gesichtsfeld 6,54 wird 6,5", () => {
    const { konfiguration, hinweise } = begrenze({ ...START, geraet: { ...FERNGLAS, vergroesserung: 10.4, wahresGesichtsfeldGrad: 6.54 } });
    expect(hinweise).toEqual([]);
    expect(konfiguration.geraet).toEqual(FERNGLAS);
  });

  it("min und max jedes Felds sind Vielfache seines Schritts", () => {
    for (const g of Object.values(GRENZEN)) {
      expect(aufSchritt(g.min, g.schritt), g.feld).toBe(g.min);
      expect(aufSchritt(g.max, g.schritt), g.feld).toBe(g.max);
    }
  });
});

describe("begrenze: freies Paar (A-Z9, A-F8, doppelsterne.md 3.2)", () => {
  it("laesst die Vorgabe unveraendert und meldet nichts; Objekte ohne paar bleiben dasselbe Objekt", () => {
    const eingabe = mitPaar({});
    const { konfiguration, hinweise } = begrenze(eingabe);
    expect(hinweise).toEqual([]);
    expect(konfiguration.objekt).toEqual(eingabe.objekt);
    expect(begrenze(START).konfiguration.objekt).toBe(START.objekt);
  });

  it.each([
    ["Trennung 0,05 wird 0,1", { trennungArcsec: 0.05 }, "objekt.paar.trennungArcsec", 0.05, 0.1],
    ["Trennung 700 wird 600", { trennungArcsec: 700 }, "objekt.paar.trennungArcsec", 700, 600],
    ["Magnitude A -2 wird -1,5", { magnitudeA: -2 }, "objekt.paar.magnitudeA", -2, -1.5],
    ["Magnitude A 13 wird 12", { magnitudeA: 13 }, "objekt.paar.magnitudeA", 13, 12],
    ["Magnitude B -2 wird -1,5", { magnitudeB: -2 }, "objekt.paar.magnitudeB", -2, -1.5],
    ["Magnitude B 16 wird 15", { magnitudeB: 16 }, "objekt.paar.magnitudeB", 16, 15],
    ["B-V A -0,5 wird -0,4", { bvA: -0.5 }, "objekt.paar.bvA", -0.5, -0.4],
    ["B-V A 2,5 wird 2", { bvA: 2.5 }, "objekt.paar.bvA", 2.5, 2],
    ["B-V B -0,5 wird -0,4", { bvB: -0.5 }, "objekt.paar.bvB", -0.5, -0.4],
    ["B-V B 2,5 wird 2", { bvB: 2.5 }, "objekt.paar.bvB", 2.5, 2],
    ["Trennung NaN wird 0,1", { trennungArcsec: NaN }, "objekt.paar.trennungArcsec", NaN, 0.1],
    ["Magnitude B Unendlich wird 15", { magnitudeB: Infinity }, "objekt.paar.magnitudeB", Infinity, 15]
  ])("%s mit genau einem Hinweis, Sterne neu gebildet", (_name, teil, feld, vorher, nachher) => {
    const { konfiguration, hinweise } = begrenze(mitPaar(teil));
    expect(hinweise).toEqual([{ feld, eingabe: vorher, wert: nachher }]);
    const paar = konfiguration.objekt.paar!;
    expect(konfiguration.objekt).toEqual(freiesPaar(paar));
  });

  it("schneidet und bildet Sterne, Trennung und Gesamthelligkeit neu", () => {
    const { konfiguration, hinweise } = begrenze(mitPaar({ trennungArcsec: 0, magnitudeA: -3, magnitudeB: 20 }));
    expect(hinweise.map((h) => h.feld)).toEqual(["objekt.paar.trennungArcsec", "objekt.paar.magnitudeA", "objekt.paar.magnitudeB"]);
    const o = konfiguration.objekt;
    expect(o.paar).toEqual({ trennungArcsec: 0.1, magnitudeA: -1.5, magnitudeB: 15, bvA: 0.6, bvB: 0.6 });
    expect(o.durchmesserArcsec).toBe(0.1);
    expect(o.sterne.map((s) => [s.dxArcsec, s.magnitude])).toEqual([[-0.05, -1.5], [0.05, 15]]);
    expect(o.magnitude).toBe(freiesPaar(o.paar!).magnitude);
  });

  it("Hinweise in Feldreihenfolge: Geraet, Objekt, Bedingungen", () => {
    const eingabe: Konfiguration = { ...mitPaar({ bvB: 3 }), geraet: { ...(START.geraet as Fernrohr), oeffnungMm: 400 }, bedingungen: { ...START.bedingungen, bortle: 12 } };
    expect(begrenze(eingabe).hinweise.map((h) => h.feld)).toEqual(["geraet.oeffnungMm", "objekt.paar.bvB", "bedingungen.bortle"]);
  });

  it.each([
    ["Trennung 2,03 wird 2,05", { trennungArcsec: 2.03 }, (p: Paareingaben) => p.trennungArcsec, 2.05],
    ["Trennung 9,97 wird 9,95", { trennungArcsec: 9.97 }, (p: Paareingaben) => p.trennungArcsec, 9.95],
    ["Trennung 9,98 wird 10", { trennungArcsec: 9.98 }, (p: Paareingaben) => p.trennungArcsec, 10],
    ["Trennung 10,4 wird 10 (ab 10'' Schritt 1'')", { trennungArcsec: 10.4 }, (p: Paareingaben) => p.trennungArcsec, 10],
    ["Trennung 34,3 wird 34", { trennungArcsec: 34.3 }, (p: Paareingaben) => p.trennungArcsec, 34],
    ["Trennung 599,6 wird 600", { trennungArcsec: 599.6 }, (p: Paareingaben) => p.trennungArcsec, 600],
    ["Magnitude A 0,96 wird 1", { magnitudeA: 0.96 }, (p: Paareingaben) => p.magnitudeA, 1],
    ["Magnitude B 5,44 wird 5,4", { magnitudeB: 5.44 }, (p: Paareingaben) => p.magnitudeB, 5.4],
    ["B-V A 1,87 wird 1,85", { bvA: 1.87 }, (p: Paareingaben) => p.bvA, 1.85],
    ["B-V B -0,13 wird -0,15", { bvB: -0.13 }, (p: Paareingaben) => p.bvB, -0.15]
  ])("%s ohne Hinweis", (_name, teil, lies, erwartet) => {
    const { konfiguration, hinweise } = begrenze(mitPaar(teil));
    expect(hinweise).toEqual([]);
    expect(lies(konfiguration.objekt.paar!)).toBe(erwartet);
    expect(konfiguration.objekt.durchmesserArcsec).toBe(konfiguration.objekt.paar!.trennungArcsec);
  });

  it("grober Schritt der Trennung: ab und max sind Vielfache davon", () => {
    const g = GRENZEN.trennungArcsec;
    expect(aufSchritt(g.grob.ab, g.grob.schritt)).toBe(g.grob.ab);
    expect(aufSchritt(g.max, g.grob.schritt)).toBe(g.max);
    expect(aufSchritt(g.grob.ab, g.schritt)).toBe(g.grob.ab);
  });
});

describe("aufSchritt", () => {
  it("rundet ohne Gleitkommareste auf den Schritt", () => {
    expect(aufSchritt(1.25, 0.1)).toBe(1.3);
    expect(aufSchritt(0.55, 0.1)).toBe(0.6);
    expect(aufSchritt(1.15, 0.1)).toBe(1.2);
    expect(aufSchritt(0.3155, 0.001)).toBe(0.316);
    expect(aufSchritt(45.5, 5)).toBe(45);
    expect(aufSchritt(47.5, 5)).toBe(50);
    expect(aufSchritt(4.6, 1)).toBe(5);
    expect(aufSchritt(7.25, 0.5)).toBe(7.5);
  });

  it("laesst NaN, Unendlich und -0 stehen", () => {
    expect(aufSchritt(NaN, 0.1)).toBeNaN();
    expect(aufSchritt(Infinity, 0.1)).toBe(Infinity);
    expect(aufSchritt(-Infinity, 5)).toBe(-Infinity);
    expect(Object.is(aufSchritt(-0, 0.001), -0)).toBe(true);
  });
});
