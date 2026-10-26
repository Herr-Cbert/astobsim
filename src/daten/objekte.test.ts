import { afterEach, describe, expect, it, vi } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import { ladeBildnachweise, pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { ladeObjekte, pruefeObjekte, pruefeVerweise } from "./objekte";

type Roh = Record<string, unknown>;

function kopie(): Roh[] {
  return JSON.parse(JSON.stringify(objekteJson)) as Roh[];
}

function ersterZustand(roh: Roh[]): Roh {
  return (roh[0]!["zustaende"] as Roh[])[0]!;
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

const nachweise = pruefeBildnachweise(bilderJson);

describe("pruefeObjekte", () => {
  it("akzeptiert die echte daten/objekte.json samt Verweisen auf bilder.json", () => {
    const objekte = pruefeObjekte(objekteJson);
    expect(() => pruefeVerweise(objekte, nachweise)).not.toThrow();
    const mond = objekte.find((o) => o.id === "mond");
    expect(mond?.typ).toBe("mond");
    expect(mond?.zustaende[0]?.winkelgroesseArcsec).toBe(1865);
    expect(mond?.zustaende[0]?.trabanten).toEqual([]);
  });

  it("nennt Datei, Eintrag und Feld bei fehlendem Pflichtfeld", () => {
    const roh = kopie();
    delete ersterZustand(roh)["magnitude"];
    const f = fehlerVon(() => pruefeObjekte(roh));
    expect([f.datei, f.eintrag, f.feld]).toEqual(["objekte.json", "mond_ev", "magnitude"]);
  });

  it("prueft Zahlenbereiche", () => {
    const roh = kopie();
    ersterZustand(roh)["phase"] = 1.2;
    expect(fehlerVon(() => pruefeObjekte(roh)).feld).toBe("phase");
    const roh2 = kopie();
    ersterZustand(roh2)["polar_arcsec"] = 2000;
    expect(fehlerVon(() => pruefeObjekte(roh2)).feld).toBe("polar_arcsec");
    const roh3 = kopie();
    roh3[0]!["typ"] = "komet";
    expect(fehlerVon(() => pruefeObjekte(roh3)).feld).toBe("typ");
  });

  it("meldet unbekannte Felder in Objekt, Zustand und Trabant", () => {
    const roh = kopie();
    roh[0]!["typp"] = "mond";
    expect(fehlerVon(() => pruefeObjekte(roh)).feld).toBe("typp");
    const roh2 = kopie();
    ersterZustand(roh2)["helligkeit"] = 1;
    expect([fehlerVon(() => pruefeObjekte(roh2)).eintrag, fehlerVon(() => pruefeObjekte(roh2)).feld]).toEqual(["mond_ev", "helligkeit"]);
  });

  it("weist doppelte ids und das Feld monde zurueck", () => {
    const roh = kopie();
    (roh[0]!["zustaende"] as Roh[]).push(ersterZustand(roh));
    expect(fehlerVon(() => pruefeObjekte(roh)).eintrag).toBe("mond_ev");
    const roh2 = kopie();
    ersterZustand(roh2)["monde"] = [];
    expect(fehlerVon(() => pruefeObjekte(roh2)).feld).toBe("monde");
  });

  it("prueft Trabanten eines Planeten", () => {
    const planet: Roh = {
      id: "jupiter",
      name: "Jupiter",
      typ: "planet",
      zustaende: [
        {
          id: "jupiter_47",
          name: "Jupiter 47",
          winkelgroesse_arcsec: 47,
          polar_arcsec: 44,
          phase: 1,
          phasenwinkel_grad: 0.5,
          magnitude: -2.7,
          weiss_mag_arcsec2: 5.3,
          entfernung_au: 4.195,
          bild: "jupiter_bild",
          trabanten: [{ name: "Io", dx_arcsec: -110, dy_arcsec: 2.9, durchmesser_arcsec: 1.2, magnitude: 5 }]
        }
      ]
    };
    const [jupiter] = pruefeObjekte([planet]);
    expect(jupiter?.zustaende[0]?.trabanten[0]).toEqual({ name: "Io", dxArcsec: -110, dyArcsec: 2.9, durchmesserArcsec: 1.2, magnitude: 5 });
    const kaputt = JSON.parse(JSON.stringify(planet)) as Roh;
    ((kaputt["zustaende"] as Roh[])[0]!["trabanten"] as Roh[])[0]!["durchmesser_arcsec"] = 0;
    const f = fehlerVon(() => pruefeObjekte([kaputt]));
    expect([f.eintrag, f.feld]).toEqual(["jupiter_47, trabanten[0]", "durchmesser_arcsec"]);
    const tippfehler = JSON.parse(JSON.stringify(planet)) as Roh;
    ((tippfehler["zustaende"] as Roh[])[0]!["trabanten"] as Roh[])[0]!["dx"] = 1;
    expect(fehlerVon(() => pruefeObjekte([tippfehler])).feld).toBe("dx");
  });
});

describe("pruefeVerweise", () => {
  const objekte = pruefeObjekte(objekteJson);

  it("meldet einen Verweis ins Leere", () => {
    const roh = kopie();
    ersterZustand(roh)["bild"] = "gibt_es_nicht";
    const f = fehlerVon(() => pruefeVerweise(pruefeObjekte(roh), nachweise));
    expect([f.datei, f.eintrag, f.feld]).toEqual(["objekte.json", "mond_ev", "bild"]);
  });

  it("meldet einen Bildnachweis, der auf ein anderes Objekt oder einen fremden Zustand zeigt", () => {
    const fremd = nachweise.map((n) => ({ ...n, objekt: "mars" }));
    expect(fehlerVon(() => pruefeVerweise(objekte, fremd)).feld).toBe("objekt");
    const andererZustand = nachweise.map((n) => ({ ...n, zustand: "mond_vollmond" }));
    const f = fehlerVon(() => pruefeVerweise(objekte, andererZustand));
    expect([f.datei, f.feld]).toEqual(["bilder.json", "zustand"]);
  });

  it("meldet einen Bildnachweis, den kein Zustand verwendet", () => {
    const mehr = [...nachweise, { ...nachweise[0]!, id: "verwaist" }];
    expect(fehlerVon(() => pruefeVerweise(objekte, mehr)).eintrag).toBe("verwaist");
  });
});

describe("ladeObjekte und ladeBildnachweise", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** fetch-Ersatz, der daten/<datei> aus den importierten JSON-Dateien beantwortet. */
  function stubFetch(objekte: unknown): string[] {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      const inhalt = url.endsWith("objekte.json") ? objekte : url.endsWith("bilder.json") ? bilderJson : undefined;
      return inhalt === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(inhalt));
    });
    return urls;
  }

  it("laden per fetch ueber BASE_URL und pruefen", async () => {
    const urls = stubFetch(objekteJson);
    const geladen = await ladeBildnachweise();
    const objekte = await ladeObjekte(geladen);
    expect(objekte[0]?.zustaende[0]?.bild).toBe("mond_svs5587_6285");
    expect(urls).toEqual([import.meta.env.BASE_URL + "daten/bilder.json", import.meta.env.BASE_URL + "daten/objekte.json"]);
  });

  it("melden einen kaputten Verweis beim Laden", async () => {
    const roh = kopie();
    ersterZustand(roh)["bild"] = "fehlt";
    stubFetch(roh);
    await expect(ladeObjekte(nachweise)).rejects.toThrow(DatenFehler);
  });
});
