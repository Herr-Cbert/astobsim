// Helligkeit (Naht-Stufe 3): Objektfaktor und Hintergrund des Gesichtsfelds (A-P4, A-B2).
// Quelle: docs/recherche/physik.md, Abschnitte 5.1, 6.1, 6.2, 9, 12 und 14. Zwei Schritte:
// okularhelligkeit() rechnet die Flaechenhelligkeit im Okular (Physik), helligkeit() bildet sie
// mit anzeigefaktor() auf den Bildschirm ab (Anzeigeentscheidung, Issue #55, kein Augenmodell) und
// liefert fuer die Punktebene (Issue #72) Faktor und Exponent der Abbildung je Pixel.

import type { Helligkeit } from "../naht/simulationsparameter";
import { type Atmosphaere, extinktionFaktor } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import type { Objektzustand } from "../naht/konfiguration";
import { ANZEIGE_WEISS_MAG_PRO_ARCSEC2, BORTLE_MAG_PRO_ARCSEC2, KOMPRESSIONSEXPONENT } from "./konstanten";
import { flaechenhelligkeitsfaktor, type Optik } from "./optik";
import { schluessel } from "./schluessel";

/** Himmelshelligkeit mu(b) in mag je Quadratbogensekunde zur Bortle-Stufe 1 bis 9 (Abschnitt 6.1). */
export function bortleMagProArcsec2(bortle: number): number {
  const mag = Number.isInteger(bortle) && bortle >= 1 ? BORTLE_MAG_PRO_ARCSEC2[bortle - 1] : undefined;
  if (mag === undefined) throw new PhysikFehler("bortle", bortle, "ist keine Stufe 1 bis 9");
  return mag;
}

/**
 * Physikalische Helligkeit im Okular. faktorObjekt und hintergrundRelativ linear relativ zu
 * Quellweiss (1,0 = weissMagProArcsec2 des Objektzustands), die Magnituden in mag/arcsec^2.
 */
export interface Okularhelligkeit {
  faktorObjekt: number;
  objektMagProArcsec2: number;
  hintergrundRelativ: number;
  hintergrundMagProArcsec2: number;
}

/**
 * Abschnitt 9: Objekt L = L0 a tau (1 - eps^2) min(1, (AP/p)^2), nach oben 1, keine Blendung.
 * Der Abschattungsfaktor (1 - eps^2) steht genau hier, nicht in der Transmission.
 * Hintergrund mu_ok = mu(b) - 2,5 log10[tau (1 - eps^2) min(1, (AP/p)^2)] (Abschnitt 6.2):
 * ohne Extinktion, der Himmel leuchtet in der Atmosphaere.
 */
export function okularhelligkeit(optik: Optik, atmosphaere: Atmosphaere, bortle: number, zustand: Objektzustand): Okularhelligkeit {
  const okularFaktor = optik.transmission * (1 - optik.obstruktion ** 2) * flaechenhelligkeitsfaktor(optik.austrittspupilleMm);
  const faktorObjekt = Math.min(1, okularFaktor * atmosphaere.transmission);
  const weiss = zustand.quelle.weissMagProArcsec2;
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
 * 10^(-0,4 n (mu - mu_weiss)) mit n = 1/3 (Groessenordnung nach Stevens) und mu_weiss = 3,35
 * (Vollmond ohne Verluste). Streng monoton fallend in mu; gleiche Leuchtdichteverhaeltnisse geben
 * gleiche Anzeigeverhaeltnisse. Nicht begrenzt (seit Issue #72, physik.md 14.4): Flaechen heller als
 * mu_weiss ergeben Werte ueber 1, begrenzt wird erst das Pixel beim Zeichnen (ui, zeichne.ts) bzw.
 * der Himmel in helligkeit().
 */
export function anzeigefaktor(magProArcsec2: number): number {
  if (Number.isNaN(magProArcsec2)) throw new PhysikFehler("magProArcsec2", magProArcsec2, "ist keine Zahl");
  return Math.pow(10, -0.4 * KOMPRESSIONSEXPONENT * (magProArcsec2 - ANZEIGE_WEISS_MAG_PRO_ARCSEC2));
}

/**
 * Leuchtdichte der Flaechenhelligkeit mu relativ zu Anzeigeweiss, linear ohne Kompression:
 * L / L_weiss = 10^(-0,4 (mu - mu_weiss)) (physik.md Abschnitt 14). anzeigefaktor(mu) ist die
 * Potenz punktExponent davon.
 */
export function leuchtdichteRelativ(magProArcsec2: number): number {
  if (Number.isNaN(magProArcsec2)) throw new PhysikFehler("magProArcsec2", magProArcsec2, "ist keine Zahl");
  return Math.pow(10, -0.4 * (magProArcsec2 - ANZEIGE_WEISS_MAG_PRO_ARCSEC2));
}

/**
 * Naht-Stufe 3 fuer bild: faktorObjekt ist die Anzeigehelligkeit von Quellweiss (darf 1
 * uebersteigen, physik.md 14.4), hintergrundRelativ die des Himmels im Okular, auf 1 begrenzt, beide
 * aus anzeigefaktor(). Das Objektbild bleibt linear (Pixel relativ zu Quellweiss mal faktorObjekt),
 * nur das Niveau wird komprimiert; der Kontrast innerhalb des Quellbilds bleibt, der zwischen Objekt
 * und Himmel nicht (physik.md 12.5). Die Punktebene bildet bild je Pixel ab (Issue #72, physik.md
 * Abschnitt 14): punktFaktor ist die Leuchtdichte von Quellweiss im Okular relativ zu Anzeigeweiss,
 * punktExponent der Kompressionsexponent, also faktorObjekt = punktFaktor^punktExponent.
 * hintergrundMagProArcsec2 ist physikalisch; ausserhalb von physik liest es heute niemand.
 */
export function helligkeit(optik: Optik, atmosphaere: Atmosphaere, bortle: number, zustand: Objektzustand): Helligkeit {
  const ok = okularhelligkeit(optik, atmosphaere, bortle, zustand);
  const faktorObjekt = anzeigefaktor(ok.objektMagProArcsec2);
  const hintergrundRelativ = Math.min(1, anzeigefaktor(ok.hintergrundMagProArcsec2));
  const punktFaktor = leuchtdichteRelativ(ok.objektMagProArcsec2);
  const punktExponent = KOMPRESSIONSEXPONENT;
  return {
    schluessel: schluessel("helligkeit", faktorObjekt, hintergrundRelativ, ok.hintergrundMagProArcsec2, punktFaktor, punktExponent),
    faktorObjekt,
    hintergrundRelativ,
    hintergrundMagProArcsec2: ok.hintergrundMagProArcsec2,
    punktFaktor,
    punktExponent
  };
}
