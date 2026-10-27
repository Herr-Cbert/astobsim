import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, QuelleAusRaster } from "../bild";
import { rendere } from "../bild/rendere";
import { objektzustand, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import type { Konfiguration } from "../naht/konfiguration";
import { atmosphaere, aufloesung, auswerten, optik } from "../physik";
import { type Kataloge, voreinstellung } from "../zustand";
import { objektausdehnungArcsec, vergleichsparameter, verschiebelage, ZOOM_ARBEITSPIXEL_MIN, ZOOM_RAND, zoombreiteArcsec, zoomfenster } from "./zoom";

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

describe("verschiebelage", () => {
  it("Mond: Uebersicht fest (Mond im Feld), Zoom verschiebbar mit der Zoombreite", () => {
    const k = mit("mond_ev");
    expect(verschiebelage(k, false)).toEqual({ durchmesser: 1865, breite: optik(k.geraet).gesichtsfeld.breiteArcsec, erlaubt: false });
    expect(verschiebelage(k, true)).toEqual({ durchmesser: 1865, breite: zoombreiteArcsec(k), erlaubt: true });
  });

  it("Jupiter: auch im Zoom nicht verschiebbar", () => {
    expect(verschiebelage(mit("jup_47"), true)?.erlaubt).toBe(false);
  });
});

describe("zoomfenster", () => {
  it("nimmt Mitte und Anzeigepixel unveraendert", () => {
    const k = mit("mond_ev");
    expect(zoomfenster(k, { xArcsec: 120, yArcsec: -40 }, 500)).toEqual({ breiteArcsec: zoombreiteArcsec(k), mitteXArcsec: 120, mitteYArcsec: -40, px: 500 });
  });
});

describe("vergleichsparameter", () => {
  const k = mit("jup_47");
  const anblick = auswerten(k, { fenster: zoomfenster(k, { xArcsec: 3, yArcsec: -2 }, 400) }).parameter;
  const v = vergleichsparameter(anblick, k.objekt.quelle.massstabArcsecProPx);

  it("1x1-Delta-Kern im Massstab des Vergleichsrasters, neutrale Helligkeit", () => {
    expect(v.kern).toMatchObject({ groesse: 1, radius: 0, massstabArcsecProPx: v.quellbild.massstabArcsecProPx });
    expect(Array.from(v.kern.daten)).toEqual([1]);
    expect(v.helligkeit).toMatchObject({ faktorObjekt: 1, hintergrundRelativ: 0, punktFaktor: 1, punktExponent: 1 });
    expect(v.kern.schluessel).not.toBe(anblick.kern.schluessel);
    expect(v.helligkeit.schluessel).not.toBe(anblick.helligkeit.schluessel);
  });

  it("gleiches Fenster, Gesichtsfeld und Punktquellen, eigener Schluessel", () => {
    expect(v.fenster).toBe(anblick.fenster);
    expect(v.gesichtsfeld).toBe(anblick.gesichtsfeld);
    expect(v.quellbild.punktquellen).toBe(anblick.quellbild.punktquellen);
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
    const kk: Konfiguration = { ...k, objekt: { ...k.objekt, durchmesserArcsec: 12, quelle: { ...k.objekt.quelle, breitePx: n, hoehePx: n, massstabArcsecProPx: 1 / 8 } } };
    const p = auswerten(kk, { fenster: zoomfenster(kk, { xArcsec: 0, yArcsec: 0 }, 128) }).parameter;
    const vp = vergleichsparameter(p, 1 / 8);
    const falter = new FalterJs();
    const spanne = (d: Float32Array): number => Math.max(...d) - Math.min(...d);
    const vergleich = rendere(vp, quelle, falter).raster.daten;
    const gefaltet = rendere(p, quelle, falter).raster.daten;
    expect(Math.max(...vergleich)).toBeCloseTo(1, 5);
    expect(spanne(vergleich)).toBeGreaterThan(0.95);
    expect(spanne(gefaltet)).toBeLessThan(0.5 * spanne(vergleich));
  });
});
