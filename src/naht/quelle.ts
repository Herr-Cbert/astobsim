// Quelle: Vertrag zwischen bild und daten fuer den Zugang zum Quellbild (docs/architektur.md
// Abschnitt 1, `Quelle.ausschnitt(mitte, breite, massstab)`). Nur Typen; daten implementiert
// (Einzelbild, Kachelpyramide), bild ruft auf und hat den Test-Adapter QuelleAusRaster.

import type { Raster } from "./raster";

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
