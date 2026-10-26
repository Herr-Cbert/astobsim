import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { DatenFehler, pruefeBildnachweise, pruefeGeraete, pruefeObjekte } from "../daten";
import { begrenze } from "../physik";
import type { Kataloge } from "./kataloge";
import { voreinstellung } from "./voreinstellung";

const ECHT: Kataloge = {
  geraete: pruefeGeraete(geraeteJson),
  objekte: pruefeObjekte(objekteJson),
  nachweise: pruefeBildnachweise(bilderJson)
};

describe("voreinstellung (A-D9)", () => {
  it("liefert 80/600-Refraktor, Okular 10 mm 50 Grad, mond_ev, Seeing 2, Bortle 5, klar, Hoehe 45", () => {
    const k = voreinstellung(ECHT);
    expect(k.geraet).toEqual({
      art: "fernrohr", bauart: "refraktor", oeffnungMm: 80, brennweiteMm: 600, obstruktion: 0, okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
    });
    expect(k.objekt.kennung).toBe("mond_ev");
    expect(k.objekt.durchmesserArcsec).toBe(1865);
    expect(k.bedingungen).toEqual({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 });
  });

  it("ist bereits begrenzt", () => {
    const k = voreinstellung(ECHT);
    expect(begrenze(k)).toEqual({ konfiguration: k, hinweise: [] });
  });

  it("liefert bei jedem Aufruf eine frische Kopie", () => {
    const a = voreinstellung(ECHT);
    const b = voreinstellung(ECHT);
    expect(a).toEqual(b);
    expect(a.geraet).not.toBe(b.geraet);
    expect(a.bedingungen).not.toBe(b.bedingungen);
  });

  it("wirft DatenFehler, wenn Startgeraet oder Startzustand im Katalog fehlen", () => {
    expect(() => voreinstellung({ ...ECHT, geraete: [] })).toThrow(DatenFehler);
    expect(() => voreinstellung({ ...ECHT, objekte: [] })).toThrow(DatenFehler);
  });
});
