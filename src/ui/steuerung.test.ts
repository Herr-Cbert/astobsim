import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, QuelleAusRaster } from "../bild";
import { objektzustand, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import type { Konfiguration, Objektzustand } from "../naht/konfiguration";
import { freiesPaar, GRENZEN } from "../physik";
import { PARAMETER, voreinstellung, type Kataloge } from "../zustand";
import type { Ausschnittsanfrage } from "./fenster";
import { type Bildquelle, type Stand, Steuerung, type Umgebung } from "./steuerung";
import { detailbreiteArcsec, zoombreiteArcsec } from "./zoom";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };

/** Kleine Anzeige, damit eine Rechnung mit FalterJs schnell bleibt. */
const ANZEIGE_PX = 64;

/** Gleichmaessig graue Scheibe als Quelle, gross genug fuer das ganze Objekt. */
function testquelle(objekt: Objektzustand): QuelleAusRaster {
  return new QuelleAusRaster(neuesRaster(64, 64, 3, 0.5), objekt.durchmesserArcsec / 48);
}

/** Testumgebung: Frames von Hand, URL und Aufrufe protokolliert, lade optional angehalten. */
class Testumgebung implements Umgebung {
  readonly kataloge = KATALOGE;
  readonly falter = new FalterJs();
  readonly urls: string[] = [];
  readonly bildquellen: string[] = [];
  readonly anfragen: Ausschnittsanfrage[] = [];
  private frames: (() => void)[] = [];
  private zeit = 0;
  /** Ist sie gesetzt, wartet lade, bis gebe() aufgerufen wird. */
  halteLade = false;
  private wartende: (() => void)[] = [];
  /** Ist sie gesetzt, scheitert die naechste Bildquelle. */
  scheitere: Error | undefined;
  /** Ist sie gesetzt, wartet warte wie im Browser auf den naechsten Frame. */
  warteAufFrame = false;
  /** Ist sie gesetzt, scheitert warte. */
  warteFehler: Error | undefined;

  async bildquelle(objekt: Objektzustand): Promise<Bildquelle> {
    this.bildquellen.push(objekt.kennung);
    const fehler = this.scheitere;
    this.scheitere = undefined;
    if (fehler !== undefined) throw fehler;
    return {
      quelle: testquelle(objekt),
      lade: (a) => {
        this.anfragen.push(a);
        return this.halteLade ? new Promise((weiter) => this.wartende.push(weiter)) : Promise.resolve();
      }
    };
  }
  plane(f: () => void): void {
    this.frames.push(f);
  }
  warte(): Promise<void> {
    if (this.warteFehler !== undefined) return Promise.reject(this.warteFehler);
    if (!this.warteAufFrame) return Promise.resolve();
    return new Promise((weiter) => this.frames.push(weiter));
  }
  schreibeUrl(suche: string): void {
    this.urls.push(suche);
  }
  /** Ansicht je Aufruf von anzeigePx (true: Zoom). */
  readonly anzeigen: boolean[] = [];
  anzeigePx(zoom: boolean): number {
    this.anzeigen.push(zoom);
    return ANZEIGE_PX;
  }
  uhr(): number {
    return (this.zeit += 5);
  }

  get geplanteFrames(): number {
    return this.frames.length;
  }

  /** Fuehrt die geplanten Frames aus und laesst alle Promises durchlaufen. */
  async frame(): Promise<void> {
    const f = this.frames;
    this.frames = [];
    for (const g of f) g();
    await ruhe();
  }

  /** Gibt angehaltene lade-Aufrufe frei. */
  async gebe(): Promise<void> {
    const w = this.wartende;
    this.wartende = [];
    for (const g of w) g();
    await ruhe();
  }
}

/** Ein Makrotask: alle Mikrotasks (Promises der Steuerung) sind danach abgearbeitet. */
function ruhe(): Promise<void> {
  return new Promise((weiter) => setTimeout(weiter, 0));
}

function mitSeeing(k: Konfiguration, seeingFwhmArcsec: number): Konfiguration {
  return { ...k, bedingungen: { ...k.bedingungen, seeingFwhmArcsec } };
}

function mitZustand(k: Konfiguration, id: string): Konfiguration {
  const objekt = objektzustand(KATALOGE.objekte, KATALOGE.nachweise, id);
  if (objekt === undefined) throw new Error(`Testdaten: Zustand ${id} fehlt`);
  return { ...k, objekt };
}

function neu(): { u: Testumgebung; s: Steuerung; staende: Readonly<Stand>[] } {
  const u = new Testumgebung();
  const s = new Steuerung(u, voreinstellung(KATALOGE));
  const staende: Readonly<Stand>[] = [];
  s.beobachte((stand) => staende.push(stand));
  return { u, s, staende };
}

describe("Steuerung", () => {
  it("plant beim Start einen Frame, schreibt darin die URL und rechnet den ersten Anblick", async () => {
    const { u, s, staende } = neu();
    expect(u.urls).toHaveLength(0);
    expect(u.geplanteFrames).toBe(1);
    expect(staende[0]!.phase).toBe("laedt");

    await u.frame();
    expect(u.urls).toHaveLength(1);
    expect(u.urls[0]).toContain(`${PARAMETER.zustand}=mond_ev`);
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(1);
    expect(s.stand.anblick?.raster.breite).toBe(ANZEIGE_PX);
    expect(s.stand.ms).toBe(5);
    expect(staende.map((x) => x.phase)).toEqual(["laedt", "rechnet", "laedt", "rechnet", "fertig"]);
  });

  it("fasst mehrere Aenderungen vor dem Frame zu einer Rechnung zusammen", async () => {
    const { u, s } = neu();
    s.aendere(mitSeeing(s.konfiguration, 1));
    s.aendere(mitSeeing(s.konfiguration, 3));
    expect(u.geplanteFrames).toBe(1);
    await u.frame();
    expect(u.anfragen).toHaveLength(1);
    expect(s.stand.nummer).toBe(1);
    expect(s.stand.auswertung?.parameter.kern.beschreibung.seeingFwhmArcsec).toBeGreaterThan(0);
    expect(s.konfiguration.bedingungen.seeingFwhmArcsec).toBe(3);
  });

  it("verwirft eine Rechnung, die waehrend des Ladens ueberholt wird, und rechnet die neue", async () => {
    const { u, s } = neu();
    u.halteLade = true;
    await u.frame();
    expect(s.stand.phase).toBe("laedt");

    s.aendere(mitSeeing(s.konfiguration, 4));
    await u.frame();
    await u.gebe();
    // Erste Rechnung verworfen, ohne auf ihr Laden zu warten; nur die zweite wird ein Anblick.
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(1);
    expect(u.anfragen).toHaveLength(2);
    expect(s.stand.auswertung?.anzeige.aufloesung.seeingFwhmArcsec).toBeGreaterThan(3);
  });

  it("begrenzt Eingaben, liefert die Hinweise und schreibt die begrenzte URL", async () => {
    const { u, s } = neu();
    const hinweise = s.aendere(mitSeeing(s.konfiguration, 99));
    expect(hinweise).toEqual([{ feld: GRENZEN.seeingFwhmArcsec.feld, eingabe: 99, wert: 5 }]);
    expect(s.konfiguration.bedingungen.seeingFwhmArcsec).toBe(5);
    await u.frame();
    expect(u.urls.at(-1)).toContain(`${PARAMETER.seeing}=5`);
  });

  it("behaelt die Bildquelle je Zustand und baut sie beim Objektwechsel neu", async () => {
    const { u, s } = neu();
    await u.frame();
    s.aendere(mitSeeing(s.konfiguration, 1));
    await u.frame();
    expect(u.bildquellen).toEqual(["mond_ev"]);

    s.aendere(mitZustand(s.konfiguration, "mars_14"));
    await u.frame();
    expect(u.bildquellen).toEqual(["mond_ev", "mars_14"]);
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(3);
  });

  it("meldet einen Bildfehler im Stand, behaelt den alten Anblick und versucht es beim naechsten Mal neu", async () => {
    const { u, s } = neu();
    await u.frame();
    const alt = s.stand.anblick;

    u.scheitere = new Error("Netz weg");
    s.aendere(mitZustand(s.konfiguration, "mars_6"));
    await u.frame();
    expect(s.stand.phase).toBe("fehler");
    expect(s.stand.fehler?.art).toBe("bild");
    expect(s.stand.anblick).toBe(alt);

    s.aendere(mitSeeing(s.konfiguration, 1));
    await u.frame();
    expect(u.bildquellen).toEqual(["mond_ev", "mars_6", "mars_6"]);
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.fehler).toBeUndefined();
  });

  it("laesst sich von einem fehlerhaften Beobachter nicht aufhalten", async () => {
    const { u, s, staende } = neu();
    const fehler = console.error;
    console.error = () => {};
    try {
      s.beobachte(() => {
        throw new Error("Beobachter kaputt");
      });
      await u.frame();
    } finally {
      console.error = fehler;
    }
    expect(s.stand.phase).toBe("fertig");
    expect(staende.at(-1)?.phase).toBe("fertig");
  });

  it("meldet sofort den aktuellen Stand und laesst sich abmelden", async () => {
    const { u, s } = neu();
    const gesehen: string[] = [];
    const ab = s.beobachte((stand) => gesehen.push(stand.phase));
    expect(gesehen).toEqual(["laedt"]);
    ab();
    await u.frame();
    expect(gesehen).toEqual(["laedt"]);
  });

  it("liefert beim Dauerziehen in jedem Frame einen Anblick, auch wenn warte auf den Frame wartet", async () => {
    const { u, s } = neu();
    u.warteAufFrame = true;
    await u.frame();
    await u.frame();
    expect(s.stand.nummer).toBe(1);
    // Wie im Browser: das input-Event eines Frames kommt vor dessen requestAnimationFrame.
    for (let i = 1; i <= 10; i++) {
      s.aendere(mitSeeing(s.konfiguration, 1 + i / 10));
      await u.frame();
    }
    // Ein Frame Verzoegerung: ab dem zweiten Zug kommt in jedem Frame ein Anblick.
    expect(s.stand.nummer).toBe(10);
    await u.frame();
    expect(s.stand.nummer).toBe(11);
    expect(s.stand.auswertung?.parameter.kern.beschreibung.seeingFwhmArcsec).toBeGreaterThan(2);
  });

  it("schreibt die URL hoechstens einmal pro Frame", async () => {
    const { u, s } = neu();
    await u.frame();
    for (let i = 1; i <= 5; i++) s.aendere(mitSeeing(s.konfiguration, i));
    await u.frame();
    expect(u.urls).toHaveLength(2);
    expect(u.urls[1]).toContain(`${PARAMETER.seeing}=5`);
  });

  it("ignoriert eine Aenderung, die der aktuellen Konfiguration gleicht", async () => {
    const { u, s } = neu();
    await u.frame();
    s.aendere({ ...s.konfiguration });
    expect(u.geplanteFrames).toBe(0);
  });

  it("verschiebt die Fenstermitte ohne URL und setzt sie beim Objektwechsel zurueck", async () => {
    const { u, s } = neu();
    await u.frame();
    s.verschiebe(300, -120);
    await u.frame();
    expect(u.urls).toHaveLength(1);
    expect(s.stand.mitte).toEqual({ xArcsec: 300, yArcsec: -120 });
    expect(s.stand.auswertung?.parameter.fenster).toMatchObject({ mitteXArcsec: 300, mitteYArcsec: -120 });
    expect(s.stand.nummer).toBe(2);

    s.aendere(mitSeeing(s.konfiguration, 1));
    expect(s.stand.mitte).toEqual({ xArcsec: 300, yArcsec: -120 });
    s.aendere(mitZustand(s.konfiguration, "mars_14"));
    expect(s.stand.mitte).toEqual({ xArcsec: 0, yArcsec: 0 });
  });

  it("rechnet auf Anforderung neu, ohne die URL zu schreiben", async () => {
    const { u, s } = neu();
    await u.frame();
    s.rechneNeu();
    await u.frame();
    expect(s.stand.nummer).toBe(2);
    expect(u.urls).toHaveLength(1);
  });

  it("wartet bei einem Objektwechsel nicht auf ein haengendes Laden", async () => {
    const { u, s } = neu();
    u.halteLade = true;
    await u.frame();
    expect(s.stand.phase).toBe("laedt");
    u.halteLade = false;
    s.aendere(mitZustand(s.konfiguration, "mars_14"));
    await u.frame();
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(1);
    expect(s.konfiguration.objekt.kennung).toBe("mars_14");
  });

  it("meldet einen Fehler der Umgebung im Stand statt zu werfen", async () => {
    const { u, s } = neu();
    u.warteFehler = new Error("kein Frame");
    await u.frame();
    expect(s.stand.phase).toBe("fehler");
    expect(s.stand.fehler?.art).toBe("rechnen");
  });
});

describe("Steuerung, Zoomansicht (A-D3)", () => {
  it("rechnet im Zoom Anblick und Vergleichsbild im Zoomfenster, ohne URL und ohne die Uebersicht zu ersetzen", async () => {
    const { u, s } = neu();
    await u.frame();
    const uebersicht = s.stand.anblick;
    s.zoome(true);
    expect(s.stand.zoom).toBe(true);
    await u.frame();
    expect(u.urls).toHaveLength(1);
    expect(u.anzeigen).toEqual([false, true]);
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(2);
    expect(s.stand.anblick).toBe(uebersicht);
    const zb = s.stand.zoombilder;
    expect(zb).toBeDefined();
    const breite = zoombreiteArcsec(s.konfiguration);
    expect(s.stand.auswertung?.parameter.fenster).toEqual({ breiteArcsec: breite, mitteXArcsec: 0, mitteYArcsec: 0, px: ANZEIGE_PX });
    expect(zb?.anblick.fenster).toEqual(zb?.vergleich.fenster);
    expect(zb?.vergleich.raster.breite).toBe(ANZEIGE_PX);
    // Testquelle: gleichmaessig 0,5 in Quellweiss; das Vergleichsbild zeigt das unveraendert.
    const mitte = (ANZEIGE_PX / 2) * ANZEIGE_PX + ANZEIGE_PX / 2;
    expect(zb?.vergleich.raster.daten[mitte * 3]).toBeCloseTo(0.5, 5);
    // Zwei Anfragen an die Quelle: Arbeitsraster des Anblicks und das feinere des Vergleichsbilds.
    expect(u.anfragen.slice(1).map((a) => a.breiteArcsec)).toEqual([breite, breite].map((b) => expect.closeTo(b, 6)));
    // Bei 64 Anzeigepixeln begrenzt die Anzeige beide Raster gleich; feiner wird es in zoom.test.ts.
    expect(u.anfragen[2]!.massstabArcsecProPx).toBeLessThanOrEqual(u.anfragen[1]!.massstabArcsecProPx);

    s.zoome(false);
    await u.frame();
    expect(s.stand.zoom).toBe(false);
    expect(s.stand.anblick).not.toBe(uebersicht);
    expect(s.stand.zoombilder).toBe(zb);
    expect(u.urls).toHaveLength(1);
  });

  it("aendert nichts, wenn die Ansicht schon gilt", async () => {
    const { u, s } = neu();
    await u.frame();
    s.zoome(false);
    expect(u.geplanteFrames).toBe(0);
  });

  it("verschiebt im Zoom beide Bilder gemeinsam und holt die Mitte beim Wechsel zur Uebersicht zurueck", async () => {
    // Voreinstellung: Mond 1865" im Feld 3000", in der Uebersicht fest, im Zoom (1500") verschiebbar.
    const { u, s } = neu();
    await u.frame();
    s.zoome(true);
    s.verschiebe(400, -300);
    await u.frame();
    const zb = s.stand.zoombilder;
    expect(zb?.anblick.fenster).toMatchObject({ mitteXArcsec: 400, mitteYArcsec: -300 });
    expect(zb?.vergleich.fenster).toMatchObject({ mitteXArcsec: 400, mitteYArcsec: -300 });

    s.zoome(false);
    expect(s.stand.mitte).toEqual({ xArcsec: 0, yArcsec: 0 });
    await u.frame();
    expect(s.stand.auswertung?.parameter.fenster).toMatchObject({ mitteXArcsec: 0, mitteYArcsec: 0 });
  });

  it("behaelt die Mitte beim Wechsel in den Zoom, wenn die Uebersicht schon verschoben ist", async () => {
    // Okular 4 mm: 150-fach, Feld 1200" kleiner als der Mond, Uebersicht verschiebbar.
    const { u, s } = neu();
    const k = s.konfiguration;
    if (k.geraet.art !== "fernrohr") throw new Error("Voreinstellung ist kein Fernrohr");
    s.aendere({ ...k, geraet: { ...k.geraet, okular: { ...k.geraet.okular, brennweiteMm: 4 } } });
    s.verschiebe(500, 200);
    await u.frame();
    s.zoome(true);
    expect(s.stand.mitte).toEqual({ xArcsec: 500, yArcsec: 200 });
    await u.frame();
    expect(s.stand.zoombilder?.anblick.fenster).toMatchObject({ mitteXArcsec: 500, mitteYArcsec: 200 });
  });

  it("verwirft die Zoombilder bei Objekt- oder Geraetewechsel, nicht bei anderen Aenderungen", async () => {
    const { u, s } = neu();
    await u.frame();
    s.zoome(true);
    await u.frame();
    const zb = s.stand.zoombilder;
    expect(zb).toBeDefined();
    // Innerhalb des Zooms: altes Bild bleibt bis zum neuen (kein Flackern).
    s.aendere(mitSeeing(s.konfiguration, 3));
    expect(s.stand.zoombilder).toBe(zb);
    await u.frame();
    // Zurueck zur Uebersicht, anderes Objekt, wieder in den Zoom: kein Mond neben dem Jupiter-Nachweis.
    s.zoome(false);
    await u.frame();
    s.aendere(mitZustand(s.konfiguration, "jup_47"));
    expect(s.stand.zoombilder).toBeUndefined();
    s.zoome(true);
    expect(s.stand.zoombilder).toBeUndefined();
    await u.frame();
    expect(s.stand.zoombilder?.anblick.fenster.breiteArcsec).toBeCloseTo(zoombreiteArcsec(s.konfiguration), 9);
    // Geraetewechsel verwirft ebenso.
    const k = s.konfiguration;
    if (k.geraet.art !== "fernrohr") throw new Error("Voreinstellung ist kein Fernrohr");
    s.aendere({ ...k, geraet: { ...k.geraet, okular: { ...k.geraet.okular, brennweiteMm: 6 } } });
    expect(s.stand.zoombilder).toBeUndefined();
  });

  it("zeigt im Zoom auf Wunsch das Detailfenster mit derselben Mitte und oeffnet den Zoom danach ohne Detail (#77)", async () => {
    const { u, s } = neu();
    await u.frame();
    s.zeigeDetail(true);
    expect(s.stand.detail).toBe(false);
    expect(u.geplanteFrames).toBe(0);
    s.zoome(true);
    s.verschiebe(300, 100);
    await u.frame();
    s.zeigeDetail(true);
    expect(s.stand.detail).toBe(true);
    expect(s.stand.mitte).toEqual({ xArcsec: 300, yArcsec: 100 });
    await u.frame();
    const breite = detailbreiteArcsec(s.konfiguration);
    expect(breite).toBeDefined();
    expect(s.stand.zoombilder?.anblick.fenster).toMatchObject({ breiteArcsec: breite, mitteXArcsec: 300, mitteYArcsec: 100 });
    expect(s.stand.zoombilder?.vergleich.fenster).toEqual(s.stand.zoombilder?.anblick.fenster);
    expect(u.urls).toHaveLength(1);

    s.zeigeDetail(false);
    await u.frame();
    expect(s.stand.zoombilder?.anblick.fenster.breiteArcsec).toBeCloseTo(zoombreiteArcsec(s.konfiguration), 9);
    s.zeigeDetail(true);
    s.zoome(false);
    expect(s.stand.detail).toBe(false);
    s.zoome(true);
    await u.frame();
    expect(s.stand.zoombilder?.anblick.fenster.breiteArcsec).toBeCloseTo(zoombreiteArcsec(s.konfiguration), 9);
  });

  it("bleibt beim Objektwechsel im Zoom und zeigt das neue Objekt", async () => {
    const { u, s } = neu();
    await u.frame();
    s.zoome(true);
    await u.frame();
    s.aendere(mitZustand(s.konfiguration, "jup_47"));
    await u.frame();
    expect(s.stand.zoom).toBe(true);
    expect(s.stand.zoombilder?.anblick.fenster.breiteArcsec).toBeCloseTo(zoombreiteArcsec(s.konfiguration), 9);
  });
});

describe("Steuerung, Zustaende ohne Quellbild (QuelleLeer, Issue #109)", () => {
  /** Hellster Wert eines Rasters ueber alle Kanaele. */
  function hellster(daten: Float32Array): number {
    let m = 0;
    for (const v of daten) m = Math.max(m, v);
    return m;
  }

  it("rechnet Doppelsterne, M45 und das freie Paar ohne die Bildquelle der Umgebung", async () => {
    const { u, s } = neu();
    await u.frame();
    expect(u.bildquellen).toEqual(["mond_ev"]);
    const paar = freiesPaar({ trennungArcsec: 20, magnitudeA: 3, magnitudeB: 4, bvA: 0.6, bvB: 1.5 });
    for (const k of [mitZustand(s.konfiguration, "albireo_2025"), mitZustand(s.konfiguration, "eps_lyr_2027"), mitZustand(s.konfiguration, "m45"), { ...s.konfiguration, objekt: paar }]) {
      expect(k.objekt.quelle).toBeUndefined();
      s.aendere(k);
      await u.frame();
      expect(s.stand.phase, k.objekt.kennung).toBe("fertig");
      expect(s.stand.fehler).toBeUndefined();
      expect(s.stand.anblick?.raster.breite).toBe(ANZEIGE_PX);
    }
    // Keine weitere Bildquelle und keine Anfrage an die Umgebung fuer die vier Zustaende ohne Bild.
    expect(u.bildquellen).toEqual(["mond_ev"]);
    expect(u.urls.at(-1)).toContain("z=frei&tr=20&ma=3&mb=4&bva=0.6&bvb=1.5");
  });

  it("zeigt die Sterne des freien Paars im Gesichtsfeld und rechnet im Zoom mit Vergleichsbild", async () => {
    const { u, s } = neu();
    await u.frame();
    s.aendere({ ...s.konfiguration, objekt: freiesPaar({ trennungArcsec: 30, magnitudeA: 2, magnitudeB: 3, bvA: 0.6, bvB: 0.6 }) });
    await u.frame();
    expect(s.stand.phase).toBe("fertig");
    // Die Sterne heben sich vom Himmel ab (die Mitte zwischen den Sternen ist Himmel); bei 64
    // Anzeigepixeln fallen etwa 47'' auf ein Pixel, deshalb nur knapp.
    const himmelVon = (r: { daten: Float32Array; kanaele: number }): number => r.daten[((ANZEIGE_PX / 2) * ANZEIGE_PX + ANZEIGE_PX / 2) * r.kanaele]!;
    const raster = s.stand.anblick!.raster;
    expect(hellster(raster.daten)).toBeGreaterThan(himmelVon(raster));

    s.zoome(true);
    await u.frame();
    expect(s.stand.phase).toBe("fertig");
    const zb = s.stand.zoombilder!;
    expect(zb.anblick.fenster).toEqual(zb.vergleich.fenster);
    expect(hellster(zb.anblick.raster.daten)).toBeGreaterThan(2 * himmelVon(zb.anblick.raster));
    expect(hellster(zb.vergleich.raster.daten)).toBeGreaterThan(0);
    // Zoombreite aus dem Sternabstand (zoom.ts ohne quelle): 30'' mit Rand.
    expect(zoombreiteArcsec(s.konfiguration)).toBeGreaterThanOrEqual(30);
    expect(u.bildquellen).toEqual(["mond_ev"]);
  });

  it("wechselt vom freien Paar zurueck auf ein Objekt mit Bild und holt dessen Bildquelle", async () => {
    const { u, s } = neu();
    await u.frame();
    s.aendere({ ...s.konfiguration, objekt: freiesPaar({ trennungArcsec: 2, magnitudeA: 5, magnitudeB: 6, bvA: 0.6, bvB: 0.6 }) });
    await u.frame();
    s.aendere(mitZustand(s.konfiguration, "jup_47"));
    await u.frame();
    expect(s.stand.phase).toBe("fertig");
    expect(u.bildquellen).toEqual(["mond_ev", "jup_47"]);
  });
});

describe("Steuerung, Detail ohne Quellbild startet auf dem hellsten Stern (Herbert 2026-10-29)", () => {
  it("Epsilon Lyrae am 80/600 bei 150x: Detail auf eps1 A, danach verschiebbar, zurueck zum Zoom bleibt die Mitte", async () => {
    const { u, s } = neu();
    await u.frame();
    const start = mitZustand(s.konfiguration, "eps_lyr_2027");
    const k = { ...start, geraet: { ...(start.geraet as Extract<Konfiguration["geraet"], { art: "fernrohr" }>), okular: { brennweiteMm: 4, scheinbaresGesichtsfeldGrad: 50 } } };
    s.aendere(k);
    await u.frame();
    s.zoome(true);
    await u.frame();
    expect(s.stand.mitte).toEqual({ xArcsec: 0, yArcsec: 0 });
    expect(detailbreiteArcsec(s.konfiguration)).toBeDefined();
    s.zeigeDetail(true);
    expect(s.stand.mitte).toEqual({ xArcsec: 14.251, yArcsec: 102.728 });
    await u.frame();
    expect(s.stand.zoombilder?.anblick.fenster).toMatchObject({ mitteXArcsec: 14.251, mitteYArcsec: 102.728 });
    // Nur die Startlage: Verschieben im Detail gilt weiter.
    s.verschiebe(10, 90);
    await u.frame();
    expect(s.stand.mitte).toEqual({ xArcsec: 10, yArcsec: 90 });
    s.zeigeDetail(false);
    expect(s.stand.detail).toBe(false);
  });

  it("Objekte mit Quellbild behalten die Fenstermitte (Mond)", async () => {
    const { u, s } = neu();
    await u.frame();
    s.zoome(true);
    await u.frame();
    s.zeigeDetail(true);
    expect(s.stand.mitte).toEqual({ xArcsec: 0, yArcsec: 0 });
  });
});
