import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { type Bildnachweis, type Objekt, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise, type ZustandEintrag } from "../daten";
import type { Fernglas, Fernrohr, Konfiguration, Paareingaben } from "../naht/konfiguration";
import { begrenze, freiesPaar, GRENZEN } from "../physik";
import type { Kataloge } from "./kataloge";
import { ausUrl, inUrl, listeneintragZu, PARAMETER } from "./url";
import { PAAR_VORGABE, voreinstellung } from "./voreinstellung";

// Echte Kataloge aus daten/ (heute nur der Mond) und ein synthetischer mit allen vier Objekten
// und den Zustands-ids aus docs/recherche/objekte.md 6.1.
const nachweiseEcht = pruefeBildnachweise(bilderJson);
const objekteEcht = pruefeObjekte(objekteJson);
pruefeVerweise(objekteEcht, nachweiseEcht);
const ECHT: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte: objekteEcht, nachweise: nachweiseEcht };

const mondNachweis = nachweiseEcht[0]!;
const mondZustand = objekteEcht[0]!.zustaende[0]!;

function zustand(id: string, winkel: number, mag: number, trabanten: ZustandEintrag["trabanten"] = []): ZustandEintrag {
  return { ...mondZustand, id, name: id, winkelgroesseArcsec: winkel, polarArcsec: winkel, magnitude: mag, bild: `bild_${id}`, trabanten };
}

function planet(id: string, zustaende: ZustandEintrag[]): Objekt {
  return { id, name: id, typ: "planet", klasse: "sonnensystem", zustaende };
}

const PLANETEN: Objekt[] = [
  planet("mars", [zustand("mars_6", 6, 1), zustand("mars_14", 14, -1.4), zustand("mars_25", 25, -3)]),
  planet("jupiter", [
    zustand("jup_35", 35, -2),
    zustand("jup_47", 47, -2.7, [
      { name: "Io", dxArcsec: -110, dyArcsec: 2.9, durchmesserArcsec: 1.2, magnitude: 5 },
      { name: "Kallisto", dxArcsec: -520, dyArcsec: -11.7, durchmesserArcsec: 1.58, magnitude: 5.7 }
    ])
  ]),
  planet("saturn", [
    zustand("sat_16", 16, 0.7),
    zustand("sat_20", 20, 0, [{ name: "Titan", dxArcsec: 150, dyArcsec: -35, durchmesserArcsec: 0.85, magnitude: 8.3 }])
  ])
];

const SYNTHETISCH: Kataloge = {
  geraete: ECHT.geraete,
  objekte: [...objekteEcht.filter((o) => o.id === "mond"), ...PLANETEN],
  nachweise: [
    ...nachweiseEcht.filter((n) => n.objekt === "mond"),
    ...PLANETEN.flatMap((o) =>
      o.zustaende.map((z): Bildnachweis => ({ ...mondNachweis, id: z.bild!, objekt: o.id, zustand: z.id, kacheln: undefined, pixelBreite: 1000, pixelHoehe: 800, objektDurchmesserPx: 500 }))
    )
  ]
};

const START = voreinstellung(ECHT);

/** Nur die Konfiguration aus ausUrl. */
function aus(search: string, kataloge: Kataloge = ECHT): Konfiguration {
  return ausUrl(search, kataloge).konfiguration;
}

function rundreise(k: Konfiguration, kataloge: Kataloge = ECHT): Konfiguration {
  return aus(inUrl(k, kataloge), kataloge);
}

function mitGeraet(geraet: Konfiguration["geraet"]): Konfiguration {
  return { ...START, geraet };
}

function parameter(k: Konfiguration, kataloge: Kataloge = ECHT): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(inUrl(k, kataloge)));
}

const FREIES_FERNROHR: Fernrohr = {
  art: "fernrohr",
  oeffnungMm: 133,
  brennweiteMm: 987,
  obstruktion: 0.271,
  bauart: "maksutov",
  okular: { brennweiteMm: 7.3, scheinbaresGesichtsfeldGrad: 82 }
};

const FREIES_FERNGLAS: Fernglas = { art: "fernglas", oeffnungMm: 56, vergroesserung: 12, wahresGesichtsfeldGrad: 5.4 };

describe("inUrl", () => {
  it("schreibt die Voreinstellung kurz mit Version und Listen-id", () => {
    expect(inUrl(START, ECHT)).toBe("?v=1&g=refraktor-80-600-ed&ok=10&sg=50&z=mond_ev&s=2&b=5&t=klar&h=45");
  });

  it("schreibt ein freies Fernrohr als Zahlen, Obstruktion als Verhaeltnis", () => {
    const p = parameter(mitGeraet(FREIES_FERNROHR));
    expect(p).toMatchObject({ a: "fernrohr", ba: "maksutov", d: "133", f: "987", o: "0.271", ok: "7.3", sg: "82" });
    expect(p[PARAMETER.geraet]).toBeUndefined();
  });

  it("schreibt Fernglas und Auge ohne Okular", () => {
    const glas = parameter(mitGeraet(FREIES_FERNGLAS));
    expect(glas).toMatchObject({ a: "fernglas", d: "56", vg: "12", wg: "5.4" });
    expect(glas["ok"]).toBeUndefined();
    const auge = parameter(mitGeraet({ art: "auge" }));
    expect(auge["g"]).toBe("auge");
    expect(auge["ok"]).toBeUndefined();
    expect(auge["sg"]).toBeUndefined();
  });

  it("erkennt ein Listengeraet an den Werten ohne Okular", () => {
    const eintrag = ECHT.geraete.find((e) => e.id === "newton-130-650")!;
    const g = { ...(eintrag.geraet as Omit<Fernrohr, "okular">), okular: { brennweiteMm: 25, scheinbaresGesichtsfeldGrad: 52 } };
    expect(parameter(mitGeraet(g))["g"]).toBe("newton-130-650");
    // Ein Wert anders: freies Geraet.
    expect(parameter(mitGeraet({ ...g, obstruktion: 0.3 }))["a"]).toBe("fernrohr");
  });

  it("schreibt eine nicht begrenzte Konfiguration begrenzt, Rundreise gleich begrenze(k)", () => {
    const k: Konfiguration = { ...START, geraet: { ...FREIES_FERNROHR, oeffnungMm: 500, obstruktion: 0.7 }, bedingungen: { ...START.bedingungen, hoeheGrad: 0, bortle: 7.4 } };
    expect(parameter(k)).toMatchObject({ d: "300", o: "0.5", h: "10", b: "7" });
    expect(rundreise(k)).toEqual(begrenze(k).konfiguration);
  });
});

describe("ausUrl(inUrl(k)) ist k", () => {
  it("fuer die Voreinstellung", () => {
    expect(rundreise(START)).toEqual(START);
  });

  it("fuer jedes Geraet der echten Liste", () => {
    for (const eintrag of ECHT.geraete) {
      const k = mitGeraet({ ...eintrag.geraet, ...(eintrag.geraet.art === "fernrohr" ? { okular: { brennweiteMm: 6, scheinbaresGesichtsfeldGrad: 68 } } : {}) } as Konfiguration["geraet"]);
      expect(rundreise(k), eintrag.id).toEqual(k);
    }
  });

  it("fuer freie Geraete", () => {
    for (const g of [FREIES_FERNROHR, FREIES_FERNGLAS]) {
      const k = mitGeraet(g);
      expect(rundreise(k)).toEqual(k);
    }
  });

  it("fuer alle vier Objekte und alle Zustaende (synthetischer Katalog)", () => {
    const ids = SYNTHETISCH.objekte.flatMap((o) => o.zustaende.map((z) => z.id));
    // Mondphasen aus Issue #36: drei Zustaende hinter mond_ev, alte Links mit z=mond_ev bleiben gueltig.
    expect(ids).toEqual(["mond_ev", "mond_sichel", "mond_voll", "mond_lv", "mars_6", "mars_14", "mars_25", "jup_35", "jup_47", "sat_16", "sat_20"]);
    for (const id of ids) {
      const k = aus(`?z=${id}`, SYNTHETISCH);
      expect(k.objekt.kennung).toBe(id);
      expect(rundreise(k, SYNTHETISCH)).toEqual(k);
    }
    expect(aus("?z=jup_47", SYNTHETISCH).objekt.trabanten).toHaveLength(2);
  });

  it("fuer Randwerte A-F8, A-B1, A-B2, A-B4 und alle Transparenzen", () => {
    const fernrohre: Fernrohr[] = [
      { ...FREIES_FERNROHR, oeffnungMm: GRENZEN.oeffnungMm.min, brennweiteMm: GRENZEN.brennweiteMm.min, obstruktion: 0, okular: { brennweiteMm: 2, scheinbaresGesichtsfeldGrad: 40 } },
      { ...FREIES_FERNROHR, oeffnungMm: GRENZEN.oeffnungMm.max, brennweiteMm: GRENZEN.brennweiteMm.max, obstruktion: 0.5, okular: { brennweiteMm: 50, scheinbaresGesichtsfeldGrad: 100 } }
    ];
    const bedingungen: Konfiguration["bedingungen"][] = [
      { seeingFwhmArcsec: 0.5, bortle: 1, transparenz: "klar", hoeheGrad: 10 },
      { seeingFwhmArcsec: 5, bortle: 9, transparenz: "leicht-diesig", hoeheGrad: 90 },
      { seeingFwhmArcsec: 1 / 3, bortle: 3, transparenz: "diesig", hoeheGrad: 33.333333333333336 }
    ];
    for (const geraet of [...fernrohre, { ...FREIES_FERNGLAS, vergroesserung: 1, wahresGesichtsfeldGrad: 1 }]) {
      for (const b of bedingungen) {
        const k = begrenze({ ...START, geraet, bedingungen: b }).konfiguration;
        expect(rundreise(k)).toEqual(k);
      }
    }
  });

  it("gibt frische Objekte zurueck", () => {
    const k = rundreise(START);
    expect(k.geraet).not.toBe(START.geraet);
    expect(k.objekt).not.toBe(START.objekt);
  });
});

describe("ausUrl: Begrenzung und Rueckfall", () => {
  it("meldet je Schnitt einen Hinweis von begrenze, beim Rueckfall keinen", () => {
    // d gilt nur fuer ein freies Geraet und wird hier nicht gelesen.
    expect(ausUrl("?d=1000", ECHT).hinweise).toEqual([]);
    const { hinweise } = ausUrl("?a=fernrohr&d=1000&s=0.1", ECHT);
    expect(hinweise).toEqual([
      { feld: "geraet.oeffnungMm", eingabe: 1000, wert: 300 },
      { feld: "bedingungen.seeingFwhmArcsec", eingabe: 0.1, wert: 0.5 }
    ]);
    expect(ausUrl("?z=pluto&s=abc", ECHT).hinweise).toEqual([]);
  });

  it("reicht Unendlich (1e400) an begrenze weiter", () => {
    const { konfiguration, hinweise } = ausUrl("?a=fernrohr&d=1e400&h=-1e400", ECHT);
    expect((konfiguration.geraet as Fernrohr).oeffnungMm).toBe(300);
    expect(konfiguration.bedingungen.hoeheGrad).toBe(10);
    expect(hinweise).toEqual([
      { feld: "geraet.oeffnungMm", eingabe: Infinity, wert: 300 },
      { feld: "bedingungen.hoeheGrad", eingabe: -Infinity, wert: 10 }
    ]);
  });

  it("schneidet Vergroesserung und Gesichtsfeld eines Fernglases (vg=1e400, wg=1e400) auf 1000 und 30 Grad", () => {
    const { konfiguration, hinweise } = ausUrl("?a=fernglas&d=50&vg=1e400&wg=1e400", ECHT);
    expect(konfiguration.geraet).toEqual({ art: "fernglas", oeffnungMm: 50, vergroesserung: 1000, wahresGesichtsfeldGrad: 30 });
    expect(hinweise).toEqual([
      { feld: "geraet.vergroesserung", eingabe: Infinity, wert: 1000 },
      { feld: "geraet.wahresGesichtsfeldGrad", eingabe: Infinity, wert: 30 }
    ]);
  });

  it("schneidet Werte ausserhalb A-F8 ueber begrenze", () => {
    const k = aus("?a=fernrohr&ba=newton&d=1000&f=50&o=50&ok=1&sg=120&s=9&b=12&h=-5", ECHT);
    expect(k.geraet).toEqual({ art: "fernrohr", bauart: "newton", oeffnungMm: 300, brennweiteMm: 200, obstruktion: 0.5, okular: { brennweiteMm: 2, scheinbaresGesichtsfeldGrad: 100 } });
    expect(k.bedingungen).toEqual({ seeingFwhmArcsec: 5, bortle: 9, transparenz: "klar", hoeheGrad: 10 });
    expect(rundreise(k)).toEqual(k);
  });

  it("rundet die Bortle-Stufe", () => {
    expect(aus("?b=3.6", ECHT).bedingungen.bortle).toBe(4);
  });

  it("rundet Zwischenwerte aufs Raster der Felder ohne Hinweis (s=1.25&h=45.5&b=4.6)", () => {
    const { konfiguration, hinweise } = ausUrl("?s=1.25&h=45.5&b=4.6", ECHT);
    expect(hinweise).toEqual([]);
    expect(konfiguration.bedingungen).toMatchObject({ seeingFwhmArcsec: 1.3, hoeheGrad: 45, bortle: 5 });
  });

  it("liefert die Voreinstellung fuer eine leere oder unsinnige URL", () => {
    for (const search of ["", "?", "?v=1", "?x=1&y", "?v=99", "?%%%"]) {
      expect(aus(search, ECHT), search).toEqual(START);
    }
  });

  it("faellt fuer unlesbare Parameter einzeln zurueck", () => {
    const k = aus("?g=refraktor-80-600-ed&ok=abc&sg=68&z=pluto&s=NaN&b=&t=neblig&h=", ECHT);
    expect(k.geraet).toEqual({ ...(START.geraet as Fernrohr), okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 68 } });
    expect(k.objekt).toEqual(START.objekt);
    expect(k.bedingungen).toEqual(START.bedingungen);
  });

  it("nimmt bei unbekannter Geraete-id das Startgeraet, behaelt aber das Okular", () => {
    const k = aus("?g=gibt-es-nicht&ok=25", ECHT);
    expect(k.geraet).toEqual({ ...(START.geraet as Fernrohr), okular: { brennweiteMm: 25, scheinbaresGesichtsfeldGrad: 50 } });
  });

  it("ignoriert das Okular bei Fernglas und Auge", () => {
    expect(aus("?g=fernglas-10x50&ok=4&sg=82", ECHT).geraet).toEqual({ art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 });
    expect(aus("?g=auge&ok=4", ECHT).geraet).toEqual({ art: "auge" });
  });

  it("ergaenzt ein unvollstaendiges freies Fernrohr aus Startgeraet und Obstruktionsvorschlag", () => {
    expect(aus("?a=fernrohr&ba=schmidt-cassegrain&d=200", ECHT).geraet).toEqual({
      art: "fernrohr", bauart: "schmidt-cassegrain", oeffnungMm: 200, brennweiteMm: 600, obstruktion: 0.34, okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
    });
    expect((aus("?a=fernrohr&ba=kaputt&o=x", ECHT).geraet as Fernrohr)).toMatchObject({ bauart: "refraktor", oeffnungMm: 80, obstruktion: 0 });
  });

  it("ergaenzt ein unvollstaendiges freies Fernglas aus dem ersten Fernglas der Liste", () => {
    expect(aus("?a=fernglas&vg=20", ECHT).geraet).toEqual({ art: "fernglas", oeffnungMm: 42, vergroesserung: 20, wahresGesichtsfeldGrad: 7.2 });
    const ohneGlaeser: Kataloge = { ...ECHT, geraete: ECHT.geraete.filter((e) => e.geraet.art !== "fernglas") };
    expect(aus("?a=fernglas&vg=20", ohneGlaeser).geraet).toEqual(START.geraet);
  });

  it("bevorzugt eine bekannte Listen-id vor freien Zahlen", () => {
    expect(aus("?g=auge&a=fernrohr&d=200", ECHT).geraet).toEqual({ art: "auge" });
  });

  it("liest den Suchteil auch ohne fuehrendes Fragezeichen", () => {
    expect(aus(inUrl(START, ECHT).slice(1), ECHT)).toEqual(START);
  });
});

describe("listeneintragZu (Issue #63, gemeinsam mit ui/geraetewahl.ts)", () => {
  it("findet jedes Listengeraet mit beliebigem Okular wieder, und inUrl schreibt genau diese id", () => {
    for (const eintrag of ECHT.geraete) {
      for (const okular of [{ brennweiteMm: 25, scheinbaresGesichtsfeldGrad: 52 }, { brennweiteMm: 6.67, scheinbaresGesichtsfeldGrad: 82 }]) {
        const geraet = "okular" in eintrag.geraet || eintrag.geraet.art === "fernrohr" ? { ...(eintrag.geraet as Omit<Fernrohr, "okular">), okular } : eintrag.geraet;
        expect(listeneintragZu(ECHT.geraete, geraet as Konfiguration["geraet"])?.id).toBe(eintrag.id);
        expect(parameter(mitGeraet(geraet as Konfiguration["geraet"]))["g"]).toBe(eintrag.id);
      }
    }
  });
  it("ein abweichender Wert ergibt keinen Eintrag", () => {
    expect(listeneintragZu(ECHT.geraete, FREIES_FERNROHR)).toBeUndefined();
    expect(listeneintragZu(ECHT.geraete, FREIES_FERNGLAS)).toBeUndefined();
  });
});

describe("Links aus Version 1 (v=1 bleibt)", () => {
  // Suchteile, wie Version 1 sie geschrieben hat (Voreinstellung, T1 bis T6 aus docs/validierung.md,
  // Listengeraete, freies Fernrohr und Fernglas). Sie muessen dieselbe Konfiguration ergeben und
  // von inUrl Zeichen fuer Zeichen gleich zurueckgeschrieben werden.
  const LINKS_V1 = [
    "?v=1&g=refraktor-80-600-ed&ok=10&sg=50&z=mond_ev&s=2&b=5&t=klar&h=45",
    "?v=1&a=fernrohr&ba=refraktor&d=70&f=700&o=0&ok=7&sg=50&z=jup_47&s=2&b=5&t=klar&h=90",
    "?v=1&a=fernrohr&ba=refraktor&d=100&f=1200&o=0&ok=8&sg=50&z=sat_20&s=1.5&b=5&t=klar&h=90",
    "?v=1&a=fernrohr&ba=refraktor&d=80&f=960&o=0&ok=8&sg=50&z=mars_6&s=1.5&b=5&t=klar&h=90",
    "?v=1&g=auge&z=mond_ev&s=2&b=5&t=klar&h=90",
    "?v=1&g=fernglas-10x50&z=jup_47&s=2&b=5&t=diesig&h=30",
    "?v=1&g=newton-200-1200&ok=6&sg=82&z=sat_16&s=0.8&b=3&t=leicht-diesig&h=60",
    "?v=1&a=fernrohr&ba=maksutov&d=133&f=987&o=0.271&ok=7.3&sg=82&z=mars_14&s=2&b=5&t=klar&h=45",
    "?v=1&a=fernglas&d=56&vg=12&wg=5.4&z=jup_35&s=2&b=5&t=klar&h=45"
  ];

  it("ergeben eine Konfiguration ohne Hinweise, und inUrl schreibt sie unveraendert zurueck", () => {
    for (const link of LINKS_V1) {
      const { konfiguration, hinweise } = ausUrl(link, ECHT);
      expect(hinweise, link).toEqual([]);
      expect(konfiguration.objekt.paar, link).toBeUndefined();
      expect(inUrl(konfiguration, ECHT), link).toBe(link);
    }
  });

  it("die Voreinstellung als Link aus Version 1 ist die Voreinstellung", () => {
    expect(aus(LINKS_V1[0]!)).toEqual(START);
  });

  it("ohne v und mit fremder Version wie Version 1", () => {
    expect(aus(LINKS_V1[1]!.replace("v=1&", ""))).toEqual(aus(LINKS_V1[1]!));
    expect(aus(LINKS_V1[1]!.replace("v=1", "v=7"))).toEqual(aus(LINKS_V1[1]!));
  });
});

describe("Doppelsterne und freies Paar in der URL (A-D18, A-Z9)", () => {
  function mitPaar(teil: Partial<Paareingaben> = {}): Konfiguration {
    return { ...START, objekt: freiesPaar({ ...PAAR_VORGABE, ...teil }) };
  }

  it("schreibt einen Doppelstern der Liste als Zustands-id und liest ihn zurueck", () => {
    for (const id of ["albireo_2025", "eps_lyr_2027", "m45"]) {
      const k = { ...START, objekt: aus(`?z=${id}`).objekt };
      expect(k.objekt.kennung).toBe(id);
      expect(parameter(k)["z"]).toBe(id);
      expect(parameter(k)["tr"]).toBeUndefined();
      expect(rundreise(k)).toEqual(k);
    }
  });

  it("schreibt das freie Paar als z=frei mit tr, ma, mb, bva, bvb", () => {
    expect(inUrl(mitPaar(), ECHT)).toBe("?v=1&g=refraktor-80-600-ed&ok=10&sg=50&z=frei&tr=2&ma=5&mb=6&bva=0.6&bvb=0.6&s=2&b=5&t=klar&h=45");
    expect(parameter(mitPaar({ trennungArcsec: 2.35, magnitudeA: -1.4, magnitudeB: 8.5, bvA: 1.85, bvB: -0.15 }))).toMatchObject({
      z: "frei",
      tr: "2.35",
      ma: "-1.4",
      mb: "8.5",
      bva: "1.85",
      bvb: "-0.15"
    });
  });

  it("Rundreise fuer Vorgabe, Randwerte und den groben Schritt ab 10''", () => {
    const g = GRENZEN;
    for (const teil of [
      {},
      { trennungArcsec: g.trennungArcsec.min, magnitudeA: g.magnitudeA.min, magnitudeB: g.magnitudeB.min, bvA: g.bvA.min, bvB: g.bvB.min },
      { trennungArcsec: g.trennungArcsec.max, magnitudeA: g.magnitudeA.max, magnitudeB: g.magnitudeB.max, bvA: g.bvA.max, bvB: g.bvB.max },
      { trennungArcsec: 9.95 },
      { trennungArcsec: 34 }
    ]) {
      const k = mitPaar(teil);
      expect(rundreise(k), JSON.stringify(teil)).toEqual(k);
    }
  });

  it("z=frei allein ergibt die Vorgaben 2'', 5, 6, 0,6, 0,6 ohne Hinweis", () => {
    const { konfiguration, hinweise } = ausUrl("?v=1&z=frei", ECHT);
    expect(hinweise).toEqual([]);
    expect(konfiguration.objekt).toEqual(freiesPaar({ trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 }));
    expect(konfiguration.geraet).toEqual(START.geraet);
  });

  it("faellt je Paar-Parameter einzeln auf die Vorgabe zurueck", () => {
    expect(aus("?z=frei&tr=12&mb=abc&bva=").objekt.paar).toEqual({ ...PAAR_VORGABE, trennungArcsec: 12 });
    expect(aus("?z=frei&ma=3.3&bvb=1.2").objekt.paar).toEqual({ ...PAAR_VORGABE, magnitudeA: 3.3, bvB: 1.2 });
  });

  it("schneidet Paar-Werte ueber begrenze mit Hinweis und rundet auf den Schritt ohne Hinweis", () => {
    const { konfiguration, hinweise } = ausUrl("?z=frei&tr=0.01&ma=-3&mb=1e400&bva=0.63&bvb=0.6", ECHT);
    expect(konfiguration.objekt.paar).toEqual({ trennungArcsec: 0.1, magnitudeA: -1.5, magnitudeB: 15, bvA: 0.65, bvB: 0.6 });
    expect(hinweise.map((h) => h.feld)).toEqual(["objekt.paar.trennungArcsec", "objekt.paar.magnitudeA", "objekt.paar.magnitudeB"]);
    // 34,05 liegt im Bereich, ab 10'' gilt der Schritt 1'': 34 ohne Hinweis.
    const grob = ausUrl("?z=frei&tr=34.05", ECHT);
    expect(grob.konfiguration.objekt.paar?.trennungArcsec).toBe(34);
    expect(grob.hinweise).toEqual([]);
  });

  it("die Sterne des freien Paars folgen aus den gelesenen Eingaben (freiesPaar)", () => {
    const o = aus("?z=frei&tr=3&ma=4&mb=7").objekt;
    expect(o.kennung).toBe("frei");
    expect(o.klasse).toBe("doppelstern");
    expect(o.quelle).toBeUndefined();
    expect(o.sterne.map((s) => s.dxArcsec)).toEqual([-1.5, 1.5]);
    expect(o.durchmesserArcsec).toBe(3);
  });

  it("ignoriert Paar-Parameter ohne z=frei", () => {
    const k = aus("?z=albireo_2025&tr=5&ma=1");
    expect(k.objekt.kennung).toBe("albireo_2025");
    expect(k.objekt.paar).toBeUndefined();
  });
});
