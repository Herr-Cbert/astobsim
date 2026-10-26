// Startkonfiguration A-D9 aus den echten Daten und der Durchstich ohne Browser: begrenze ->
// auswerten -> rendere mit einer synthetischen Quelle. Prueft die Verdrahtung der UI, nicht
// Physik oder Bildpipeline (die haben eigene Tests).
import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, type Objektpunkt, type Quellausschnitt, type Quelle, QuelleAusRaster, rendere, type Zwischenspeicher } from "../bild";
import { pruefeBildnachweise, pruefeGeraete, pruefeObjekte } from "../daten";
import { auswerten, begrenze } from "../physik";
import { ausschnittsanfrage, type Ausschnittsanfrage } from "./fenster";
import { infozeilen } from "./infopanel";
import { startkonfiguration } from "./startkonfiguration";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
const geraete = pruefeGeraete(geraeteJson);

/** Quelle, die die Anfragen von rendere mitschreibt. */
class MitschreibendeQuelle implements Quelle {
  readonly anfragen: Ausschnittsanfrage[] = [];
  constructor(private readonly innen: Quelle) {}
  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Quellausschnitt {
    this.anfragen.push({ mitte: { ...mitte }, breiteArcsec, massstabArcsecProPx });
    return this.innen.ausschnitt(mitte, breiteArcsec, massstabArcsecProPx);
  }
}

describe("startkonfiguration", () => {
  it("entspricht A-D9", () => {
    const { konfiguration, nachweis } = startkonfiguration(geraete, objekte, nachweise);
    expect(konfiguration.geraet).toEqual({
      art: "fernrohr",
      oeffnungMm: 80,
      brennweiteMm: 600,
      obstruktion: 0,
      bauart: "refraktor",
      okular: { brennweiteMm: 10, scheinbaresGesichtsfeldGrad: 50 }
    });
    expect(konfiguration.objekt.kennung).toBe("mond_ev");
    expect(konfiguration.bedingungen).toEqual({ seeingFwhmArcsec: 2, bortle: 5, transparenz: "klar", hoeheGrad: 45 });
    expect(nachweis.id).toBe("mond_svs5587_6285");
    // Liegt in allen Grenzen: begrenze aendert nichts.
    expect(begrenze(konfiguration).hinweise).toEqual([]);
  });

  it("meldet fehlende Eintraege als Fehler", () => {
    expect(() => startkonfiguration([], objekte, nachweise)).toThrow(/refraktor-80-600-ed/);
    expect(() => startkonfiguration(geraete, [], nachweise)).toThrow(/mond_ev/);
  });
});

describe("Durchstich ohne Browser", () => {
  const { konfiguration } = startkonfiguration(geraete, objekte, nachweise);
  const auswertung = auswerten(begrenze(konfiguration).konfiguration, { anzeigePx: 512 });

  it("zeigt die Kennwerte A-D4 mit Beschriftung und Einheit", () => {
    const zeilen = infozeilen(auswertung.anzeige);
    expect(zeilen.map((z) => z.wert)).toEqual([
      "60×",
      "0,83° (50′)",
      "1,3 mm",
      expect.stringMatching(/^1,7\d″$/),
      expect.stringMatching(/^1,4\d″$/),
      expect.stringMatching(/^2,\d\d″$/),
      "1,00″",
      "Seeing"
    ]);
    expect(zeilen.every((z) => z.beschriftung.length > 0)).toBe(true);
  });

  it("rendere fragt die Quelle genau mit ausschnittsanfrage an", () => {
    const { parameter } = auswertung;
    const quelle = new MitschreibendeQuelle(new QuelleAusRaster(neuesRaster(64, 64, 3, 0.5), konfiguration.objekt.quelle.massstabArcsecProPx * 32));
    const zwischen: Zwischenspeicher = {};
    const anblick = rendere(parameter, quelle, new FalterJs(), zwischen);
    expect(quelle.anfragen).toEqual([ausschnittsanfrage(parameter.quellbild)]);
    expect(anblick.raster.breite).toBe(512);
    expect(anblick.raster.kanaele).toBe(3);
    // Zweiter Aufruf mit demselben Zwischenspeicher fragt die Quelle nicht erneut an.
    rendere(parameter, quelle, new FalterJs(), zwischen);
    expect(quelle.anfragen).toHaveLength(1);
  });
});
