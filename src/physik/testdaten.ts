// Gemeinsame Testdaten der physik-Tests: Startkonfiguration A-D9, Quellbilder, Hilfsbauer.
// Kein Teil des Moduls (nicht in index.ts exportiert), nur von *.test.ts importiert.

import type { Fenster, Simulationsparameter } from "../naht/simulationsparameter";
import type { Bedingungen, Fernrohr, Konfiguration, Objektzustand } from "../naht/konfiguration";

/** Mondquelle nach ADR-0002: NASA SVS, 7600 px, 0,643''/px, Weiss entspricht etwa Vollmond 3,4 mag/arcsec2. */
export const MOND_QUELLE: NonNullable<Objektzustand["quelle"]> = { breitePx: 7600, hoehePx: 7600, massstabArcsecProPx: 0.643, weissMagProArcsec2: 3.4 };

/** Planetenquelle mit feinem Massstab, Weiss etwa Jupiter 5,5 mag/arcsec2 (physik.md 6.3). */
export const JUPITER_QUELLE: NonNullable<Objektzustand["quelle"]> = { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.047, weissMagProArcsec2: 5.5 };

export const MOND_Q1: Objektzustand = { kennung: "mond-q1", klasse: "sonnensystem", sterne: [], durchmesserArcsec: 1860, magnitude: -10, quelle: MOND_QUELLE, trabanten: [] };

/** Bedingungen der Startkonfiguration A-D9: Seeing 2'', Bortle 5, klar, 45 Grad. */
export const BEDINGUNGEN_A_D9: Bedingungen = { seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 };

/** Refraktor der Startkonfiguration A-D9: 80/600 mit Okular 10 mm, 50 Grad. */
export const REFRAKTOR_A_D9: Fernrohr = {
  art: "fernrohr",
  oeffnungMm: 80,
  brennweiteMm: 600,
  obstruktion: 0,
  bauart: "refraktor",
  okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
};

/** Startkonfiguration A-D9 mit dem Mond nach dem ersten Viertel. */
export const KONFIGURATION_A_D9: Konfiguration = { geraet: REFRAKTOR_A_D9, objekt: MOND_Q1, bedingungen: BEDINGUNGEN_A_D9 };

/** Refraktor ohne Obstruktion mit Oeffnung D und Vergroesserung V (Brennweite 10 D, Okular passend). */
export function refraktorMitVergroesserung(oeffnungMm: number, vergroesserung: number): Fernrohr {
  const brennweiteMm = 10 * oeffnungMm;
  return {
    art: "fernrohr",
    oeffnungMm,
    brennweiteMm,
    obstruktion: 0,
    bauart: "refraktor",
    okular: { brennweiteMm: brennweiteMm / vergroesserung, scheinbaresGesichtsfeldGrad: 50 }
  };
}

/** Bedingungen im Zenit mit gegebenem Seeing, sonst wie A-D9. */
export function zenit(seeingFwhmArcsec: number): Bedingungen {
  return { ...BEDINGUNGEN_A_D9, seeingFwhmArcsec, hoeheGrad: 90 };
}

/** Fenster auf die Objektmitte. */
export function fenster(breiteArcsec: number, px: number): Fenster {
  return { breiteArcsec, mitteXArcsec: 0, mitteYArcsec: 0, px };
}

/**
 * Jupiter 47'' mit den vier Galileischen Trabanten, Objekt- und Trabantenwerte aus daten/objekte.json
 * (jup_47). quelle.massstabArcsecProPx 0,047 ist ein Testwert (JUPITER_QUELLE), nicht der des
 * Quellbilds in daten/ (etwa 0,039''/px).
 */
export const JUPITER_47: Objektzustand = {
  kennung: "jup_47",
  klasse: "sonnensystem",
  sterne: [],
  durchmesserArcsec: 47,
  magnitude: -2.7,
  quelle: { ...JUPITER_QUELLE, weissMagProArcsec2: 5.3 },
  trabanten: [
    { name: "Io", dxArcsec: -110, dyArcsec: 2.9, durchmesserArcsec: 1.2, magnitude: 5.0 },
    { name: "Europa", dxArcsec: 175, dyArcsec: -4.7, durchmesserArcsec: 1.03, magnitude: 5.3 },
    { name: "Ganymed", dxArcsec: 330, dyArcsec: 4.3, durchmesserArcsec: 1.73, magnitude: 4.6 },
    { name: "Kallisto", dxArcsec: -520, dyArcsec: -11.7, durchmesserArcsec: 1.58, magnitude: 5.7 }
  ]
};

/**
 * Saturn 20'' mit Titan und Rhea, Objekt- und Trabantenwerte aus daten/objekte.json (sat_20).
 * quelle (1000 px, 0,05''/px) ist ein Testwert, nicht das Quellbild in daten/ (etwa 0,033''/px).
 */
export const SATURN_20: Objektzustand = {
  kennung: "sat_20",
  klasse: "sonnensystem",
  sterne: [],
  durchmesserArcsec: 20,
  magnitude: -0.1,
  quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.05, weissMagProArcsec2: 6.6 },
  trabanten: [
    { name: "Titan", dxArcsec: 150, dyArcsec: -44.4, durchmesserArcsec: 0.85, magnitude: 8.3 },
    { name: "Rhea", dxArcsec: -60, dyArcsec: 20.7, durchmesserArcsec: 0.25, magnitude: 9.5 }
  ]
};

/**
 * Mars 14'' und 6'' ohne Trabanten, Objektwerte aus daten/objekte.json (mars_14, mars_6). Quelle
 * wie in der Anwendung: Bild mars_hst_19950225 (664 px, Scheibe 620 px) auf die Winkelgroesse
 * des Zustands skaliert, also 14/620 bzw. 6/620 ''/px.
 */
export const MARS_14: Objektzustand = {
  kennung: "mars_14",
  klasse: "sonnensystem",
  sterne: [],
  durchmesserArcsec: 14,
  magnitude: -1.4,
  quelle: { breitePx: 664, hoehePx: 664, massstabArcsecProPx: 14 / 620, weissMagProArcsec2: 2.75 },
  trabanten: []
};

export const MARS_6: Objektzustand = {
  kennung: "mars_6",
  klasse: "sonnensystem",
  sterne: [],
  durchmesserArcsec: 6,
  magnitude: 1.0,
  quelle: { breitePx: 664, hoehePx: 664, massstabArcsecProPx: 6 / 620, weissMagProArcsec2: 3.31 },
  trabanten: []
};

/**
 * Faelle des Regressionstests Version 1 (Issue #100, docs/architektur.md 5.3 Bitgleichheit): T1 bis
 * T5a und T6a wie in validierung.test.ts, je im Standardfenster (1024 px) und in einem Zoomfenster
 * von vier Objektdurchmessern (768 px). Mit beiden Weiss auf 3,35 muessen sie dieselben
 * Simulationsparameter liefern wie vor Issue #100 (regression_v1.json).
 */
export const REGRESSION_V1_FAELLE: readonly { fall: string; konfiguration: Konfiguration }[] = [
  { fall: "T1", konfiguration: { geraet: refraktorMitVergroesserung(70, 100), objekt: JUPITER_47, bedingungen: zenit(2) } },
  { fall: "T2a", konfiguration: { geraet: refraktorMitVergroesserung(100, 150), objekt: SATURN_20, bedingungen: zenit(1.5) } },
  { fall: "T2b", konfiguration: { geraet: refraktorMitVergroesserung(60, 100), objekt: SATURN_20, bedingungen: zenit(1.5) } },
  { fall: "T3", konfiguration: { geraet: refraktorMitVergroesserung(80, 100), objekt: MOND_Q1, bedingungen: zenit(2) } },
  { fall: "T4a", konfiguration: { geraet: refraktorMitVergroesserung(300, 200), objekt: JUPITER_47, bedingungen: zenit(3) } },
  { fall: "T4b", konfiguration: { geraet: refraktorMitVergroesserung(100, 200), objekt: JUPITER_47, bedingungen: zenit(3) } },
  { fall: "T4c", konfiguration: { geraet: refraktorMitVergroesserung(300, 200), objekt: JUPITER_47, bedingungen: zenit(1) } },
  { fall: "T4d", konfiguration: { geraet: refraktorMitVergroesserung(100, 200), objekt: JUPITER_47, bedingungen: zenit(1) } },
  { fall: "T5a", konfiguration: { geraet: refraktorMitVergroesserung(150, 200), objekt: MARS_14, bedingungen: zenit(1.5) } },
  { fall: "T6a", konfiguration: { geraet: { art: "auge" }, objekt: MOND_Q1, bedingungen: zenit(2) } },
  { fall: "A-D9", konfiguration: KONFIGURATION_A_D9 }
];

/** FNV-1a ueber die Bytes eines Float32Array, als Hex; vergleicht Kerndaten bitgenau ohne sie abzulegen. */
export function pruefsumme(daten: Float32Array): string {
  const bytes = new Uint8Array(daten.buffer, daten.byteOffset, daten.byteLength);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ (bytes[i] as number), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

/** Simulationsparameter als JSON-taugliches Objekt: kern.daten durch die Pruefsumme ersetzt. */
export function vergleichbar(p: Simulationsparameter): unknown {
  const { daten, ...kern } = p.kern;
  return JSON.parse(JSON.stringify({ ...p, kern: { ...kern, pruefsumme: pruefsumme(daten) } }));
}

/**
 * Synthetischer Deep-Sky-Zustand mit Quellbild und Flaechentabelle (Ring wie M57, nicht die Werte aus
 * daten/): Isophoten 17 bis 22 mag/arcsec^2 in 0,5-mag-Schritten, Flaeche von 300 bis 3000
 * Quadratbogensekunden; ein Zentralstern 15,8 mag (B-V -0,3) und ein Feldstern-artiger 13 mag (B-V 1,5).
 */
export const DEEP_SKY_RING: Objektzustand = {
  kennung: "ring-test",
  klasse: "deep_sky",
  durchmesserArcsec: 80,
  magnitude: 8.8,
  quelle: { breitePx: 400, hoehePx: 400, massstabArcsecProPx: 0.25, weissMagProArcsec2: 16.5 },
  trabanten: [],
  sterne: [
    { name: "Zentralstern", dxArcsec: 0, dyArcsec: 0, magnitude: 15.8, bv: -0.3 },
    { name: "Nachbar", dxArcsec: 30, dyArcsec: 10, magnitude: 13, bv: 1.5 }
  ],
  isophoten: Array.from({ length: 11 }, (_, i) => ({ magProArcsec2: 17 + 0.5 * i, flaecheArcsec2: 300 * Math.pow(10, i / 10) }))
};
