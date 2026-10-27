// male (Stufe 1, zweiter Schritt): sichtbare Punktquellen als Scheibchen malen (ADR-0002,
// docs/architektur.md Abschnitt 3, A-P6). Seit Issue #72 nicht mehr ins Objektraster, sondern je
// Punktquelle in ein eigenes kleines Feld, das punktebene.ts lokal mit derselben Gesamt-PSF faltet
// und als Punktebene neben das Objekt legt; kleine Scheibchen werden so von selbst zu Punkten,
// grosse bleiben Scheibchen, ohne Fallunterscheidung (docs/recherche/physik.md Abschnitte 7 und 14).

import type { Punktquelle, Quellbild } from "../naht/simulationsparameter";
import { BildFehler } from "./fehler";
import { eckeLinksOben } from "./quelle";

/** Unterabtastung je Achse und Pixel fuer die Flaechenanteile des Scheibchens. */
export const UNTERABTASTUNG = 8;

/** Kleinster gemalter Durchmesser in Arbeitspixeln: kleinere Scheibchen verteilen ihren Fluss auf ein Pixel Flaeche. */
export const DURCHMESSER_MIN_PX = 1;

/**
 * Eine gemalte Punktquelle: breite x hoehe Werte (zeilenweise, relativ zu Quellweiss, ein Kanal),
 * linke obere Ecke bei Spalte spalte und Zeile zeile des Arbeitsrasters. Das Feld darf ganz oder
 * teilweise ausserhalb des Rasters liegen; erst punktebene.ts schneidet nach der Faltung ab.
 */
export interface Scheibchen {
  spalte: number;
  zeile: number;
  breite: number;
  hoehe: number;
  daten: Float32Array;
}

/**
 * Malt jede Punktquelle mit sichtbar true als gleichmaessig helles Scheibchen in ein eigenes Feld
 * (Werte relativ zu Quellweiss). Der Fluss eines Scheibchens ist helligkeitRelativ mal seine Flaeche
 * in Arbeitspixeln, pi (d / 2 / massstab)^2; er wird auf die Pixel nach ihrem Flaechenanteil an
 * einem Scheibchen mit mindestens DURCHMESSER_MIN_PX Durchmesser verteilt (Unterabtastung), so
 * bleibt er auch unter einem Pixel erhalten und die Summe des Felds ist genau der Fluss. Nichts wird
 * am Rand des Arbeitsrasters abgeschnitten: auch ein Trabant knapp ausserhalb des Fensters liefert
 * ein Feld, dessen gefaltete Fluegel ins Fenster reichen koennen.
 *
 * Ohne sichtbare Punktquelle eine leere Liste. Wirft BildFehler bei nicht endlicher Position,
 * Durchmesser <= 0 oder negativer oder nicht endlicher Helligkeit.
 */
export function malePunktquellen(quellbild: Quellbild): Scheibchen[] {
  const sichtbare = quellbild.punktquellen.filter((p) => p.sichtbar);
  if (sichtbare.length === 0) return [];
  const m = quellbild.massstabArcsecProPx;
  if (!(m > 0) || !Number.isFinite(m)) throw new BildFehler(`Arbeitsmassstab muss positiv sein, nicht ${m}`);
  const n = quellbild.rasterPx;
  const ecke = eckeLinksOben({ xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec }, n, n, m);
  const ergebnis: Scheibchen[] = [];
  for (const p of sichtbare) {
    pruefePunktquelle(p);
    // Mitte in Pixelkoordinaten: Spalte i deckt [i, i + 1), Zeile j [j, j + 1), Zeile 0 ist Norden.
    const spalte = (p.xArcsec - ecke.xArcsec) / m;
    const zeile = (ecke.yArcsec - p.yArcsec) / m;
    const durchmesserPx = p.durchmesserArcsec / m;
    const fluss = p.helligkeitRelativ * Math.PI * (durchmesserPx / 2) ** 2;
    const s = maleScheibchen(spalte, zeile, Math.max(durchmesserPx, DURCHMESSER_MIN_PX) / 2, fluss);
    if (s !== undefined) ergebnis.push(s);
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
 * gezaehlt an UNTERABTASTUNG^2 Punkten je Pixel, normiert ueber alle Pixel des Felds.
 */
function maleScheibchen(spalte: number, zeile: number, radiusPx: number, fluss: number): Scheibchen | undefined {
  const i0 = Math.floor(spalte - radiusPx);
  const i1 = Math.ceil(spalte + radiusPx);
  const j0 = Math.floor(zeile - radiusPx);
  const j1 = Math.ceil(zeile + radiusPx);
  const s = UNTERABTASTUNG;
  const r2 = radiusPx * radiusPx;
  const breite = i1 - i0;
  const hoehe = j1 - j0;
  const anteile = new Uint16Array(breite * hoehe);
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
      anteile[(j - j0) * breite + (i - i0)] = n;
      gesamt += n;
    }
  }
  if (gesamt === 0) return undefined; // Radius mindestens 0,5 px trifft immer Abtastpunkte; nur zur Sicherheit.
  const daten = new Float32Array(anteile.length);
  for (let k = 0; k < anteile.length; k++) daten[k] = (fluss * (anteile[k] as number)) / gesamt;
  return { spalte: i0, zeile: j0, breite, hoehe, daten };
}
