// Gemeinsame Testdaten der physik-Tests: Startkonfiguration A-D9, Quellbilder, Hilfsbauer.
// Kein Teil des Moduls (nicht in index.ts exportiert), nur von *.test.ts importiert.

import type { Fenster } from "../naht/simulationsparameter";
import type { Bedingungen, Fernrohr, Konfiguration, Objektzustand } from "../naht/konfiguration";

/** Mondquelle nach ADR-0002: NASA SVS, 7600 px, 0,643''/px, Weiss entspricht etwa Vollmond 3,4 mag/arcsec2. */
export const MOND_QUELLE: Objektzustand["quelle"] = { breitePx: 7600, hoehePx: 7600, massstabArcsecProPx: 0.643, weissMagProArcsec2: 3.4 };

/** Planetenquelle mit feinem Massstab, Weiss etwa Jupiter 5,5 mag/arcsec2 (physik.md 6.3). */
export const JUPITER_QUELLE: Objektzustand["quelle"] = { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.047, weissMagProArcsec2: 5.5 };

export const MOND_Q1: Objektzustand = { kennung: "mond-q1", durchmesserArcsec: 1860, magnitude: -10, quelle: MOND_QUELLE, trabanten: [] };

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

/** Jupiter 47'' mit den vier Galileischen Trabanten, Werte aus daten/objekte.json (jup_47). */
export const JUPITER_47: Objektzustand = {
  kennung: "jup_47",
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

/** Saturn 20'' mit Titan und Rhea, Werte aus daten/objekte.json (sat_20). */
export const SATURN_20: Objektzustand = {
  kennung: "sat_20",
  durchmesserArcsec: 20,
  magnitude: -0.1,
  quelle: { breitePx: 1000, hoehePx: 1000, massstabArcsecProPx: 0.05, weissMagProArcsec2: 6.6 },
  trabanten: [
    { name: "Titan", dxArcsec: 150, dyArcsec: -44.4, durchmesserArcsec: 0.85, magnitude: 8.3 },
    { name: "Rhea", dxArcsec: -60, dyArcsec: 20.7, durchmesserArcsec: 0.25, magnitude: 9.5 }
  ]
};
