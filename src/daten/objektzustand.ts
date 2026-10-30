// Objektzustand fuer die Naht aus den geprueften Listen von objekte.json und bilder.json: der
// Zustand liefert Winkelgroesse, Magnitude, Weisspegel, Trabanten, Sterne und Isophoten, der Bildnachweis die
// Pixelmasse. Der Massstab bezieht sich auf die Winkelgroesse des Zustands, nicht auf die des
// Nachweises (wie pyramidengeometrie in kacheln.ts): Winkelgroesse / objekt_durchmesser_px.
// Gemeinsame Stelle fuer ui (#9) und zustand (#16).

import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { OBJEKTE_DATEI, type Objekt, type ZustandEintrag } from "./objekte";
import type { Begleiter, Objektzustand, Stern } from "../naht/konfiguration";

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
 * pruefeVerweise ihn beim Laden schon ausschliesst. klasse kommt vom Objekt; quelle nur mit Bild,
 * isophoten nur bei Deep-Sky mit Bild, trabanten nur bei Sonnensystem, sterne bei Doppelstern und
 * Deep-Sky (docs/architektur.md 5.3). Beim Doppelstern ist durchmesserArcsec der groesste
 * Sternabstand (nur Anzeige).
 */
export function objektzustand(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[], zustandId: string): Objektzustand | undefined {
  const fund = findeZustand(objekte, zustandId);
  if (fund === undefined) return undefined;
  const { objekt, zustand } = fund;
  const sterne: Stern[] = zustand.sterne.map((s) => ({ name: s.name, dxArcsec: s.dxArcsec, dyArcsec: s.dyArcsec, magnitude: s.magnitude, bv: s.bv }));
  const ergebnis: Objektzustand = {
    kennung: zustand.id,
    klasse: objekt.klasse,
    durchmesserArcsec: objekt.klasse === "doppelstern" ? groessterAbstand(sterne) : pflicht(zustand.winkelgroesseArcsec, zustand.id, "winkelgroesse_arcsec"),
    magnitude: zustand.magnitude,
    trabanten: zustand.trabanten.map((t) => ({ ...t })),
    sterne
  };
  if (zustand.bild !== undefined) {
    const nachweis = nachweise.find((n) => n.id === zustand.bild);
    if (nachweis === undefined) {
      throw new DatenFehler(OBJEKTE_DATEI, zustand.id, "bild", `kein Bildnachweis "${zustand.bild}" in ${BILDER_DATEI}`);
    }
    // Quellweiss: bei log-Kennlinie (Deep-Sky) mag_hell, sonst weiss_mag_arcsec2 des Zustands.
    const weiss = nachweis.kennlinie?.magHell ?? pflicht(zustand.weissMagProArcsec2, zustand.id, "weiss_mag_arcsec2");
    ergebnis.quelle = {
      breitePx: nachweis.pixelBreite,
      hoehePx: nachweis.pixelHoehe,
      massstabArcsecProPx: pflicht(zustand.winkelgroesseArcsec, zustand.id, "winkelgroesse_arcsec") / nachweis.objektDurchmesserPx,
      weissMagProArcsec2: weiss
    };
    if (zustand.isophoten !== undefined) ergebnis.isophoten = zustand.isophoten.map((i) => ({ ...i }));
    if (zustand.begleiter !== undefined) {
      ergebnis.begleiter = zustand.begleiter.map((b): Begleiter => {
        const nb = nachweise.find((n) => n.id === b.bild);
        if (nb === undefined) throw new DatenFehler(OBJEKTE_DATEI, `${zustand.id}, begleiter ${b.id}`, "bild", `kein Bildnachweis "${b.bild}" in ${BILDER_DATEI}`);
        return {
          kennung: b.id,
          name: b.name,
          dxArcsec: b.dxArcsec,
          dyArcsec: b.dyArcsec,
          magnitude: b.magnitude,
          quelle: { breitePx: nb.pixelBreite, hoehePx: nb.pixelHoehe, massstabArcsecProPx: begleiterMassstab(nb) },
          isophoten: b.isophoten.map((i) => ({ ...i }))
        };
      });
    }
  }
  return ergebnis;
}

/**
 * Massstab eines Begleiterbilds (Issue #136): der des Bilds selbst, winkelgroesse_arcsec /
 * objekt_durchmesser_px des Nachweises (tools/ legt den Ausschnitt auf das Gitter des Hauptbilds);
 * er haengt nicht an der Winkelgroesse des Zustands.
 */
export function begleiterMassstab(nachweis: Bildnachweis): number {
  return nachweis.winkelgroesseArcsec / nachweis.objektDurchmesserPx;
}

/** Bildnachweise der Begleiter des Zustands kennung, in der Reihenfolge von begleiter; leer ohne Begleiter. */
export function begleiterNachweise(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[], kennung: string): Bildnachweis[] {
  const begleiter = findeZustand(objekte, kennung)?.zustand.begleiter ?? [];
  return begleiter.map((b) => {
    const n = nachweise.find((x) => x.id === b.bild);
    if (n === undefined) throw new DatenFehler(OBJEKTE_DATEI, `${kennung}, begleiter ${b.id}`, "bild", `kein Bildnachweis "${b.bild}" in ${BILDER_DATEI}`);
    return n;
  });
}

/** Wert, den pruefeObjekte fuer die Klasse schon verlangt; fehlt er doch, DatenFehler statt undefined. */
function pflicht(wert: number | undefined, zustandId: string, feld: string): number {
  if (wert === undefined) throw new DatenFehler(OBJEKTE_DATEI, zustandId, feld, "fehlt");
  return wert;
}

/** Groesster Abstand zweier Sterne in Bogensekunden; 0 bei weniger als zwei Sternen. */
function groessterAbstand(sterne: readonly Stern[]): number {
  let groesster = 0;
  for (let i = 0; i < sterne.length; i++) {
    for (let j = i + 1; j < sterne.length; j++) {
      groesster = Math.max(groesster, Math.hypot(sterne[j]!.dxArcsec - sterne[i]!.dxArcsec, sterne[j]!.dyArcsec - sterne[i]!.dyArcsec));
    }
  }
  return groesster;
}

/** Bildnachweis zum Zustand mit der id kennung (fuer Namensnennung und Bildquelle); undefined, wenn es keinen gibt. */
export function nachweisZu(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[], kennung: string): Bildnachweis | undefined {
  const bild = findeZustand(objekte, kennung)?.zustand.bild;
  return bild === undefined ? undefined : nachweise.find((n) => n.id === bild);
}
