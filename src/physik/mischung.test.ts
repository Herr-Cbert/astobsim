import { describe, expect, it } from "vitest";
import { KOMPRESSIONSEXPONENT, SOCKEL_DELTA_KODES } from "./konstanten";
import { PhysikFehler } from "./fehler";
import { mischgewicht, sockel, srgbDekodierung, srgbKodierung, uebergang } from "./mischung";

// Testwerte aus docs/recherche/wahrnehmung.md 3.2 und 6 (Uebergang), ADR-0004 (Schnitt, Sockel,
// Prototyp M31 im 10x50) und docs/recherche/physik.md Abschnitt 17, Mischgewicht und Sockel (eigene Rechnung).

const kode = (linear: number) => 255 * srgbKodierung(linear);

describe("uebergang: g(x) = 1/(1 + 0,3466 x^2) vor dem Schnitt (wahrnehmung.md 3.2)", () => {
  it("x = 0 / 0,783 / 7,83: g = 1 / 0,825 / 0,045 (Jupiter 47'' mit blossem Auge und im 10x)", () => {
    expect(uebergang(0)).toBe(1);
    expect(uebergang(0.783)).toBeCloseTo(0.825, 3);
    expect(uebergang(7.83)).toBeCloseTo(0.045, 3);
  });
  it("Tabelle 3.2: Mars 6'' blosses Auge 0,997, Saturn 20'' im 10x50 0,21, Jupiter 47'' 50x 0,0019", () => {
    expect(uebergang(0.1)).toBeCloseTo(0.997, 3);
    expect(uebergang(3.33)).toBeCloseTo(0.21, 2);
    expect(uebergang(39.2)).toBeCloseTo(0.0019, 4);
  });
  it("Faktor ist ln 2 / 2: bei x^2 = 2 / ln 2 ist g = 1/2", () => {
    expect(uebergang(Math.sqrt(2 / Math.LN2))).toBeCloseTo(0.5, 12);
  });
  it("wirft PhysikFehler bei x < 0 und NaN", () => {
    expect(() => uebergang(-0.1)).toThrow(PhysikFehler);
    expect(() => uebergang(Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("mischgewicht: g' = max(0, (g - 0,005) / 0,995), x = theta V / 60'' (A-P10, ADR-0004)", () => {
  it("theta = 0: g' = 1 (reiner Punkt)", () => {
    expect(mischgewicht(0, 1)).toBe(1);
  });
  it("T6 Jupiter 47'' mit blossem Auge nahezu Punkt (0,8238), im 10x50 kleiner Anteil (0,0401)", () => {
    expect(mischgewicht(47, 1)).toBeCloseTo(0.8238, 4);
    expect(mischgewicht(47, 10)).toBeCloseTo(0.0401, 4);
  });
  it("exakt 0 fuer T1 bis T4 und T5 Mars 14'' (Bitgleichheit mit Version 1, architektur.md 5.3)", () => {
    const faelle: [string, number, number][] = [
      ["T1 Jupiter 47'', 100-fach", 47, 100],
      ["T2a Saturn 20'', 150-fach", 20, 150],
      ["T2b Saturn 20'', 100-fach", 20, 100],
      ["T3 Mond 1860'', 100-fach", 1860, 100],
      ["T4 Jupiter 47'', 200-fach", 47, 200],
      ["T5a Mars 14'', 200-fach", 14, 200]
    ];
    for (const [, theta, v] of faelle) expect(mischgewicht(theta, v)).toBe(0);
  });
  it("exakt 0 ab x = 24 und darueber, knapp unter der Grenze 23,96 noch positiv (stetig abgeschnitten)", () => {
    expect(mischgewicht(24 * 60, 1)).toBe(0);
    expect(mischgewicht(60, 24)).toBe(0);
    expect(mischgewicht(60, 1000)).toBe(0);
    const unter = mischgewicht(60, 23.9);
    expect(unter).toBeGreaterThan(0);
    expect(unter).toBeLessThan(3e-5);
  });
  it("T5b Mars 6'' bei 120-fach (x = 12) ist gewollt nicht 0: 0,0147", () => {
    expect(mischgewicht(6, 120)).toBeCloseTo(0.0147, 4);
  });
  it("monoton fallend in V, streng solange g' > 0 (Jupiter 47'', V = 1 bis 400)", () => {
    let vorher = mischgewicht(47, 1);
    for (let v = 1.5; v <= 400; v += 0.5) {
      const g = mischgewicht(47, v);
      if (vorher > 0) expect(g).toBeLessThan(vorher);
      else expect(g).toBe(0);
      expect(g).toBeGreaterThanOrEqual(0);
      vorher = g;
    }
  });
  it("haengt nur am Produkt theta V", () => {
    expect(mischgewicht(47, 10)).toBe(mischgewicht(470, 1));
  });
  it("wirft PhysikFehler bei theta < 0, V < 1 und NaN", () => {
    expect(() => mischgewicht(-1, 10)).toThrow(PhysikFehler);
    expect(() => mischgewicht(47, 0.5)).toThrow(PhysikFehler);
    expect(() => mischgewicht(Number.NaN, 10)).toThrow(PhysikFehler);
    expect(() => mischgewicht(47, Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("srgbKodierung und srgbDekodierung (IEC 61966-2-1)", () => {
  it("Endpunkte 0 und 1, bekannte Werte 0,5 -> 0,73536, 0,18 -> 0,46136, kodiert 0,5 -> 0,21404", () => {
    expect(srgbKodierung(0)).toBe(0);
    expect(srgbKodierung(1)).toBeCloseTo(1, 12);
    expect(srgbKodierung(0.5)).toBeCloseTo(0.73536, 5);
    expect(srgbKodierung(0.18)).toBeCloseTo(0.46136, 5);
    expect(srgbDekodierung(0.5)).toBeCloseTo(0.21404, 5);
  });
  it("linearer Abschnitt 12,92 L bis 0,0031308, Knick bei kodiert 0,04045", () => {
    expect(srgbKodierung(0.001)).toBeCloseTo(0.01292, 12);
    expect(srgbKodierung(0.0031308)).toBeCloseTo(0.04045, 5);
    expect(srgbDekodierung(0.04045)).toBeCloseTo(0.0031308, 6);
  });
  it("Hin und zurueck gleich, ausserhalb [0, 1] begrenzt", () => {
    for (const l of [0, 0.0001, 0.003, 0.0032, 0.01, 0.1, 0.5, 0.9, 1]) expect(srgbDekodierung(srgbKodierung(l))).toBeCloseTo(l, 12);
    expect(srgbKodierung(-0.1)).toBe(0);
    expect(srgbKodierung(2)).toBeCloseTo(1, 12);
    expect(srgbDekodierung(1.5)).toBeCloseTo(1, 12);
  });
  it("wirft PhysikFehler bei NaN", () => {
    expect(() => srgbKodierung(Number.NaN)).toThrow(PhysikFehler);
    expect(() => srgbDekodierung(Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("sockel: kleinster Sockel, mit dem die Schwelle Delta_min Kodes ueber dem Himmel liegt (ADR-0004)", () => {
  const n = KOMPRESSIONSEXPONENT;
  // Prototyp M31 im 10x50, Bortle 5 (prototyp/deep_sky.py, F = 2): q relativ zum Kernmaximum,
  // a Leuchtdichte des Kerns im Okular relativ zum Anzeigeweiss 9,2, s Himmel (Kode 48,78).
  const A_M31 = 0.0007565725066201206;
  const S_M31 = 2.825247072737794e-5;
  const Q_STERN_M31 = 0.005040227178017192;
  const pixel = (a: number, s: number, q: number, p: number, sigma: number) => {
    const h = Math.min(1, s ** n);
    return h + p * (Math.min(1, (a * q + s) ** n) - h + sigma);
  };

  it("Prototyp M31 im 10x50: Sockel 0,006279 (Prototyp ohne Reserve 0,005905), Kern 86 -> 88 bei 3 Kodes (Plausibilitaet)", () => {
    const sigma = sockel(A_M31, S_M31, Q_STERN_M31, SOCKEL_DELTA_KODES, n);
    expect(sigma).toBeCloseTo(0.006279, 6);
    expect(Math.round(kode(pixel(A_M31, S_M31, 1, 1, 0)))).toBe(86);
    expect(Math.round(kode(pixel(A_M31, S_M31, 1, 1, sigma)))).toBe(88);
  });
  it("mit Sockel liegt das Pixel an der Schwelle (P = 0,5) stetig genau Delta_min + 0,15 Kodes ueber dem Himmel", () => {
    for (const delta of [1, 3, 6]) {
      const sigma = sockel(A_M31, S_M31, Q_STERN_M31, delta, n);
      expect(sigma).toBeGreaterThan(0);
      const h = S_M31 ** n;
      expect(kode(pixel(A_M31, S_M31, Q_STERN_M31, 0.5, sigma)) - kode(h)).toBeCloseTo(delta + 0.15, 9);
    }
  });
  it("nach dem Runden wie beim Zeichnen (Float32, Tabelle 2^14 wie src/ui/zeichne.ts) ueberall >= Delta_min: Himmelskode 0,5 bis 240, C = a q* / s = 0,135", () => {
    // Nachbau von linearZuSrgb8 (ui darf physik nicht importieren, umgekehrt auch nicht)
    const stufen = 16384;
    const tabelle = Array.from({ length: stufen + 1 }, (_, i) => Math.round(255 * srgbKodierung(i / stufen)));
    const kode8 = (w: number) => (w > 0 ? (w >= 1 ? 255 : tabelle[Math.round(w * stufen)]!) : 0);
    const kodeGerundet = (w: number) => Math.round(Math.fround(srgbKodierung(w)) * 255);
    let zuKlein = 0;
    for (let k = 0.5; k <= 240; k += 0.003) {
      const h = srgbDekodierung(k / 255);
      const s = h ** 3;
      const sigma = sockel(0.135 * s, s, 1, SOCKEL_DELTA_KODES, n);
      const p = Math.fround(pixel(0.135 * s, s, 1, 0.5, sigma));
      const himmel = Math.fround(h);
      if (kode8(p) - kode8(himmel) < SOCKEL_DELTA_KODES || kodeGerundet(p) - kodeGerundet(himmel) < SOCKEL_DELTA_KODES) zuKlein++;
    }
    expect(zuKlein).toBe(0);
  });
  it("Sockel 0, wenn die Abbildung den Abstand schon leistet (Schwelle hoch ueber dem Himmel)", () => {
    // a q* = 10 s: an der Schwelle (11^(1/3) - 1) h / 2 = 0,61 h Zuwachs, bei h = 0,0305 etwa 14 Kodes
    const s = S_M31;
    const a = (10 * s) / Q_STERN_M31;
    expect(sockel(a, s, Q_STERN_M31, 3, n)).toBe(0);
    const h = s ** n;
    expect(kode(pixel(a, s, Q_STERN_M31, 0.5, 0)) - kode(h)).toBeGreaterThanOrEqual(3);
  });
  it("Sockel 0 bei Delta_min = 0", () => {
    expect(sockel(A_M31, S_M31, Q_STERN_M31, 0, n)).toBe(0);
  });
  it("monoton: groesseres Delta_min und schwaechere Schwelle (kleineres q*) brauchen mehr Sockel", () => {
    expect(sockel(A_M31, S_M31, Q_STERN_M31, 6, n)).toBeGreaterThan(sockel(A_M31, S_M31, Q_STERN_M31, 3, n));
    expect(sockel(A_M31, S_M31, Q_STERN_M31 / 2, 3, n)).toBeGreaterThan(sockel(A_M31, S_M31, Q_STERN_M31, 3, n));
  });
  it("Himmel nahe Weiss: Ziel auf Kode 255 begrenzt", () => {
    // h = 0,999: Kode 254,9; Ziel 1, Sockel 2 (1 - h) minus Zuwachs an der Schwelle
    const s = 0.999 ** 3;
    const sigma = sockel(1e-6, s, 1, 3, n);
    expect(sigma).toBeGreaterThan(0);
    expect(pixel(1e-6, s, 1, 0.5, sigma)).toBeCloseTo(1, 12);
  });
  it("wirft PhysikFehler bei a, q*, n <= 0, s < 0, Delta_min ausserhalb 0 bis 255 und NaN", () => {
    expect(() => sockel(0, S_M31, Q_STERN_M31, 3, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, -1e-6, Q_STERN_M31, 3, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, Number.NaN, Q_STERN_M31, 3, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, S_M31, 0, 3, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, S_M31, Q_STERN_M31, -1, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, S_M31, Q_STERN_M31, 256, n)).toThrow(PhysikFehler);
    expect(() => sockel(A_M31, S_M31, Q_STERN_M31, 3, 0)).toThrow(PhysikFehler);
  });
});
