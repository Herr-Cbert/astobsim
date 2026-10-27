import { describe, expect, it } from "vitest";
import type { Fernglas, Konfiguration, Objektzustand } from "../naht/konfiguration";
import type { Atmosphaere } from "./atmosphaere";
import { auswerten } from "./auswerten";
import { PhysikFehler } from "./fehler";
import { anzeigefaktor, bortleMagProArcsec2, helligkeit, okularhelligkeit } from "./helligkeit";
import type { Optik } from "./optik";
import { BEDINGUNGEN_A_D9, KONFIGURATION_A_D9, MOND_Q1 as MOND, refraktorMitVergroesserung } from "./testdaten";

// Optik und Atmosphaere direkt als Skalare, damit jeder Faktor einzeln sichtbar wird.
function optikMit(teil: Partial<Optik>): Optik {
  return {
    oeffnungMm: 80,
    vergroesserung: 100,
    obstruktion: 0,
    transmission: 1,
    austrittspupilleMm: 0.8,
    gesichtsfeld: { form: "kreis", breiteArcsec: 1800, hoeheArcsec: 1800 },
    ...teil
  };
}
const KLAR: Atmosphaere = { luftmasse: 1, seeingFwhmArcsec: 2, extinktionMag: 0, transmission: 1 };

// Testwerte aus docs/recherche/physik.md, Abschnitte 6.1, 6.2 und 8.
describe("okularhelligkeit: Objektfaktor", () => {
  it("Austrittspupille 0,8 mm ohne weitere Verluste ist Faktor 0,01778", () => {
    expect(okularhelligkeit(optikMit({}), KLAR, 5, MOND).faktorObjekt).toBeCloseTo(0.01778, 5);
  });
  it("Austrittspupille 7 mm ist durch die Pupille Faktor 1, nach oben begrenzt", () => {
    expect(okularhelligkeit(optikMit({ austrittspupilleMm: 7 }), KLAR, 5, MOND).faktorObjekt).toBe(1);
  });
  it("Newton mit Obstruktion 0,33 und tau 0,8: Abschattung (1 - 0,33^2) genau einmal, mal Atmosphaere", () => {
    const a: Atmosphaere = { ...KLAR, extinktionMag: 0.3989, transmission: 0.6925 };
    const h = okularhelligkeit(optikMit({ austrittspupilleMm: 7, obstruktion: 0.33, transmission: 0.8 }), a, 5, MOND);
    expect(h.faktorObjekt).toBeCloseTo(0.8 * (1 - 0.33 ** 2) * 0.6925, 10);
  });
});

describe("okularhelligkeit: Hintergrund", () => {
  it("Bortle 8 (17,5) bei Austrittspupille 0,8 mm ist 21,875 mag je Quadratbogensekunde", () => {
    const h = okularhelligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundMagProArcsec2).toBeCloseTo(17.5 + 4.375, 3);
  });
  it("Extinktion dunkelt das Objekt, nicht den Himmel", () => {
    const diesig: Atmosphaere = { ...KLAR, extinktionMag: 0.9, transmission: 0.4365 };
    const klar = okularhelligkeit(optikMit({}), KLAR, 5, MOND);
    const dunst = okularhelligkeit(optikMit({}), diesig, 5, MOND);
    expect(dunst.faktorObjekt).toBeCloseTo(klar.faktorObjekt * 0.4365, 10);
    expect(dunst.hintergrundMagProArcsec2).toBe(klar.hintergrundMagProArcsec2);
  });
  it("Hintergrund physikalisch relativ zu Quellweiss 3,4 mag: 10^(-0,4 (21,875 - 3,4))", () => {
    const h = okularhelligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundRelativ).toBeCloseTo(Math.pow(10, -0.4 * (h.hintergrundMagProArcsec2 - 3.4)), 12);
    expect(h.hintergrundRelativ).toBeCloseTo(4.07e-8, 10);
  });
  it("Bortle-Tabelle: 1 ist 21,9, 5 ist 20,0, 9 ist 17,0; 0, 10 und 5,5 sind Programmierfehler", () => {
    expect(bortleMagProArcsec2(1)).toBe(21.9);
    expect(bortleMagProArcsec2(5)).toBe(20.0);
    expect(bortleMagProArcsec2(9)).toBe(17.0);
    expect(() => bortleMagProArcsec2(0)).toThrow(PhysikFehler);
    expect(() => bortleMagProArcsec2(10)).toThrow(PhysikFehler);
    expect(() => bortleMagProArcsec2(5.5)).toThrow(PhysikFehler);
  });
});

describe("helligkeit: Schluessel", () => {
  it("ist gleich bei gleichen gerundeten Werten und verschieden bei anderem Bortle", () => {
    const h1 = helligkeit(optikMit({}), KLAR, 5, MOND);
    const h2 = helligkeit(optikMit({ austrittspupilleMm: 0.8000001 }), KLAR, 5, MOND);
    const h3 = helligkeit(optikMit({}), KLAR, 6, MOND);
    expect(h2.schluessel).toBe(h1.schluessel);
    expect(h3.schluessel).not.toBe(h1.schluessel);
  });
});

// Abbildung auf den Bildschirm, docs/recherche/physik.md Abschnitt 12 (Tabelle 12.4).
describe("anzeigefaktor: Stevens-Potenz 1/3 relativ zu 3,35 mag/arcsec2", () => {
  it("3,35 ist Weiss, 2,5 mag dunkler ist 10^(-1/3) = 0,4642, 7,5 mag dunkler ist 0,1", () => {
    expect(anzeigefaktor(3.35)).toBeCloseTo(1, 12);
    expect(anzeigefaktor(5.85)).toBeCloseTo(0.4642, 4);
    expect(anzeigefaktor(10.85)).toBeCloseTo(0.1, 12);
  });
  it("heller als 3,35 bleibt 1 (keine Blendung, A-P9)", () => {
    expect(anzeigefaktor(1.5)).toBe(1);
  });
  it("streng monoton fallend und verhaeltnistreu: Faktor 2 in der Leuchtdichte ist Faktor 2^(1/3) in der Anzeige", () => {
    let vorher = Infinity;
    for (let mu = 3.35; mu <= 26; mu += 0.25) {
      const w = anzeigefaktor(mu);
      expect(w).toBeLessThan(vorher);
      expect(w).toBeGreaterThan(0);
      vorher = w;
    }
    const dmag = 2.5 * Math.log10(2);
    expect(anzeigefaktor(8 + dmag) / anzeigefaktor(8)).toBeCloseTo(Math.pow(2, -1 / 3), 12);
    expect(anzeigefaktor(20 + dmag) / anzeigefaktor(20)).toBeCloseTo(Math.pow(2, -1 / 3), 12);
  });
  it("NaN ist ein Programmierfehler", () => {
    expect(() => anzeigefaktor(Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("helligkeit: Naht-Werte sind Anzeigewerte", () => {
  it("Quellweiss 3,4, AP 0,8 mm ohne Verluste: 7,775 mag/arcsec2, Anzeige 10^(-0,4/3 * 4,425) = 0,2570", () => {
    const ok = okularhelligkeit(optikMit({}), KLAR, 5, MOND);
    expect(ok.objektMagProArcsec2).toBeCloseTo(7.775, 3);
    expect(helligkeit(optikMit({}), KLAR, 5, MOND).faktorObjekt).toBeCloseTo(0.257, 3);
  });
  it("Hintergrund ist anzeigefaktor der Himmelshelligkeit im Okular, die Magnitude bleibt physikalisch", () => {
    const h = helligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundMagProArcsec2).toBeCloseTo(21.875, 3);
    expect(h.hintergrundRelativ).toBeCloseTo(anzeigefaktor(h.hintergrundMagProArcsec2), 12);
    expect(h.hintergrundRelativ).toBeCloseTo(0.003388, 6);
  });
});

/** Mond mit dem Quellweiss aus daten/objekte.json (mond_ev, 3,35). */
const MOND_EV: Objektzustand = { ...MOND, quelle: { ...MOND.quelle, weissMagProArcsec2: 3.35 } };
/** Mars 14'' mit Quellweiss 4,1 (daten/objekte.json mars_14). */
const MARS_14: Objektzustand = { kennung: "mars-14", durchmesserArcsec: 14, magnitude: -1, quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.04, weissMagProArcsec2: 4.1 }, trabanten: [] };
const FERNGLAS_10X50: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };

function konfig(geraet: Konfiguration["geraet"], objekt: Objektzustand, bortle = 5): Konfiguration {
  return { geraet, objekt, bedingungen: { ...BEDINGUNGEN_A_D9, bortle } };
}
const anzeige = (k: Konfiguration) => auswerten(k, { anzeigePx: 256 }).parameter.helligkeit;
/** sRGB-Kennlinie (IEC 61966-2-1) wie src/ui/zeichne.ts, nur um die Testwerte in 8 Bit zu nennen. */
const srgb8 = (w: number) => Math.round(255 * (w <= 0.0031308 ? 12.92 * w : 1.055 * w ** (1 / 2.4) - 0.055));

describe("helligkeit: Akzeptanz Issue #55 (Tabelle 12.4)", () => {
  const ad9 = anzeige({ ...KONFIGURATION_A_D9, objekt: MOND_EV });
  const fernglas = anzeige(konfig(FERNGLAS_10X50, MOND_EV));
  const v200 = anzeige(konfig(refraktorMitVergroesserung(80, 200), MOND_EV));

  it("A-D9: Quellweiss 0,3248 (sRGB 154) statt bisher 0,0343 (sRGB 52)", () => {
    expect(ad9.faktorObjekt).toBeCloseTo(0.3248, 3);
    expect(srgb8(ad9.faktorObjekt)).toBe(154);
  });
  it("Fernglas 10x50 0,7692 (sRGB 227) und 80 mm bei 200x 0,1456 (sRGB 106) bleiben unterscheidbar", () => {
    expect(fernglas.faktorObjekt).toBeCloseTo(0.7692, 3);
    expect(v200.faktorObjekt).toBeCloseTo(0.1456, 3);
    expect(srgb8(fernglas.faktorObjekt) - srgb8(ad9.faktorObjekt)).toBeGreaterThan(40);
    expect(srgb8(ad9.faktorObjekt) - srgb8(v200.faktorObjekt)).toBeGreaterThan(40);
  });
  it("Mars 14'' an 80 mm bei 120x: 0,1625 (sRGB 112)", () => {
    expect(anzeige(konfig(refraktorMitVergroesserung(80, 120), MARS_14)).faktorObjekt).toBeCloseTo(0.1625, 3);
  });
  it("monoton in der Austrittspupille: 80 mm von 400x bis 14x, Anzeige steigt bis AP 6 mm und bleibt dann", () => {
    let vorher = 0;
    for (const v of [400, 300, 200, 160, 120, 100, 80, 60, 40, 30, 20, 16, 13.4]) {
      const f = anzeige(konfig(refraktorMitVergroesserung(80, v), MOND_EV)).faktorObjekt;
      expect(f).toBeGreaterThan(vorher);
      vorher = f;
    }
    const ap6 = anzeige(konfig(refraktorMitVergroesserung(80, 80 / 6), MOND_EV)).faktorObjekt;
    const ap8 = anzeige(konfig(refraktorMitVergroesserung(80, 10), MOND_EV)).faktorObjekt;
    expect(ap8).toBeCloseTo(ap6, 12);
  });
  it("Hintergrund nach Bortle: heller mit der Stufe, immer mindestens 20-mal dunkler als Quellweiss", () => {
    for (const geraet of [FERNGLAS_10X50, refraktorMitVergroesserung(80, 60), refraktorMitVergroesserung(80, 200)]) {
      for (const objekt of [MOND_EV, MARS_14]) {
        let vorher = 0;
        for (let b = 1; b <= 9; b++) {
          const h = anzeige(konfig(geraet, objekt, b));
          expect(h.hintergrundRelativ).toBeGreaterThan(vorher);
          expect(h.hintergrundRelativ * 20).toBeLessThan(h.faktorObjekt);
          vorher = h.hintergrundRelativ;
        }
      }
    }
  });
  it("Hintergrund Fernglas 10x50: Bortle 1 0,0028 (sRGB 9), Bortle 9 0,0127 (sRGB 30)", () => {
    expect(anzeige(konfig(FERNGLAS_10X50, MOND_EV, 1)).hintergrundRelativ).toBeCloseTo(0.00282, 4);
    expect(anzeige(konfig(FERNGLAS_10X50, MOND_EV, 9)).hintergrundRelativ).toBeCloseTo(0.0127, 4);
  });
});
