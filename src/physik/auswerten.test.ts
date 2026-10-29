import { describe, expect, it } from "vitest";
import type { Fernglas, Konfiguration, Objektzustand, Paareingaben } from "../naht/konfiguration";
import { atmosphaere } from "./atmosphaere";
import { aufloesung } from "./aufloesung";
import { auswerten } from "./auswerten";
import { freiesPaar } from "./doppelstern";
import { PhysikFehler } from "./fehler";
import { bortleMagProArcsec2, leuchtdichteRelativ, okularhelligkeit } from "./helligkeit";
import * as physik from "./index";
import { BLACKWELL_BREITE, KOMPRESSIONSEXPONENT, SOCKEL_DELTA_KODES, STERN_DURCHMESSER_ARCSEC } from "./konstanten";
import { sockel } from "./mischung";
import { optik } from "./optik";
import { grenzgroesse, sichtbareIsophote } from "./schwelle";
import {
  BEDINGUNGEN_A_D9,
  DEEP_SKY_RING,
  fenster,
  JUPITER_47,
  KONFIGURATION_A_D9,
  MARS_6,
  REFRAKTOR_A_D9,
  refraktorMitVergroesserung,
  SATURN_20
} from "./testdaten";

// Testwerte: Startkonfiguration A-D9 (80/600, 10 mm 50 Grad, Mond, Seeing 2'', Bortle 5, klar,
// 45 Grad) nach docs/recherche/physik.md Abschnitt 8; Warnschwellen A-D5 nach Abschnitt 4.
// Die Laufzeitmessung steht in auswerten.laufzeit.test.ts, getrennt von den Fehlerfall-Tests.

/** A-D9 mit geaenderten Bedingungen. */
function mitBedingungen(aenderung: Partial<Konfiguration["bedingungen"]>): Konfiguration {
  return { ...KONFIGURATION_A_D9, bedingungen: { ...BEDINGUNGEN_A_D9, ...aenderung } };
}

/** A-D9 mit anderem Okular (Brennweite in mm). */
function mitOkular(brennweiteMm: number): Konfiguration {
  return { ...KONFIGURATION_A_D9, geraet: { ...REFRAKTOR_A_D9, okular: { ...REFRAKTOR_A_D9.okular, brennweiteMm } } };
}

describe("auswerten: Rundreise A-D9", () => {
  const { parameter, anzeige, warnungen } = auswerten(KONFIGURATION_A_D9);

  it("Anzeigewerte: V 60, AP 1,33 mm, wahres Gesichtsfeld 0,83 Grad, dominante Grenze Seeing", () => {
    expect(anzeige.vergroesserung).toBeCloseTo(60, 10);
    expect(anzeige.austrittspupilleMm).toBeCloseTo(1.3333, 4);
    expect(anzeige.wahresGesichtsfeldGrad).toBeCloseTo(0.8333, 4);
    expect(anzeige.aufloesung.dominant).toBe("seeing");
    expect(anzeige.aufloesung.rayleighArcsec).toBeCloseTo(1.73, 2);
    expect(anzeige.aufloesung.dawesArcsec).toBeCloseTo(1.45, 2);
    expect(anzeige.aufloesung.augeFwhmArcsec).toBeCloseTo(1, 10);
  });
  it("Seeing 2'' ist mittel, Pickering 4 bis 5; Luftmasse 1,41 und Extinktion 0,28 mag bei 45 Grad", () => {
    expect(anzeige.seeingWortstufe).toBe("mittel");
    expect([anzeige.pickeringVon, anzeige.pickeringBis]).toEqual([4, 5]);
    expect(anzeige.luftmasse).toBeCloseTo(1.413, 3);
    expect(anzeige.extinktionMag).toBeCloseTo(0.2 * anzeige.luftmasse, 12);
  });
  it("keine Warnungen bei AP 1,33 mm und V 60 an 80 mm", () => {
    expect(warnungen).toEqual([]);
  });
  it("Version 2 (Issue #100): Mond aufgeloest (Mischgewicht 0), kein deepSky, Grenzgroesse 12,0 mag", () => {
    expect(parameter.helligkeit.mischgewicht).toBe(0);
    expect(parameter.helligkeit.deepSky).toBeUndefined();
    expect(anzeige.mischgewicht).toBe(0);
    expect(anzeige.isophote).toBeUndefined();
    // 80 mm, 60x, Bortle 5, 45 Grad (Extinktion 0,28 mag), Seeing 2'' am Objekt 2,46''; wahrnehmung.md 2.3
    // nennt ohne Extinktion im Zenit 11,94 bei 40x und 12,56 bei 80x.
    expect(anzeige.grenzgroesseMag).toBeCloseTo(12.0, 1);
  });
  it("Simulationsparameter: Mond, Kreismaske 3000'', Punktquellen leer, Kernmassstab gleich Arbeitsmassstab", () => {
    expect(parameter.quellbild.punkte.punktquellen).toEqual([]);
    expect(parameter.gesichtsfeld).toEqual({ form: "kreis", breiteArcsec: 3000, hoeheArcsec: 3000 });
    expect(parameter.kern.massstabArcsecProPx).toBe(parameter.quellbild.massstabArcsecProPx);
    // Seit dem Anzeigeweiss 9,2 (A-P13 i) liegt Quellweiss des Monds bei AP 1,33 mm ueber Bildschirmweiss.
    expect(parameter.helligkeit.faktorObjekt).toBeGreaterThan(1);
  });
  it("Ergebnis ist strukturiert klonbar (postMessage an einen Worker)", () => {
    expect(structuredClone({ parameter, anzeige, warnungen })).toEqual({ parameter, anzeige, warnungen });
  });
});

describe("auswerten: Fenster und Arbeitsraster", () => {
  it("Standardfenster: ganzes Gesichtsfeld, Objekt zentriert, 1024 px", () => {
    const { parameter } = auswerten(KONFIGURATION_A_D9);
    expect(parameter.fenster).toEqual({ breiteArcsec: parameter.gesichtsfeld.breiteArcsec, mitteXArcsec: 0, mitteYArcsec: 0, px: 1024 });
    expect(parameter.quellbild.mitteXArcsec).toBe(0);
    expect(parameter.quellbild.mitteYArcsec).toBe(0);
    // Hier gewinnt die Anzeige: 3000'' auf 1024 px, das Arbeitsraster hat genau 1024 Pixel.
    expect(parameter.quellbild.rasterPx).toBe(1024);
  });
  it("anzeigePx setzt die Kantenlaenge des Standardfensters", () => {
    expect(auswerten(KONFIGURATION_A_D9, { anzeigePx: 512 }).parameter.fenster.px).toBe(512);
  });
  it("ein gereichtes Fenster wird unveraendert uebernommen, anzeigePx gilt dann nicht", () => {
    const f = { breiteArcsec: 600, mitteXArcsec: 300, mitteYArcsec: -120, px: 768 };
    const { parameter } = auswerten(KONFIGURATION_A_D9, { fenster: f, anzeigePx: 512 });
    expect(parameter.fenster).toEqual(f);
    expect(parameter.quellbild.mitteXArcsec).toBe(300);
    expect(parameter.quellbild.mitteYArcsec).toBe(-120);
  });
  it("Invarianten: rasterPx ganzzahlig, rasterPx * Massstab = Fensterbreite, Gesamt-FWHM hoechstens 2,5 Arbeitspixel", () => {
    const fensterListe = [undefined, fenster(600, 768), fenster(66, 768), fenster(20, 2048), fenster(3000, 16), fenster(1234.567, 999)];
    for (const okular of [2, 4, 10, 25, 50]) {
      for (const f of fensterListe) {
        const k = mitOkular(okular);
        const { parameter, anzeige } = auswerten(k, { fenster: f });
        const { quellbild, kern, fenster: fe } = parameter;
        expect(Number.isInteger(quellbild.rasterPx)).toBe(true);
        expect(quellbild.rasterPx * quellbild.massstabArcsecProPx).toBeCloseTo(fe.breiteArcsec, 9);
        expect(anzeige.aufloesung.gesamtFwhmArcsec / quellbild.massstabArcsecProPx).toBeLessThanOrEqual(2.5 + 1e-9);
        expect(quellbild.massstabArcsecProPx).toBeGreaterThanOrEqual(k.objekt.quelle!.massstabArcsecProPx);
        expect(quellbild.massstabArcsecProPx).toBeGreaterThanOrEqual(fe.breiteArcsec / fe.px - 1e-12);
        expect(kern.massstabArcsecProPx).toBe(quellbild.massstabArcsecProPx);
        // Der Kern ist mit dem gerundeten Massstab gebaut; Abweichung hoechstens die Rundung auf 4 Stellen.
        expect(Math.abs(kern.beschreibung.massstabArcsecProPx / quellbild.massstabArcsecProPx - 1)).toBeLessThanOrEqual(5e-4);
      }
    }
  });
  it("blosses Auge: Rechteckmaske 5 Grad, keine Warnung bei AP 6 mm", () => {
    const { parameter, anzeige, warnungen } = auswerten({ ...KONFIGURATION_A_D9, geraet: { art: "auge" } });
    expect(parameter.gesichtsfeld).toEqual({ form: "rechteck", breiteArcsec: 18000, hoeheArcsec: 18000 });
    expect(anzeige.wahresGesichtsfeldGrad).toBe(5);
    expect(anzeige.vergroesserung).toBe(1);
    expect(warnungen).toEqual([]);
  });
});

describe("auswerten: Warnungen (A-D5)", () => {
  it("Fernglas 7x50: Austrittspupille 7,14 mm ueber 6 mm", () => {
    const fernglas: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 7, wahresGesichtsfeldGrad: 7 };
    const { warnungen } = auswerten({ ...KONFIGURATION_A_D9, geraet: fernglas });
    expect(warnungen).toHaveLength(1);
    expect(warnungen[0]!.art).toBe("ap-ueber-6");
    expect(warnungen[0]!.wert).toBeCloseTo(50 / 7, 10);
    expect(warnungen[0]!.grenze).toBe(6);
  });
  it("80/600 mit 2-mm-Okular: V 300 ueber 160 und AP 0,27 mm unter 0,5 mm", () => {
    const { warnungen } = auswerten(mitOkular(2));
    expect(warnungen.map((w) => w.art).sort()).toEqual(["ap-unter-0-5", "v-ueber-2d"]);
    const v = warnungen.find((w) => w.art === "v-ueber-2d")!;
    expect(v.wert).toBeCloseTo(300, 10);
    expect(v.grenze).toBe(160);
    const ap = warnungen.find((w) => w.art === "ap-unter-0-5")!;
    expect(ap.wert).toBeCloseTo(80 / 300, 10);
    expect(ap.grenze).toBe(0.5);
  });
  it("genau an der Grenze (V 160, AP 0,5 mm) keine Warnung", () => {
    expect(auswerten(mitOkular(600 / 160)).warnungen).toEqual([]);
  });
});

describe("auswerten: Wiederverwendung des Kerns ueber vorher", () => {
  const erste = auswerten(KONFIGURATION_A_D9);

  it("Bortle aendern baut keinen Kern: derselbe Kern wird zurueckgegeben, die Helligkeit aendert sich", () => {
    const zweite = auswerten(mitBedingungen({ bortle: 8 }), { vorher: erste.parameter });
    expect(zweite.parameter.kern).toBe(erste.parameter.kern);
    expect(zweite.parameter.helligkeit.schluessel).not.toBe(erste.parameter.helligkeit.schluessel);
  });
  it("Transparenz aendern und Verschieben bauen keinen Kern", () => {
    expect(auswerten(mitBedingungen({ transparenz: "diesig" }), { vorher: erste.parameter }).parameter.kern).toBe(erste.parameter.kern);
    const verschoben = auswerten(KONFIGURATION_A_D9, { vorher: erste.parameter, fenster: { ...erste.parameter.fenster, mitteXArcsec: 400 } });
    expect(verschoben.parameter.kern).toBe(erste.parameter.kern);
    expect(verschoben.parameter.quellbild.schluessel).not.toBe(erste.parameter.quellbild.schluessel);
  });
  it("Seeing aendern baut einen neuen Kern mit anderem Schluessel", () => {
    const zweite = auswerten(mitBedingungen({ seeingFwhmArcsec: 3 }), { vorher: erste.parameter });
    expect(zweite.parameter.kern).not.toBe(erste.parameter.kern);
    expect(zweite.parameter.kern.schluessel).not.toBe(erste.parameter.kern.schluessel);
  });
  it("ohne vorher wird der Kern neu gebaut, mit gleichem Schluessel und gleichen Daten", () => {
    const zweite = auswerten(KONFIGURATION_A_D9);
    expect(zweite.parameter.kern).not.toBe(erste.parameter.kern);
    expect(zweite.parameter.kern).toEqual(erste.parameter.kern);
  });
  it("Breite 3000'' und 3000,4'' geben verschiedene Quellbild-Schluessel (Massstab ungerundet)", () => {
    const a = auswerten(KONFIGURATION_A_D9, { fenster: fenster(3000, 1024) });
    const b = auswerten(KONFIGURATION_A_D9, { fenster: fenster(3000.4, 1024) });
    expect(b.parameter.quellbild.rasterPx).toBe(a.parameter.quellbild.rasterPx);
    expect(b.parameter.quellbild.schluessel).not.toBe(a.parameter.quellbild.schluessel);
  });
  it("Verschieben um weniger als die vierte Stelle aendert den Quellbild-Schluessel trotzdem", () => {
    const f = { breiteArcsec: 66, mitteXArcsec: 1234.5, mitteYArcsec: 0, px: 768 };
    const a = auswerten(KONFIGURATION_A_D9, { fenster: f });
    const b = auswerten(KONFIGURATION_A_D9, { fenster: { ...f, mitteXArcsec: 1234.9 } });
    expect(b.parameter.quellbild.schluessel).not.toBe(a.parameter.quellbild.schluessel);
  });
});

describe("auswerten: Punktquellen im Quellbild (Issue #14)", () => {
  // Saturn 20'' an 80 mm: bei V = 8 ist Rhea geblendet, bei V = 10 nicht (Grenze V = 9,45).
  const saturn = (v: number): Konfiguration => ({ ...KONFIGURATION_A_D9, geraet: refraktorMitVergroesserung(80, v), objekt: SATURN_20 });
  // 64 px: der Anzeigemassstab 9,4''/px bestimmt den Arbeitsmassstab, nicht die Augen-FWHM 60'' / V.
  const f = fenster(600, 64);

  it("fuellt quellbild.punktquellen mit den Trabanten des Objektzustands", () => {
    const p = auswerten(saturn(60), { fenster: f }).parameter.quellbild.punkte.punktquellen;
    expect(p.map((q) => q.name)).toEqual(["Titan", "Rhea"]);
    expect(p.every((q) => q.sichtbar)).toBe(true);
  });
  it("andere Sichtbarkeit bei gleichem Fenster gibt einen anderen Punkte-Schluessel, das Objektraster bleibt (Stufe 1b)", () => {
    const a = auswerten(saturn(8), { fenster: f }).parameter.quellbild;
    const b = auswerten(saturn(10), { fenster: f }).parameter.quellbild;
    expect(a.massstabArcsecProPx).toBe(b.massstabArcsecProPx);
    expect(a.punkte.punktquellen.map((q) => q.sichtbar)).toEqual([true, false]);
    expect(b.punkte.punktquellen.map((q) => q.sichtbar)).toEqual([true, true]);
    expect(b.punkte.schluessel).not.toBe(a.punkte.schluessel);
    expect(b.schluessel).toBe(a.schluessel);
  });
  it("andere Sichtbarkeit eines Trabanten ausserhalb des Fensters aendert den Schluessel nicht", () => {
    // Fenster 160'' um Titan (150, -44,4): Rhea bei (-60, 20,7) liegt weit draussen. Titan hier 1 mag
    // heller als in daten/, damit er bei V = 8 und 10 Deckkraft genau 1 hat (8,3 mag: 0,9999998 bei V = 8).
    const hell = { ...SATURN_20, trabanten: [{ ...SATURN_20.trabanten[0]!, magnitude: 7.3 }, SATURN_20.trabanten[1]!] };
    const saturnHell = (v: number): Konfiguration => ({ ...saturn(v), objekt: hell });
    const umTitan = { breiteArcsec: 160, mitteXArcsec: 150, mitteYArcsec: -44.4, px: 16 };
    const a = auswerten(saturnHell(8), { fenster: umTitan }).parameter.quellbild;
    const b = auswerten(saturnHell(10), { fenster: umTitan }).parameter.quellbild;
    expect(a.punkte.punktquellen[1]!.sichtbar).not.toBe(b.punkte.punktquellen[1]!.sichtbar);
    expect(b.punkte.schluessel).toBe(a.punkte.schluessel);
  });
  it("Bortle, Transparenz und Seeing aendern den Objektschluessel nicht (Stufe 1), wohl aber Deckkraft und Punkte-Schluessel (Stufe 1b)", () => {
    const a = auswerten(saturn(10), { fenster: f }).parameter.quellbild;
    const k = saturn(10);
    const b = auswerten({ ...k, bedingungen: { ...k.bedingungen, bortle: 2, transparenz: "diesig", seeingFwhmArcsec: 1 } }, { fenster: f }).parameter.quellbild;
    expect(b.schluessel).toBe(a.schluessel);
    // Rhea (9,5 mag) liegt bei V = 10 knapp ueber der Grenzgroesse 10,1 mag: der dunklere Himmel hebt ihre Deckkraft.
    const rhea = (q: typeof a) => q.punkte.punktquellen.find((p) => p.name === "Rhea")!.deckkraft!;
    expect(rhea(b)).toBeGreaterThan(rhea(a));
    expect(b.punkte.schluessel).not.toBe(a.punkte.schluessel);
  });
  it("gleiche Sichtbarkeit und Deckkraft bei gleichem Fenster gibt denselben Quellbild-Schluessel", () => {
    // Bei V = 60 und 80 haben Titan und Rhea Deckkraft 1 (Grenzgroesse ab 12,0 mag).
    expect(auswerten(saturn(60), { fenster: f }).parameter.quellbild.punkte.schluessel).toBe(auswerten(saturn(80), { fenster: f }).parameter.quellbild.punkte.schluessel);
  });
});

describe("auswerten: Fehlerfaelle sind Programmierfehler", () => {
  it("wirft PhysikFehler mit feld und wert bei NaN, Oeffnung 0 und Fenster unter 16 px", () => {
    const faelle: [Konfiguration, Parameters<typeof auswerten>[1], string][] = [
      [mitBedingungen({ seeingFwhmArcsec: NaN }), {}, "seeingFwhmArcsec"],
      [{ ...KONFIGURATION_A_D9, geraet: { ...REFRAKTOR_A_D9, oeffnungMm: 0 } }, {}, "oeffnungMm"],
      [KONFIGURATION_A_D9, { anzeigePx: 8 }, "fenster.px"],
      [KONFIGURATION_A_D9, { fenster: fenster(3000, 15) }, "fenster.px"],
      [KONFIGURATION_A_D9, { fenster: fenster(0, 1024) }, "fenster.breiteArcsec"],
      [KONFIGURATION_A_D9, { fenster: { ...fenster(3000, 1024), mitteXArcsec: NaN } }, "fenster.mitteXArcsec"],
      [KONFIGURATION_A_D9, { anzeigePx: 512.5 }, "fenster.px"],
      [KONFIGURATION_A_D9, { fenster: fenster(1, 1024) }, "fenster.breiteArcsec"],
      [mitBedingungen({ bortle: 0 }), {}, "bortle"],
      // Seit Issue #100 rechnet auswerten auch Zustaende ohne Quellbild; ein Quellmassstab <= 0 bleibt ein Fehler.
      [{ ...KONFIGURATION_A_D9, objekt: { ...KONFIGURATION_A_D9.objekt, quelle: { ...KONFIGURATION_A_D9.objekt.quelle!, massstabArcsecProPx: 0 } } }, {}, "objekt.quelle.massstabArcsecProPx"]
    ];
    for (const [k, optionen, feld] of faelle) {
      let fehler: unknown;
      try {
        auswerten(k, optionen);
      } catch (e) {
        fehler = e;
      }
      expect(fehler, feld).toBeInstanceOf(PhysikFehler);
      expect((fehler as PhysikFehler).feld).toBe(feld);
    }
  });
  it("begrenzte Nutzereingaben werfen nicht", () => {
    const roh = { ...KONFIGURATION_A_D9, geraet: { ...REFRAKTOR_A_D9, oeffnungMm: 0 }, bedingungen: { ...BEDINGUNGEN_A_D9, bortle: 12, seeingFwhmArcsec: NaN } };
    expect(() => auswerten(physik.begrenze(roh).konfiguration)).not.toThrow();
  });
});

// Version 2 (Issue #100): Reihenfolge und Felder nach docs/architektur.md 5.3 und 5.4. Erwartungswerte
// physik.md Abschnitt 20 (Tabelle "Testwerte auswerten"), Formeln aus physik.md 13 bis 20.
const VORGABE_PAAR: Paareingaben = { trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 };
/** A-D9 (80/600, 60x, Bortle 5, klar, 45 Grad) mit anderem Objekt und optional anderen Bedingungen. */
function ad9Mit(objekt: Objektzustand, bedingungen: Partial<Konfiguration["bedingungen"]> = {}): Konfiguration {
  return { ...KONFIGURATION_A_D9, objekt, bedingungen: { ...BEDINGUNGEN_A_D9, ...bedingungen } };
}

describe("auswerten Version 2: Zustand ohne Quellbild (freies Paar)", () => {
  const k = ad9Mit(freiesPaar(VORGABE_PAAR));
  const { parameter, anzeige, warnungen } = auswerten(k);

  it("rechnet ohne Quellgrenze: Arbeitsmassstab aus Anzeige und Gesamt-FWHM, Bezug 0 mag/arcsec^2", () => {
    // 3000'' auf 1024 px: die Anzeige bestimmt den Massstab, das Raster hat 1024 Pixel.
    expect(parameter.quellbild.rasterPx).toBe(1024);
    const zoom = auswerten(k, { fenster: fenster(10, 1024) }).parameter.quellbild;
    // Im Zoom ohne Quelle nur die PSF-Grenze Gesamt-FWHM / 2,5 (1,212''), auf ganze Arbeitspixel im Fenster: 10'' / 8.
    expect(zoom.rasterPx).toBe(Math.floor(10 / (anzeige.aufloesung.gesamtFwhmArcsec / 2.5)));
    expect(zoom.massstabArcsecProPx).toBe(10 / zoom.rasterPx);
    expect(parameter.helligkeit.hintergrundMagProArcsec2).toBe(okularhelligkeit(optik(k.geraet), atmosphaere(k.bedingungen), 5, k.objekt).hintergrundMagProArcsec2);
    expect(parameter.helligkeit.mischgewicht).toBe(0);
    expect(parameter.helligkeit.deepSky).toBeUndefined();
    expect(anzeige.mischgewicht).toBeUndefined();
  });
  it("Sterne als Punktquellen: 0,01'', Fluss 10^(-0,4 m) relativ zu 0 mag/arcsec^2, Deckkraft 1, Farbe aus B-V", () => {
    const [a, b] = parameter.quellbild.punkte.punktquellen;
    expect(parameter.quellbild.punkte.punktquellen).toHaveLength(2);
    expect(a).toMatchObject({ name: "A", xArcsec: -1, yArcsec: 0, durchmesserArcsec: STERN_DURCHMESSER_ARCSEC, sichtbar: true });
    expect(a!.helligkeitRelativ * Math.PI * (STERN_DURCHMESSER_ARCSEC / 2) ** 2).toBeCloseTo(0.01, 12);
    expect(b!.helligkeitRelativ * Math.PI * (STERN_DURCHMESSER_ARCSEC / 2) ** 2).toBeCloseTo(10 ** -2.4, 12);
    expect(a!.deckkraft).toBeUndefined();
    // 5 und 6 mag liegen ueber der Farbgrenze 7,53 mag (80 mm, 60x, 45 Grad, klar): B-V 0,6 gibt 1,0899 / 0,9787 / 0,9468.
    expect(a!.farbe![0]).toBeCloseTo(1.0899, 4);
    expect(a!.farbe![2]).toBeCloseTo(0.9468, 4);
  });
  it("Schluessel der Punktebene traegt Farbe und Deckkraft; keine Warnung bei 1 mag Unterschied", () => {
    expect(parameter.quellbild.punkte.schluessel).toContain("farbe|1.09|0.9787|0.9468");
    expect(warnungen).toEqual([]);
  });
  it("Grenzgroesse wie schwelle.ts mit dem Seeing am Objekt (2'' im Zenit, 2,46'' bei 45 Grad)", () => {
    const o = optik(k.geraet);
    const a = atmosphaere(k.bedingungen);
    expect(anzeige.grenzgroesseMag).toBe(grenzgroesse(o, a, bortleMagProArcsec2(5), a.seeingFwhmArcsec));
    expect(a.seeingFwhmArcsec).toBeCloseTo(2.46, 2);
    expect(auswerten(ad9Mit(k.objekt, { seeingFwhmArcsec: 4 })).anzeige.grenzgroesseMag).toBeLessThan(anzeige.grenzgroesseMag);
  });
});

describe("auswerten Version 2: Deckkraft, unter_schwelle und Blendung der Sterne", () => {
  const mLim = auswerten(ad9Mit(freiesPaar(VORGABE_PAAR))).anzeige.grenzgroesseMag;
  // 20'' Trennung: bei 60x scheinbar 20', die Blendungsregel (unter 10') greift nicht.
  const paar = (mB: number, trennungArcsec = 20): Objektzustand => freiesPaar({ ...VORGABE_PAAR, magnitudeB: mB, trennungArcsec });
  const stern = (o: Objektzustand, bedingungen = {}) => auswerten(ad9Mit(o, bedingungen)).parameter.quellbild.punkte;

  it("Stern an der Grenzgroesse: Deckkraft 0,4901 (Blackwell ohne Sockel P0, physik.md Abschnitt 20)", () => {
    expect(stern(paar(mLim)).punktquellen[1]!.deckkraft).toBeCloseTo(0.4901, 4);
  });
  it("5 mag unter der Grenzgroesse noch gemalt, 5,05 mag darunter unter_schwelle (Schnitt bei 5,017 mag) und nicht im Schluessel", () => {
    const knapp = stern(paar(mLim + 5));
    expect(knapp.punktquellen[1]).toMatchObject({ sichtbar: true });
    expect(knapp.punktquellen[1]!.deckkraft!).toBeGreaterThan(1e-3);
    const drunter = stern(paar(mLim + 5.05));
    expect(drunter.punktquellen[1]).toMatchObject({ sichtbar: false, grund: "unter_schwelle" });
    expect(drunter.punktquellen[1]!.deckkraft).toBeUndefined();
    expect(drunter.schluessel).not.toContain("|B|");
  });
  it("Bortle aendert Deckkraft und Punkte-Schluessel, nicht den Objektschluessel (Stufe 1 gegen 1b)", () => {
    const a = auswerten(ad9Mit(paar(mLim))).parameter.quellbild;
    const b = auswerten(ad9Mit(paar(mLim), { bortle: 2 })).parameter.quellbild;
    expect(b.punkte.punktquellen[1]!.deckkraft!).toBeGreaterThan(a.punkte.punktquellen[1]!.deckkraft!);
    expect(b.punkte.schluessel).not.toBe(a.punkte.schluessel);
    expect(b.schluessel).toBe(a.schluessel);
  });
  it("Transparenz schaltet die Farbe eines 7,4-mag-Sterns (Farbgrenze klar 7,53, diesig 7,17 mag): anderer Punkte-Schluessel", () => {
    const a = auswerten(ad9Mit(paar(7.4))).parameter.quellbild;
    const b = auswerten(ad9Mit(paar(7.4), { transparenz: "diesig" })).parameter.quellbild;
    expect(a.punkte.punktquellen[1]!.farbe).toBeDefined();
    expect(b.punkte.punktquellen[1]!.farbe).toBeUndefined();
    expect(a.punkte.punktquellen[1]!.deckkraft).toBe(b.punkte.punktquellen[1]!.deckkraft);
    expect(b.punkte.schluessel).not.toBe(a.punkte.schluessel);
    expect(b.schluessel).toBe(a.schluessel);
  });
  it("Blendungsregel A-P6 gilt fuer Sterne: B 7 mag schwaecher bei 8'' ist bis V 75 geblendet, die Objektmitte blendet nicht", () => {
    const sirius = (v: number) => auswerten({ ...ad9Mit(paar(12, 8)), geraet: refraktorMitVergroesserung(80, v) }).parameter.quellbild.punkte.punktquellen;
    expect(sirius(60)[1]).toMatchObject({ sichtbar: false, grund: "blendung" });
    expect(sirius(80)[1]!.sichtbar).toBe(true);
    // A selbst blendet nichts, auch nicht ueber die Gesamthelligkeit an der Mitte (4,999 mag gegen A 5 mag).
    expect(sirius(60)[0]!.sichtbar).toBe(true);
  });
});

describe("auswerten Version 2: Warnung ueberstrahlung nur bei Doppelsternen", () => {
  const antares = freiesPaar({ trennungArcsec: 2.579, magnitudeA: 0.96, magnitudeB: 5.4, bvA: 1.83, bvB: 0.13 });
  it("Antares (2,58'', Delta m 4,44): Warnung mit den Namen der Sterne", () => {
    const w = auswerten(ad9Mit(antares)).warnungen;
    expect(w).toEqual([{ art: "ueberstrahlung", wert: 4.44, grenze: 4, sterne: ["A", "B"] }]);
  });
  it("dieselben Sterne in einem Deep-Sky-Objekt (wie das Trapez in M42): keine Warnung", () => {
    expect(auswerten(ad9Mit({ ...antares, kennung: "dso", klasse: "deep_sky" })).warnungen).toEqual([]);
  });
  it("A-D5-Warnungen kommen zuerst", () => {
    const w = auswerten({ ...ad9Mit(antares), geraet: refraktorMitVergroesserung(80, 300) }).warnungen.map((x) => x.art);
    expect(w).toEqual(["ap-unter-0-5", "v-ueber-2d", "ueberstrahlung"]);
  });
});

describe("auswerten Version 2: Mischgewicht (A-P10)", () => {
  const auge = auswerten({ geraet: { art: "auge" }, objekt: JUPITER_47, bedingungen: BEDINGUNGEN_A_D9 });
  it("Jupiter 47'' mit blossem Auge 0,8238, im 10x50 0,0401 (physik.md 17.3); in Helligkeit, Schluessel und Anzeige", () => {
    expect(auge.parameter.helligkeit.mischgewicht).toBeCloseTo(0.8238, 4);
    expect(auge.anzeige.mischgewicht).toBe(auge.parameter.helligkeit.mischgewicht);
    expect(auge.parameter.helligkeit.schluessel).toContain("|mischgewicht|0.8238");
    const glas: Fernglas = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };
    expect(auswerten({ geraet: glas, objekt: JUPITER_47, bedingungen: BEDINGUNGEN_A_D9 }).parameter.helligkeit.mischgewicht).toBeCloseTo(0.0401, 4);
  });
  it("Mars 6'' am 80 mm: 120x 0,0147 (T5b), 60x 0,0696; ab 240x 0 (gewollte Aenderung nur bei V < 240)", () => {
    const g = (v: number) => auswerten({ geraet: refraktorMitVergroesserung(80, v), objekt: MARS_6, bedingungen: BEDINGUNGEN_A_D9 }).parameter.helligkeit.mischgewicht;
    expect(g(120)).toBeCloseTo(0.0147, 4);
    expect(g(60)).toBeCloseTo(0.0696, 4);
    expect(g(240)).toBe(0);
  });
  it("Deep-Sky und Doppelstern haben kein Mischgewicht", () => {
    expect(auswerten(ad9Mit(DEEP_SKY_RING)).parameter.helligkeit.mischgewicht).toBe(0);
  });
});

describe("auswerten Version 2: Deep-Sky mit Quellbild (ADR-0004 Ebene b)", () => {
  const k = ad9Mit(DEEP_SKY_RING);
  const { parameter, anzeige } = auswerten(k);
  const o = optik(k.geraet);
  const a = atmosphaere(k.bedingungen);
  const iso = sichtbareIsophote(DEEP_SKY_RING.isophoten!, o, a, bortleMagProArcsec2(5));
  const ds = parameter.helligkeit.deepSky!;

  it("deepSky: a und s relativ zum Anzeigeweiss, q* aus schwelleMagProArcsec2, Breite 0,484, Sockel aus mischung.ts", () => {
    const ok = okularhelligkeit(o, a, 5, DEEP_SKY_RING);
    expect(ds.faktor).toBe(leuchtdichteRelativ(ok.objektMagProArcsec2));
    expect(ds.himmel).toBe(leuchtdichteRelativ(ok.hintergrundMagProArcsec2));
    expect(ds.schwelleRelativ).toBeCloseTo(10 ** (-0.4 * (iso.schwelleMagProArcsec2 - 16.5)), 12);
    expect(ds.breite).toBe(BLACKWELL_BREITE);
    expect(ds.sockel).toBe(sockel(ds.faktor, ds.himmel, ds.schwelleRelativ, SOCKEL_DELTA_KODES, KOMPRESSIONSEXPONENT));
    // Himmel der Flaechenebene und der Deep-Sky-Ebene stimmen ueberein: h = s^n.
    expect(parameter.helligkeit.hintergrundRelativ).toBeCloseTo(ds.himmel ** KOMPRESSIONSEXPONENT, 12);
  });
  it("an der Schwelle ist a q* / s der Schwellenkontrast am Boden: 10^(-0,4 (mu_Schwelle - mu_Himmel + Extinktion))", () => {
    const kontrast = 10 ** (-0.4 * (iso.schwelleMagProArcsec2 - bortleMagProArcsec2(5) + a.extinktionMag));
    expect((ds.faktor * ds.schwelleRelativ) / ds.himmel).toBeCloseTo(kontrast, 10);
  });
  it("Anzeigewerte.isophote aus sichtbareIsophote; Schluessel traegt die deepSky-Felder; Bortle aendert ihn", () => {
    expect(anzeige.isophote).toEqual({ magProArcsec2: iso.magProArcsec2, flaecheArcsec2: iso.flaecheArcsec2, alleSichtbar: iso.alleSichtbar });
    expect(parameter.helligkeit.schluessel).toContain("|deepSky|");
    const b8 = auswerten(ad9Mit(DEEP_SKY_RING, { bortle: 8 })).parameter;
    expect(b8.helligkeit.deepSky!.schwelleRelativ).toBeGreaterThan(ds.schwelleRelativ);
    expect(b8.helligkeit.schluessel).not.toBe(parameter.helligkeit.schluessel);
    expect(b8.quellbild.schluessel).toBe(parameter.quellbild.schluessel);
  });
  it("die Sterne des Objekts werden gemalt, die Objektmitte (8,8 mag) blendet den Zentralstern (15,8 mag) nicht", () => {
    const p = parameter.quellbild.punkte.punktquellen;
    expect(p.map((q) => q.name)).toEqual(["Zentralstern", "Nachbar"]);
    expect(p[0]!.sichtbar).toBe(true);
    expect(p[0]!.grund).toBeUndefined();
  });
  it("Deep-Sky ohne Quellbild (M45): kein deepSky, keine Isophote, nur Sterne", () => {
    const m45: Objektzustand = { ...DEEP_SKY_RING, kennung: "m45-test", quelle: undefined, isophoten: undefined };
    const r = auswerten(ad9Mit(m45));
    expect(r.parameter.helligkeit.deepSky).toBeUndefined();
    expect(r.anzeige.isophote).toBeUndefined();
    expect(r.parameter.quellbild.punkte.punktquellen).toHaveLength(2);
  });
});

describe("auswerten Version 2: Reihenfolge nach architektur.md 5.4", () => {
  it("die Aufloesung haengt nicht am Quellbild, der Arbeitsmassstab ohne Quelle nur an Anzeige und PSF", () => {
    const k = ad9Mit(freiesPaar(VORGABE_PAAR));
    const aufl = aufloesung(optik(k.geraet), atmosphaere(k.bedingungen));
    expect(auswerten(k).anzeige.aufloesung).toEqual(aufl);
  });
});

describe("physik/index.ts", () => {
  it("exportiert Stufe 0 bis 3 und die Testhelfer", () => {
    for (const name of ["rayleighArcsec", "luftmasse", "optik", "atmosphaere", "aufloesung", "helligkeit", "arbeitsmassstab", "kernbeschreibung", "begrenze", "baueKern", "auswerten", "kontrastUebertragung", "profilDelle", "kernFwhmArcsec", "punktquellen"]) {
      expect(typeof (physik as Record<string, unknown>)[name], name).toBe("function");
    }
  });
});
