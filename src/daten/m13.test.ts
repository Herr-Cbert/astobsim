// M13 (Herkuleshaufen) aus daten/sterne/m13.json und daten/objekte.json gegen die Zaehlung in
// docs/recherche/deep-sky.md 3.3 (Issue #108): 531 Gaia-Mitglieder bis V 15 als Punktquellen, das
// Quellbild traegt nur das Restlicht (Entscheidung "Sterne plus Restlicht"). Die Liste und das Bild
// erzeugt tools/m13_aufbereiten.py; die Summe aus Flaeche und Sternen prueft tools/quellweiss_eichen.py.
import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import m13Json from "../../daten/sterne/m13.json";
import { pruefeBildnachweise } from "./bildnachweise";
import { pruefeObjekte, pruefeSternliste, pruefeVerweise } from "./objekte";

const sterne = pruefeSternliste(m13Json, "m13.json", "m13");
const anzahlBis = (v: number) => sterne.filter((s) => s.magnitude <= v).length;
const fluss = (v: number) => Math.pow(10, -0.4 * v);

describe("M13 in daten/objekte.json und daten/sterne/m13.json", () => {
  it("ist ein Deep-Sky-Objekt mit Bild, King-Profil, Isophoten und Sternliste", () => {
    const objekte = pruefeObjekte(objekteJson);
    pruefeVerweise(objekte, pruefeBildnachweise(bilderJson));
    const m13 = objekte.find((o) => o.id === "m13");
    expect(m13?.klasse).toBe("deep_sky");
    const zustand = m13?.zustaende[0];
    expect(zustand?.magnitude).toBe(5.78);
    expect(zustand?.bild).toBe("m13_noirlab_mayall");
    expect(zustand?.sterneDatei).toBe("m13.json");
    expect(zustand?.profil?.art).toBe("king");
    expect(zustand?.isophoten?.length).toBeGreaterThan(10);
  });

  it("hat 531 Mitglieder bis V 15, hellste zuerst (deep-sky.md 3.3)", () => {
    expect(sterne).toHaveLength(531);
    expect(Math.max(...sterne.map((s) => s.magnitude))).toBeLessThanOrEqual(15.0);
    const v = sterne.map((s) => s.magnitude);
    expect(v).toEqual([...v].sort((a, b) => a - b));
    // Hellste Rote Riesen V 11,92 bis 12,06, B-V etwa 1,2 bis 1,4 (deep-sky.md 3.3).
    expect(v.slice(0, 5)).toEqual([11.92, 11.97, 11.98, 12.01, 12.06]);
    for (const s of sterne.slice(0, 5)) expect(s.bv).toBeGreaterThan(1.2);
    expect(anzahlBis(12.5)).toBe(22);
  });

  it("nennt je Stern die Gaia-Kennung und eindeutige Namen", () => {
    for (const s of sterne) expect(s.katalog).toMatch(/^Gaia DR3 \d{19}$/);
    expect(new Set(sterne.map((s) => s.name)).size).toBe(sterne.length);
  });

  it("legt den hellsten Riesen 0,7' bis 1,4' von der Mitte, Westen rechts (dx = -Osten)", () => {
    const a = sterne[0]!;
    expect(Math.hypot(a.dxArcsec, a.dyArcsec) / 60).toBeGreaterThan(0.7);
    expect(Math.hypot(a.dxArcsec, a.dyArcsec) / 60).toBeLessThan(1.4);
    // Gaia DR3 1328057763997754112: RA kleiner als die Mitte, also westlich (rechts), und suedlich.
    expect(a.dxArcsec).toBeCloseTo(55.6, 1);
    expect(a.dyArcsec).toBeCloseTo(-60.1, 1);
  });

  it("traegt ein Drittel des Lichts in den Sternen (deep-sky.md 3.3: 33,5 %)", () => {
    const summe = sterne.reduce((a, s) => a + fluss(s.magnitude), 0);
    expect(summe / fluss(5.78)).toBeCloseTo(0.335, 2);
  });

  it("traegt Quelle und Lizenz CC BY-NC 3.0 IGO", () => {
    expect(m13Json.lizenz).toContain("CC BY-NC 3.0 IGO");
    expect(m13Json.quelle).toContain("Gaia DR3");
    expect(m13Json.quelle).toContain("ESA, Gaia DPAC");
  });
});
