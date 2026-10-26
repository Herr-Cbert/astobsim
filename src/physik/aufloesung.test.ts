import { describe, expect, it } from "vitest";
import { atmosphaere } from "./atmosphaere";
import { aufloesung } from "./aufloesung";
import { optik } from "./optik";
import { quadratur } from "./profile";
import { refraktorMitVergroesserung, zenit } from "./testdaten";

function refraktor(oeffnungMm: number, vergroesserung: number) {
  return optik(refraktorMitVergroesserung(oeffnungMm, vergroesserung));
}

// Testwerte aus docs/recherche/physik.md, Abschnitte 3.2, 8 und 9.
describe("aufloesung", () => {
  it("80 mm bei 56-fach und 2'' Seeing: Beugung 1,46'', Auge 1,071'', Seeing dominant, Gesamt als Quadratur", () => {
    const a = atmosphaere(zenit(2));
    const r = aufloesung(refraktor(80, 56), a);
    expect(r.beugungFwhmArcsec).toBeCloseTo(1.4592, 4);
    expect(r.augeFwhmArcsec).toBeCloseTo(60 / 56, 4);
    expect(r.seeingFwhmArcsec).toBe(a.seeingFwhmArcsec);
    expect(r.gesamtFwhmArcsec).toBeCloseTo(quadratur(r.beugungFwhmArcsec, r.seeingFwhmArcsec, r.augeFwhmArcsec), 12);
    expect(r.dominant).toBe("seeing");
  });
  it("Rayleigh und Dawes fuer 100 mm sind 1,384'' und 1,158''", () => {
    const r = aufloesung(refraktor(100, 100), atmosphaere(zenit(2)));
    expect(r.rayleighArcsec).toBeCloseTo(1.384, 3);
    expect(r.dawesArcsec).toBeCloseTo(1.158, 3);
  });
  it("60 mm bei 10-fach: das Auge mit 6'' dominiert", () => {
    const r = aufloesung(refraktor(60, 10), atmosphaere(zenit(2)));
    expect(r.augeFwhmArcsec).toBe(6);
    expect(r.dominant).toBe("auge");
  });
  it("60 mm bei 120-fach und 0,5'' Seeing: die Beugung mit 1,95'' dominiert", () => {
    const r = aufloesung(refraktor(60, 120), atmosphaere(zenit(0.5)));
    expect(r.beugungFwhmArcsec).toBeCloseTo(1.9456, 4);
    expect(r.augeFwhmArcsec).toBe(0.5);
    expect(r.dominant).toBe("beugung");
  });
  it("Seeing in 30 Grad Hoehe ist um 1,513 schlechter als im Zenit", () => {
    const o = refraktor(80, 56);
    const zenitSeeing = aufloesung(o, atmosphaere(zenit(2))).seeingFwhmArcsec;
    const tiefSeeing = aufloesung(o, atmosphaere({ ...zenit(2), hoeheGrad: 30 })).seeingFwhmArcsec;
    expect(tiefSeeing / zenitSeeing).toBeCloseTo(1.513 / Math.pow(0.9997, 0.6), 3);
  });
});
