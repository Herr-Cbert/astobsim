// rendere: aus Simulationsparametern und einer Quelle entsteht der Anblick (docs/architektur.md
// Abschnitt 3): Anblick = tonwert(falte(mittele(quelle, quellbild), kern),
// faltePunkte(male(quellbild.punktquellen), kern), helligkeit), maskiert mit gesichtsfeld, gezeichnet
// in fenster. Objekt und Punktquellen liegen seit Issue #72 in getrennten Ebenen, weil tonwert sie
// verschieden auf die Anzeige abbildet (docs/recherche/physik.md Abschnitt 14). Zwischenergebnisse
// der Stufen 1 und 2 werden nach Stufenschluessel wiederverwendet; der Aufrufer haelt dazu einen
// Zwischenspeicher.

import type { Fenster, Gesichtsfeld, Helligkeit, Simulationsparameter } from "../naht/simulationsparameter";
import type { Falter } from "./falter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import { malePunktquellen, type Scheibchen } from "./male";
import { mittele, skaliere } from "./mittele";
import { faltePunkte } from "./punktebene";
import type { Quelle } from "./quelle";
import { pruefeRaster, type Raster } from "./raster";

/**
 * Das Ergebnisbild (GLOSSARY: Anblick). Noch nicht in src/naht definiert, deshalb hier.
 * raster hat fenster.px x fenster.px Pixel, Anzeigehelligkeiten (linear, 1 = Bildschirmweiss, Quellweiss
 * erscheint als helligkeit.faktorObjekt), nicht negativ, koennen 1 ueberschreiten; Begrenzung und
 * Bit-Tiefe erst beim Zeichnen. Zeile 0 ist Norden.
 */
export interface Anblick {
  fenster: Fenster;
  /** Anzeigemassstab fenster.breiteArcsec / fenster.px. */
  massstabArcsecProPx: number;
  raster: Raster;
}

/** Behaelt je Stufe das letzte Ergebnis mit seinem Schluessel. Einer je Anzeige, vom Aufrufer als {} angelegt. */
export interface Zwischenspeicher {
  /** Gemitteltes Objektraster und die gemalten Punktquellen. */
  stufe1?: { schluessel: string; raster: Raster; scheibchen: Scheibchen[] };
  /** Gefaltetes Objektraster und die gefaltete Punktebene (undefined ohne Punktquelle im Raster). */
  stufe2?: { schluessel: string; raster: Raster; punktebene: Raster | undefined };
}

/** Relative Toleranz fuer Gleichheit von Massstaeben und Breiten, die physik gerundet liefert. */
const TOLERANZ = 1e-6;

function ungefaehrGleich(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANZ * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Wirft BildFehler bei Parametern, die den Invarianten der Naht widersprechen. */
export function pruefeParameter(p: Simulationsparameter): void {
  const { quellbild, kern, helligkeit, fenster } = p;
  pruefePositivGanz("fenster.px", fenster.px);
  if (!(fenster.breiteArcsec > 0)) throw new BildFehler(`fenster.breiteArcsec muss positiv sein, nicht ${fenster.breiteArcsec}`);
  if (!ungefaehrGleich(quellbild.rasterPx * quellbild.massstabArcsecProPx, fenster.breiteArcsec)) {
    throw new BildFehler(`rasterPx * massstab (${quellbild.rasterPx * quellbild.massstabArcsecProPx}) muss fenster.breiteArcsec (${fenster.breiteArcsec}) sein`);
  }
  if (!ungefaehrGleich(kern.massstabArcsecProPx, quellbild.massstabArcsecProPx)) {
    throw new BildFehler(`Kernmassstab ${kern.massstabArcsecProPx} muss dem Arbeitsmassstab ${quellbild.massstabArcsecProPx} gleichen`);
  }
  if (!ungefaehrGleich(quellbild.mitteXArcsec, fenster.mitteXArcsec) || !ungefaehrGleich(quellbild.mitteYArcsec, fenster.mitteYArcsec)) {
    throw new BildFehler("quellbild.mitte muss fenster.mitte gleichen");
  }
  if (!(helligkeit.faktorObjekt >= 0) || !(helligkeit.hintergrundRelativ >= 0)) {
    throw new BildFehler(`Helligkeit: faktorObjekt ${helligkeit.faktorObjekt} und hintergrundRelativ ${helligkeit.hintergrundRelativ} muessen >= 0 sein`);
  }
  if (!(helligkeit.punktFaktor >= 0) || !(helligkeit.punktExponent > 0) || !Number.isFinite(helligkeit.punktExponent)) {
    throw new BildFehler(`Helligkeit: punktFaktor ${helligkeit.punktFaktor} muss >= 0, punktExponent ${helligkeit.punktExponent} positiv sein`);
  }
}

/**
 * Stufe 3: Tonwert je Arbeitspixel, Himmel additiv ueber allem. Objekt linear:
 * faktorObjekt * objekt + hintergrundRelativ. Die Punktebene (ein Kanal, relativ zu Quellweiss) wird
 * je Pixel wie eine eigene Flaeche abgebildet und in allen Kanaelen addiert:
 * min(1, (punktFaktor * punkt)^punktExponent) (docs/recherche/physik.md Abschnitt 14). Ohne
 * Punktebene, oder wo sie 0 ist, bleibt das Ergebnis bitgleich mit dem linearen Tonwert.
 */
export function tonwert(raster: Raster, punktebene: Raster | undefined, helligkeit: Helligkeit): Raster {
  const d = raster.daten;
  const ergebnis = new Float32Array(d.length);
  const f = helligkeit.faktorObjekt;
  const h = helligkeit.hintergrundRelativ;
  for (let i = 0; i < d.length; i++) ergebnis[i] = f * (d[i] as number) + h;
  if (punktebene === undefined) return { ...raster, daten: ergebnis };
  if (punktebene.breite !== raster.breite || punktebene.hoehe !== raster.hoehe || punktebene.kanaele !== 1) {
    throw new BildFehler(`Punktebene ${punktebene.breite}x${punktebene.hoehe}x${punktebene.kanaele} passt nicht zum Raster ${raster.breite}x${raster.hoehe}`);
  }
  const p = punktebene.daten;
  const a = helligkeit.punktFaktor;
  const n = helligkeit.punktExponent;
  const kanaele = raster.kanaele | 0;
  for (let i = 0; i < p.length; i++) {
    const wert = p[i] as number;
    if (!(wert > 0)) continue;
    const w = Math.min(1, Math.pow(a * wert, n));
    for (let c = i * kanaele; c < (i + 1) * kanaele; c++) ergebnis[c] = (ergebnis[c] as number) + w;
  }
  return { ...raster, daten: ergebnis };
}

/**
 * Maske des wahren Gesichtsfelds (A-D1): Kreis oder Rechteck, zentriert auf die Fenstermitte
 * (Entscheidung Herbert 2026-10-26: die Feldblende des Okulars bleibt in der Mitte, beim
 * Verschieben nach A-D2 wandert das Objekt), Masse in Bogensekunden. Ausserhalb wird Schwarz,
 * entschieden am Pixelmittelpunkt. Pixel (i, j) hat relativ zur Fenstermitte die Mitte bei
 * ((i + 0,5) - px/2, px/2 - (j + 0,5)) * massstab.
 */
export function maskiere(raster: Raster, gesichtsfeld: Gesichtsfeld, fenster: Fenster): Raster {
  const { breite, hoehe, kanaele } = raster;
  const massstab = fenster.breiteArcsec / breite;
  const ergebnis = new Float32Array(raster.daten);
  const halbeBreite = gesichtsfeld.breiteArcsec / 2;
  const halbeHoehe = gesichtsfeld.hoeheArcsec / 2;
  const kreis = gesichtsfeld.form === "kreis";
  for (let j = 0; j < hoehe; j++) {
    const y = (hoehe / 2 - (j + 0.5)) * massstab;
    for (let i = 0; i < breite; i++) {
      const x = (i + 0.5 - breite / 2) * massstab;
      const innen = kreis
        ? (x * x) / (halbeBreite * halbeBreite) + (y * y) / (halbeHoehe * halbeHoehe) <= 1
        : Math.abs(x) <= halbeBreite && Math.abs(y) <= halbeHoehe;
      if (!innen) ergebnis.fill(0, (j * breite + i) * kanaele, (j * breite + i + 1) * kanaele);
    }
  }
  return { ...raster, daten: ergebnis };
}

/**
 * Fuehrt die Pipeline aus. Stufe 1 (Ausschnitt holen, mitteln, Trabanten malen) wird unter
 * quellbild.schluessel behalten, Stufe 2 (Faltung des Objekts mit dem Falter, der Punktebene lokal
 * in punktebene.ts) unter kern.schluessel plus quellbild.schluessel.
 * Wer den Zwischenspeicher weglaesst, rechnet alles neu. Der Zwischenspeicher gehoert zu genau
 * einer Quelle; bei Wechsel der Quelle einen neuen anlegen.
 */
export function rendere(parameter: Simulationsparameter, quelle: Quelle, falter: Falter, zwischen: Zwischenspeicher = {}): Anblick {
  pruefeParameter(parameter);
  const { quellbild, kern, helligkeit, gesichtsfeld, fenster } = parameter;

  let stufe1 = zwischen.stufe1;
  if (!stufe1 || stufe1.schluessel !== quellbild.schluessel) {
    const mitte = { xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec };
    const ausschnitt = quelle.ausschnitt(mitte, quellbild.rasterPx * quellbild.massstabArcsecProPx, quellbild.massstabArcsecProPx);
    pruefeRaster(ausschnitt.raster, "Quellausschnitt");
    stufe1 = { schluessel: quellbild.schluessel, raster: mittele(ausschnitt, quellbild), scheibchen: malePunktquellen(quellbild) };
    zwischen.stufe1 = stufe1;
    zwischen.stufe2 = undefined;
  }

  const schluessel2 = `${kern.schluessel}|${quellbild.schluessel}`;
  let stufe2 = zwischen.stufe2;
  if (!stufe2 || stufe2.schluessel !== schluessel2) {
    stufe2 = {
      schluessel: schluessel2,
      raster: falter.falte(stufe1.raster, kern),
      punktebene: faltePunkte(stufe1.scheibchen, kern, stufe1.raster.breite)
    };
    zwischen.stufe2 = stufe2;
  }

  const getont = tonwert(stufe2.raster, stufe2.punktebene, helligkeit);
  const raster = maskiere(skaliere(getont, fenster.px), gesichtsfeld, fenster);
  return { fenster, massstabArcsecProPx: fenster.breiteArcsec / fenster.px, raster };
}
