// log-Kennlinie der Deep-Sky-Bilder (Issue #102, ADR-0003 Nachtrag V2), QuelleLeer und die
// 8-Bit-Kodewerte mit einem Kanal in Einzelbild und Kacheln. Synthetische Bilder und Kennungen.
import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import { pruefeBildnachweise, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { rgbaZuKodes, rgbaZuSrgb } from "./kachellader";
import { QuelleKacheln } from "./kacheln";
import { type Kennlinie, kodeZuMag, kodetabelle, logTabelle, logZuLinear } from "./kennlinie";
import { quelleEinzelbild, QuelleEinzelbild } from "./quelle_einzelbild";
import { QuelleLeer } from "./quelle_leer";
import { LINEAR_8BIT } from "./srgb";

const KENNLINIE: Kennlinie = { art: "log", magHell: 14, magDunkel: 26.7 };
const MITTE = { xArcsec: 0, yArcsec: 0 };

function fehlerVon(f: () => unknown): DatenFehler {
  try {
    f();
  } catch (e) {
    if (e instanceof DatenFehler) return e;
    throw e;
  }
  throw new Error("kein DatenFehler geworfen");
}

/** Synthetischer Eintrag in bilder.json mit Kennlinie, Form von einem echten Einzelbild uebernommen. */
function rohMitKennlinie(kennlinie: unknown): Record<string, unknown> {
  const vorlage = (JSON.parse(JSON.stringify(bilderJson)) as Record<string, unknown>[]).find((n) => n["kacheln"] === undefined)!;
  return {
    ...vorlage,
    id: "nebel_test_bild",
    objekt: "nebel_test",
    zustand: "nebel_test_1",
    datei: "nebel_test/nebel.webp",
    pixel_breite: 4,
    pixel_hoehe: 2,
    winkelgroesse_arcsec: 4,
    objekt_durchmesser_px: 4,
    bogensekunden_pro_pixel: 1,
    datei_bytes: 100,
    kennlinie
  };
}

describe("log-Kennlinie", () => {
  it("bildet Kode 1 auf mag_dunkel und Kode 255 auf mag_hell ab, Kode 0 ist Schwarz", () => {
    expect(kodeZuMag(1, KENNLINIE)).toBe(26.7);
    expect(kodeZuMag(255, KENNLINIE)).toBe(14);
    expect(kodeZuMag(128, KENNLINIE)).toBeCloseTo(20.35, 10);
    expect(kodeZuMag(0, KENNLINIE)).toBe(Infinity);
    expect(logZuLinear(0, KENNLINIE)).toBe(0);
    expect(logZuLinear(255, KENNLINIE)).toBe(1);
    // Kode 1: 12,7 mag unter Quellweiss, 10^(-0,4 * 12,7) = 8,317637711e-6 (ber.)
    expect(logZuLinear(1, KENNLINIE)).toBeCloseTo(8.317637711e-6, 15);
  });

  it("eine Stufe ist (dunkel - hell) / 254 mag, das Verhaeltnis benachbarter Kodes konstant", () => {
    // 12,7 / 254 = 0,05 mag je Stufe, Faktor 10^(0,02) = 1,047128548 (ber., ADR-0003: 4,5 %)
    for (const v of [1, 50, 200, 254]) expect(logZuLinear(v + 1, KENNLINIE) / logZuLinear(v, KENNLINIE)).toBeCloseTo(1.047128548, 8);
  });

  it("die Tabelle hat 256 Werte wie LINEAR_8BIT und waechst streng", () => {
    const t = logTabelle(KENNLINIE);
    expect(t).toBeInstanceOf(Float32Array);
    expect(t.length).toBe(256);
    expect(t[0]).toBe(0);
    expect(t[255]).toBe(1);
    expect(t[100]).toBe(Math.fround(logZuLinear(100, KENNLINIE)));
    for (let i = 1; i < 256; i++) expect(t[i]!).toBeGreaterThan(t[i - 1]!);
  });

  it("kodetabelle waehlt sRGB ohne und log mit Kennlinie", () => {
    const echt = pruefeBildnachweise(bilderJson);
    expect(echt.every((n) => n.kennlinie === undefined)).toBe(true);
    expect(kodetabelle(echt[0]!)).toBe(LINEAR_8BIT);
    expect(Array.from(kodetabelle({ ...echt[0]!, kennlinie: KENNLINIE }))).toEqual(Array.from(logTabelle(KENNLINIE)));
  });
});

describe("pruefeBildnachweise kennlinie", () => {
  it("liest die Kennlinie", () => {
    const [n] = pruefeBildnachweise([rohMitKennlinie({ art: "log", mag_hell: 14, mag_dunkel: 26.7 })]);
    expect(n!.kennlinie).toEqual(KENNLINIE);
  });

  it("meldet falsche art, vertauschte Grenzen und unbekannte Felder", () => {
    const faelle: [unknown, string][] = [
      [{ art: "srgb", mag_hell: 14, mag_dunkel: 26 }, "art"],
      [{ art: "log", mag_hell: 20, mag_dunkel: 20 }, "mag_dunkel"],
      [{ art: "log", mag_hell: 14 }, "mag_dunkel"],
      [{ art: "log", mag_hell: 14, mag_dunkel: 26, gamma: 2 }, "gamma"],
      ["log", "kennlinie"]
    ];
    for (const [kennlinie, feld] of faelle) {
      const f = fehlerVon(() => pruefeBildnachweise([rohMitKennlinie(kennlinie)]));
      expect(f.feld).toBe(feld);
      expect(f.eintrag).toContain("nebel_test_bild");
    }
  });
});

describe("8-Bit-Kodewerte mit einem Kanal", () => {
  /** RGBA eines Grauwertbilds: Kodes in R = G = B, Alpha 255. */
  function grau(kodes: number[]): Uint8Array {
    return Uint8Array.from(kodes.flatMap((k) => [k, k, k, 255]));
  }

  it("rgbaZuKodes nimmt bei einem Kanal Rot, bei drei wie rgbaZuSrgb", () => {
    const rgba = Uint8Array.from([10, 11, 12, 255, 200, 201, 202, 0]);
    expect(rgbaZuKodes(rgba, 2, 1, 1)).toEqual({ breite: 2, hoehe: 1, kanaele: 1, srgb: Uint8Array.from([10, 200]) });
    expect(rgbaZuKodes(rgba, 2, 1, 3)).toEqual(rgbaZuSrgb(rgba, 2, 1));
    expect(() => rgbaZuKodes(rgba, 3, 1, 1)).toThrow(DatenFehler);
  });

  it("QuelleEinzelbild dekodiert die Kodes im Ausschnitt ueber die log-Tabelle", () => {
    const nachweis: Bildnachweis = pruefeBildnachweise([rohMitKennlinie({ art: "log", mag_hell: 14, mag_dunkel: 26.7 })])[0]!;
    const kodes = [0, 1, 128, 255, 255, 128, 1, 0];
    const quelle = quelleEinzelbild(nachweis, 4, rgbaZuKodes(grau(kodes), 4, 2, 1));
    const a = quelle.ausschnitt(MITTE, 4, 1);
    expect(a.raster.kanaele).toBe(1);
    expect([a.raster.breite, a.raster.hoehe]).toEqual([4, 2]);
    const t = logTabelle(KENNLINIE);
    expect(Array.from(a.raster.daten)).toEqual(kodes.map((k) => t[k]!));
    // Der Speicher bleibt 8 Bit.
    expect((quelle.raster as { srgb: Uint8Array }).srgb).toBeInstanceOf(Uint8Array);
  });

  it("quelleEinzelbild verlangt bei log-Kennlinie Kodewerte statt eines linearen Rasters", () => {
    const nachweis = pruefeBildnachweise([rohMitKennlinie({ art: "log", mag_hell: 14, mag_dunkel: 26.7 })])[0]!;
    const linear = { breite: 4, hoehe: 2, kanaele: 1 as const, daten: new Float32Array(8) };
    expect(fehlerVon(() => quelleEinzelbild(nachweis, 4, linear)).feld).toBe("kennlinie");
    expect(() => new QuelleEinzelbild({ breite: 4, hoehe: 2, kanaele: 1, srgb: new Uint8Array(7) }, 1)).toThrow(DatenFehler);
    expect(() => new QuelleEinzelbild({ breite: 4, hoehe: 2, kanaele: 1, srgb: new Uint8Array(8) }, 1, new Float32Array(10))).toThrow(DatenFehler);
  });

  it("QuelleKacheln dekodiert einkanalige Kodekacheln ueber die uebergebene Tabelle", async () => {
    // Eine Stufe 3x2, Kachel 2 px: Kacheln 2x2 und Randkachel 1x2.
    const geometrie = { kachelPx: 2, kanaele: 1 as const, stufen: [{ breitePx: 3, hoehePx: 2, massstabArcsecProPx: 1 }] };
    const bild = [5, 100, 255, 0, 1, 254];
    const tabelle = logTabelle(KENNLINIE);
    const quelle = new QuelleKacheln(
      geometrie,
      async (_s, x) => {
        const breite = x === 0 ? 2 : 1;
        const kodes = [0, 1].flatMap((y) => bild.slice(y * 3 + x * 2, y * 3 + x * 2 + breite));
        return { breite, hoehe: 2, kanaele: 1, srgb: Uint8Array.from(kodes) };
      },
      undefined,
      tabelle
    );
    await quelle.lade(MITTE, 3, 1);
    const a = quelle.ausschnitt(MITTE, 3, 1);
    expect(a.raster.kanaele).toBe(1);
    expect(Array.from(a.raster.daten)).toEqual(bild.map((k) => tabelle[k]!));
    expect(() => new QuelleKacheln(geometrie, async () => ({ breite: 1, hoehe: 1, srgb: new Uint8Array(3) }), undefined, new Float32Array(3))).toThrow(DatenFehler);
  });
});

describe("QuelleLeer", () => {
  it("liefert ein schwarzes Pixel an der Mitte im angefragten Massstab", () => {
    const a = new QuelleLeer().ausschnitt({ xArcsec: 10, yArcsec: -4 }, 120, 0.5);
    expect(a.raster).toEqual({ breite: 1, hoehe: 1, kanaele: 1, daten: new Float32Array(1) });
    expect(a.massstabArcsecProPx).toBe(0.5);
    expect([a.linksXArcsec, a.obenYArcsec]).toEqual([9.75, -3.75]);
    expect(new QuelleLeer(3).ausschnitt(MITTE, 1, 1).raster.daten.length).toBe(3);
  });

  it("ist rein: gleiche Argumente, gleiches Ergebnis", () => {
    const q = new QuelleLeer();
    expect(q.ausschnitt(MITTE, 10, 2)).toEqual(q.ausschnitt(MITTE, 10, 2));
  });

  it("weist ungueltige Massstaebe und Kanaele zurueck", () => {
    expect(() => new QuelleLeer().ausschnitt(MITTE, 10, 0)).toThrow(DatenFehler);
    expect(() => new QuelleLeer().ausschnitt(MITTE, 10, Number.NaN)).toThrow(DatenFehler);
    expect(() => new QuelleLeer(2 as 1)).toThrow(DatenFehler);
  });
});
