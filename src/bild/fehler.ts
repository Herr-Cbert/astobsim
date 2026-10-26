/** Programmierfehler in der Bildpipeline: unstimmige Raster, Kerne oder Parameter. */
export class BildFehler extends Error {
  constructor(meldung: string) {
    super(meldung);
    this.name = "BildFehler";
  }
}

/** Wirft BildFehler, wenn wert keine positive ganze Zahl ist (Pixelmasse, Kerngroessen). */
export function pruefePositivGanz(name: string, wert: number): void {
  if (!Number.isInteger(wert) || wert <= 0) {
    throw new BildFehler(`${name} muss eine positive ganze Zahl sein, nicht ${wert}`);
  }
}
