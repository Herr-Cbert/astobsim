// Punktebene (Issue #72): die gemalten Punktquellen (male.ts) lokal mit dem Kern falten und in eine
// eigene Ebene im Arbeitsraster legen, die tonwert getrennt vom Objekt auf die Anzeige abbildet
// (docs/recherche/physik.md Abschnitt 14, docs/architektur.md Abschnitt 3). Die Faltung laeuft
// direkt in JavaScript mit kern.daten, nur um jedes Scheibchen: Kern hoechstens 81 px, Scheibchen
// wenige Pixel, also wenige Millisekunden. Die Falter (JS, WebGL2) bleiben unberuehrt.
// Version 2 (docs/architektur.md 5.3): bei Bedarf dazu die dreikanalige Faerbung, Fluss mal Deckkraft
// mal Farbe je Scheibchen, mit demselben Kern und auf demselben Weg gefaltet.

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
  return falteInEbene(scheibchen, kern, rasterPx, 1);
}

/**
 * true, wenn ein Scheibchen eine Farbe oder eine Deckkraft unter 1 traegt; nur dann braucht tonwert
 * die Faerbung (ohne sie ist der Punktanteil der aus Version 1).
 */
export function brauchtFaerbung(scheibchen: readonly Scheibchen[]): boolean {
  return scheibchen.some((s) => s.farbe !== undefined || s.deckkraft !== 1);
}

/**
 * Faerbung: wie faltePunkte, aber drei Kanaele, jedes Scheibchen mit deckkraft * farbe_k gewichtet
 * (farbe fehlt = grau 1, 1, 1). Fuer ein graues Scheibchen mit Deckkraft 1 ist jeder Kanal bitgleich
 * mit der Punktebene, tonwert rechnet dort c_k / p = 1. undefined wie bei faltePunkte.
 */
export function falteFaerbung(scheibchen: readonly Scheibchen[], kern: Kern, rasterPx: number): Raster | undefined {
  return falteInEbene(scheibchen, kern, rasterPx, 3);
}

function falteInEbene(scheibchen: readonly Scheibchen[], kern: Kern, rasterPx: number, kanaele: 1 | 3): Raster | undefined {
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
    // Masse mit | 0 lesen (V8: Gleitkomma-Masse praegen sonst die Feldrepraesentation).
    const spalte = s.spalte | 0;
    const zeile0 = s.zeile | 0;
    const breite = s.breite | 0;
    const hoehe = s.hoehe | 0;
    // Gefaltetes Feld deckt Spalten [spalte - r, spalte + breite + r), Zeilen entsprechend.
    if (spalte + breite + r <= 0 || zeile0 + hoehe + r <= 0 || spalte - r >= n || zeile0 - r >= n) continue;
    ebene ??= neuesRaster(n, n, kanaele);
    const d = ebene.daten;
    const farbe = s.farbe;
    const g0 = s.deckkraft * (farbe === undefined ? 1 : farbe[0]);
    const g1 = s.deckkraft * (farbe === undefined ? 1 : farbe[1]);
    const g2 = s.deckkraft * (farbe === undefined ? 1 : farbe[2]);
    for (let sj = 0; sj < hoehe; sj++) {
      for (let si = 0; si < breite; si++) {
        const wert = s.daten[sj * breite + si] as number;
        if (wert === 0) continue;
        const mx = spalte + si;
        const my = zeile0 + sj;
        // Kernpixel (a, b) landet bei (mx + a - r, my + b - r); nur die Teile im Raster.
        const a0 = Math.max(0, r - mx);
        const a1 = Math.min(g, n + r - mx);
        const b0 = Math.max(0, r - my);
        const b1 = Math.min(g, n + r - my);
        if (kanaele === 1) {
          for (let b = b0; b < b1; b++) {
            const zeile = (my + b - r) * n + mx - r;
            const kz = b * g;
            for (let a = a0; a < a1; a++) d[zeile + a] = (d[zeile + a] as number) + wert * (k[kz + a] as number);
          }
        } else {
          const w0 = wert * g0;
          const w1 = wert * g1;
          const w2 = wert * g2;
          for (let b = b0; b < b1; b++) {
            const zeile = (my + b - r) * n + mx - r;
            const kz = b * g;
            for (let a = a0; a < a1; a++) {
              const z = 3 * (zeile + a);
              const kw = k[kz + a] as number;
              d[z] = (d[z] as number) + w0 * kw;
              d[z + 1] = (d[z + 1] as number) + w1 * kw;
              d[z + 2] = (d[z + 2] as number) + w2 * kw;
            }
          }
        }
      }
    }
  }
  return ebene;
}
