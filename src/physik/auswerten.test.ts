import { describe, expect, it } from "vitest";
import type { Fernglas, Konfiguration } from "../naht/konfiguration";
import { auswerten } from "./auswerten";
import { PhysikFehler } from "./fehler";
import * as physik from "./index";
import { BEDINGUNGEN_A_D9, fenster, KONFIGURATION_A_D9, REFRAKTOR_A_D9, refraktorMitVergroesserung, SATURN_20 } from "./testdaten";

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
  it("Simulationsparameter: Mond, Kreismaske 3000'', Punktquellen leer, Kernmassstab gleich Arbeitsmassstab", () => {
    expect(parameter.quellbild.objekt).toBe("mond-q1");
    expect(parameter.quellbild.punktquellen).toEqual([]);
    expect(parameter.gesichtsfeld).toEqual({ form: "kreis", breiteArcsec: 3000, hoeheArcsec: 3000 });
    expect(parameter.kern.massstabArcsecProPx).toBe(parameter.quellbild.massstabArcsecProPx);
    expect(parameter.helligkeit.faktorObjekt).toBeGreaterThan(0);
    expect(parameter.helligkeit.faktorObjekt).toBeLessThanOrEqual(1);
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
        expect(quellbild.massstabArcsecProPx).toBeGreaterThanOrEqual(k.objekt.quelle.massstabArcsecProPx);
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
    const p = auswerten(saturn(60), { fenster: f }).parameter.quellbild.punktquellen;
    expect(p.map((q) => q.name)).toEqual(["Titan", "Rhea"]);
    expect(p.every((q) => q.sichtbar)).toBe(true);
  });
  it("andere Sichtbarkeit bei gleichem Fenster gibt einen anderen Quellbild-Schluessel", () => {
    const a = auswerten(saturn(8), { fenster: f }).parameter.quellbild;
    const b = auswerten(saturn(10), { fenster: f }).parameter.quellbild;
    expect(a.massstabArcsecProPx).toBe(b.massstabArcsecProPx);
    expect(a.punktquellen.map((q) => q.sichtbar)).toEqual([true, false]);
    expect(b.punktquellen.map((q) => q.sichtbar)).toEqual([true, true]);
    expect(b.schluessel).not.toBe(a.schluessel);
  });
  it("andere Sichtbarkeit eines Trabanten ausserhalb des Fensters aendert den Schluessel nicht", () => {
    // Fenster 160'' um Titan (150, -44,4): Rhea bei (-60, 20,7) liegt weit draussen.
    const umTitan = { breiteArcsec: 160, mitteXArcsec: 150, mitteYArcsec: -44.4, px: 16 };
    const a = auswerten(saturn(8), { fenster: umTitan }).parameter.quellbild;
    const b = auswerten(saturn(10), { fenster: umTitan }).parameter.quellbild;
    expect(a.punktquellen[1]!.sichtbar).not.toBe(b.punktquellen[1]!.sichtbar);
    expect(b.schluessel).toBe(a.schluessel);
  });
  it("gleiche Sichtbarkeit bei gleichem Fenster gibt denselben Quellbild-Schluessel", () => {
    expect(auswerten(saturn(10), { fenster: f }).parameter.quellbild.schluessel).toBe(auswerten(saturn(12), { fenster: f }).parameter.quellbild.schluessel);
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
      [mitBedingungen({ bortle: 0 }), {}, "bortle"]
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

describe("physik/index.ts", () => {
  it("exportiert Stufe 0 bis 3 und die Testhelfer", () => {
    for (const name of ["rayleighArcsec", "luftmasse", "optik", "atmosphaere", "aufloesung", "helligkeit", "arbeitsmassstab", "kernbeschreibung", "begrenze", "baueKern", "auswerten", "kontrastUebertragung", "kernFwhmArcsec", "punktquellen"]) {
      expect(typeof (physik as Record<string, unknown>)[name], name).toBe("function");
    }
  });
});
