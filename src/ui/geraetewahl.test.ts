import { describe, expect, it } from "vitest";
import geraeteJson from "../../daten/geraete.json";
import { pruefeGeraete } from "../daten";
import { begrenze, type Fernrohr, GRENZEN, optik } from "../physik";
import {
  auswahlNach,
  eintragZu,
  FREI,
  freiesFernrohr,
  geraetegruppen,
  geraetZuEintrag,
  mitBauart,
  okularBrennweiteFuer,
  skaliereHinweise,
  VERGROESSERUNG_FELD,
  vergroesserungsHinweis
} from "./geraetewahl";

const GERAETE = pruefeGeraete(geraeteJson);
const OKULAR = { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 };
const START = geraetZuEintrag(GERAETE, "refraktor-80-600-ed", OKULAR) as Fernrohr;

describe("geraetegruppen", () => {
  it("ordnet Auge, Fernglaeser, Fernrohre in dieser Reihenfolge", () => {
    const gruppen = geraetegruppen(GERAETE);
    expect(gruppen.map((g) => g.gruppe)).toEqual(["auge", "fernglas", "fernrohr"]);
    expect(gruppen[0]?.eintraege.map((e) => e.id)).toEqual(["auge"]);
    expect(gruppen[1]?.eintraege).toHaveLength(3);
    expect(gruppen[2]?.eintraege).toHaveLength(22);
    expect(gruppen.flatMap((g) => g.eintraege)).toHaveLength(GERAETE.length);
  });

  it("laesst leere Gruppen weg", () => {
    expect(geraetegruppen(GERAETE.filter((e) => e.geraet.art !== "fernglas")).map((g) => g.gruppe)).toEqual(["auge", "fernrohr"]);
  });
});

describe("eintragZu und auswahlNach", () => {
  it("findet den Listeneintrag unabhaengig vom Okular", () => {
    expect(START.art).toBe("fernrohr");
    expect(eintragZu(GERAETE, { ...START, okular: { brennweiteMm: 25, scheinbaresGesichtsfeldGrad: 82 } })).toBe("refraktor-80-600-ed");
    expect(eintragZu(GERAETE, { art: "auge" })).toBe("auge");
  });

  it("liefert FREI fuer ein abweichendes Geraet", () => {
    expect(eintragZu(GERAETE, { ...START, oeffnungMm: 81 })).toBe(FREI);
  });

  it("bleibt bei FREI, solange es ein Fernrohr ist", () => {
    expect(auswahlNach(FREI, GERAETE, START)).toBe(FREI);
    expect(auswahlNach(FREI, GERAETE, { art: "auge" })).toBe("auge");
    expect(auswahlNach("auge", GERAETE, START)).toBe("refraktor-80-600-ed");
  });
});

describe("geraetZuEintrag und freiesFernrohr", () => {
  it("gibt nur Fernrohren das Okular", () => {
    expect(geraetZuEintrag(GERAETE, "fernglas-10x50", OKULAR)).toEqual({ art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 });
    expect(geraetZuEintrag(GERAETE, "gibt-es-nicht", OKULAR)).toBeUndefined();
  });

  it("uebernimmt ein Fernrohr, ersetzt Auge und Fernglas", () => {
    const eigenes: Fernrohr = { ...START, oeffnungMm: 120 };
    expect(freiesFernrohr(eigenes, START, OKULAR)).toBe(eigenes);
    const okular = { brennweiteMm: 20, scheinbaresGesichtsfeldGrad: 68 };
    expect(freiesFernrohr({ art: "auge" }, START, okular)).toEqual({ ...START, okular });
  });
});

describe("mitBauart", () => {
  it("setzt den Vorschlagswert der Obstruktion aus #11", () => {
    const f: Fernrohr = { ...START, oeffnungMm: 200, brennweiteMm: 2000 };
    expect(mitBauart(f, "schmidt-cassegrain").obstruktion).toBeCloseTo(0.34, 12);
    expect(mitBauart(f, "maksutov").obstruktion).toBeCloseTo(0.31, 12);
    expect(mitBauart(f, "refraktor").obstruktion).toBe(0);
    expect(mitBauart({ ...f, brennweiteMm: 1200 }, "newton").obstruktion).toBeCloseTo(0.25, 12);
    // kleiner schneller Newton: 130 mm f/5
    expect(mitBauart({ ...f, oeffnungMm: 130, brennweiteMm: 650 }, "newton").obstruktion).toBeCloseTo(0.32, 12);
  });
});

describe("Vergroesserung als Eingabe (A-F7)", () => {
  it("rechnet die Okularbrennweite aus, optik liefert die Vergroesserung zurueck", () => {
    const ok = okularBrennweiteFuer(600, 40);
    expect(ok).toBe(15);
    expect(optik({ ...START, okular: { ...START.okular, brennweiteMm: ok } }).vergroesserung).toBeCloseTo(40, 12);
    expect(okularBrennweiteFuer(600, 0)).toBe(Infinity);
    expect(okularBrennweiteFuer(600, -3)).toBe(Infinity);
  });

  it("meldet einen geschnittenen Wert in Vergroesserung", () => {
    for (const [v, erwartet] of [
      [1000, 300], // 0,6 mm -> 2 mm
      [5, 12], // 120 mm -> 50 mm
      [0, 12]
    ] as const) {
      const okular = { ...START.okular, brennweiteMm: okularBrennweiteFuer(START.brennweiteMm, v) };
      const { hinweise } = begrenze({ geraet: { ...START, okular }, objekt: {} as never, bedingungen: { seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 } });
      expect(vergroesserungsHinweis(hinweise, START.brennweiteMm, v)).toEqual([{ feld: VERGROESSERUNG_FELD, eingabe: v, wert: erwartet }]);
    }
  });

  it("meldet nichts ohne Schnitt der Okularbrennweite", () => {
    expect(vergroesserungsHinweis([{ feld: GRENZEN.oeffnungMm.feld, eingabe: 400, wert: 300 }], 600, 50)).toEqual([]);
  });
});

describe("skaliereHinweise", () => {
  it("rechnet nur das genannte Feld um", () => {
    const h = [
      { feld: GRENZEN.obstruktion.feld, eingabe: 0.6, wert: 0.5 },
      { feld: GRENZEN.oeffnungMm.feld, eingabe: 400, wert: 300 }
    ];
    const s = skaliereHinweise(h, GRENZEN.obstruktion.feld, 100);
    expect(s[0]?.eingabe).toBeCloseTo(60, 12);
    expect(s[0]?.wert).toBe(50);
    expect(s[1]).toEqual(h[1]);
  });
});
