import { describe, expect, it } from "vitest";
import type { Konfiguration } from "./konfiguration";
import type { Simulationsparameter } from "./simulationsparameter";

// Die Naht muss strukturiert klonbar sein (postMessage an einen Worker, docs/architektur.md
// Abschnitt 1). Die Beispiele pruefen das und lassen tsc die Typen gegen konkrete Werte pruefen.
describe("Naht-Typen sind strukturiert klonbar", () => {
  it("Simulationsparameter ueberstehen structuredClone unveraendert", () => {
    const parameter: Simulationsparameter = {
      quellbild: {
        schluessel: "mond-q1|1.2|853|0|0",
        objekt: "mond-q1",
        massstabArcsecProPx: 1.2,
        rasterPx: 853,
        mitteXArcsec: 0,
        mitteYArcsec: 0,
        punktquellen: [
          { name: "Io", xArcsec: 120, yArcsec: 3, durchmesserArcsec: 1.1, helligkeitRelativ: 0.4, sichtbar: true },
          { name: "Europa", xArcsec: -20, yArcsec: 0, durchmesserArcsec: 1.0, helligkeitRelativ: 0.3, sichtbar: false, grund: "blendung" },
        ],
      },
      kern: {
        schluessel: "80|0|2|1.5|1.2",
        beschreibung: { oeffnungMm: 80, obstruktion: 0, seeingFwhmArcsec: 2, augeFwhmArcsec: 1.5, massstabArcsecProPx: 1.2 },
        groesse: 5,
        radius: 2,
        massstabArcsecProPx: 1.2,
        daten: new Float32Array(25).fill(1 / 25),
      },
      helligkeit: { schluessel: "0.7|0.02", faktorObjekt: 0.7, hintergrundRelativ: 0.02, hintergrundMagProArcsec2: 20.5, punktFaktor: 0.343, punktExponent: 1 / 3 },
      gesichtsfeld: { form: "kreis", breiteArcsec: 1024, hoeheArcsec: 1024 },
      fenster: { breiteArcsec: 1024, mitteXArcsec: 0, mitteYArcsec: 0, px: 1024 },
    };
    const kopie = structuredClone(parameter);
    expect(kopie).toEqual(parameter);
    expect(kopie.kern.daten).toBeInstanceOf(Float32Array);
    expect(kopie.kern.daten).not.toBe(parameter.kern.daten);
  });

  it("Konfiguration uebersteht structuredClone unveraendert", () => {
    const konfiguration: Konfiguration = {
      geraet: {
        art: "fernrohr",
        oeffnungMm: 80,
        brennweiteMm: 600,
        obstruktion: 0,
        bauart: "refraktor",
        okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 52 },
      },
      objekt: {
        kennung: "mond-q1",
        durchmesserArcsec: 1860,
        magnitude: -10,
        quelle: { breitePx: 7600, hoehePx: 7600, massstabArcsecProPx: 0.643, weissMagProArcsec2: 3.4 },
        trabanten: [],
      },
      bedingungen: { seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 },
    };
    expect(structuredClone(konfiguration)).toEqual(konfiguration);
  });
});
