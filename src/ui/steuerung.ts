// Steuerung der UI: haelt die Konfiguration, die Fenstermitte und den Rechenstand und verbindet
// Formulare, Gesichtsfeld und Infopanel (docs/architektur.md Abschnitt 1, Modul ui). Jede
// Aenderung laeuft ueber aendere: begrenze (physik) -> Rechnung planen; im geplanten Frame wird
// die URL geschrieben (zustand, A-D8) und gerechnet. Gerechnet wird hoechstens einmal pro Frame
// (A-D7); mehrere Aenderungen im selben Frame werden zu einer Rechnung. Wartet eine Rechnung auf
// das Netz (Bildquelle, Kacheln) und wird dabei ueberholt, wird sie verworfen; ohne Netz laeuft
// sie in einem Zug durch, damit auch Dauerziehen am Regler Bilder liefert. Das alte Bild bleibt
// bis zum neuen im Stand (kein Flackern). verschiebe aendert nur die Fenstermitte (A-D2).
// zoome wechselt zwischen Uebersicht und Zoomansicht (A-D3, Issue #20): der Zoom ist nur ein
// anderes Fenster (zoom.ts) mit derselben Fenstermitte, dazu das Vergleichsbild aus derselben
// Quelle; er schreibt keine URL.
//
// Alles, was den Browser braucht (Frame, URL, Bildquelle, Anzeigegroesse), kommt ueber die
// Umgebung herein; so prueft Vitest die Schleife in Node. Die Steuerung wirft nie: Fehler landen
// im Stand und die UI zeigt sie an.

import { type Anblick, type Falter, FalterJs, rendere, type Zwischenspeicher } from "../bild";
import type { Objektzustand } from "../naht/konfiguration";
import type { Quelle } from "../naht/quelle";
import type { Simulationsparameter } from "../naht/simulationsparameter";
import { type Auswertung, auswerten, begrenze, type Hinweis, type Konfiguration, optik } from "../physik";
import { inUrl, type Kataloge } from "../zustand";
import { type Ausschnittsanfrage, ausschnittsanfrage } from "./fenster";
import { sollMitte } from "./verschieben";
import { vergleichsparameter, verschiebelage, zoomfenster } from "./zoom";

/** Quelle eines Objektzustands mit dem asynchronen Vorladen, das rendere voraussetzt. */
export interface Bildquelle {
  quelle: Quelle;
  /** Holt, was quelle.ausschnitt fuer die Anfrage braucht (Kacheln); bei Einzelbildern nichts. */
  lade(anfrage: Ausschnittsanfrage): Promise<void>;
}

/** Was die Steuerung von aussen braucht; im Browser baut starte sie, in Tests der Test. */
export interface Umgebung {
  kataloge: Kataloge;
  falter: Falter;
  /** Bildquelle zum Objektzustand (Browser: Kachelpyramide oder Einzelbild). */
  bildquelle(objekt: Objektzustand): Promise<Bildquelle>;
  /** Ruft f einmal vor dem naechsten Frame (Browser: requestAnimationFrame). */
  plane(f: () => void): void;
  /** Laesst den Browser den Status zeichnen, bevor die Faltung den Hauptthread belegt. */
  warte(): Promise<void>;
  /** Schreibt den Suchteil der URL (Browser: history.replaceState). */
  schreibeUrl(suche: string): void;
  /** Anzeigepixel fuer die naechste Rechnung: Gesichtsfeld, im Zoom ein Bild der Zoomansicht. */
  anzeigePx(zoom: boolean): number;
  /** Zeit in ms (Browser: performance.now). */
  uhr(): number;
}

/** laedt: Bildquelle oder Kacheln werden geholt; rechnet: rendere laeuft gleich; fertig, fehler. */
export type Phase = "laedt" | "rechnet" | "fertig" | "fehler";

/** Wird erfuellt, sobald die laufende Rechnung ueberholt ist (naechstes aendere oder verschiebe). */
interface Signal {
  promise: Promise<void>;
  loese(): void;
}

function neuesSignal(): Signal {
  let loese = (): void => {};
  const promise = new Promise<void>((weiter) => {
    loese = weiter;
  });
  return { promise, loese };
}

export interface Stand {
  /** Die aktuelle, begrenzte Konfiguration. */
  konfiguration: Konfiguration;
  phase: Phase;
  /** Auswertung der zuletzt begonnenen Rechnung (Infopanel, Warnungen); fehlt vor der ersten. */
  auswertung?: Auswertung;
  /** Fenstermitte in Objektkoordinaten (Bogensekunden, +y Norden); 0/0 zeigt das Objekt zentriert. */
  mitte: { xArcsec: number; yArcsec: number };
  /** Gewuenschte Ansicht: false Uebersicht (Gesichtsfeld), true Zoomansicht (A-D3). */
  zoom: boolean;
  /** Letzter fertiger Anblick der Uebersicht; bleibt stehen, bis der naechste fertig ist, auch bei einem Fehler. */
  anblick?: Anblick;
  /** Letzte fertige Zoomansicht: Anblick und Vergleichsbild im selben Fenster; bleibt stehen wie anblick. */
  zoombilder?: Zoombilder;
  /** Zaehlt die fertigen Anblicke; ein Beobachter zeichnet nur, wenn sich die Nummer aendert. */
  nummer: number;
  /** Dauer von rendere fuer den letzten Anblick in ms. */
  ms?: number;
  /** bild: Bildquelle oder Kacheln nicht ladbar; rechnen: auswerten oder rendere gescheitert. */
  fehler?: { art: "bild" | "rechnen"; ursache: unknown };
}

/** Die beiden Bilder der Zoomansicht, aus einer Rechnung. */
export interface Zoombilder {
  anblick: Anblick;
  /** Quellbild ohne Faltung und ohne Helligkeitsanpassung, Quellweiss = Bildschirmweiss (zoom.ts). */
  vergleich: Anblick;
}

export type Beobachter = (stand: Readonly<Stand>) => void;

/**
 * Aktuelle Bildquelle; gehoert zu genau einem Objektzustand, ebenso ihre Zwischenspeicher. Einer je
 * Bild, damit sich Uebersicht, Zoom und Vergleichsbild die Stufen nicht gegenseitig verdraengen.
 */
interface AktuelleQuelle {
  kennung: string;
  bildquelle: Promise<Bildquelle>;
  zwischen: { uebersicht: Zwischenspeicher; zoom: Zwischenspeicher; vergleich: Zwischenspeicher };
}

export class Steuerung {
  private zustand: Stand;
  private readonly beobachter = new Set<Beobachter>();
  /** Zaehlt die Aenderungen; eine Rechnung prueft nach dem Warten aufs Netz, ob sie noch aktuell ist. */
  private version = 0;
  private ueberholt = neuesSignal();
  private geplant = false;
  private laeuft = false;
  private nochmal = false;
  /** Suchteil der URL, der zuletzt geschrieben wurde oder werden soll. */
  private url = "";
  private urlGeschrieben = false;
  private vorher: Simulationsparameter | undefined;
  private aktuell: AktuelleQuelle | undefined;
  /** Faltet das Vergleichsbild: der 1x1-Delta-Kern braucht keine GPU und kein Kontextrisiko. */
  private readonly vergleichsfalter = new FalterJs();

  /** Startet mit start (z. B. aus ausUrl) und plant URL und erste Rechnung. */
  constructor(
    private readonly umgebung: Umgebung,
    start: Konfiguration
  ) {
    this.zustand = { konfiguration: begrenze(start).konfiguration, phase: "laedt", zoom: false, nummer: 0, mitte: { xArcsec: 0, yArcsec: 0 } };
    this.url = this.urlZu(this.zustand.konfiguration);
    this.plane();
  }

  get kataloge(): Kataloge {
    return this.umgebung.kataloge;
  }

  get stand(): Readonly<Stand> {
    return this.zustand;
  }

  get konfiguration(): Konfiguration {
    return this.zustand.konfiguration;
  }

  /**
   * Uebernimmt eine neue Konfiguration: begrenzt sie (A-F8) und plant URL und Rechnung; eine
   * Konfiguration, die der aktuellen gleicht, aendert nichts. Wechselt Objekt oder Geraet,
   * springt die Fenstermitte auf 0/0. Liefert die Hinweise von begrenze fuer das Feld.
   */
  aendere(neu: Konfiguration): Hinweis[] {
    const { konfiguration, hinweise } = begrenze(neu);
    const url = this.urlZu(konfiguration);
    if (url !== "" && url === this.url) return hinweise;
    const alt = this.zustand.konfiguration;
    const zurueck = konfiguration.objekt.kennung !== alt.objekt.kennung || JSON.stringify(konfiguration.geraet) !== JSON.stringify(alt.geraet);
    this.url = url;
    this.urlGeschrieben = false;
    this.ueberhole();
    this.setze(zurueck ? { konfiguration, mitte: { xArcsec: 0, yArcsec: 0 } } : { konfiguration });
    this.plane();
    return hinweise;
  }

  /** Setzt die Fenstermitte (Verschieben, A-D2); schreibt keine URL, baut keinen neuen Kern. */
  verschiebe(xArcsec: number, yArcsec: number): void {
    if (!Number.isFinite(xArcsec) || !Number.isFinite(yArcsec)) return;
    const m = this.zustand.mitte;
    if (m.xArcsec === xArcsec && m.yArcsec === yArcsec) return;
    this.ueberhole();
    this.setze({ mitte: { xArcsec, yArcsec } });
    this.plane();
  }

  /**
   * Wechselt zwischen Uebersicht (false) und Zoomansicht (true); schreibt keine URL (der Zoom ist
   * kein Parameter der Konfiguration). Die Fenstermitte bleibt, soweit die neue Ansicht sie
   * erlaubt (sonst begrenzt oder 0/0, verschieben.ts); Anblick und Zoombilder bleiben im Stand,
   * bis die neue Rechnung fertig ist.
   */
  zoome(zoom: boolean): void {
    if (this.zustand.zoom === zoom) return;
    const lage = verschiebelage(this.zustand.konfiguration, zoom);
    const mitte = sollMitte(this.zustand.mitte, lage?.durchmesser, lage?.erlaubt ?? false);
    this.ueberhole();
    this.setze({ zoom, mitte });
    this.plane();
  }

  /** Plant eine Rechnung ohne Aenderung, z. B. nach neuer Anzeigegroesse oder Falterwechsel. */
  rechneNeu(): void {
    this.ueberhole();
    this.plane();
  }

  /** Meldet jeden neuen Stand an f, sofort auch den aktuellen. Liefert die Abmeldung. */
  beobachte(f: Beobachter): () => void {
    this.beobachter.add(f);
    this.melde(f);
    return () => this.beobachter.delete(f);
  }

  private ueberhole(): void {
    this.version++;
    this.ueberholt.loese();
    this.ueberholt = neuesSignal();
  }

  private setze(teil: Partial<Stand>): void {
    this.zustand = { ...this.zustand, ...teil };
    for (const f of this.beobachter) this.melde(f);
  }

  /** Ein Fehler in einem Beobachter darf weder die anderen noch die Rechnung aufhalten. */
  private melde(f: Beobachter): void {
    try {
      f(this.zustand);
    } catch (e) {
      console.error(e);
    }
  }

  private urlZu(k: Konfiguration): string {
    try {
      return inUrl(k, this.umgebung.kataloge);
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  /** Hoechstens einmal pro Frame: Browser drosseln haeufiges history.replaceState. */
  private schreibeUrl(): void {
    if (this.urlGeschrieben || this.url === "") return;
    this.urlGeschrieben = true;
    try {
      this.umgebung.schreibeUrl(this.url);
    } catch (e) {
      // Die URL ist Komfort (A-D8); ohne sie geht die Anzeige weiter.
      console.error(e);
    }
  }

  private plane(): void {
    if (this.geplant) return;
    this.geplant = true;
    this.umgebung.plane(() => {
      this.geplant = false;
      this.schreibeUrl();
      void this.lauf();
    });
  }

  /** Eine Rechnung zur Zeit; Aenderungen waehrenddessen loesen danach genau eine weitere aus. */
  private async lauf(): Promise<void> {
    if (this.laeuft) {
      this.nochmal = true;
      return;
    }
    this.laeuft = true;
    try {
      do {
        this.nochmal = false;
        try {
          await this.rechne();
        } catch (e) {
          // Letztes Netz fuer Fehler der Umgebung (warte, bildquelle): die Steuerung wirft nie.
          this.setze({ phase: "fehler", fehler: { art: "rechnen", ursache: e } });
        }
      } while (this.nochmal);
    } finally {
      this.laeuft = false;
    }
  }

  private quelleFuer(objekt: Objektzustand): AktuelleQuelle {
    if (this.aktuell?.kennung !== objekt.kennung) {
      this.aktuell = { kennung: objekt.kennung, bildquelle: this.umgebung.bildquelle(objekt), zwischen: { uebersicht: {}, zoom: {}, vergleich: {} } };
    }
    return this.aktuell;
  }

  /**
   * Erst warten (der Browser zeichnet den Status), dann den aktuellen Stand lesen und ohne
   * weiteren Frame durchrechnen. Nur das Warten aufs Netz kann ueberholt werden.
   */
  private async rechne(): Promise<void> {
    this.setze({ phase: "rechnet", fehler: undefined });
    await this.umgebung.warte();
    const version = this.version;
    const ueberholt = this.ueberholt.promise;
    const { konfiguration: k, mitte, zoom } = this.zustand;

    let auswertung: Auswertung;
    let vergleich: Simulationsparameter | undefined;
    try {
      const px = this.umgebung.anzeigePx(zoom);
      const fenster = zoom
        ? zoomfenster(k, mitte, px)
        : { breiteArcsec: optik(k.geraet).gesichtsfeld.breiteArcsec, mitteXArcsec: mitte.xArcsec, mitteYArcsec: mitte.yArcsec, px };
      auswertung = auswerten(k, { fenster, vorher: this.vorher });
      if (zoom) vergleich = vergleichsparameter(auswertung.parameter, k.objekt.quelle.massstabArcsecProPx);
    } catch (e) {
      this.setze({ phase: "fehler", fehler: { art: "rechnen", ursache: e } });
      return;
    }
    this.vorher = auswertung.parameter;

    const neueQuelle = this.aktuell?.kennung !== k.objekt.kennung;
    const aktuell = this.quelleFuer(k.objekt);
    this.setze(neueQuelle ? { auswertung, phase: "laedt" } : { auswertung });
    const laden = (async (): Promise<Bildquelle> => {
      const bildquelle = await aktuell.bildquelle;
      await bildquelle.lade(ausschnittsanfrage(auswertung.parameter.quellbild));
      // Das Vergleichsbild fragt feiner an (andere Kachelstufe), deshalb eigens laden.
      if (vergleich !== undefined) await bildquelle.lade(ausschnittsanfrage(vergleich.quellbild));
      return bildquelle;
    })();
    let bildquelle: Bildquelle | undefined;
    try {
      bildquelle = await Promise.race([laden, ueberholt.then(() => undefined)]);
    } catch (e) {
      // Naechster Versuch baut die Bildquelle neu auf (z. B. nach einem Netzfehler).
      if (this.aktuell === aktuell) this.aktuell = undefined;
      if (version === this.version) this.setze({ phase: "fehler", fehler: { art: "bild", ursache: e } });
      return;
    }
    if (bildquelle === undefined || version !== this.version) {
      // Ueberholt: das Laden darf im Hintergrund weiterlaufen (fuellt den Kachel-Cache).
      laden.catch(() => {
        if (this.aktuell === aktuell) this.aktuell = undefined;
      });
      return;
    }

    if (neueQuelle) this.setze({ phase: "rechnet" });
    try {
      const t0 = this.umgebung.uhr();
      const anblick = rendere(auswertung.parameter, bildquelle.quelle, this.umgebung.falter, zoom ? aktuell.zwischen.zoom : aktuell.zwischen.uebersicht);
      const bilder: Partial<Stand> =
        vergleich === undefined
          ? { anblick }
          : { zoombilder: { anblick, vergleich: rendere(vergleich, bildquelle.quelle, this.vergleichsfalter, aktuell.zwischen.vergleich) } };
      const ms = Math.round(this.umgebung.uhr() - t0);
      this.setze({ phase: "fertig", ...bilder, ms, nummer: this.zustand.nummer + 1 });
    } catch (e) {
      this.setze({ phase: "fehler", fehler: { art: "rechnen", ursache: e } });
    }
  }
}
