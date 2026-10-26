// Flaechiges Mitteln und Skalieren von Rastern. Stufe 1 der Pipeline (Quellausschnitt auf das
// Arbeitsraster mitteln, ADR-0002 "flaechig auf dieses Raster gemittelt") und Stufe 4
// (Arbeitsraster auf das Fenster bringen). Reine Funktionen, kein DOM.

import type { Quellbild } from "../naht/simulationsparameter";
import { BildFehler } from "./fehler";
import type { Quellausschnitt } from "./quelle";
import { neuesRaster, pruefeRaster, type Raster } from "./raster";

/**
 * Ueberdeckung einer Zielachse mit der Quellachse: Zielpixel i deckt in Quellpixeln das
 * Intervall [anfang + i * schritt, anfang + (i + 1) * schritt) ab. Je Zielpixel die Quellindizes
 * und ihre Gewichte (Anteil am Zielpixel). Quellpixel ausserhalb [0, quellAnzahl) fehlen, ihre
 * Gewichte sind 0: ausserhalb der Quelle ist Schwarz.
 */
interface Ueberdeckung {
  erster: Int32Array;
  anzahl: Int32Array;
  start: Int32Array;
  gewicht: Float64Array;
}

function ueberdeckung(zielAnzahl: number, anfang: number, schritt: number, quellAnzahl: number): Ueberdeckung {
  const erster = new Int32Array(zielAnzahl);
  const anzahl = new Int32Array(zielAnzahl);
  const start = new Int32Array(zielAnzahl);
  const gewichte: number[] = [];
  for (let i = 0; i < zielAnzahl; i++) {
    const a = anfang + i * schritt;
    const b = a + schritt;
    const u0 = Math.max(0, Math.floor(a));
    const u1 = Math.min(quellAnzahl, Math.ceil(b));
    erster[i] = u0;
    start[i] = gewichte.length;
    for (let u = u0; u < u1; u++) {
      gewichte.push((Math.min(b, u + 1) - Math.max(a, u)) / schritt);
    }
    anzahl[i] = Math.max(0, u1 - u0);
  }
  return { erster, anzahl, start, gewicht: Float64Array.from(gewichte) };
}

/**
 * Mittelt das Raster flaechig auf breiteNeu x hoeheNeu Pixel. Zielpixel (i, j) deckt in
 * Quellpixeln [spalteAnfang + i * spalteSchritt, +spalteSchritt) x [zeileAnfang + j * zeileSchritt,
 * +zeileSchritt) ab. Separabel in zwei Durchgaengen, Aufwand linear in Quell- plus Zielgroesse.
 */
export function mittleFlaechig(
  quelle: Raster,
  breiteNeu: number,
  hoeheNeu: number,
  spalteAnfang: number,
  spalteSchritt: number,
  zeileAnfang: number,
  zeileSchritt: number
): Raster {
  pruefeRaster(quelle, "Quelle fuer mittleFlaechig");
  const k = quelle.kanaele;
  const spalten = ueberdeckung(breiteNeu, spalteAnfang, spalteSchritt, quelle.breite);
  const zeilen = ueberdeckung(hoeheNeu, zeileAnfang, zeileSchritt, quelle.hoehe);
  const ziel = neuesRaster(breiteNeu, hoeheNeu, k);
  const q = quelle.daten;

  // Durchgang 1: Spalten mitteln, Zeilen der Quelle behalten.
  const zwischen = new Float64Array(quelle.hoehe * breiteNeu * k);
  for (let v = 0; v < quelle.hoehe; v++) {
    const zeileVon = v * quelle.breite * k;
    const zwischenVon = v * breiteNeu * k;
    for (let i = 0; i < breiteNeu; i++) {
      const n = spalten.anzahl[i] as number;
      const u0 = spalten.erster[i] as number;
      const g0 = spalten.start[i] as number;
      for (let c = 0; c < k; c++) {
        let s = 0;
        for (let t = 0; t < n; t++) {
          s += (spalten.gewicht[g0 + t] as number) * (q[zeileVon + (u0 + t) * k + c] as number);
        }
        zwischen[zwischenVon + i * k + c] = s;
      }
    }
  }

  // Durchgang 2: Zeilen mitteln.
  const z = ziel.daten;
  for (let j = 0; j < hoeheNeu; j++) {
    const n = zeilen.anzahl[j] as number;
    const v0 = zeilen.erster[j] as number;
    const g0 = zeilen.start[j] as number;
    const zielVon = j * breiteNeu * k;
    for (let t = 0; t < n; t++) {
      const g = zeilen.gewicht[g0 + t] as number;
      const von = (v0 + t) * breiteNeu * k;
      for (let i = 0; i < breiteNeu * k; i++) {
        z[zielVon + i] = (z[zielVon + i] as number) + g * (zwischen[von + i] as number);
      }
    }
  }
  return ziel;
}

/**
 * Stufe 1: den Quellausschnitt flaechig auf das Arbeitsraster des Quellbilds mitteln.
 * Ergebnis: rasterPx x rasterPx Pixel im Arbeitsmassstab, Mitte bei quellbild.mitte, Zeile 0 Norden.
 */
export function mittele(ausschnitt: Quellausschnitt, quellbild: Quellbild): Raster {
  const m = quellbild.massstabArcsecProPx;
  const ms = ausschnitt.massstabArcsecProPx;
  const n = quellbild.rasterPx;
  if (!(m > 0) || !(ms > 0)) throw new BildFehler(`Massstaebe muessen positiv sein: Arbeit ${m}, Quelle ${ms}`);
  if (!Number.isInteger(n) || n <= 0) throw new BildFehler(`rasterPx muss eine positive ganze Zahl sein, nicht ${n}`);
  const linksArbeit = quellbild.mitteXArcsec - (n * m) / 2;
  const obenArbeit = quellbild.mitteYArcsec + (n * m) / 2;
  // Zielpixel (i, j) in Quellpixelkoordinaten: Spalten wachsen nach rechts (+x), Zeilen nach Sueden (-y).
  const spalteAnfang = (linksArbeit - ausschnitt.linksXArcsec) / ms;
  const zeileAnfang = (ausschnitt.obenYArcsec - obenArbeit) / ms;
  return mittleFlaechig(ausschnitt.raster, n, n, spalteAnfang, m / ms, zeileAnfang, m / ms);
}

/**
 * Stufe 4: quadratisches Raster auf px x px Pixel bringen, Bildflaeche bleibt gleich (beide
 * decken fenster.breiteArcsec ab). Vergroessern bilinear (das Arbeitsraster ist durch den Kern
 * glatt, Arbeitsmassstab >= FWHM / 2,5), Verkleinern flaechig gemittelt.
 */
export function skaliere(raster: Raster, px: number): Raster {
  pruefeRaster(raster, "Raster fuer skaliere");
  if (!Number.isInteger(px) || px <= 0) throw new BildFehler(`Fensterbreite muss eine positive ganze Zahl sein, nicht ${px}`);
  if (raster.breite === px && raster.hoehe === px) return raster;
  if (px < raster.breite || px < raster.hoehe) {
    return mittleFlaechig(raster, px, px, 0, raster.breite / px, 0, raster.hoehe / px);
  }
  const k = raster.kanaele;
  const ziel = neuesRaster(px, px, k);
  const q = raster.daten;
  const z = ziel.daten;
  const fx = raster.breite / px;
  const fy = raster.hoehe / px;
  for (let j = 0; j < px; j++) {
    const sy = Math.min(raster.hoehe - 1, Math.max(0, (j + 0.5) * fy - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(raster.hoehe - 1, y0 + 1);
    const ty = sy - y0;
    for (let i = 0; i < px; i++) {
      const sx = Math.min(raster.breite - 1, Math.max(0, (i + 0.5) * fx - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(raster.breite - 1, x0 + 1);
      const tx = sx - x0;
      const i00 = (y0 * raster.breite + x0) * k;
      const i01 = (y0 * raster.breite + x1) * k;
      const i10 = (y1 * raster.breite + x0) * k;
      const i11 = (y1 * raster.breite + x1) * k;
      const ziel0 = (j * px + i) * k;
      for (let c = 0; c < k; c++) {
        const oben = (q[i00 + c] as number) * (1 - tx) + (q[i01 + c] as number) * tx;
        const unten = (q[i10 + c] as number) * (1 - tx) + (q[i11 + c] as number) * tx;
        z[ziel0 + c] = oben * (1 - ty) + unten * ty;
      }
    }
  }
  return ziel;
}
