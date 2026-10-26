// Helligkeit (Naht-Stufe 3): Objektfaktor und Hintergrund des Gesichtsfelds (A-P4, A-B2).
// Quelle: docs/recherche/physik.md, Abschnitte 5.1, 6.1, 6.2 und 9. Helligkeiten an der Naht
// relativ zu Quellweiss (1,0 = weissMagProArcsec2 des Objektzustands), linear.

import type { Helligkeit } from "../naht/simulationsparameter";
import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler } from "./fehler";
import type { Objektzustand } from "./konfiguration";
import { BORTLE_MAG_PRO_ARCSEC2 } from "./konstanten";
import { flaechenhelligkeitsfaktor, type Optik } from "./optik";
import { schluessel } from "./schluessel";

/** Himmelshelligkeit mu(b) in mag je Quadratbogensekunde zur Bortle-Stufe 1 bis 9 (Abschnitt 6.1). */
export function bortleMagProArcsec2(bortle: number): number {
  const mag = Number.isInteger(bortle) ? BORTLE_MAG_PRO_ARCSEC2[bortle] : undefined;
  if (mag === undefined || Number.isNaN(mag)) throw new PhysikFehler("bortle", bortle, "ist keine Stufe 1 bis 9");
  return mag;
}

/** Umrechnung einer Flaechenhelligkeit in mag je Quadratbogensekunde in den Faktor relativ zu Quellweiss. */
function relativZuWeiss(magProArcsec2: number, weissMagProArcsec2: number): number {
  return Math.pow(10, -0.4 * (magProArcsec2 - weissMagProArcsec2));
}

/**
 * Abschnitt 9: Objekt L = L0 a tau (1 - eps^2) min(1, (AP/p)^2), nach oben 1, keine Blendung.
 * Der Abschattungsfaktor (1 - eps^2) steht genau hier, nicht in der Transmission.
 * Hintergrund mu_ok = mu(b) - 2,5 log10[tau (1 - eps^2) min(1, (AP/p)^2)] (Abschnitt 6.2):
 * ohne Extinktion, der Himmel leuchtet in der Atmosphaere. hintergrundRelativ ist mu_ok
 * relativ zu Quellweiss; hintergrundMagProArcsec2 dient nur Anzeige und Hilfetext.
 */
export function helligkeit(o: Optik, a: Atmosphaere, bortle: number, zustand: Objektzustand): Helligkeit {
  const okularFaktor = o.transmission * (1 - o.obstruktion ** 2) * flaechenhelligkeitsfaktor(o.austrittspupilleMm);
  const faktorObjekt = Math.min(1, okularFaktor * a.transmission);
  const hintergrundMagProArcsec2 = bortleMagProArcsec2(bortle) - 2.5 * Math.log10(okularFaktor);
  const hintergrundRelativ = relativZuWeiss(hintergrundMagProArcsec2, zustand.quelle.weissMagProArcsec2);
  return {
    schluessel: schluessel("helligkeit", faktorObjekt, hintergrundRelativ, hintergrundMagProArcsec2),
    faktorObjekt,
    hintergrundRelativ,
    hintergrundMagProArcsec2
  };
}
