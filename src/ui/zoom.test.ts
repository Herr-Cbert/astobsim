import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, QuelleAusRaster } from "../bild";
import { rendere } from "../bild/rendere";
import { objektzustand, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import type { Konfiguration } from "../naht/konfiguration";
import { atmosphaere, aufloesung, auswerten, freiesPaar, optik } from "../physik";
import { TEXTE } from "../texte";
import { type Kataloge, voreinstellung } from "../zustand";
import { linearZuSrgb8 } from "./zeichne";
import { quellbildHilfe } from "./zoomansicht";
import { arbeitsmassstabOhneFenster } from "../physik";
import {
  DETAIL_ARBEITSPIXEL,
  detailbreiteArcsec,
  detailstart,
  objektausdehnungArcsec,
  STERN_RAND_PRO_FWHM,
  bodenRelativ,
  VERGLEICH_DEEP_SKY,
  vergleichsparameter,
  verschiebelage,
  ZOOM_ARBEITSPIXEL_MIN,
  ZOOM_RAND,
  zoombreiteArcsec,
  zoomfenster
} from "./zoom";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };

/** Voreinstellung (80/600, Okular 10 mm 50 Grad: 60-fach, Feld 3000") mit anderem Zustand. */
function mit(id: string): Konfiguration {
  const k = voreinstellung(KATALOGE);
  const objekt = objektzustand(KATALOGE.objekte, KATALOGE.nachweise, id);
  if (objekt === undefined) throw new Error(`Testdaten: Zustand ${id} fehlt`);
  return { ...k, objekt };
}

function feld(k: Konfiguration): number {
  const g = optik(k.geraet).gesichtsfeld;
  return Math.min(g.breiteArcsec, g.hoeheArcsec);
}

describe("zoombreiteArcsec", () => {
  it("zeigt Jupiter mit Rand um das Quellbild", () => {
    const k = mit("jup_47");
    const ausdehnung = objektausdehnungArcsec(k);
    expect(ausdehnung).toBeGreaterThanOrEqual(47);
    expect(ausdehnung).toBeLessThan(47 * 1.1);
    expect(zoombreiteArcsec(k)).toBeCloseTo(ausdehnung * (1 + 2 * ZOOM_RAND), 9);
  });

  it("umfasst beim Saturn die Ringe, nicht nur die Kugel", () => {
    const k = mit("sat_16");
    expect(zoombreiteArcsec(k)).toBeGreaterThan(2.269 * 16);
  });

  it("vergroessert den Mond mindestens zweifach gegenueber dem Gesichtsfeld", () => {
    const k = mit("mond_ev");
    expect(zoombreiteArcsec(k)).toBeCloseTo(feld(k) / 2, 9);
    expect(zoombreiteArcsec(k)).toBeLessThan(k.objekt.durchmesserArcsec);
  });

  it("haelt winzige Objekte bei schlechtem Seeing auf mindestens ZOOM_ARBEITSPIXEL_MIN Arbeitspixeln", () => {
    const k0 = mit("mars_6");
    const k = { ...k0, bedingungen: { ...k0.bedingungen, seeingFwhmArcsec: 5 } };
    const fwhm = aufloesung(optik(k.geraet), atmosphaere(k.bedingungen)).gesamtFwhmArcsec;
    expect(zoombreiteArcsec(k)).toBeCloseTo((fwhm / 2.5) * ZOOM_ARBEITSPIXEL_MIN, 9);
    // auswerten nimmt das Fenster an (breiter als ein Arbeitspixel).
    expect(() => auswerten(k, { fenster: zoomfenster(k, { xArcsec: 0, yArcsec: 0 }, 300) })).not.toThrow();
  });
});

describe("detailbreiteArcsec (Issue #77)", () => {
  it("Mond T3 (80/800, Okular 8 mm, Seeing 2): DETAIL_ARBEITSPIXEL Arbeitspixel, deutlich schmaler als der Zoom", () => {
    const k0 = mit("mond_ev");
    if (k0.geraet.art !== "fernrohr") throw new Error("Voreinstellung ist kein Fernrohr");
    const k: Konfiguration = {
      ...k0,
      geraet: { ...k0.geraet, brennweiteMm: 800, okular: { ...k0.geraet.okular, brennweiteMm: 8 } },
      bedingungen: { ...k0.bedingungen, seeingFwhmArcsec: 2 }
    };
    const arbeitspixel = arbeitsmassstabOhneFenster(aufloesung(optik(k.geraet), atmosphaere(k.bedingungen)), k.objekt.quelle!);
    const breite = detailbreiteArcsec(k);
    expect(breite).toBeCloseTo(arbeitspixel * DETAIL_ARBEITSPIXEL, 9);
    // Etwa 1" je Arbeitspixel: ein Krater von 4 km (2,15") ueberdeckt rund zwei Arbeitspixel.
    expect(arbeitspixel).toBeGreaterThan(0.8);
    expect(arbeitspixel).toBeLessThan(1.3);
    expect(breite).toBeLessThan(zoombreiteArcsec(k) / 4);
  });

  it("wird bei den Planeten nicht angeboten, auch nicht im 300 mm bei 1\"", () => {
    for (const id of ["jup_47", "sat_16", "mars_14", "mars_6"]) expect(detailbreiteArcsec(mit(id))).toBeUndefined();
    const k0 = mit("jup_47");
    const k = { ...k0, bedingungen: { ...k0.bedingungen, seeingFwhmArcsec: 1 } };
    expect(detailbreiteArcsec(k)).toBeUndefined();
  });
});

describe("verschiebelage", () => {
  it("Mond: Uebersicht fest (Mond im Feld), Zoom verschiebbar mit der Zoombreite", () => {
    const k = mit("mond_ev");
    expect(verschiebelage(k, false)).toEqual({ durchmesser: 1865, breite: optik(k.geraet).gesichtsfeld.breiteArcsec, erlaubt: false });
    expect(verschiebelage(k, true)).toEqual({ durchmesser: 1865, breite: zoombreiteArcsec(k), erlaubt: true });
    expect(verschiebelage(k, true, true)).toEqual({ durchmesser: 1865, breite: detailbreiteArcsec(k), erlaubt: true });
  });

  it("Jupiter: auch im Zoom nicht verschiebbar", () => {
    expect(verschiebelage(mit("jup_47"), true)?.erlaubt).toBe(false);
  });
});

describe("zoomfenster", () => {
  it("nimmt Mitte und Anzeigepixel unveraendert", () => {
    const k = mit("mond_ev");
    expect(zoomfenster(k, { xArcsec: 120, yArcsec: -40 }, 500)).toEqual({ breiteArcsec: zoombreiteArcsec(k), mitteXArcsec: 120, mitteYArcsec: -40, px: 500 });
    expect(zoomfenster(k, { xArcsec: 120, yArcsec: -40 }, 500, true)).toEqual({ breiteArcsec: detailbreiteArcsec(k), mitteXArcsec: 120, mitteYArcsec: -40, px: 500 });
  });

  it("faellt ohne angebotenes Detail auf das Zoomfenster zurueck", () => {
    const k = mit("jup_47");
    expect(zoomfenster(k, { xArcsec: 0, yArcsec: 0 }, 500, true).breiteArcsec).toBe(zoombreiteArcsec(k));
  });
});

describe("vergleichsparameter", () => {
  const k = mit("jup_47");
  const anblick = auswerten(k, { fenster: zoomfenster(k, { xArcsec: 3, yArcsec: -2 }, 400) }).parameter;
  const v = vergleichsparameter(anblick, k.objekt.quelle!.massstabArcsecProPx);

  it("1x1-Delta-Kern im Massstab des Vergleichsrasters, neutrale Helligkeit", () => {
    expect(v.kern).toMatchObject({ groesse: 1, radius: 0, massstabArcsecProPx: v.quellbild.massstabArcsecProPx });
    expect(Array.from(v.kern.daten)).toEqual([1]);
    expect(v.helligkeit).toMatchObject({ faktorObjekt: 1, hintergrundRelativ: 0, punktFaktor: 1, punktExponent: 1 });
    expect(v.kern.schluessel).not.toBe(anblick.kern.schluessel);
    expect(v.helligkeit.schluessel).not.toBe(anblick.helligkeit.schluessel);
  });

  it("ohne Punktkern (Issue #145): das Vergleichsraster ist schon so fein wie die Anzeige", () => {
    expect(vergleichsparameter({ ...anblick, punktkern: anblick.kern }, k.objekt.quelle!.massstabArcsecProPx)).not.toHaveProperty("punktkern");
  });

  it("gleiches Fenster, Gesichtsfeld und Punktquellen, eigener Schluessel", () => {
    expect(v.fenster).toBe(anblick.fenster);
    expect(v.gesichtsfeld).toBe(anblick.gesichtsfeld);
    expect(v.quellbild.punkte).toBe(anblick.quellbild.punkte);
    expect(v.quellbild.schluessel).not.toBe(anblick.quellbild.schluessel);
    expect(v.quellbild.mitteXArcsec).toBe(3);
    expect(v.quellbild.mitteYArcsec).toBe(-2);
  });

  it("rastert so fein wie Anzeige oder Quelle, nicht im Arbeitsmassstab des Anblicks", () => {
    expect(v.quellbild.rasterPx * v.quellbild.massstabArcsecProPx).toBeCloseTo(anblick.fenster.breiteArcsec, 9);
    expect(v.quellbild.massstabArcsecProPx).toBeLessThan(anblick.quellbild.massstabArcsecProPx);
    // Jupiter: Quellpixel 0,036" feiner als die Anzeige (etwa 0,13"/px), also Anzeigemassstab.
    expect(v.quellbild.rasterPx).toBe(400);
    // Grobe Quelle: Quellmassstab begrenzt.
    const grob = vergleichsparameter(anblick, 1);
    expect(grob.quellbild.rasterPx).toBe(Math.floor(anblick.fenster.breiteArcsec));
  });

  it("rendere zeigt das Quellbild ungefaltet in Quellweiss, der Anblick ist verschmiert", () => {
    // Schachbrett 1"-Felder, Werte 0 und 1: im Vergleichsbild erhalten, im Anblick (2" Seeing) fast grau.
    const n = 128;
    const raster = neuesRaster(n, n, 1, 0);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) raster.daten[j * n + i] = (Math.floor(i / 8) + Math.floor(j / 8)) % 2;
    const quelle = new QuelleAusRaster(raster, 1 / 8);
    const kk: Konfiguration = { ...k, objekt: { ...k.objekt, durchmesserArcsec: 12, quelle: { ...k.objekt.quelle!, breitePx: n, hoehePx: n, massstabArcsecProPx: 1 / 8 } } };
    const p = auswerten(kk, { fenster: zoomfenster(kk, { xArcsec: 0, yArcsec: 0 }, 128) }).parameter;
    const vp = vergleichsparameter(p, 1 / 8);
    const falter = new FalterJs();
    const spanne = (d: Float32Array): number => Math.max(...d) - Math.min(...d);
    const vergleich = rendere(vp, quelle, falter).raster.daten;
    const gefaltet = rendere(p, quelle, falter).raster.daten;
    expect(Math.max(...vergleich)).toBeCloseTo(1, 5);
    expect(spanne(vergleich)).toBeGreaterThan(0.95);
    // In Einheiten von Quellweiss (geteilt durch faktorObjekt): seit dem Anzeigeweiss der Version 2 (Issue #100, #111)
    // ist faktorObjekt hier etwa 1,1 statt 0,21, die absolute Spanne sagt nichts mehr ueber die Faltung.
    expect(spanne(gefaltet) / p.helligkeit.faktorObjekt).toBeLessThan(0.5 * spanne(vergleich));
  });
});

describe("Zoom ohne Quellbild (Doppelsterne, M45, Issue #109)", () => {
  it("Ausdehnung ist der Sternabstand plus je Seite der Kernradius, die Zoombreite das mit Rand oder das halbe Feld", () => {
    const albireo = mit("albireo_2025");
    expect(albireo.objekt.quelle).toBeUndefined();
    const fwhm = aufloesung(optik(albireo.geraet), atmosphaere(albireo.bedingungen)).gesamtFwhmArcsec;
    const ausdehnung = albireo.objekt.durchmesserArcsec + 2 * STERN_RAND_PRO_FWHM * fwhm;
    expect(STERN_RAND_PRO_FWHM).toBe(3);
    expect(objektausdehnungArcsec(albireo)).toBeCloseTo(ausdehnung, 9);
    expect(zoombreiteArcsec(albireo)).toBeCloseTo(ausdehnung * (1 + 2 * ZOOM_RAND), 9);
    // Albireo am 80/600 bei 60x: Gesamt-FWHM rund 2,7'', also knapp 12'' Rand je Seite statt 1,7''.
    expect((zoombreiteArcsec(albireo) - albireo.objekt.durchmesserArcsec) / 2).toBeGreaterThan(10);
    // M45 ist groesser als das Feld: hoechstens die Haelfte des Felds.
    const m45 = mit("m45");
    expect(zoombreiteArcsec(m45)).toBeCloseTo(feld(m45) / 2, 9);
    expect(verschiebelage(m45, true)?.erlaubt).toBe(true);
  });

  it("Vergleichsbild ohne Quellmassstab nimmt das Raster der Anzeige", () => {
    const k = mit("eps_lyr_2027");
    const fenster = zoomfenster(k, { xArcsec: 0, yArcsec: 0 }, 300);
    const anblick = auswerten(k, { fenster }).parameter;
    const v = vergleichsparameter(anblick, 0);
    expect(v.quellbild.rasterPx).toBe(300);
    expect(v.quellbild.massstabArcsecProPx).toBeCloseTo(fenster.breiteArcsec / 300, 12);
  });
});

describe("Hilfetext zum Vergleichsbild (Issue #109, #110)", () => {
  it("ohne Aufnahme der Text zu den berechneten Sternpunkten, bei Deep-Sky der zur Abbildung, sonst der zum Quellbild", () => {
    expect(quellbildHilfe(mit("albireo_2025").objekt)).toBe(TEXTE.hilfe.quellbildOhneAufnahme);
    expect(quellbildHilfe(mit("m45").objekt)).toBe(TEXTE.hilfe.quellbildOhneAufnahme);
    expect(quellbildHilfe(mit("jup_47").objekt)).toBe(TEXTE.hilfe.quellbild);
    expect(quellbildHilfe(mit("m57").objekt)).toBe(TEXTE.hilfe.quellbildDeepSky[VERGLEICH_DEEP_SKY]);
    for (const art of ["linear", "kubikwurzel", "kubikwurzelUeberBoden", "okularOhneSchwelle"] as const) {
      expect(quellbildHilfe(mit("m57").objekt, art)).toBe(TEXTE.hilfe.quellbildDeepSky[art]);
      expect(quellbildHilfe(mit("jup_47").objekt, art)).toBe(TEXTE.hilfe.quellbild);
    }
  });
});

describe("Vergleichsbild bei Deep-Sky (Issue #110, Vorschlag)", () => {
  // M57 am 80/600 bei 60x mit Testquelle: Stufen 1, 1e-3 und 0 (Werte relativ zu Quellweiss).
  const k = mit("m57");
  const n = 64;
  const raster = neuesRaster(n, n, 1, 0);
  for (let i = 0; i < n * n; i++) raster.daten[i] = i % n < 16 ? 1 : i % n < 32 ? 1e-3 : 0;
  const massstab = 2;
  const kk: Konfiguration = { ...k, objekt: { ...k.objekt, durchmesserArcsec: n * massstab, quelle: { ...k.objekt.quelle!, breitePx: n, hoehePx: n, massstabArcsecProPx: massstab } } };
  const quelle = new QuelleAusRaster(raster, massstab);
  const anblick = auswerten(kk, { fenster: { breiteArcsec: n * massstab, mitteXArcsec: 0, mitteYArcsec: 0, px: n } }).parameter;
  const zeile = (v: ReturnType<typeof vergleichsparameter>): number[] => {
    const d = rendere(v, quelle, new FalterJs()).raster.daten;
    const mitte = Math.floor(n / 2) * n;
    return [d[mitte + 8]!, d[mitte + 24]!, d[mitte + 48]!];
  };

  it("Standard ist die Kubikwurzel ueber dem Boden (Entscheidung Herbert, Review #129)", () => {
    expect(VERGLEICH_DEEP_SKY).toBe("kubikwurzelUeberBoden");
    expect(vergleichsparameter(anblick, massstab, undefined, 1e-4).helligkeit).toEqual(vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", 1e-4).helligkeit);
  });

  it("linear: Quellweiss = Bildschirmweiss, ohne deepSky; der Halo bei 1e-3 bleibt fast schwarz", () => {
    const v = vergleichsparameter(anblick, massstab, "linear");
    expect(v.helligkeit.deepSky).toBeUndefined();
    const [weiss, halo, himmel] = zeile(v);
    expect(weiss).toBeCloseTo(1, 5);
    expect(halo).toBeCloseTo(1e-3, 6);
    expect(himmel).toBe(0);
  });

  it("kubikwurzel: Quellweiss = Bildschirmweiss, 1e-3 wird 0,1, Himmel schwarz, keine Schwelle", () => {
    const v = vergleichsparameter(anblick, massstab, "kubikwurzel");
    expect(v.helligkeit.deepSky).toMatchObject({ faktor: 1, himmel: 0, sockel: 0 });
    expect(v.helligkeit.punktExponent).toBe(anblick.helligkeit.punktExponent);
    const [weiss, halo, himmel] = zeile(v);
    expect(weiss).toBeCloseTo(1, 5);
    expect(halo).toBeCloseTo(0.1, 5);
    expect(himmel).toBe(0);
  });

  it("kubikwurzelUeberBoden: Boden schwarz, darueber ((q - b) / (1 - b))^(1/3), Quellweiss = Bildschirmweiss", () => {
    const b = 1e-4;
    const v = vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", b);
    const [weiss, halo, himmel] = zeile(v);
    expect(weiss).toBeCloseTo(1, 5);
    expect(halo).toBeCloseTo(Math.cbrt((1e-3 - b) / (1 - b)), 5);
    expect(himmel).toBe(0);
    // Ein Pixel genau am Boden (Kode 1 der Kennlinie) wird schwarz statt grau wie bei "kubikwurzel".
    // Mit dem Zuschlag aus bodenRelativ (1e-6), denn das Raster speichert 1e-3 als Float32 etwas groesser.
    const amBoden = vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", 1e-3 * (1 + 1e-6));
    expect(zeile(amBoden)[1]).toBe(0);
    expect(zeile(vergleichsparameter(anblick, massstab, "kubikwurzel"))[1]).toBeCloseTo(0.1, 5);
    // Ohne Boden (0) gleich "kubikwurzel".
    expect(zeile(vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", 0))).toEqual(zeile(vergleichsparameter(anblick, massstab, "kubikwurzel")));
  });

  it("bodenRelativ: 10^(-0,4 (mag_dunkel - Quellweiss)) bei log-Kennlinie, sonst 0", () => {
    // M57: Kennlinie 16,72 bis 25,72 mag/arcsec^2, Quellweiss = mag_hell.
    expect(bodenRelativ(KATALOGE, k.objekt) / 10 ** (-0.4 * 9)).toBeCloseTo(1, 5);
    expect(bodenRelativ(KATALOGE, mit("jup_47").objekt)).toBe(0);
    expect(bodenRelativ(KATALOGE, mit("m45").objekt)).toBe(0);
  });

  it("helles Quellweiss (Testdaten wie M42: Kern 13,7, Boden 25 mag/arcsec^2): Nebel bei 20 und 22 mag sichtbar, linear fast schwarz", () => {
    const b = 10 ** (-0.4 * (25 - 13.7));
    const q20 = 10 ** (-0.4 * (20 - 13.7));
    const q22 = 10 ** (-0.4 * (22 - 13.7));
    const r = neuesRaster(n, n, 1, 0);
    for (let i = 0; i < n * n; i++) r.daten[i] = i % n < 16 ? q20 : i % n < 32 ? q22 : b;
    const q = new QuelleAusRaster(r, massstab);
    const werte = (v: ReturnType<typeof vergleichsparameter>): number[] => {
      const d = rendere(v, q, new FalterJs()).raster.daten;
      const mitte = Math.floor(n / 2) * n;
      return [d[mitte + 8]!, d[mitte + 24]!, d[mitte + 48]!];
    };
    const [n20, n22, boden] = werte(vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", b));
    // Linear 0,14 und 0,075 sind in sRGB etwa Kode 105 und 77; der Boden bleibt schwarz.
    expect(linearZuSrgb8(n20!)).toBeGreaterThan(95);
    expect(linearZuSrgb8(n22!)).toBeGreaterThan(65);
    expect(boden).toBe(0);
    // Linear: Kode unter 15, also fast schwarz (so wie es #107 bei M42 meldet).
    expect(linearZuSrgb8(werte(vergleichsparameter(anblick, massstab, "linear"))[0]!)).toBeLessThan(15);
  });

  it("okularOhneSchwelle: Helligkeit und Himmel wie im Anblick, ohne Schwelle und Sockel", () => {
    const v = vergleichsparameter(anblick, massstab, "okularOhneSchwelle");
    const ds = anblick.helligkeit.deepSky!;
    expect(v.helligkeit.deepSky).toMatchObject({ faktor: ds.faktor, himmel: ds.himmel, sockel: 0 });
    expect(v.helligkeit.punktFaktor).toBe(anblick.helligkeit.punktFaktor);
    const [weiss, halo] = zeile(v);
    expect(weiss).toBeCloseTo(Math.min(1, Math.pow(ds.faktor + ds.himmel, 1 / 3)), 4);
    expect(halo).toBeCloseTo(Math.min(1, Math.pow(ds.faktor * 1e-3 + ds.himmel, 1 / 3)), 4);
  });

  it("Begleiter (Issue #136): im Vergleichsbild ohne Schwelle und Sockel, ohne Begleiter kein Feld", () => {
    const mitB: typeof anblick = { ...anblick, helligkeit: { ...anblick.helligkeit, deepSky: { ...anblick.helligkeit.deepSky!, begleiter: [{ schwelleRelativ: 0.3, sockel: 0.01 }] } } };
    for (const a of ["kubikwurzel", "kubikwurzelUeberBoden", "okularOhneSchwelle"] as const) {
      expect(vergleichsparameter(mitB, massstab, a, 1e-4).helligkeit.deepSky!.begleiter).toEqual([{ schwelleRelativ: 1e-30, sockel: 0 }]);
      expect(vergleichsparameter(anblick, massstab, a, 1e-4).helligkeit.deepSky).not.toHaveProperty("begleiter");
    }
    expect(vergleichsparameter(mitB, massstab, "linear").helligkeit.deepSky).toBeUndefined();
  });

  it("jede Abbildung hat einen eigenen Helligkeitsschluessel, Planeten bleiben wie bisher", () => {
    const schluessel = (["linear", "kubikwurzel", "kubikwurzelUeberBoden", "okularOhneSchwelle"] as const).map((a) => vergleichsparameter(anblick, massstab, a, 1e-4).helligkeit.schluessel);
    expect(new Set(schluessel).size).toBe(4);
    expect(vergleichsparameter(anblick, massstab, "kubikwurzelUeberBoden", 2e-4).helligkeit.schluessel).not.toBe(schluessel[2]);
    const jup = mit("jup_47");
    const p = auswerten(jup, { fenster: zoomfenster(jup, { xArcsec: 0, yArcsec: 0 }, 200) }).parameter;
    for (const a of ["linear", "kubikwurzel", "kubikwurzelUeberBoden", "okularOhneSchwelle"] as const) {
      expect(vergleichsparameter(p, jup.objekt.quelle!.massstabArcsecProPx, a).helligkeit).toEqual(vergleichsparameter(p, jup.objekt.quelle!.massstabArcsecProPx, "linear").helligkeit);
    }
  });
});

describe("detailstart (Entscheidung Herbert 2026-10-29)", () => {
  it("ohne Quellbild der hellste Stern, bei gleicher Magnitude der erste; mit Quellbild undefined", () => {
    // Epsilon Lyrae: eps1 A (5,15 mag) ist der hellste der vier Sterne.
    expect(detailstart(mit("eps_lyr_2027"))).toEqual({ xArcsec: 14.251, yArcsec: 102.728 });
    expect(detailstart(mit("albireo_2025"))).toEqual({ xArcsec: -17.15, yArcsec: 0 });
    const k = voreinstellung(KATALOGE);
    // Freies Paar mit gleichen Magnituden: Stern A (der erste).
    expect(detailstart({ ...k, objekt: freiesPaar({ trennungArcsec: 4, magnitudeA: 6, magnitudeB: 6, bvA: 0.6, bvB: 0.6 }) })).toEqual({ xArcsec: -2, yArcsec: 0 });
    // B heller als A: B.
    expect(detailstart({ ...k, objekt: freiesPaar({ trennungArcsec: 4, magnitudeA: 7, magnitudeB: 6, bvA: 0.6, bvB: 0.6 }) })).toEqual({ xArcsec: 2, yArcsec: 0 });
    expect(detailstart(mit("jup_47"))).toBeUndefined();
    expect(detailstart(mit("m57"))).toBeUndefined();
  });
});
