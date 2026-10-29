// Tonwert Version 2 (Issue #101, docs/architektur.md 5.3): drei Faelle der Flaechenformel,
// Punktanteil mit Faerbung, Zustaende ohne Quellbild, getrennte Zwischenspeicher. Alle Parameter
// synthetisch (physik auswerten V2 liefert sie erst mit #100).
import { describe, expect, it } from "vitest";
import type { Helligkeit, Kern, Punktquelle, Simulationsparameter } from "../naht/simulationsparameter";
import { FalterJs, type Falter } from "./falter";
import { BildFehler } from "./fehler";
import { malePunktquellen } from "./male";
import { brauchtFaerbung, falteFaerbung, faltePunkte } from "./punktebene";
import { QuelleAusRaster, type Objektpunkt, type Quellausschnitt, type Quelle } from "./quelle";
import { neuesRaster, pixelIndex, type Raster } from "./raster";
import { phi, rendere, tonwert, type Zwischenspeicher } from "./rendere";
import { deltaKern, kastenKern } from "./testkerne";

const N = 16;

/** Pseudozufall (LCG), damit die Bitvergleiche reproduzierbar sind. */
function zufallsRaster(breite: number, kanaele: 1 | 3, saat: number, max = 2): Raster {
  const r = neuesRaster(breite, breite, kanaele);
  let x = saat;
  for (let i = 0; i < r.daten.length; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    r.daten[i] = (x / 2147483648) * max;
  }
  return r;
}

/** Punktebene mit Nullen und Werten, wie sie die Faltung liefert. */
function punktRaster(breite: number, saat: number): Raster {
  const r = zufallsRaster(breite, 1, saat, 0.05);
  for (let i = 0; i < r.daten.length; i += 3) r.daten[i] = 0;
  return r;
}

function helligkeit(teil: Partial<Helligkeit> = {}): Helligkeit {
  return { schluessel: "h", faktorObjekt: 0.83, hintergrundRelativ: 0.0123, hintergrundMagProArcsec2: 21, punktFaktor: 4.9, punktExponent: 1 / 3, mischgewicht: 0, ...teil };
}

const deepSky = { faktor: 0.02, himmel: 0.0008, schwelleRelativ: 0.15, breite: 0.484, sockel: 0.004 };

/** tonwert aus Version 1 (Stand main vor #101), Zeichen fuer Zeichen, als Referenz der Bitgleichheit. */
function tonwertV1(raster: Raster, punktebene: Raster | undefined, h: Helligkeit): Raster {
  const d = raster.daten;
  const ergebnis = new Float32Array(d.length);
  const f = h.faktorObjekt;
  const hg = h.hintergrundRelativ;
  for (let i = 0; i < d.length; i++) ergebnis[i] = f * (d[i] as number) + hg;
  if (punktebene === undefined) return { ...raster, daten: ergebnis };
  const p = punktebene.daten;
  const a = h.punktFaktor;
  const n = h.punktExponent;
  const kanaele = raster.kanaele | 0;
  for (let i = 0; i < p.length; i++) {
    const wert = p[i] as number;
    if (!(wert > 0)) continue;
    const w = Math.min(1, Math.pow(a * wert, n));
    for (let c = i * kanaele; c < (i + 1) * kanaele; c++) ergebnis[c] = (ergebnis[c] as number) + w;
  }
  return { ...raster, daten: ergebnis };
}

const bytes = (r: Raster): Uint8Array => new Uint8Array(r.daten.buffer, r.daten.byteOffset, r.daten.byteLength);

describe("phi", () => {
  it("Normalverteilung an bekannten Stellen (Fehler unter 7,5e-8, geprueft auf 5e-7)", () => {
    expect(phi(0)).toBeCloseTo(0.5, 6);
    expect(phi(1)).toBeCloseTo(0.8413447461, 6);
    expect(phi(-1)).toBeCloseTo(0.1586552539, 6);
    expect(phi(1.959964)).toBeCloseTo(0.975, 6);
    expect(phi(-1 / 0.484)).toBeCloseTo(0.0194086, 6);
    expect(phi(-40)).toBe(0);
    expect(phi(40)).toBe(1);
    for (const x of [0.1, 0.7, 2.3, 4]) expect(phi(x) + phi(-x)).toBeCloseTo(1, 12);
  });
});

describe("tonwert Fall 1: deepSky fehlt, mischgewicht 0", () => {
  it("bitgleich mit Version 1, ein und drei Kanaele, mit und ohne Punktebene", () => {
    for (const kanaele of [1, 3] as const) {
      for (const [saat, h] of [
        [7, helligkeit()],
        [11, helligkeit({ faktorObjekt: 1.7, hintergrundRelativ: 0.3, punktFaktor: 0.2, punktExponent: 1 })],
        [13, helligkeit({ faktorObjekt: 9.1, punktExponent: 0.5 })]
      ] as const) {
        const q = zufallsRaster(N, kanaele, saat);
        const p = punktRaster(N, saat + 1);
        expect(bytes(tonwert(q, undefined, h))).toEqual(bytes(tonwertV1(q, undefined, h)));
        expect(bytes(tonwert(q, p, h))).toEqual(bytes(tonwertV1(q, p, h)));
        expect(tonwert(q, p, h).kanaele).toBe(kanaele);
      }
    }
  });

  it("ohne Objektraster (q = 0) gleich dem Nullraster, bytegleich, mit den angegebenen Kanaelen", () => {
    const h = helligkeit();
    const p = punktRaster(N, 3);
    for (const kanaele of [1, 3] as const) {
      const ohne = tonwert(undefined, p, h, { rasterPx: N, kanaele });
      expect(ohne.kanaele).toBe(kanaele);
      expect(bytes(ohne)).toEqual(bytes(tonwertV1(neuesRaster(N, N, kanaele), p, h)));
    }
    expect(() => tonwert(undefined, undefined, h)).toThrow(BildFehler);
  });
});

describe("tonwert Fall 2: deepSky fehlt, mischgewicht > 0", () => {
  it("(1 - g) f q + h + g min(1, (aP q)^n)", () => {
    const q = zufallsRaster(N, 3, 5);
    const g = 0.37;
    const h = helligkeit({ mischgewicht: g });
    const t = tonwert(q, undefined, h);
    expect(t.kanaele).toBe(3);
    for (let i = 0; i < q.daten.length; i++) {
      const w = q.daten[i] as number;
      expect(t.daten[i]).toBeCloseTo((1 - g) * 0.83 * w + 0.0123 + g * Math.min(1, Math.cbrt(4.9 * w)), 6);
    }
  });

  it("stetig bei g gegen 0, Fluss der Punktebene wird wie in Fall 1 addiert", () => {
    const q = zufallsRaster(N, 1, 9);
    const p = punktRaster(N, 10);
    const fall1 = tonwert(q, p, helligkeit());
    const klein = tonwert(q, p, helligkeit({ mischgewicht: 1e-9 }));
    for (let i = 0; i < q.daten.length; i++) expect(klein.daten[i]).toBeCloseTo(fall1.daten[i] as number, 6);
    const g = tonwert(q, p, helligkeit({ mischgewicht: 0.5 }));
    const gOhne = tonwert(q, undefined, helligkeit({ mischgewicht: 0.5 }));
    for (let i = 0; i < p.daten.length; i++) {
      const pw = p.daten[i] as number;
      const erwartet = (gOhne.daten[i] as number) + (pw > 0 ? Math.min(1, Math.cbrt(4.9 * pw)) : 0);
      expect(g.daten[i]).toBeCloseTo(erwartet, 6);
    }
  });

  it("ohne Objektraster gleich dem Nullraster", () => {
    const h = helligkeit({ mischgewicht: 0.6 });
    expect(bytes(tonwert(undefined, undefined, h, { rasterPx: N }))).toEqual(bytes(tonwert(neuesRaster(N, N), undefined, h)));
  });
});

describe("tonwert Fall 3: deepSky vorhanden", () => {
  const n = 1 / 3;
  const hRel = 0.0008 ** n;
  const h = helligkeit({ hintergrundRelativ: hRel, deepSky });
  const erwartet = (q: number): number => {
    const p = phi((q / deepSky.schwelleRelativ - 1) / deepSky.breite);
    return hRel + p * (Math.min(1, Math.cbrt(deepSky.faktor * q + deepSky.himmel)) - hRel + deepSky.sockel);
  };

  it("h + P (min(1, (a q + s)^n) - h + Sockel), an der Schwelle P = 0,5", () => {
    const q = neuesRaster(4, 4);
    const werte = [0, 0.01, 0.075, 0.15, 0.3, 0.6, 1, 2, 5, 20, 100, 1000, 49999, 50001, 1e6, 0.149];
    q.daten.set(werte);
    const t = tonwert(q, undefined, h);
    for (let i = 0; i < werte.length; i++) expect(t.daten[i]).toBeCloseTo(erwartet(werte[i] as number), 6);
    const schwelle = (t.daten[3] as number) - hRel;
    expect(schwelle).toBeCloseTo(0.5 * (Math.cbrt(0.02 * 0.15 + 0.0008) - hRel + 0.004), 6);
  });

  it("monoton in q, weit unter der Schwelle nahe am Himmel, weit darueber ohne Deckkraftverlust", () => {
    const q = neuesRaster(64, 1);
    for (let i = 0; i < 64; i++) q.daten[i] = 0.01 * 1.25 ** i;
    const t = tonwert(q, undefined, h);
    for (let i = 1; i < 64; i++) expect(t.daten[i]).toBeGreaterThanOrEqual(t.daten[i - 1] as number);
    expect(t.daten[0]).toBeCloseTo(hRel, 3);
    // q = 0,01 * 1,25^30 = 8,08: P = 1, Zuwachs plus Sockel.
    expect(t.daten[30]).toBeCloseTo(Math.cbrt(0.02 * 0.01 * 1.25 ** 30 + 0.0008) + 0.004, 6);
    // Sehr hell: min(1, ...) begrenzt den Zuwachs, Pixel 1 + Sockel (Begrenzung erst beim Zeichnen).
    expect(t.daten[63]).toBeCloseTo(1 + 0.004, 6);
  });

  it("hat Vorrang vor mischgewicht; ohne Objektraster F(0) = h + Phi(-1/Breite) (s^n - h + Sockel)", () => {
    const q = zufallsRaster(N, 1, 21, 0.5);
    expect(bytes(tonwert(q, undefined, { ...h, mischgewicht: 0.4 }))).toEqual(bytes(tonwert(q, undefined, h)));
    const ohne = tonwert(undefined, undefined, h, { rasterPx: N });
    expect(bytes(ohne)).toEqual(bytes(tonwert(neuesRaster(N, N), undefined, h)));
    expect(ohne.daten[0]).toBeCloseTo(hRel + phi(-1 / 0.484) * 0.004, 7);
  });
});

describe("tonwert Fall 2 und 3: Absicherung und schneller Weg fuer q = 0", () => {
  const hRel = 0.0008 ** (1 / 3);
  const allgemein2 = (q: number, g: number): number => (1 - g) * 0.83 * q + 0.0123 + g * Math.min(1, Math.pow(Math.max(0, 4.9 * q), 1 / 3));
  const allgemein3 = (q: number, ds: typeof deepSky): number =>
    hRel + phi((q / ds.schwelleRelativ - 1) / ds.breite) * (Math.min(1, Math.pow(Math.max(0, ds.faktor * q + ds.himmel), 1 / 3)) - hRel + ds.sockel);

  it("leicht negatives q (Faltung) ergibt kein NaN, auch mit himmel = 0", () => {
    const q = neuesRaster(4, 1);
    q.daten.set([-1e-6, -0.01, 0, 0.2]);
    const himmel0 = { ...deepSky, himmel: 0 };
    for (const h of [helligkeit({ mischgewicht: 0.3 }), helligkeit({ hintergrundRelativ: hRel, deepSky }), helligkeit({ hintergrundRelativ: hRel, deepSky: himmel0 })]) {
      for (const wert of tonwert(q, undefined, h).daten) expect(Number.isFinite(wert)).toBe(true);
    }
    const t = tonwert(q, undefined, helligkeit({ hintergrundRelativ: hRel, deepSky: himmel0 }));
    expect(t.daten[0]).toBeCloseTo(hRel + phi(-1 / 0.484) * (-hRel + 0.004), 6);
  });

  it("schneller Weg fuer q = 0 bitgleich zum allgemeinen Ausdruck, gemischt mit q != 0", () => {
    const q = zufallsRaster(N, 3, 61, 0.5);
    for (let i = 0; i < q.daten.length; i += 2) q.daten[i] = 0;
    q.daten[1] = -0;
    const g = 0.3;
    const t2 = tonwert(q, undefined, helligkeit({ mischgewicht: g }));
    const t3 = tonwert(q, undefined, helligkeit({ hintergrundRelativ: hRel, deepSky }));
    for (let i = 0; i < q.daten.length; i++) {
      const w = q.daten[i] as number;
      expect(t2.daten[i]).toBe(Math.fround(allgemein2(w, g)));
      expect(t3.daten[i]).toBe(Math.fround(allgemein3(w, deepSky)));
    }
  });
});

describe("tonwert Punktanteil mit Faerbung", () => {
  it("Pixel_k = F_k + c_k / p * W, einkanaliges q wird dreikanalig", () => {
    const q = zufallsRaster(4, 1, 31);
    const p = neuesRaster(4, 4);
    const c = neuesRaster(4, 4, 3);
    p.daten[5] = 0.02;
    c.daten.set([0.02 * 0.5 * 0.9, 0.02 * 0.5 * 1.0, 0.02 * 0.5 * 1.3], 15);
    const hl = helligkeit();
    const t = tonwert(q, p, hl, { faerbung: c });
    expect(t.kanaele).toBe(3);
    const f = (i: number): number => 0.83 * (q.daten[i] as number) + 0.0123;
    const w = Math.min(1, Math.cbrt(4.9 * 0.02));
    expect(t.daten[15]).toBeCloseTo(f(5) + 0.45 * w, 6);
    expect(t.daten[16]).toBeCloseTo(f(5) + 0.5 * w, 6);
    expect(t.daten[17]).toBeCloseTo(f(5) + 0.65 * w, 6);
    // Ohne Punkt: drei gleiche Kanaele mit dem Flaechenanteil, bytegleich mit Fall 1.
    const einkanalig = tonwert(q, undefined, hl);
    for (let i = 0; i < 16; i++) {
      if (i === 5) continue;
      for (let k = 0; k < 3; k++) expect(t.daten[3 * i + k]).toBe(einkanalig.daten[i]);
    }
  });

  it("graue Sterne mit Deckkraft 1 in der Faerbung: gleiche Bytes wie ohne Faerbung", () => {
    const quell = { schluessel: "q", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0 };
    const sterne: Punktquelle[] = [
      { name: "A", xArcsec: 1.3, yArcsec: -0.7, durchmesserArcsec: 0.01, helligkeitRelativ: 900, sichtbar: true },
      { name: "B", xArcsec: 2.1, yArcsec: 0.4, durchmesserArcsec: 0.01, helligkeitRelativ: 300, sichtbar: true }
    ];
    const scheibchen = malePunktquellen({ ...quell, punkte: { schluessel: "p", punktquellen: sterne } });
    const kern = kastenKern(3);
    const p = faltePunkte(scheibchen, kern, N);
    const c = falteFaerbung(scheibchen, kern, N);
    const q = zufallsRaster(N, 1, 41);
    const hl = helligkeit();
    const mit = tonwert(q, p, hl, { faerbung: c });
    const ohne = tonwert(q, p, hl);
    for (let i = 0; i < N * N; i++) for (let k = 0; k < 3; k++) expect(mit.daten[3 * i + k]).toBe(ohne.daten[i]);
  });

  it("wirft BildFehler bei unpassender Faerbung", () => {
    const q = neuesRaster(4, 4);
    expect(() => tonwert(q, neuesRaster(4, 4), helligkeit(), { faerbung: neuesRaster(4, 4, 1) })).toThrow(BildFehler);
    expect(() => tonwert(q, undefined, helligkeit(), { faerbung: neuesRaster(4, 4, 3) })).toThrow(BildFehler);
    expect(() => tonwert(q, neuesRaster(4, 4), helligkeit(), { faerbung: neuesRaster(5, 4, 3) })).toThrow(BildFehler);
  });
});

describe("male und punktebene: Deckkraft und Farbe", () => {
  const quell = { schluessel: "q", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0 };
  const stern = (teil: Partial<Punktquelle> = {}): Punktquelle => ({ name: "S", xArcsec: 0.5, yArcsec: 0.5, durchmesserArcsec: 0.01, helligkeitRelativ: 1000, sichtbar: true, ...teil });

  it("male reicht Deckkraft (fehlt = 1) und Farbe (fehlt = grau) je Scheibchen durch", () => {
    const s = malePunktquellen({ ...quell, punkte: { schluessel: "p", punktquellen: [stern(), stern({ deckkraft: 0.3, farbe: [1.2, 1, 0.7] })] } });
    expect(s.map((x) => [x.deckkraft, x.farbe])).toEqual([
      [1, undefined],
      [0.3, [1.2, 1, 0.7]]
    ]);
    expect(brauchtFaerbung(s.slice(0, 1))).toBe(false);
    expect(brauchtFaerbung(s)).toBe(true);
    expect(brauchtFaerbung([{ ...(s[0] as (typeof s)[0]), deckkraft: 0.5 }])).toBe(true);
  });

  it("male prueft Deckkraft und Farbe", () => {
    for (const falsch of [{ deckkraft: 0 }, { deckkraft: 1.01 }, { deckkraft: Number.NaN }, { farbe: [1, -0.1, 1] as [number, number, number] }, { farbe: [1, Number.POSITIVE_INFINITY, 1] as [number, number, number] }]) {
      expect(() => malePunktquellen({ ...quell, punkte: { schluessel: "p", punktquellen: [stern(falsch)] } })).toThrow(BildFehler);
    }
  });

  it("Faerbung: Fluss mal Deckkraft mal Farbe je Kanal, Summe ueber ueberlappende Sterne", () => {
    const kern = kastenKern(3);
    const s = malePunktquellen({ ...quell, punkte: { schluessel: "p", punktquellen: [stern({ deckkraft: 0.5, farbe: [1.2, 1, 0.6] }), stern({ name: "T", helligkeitRelativ: 3000 })] } });
    const p = faltePunkte(s, kern, N) as Raster;
    const c = falteFaerbung(s, kern, N) as Raster;
    expect(c.kanaele).toBe(3);
    const fluss = 1000 * Math.PI * 0.005 ** 2;
    const i = pixelIndex(p, 8, 7);
    expect(p.daten[i]).toBeCloseTo((4 * fluss) / 9, 6);
    expect(c.daten[3 * i]).toBeCloseTo((fluss * 0.6 + 3 * fluss) / 9, 6);
    expect(c.daten[3 * i + 1]).toBeCloseTo((fluss * 0.5 + 3 * fluss) / 9, 6);
    expect(c.daten[3 * i + 2]).toBeCloseTo((fluss * 0.3 + 3 * fluss) / 9, 6);
    expect(falteFaerbung([], kern, N)).toBeUndefined();
  });
});

/** Zaehlt die Faltungen, rechnet mit FalterJs. */
class FalterZaehlend implements Falter {
  aufrufe = 0;
  private readonly innen = new FalterJs();
  falte(raster: Raster, kern: Kern): Raster {
    this.aufrufe++;
    return this.innen.falte(raster, kern);
  }
}

/** Wie QuelleLeer aus daten (#102): liefert immer ein schwarzes Raster. */
class QuelleSchwarz implements Quelle {
  aufrufe = 0;
  constructor(private readonly kanaele: 1 | 3 = 1) {}
  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, _massstab: number): Quellausschnitt {
    this.aufrufe++;
    return { raster: neuesRaster(4, 4, this.kanaele), massstabArcsecProPx: breiteArcsec / 4, linksXArcsec: mitte.xArcsec - breiteArcsec / 2, obenYArcsec: mitte.yArcsec + breiteArcsec / 2 };
  }
}

function parameter(punktquellen: Punktquelle[], teil: Partial<Helligkeit> = {}, punkteSchluessel = "p"): Simulationsparameter {
  return {
    quellbild: { schluessel: "q", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punkte: { schluessel: punkteSchluessel, punktquellen } },
    kern: kastenKern(3),
    helligkeit: helligkeit(teil),
    gesichtsfeld: { form: "kreis", breiteArcsec: 100, hoeheArcsec: 100 },
    fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: N }
  };
}

describe("rendere Version 2", () => {
  const stern = (teil: Partial<Punktquelle> = {}): Punktquelle => ({ name: "A", xArcsec: 0.5, yArcsec: 0.5, durchmesserArcsec: 0.01, helligkeitRelativ: 2000, sichtbar: true, ...teil });

  it("ohne Quellbild (schwarzer Ausschnitt): kein mittele, kein falte; gleiche Bytes wie mit gefaltetem Nullraster", () => {
    for (const kanaele of [1, 3] as const) {
      const leer = new QuelleSchwarz(kanaele);
      const f = new FalterZaehlend();
      const zwischen: Zwischenspeicher = {};
      const p = parameter([stern()]);
      const anblick = rendere(p, leer, f, zwischen);
      expect(f.aufrufe).toBe(0);
      expect(zwischen.objekt?.raster).toBeUndefined();
      expect(zwischen.gefaltet?.raster).toBeUndefined();
      expect(anblick.raster.kanaele).toBe(kanaele);
      // Referenz: dieselbe Pipeline mit einem Quellbild aus lauter Nullen, das Version 1 gemittelt und gefaltet haette.
      const nullBild = neuesRaster(N, N, kanaele);
      const t = tonwertV1(new FalterJs().falte(nullBild, p.kern), faltePunkte(malePunktquellen(p.quellbild), p.kern, N), p.helligkeit);
      expect(bytes(anblick.raster)).toEqual(bytes(t));
    }
  });

  it("Bortle-Zug (neue Deckkraft und Helligkeit, neuer Punkte-Schluessel) faltet das Objektraster nicht neu", () => {
    const q = new QuelleAusRaster(zufallsRaster(N, 1, 51), 1);
    const f = new FalterZaehlend();
    const zwischen: Zwischenspeicher = {};
    rendere(parameter([stern({ deckkraft: 0.9, farbe: [1.1, 1, 0.8] })], { schluessel: "h|b3", hintergrundRelativ: 0.01 }, "p|b3"), q, f, zwischen);
    const gefaltet = zwischen.gefaltet?.raster;
    const anblick = rendere(parameter([stern({ deckkraft: 0.4, farbe: [1.1, 1, 0.8] })], { schluessel: "h|b7", hintergrundRelativ: 0.05 }, "p|b7"), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);
    expect(zwischen.gefaltet?.raster).toBe(gefaltet);
    expect(zwischen.punktebene?.schluessel.endsWith("|q|p|b7")).toBe(true);
    expect(anblick.raster.kanaele).toBe(3);
  });

  it("farbiger Stern: drei Kanaele im Verhaeltnis der Farbe, Deckkraft daempft den Punktanteil", () => {
    const leer = new QuelleSchwarz();
    const hg = { hintergrundRelativ: 0.02 };
    const farbe: [number, number, number] = [1.3, 1, 0.6];
    const r = rendere({ ...parameter([stern({ deckkraft: 0.5, farbe })], hg), kern: deltaKern(3) }, leer, new FalterJs()).raster;
    const grau = rendere({ ...parameter([stern()], hg), kern: deltaKern(3) }, leer, new FalterJs()).raster;
    expect(grau.kanaele).toBe(1);
    const i = pixelIndex(grau, 8, 7);
    const w = (grau.daten[i] as number) - 0.02;
    expect(w).toBeGreaterThan(0.1);
    for (let k = 0; k < 3; k++) expect(r.daten[3 * i + k]).toBeCloseTo(0.02 + 0.5 * (farbe[k] as number) * w, 6);
    expect(r.daten[3 * pixelIndex(grau, 2, 2)]).toBeCloseTo(0.02, 7);
  });

  it("wirft BildFehler bei unstimmigem Kern auch ohne Quellbild und ohne Punktquelle", () => {
    const f = new FalterZaehlend();
    expect(() => rendere({ ...parameter([]), kern: { ...kastenKern(3), radius: 2 } }, new QuelleSchwarz(), f)).toThrow(BildFehler);
    expect(() => rendere({ ...parameter([]), kern: { ...kastenKern(3), daten: new Float32Array(8) } }, new QuelleSchwarz(), f)).toThrow(BildFehler);
    expect(f.aufrufe).toBe(0);
  });

  it("wirft BildFehler bei mischgewicht ausserhalb [0, 1) und unstimmigem deepSky", () => {
    const leer = new QuelleSchwarz();
    for (const teil of [{ mischgewicht: 1 }, { mischgewicht: -0.1 }, { mischgewicht: Number.NaN }, { deepSky: { ...deepSky, schwelleRelativ: 0 } }, { deepSky: { ...deepSky, breite: 0 } }, { deepSky: { ...deepSky, sockel: -1 } }, { deepSky: { ...deepSky, faktor: Number.POSITIVE_INFINITY } }]) {
      expect(() => rendere(parameter([], teil), leer, new FalterJs())).toThrow(BildFehler);
    }
  });
});
