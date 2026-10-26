// Begrenzung freier Eingaben (A-F8, A-B1, A-B2, A-B4): schneiden statt ablehnen, je Schnitt
// ein Hinweis. Die einzige Stelle, die Nutzereingaben in eine gueltige Konfiguration bringt;
// wirft nie, auch nicht bei NaN. Danach werfen optik() und atmosphaere() nicht mehr.

import type { Bedingungen, Geraet, Konfiguration } from "./konfiguration";

/** Ein Schnitt: welches Feld (Pfad in der Konfiguration), was eingegeben war, was daraus wurde. */
export interface Hinweis {
  feld: string;
  eingabe: number;
  wert: number;
}

export interface Grenze {
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
  oeffnungMm: { min: 6, max: 300 },
  brennweiteMm: { min: 200, max: 4000 },
  obstruktion: { min: 0, max: 0.5 },
  okularBrennweiteMm: { min: 2, max: 50 },
  scheinbaresGesichtsfeldGrad: { min: 40, max: 100 },
  vergroesserung: { min: 1, max: Infinity },
  wahresGesichtsfeldGrad: { min: 1, max: Infinity },
  seeingFwhmArcsec: { min: 0.5, max: 5 },
  bortle: { min: 1, max: 9, ganzzahlig: true },
  hoeheGrad: { min: 10, max: 90 }
} as const satisfies Record<string, Grenze>;

/**
 * Liefert eine begrenzte Kopie der Konfiguration und je Schnitt einen Hinweis; ohne Schnitt ist
 * die Liste leer. NaN wird auf die Untergrenze gesetzt und ebenfalls gemeldet. Das Objekt kommt
 * aus den Daten, nicht vom Nutzer, und wird unveraendert uebernommen.
 */
export function begrenze(konfiguration: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] } {
  const hinweise: Hinweis[] = [];
  const schneide = (feld: string, wert: number, grenze: Grenze): number => {
    let neu = grenze.ganzzahlig ? Math.round(wert) : wert;
    neu = Number.isNaN(neu) ? grenze.min : Math.min(grenze.max, Math.max(grenze.min, neu));
    if (!Object.is(neu, wert)) hinweise.push({ feld, eingabe: wert, wert: neu });
    return neu;
  };

  const geraet = ((g: Geraet): Geraet => {
    switch (g.art) {
      case "fernrohr":
        return {
          ...g,
          oeffnungMm: schneide("geraet.oeffnungMm", g.oeffnungMm, GRENZEN.oeffnungMm),
          brennweiteMm: schneide("geraet.brennweiteMm", g.brennweiteMm, GRENZEN.brennweiteMm),
          obstruktion: schneide("geraet.obstruktion", g.obstruktion, GRENZEN.obstruktion),
          okular: {
            brennweiteMm: schneide("geraet.okular.brennweiteMm", g.okular.brennweiteMm, GRENZEN.okularBrennweiteMm),
            scheinbaresGesichtsfeldGrad: schneide(
              "geraet.okular.scheinbaresGesichtsfeldGrad",
              g.okular.scheinbaresGesichtsfeldGrad,
              GRENZEN.scheinbaresGesichtsfeldGrad
            )
          }
        };
      case "fernglas":
        return {
          ...g,
          oeffnungMm: schneide("geraet.oeffnungMm", g.oeffnungMm, GRENZEN.oeffnungMm),
          vergroesserung: schneide("geraet.vergroesserung", g.vergroesserung, GRENZEN.vergroesserung),
          wahresGesichtsfeldGrad: schneide("geraet.wahresGesichtsfeldGrad", g.wahresGesichtsfeldGrad, GRENZEN.wahresGesichtsfeldGrad)
        };
      case "auge":
        return { ...g };
    }
  })(konfiguration.geraet);

  const b = konfiguration.bedingungen;
  const bedingungen: Bedingungen = {
    seeingFwhmArcsec: schneide("bedingungen.seeingFwhmArcsec", b.seeingFwhmArcsec, GRENZEN.seeingFwhmArcsec),
    bortle: schneide("bedingungen.bortle", b.bortle, GRENZEN.bortle),
    transparenz: b.transparenz,
    hoeheGrad: schneide("bedingungen.hoeheGrad", b.hoeheGrad, GRENZEN.hoeheGrad)
  };

  return { konfiguration: { geraet, objekt: konfiguration.objekt, bedingungen }, hinweise };
}
