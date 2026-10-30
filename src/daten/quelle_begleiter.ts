// Quelle eines Begleiters (Issue #136, ADR-0003 Nachtrag): das kleine Begleiterbild (M32 bei M31)
// als Quelle in den Objektkoordinaten des Hauptobjekts. Zwei Unterschiede zu QuelleEinzelbild:
// - Lage: die Bildmitte liegt nicht auf der Objektmitte, sondern bei dx/dy des Begleiters;
//   QuelleVersetzt verschiebt Anfrage und Antwort um diesen Versatz.
// - Pixelwerte: relativ zum Quellweiss des Hauptobjekts, nicht zu dem des Begleiterbilds; die
//   Dekodiertabelle der log-Kennlinie wird dazu mit 10^(-0,4 (mag_hell Begleiter - Quellweiss Haupt))
//   skaliert. So addieren sich Haupt- und Begleiterbild in bild ohne weiteren Faktor.

import type { Objektpunkt, Quellausschnitt, Quelle } from "../naht/quelle";
import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import type { KachelSrgb } from "./kacheln";
import { logTabelle } from "./kennlinie";
import { begleiterMassstab } from "./objektzustand";
import { QuelleEinzelbild } from "./quelle_einzelbild";

/** Quelle, deren Bild um (dx, dy) Bogensekunden gegen die Objektmitte versetzt liegt. */
export class QuelleVersetzt implements Quelle {
  constructor(
    private readonly innen: Quelle,
    readonly dxArcsec: number,
    readonly dyArcsec: number
  ) {}

  ausschnitt(mitte: Objektpunkt, breiteArcsec: number, massstabArcsecProPx: number): Quellausschnitt {
    const a = this.innen.ausschnitt({ xArcsec: mitte.xArcsec - this.dxArcsec, yArcsec: mitte.yArcsec - this.dyArcsec }, breiteArcsec, massstabArcsecProPx);
    return { ...a, linksXArcsec: a.linksXArcsec + this.dxArcsec, obenYArcsec: a.obenYArcsec + this.dyArcsec };
  }
}

/**
 * Quelle des Begleiters aus dem geladenen Begleiterbild (8-Bit-Kodes, log-Kennlinie): Massstab des
 * Bilds (begleiterMassstab), Mitte bei dx/dy, Werte relativ zu weissHauptMagProArcsec2.
 */
export function quelleBegleiter(nachweis: Bildnachweis, weissHauptMagProArcsec2: number, dxArcsec: number, dyArcsec: number, kodes: KachelSrgb): Quelle {
  const kennlinie = nachweis.kennlinie;
  if (kennlinie === undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kennlinie", "Begleiterbilder brauchen die log-Kennlinie");
  if (kodes.breite !== nachweis.pixelBreite || kodes.hoehe !== nachweis.pixelHoehe) {
    throw new DatenFehler(nachweis.datei, nachweis.id, "Masse", `${nachweis.pixelBreite}x${nachweis.pixelHoehe} laut ${BILDER_DATEI} erwartet, ${kodes.breite}x${kodes.hoehe} geladen`);
  }
  const faktor = Math.pow(10, -0.4 * (kennlinie.magHell - weissHauptMagProArcsec2));
  const tabelle = logTabelle(kennlinie).map((w) => w * faktor);
  return new QuelleVersetzt(new QuelleEinzelbild(kodes, begleiterMassstab(nachweis), tabelle), dxArcsec, dyArcsec);
}
