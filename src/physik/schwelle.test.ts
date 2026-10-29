import { describe, expect, it } from "vitest";
import type { Auge, Fernglas, Isophote } from "../naht/konfiguration";
import { type Atmosphaere, atmosphaere } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import { ARCSEC_PRO_RAD } from "./konstanten";
import { type Optik, optik } from "./optik";
import {
  type Beobachter,
  deckkraft,
  deckkraftStern,
  grenzgroesse,
  kontrastschwelle,
  leuchtdichteCdM2,
  schwelleAmOkular,
  type SichtbareIsophote,
  sichtbareIsophote
} from "./schwelle";
import { refraktorMitVergroesserung, zenit } from "./testdaten";

// Testwerte aus docs/recherche/wahrnehmung.md Abschnitt 6: Crumeys Kontrollwerte mit F = 1, 2 und
// 2,36 als Literaturbezug, die Werte fuer astobsim mit F = 1,4 (Tabelle 2.3, eigene Rechnung dort).

const AUGE: Auge = { art: "auge" };
const FERNGLAS_10X50: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };
/** Ohne Extinktion (Tabelle 2.3: Zenit, ohne Extinktion). */
const OHNE: Atmosphaere = { luftmasse: 1, seeingFwhmArcsec: 2, extinktionMag: 0, transmission: 1 };
const BORTLE_3 = 21.4;
const BORTLE_5 = 20.0;
const CRUMEY_HIMMEL = 21.83;
const F1: Beobachter = { feldfaktor: 1, pupilleMm: 6 };
const F2: Beobachter = { feldfaktor: 2, pupilleMm: 6 };

/** Bogenminuten als Bogensekunden. */
const arcmin = (w: number): number => w * 60;
/** Scheibe mit Durchmesser d in Bogensekunden als Flaeche in Steradiant. */
const scheibeSr = (dArcsec: number): number => Math.PI * (dArcsec / 2 / ARCSEC_PRO_RAD) ** 2;
/** Flaeche so gross, dass nur noch C_inf zaehlt. */
const RIESIG_SR = 1e3;

/** Optik als Skalare, Felder wie optik() sie liefert; Newton 200 mm: tau (1 - eps^2) = 0,8 (1 - 0,25^2) = 0,75. */
function newton200(vergroesserung: number): Optik {
  return {
    oeffnungMm: 200,
    vergroesserung,
    obstruktion: 0.25,
    transmission: 0.8,
    austrittspupilleMm: 200 / vergroesserung,
    gesichtsfeld: { form: "kreis", breiteArcsec: 1800, hoeheArcsec: 1800 },
    beidaeugig: false
  };
}

function erwarteRelativ(ist: number, soll: number, toleranz: number): void {
  expect(Math.abs(ist / soll - 1)).toBeLessThan(toleranz);
}

describe("leuchtdichteCdM2: mu = 12,58 - 2,5 log10 B", () => {
  it("21,83 und 25,08 mag/arcsec^2 sind 1,995e-4 und 1,00e-5 cd/m^2", () => {
    erwarteRelativ(leuchtdichteCdM2(21.83), 1.995e-4, 1e-3);
    erwarteRelativ(leuchtdichteCdM2(25.08), 1.0e-5, 1e-3);
  });
  it("wirft PhysikFehler bei NaN", () => {
    expect(() => leuchtdichteCdM2(Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("kontrastschwelle: Crumey Gl. 47, F = 1", () => {
  it("B = 2e-4, Scheiben 1' / 10' / 100': 325,2 / 3,713 / 0,1395", () => {
    erwarteRelativ(kontrastschwelle(scheibeSr(arcmin(1)), 2e-4), 325.2, 2e-3);
    erwarteRelativ(kontrastschwelle(scheibeSr(arcmin(10)), 2e-4), 3.713, 2e-3);
    erwarteRelativ(kontrastschwelle(scheibeSr(arcmin(100)), 2e-4), 0.1395, 2e-3);
  });
  it("Nullhintergrund: B = 1e-5 und 5e-7 bei 10' beide 18,85", () => {
    erwarteRelativ(kontrastschwelle(scheibeSr(arcmin(10)), 1e-5), 18.85, 2e-3);
    expect(kontrastschwelle(scheibeSr(arcmin(10)), 5e-7)).toBe(kontrastschwelle(scheibeSr(arcmin(10)), 1e-5));
    expect(kontrastschwelle(scheibeSr(arcmin(10)), 0)).toBe(kontrastschwelle(scheibeSr(arcmin(10)), 1e-5));
  });
  it("C_inf bei B = 1e-5 / 2e-4: 0,1286 / 0,05705", () => {
    erwarteRelativ(kontrastschwelle(RIESIG_SR, 1e-5), 0.1286, 2e-3);
    erwarteRelativ(kontrastschwelle(RIESIG_SR, 2e-4), 0.05705, 2e-3);
  });
  it("Ricco-Radius bei 21,83: 37,6', dort sind beide Asymptoten gleich, C = 2^(1/q) C_inf", () => {
    const b = leuchtdichteCdM2(CRUMEY_HIMMEL);
    const verhaeltnis = kontrastschwelle(scheibeSr(2 * arcmin(37.57)), b) / kontrastschwelle(RIESIG_SR, b);
    expect(verhaeltnis).toBeCloseTo(2 ** (1 / 0.6), 2);
  });
  it("wirft PhysikFehler bei Flaeche <= 0, negativem B oder NaN", () => {
    expect(() => kontrastschwelle(0, 1e-4)).toThrow(PhysikFehler);
    expect(() => kontrastschwelle(1e-6, -1)).toThrow(PhysikFehler);
    expect(() => kontrastschwelle(1e-6, Number.NaN)).toThrow(PhysikFehler);
  });
});

describe("schwelleAmOkular: Crumey Gl. 77 bis 80", () => {
  it("blosses Auge, F = 1: mu_inf bei 21,83 ist 24,94 (ber. 24,939)", () => {
    const s = schwelleAmOkular(optik(AUGE), OHNE, CRUMEY_HIMMEL, 1e12, F1);
    expect(s.grenzMagProArcsec2).toBeCloseTo(24.939, 2);
  });
  it("blosses Auge ist Gl. 47 mal F (V = 1, AP = p, tau = 1, F_T = 1)", () => {
    const flaeche = Math.PI * arcmin(5) ** 2;
    const s = schwelleAmOkular(optik(AUGE), OHNE, BORTLE_5, flaeche);
    expect(s.kontrast).toBeCloseTo(1.4 * kontrastschwelle(flaeche / ARCSEC_PRO_RAD ** 2, leuchtdichteCdM2(BORTLE_5)), 10);
  });
  it("Lesehilfe 1.2: 10' bei Bortle 5 mit blossem Auge braucht C = 1,9 (F = 1,4), 0,7 mag ueber dem Himmel", () => {
    const s = schwelleAmOkular(optik(AUGE), OHNE, BORTLE_5, Math.PI * arcmin(5) ** 2);
    expect(s.kontrast).toBeCloseTo(1.93, 1);
    expect(BORTLE_5 - s.grenzMagProArcsec2).toBeCloseTo(0.7, 1);
  });
  it("Herschel (475 mm, 157x, p 5,08, F_t 1,6, 21,83, F 2,36): mu_inf 23,18 und mu(alpha) = 23,18 - 4,167 log10(0,468 alpha^-0,6 + 1)", () => {
    const herschel: Optik = { ...newton200(157), oeffnungMm: 475, obstruktion: 0, transmission: 1 / 1.6, austrittspupilleMm: 475 / 157 };
    const beobachter: Beobachter = { feldfaktor: 2.36, pupilleMm: 5.08 };
    expect(schwelleAmOkular(herschel, OHNE, CRUMEY_HIMMEL, 1e12, beobachter).grenzMagProArcsec2).toBeCloseTo(23.18, 2);
    for (const alphaArcmin2 of [0.1, 1, 10]) {
      const erwartet = 23.18 - 4.167 * Math.log10(0.468 * alphaArcmin2 ** -0.6 + 1);
      expect(schwelleAmOkular(herschel, OHNE, CRUMEY_HIMMEL, alphaArcmin2 * 3600, beobachter).grenzMagProArcsec2).toBeCloseTo(erwartet, 2);
    }
    expect(grenzgroesse(herschel, OHNE, CRUMEY_HIMMEL, 0, beobachter)).toBeCloseTo(15.66, 1);
  });
  it("Extinktion wirkt nur auf das Objekt: Grenzflaechenhelligkeit sinkt um die Extinktion, Kontrast bleibt", () => {
    const mit: Atmosphaere = { ...OHNE, extinktionMag: 0.3 };
    const a = schwelleAmOkular(newton200(100), OHNE, BORTLE_5, 1e4);
    const b = schwelleAmOkular(newton200(100), mit, BORTLE_5, 1e4);
    expect(b.kontrast).toBe(a.kontrast);
    expect(a.grenzMagProArcsec2 - b.grenzMagProArcsec2).toBeCloseTo(0.3, 12);
  });
  it("Fernrohr einaeugig: F_T = sqrt 2 gegen dieselbe Optik beidaeugig", () => {
    const ein = schwelleAmOkular(newton200(100), OHNE, BORTLE_5, 1e4).kontrast;
    const zwei = schwelleAmOkular({ ...newton200(100), beidaeugig: true }, OHNE, BORTLE_5, 1e4).kontrast;
    expect(ein / zwei).toBeCloseTo(Math.SQRT2, 12);
  });
  it("wirft PhysikFehler bei Flaeche <= 0", () => {
    expect(() => schwelleAmOkular(newton200(100), OHNE, BORTLE_5, 0)).toThrow(PhysikFehler);
  });
});

describe("optik(): beidaeugig fuer F_T", () => {
  it("Auge und Fernglas beidaeugig, Fernrohr nicht", () => {
    expect(optik(AUGE).beidaeugig).toBe(true);
    expect(optik(FERNGLAS_10X50).beidaeugig).toBe(true);
    expect(optik(refraktorMitVergroesserung(80, 40)).beidaeugig).toBe(false);
  });
});

describe("grenzgroesse: Crumey Gl. 68 und 88", () => {
  it("blosses Auge, F = 1, 21,83: 6,93 (ber. 6,936)", () => {
    expect(grenzgroesse(optik(AUGE), OHNE, CRUMEY_HIMMEL, 0, F1)).toBeCloseTo(6.936, 2);
  });
  it("blosses Auge, F = 2 (Crumey): 21,83 / 20,0 / 18,3 ergibt 6,18 / 5,49 / 4,98", () => {
    [6.18, 5.49, 4.98].forEach((m, i) => expect(grenzgroesse(optik(AUGE), OHNE, [21.83, 20.0, 18.3][i]!, 0, F2)).toBeCloseTo(m, 1));
  });
  it("blosses Auge, F = 1,4 (astobsim): 21,83 / 20,0 / 18,3 ergibt 6,57 / 5,87 / 5,37", () => {
    [6.57, 5.87, 5.37].forEach((m, i) => expect(grenzgroesse(optik(AUGE), OHNE, [21.83, 20.0, 18.3][i]!, 0)).toBeCloseTo(m, 1));
  });
  it("Tabelle 2.3, F = 1,4: 200 mm, Bortle 5, 100x, 2'' ergibt 13,74 (Punkt 13,86)", () => {
    expect(grenzgroesse(newton200(100), OHNE, BORTLE_5, 2)).toBeCloseTo(13.74, 2);
    expect(grenzgroesse(newton200(100), OHNE, BORTLE_5, 0)).toBeCloseTo(13.86, 2);
  });
  it("Tabelle 2.3, F = 2 (Literaturkontrolle): dasselbe ergibt 13,35 (Punkt 13,47)", () => {
    expect(grenzgroesse(newton200(100), OHNE, BORTLE_5, 2, F2)).toBeCloseTo(13.35, 2);
    expect(grenzgroesse(newton200(100), OHNE, BORTLE_5, 0, F2)).toBeCloseTo(13.47, 2);
  });
  it("Abtastung 200 mm, Bortle 5, 2'': 25x 12,25, 50x 13,17, 200x 14,30, 300x 14,62, 400x 14,51", () => {
    const soll: [number, number][] = [[25, 12.25], [50, 13.17], [200, 14.3], [300, 14.62], [400, 14.51]];
    for (const [v, m] of soll) expect(grenzgroesse(newton200(v), OHNE, BORTLE_5, 2)).toBeCloseTo(m, 1);
  });
  it("Tabelle 2.3: 80 mm Refraktor (tau 0,9), Bortle 5: 40x 11,94, 80x 12,56", () => {
    expect(grenzgroesse(optik(refraktorMitVergroesserung(80, 40)), OHNE, BORTLE_5, 2)).toBeCloseTo(11.94, 1);
    expect(grenzgroesse(optik(refraktorMitVergroesserung(80, 80)), OHNE, BORTLE_5, 2)).toBeCloseTo(12.56, 1);
  });
  it("Fernglas 10x50 beidaeugig (tau 0,85): Bortle 5 10,5, Bortle 3 11,05 (F = 2: 10,7)", () => {
    expect(grenzgroesse(optik(FERNGLAS_10X50), OHNE, BORTLE_5, 2)).toBeCloseTo(10.5, 1);
    // Recherche 11,1: gerundet aus 10,7 (F = 2) plus 0,39; ungerundet 10,66 + 0,387 = 11,05 (im PR gemeldet).
    expect(grenzgroesse(optik(FERNGLAS_10X50), OHNE, BORTLE_3, 2)).toBeCloseTo(11.05, 2);
    expect(grenzgroesse(optik(FERNGLAS_10X50), OHNE, BORTLE_3, 2, F2)).toBeCloseTo(10.7, 1);
  });
  it("Faustformel Crumey Gl. 73 (D = 10 cm, F = 2, p = 7 mm, tau 0,75, Nullhintergrund): 12,70", () => {
    const optik100: Optik = { ...newton200(1000), oeffnungMm: 100, obstruktion: 0, transmission: 0.75, austrittspupilleMm: 0.1 };
    expect(grenzgroesse(optik100, OHNE, BORTLE_5, 0, { feldfaktor: 2, pupilleMm: 7 })).toBeCloseTo(12.7, 1);
  });
  it("W1: blosses Auge im Zenit, klar, Bortle 3: 6,40 ohne, etwa 6,2 mit Extinktion", () => {
    expect(grenzgroesse(optik(AUGE), OHNE, BORTLE_3, 2)).toBeCloseTo(6.4, 1);
    expect(grenzgroesse(optik(AUGE), atmosphaere(zenit(2)), BORTLE_3, 2)).toBeCloseTo(6.2, 1);
  });
  it("Seeing-Scheibe ist eine Flaeche: m_lim = mu_lim(alpha) - 2,5 log10 alpha (Gl. 88 gegen Gl. 77)", () => {
    const fwhm = 2;
    const alpha = Math.PI * ((2.8 * fwhm) / 2) ** 2;
    // Auch unter dem Nullhintergrund (Bortle 1 und 3 ab etwa 200x, Bortle 5 bei 400x): Delta B fest.
    for (const mu of [21.9, BORTLE_3, BORTLE_5]) {
      for (const v of [25, 100, 200, 300, 400]) {
        const flaeche = schwelleAmOkular(newton200(v), OHNE, mu, alpha).grenzMagProArcsec2 - 2.5 * Math.log10(alpha);
        // Z = 2,54e-6 lx und 12,58 mag/arcsec^2 passen bis auf 0,004 mag zusammen.
        expect(Math.abs(grenzgroesse(newton200(v), OHNE, mu, fwhm) - flaeche)).toBeLessThan(0.005);
      }
    }
  });
  it("guenstigste Vergroesserung (wahrnehmung.md 1.4): mu_lim eines 10'-Objekts an Bortle 3 faellt oberhalb davon", () => {
    const flaeche = Math.PI * arcmin(5) ** 2;
    const vs = Array.from({ length: 381 }, (_, i) => 20 + i);
    const muLim = vs.map((v) => schwelleAmOkular(newton200(v), OHNE, BORTLE_3, flaeche).grenzMagProArcsec2);
    const beste = muLim.indexOf(Math.max(...muLim));
    expect(vs[beste]).toBeGreaterThan(20);
    expect(vs[beste]).toBeLessThan(400);
    muLim.slice(beste + 1).forEach((m, i) => expect(m).toBeLessThan(muLim[beste + i]!));
    expect(muLim[beste]! - muLim[muLim.length - 1]!).toBeGreaterThan(1);
  });
  it("unter dem Nullhintergrund bleibt Delta B = C_th B_a bei gleicher Flaeche im Auge fest (Gl. 50)", () => {
    // Bortle 3, 200 mm, tau 0,75: B_a < 1e-5 ab etwa 157x. Flaeche am Himmel 1e8 / V^2, im Auge gleich.
    const deltaB = (v: number): number => {
      const bOkular = leuchtdichteCdM2(BORTLE_3) * 0.75 * (200 / v / 6) ** 2;
      return schwelleAmOkular(newton200(v), OHNE, BORTLE_3, 1e8 / v ** 2).kontrast * bOkular;
    };
    erwarteRelativ(deltaB(300), deltaB(200), 1e-9);
    erwarteRelativ(deltaB(400), deltaB(200), 1e-9);
    // Ueber dem Nullhintergrund (100x, hellerer Himmel im Okular) ist Delta B groesser.
    expect(deltaB(100)).toBeGreaterThan(deltaB(200));
  });
  it("wirft PhysikFehler bei negativem Seeing", () => {
    expect(() => grenzgroesse(newton200(100), OHNE, BORTLE_5, -1)).toThrow(PhysikFehler);
  });
});

/**
 * Exponentialscheibe als Flaechentabelle wie aus tools/: mu = mu0 + 1,0857 r / h, Flaeche
 * pi r^2 b/a, Isophoten in 0,1-mag-Schritten (M31-artig, Werte frei gewaehlt).
 */
function scheibenTabelle(mu0: number, hArcsec: number, achsen: number): Isophote[] {
  const zeilen: Isophote[] = [];
  for (let i = 1; i <= 80; i++) {
    const mu = mu0 + 0.1 * i;
    const r = ((mu - mu0) / 1.0857) * hArcsec;
    zeilen.push({ magProArcsec2: mu, flaecheArcsec2: Math.PI * r * r * achsen });
  }
  return zeilen;
}
const SCHEIBE = scheibenTabelle(20, 900, 0.3);

describe("sichtbareIsophote: Vorzeichenwechsel der Reserve, Crumeys Verfahren fuer M31", () => {
  it("am Vorzeichenwechsel ist mu = mu_lim(alpha) und das Verhaeltnis 1", () => {
    const s = sichtbareIsophote(SCHEIBE, newton200(50), OHNE, BORTLE_5);
    expect(s.alleSichtbar).toBe(false);
    expect(s.verhaeltnis).toBe(1);
    expect(s.magProArcsec2).toBeGreaterThan(SCHEIBE[0]!.magProArcsec2);
    // Interpolation zwischen 0,1-mag-Zeilen: Rest unter 0,01 mag.
    expect(schwelleAmOkular(newton200(50), OHNE, BORTLE_5, s.flaecheArcsec2).grenzMagProArcsec2).toBeCloseTo(s.magProArcsec2, 2);
  });
  it("dunklerer Himmel zeigt eine schwaechere Isophote", () => {
    const hell = sichtbareIsophote(SCHEIBE, optik(AUGE), OHNE, 19.0);
    const dunkel = sichtbareIsophote(SCHEIBE, optik(AUGE), OHNE, 21.9);
    expect(dunkel.magProArcsec2).toBeGreaterThan(hell.magProArcsec2);
    expect(dunkel.flaecheArcsec2).toBeGreaterThan(hell.flaecheArcsec2);
  });
  it("auch die schwaechste Zeile sichtbar: alleSichtbar, letzte Zeile, Verhaeltnis >= 1", () => {
    const hell = scheibenTabelle(14, 900, 0.3).slice(0, 10);
    const s = sichtbareIsophote(hell, optik(AUGE), OHNE, 21.9);
    expect(s.alleSichtbar).toBe(true);
    expect(s.magProArcsec2).toBe(hell[9]!.magProArcsec2);
    expect(s.verhaeltnis).toBeGreaterThanOrEqual(1);
  });
  it("keine Zeile sichtbar: der Scheitel der Reserve, Verhaeltnis unter 1, nicht unter der besten Zeile", () => {
    const schwach = scheibenTabelle(26, 60, 1);
    const s = sichtbareIsophote(schwach, optik(AUGE), OHNE, 17.0);
    expect(s.alleSichtbar).toBe(false);
    expect(s.verhaeltnis).toBeLessThan(1);
    const reserven = schwach.map((i) => schwelleAmOkular(optik(AUGE), OHNE, 17.0, i.flaecheArcsec2).grenzMagProArcsec2 - i.magProArcsec2);
    // Der Scheitel der interpolierten Reserve liegt hoechstens wenig ueber der besten Zeile.
    const besteZeile = 10 ** (0.4 * Math.max(...reserven));
    expect(s.verhaeltnis).toBeGreaterThanOrEqual(besteZeile);
    erwarteRelativ(s.verhaeltnis, besteZeile, 1e-3);
  });
  it("Extinktion: die Isophote verschiebt sich zu helleren Werten", () => {
    const ohne = sichtbareIsophote(SCHEIBE, newton200(50), OHNE, BORTLE_5);
    const mit = sichtbareIsophote(SCHEIBE, newton200(50), { ...OHNE, extinktionMag: 0.3 }, BORTLE_5);
    expect(mit.magProArcsec2).toBeLessThan(ohne.magProArcsec2);
  });
  it("schwelleMagProArcsec2 in allen drei Faellen: verhaeltnis = 10^(-0,4 (mu - Schwelle)), am Wechsel gleich mu", () => {
    const faelle = [
      sichtbareIsophote(SCHEIBE, newton200(50), OHNE, BORTLE_5),
      sichtbareIsophote(scheibenTabelle(14, 900, 0.3).slice(0, 10), optik(AUGE), OHNE, 21.9),
      sichtbareIsophote(scheibenTabelle(26, 60, 1), optik(AUGE), OHNE, 17.0)
    ];
    expect(faelle.map((f) => f.verhaeltnis > 1 || f.alleSichtbar)).toEqual([false, true, false]);
    expect(faelle[0]!.schwelleMagProArcsec2).toBe(faelle[0]!.magProArcsec2);
    for (const f of faelle) expect(f.verhaeltnis).toBeCloseTo(10 ** (-0.4 * (f.magProArcsec2 - f.schwelleMagProArcsec2)), 12);
    // Alle sichtbar: Schwelle ist mu_lim der letzten Zeile; keine sichtbar: mu_lim am Scheitel
    // zwischen zwei Zeilen, bis auf den Interpolationsrest.
    expect(faelle[1]!.schwelleMagProArcsec2).toBeCloseTo(schwelleAmOkular(optik(AUGE), OHNE, 21.9, faelle[1]!.flaecheArcsec2).grenzMagProArcsec2, 12);
    expect(faelle[2]!.schwelleMagProArcsec2).toBeCloseTo(schwelleAmOkular(optik(AUGE), OHNE, 17.0, faelle[2]!.flaecheArcsec2).grenzMagProArcsec2, 2);
  });
  it("eine Zeile: diese Zeile; wirft PhysikFehler bei leerer Tabelle oder Flaeche <= 0", () => {
    const eine = [{ magProArcsec2: 21, flaecheArcsec2: 1e5 }];
    expect(sichtbareIsophote(eine, optik(AUGE), OHNE, 21.9).magProArcsec2).toBe(21);
    expect(() => sichtbareIsophote([], optik(AUGE), OHNE, 21.9)).toThrow(PhysikFehler);
    expect(() => sichtbareIsophote([{ magProArcsec2: 21, flaecheArcsec2: 0 }], optik(AUGE), OHNE, 21.9)).toThrow(PhysikFehler);
  });
});

describe("Stetigkeit in Vergroesserung und Himmelshelligkeit (Bortle)", () => {
  // Feine Abtastung ueber AP = p (V = D / 6), den Nullhintergrund und den Schnitt der Seeing-Scheibe;
  // V logarithmisch von 20x bis 400x in Schritten von 0,2 %, die Steigung ist hoechstens 5 mag je Dekade.
  const vergroesserungen = Array.from({ length: 1501 }, (_, i) => 20 * 1.002 ** i);
  const himmel = Array.from({ length: 1001 }, (_, i) => 17 + 0.005 * i);
  const groessterSprung = (werte: number[]): number => Math.max(...werte.slice(1).map((w, i) => Math.abs(w - werte[i]!)));

  it("Grenzgroesse ohne Sprung: hoechstens 0,005 mag je Schritt in V (0,2 %) und in mu (0,005)", () => {
    expect(groessterSprung(vergroesserungen.map((v) => grenzgroesse(newton200(v), OHNE, BORTLE_5, 2)))).toBeLessThan(0.005);
    expect(groessterSprung(vergroesserungen.map((v) => grenzgroesse(newton200(v), OHNE, 21.9, 2)))).toBeLessThan(0.005);
    expect(groessterSprung(himmel.map((mu) => grenzgroesse(newton200(100), OHNE, mu, 2)))).toBeLessThan(0.005);
    expect(groessterSprung(himmel.map((mu) => grenzgroesse(optik(AUGE), OHNE, mu, 2)))).toBeLessThan(0.005);
  });
  // Isophote: am Vorzeichenwechsel waechst die Isophote nach dem Auftauchen wie die Wurzel des
  // Abstands, darum feiner abgetastet (mu in 0,0005, V in 0,02 %). Alle Faelle samt Uebergaengen:
  // Vorzeichenwechsel, keine sichtbar (Scheitel der Reserve, auch bei Gleichstand zweier Zeilen),
  // alle sichtbar (Reihe 5, helle Tabelle).
  const vFein = Array.from({ length: 15001 }, (_, i) => 20 * 1.0002 ** i);
  const muFein = Array.from({ length: 10001 }, (_, i) => 17 + 0.0005 * i);
  const HELL = scheibenTabelle(17, 900, 0.3).slice(0, 30);
  const reihen = (): SichtbareIsophote[][] => [
    vFein.map((v) => sichtbareIsophote(SCHEIBE, newton200(v), OHNE, BORTLE_5)),
    vFein.map((v) => sichtbareIsophote(SCHEIBE, newton200(v), OHNE, 17.5)),
    muFein.map((mu) => sichtbareIsophote(SCHEIBE, newton200(100), OHNE, mu)),
    muFein.map((mu) => sichtbareIsophote(SCHEIBE, optik(AUGE), OHNE, mu)),
    muFein.map((mu) => sichtbareIsophote(HELL, optik(AUGE), OHNE, mu))
  ];

  it("sichtbare Isophote ohne Sprung in mu, log Flaeche, Schwelle und Verhaeltnis, in allen Faellen", () => {
    const alle = reihen();
    const faelle = new Set(alle.flat().map((s) => (s.alleSichtbar ? "alle" : s.verhaeltnis < 1 ? "keine" : "wechsel")));
    expect([...faelle].sort()).toEqual(["alle", "keine", "wechsel"]);
    for (const reihe of alle) {
      expect(groessterSprung(reihe.map((s) => s.magProArcsec2))).toBeLessThan(0.02);
      expect(groessterSprung(reihe.map((s) => Math.log10(s.flaecheArcsec2)))).toBeLessThan(0.06);
      expect(groessterSprung(reihe.map((s) => s.schwelleMagProArcsec2))).toBeLessThan(0.02);
      expect(groessterSprung(reihe.map((s) => s.verhaeltnis))).toBeLessThan(0.005);
    }
  }, 20_000); // lokal 1,7 s, auf dem CI-Runner ueber 5 s
});

describe("deckkraft: Phi((v - 1) / 0,484)", () => {
  it("v = 1 / 1,62 / 0,5 ergibt 0,5 / 0,90 / 0,15", () => {
    expect(deckkraft(1)).toBeCloseTo(0.5, 6);
    expect(deckkraft(1.62)).toBeCloseTo(0.9, 2);
    expect(deckkraft(0.5)).toBeCloseTo(0.15, 2);
  });
  it("monoton steigend zwischen 0 und 1", () => {
    const werte = [0, 0.25, 0.5, 1, 1.5, 2, 4].map(deckkraft);
    werte.slice(1).forEach((w, i) => expect(w).toBeGreaterThan(werte[i]!));
    expect(werte[0]).toBeGreaterThan(0);
    expect(werte[6]).toBeLessThanOrEqual(1);
  });
  it("Stern an der Grenzgroesse 0,5; 0,52 mag heller 0,90; 1,05 mag schwaecher 0,10 (wahrnehmung.md 4.4)", () => {
    expect(deckkraftStern(13, 13)).toBeCloseTo(0.5, 6);
    expect(deckkraftStern(13 - 0.52, 13)).toBeCloseTo(0.9, 2);
    expect(deckkraftStern(13 + 1.05, 13)).toBeCloseTo(0.1, 2);
  });
  it("wirft PhysikFehler bei NaN", () => {
    expect(() => deckkraft(Number.NaN)).toThrow(PhysikFehler);
  });
});
