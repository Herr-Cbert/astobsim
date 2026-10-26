// rendere: aus Simulationsparametern und einer Quelle entsteht der Anblick (docs/architektur.md
// Abschnitt 3): Anblick = tonwert(falte(male(mittele(quelle, quellbild)), kern), helligkeit),
// maskiert mit gesichtsfeld, gezeichnet in fenster. Zwischenergebnisse der Stufen 1 und 2 werden
// nach Stufenschluessel wiederverwendet; der Aufrufer haelt dazu einen Zwischenspeicher.

import type { Fenster, Gesichtsfeld, Helligkeit, Quellbild, Simulationsparameter } from "../naht/simulationsparameter";
import type { Falter } from "./falter";
import { BildFehler } from "./fehler";
import { mittele, skaliere } from "./mittele";
import type { Quelle } from "./quelle";
import { pruefeRaster, type Raster } from "./raster";

/**
 * Das Ergebnisbild (GLOSSARY: Anblick). Noch nicht in src/naht definiert, deshalb hier.
 * raster hat fenster.px x fenster.px Pixel, Werte relativ zu Quellweiss, linear, nicht negativ,
 * koennen 1 ueberschreiten; Begrenzung und Bit-Tiefe erst beim Zeichnen. Zeile 0 ist Norden.
 */
export interface Anblick {
  fenster: Fenster;
  /** Anzeigemassstab fenster.breiteArcsec / fenster.px. */
  massstabArcsecProPx: number;
  raster: Raster;
}

/** Behaelt je Stufe das letzte Ergebnis mit seinem Schluessel. Einer je Anzeige, vom Aufrufer gehalten. */
export interface Zwischenspeicher {
  stufe1?: { schluessel: string; raster: Raster };
  stufe2?: { schluessel: string; raster: Raster };
}

export function neuerZwischenspeicher(): Zwischenspeicher {
  return {};
}

/** Relative Toleranz fuer Gleichheit von Massstaeben und Breiten, die physik gerundet liefert. */
const TOLERANZ = 1e-6;

function ungefaehrGleich(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANZ * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Wirft BildFehler bei Parametern, die den Invarianten der Naht widersprechen. */
export function pruefeParameter(p: Simulationsparameter): void {
  const { quellbild, kern, helligkeit, fenster } = p;
  if (!Number.isInteger(fenster.px) || fenster.px <= 0) throw new BildFehler(`fenster.px muss eine positive ganze Zahl sein, nicht ${fenster.px}`);
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
}

/**
 * Trabanten als Scheibchen ins Arbeitsraster malen. Platzhalter: kommt mit #14, bis dahin bleibt
 * das Raster unveraendert. Vorgesehen: fuer jede Punktquelle mit sichtbar true ein Scheibchen
 * mit durchmesserArcsec / massstab Pixeln an (xArcsec, yArcsec), Wert helligkeitRelativ.
 */
export function malePunktquellen(raster: Raster, _quellbild: Quellbild): Raster {
  return raster;
}

/** Stufe 3: Tonwert, nur Multiplikation und Addition. Himmel liegt additiv ueber allem. */
export function tonwert(raster: Raster, helligkeit: Helligkeit): Raster {
  const d = raster.daten;
  const ergebnis = new Float32Array(d.length);
  const f = helligkeit.faktorObjekt;
  const h = helligkeit.hintergrundRelativ;
  for (let i = 0; i < d.length; i++) ergebnis[i] = f * (d[i] as number) + h;
  return { ...raster, daten: ergebnis };
}

/**
 * Maske des wahren Gesichtsfelds (A-D1): Kreis oder Rechteck, zentriert auf Objektkoordinate 0/0
 * (Naht), Masse in Bogensekunden. Ausserhalb wird Schwarz, entschieden am Pixelmittelpunkt.
 * Das Raster deckt fenster ab; Pixel (i, j) hat die Mitte bei fenster.mitte + ((i + 0,5) - px/2, px/2 - (j + 0,5)) * massstab.
 */
export function maskiere(raster: Raster, gesichtsfeld: Gesichtsfeld, fenster: Fenster): Raster {
  const { breite, hoehe, kanaele } = raster;
  const massstab = fenster.breiteArcsec / breite;
  const ergebnis = new Float32Array(raster.daten);
  const halbeBreite = gesichtsfeld.breiteArcsec / 2;
  const halbeHoehe = gesichtsfeld.hoeheArcsec / 2;
  const kreis = gesichtsfeld.form === "kreis";
  for (let j = 0; j < hoehe; j++) {
    const y = fenster.mitteYArcsec + (hoehe / 2 - (j + 0.5)) * massstab;
    for (let i = 0; i < breite; i++) {
      const x = fenster.mitteXArcsec + (i + 0.5 - breite / 2) * massstab;
      const innen = kreis
        ? (x * x) / (halbeBreite * halbeBreite) + (y * y) / (halbeHoehe * halbeHoehe) <= 1
        : Math.abs(x) <= halbeBreite && Math.abs(y) <= halbeHoehe;
      if (!innen) ergebnis.fill(0, (j * breite + i) * kanaele, (j * breite + i + 1) * kanaele);
    }
  }
  return { ...raster, daten: ergebnis };
}

/**
 * Fuehrt die Pipeline aus. Stufe 1 (Ausschnitt holen, mitteln, Trabanten) wird unter
 * quellbild.schluessel behalten, Stufe 2 (Faltung) unter kern.schluessel plus quellbild.schluessel.
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
    const raster = malePunktquellen(mittele(ausschnitt, quellbild), quellbild);
    stufe1 = { schluessel: quellbild.schluessel, raster };
    zwischen.stufe1 = stufe1;
    zwischen.stufe2 = undefined;
  }

  const schluessel2 = `${kern.schluessel}|${quellbild.schluessel}`;
  let stufe2 = zwischen.stufe2;
  if (!stufe2 || stufe2.schluessel !== schluessel2) {
    stufe2 = { schluessel: schluessel2, raster: falter.falte(stufe1.raster, kern) };
    zwischen.stufe2 = stufe2;
  }

  const getont = tonwert(stufe2.raster, helligkeit);
  const raster = maskiere(skaliere(getont, fenster.px), gesichtsfeld, fenster);
  return { fenster, massstabArcsecProPx: fenster.breiteArcsec / fenster.px, raster };
}
