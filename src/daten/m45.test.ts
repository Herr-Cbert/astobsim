// M45 (Plejaden) aus daten/sterne/m45.json gegen die Zaehlung in docs/recherche/deep-sky.md 4.2
// (Issue #104): Sterne bis V 5,0 / 6,0 / 6,5 = 6 / 11 / 14, 44 Mitglieder bis V 8,5, Herkunft und
// Lizenz im Nachweis. Die Liste erzeugt tools/m45_sterne.py aus Gaia DR3 und Hipparcos.
import { describe, expect, it } from "vitest";
import objekteJson from "../../daten/objekte.json";
import m45Json from "../../daten/sterne/m45.json";
import { pruefeObjekte, pruefeSternliste } from "./objekte";

const sterne = pruefeSternliste(m45Json, "m45.json", "m45");
const anzahlBis = (v: number) => sterne.filter((s) => s.magnitude <= v).length;

describe("M45 in daten/objekte.json und daten/sterne/m45.json", () => {
  it("ist ein Deep-Sky-Objekt ohne Bild, ohne Isophoten, mit Sternliste", () => {
    const m45 = pruefeObjekte(objekteJson).find((o) => o.id === "m45");
    expect(m45?.typ).toBe("deep_sky");
    expect(m45?.klasse).toBe("deep_sky");
    const zustand = m45?.zustaende[0];
    expect(zustand?.bild).toBeUndefined();
    expect(zustand?.isophoten).toBeUndefined();
    expect(zustand?.sterneDatei).toBe("m45.json");
  });

  it("zaehlt bis V 5,0 / 6,0 / 6,5 genau 6 / 11 / 14 Sterne (deep-sky.md 4.2)", () => {
    expect([5.0, 6.0, 6.5].map(anzahlBis)).toEqual([6, 11, 14]);
  });

  it("hat 44 Mitglieder bis V 8,5, 31 bis V 8,0, hellste zuerst", () => {
    expect(sterne).toHaveLength(44);
    expect(anzahlBis(8.0)).toBe(31);
    expect(Math.max(...sterne.map((s) => s.magnitude))).toBeLessThanOrEqual(8.5);
    const v = sterne.map((s) => s.magnitude);
    expect(v).toEqual([...v].sort((a, b) => a - b));
  });

  it("nennt je Stern die Herkunft (HIP oder Gaia DR3) und eindeutige Namen", () => {
    for (const s of sterne) expect(s.katalog).toMatch(/^(HIP \d+|Gaia DR3 \d+)$/);
    for (const s of sterne) expect(["HIP", "GDR3"]).toContain(s.quelleFarbe);
    expect(new Set(sterne.map((s) => s.name)).size).toBe(sterne.length);
    expect(sterne.slice(0, 6).map((s) => s.name)).toEqual(["Alkyone", "Atlas", "Elektra", "Maia", "Merope", "Taygeta"]);
  });

  // deep-sky.md 4.2 nennt 1,8' fuer 24 Tau; aus den Lagen der Tabelle dort (398/-42, 288/-2) folgen 117'' = 1,95'.
  it("liegt mit Pleione 5' neben Atlas und 24 Tau 117'' neben Alkyone", () => {
    const lage = (name: string) => sterne.find((s) => s.name === name)!;
    const abstand = (a: string, b: string) => Math.hypot(lage(a).dxArcsec - lage(b).dxArcsec, lage(a).dyArcsec - lage(b).dyArcsec);
    expect(abstand("Pleione", "Atlas") / 60).toBeCloseTo(5.0, 0);
    expect(abstand("24 Tau", "Alkyone")).toBeCloseTo(117, 0);
  });

  it("legt Osten links (dx negativ) und Norden oben wie die Naht (deep-sky.md 4.2, Kopf)", () => {
    const lage = (name: string) => sterne.find((s) => s.name === name)!;
    // Atlas und Pleione stehen oestlich der Mitte, Elektra und Kelaeno westlich, Maia noerdlich.
    expect([lage("Atlas").dxArcsec, lage("Pleione").dxArcsec, lage("Alkyone").dxArcsec].every((dx) => dx < 0)).toBe(true);
    expect([lage("Elektra").dxArcsec, lage("Kelaeno").dxArcsec].every((dx) => dx > 0)).toBe(true);
    expect(lage("Atlas").dxArcsec).toBeCloseTo(-1776.6, 1);
    expect(lage("Maia").dyArcsec).toBeCloseTo(903.0, 1);
  });

  it("traegt Quelle und Lizenz CC BY-NC 3.0 IGO (ADR-0003 Nachtrag V2)", () => {
    expect(m45Json.lizenz).toContain("CC BY-NC 3.0 IGO");
    expect(m45Json.quelle).toContain("Gaia DR3");
    expect(m45Json.quelle).toContain("Hipparcos");
  });
});
