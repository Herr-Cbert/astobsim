import { describe, expect, it } from "vitest";
import type { Kern, Punktquelle, Simulationsparameter } from "../naht/simulationsparameter";
import { FalterJs, type Falter } from "./falter";
import { BildFehler } from "./fehler";
import { QuelleAusRaster } from "./quelle";
import { neuesRaster, pixelIndex, summe, type Raster } from "./raster";
import { mittele, skaliere } from "./mittele";
import { maskiere, punktanteil, punktquellbild, rendere, tonwert, type Zwischenspeicher } from "./rendere";
import { deltaKern, kastenKern } from "./testkerne";

const N = 16;

/** Zaehlt die Faltungen, rechnet mit FalterJs. */
class FalterZaehlend implements Falter {
  aufrufe = 0;
  private readonly innen = new FalterJs();
  falte(raster: Raster, kern: Kern): Raster {
    this.aufrufe++;
    return this.innen.falte(raster, kern);
  }
}

/** Quelle 16x16 bei 1"/px: Wert 1 ueberall, heller Punkt 5 im Nordosten bei x = +5,5, y = +5,5. */
function quelle(): QuelleAusRaster {
  const raster = neuesRaster(N, N, 1, 1);
  raster.daten[pixelIndex(raster, 13, 2)] = 5;
  return new QuelleAusRaster(raster, 1);
}

function parameter(teil: Partial<Simulationsparameter> = {}): Simulationsparameter {
  return {
    quellbild: { schluessel: "q|0|0", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 0, mitteYArcsec: 0, punkte: { schluessel: "p", punktquellen: [] } },
    kern: deltaKern(5),
    helligkeit: { schluessel: "h1", faktorObjekt: 1, hintergrundRelativ: 0, hintergrundMagProArcsec2: 20, punktFaktor: 1, punktExponent: 1, mischgewicht: 0 },
    gesichtsfeld: { form: "kreis", breiteArcsec: 100, hoeheArcsec: 100 },
    fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: N },
    ...teil
  };
}

const falter = new FalterJs();

describe("rendere", () => {
  it("Deltakern, Faktor 1, ohne Maske: Anblick ist die Quelle, Zeile 0 ist Norden, +x rechts", () => {
    const anblick = rendere(parameter(), quelle(), falter);
    expect(anblick.raster.breite).toBe(N);
    expect(anblick.raster.hoehe).toBe(N);
    expect(anblick.massstabArcsecProPx).toBe(1);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 13, 2)]).toBe(5);
    expect(summe(anblick.raster)).toBe(N * N + 4);
  });

  it("Tonwert: Objektfaktor multipliziert, Hintergrundgrau addiert", () => {
    const p = parameter({ helligkeit: { schluessel: "h2", faktorObjekt: 0.5, hintergrundRelativ: 0.1, hintergrundMagProArcsec2: 20, punktFaktor: 1, punktExponent: 1, mischgewicht: 0 } });
    const anblick = rendere(p, quelle(), falter);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 0, 0)]).toBeCloseTo(0.6, 6);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 13, 2)]).toBeCloseTo(2.6, 6);
  });

  it("Maske Kreis schwaerzt ausserhalb, laesst innen unveraendert", () => {
    const p = parameter({ gesichtsfeld: { form: "kreis", breiteArcsec: 10, hoeheArcsec: 10 } });
    const anblick = rendere(p, quelle(), falter);
    const r = anblick.raster;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = i + 0.5 - N / 2;
        const y = N / 2 - (j + 0.5);
        const innen = x * x + y * y <= 25;
        expect(r.daten[pixelIndex(r, i, j)]).toBe(innen ? (i === 13 && j === 2 ? 5 : 1) : 0);
      }
    }
    expect(r.daten[pixelIndex(r, 0, 0)]).toBe(0);
    expect(r.daten[pixelIndex(r, 8, 8)]).toBe(1);
    expect(r.daten[pixelIndex(r, 13, 2)]).toBe(0); // x = 5,5, y = 5,5: Abstand 7,8 > 5
  });

  it("Maske Rechteck (blosses Auge): ausserhalb der Hoehe schwarz, Breite voll", () => {
    const p = parameter({ gesichtsfeld: { form: "rechteck", breiteArcsec: 100, hoeheArcsec: 8 } });
    const r = rendere(p, quelle(), falter).raster;
    expect(r.daten[pixelIndex(r, 0, 0)]).toBe(0);
    expect(r.daten[pixelIndex(r, 0, 3)]).toBe(0); // y = 4,5
    expect(r.daten[pixelIndex(r, 0, 4)]).toBe(1); // y = 3,5
    expect(r.daten[pixelIndex(r, 15, 11)]).toBe(1); // y = -3,5
    expect(r.daten[pixelIndex(r, 15, 12)]).toBe(0); // y = -4,5
  });

  it("Maske bleibt bei verschobenem Fenster in der Fenstermitte, das Objekt wandert (A-D2)", () => {
    // 16''-Fenster um 8'' nach rechts verschoben, Kreis 16'': ganzer Kreis sichtbar, Ecken schwarz.
    const p = parameter({
      quellbild: { schluessel: "q|8|0", massstabArcsecProPx: 1, rasterPx: N, mitteXArcsec: 8, mitteYArcsec: 0, punkte: { schluessel: "p", punktquellen: [] } },
      fenster: { breiteArcsec: N, mitteXArcsec: 8, mitteYArcsec: 0, px: N },
      gesichtsfeld: { form: "kreis", breiteArcsec: N, hoeheArcsec: N }
    });
    const r = rendere(p, quelle(), falter).raster;
    expect(r.daten[pixelIndex(r, 0, 0)]).toBe(0); // Ecke ausserhalb des Kreises
    expect(r.daten[pixelIndex(r, 0, 8)]).toBe(1); // linker Rand in der Mitte: im Kreis, Objekt
    expect(r.daten[pixelIndex(r, 15, 8)]).toBe(0); // rechter Rand: im Kreis, aber jenseits der Quelle (x = 15,5): Schwarz
    // Der helle Punkt bei x = +5,5 landet um 8 Spalten nach links verschoben: Spalte 13 - 8 = 5, Zeile 2.
    expect(r.daten[pixelIndex(r, 5, 2)]).toBe(5);
    expect(r.daten[pixelIndex(r, 13, 2)]).toBe(0);
  });

  it("Kastenkern 3x3 verschmiert den hellen Punkt auf 3x3 Pixel", () => {
    const r = rendere(parameter({ kern: kastenKern(3) }), quelle(), falter).raster;
    expect(r.daten[pixelIndex(r, 13, 2)]).toBeCloseTo(1 + 4 / 9, 5);
    expect(r.daten[pixelIndex(r, 12, 1)]).toBeCloseTo(1 + 4 / 9, 5);
    expect(r.daten[pixelIndex(r, 11, 2)]).toBeCloseTo(1, 5);
    expect(summe(r)).toBeCloseTo(N * N + 4, 3);
  });

  it("Skalierung auf fenster.px: 16 Arbeitspixel werden 32 Anzeigepixel, Massstab halbiert", () => {
    const p = parameter({ fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: 32 } });
    const anblick = rendere(p, quelle(), falter);
    expect(anblick.raster.breite).toBe(32);
    expect(anblick.raster.hoehe).toBe(32);
    expect(anblick.massstabArcsecProPx).toBe(0.5);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 0, 0)]).toBeCloseTo(1, 6);
    expect(anblick.raster.daten[pixelIndex(anblick.raster, 27, 5)]).toBeGreaterThan(1);
  });

  it("drei Kanaele laufen durch die Pipeline", () => {
    const raster = neuesRaster(N, N, 3, 0.5);
    const q = new QuelleAusRaster(raster, 1);
    const anblick = rendere(parameter({ kern: kastenKern(3) }), q, falter);
    expect(anblick.raster.kanaele).toBe(3);
    for (const wert of anblick.raster.daten) expect(wert).toBeCloseTo(0.5, 6);
  });

  it("Wiederverwendung nach Stufenschluessel: Quelle und Falter werden nur bei neuem Schluessel gerufen", () => {
    const q = quelle();
    const f = new FalterZaehlend();
    const zwischen: Zwischenspeicher = {};
    const p = parameter();
    rendere(p, q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(p, q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ helligkeit: { ...p.helligkeit, schluessel: "h3", faktorObjekt: 0.3 } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ fenster: { ...p.fenster, px: 32 } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);

    rendere(parameter({ kern: kastenKern(3) }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 2]);

    rendere(parameter({ quellbild: { ...p.quellbild, schluessel: "q|anders" }, kern: kastenKern(3) }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 3]);

    // Zurueck zum Deltakern: nur das letzte Ergebnis je Stufe wird behalten, also neu falten, Quelle bleibt.
    rendere(parameter({ quellbild: { ...p.quellbild, schluessel: "q|anders" } }), q, f, zwischen);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 4]);
  });

  it("ohne Zwischenspeicher wird jedes Mal neu gerechnet", () => {
    const q = quelle();
    const f = new FalterZaehlend();
    rendere(parameter(), q, f);
    rendere(parameter(), q, f);
    expect([q.aufrufe, f.aufrufe]).toEqual([2, 2]);
  });

  it("Trabanten (Issue #14): im Fenster, aber ausserhalb der Quellbild-Flaeche gemalt, Fluss bleibt bei Deltakern", () => {
    // Fenster 48'' bei 1''/px, Quelle 16'' (Wert 1, Punkt 5): Trabant bei x = -19,5'' liegt jenseits der Quelle.
    const trabant: Punktquelle = { name: "Io", xArcsec: -19.5, yArcsec: 0.5, durchmesserArcsec: 0.5, helligkeitRelativ: 2, sichtbar: true };
    const aussen: Punktquelle = { ...trabant, name: "Kallisto", xArcsec: 30 };
    const geblendet: Punktquelle = { ...trabant, name: "Europa", xArcsec: 19.5, sichtbar: false, grund: "blendung" };
    const p = parameter({
      quellbild: { schluessel: "q|t", massstabArcsecProPx: 1, rasterPx: 48, mitteXArcsec: 0, mitteYArcsec: 0, punkte: { schluessel: "p|t", punktquellen: [trabant, aussen, geblendet] } },
      fenster: { breiteArcsec: 48, mitteXArcsec: 0, mitteYArcsec: 0, px: 48 }
    });
    const r = rendere(p, quelle(), falter).raster;
    const fluss = 2 * Math.PI * 0.25 ** 2;
    expect(r.daten[pixelIndex(r, 4, 23)]).toBeCloseTo(fluss, 6);
    expect(r.daten[pixelIndex(r, 43, 23)]).toBe(0);
    expect(summe(r)).toBeCloseTo(N * N + 4 + fluss, 3);
  });

  it("Trabanten liegen in Stufe 1b: neuer Punkte-Schluessel malt neu, Objektraster und Faltung bleiben", () => {
    const q = quelle();
    const f = new FalterZaehlend();
    const zwischen: Zwischenspeicher = {};
    const p = parameter();
    const trabant: Punktquelle = { name: "Io", xArcsec: -5.5, yArcsec: 0.5, durchmesserArcsec: 1, helligkeitRelativ: 1, sichtbar: true };
    const ohne = rendere(p, q, f, zwischen).raster;
    const mit = rendere(parameter({ quellbild: { ...p.quellbild, punkte: { schluessel: "p|io", punktquellen: [trabant] } } }), q, f, zwischen).raster;
    expect([q.aufrufe, f.aufrufe]).toEqual([1, 1]);
    expect(summe(mit) - summe(ohne)).toBeCloseTo(Math.PI / 4, 4);
  });

  it("flaechige Objekte bitgleich (Issue #72): ohne sichtbare Punktquelle ist der Anblick der lineare Tonwert wie vorher", () => {
    // Referenz ist die Pipeline vor #72: maskiere(skaliere(f * falte(mittele(quelle)) + h)).
    const kern = kastenKern(3);
    const h = { schluessel: "h4", faktorObjekt: 1.7, hintergrundRelativ: 0.0123, hintergrundMagProArcsec2: 20, punktFaktor: 4.9, punktExponent: 1 / 3, mischgewicht: 0 };
    const geblendet: Punktquelle = { name: "Io", xArcsec: -5.5, yArcsec: 0.5, durchmesserArcsec: 1, helligkeitRelativ: 1, sichtbar: false, grund: "blendung" };
    const gesichtsfeld = { form: "kreis" as const, breiteArcsec: 14, hoeheArcsec: 14 };
    const fenster = { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: 37 };
    for (const punktquellen of [[], [geblendet]]) {
      const p = parameter({ kern, helligkeit: h, gesichtsfeld, fenster, quellbild: { ...parameter().quellbild, punkte: { schluessel: `p|${punktquellen.length}`, punktquellen } } });
      const q = quelle();
      const ausschnitt = q.ausschnitt({ xArcsec: 0, yArcsec: 0 }, N, 1);
      const gefaltet = falter.falte(mittele(ausschnitt, p.quellbild), kern);
      const alt = { ...gefaltet, daten: Float32Array.from(gefaltet.daten, (v) => 1.7 * v + 0.0123) };
      const erwartet = maskiere(skaliere(alt, fenster.px), gesichtsfeld, fenster);
      expect(rendere(p, quelle(), falter).raster.daten).toEqual(erwartet.daten);
    }
  });

  it("Punktebene: Trabant mit punktFaktor und punktExponent komprimiert, Objekt unberuehrt, Ebene im Zwischenspeicher", () => {
    // Trabant 0,1'' mit h = 1: Fluss pi/400 = 0,00785 auf ein Pixel (Deltakern). Linear 0,00785, mit
    // punktFaktor 1 und Exponent 1/3 dagegen 0,199.
    const trabant: Punktquelle = { name: "Io", xArcsec: -5.5, yArcsec: 0.5, durchmesserArcsec: 0.1, helligkeitRelativ: 1, sichtbar: true };
    const p = parameter({ quellbild: { ...parameter().quellbild, punkte: { schluessel: "p|io", punktquellen: [trabant] } } });
    const zwischen: Zwischenspeicher = {};
    const f = new FalterZaehlend();
    const linear = rendere(p, quelle(), f, zwischen).raster;
    expect(linear.daten[pixelIndex(linear, 2, 7)]).toBeCloseTo(1 + Math.PI / 400, 6);
    const ebene = zwischen.punktebene?.raster;
    expect(ebene).toBeDefined();
    const komprimiert = rendere({ ...p, helligkeit: { ...p.helligkeit, schluessel: "h5", punktExponent: 1 / 3 } }, quelle(), f, zwischen).raster;
    expect(komprimiert.daten[pixelIndex(komprimiert, 2, 7)]).toBeCloseTo(1 + Math.cbrt(Math.PI / 400), 6);
    expect(komprimiert.daten[pixelIndex(komprimiert, 3, 7)]).toBe(1);
    expect(f.aufrufe).toBe(1);
    expect(zwischen.punktebene?.raster).toBe(ebene);
  });

  it("wirft BildFehler bei verletzten Invarianten der Naht", () => {
    const p = parameter();
    expect(() => rendere(parameter({ quellbild: { ...p.quellbild, rasterPx: 15 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ kern: deltaKern(5, 2) }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ fenster: { ...p.fenster, mitteXArcsec: 1 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ fenster: { ...p.fenster, px: 0 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ helligkeit: { ...p.helligkeit, punktExponent: 0 } }), quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere(parameter({ helligkeit: { ...p.helligkeit, punktFaktor: -1 } }), quelle(), falter)).toThrow(BildFehler);
  });
});

describe("feinere Punktebene (Issue #145, physik.md Abschnitt 31)", () => {
  /** Stern 0,1'' an (x, y), Fluss pi (0,05)^2 relativ zu Quellweiss (helligkeitRelativ 1). */
  const stern = (x: number, y: number): Punktquelle => ({ name: "S", xArcsec: x, yArcsec: y, durchmesserArcsec: 0.1, helligkeitRelativ: 1, sichtbar: true });
  /** Fenster 16'' auf 64 px, Arbeitsraster 16 px, Punktkern Delta bei 0,25''/px (Punktebene 64 px). */
  function fein(punkte: Punktquelle[]): Simulationsparameter {
    const p = parameter({ fenster: { breiteArcsec: N, mitteXArcsec: 0, mitteYArcsec: 0, px: 64 }, punktkern: deltaKern(5, 0.25) });
    return { ...p, quellbild: { ...p.quellbild, punkte: { schluessel: "s", punktquellen: punkte } }, helligkeit: { ...p.helligkeit, faktorObjekt: 0 } };
  }

  it("punktquellbild: Raster 64 px bei 0,25''/px, gleiche Mitte, Randfenster ein halbes Arbeitspixel (2 px)", () => {
    const b = punktquellbild(fein([]));
    expect(b.quellbild).toMatchObject({ rasterPx: 64, massstabArcsecProPx: 0.25, mitteXArcsec: 0, mitteYArcsec: 0 });
    expect(b.quellbild.schluessel).toBe("q|0|0|punkte 64");
    expect(b.kern.massstabArcsecProPx).toBe(0.25);
    expect(b.randZusatzPx).toBe(2);
    const p0 = parameter();
    const ohne = punktquellbild(p0);
    expect(ohne.quellbild).toBe(p0.quellbild);
    expect(ohne.kern).toBe(p0.kern);
    expect(ohne.randZusatzPx).toBe(0.5);
  });

  it("der Stern liegt im Anzeigepixel seiner Lage, der Fluss bleibt erhalten (Delta, linear)", () => {
    // x = 2,3'', y = 0,1'': Spalte (8 + 2,3) / 0,25 = 41,2, Zeile (8 - 0,1) / 0,25 = 31,6.
    const r = rendere(fein([stern(2.3, 0.1)]), quelle(), falter).raster;
    expect(r.breite).toBe(64);
    const groesster = r.daten.indexOf(Math.max(...r.daten));
    expect([groesster % 64, Math.floor(groesster / 64)]).toEqual([41, 31]);
    expect(summe(r)).toBeCloseTo(Math.PI * (0.05 / 0.25) ** 2, 5);
  });

  it("Flaeche und Punktanteil getrennt skaliert: ohne Punkte wie ohne Punktkern", () => {
    const p = fein([stern(2.3, 0.1)]);
    const mitObjekt = { ...p, helligkeit: { ...p.helligkeit, faktorObjekt: 1 } };
    const ohnePunkte = { ...mitObjekt, quellbild: { ...mitObjekt.quellbild, punkte: { schluessel: "leer", punktquellen: [] } } };
    const flaeche = rendere(ohnePunkte, quelle(), falter).raster;
    const beides = rendere(mitObjekt, quelle(), falter).raster;
    const punkte = rendere(p, quelle(), falter).raster;
    for (let i = 0; i < beides.daten.length; i++) expect(beides.daten[i]).toBeCloseTo((flaeche.daten[i] as number) + (punkte.daten[i] as number), 6);
  });

  it("punktanteil rechnet denselben Ausdruck wie tonwert (ohne Flaeche), mit und ohne Faerbung", () => {
    const p = neuesRaster(4, 4, 1, 0);
    p.daten.set([0, 0.01, 0.1, 0.5, 1, 2, 30, 0, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 5]);
    const c = neuesRaster(4, 4, 3, 0);
    for (let i = 0; i < 16; i++) c.daten.set([1.2, 1, 0.7].map((f) => f * (p.daten[i] as number)), 3 * i);
    const h = { ...parameter().helligkeit, hintergrundRelativ: 0, punktFaktor: 2, punktExponent: 1 / 3 };
    expect(Array.from(punktanteil(p, h).daten)).toEqual(Array.from(tonwert(undefined, p, h, { rasterPx: 4 }).daten));
    expect(Array.from(punktanteil(p, h, c).daten)).toEqual(Array.from(tonwert(undefined, p, h, { rasterPx: 4, faerbung: c }).daten));
  });

  it("wirft BildFehler, wenn der Punktkern kein ganzzahliges, feineres Raster ergibt", () => {
    expect(() => rendere({ ...fein([stern(0, 0)]), punktkern: deltaKern(5, 0.3) }, quelle(), falter)).toThrow(BildFehler);
    expect(() => rendere({ ...fein([stern(0, 0)]), punktkern: deltaKern(5, 1) }, quelle(), falter)).toThrow(BildFehler);
  });
});
