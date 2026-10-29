// Begrenzung freier Eingaben (A-F8, A-B1, A-B2, A-B4): auf den Schritt des Felds runden, dann
// schneiden statt ablehnen, je Eingabe ausserhalb des Bereichs ein Hinweis; Runden meldet nichts.
// Die einzige Stelle, die Nutzereingaben in eine gueltige Konfiguration bringt; wirft nie, auch
// nicht bei NaN. Danach werfen optik() und atmosphaere() nicht mehr. Beim freien Doppelsternpaar
// (A-Z9) schneidet begrenze die Paareingaben und bildet die Sterne mit freiesPaar neu.
//
// Zur Invariante "optik() ist die einzige Stelle, die ueber Geraet.art verzweigt": begrenze()
// muss die Felder je Geraeteart kennen, um sie zu schneiden; es rechnet aber nichts aus der Art
// ab und liefert wieder ein Geraet. Weitere Ausnahmen, die ebenfalls nichts aus der Art
// berechnen: mitOkular() in daten und die URL-Serialisierung in zustand (docs/architektur.md).

import type { Bedingungen, Geraet, Konfiguration, Objektzustand, Paareingaben } from "../naht/konfiguration";
import { freiesPaar } from "./doppelstern";

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
  /**
   * Schritt der Eingabe: begrenze rundet darauf, bevor es schneidet. min und max sind Vielfache
   * des Schritts. Ein Schritt mit Nachkommastellen ist eine Zehnerpotenz mal einer ganzen Zahl
   * (0,1; 0,001).
   */
  schritt: number;
  /** Groeberer Schritt ab einem Wert (nur Trennung des freien Paars: 1'' ab 10''); ab und max sind Vielfache davon. */
  grob?: { ab: number; schritt: number };
}

/**
 * Bereiche nach A-F8 (Geraet und Okular), A-B1 (Seeing), A-B2 (Bortle), A-B4 (Hoehe), A-Z9 und
 * doppelsterne.md 3.2 (freies Paar: Trennung, Magnituden, B-V), Schritte
 * nach dem, was die Formularfelder anzeigen: Seeing 0,1, Bortle 1, Hoehe 5 Grad, Obstruktion
 * 0,1 Prozent. Die Okularbrennweite hat 0,01 mm, weil die Vergroesserung als Eingabe (A-F7) sie
 * auf 0,01 mm genau berechnet; ein groeberer Schritt veraenderte die eingegebene Vergroesserung.
 * Vergroesserung und wahres Gesichtsfeld gelten nur fuer das Fernglas: Die Werte kommen aus der
 * Geraeteliste (A-F4) oder aus einem Link; die Obergrenzen 1000 und 30 Grad schuetzen vor
 * unsinnigen Links (wie pruefeGeraete fuer die Liste). Die Vergroesserung eines Fernrohrs ist
 * durch Brennweite und Okular immer mindestens 4 (200 mm / 50 mm).
 */
export const GRENZEN = {
  oeffnungMm: { feld: "geraet.oeffnungMm", min: 6, max: 300, schritt: 1 },
  brennweiteMm: { feld: "geraet.brennweiteMm", min: 200, max: 4000, schritt: 1 },
  obstruktion: { feld: "geraet.obstruktion", min: 0, max: 0.5, schritt: 0.001 },
  okularBrennweiteMm: { feld: "geraet.okular.brennweiteMm", min: 2, max: 50, schritt: 0.01 },
  scheinbaresGesichtsfeldGrad: { feld: "geraet.okular.scheinbaresGesichtsfeldGrad", min: 40, max: 100, schritt: 1 },
  vergroesserung: { feld: "geraet.vergroesserung", min: 1, max: 1000, schritt: 1 },
  wahresGesichtsfeldGrad: { feld: "geraet.wahresGesichtsfeldGrad", min: 1, max: 30, schritt: 0.1 },
  seeingFwhmArcsec: { feld: "bedingungen.seeingFwhmArcsec", min: 0.5, max: 5, schritt: 0.1 },
  bortle: { feld: "bedingungen.bortle", min: 1, max: 9, schritt: 1 },
  hoeheGrad: { feld: "bedingungen.hoeheGrad", min: 10, max: 90, schritt: 5 },
  // Freies Paar (A-Z9): Bereiche und Schritte nach docs/recherche/doppelsterne.md 3.2.
  trennungArcsec: { feld: "objekt.paar.trennungArcsec", min: 0.1, max: 600, schritt: 0.05, grob: { ab: 10, schritt: 1 } },
  magnitudeA: { feld: "objekt.paar.magnitudeA", min: -1.5, max: 12, schritt: 0.1 },
  magnitudeB: { feld: "objekt.paar.magnitudeB", min: -1.5, max: 15, schritt: 0.1 },
  bvA: { feld: "objekt.paar.bvA", min: -0.4, max: 2, schritt: 0.05 },
  bvB: { feld: "objekt.paar.bvB", min: -0.4, max: 2, schritt: 0.05 }
} as const satisfies Record<string, Grenze>;

/**
 * wert auf ein Vielfaches von schritt gerundet (halbe Schritte nach oben), ohne Gleitkommareste: Das
 * Ergebnis ist genau die Zahl, die das Feld anzeigt (1,3 statt 1,3000000000000003). Gerechnet wird
 * in ganzen Vielfachen der kleinsten Stelle; mal 10 ist genauer als durch 0,1 (1,15 wird 1,2).
 * NaN und Unendlich bleiben, wie sie sind.
 */
export function aufSchritt(wert: number, schritt: number): number {
  const stellen = nachkommastellen(schritt);
  const faktor = 10 ** stellen;
  const ganz = Math.round(schritt * faktor);
  return (Math.round((wert * faktor) / ganz) * ganz) / faktor;
}

/** Nachkommastellen eines Schritts, z. B. 0,001 -> 3, 5 -> 0. */
function nachkommastellen(schritt: number): number {
  let stellen = 0;
  while (stellen < 10 && Math.round(schritt * 10 ** stellen) !== schritt * 10 ** stellen) stellen++;
  return stellen;
}

/**
 * Liefert eine begrenzte Kopie der Konfiguration und je Schnitt einen Hinweis; ohne Schnitt ist
 * die Liste leer. Jeder Wert wird auf den Schritt seines Felds gerundet und in [min, max]
 * gehalten. Gemeldet wird eine Eingabe, die vor dem Runden ausserhalb [min, max] liegt (mit der
 * ungerundeten Eingabe und dem neuen Wert); Runden innerhalb des Bereichs meldet nichts. NaN wird
 * auf die Untergrenze gesetzt und ebenfalls gemeldet. Das Objekt kommt aus den Daten, nicht
 * vom Nutzer, und wird unveraendert uebernommen; nur das freie Paar (mit paar) kommt vom Nutzer:
 * dessen Eingaben werden geschnitten und das Objekt mit freiesPaar neu gebildet, damit Sterne,
 * Gesamthelligkeit und Trennung zu den begrenzten Eingaben passen.
 */
export function begrenze(konfiguration: Konfiguration): { konfiguration: Konfiguration; hinweise: Hinweis[] } {
  const hinweise: Hinweis[] = [];
  const schneide = (wert: number, grenze: Grenze): number => {
    // Ob geschnitten wird, entscheidet die rohe Eingabe: 7,5 Grad liegt unter 10, auch wenn es
    // auf 10 rundet. min und max sind Vielfache des Schritts, eine Eingabe im Bereich rundet also in ihn.
    const schritt = grenze.grob !== undefined && wert >= grenze.grob.ab ? grenze.grob.schritt : grenze.schritt;
    const neu = Number.isNaN(wert) ? grenze.min : Math.min(grenze.max, Math.max(grenze.min, aufSchritt(wert, schritt)));
    if (Number.isNaN(wert) || wert < grenze.min || wert > grenze.max) hinweise.push({ feld: grenze.feld, eingabe: wert, wert: neu });
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

  // Reihenfolge der Hinweise wie in der Konfiguration: Geraet, Objekt, Bedingungen.
  const objekt = ((o: Objektzustand): Objektzustand => {
    if (o.paar === undefined) return o;
    const p: Paareingaben = o.paar;
    return freiesPaar({
      trennungArcsec: schneide(p.trennungArcsec, GRENZEN.trennungArcsec),
      magnitudeA: schneide(p.magnitudeA, GRENZEN.magnitudeA),
      magnitudeB: schneide(p.magnitudeB, GRENZEN.magnitudeB),
      bvA: schneide(p.bvA, GRENZEN.bvA),
      bvB: schneide(p.bvB, GRENZEN.bvB)
    });
  })(konfiguration.objekt);

  const eingabe = konfiguration.bedingungen;
  const bedingungen: Bedingungen = {
    seeingFwhmArcsec: schneide(eingabe.seeingFwhmArcsec, GRENZEN.seeingFwhmArcsec),
    bortle: schneide(eingabe.bortle, GRENZEN.bortle),
    transparenz: eingabe.transparenz,
    hoeheGrad: schneide(eingabe.hoeheGrad, GRENZEN.hoeheGrad)
  };

  return { konfiguration: { geraet, objekt, bedingungen }, hinweise };
}
