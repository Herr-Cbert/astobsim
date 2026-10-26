// Schluessel der Naht-Stufen (docs/architektur.md Abschnitt 3): aus den auf 4 signifikante
// Stellen gerundeten Eingangsgroessen gebildet. Gleicher Schluessel genau dann, wenn die
// gerundeten Felder gleich sind; so loest Gleitkommarauschen (V = f / f_ok) keinen Kernbau aus.

import { SIGNIFIKANTE_STELLEN } from "./konstanten";

/** Rundet auf signifikante Stellen, Ergebnis ist wieder eine Zahl (80,00001 wird 80). */
export function rundeSignifikant(wert: number, stellen: number = SIGNIFIKANTE_STELLEN): number {
  if (!Number.isFinite(wert) || wert === 0) return wert;
  return Number(wert.toPrecision(stellen));
}

/** Schluessel aus Praefix und Feldern, Zahlen gerundet, mit "|" verbunden. */
export function schluessel(praefix: string, ...felder: (number | string)[]): string {
  const teile = felder.map((feld) => (typeof feld === "number" ? String(rundeSignifikant(feld)) : feld));
  return [praefix, ...teile].join("|");
}
