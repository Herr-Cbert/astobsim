import { describe, expect, it, vi } from "vitest";
import type { Fernglas, Konfiguration, Objektzustand } from "../naht/konfiguration";
import { auswerten } from "./auswerten";
import { ANZEIGE_WEISS_MAG_PRO_ARCSEC2, PUNKT_WEISS_MAG_PRO_ARCSEC2 } from "./konstanten";
import referenz from "./regression_v1.json";
import { BEDINGUNGEN_A_D9, KONFIGURATION_A_D9, MOND_Q1, REGRESSION_V1_FAELLE, refraktorMitVergroesserung, vergleichbar } from "./testdaten";

// Regressionstest Version 1 (Issue #100, docs/architektur.md 5.3 Bitgleichheit): mit beiden Weiss auf
// 3,35 wie vor dem Issue muessen T1 bis T5a (Mars 14''), T6a und A-D9 dieselben Simulationsparameter
// liefern wie vor dem Issue. regression_v1.json ist am Stand 9f370d7 (vor Issue #100) mit denselben
// Faellen erzeugt (REGRESSION_V1_FAELLE, Standardfenster und Zoomfenster); Kerndaten als Pruefsumme.
// Das Mischgewicht ist dort 0, Deckkraft der Trabanten 1 und keine Punktquelle farbig: tonwert rechnet
// damit den Ausdruck aus Version 1 (src/bild/rendere.ts), das Bild ist bytegleich.
//
// vi.mock gilt nur fuer diese Datei: die anderen Tests laufen mit 9,2 und 6,4.
vi.mock("./konstanten", async (original) => ({
  ...(await original<typeof import("./konstanten")>()),
  ANZEIGE_WEISS_MAG_PRO_ARCSEC2: 3.35,
  PUNKT_WEISS_MAG_PRO_ARCSEC2: 3.35
}));

describe("Regression Version 1: beide Weiss 3,35", () => {
  it("die Konstanten sind fuer diese Datei auf Version 1 gesetzt", () => {
    expect(ANZEIGE_WEISS_MAG_PRO_ARCSEC2).toBe(3.35);
    expect(PUNKT_WEISS_MAG_PRO_ARCSEC2).toBe(3.35);
  });

  const alt = referenz as Record<string, unknown>;
  it.each(REGRESSION_V1_FAELLE)("$fall: Simulationsparameter wie vor Issue #100 (Standardfenster und Zoom)", ({ fall, konfiguration }) => {
    expect(vergleichbar(auswerten(konfiguration).parameter)).toEqual(alt[`${fall} Standardfenster`]);
    const d = konfiguration.objekt.durchmesserArcsec * 4;
    const zoom = auswerten(konfiguration, { fenster: { breiteArcsec: d, mitteXArcsec: 0, mitteYArcsec: 0, px: 768 } }).parameter;
    expect(vergleichbar(zoom)).toEqual(alt[`${fall} Zoom`]);
  });

  it("die Referenz enthaelt alle Faelle, nichts mehr", () => {
    expect(Object.keys(alt).sort()).toEqual(REGRESSION_V1_FAELLE.flatMap(({ fall }) => [`${fall} Standardfenster`, `${fall} Zoom`]).sort());
  });
});

// Akzeptanz Issue #55 (Tabelle 12.4, physik.md 12.4) und Punktebene (physik.md 14.3) in sRGB-Kodes:
// gelten mit dem Anzeigeweiss 3,35. Aus helligkeit.test.ts hierher verschoben, dort stehen die Werte
// mit 9,2 und 6,4.
/** Mond mit dem Quellweiss aus daten/objekte.json (mond_ev, 3,35). */
const MOND_EV: Objektzustand = { ...MOND_Q1, quelle: { ...MOND_Q1.quelle!, weissMagProArcsec2: 3.35 } };
const MARS_14: Objektzustand = { kennung: "mars-14", klasse: "sonnensystem", sterne: [], durchmesserArcsec: 14, magnitude: -1, quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.04, weissMagProArcsec2: 4.1 }, trabanten: [] };
const JUPITER_47: Objektzustand = { kennung: "jup-47", klasse: "sonnensystem", sterne: [], durchmesserArcsec: 47, magnitude: -2.7, quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.05, weissMagProArcsec2: 4.29 }, trabanten: [] };
const FERNGLAS_10X50: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };
const konfig = (geraet: Konfiguration["geraet"], objekt: Objektzustand, bortle = 5): Konfiguration => ({ geraet, objekt, bedingungen: { ...BEDINGUNGEN_A_D9, bortle } });
const anzeige = (k: Konfiguration) => auswerten(k, { anzeigePx: 256 }).parameter.helligkeit;
/** sRGB-Kennlinie (IEC 61966-2-1) wie src/ui/zeichne.ts, nur um die Testwerte in 8 Bit zu nennen. */
const srgb8 = (w: number) => Math.round(255 * (w <= 0.0031308 ? 12.92 * w : 1.055 * w ** (1 / 2.4) - 0.055));

describe("Regression Version 1: Tabelle 12.4 und Punktebene in sRGB-Kodes (Anzeigeweiss 3,35)", () => {
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
  it("Mond mit blossem Auge: 0,9169 (sRGB 245)", () => {
    const auge = anzeige(konfig({ art: "auge" }, MOND_EV)).faktorObjekt;
    expect(auge).toBeCloseTo(0.9169, 3);
    expect(srgb8(auge)).toBe(245);
  });
  it("Mars 14'' an 80 mm bei 120x: 0,1625 (sRGB 112)", () => {
    expect(anzeige(konfig(refraktorMitVergroesserung(80, 120), MARS_14)).faktorObjekt).toBeCloseTo(0.1625, 3);
  });
  it("Hintergrund Fernglas 10x50: Bortle 1 0,0028 (sRGB 9), Bortle 9 0,0127 (sRGB 30)", () => {
    expect(anzeige(konfig(FERNGLAS_10X50, MOND_EV, 1)).hintergrundRelativ).toBeCloseTo(0.00282, 4);
    expect(anzeige(konfig(FERNGLAS_10X50, MOND_EV, 9)).hintergrundRelativ).toBeCloseTo(0.0127, 4);
  });
  it("Jupiter 47'' im 10x50: punktFaktor 0,1915 = faktorObjekt^3; Io auf einem Arbeitspixel 22,85'' zeigt 0,0576 (sRGB 68)", () => {
    const h = anzeige(konfig(FERNGLAS_10X50, JUPITER_47));
    expect(h.punktFaktor).toBeCloseTo(0.1915, 3);
    expect(h.faktorObjekt).toBeCloseTo(Math.pow(h.punktFaktor, h.punktExponent), 12);
    const p = Math.pow(10, -0.4 * (5.0 - 4.29)) / 22.85 ** 2;
    const w = Math.min(1, Math.pow(h.punktFaktor * p, h.punktExponent));
    expect(srgb8(w)).toBe(68);
  });
});
