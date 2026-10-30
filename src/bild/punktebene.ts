// Punktebene (Issue #72): die gemalten Punktquellen (male.ts) lokal mit dem Kern falten und in eine
// eigene Ebene im Arbeitsraster legen, die tonwert getrennt vom Objekt auf die Anzeige abbildet
// (docs/recherche/physik.md Abschnitt 14, docs/architektur.md Abschnitt 3). Die Faltung laeuft
// direkt in JavaScript mit kern.daten, nur um jedes Scheibchen: Kern hoechstens 81 px, Scheibchen
// wenige Pixel, also wenige Millisekunden. Die Falter (JS, WebGL2) bleiben unberuehrt.
// Version 2 (docs/architektur.md 5.3): bei Bedarf dazu die dreikanalige Faerbung, Fluss mal Deckkraft
// mal Farbe je Scheibchen, mit demselben Kern und auf demselben Weg gefaltet.
//
// Weicher Rand (Issue #109): Der Kern der Naht endet hart beim Radius (3 Gesamt-FWHM, quadratisch).
// Fuer die Flaeche ist das unsichtbar, fuer Punkte nicht: tonwert hebt den Randwert mit
// W = min(1, (aP * p)^(1/3)) auf etwa ein Zehntel des Scheitels, danach faellt er hart auf 0
// (Quadrate um helle Sterne, Farbkante zwischen zwei Sternen). Die Punktebene faltet deshalb mit
// ausgeblendetKern: der Kern mal einem cos^2-Fenster ueber das aeussere Drittel des Radius (etwa
// die aeussere Gesamt-FWHM), rund statt quadratisch, neu auf Summe 1 normiert (Fluss bleibt).
// Begruendung und Grenzen: docs/recherche/physik.md Abschnitt 24.
// Dasselbe Fenster, hoch 1/n, liefert halokern fuer den Mischanteil des Falls unaufgeloest in
// tonwert (Issue #135, physik.md Abschnitt 28).

import type { Kern } from "../naht/simulationsparameter";
import { pruefeKern } from "./falter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import type { Scheibchen } from "./male";
import { neuesRaster, type Raster } from "./raster";

/**
 * Faltet jedes Scheibchen mit dem ausgeblendeten Kern (ausgeblendetKern; echte Faltung; die Kerne der Naht sind punktsymmetrisch)
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

/** Das Fenster beginnt bei diesem Anteil des Kernradius (aeusseres Drittel, etwa eine Gesamt-FWHM). */
const FENSTER_ANFANG_PRO_RADIUS = 2 / 3;
/** Das Fenster erreicht 0 einen halben Pixel ausserhalb des Radius: die Pixel auf der Achse bleiben knapp ueber 0. */
const FENSTER_ENDE_ZUSATZ_PX = 0.5;

const ausgeblendet = new WeakMap<Kern, Float32Array>();

/**
 * Randfenster w(rho) aus physik.md Abschnitt 24: 1 bis rho0 = 2/3 Radius, dann
 * cos^2(pi/2 * (rho - rho0) / (rhoE - rho0)) bis rhoE = Radius + 0,5 px, darueber 0 (rho Abstand
 * zur Kernmitte in Pixeln).
 */
function randfenster(rho: number, r: number): number {
  const rho0 = FENSTER_ANFANG_PRO_RADIUS * r;
  const rhoE = r + FENSTER_ENDE_ZUSATZ_PX;
  return rho <= rho0 ? 1 : rho >= rhoE ? 0 : Math.cos(((Math.PI / 2) * (rho - rho0)) / (rhoE - rho0)) ** 2;
}

/**
 * Kerndaten fuer die Punktebene: kern.daten mal w(rho), w = 1 bis rho0 = 2/3 Radius, dann
 * cos^2(pi/2 * (rho - rho0) / (rhoE - rho0)) bis rhoE = Radius + 0,5 px, darueber 0 (rho Abstand
 * zur Kernmitte in Pixeln); danach auf die Summe der urspruenglichen Daten normiert, so dass der
 * Fluss erhalten bleibt. Ein Delta (Radius 0, Vergleichsbild) bleibt unveraendert. Zwischengespeichert je Kern.
 */
export function ausgeblendetKern(kern: Kern): Float32Array {
  const fertig = ausgeblendet.get(kern);
  if (fertig !== undefined) return fertig;
  const r = kern.radius | 0;
  const g = kern.groesse | 0;
  const daten = new Float32Array(kern.daten.length);
  let vorher = 0;
  let nachher = 0;
  for (let b = 0; b < g; b++) {
    for (let a = 0; a < g; a++) {
      const i = b * g + a;
      const wert = kern.daten[i] as number;
      const w = randfenster(Math.hypot(a - r, b - r), r);
      vorher += wert;
      nachher += wert * w;
      daten[i] = wert * w;
    }
  }
  if (nachher > 0) {
    const faktor = vorher / nachher;
    for (let i = 0; i < daten.length; i++) daten[i] = (daten[i] as number) * faktor;
  } else {
    daten.set(kern.daten);
  }
  ausgeblendet.set(kern, daten);
  return daten;
}

const halokerne = new WeakMap<Kern, { exponent: number; kern: Kern }>();

/**
 * Kern fuer den Mischanteil g min(1, (aP q)^n) des Falls unaufgeloest (Issue #135, physik.md
 * Abschnitt 28): kern.daten mal w(rho)^(1/n) mit dem Randfenster aus Abschnitt 24, nicht neu
 * normiert. Fuer einen Punkt ist dann (aP (k w^(1/n)))^n = (aP k)^n w: das Fenster wirkt auf den
 * angezeigten Halo, der so weich bis auf den Himmel auslaeuft. Innen (rho <= 2/3 Radius) bleiben
 * die Werte bitgleich, der Scheitel aendert sich also nicht. Schluessel kern.schluessel plus
 * "|halo|" plus n. Zwischengespeichert je Kern (fuer den letzten Exponenten).
 */
export function halokern(kern: Kern, n: number): Kern {
  const fertig = halokerne.get(kern);
  if (fertig !== undefined && fertig.exponent === n) return fertig.kern;
  const r = kern.radius | 0;
  const g = kern.groesse | 0;
  const p = 1 / n;
  const daten = new Float32Array(kern.daten.length);
  for (let b = 0; b < g; b++) {
    for (let a = 0; a < g; a++) {
      const i = b * g + a;
      const w = randfenster(Math.hypot(a - r, b - r), r);
      daten[i] = w === 1 ? (kern.daten[i] as number) : (kern.daten[i] as number) * w ** p;
    }
  }
  const ergebnis: Kern = { ...kern, schluessel: `${kern.schluessel}|halo|${n}`, daten };
  halokerne.set(kern, { exponent: n, kern: ergebnis });
  return ergebnis;
}

function falteInEbene(scheibchen: readonly Scheibchen[], kern: Kern, rasterPx: number, kanaele: 1 | 3): Raster | undefined {
  pruefePositivGanz("rasterPx", rasterPx);
  if (scheibchen.length === 0) return undefined;
  pruefeKern(kern);
  const r = kern.radius | 0;
  const g = kern.groesse | 0;
  const k = ausgeblendetKern(kern);
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
