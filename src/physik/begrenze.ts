// Begrenzung freier Eingaben (A-F8, A-B1, A-B2, A-B4): schneiden statt ablehnen, je Schnitt
// ein Hinweis. Die einzige Stelle, die Nutzereingaben in eine gueltige Konfiguration bringt;
// wirft nie, auch nicht bei NaN. Danach werfen optik() und atmosphaere() nicht mehr.
//
// Zur Invariante "optik() ist die einzige Stelle, die ueber Geraet.art verzweigt": begrenze()
// muss die Felder je Geraeteart kennen, um sie zu schneiden; es rechnet aber nichts aus der Art
// ab und liefert wieder ein Geraet. Ausserhalb dieser beiden Funktionen kommt Geraet.art nicht vor.

import type { Bedingungen, Geraet, Konfiguration } from "./konfiguration";

/** Ein Schnitt: welches Feld (Pfad in der Konfiguration), was eingegeben war, was daraus wurde. */
export interface Hinweis {
  feld: string;
  eingabe: number;
  wert: number;
}

export interface Grenze {
  /** Pfad des Felds in der Konfiguration, so steht er auch im Hinweis. */
  feld: string;
  min: number;
  max: number;
  /** Auf ganze Zahlen runden (Bortle-Stufe). */
  ganzzahlig?: boolean;
}

/**
 * Bereiche nach A-F8 (Geraet und Okular), A-B1 (Seeing), A-B2 (Bortle), A-B4 (Hoehe).
 * Das wahre Gesichtsfeld eines Fernglases steht nicht in A-F8; es kommt aus der Geraeteliste
 * (A-F4) und wird nur nach unten auf 1 Grad geschuetzt. Die Vergroesserung eines Fernrohrs
 * ist durch Brennweite und Okular immer mindestens 4 (200 mm / 50 mm).
 */
export const GRENZEN = {
  oeffnungMm: { feld: "geraet.oeffnungMm", min: 6, max: 300 },
  brennweiteMm: { feld: "geraet.brennweiteMm", min: 200, max: 4000 },
  obstruktion: { feld: "geraet.obstruktion", min: 0, max: 0.5 },
  okularBrennweiteMm: { feld: "geraet.okular.brennweiteMm", min: 2, max: 50 },
  scheinbaresGesichtsfeldGrad: { feld: "geraet.okular.scheinbaresGesichtsfeldGrad", min: 40, max: 100 },
  vergroesserung: { feld: "geraet.vergroesserung", min: 1, max: Infinity },
  wahresGesichtsfeldGrad: { feld: "geraet.wahresGesichtsfeldGrad", min: 1, max: Infinity },
  seeingFwhmArcsec: { feld: "bedingungen.seeingFwhmArcsec", min: 0.5, max: 5 },
  bortle: { feld: "bedingungen.bortle", min: 1, max: 9, ganzzahlig: true },
  hoeheGrad: { feld: "bedingungen.hoeheGrad", min: 10, max: 90 }
} as const satisfies Record<string, Grenze>;

/**
 * Liefert eine begrenzte Kopie der Konfiguration und je Schnitt einen Hinweis; ohne Schnitt ist
 * die Liste leer. NaN wird auf die Untergrenze gesetzt und ebenfalls gemeldet. Das Objekt kommt
 * aus den Daten, nicht vom Nutzer, und wird unveraendert uebernommen.
 */
export function begrenze(konfiguration: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] } {
  const hinweise: Hinweis[] = [];
  const schneide = (wert: number, grenze: Grenze): number => {
    let neu = grenze.ganzzahlig ? Math.round(wert) : wert;
    neu = Number.isNaN(neu) ? grenze.min : Math.min(grenze.max, Math.max(grenze.min, neu));
    if (neu !== wert) hinweise.push({ feld: grenze.feld, eingabe: wert, wert: neu });
    return neu;
  };

  const geraet = ((g: Geraet): Geraet => {
    switch (g.art) {
      case "fernrohr":
        return {
          ...g,
          oeffnungMm: schneide(g.oeffnungMm, GRENZEN.oeffnungMm),
          brennweiteMm: schneide(g.brennweiteMm, GRENZEN.brennweiteMm),
          obstruktion: schneide(g.obstruktion, GRENZEN.obstruktion),
          okular: {
            brennweiteMm: schneide(g.okular.brennweiteMm, GRENZEN.okularBrennweiteMm),
            scheinbaresGesichtsfeldGrad: schneide(g.okular.scheinbaresGesichtsfeldGrad, GRENZEN.scheinbaresGesichtsfeldGrad)
          }
        };
      case "fernglas":
        return {
          ...g,
          oeffnungMm: schneide(g.oeffnungMm, GRENZEN.oeffnungMm),
          vergroesserung: schneide(g.vergroesserung, GRENZEN.vergroesserung),
          wahresGesichtsfeldGrad: schneide(g.wahresGesichtsfeldGrad, GRENZEN.wahresGesichtsfeldGrad)
        };
      case "auge":
        return { ...g };
    }
  })(konfiguration.geraet);

  const eingabe = konfiguration.bedingungen;
  const bedingungen: Bedingungen = {
    seeingFwhmArcsec: schneide(eingabe.seeingFwhmArcsec, GRENZEN.seeingFwhmArcsec),
    bortle: schneide(eingabe.bortle, GRENZEN.bortle),
    transparenz: eingabe.transparenz,
    hoeheGrad: schneide(eingabe.hoeheGrad, GRENZEN.hoeheGrad)
  };

  return { konfiguration: { geraet, objekt: konfiguration.objekt, bedingungen }, hinweise };
}
