// Fehler fuer Programmierfehler in physik (docs/entwuerfe/naht-variante-3.md Abschnitt 1.3,
// Fehlerfaelle): NaN, Oeffnung <= 0, Vergroesserung < 1, Obstruktion ausserhalb 0 bis 0,5,
// Hoehe ausserhalb 0 bis 90. Nutzereingaben gehen vorher durch begrenze(), das nie wirft.

import type { Objektzustand } from "../naht/konfiguration";

export class PhysikFehler extends Error {
  readonly feld: string;
  readonly wert: number;

  constructor(feld: string, wert: number, grund: string) {
    super(`physik: ${feld} = ${wert} ${grund}`);
    this.name = "PhysikFehler";
    this.feld = feld;
    this.wert = wert;
  }
}

/** Wirft PhysikFehler, wenn wert NaN ist oder ausserhalb [min, max] liegt. */
export function pruefeBereich(feld: string, wert: number, min: number, max: number): void {
  if (Number.isNaN(wert) || wert < min || wert > max) {
    throw new PhysikFehler(feld, wert, `liegt nicht in ${min} bis ${max}`);
  }
}

/** Wirft PhysikFehler, wenn wert nicht endlich oder nicht positiv ist. */
export function pruefePositiv(feld: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) {
    throw new PhysikFehler(feld, wert, "ist nicht endlich oder nicht positiv");
  }
}

/**
 * Quellbild des Zustands; wirft PhysikFehler, wenn es fehlt. auswerten rechnet seit Issue #100 auch
 * Zustaende ohne Quellbild (Doppelstern, M45) und braucht quelleVon nicht mehr; fuer Aufrufer, die
 * ein Quellbild voraussetzen (ui: Vergleichsbild, Zoom), bleibt ein fehlendes ein Programmierfehler.
 */
export function quelleVon(zustand: Objektzustand): NonNullable<Objektzustand["quelle"]> {
  if (zustand.quelle === undefined) {
    throw new PhysikFehler(`${zustand.kennung}.quelle`, NaN, "fehlt; der Zustand hat kein Quellbild");
  }
  return zustand.quelle;
}
