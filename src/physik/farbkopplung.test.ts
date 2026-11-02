import { describe, expect, it } from "vitest";
import type { Kern, Punktquelle } from "../naht/simulationsparameter";
import { airyFwhmArcsec } from "./beugung";
import { farbkopplungNoetig, farbpaare, farbreichweiteArcsec, koppleFarben, paarDelle } from "./farbkopplung";
import { baueKern } from "./kern";
import { SCHWELLE_ERKENNBAR } from "./konstanten";
import { quadratur } from "./profile";

// Testwerte: Delle im feinen Modell gegen die Tabelle in docs/recherche/doppelsterne.md 4 (Python,
// Raster 0,02'', Augen-Gauss 60''/V); Kopplung nach physik.md Abschnitt 32.

/** Kern wie doppelsterne.md 4 (ohne Obstruktion, Auge 60''/V) mit 12,5 Pixeln je Gesamt-FWHM. */
function feinerKern(oeffnungMm: number, vergroesserung: number, seeingFwhmArcsec: number): Kern {
  const augeFwhmArcsec = 60 / vergroesserung;
  const fwhm = quadratur(airyFwhmArcsec(oeffnungMm), seeingFwhmArcsec, augeFwhmArcsec);
  return baueKern({ oeffnungMm, obstruktion: 0, seeingFwhmArcsec, augeFwhmArcsec, massstabArcsecProPx: Number((fwhm / 12.5).toPrecision(4)) });
}

const ORANGE: [number, number, number] = [1.62, 0.881, 0.356];
const BLAU: [number, number, number] = [0.804, 0.993, 1.648];
/** Y aus linear sRGB (D65). */
const y = (c: readonly number[]): number => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;

function stern(name: string, xArcsec: number, magnitude: number, farbe?: [number, number, number], sichtbar = true): Punktquelle {
  const p: Punktquelle = { name, xArcsec, yArcsec: 0, durchmesserArcsec: 0.01, helligkeitRelativ: 10 ** (-0.4 * magnitude), sichtbar };
  if (farbe !== undefined) p.farbe = farbe;
  return p;
}

describe("paarDelle: Delle zweier Punkte im feinen Modell (doppelsterne.md 4)", () => {
  it.each([
    { paar: "Epsilon1 Lyr 80 mm 160x 0,5''", d: 80, v: 160, s: 0.5, rho: 2.01, dm: 0.95, tabelle: 0.152 },
    { paar: "Antares 150 mm 200x 0,5''", d: 150, v: 200, s: 0.5, rho: 2.58, dm: 4.44, tabelle: 0.532 },
    { paar: "Antares 150 mm 200x 0,75''", d: 150, v: 200, s: 0.75, rho: 2.58, dm: 4.44, tabelle: 0.202 },
    { paar: "Antares 150 mm 200x 1,5''", d: 150, v: 200, s: 1.5, rho: 2.58, dm: 4.44, tabelle: 0 },
    { paar: "Pi Aql 150 mm 300x 0,5''", d: 150, v: 300, s: 0.5, rho: 1.4, dm: 0.41, tabelle: 0.488 },
    { paar: "Pi Aql 80 mm 160x 0,5''", d: 80, v: 160, s: 0.5, rho: 1.4, dm: 0.41, tabelle: 0 },
    { paar: "Epsilon2 Lyr 80 mm 100x 1,5''", d: 80, v: 100, s: 1.5, rho: 2.42, dm: 0.13, tabelle: 0.138 }
  ])("$paar: Tabelle $tabelle auf 0,02", (f) => {
    expect(Math.abs(paarDelle(feinerKern(f.d, f.v, f.s), f.rho, 1, 10 ** (-0.4 * f.dm)) - f.tabelle)).toBeLessThanOrEqual(0.02);
  });

  it("gleiche Sterne weit getrennt (Kerne ueberlappen nicht): Delle 1; symmetrisch in den Fluessen", () => {
    const k = feinerKern(150, 200, 0.5);
    const weit = 2 * k.radius * k.massstabArcsecProPx + 1;
    expect(paarDelle(k, weit, 1, 1)).toBeCloseTo(1, 6);
    expect(paarDelle(k, 2.58, 1, 0.0167)).toBeCloseTo(paarDelle(k, 2.58, 0.0167, 1), 2);
  });
});

describe("farbpaare und koppleFarben (physik.md 32)", () => {
  const k = feinerKern(150, 200, 1.5);

  it("nicht getrennt (Antares bei 1,5''): sigma 0, beide bekommen das flussgewichtete Mittel mit Y = 1", () => {
    const punkte = [stern("A", -1.29, 1.0, ORANGE), stern("B", 1.29, 5.44, BLAU)];
    const [paar] = farbpaare(punkte, k);
    expect(paar).toMatchObject({ a: 0, b: 1, delle: 0, sigma: 0 });
    const [a, b] = koppleFarben(punkte, k);
    const fa = punkte[0]!.helligkeitRelativ;
    const fb = punkte[1]!.helligkeitRelativ;
    const mittel = ORANGE.map((c, i) => (fa * c + fb * BLAU[i]!) / (fa + fb));
    for (let i = 0; i < 3; i++) {
      expect(a!.farbeAnzeige![i]).toBeCloseTo(mittel[i]!, 12);
      expect(b!.farbeAnzeige![i]).toBeCloseTo(mittel[i]!, 12);
    }
    expect(y(b!.farbeAnzeige!)).toBeCloseTo(y(ORANGE), 3);
    expect(b!.farbe).toBe(BLAU);
    expect(punkte[1]!.farbeAnzeige).toBeUndefined();
  });

  it("getrennt (Antares bei 0,5''): sigma 1, dieselben Objekte zurueck", () => {
    const kern = feinerKern(150, 200, 0.5);
    const punkte = [stern("A", -1.29, 1.0, ORANGE), stern("B", 1.29, 5.44, BLAU)];
    expect(farbpaare(punkte, kern)[0]!.sigma).toBe(1);
    const gekoppelt = koppleFarben(punkte, kern);
    expect(gekoppelt[0]).toBe(punkte[0]);
    expect(gekoppelt[1]).toBe(punkte[1]);
  });

  it("Zwischenwert: sigma = delle / 0,125, Nachbar mit 1 - sigma gewichtet", () => {
    const kern = feinerKern(150, 200, 0.75);
    const punkte = [stern("A", -1.29, 1.0, ORANGE), stern("B", 1.29, 6.0, BLAU)];
    const [paar] = farbpaare(punkte, kern);
    expect(paar!.delle).toBeGreaterThan(0);
    expect(paar!.delle).toBeLessThan(SCHWELLE_ERKENNBAR);
    expect(paar!.sigma).toBeCloseTo(paar!.delle / SCHWELLE_ERKENNBAR, 12);
    const fa = punkte[0]!.helligkeitRelativ;
    const fb = (1 - paar!.sigma) * punkte[1]!.helligkeitRelativ;
    const erwartet = ORANGE.map((c, i) => (fa * c + fb * BLAU[i]!) / (fa + fb));
    const [a] = koppleFarben(punkte, kern);
    for (let i = 0; i < 3; i++) expect(a!.farbeAnzeige![i]).toBeCloseTo(erwartet[i]!, 12);
  });

  it("grauer Nachbar (farbe fehlt) zaehlt als 1, 1, 1; gleiche Farben, unsichtbare und weite Paare aendern nichts", () => {
    const grau = [stern("A", -0.5, 1.0, ORANGE), stern("B", 0.5, 1.0)];
    const [a, b] = koppleFarben(grau, k);
    expect(a!.farbeAnzeige![2]).toBeCloseTo((ORANGE[2] + 1) / 2, 12);
    expect(b!.farbeAnzeige![0]).toBeCloseTo((ORANGE[0] + 1) / 2, 12);
    const gleich = [stern("A", -0.5, 1.0, ORANGE), stern("B", 0.5, 3.0, [...ORANGE])];
    expect(koppleFarben(gleich, k)).toEqual(gleich);
    expect(farbpaare(gleich, k, () => false)).toEqual([]);
    const unsichtbar = [stern("A", -1.29, 1.0, ORANGE), stern("B", 1.29, 5.44, BLAU, false)];
    expect(koppleFarben(unsichtbar, k)[0]).toBe(unsichtbar[0]);
    const weit = [stern("A", -100, 1.0, ORANGE), stern("B", 100, 5.44, BLAU)];
    expect(farbpaare(weit, k)).toEqual([]);
  });

  it("farbkopplungNoetig: nur bei sichtbaren Quellen verschiedener Farbe innerhalb von 6 Gesamt-FWHM", () => {
    expect(farbreichweiteArcsec(2)).toBe(12);
    const paar = [stern("A", 0, 1.0, ORANGE), stern("B", 11, 5.44, BLAU)];
    expect(farbkopplungNoetig(paar, 12)).toBe(true);
    expect(farbkopplungNoetig(paar, 10)).toBe(false);
    expect(farbkopplungNoetig([stern("A", 0, 1.0, ORANGE), stern("B", 1, 2.0, [...ORANGE])], 12)).toBe(false);
    expect(farbkopplungNoetig([stern("A", 0, 1.0, ORANGE), stern("B", 1, 2.0, BLAU, false)], 12)).toBe(false);
    expect(farbkopplungNoetig([stern("A", 0, 1.0), stern("B", 1, 2.0)], 12)).toBe(false);
  });
});
