// Helligkeit (Naht-Stufe 3): Objektfaktor und Hintergrund des Gesichtsfelds (A-P4, A-B2).
// Quelle: docs/recherche/physik.md, Abschnitte 5.1, 6.1, 6.2, 9, 12, 14 und 17. Zwei Schritte:
// okularhelligkeit() rechnet die Flaechenhelligkeit im Okular (Physik), helligkeit() bildet sie
// mit anzeigefaktor() auf den Bildschirm ab (Anzeigeentscheidung, Issue #55, kein Augenmodell) und
// liefert fuer die Punktebene (Issue #72) Faktor und Exponent der Abbildung je Pixel. Version 2
// (Issue #100, docs/architektur.md 5.3, ADR-0004): zwei Weiss (Anzeigeweiss 8,9, Punktweiss 6,9),
// Mischgewicht fuer unaufgeloeste Sonnensystem-Zustaende, Deep-Sky-Ebene mit Isophote und Sockel.

import type { Helligkeit } from "../naht/simulationsparameter";
import { type Atmosphaere, extinktionFaktor } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import type { Objektzustand } from "../naht/konfiguration";
import {
  ANZEIGE_WEISS_MAG_PRO_ARCSEC2,
  BLACKWELL_BREITE,
  BORTLE_MAG_PRO_ARCSEC2,
  KOMPRESSIONSEXPONENT,
  PUNKT_WEISS_MAG_PRO_ARCSEC2,
  SOCKEL_DELTA_KODES
} from "./konstanten";
import { mischgewicht, sockel } from "./mischung";
import { flaechenhelligkeitsfaktor, type Optik, transmissionMitAbschattung } from "./optik";
import { schluessel } from "./schluessel";
import { type SichtbareIsophote, sichtbareIsophote } from "./schwelle";

/**
 * Bezug der linearen Helligkeiten: Quellweiss des Zustands, ohne Quellbild (Doppelstern, M45) fest
 * 0 mag/arcsec^2 (docs/architektur.md 5.2 und 5.3). Punktquellen und Helligkeit nehmen denselben
 * Bezug, er kuerzt sich in der Punktebene heraus (punktFaktor mal helligkeitRelativ).
 */
export function bezugMagProArcsec2(zustand: Objektzustand): number {
  return zustand.quelle?.weissMagProArcsec2 ?? 0;
}

/** Himmelshelligkeit mu(b) in mag je Quadratbogensekunde zur Bortle-Stufe 1 bis 9 (Abschnitt 6.1). */
export function bortleMagProArcsec2(bortle: number): number {
  const mag = Number.isInteger(bortle) && bortle >= 1 ? BORTLE_MAG_PRO_ARCSEC2[bortle - 1] : undefined;
  if (mag === undefined) throw new PhysikFehler("bortle", bortle, "ist keine Stufe 1 bis 9");
  return mag;
}

/**
 * Physikalische Helligkeit im Okular. faktorObjekt und hintergrundRelativ linear relativ zu
 * Quellweiss (1,0 = weissMagProArcsec2 des Objektzustands; ohne Quellbild 0 mag/arcsec^2), die
 * Magnituden in mag/arcsec^2.
 */
export interface Okularhelligkeit {
  faktorObjekt: number;
  objektMagProArcsec2: number;
  hintergrundRelativ: number;
  hintergrundMagProArcsec2: number;
}

/**
 * Abschnitt 9: Objekt L = L0 a tau (1 - eps^2) min(1, (AP/p)^2), nach oben 1, keine Blendung.
 * tau (1 - eps^2) kommt aus transmissionMitAbschattung() (optik.ts), die auch schwelle.ts nimmt.
 * Hintergrund mu_ok = mu(b) - 2,5 log10[tau (1 - eps^2) min(1, (AP/p)^2)] (Abschnitt 6.2):
 * ohne Extinktion, der Himmel leuchtet in der Atmosphaere.
 */
export function okularhelligkeit(optik: Optik, atmosphaere: Atmosphaere, bortle: number, zustand: Objektzustand): Okularhelligkeit {
  const okularFaktor = transmissionMitAbschattung(optik) * flaechenhelligkeitsfaktor(optik.austrittspupilleMm);
  const faktorObjekt = Math.min(1, okularFaktor * atmosphaere.transmission);
  const weiss = bezugMagProArcsec2(zustand);
  const hintergrundMagProArcsec2 = bortleMagProArcsec2(bortle) - 2.5 * Math.log10(okularFaktor);
  return {
    faktorObjekt,
    objektMagProArcsec2: weiss - 2.5 * Math.log10(faktorObjekt),
    // Magnitudendifferenz zu Quellweiss in einen linearen Faktor: dieselbe Umrechnung wie bei der Extinktion.
    hintergrundRelativ: extinktionFaktor(hintergrundMagProArcsec2 - weiss),
    hintergrundMagProArcsec2
  };
}

/**
 * Abschnitt 12: Flaechenhelligkeit mu im Okular (mag/arcsec^2) als Anzeigehelligkeit (GLOSSARY:
 * linear, 1 = Bildschirmweiss, vor der sRGB-Kodierung). w = (L / L_weiss)^n =
 * 10^(-0,4 n (mu - mu_weiss)) mit n = 1/3 (Groessenordnung nach Stevens) und mu_weiss dem
 * Anzeigeweiss (8,9, Version 1 3,35). Streng monoton fallend in mu; gleiche Leuchtdichteverhaeltnisse geben
 * gleiche Anzeigeverhaeltnisse. Nicht begrenzt (seit Issue #72, physik.md 14.4): Flaechen heller als
 * mu_weiss ergeben Werte ueber 1, begrenzt wird erst das Pixel beim Zeichnen (ui, zeichne.ts) bzw.
 * der Himmel in helligkeit().
 */
export function anzeigefaktor(magProArcsec2: number): number {
  if (Number.isNaN(magProArcsec2)) throw new PhysikFehler("magProArcsec2", magProArcsec2, "ist keine Zahl");
  return Math.pow(10, -0.4 * KOMPRESSIONSEXPONENT * (magProArcsec2 - ANZEIGE_WEISS_MAG_PRO_ARCSEC2));
}

/**
 * Leuchtdichte der Flaechenhelligkeit mu relativ zu einem Weiss, linear ohne Kompression:
 * L / L_weiss = 10^(-0,4 (mu - mu_weiss)) (physik.md Abschnitt 14). Ohne Angabe das Anzeigeweiss;
 * dann ist anzeigefaktor(mu) die Potenz punktExponent davon. Fuer die Punktebene das Punktweiss.
 */
export function leuchtdichteRelativ(magProArcsec2: number, weissMagProArcsec2: number = ANZEIGE_WEISS_MAG_PRO_ARCSEC2): number {
  if (Number.isNaN(magProArcsec2)) throw new PhysikFehler("magProArcsec2", magProArcsec2, "ist keine Zahl");
  return Math.pow(10, -0.4 * (magProArcsec2 - weissMagProArcsec2));
}

/**
 * Naht-Stufe 3 fuer bild: faktorObjekt ist die Anzeigehelligkeit von Quellweiss (darf 1
 * uebersteigen, physik.md 14.4), hintergrundRelativ die des Himmels im Okular, auf 1 begrenzt, beide
 * aus anzeigefaktor() mit dem Anzeigeweiss. Das Objektbild bleibt linear (Pixel relativ zu Quellweiss
 * mal faktorObjekt), nur das Niveau wird komprimiert; der Kontrast innerhalb des Quellbilds bleibt, der
 * zwischen Objekt und Himmel nicht (physik.md 12.5). Die Punktebene bildet bild je Pixel ab (Issue #72,
 * physik.md Abschnitt 14): punktFaktor ist die Leuchtdichte von Quellweiss im Okular relativ zum
 * Punktweiss (6,9, A-P13 ii), punktExponent der Kompressionsexponent; faktorObjekt = punktFaktor^n
 * gilt mit zwei Weiss nicht mehr. hintergrundMagProArcsec2 ist physikalisch.
 *
 * Version 2 (docs/architektur.md 5.3, ADR-0004): mischgewicht g nur bei sonnensystem aus
 * Winkelgroesse und Vergroesserung (A-P10; 0 fuer x > 24, dann Ausdruck aus Version 1). deepSky nur
 * bei deep_sky mit Quellbild und Flaechentabelle: faktor a und himmel s als Leuchtdichte von
 * Quellweiss und Himmel im Okular relativ zum Anzeigeweiss, schwelleRelativ
 * q* = 10^(-0,4 (mu_Schwelle - Quellweiss)) aus der sichtbaren Isophote (gilt in allen drei Faellen von
 * sichtbareIsophote), breite 0,484, sockel nach mischung.ts. isophote ist die sichtbare Isophote
 * fuer die Anzeigewerte, sonst undefined.
 *
 * Schluessel: die Felder aus Version 1; mischgewicht nur, wenn es nicht 0 ist, und die deepSky-Felder
 * nur, wenn es sie gibt. So bleibt der Schluessel der Faelle mit dem Ausdruck aus Version 1 gleich.
 */
export function helligkeitUndIsophote(
  optik: Optik,
  atmosphaere: Atmosphaere,
  bortle: number,
  zustand: Objektzustand
): { helligkeit: Helligkeit; isophote?: SichtbareIsophote } {
  const ok = okularhelligkeit(optik, atmosphaere, bortle, zustand);
  const faktorObjekt = anzeigefaktor(ok.objektMagProArcsec2);
  const hintergrundRelativ = Math.min(1, anzeigefaktor(ok.hintergrundMagProArcsec2));
  const punktFaktor = leuchtdichteRelativ(ok.objektMagProArcsec2, PUNKT_WEISS_MAG_PRO_ARCSEC2);
  const punktExponent = KOMPRESSIONSEXPONENT;
  const g = zustand.klasse === "sonnensystem" ? mischgewicht(zustand.durchmesserArcsec, optik.vergroesserung) : 0;
  const felder: (number | string)[] = [faktorObjekt, hintergrundRelativ, ok.hintergrundMagProArcsec2, punktFaktor, punktExponent];
  if (g !== 0) felder.push("mischgewicht", g);
  const h: Helligkeit = {
    schluessel: "",
    faktorObjekt,
    hintergrundRelativ,
    hintergrundMagProArcsec2: ok.hintergrundMagProArcsec2,
    punktFaktor,
    punktExponent,
    mischgewicht: g
  };
  let isophote: SichtbareIsophote | undefined;
  if (zustand.klasse === "deep_sky" && zustand.quelle !== undefined && zustand.isophoten !== undefined) {
    isophote = sichtbareIsophote(zustand.isophoten, optik, atmosphaere, bortleMagProArcsec2(bortle));
    const faktor = leuchtdichteRelativ(ok.objektMagProArcsec2);
    const himmel = leuchtdichteRelativ(ok.hintergrundMagProArcsec2);
    const schwelleRelativ = Math.pow(10, -0.4 * (isophote.schwelleMagProArcsec2 - zustand.quelle.weissMagProArcsec2));
    const ds = { faktor, himmel, schwelleRelativ, breite: BLACKWELL_BREITE, sockel: sockel(faktor, himmel, schwelleRelativ, SOCKEL_DELTA_KODES, punktExponent) };
    h.deepSky = ds;
    felder.push("deepSky", ds.faktor, ds.himmel, ds.schwelleRelativ, ds.breite, ds.sockel);
  }
  h.schluessel = schluessel("helligkeit", ...felder);
  return isophote === undefined ? { helligkeit: h } : { helligkeit: h, isophote };
}

/** Nur die Helligkeit aus helligkeitUndIsophote (Naht-Stufe 3). */
export function helligkeit(optik: Optik, atmosphaere: Atmosphaere, bortle: number, zustand: Objektzustand): Helligkeit {
  return helligkeitUndIsophote(optik, atmosphaere, bortle, zustand).helligkeit;
}
