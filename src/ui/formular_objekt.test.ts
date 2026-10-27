import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import { voreinstellung, type Kataloge } from "../zustand";
import { gewaehlt, mitObjekt, mitZustand, objektoptionen, zustandsoptionen } from "./formular_objekt";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };
const START = voreinstellung(KATALOGE);

describe("Optionen aus dem Katalog", () => {
  it("listet jedes Objekt und jeden Zustand in Katalogreihenfolge", () => {
    expect(objektoptionen(objekte).map((o) => o.wert)).toEqual(objekte.map((o) => o.id));
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
