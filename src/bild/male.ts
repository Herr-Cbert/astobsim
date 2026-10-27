// male (Stufe 1, zweiter Schritt): sichtbare Punktquellen vor der Faltung als Scheibchen ins
// Arbeitsraster malen (ADR-0002, docs/architektur.md Abschnitt 3, A-P6). Danach faltet bild sie mit
// derselben Gesamt-PSF wie das Objekt; kleine Scheibchen werden so von selbst zu Punkten, grosse
// bleiben Scheibchen, ohne Fallunterscheidung (docs/recherche/physik.md Abschnitt 7).

import type { Punktquelle, Quellbild } from "../naht/simulationsparameter";
import { BildFehler } from "./fehler";
import { eckeLinksOben } from "./quelle";
import { pruefeRaster, type Raster } from "./raster";

/** Unterabtastung je Achse und Pixel fuer die Flaechenanteile des Scheibchens. */
export const UNTERABTASTUNG = 8;

/** Kleinster gemalter Durchmesser in Arbeitspixeln: kleinere Scheibchen verteilen ihren Fluss auf ein Pixel Flaeche. */
export const DURCHMESSER_MIN_PX = 1;

/**
 * Malt jede Punktquelle mit sichtbar true als gleichmaessig helles Scheibchen ins Raster (Werte
 * relativ zu Quellweiss, additiv, in allen Kanaelen gleich). Der Fluss eines Scheibchens ist
 * helligkeitRelativ mal seine Flaeche in Arbeitspixeln, pi (d / 2 / massstab)^2; er wird auf die
 * Pixel nach ihrem Flaechenanteil an einem Scheibchen mit mindestens DURCHMESSER_MIN_PX Durchmesser
 * verteilt (Unterabtastung), so bleibt er auch unter einem Pixel erhalten. Pixel ausserhalb des
 * Rasters fallen weg: ein Trabant ausserhalb des Fensters wird nicht gemalt, einer am Rand nur zum
 * Teil, einer ausserhalb der Quellbild-Flaeche, aber im Fenster, ganz.
 *
 * Ohne sichtbare Punktquelle kommt das Raster selbst zurueck, sonst eine Kopie. Wirft BildFehler bei
 * nicht endlicher Position, Durchmesser <= 0 oder negativer oder nicht endlicher Helligkeit.
 */
export function malePunktquellen(raster: Raster, quellbild: Quellbild): Raster {
  const sichtbare = quellbild.punktquellen.filter((p) => p.sichtbar);
  if (sichtbare.length === 0) return raster;
  pruefeRaster(raster, "Raster fuer malePunktquellen");
  const m = quellbild.massstabArcsecProPx;
  if (!(m > 0) || !Number.isFinite(m)) throw new BildFehler(`Arbeitsmassstab muss positiv sein, nicht ${m}`);
  const ecke = eckeLinksOben({ xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec }, raster.breite, raster.hoehe, m);
  const ergebnis: Raster = { ...raster, daten: new Float32Array(raster.daten) };
  for (const p of sichtbare) {
    pruefePunktquelle(p);
    // Mitte in Pixelkoordinaten: Spalte i deckt [i, i + 1), Zeile j [j, j + 1), Zeile 0 ist Norden.
    const spalte = (p.xArcsec - ecke.xArcsec) / m;
    const zeile = (ecke.yArcsec - p.yArcsec) / m;
    const durchmesserPx = p.durchmesserArcsec / m;
    const fluss = p.helligkeitRelativ * Math.PI * (durchmesserPx / 2) ** 2;
    maleScheibchen(ergebnis, spalte, zeile, Math.max(durchmesserPx, DURCHMESSER_MIN_PX) / 2, fluss);
  }
  return ergebnis;
}

function pruefePunktquelle(p: Punktquelle): void {
  if (!Number.isFinite(p.xArcsec) || !Number.isFinite(p.yArcsec)) {
    throw new BildFehler(`Punktquelle ${p.name}: Position (${p.xArcsec}, ${p.yArcsec}) ist nicht endlich`);
  }
  if (!(p.durchmesserArcsec > 0) || !Number.isFinite(p.durchmesserArcsec)) {
    throw new BildFehler(`Punktquelle ${p.name}: Durchmesser muss positiv sein, nicht ${p.durchmesserArcsec}`);
  }
  if (!(p.helligkeitRelativ >= 0) || !Number.isFinite(p.helligkeitRelativ)) {
    throw new BildFehler(`Punktquelle ${p.name}: helligkeitRelativ muss >= 0 sein, nicht ${p.helligkeitRelativ}`);
  }
}

/**
 * Verteilt fluss auf die Pixel nach ihrem Flaechenanteil am Kreis um (spalte, zeile) mit radiusPx,
 * gezaehlt an UNTERABTASTUNG^2 Punkten je Pixel. Normiert wird ueber alle Pixel, auch die
 * ausserhalb des Rasters, damit ein angeschnittenes Scheibchen innen seine Helligkeit behaelt.
 */
function maleScheibchen(raster: Raster, spalte: number, zeile: number, radiusPx: number, fluss: number): void {
  const breite = raster.breite | 0;
  const hoehe = raster.hoehe | 0;
  const kanaele = raster.kanaele | 0;
  const i0 = Math.floor(spalte - radiusPx);
  const i1 = Math.ceil(spalte + radiusPx);
  const j0 = Math.floor(zeile - radiusPx);
  const j1 = Math.ceil(zeile + radiusPx);
  if (i1 <= 0 || j1 <= 0 || i0 >= breite || j0 >= hoehe) return;

  const s = UNTERABTASTUNG;
  const r2 = radiusPx * radiusPx;
  const nx = i1 - i0;
  const anteile = new Uint16Array(nx * (j1 - j0));
  let gesamt = 0;
  for (let j = j0; j < j1; j++) {
    for (let i = i0; i < i1; i++) {
      let n = 0;
      for (let b = 0; b < s; b++) {
        const dy = j + (b + 0.5) / s - zeile;
        for (let a = 0; a < s; a++) {
          const dx = i + (a + 0.5) / s - spalte;
          if (dx * dx + dy * dy <= r2) n++;
        }
      }
      anteile[(j - j0) * nx + (i - i0)] = n;
      gesamt += n;
    }
  }
  if (gesamt === 0) return; // Radius mindestens 0,5 px trifft immer Abtastpunkte; nur zur Sicherheit.

  const d = raster.daten;
  for (let j = Math.max(j0, 0); j < Math.min(j1, hoehe); j++) {
    for (let i = Math.max(i0, 0); i < Math.min(i1, breite); i++) {
      const n = anteile[(j - j0) * nx + (i - i0)] as number;
      if (n === 0) continue;
      const wert = (fluss * n) / gesamt;
      const von = (j * breite + i) * kanaele;
      for (let c = 0; c < kanaele; c++) d[von + c] = (d[von + c] as number) + wert;
    }
  }
}
