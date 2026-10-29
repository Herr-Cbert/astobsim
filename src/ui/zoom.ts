// Zoomansicht (A-D3, Issue #20): welches Fenster der Zoom zeigt, wann er sich verschieben laesst
// und mit welchen Parametern das Vergleichsbild entsteht. Reine Funktionen ohne DOM; die
// Steuerung rechnet damit, zoomansicht.ts zeichnet. Der Zoom ist nur ein anderes Fenster
// (docs/architektur.md Abschnitt 3): auswerten bekommt fenster und vorher, sonst nichts Neues.
//
// Koordinaten wie in der Naht: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Bogensekunden.

import type { Helligkeit, Kern, Simulationsparameter } from "../naht/simulationsparameter";
import { arbeitsmassstabOhneFenster, atmosphaere, aufloesung, type Konfiguration, optik } from "../physik";
import type { Mitte } from "./verschieben";
import { verschiebbar } from "./verschieben";

/**
 * Rand um Sterne im Zoom je Seite in Gesamt-FWHM: der Kernradius aus physik (KERN_RADIUS_PRO_FWHM,
 * physik.md Abschnitt 9, dort nicht exportiert). Weiter reicht das Scheibchen eines Sterns nicht.
 */
export const STERN_RAND_PRO_FWHM = 3;

/** Rand um das Objekt im Zoom als Anteil seiner Ausdehnung, je Seite. */
export const ZOOM_RAND = 0.05;
/**
 * Der Zoom zeigt hoechstens diesen Anteil der kuerzeren Seite des Gesichtsfelds, vergroessert also
 * mindestens zweifach. So schneidet die Feldblende im Zoom nie (halbe Diagonale < halbes Feld),
 * und grosse Objekte (Mond) werden auch dann vergroessert, wenn sie das Feld ganz fuellen.
 */
const ZOOM_ANTEIL_GESICHTSFELD_MAX = 0.5;
/**
 * Kleinste Zoombreite in Arbeitspixeln (Arbeitsmassstab ohne Fenster: Quellpixel oder
 * Gesamt-FWHM / 2,5). Haelt winzige Objekte (Mars 6") beurteilbar und das Fenster breiter als
 * ein Arbeitspixel (sonst PhysikFehler in auswerten).
 */
export const ZOOM_ARBEITSPIXEL_MIN = 16;
/**
 * Breite des Detailfensters in Arbeitspixeln (Issue #77): die Bilder der Zoomansicht sind hoechstens
 * etwa 350 CSS-Pixel breit (stil.css), dann fallen knapp 3 CSS-Pixel auf ein Arbeitspixel und die
 * Aufloesungsgrenze (FWHM = 2,5 Arbeitspixel) wird sichtbar. Fest in Arbeitspixeln statt aus der
 * Anzeige, damit Verschieben und Groessenaenderung das Fenster nicht aendern.
 */
export const DETAIL_ARBEITSPIXEL = 120;
/** Das Detail wird nur angeboten, wenn es hoechstens diesen Anteil des Zoomfensters zeigt. */
const DETAIL_ANTEIL_ZOOM_MAX = 0.75;

/**
 * Ausdehnung des Objekts in Bogensekunden: der groessere Wert aus Durchmesser und Quellbild
 * (Breite und Hoehe mal Massstab). Das Quellbild umfasst auch die Ringe des Saturn, die im
 * Durchmesser nicht stecken, und liegt sonst knapp um die Scheibe. Ohne Quellbild (Doppelstern:
 * groesster Sternabstand, M45) der Durchmesser plus je Seite den Kernradius (STERN_RAND_PRO_FWHM
 * Gesamt-FWHM), damit die Sternscheibchen samt Halo ganz im Zoom liegen. Wirft wie optik.
 */
export function objektausdehnungArcsec(k: Konfiguration): number {
  const { durchmesserArcsec, quelle } = k.objekt;
  if (quelle === undefined) {
    const gesamtFwhm = aufloesung(optik(k.geraet), atmosphaere(k.bedingungen)).gesamtFwhmArcsec;
    return durchmesserArcsec + 2 * STERN_RAND_PRO_FWHM * gesamtFwhm;
  }
  return Math.max(durchmesserArcsec, quelle.breitePx * quelle.massstabArcsecProPx, quelle.hoehePx * quelle.massstabArcsecProPx);
}

/**
 * Breite des Zoomfensters: das Objekt mit Rand, hoechstens die Haelfte des Gesichtsfelds,
 * mindestens ZOOM_ARBEITSPIXEL_MIN Arbeitspixel. Wirft wie optik bei unlesbarem Geraet.
 */
export function zoombreiteArcsec(k: Konfiguration): number {
  return breiten(k).zoom;
}

/**
 * Breite des Detailfensters (Issue #77): DETAIL_ARBEITSPIXEL Arbeitspixel; undefined, wenn es
 * nicht deutlich schmaler als das Zoomfenster waere (Planeten). Wirft wie optik.
 */
export function detailbreiteArcsec(k: Konfiguration): number | undefined {
  const { zoom, detail } = breiten(k);
  return detail <= zoom * DETAIL_ANTEIL_ZOOM_MAX ? detail : undefined;
}

function breiten(k: Konfiguration): { zoom: number; detail: number } {
  const o = optik(k.geraet);
  const feld = Math.min(o.gesichtsfeld.breiteArcsec, o.gesichtsfeld.hoeheArcsec);
  const aufl = aufloesung(o, atmosphaere(k.bedingungen));
  const arbeitspixel = arbeitsmassstabOhneFenster(aufl, k.objekt.quelle);
  const breite = Math.min(objektausdehnungArcsec(k) * (1 + 2 * ZOOM_RAND), feld * ZOOM_ANTEIL_GESICHTSFELD_MAX);
  return { zoom: Math.max(breite, arbeitspixel * ZOOM_ARBEITSPIXEL_MIN), detail: arbeitspixel * DETAIL_ARBEITSPIXEL };
}

/** Breite des gezeigten Fensters: Detailfenster, wenn gewuenscht und angeboten, sonst Zoomfenster. */
function fensterbreiteArcsec(k: Konfiguration, detail: boolean): number {
  return (detail ? detailbreiteArcsec(k) : undefined) ?? zoombreiteArcsec(k);
}

/** Fenster des Zooms: Zoom- oder Detailbreite um die Fenstermitte der Steuerung, px Anzeigepixel. */
export function zoomfenster(k: Konfiguration, mitte: Mitte, px: number, detail = false): Simulationsparameter["fenster"] {
  return { breiteArcsec: fensterbreiteArcsec(k, detail), mitteXArcsec: mitte.xArcsec, mitteYArcsec: mitte.yArcsec, px };
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
 * Zoom: Zoom- oder Detailfenster (zoomfenster); erlaubt, wenn das Objekt breiter als das Fenster
 * ist (Mond). undefined bei unlesbarem Geraet.
 */
export function verschiebelage(k: Konfiguration, zoom: boolean, detail = false): Verschiebelage | undefined {
  try {
    const durchmesser = k.objekt.durchmesserArcsec;
    if (zoom) {
      const breite = fensterbreiteArcsec(k, detail);
      return { durchmesser, breite, erlaubt: durchmesser > breite };
    }
    const gesichtsfeld = optik(k.geraet).gesichtsfeld;
    return { durchmesser, breite: gesichtsfeld.breiteArcsec, erlaubt: verschiebbar(durchmesser, gesichtsfeld) };
  } catch {
    return undefined;
  }
}

/**
 * Startlage des Detailfensters bei Objekten ohne Quellbild (Doppel- und Mehrfachsterne, freies Paar,
 * M45; Entscheidung Herbert 2026-10-29): der hellste Stern des Zustands, bei gleicher Magnitude der
 * erste der Liste. Die Objektmitte ist dort oft leer (Epsilon Lyrae). undefined bei Objekten mit
 * Quellbild oder ohne Sterne; dann gilt die Fenstermitte wie bisher.
 */
export function detailstart(k: Konfiguration): Mitte | undefined {
  if (k.objekt.quelle !== undefined) return undefined;
  let hellster: Konfiguration["objekt"]["sterne"][number] | undefined;
  for (const stern of k.objekt.sterne) {
    if (hellster === undefined || stern.magnitude < hellster.magnitude) hellster = stern;
  }
  return hellster === undefined ? undefined : { xArcsec: hellster.dxArcsec, yArcsec: hellster.dyArcsec };
}

/** Kernschluessel des Vergleichsbilds; kann keinem Kern aus physik gleichen. */
const VERGLEICH = "vergleich";

/**
 * Abbildung des Vergleichsbilds bei Deep-Sky-Objekten mit Quellbild (architektur.md 5.7, Issue
 * #110; Vorschlag, Entscheidung Herbert). Linear mit Quellweiss = Bildschirmweiss zeigt den
 * schwachen Halo kaum, deshalb drei Moeglichkeiten, alle ueber Helligkeit.deepSky ohne Aenderung an bild:
 * - "linear": wie bei Mond und Planeten, Quellweiss = Bildschirmweiss, linear (deepSky entfaellt).
 * - "kubikwurzel": Quellweiss = Bildschirmweiss, Pixel q^n mit dem Exponenten n des Anblicks
 *   (1/3), ohne Himmel, Schwelle und Sockel; Punktquellen mit demselben Exponenten.
 * - "okularOhneSchwelle": Helligkeit wie im Okular (faktor, Himmel und n des Anblicks), aber
 *   ohne Schwelle und Sockel; Punktquellen wie im Anblick.
 */
export type Vergleichsabbildung = "linear" | "kubikwurzel" | "okularOhneSchwelle";

/** Gewaehlte Abbildung fuer Deep-Sky (Vorschlag Issue #110); austauschbar an dieser einen Stelle. */
export const VERGLEICH_DEEP_SKY: Vergleichsabbildung = "kubikwurzel";

/**
 * Schwelle q* des Vergleichsbilds: so klein, dass die Deckkraft Phi((q / q* - 1) / Breite) fuer
 * jedes q > 0 aus einem 8-Bit-Quellbild (kleinster Wert ueber 1e-10) gleich 1 ist; bei q = 0
 * bleibt das Pixel ohne Sockel und mit Himmel 0 schwarz.
 */
const OHNE_SCHWELLE = 1e-30;

/** Helligkeit des Vergleichsbilds (schluessel VERGLEICH); bei deepSky nach der Abbildung, sonst linear. */
function vergleichshelligkeit(h: Helligkeit, abbildung: Vergleichsabbildung): Helligkeit {
  const linear: Helligkeit = { ...h, schluessel: VERGLEICH, faktorObjekt: 1, hintergrundRelativ: 0, punktFaktor: 1, punktExponent: 1 };
  const ds = h.deepSky;
  if (ds === undefined || abbildung === "linear") {
    delete linear.deepSky;
    return linear;
  }
  if (abbildung === "kubikwurzel") {
    return {
      ...linear,
      schluessel: `${VERGLEICH}|${abbildung}`,
      punktExponent: h.punktExponent,
      deepSky: { faktor: 1, himmel: 0, schwelleRelativ: OHNE_SCHWELLE, breite: ds.breite, sockel: 0 }
    };
  }
  return { ...h, schluessel: `${VERGLEICH}|${abbildung}|${h.schluessel}`, deepSky: { ...ds, schwelleRelativ: OHNE_SCHWELLE, sockel: 0 } };
}

/**
 * Parameter des Vergleichsbilds zum Zoom-Anblick (Entscheidung Herbert 2026-10-27): dasselbe
 * Fenster, Gesichtsfeld und dieselben Punktquellen, aber ein 1x1-Delta-Kern (keine Faltung) und
 * neutrale Helligkeit (faktorObjekt 1, hintergrundRelativ 0, also Quellweiss = Bildschirmweiss,
 * ohne die Leuchtdichte-Abbildung aus #55; Punktebene linear mit punktFaktor 1 und punktExponent 1,
 * also wie vor Issue #72 nur auf 1 begrenzt). So rechnet rendere ohne Aenderung an bild.
 * Deep-Sky mit Quellbild (Helligkeit.deepSky): nach abbildung, Standard VERGLEICH_DEEP_SKY (Issue #110).
 *
 * Ohne Quellbild (quellmassstab 0) bestimmt allein die Anzeige das Raster.
 *
 * Abweichung: das Arbeitsraster ist nicht das des Anblicks (Gesamt-FWHM / 2,5), sondern so fein
 * wie Quelle und Anzeige es hergeben, max(Quellmassstab, fenster.breite / fenster.px). Mit dem
 * groben Raster des Anblicks waere das Vergleichsbild beim Hochskalieren bilinear verschmiert,
 * also nicht "unverschlechtert" (A-D3). Invariante rasterPx * massstab = fenster.breite bleibt.
 */
export function vergleichsparameter(
  anblick: Simulationsparameter,
  quellmassstabArcsecProPx: number,
  abbildung: Vergleichsabbildung = VERGLEICH_DEEP_SKY
): Simulationsparameter {
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
      // Der Schluessel des Anblicks deckt alles ab, was physik fuer Stufe 1 zaehlt; die Punktquellen
      // (Stufe 1b) gehen mit quellbild.punkte unveraendert mit, bild verbindet beide Schluessel.
      schluessel: [VERGLEICH, quellbild.schluessel, massstabArcsecProPx, rasterPx].join("|"),
      massstabArcsecProPx,
      rasterPx
    },
    kern: delta,
    helligkeit: vergleichshelligkeit(helligkeit, abbildung)
  };
}
