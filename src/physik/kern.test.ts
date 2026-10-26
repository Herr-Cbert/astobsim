import { describe, expect, it } from "vitest";
import type { Kern, Kernbeschreibung } from "../naht/simulationsparameter";
import { arbeitsmassstab, kernbeschreibung, kernSchluessel } from "./arbeitsmassstab";
import { atmosphaere } from "./atmosphaere";
import { aufloesung } from "./aufloesung";
import { airyRadiusArcsec, lambdaDurchDArcsec, mtfPupille } from "./beugung";
import { PhysikFehler } from "./fehler";
import type { Bedingungen, Geraet, Objektzustand } from "../naht/konfiguration";
import { ARCSEC_PRO_GRAD, AUGE_GESICHTSFELD_GRAD, KERN_GROESSE_MAX } from "./konstanten";
import { baueKern, kernFwhmArcsec, kontrastUebertragung } from "./kern";
import { optik } from "./optik";
import { quadratur } from "./profile";
import { BEDINGUNGEN_A_D9, fenster, JUPITER_QUELLE, MOND_QUELLE, refraktorMitVergroesserung, zenit } from "./testdaten";

// Testwerte aus docs/recherche/physik.md, Abschnitt 8 (Kern-FWHM 2,52'', Airy-Energien, Kern-MTF,
// Sub-Pixel-Kern) sowie Abschnitte 1.1 (Airy-Minima) und 1.3 (MTF der Pupille).

function beschreibung(oeffnungMm: number, obstruktion: number, seeingFwhmArcsec: number, augeFwhmArcsec: number, massstabArcsecProPx: number): Kernbeschreibung {
  return { oeffnungMm, obstruktion, seeingFwhmArcsec, augeFwhmArcsec, massstabArcsecProPx };
}

/** Kernbeschreibung ueber die Stufe 1 aus #3: optik, atmosphaere, aufloesung, arbeitsmassstab. */
function ausKonfiguration(geraet: Geraet, bedingungen: Bedingungen, quelle: Objektzustand["quelle"], f: ReturnType<typeof fenster>): Kernbeschreibung {
  const o = optik(geraet);
  const a = atmosphaere(bedingungen);
  const aufl = aufloesung(o, a);
  return kernbeschreibung(o, a, aufl, arbeitsmassstab(aufl, quelle, f));
}

/** Energie des Kerns innerhalb des Radius rArcsec (Pixelmitten). */
function energieInnerhalb(kern: Kern, rArcsec: number): number {
  let summe = 0;
  for (let y = 0; y < kern.groesse; y++) {
    for (let x = 0; x < kern.groesse; x++) {
      const r = Math.hypot(x - kern.radius, y - kern.radius) * kern.massstabArcsecProPx;
      if (r <= rArcsec) summe += kern.daten[y * kern.groesse + x]!;
    }
  }
  return summe;
}

function summe(kern: Kern): number {
  let s = 0;
  for (const wert of kern.daten) s += wert;
  return s;
}

/** Periode in Bogensekunden zur normierten Ortsfrequenz nu = f / f_c der 80-mm-Oeffnung (physik.md 1.3). */
function periode80mm(nu: number): number {
  return lambdaDurchDArcsec(80) / nu;
}

/** Invarianten aus docs/architektur.md Abschnitt 3 und der Naht-Dokumentation zu Kern. */
function pruefeInvarianten(kern: Kern, b: Kernbeschreibung): void {
  expect(kern.groesse % 2).toBe(1);
  expect(kern.groesse).toBeGreaterThanOrEqual(5);
  expect(kern.groesse).toBeLessThanOrEqual(KERN_GROESSE_MAX);
  expect(kern.radius).toBe((kern.groesse - 1) / 2);
  expect(kern.daten.length).toBe(kern.groesse * kern.groesse);
  expect(Math.abs(summe(kern) - 1)).toBeLessThan(1e-6);
  const n = kern.daten.length;
  for (let i = 0; i < n; i++) {
    expect(kern.daten[i]).toBeGreaterThanOrEqual(0);
    expect(kern.daten[i]).toBe(kern.daten[n - 1 - i]);
  }
  expect(kern.massstabArcsecProPx).toBe(b.massstabArcsecProPx);
  expect(kern.beschreibung).toEqual(b);
  expect(kern.schluessel).toBe(kernSchluessel(b));
}

/**
 * Airy-Kern: Energie im Scheibchen zu Energie bis zum zweiten Minimum ist 0,838 / 0,910
 * (physik.md 1.1; unabhaengig vom Abschneiden des Kerns), Kern-MTF trifft die Pupillen-MTF bei
 * nu = 0,9 und verschwindet ab der Grenzfrequenz nu = 1.
 */
function pruefeAiryKern(kern: Kern, obstruktion: number): void {
  if (obstruktion === 0) {
    const e1 = energieInnerhalb(kern, airyRadiusArcsec(80));
    const e2 = energieInnerhalb(kern, 2.233 * lambdaDurchDArcsec(80));
    expect(Math.abs(e1 / e2 / (0.838 / 0.91) - 1)).toBeLessThan(0.01);
    // Der auf 3 FWHM abgeschnittene und auf 1 normierte Kern zeigt im Scheibchen mehr als 0,838 (physik.md 1.1).
    expect(e1).toBeGreaterThan(0.838);
    expect(e1).toBeLessThan(0.9);
  }
  expect(Math.abs(kontrastUebertragung(kern, periode80mm(0.9)) - mtfPupille(0.9, obstruktion))).toBeLessThan(0.003);
  expect(kontrastUebertragung(kern, periode80mm(1))).toBeLessThan(0.01);
  expect(kontrastUebertragung(kern, periode80mm(1.2))).toBeLessThan(0.01);
}

/** 80 mm, 2'' Seeing, Augenanteil vernachlaessigbar wie in physik.md Tabelle 2.4; Massstab fein genug fuer die FWHM-Messung. */
const PROTOTYP_80MM = beschreibung(80, 0, 2, 0.01, 0.25);
/** Dasselbe mit dem Augenanteil des Prototyps (Vorgabe V = 100, also 0,6''). */
const PROTOTYP_80MM_V100 = beschreibung(80, 0, 2, 0.6, 0.25);
/** Nahezu reiner Airy-Kern (Seeing und Auge vernachlaessigbar), 75 px: zweifach ueberabgetastet. */
const AIRY_80MM = beschreibung(80, 0, 0.01, 0.01, 0.12);
const AIRY_80MM_OBSTRUIERT = beschreibung(80, 0.33, 0.01, 0.01, 0.12);
/** Derselbe Airy-Kern mit 41 px, also auf dem vierfach ueberabgetasteten Pfad (bis 42 px). */
const AIRY_80MM_4X = beschreibung(80, 0, 0.01, 0.01, 0.22);
const AIRY_80MM_OBSTRUIERT_4X = beschreibung(80, 0.33, 0.01, 0.01, 0.22);
/** Sub-Pixel-Fall aus dem Hinweis zu #3: Mond 18000'' auf 256 px, 70''/px bei 3'' FWHM. */
const SUB_PIXEL = beschreibung(300, 0, 3, 0.1, 70);
/** Groesster erlaubter Kern: 81 px bei 80 mm und 2'' Seeing. */
const GROESSTER = beschreibung(80, 0, 2, 0.01, 0.19);
const AUGE: Geraet = { art: "auge" };

describe("baueKern ist pur und deterministisch", () => {
  it("gleiche Beschreibung liefert gleiche Daten, auch nach anderen Aufrufen dazwischen", () => {
    const a = baueKern(PROTOTYP_80MM);
    baueKern(SUB_PIXEL);
    baueKern(AIRY_80MM_OBSTRUIERT);
    const b = baueKern(PROTOTYP_80MM);
    expect(b.daten).toEqual(a.daten);
    expect(b.groesse).toBe(a.groesse);
    expect(b.schluessel).toBe(a.schluessel);
  });
  it("veraendert die Beschreibung nicht und gibt eine Kopie zurueck", () => {
    const b = { ...PROTOTYP_80MM };
    const kern = baueKern(b);
    expect(b).toEqual(PROTOTYP_80MM);
    expect(kern.beschreibung).toEqual(b);
    expect(kern.beschreibung).not.toBe(b);
  });
});

describe("Invarianten des Kerns", () => {
  it("gelten fuer Beschreibungen aus dem Arbeitsmassstab (Stufe 1), Kern dort hoechstens 17 px", () => {
    const geraete: [Geraet, Bedingungen][] = [
      [refraktorMitVergroesserung(80, 56), BEDINGUNGEN_A_D9],
      [refraktorMitVergroesserung(300, 600), zenit(0.5)],
      [{ ...refraktorMitVergroesserung(200, 200), obstruktion: 0.33, bauart: "newton" }, { ...BEDINGUNGEN_A_D9, seeingFwhmArcsec: 1 }],
      [AUGE, BEDINGUNGEN_A_D9]
    ];
    const fensterListe = [fenster(3000, 1024), fenster(66, 768), fenster(18000, 256), fenster(20, 2048)];
    for (const [geraet, bedingungen] of geraete) {
      for (const f of fensterListe) {
        for (const quelle of [MOND_QUELLE, JUPITER_QUELLE]) {
          const b = ausKonfiguration(geraet, bedingungen, quelle, f);
          const kern = baueKern(b);
          pruefeInvarianten(kern, b);
          expect(kern.groesse).toBeLessThanOrEqual(17);
        }
      }
    }
  });
  it("gelten fuer die Randfaelle Sub-Pixel, groesster Kern, Obstruktion und beide Ueberabtastungen", () => {
    for (const b of [SUB_PIXEL, GROESSTER, AIRY_80MM_OBSTRUIERT, AIRY_80MM_4X, beschreibung(6, 0, 2, 60, 70)]) {
      pruefeInvarianten(baueKern(b), b);
    }
    expect(baueKern(GROESSTER).groesse).toBe(KERN_GROESSE_MAX);
  });
});

describe("Werte des Prototyps und der Recherche", () => {
  it("Kern-FWHM 2,52'' fuer 80 mm bei 2'' Seeing (Toleranz 1 Prozent)", () => {
    expect(Math.abs(kernFwhmArcsec(baueKern(PROTOTYP_80MM)) / 2.52 - 1)).toBeLessThan(0.01);
    expect(Math.abs(kernFwhmArcsec(baueKern({ ...PROTOTYP_80MM, massstabArcsecProPx: 0.2 })) / 2.52 - 1)).toBeLessThan(0.01);
  });
  it("mit dem Augenanteil des Prototyps (0,6'') liegt die FWHM bei der Quadratur aus 2,52 und 0,6 (Toleranz 2 Prozent)", () => {
    const fwhm = kernFwhmArcsec(baueKern(PROTOTYP_80MM_V100));
    expect(Math.abs(fwhm / quadratur(2.52, 0.6) - 1)).toBeLessThan(0.02);
  });
  it("bei 2,5 Arbeitspixeln je FWHM verbreitert das Binning die gemessene FWHM um hoechstens 6 Prozent", () => {
    const gesamt = quadratur(1.459, 2, 0.01);
    const fwhm = kernFwhmArcsec(baueKern({ ...PROTOTYP_80MM, massstabArcsecProPx: gesamt / 2.5 }));
    expect(fwhm).toBeGreaterThan(2.52);
    expect(fwhm).toBeLessThan(2.52 * 1.06);
  });
  it("Airy-Kern mit 75 px (zweifach ueberabgetastet): Energieverhaeltnis 0,838 / 0,910, MTF wie die Pupille", () => {
    expect(baueKern(AIRY_80MM).groesse).toBe(75);
    pruefeAiryKern(baueKern(AIRY_80MM), 0);
    pruefeAiryKern(baueKern(AIRY_80MM_OBSTRUIERT), 0.33);
  });
  it("Airy-Kern mit 41 px (vierfach ueberabgetastet): dieselben Werte", () => {
    expect(baueKern(AIRY_80MM_4X).groesse).toBe(41);
    pruefeAiryKern(baueKern(AIRY_80MM_4X), 0);
    pruefeAiryKern(baueKern(AIRY_80MM_OBSTRUIERT_4X), 0.33);
  });
  it("Obstruktion 0,33 senkt die MTF bei nu = 0,35 wie die Pupillen-MTF (Toleranz 0,05) und hebt sie bei nu = 0,7 (physik.md 1.3)", () => {
    const frei = baueKern(AIRY_80MM);
    const obstruiert = baueKern(AIRY_80MM_OBSTRUIERT);
    const verhaeltnis = kontrastUebertragung(obstruiert, periode80mm(0.35)) / kontrastUebertragung(frei, periode80mm(0.35));
    const erwartet = mtfPupille(0.35, 0.33) / mtfPupille(0.35, 0);
    expect(erwartet).toBeCloseTo(0.7, 1);
    // Der auf 3 FWHM abgeschnittene Kern hebt die MTF bei niedrigen Frequenzen leicht an (physik.md 9), daher 0,05.
    expect(Math.abs(verhaeltnis - erwartet)).toBeLessThan(0.05);
    expect(kontrastUebertragung(obstruiert, periode80mm(0.7))).toBeGreaterThan(kontrastUebertragung(frei, periode80mm(0.7)));
  });
});

describe("Testhelfer kontrastUebertragung und kernFwhmArcsec", () => {
  it("MTF ist 1 bei unendlicher Periode, faellt mit der Frequenz und bleibt in 0 bis 1", () => {
    const kern = baueKern(PROTOTYP_80MM);
    expect(kontrastUebertragung(kern, Infinity)).toBeCloseTo(1, 8);
    let vorher = 1;
    for (const periode of [100, 20, 10, 5, 3, 2.5, 2]) {
      const mtf = kontrastUebertragung(kern, periode);
      expect(mtf).toBeGreaterThanOrEqual(0);
      expect(mtf).toBeLessThan(vorher);
      vorher = mtf;
    }
    // Bei Periode = FWHM liegt die MTF einer Gauss-PSF bei exp(-2 pi^2 sigma^2 / FWHM^2) = 0,028
    // (Gauss-OTF, physik.md Abschnitt 9); der Moffat-Kern mit Airy liegt in derselben Groessenordnung.
    const gauss = Math.exp((-2 * Math.PI ** 2) / (2 * Math.sqrt(2 * Math.LN2)) ** 2);
    expect(gauss).toBeCloseTo(0.028, 2);
    expect(kontrastUebertragung(kern, 2.52)).toBeGreaterThan(gauss * 0.7);
    expect(kontrastUebertragung(kern, 2.52)).toBeLessThan(gauss * 1.3);
  });
  it("Sub-Pixel-Kern ist nahezu ein Delta: MTF ueber 0,999 bis zur Nyquist-Periode, FWHM-Helfer liefert etwa die Rasteraufloesung", () => {
    const kern = baueKern(SUB_PIXEL);
    expect(kern.groesse).toBe(5);
    expect(kern.radius).toBe(2);
    expect(kern.daten[12]).toBeGreaterThan(0.999);
    expect(kontrastUebertragung(kern, 2 * 70)).toBeGreaterThan(0.999);
    // Die physikalische FWHM (3'') ist im Raster nicht messbar; der Helfer meldet etwa einen Arbeitspixel.
    expect(kernFwhmArcsec(kern)).toBeGreaterThan(0.8 * 70);
    expect(kernFwhmArcsec(kern)).toBeLessThan(1.2 * 70);
  });
  it("kontrastUebertragung wirft PhysikFehler bei Periode 0, negativ oder NaN", () => {
    const kern = baueKern(SUB_PIXEL);
    expect(() => kontrastUebertragung(kern, 0)).toThrow(PhysikFehler);
    expect(() => kontrastUebertragung(kern, -1)).toThrow(PhysikFehler);
    expect(() => kontrastUebertragung(kern, Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("Offener Punkt aus architektur.md Abschnitt 4: blosses Auge, 5 Grad auf 2048 px", () => {
  it("der Arbeitsmassstab aus #3 greift, der Kern ist 17 px und passt in 81", () => {
    const f = fenster(AUGE_GESICHTSFELD_GRAD * ARCSEC_PRO_GRAD, 2048);
    const b = ausKonfiguration(AUGE, BEDINGUNGEN_A_D9, MOND_QUELLE, f);
    // Gesamt-FWHM etwa 63'' (Auge 60'', Beugung 19,5'', Seeing 2,3''), also 25''/px statt 8,8''/px aus dem Fenster.
    expect(b.massstabArcsecProPx).toBeGreaterThan(f.breiteArcsec / f.px);
    const kern = baueKern(b);
    expect(kern.groesse).toBe(17);
    expect(kern.groesse).toBeLessThanOrEqual(KERN_GROESSE_MAX);
  });
  it("selbst mit dem reinen Fenstermassstab 8,8''/px bliebe der Kern unter 81 px", () => {
    const kern = baueKern(beschreibung(6, 0, 2.3, 60, (AUGE_GESICHTSFELD_GRAD * ARCSEC_PRO_GRAD) / 2048));
    expect(kern.groesse).toBe(45);
  });
});

describe("Fehlerfaelle", () => {
  it("wirft PhysikFehler bei nicht endlichen oder nicht positiven Werten und Obstruktion ausserhalb 0 bis 0,5", () => {
    const gut = PROTOTYP_80MM;
    const schlecht: Partial<Kernbeschreibung>[] = [
      { oeffnungMm: Number.NaN },
      { oeffnungMm: 0 },
      { oeffnungMm: Number.POSITIVE_INFINITY },
      { obstruktion: -0.1 },
      { obstruktion: 0.6 },
      { obstruktion: Number.NaN },
      { seeingFwhmArcsec: 0 },
      { seeingFwhmArcsec: -2 },
      { augeFwhmArcsec: Number.POSITIVE_INFINITY },
      { massstabArcsecProPx: 0 },
      { massstabArcsecProPx: Number.NaN }
    ];
    for (const aenderung of schlecht) {
      expect(() => baueKern({ ...gut, ...aenderung })).toThrow(PhysikFehler);
    }
  });
  it("wirft PhysikFehler mit Feld und Wert, wenn der Massstab so fein ist, dass der Kern 81 px sprengen wuerde", () => {
    expect(() => baueKern({ ...GROESSTER, massstabArcsecProPx: 0.18 })).toThrow(PhysikFehler);
    expect(() => baueKern({ ...GROESSTER, massstabArcsecProPx: 0.1 })).toThrow(/kern\.massstabArcsecProPx = 0\.1 ist zu fein/);
  });
  it("wirft nicht im Sub-Pixel-Fall (Hinweis aus #3: FWHM unter einem Arbeitspixel ist gueltig)", () => {
    expect(() => baueKern(SUB_PIXEL)).not.toThrow();
    expect(() => baueKern(beschreibung(6, 0, 2, 60, 70))).not.toThrow();
    expect(() => baueKern(beschreibung(300, 0.3, 0.5, 0.1, 1000))).not.toThrow();
  });
});

describe("Laufzeit (Protokoll, kein harter Test)", () => {
  it("misst den groessten Kern (81 px) und den groessten Kern aus dem Arbeitsmassstab (17 px)", () => {
    const typisch = beschreibung(80, 0, 2, 1.071, quadratur(1.459, 2, 1.071) / 2.5);
    for (const [name, b] of [
      ["groesster Kern 81 px", GROESSTER],
      ["Arbeitsmassstab 17 px", typisch]
    ] as const) {
      baueKern(b);
      const wiederholungen = 5;
      const start = performance.now();
      let kern: Kern | undefined;
      for (let i = 0; i < wiederholungen; i++) kern = baueKern(b);
      const ms = (performance.now() - start) / wiederholungen;
      console.log(`baueKern ${name}: Groesse ${kern!.groesse}, ${ms.toFixed(2)} ms je Aufruf (Ziel unter 20 ms)`);
      expect(kern!.groesse).toBe(name.includes("81") ? 81 : 17);
    }
  });
});
