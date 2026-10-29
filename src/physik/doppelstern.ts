// Doppelsterne (A-Z9): das freie Paar aus seinen Eingaben als Objektzustand und der Hinweis
// "Ueberstrahlung nicht simuliert". Quelle: docs/recherche/doppelsterne.md 3.1 (Lage Ost-West),
// 3.2 (freies Paar) und 5 (Hinweis); Gesamthelligkeit in docs/recherche/physik.md Abschnitt 16.
// Liegt in physik, weil begrenze nach dem Schneiden von paar die Sterne neu bilden muss
// (docs/architektur.md 5.4). Die Bereiche der Eingaben stehen nur in begrenze (A-F8).

import { KENNUNG_FREIES_PAAR, type Objektzustand, type Paareingaben, type Stern } from "../naht/konfiguration";
import { UEBERSTRAHLUNG_ABSTAND_ARCSEC, UEBERSTRAHLUNG_DELTA_MAG } from "./konstanten";
import type { Warnung } from "./auswerten";

/**
 * Gesamthelligkeit mehrerer Sterne in mag: Fluesse addieren sich,
 * m = -2,5 log10(sum 10^(-0,4 m_i)) (physik.md Abschnitt 16). Zwei gleiche Sterne sind
 * 2,5 log10(2) = 0,753 mag heller als einer.
 */
export function gesamthelligkeit(magnituden: readonly number[]): number {
  return -2.5 * Math.log10(magnituden.reduce((summe, m) => summe + Math.pow(10, -0.4 * m), 0));
}

/**
 * Das freie Paar als Objektzustand (A-Z9): kennung "frei", klasse "doppelstern", A bei -rho/2 und
 * B bei +rho/2 auf der x-Achse (Ost-West, doppelsterne.md 3.1), Gesamthelligkeit aus beiden
 * Magnituden, durchmesserArcsec = Trennung (groesster Sternabstand), ohne quelle. paar traegt eine
 * Kopie der Eingaben. Prueft nichts und wirft nicht: begrenze schneidet die Eingaben vorher.
 */
export function freiesPaar(e: Paareingaben): Objektzustand {
  const halb = e.trennungArcsec / 2;
  const sterne: Stern[] = [
    { name: "A", dxArcsec: -halb, dyArcsec: 0, magnitude: e.magnitudeA, bv: e.bvA },
    { name: "B", dxArcsec: halb, dyArcsec: 0, magnitude: e.magnitudeB, bv: e.bvB }
  ];
  return {
    kennung: KENNUNG_FREIES_PAAR,
    klasse: "doppelstern",
    durchmesserArcsec: e.trennungArcsec,
    magnitude: gesamthelligkeit([e.magnitudeA, e.magnitudeB]),
    trabanten: [],
    sterne,
    paar: { ...e }
  };
}

/**
 * Warnung "ueberstrahlung" je Sternpaar mit Abstand unter 10'' und |Delta m| >= 4 (A-Z9,
 * Entscheidung 5 in docs/recherche/README.md): wert ist |Delta m| (auf 1e-6 mag), grenze 4, sterne die Namen in
 * Listenreihenfolge. Geprueft wird jedes Paar der Liste (Epsilon Lyrae hat vier Sterne); ohne
 * solches Paar ist die Liste leer.
 */
export function ueberstrahlung(sterne: readonly Stern[]): Warnung[] {
  const liste: Warnung[] = [];
  for (let i = 0; i < sterne.length; i++) {
    for (let j = i + 1; j < sterne.length; j++) {
      const a = sterne[i]!;
      const b = sterne[j]!;
      // Auf 1e-6 mag gerundet, damit 6,1 - 2,1 (3,9999999999999996) die Grenze 4 erreicht.
      const deltaMag = Math.round(Math.abs(a.magnitude - b.magnitude) * 1e6) / 1e6;
      const abstand = Math.hypot(b.dxArcsec - a.dxArcsec, b.dyArcsec - a.dyArcsec);
      if (abstand < UEBERSTRAHLUNG_ABSTAND_ARCSEC && deltaMag >= UEBERSTRAHLUNG_DELTA_MAG) {
        liste.push({ art: "ueberstrahlung", wert: deltaMag, grenze: UEBERSTRAHLUNG_DELTA_MAG, sterne: [a.name, b.name] });
      }
    }
  }
  return liste;
}
