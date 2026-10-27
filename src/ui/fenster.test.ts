import { describe, expect, it } from "vitest";
import { ANZEIGE_PX_MIN, ausschnittsanfrage, waehleAnzeigePx } from "./fenster";

describe("waehleAnzeigePx", () => {
  it("rechnet CSS-Pixel mit dem Pixelverhaeltnis um und rundet", () => {
    expect(waehleAnzeigePx(600, 1, 1024)).toBe(600);
    expect(waehleAnzeigePx(400.4, 1.5, 1024)).toBe(601);
  });

  it("begrenzt auf die Falter-Grenze und die Mindestgroesse", () => {
    expect(waehleAnzeigePx(720, 2, 1024)).toBe(1024);
    expect(waehleAnzeigePx(100, 1, 1024)).toBe(ANZEIGE_PX_MIN);
    expect(waehleAnzeigePx(0, 1, 1024)).toBe(ANZEIGE_PX_MIN);
  });

  it("faellt bei unbrauchbaren Messwerten auf sichere Werte zurueck", () => {
    expect(waehleAnzeigePx(NaN, 1, 1024)).toBe(1024);
    expect(waehleAnzeigePx(500, 0, 1024)).toBe(500);
    expect(waehleAnzeigePx(500, NaN, 1024)).toBe(500);
  });
});

describe("ausschnittsanfrage", () => {
  it("nimmt Mitte, rasterPx * Massstab und Massstab aus dem Quellbild", () => {
    const a = ausschnittsanfrage({
      schluessel: "q",
      massstabArcsecProPx: 1.5,
      rasterPx: 200,
      mitteXArcsec: 10,
      mitteYArcsec: -20,
      punktquellen: []
    });
    expect(a).toEqual({ mitte: { xArcsec: 10, yArcsec: -20 }, breiteArcsec: 300, massstabArcsecProPx: 1.5 });
  });
});
