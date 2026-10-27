// Objektzustand fuer die Naht aus den geprueften Listen von objekte.json und bilder.json: der
// Zustand liefert Winkelgroesse, Magnitude, Weisspegel und Trabanten, der Bildnachweis die
// Pixelmasse. Der Massstab bezieht sich auf die Winkelgroesse des Zustands, nicht auf die des
// Nachweises (wie pyramidengeometrie in kacheln.ts): Winkelgroesse / objekt_durchmesser_px.
// Gemeinsame Stelle fuer ui (#9) und zustand (#16).

import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { OBJEKTE_DATEI, type Objekt, type ZustandEintrag } from "./objekte";
import type { Objektzustand } from "../naht/konfiguration";

/** Zustand mit seinem Objekt, gesucht ueber die global eindeutige Zustands-id. */
export function findeZustand(objekte: readonly Objekt[], zustandId: string): { objekt: Objekt; zustand: ZustandEintrag } | undefined {
  for (const objekt of objekte) {
    const zustand = objekt.zustaende.find((z) => z.id === zustandId);
    if (zustand !== undefined) return { objekt, zustand };
  }
  return undefined;
}

/**
 * Objektzustand zur Zustands-id; undefined, wenn es den Zustand nicht gibt (zustand faellt dann
 * auf die Voreinstellung zurueck). Ein fehlender Bildnachweis ist ein DatenFehler, weil
 * pruefeVerweise ihn beim Laden schon ausschliesst.
 */
export function objektzustand(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[], zustandId: string): Objektzustand | undefined {
  const fund = findeZustand(objekte, zustandId);
  if (fund === undefined) return undefined;
  const { zustand } = fund;
  const nachweis = nachweise.find((n) => n.id === zustand.bild);
  if (nachweis === undefined) {
    throw new DatenFehler(OBJEKTE_DATEI, zustand.id, "bild", `kein Bildnachweis "${zustand.bild}" in ${BILDER_DATEI}`);
  }
  return {
    kennung: zustand.id,
    durchmesserArcsec: zustand.winkelgroesseArcsec,
    magnitude: zustand.magnitude,
    quelle: {
      breitePx: nachweis.pixelBreite,
      hoehePx: nachweis.pixelHoehe,
      massstabArcsecProPx: zustand.winkelgroesseArcsec / nachweis.objektDurchmesserPx,
      weissMagProArcsec2: zustand.weissMagProArcsec2
    },
    trabanten: zustand.trabanten.map((t) => ({ ...t }))
  };
}

/** Bildnachweis zum Zustand mit der id kennung (fuer Namensnennung und Bildquelle); undefined, wenn es keinen gibt. */
export function nachweisZu(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[], kennung: string): Bildnachweis | undefined {
  const bild = findeZustand(objekte, kennung)?.zustand.bild;
  return bild === undefined ? undefined : nachweise.find((n) => n.id === bild);
}
