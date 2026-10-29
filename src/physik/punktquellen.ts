// Punktquellen (Stufe 1): Trabanten und Sterne eines Objektzustands als Punktquellen der Naht, mit
// Helligkeit relativ zu Quellweiss, Blendungsregel (A-P6, A-X2), Deckkraft nach der
// Wahrnehmungsschwelle (A-P11) und Sternfarbe (A-P12). Quelle: docs/recherche/physik.md,
// Abschnitte 7, 9, 13 (Herleitung 13.1, Blendungsregel 13.3), 18, 19 und 20 (gezeigte Deckkraft).
// Das Modul bild malt sie vor der Faltung als Scheibchen in die Punktebene (ADR-0002, Nachtrag
// 2026-10-27; physik.md Abschnitt 14), Deckkraft und Farbe in die Faerbung (docs/architektur.md 5.3).

import type { Objektzustand, Stern, Trabant } from "../naht/konfiguration";
import type { Punktquelle } from "../naht/simulationsparameter";
import type { Atmosphaere } from "./atmosphaere";
import { PhysikFehler, pruefePositiv } from "./fehler";
import { bezugMagProArcsec2 } from "./helligkeit";
import { BLENDUNG_ABSTAND_SCHEINBAR_ARCSEC, BLENDUNG_DELTA_MAG, DECKKRAFT_MIN, STERN_DURCHMESSER_ARCSEC } from "./konstanten";
import type { Optik } from "./optik";
import { deckkraft, deckkraftStern } from "./schwelle";
import { beleuchtungAmAugeLx, sternfarbe } from "./sternfarbe";

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

/** Etwas am Himmel, das eine Punktquelle blenden kann: Position in Objektkoordinaten und Magnitude. */
interface Blender {
  xArcsec: number;
  yArcsec: number;
  magnitude: number;
}

/**
 * Blendungsregel (A-P6, Abschnitt 13): geblendet, wenn ein Blender mehr als 6 mag heller ist und
 * scheinbar (Vergroesserung mal Mittenabstand am Himmel) unter 10' steht. Scheinbar, nicht am
 * Himmel: sonst unterdrueckte die Regel auch im 10x50 alle vier Jupitertrabanten (T6). Gilt fuer
 * Trabanten und Sterne (beide mit Lage und Magnitude).
 */
export function geblendet(t: Pick<Trabant, "dxArcsec" | "dyArcsec" | "magnitude">, blender: readonly Blender[], vergroesserung: number): boolean {
  return blender.some(
    (b) =>
      t.magnitude - b.magnitude > BLENDUNG_DELTA_MAG &&
      vergroesserung * Math.hypot(t.dxArcsec - b.xArcsec, t.dyArcsec - b.yArcsec) < BLENDUNG_ABSTAND_SCHEINBAR_ARCSEC
  );
}

/**
 * Gezeigte Deckkraft einer Punktquelle der Magnitude m bei der Grenzgroesse mLim (physik.md
 * Abschnitt 20): Blackwells Kurve P = deckkraftStern(m, mLim) ohne ihren Sockel P0 = deckkraft(0) =
 * 0,019 bei Kontrast 0, P' = (P - P0) / (1 - P0). Stetig und monoton, 0 fuer m gegen Unendlich, genau
 * 1 wo P genau 1 ist (alle Trabanten der Version 1), 0,490 an der Grenzgroesse. Dieselbe Korrektur
 * nennt ADR-0004 (Nachtrag) fuer die Deep-Sky-Ebene in bild. Ohne sie bekaeme jeder noch so schwache
 * Stern 1,9 % Deckkraft, und grund "unter_schwelle" (Deckkraft unter 1e-3) traete nie ein.
 */
export function deckkraftPunktquelle(magnitude: number, grenzgroesseMag: number): number {
  const p0 = deckkraft(0);
  return Math.min(1, Math.max(0, (deckkraftStern(magnitude, grenzgroesseMag) - p0) / (1 - p0)));
}

/**
 * Setzt Sichtbarkeit und Deckkraft nach der Schwelle: unter DECKKRAFT_MIN sichtbar false mit grund
 * "unter_schwelle" ohne deckkraft; deckkraft nur, wenn sie unter 1 liegt (fehlt = 1, Version 1).
 */
function nachSchwelle(p: Punktquelle, magnitude: number, grenzgroesseMag: number): void {
  const d = deckkraftPunktquelle(magnitude, grenzgroesseMag);
  if (d < DECKKRAFT_MIN) {
    p.sichtbar = false;
    p.grund = "unter_schwelle";
  } else if (d < 1) {
    p.deckkraft = d;
  }
}

/** Programmierfehler: Lage oder Magnitude einer Punktquelle nicht endlich (daten prueft das). */
function pruefeLage(name: string, dxArcsec: number, dyArcsec: number, magnitude: number): void {
  if (!Number.isFinite(dxArcsec)) throw new PhysikFehler(`${name}.dxArcsec`, dxArcsec, "ist nicht endlich");
  if (!Number.isFinite(dyArcsec)) throw new PhysikFehler(`${name}.dyArcsec`, dyArcsec, "ist nicht endlich");
  if (!Number.isFinite(magnitude)) throw new PhysikFehler(`${name}.magnitude`, magnitude, "ist nicht endlich");
}

/**
 * Die Trabanten und Sterne des Objektzustands als Punktquellen, erst die Trabanten, dann die Sterne,
 * je in Listenreihenfolge: Position (+x rechts, +y Norden) und Durchmesser in Bogensekunden (Sterne
 * STERN_DURCHMESSER_ARCSEC = 0,01''), Flaechenhelligkeit relativ zu Quellweiss (ohne Quellbild relativ
 * zu 0 mag/arcsec^2) ohne den gemeinsamen Faktor aus Helligkeit (punktFaktor).
 *
 * Sichtbarkeit in dieser Reihenfolge: Blendungsregel (grund "blendung"), dann die Schwelle (grund
 * "unter_schwelle", deckkraftPunktquelle unter 1e-3). Blender sind die Trabanten, die Sterne und nur
 * bei sonnensystem die Objektmitte (0/0, Magnitude des Zustands); bei Doppelstern und Deep-Sky blendet
 * die Mitte nicht, sonst blendete M13 seine eigenen Sterne (docs/architektur.md 5.1). deckkraft fehlt,
 * wenn sie 1 ist. farbe nur bei Sternen, aus B-V, wenn die Beleuchtungsstaerke am Auge die
 * Farbschwelle erreicht (sternfarbe.ts); Trabanten bleiben grau.
 *
 * Wirft PhysikFehler bei Durchmesser <= 0, nicht endlicher Magnitude, Position oder B-V
 * (Programmierfehler, daten prueft das).
 */
export function punktquellen(objekt: Objektzustand, o: Optik, atmosphaere: Atmosphaere, grenzgroesseMag: number): Punktquelle[] {
  const blender: Blender[] = [
    ...(objekt.klasse === "sonnensystem" ? [{ xArcsec: 0, yArcsec: 0, magnitude: objekt.magnitude }] : []),
    ...objekt.trabanten.map((t) => ({ xArcsec: t.dxArcsec, yArcsec: t.dyArcsec, magnitude: t.magnitude })),
    ...objekt.sterne.map((s) => ({ xArcsec: s.dxArcsec, yArcsec: s.dyArcsec, magnitude: s.magnitude }))
  ];
  const bezug = bezugMagProArcsec2(objekt);
  const baue = (t: Trabant | Stern, durchmesserArcsec: number): Punktquelle => {
    pruefeLage(t.name, t.dxArcsec, t.dyArcsec, t.magnitude);
    const punktquelle: Punktquelle = {
      name: t.name,
      xArcsec: t.dxArcsec,
      yArcsec: t.dyArcsec,
      durchmesserArcsec,
      helligkeitRelativ: helligkeitRelativ(t.magnitude, durchmesserArcsec, bezug),
      sichtbar: true
    };
    if (geblendet(t, blender, o.vergroesserung)) {
      punktquelle.sichtbar = false;
      punktquelle.grund = "blendung";
    } else {
      nachSchwelle(punktquelle, t.magnitude, grenzgroesseMag);
    }
    return punktquelle;
  };
  const trabanten = objekt.trabanten.map((t) => baue(t, t.durchmesserArcsec));
  const sterne = objekt.sterne.map((s) => {
    const punktquelle = baue(s, STERN_DURCHMESSER_ARCSEC);
    const farbe = sternfarbe(s.bv, beleuchtungAmAugeLx(s.magnitude, o, atmosphaere));
    if (farbe !== undefined) punktquelle.farbe = farbe;
    return punktquelle;
  });
  return [...trabanten, ...sterne];
}
