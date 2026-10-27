// Punktquellen (Stufe 1): Trabanten eines Objektzustands als Punktquellen der Naht, mit Helligkeit
// relativ zu Quellweiss und Blendungsregel (A-P6, A-X2). Quelle: docs/recherche/physik.md,
// Abschnitte 7, 9 und 13 (Herleitung 13.1, Blendungsregel 13.3). Das Modul bild malt sie vor der Faltung als Scheibchen in die Punktebene (ADR-0002, Nachtrag 2026-10-27; physik.md Abschnitt 14).

import type { Objektzustand, Trabant } from "../naht/konfiguration";
import type { Punktquelle } from "../naht/simulationsparameter";
import { PhysikFehler, pruefePositiv } from "./fehler";
import { BLENDUNG_ABSTAND_SCHEINBAR_ARCSEC, BLENDUNG_DELTA_MAG } from "./konstanten";
import type { Optik } from "./optik";

/**
 * Mittlere Flaechenhelligkeit einer gleichmaessig hellen Scheibe in mag/arcsec^2 aus Magnitude m
 * und Winkeldurchmesser d: mu = m + 2,5 log10(pi (d/2)^2) (physik.md Abschnitt 13.1, [60]).
 */
export function scheibenFlaechenhelligkeit(magnitude: number, durchmesserArcsec: number): number {
  if (!Number.isFinite(magnitude)) throw new PhysikFehler("magnitude", magnitude, "ist nicht endlich");
  pruefePositiv("durchmesserArcsec", durchmesserArcsec);
  return magnitude + 2.5 * Math.log10(Math.PI * (durchmesserArcsec / 2) ** 2);
}

/**
 * Flaechenhelligkeit der Trabantenscheibe relativ zu Quellweiss, linear:
 * 10^(-0,4 (mu_Trabant - mu_Quellweiss)) (Abschnitt 13.1). Herleitung: Fluss am Auge
 * ~ 10^(-0,4 m) a tau (1 - eps^2) min(D, p V)^2 (Abschnitt 7, 9), Bildflaeche ~ V^2, also
 * Flaechenhelligkeit ~ a tau (1 - eps^2) min(AP, p)^2 wie beim Objekt (Abschnitt 5.1). Atmosphaere,
 * Transmission, Abschattung und Austrittspupille stecken daher fuer beide in Helligkeit (faktorObjekt, fuer die Punktebene punktFaktor);
 * die Oeffnung wirkt ueber die PSF, die den Fluss bei der Faltung verteilt.
 */
export function helligkeitRelativ(magnitude: number, durchmesserArcsec: number, weissMagProArcsec2: number): number {
  if (!Number.isFinite(weissMagProArcsec2)) throw new PhysikFehler("weissMagProArcsec2", weissMagProArcsec2, "ist nicht endlich");
  return Math.pow(10, -0.4 * (scheibenFlaechenhelligkeit(magnitude, durchmesserArcsec) - weissMagProArcsec2));
}

/** Etwas am Himmel, das einen Trabanten blenden kann: Position in Objektkoordinaten und Magnitude. */
interface Blender {
  xArcsec: number;
  yArcsec: number;
  magnitude: number;
}

/**
 * Blendungsregel (A-P6, Abschnitt 13): geblendet, wenn ein Blender mehr als 6 mag heller ist und
 * scheinbar (Vergroesserung mal Mittenabstand am Himmel) unter 10' steht. Scheinbar, nicht am
 * Himmel: sonst unterdrueckte die Regel auch im 10x50 alle vier Jupitertrabanten (T6).
 */
export function geblendet(t: Trabant, blender: readonly Blender[], vergroesserung: number): boolean {
  return blender.some(
    (b) =>
      t.magnitude - b.magnitude > BLENDUNG_DELTA_MAG &&
      vergroesserung * Math.hypot(t.dxArcsec - b.xArcsec, t.dyArcsec - b.yArcsec) < BLENDUNG_ABSTAND_SCHEINBAR_ARCSEC
  );
}

/**
 * Die Trabanten des Objektzustands als Punktquellen: Position (+x rechts, +y Norden) und
 * Durchmesser in Bogensekunden, Flaechenhelligkeit relativ zu Quellweiss ohne den gemeinsamen
 * Faktor aus Helligkeit (punktFaktor), sichtbar false mit grund "blendung" nach der Blendungsregel.
 * Blender sind das Objekt selbst (Mitte 0/0) und die anderen Trabanten. Wirft PhysikFehler bei
 * Durchmesser <= 0, nicht endlicher Magnitude oder Position (Programmierfehler, daten prueft das).
 */
export function punktquellen(objekt: Objektzustand, o: Optik): Punktquelle[] {
  const blender: Blender[] = [
    { xArcsec: 0, yArcsec: 0, magnitude: objekt.magnitude },
    ...objekt.trabanten.map((t) => ({ xArcsec: t.dxArcsec, yArcsec: t.dyArcsec, magnitude: t.magnitude }))
  ];
  return objekt.trabanten.map((t) => {
    if (!Number.isFinite(t.dxArcsec)) throw new PhysikFehler(`${t.name}.dxArcsec`, t.dxArcsec, "ist nicht endlich");
    if (!Number.isFinite(t.dyArcsec)) throw new PhysikFehler(`${t.name}.dyArcsec`, t.dyArcsec, "ist nicht endlich");
    const punktquelle: Punktquelle = {
      name: t.name,
      xArcsec: t.dxArcsec,
      yArcsec: t.dyArcsec,
      durchmesserArcsec: t.durchmesserArcsec,
      helligkeitRelativ: helligkeitRelativ(t.magnitude, t.durchmesserArcsec, objekt.quelle.weissMagProArcsec2),
      sichtbar: true
    };
    if (geblendet(t, blender, o.vergroesserung)) {
      punktquelle.sichtbar = false;
      punktquelle.grund = "blendung";
    }
    return punktquelle;
  });
}
