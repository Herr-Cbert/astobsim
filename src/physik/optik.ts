// Optikgroessen: Austrittspupille, Vergroesserungsgrenzen, Flaechenhelligkeit am Okular,
// und optik(): die einzige Stelle, die ueber Geraet.art verzweigt (docs/architektur.md
// Abschnitt 3). Quelle: docs/recherche/physik.md, Abschnitte 4, 5.1, 5.2 und 9. Laengen in mm.

import type { Gesichtsfeld } from "../naht/simulationsparameter";
import { PhysikFehler, pruefeBereich } from "./fehler";
import type { Geraet } from "./konfiguration";
import { ARCSEC_PRO_GRAD, AUGE_GESICHTSFELD_GRAD, PUPILLE_MM, TRANSMISSION, VERGROESSERUNG_MAX_PRO_MM } from "./konstanten";

/** Austrittspupille AP = D / V in mm (Abschnitt 4, [35]). */
export function austrittspupilleMm(oeffnungMm: number, vergroesserung: number): number {
  return oeffnungMm / vergroesserung;
}

/**
 * Sinnvolle Vergroesserungen (Abschnitt 4, [35]): min = D / 6 mm (Austrittspupille gleich
 * Augenpupille), max = 2 D (Austrittspupille 0,5 mm). Die Warnschwellen in A-D5.
 */
export function vergroesserungsgrenzen(oeffnungMm: number): { min: number; max: number } {
  return { min: oeffnungMm / PUPILLE_MM, max: VERGROESSERUNG_MAX_PRO_MM * oeffnungMm };
}

/**
 * Flaechenhelligkeit am Okular relativ zum blossen Auge: min(1, (AP / p)^2)
 * (Abschnitt 5.1, Tousey und Hulburt nach [32] Gl. 66). Ab AP >= p ist der Faktor 1:
 * kein Fernrohr zeigt eine Flaeche heller als das blosse Auge.
 */
export function flaechenhelligkeitsfaktor(austrittspupilleMm: number, pupilleMm: number = PUPILLE_MM): number {
  return Math.min(1, (austrittspupilleMm / pupilleMm) ** 2);
}

/**
 * Das Geraet als Skalare: Oeffnung in mm, Vergroesserung, Obstruktion 0 bis 0,5, Transmission
 * tau ohne Abschattung, Austrittspupille in mm, wahres Gesichtsfeld als Maske in Bogensekunden.
 */
export interface Optik {
  oeffnungMm: number;
  vergroesserung: number;
  obstruktion: number;
  transmission: number;
  austrittspupilleMm: number;
  gesichtsfeld: Gesichtsfeld;
}

/**
 * Ebnet Fernrohr, Fernglas und blosses Auge in Skalare ein; danach kommt die Geraeteart
 * nirgends mehr vor. Fernrohr: V = f_obj / f_ok, wGF = sGF / V, Kreis (Abschnitt 4, [35, 36]).
 * Fernglas: V und wGF fest, Kreis (A-F4). Auge: 6 mm, V = 1, Rechteck 5 Grad (A-F3, A-D1).
 * Wirft PhysikFehler bei Oeffnung <= 0, V < 1, Obstruktion ausserhalb 0 bis 0,5 oder NaN.
 */
export function optik(geraet: Geraet): Optik {
  switch (geraet.art) {
    case "fernrohr": {
      const vergroesserung = geraet.brennweiteMm / geraet.okular.brennweiteMm;
      const wahresGesichtsfeldGrad = geraet.okular.scheinbaresGesichtsfeldGrad / vergroesserung;
      return baueOptik(geraet.oeffnungMm, vergroesserung, geraet.obstruktion, TRANSMISSION[geraet.bauart], kreis(wahresGesichtsfeldGrad));
    }
    case "fernglas":
      return baueOptik(geraet.oeffnungMm, geraet.vergroesserung, 0, TRANSMISSION.fernglas, kreis(geraet.wahresGesichtsfeldGrad));
    case "auge":
      return baueOptik(PUPILLE_MM, 1, 0, TRANSMISSION.auge, {
        form: "rechteck",
        breiteArcsec: AUGE_GESICHTSFELD_GRAD * ARCSEC_PRO_GRAD,
        hoeheArcsec: AUGE_GESICHTSFELD_GRAD * ARCSEC_PRO_GRAD
      });
  }
}

/** Kreisfoermiges wahres Gesichtsfeld aus dem Durchmesser in Grad. */
function kreis(durchmesserGrad: number): Gesichtsfeld {
  const breiteArcsec = durchmesserGrad * ARCSEC_PRO_GRAD;
  return { form: "kreis", breiteArcsec, hoeheArcsec: breiteArcsec };
}

function baueOptik(oeffnungMm: number, vergroesserung: number, obstruktion: number, transmission: number, gesichtsfeld: Gesichtsfeld): Optik {
  pruefeBereich("oeffnungMm", oeffnungMm, Number.MIN_VALUE, Infinity);
  pruefeBereich("vergroesserung", vergroesserung, 1, Infinity);
  pruefeBereich("obstruktion", obstruktion, 0, 0.5);
  if (!(gesichtsfeld.breiteArcsec > 0)) throw new PhysikFehler("gesichtsfeld", gesichtsfeld.breiteArcsec, "ist nicht positiv");
  return {
    oeffnungMm,
    vergroesserung,
    obstruktion,
    transmission,
    austrittspupilleMm: austrittspupilleMm(oeffnungMm, vergroesserung),
    gesichtsfeld
  };
}
