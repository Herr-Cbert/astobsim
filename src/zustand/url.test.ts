import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { type Bildnachweis, type Objekt, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise, type ZustandEintrag } from "../daten";
import type { Fernglas, Fernrohr, Konfiguration } from "../naht/konfiguration";
import { begrenze, GRENZEN } from "../physik";
import type { Kataloge } from "./kataloge";
import { ausUrl, inUrl, listeneintragZu, PARAMETER } from "./url";
import { voreinstellung } from "./voreinstellung";

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
    expect(ids).toEqual(["mond_ev", "mars_6", "mars_14", "mars_25", "jup_35", "jup_47", "sat_16", "sat_20"]);
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
