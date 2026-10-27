// Steuerung der UI: haelt die Konfiguration und den Rechenstand und verbindet Formulare,
// Gesichtsfeld und Infopanel (docs/architektur.md Abschnitt 1, Modul ui). Jede Aenderung laeuft
// ueber aendere: begrenze (physik) -> URL schreiben (zustand, A-D8) -> Rechnung planen. Gerechnet
// wird hoechstens einmal pro Frame (A-D7); mehrere Aenderungen im selben Frame werden zu einer
// Rechnung, eine Rechnung zu einer inzwischen ueberholten Konfiguration wird vor dem Falten
// verworfen. Das alte Bild bleibt bis zum neuen im Stand (kein Flackern).
//
// Alles, was den Browser braucht (Frame, URL, Bildquelle, Anzeigegroesse), kommt ueber die
// Umgebung herein; so prueft Vitest die Schleife in Node. Die Steuerung wirft nie: Fehler landen
// im Stand und die UI zeigt sie an.

import { type Anblick, type Falter, rendere, type Zwischenspeicher } from "../bild";
import type { Objektzustand } from "../naht/konfiguration";
import type { Quelle } from "../naht/quelle";
import type { Simulationsparameter } from "../naht/simulationsparameter";
import { type Auswertung, auswerten, begrenze, type Hinweis, type Konfiguration } from "../physik";
import { inUrl, type Kataloge } from "../zustand";
import { type Ausschnittsanfrage, ausschnittsanfrage } from "./fenster";

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
  /** Anzeigepixel des Gesichtsfelds fuer die naechste Rechnung. */
  anzeigePx(): number;
  /** Zeit in ms (Browser: performance.now). */
  uhr(): number;
}

/** laedt: Bildquelle oder Kacheln werden geholt; rechnet: rendere laeuft gleich; fertig, fehler. */
export type Phase = "laedt" | "rechnet" | "fertig" | "fehler";

export interface Stand {
  /** Die aktuelle, begrenzte Konfiguration. */
  konfiguration: Konfiguration;
  phase: Phase;
  /** Auswertung der zuletzt begonnenen Rechnung (Infopanel, Warnungen); fehlt vor der ersten. */
  auswertung?: Auswertung;
  /** Letzter fertiger Anblick; bleibt stehen, bis der naechste fertig ist oder ein Fehler kommt. */
  anblick?: Anblick;
  /** Zaehlt die fertigen Anblicke; ein Beobachter zeichnet nur, wenn sich die Nummer aendert. */
  nummer: number;
  /** Dauer von rendere fuer den letzten Anblick in ms. */
  ms?: number;
  /** bild: Bildquelle oder Kacheln nicht ladbar; rechnen: auswerten oder rendere gescheitert. */
  fehler?: { art: "bild" | "rechnen"; ursache: unknown };
}

export type Beobachter = (stand: Readonly<Stand>) => void;

/** Aktuelle Bildquelle; gehoert zu genau einem Objektzustand, ebenso ihr Zwischenspeicher. */
interface AktuelleQuelle {
  kennung: string;
  bildquelle: Promise<Bildquelle>;
  zwischen: Zwischenspeicher;
}

export class Steuerung {
  private zustand: Stand;
  private readonly beobachter = new Set<Beobachter>();
  /** Zaehlt die Aenderungen; eine Rechnung prueft vor dem Falten, ob sie noch aktuell ist. */
  private version = 0;
  private geplant = false;
  private laeuft = false;
  private nochmal = false;
  private vorher: Simulationsparameter | undefined;
  private aktuell: AktuelleQuelle | undefined;

  /** Startet mit start (z. B. aus ausUrl), schreibt die URL und plant die erste Rechnung. */
  constructor(
    private readonly umgebung: Umgebung,
    start: Konfiguration
  ) {
    this.zustand = { konfiguration: begrenze(start).konfiguration, phase: "laedt", nummer: 0 };
    this.schreibeUrl();
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
   * Uebernimmt eine neue Konfiguration: begrenzt sie (A-F8), schreibt die URL und plant die
   * Rechnung. Liefert die Hinweise von begrenze, damit das Formular sie am Feld zeigt.
   */
  aendere(neu: Konfiguration): Hinweis[] {
    const { konfiguration, hinweise } = begrenze(neu);
    this.version++;
    this.setze({ konfiguration });
    this.schreibeUrl();
    this.plane();
    return hinweise;
  }

  /** Meldet jeden neuen Stand an f, sofort auch den aktuellen. Liefert die Abmeldung. */
  beobachte(f: Beobachter): () => void {
    this.beobachter.add(f);
    this.melde(f);
    return () => this.beobachter.delete(f);
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

  private schreibeUrl(): void {
    try {
      this.umgebung.schreibeUrl(inUrl(this.zustand.konfiguration, this.umgebung.kataloge));
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
        await this.rechne();
      } while (this.nochmal);
    } finally {
      this.laeuft = false;
    }
  }

  private quelleFuer(objekt: Objektzustand): AktuelleQuelle {
    if (this.aktuell?.kennung !== objekt.kennung) {
      this.aktuell = { kennung: objekt.kennung, bildquelle: this.umgebung.bildquelle(objekt), zwischen: {} };
    }
    return this.aktuell;
  }

  private async rechne(): Promise<void> {
    const version = this.version;
    const k = this.zustand.konfiguration;

    let auswertung: Auswertung;
    try {
      auswertung = auswerten(k, { anzeigePx: this.umgebung.anzeigePx(), vorher: this.vorher });
    } catch (e) {
      this.setze({ phase: "fehler", fehler: { art: "rechnen", ursache: e } });
      return;
    }
    this.vorher = auswertung.parameter;
    this.setze({ auswertung, phase: "laedt" });

    const aktuell = this.quelleFuer(k.objekt);
    let bildquelle: Bildquelle;
    try {
      bildquelle = await aktuell.bildquelle;
      await bildquelle.lade(ausschnittsanfrage(auswertung.parameter.quellbild));
    } catch (e) {
      // Naechster Versuch baut die Bildquelle neu auf (z. B. nach einem Netzfehler).
      if (this.aktuell === aktuell) this.aktuell = undefined;
      if (version === this.version) this.setze({ phase: "fehler", fehler: { art: "bild", ursache: e } });
      return;
    }
    if (version !== this.version) return;

    this.setze({ phase: "rechnet" });
    await this.umgebung.warte();
    if (version !== this.version) return;

    try {
      const t0 = this.umgebung.uhr();
      const anblick = rendere(auswertung.parameter, bildquelle.quelle, this.umgebung.falter, aktuell.zwischen);
      const ms = Math.round(this.umgebung.uhr() - t0);
      this.setze({ phase: "fertig", anblick, ms, nummer: this.zustand.nummer + 1, fehler: undefined });
    } catch (e) {
      this.setze({ phase: "fehler", fehler: { art: "rechnen", ursache: e } });
    }
  }
}
