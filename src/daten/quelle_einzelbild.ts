// QuelleEinzelbild: Quelle aus einem einzelnen Bild (Planeten, ADR-0003), Vertrag aus
// src/naht/quelle.ts. Wie bei QuelleKacheln zwei Schritte: das Bild wird vorab asynchron geladen
// und linearisiert (quelleEinzelbildBrowser in kachellader.ts: fetch, Dekodierung, sRGB-Kennlinie),
// ausschnitt ist danach synchron und rein. Dieser Kern braucht kein DOM und ist in Node getestet.
//
// Geometrie wie bei QuelleKacheln: die Bildmitte (Randkoordinate breitePx / 2) ist die Objektmitte
// 0/0, Zeile 0 ist Norden (A-D11). tools/bild_aufbereiten.py legt die Scheibenmitte genau dorthin.
// Massstab = Winkelgroesse des Zustands / objekt_durchmesser_px (wie pyramidengeometrie): die
// Anwendung skaliert die Scheibe auf den Zustand, der Massstab im Nachweis gilt fuer die Aufnahme.
// Ein Bild hat nur einen Massstab; er ist immer der feinste verfuegbare, bild mittelt auf das
// Arbeitsraster (mittele.ts). Zwei Zustaende koennen dasselbe Raster mit verschiedenem Massstab
// nutzen (Mars 14" und 6").
//
// Deep-Sky-Bilder mit log-Kennlinie (kennlinie.ts) bleiben als 8-Bit-Kodewerte mit einem Kanal im
// Speicher (KachelSrgb) und werden erst in ausschnitt ueber die Tabelle der Kennlinie dekodiert,
// wie die Kacheln (ADR-0003 Nachtrag V2: Cache bleibt 8 Bit). Planetenbilder bleiben Float32.

import type { Objektpunkt, Quellausschnitt, Quelle } from "../naht/quelle";
import type { Kanaele, Raster } from "../naht/raster";
import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { type KachelSrgb, linearisiere } from "./kacheln";
import { kodetabelle } from "./kennlinie";
import { massstabFuerZustand, pixelbereich, schwarz } from "./pixelbereich";
import { LINEAR_8BIT } from "./srgb";

export class QuelleEinzelbild implements Quelle {
  /** Kanaele des Bilds (bei 8-Bit-Kodes ohne Angabe 3). */
  private readonly kanaele: Kanaele;

  constructor(
    readonly raster: Raster | KachelSrgb,
    readonly massstabArcsecProPx: number,
    /** Dekodiertabelle, nur fuer 8-Bit-Kodewerte: sRGB oder log-Kennlinie (kodetabelle). */
    private readonly tabelle: Float32Array = LINEAR_8BIT
  ) {
    const { breite, hoehe } = raster;
    const [kanaele, laenge] = "srgb" in raster ? [raster.kanaele ?? 3, raster.srgb.length] : [raster.kanaele, raster.daten.length];
    if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite < 1 || hoehe < 1 || (kanaele !== 1 && kanaele !== 3)) {
      throw new DatenFehler("-", "Einzelbild", "raster", `${breite}x${hoehe}x${kanaele} ist kein gueltiges Raster`);
    }
    if (laenge !== breite * hoehe * kanaele) {
      throw new DatenFehler("-", "Einzelbild", "raster", `${breite * hoehe * kanaele} Werte erwartet, ${laenge} geliefert`);
    }
    if (tabelle.length !== 256) throw new DatenFehler("-", "Einzelbild", "tabelle", `256 Werte erwartet, ${tabelle.length} geliefert`);
    this.kanaele = kanaele;
    if (!(massstabArcsecProPx > 0) || !Number.isFinite(massstabArcsecProPx)) {
      throw new DatenFehler("-", "Einzelbild", "massstab", `${massstabArcsecProPx} ist kein positiver Massstab`);
    }
  }

  /**
   * Der angefragte Bereich mit einem Pixel Rand (fuer das bilineare Vergroessern in bild), auf das
   * Bild begrenzt, immer im Massstab des Bilds; ganz ausserhalb ein schwarzes Pixel.
   */
  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, _massstabArcsecProPx: number): Quellausschnitt {
    const ms = this.massstabArcsecProPx;
    const { breite, hoehe } = this.raster;
    const kanaele = this.kanaele;
    const { links, oben, bereich } = pixelbereich(mitte, breiteArcsec, breite, hoehe, ms);
    if (bereich === null) {
      return { raster: schwarz(1, 1, kanaele), massstabArcsecProPx: ms, linksXArcsec: links, obenYArcsec: oben };
    }
    const { x0, x1, y0, y1 } = bereich;
    const teil = schwarz(x1 - x0, y1 - y0, kanaele);
    const zeilenLaenge = (x1 - x0) * kanaele;
    for (let y = y0; y < y1; y++) {
      const von = (y * breite + x0) * kanaele;
      if ("srgb" in this.raster) linearisiere(this.raster.srgb, von, teil.daten, (y - y0) * zeilenLaenge, zeilenLaenge, this.tabelle);
      else teil.daten.set(this.raster.daten.subarray(von, von + zeilenLaenge), (y - y0) * zeilenLaenge);
    }
    return { raster: teil, massstabArcsecProPx: ms, linksXArcsec: links + x0 * ms, obenYArcsec: oben - y0 * ms };
  }
}

/** Massstab des Einzelbilds fuer einen Zustand: Winkelgroesse des Zustands / objekt_durchmesser_px. */
export function einzelbildMassstab(nachweis: Bildnachweis, winkelgroesseArcsec: number): number {
  if (nachweis.kacheln !== undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kacheln", "Kachelpyramide, kein Einzelbild (QuelleKacheln)");
  return massstabFuerZustand(nachweis, winkelgroesseArcsec);
}

/**
 * QuelleEinzelbild fuer einen Zustand aus dem schon geladenen Bild: lineares Raster (sRGB-Bilder,
 * beim Laden linearisiert) oder 8-Bit-Kodewerte (Bilder mit log-Kennlinie, Pflicht fuer diese).
 * Das Bild muss die Masse aus dem Nachweis haben, sonst stimmt der Massstab nicht.
 */
export function quelleEinzelbild(nachweis: Bildnachweis, winkelgroesseArcsec: number, raster: Raster | KachelSrgb): QuelleEinzelbild {
  const massstab = einzelbildMassstab(nachweis, winkelgroesseArcsec);
  if (nachweis.kennlinie !== undefined && !("srgb" in raster)) {
    throw new DatenFehler(nachweis.datei, nachweis.id, "kennlinie", "Bild mit log-Kennlinie als 8-Bit-Kodewerte erwartet, nicht linear");
  }
  if (raster.breite !== nachweis.pixelBreite || raster.hoehe !== nachweis.pixelHoehe) {
    throw new DatenFehler(
      nachweis.datei,
      nachweis.id,
      "Masse",
      `${nachweis.pixelBreite}x${nachweis.pixelHoehe} laut ${BILDER_DATEI} erwartet, ${raster.breite}x${raster.hoehe} geladen`
    );
  }
  return new QuelleEinzelbild(raster, massstab, kodetabelle(nachweis));
}
