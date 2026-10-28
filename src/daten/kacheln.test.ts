import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import type { Raster } from "../naht/raster";
import { pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { kachelPfad, type KachelSrgb, pyramidengeometrie, QuelleKacheln } from "./kacheln";
import { rgbaZuRaster, rgbaZuSrgb } from "./kachellader";
import { adresseText, pyramideAusRaster, quelleRaster, schneideKachel } from "./testkacheln";

const MITTE = { xArcsec: 0, yArcsec: 0 };

/** 10x6 Pixel, ein Kanal, Wert zeile * 10 + spalte + 1 (nie 0, damit Schwarz auffaellt). */
function zaehlRaster(breite = 10, hoehe = 6): Raster {
  const daten = new Float32Array(breite * hoehe);
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) daten[y * breite + x] = y * 10 + x + 1;
  return { breite, hoehe, kanaele: 1, daten };
}

/** Pyramide 10x6, 5x3, 3x2 mit Kacheln 4 px, Stufe 0 mit 1"/px; Bildmitte = Objektmitte. */
function testquelle(optionen: Parameters<typeof quelleRaster>[3] = {}) {
  const stufen = pyramideAusRaster(zaehlRaster(), 3);
  return { ...quelleRaster(stufen, 1, 4, optionen), stufen };
}

/** Wert der Quelle am Pixel (x, y) eines Ausschnitts, in Pixeln der Stufe gerechnet. */
function wertAus(raster: Raster, x: number, y: number): number {
  return raster.daten[y * raster.breite + x]!;
}

describe("QuelleKacheln Stufenwahl", () => {
  it("waehlt die groebste Stufe, die feiner oder gleich dem gewuenschten Massstab ist", () => {
    const { quelle } = testquelle();
    expect(quelle.geometrie.stufen.map((s) => s.massstabArcsecProPx)).toEqual([1, 2, 10 / 3]);
    expect([0.5, 1, 1.9, 2, 3, 3.4, 100].map((m) => quelle.stufeFuer(m))).toEqual([0, 0, 0, 1, 1, 2, 2]);
  });

  it("nimmt Rundungsfehler beim gleichen Massstab hin", () => {
    const { quelle } = testquelle();
    expect(quelle.stufeFuer(2 * (1 - 1e-12))).toBe(1);
  });
});

describe("QuelleKacheln Kachelauswahl", () => {
  it("braucht fuer das ganze Bild alle Kacheln der Stufe", () => {
    const { quelle } = testquelle();
    expect(quelle.kachelnFuer(MITTE, 20, 1).map(adresseText)).toEqual(["0/0_0", "0/1_0", "0/2_0", "0/0_1", "0/1_1", "0/2_1"]);
  });

  it("waehlt am Rand nur die Randkachel und ausserhalb keine", () => {
    const { quelle } = testquelle();
    // Nordost-Ecke: x 4 bis 5, y 2 bis 3 Bogensekunden, also Pixel 8..10 x 0..2 (mit Rand).
    expect(quelle.kachelnFuer({ xArcsec: 4.5, yArcsec: 2.5 }, 1, 1).map(adresseText)).toEqual(["0/2_0"]);
    // Sued: y -3 ist der Suedrand, Zeilen 4 und 5 liegen in Kachelzeile 1.
    expect(quelle.kachelnFuer({ xArcsec: -4.5, yArcsec: -2.5 }, 1, 1).map(adresseText)).toEqual(["0/0_1"]);
    expect(quelle.kachelnFuer({ xArcsec: 100, yArcsec: 0 }, 10, 1)).toEqual([]);
  });
});

describe("QuelleKacheln ausschnitt", () => {
  it("setzt den Ausschnitt ueber Kachelgrenzen aus den Quellpixeln zusammen", async () => {
    const { quelle, stufen } = testquelle();
    await quelle.lade(MITTE, 4, 1);
    const a = quelle.ausschnitt(MITTE, 4, 1);
    // Bereich x -2..2, y -2..2 plus ein Pixel Rand: Spalten 2..8, Zeilen 0..6 (oben begrenzt).
    expect([a.raster.breite, a.raster.hoehe, a.massstabArcsecProPx]).toEqual([6, 6, 1]);
    expect([a.linksXArcsec, a.obenYArcsec]).toEqual([-3, 3]);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) expect(wertAus(a.raster, x, y)).toBe(wertAus(stufen[0]!, x + 2, y));
  });

  it("liefert auf groeberen Stufen auch die kleineren Randkacheln", async () => {
    const { quelle, stufen } = testquelle();
    await quelle.lade(MITTE, 20, 2);
    const a = quelle.ausschnitt(MITTE, 20, 2);
    expect(a.raster).toEqual(stufen[1]);
    expect([a.massstabArcsecProPx, a.linksXArcsec, a.obenYArcsec]).toEqual([2, -5, 3]);
  });

  it("liefert ausserhalb der Pyramide Schwarz", () => {
    const { quelle } = testquelle();
    const a = quelle.ausschnitt({ xArcsec: 0, yArcsec: 50 }, 10, 1);
    expect([a.raster.breite, a.raster.hoehe, a.raster.daten[0]]).toEqual([1, 1, 0]);
  });

  it("zeigt nicht geladene Kacheln schwarz, ohne zu laden", () => {
    const { quelle, geladen } = testquelle();
    const a = quelle.ausschnitt(MITTE, 20, 1);
    expect([a.raster.breite, a.raster.hoehe]).toEqual([10, 6]);
    expect(a.raster.daten.every((w) => w === 0)).toBe(true);
    expect(geladen).toEqual([]);
  });

  it("behandelt drei Kanaele", async () => {
    const r = zaehlRaster(8, 8);
    const rgb: Raster = { breite: 8, hoehe: 8, kanaele: 3, daten: new Float32Array(8 * 8 * 3) };
    r.daten.forEach((w, i) => rgb.daten.set([w, 2 * w, 3 * w], i * 3));
    const { quelle } = quelleRaster(pyramideAusRaster(rgb, 2), 0.5, 4);
    await quelle.lade(MITTE, 4, 0.5);
    expect(quelle.ausschnitt(MITTE, 4, 0.5).raster).toEqual(rgb);
  });
});

describe("QuelleKacheln Cache", () => {
  it("laedt jede Kachel nur einmal, auch bei gleichzeitigen Aufrufen", async () => {
    const { quelle, geladen } = testquelle();
    await Promise.all([quelle.lade(MITTE, 4, 1), quelle.lade(MITTE, 4, 1)]);
    // Spalten 2..8 und Zeilen 0..6 liegen in den Kachelspalten 0 und 1.
    expect(geladen).toEqual(["0/0_0", "0/1_0", "0/0_1", "0/1_1"]);
    await quelle.lade(MITTE, 4, 1);
    await quelle.lade({ xArcsec: -4.5, yArcsec: 2.5 }, 1, 1);
    expect(geladen).toHaveLength(4);
    expect(quelle.kachelnImCache).toBe(4);
    await quelle.lade({ xArcsec: 4.5, yArcsec: 2.5 }, 1, 1);
    expect(geladen.slice(4)).toEqual(["0/2_0"]);
  });

  it("verdraengt die am laengsten unbenutzte Kachel, nie die gerade benoetigten", async () => {
    const { quelle } = testquelle({ maxKacheln: 2 });
    await quelle.lade({ xArcsec: -4.5, yArcsec: 2.5 }, 1, 1); // 0/0_0
    await quelle.lade({ xArcsec: 4.5, yArcsec: 2.5 }, 1, 1); // 0/2_0
    await quelle.lade({ xArcsec: 4.5, yArcsec: -2.5 }, 1, 1); // 0/2_1, verdraengt 0/0_0
    expect(quelle.kachelnImCache).toBe(2);
    expect(quelle.ausschnitt({ xArcsec: -4.5, yArcsec: 2.5 }, 1, 1).raster.daten.every((w) => w === 0)).toBe(true);
    await quelle.lade(MITTE, 20, 1); // braucht 6 Kacheln, alle bleiben fuer diesen Ausschnitt
    expect(quelle.kachelnImCache).toBe(6);
    expect(quelle.ausschnitt(MITTE, 20, 1).raster.daten.every((w) => w > 0)).toBe(true);
  });

  it("verdraengt bei gleichzeitigen Aufrufen nicht die Kacheln einer neueren, schon fertigen Anfrage", async () => {
    // Lader, der jede Kachel erst auf Freigabe liefert; maxKacheln 1.
    const stufe0 = zaehlRaster();
    const freigaben = new Map<string, () => void>();
    const lader = (stufe: number, x: number, y: number) =>
      new Promise<Raster>((erfuellt) => freigaben.set(`${stufe}/${x}_${y}`, () => erfuellt(schneideKachel(stufe0, 4, x, y))));
    const quelle = new QuelleKacheln({ kachelPx: 4, kanaele: 1, stufen: [{ breitePx: 10, hoehePx: 6, massstabArcsecProPx: 1 }] }, lader, 1);
    const nordwest = { xArcsec: -4.5, yArcsec: 2.5 }; // Kachel 0/0_0
    const nordost = { xArcsec: 4.5, yArcsec: 2.5 }; // Kachel 0/2_0
    const sued = { xArcsec: 4.5, yArcsec: -2.5 }; // Kachel 0/2_1
    const istSchwarz = (mitte: typeof MITTE) => quelle.ausschnitt(mitte, 1, 1).raster.daten.every((w) => w === 0);

    const a = quelle.lade(nordwest, 1, 1); // aeltere Anfrage
    const b = quelle.lade(nordost, 1, 1); // neuere Anfrage
    freigaben.get("0/2_0")!();
    await b;
    expect(istSchwarz(nordost)).toBe(false);
    freigaben.get("0/0_0")!();
    await a; // A wird spaeter fertig und darf B nicht verdraengen
    expect(istSchwarz(nordost)).toBe(false);
    expect(istSchwarz(nordwest)).toBe(false);
    expect(quelle.kachelnImCache).toBe(2);

    // Eine dritte, abgeschlossene Anfrage gibt die alten Kacheln frei.
    const c = quelle.lade(sued, 1, 1);
    freigaben.get("0/2_1")!();
    await c;
    expect(quelle.kachelnImCache).toBe(1);
    expect(istSchwarz(sued)).toBe(false);
  });

  it("laedt nach einem Fehler die anderen Kacheln und versucht die fehlende erneut", async () => {
    const { quelle, geladen } = testquelle({ fehlschlagen: new Set(["0/0_0"]) });
    await expect(quelle.lade(MITTE, 20, 1)).rejects.toThrow("absichtlich");
    expect(quelle.kachelnImCache).toBe(5);
    const a = quelle.ausschnitt(MITTE, 20, 1);
    expect(wertAus(a.raster, 0, 0)).toBe(0);
    expect(wertAus(a.raster, 4, 0)).toBe(5);
    await expect(quelle.lade(MITTE, 20, 1)).rejects.toThrow();
    expect(geladen.filter((k) => k === "0/0_0")).toHaveLength(2);
  });

  it("weist Kacheln mit falschen Massen zurueck", async () => {
    const lader = async (): Promise<Raster> => ({ breite: 4, hoehe: 4, kanaele: 1, daten: new Float32Array(16) });
    const quelle = new QuelleKacheln({ kachelPx: 4, kanaele: 1, stufen: [{ breitePx: 6, hoehePx: 4, massstabArcsecProPx: 1 }] }, lader);
    // Kachel 1_0 muss 2x4 sein (Randkachel).
    await expect(quelle.lade(MITTE, 10, 1)).rejects.toThrow(DatenFehler);
    expect(quelle.kachelnImCache).toBe(1);
  });
});

describe("QuelleKacheln mit 8-Bit-sRGB-Kacheln (Issue #66)", () => {
  // Zwei Stufen 37x23 und 19x12 mit drei Kanaelen und Kacheln 8 px (Randkacheln kleiner), Bytes
  // aus einem festen Pseudozufall; dieselben Bytes einmal als sRGB-Kachel, einmal ueber rgbaZuRaster.
  const stufen = [
    { breitePx: 37, hoehePx: 23, massstabArcsecProPx: 1 },
    { breitePx: 19, hoehePx: 12, massstabArcsecProPx: 37 / 19 }
  ];
  const geometrie = { kachelPx: 8, kanaele: 3 as const, stufen };
  function rgba(stufe: number, x: number, y: number): { rgba: Uint8Array; breite: number; hoehe: number } {
    const breite = Math.min(8, stufen[stufe]!.breitePx - x * 8);
    const hoehe = Math.min(8, stufen[stufe]!.hoehePx - y * 8);
    const bytes = new Uint8Array(breite * hoehe * 4);
    let z = 1 + stufe * 7919 + x * 104729 + y * 1299709;
    for (let i = 0; i < bytes.length; i++) {
      z = (z * 1103515245 + 12345) % 2147483648;
      bytes[i] = z % 256;
    }
    return { rgba: bytes, breite, hoehe };
  }
  const alsSrgb = new QuelleKacheln(geometrie, async (s, x, y) => {
    const r = rgba(s, x, y);
    return rgbaZuSrgb(r.rgba, r.breite, r.hoehe);
  });
  const alsFloat = new QuelleKacheln(geometrie, async (s, x, y) => {
    const r = rgba(s, x, y);
    return rgbaZuRaster(r.rgba, r.breite, r.hoehe);
  });

  it("der Ausschnitt ist bitgleich zum Pfad ueber lineare Float-Kacheln", async () => {
    const faelle: [number, number, number, number][] = [
      [0, 0, 40, 1],
      [3.3, -2.1, 13, 1],
      [-15, 9, 9, 1],
      [0, 0, 60, 37 / 19],
      [10, 5, 21, 37 / 19]
    ];
    for (const [x, y, breite, massstab] of faelle) {
      const mitte = { xArcsec: x, yArcsec: y };
      await alsSrgb.lade(mitte, breite, massstab);
      await alsFloat.lade(mitte, breite, massstab);
      const a = alsSrgb.ausschnitt(mitte, breite, massstab);
      const b = alsFloat.ausschnitt(mitte, breite, massstab);
      expect(a.raster.breite).toBe(b.raster.breite);
      expect(a.raster.hoehe).toBe(b.raster.hoehe);
      expect(a.linksXArcsec).toBe(b.linksXArcsec);
      expect(a.obenYArcsec).toBe(b.obenYArcsec);
      expect(Array.from(a.raster.daten)).toEqual(Array.from(b.raster.daten));
    }
  });

  it("weist sRGB-Kacheln mit falschen Massen oder bei einem Kanal zurueck", async () => {
    const falsch = new QuelleKacheln(geometrie, async (): Promise<KachelSrgb> => ({ breite: 8, hoehe: 8, srgb: new Uint8Array(8 * 8 * 3) }));
    // Kachel 4_0 der Stufe 0 muss 5x8 sein (Randkachel).
    await expect(falsch.lade({ xArcsec: 16, yArcsec: 0 }, 4, 1)).rejects.toThrow(DatenFehler);
    const einKanal = new QuelleKacheln({ ...geometrie, kanaele: 1 }, async (): Promise<KachelSrgb> => ({ breite: 8, hoehe: 8, srgb: new Uint8Array(8 * 8 * 3) }));
    await expect(einKanal.lade(MITTE, 4, 1)).rejects.toThrow(DatenFehler);
  });
});

describe("QuelleKacheln mit dem Mond aus daten/bilder.json", () => {
  const nachweis = pruefeBildnachweise(bilderJson).find((n) => n.id === "mond_svs5587_6285")!;
  const geometrie = pyramidengeometrie(nachweis, 1865);
  // Nur die Dateinamen; die Bilder werden nicht geladen.
  const dateien = new Set(Object.keys(import.meta.glob("../../daten/bilder/mond/*/*.webp")).map((p) => p.replace("../../daten/bilder/", "")));

  it("skaliert den Massstab auf die Winkelgroesse des Zustands", () => {
    const m0 = 1865 / 2758;
    expect(geometrie.stufen.map((s) => s.massstabArcsecProPx)).toEqual([m0, 2 * m0, 4 * m0]);
    expect(geometrie.stufen[0]!.massstabArcsecProPx).toBeCloseTo(0.6762, 4);
    // Ganze Bildbreite: 3072 px * 0,6762 = 2077,3 Bogensekunden, Scheibe 1865.
    expect(3072 * m0).toBeCloseTo(2077.3, 1);
  });

  it("findet fuer jede Kachel aller Stufen eine Datei (49 Kacheln)", () => {
    const quelle = new QuelleKacheln(geometrie, async () => Promise.reject(new Error("nicht laden")));
    const alle = geometrie.stufen.flatMap((s) => quelle.kachelnFuer(MITTE, 4000, s.massstabArcsecProPx));
    expect(alle).toHaveLength(49);
    expect(dateien.size).toBe(49);
    for (const adresse of alle) expect(dateien.has(kachelPfad(nachweis, adresse))).toBe(true);
  });

  it("braucht fuer einen Krater in der Mitte bei feinem Massstab nur vier Kacheln der Stufe 0", () => {
    const quelle = new QuelleKacheln(geometrie, async () => Promise.reject(new Error("nicht laden")));
    expect(quelle.kachelnFuer(MITTE, 120, 0.5).map(adresseText)).toEqual(["0/2_2", "0/3_2", "0/2_3", "0/3_3"]);
    expect(quelle.kachelnFuer(MITTE, 2000, 2.7).every((a) => a.stufe === 1)).toBe(true);
    expect(quelle.kachelnFuer(MITTE, 2000, 3).map(adresseText)).toEqual(["2/0_0", "2/1_0", "2/0_1", "2/1_1"]);
  });
});
