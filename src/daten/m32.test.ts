// M32 als Begleiter von M31 (Issue #136): mit blossem Auge unsichtbar, im Fernglas und Fernrohr
// sichtbar. Vorher erbte M32 als Teil des M31-Bilds dessen Schwelle q* (ADR-0004 Befund 4) und
// erschien bei Bortle 3 bis 7 als Fleck. Pixelwerte von M32 nach der Faltung aus dem Prototyp
// (docs/validierung.md 10, Nachtrag #136): Spitze des M32-Anteils relativ zu Quellweiss 16,22.
import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import type { Helligkeit } from "../naht/simulationsparameter";
import { auswerten } from "../physik";
import { ausUrl } from "../zustand";
import { pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { pruefeGeraete } from "./geraete";
import { pruefeObjekte, pruefeVerweise } from "./objekte";
import { objektzustand } from "./objektzustand";
import { quelleBegleiter } from "./quelle_begleiter";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
const kataloge = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };

/** Helligkeit des Anblicks von M31 fuer den Suchteil der URL (Zenit, klar). */
function helligkeitM31(such: string): Helligkeit {
  const { konfiguration } = ausUrl(`?v=1&${such}&z=m31&s=2&t=klar&h=90`, kataloge);
  return auswerten(konfiguration).parameter.helligkeit;
}

/** Phi wie in bild (Abramowitz und Stegun 7.1.26 genuegt hier, Vergleich auf 0,01). */
function phi(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erfc = p * Math.exp(-z * z);
  return x >= 0 ? 1 - erfc / 2 : erfc / 2;
}

/**
 * Deckkraft, die bild dem Licht von M32 mit dem Pixelwert q gibt: mit Begleiter P' nach dessen
 * Schwelle (ADR-0004 Nachtrag #136), ohne Begleiter P nach der Schwelle von M31 (bisher).
 */
function deckkraftM32(h: Helligkeit, q: number): number {
  const ds = h.deepSky!;
  const b = ds.begleiter?.[0];
  if (b === undefined) return phi((q / ds.schwelleRelativ - 1) / ds.breite);
  const p0 = phi(-1 / ds.breite);
  return Math.max(0, (phi((q / b.schwelleRelativ - 1) / ds.breite) - p0) / (1 - p0));
}

describe("M32 als Begleiter von M31 (Issue #136)", () => {
  // Spitze des gefalteten M32-Anteils mit blossem Auge (Arbeitsmassstab 25,2''): 0,156 (18,24 mag/arcsec^2).
  it.each([3, 5, 7])("mit blossem Auge bei Bortle %i unsichtbar (Deckkraft unter 0,03)", (bortle) => {
    expect(deckkraftM32(helligkeitM31(`g=auge&b=${bortle}`), 0.156)).toBeLessThan(0.03);
  });

  // Am 80 mm bei 16-fach: Spitze 0,94 (16,28 mag/arcsec^2), im 10x50 0,58.
  it.each([
    ["80 mm 16-fach, Bortle 3", "a=fernrohr&ba=refraktor&d=80&f=400&o=0&ok=25&sg=50&b=3", 0.94],
    ["80 mm 16-fach, Bortle 7", "a=fernrohr&ba=refraktor&d=80&f=400&o=0&ok=25&sg=50&b=7", 0.94],
    ["10x50, Bortle 5", "g=fernglas-10x50&b=5", 0.58]
  ])("im %s sichtbar (Deckkraft ueber 0,99)", (_name, such, q) => {
    expect(deckkraftM32(helligkeitM31(such), q)).toBeGreaterThan(0.99);
  });
});

describe("Begleiter in daten (Issue #136)", () => {
  type Roh = Record<string, unknown>;
  const m31Roh = (roh: Roh[]): Roh => ((roh.find((o) => o["id"] === "m31")!["zustaende"] as Roh[])[0]!);
  const kopie = (): Roh[] => JSON.parse(JSON.stringify(objekteJson)) as Roh[];
  const fehler = (f: () => unknown): DatenFehler => {
    try {
      f();
    } catch (e) {
      if (e instanceof DatenFehler) return e;
      throw e;
    }
    throw new Error("kein DatenFehler");
  };

  it("M31 traegt M32 als Begleiter mit eigenem Bild und eigener Flaechentabelle", () => {
    const z = objektzustand(objekte, nachweise, "m31")!;
    expect(z.begleiter).toHaveLength(1);
    const b = z.begleiter![0]!;
    expect([b.kennung, b.name, b.magnitude]).toEqual(["m32", "M32", 8.08]);
    // Mitte des Begleiterbilds auf dem Gitter der M31-Leinwand (4''/px), M32 etwa 24' suedlich.
    expect(b.dxArcsec).toBe(28);
    expect(b.dyArcsec).toBe(-1452);
    expect(b.quelle).toEqual({ breitePx: 128, hoehePx: 128, massstabArcsecProPx: 4 });
    expect(b.quelle.massstabArcsecProPx).toBe(z.quelle!.massstabArcsecProPx);
    expect(b.isophoten.length).toBeGreaterThan(30);
  });

  it("Begleiter nur bei Deep-Sky mit Bild, bekannte Felder, eindeutige ids, vorhandener Nachweis", () => {
    const ohneBild = kopie();
    const m45 = (ohneBild.find((o) => o["id"] === "m45")!["zustaende"] as Roh[])[0]!;
    m45["begleiter"] = m31Roh(kopie())["begleiter"];
    expect(fehler(() => pruefeObjekte(ohneBild)).feld).toBe("begleiter");
    const unbekannt = kopie();
    ((m31Roh(unbekannt)["begleiter"] as Roh[])[0]!)["farbe"] = 1;
    expect(fehler(() => pruefeObjekte(unbekannt)).feld).toBe("farbe");
    const doppelt = kopie();
    const liste = m31Roh(doppelt)["begleiter"] as Roh[];
    liste.push({ ...liste[0]! });
    expect(fehler(() => pruefeObjekte(doppelt)).feld).toBe("id");
    const fehlt = kopie();
    ((m31Roh(fehlt)["begleiter"] as Roh[])[0]!)["bild"] = "gibt_es_nicht";
    expect(fehler(() => pruefeVerweise(pruefeObjekte(fehlt), nachweise)).feld).toBe("bild");
    // Ohne den Begleiter waere sein Bild ungenutzt.
    const weg = kopie();
    delete m31Roh(weg)["begleiter"];
    expect(fehler(() => pruefeVerweise(pruefeObjekte(weg), nachweise)).eintrag).toBe("m31_noirlab_lgs_m32");
  });

  it("quelleBegleiter: Bild um dx/dy versetzt, Werte relativ zum Quellweiss des Hauptobjekts", () => {
    const nb = nachweise.find((n) => n.id === "m31_noirlab_lgs_m32")!;
    const kodes = new Uint8Array(128 * 128);
    kodes[64 * 128 + 64] = 255;
    const q = quelleBegleiter({ ...nb, kennlinie: { art: "log", magHell: 17.22, magDunkel: 26.22 } }, 16.22, 28, -1452, { breite: 128, hoehe: 128, kanaele: 1, srgb: kodes });
    // Pixel (64, 64) des Begleiterbilds liegt bei x = 28 + 0,5 * 4 = 30, y = -1452 - 0,5 * 4 = -1454.
    const a = q.ausschnitt({ xArcsec: 30, yArcsec: -1454 }, 4, 4);
    const i = Math.floor((30 - a.linksXArcsec) / 4);
    const j = Math.floor((a.obenYArcsec - -1454) / 4);
    expect(a.raster.daten[j * a.raster.breite + i]).toBeCloseTo(10 ** (-0.4 * 1), 6);
    expect(Math.max(...Array.from(a.raster.daten))).toBeCloseTo(0.398107, 5);
  });

  it("M32 hat mit blossem Auge bei Bortle 3, 5, 7 eigenes C/C_th unter 0,05 (docs/validierung.md 10)", () => {
    for (const bortle of [3, 5, 7]) {
      const { konfiguration } = ausUrl(`?v=1&g=auge&z=m31&s=2&b=${bortle}&t=klar&h=90`, kataloge);
      const nurM32 = { ...konfiguration.objekt, isophoten: konfiguration.objekt.begleiter![0]!.isophoten };
      delete nurM32.begleiter;
      const iso = auswerten({ ...konfiguration, objekt: nurM32 }).anzeige.isophote!;
      expect(iso.verhaeltnis).toBeLessThan(0.05);
    }
  });
});
