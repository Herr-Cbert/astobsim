// Verschieben des Ausschnitts (A-D2): wann es erlaubt ist, wie weit, und wie Ziehen und
// Pfeiltasten die Fenstermitte aendern. Reine Funktionen ohne DOM; gesichtsfeld.ts haengt sie an
// Maus und Tastatur und gibt das Ergebnis an steuerung.verschiebe (nur fenster.mitte, kein Kernbau).
//
// Koordinaten wie in der Naht: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Bogensekunden.
// Die Feldblende bleibt in der Fenstermitte (Entscheidung 2026-10-26, Issue #6); verschoben wird
// der Blick ueber das Objekt.
//
// Grenze der Mitte: die Fenstermitte bleibt auf der Objektscheibe, |mitte| <= Objektradius. Am
// Anschlag geht der Rand des Objekts durch die Mitte des Gesichtsfelds, die halbe Feldflaeche
// zeigt noch Objekt, die andere Haelfte Himmel. So laesst sich jeder Teil des Rands (Mondrand,
// Terminator nahe am Rand) in die Feldmitte holen, das Objekt verschwindet aber nie ganz aus dem
// Feld, auch nicht bei einem Gesichtsfeld knapp unter dem Objektdurchmesser. Radial (Kreis)
// statt je Achse, weil die Objekte Scheiben sind; in den Ecken eines Quadrats laege sonst nur
// Himmel im Feld.

import type { Gesichtsfeld } from "../naht/simulationsparameter";

export interface Mitte {
  xArcsec: number;
  yArcsec: number;
}

/** Schritt einer Pfeiltaste als Anteil der Gesichtsfeldbreite; mit Umschalt der grosse Schritt. */
export const TASTENSCHRITT = 0.05;
export const TASTENSCHRITT_GROSS = 0.25;

/** Verschieben ist nur erlaubt, wenn das Objekt groesser als das Gesichtsfeld ist (A-D2). */
export function verschiebbar(objektDurchmesserArcsec: number, gesichtsfeld: Gesichtsfeld): boolean {
  return objektDurchmesserArcsec > Math.min(gesichtsfeld.breiteArcsec, gesichtsfeld.hoeheArcsec);
}

/** Schneidet die Mitte radial auf den Objektradius (siehe Kopf); nicht endliche Werte werden 0/0. */
export function begrenzeMitte(mitte: Mitte, objektDurchmesserArcsec: number): Mitte {
  const { xArcsec: x, yArcsec: y } = mitte;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { xArcsec: 0, yArcsec: 0 };
  const radius = Math.max(0, objektDurchmesserArcsec / 2);
  const abstand = Math.hypot(x, y);
  if (abstand <= radius) return { xArcsec: x, yArcsec: y };
  const f = radius / abstand;
  return { xArcsec: x * f, yArcsec: y * f };
}

/**
 * Mitte, die zum Stand gehoert: ist Verschieben erlaubt, die begrenzte Mitte, sonst 0/0 (auch ohne
 * lesbares Objekt). Weicht sie von der aktuellen ab (Zustandswechsel mit kleinerem Objekt, Wechsel
 * zu einem groesseren Gesichtsfeld), holt die UI sie mit verschiebe zurueck.
 */
export function sollMitte(mitte: Mitte, objektDurchmesserArcsec: number | undefined, erlaubt: boolean): Mitte {
  if (!erlaubt || objektDurchmesserArcsec === undefined) return { xArcsec: 0, yArcsec: 0 };
  return begrenzeMitte(mitte, objektDurchmesserArcsec);
}

/**
 * Mitte nach Ziehen um (dxPx, dyPx) Bildschirmpixel seit dem Start des Ziehens: der Inhalt folgt
 * der Maus. Ziehen nach rechts holt den linken Teil ins Feld (Mitte nach -x), Ziehen nach unten
 * den noerdlichen (Mitte nach +y, weil Bildschirm-y nach Sueden zeigt). arcsecProPx ist die
 * Fensterbreite in Bogensekunden durch die angezeigte Breite in Pixeln. Begrenzt wird vom Start
 * aus, nicht schrittweise: wer ueber den Anschlag hinaus zieht und zurueckkommt, findet die Stelle wieder.
 */
export function mitteNachZiehen(start: Mitte, dxPx: number, dyPx: number, arcsecProPx: number, objektDurchmesserArcsec: number): Mitte {
  return begrenzeMitte({ xArcsec: start.xArcsec - dxPx * arcsecProPx, yArcsec: start.yArcsec + dyPx * arcsecProPx }, objektDurchmesserArcsec);
}

/**
 * Mitte nach einer Taste: Pfeiltasten bewegen den Blick in Pfeilrichtung (rechts zeigt mehr vom
 * rechten Teil, oben mehr vom Norden), Schritt TASTENSCHRITT der Gesichtsfeldbreite, mit Umschalt
 * TASTENSCHRITT_GROSS; Pos1 zentriert. Andere Tasten: undefined (nicht behandelt).
 */
export function mitteNachTaste(mitte: Mitte, taste: string, gross: boolean, gesichtsfeldBreiteArcsec: number, objektDurchmesserArcsec: number): Mitte | undefined {
  if (taste === "Home") return { xArcsec: 0, yArcsec: 0 };
  const s = gesichtsfeldBreiteArcsec * (gross ? TASTENSCHRITT_GROSS : TASTENSCHRITT);
  const richtung: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  const r = richtung[taste];
  if (r === undefined) return undefined;
  return begrenzeMitte({ xArcsec: mitte.xArcsec + r[0] * s, yArcsec: mitte.yArcsec + r[1] * s }, objektDurchmesserArcsec);
}
