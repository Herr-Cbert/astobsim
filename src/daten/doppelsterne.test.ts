// Die Doppelsterne der festen Katalogliste (Issue #103) in der echten daten/objekte.json:
// Liste aus docs/recherche/doppelsterne.md 2 (14 Objekte, 16 Paare), Lage nach A-Z9 bzw. als
// Mehrfachstern mit Norden oben (Epsilon Lyrae, Entscheidung 4), Nachweis je Paar (ADR-0003 Nachtrag V2).
import { afterEach, describe, expect, it, vi } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import { ladeBildnachweise } from "./bildnachweise";
import { ladeObjekte, pruefeObjekte, type Objekt, type SternEintrag } from "./objekte";
import { objektzustand } from "./objektzustand";

/** ids in der Reihenfolge von doppelsterne.md 2.2 (52 Ori und 52 Ari ohne fuehrende Ziffer, 5). */
const LISTE = [
  "albireo", "mizar", "gamma_and", "castor", "porrima", "zeta_aqr", "eps_lyr",
  "pi_aql", "eps_ari", "ori_52", "ari_52", "zeta_her", "antares", "polaris"
];

const objekte = pruefeObjekte(objekteJson);
const doppelsterne = objekte.filter((o) => o.typ === "doppelstern");

/** Sterne einer Komponente eines Paarnachweises. */
function komponente(o: Objekt, namen: readonly string[]): SternEintrag[] {
  const sterne = o.zustaende[0]!.sterne;
  return namen.map((n) => sterne.find((s) => s.name === n)!);
}

function mitte(sterne: readonly SternEintrag[]): { x: number; y: number } {
  return {
    x: sterne.reduce((s, t) => s + t.dxArcsec, 0) / sterne.length,
    y: sterne.reduce((s, t) => s + t.dyArcsec, 0) / sterne.length
  };
}

describe("Doppelsterne in daten/objekte.json (#103)", () => {
  it("enthaelt die 14 Objekte aus doppelsterne.md 2 hinter den Objekten des Sonnensystems", () => {
    expect(doppelsterne.map((o) => o.id)).toEqual(LISTE);
    const ids = objekte.map((o) => o.id);
    expect(ids.indexOf("albireo")).toBe(ids.indexOf("saturn") + 1);
    for (const o of doppelsterne) {
      expect(o.klasse).toBe("doppelstern");
      expect(o.zustaende).toHaveLength(1);
      expect(o.quellePhysik).toBe("docs/recherche/doppelsterne.md");
    }
  });

  it("hat 16 Paarnachweise, mit Ephemeride 2027,0 fuer die Bahnpaare", () => {
    const paare = doppelsterne.flatMap((o) => o.zustaende[0]!.katalog!);
    expect(paare).toHaveLength(16);
    for (const p of paare) {
      if (p.quelle.startsWith("ORB6")) expect(p.epoche).toBe(2027.0);
      else expect(p.quelle).toMatch(/^WDS, letzte Messung \d{4}/);
    }
  });

  it("legt Paare aus zwei Sternen Ost-West um den Ursprung: abs(dx_B - dx_A) = Trennung", () => {
    for (const o of doppelsterne.filter((d) => d.zustaende[0]!.sterne.length === 2)) {
      const z = o.zustaende[0]!;
      const [a, b] = z.sterne as [SternEintrag, SternEintrag];
      const trennung = z.katalog![0]!.trennungArcsec;
      expect(Math.abs(b.dxArcsec - a.dxArcsec), o.id).toBeCloseTo(trennung, 9);
      expect(a.dxArcsec + b.dxArcsec, o.id).toBeCloseTo(0, 9);
      expect([a.dyArcsec, b.dyArcsec], o.id).toEqual([0, 0]);
      // A (Hauptstern nach WDS) im Westen bei -rho/2.
      expect(a.dxArcsec, o.id).toBeLessThan(0);
    }
  });

  it("zeigt Epsilon Lyrae in echter Lage mit Norden oben: Abstand und Positionswinkel jedes Paars", () => {
    const eps = doppelsterne.find((o) => o.id === "eps_lyr")!;
    const z = eps.zustaende[0]!;
    expect(z.sterne.map((s) => s.name)).toEqual(["eps1 A", "eps1 B", "eps2 C", "eps2 D"]);
    expect(z.katalog!.map((p) => p.komponenten)).toEqual(["STF2382 AB", "STF2383 CD", "STFA 37 AB,CD"]);
    for (const p of z.katalog!) {
      const [p1, p2] = p.sterne.map((namen) => mitte(komponente(eps, namen)));
      const dx = p2!.x - p1!.x;
      const dy = p2!.y - p1!.y;
      expect(Math.abs(Math.hypot(dx, dy) - p.trennungArcsec), p.komponenten).toBeLessThan(0.002);
      // Positionswinkel von Norden (dy positiv) ueber Osten (dx positiv).
      const pa = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      expect(Math.abs(pa - p.positionswinkelGrad), p.komponenten).toBeLessThan(0.05);
    }
    // Mitte des Systems im Ursprung, eps1 noerdlich von eps2.
    const gesamt = mitte(z.sterne);
    expect(Math.hypot(gesamt.x, gesamt.y)).toBeLessThan(0.002);
    expect(mitte(komponente(eps, ["eps1 A", "eps1 B"])).y).toBeGreaterThan(100);
  });

  it("nennt fuer jeden Stern B-V mit Herkunft (katalog, quelle_farbe)", () => {
    for (const o of doppelsterne) {
      for (const s of o.zustaende[0]!.sterne) {
        expect(s.katalog, `${o.id} ${s.name}`).toBeTruthy();
        expect(s.quelleFarbe, `${o.id} ${s.name}`).toMatch(/^(Hipparcos|TDSC|BSC|SIMBAD|Usenko und Klochkova 2007 nach Turner 2005)$/);
        expect(Math.abs(s.bv)).toBeLessThan(2);
      }
    }
  });

  it("traegt als Gesamthelligkeit die Summe der Fluesse der Sterne (auf 0,01 mag)", () => {
    for (const o of doppelsterne) {
      const z = o.zustaende[0]!;
      const fluss = z.sterne.reduce((s, t) => s + 10 ** (-0.4 * t.magnitude), 0);
      expect(Math.abs(z.magnitude - -2.5 * Math.log10(fluss)), o.id).toBeLessThanOrEqual(0.005 + 1e-9);
    }
  });

  it("uebernimmt Katalogwerte aus doppelsterne.md 2.2 und Entscheidung 7 (Stichproben)", () => {
    const stern = (id: string, name: string) => doppelsterne.find((o) => o.id === id)!.zustaende[0]!.sterne.find((s) => s.name === name)!;
    expect(stern("albireo", "A").bv).toBe(1.088);
    expect(stern("albireo", "B").bv).toBe(-0.095);
    expect(stern("antares", "B").bv).toBe(-0.2);
    expect(stern("polaris", "B").magnitude).toBe(8.6);
    expect(stern("zeta_her", "B").bv).toBe(0.77);
    const zetaHer = doppelsterne.find((o) => o.id === "zeta_her")!.zustaende[0]!.katalog![0]!;
    expect([zetaHer.trennungArcsec, zetaHer.positionswinkelGrad, zetaHer.epoche]).toEqual([1.542, 72.2, 2027.0]);
  });

  it("liefert ueber objektzustand die Sterne an die Naht, ohne Bild", () => {
    for (const o of doppelsterne) {
      const z = objektzustand(objekte, [], o.zustaende[0]!.id)!;
      expect(z.klasse).toBe("doppelstern");
      expect(z.quelle).toBeUndefined();
      expect(z.sterne).toHaveLength(o.zustaende[0]!.sterne.length);
    }
  });
});

describe("ladeObjekte mit den Doppelsternen", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("laedt und prueft die echte Datei samt Bildnachweisen", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const inhalt = url.endsWith("objekte.json") ? objekteJson : url.endsWith("bilder.json") ? bilderJson : undefined;
      return inhalt === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(inhalt));
    });
    const geladen = await ladeObjekte(await ladeBildnachweise());
    expect(geladen.filter((o) => o.klasse === "doppelstern").map((o) => o.id)).toEqual(LISTE);
  });
});
