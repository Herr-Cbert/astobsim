import { describe, expect, it } from "vitest";
import { arbeitsmassstab, arbeitsmassstabOhneFenster, kernbeschreibung, kernSchluessel } from "./arbeitsmassstab";
import { atmosphaere } from "./atmosphaere";
import { aufloesung } from "./aufloesung";
import { PhysikFehler } from "./fehler";
import type { Bedingungen } from "../naht/konfiguration";
import { optik } from "./optik";
import { BEDINGUNGEN_A_D9 as KLAR_45, fenster, JUPITER_QUELLE, KONFIGURATION_A_D9, MOND_QUELLE, refraktorMitVergroesserung } from "./testdaten";

function stufe1(oeffnungMm: number, vergroesserung: number, bedingungen: Bedingungen) {
  const o = optik(refraktorMitVergroesserung(oeffnungMm, vergroesserung));
  const a = atmosphaere(bedingungen);
  return { o, a, aufl: aufloesung(o, a) };
}

describe("arbeitsmassstab (ADR-0002)", () => {
  it("ohne Fenster: max(Quelle, Gesamt-FWHM / 2,5), mit beliebig feinem Fenster gleich arbeitsmassstab", () => {
    const { aufl } = stufe1(80, 60, KLAR_45);
    expect(arbeitsmassstabOhneFenster(aufl, JUPITER_QUELLE)).toBeCloseTo(aufl.gesamtFwhmArcsec / 2.5, 12);
    expect(arbeitsmassstabOhneFenster(aufl, { ...JUPITER_QUELLE, massstabArcsecProPx: 5 })).toBe(5);
    expect(arbeitsmassstab(aufl, JUPITER_QUELLE, fenster(1, 1024))).toBe(arbeitsmassstabOhneFenster(aufl, JUPITER_QUELLE));
  });
  it("Anzeige gewinnt: Mond 3000'' auf 1024 px ist 2,93''/px, groeber als FWHM/2,5 und Quelle", () => {
    const { aufl } = stufe1(80, 60, KLAR_45);
    expect(arbeitsmassstab(aufl, MOND_QUELLE, fenster(3000, 1024))).toBeCloseTo(3000 / 1024, 12);
  });
  it("PSF gewinnt: Jupiter-Zoom 66'' auf 768 px, 80 mm bei 60-fach: Gesamt-FWHM / 2,5", () => {
    const { aufl } = stufe1(80, 60, KLAR_45);
    const m = arbeitsmassstab(aufl, JUPITER_QUELLE, fenster(66, 768));
    expect(m).toBeCloseTo(aufl.gesamtFwhmArcsec / 2.5, 12);
    expect(m).toBeGreaterThan(66 / 768);
    expect(m).toBeGreaterThan(JUPITER_QUELLE.massstabArcsecProPx);
  });
  it("Quelle gewinnt: Mond-Zoom 100'' auf 2048 px, 300 mm bei 600-fach und 0,5'' Seeing", () => {
    const { aufl } = stufe1(300, 600, { ...KLAR_45, seeingFwhmArcsec: 0.5, hoeheGrad: 90 });
    const m = arbeitsmassstab(aufl, MOND_QUELLE, fenster(100, 2048));
    expect(m).toBe(MOND_QUELLE.massstabArcsecProPx);
    expect(aufl.gesamtFwhmArcsec / 2.5).toBeLessThan(m);
  });
  it("Invariante: die Gesamt-FWHM ist nie breiter als 2,5 Arbeitspixel", () => {
    const fensterListe = [fenster(3000, 1024), fenster(66, 768), fenster(20, 2048), fenster(18000, 256)];
    for (const oeffnungMm of [6, 60, 150, 300]) {
      for (const vergroesserung of [1, 20, 150, 600]) {
        for (const seeingFwhmArcsec of [0.5, 2, 5]) {
          for (const hoeheGrad of [10, 90]) {
            const { aufl } = stufe1(oeffnungMm, vergroesserung, { ...KLAR_45, seeingFwhmArcsec, hoeheGrad });
            for (const f of fensterListe) {
              for (const quelle of [MOND_QUELLE, JUPITER_QUELLE]) {
                const m = arbeitsmassstab(aufl, quelle, f);
                expect(aufl.gesamtFwhmArcsec / m).toBeLessThanOrEqual(2.5 + 1e-12);
                expect(m).toBeGreaterThanOrEqual(quelle.massstabArcsecProPx);
                expect(m).toBeGreaterThanOrEqual(f.breiteArcsec / f.px);
              }
            }
          }
        }
      }
    }
  });
  it("wirft PhysikFehler bei Fenster unter 16 px oder Breite 0", () => {
    const { aufl } = stufe1(80, 60, KLAR_45);
    expect(() => arbeitsmassstab(aufl, MOND_QUELLE, fenster(3000, 8))).toThrow(PhysikFehler);
    expect(() => arbeitsmassstab(aufl, MOND_QUELLE, fenster(0, 1024))).toThrow(PhysikFehler);
  });
});

describe("kernbeschreibung und Schluessel", () => {
  it("rundet alle fuenf Felder auf 4 signifikante Stellen", () => {
    const { o, a, aufl } = stufe1(80.00001, 56, KLAR_45);
    const b = kernbeschreibung(o, a, aufl, 2.9296875);
    expect(b.oeffnungMm).toBe(80);
    expect(b.obstruktion).toBe(0);
    expect(b.seeingFwhmArcsec).toBe(Number(a.seeingFwhmArcsec.toPrecision(4)));
    expect(b.augeFwhmArcsec).toBe(1.071);
    expect(b.massstabArcsecProPx).toBe(2.93);
  });
  it("Schluessel gleich genau dann, wenn die gerundeten Felder gleich sind", () => {
    const s = stufe1(80, 56, KLAR_45);
    const t = stufe1(80.00001, 56.0001, KLAR_45);
    const u = stufe1(80.01, 56, KLAR_45);
    const b = kernbeschreibung(s.o, s.a, s.aufl, 2.93);
    expect(kernSchluessel(kernbeschreibung(t.o, t.a, t.aufl, 2.930001))).toBe(kernSchluessel(b));
    expect(kernSchluessel(kernbeschreibung(u.o, u.a, u.aufl, 2.93))).not.toBe(kernSchluessel(b));
    expect(kernSchluessel(kernbeschreibung(s.o, s.a, s.aufl, 2.94))).not.toBe(kernSchluessel(b));
  });
});

describe("Startkonfiguration A-D9 durch Stufe 1", () => {
  it("80/600 mit 10 mm 50 Grad, Seeing 2'', Bortle 5, klar, 45 Grad: 60-fach, AP 1,33 mm, Anzeige bestimmt den Massstab", () => {
    const k = KONFIGURATION_A_D9;
    const o = optik(k.geraet);
    const a = atmosphaere(k.bedingungen);
    const aufl = aufloesung(o, a);
    expect(o.vergroesserung).toBe(60);
    expect(o.austrittspupilleMm).toBeCloseTo(1.3333, 4);
    expect(o.gesichtsfeld.breiteArcsec).toBe(3000);
    expect(aufl.dominant).toBe("seeing");
    expect(aufl.gesamtFwhmArcsec).toBeGreaterThan(2.5);
    expect(aufl.gesamtFwhmArcsec).toBeLessThan(3.2);
    const f = fenster(o.gesichtsfeld.breiteArcsec, 1024);
    expect(arbeitsmassstab(aufl, k.objekt.quelle!, f)).toBeCloseTo(3000 / 1024, 12);
  });
});
