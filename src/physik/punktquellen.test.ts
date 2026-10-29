import { describe, expect, it } from "vitest";
import type { Auge, Fernglas, Konfiguration, Objektzustand } from "../naht/konfiguration";
import { auswerten } from "./auswerten";
import { PhysikFehler } from "./fehler";
import { optik } from "./optik";
import { geblendet, helligkeitRelativ, punktquellen, scheibenFlaechenhelligkeit } from "./punktquellen";
import { BEDINGUNGEN_A_D9, JUPITER_47, MOND_Q1, refraktorMitVergroesserung, SATURN_20 } from "./testdaten";

// Testwerte aus docs/recherche/physik.md Abschnitt 13.4 (eigene Rechnung mit den Werten aus
// daten/objekte.json); Blendungsregel A-P6, Testfall T6 (A-Q2) und die Ergaenzung im Issue #14.

const AUGE: Auge = { art: "auge" };
const FERNGLAS_10X50: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };

function konfiguration(objekt: Objektzustand, geraet: Konfiguration["geraet"]): Konfiguration {
  return { geraet, objekt, bedingungen: BEDINGUNGEN_A_D9 };
}

describe("scheibenFlaechenhelligkeit: mu = m + 2,5 log10(pi (d/2)^2)", () => {
  it("Scheibe mit 1 Quadratbogensekunde Flaeche hat mu = m", () => {
    expect(scheibenFlaechenhelligkeit(3, 2 / Math.sqrt(Math.PI))).toBeCloseTo(3, 12);
  });
  it("Io 5,0 mag, 1,2'': 5,1336 mag/arcsec^2", () => {
    expect(scheibenFlaechenhelligkeit(5.0, 1.2)).toBeCloseTo(5.1336, 4);
  });
  it("Rhea 9,5 mag, 0,25'': 6,2274 mag/arcsec^2", () => {
    expect(scheibenFlaechenhelligkeit(9.5, 0.25)).toBeCloseTo(6.2274, 4);
  });
  it("doppelter Durchmesser bei gleicher Magnitude: 2,5 log10(4) = 1,5051 mag dunkler", () => {
    expect(scheibenFlaechenhelligkeit(5, 2) - scheibenFlaechenhelligkeit(5, 1)).toBeCloseTo(1.5051, 4);
  });
  it("wirft PhysikFehler bei Durchmesser <= 0 und nicht endlicher Magnitude", () => {
    expect(() => scheibenFlaechenhelligkeit(5, 0)).toThrow(PhysikFehler);
    expect(() => scheibenFlaechenhelligkeit(Number.NaN, 1)).toThrow(PhysikFehler);
  });
});

describe("helligkeitRelativ: Flaechenhelligkeit relativ zu Quellweiss", () => {
  it("mu gleich Quellweiss ergibt 1, 2,5 mag dunkler ergibt 0,1", () => {
    const d = 2 / Math.sqrt(Math.PI);
    expect(helligkeitRelativ(5.3, d, 5.3)).toBeCloseTo(1, 12);
    expect(helligkeitRelativ(7.8, d, 5.3)).toBeCloseTo(0.1, 12);
  });
  it("Jupiter 47'' (Quellweiss 5,3): Io 1,1656, Europa 1,2002, Ganymed 0,8106, Kallisto 0,3529", () => {
    const werte = JUPITER_47.trabanten.map((t) => helligkeitRelativ(t.magnitude, t.durchmesserArcsec, 5.3));
    [1.1656, 1.2002, 0.8106, 0.3529].forEach((w, i) => expect(werte[i]).toBeCloseTo(w, 4));
  });
  it("Saturn 20'' (Quellweiss 6,6): Titan 0,3682, Rhea 1,4094", () => {
    expect(helligkeitRelativ(8.3, 0.85, 6.6)).toBeCloseTo(0.3682, 4);
    expect(helligkeitRelativ(9.5, 0.25, 6.6)).toBeCloseTo(1.4094, 4);
  });
  it("Fluss relativ ist helligkeitRelativ mal Flaeche: 10^(-0,4 (m - Quellweiss)) Quadratbogensekunden", () => {
    const flaeche = Math.PI * 0.6 ** 2;
    expect(helligkeitRelativ(5.0, 1.2, 5.3) * flaeche).toBeCloseTo(10 ** (-0.4 * (5.0 - 5.3)), 12);
  });
});

describe("geblendet: scheinbarer Abstand unter 10' und mehr als 6 mag Unterschied (A-P6)", () => {
  const planet = [{ xArcsec: 0, yArcsec: 0, magnitude: -2.7 }];
  const io = JUPITER_47.trabanten[0]!;
  it("Io bei 110,04'': geblendet bis V 5,45, darueber nicht", () => {
    expect(geblendet(io, planet, 5.4)).toBe(true);
    expect(geblendet(io, planet, 5.5)).toBe(false);
  });
  it("genau 10' scheinbar ist nicht geblendet (unter 10')", () => {
    const t = { name: "t", dxArcsec: 60, dyArcsec: 0, durchmesserArcsec: 1, magnitude: 5 };
    expect(geblendet(t, planet, 10)).toBe(false);
    expect(geblendet(t, planet, 9.999)).toBe(true);
  });
  it("6 mag Unterschied oder weniger blendet nicht, auch dicht daneben", () => {
    const hell = [{ xArcsec: 0, yArcsec: 0, magnitude: 0 }];
    const t = { name: "t", dxArcsec: 10, dyArcsec: 0, durchmesserArcsec: 1, magnitude: 6 };
    expect(geblendet(t, hell, 1)).toBe(false);
    expect(geblendet({ ...t, magnitude: 6.01 }, hell, 1)).toBe(true);
  });
  it("Abstand von der Position des Blenders, nicht von der Objektmitte", () => {
    const t = { name: "t", dxArcsec: 500, dyArcsec: 0, durchmesserArcsec: 1, magnitude: 10 };
    expect(geblendet(t, [{ xArcsec: 490, yArcsec: 0, magnitude: 0 }], 10)).toBe(true);
    expect(geblendet(t, [{ xArcsec: 0, yArcsec: 0, magnitude: 0 }], 10)).toBe(false);
  });
});

describe("punktquellen", () => {
  it("uebernimmt Name, Position (+x rechts, +y Norden) und Durchmesser der Trabanten", () => {
    const p = punktquellen(JUPITER_47, optik(FERNGLAS_10X50));
    expect(p.map((q) => q.name)).toEqual(["Io", "Europa", "Ganymed", "Kallisto"]);
    expect(p[3]).toMatchObject({ xArcsec: -520, yArcsec: -11.7, durchmesserArcsec: 1.58 });
    expect(p[0]!.helligkeitRelativ).toBeCloseTo(1.1656, 4);
  });
  it("Helligkeit haengt nicht vom Geraet ab (Faktoren stecken in faktorObjekt)", () => {
    const auge = punktquellen(JUPITER_47, optik(AUGE)).map((q) => q.helligkeitRelativ);
    const fernrohr = punktquellen(JUPITER_47, optik(refraktorMitVergroesserung(200, 300))).map((q) => q.helligkeitRelativ);
    expect(fernrohr).toEqual(auge);
  });
  it("Objekt ohne Trabanten (Mond) hat keine Punktquellen", () => {
    expect(punktquellen(MOND_Q1, optik(AUGE))).toEqual([]);
  });
  it("wirft PhysikFehler bei Durchmesser 0 oder Position NaN", () => {
    const o = optik(FERNGLAS_10X50);
    const t = JUPITER_47.trabanten[0]!;
    expect(() => punktquellen({ ...JUPITER_47, trabanten: [{ ...t, durchmesserArcsec: 0 }] }, o)).toThrow(PhysikFehler);
    expect(() => punktquellen({ ...JUPITER_47, trabanten: [{ ...t, dxArcsec: Number.NaN }] }, o)).toThrow(PhysikFehler);
  });
});

describe("T6: Jupiter mit blossem Auge und im 10x50 (A-P6, Testfall T6)", () => {
  it("blosses Auge: alle vier Trabanten sichtbar false, Grund blendung", () => {
    const p = auswerten(konfiguration(JUPITER_47, AUGE)).parameter.quellbild.punkte.punktquellen;
    expect(p).toHaveLength(4);
    for (const q of p) expect(q).toMatchObject({ sichtbar: false, grund: "blendung" });
  });
  it("Fernglas 10x50: alle vier sichtbar, ohne Grund", () => {
    const p = auswerten(konfiguration(JUPITER_47, FERNGLAS_10X50)).parameter.quellbild.punkte.punktquellen;
    expect(p).toHaveLength(4);
    for (const q of p) {
      expect(q.sichtbar).toBe(true);
      expect(q.grund).toBeUndefined();
    }
  });
});

describe("Saturn 20'' an 80 mm (Issue #14, Ergaenzung zu T6)", () => {
  // Rhea steht 63,47'' vom Planeten und ist 9,6 mag schwaecher: geblendet unter V = 9,45.
  // Die Blendungsregel haengt an der Vergroesserung, nicht an der Oeffnung (Abschnitt 13.3).
  const sichtbar = (v: number): Record<string, boolean> =>
    Object.fromEntries(auswerten(konfiguration(SATURN_20, refraktorMitVergroesserung(80, v))).parameter.quellbild.punkte.punktquellen.map((q) => [q.name, q.sichtbar]));
  it("bei V = 60 (A-D9-Okular) sind Titan und Rhea sichtbar", () => {
    expect(sichtbar(60)).toEqual({ Titan: true, Rhea: true });
  });
  it("bei V = 13,3 (Austrittspupille 6 mm, kleinste sinnvolle) sind beide sichtbar", () => {
    expect(sichtbar(80 / 6)).toEqual({ Titan: true, Rhea: true });
  });
  it("bei V = 8 (Austrittspupille 10 mm) zeigt sich Titan, Rhea ist geblendet", () => {
    expect(sichtbar(8)).toEqual({ Titan: true, Rhea: false });
  });
  it("Oeffnung aendert bei gleicher Vergroesserung nichts an der Sichtbarkeit", () => {
    const p = (d: number): boolean[] =>
      auswerten(konfiguration(SATURN_20, refraktorMitVergroesserung(d, 8))).parameter.quellbild.punkte.punktquellen.map((q) => q.sichtbar);
    expect(p(300)).toEqual(p(80));
  });
});
