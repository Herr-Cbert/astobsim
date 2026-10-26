// Optikgroessen: Austrittspupille, Vergroesserungsgrenzen, Flaechenhelligkeit am Okular.
// Quelle: docs/recherche/physik.md, Abschnitte 4, 5.1 und 9. Laengen in mm.

import { PUPILLE_MM, VERGROESSERUNG_MAX_PRO_MM } from "./konstanten";

/** Austrittspupille AP = D / V in mm (Abschnitt 4, [35]). */
export function austrittspupilleMm(oeffnungMm: number, vergroesserung: number): number {
  return oeffnungMm / vergroesserung;
}

/**
 * Sinnvolle Vergroesserungen (Abschnitt 4, [35]): min = D / 6 mm (Austrittspupille gleich
 * Augenpupille), max = 2 D (Austrittspupille 0,5 mm). Die Warnschwellen in A-D5.
 */
export function vergroesserungsgrenzen(oeffnungMm: number): { min: number; max: number } {
  return { min: oeffnungMm / PUPILLE_MM, max: VERGROESSERUNG_MAX_PRO_MM * oeffnungMm };
}

/**
 * Flaechenhelligkeit am Okular relativ zum blossen Auge: min(1, (AP / p)^2)
 * (Abschnitt 5.1, Tousey und Hulburt nach [32] Gl. 66). Ab AP >= p ist der Faktor 1:
 * kein Fernrohr zeigt eine Flaeche heller als das blosse Auge.
 */
export function flaechenhelligkeitsfaktor(austrittspupilleMm: number, pupilleMm: number = PUPILLE_MM): number {
  return Math.min(1, (austrittspupilleMm / pupilleMm) ** 2);
}
