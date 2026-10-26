// Tests der Falterwahl in Node. FalterWebgl2 selbst wird hier nie angelegt (kein WebGL2 in Node);
// seine Gleichheit zu FalterJs prueft der Browsertest (npm run test:browser, test/browser/).

import { describe, expect, it, vi } from "vitest";
import type { Kern } from "../naht/simulationsparameter";
import { FalterJs, type Falter } from "./falter";
import {
  ANZEIGEGRENZE_OHNE_WEBGL2_PX,
  FalterWebgl2,
  KontextVerloren,
  waehleFalter,
  ZuGrossFuerTextur,
  type Falterwahl
} from "./falter_webgl2";
import { BildFehler } from "./fehler";
import { neuesRaster, type Raster } from "./raster";
import { kastenKern } from "./testkerne";

function testRaster(): Raster {
  const raster = neuesRaster(7, 5);
  for (let i = 0; i < raster.daten.length; i++) raster.daten[i] = (i % 5) / 4;
  return raster;
}

/** Ersatz fuer FalterWebgl2: liefert ein erkennbares Raster oder wirft den vorgegebenen Fehler. */
class FalterAttrappe implements Falter {
  aufrufe = 0;
  fehler: Error | null = null;
  falte(raster: Raster, _kern: Kern): Raster {
    this.aufrufe++;
    if (this.fehler) throw this.fehler;
    return neuesRaster(raster.breite, raster.hoehe, raster.kanaele, 42);
  }
}

const js = new FalterJs();

describe("waehleFalter", () => {
  it("liefert in Node ohne Fehler JavaScript und meldet die Anzeigegrenze 1024 px", () => {
    const wahl = waehleFalter();
    expect(wahl.art).toBe("javascript");
    expect(wahl.grund).toBe("kein-webgl2");
    expect(wahl.anzeigeGrenzePx).toBe(ANZEIGEGRENZE_OHNE_WEBGL2_PX);
    expect(ANZEIGEGRENZE_OHNE_WEBGL2_PX).toBe(1024);
    const raster = testRaster();
    expect(Array.from(wahl.falte(raster, kastenKern(3)).daten)).toEqual(Array.from(js.falte(raster, kastenKern(3)).daten));
  });

  it("FalterWebgl2.erzeuge liefert in Node null statt zu werfen", () => {
    expect(FalterWebgl2.erzeuge()).toBeNull();
  });

  it("waehlt WebGL2, wenn verfuegbar, und rechnet damit ohne Anzeigegrenze", () => {
    const attrappe = new FalterAttrappe();
    const wahl = waehleFalter({ erzeugeWebgl2: () => attrappe });
    expect(wahl.art).toBe("webgl2");
    expect(wahl.grund).toBe("webgl2");
    expect(wahl.anzeigeGrenzePx).toBeNull();
    expect(wahl.falte(testRaster(), kastenKern(3)).daten[0]).toBe(42);
    expect(attrappe.aufrufe).toBe(1);
  });

  it("faellt JavaScript zurueck, wenn das Anlegen von WebGL2 null liefert oder wirft", () => {
    expect(waehleFalter({ erzeugeWebgl2: () => null }).art).toBe("javascript");
    const wahl = waehleFalter({
      erzeugeWebgl2: () => {
        throw new Error("kaputt");
      }
    });
    expect(wahl.art).toBe("javascript");
    expect(wahl.grund).toBe("kein-webgl2");
  });

  it("Kontextverlust: wechselt dauerhaft auf JavaScript, ohne Fehler, mit gleichem Ergebnis und einer Meldung", () => {
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const attrappe = new FalterAttrappe();
    const wechsel: Falterwahl[] = [];
    const wahl = waehleFalter({ erzeugeWebgl2: () => attrappe, beiWechsel: (w) => wechsel.push(w) });
    attrappe.fehler = new KontextVerloren();
    const raster = testRaster();
    const ergebnis = wahl.falte(raster, kastenKern(3));
    expect(Array.from(ergebnis.daten)).toEqual(Array.from(js.falte(raster, kastenKern(3)).daten));
    expect(wahl.art).toBe("javascript");
    expect(wahl.grund).toBe("kontextverlust");
    expect(wahl.anzeigeGrenzePx).toBe(1024);
    expect(wechsel).toEqual([wahl]);
    wahl.falte(raster, kastenKern(3));
    expect(attrappe.aufrufe).toBe(1);
    expect(wechsel.length).toBe(1);
    warnung.mockRestore();
  });

  it("anderer WebGL2-Fehler (Shader, Framebuffer): ebenfalls Wechsel auf JavaScript", () => {
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const attrappe = new FalterAttrappe();
    attrappe.fehler = new Error("WebGL2: Shader nicht uebersetzt");
    const wahl = waehleFalter({ erzeugeWebgl2: () => attrappe });
    expect(wahl.falte(testRaster(), kastenKern(3)).daten.length).toBe(35);
    expect(wahl.art).toBe("javascript");
    expect(wahl.grund).toBe("webgl2-fehler");
    warnung.mockRestore();
  });

  it("Raster zu gross fuer eine Textur: dieser Auftrag mit JavaScript, WebGL2 bleibt gewaehlt", () => {
    const attrappe = new FalterAttrappe();
    const wechsel: Falterwahl[] = [];
    const wahl = waehleFalter({ erzeugeWebgl2: () => attrappe, beiWechsel: (w) => wechsel.push(w) });
    attrappe.fehler = new ZuGrossFuerTextur(9000, 10, 8192);
    const raster = testRaster();
    expect(Array.from(wahl.falte(raster, kastenKern(3)).daten)).toEqual(Array.from(js.falte(raster, kastenKern(3)).daten));
    expect(wahl.art).toBe("webgl2");
    expect(wahl.grund).toBe("webgl2");
    expect(wechsel).toEqual([]);
    attrappe.fehler = null;
    expect(wahl.falte(raster, kastenKern(3)).daten[0]).toBe(42);
  });

  it("BildFehler (unstimmiges Raster oder Kern) wird weitergeworfen, WebGL2 bleibt gewaehlt", () => {
    const attrappe = new FalterAttrappe();
    attrappe.fehler = new BildFehler("Kerngroesse muss ungerade sein");
    const wahl = waehleFalter({ erzeugeWebgl2: () => attrappe });
    expect(() => wahl.falte(testRaster(), kastenKern(3))).toThrow(BildFehler);
    expect(wahl.art).toBe("webgl2");
  });
});
