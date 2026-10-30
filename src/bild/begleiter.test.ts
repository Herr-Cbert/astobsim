// Begleiter in bild (Issue #136, ADR-0004 Nachtrag, docs/recherche/physik.md 29): eigene Deckkraft je
// Begleiter in tonwert, Faltung im Teilfenster, rendere mit Begleiterquellen und Zwischenspeicher.
import { describe, expect, it } from "vitest";
import type { Helligkeit, Kern, Simulationsparameter } from "../naht/simulationsparameter";
import { FalterJs, type Falter } from "./falter";
import { BildFehler } from "./fehler";
import { QuelleAusRaster } from "./quelle";
import { neuesRaster, pixelIndex, type Raster } from "./raster";
import { falteTeilfenster, phi, rendere, tonwert, type Zwischenspeicher } from "./rendere";
import { deltaKern, kastenKern, kernAusDaten } from "./testkerne";

const N = 16;

/** Zaehlt die Faltungen und die gefalteten Pixel, rechnet mit FalterJs. */
class FalterZaehlend implements Falter {
  aufrufe = 0;
  pixel = 0;
  private readonly innen = new FalterJs();
  falte(raster: Raster, kern: Kern): Raster {
    this.aufrufe++;
    this.pixel += raster.breite * raster.hoehe;
    return this.innen.falte(raster, kern);
  }
}

/** Deep-Sky-Helligkeit mit n = 1/3 und optional Begleiterschwellen. */
function helligkeit(begleiter?: { schwelleRelativ: number; sockel: number }[]): Helligkeit {
  const deepSky: NonNullable<Helligkeit["deepSky"]> = { faktor: 0.002, himmel: 1e-5, schwelleRelativ: 0.01, breite: 0.484, sockel: 0.004 };
  if (begleiter !== undefined) deepSky.begleiter = begleiter;
  return { schluessel: "h", faktorObjekt: 0.1, hintergrundRelativ: Math.cbrt(1e-5), hintergrundMagProArcsec2: 21, punktFaktor: 1, punktExponent: 1 / 3, mischgewicht: 0, deepSky };
}

function raster1(werte: number[]): Raster {
  return { breite: werte.length, hoehe: 1, kanaele: 1, daten: Float32Array.from(werte) };
}

const z = (h: Helligkeit, x: number) => Math.min(1, Math.pow(Math.max(0, h.deepSky!.faktor * x + h.deepSky!.himmel), h.punktExponent));

describe("tonwert mit Begleitern", () => {
  it("Formel: Hauptobjekt wie bisher, dazu der Zuwachs des Begleiters mit P' nach dessen Schwelle", () => {
    const h = helligkeit([{ schwelleRelativ: 0.5, sockel: 0.003 }]);
    const ds = h.deepSky!;
    const q1 = [0, 0.02, 0.02, 0.3];
    const q2 = [0, 0, 0.4, 0.9];
    const ohne = tonwert(raster1(q1), undefined, helligkeit());
    const mit = tonwert(raster1(q1), undefined, h, { begleiter: [raster1(q2)] });
    const p0 = phi(-1 / ds.breite);
    for (let i = 0; i < q1.length; i++) {
      const p = Math.max(0, (phi((q2[i]! / 0.5 - 1) / ds.breite) - p0) / (1 - p0));
      const zuwachs = q2[i]! > 0 ? p * (z(h, q1[i]! + q2[i]!) - z(h, q1[i]!) + 0.003) : 0;
      expect(mit.daten[i]).toBeCloseTo((ohne.daten[i] as number) + zuwachs, 6);
    }
    // Ohne Licht des Begleiters (q2 = 0) genau der Wert ohne Begleiter.
    expect(mit.daten[0]).toBe(ohne.daten[0]);
    expect(mit.daten[1]).toBe(ohne.daten[1]);
  });

  it("weit unter der Schwelle des Begleiters bleibt nur das Hauptobjekt (M32 mit blossem Auge)", () => {
    const h = helligkeit([{ schwelleRelativ: 10, sockel: 0.003 }]);
    const ohne = tonwert(raster1([0.02]), undefined, helligkeit());
    const mit = tonwert(raster1([0.02]), undefined, h, { begleiter: [raster1([0.15])] });
    expect((mit.daten[0] as number) - (ohne.daten[0] as number)).toBeLessThan(1e-4);
  });

  it("ohne Schwelle (Deckkraft 1, Sockel 0) gleicht der Wert dem der Summe als ein Objekt", () => {
    const h = helligkeit([{ schwelleRelativ: 1e-30, sockel: 0 }]);
    const eins: Helligkeit = { ...h, deepSky: { ...h.deepSky!, schwelleRelativ: 1e-30, sockel: 0 } };
    delete eins.deepSky!.begleiter;
    const mit = tonwert(raster1([0.02, 0.3]), undefined, { ...eins, deepSky: { ...eins.deepSky!, begleiter: [{ schwelleRelativ: 1e-30, sockel: 0 }] } }, { begleiter: [raster1([0.4, 0.9])] });
    const summe = tonwert(raster1([0.42, 1.2]), undefined, eins);
    expect(mit.daten[0]).toBeCloseTo(summe.daten[0] as number, 6);
    expect(mit.daten[1]).toBeCloseTo(summe.daten[1] as number, 6);
  });

  it("ohne deepSky (Vergleichsbild linear) werden Begleiter zum Objekt addiert", () => {
    const linear: Helligkeit = { schluessel: "l", faktorObjekt: 1, hintergrundRelativ: 0, hintergrundMagProArcsec2: 21, punktFaktor: 1, punktExponent: 1, mischgewicht: 0 };
    const mit = tonwert(raster1([0.2, 0.3]), undefined, linear, { begleiter: [raster1([0.5, 0]), undefined] });
    expect(mit.daten[0]).toBeCloseTo(0.7, 6);
    expect(mit.daten[1]).toBeCloseTo(0.3, 6);
    // Ohne Objektraster: nur die Begleiter.
    const nur = tonwert(undefined, undefined, linear, { rasterPx: 1, begleiter: [raster1([0.5])] });
    expect(nur.daten[0]).toBeCloseTo(0.5, 6);
  });

  it("ohne Objektraster (Hauptbild schwarz im Fenster) zaehlt q = 0", () => {
    const h = helligkeit([{ schwelleRelativ: 0.5, sockel: 0 }]);
    const mit = tonwert(undefined, undefined, h, { rasterPx: 1, begleiter: [{ breite: 1, hoehe: 1, kanaele: 1, daten: Float32Array.of(2) }] });
    const p0 = phi(-1 / 0.484);
    const p = (phi((2 / 0.5 - 1) / 0.484) - p0) / (1 - p0);
    const leer = tonwert(undefined, undefined, helligkeit(), { rasterPx: 1 }).daten[0] as number;
    expect(mit.daten[0]).toBeCloseTo(leer + p * (z(h, 2) - z(h, 0)), 6);
  });

  it("zwei Begleiter: Q_k kumuliert in der Reihenfolge von deepSky.begleiter (physik.md 29)", () => {
    const s1 = { schwelleRelativ: 0.5, sockel: 0.003 };
    const s2 = { schwelleRelativ: 0.08, sockel: 0.006 };
    const h = helligkeit([s1, s2]);
    const ds = h.deepSky!;
    const q = [0.02, 0.02, 0.3, 0];
    const q1 = [0, 0.4, 0.9, 0.6];
    const q2 = [0.1, 0, 0.2, 0.05];
    const mit = tonwert(raster1(q), undefined, h, { begleiter: [raster1(q1), raster1(q2)] });
    const ohne = tonwert(raster1(q), undefined, helligkeit());
    const p0 = phi(-1 / ds.breite);
    const deck = (qk: number, s: { schwelleRelativ: number }) => Math.max(0, (phi((qk / s.schwelleRelativ - 1) / ds.breite) - p0) / (1 - p0));
    for (let i = 0; i < q.length; i++) {
      // Q_0 = q, Q_1 = q + q1, Q_2 = q + q1 + q2; ein Begleiter ohne Licht (q_k = 0) zaehlt nicht.
      const zu1 = q1[i]! > 0 ? deck(q1[i]!, s1) * (z(h, q[i]! + q1[i]!) - z(h, q[i]!) + s1.sockel) : 0;
      const zu2 = q2[i]! > 0 ? deck(q2[i]!, s2) * (z(h, q[i]! + q1[i]! + q2[i]!) - z(h, q[i]! + q1[i]!) + s2.sockel) : 0;
      expect(mit.daten[i]).toBeCloseTo((ohne.daten[i] as number) + zu1 + zu2, 6);
    }
    // Die Reihenfolge zaehlt: vertauscht bekommt der zweite Begleiter den Zuwachs am Fuss von Z.
    const getauscht = tonwert(raster1(q), undefined, helligkeit([s2, s1]), { begleiter: [raster1(q2), raster1(q1)] });
    expect(Math.abs((getauscht.daten[2] as number) - (mit.daten[2] as number))).toBeGreaterThan(1e-4);
  });

  it("wirft bei falscher Anzahl, falschen Massen und Begleitern ohne Schwelle", () => {
    expect(() => tonwert(raster1([0]), undefined, helligkeit([{ schwelleRelativ: 1, sockel: 0 }]), { begleiter: [] })).toThrow(BildFehler);
    expect(() => tonwert(raster1([0, 0]), undefined, helligkeit([{ schwelleRelativ: 1, sockel: 0 }]), { begleiter: [raster1([0])] })).toThrow(BildFehler);
    expect(() => tonwert(raster1([0]), undefined, helligkeit(), { begleiter: [raster1([1])] })).toThrow(BildFehler);
  });
});

describe("falteTeilfenster", () => {
  const falter = new FalterJs();
  const kern = kernAusDaten(5, Float32Array.from({ length: 25 }, (_, i) => (1 + (i % 7)) / 100), "ungleich");

  it.each([
    ["Mitte", 20, 18],
    ["am Rand", 1, 38],
    ["Ecke", 0, 0]
  ])("gleicht bitgenau der Faltung des ganzen Rasters (Licht %s)", (_name, x, y) => {
    const r = neuesRaster(40, 40, 1, 0);
    r.daten[pixelIndex(r, x, y)] = 3;
    r.daten[pixelIndex(r, Math.min(39, x + 2), y)] = 1.5;
    const teil = falteTeilfenster(r, kern, falter)!;
    expect(Array.from(teil.daten)).toEqual(Array.from(falter.falte(r, kern).daten));
  });

  it("gleicht bitgenau der Faltung des ganzen Rasters bei 3 Kanaelen (Licht in einzelnen Kanaelen)", () => {
    const r = neuesRaster(40, 30, 3, 0);
    // Rechteck des Lichts aus verschiedenen Kanaelen: Kanal 0 links oben, Kanal 2 rechts unten, Kanal 1 am Rand.
    r.daten[pixelIndex(r, 12, 9)] = 2;
    r.daten[pixelIndex(r, 25, 17) + 2] = 1.25;
    r.daten[pixelIndex(r, 18, 29) + 1] = 0.5;
    const teil = falteTeilfenster(r, kern, falter)!;
    expect(teil.kanaele).toBe(3);
    expect(Array.from(teil.daten)).toEqual(Array.from(falter.falte(r, kern).daten));
  });

  it("ohne Licht kein Raster und keine Faltung", () => {
    const zaehler = new FalterZaehlend();
    expect(falteTeilfenster(neuesRaster(8, 8, 1, 0), kastenKern(3), zaehler)).toBeUndefined();
    expect(zaehler.aufrufe).toBe(0);
  });
});

describe("rendere mit Begleitern", () => {
  /** Hauptbild: Flaeche 0,05 ueberall; Begleiter: 4 x 4 px mit 2,0 um (+4, -3), als eigenes Bild 8 x 8 px. */
  const haupt = new QuelleAusRaster(neuesRaster(N, N, 1, 0.05), 1);
  const begleiterBild = neuesRaster(8, 8, 1, 0);
  for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) begleiterBild.daten[pixelIndex(begleiterBild, x, y)] = 2;
  /** Versetzte Quelle wie QuelleVersetzt in daten: Bildmitte bei (dx, dy). */
  const versetzt = (dx: number, dy: number) => {
    const innen = new QuelleAusRaster(begleiterBild, 1);
    return {
      ausschnitt(m: { xArcsec: number; yArcsec: number }, b: number, s: number) {
        const a = innen.ausschnitt({ xArcsec: m.xArcsec - dx, yArcsec: m.yArcsec - dy }, b, s);
        return { ...a, linksXArcsec: a.linksXArcsec + dx, obenYArcsec: a.obenYArcsec + dy };
      }
    };
  };
  const summenbild = neuesRaster(N, N, 1, 0.05);
  // Begleiterbild 8 x 8 mit Mitte (+4, -3): Pixel 2..5 liegen bei x = 4 - 4 + 2 .. => Spalten 10..13, Zeilen 9..12 des 16er-Rasters.
  for (let y = 9; y < 13; y++) for (let x = 10; x < 14; x++) summenbild.daten[pixelIndex(summenbild, x, y)] = 2.05;

  function parameter(h: Helligkeit, kern: Kern = kastenKern(3)): Simulationsparameter {
    return {
      quellbild: { schluessel: "q|0|0", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punkte: { schluessel: "p", punktquellen: [] } },
      kern,
      helligkeit: h,
      gesichtsfeld: { form: "kreis", breiteArcsec: 100, hoeheArcsec: 100 },
      fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: N },
    };
  }

  it("ohne Schwelle gleicht der Anblick dem eines Bilds mit Hauptobjekt plus Begleiter", () => {
    const basis = helligkeit();
    const eins: Helligkeit = { ...basis, deepSky: { faktor: basis.deepSky!.faktor, himmel: basis.deepSky!.himmel, schwelleRelativ: 1e-30, breite: 0.484, sockel: 0 } };
    const h: Helligkeit = { ...eins, deepSky: { ...eins.deepSky!, begleiter: [{ schwelleRelativ: 1e-30, sockel: 0 }] } };
    const mit = rendere(parameter(h), haupt, new FalterJs(), {}, [versetzt(4, -3)]);
    const summe = rendere(parameter(eins), new QuelleAusRaster(summenbild, 1), new FalterJs());
    for (let i = 0; i < mit.raster.daten.length; i++) expect(mit.raster.daten[i]).toBeCloseTo(summe.raster.daten[i] as number, 5);
  });

  it("behaelt den gefalteten Begleiter im Zwischenspeicher; ein neuer Kern faltet neu, nur im Teilfenster", () => {
    const zaehler = new FalterZaehlend();
    const zw: Zwischenspeicher = {};
    const h = helligkeit([{ schwelleRelativ: 0.5, sockel: 0 }]);
    rendere(parameter(h), haupt, zaehler, zw, [versetzt(4, -3)]);
    expect(zaehler.aufrufe).toBe(2);
    // Teilfenster: 4 x 4 Licht plus Kernradius 1 je Seite.
    expect(zaehler.pixel).toBe(N * N + 6 * 6);
    rendere(parameter({ ...h, schluessel: "h2" }), haupt, zaehler, zw, [versetzt(4, -3)]);
    expect(zaehler.aufrufe).toBe(2);
    rendere(parameter(h, deltaKern(3)), haupt, zaehler, zw, [versetzt(4, -3)]);
    expect(zaehler.aufrufe).toBe(4);
  });

  it("Begleiter ausserhalb des Fensters: keine Faltung, Anblick wie ohne Licht des Begleiters", () => {
    const zaehler = new FalterZaehlend();
    const h = helligkeit([{ schwelleRelativ: 0.5, sockel: 0.01 }]);
    const mit = rendere(parameter(h), haupt, zaehler, {}, [versetzt(400, 0)]);
    expect(zaehler.aufrufe).toBe(1);
    const ohne = rendere(parameter(helligkeit()), haupt, new FalterJs());
    expect(Array.from(mit.raster.daten)).toEqual(Array.from(ohne.raster.daten));
  });

  it.each([
    ["schwelleRelativ NaN", { schwelleRelativ: Number.NaN, sockel: 0 }],
    ["schwelleRelativ 0", { schwelleRelativ: 0, sockel: 0 }],
    ["schwelleRelativ negativ", { schwelleRelativ: -0.5, sockel: 0 }],
    ["schwelleRelativ unendlich", { schwelleRelativ: Number.POSITIVE_INFINITY, sockel: 0 }],
    ["sockel negativ", { schwelleRelativ: 0.5, sockel: -0.01 }],
    ["sockel NaN", { schwelleRelativ: 0.5, sockel: Number.NaN }]
  ])("pruefeParameter wirft BildFehler bei deepSky.begleiter mit %s", (_name, schwelle) => {
    expect(() => rendere(parameter(helligkeit([schwelle])), haupt, new FalterJs(), {}, [versetzt(4, -3)])).toThrow(BildFehler);
  });

  it("wirft, wenn deepSky Begleiter nennt, rendere aber keine Quelle dazu bekommt", () => {
    expect(() => rendere(parameter(helligkeit([{ schwelleRelativ: 0.5, sockel: 0 }])), haupt, new FalterJs())).toThrow(BildFehler);
  });
});
