// Beugungsgrenzen in Bogensekunden bei 550 nm. Quelle: docs/recherche/physik.md, Abschnitt 1 und 8.

/** Rayleigh-Grenze 1,22 lambda/D in Bogensekunden, D in mm. */
export function rayleigh(oeffnungMm: number): number {
  return 138.4 / oeffnungMm;
}

/** Dawes-Grenze in Bogensekunden, D in mm. */
export function dawes(oeffnungMm: number): number {
  return 115.8 / oeffnungMm;
}
