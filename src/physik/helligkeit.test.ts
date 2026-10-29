import { describe, expect, it } from "vitest";
import type { Auge, Fernglas, Konfiguration, Objektzustand } from "../naht/konfiguration";
import type { Atmosphaere } from "./atmosphaere";
import { auswerten } from "./auswerten";
import { PhysikFehler } from "./fehler";
import { anzeigefaktor, bortleMagProArcsec2, helligkeit, leuchtdichteRelativ, okularhelligkeit } from "./helligkeit";
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
    beidaeugig: false,
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

// Abbildung auf den Bildschirm, docs/recherche/physik.md Abschnitt 12 (Tabelle 12.4). Seit Issue #100
// mit dem Anzeigeweiss 9,2 (A-P13 i); die Werte mit 3,35 stehen in regression_v1.test.ts.
/** Faktor der Anzeigehelligkeit durch das Anzeigeweiss 9,2 statt 3,35: 10^(0,4/3 * 5,85) = 6,0256. */
const FAKTOR_V2 = 10 ** ((0.4 / 3) * (9.2 - 3.35));

describe("anzeigefaktor: Stevens-Potenz 1/3 relativ zu 9,2 mag/arcsec2", () => {
  it("9,2 ist Weiss, 2,5 mag dunkler ist 10^(-1/3) = 0,4642, 7,5 mag dunkler ist 0,1", () => {
    expect(anzeigefaktor(9.2)).toBeCloseTo(1, 12);
    expect(anzeigefaktor(11.7)).toBeCloseTo(0.4642, 4);
    expect(anzeigefaktor(16.7)).toBeCloseTo(0.1, 12);
  });
  it("heller als 9,2 ueber 1, nicht mehr begrenzt (Issue #72, physik.md 14.4): 7,35 gibt 10^(0,74/3) = 1,7647", () => {
    expect(anzeigefaktor(7.35)).toBeCloseTo(1.7647, 4);
  });
  it("Version 1 gegen 2: dieselbe Flaeche erscheint 6,0256-mal heller (Anzeigeweiss 5,85 mag schwaecher)", () => {
    expect(anzeigefaktor(3.35)).toBeCloseTo(FAKTOR_V2, 10);
    expect(FAKTOR_V2).toBeCloseTo(6.0256, 4);
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

describe("helligkeit: Naht-Werte sind Anzeigehelligkeiten", () => {
  it("Quellweiss 3,4, AP 0,8 mm ohne Verluste: 7,775 mag/arcsec2, Anzeige 10^(0,4/3 * 1,425) = 1,5487 (Version 1: 0,2570)", () => {
    const ok = okularhelligkeit(optikMit({}), KLAR, 5, MOND);
    expect(ok.objektMagProArcsec2).toBeCloseTo(7.775, 3);
    expect(helligkeit(optikMit({}), KLAR, 5, MOND).faktorObjekt).toBeCloseTo(1.5487, 4);
  });
  it("Hintergrund ist anzeigefaktor der Himmelshelligkeit im Okular, die Magnitude bleibt physikalisch", () => {
    const h = helligkeit(optikMit({}), KLAR, 8, MOND);
    expect(h.hintergrundMagProArcsec2).toBeCloseTo(21.875, 3);
    expect(h.hintergrundRelativ).toBeCloseTo(anzeigefaktor(h.hintergrundMagProArcsec2), 12);
    expect(h.hintergrundRelativ).toBeCloseTo(0.020415, 6);
  });
});

/** Mond mit dem Quellweiss aus daten/objekte.json (mond_ev, 3,35). */
const MOND_EV: Objektzustand = { ...MOND, quelle: { ...MOND.quelle!, weissMagProArcsec2: 3.35 } };
/** Mars 14'' mit Quellweiss 4,1 (daten/objekte.json mars_14). */
const MARS_14: Objektzustand = { kennung: "mars-14", klasse: "sonnensystem", sterne: [], durchmesserArcsec: 14, magnitude: -1, quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.04, weissMagProArcsec2: 4.1 }, trabanten: [] };
/** Mars 6'' mit Quellweiss 4,5 (daten/objekte.json mars_6), der dunkelste Zustand der Version 1. */
const MARS_6: Objektzustand = { ...MARS_14, kennung: "mars-6", durchmesserArcsec: 6, quelle: { ...MARS_14.quelle!, weissMagProArcsec2: 4.5 } };
const AUGE: Auge = { art: "auge" };
const FERNGLAS_10X50: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };

function konfig(geraet: Konfiguration["geraet"], objekt: Objektzustand, bortle = 5): Konfiguration {
  return { geraet, objekt, bedingungen: { ...BEDINGUNGEN_A_D9, bortle } };
}
const anzeige = (k: Konfiguration) => auswerten(k, { anzeigePx: 256 }).parameter.helligkeit;
/** sRGB-Kennlinie (IEC 61966-2-1) wie src/ui/zeichne.ts, nur um die Testwerte in 8 Bit zu nennen. */
const srgb8 = (w: number) => Math.round(255 * (w <= 0.0031308 ? 12.92 * w : 1.055 * w ** (1 / 2.4) - 0.055));

// Version 2 (Anzeigeweiss 9,2): jeder Wert der Tabelle 12.4 mal FAKTOR_V2; Werte und Rechenweg in
// physik.md 12.4, Tabelle "Version 2". Die sRGB-Kodes der Tabelle gelten mit 3,35 und stehen
// mit ihren Werten in regression_v1.test.ts; Quellweiss liegt jetzt meist ueber Bildschirmweiss, die
// Scheibe (Pixel 0,14 bis 0,24 von Quellweiss, objekte.md 5.3) wird erst beim Zeichnen begrenzt.
describe("helligkeit: Akzeptanz Issue #55 (Tabelle 12.4) mit Anzeigeweiss 9,2", () => {
  const ad9 = anzeige({ ...KONFIGURATION_A_D9, objekt: MOND_EV });
  const fernglas = anzeige(konfig(FERNGLAS_10X50, MOND_EV));
  const v200 = anzeige(konfig(refraktorMitVergroesserung(80, 200), MOND_EV));

  it("A-D9: Quellweiss 1,9571 (Version 1: 0,3248)", () => {
    expect(ad9.faktorObjekt).toBeCloseTo(1.9571, 3);
    expect(ad9.faktorObjekt / FAKTOR_V2).toBeCloseTo(0.3248, 3);
  });
  it("Fernglas 10x50 4,6346 und 80 mm bei 200x 0,8770 (Version 1: 0,7692 und 0,1456), Verhaeltnisse unveraendert", () => {
    expect(fernglas.faktorObjekt).toBeCloseTo(4.6346, 3);
    expect(v200.faktorObjekt).toBeCloseTo(0.877, 3);
    expect(fernglas.faktorObjekt / ad9.faktorObjekt).toBeCloseTo(0.7692 / 0.3248, 2);
    expect(ad9.faktorObjekt / v200.faktorObjekt).toBeCloseTo(0.3248 / 0.1456, 2);
  });
  it("Mond mit blossem Auge: 5,5250 (Version 1: 0,9169)", () => {
    expect(anzeige(konfig(AUGE, MOND_EV)).faktorObjekt).toBeCloseTo(5.525, 3);
  });
  it("Mars 14'' an 80 mm bei 120x: 0,9793 (Version 1: 0,1625)", () => {
    expect(anzeige(konfig(refraktorMitVergroesserung(80, 120), MARS_14)).faktorObjekt).toBeCloseTo(0.9793, 3);
  });
  it("monoton in der Austrittspupille (A-P4): 80 mm von 400x bis 14x, Anzeige und Punktfaktor steigen bis AP 6 mm und bleiben dann", () => {
    let vorher = 0;
    let punktVorher = 0;
    for (const v of [400, 300, 200, 160, 120, 100, 80, 60, 40, 30, 20, 16, 13.4]) {
      const h = anzeige(konfig(refraktorMitVergroesserung(80, v), MOND_EV));
      expect(h.faktorObjekt).toBeGreaterThan(vorher);
      expect(h.punktFaktor).toBeGreaterThan(punktVorher);
      vorher = h.faktorObjekt;
      punktVorher = h.punktFaktor;
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
  it("Grenzfall Mars 6'', Bortle 9, diesig, 10 Grad: Himmel 10,0 mag unter dem Objekt, Faktor 21,5 (physik.md 12.3)", () => {
    for (const geraet of [AUGE, FERNGLAS_10X50, refraktorMitVergroesserung(80, 200)]) {
      const k: Konfiguration = { geraet, objekt: MARS_6, bedingungen: { ...BEDINGUNGEN_A_D9, bortle: 9, transparenz: "diesig", hoeheGrad: 10 } };
      const h = anzeige(k);
      expect(h.faktorObjekt / h.hintergrundRelativ).toBeCloseTo(21.45, 1);
      expect(h.hintergrundRelativ * 20).toBeLessThan(h.faktorObjekt);
    }
  });
  it("Hintergrund Fernglas 10x50: Bortle 1 0,0170 (sRGB 35), Bortle 9 0,0765 (sRGB 78); Version 1 0,0028 und 0,0127", () => {
    const b1 = anzeige(konfig(FERNGLAS_10X50, MOND_EV, 1)).hintergrundRelativ;
    const b9 = anzeige(konfig(FERNGLAS_10X50, MOND_EV, 9)).hintergrundRelativ;
    expect(b1).toBeCloseTo(0.017, 4);
    expect(b9).toBeCloseTo(0.0765, 4);
    expect(srgb8(b1)).toBe(35);
    expect(srgb8(b9)).toBe(78);
  });
});

/** Mars mit Quellweiss nach Issue #71 (daten/objekte.json mars_14 2,54, mars_25 1,68). */
const MARS_14_GEEICHT: Objektzustand = { ...MARS_14, quelle: { ...MARS_14.quelle!, weissMagProArcsec2: 2.54 } };
const MARS_25_GEEICHT: Objektzustand = { ...MARS_14, kennung: "mars-25", durchmesserArcsec: 25, magnitude: -3, quelle: { ...MARS_14.quelle!, weissMagProArcsec2: 1.68 } };
/** Jupiter 47'' mit Quellweiss nach Issue #71 (daten/objekte.json jup_47 4,29). */
const JUPITER_47: Objektzustand = { kennung: "jup-47", klasse: "sonnensystem", sterne: [], durchmesserArcsec: 47, magnitude: -2.7, quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.05, weissMagProArcsec2: 4.29 }, trabanten: [] };

// Punktebene, docs/recherche/physik.md Abschnitt 14 (Tabelle 14.3).
describe("helligkeit: Punktebene (Issue #72), Punktweiss 6,4 (Issue #100)", () => {
  it("leuchtdichteRelativ: 9,2 ist 1, 2,5 mag dunkler 0,1, ohne Begrenzung nach oben; mit Punktweiss 6,4 ist 6,4 die 1", () => {
    expect(leuchtdichteRelativ(9.2)).toBeCloseTo(1, 12);
    expect(leuchtdichteRelativ(11.7)).toBeCloseTo(0.1, 12);
    expect(leuchtdichteRelativ(6.7)).toBeCloseTo(10, 10);
    expect(leuchtdichteRelativ(6.4, 6.4)).toBe(1);
    expect(leuchtdichteRelativ(8.9, 6.4)).toBeCloseTo(0.1, 12);
    expect(() => leuchtdichteRelativ(Number.NaN)).toThrow(PhysikFehler);
  });
  it("Quellweiss 3,4, AP 0,8 mm ohne Verluste: punktFaktor 10^(-0,4 * 1,375) = 0,28176 gegen Punktweiss; faktorObjekt = punktFaktor^(1/3) gilt mit zwei Weiss nicht mehr", () => {
    const h = helligkeit(optikMit({}), KLAR, 5, MOND);
    expect(h.punktFaktor).toBeCloseTo(0.28176, 5);
    expect(h.punktExponent).toBe(1 / 3);
    expect(h.faktorObjekt).toBeCloseTo(1.5487, 4);
    // Der Abstand der beiden Weiss (2,8 mag) ist der Faktor zwischen den beiden Abbildungen.
    expect(h.faktorObjekt / Math.pow(h.punktFaktor, h.punktExponent)).toBeCloseTo(10 ** ((0.4 / 3) * (9.2 - 6.4)), 12);
  });
  it("Schluessel enthaelt punktFaktor: andere Austrittspupille, anderer Schluessel", () => {
    expect(helligkeit(optikMit({ austrittspupilleMm: 1 }), KLAR, 5, MOND).schluessel).not.toBe(helligkeit(optikMit({}), KLAR, 5, MOND).schluessel);
  });
  it("Jupiter 47'' im 10x50: punktFaktor 3,1772; Io auf einem Arbeitspixel 22,85'' (p = 0,000996) zeigt 0,1468 (sRGB 107) statt linear 0,0035 (Version 1: 0,0576, sRGB 68)", () => {
    const h = anzeige(konfig(FERNGLAS_10X50, JUPITER_47));
    expect(h.punktFaktor).toBeCloseTo(3.1772, 3);
    expect(h.faktorObjekt).toBeCloseTo(3.4728, 3);
    // Io (m = 5,0): Fluss 10^(-0,4 (5,0 - 4,29)) = 0,5200 Quadratbogensekunden Quellweiss auf 22,85^2.
    const p = Math.pow(10, -0.4 * (5.0 - 4.29)) / 22.85 ** 2;
    expect(p).toBeCloseTo(0.000996, 5);
    const w = Math.min(1, Math.pow(h.punktFaktor * p, h.punktExponent));
    expect(w).toBeCloseTo(0.1468, 3);
    expect(srgb8(w)).toBe(107);
    expect(srgb8(h.faktorObjekt * p)).toBeLessThan(12);
  });
});

// Mars-Grenze (Issue #72, physik.md 14.4): faktorObjekt wird nicht mehr auf 1 begrenzt.
describe("helligkeit: Mars nach Issue #71 bleibt monoton in der Austrittspupille", () => {
  for (const objekt of [MARS_14_GEEICHT, MARS_25_GEEICHT]) {
    it(`${objekt.kennung}: Anzeige steigt streng mit der Austrittspupille bis 6 mm und bleibt dann`, () => {
      let vorher = 0;
      for (const v of [400, 300, 200, 160, 120, 100, 80, 60, 40, 30, 24, 20, 16, 13.4]) {
        const f = anzeige(konfig(refraktorMitVergroesserung(80, v), objekt)).faktorObjekt;
        expect(f).toBeGreaterThan(vorher);
        vorher = f;
      }
      const ap6 = anzeige(konfig(refraktorMitVergroesserung(80, 80 / 6), objekt)).faktorObjekt;
      const ap8 = anzeige(konfig(refraktorMitVergroesserung(80, 10), objekt)).faktorObjekt;
      expect(ap8).toBeCloseTo(ap6, 12);
    });
  }
  it("bei AP 6 mm am 80-mm-Refraktor ueber 1: Mars 14'' 6,840, Mars 25'' 8,907 (Version 1: 1,135 und 1,478); der Himmel bleibt unter 0,04", () => {
    const m14 = anzeige(konfig(refraktorMitVergroesserung(80, 80 / 6), MARS_14_GEEICHT));
    const m25 = anzeige(konfig(refraktorMitVergroesserung(80, 80 / 6), MARS_25_GEEICHT));
    expect(m14.faktorObjekt).toBeCloseTo(6.84, 2);
    expect(m25.faktorObjekt).toBeCloseTo(8.907, 2);
    expect(m25.hintergrundRelativ).toBeCloseTo(0.03505, 4);
  });
});
