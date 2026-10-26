// Fehler in einer Datendatei (objekte.json, bilder.json, geraete.json): ungueltiges JSON,
// fehlendes Pflichtfeld, Wert ausserhalb des Bereichs, Verweis ins Leere. Die Meldung nennt
// Datei, Eintrag und Feld, damit Fehler der Handpflege sofort zu finden sind (Issues #8, #11).

export class DatenFehler extends Error {
  readonly datei: string;
  readonly eintrag: string;
  readonly feld: string;

  constructor(datei: string, eintrag: string, feld: string, grund: string) {
    super(`daten: ${datei}, Eintrag ${eintrag}, Feld ${feld}: ${grund}`);
    this.name = "DatenFehler";
    this.datei = datei;
    this.eintrag = eintrag;
    this.feld = feld;
  }
}
