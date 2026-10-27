// Zoomansicht (A-D3, Issue #20): welches Fenster der Zoom zeigt, wann er sich verschieben laesst
// und mit welchen Parametern das Vergleichsbild entsteht. Reine Funktionen ohne DOM; die
// Steuerung rechnet damit, zoomansicht.ts zeichnet. Der Zoom ist nur ein anderes Fenster
// (docs/architektur.md Abschnitt 3): auswerten bekommt fenster und vorher, sonst nichts Neues.
//
// Koordinaten wie in der Naht: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Bogensekunden.

import type { Kern, Simulationsparameter } from "../naht/simulationsparameter";
import { atmosphaere, aufloesung, type Konfiguration, optik } from "../physik";
import type { Mitte } from "./verschieben";
import { verschiebbar } from "./verschieben";

/** Rand um das Objekt im Zoom als Anteil seiner Ausdehnung, je Seite. */
export const ZOOM_RAND = 0.05;
/**
 * Der Zoom zeigt hoechstens diesen Anteil der kuerzeren Seite des Gesichtsfelds, vergroessert also
 * mindestens zweifach. So schneidet die Feldblende im Zoom nie (halbe Diagonale < halbes Feld),
 * und grosse Objekte (Mond) werden auch dann vergroessert, wenn sie das Feld ganz fuellen.
 */
export const ZOOM_ANTEIL_GESICHTSFELD_MAX = 0.5;
/**
 * Kleinste Zoombreite in Arbeitspixeln (Arbeitsmassstab ohne Fenster: Quellpixel oder
 * Gesamt-FWHM / 2,5). Haelt winzige Objekte (Mars 6") beurteilbar und das Fenster breiter als
 * ein Arbeitspixel (sonst PhysikFehler in auswerten).
 */
export const ZOOM_ARBEITSPIXEL_MIN = 16;
/** Arbeitspixel je Gesamt-FWHM, wie arbeitsmassstab in physik (ADR-0002). */
const ARBEITSPIXEL_PRO_FWHM = 2.5;

/**
 * Ausdehnung des Objekts in Bogensekunden: der groessere Wert aus Durchmesser und Quellbild
 * (Breite und Hoehe mal Massstab). Das Quellbild umfasst auch die Ringe des Saturn, die im
 * Durchmesser nicht stecken, und liegt sonst knapp um die Scheibe.
 */
export function objektausdehnungArcsec(k: Konfiguration): number {
  const { durchmesserArcsec, quelle } = k.objekt;
  return Math.max(durchmesserArcsec, quelle.breitePx * quelle.massstabArcsecProPx, quelle.hoehePx * quelle.massstabArcsecProPx);
}

/**
 * Breite des Zoomfensters: das Objekt mit Rand, hoechstens die Haelfte des Gesichtsfelds,
 * mindestens ZOOM_ARBEITSPIXEL_MIN Arbeitspixel. Wirft wie optik bei unlesbarem Geraet.
 */
export function zoombreiteArcsec(k: Konfiguration): number {
  const o = optik(k.geraet);
  const feld = Math.min(o.gesichtsfeld.breiteArcsec, o.gesichtsfeld.hoeheArcsec);
  const aufl = aufloesung(o, atmosphaere(k.bedingungen));
  const arbeitspixel = Math.max(k.objekt.quelle.massstabArcsecProPx, aufl.gesamtFwhmArcsec / ARBEITSPIXEL_PRO_FWHM);
  const breite = Math.min(objektausdehnungArcsec(k) * (1 + 2 * ZOOM_RAND), feld * ZOOM_ANTEIL_GESICHTSFELD_MAX);
  return Math.max(breite, arbeitspixel * ZOOM_ARBEITSPIXEL_MIN);
}

/** Fenster des Zooms: Zoombreite um die Fenstermitte der Steuerung, px Anzeigepixel. */
export function zoomfenster(k: Konfiguration, mitte: Mitte, px: number): Simulationsparameter["fenster"] {
  return { breiteArcsec: zoombreiteArcsec(k), mitteXArcsec: mitte.xArcsec, mitteYArcsec: mitte.yArcsec, px };
}

/** Lage fuer das Verschieben in der gerade gezeigten Ansicht. */
export interface Verschiebelage {
  /** Durchmesser des Objekts (Grenze der Mitte, verschieben.ts). */
  durchmesser: number;
  /** Breite des gezeigten Fensters in Bogensekunden (Massstab beim Ziehen, Tastenschritt). */
  breite: number;
  erlaubt: boolean;
}

/**
 * Uebersicht: Gesichtsfeld; erlaubt, wenn das Objekt groesser als das Gesichtsfeld ist (A-D2).
 * Zoom: Zoomfenster; erlaubt, wenn das Objekt breiter als das Zoomfenster ist (Mond). undefined
 * bei unlesbarem Geraet.
 */
export function verschiebelage(k: Konfiguration, zoom: boolean): Verschiebelage | undefined {
  try {
    const durchmesser = k.objekt.durchmesserArcsec;
    if (zoom) {
      const breite = zoombreiteArcsec(k);
      return { durchmesser, breite, erlaubt: durchmesser > breite };
    }
    const gesichtsfeld = optik(k.geraet).gesichtsfeld;
    return { durchmesser, breite: gesichtsfeld.breiteArcsec, erlaubt: verschiebbar(durchmesser, gesichtsfeld) };
  } catch {
    return undefined;
  }
}

/** Kernschluessel des Vergleichsbilds; kann keinem Kern aus physik gleichen. */
const VERGLEICH = "vergleich";

/**
 * Parameter des Vergleichsbilds zum Zoom-Anblick (Entscheidung Herbert 2026-10-27): dasselbe
 * Fenster, Gesichtsfeld und dieselben Punktquellen, aber ein 1x1-Delta-Kern (keine Faltung) und
 * neutrale Helligkeit (faktorObjekt 1, hintergrundRelativ 0, also Quellweiss = Bildschirmweiss,
 * ohne die Leuchtdichte-Abbildung aus #55). So rechnet rendere ohne Aenderung an bild.
 *
 * Abweichung: das Arbeitsraster ist nicht das des Anblicks (Gesamt-FWHM / 2,5), sondern so fein
 * wie Quelle und Anzeige es hergeben, max(Quellmassstab, fenster.breite / fenster.px). Mit dem
 * groben Raster des Anblicks waere das Vergleichsbild beim Hochskalieren bilinear verschmiert,
 * also nicht "unverschlechtert" (A-D3). Invariante rasterPx * massstab = fenster.breite bleibt.
 */
export function vergleichsparameter(anblick: Simulationsparameter, quellmassstabArcsecProPx: number): Simulationsparameter {
  const { fenster, quellbild, kern, helligkeit } = anblick;
  const massstabMin = Math.max(quellmassstabArcsecProPx, fenster.breiteArcsec / fenster.px);
  // 1e-9 wie in physik (arbeitsraster): breite / (breite / px) ergibt sonst px - 1e-13.
  const rasterPx = Math.max(1, Math.floor(fenster.breiteArcsec / massstabMin + 1e-9));
  const massstabArcsecProPx = fenster.breiteArcsec / rasterPx;
  const delta: Kern = {
    schluessel: VERGLEICH,
    beschreibung: { ...kern.beschreibung, massstabArcsecProPx },
    groesse: 1,
    radius: 0,
    massstabArcsecProPx,
    daten: new Float32Array([1])
  };
  return {
    ...anblick,
    quellbild: {
      ...quellbild,
      // Der Schluessel des Anblicks deckt alles ab, was physik fuer Stufe 1 zaehlt (auch Punktquellen).
      schluessel: [VERGLEICH, quellbild.schluessel, massstabArcsecProPx, rasterPx].join("|"),
      massstabArcsecProPx,
      rasterPx
    },
    kern: delta,
    helligkeit: { ...helligkeit, schluessel: VERGLEICH, faktorObjekt: 1, hintergrundRelativ: 0 }
  };
}
