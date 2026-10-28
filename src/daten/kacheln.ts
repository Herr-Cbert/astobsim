// QuelleKacheln: Quelle aus einer Kachelpyramide (ADR-0003, docs/architektur.md Abschnitt 1:
// Stufenwahl, Nachladen, Cache). Der Vertrag in src/naht/quelle.ts ist synchron; deshalb zwei
// Schritte: lade(mitte, breite, massstab) holt asynchron genau die Kacheln, die ausschnitt mit
// denselben Argumenten braucht, ausschnitt nimmt nur aus dem Cache und setzt Fehlendes auf
// Schwarz. Die Kacheln kommen ueber einen injizierten KachelLader: im Browser fetch und
// Dekodierung (kachellader.ts), in Tests ein synthetischer Lader (testkacheln.ts).
//
// Geometrie: die Bildmitte jeder Stufe ist die Objektmitte 0/0, Zeile 0 ist Norden (A-D11).
// Bildmitte heisst Randkoordinate breitePx / 2, also die Grenze zwischen zwei Pixeln, nicht ein
// Pixelzentrum. Beim Mond liegt die Scheibenmitte laut tools/mond_kacheln.py bei Pixelindex 1536
// (Zentrum 1536,5); der Versatz von 0,5 px auf Stufe 0 (0,34'') ist vernachlaessigbar.
// Alle Stufen decken dieselbe Flaeche am Himmel ab; Stufe n hat das 2^n-fache Pixelmass.
//
// Cache: LRU mit maxKacheln. Kacheln aus dem Browser liegen als 8-Bit-sRGB im Cache (KachelSrgb,
// Issue #66: 3 statt 12 Bytes je Pixel, die Mond-Pyramide etwa 37 statt 149 MB) und werden erst
// in ausschnitt ueber dieselbe Tabelle wie rgbaZuRaster linearisiert, das Ergebnis ist bitgleich.
// Lader in Tests liefern weiter lineare Raster (Float32). Nie verdraengt werden die Kacheln laufender lade-Aufrufe, der
// zuletzt abgeschlossenen Anfrage und der zuletzt gestarteten abgeschlossenen Anfrage. So gilt
// "lade, dann ausschnitt" auch, wenn ein aelterer lade-Aufruf erst nach einem neueren fertig wird.

import type { Objektpunkt, Quellausschnitt, Quelle } from "../naht/quelle";
import type { Kanaele, Raster } from "../naht/raster";
import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { massstabFuerZustand, type Pixelbereich, pixelbereich, schwarz } from "./pixelbereich";
import { LINEAR_8BIT } from "./srgb";

/** Eine Stufe der Pyramide in Anzeige-Bogensekunden (schon auf den Zustand skaliert). */
interface Stufengeometrie {
  breitePx: number;
  hoehePx: number;
  massstabArcsecProPx: number;
}

export interface Pyramidengeometrie {
  kachelPx: number;
  kanaele: Kanaele;
  /** Stufe 0 (feinste) zuerst. */
  stufen: Stufengeometrie[];
}

/** Kachel als 8-Bit-sRGB-Kodewerte, drei Kanaele zeilenweise, Zeile 0 Norden (Issue #66). */
export interface KachelSrgb {
  breite: number;
  hoehe: number;
  srgb: Uint8Array;
}

/** Kachel im Cache: lineares Raster oder 8-Bit-sRGB (linearisiert erst im Ausschnitt). */
export type Kachel = Raster | KachelSrgb;

/** Liefert die Kachel (x, y) der Stufe; Randkacheln sind kleiner als kachelPx. */
export type KachelLader = (stufe: number, x: number, y: number) => Promise<Kachel>;

/** Adresse einer Kachel. */
export interface Kacheladresse {
  stufe: number;
  x: number;
  y: number;
}


/** Standardgroesse des Caches: 64 volle Kacheln 512 px mit 3 Kanaelen sind rund 50 MB als sRGB (200 MB Float32). */
const MAX_KACHELN_STANDARD = 64;

/** Relative Toleranz der Stufenwahl gegen Rundung (gewuenschter Massstab gleich Stufenmassstab). */
const TOLERANZ_STUFE = 1e-9;

export class QuelleKacheln implements Quelle {
  /** Geladene Kacheln; Einfuegereihenfolge = zuletzt benutzt zuletzt (LRU). */
  private readonly cache = new Map<string, Kachel>();
  /** Laufende Ladevorgaenge, damit gleichzeitige lade-Aufrufe eine Kachel nur einmal holen. */
  private readonly laufend = new Map<string, Promise<Kachel>>();
  /** Kacheln je laufendem lade-Aufruf, nach fortlaufender Nummer des Aufrufs. */
  private readonly anfragenLaufend = new Map<number, ReadonlySet<string>>();
  private anfragenGestartet = 0;
  /** Kacheln der zuletzt abgeschlossenen Anfrage. */
  private letzteAbgeschlossen: ReadonlySet<string> = new Set();
  /** Kacheln der zuletzt gestarteten unter den abgeschlossenen Anfragen, mit ihrer Nummer. */
  private neuesteAbgeschlossen: { nummer: number; kacheln: ReadonlySet<string> } = { nummer: 0, kacheln: new Set() };

  constructor(
    readonly geometrie: Pyramidengeometrie,
    private readonly lader: KachelLader,
    readonly maxKacheln = MAX_KACHELN_STANDARD
  ) {
    const { kachelPx, stufen } = geometrie;
    if (!Number.isInteger(kachelPx) || kachelPx < 1) throw new DatenFehler("-", "Kachelpyramide", "kachelPx", `${kachelPx} ist keine positive ganze Zahl`);
    if (stufen.length === 0) throw new DatenFehler("-", "Kachelpyramide", "stufen", "mindestens eine Stufe erwartet");
    stufen.forEach((s, n) => {
      if (!(s.massstabArcsecProPx > 0) || !Number.isInteger(s.breitePx) || !Number.isInteger(s.hoehePx) || s.breitePx < 1 || s.hoehePx < 1) {
        throw new DatenFehler("-", "Kachelpyramide", `stufen[${n}]`, "Masse und Massstab muessen positiv sein");
      }
      if (n > 0 && !(s.massstabArcsecProPx > stufen[n - 1]!.massstabArcsecProPx)) {
        throw new DatenFehler("-", "Kachelpyramide", `stufen[${n}]`, "Massstab muss von Stufe zu Stufe groeber werden");
      }
    });
    if (!(maxKacheln >= 1)) throw new DatenFehler("-", "Kachelpyramide", "maxKacheln", "mindestens 1");
  }

  /** Anzahl der Kacheln im Cache (fuer Tests). */
  get kachelnImCache(): number {
    return this.cache.size;
  }

  /**
   * Die groebste Stufe, deren Massstab noch feiner oder gleich dem gewuenschten ist (A-X5); ist
   * auch Stufe 0 groeber als gewuenscht, Stufe 0.
   */
  stufeFuer(massstabArcsecProPx: number): number {
    const { stufen } = this.geometrie;
    let gewaehlt = 0;
    stufen.forEach((s, n) => {
      if (s.massstabArcsecProPx <= massstabArcsecProPx * (1 + TOLERANZ_STUFE)) gewaehlt = n;
    });
    return gewaehlt;
  }

  /** Die Kacheln, die ausschnitt mit denselben Argumenten braucht, zeilenweise von Nordwest. */
  kachelnFuer(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Kacheladresse[] {
    const stufe = this.stufeFuer(massstabArcsecProPx);
    return this.kachelnIn(stufe, this.bereich(mitte, breiteArcsec, stufe).bereich);
  }

  /** Kacheln der Stufe, die den Bereich beruehren. */
  private kachelnIn(stufe: number, bereich: Pixelbereich | null): Kacheladresse[] {
    if (bereich === null) return [];
    const k = this.geometrie.kachelPx;
    const liste: Kacheladresse[] = [];
    for (let y = Math.floor(bereich.y0 / k); y <= Math.floor((bereich.y1 - 1) / k); y++) {
      for (let x = Math.floor(bereich.x0 / k); x <= Math.floor((bereich.x1 - 1) / k); x++) liste.push({ stufe, x, y });
    }
    return liste;
  }

  /**
   * Holt die fehlenden Kacheln fuer ausschnitt(mitte, breite, massstab) in den Cache. Kacheln
   * im Cache werden nicht erneut geladen. Scheitert eine Kachel, laden die anderen trotzdem;
   * danach wirft lade den ersten Fehler, die gescheiterte Kachel wird beim naechsten Aufruf neu
   * versucht (ausschnitt zeigt sie bis dahin schwarz).
   */
  async lade(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Promise<void> {
    const benoetigt = this.kachelnFuer(mitte, breiteArcsec, massstabArcsecProPx);
    const schluessel = new Set(benoetigt.map(kachelSchluessel));
    const nummer = ++this.anfragenGestartet;
    this.anfragenLaufend.set(nummer, schluessel);
    let ergebnisse: PromiseSettledResult<Kachel>[];
    try {
      ergebnisse = await Promise.allSettled(benoetigt.map((a) => this.ladeKachel(a)));
    } finally {
      this.anfragenLaufend.delete(nummer);
    }
    // Benoetigte Kacheln als zuletzt benutzt markieren, dann den Cache begrenzen.
    for (const s of schluessel) this.beruehre(s);
    this.letzteAbgeschlossen = schluessel;
    if (nummer > this.neuesteAbgeschlossen.nummer) this.neuesteAbgeschlossen = { nummer, kacheln: schluessel };
    this.begrenzeCache();
    const fehler = ergebnisse.find((e): e is PromiseRejectedResult => e.status === "rejected");
    if (fehler !== undefined) throw fehler.reason;
  }

  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Quellausschnitt {
    const stufe = this.stufeFuer(massstabArcsecProPx);
    const ms = this.geometrie.stufen[stufe]!.massstabArcsecProPx;
    const { kanaele, kachelPx: k } = this.geometrie;
    const { links, oben, bereich } = this.bereich(mitte, breiteArcsec, stufe);
    if (bereich === null) {
      // Bereich liegt ganz ausserhalb der Pyramide: ein schwarzes Pixel genuegt.
      return { raster: schwarz(1, 1, kanaele), massstabArcsecProPx: ms, linksXArcsec: links, obenYArcsec: oben };
    }
    const { x0, x1, y0, y1 } = bereich;
    const raster = schwarz(x1 - x0, y1 - y0, kanaele);
    for (const adresse of this.kachelnIn(stufe, bereich)) {
      const kachel = this.cache.get(kachelSchluessel(adresse));
      if (kachel === undefined) continue; // nicht geladen: bleibt Schwarz
      // Schnitt von Kachel und Bereich in Stufenpixeln.
      const kx0 = adresse.x * k;
      const ky0 = adresse.y * k;
      const sx0 = Math.max(x0, kx0);
      const sx1 = Math.min(x1, kx0 + kachel.breite);
      const zeilenLaenge = (sx1 - sx0) * kanaele;
      const srgb = "srgb" in kachel ? kachel.srgb : undefined;
      for (let y = Math.max(y0, ky0); y < Math.min(y1, ky0 + kachel.hoehe); y++) {
        const von = ((y - ky0) * kachel.breite + (sx0 - kx0)) * kanaele;
        const nach = ((y - y0) * raster.breite + (sx0 - x0)) * kanaele;
        if (srgb === undefined) raster.daten.set((kachel as Raster).daten.subarray(von, von + zeilenLaenge), nach);
        else linearisiere(srgb, von, raster.daten, nach, zeilenLaenge);
      }
    }
    return { raster, massstabArcsecProPx: ms, linksXArcsec: links + x0 * ms, obenYArcsec: oben - y0 * ms };
  }

  /** Angefragter Bereich in Pixeln der Stufe mit einem Pixel Rand (pixelbereich.ts). */
  private bereich(mitte: Objektpunkt, breiteArcsec: number, stufe: number): ReturnType<typeof pixelbereich> {
    const geo = this.geometrie.stufen[stufe]!;
    return pixelbereich(mitte, breiteArcsec, geo.breitePx, geo.hoehePx, geo.massstabArcsecProPx);
  }

  private async ladeKachel(adresse: Kacheladresse): Promise<Kachel> {
    const schluessel = kachelSchluessel(adresse);
    const vorhanden = this.cache.get(schluessel);
    if (vorhanden !== undefined) return vorhanden;
    let laeuft = this.laufend.get(schluessel);
    if (laeuft === undefined) {
      laeuft = this.lader(adresse.stufe, adresse.x, adresse.y)
        .then((kachel) => {
          this.pruefeKachel(adresse, kachel);
          this.cache.set(schluessel, kachel);
          return kachel;
        })
        .finally(() => this.laufend.delete(schluessel));
      this.laufend.set(schluessel, laeuft);
    }
    return laeuft;
  }

  /** Masse und Kanaele der Kachel muessen zur Geometrie passen, sonst stimmt der Ausschnitt nicht. */
  private pruefeKachel(adresse: Kacheladresse, kachel: Kachel): void {
    const geo = this.geometrie.stufen[adresse.stufe]!;
    const k = this.geometrie.kachelPx;
    const breite = Math.min(k, geo.breitePx - adresse.x * k);
    const hoehe = Math.min(k, geo.hoehePx - adresse.y * k);
    const kanaele = this.geometrie.kanaele;
    // Eine sRGB-Kachel hat immer drei Kanaele.
    const [kKanaele, laenge] = "srgb" in kachel ? [3, kachel.srgb.length] : [kachel.kanaele, kachel.daten.length];
    if (kachel.breite !== breite || kachel.hoehe !== hoehe || kKanaele !== kanaele || laenge !== breite * hoehe * kanaele) {
      throw new DatenFehler(
        "Kachel",
        kachelSchluessel(adresse),
        "Masse",
        `${breite}x${hoehe}x${kanaele} erwartet, ${kachel.breite}x${kachel.hoehe}x${kKanaele} geliefert`
      );
    }
  }

  private beruehre(schluessel: string): void {
    const kachel = this.cache.get(schluessel);
    if (kachel === undefined) return;
    this.cache.delete(schluessel);
    this.cache.set(schluessel, kachel);
  }

  /** Verdraengt die am laengsten unbenutzten Kacheln, nie die geschuetzten (siehe Kopfkommentar). */
  private begrenzeCache(): void {
    const schutz = new Set([...this.letzteAbgeschlossen, ...this.neuesteAbgeschlossen.kacheln]);
    for (const kacheln of this.anfragenLaufend.values()) for (const k of kacheln) schutz.add(k);
    for (const schluessel of this.cache.keys()) {
      if (this.cache.size <= this.maxKacheln) return;
      if (!schutz.has(schluessel)) this.cache.delete(schluessel);
    }
  }
}

/**
 * Geometrie der Pyramide aus dem Bildnachweis, skaliert auf die Winkelgroesse des Zustands:
 * Massstab Stufe 0 = winkelgroesseArcsec / objekt_durchmesser_px (die Anwendung skaliert die
 * Scheibe von objekt_durchmesser_px auf den Zustand, bilder.md Abschnitt 8), Stufe n nach dem
 * Verhaeltnis der Pixelbreiten. Der Massstab im Nachweis gilt fuer die Rendering-Groesse und
 * wird hier nicht verwendet.
 */
export function pyramidengeometrie(nachweis: Bildnachweis, winkelgroesseArcsec: number, kanaele: Kanaele = 3): Pyramidengeometrie {
  if (nachweis.kacheln === undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kacheln", "keine Kachelpyramide");
  const massstab0 = massstabFuerZustand(nachweis, winkelgroesseArcsec);
  return {
    kachelPx: nachweis.kacheln.kachelPx,
    kanaele,
    stufen: nachweis.kacheln.stufen.map((s) => ({
      breitePx: s.breitePx,
      hoehePx: s.hoehePx,
      massstabArcsecProPx: (massstab0 * nachweis.pixelBreite) / s.breitePx
    }))
  };
}

/** Pfad einer Kachel relativ zu daten/bilder/ nach dem Muster des Nachweises. */
export function kachelPfad(nachweis: Bildnachweis, adresse: Kacheladresse): string {
  if (nachweis.kacheln === undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kacheln", "keine Kachelpyramide");
  return (
    nachweis.datei +
    nachweis.kacheln.muster.replace("{stufe}", String(adresse.stufe)).replace("{x}", String(adresse.x)).replace("{y}", String(adresse.y))
  );
}

/** n sRGB-Kodewerte ab von in lineare Werte ab nach; eigene Funktion, damit die Schleife monomorph bleibt. */
function linearisiere(srgb: Uint8Array, von: number, ziel: Float32Array, nach: number, n: number): void {
  const tabelle = LINEAR_8BIT;
  for (let i = 0; i < n; i++) ziel[nach + i] = tabelle[srgb[von + i]!]!;
}

/** Schluessel einer Kachel im Cache und in Meldungen: "stufe/x_y". */
export function kachelSchluessel(a: Kacheladresse): string {
  return `${a.stufe}/${a.x}_${a.y}`;
}
