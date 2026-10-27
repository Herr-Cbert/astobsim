import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, QuelleAusRaster } from "../bild";
import { objektzustand, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeVerweise } from "../daten";
import type { Konfiguration, Objektzustand } from "../naht/konfiguration";
import { GRENZEN } from "../physik";
import { PARAMETER, voreinstellung, type Kataloge } from "../zustand";
import type { Ausschnittsanfrage } from "./fenster";
import { type Bildquelle, type Stand, Steuerung, type Umgebung } from "./steuerung";

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
  async warte(): Promise<void> {}
  schreibeUrl(suche: string): void {
    this.urls.push(suche);
  }
  anzeigePx(): number {
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
  it("schreibt beim Start die URL, plant einen Frame und rechnet den ersten Anblick", async () => {
    const { u, s, staende } = neu();
    expect(u.urls).toHaveLength(1);
    expect(u.urls[0]).toContain(`${PARAMETER.zustand}=mond_ev`);
    expect(u.geplanteFrames).toBe(1);
    expect(staende[0]!.phase).toBe("laedt");

    await u.frame();
    expect(s.stand.phase).toBe("fertig");
    expect(s.stand.nummer).toBe(1);
    expect(s.stand.anblick?.raster.breite).toBe(ANZEIGE_PX);
    expect(s.stand.ms).toBe(5);
    expect(staende.map((x) => x.phase)).toEqual(["laedt", "laedt", "rechnet", "fertig"]);
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
    // Erste Rechnung verworfen (kein Anblick), zweite laedt jetzt.
    expect(s.stand.nummer).toBe(0);
    u.halteLade = false;
    await u.gebe();
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
});
