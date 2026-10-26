/** Programmierfehler in der Bildpipeline: unstimmige Raster, Kerne oder Parameter. */
export class BildFehler extends Error {
  constructor(meldung: string) {
    super(meldung);
    this.name = "BildFehler";
  }
}
