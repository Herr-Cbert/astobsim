import { describe, expect, it } from "vitest";
import { begrenzeMitte, mitteNachTaste, mitteNachZiehen, TASTENSCHRITT, TASTENSCHRITT_GROSS, verschiebbar } from "./verschieben";

const kreis = (breiteArcsec: number) => ({ form: "kreis" as const, breiteArcsec, hoeheArcsec: breiteArcsec });

describe("verschiebbar", () => {
  it("nur wenn das Objekt groesser als das Gesichtsfeld ist", () => {
    expect(verschiebbar(1800, kreis(3000))).toBe(false);
    expect(verschiebbar(1800, kreis(1800))).toBe(false);
    expect(verschiebbar(1800, kreis(1200))).toBe(true);
  });
  it("beim Rechteck zaehlt die kuerzere Seite", () => {
    expect(verschiebbar(1000, { form: "rechteck", breiteArcsec: 2000, hoeheArcsec: 900 })).toBe(true);
  });
});

describe("begrenzeMitte", () => {
  it("laesst Mitten auf der Objektscheibe unveraendert", () => {
    expect(begrenzeMitte({ xArcsec: 300, yArcsec: -400 }, 1000)).toEqual({ xArcsec: 300, yArcsec: -400 });
  });
  it("schneidet radial auf den Objektradius, Richtung bleibt", () => {
    const m = begrenzeMitte({ xArcsec: 3000, yArcsec: 4000 }, 1000);
    expect(Math.hypot(m.xArcsec, m.yArcsec)).toBeCloseTo(500, 9);
    expect(m.xArcsec / m.yArcsec).toBeCloseTo(0.75, 9);
  });
  it("nicht endliche Werte werden 0/0", () => {
    expect(begrenzeMitte({ xArcsec: Number.NaN, yArcsec: 1 }, 1000)).toEqual({ xArcsec: 0, yArcsec: 0 });
  });
});

describe("mitteNachZiehen", () => {
  it("der Inhalt folgt der Maus: rechts ziehen -> Mitte nach -x, nach unten ziehen -> Mitte nach Norden", () => {
    const m = mitteNachZiehen({ xArcsec: 0, yArcsec: 0 }, 10, 20, 2, 10000);
    expect(m).toEqual({ xArcsec: -20, yArcsec: 40 });
  });
  it("begrenzt vom Start aus: zurueckziehen findet die Stelle wieder", () => {
    const start = { xArcsec: 100, yArcsec: 0 };
    expect(mitteNachZiehen(start, -1000, 0, 1, 400)).toEqual({ xArcsec: 200, yArcsec: 0 });
    expect(mitteNachZiehen(start, 0, 0, 1, 400)).toEqual(start);
  });
});

describe("mitteNachTaste", () => {
  const breite = 1000;
  it("Pfeile bewegen den Blick in Pfeilrichtung, Norden oben", () => {
    const s = breite * TASTENSCHRITT;
    expect(mitteNachTaste({ xArcsec: 0, yArcsec: 0 }, "ArrowRight", false, breite, 5000)).toEqual({ xArcsec: s, yArcsec: 0 });
    expect(mitteNachTaste({ xArcsec: 0, yArcsec: 0 }, "ArrowLeft", false, breite, 5000)).toEqual({ xArcsec: -s, yArcsec: 0 });
    expect(mitteNachTaste({ xArcsec: 0, yArcsec: 0 }, "ArrowUp", false, breite, 5000)).toEqual({ xArcsec: 0, yArcsec: s });
    expect(mitteNachTaste({ xArcsec: 0, yArcsec: 0 }, "ArrowDown", true, breite, 5000)).toEqual({ xArcsec: 0, yArcsec: -breite * TASTENSCHRITT_GROSS });
  });
  it("Pos1 zentriert, andere Tasten bleiben unbehandelt", () => {
    expect(mitteNachTaste({ xArcsec: 50, yArcsec: 50 }, "Home", false, breite, 5000)).toEqual({ xArcsec: 0, yArcsec: 0 });
    expect(mitteNachTaste({ xArcsec: 50, yArcsec: 50 }, "a", false, breite, 5000)).toBeUndefined();
  });
  it("haelt die Grenze ein", () => {
    const m = mitteNachTaste({ xArcsec: 490, yArcsec: 0 }, "ArrowRight", true, breite, 1000);
    expect(m).toEqual({ xArcsec: 500, yArcsec: 0 });
  });
});
