import { describe, expect, it } from "vitest";
// Die echte Datei als JSON-Modul: Vite und tsc lesen sie ohne node:fs (kein @types/node im Projekt).
import geraeteJson from "../../daten/geraete.json";
import { GRENZEN } from "../physik/begrenze";
import { DatenFehler } from "./fehler";
import type { Geraeteeintrag } from "./geraete";
import { OBSTRUKTION_VORSCHLAG_PROZENT, mitOkular, pruefeGeraete, vorschlagObstruktionProzent } from "./geraete";

const roh: unknown = geraeteJson;
const eintraege = pruefeGeraete(roh);
const rohListe = geraeteJson as Record<string, unknown>[];

function eintrag(id: string): Geraeteeintrag {
  const e = eintraege.find((x) => x.id === id);
  if (e === undefined) throw new Error(`Eintrag ${id} fehlt`);
  return e;
}

function fehlerVon(f: () => unknown): DatenFehler {
  try {
    f();
  } catch (e) {
    if (e instanceof DatenFehler) return e;
    throw e;
  }
  throw new Error("kein DatenFehler geworfen");
}

/** Gueltiger Fernrohr-Eintrag als Vorlage fuer Fehlerfaelle. */
function fernrohrRoh(): Record<string, unknown> {
  return {
    id: "test-fernrohr",
    name: "Test",
    typ: "fernrohr",
    bauart: "newton",
    oeffnung_mm: 200,
    brennweite_mm: 1200,
    obstruktion_prozent: 25,
    vergroesserung: null,
    gesichtsfeld_grad: null,
    kommentar: null
  };
}

describe("geraete.json", () => {
  it("enthaelt die Kernliste: 22 Fernrohre, drei Fernglaeser, das Auge", () => {
    const anzahl = (art: string) => eintraege.filter((e) => e.geraet.art === art).length;
    expect(anzahl("fernrohr")).toBe(22);
    expect(anzahl("fernglas")).toBe(3);
    expect(anzahl("auge")).toBe(1);
  });

  it("hat eindeutige ids im Format a-z0-9-", () => {
    const ids = eintraege.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("hat je Typ alle Pflichtfelder und keine fremden Felder", () => {
    const pflicht: Record<string, string[]> = {
      fernrohr: ["bauart", "oeffnung_mm", "brennweite_mm", "obstruktion_prozent"],
      fernglas: ["oeffnung_mm", "vergroesserung", "gesichtsfeld_grad"],
      auge: ["oeffnung_mm", "vergroesserung"]
    };
    const erlaubt = ["id", "name", "typ", "bauart", "oeffnung_mm", "brennweite_mm", "obstruktion_prozent", "vergroesserung", "gesichtsfeld_grad", "kommentar"];
    for (const e of rohListe) {
      for (const feld of ["id", "name", "typ", ...(pflicht[e.typ as string] ?? [])]) {
        expect(e[feld], `${String(e.id)}.${feld}`).not.toBeNull();
        expect(e[feld], `${String(e.id)}.${feld}`).toBeDefined();
      }
      for (const feld of Object.keys(e)) expect(erlaubt, `${String(e.id)}.${feld}`).toContain(feld);
    }
  });

  it("liegt in den Bereichen nach A-F8 (GRENZEN aus physik)", () => {
    const imBereich = (wert: number, g: { min: number; max: number }, wo: string) => {
      expect(wert, wo).toBeGreaterThanOrEqual(g.min);
      expect(wert, wo).toBeLessThanOrEqual(g.max);
    };
    for (const { id, geraet: g } of eintraege) {
      if (g.art === "fernrohr") {
        imBereich(g.oeffnungMm, GRENZEN.oeffnungMm, id);
        imBereich(g.brennweiteMm, GRENZEN.brennweiteMm, id);
        imBereich(g.obstruktion, GRENZEN.obstruktion, id);
      } else if (g.art === "fernglas") {
        imBereich(g.oeffnungMm, GRENZEN.oeffnungMm, id);
        imBereich(g.vergroesserung, GRENZEN.vergroesserung, id);
        imBereich(g.wahresGesichtsfeldGrad, GRENZEN.wahresGesichtsfeldGrad, id);
      }
    }
  });

  it("weicht nur mit Kommentar zur Obstruktion vom Vorschlagswert der Bauart ab", () => {
    for (const { id, kommentar, geraet: g } of eintraege) {
      if (g.art !== "fernrohr") continue;
      const prozent = Math.round(g.obstruktion * 100);
      if (prozent !== vorschlagObstruktionProzent(g.bauart, g.oeffnungMm, g.brennweiteMm)) {
        expect(kommentar ?? "", id).toContain("Obstruktion");
      }
    }
  });

  it("enthaelt Auge, Fernglaeser und Startgeraet mit den Werten aus A-F3, A-F4, A-D9", () => {
    expect(eintrag("auge").geraet).toEqual({ art: "auge" });
    expect(eintrag("fernglas-8x42").geraet).toEqual({ art: "fernglas", oeffnungMm: 42, vergroesserung: 8, wahresGesichtsfeldGrad: 7.2 });
    expect(eintrag("fernglas-10x50").geraet).toEqual({ art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 });
    expect(eintrag("fernglas-15x70").geraet).toEqual({ art: "fernglas", oeffnungMm: 70, vergroesserung: 15, wahresGesichtsfeldGrad: 4.4 });
    expect(eintrag("refraktor-80-600-ed").geraet).toEqual({ art: "fernrohr", oeffnungMm: 80, brennweiteMm: 600, obstruktion: 0, bauart: "refraktor" });
  });

  it("enthaelt keine Herstellernamen im Anzeigenamen (A-F10)", () => {
    const hersteller = /celestron|sky-?watcher|meade|bresser|omegon|tele ?vue|zeiss|nikon|baader|explore|gso|leica|vortex|olympus|skymax|evostar|skyliner|nexstar/i;
    for (const e of eintraege) expect(e.name, e.id).not.toMatch(hersteller);
  });
});

describe("pruefeGeraete", () => {
  it("rechnet Obstruktion von Prozent in ein Verhaeltnis um", () => {
    const [e] = pruefeGeraete([fernrohrRoh()]);
    expect(e?.geraet).toEqual({ art: "fernrohr", oeffnungMm: 200, brennweiteMm: 1200, obstruktion: 0.25, bauart: "newton" });
    expect(e?.kommentar).toBeUndefined();
  });

  it("nennt Eintrag und Feld bei fehlenden oder falschen Werten", () => {
    const ohneBrennweite = { ...fernrohrRoh(), brennweite_mm: null };
    let f = fehlerVon(() => pruefeGeraete([ohneBrennweite]));
    expect([f.datei, f.eintrag, f.feld]).toEqual(["geraete.json", "test-fernrohr", "brennweite_mm"]);

    f = fehlerVon(() => pruefeGeraete([{ ...fernrohrRoh(), obstruktion_prozent: 60 }]));
    expect(f.feld).toBe("obstruktion_prozent");
    f = fehlerVon(() => pruefeGeraete([{ ...fernrohrRoh(), bauart: "cassegrain" }]));
    expect(f.feld).toBe("bauart");
    f = fehlerVon(() => pruefeGeraete([{ ...fernrohrRoh(), vergroesserung: 10 }]));
    expect(f.feld).toBe("vergroesserung");
    f = fehlerVon(() => pruefeGeraete([{ ...fernrohrRoh(), id: "Gross Buchstaben" }]));
    expect(f.feld).toBe("id");
  });

  it("weist doppelte ids ab", () => {
    const f = fehlerVon(() => pruefeGeraete([fernrohrRoh(), fernrohrRoh()]));
    expect([f.eintrag, f.feld]).toEqual(["test-fernrohr", "id"]);
  });

  it("weist ein Auge mit anderer Oeffnung und ein Fernglas mit Bauart ab", () => {
    const auge = { id: "auge", name: "Auge", typ: "auge", oeffnung_mm: 7, vergroesserung: 1 };
    expect(fehlerVon(() => pruefeGeraete([auge])).feld).toBe("oeffnung_mm");
    const glas = { id: "glas", name: "Glas", typ: "fernglas", bauart: "refraktor", oeffnung_mm: 50, vergroesserung: 10, gesichtsfeld_grad: 6.5 };
    expect(fehlerVon(() => pruefeGeraete([glas])).feld).toBe("bauart");
    expect(() => pruefeGeraete({})).toThrow(DatenFehler);
  });
});

describe("Vorschlagswerte Obstruktion", () => {
  it("stehen je Bauart wie in der Recherche", () => {
    expect(OBSTRUKTION_VORSCHLAG_PROZENT).toEqual({ refraktor: 0, newton: 25, "schmidt-cassegrain": 34, maksutov: 31 });
  });

  it("setzen fuer kleine schnelle Newtons 32 Prozent", () => {
    expect(vorschlagObstruktionProzent("newton", 130, 650)).toBe(32);
    expect(vorschlagObstruktionProzent("newton", 150, 750)).toBe(32);
    expect(vorschlagObstruktionProzent("newton", 150, 1200)).toBe(25);
    expect(vorschlagObstruktionProzent("newton", 200, 1000)).toBe(25);
    expect(vorschlagObstruktionProzent("maksutov", 90, 450)).toBe(31);
  });
});

describe("mitOkular", () => {
  const okular = { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 };

  it("haengt das Okular nur an Fernrohre", () => {
    const startgeraet = mitOkular(eintrag("refraktor-80-600-ed").geraet, okular);
    expect(startgeraet).toEqual({ art: "fernrohr", oeffnungMm: 80, brennweiteMm: 600, obstruktion: 0, bauart: "refraktor", okular });
    expect(mitOkular(eintrag("fernglas-10x50").geraet, okular)).not.toHaveProperty("okular");
    expect(mitOkular(eintrag("auge").geraet, okular)).toEqual({ art: "auge" });
  });
});
