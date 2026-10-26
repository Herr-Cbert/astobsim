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

import type { Objektpunkt, Quellausschnitt, Quelle } from "../naht/quelle";
import type { Kanaele, Raster } from "../naht/raster";
import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { OBJEKTE_DATEI } from "./objekte";

export class QuelleEinzelbild implements Quelle {
  constructor(
    readonly raster: Raster,
    readonly massstabArcsecProPx: number
  ) {
    const { breite, hoehe, kanaele, daten } = raster;
    if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite < 1 || hoehe < 1 || (kanaele !== 1 && kanaele !== 3)) {
      throw new DatenFehler("-", "Einzelbild", "raster", `${breite}x${hoehe}x${kanaele} ist kein gueltiges Raster`);
    }
    if (daten.length !== breite * hoehe * kanaele) {
      throw new DatenFehler("-", "Einzelbild", "raster", `${breite * hoehe * kanaele} Werte erwartet, ${daten.length} geliefert`);
    }
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
    const { breite, hoehe, kanaele, daten } = this.raster;
    const links = -(breite * ms) / 2;
    const oben = (hoehe * ms) / 2;
    const x0 = klemme(Math.floor((mitte.xArcsec - breiteArcsec / 2 - links) / ms) - 1, 0, breite);
    const x1 = klemme(Math.ceil((mitte.xArcsec + breiteArcsec / 2 - links) / ms) + 1, 0, breite);
    const y0 = klemme(Math.floor((oben - (mitte.yArcsec + breiteArcsec / 2)) / ms) - 1, 0, hoehe);
    const y1 = klemme(Math.ceil((oben - (mitte.yArcsec - breiteArcsec / 2)) / ms) + 1, 0, hoehe);
    if (x1 <= x0 || y1 <= y0) {
      return { raster: schwarz(1, 1, kanaele), massstabArcsecProPx: ms, linksXArcsec: links, obenYArcsec: oben };
    }
    const teil = schwarz(x1 - x0, y1 - y0, kanaele);
    const zeilenLaenge = (x1 - x0) * kanaele;
    for (let y = y0; y < y1; y++) {
      const von = (y * breite + x0) * kanaele;
      teil.daten.set(daten.subarray(von, von + zeilenLaenge), (y - y0) * zeilenLaenge);
    }
    return { raster: teil, massstabArcsecProPx: ms, linksXArcsec: links + x0 * ms, obenYArcsec: oben - y0 * ms };
  }
}

/** Massstab des Einzelbilds fuer einen Zustand: Winkelgroesse des Zustands / objekt_durchmesser_px. */
export function einzelbildMassstab(nachweis: Bildnachweis, winkelgroesseArcsec: number): number {
  if (nachweis.kacheln !== undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kacheln", "Kachelpyramide, kein Einzelbild (QuelleKacheln)");
  if (!(winkelgroesseArcsec > 0)) throw new DatenFehler(OBJEKTE_DATEI, nachweis.zustand, "winkelgroesse_arcsec", "muss positiv sein");
  return winkelgroesseArcsec / nachweis.objektDurchmesserPx;
}

/**
 * QuelleEinzelbild fuer einen Zustand aus dem schon geladenen, linearen Raster; das Raster muss
 * die Masse aus dem Nachweis haben, sonst stimmt der Massstab nicht.
 */
export function quelleEinzelbild(nachweis: Bildnachweis, winkelgroesseArcsec: number, raster: Raster): QuelleEinzelbild {
  const massstab = einzelbildMassstab(nachweis, winkelgroesseArcsec);
  if (raster.breite !== nachweis.pixelBreite || raster.hoehe !== nachweis.pixelHoehe) {
    throw new DatenFehler(
      nachweis.datei,
      nachweis.id,
      "Masse",
      `${nachweis.pixelBreite}x${nachweis.pixelHoehe} laut ${BILDER_DATEI} erwartet, ${raster.breite}x${raster.hoehe} geladen`
    );
  }
  return new QuelleEinzelbild(raster, massstab);
}

function schwarz(breite: number, hoehe: number, kanaele: Kanaele): Raster {
  return { breite, hoehe, kanaele, daten: new Float32Array(breite * hoehe * kanaele) };
}

/** Klemmt wert auf [min, max]; nicht begrenze, das ist der Nahtbegriff aus physik. */
function klemme(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}
