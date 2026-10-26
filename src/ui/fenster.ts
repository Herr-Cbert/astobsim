// Fensterwahl der UI: wie viele Anzeigepixel das Gesichtsfeld bekommt, und welche Anfrage an die
// Quelle vor rendere geht. Das Fenster selbst baut physik (Standardfenster in auswerten); die UI
// gibt nur anzeigePx vor. Ein Fenster schmaler als der Arbeitsmassstab waere ein
// Programmierfehler (PhysikFehler); das Standardfenster ist immer das ganze wahre Gesichtsfeld.

import type { Objektpunkt } from "../bild";
import type { Quellbild } from "../naht/simulationsparameter";

/** Kleinste Anzeige; darunter ist der Anblick nicht mehr beurteilbar (auswerten verlangt >= 16). */
export const ANZEIGE_PX_MIN = 256;

/**
 * Anzeigepixel aus der Breite des Platzes in CSS-Pixeln und devicePixelRatio, ganzzahlig und auf
 * [ANZEIGE_PX_MIN, maxPx] begrenzt. maxPx ist die Grenze des Falters (JavaScript: 1024 px).
 */
export function waehleAnzeigePx(breiteCssPx: number, pixelVerhaeltnis: number, maxPx: number): number {
  const verhaeltnis = Number.isFinite(pixelVerhaeltnis) && pixelVerhaeltnis > 0 ? pixelVerhaeltnis : 1;
  const gewuenscht = Number.isFinite(breiteCssPx) ? Math.round(breiteCssPx * verhaeltnis) : maxPx;
  return Math.max(ANZEIGE_PX_MIN, Math.min(maxPx, gewuenscht));
}

/** Anfrage an die Quelle: Mitte, Breite und Massstab des Ausschnitts. */
export interface Ausschnittsanfrage {
  mitte: Objektpunkt;
  breiteArcsec: number;
  massstabArcsecProPx: number;
}

/**
 * Dieselben Argumente, die rendere an quelle.ausschnitt gibt (src/bild/rendere.ts, Stufe 1).
 * QuelleKacheln.lade muss vor rendere genau damit laufen, sonst liefert ausschnitt Schwarz.
 */
export function ausschnittsanfrage(quellbild: Quellbild): Ausschnittsanfrage {
  return {
    mitte: { xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec },
    breiteArcsec: quellbild.rasterPx * quellbild.massstabArcsecProPx,
    massstabArcsecProPx: quellbild.massstabArcsecProPx
  };
}
