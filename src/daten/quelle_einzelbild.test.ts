import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import type { Raster } from "../naht/raster";
import { pruefeBildnachweise, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { pruefeObjekte } from "./objekte";
import { objektzustand } from "./objektzustand";
import { einzelbildMassstab, quelleEinzelbild, QuelleEinzelbild } from "./quelle_einzelbild";

/** Synthetisches Bild: Kanal c von Pixel (x, y) traegt 1000 * y + 10 * x + c. */
function testbild(breite: number, hoehe: number): Raster {
  const daten = new Float32Array(breite * hoehe * 3);
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) for (let c = 0; c < 3; c++) daten[(y * breite + x) * 3 + c] = 1000 * y + 10 * x + c;
  }
  return { breite, hoehe, kanaele: 3, daten };
}

/** Wert von Kanal c am Pixel (x, y) des Ausschnitts. */
function wert(raster: Raster, x: number, y: number, c = 0): number {
  return raster.daten[(y * raster.breite + x) * raster.kanaele + c]!;
}

const MITTE = { xArcsec: 0, yArcsec: 0 };

/** Nachweis eines Einzelbilds 8x6 px mit 4 px Scheibe, aufgenommen bei 2 Bogensekunden. */
function nachweisTest(): Bildnachweis {
  const echt = pruefeBildnachweise(bilderJson).find((n) => n.id === "mars_hst_19950225")!;
  return { ...echt, pixelBreite: 8, pixelHoehe: 6, objektDurchmesserPx: 4, winkelgroesseArcsec: 2, bogensekundenProPixel: 0.5 };
}

describe("QuelleEinzelbild", () => {
  it("nimmt den Massstab aus Winkelgroesse des Zustands und objekt_durchmesser_px", () => {
    const n = nachweisTest();
    expect(einzelbildMassstab(n, 4)).toBe(1);
    // Ein anderer Zustand mit demselben Bild bekommt einen anderen Massstab.
    expect(einzelbildMassstab(n, 2)).toBe(0.5);
    expect(quelleEinzelbild(n, 4, testbild(8, 6)).massstabArcsecProPx).toBe(1);
  });

  it("liefert das ganze Bild mit der Bildmitte als Objektmitte und Norden in Zeile 0", () => {
    const quelle = quelleEinzelbild(nachweisTest(), 4, testbild(8, 6));
    const a = quelle.ausschnitt(MITTE, 100, 0.25);
    expect([a.raster.breite, a.raster.hoehe, a.raster.kanaele]).toEqual([8, 6, 3]);
    // Immer im eigenen Massstab, auch wenn feiner angefragt wird (Vertrag: nie groeber).
    expect(a.massstabArcsecProPx).toBe(1);
    expect([a.linksXArcsec, a.obenYArcsec]).toEqual([-4, 3]);
    expect(wert(a.raster, 0, 0)).toBe(0);
    expect(wert(a.raster, 7, 5, 2)).toBe(5072);
  });

  it("schneidet den angefragten Bereich mit einem Pixel Rand aus", () => {
    const quelle = quelleEinzelbild(nachweisTest(), 4, testbild(8, 6));
    // Bereich 2x2 Bogensekunden um (1, 1): Pixel x 4..5, y 1..2, mit Rand x 3..6, y 0..3.
    const a = quelle.ausschnitt({ xArcsec: 1, yArcsec: 1 }, 2, 1);
    expect([a.raster.breite, a.raster.hoehe]).toEqual([4, 4]);
    expect([a.linksXArcsec, a.obenYArcsec]).toEqual([-1, 3]);
    expect(wert(a.raster, 0, 0)).toBe(30);
    expect(wert(a.raster, 3, 3, 1)).toBe(3061);
    // Gleiche Argumente, gleiches Ergebnis (synchroner Vertrag).
    expect(quelle.ausschnitt({ xArcsec: 1, yArcsec: 1 }, 2, 1).raster.daten).toEqual(a.raster.daten);
  });

  it("liefert ausserhalb des Bilds ein schwarzes Pixel", () => {
    const quelle = quelleEinzelbild(nachweisTest(), 4, testbild(8, 6));
    const a = quelle.ausschnitt({ xArcsec: 50, yArcsec: 0 }, 2, 1);
    expect([a.raster.breite, a.raster.hoehe]).toEqual([1, 1]);
    expect(Array.from(a.raster.daten)).toEqual([0, 0, 0]);
  });

  it("weist falsche Masse, Kachelpyramiden und unsinnige Werte ab", () => {
    expect(() => quelleEinzelbild(nachweisTest(), 4, testbild(8, 5))).toThrow(DatenFehler);
    const mond = pruefeBildnachweise(bilderJson).find((n) => n.kacheln !== undefined)!;
    expect(() => einzelbildMassstab(mond, 1865)).toThrow(DatenFehler);
    expect(() => einzelbildMassstab(nachweisTest(), 0)).toThrow(DatenFehler);
    expect(() => new QuelleEinzelbild(testbild(2, 2), -1)).toThrow(DatenFehler);
    expect(() => new QuelleEinzelbild({ breite: 2, hoehe: 2, kanaele: 3, daten: new Float32Array(5) }, 1)).toThrow(DatenFehler);
  });
});

describe("QuelleEinzelbild mit Mars aus daten/", () => {
  const nachweise = pruefeBildnachweise(bilderJson);
  const objekte = pruefeObjekte(objekteJson);

  it("passt zu objektzustand: gleicher Massstab fuer mars_25, mars_14 und mars_6", () => {
    for (const id of ["mars_25", "mars_14", "mars_6"]) {
      const zustand = objektzustand(objekte, nachweise, id)!;
      const nachweis = nachweise.find((n) => n.id === objekte.find((o) => o.id === "mars")!.zustaende.find((z) => z.id === id)!.bild)!;
      expect(einzelbildMassstab(nachweis, zustand.durchmesserArcsec)).toBeCloseTo(zustand.quelle.massstabArcsecProPx, 12);
    }
    // mars_6 und mars_14 teilen das Bild von 1995 mit 620 px Scheibe.
    expect(objektzustand(objekte, nachweise, "mars_6")!.quelle.massstabArcsecProPx).toBeCloseTo(6 / 620, 12);
    expect(objektzustand(objekte, nachweise, "mars_14")!.quelle.breitePx).toBe(664);
  });
});
