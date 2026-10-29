import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import { aufSchritt, begrenze, freiesPaar, GRENZEN } from "../physik";
import { TEXTE } from "../texte";
import { PAAR_VORGABE, voreinstellung, type Kataloge } from "../zustand";
import { leseDezimal, rasterBei } from "./feld";
import { zahl } from "./format";
import {
  gewaehlt,
  mitObjekt,
  mitPaar,
  mitZustand,
  objektgruppen,
  objektwert,
  type Paarschluessel,
  paarfeldOptionen,
  zustandsoptionen
} from "./formular_objekt";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };
const START = voreinstellung(KATALOGE);

describe("Optionen aus dem Katalog", () => {
  it("gruppiert die Objekte nach Klasse (A-D18), in Katalogreihenfolge, das freie Paar am Ende der Doppelsterne", () => {
    const gruppen = objektgruppen(objekte);
    expect(gruppen.map((g) => g.beschriftung)).toEqual(["Sonnensystem", "Doppelsterne", "Deep-Sky"]);
    const [sonne, doppel, deep] = gruppen.map((g) => g.optionen.map((o) => o.wert));
    expect(sonne).toEqual(objekte.filter((o) => o.klasse === "sonnensystem").map((o) => o.id));
    expect(doppel).toEqual([...objekte.filter((o) => o.klasse === "doppelstern").map((o) => o.id), "frei"]);
    expect(deep).toEqual(objekte.filter((o) => o.klasse === "deep_sky").map((o) => o.id));
    expect(sonne).toEqual(["mond", "mars", "jupiter", "saturn"]);
    expect(doppel).toContain("albireo");
    expect(doppel).toContain("eps_lyr");
    expect(deep).toContain("m45");
    expect(gruppen[1]!.optionen.at(-1)!.text).toBe(TEXTE.objekt.freiesPaar);
    // Jedes Objekt erscheint genau einmal.
    expect(gruppen.flatMap((g) => g.optionen).length).toBe(objekte.length + 1);
  });

  it("laesst leere Klassen weg, die Doppelsterne bleiben wegen des freien Paars", () => {
    const nurMond = objekte.filter((o) => o.id === "mond");
    expect(objektgruppen(nurMond).map((g) => g.beschriftung)).toEqual(["Sonnensystem", "Doppelsterne"]);
    expect(objektgruppen(nurMond)[1]!.optionen.map((o) => o.wert)).toEqual(["frei"]);
  });

  it("listet jeden Zustand in Katalogreihenfolge", () => {
    for (const o of objekte) {
      expect(zustandsoptionen(o)).toEqual(o.zustaende.map((z) => ({ wert: z.id, text: z.name })));
    }
  });
});

describe("mitObjekt", () => {
  it("waehlt den ersten Zustand des Objekts und laesst den Rest stehen", () => {
    const mars = objekte.find((o) => o.id === "mars")!;
    const k = mitObjekt(KATALOGE, START, "mars")!;
    expect(k.objekt.kennung).toBe(mars.zustaende[0]!.id);
    expect(k.geraet).toBe(START.geraet);
    expect(k.bedingungen).toBe(START.bedingungen);
    expect(gewaehlt(KATALOGE, k)?.objekt.id).toBe("mars");
  });

  it("liefert undefined fuer ein unbekanntes Objekt", () => {
    expect(mitObjekt(KATALOGE, START, "pluto")).toBeUndefined();
  });
});

describe("mitZustand", () => {
  it("setzt den vollen Objektzustand aus daten", () => {
    const k = mitZustand(KATALOGE, START, "mars_14")!;
    expect(k.objekt.kennung).toBe("mars_14");
    expect(k.objekt.durchmesserArcsec).toBe(14);
    expect(gewaehlt(KATALOGE, k)?.zustand.id).toBe("mars_14");
  });

  it("liefert undefined fuer einen unbekannten Zustand", () => {
    expect(mitZustand(KATALOGE, START, "mars_99")).toBeUndefined();
  });
});

describe("freies Paar im Formular (A-Z9, A-D18)", () => {
  it("mitObjekt mit frei waehlt das Paar mit den Vorgaben 2'', 5, 6, 0,6, 0,6", () => {
    const k = mitObjekt(KATALOGE, START, "frei")!;
    expect(k.objekt).toEqual(freiesPaar({ trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 }));
    expect(k.geraet).toBe(START.geraet);
    expect(objektwert(KATALOGE, k)).toBe("frei");
    expect(gewaehlt(KATALOGE, k)).toBeUndefined();
  });

  it("mitPaar aendert eine Eingabe und behaelt die anderen; ein bereits freies Paar bleibt bei frei", () => {
    const k = mitPaar(mitPaar(START, { trennungArcsec: 3.5 }), { bvB: 1.6 });
    expect(k.objekt.paar).toEqual({ ...PAAR_VORGABE, trennungArcsec: 3.5, bvB: 1.6 });
    expect(mitObjekt(KATALOGE, k, "frei")!.objekt.paar).toEqual(k.objekt.paar);
    // Wechsel auf einen Doppelstern der Liste und zurueck: wieder die Vorgaben.
    const albireo = mitObjekt(KATALOGE, k, "albireo")!;
    expect(albireo.objekt.kennung).toBe("albireo_2025");
    expect(objektwert(KATALOGE, albireo)).toBe("albireo");
    expect(mitObjekt(KATALOGE, albireo, "frei")!.objekt.paar).toEqual(PAAR_VORGABE);
  });

  it("die Felder nehmen Bereich und Schritt aus GRENZEN, die Trennung auch den groben Schritt ab 10''", () => {
    const keine = (): [] => [];
    const t = paarfeldOptionen("trennungArcsec", 2, keine);
    expect(t).toMatchObject({ feld: "objekt.paar.trennungArcsec", min: 0.1, max: 600, schritt: 0.05, stellen: 2, grob: { ab: 10, schritt: 1, stellen: 0 } });
    expect(rasterBei(t, 9.95)).toEqual({ schritt: 0.05, stellen: 2 });
    expect(rasterBei(t, 10)).toEqual({ schritt: 1, stellen: 0 });
    expect(rasterBei(t, 34)).toEqual({ schritt: 1, stellen: 0 });
    expect(paarfeldOptionen("magnitudeA", 5, keine)).toMatchObject({ schritt: GRENZEN.magnitudeA.schritt, stellen: 1 });
    expect(paarfeldOptionen("bvB", 0.6, keine)).toMatchObject({ schritt: GRENZEN.bvB.schritt, stellen: 2 });
    expect(paarfeldOptionen("bvB", 0.6, keine).grob).toBeUndefined();
  });

  it("das Feld zeigt genau den Wert, mit dem begrenze rechnet (34,05 wird 34, 2,03 wird 2,05)", () => {
    const keine = (): [] => [];
    const faelle: [Paarschluessel, number, string][] = [
      ["trennungArcsec", 34.05, "34"],
      ["trennungArcsec", 2.03, "2,05"],
      ["trennungArcsec", 9.97, "9,95"],
      ["trennungArcsec", 9.98, "10"],
      ["trennungArcsec", 10.4, "10"],
      ["trennungArcsec", 599.6, "600"],
      ["trennungArcsec", 0.12, "0,10"],
      ["magnitudeB", 5.44, "5,4"],
      ["bvA", 1.87, "1,85"]
    ];
    for (const [schluessel, eingabe, text] of faelle) {
      const verwendet = begrenze(mitPaar(START, { [schluessel]: eingabe })).konfiguration.objekt.paar![schluessel];
      const o = paarfeldOptionen(schluessel, verwendet, keine);
      expect(zahl(verwendet, rasterBei(o, verwendet).stellen), `${schluessel} ${eingabe}`).toBe(text);
    }
  });

  it("fuer jeden Wert im Bereich: Schritt des Felds wie in begrenze, Anzeige verlustfrei", () => {
    const keine = (): [] => [];
    for (const schluessel of ["trennungArcsec", "magnitudeA", "magnitudeB", "bvA", "bvB"] as const) {
      const g = GRENZEN[schluessel];
      for (let x = g.min; x <= g.max; x += (g.max - g.min) / 997) {
        const verwendet = begrenze(mitPaar(START, { [schluessel]: x })).konfiguration.objekt.paar![schluessel];
        const raster = rasterBei(paarfeldOptionen(schluessel, verwendet, keine), verwendet);
        // === statt toBe: begrenze liefert fuer kleine negative Eingaben -0, das Feld zeigt "0".
        expect(aufSchritt(verwendet, raster.schritt) === verwendet, `${schluessel} ${x}`).toBe(true);
        expect(leseDezimal(zahl(verwendet, raster.stellen)) === verwendet, `${schluessel} ${x}`).toBe(true);
      }
    }
  });
});
