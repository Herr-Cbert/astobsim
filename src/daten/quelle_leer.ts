// QuelleLeer: Quelle fuer Zustaende ohne Quellbild (Doppelsterne, M45, freies Paar; docs/architektur.md
// 5.5). Vertrag aus src/naht/quelle.ts: alles, was ein Ausschnitt nicht abdeckt, gilt als Schwarz;
// deshalb genuegt ein schwarzes Pixel an der angefragten Mitte im angefragten Massstab. bild faltet
// ohne Quellbild ohnehin nicht (5.5 Zeile bild); QuelleLeer haelt nur den Vertrag fuer die Steuerung.

import type { Objektpunkt, Quellausschnitt, Quelle } from "../naht/quelle";
import type { Kanaele } from "../naht/raster";
import { DatenFehler } from "./fehler";
import { schwarz } from "./pixelbereich";

export class QuelleLeer implements Quelle {
  constructor(readonly kanaele: Kanaele = 1) {
    if (kanaele !== 1 && kanaele !== 3) throw new DatenFehler("-", "QuelleLeer", "kanaele", `${String(kanaele)} ist weder 1 noch 3`);
  }

  /** Ein schwarzes Pixel, zentriert auf mitte, im angefragten Massstab; die Breite spielt keine Rolle. */
  ausschnitt(mitte: Objektpunkt, _breiteArcsec: number, massstabArcsecProPx: number): Quellausschnitt {
    if (!(massstabArcsecProPx > 0) || !Number.isFinite(massstabArcsecProPx)) {
      throw new DatenFehler("-", "QuelleLeer", "massstab", `${massstabArcsecProPx} ist kein positiver Massstab`);
    }
    return {
      raster: schwarz(1, 1, this.kanaele),
      massstabArcsecProPx,
      linksXArcsec: mitte.xArcsec - massstabArcsecProPx / 2,
      obenYArcsec: mitte.yArcsec + massstabArcsecProPx / 2
    };
  }
}
