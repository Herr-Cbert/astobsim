import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { mitOkular, pruefeBildnachweise, pruefeGeraete, pruefeObjekte } from "../daten";
import type { Konfiguration } from "../naht/konfiguration";
import { auswerten } from "../physik";
import { voreinstellung } from "../zustand";
import { warnzeilen } from "./warnungen";

describe("warnzeilen", () => {
  it("ohne Warnung keine Zeile", () => {
    expect(warnzeilen([])).toEqual([]);
  });

  it("Austrittspupille ueber 6 mm mit Wert und Grenze", () => {
    const [z, ...rest] = warnzeilen([{ art: "ap-ueber-6", wert: 7.5, grenze: 6 }]);
    expect(rest).toEqual([]);
    expect(z?.text).toContain("7,5 mm");
    expect(z?.text).toContain("6 mm");
    expect(z?.hilfe.length).toBeGreaterThan(50);
  });

  it("unter 0,5 mm allein: zwei Nachkommastellen", () => {
    const [z] = warnzeilen([{ art: "ap-unter-0-5", wert: 0.45, grenze: 0.5 }]);
    expect(z?.art).toBe("ap-unter-0-5");
    expect(z?.text).toContain("0,45 mm");
    expect(z?.text).toContain("0,5 mm");
  });

  it("an der Grenze eine Stelle mehr, damit Wert und Grenze sich unterscheiden", () => {
    expect(warnzeilen([{ art: "ap-ueber-6", wert: 6.04, grenze: 6 }])[0]?.text).toContain("6,04 mm");
    expect(warnzeilen([{ art: "v-ueber-2d", wert: 160.3, grenze: 160 }])[0]?.text).toContain("160,3×");
    expect(warnzeilen([{ art: "ap-unter-0-5", wert: 0.4996, grenze: 0.5 }])[0]?.text).toContain("0,4996 mm");
  });

  it("ueber 2 D und unter 0,5 mm werden eine Zeile mit beiden Werten und beiden Hilfetexten", () => {
    const zeilen = warnzeilen([
      { art: "ap-unter-0-5", wert: 0.4, grenze: 0.5 },
      { art: "v-ueber-2d", wert: 200, grenze: 160 }
    ]);
    expect(zeilen.map((z) => z.art)).toEqual(["v-ueber-2d"]);
    expect(zeilen[0]?.text).toContain("200×");
    expect(zeilen[0]?.text).toContain("160×");
    expect(zeilen[0]?.text).toContain("0,40 mm");
    expect(zeilen[0]?.hilfe).toContain("1/144");
  });

  it("aus echter Auswertung: 80/600 mit 2-mm-Okular warnt einmal vor leerer Vergroesserung", () => {
    const nachweise = pruefeBildnachweise(bilderJson);
    const objekte = pruefeObjekte(objekteJson);
    const geraete = pruefeGeraete(geraeteJson);
    const start = voreinstellung({ geraete, objekte, nachweise });
    const eintrag = geraete.find((g) => g.id === "refraktor-80-600-ed");
    expect(eintrag).toBeDefined();
    const k: Konfiguration = { ...start, geraet: mitOkular(eintrag!.geraet, { brennweiteMm: 2, scheinbaresGesichtsfeldGrad: 50 }) };
    const zeilen = warnzeilen(auswerten(k, { anzeigePx: 64 }).warnungen);
    expect(zeilen.map((z) => z.art)).toEqual(["v-ueber-2d"]);
  });
});
