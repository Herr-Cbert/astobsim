// Objektklassen Version 2 (Issue #102) mit synthetischen Katalogen: erfundene Kennungen
// (testpaar, nebel_test, haufen_test, WDS 00001+0001), keine echten Objektdaten.
import { afterEach, describe, expect, it, vi } from "vitest";
import bilderJson from "../../daten/bilder.json";
import { pruefeBildnachweise, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { ladeObjekte, ladeSterne, pruefeObjekte, pruefeSternliste, pruefeVerweise } from "./objekte";
import { objektzustand } from "./objektzustand";

type Roh = Record<string, unknown>;

function fehlerVon(f: () => unknown): DatenFehler {
  try {
    f();
  } catch (e) {
    if (e instanceof DatenFehler) return e;
    throw e;
  }
  throw new Error("kein DatenFehler geworfen");
}

function paar(): Roh {
  return {
    id: "testpaar",
    name: "Testpaar",
    typ: "doppelstern",
    zustaende: [
      {
        id: "testpaar_1",
        name: "Testpaar (3'', 4 und 6 mag)",
        magnitude: 3.84,
        katalog: [
          { wds: "00001+0001", komponenten: "TST 1 AB", trennung_arcsec: 3.0, positionswinkel_grad: 90, epoche: 2027.0, quelle: "erfunden" }
        ],
        sterne: [
          { name: "A", dx_arcsec: -1.5, dy_arcsec: 0, magnitude: 4.0, b_v: 1.1, quelle_farbe: "erfunden" },
          { name: "B", dx_arcsec: 1.5, dy_arcsec: 0, magnitude: 6.0, b_v: -0.1 }
        ]
      }
    ]
  };
}

function nebel(): Roh {
  return {
    id: "nebel_test",
    name: "Testnebel",
    typ: "deep_sky",
    zustaende: [
      {
        id: "nebel_test_1",
        name: "Testnebel",
        winkelgroesse_arcsec: 600,
        polar_arcsec: 300,
        positionswinkel_grad: 35,
        magnitude: 6.5,
        weiss_mag_arcsec2: 16,
        bild: "nebel_test_bild",
        profil: { art: "king", mu0_mag_arcsec2: 16.5, rc_arcsec: 30, rt_arcsec: 900, quelle: "erfunden" },
        isophoten: [
          { mag_arcsec2: 18.0, flaeche_arcsec2: 100 },
          { mag_arcsec2: 18.1, flaeche_arcsec2: 150 },
          { mag_arcsec2: 18.2, flaeche_arcsec2: 210 }
        ],
        sterne: [{ name: "Zentralstern", dx_arcsec: 0, dy_arcsec: 0, magnitude: 14.5, b_v: -0.3, katalog: "TST 7" }]
      }
    ]
  };
}

function haufen(): Roh {
  return {
    id: "haufen_test",
    name: "Testhaufen",
    typ: "deep_sky",
    zustaende: [
      {
        id: "haufen_test_1",
        name: "Testhaufen",
        winkelgroesse_arcsec: 6000,
        polar_arcsec: 6000,
        positionswinkel_grad: 0,
        magnitude: 2,
        sterne: [
          { name: "S1", dx_arcsec: -4500, dy_arcsec: 1200, magnitude: 3.0, b_v: -0.1 },
          { name: "S2", dx_arcsec: 300, dy_arcsec: -200, magnitude: 5.5, b_v: 0.5 }
        ]
      }
    ]
  };
}

function zustandVon(objekt: Roh): Roh {
  return (objekt["zustaende"] as Roh[])[0]!;
}

/** Bildnachweis eines synthetischen Deep-Sky-Bilds, abgeleitet von einem echten Eintrag (nur Form). */
function nebelBildRoh(): Roh {
  const vorlage = (JSON.parse(JSON.stringify(bilderJson)) as Roh[]).find((n) => n["kacheln"] === undefined)!;
  return {
    ...vorlage,
    id: "nebel_test_bild",
    objekt: "nebel_test",
    zustand: "nebel_test_1",
    datei: "nebel_test/nebel.webp",
    pixel_breite: 400,
    pixel_hoehe: 200,
    winkelgroesse_arcsec: 600,
    objekt_durchmesser_px: 300,
    bogensekunden_pro_pixel: 2,
    datei_bytes: 1000,
    kennlinie: { art: "log", mag_hell: 16, mag_dunkel: 26 }
  };
}

function nebelBild(): Bildnachweis {
  return pruefeBildnachweise([nebelBildRoh()])[0]!;
}

function katalog(...objekte: Roh[]): ReturnType<typeof pruefeObjekte> {
  return pruefeObjekte(objekte);
}

describe("pruefeObjekte Doppelstern", () => {
  it("liest Sterne, Paarnachweis und die Klasse", () => {
    const [o] = katalog(paar());
    expect(o!.typ).toBe("doppelstern");
    expect(o!.klasse).toBe("doppelstern");
    const z = o!.zustaende[0]!;
    expect(z.bild).toBeUndefined();
    expect(z.winkelgroesseArcsec).toBeUndefined();
    expect(z.sterne[0]).toEqual({ name: "A", dxArcsec: -1.5, dyArcsec: 0, magnitude: 4, bv: 1.1, quelleFarbe: "erfunden" });
    expect(z.sterne[1]).toEqual({ name: "B", dxArcsec: 1.5, dyArcsec: 0, magnitude: 6, bv: -0.1 });
    expect(z.katalog).toEqual([
      { wds: "00001+0001", komponenten: "TST 1 AB", trennungArcsec: 3, positionswinkelGrad: 90, epoche: 2027, quelle: "erfunden" }
    ]);
  });

  it("verbietet bild und winkelgroesse_arcsec", () => {
    for (const feld of ["bild", "winkelgroesse_arcsec"]) {
      const roh = paar();
      zustandVon(roh)[feld] = feld === "bild" ? "irgendwas" : 3;
      const f = fehlerVon(() => katalog(roh));
      expect([f.eintrag, f.feld]).toEqual(["testpaar_1", feld]);
    }
  });

  it("verbietet Felder des Sonnensystems wie phase", () => {
    const roh = paar();
    zustandVon(roh)["phase"] = 1;
    expect(fehlerVon(() => katalog(roh)).feld).toBe("phase");
  });

  it("prueft abs(dx_B - dx_A) gegen die Trennung im katalog", () => {
    const roh = paar();
    const sterne = zustandVon(roh)["sterne"] as Roh[];
    sterne[0]!["dx_arcsec"] = -1.6;
    sterne[1]!["dx_arcsec"] = 1.6;
    const f = fehlerVon(() => katalog(roh));
    expect(f.feld).toBe("sterne");
    expect(f.message).toContain("trennung_arcsec");
    // Rundung der Lagen auf 0,001'' wird toleriert.
    const gerundet = paar();
    const s = zustandVon(gerundet)["sterne"] as Roh[];
    s[0]!["dx_arcsec"] = -1.501;
    s[1]!["dx_arcsec"] = 1.5;
    expect(() => katalog(gerundet)).not.toThrow();
  });

  it("verlangt die Lage aus A-Z9: Ost-West und Mitte im Ursprung", () => {
    const schief = paar();
    (zustandVon(schief)["sterne"] as Roh[])[1]!["dy_arcsec"] = 0.5;
    expect(fehlerVon(() => katalog(schief)).message).toContain("Ost-West");
    const versetzt = paar();
    const s = zustandVon(versetzt)["sterne"] as Roh[];
    s[0]!["dx_arcsec"] = 0;
    s[1]!["dx_arcsec"] = 3;
    expect(fehlerVon(() => katalog(versetzt)).message).toContain("Ursprung");
  });

  it("verlangt zwei Sterne, einen Paarnachweis und eine Gesamthelligkeit heller als der hellste Stern", () => {
    const einer = paar();
    (zustandVon(einer)["sterne"] as Roh[]).pop();
    expect(fehlerVon(() => katalog(einer)).feld).toBe("sterne");
    const ohneKatalog = paar();
    zustandVon(ohneKatalog)["katalog"] = [];
    expect(fehlerVon(() => katalog(ohneKatalog)).feld).toBe("katalog");
    const zuSchwach = paar();
    zustandVon(zuSchwach)["magnitude"] = 4.5;
    expect(fehlerVon(() => katalog(zuSchwach)).feld).toBe("magnitude");
  });

  it("prueft WDS-Kennung und Felder des Paarnachweises", () => {
    const roh = paar();
    const p = (zustandVon(roh)["katalog"] as Roh[])[0]!;
    p["wds"] = "TST 1";
    const f = fehlerVon(() => katalog(roh));
    expect([f.eintrag, f.feld]).toEqual(["testpaar_1, katalog[0]", "wds"]);
    const tippfehler = paar();
    (zustandVon(tippfehler)["katalog"] as Roh[])[0]!["trenung_arcsec"] = 3;
    expect(fehlerVon(() => katalog(tippfehler)).feld).toBe("trenung_arcsec");
  });

  it("nennt bv statt b_v beim Namen und begrenzt die Lage auf 7200''", () => {
    const bv = paar();
    const stern = (zustandVon(bv)["sterne"] as Roh[])[0]!;
    stern["bv"] = stern["b_v"];
    delete stern["b_v"];
    const f = fehlerVon(() => katalog(bv));
    expect([f.eintrag, f.feld]).toEqual(["testpaar_1, sterne[0]", "bv"]);
    const weit = haufen();
    (zustandVon(weit)["sterne"] as Roh[])[0]!["dy_arcsec"] = 7200.5;
    expect(fehlerVon(() => katalog(weit)).feld).toBe("dy_arcsec");
    (zustandVon(weit)["sterne"] as Roh[])[0]!["dy_arcsec"] = -7200;
    expect(() => katalog(weit)).not.toThrow();
  });

  it("begrenzt positionswinkel_grad auf [0, 360)", () => {
    const paar360 = paar();
    (zustandVon(paar360)["katalog"] as Roh[])[0]!["positionswinkel_grad"] = 360;
    const f = fehlerVon(() => katalog(paar360));
    expect([f.eintrag, f.feld]).toEqual(["testpaar_1, katalog[0]", "positionswinkel_grad"]);
    const nebel360 = nebel();
    zustandVon(nebel360)["positionswinkel_grad"] = 360;
    expect(fehlerVon(() => katalog(nebel360)).feld).toBe("positionswinkel_grad");
    zustandVon(nebel360)["positionswinkel_grad"] = 359.9;
    expect(() => katalog(nebel360)).not.toThrow();
  });

  it("noch nicht geprueft: Lage und Trennung bei mehr als zwei Sternen (Epsilon Lyrae, Entscheidung offen)", () => {
    // Vier Sterne mit drei Paarnachweisen; die Trennungen passen absichtlich zu keinem Sternabstand.
    // Wird die Paarpruefung fuer Mehrfachsterne eingefuehrt, muss dieser Test einen DatenFehler erwarten.
    const roh = paar();
    const z = zustandVon(roh);
    z["sterne"] = [
      { name: "A", dx_arcsec: -105, dy_arcsec: 0, magnitude: 5, b_v: 0.1 },
      { name: "B", dx_arcsec: -103, dy_arcsec: 1, magnitude: 6, b_v: 0.3 },
      { name: "C", dx_arcsec: 103, dy_arcsec: 0, magnitude: 5.2, b_v: 0.2 },
      { name: "D", dx_arcsec: 106, dy_arcsec: 0, magnitude: 5.4, b_v: 0.2 }
    ];
    const p = (z["katalog"] as Roh[])[0]!;
    z["katalog"] = [p, { ...p, trennung_arcsec: 7 }, { ...p, trennung_arcsec: 500 }];
    z["magnitude"] = 4;
    expect(() => katalog(roh)).not.toThrow();
  });

  it("reserviert die Kennung frei fuer das freie Paar", () => {
    const roh = paar();
    zustandVon(roh)["id"] = "frei";
    expect(fehlerVon(() => katalog(roh)).eintrag).toBe("frei");
  });
});

describe("pruefeObjekte Deep-Sky", () => {
  it("liest Achsen, Positionswinkel, Profil, Isophoten und Sterne", () => {
    const [o] = katalog(nebel());
    expect(o!.klasse).toBe("deep_sky");
    const z = o!.zustaende[0]!;
    expect([z.winkelgroesseArcsec, z.polarArcsec, z.positionswinkelGrad, z.weissMagProArcsec2, z.bild]).toEqual([600, 300, 35, 16, "nebel_test_bild"]);
    expect(z.profil).toEqual({ art: "king", werte: { mu0_mag_arcsec2: 16.5, rc_arcsec: 30, rt_arcsec: 900 }, quelle: "erfunden" });
    expect(z.isophoten).toEqual([
      { magProArcsec2: 18, flaecheArcsec2: 100 },
      { magProArcsec2: 18.1, flaecheArcsec2: 150 },
      { magProArcsec2: 18.2, flaecheArcsec2: 210 }
    ]);
    expect(z.sterne).toEqual([{ name: "Zentralstern", dxArcsec: 0, dyArcsec: 0, magnitude: 14.5, bv: -0.3, katalog: "TST 7" }]);
    expect(z.trabanten).toEqual([]);
  });

  it("erlaubt Winkelgroessen bis 5 Grad (M31-gross), ueber der Grenze des Sonnensystems", () => {
    const roh = nebel();
    zustandVon(roh)["winkelgroesse_arcsec"] = 11400;
    expect(katalog(roh)[0]!.zustaende[0]!.winkelgroesseArcsec).toBe(11400);
    zustandVon(roh)["winkelgroesse_arcsec"] = 18001;
    expect(fehlerVon(() => katalog(roh)).feld).toBe("winkelgroesse_arcsec");
  });

  it("verlangt mit Bild isophoten und weiss_mag_arcsec2", () => {
    for (const feld of ["isophoten", "weiss_mag_arcsec2"]) {
      const roh = nebel();
      delete zustandVon(roh)[feld];
      expect(fehlerVon(() => katalog(roh)).feld).toBe(feld);
    }
  });

  it("verlangt mag streng aufsteigend und Flaeche streng steigend", () => {
    const mag = nebel();
    (zustandVon(mag)["isophoten"] as Roh[])[2]!["mag_arcsec2"] = 18.1;
    const f = fehlerVon(() => katalog(mag));
    expect([f.eintrag, f.feld]).toEqual(["nebel_test_1, isophoten[2]", "mag_arcsec2"]);
    const flaeche = nebel();
    (zustandVon(flaeche)["isophoten"] as Roh[])[1]!["flaeche_arcsec2"] = 100;
    expect(fehlerVon(() => katalog(flaeche)).feld).toBe("flaeche_arcsec2");
    const null_ = nebel();
    (zustandVon(null_)["isophoten"] as Roh[])[0]!["flaeche_arcsec2"] = 0;
    expect(fehlerVon(() => katalog(null_)).eintrag).toBe("nebel_test_1, isophoten[0]");
    const kurz = nebel();
    zustandVon(kurz)["isophoten"] = [{ mag_arcsec2: 18, flaeche_arcsec2: 1 }];
    expect(fehlerVon(() => katalog(kurz)).feld).toBe("isophoten");
  });

  it("ohne Bild: keine isophoten, kein Quellweiss, aber Sterne", () => {
    const [o] = katalog(haufen());
    expect(o!.zustaende[0]!.bild).toBeUndefined();
    expect(o!.zustaende[0]!.isophoten).toBeUndefined();
    for (const [feld, wert] of [["isophoten", [{ mag_arcsec2: 18, flaeche_arcsec2: 1 }]], ["weiss_mag_arcsec2", 16]] as const) {
      const roh = haufen();
      zustandVon(roh)[feld] = wert;
      expect(fehlerVon(() => katalog(roh)).feld).toBe(feld);
    }
    const leer = haufen();
    zustandVon(leer)["sterne"] = [];
    expect(fehlerVon(() => katalog(leer)).feld).toBe("sterne");
  });

  it("prueft das Profil je art", () => {
    const sersic = nebel();
    zustandVon(sersic)["profil"] = { art: "sersic_exp", n: 4, re_arcsec: 600 };
    expect(fehlerVon(() => katalog(sersic)).feld).toBe("mue_mag_arcsec2");
    const unbekannt = nebel();
    zustandVon(unbekannt)["profil"] = { art: "gauss" };
    expect(fehlerVon(() => katalog(unbekannt)).feld).toBe("art");
    const keins = nebel();
    zustandVon(keins)["profil"] = { art: "keins" };
    expect(katalog(keins)[0]!.zustaende[0]!.profil).toEqual({ art: "keins", werte: {} });
    const fremd = nebel();
    zustandVon(fremd)["profil"] = { art: "keins", rc_arcsec: 3 };
    expect(fehlerVon(() => katalog(fremd)).feld).toBe("rc_arcsec");
  });

  it("verweist mit sterne_datei auf daten/sterne/, nicht zugleich mit sterne", () => {
    const roh = haufen();
    delete zustandVon(roh)["sterne"];
    zustandVon(roh)["sterne_datei"] = "haufen_test.json";
    const z = katalog(roh)[0]!.zustaende[0]!;
    expect(z.sterneDatei).toBe("haufen_test.json");
    expect(z.sterne).toEqual([]);
    const beides = haufen();
    zustandVon(beides)["sterne_datei"] = "haufen_test.json";
    expect(fehlerVon(() => katalog(beides)).feld).toBe("sterne");
    for (const pfad of ["../geraete.json", "/abs.json", "sterne/x.json", "x.txt"]) {
      const kaputt = haufen();
      delete zustandVon(kaputt)["sterne"];
      zustandVon(kaputt)["sterne_datei"] = pfad;
      expect(fehlerVon(() => katalog(kaputt)).feld).toBe("sterne_datei");
    }
  });

  it("verbietet Trabanten und Paarnachweise bei Deep-Sky", () => {
    for (const feld of ["trabanten", "katalog"]) {
      const roh = nebel();
      zustandVon(roh)[feld] = [];
      expect(fehlerVon(() => katalog(roh)).feld).toBe(feld);
    }
  });
});

describe("pruefeObjekte Magnitude je Klasse", () => {
  it("meldet beim Sonnensystem die Grenze -15 bis 10, bei Deep-Sky -15 bis 25", () => {
    const planet = {
      id: "testplanet", name: "Testplanet", typ: "planet",
      zustaende: [
        {
          id: "testplanet_1", name: "Testplanet", winkelgroesse_arcsec: 10, polar_arcsec: 10, phase: 1, phasenwinkel_grad: 0,
          magnitude: 30, weiss_mag_arcsec2: 3, entfernung_au: 1, bild: "testplanet_bild"
        }
      ]
    };
    const f = fehlerVon(() => katalog(planet));
    expect(f.feld).toBe("magnitude");
    expect(f.message).toContain("-15 bis 10");
    const tief = nebel();
    zustandVon(tief)["magnitude"] = 24;
    expect(() => katalog(tief)).not.toThrow();
    zustandVon(tief)["magnitude"] = 30;
    expect(fehlerVon(() => katalog(tief)).message).toContain("-15 bis 25");
  });
});

describe("pruefeVerweise mit Kennlinie", () => {
  it("akzeptiert ein Deep-Sky-Bild mit log-Kennlinie und mag_hell = Quellweiss", () => {
    expect(() => pruefeVerweise(katalog(nebel(), haufen(), paar()), [nebelBild()])).not.toThrow();
  });

  it("verlangt die Kennlinie bei Deep-Sky", () => {
    const ohne = { ...nebelBild(), kennlinie: undefined };
    const f = fehlerVon(() => pruefeVerweise(katalog(nebel()), [ohne]));
    expect([f.datei, f.feld]).toEqual(["bilder.json", "kennlinie"]);
  });

  it("verlangt weiss_mag_arcsec2 gleich mag_hell", () => {
    const roh = nebel();
    zustandVon(roh)["weiss_mag_arcsec2"] = 16.1;
    const f = fehlerVon(() => pruefeVerweise(katalog(roh), [nebelBild()]));
    expect([f.datei, f.eintrag, f.feld]).toEqual(["objekte.json", "nebel_test_1", "weiss_mag_arcsec2"]);
  });

  it("verlangt Isophoten im Umfang der Kennlinie", () => {
    const roh = nebel();
    (zustandVon(roh)["isophoten"] as Roh[])[2]!["mag_arcsec2"] = 26.1;
    expect(fehlerVon(() => pruefeVerweise(katalog(roh), [nebelBild()])).eintrag).toBe("nebel_test_1, isophoten[2]");
  });

  it("verbietet die Kennlinie bei Bildern des Sonnensystems", () => {
    const echt = pruefeBildnachweise(bilderJson);
    const planet: Bildnachweis = { ...echt.find((n) => n.kacheln === undefined)!, id: "testplanet_bild", objekt: "testplanet", zustand: "testplanet_1" };
    const objekt = {
      id: planet.objekt,
      name: "Testplanet",
      typ: "planet",
      zustaende: [
        {
          id: planet.zustand, name: "Testplanet", winkelgroesse_arcsec: 10, polar_arcsec: 10, phase: 1, phasenwinkel_grad: 0,
          magnitude: 0, weiss_mag_arcsec2: 3, entfernung_au: 1, bild: planet.id
        }
      ]
    };
    expect(() => pruefeVerweise(katalog(objekt), [planet])).not.toThrow();
    const mitKennlinie: Bildnachweis = { ...planet, kennlinie: { art: "log", magHell: 3, magDunkel: 15 } };
    expect(fehlerVon(() => pruefeVerweise(katalog(objekt), [mitKennlinie])).feld).toBe("kennlinie");
  });
});

describe("objektzustand je Klasse", () => {
  const objekte = katalog(paar(), nebel(), haufen());
  const nachweise = [nebelBild()];

  it("Doppelstern: Sterne ohne Nachweisfelder, groesster Abstand, ohne quelle", () => {
    const z = objektzustand(objekte, nachweise, "testpaar_1")!;
    expect(z.klasse).toBe("doppelstern");
    expect(z.durchmesserArcsec).toBe(3);
    expect(z.magnitude).toBe(3.84);
    expect(z.quelle).toBeUndefined();
    expect(z.isophoten).toBeUndefined();
    expect(z.trabanten).toEqual([]);
    expect(z.sterne).toEqual([
      { name: "A", dxArcsec: -1.5, dyArcsec: 0, magnitude: 4, bv: 1.1 },
      { name: "B", dxArcsec: 1.5, dyArcsec: 0, magnitude: 6, bv: -0.1 }
    ]);
    expect(structuredClone(z)).toEqual(z);
  });

  it("Deep-Sky mit Bild: quelle, isophoten und Sterne", () => {
    const z = objektzustand(objekte, nachweise, "nebel_test_1")!;
    expect(z.klasse).toBe("deep_sky");
    expect(z.durchmesserArcsec).toBe(600);
    expect(z.quelle).toEqual({ breitePx: 400, hoehePx: 200, massstabArcsecProPx: 2, weissMagProArcsec2: 16 });
    expect(z.isophoten).toEqual([
      { magProArcsec2: 18, flaecheArcsec2: 100 },
      { magProArcsec2: 18.1, flaecheArcsec2: 150 },
      { magProArcsec2: 18.2, flaecheArcsec2: 210 }
    ]);
    expect(z.sterne).toEqual([{ name: "Zentralstern", dxArcsec: 0, dyArcsec: 0, magnitude: 14.5, bv: -0.3 }]);
    // Kopie: Aenderungen am Objektzustand erreichen den Katalog nicht.
    z.isophoten![0]!.flaecheArcsec2 = -1;
    expect(objekte[1]!.zustaende[0]!.isophoten![0]!.flaecheArcsec2).toBe(100);
  });

  it("Deep-Sky ohne Bild: weder quelle noch isophoten", () => {
    const z = objektzustand(objekte, nachweise, "haufen_test_1")!;
    expect(z.klasse).toBe("deep_sky");
    expect(z.durchmesserArcsec).toBe(6000);
    expect(z.quelle).toBeUndefined();
    expect(z.isophoten).toBeUndefined();
    expect(z.sterne.map((s) => s.name)).toEqual(["S1", "S2"]);
  });
});

describe("Sternlisten unter daten/sterne/", () => {
  const liste = {
    objekt: "haufen_test",
    quelle: "erfunden",
    lizenz: "CC0",
    kommentar: "synthetisch",
    sterne: [{ name: "TST 1", dx_arcsec: 10, dy_arcsec: -20, magnitude: 12, b_v: 0.8, katalog: "TST 1" }]
  };

  it("pruefeSternliste liest die Sterne und prueft den Nachweis", () => {
    expect(pruefeSternliste(liste, "haufen_test.json", "haufen_test")).toEqual([
      { name: "TST 1", dxArcsec: 10, dyArcsec: -20, magnitude: 12, bv: 0.8, katalog: "TST 1" }
    ]);
    const f = fehlerVon(() => pruefeSternliste(liste, "haufen_test.json", "anderes"));
    expect([f.datei, f.feld]).toEqual(["sterne/haufen_test.json", "objekt"]);
    const { lizenz: _l, ...ohneLizenz } = liste;
    expect(fehlerVon(() => pruefeSternliste(ohneLizenz, "haufen_test.json", "haufen_test")).feld).toBe("lizenz");
    expect(fehlerVon(() => pruefeSternliste({ ...liste, sterne: [] }, "haufen_test.json", "haufen_test")).feld).toBe("sterne");
    const kaputt = { ...liste, sterne: [{ ...liste.sterne[0], dx_arcsec: 8000 }] };
    const g = fehlerVon(() => pruefeSternliste(kaputt, "haufen_test.json", "haufen_test"));
    expect([g.datei, g.eintrag, g.feld]).toEqual(["sterne/haufen_test.json", "haufen_test, sterne[0]", "dx_arcsec"]);
  });

  describe("Laden per fetch", () => {
    afterEach(() => vi.unstubAllGlobals());

    function mitDatei(): Roh {
      const roh = haufen();
      delete zustandVon(roh)["sterne"];
      zustandVon(roh)["sterne_datei"] = "haufen_test.json";
      return roh;
    }

    function stubFetch(antworten: Record<string, unknown>): string[] {
      const urls: string[] = [];
      vi.stubGlobal("fetch", async (url: string) => {
        urls.push(url);
        const name = Object.keys(antworten).find((d) => url === import.meta.env.BASE_URL + "daten/" + d);
        return name === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(antworten[name]));
      });
      return urls;
    }

    it("ladeObjekte fuellt die Sterne aus daten/sterne/ ueber BASE_URL", async () => {
      const urls = stubFetch({ "objekte.json": [mitDatei(), paar()], "sterne/haufen_test.json": liste });
      const objekte = await ladeObjekte([]);
      expect(urls).toEqual([import.meta.env.BASE_URL + "daten/objekte.json", import.meta.env.BASE_URL + "daten/sterne/haufen_test.json"]);
      expect(objektzustand(objekte, [], "haufen_test_1")!.sterne).toEqual([{ name: "TST 1", dxArcsec: 10, dyArcsec: -20, magnitude: 12, bv: 0.8 }]);
    });

    it("meldet eine fehlende Sternliste als DatenFehler", async () => {
      stubFetch({});
      const objekte = katalog(mitDatei());
      await expect(ladeSterne(objekte)).rejects.toThrow(DatenFehler);
      await expect(ladeSterne(objekte)).rejects.toThrow("HTTP 404");
    });
  });
});
