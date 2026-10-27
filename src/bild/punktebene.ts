// Punktebene (Issue #72): die gemalten Punktquellen (male.ts) lokal mit dem Kern falten und in eine
// eigene Ebene im Arbeitsraster legen, die tonwert getrennt vom Objekt auf die Anzeige abbildet
// (docs/recherche/physik.md Abschnitt 14, docs/architektur.md Abschnitt 3). Die Faltung laeuft
// direkt in JavaScript mit kern.daten, nur um jedes Scheibchen: Kern hoechstens 81 px, Scheibchen
// wenige Pixel, also wenige Millisekunden. Die Falter (JS, WebGL2) bleiben unberuehrt.

import type { Kern } from "../naht/simulationsparameter";
import { pruefeKern } from "./falter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import type { Scheibchen } from "./male";
import { neuesRaster, type Raster } from "./raster";

/**
 * Faltet jedes Scheibchen mit dem Kern (echte Faltung; die Kerne der Naht sind punktsymmetrisch)
 * und addiert das Ergebnis in eine mit 0 belegte Ebene rasterPx x rasterPx (ein Kanal, Werte
 * relativ zu Quellweiss). Rand wie bei male: der Kern wird nicht neu normiert, was ausserhalb des
 * Rasters faellt, fehlt; innen behaelt ein angeschnittener Punkt seine Helligkeit. Der Gesamtfluss
 * eines ganz innen liegenden Scheibchens bleibt erhalten (Kern Summe 1).
 *
 * undefined, wenn kein Scheibchen nach der Faltung ins Raster reicht (dann gibt es keine
 * Punktebene, und tonwert rechnet bitgleich wie ohne Trabanten).
 */
export function faltePunkte(scheibchen: readonly Scheibchen[], kern: Kern, rasterPx: number): Raster | undefined {
  pruefePositivGanz("rasterPx", rasterPx);
  if (scheibchen.length === 0) return undefined;
  pruefeKern(kern);
  const r = kern.radius | 0;
  const g = kern.groesse | 0;
  const k = kern.daten;
  const n = rasterPx | 0;
  let ebene: Raster | undefined;
  for (const s of scheibchen) {
    if (s.daten.length !== s.breite * s.hoehe) throw new BildFehler(`Scheibchen: ${s.breite * s.hoehe} Werte erwartet, ${s.daten.length} vorhanden`);
    // Gefaltetes Feld deckt Spalten [spalte - r, spalte + breite + r), Zeilen entsprechend.
    if (s.spalte + s.breite + r <= 0 || s.zeile + s.hoehe + r <= 0 || s.spalte - r >= n || s.zeile - r >= n) continue;
    ebene ??= neuesRaster(n, n, 1);
    const d = ebene.daten;
    for (let sj = 0; sj < s.hoehe; sj++) {
      for (let si = 0; si < s.breite; si++) {
        const wert = s.daten[sj * s.breite + si] as number;
        if (wert === 0) continue;
        const mx = s.spalte + si;
        const my = s.zeile + sj;
        // Kernpixel (a, b) landet bei (mx + a - r, my + b - r); nur die Teile im Raster.
        const a0 = Math.max(0, r - mx);
        const a1 = Math.min(g, n + r - mx);
        const b0 = Math.max(0, r - my);
        const b1 = Math.min(g, n + r - my);
        for (let b = b0; b < b1; b++) {
          const zeile = (my + b - r) * n + mx - r;
          const kz = b * g;
          for (let a = a0; a < a1; a++) d[zeile + a] = (d[zeile + a] as number) + wert * (k[kz + a] as number);
        }
      }
    }
  }
  return ebene;
}
