// Quelle: Zugang der Bildpipeline zum Quellbild. Die Schnittstelle gehoert zum Modul daten
// (docs/architektur.md Abschnitt 1, `Quelle.ausschnitt(mitte, breite, massstab)`), wird hier
// definiert, damit bild ohne daten testbar ist, und spaeter von #8 mit Einzelbild und
// Kachelpyramide bedient. QuelleAusRaster ist der Adapter aus einem Bild im Speicher.

import { BildFehler } from "./fehler";
import { neuesRaster, pruefeRaster, type Raster } from "./raster";

/** Punkt in Objektkoordinaten: Objektmitte 0/0, +x rechts, +y Norden, Bogensekunden (A-D11). */
export interface Objektpunkt {
  xArcsec: number;
  yArcsec: number;
}

/**
 * Ein gelieferter Ausschnitt des Quellbilds. Das Raster hat seinen eigenen Massstab und ist am
 * Himmel verankert ueber die Objektkoordinaten seiner linken oberen Ecke (linker Rand der
 * Spalte 0, noerdlicher Rand der Zeile 0). Werte relativ zu Quellweiss, 1 oder 3 Kanaele.
 */
export interface Quellausschnitt {
  raster: Raster;
  massstabArcsecProPx: number;
  linksXArcsec: number;
  obenYArcsec: number;
}

/**
 * Vertrag zwischen bild und daten:
 * - bild fragt den Bereich an, den das Arbeitsraster braucht: Mitte in Objektkoordinaten,
 *   Breite des quadratischen Bereichs in Bogensekunden und den Arbeitsmassstab.
 * - Die Quelle liefert den Bereich in einem Massstab, der nie groeber als der angefragte ist
 *   (bei einer Kachelpyramide die groebste Stufe, die noch feiner oder gleich ist, A-X5);
 *   bild mittelt flaechig auf das Arbeitsraster (mittele.ts).
 * - Der gelieferte Ausschnitt darf groesser oder kleiner als der angefragte Bereich sein.
 *   Alles, was er nicht abdeckt, gilt als Schwarz (Himmel ohne Objekt).
 * - Synchron: Nachladen von Kacheln muss vor rendere abgeschlossen sein; ein zweiter Aufruf
 *   mit denselben Argumenten liefert dasselbe Ergebnis.
 */
export interface Quelle {
  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Quellausschnitt;
}

/**
 * Quelle aus einem Raster im Speicher (Tests, kleine Einzelbilder). Die Mitte des Rasters liegt
 * bei `mitte` in Objektkoordinaten, Standard Objektmitte 0/0. Liefert immer im eigenen Massstab
 * und schneidet den angefragten Bereich mit einem Pixel Rand aus. Zaehlt die Aufrufe fuer Tests.
 */
export class QuelleAusRaster implements Quelle {
  aufrufe = 0;

  constructor(
    readonly raster: Raster,
    readonly massstabArcsecProPx: number,
    readonly mitte: Objektpunkt = { xArcsec: 0, yArcsec: 0 }
  ) {
    pruefeRaster(raster, "Quellraster");
    if (!(massstabArcsecProPx > 0)) throw new BildFehler(`Quellmassstab muss positiv sein, nicht ${massstabArcsecProPx}`);
  }

  /** Linker Rand des Rasters in Objektkoordinaten. */
  get linksXArcsec(): number {
    return this.mitte.xArcsec - (this.raster.breite * this.massstabArcsecProPx) / 2;
  }

  /** Noerdlicher Rand des Rasters in Objektkoordinaten. */
  get obenYArcsec(): number {
    return this.mitte.yArcsec + (this.raster.hoehe * this.massstabArcsecProPx) / 2;
  }

  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, _massstabArcsecProPx: number): Quellausschnitt {
    this.aufrufe++;
    const ms = this.massstabArcsecProPx;
    const { breite, hoehe, kanaele, daten } = this.raster;
    const links = this.linksXArcsec;
    const oben = this.obenYArcsec;
    // Angefragter Bereich in Quellpixeln, mit einem Pixel Rand, auf das Raster begrenzt.
    const x0 = begrenze(Math.floor((mitte.xArcsec - breiteArcsec / 2 - links) / ms) - 1, 0, breite);
    const x1 = begrenze(Math.ceil((mitte.xArcsec + breiteArcsec / 2 - links) / ms) + 1, 0, breite);
    const y0 = begrenze(Math.floor((oben - (mitte.yArcsec + breiteArcsec / 2)) / ms) - 1, 0, hoehe);
    const y1 = begrenze(Math.ceil((oben - (mitte.yArcsec - breiteArcsec / 2)) / ms) + 1, 0, hoehe);
    if (x1 <= x0 || y1 <= y0) {
      // Bereich liegt ganz ausserhalb des Bilds: ein schwarzes Pixel genuegt.
      return { raster: neuesRaster(1, 1, kanaele), massstabArcsecProPx: ms, linksXArcsec: links, obenYArcsec: oben };
    }
    const teil = neuesRaster(x1 - x0, y1 - y0, kanaele);
    const zeilenLaenge = (x1 - x0) * kanaele;
    for (let y = y0; y < y1; y++) {
      const von = (y * breite + x0) * kanaele;
      teil.daten.set(daten.subarray(von, von + zeilenLaenge), (y - y0) * zeilenLaenge);
    }
    return { raster: teil, massstabArcsecProPx: ms, linksXArcsec: links + x0 * ms, obenYArcsec: oben - y0 * ms };
  }
}

function begrenze(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}
