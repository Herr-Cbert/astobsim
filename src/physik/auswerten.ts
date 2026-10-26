// auswerten (Stufe 3): Konfiguration zu Simulationsparametern, Anzeigewerten und Warnungen in
// einem Aufruf (docs/architektur.md Abschnitt 3, docs/entwuerfe/naht-variante-3.md Abschnitt 1.3,
// A-D4, A-D5, A-D7). Reihenfolge: optik -> atmosphaere -> aufloesung -> fenster -> arbeitsmassstab
// -> kernbeschreibung; dann nur bei geaendertem Kernschluessel baueKern; dann helligkeit,
// Punktquellen, Schluessel. Formeln stehen in den Stufe-1-Funktionen, hier kommt keine neue hinzu.
//
// Keine Memoisierung: Wiederverwendet wird nur der Kern aus vorher (architektur.md: ein vorher
// statt Cache). Bortle, Transparenz und Verschieben bauen keinen Kern; Seeing, Hoehe, Oeffnung,
// Obstruktion, Vergroesserung, Zoom und Quelle schon, wenn sie den gerundeten Schluessel aendern.

import type { Konfiguration } from "../naht/konfiguration";
import type { Fenster, Kern, Quellbild, Simulationsparameter } from "../naht/simulationsparameter";
import { arbeitsmassstab, kernbeschreibung, kernSchluessel } from "./arbeitsmassstab";
import { atmosphaere, seeingstufe } from "./atmosphaere";
import { type Aufloesung, aufloesung } from "./aufloesung";
import { PhysikFehler, pruefePositiv } from "./fehler";
import { helligkeit } from "./helligkeit";
import { baueKern } from "./kern";
import { ANZEIGE_PX_STANDARD, ARCSEC_PRO_GRAD, AUSTRITTSPUPILLE_MIN_MM, PUPILLE_MM, type Seeingwortstufe } from "./konstanten";
import { type Optik, optik, vergroesserungsgrenzen } from "./optik";
import { schluessel } from "./schluessel";

/**
 * Was neben dem Bild steht (A-D4): Vergroesserung, wahres Gesichtsfeld in Grad (Breite; beim
 * blossen Auge die Breite des Rechtecks), Austrittspupille in mm, die Aufloesung mit Rayleigh,
 * Dawes, den drei Grenzen und der dominanten, Seeing als Wortstufe und Pickering-Bereich zur
 * eingestellten Zenit-FWHM (A-B1), Luftmasse und Extinktion in mag. Texte macht ui.
 */
export interface Anzeigewerte {
  vergroesserung: number;
  wahresGesichtsfeldGrad: number;
  austrittspupilleMm: number;
  aufloesung: Aufloesung;
  seeingWortstufe: Seeingwortstufe;
  pickeringVon: number;
  pickeringBis: number;
  luftmasse: number;
  extinktionMag: number;
}

/**
 * Warnung nach A-D5 mit dem Wert und der ueberschrittenen Grenze: Austrittspupille ueber 6 mm
 * oder unter 0,5 mm (in mm), Vergroesserung ueber 2 D (als Vergroesserung). Unter 0,5 mm und
 * ueber 2 D fallen zusammen (AP = D / V), beide werden gemeldet, ui entscheidet ueber die Anzeige.
 */
export interface Warnung {
  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d";
  wert: number;
  grenze: number;
}

/** Ergebnis von auswerten: was bild braucht, was ui anzeigt, und die Warnungen. */
export interface Auswertung {
  parameter: Simulationsparameter;
  anzeige: Anzeigewerte;
  warnungen: Warnung[];
}

/**
 * fenster: was angezeigt wird (Zoom A-D3, Verschieben A-D2); ohne Angabe das ganze wahre
 * Gesichtsfeld, Objekt zentriert, anzeigePx Pixel (Standard 1024). anzeigePx gilt nur fuer das
 * Standardfenster. vorher: die Parameter des letzten Aufrufs, deren Kern bei gleichem Schluessel
 * wiederverwendet wird.
 */
export interface Auswertoptionen {
  fenster?: Fenster;
  anzeigePx?: number;
  vorher?: Simulationsparameter;
}

/** Standardfenster: ganzes wahres Gesichtsfeld (Breite der Maske), Objekt zentriert. */
function standardfenster(o: Optik, px: number): Fenster {
  return { breiteArcsec: o.gesichtsfeld.breiteArcsec, mitteXArcsec: 0, mitteYArcsec: 0, px };
}

/** Programmierfehler im Fenster: Mitte nicht endlich, px keine ganze Zahl (px < 16 und Breite <= 0 prueft arbeitsmassstab). */
function pruefeFenster(f: Fenster): void {
  if (!Number.isFinite(f.mitteXArcsec)) throw new PhysikFehler("fenster.mitteXArcsec", f.mitteXArcsec, "ist nicht endlich");
  if (!Number.isFinite(f.mitteYArcsec)) throw new PhysikFehler("fenster.mitteYArcsec", f.mitteYArcsec, "ist nicht endlich");
  if (!Number.isInteger(f.px)) throw new PhysikFehler("fenster.px", f.px, "ist keine ganze Zahl");
}

/**
 * Arbeitsraster zum Fenster: rasterPx ganzzahlig, Massstab genau fenster.breite / rasterPx
 * (Invariante rasterPx * massstab = fenster.breiteArcsec). rasterPx wird abgerundet, damit der
 * Massstab nie feiner als der aus arbeitsmassstab() wird (ADR-0002 bleibt erfuellt); mindestens 1.
 */
function arbeitsraster(fenster: Fenster, massstabMin: number): { rasterPx: number; massstabArcsecProPx: number } {
  // 1e-9: ist der Fenstermassstab massgebend, ergibt breite / (breite / px) sonst 1023,999... statt 1024.
  const rasterPx = Math.max(1, Math.floor(fenster.breiteArcsec / massstabMin + 1e-9));
  return { rasterPx, massstabArcsecProPx: fenster.breiteArcsec / rasterPx };
}

/** Warnungen nach A-D5; Schwellen aus physik.md Abschnitt 4. */
function warnungen(o: Optik): Warnung[] {
  const liste: Warnung[] = [];
  const ap = o.austrittspupilleMm;
  if (ap > PUPILLE_MM) liste.push({ art: "ap-ueber-6", wert: ap, grenze: PUPILLE_MM });
  if (ap < AUSTRITTSPUPILLE_MIN_MM) liste.push({ art: "ap-unter-0-5", wert: ap, grenze: AUSTRITTSPUPILLE_MIN_MM });
  const vMax = vergroesserungsgrenzen(o.oeffnungMm).max;
  if (o.vergroesserung > vMax) liste.push({ art: "v-ueber-2d", wert: o.vergroesserung, grenze: vMax });
  return liste;
}

/**
 * Wertet eine begrenzte Konfiguration aus. Ist vorher gereicht und der Kernschluessel gleich,
 * wird vorher.kern wiederverwendet, sonst baueKern (1 bis 20 ms). Ohne Kernbau unter 0,1 ms.
 *
 * Der Kern wird mit dem auf 4 Stellen gerundeten Massstab der Kernbeschreibung gebaut, traegt
 * aber den genauen Arbeitsmassstab des Quellbilds (Abweichung hoechstens 5e-4 relativ, die
 * Toleranz der Rundung), damit bild beide als gleich prueft.
 *
 * Wirft PhysikFehler nur bei Programmierfehlern: NaN, Oeffnung <= 0, V < 1, Obstruktion oder
 * Hoehe ausserhalb ihres Bereichs, Bortle keine Stufe 1 bis 9, Quellmassstab <= 0, Fenster mit
 * px < 16, px nicht ganzzahlig, Breite <= 0 oder Mitte nicht endlich. Nutzereingaben gehen
 * vorher durch begrenze().
 */
export function auswerten(k: Konfiguration, optionen: Auswertoptionen = {}): Auswertung {
  const o = optik(k.geraet);
  const a = atmosphaere(k.bedingungen);
  const aufl = aufloesung(o, a);
  const fenster = optionen.fenster ?? standardfenster(o, optionen.anzeigePx ?? ANZEIGE_PX_STANDARD);
  pruefeFenster(fenster);
  pruefePositiv("objekt.quelle.massstabArcsecProPx", k.objekt.quelle.massstabArcsecProPx);

  const { rasterPx, massstabArcsecProPx } = arbeitsraster(fenster, arbeitsmassstab(aufl, k.objekt.quelle, fenster));
  const beschreibung = kernbeschreibung(o, a, aufl, massstabArcsecProPx);
  const vorherKern = optionen.vorher?.kern;
  const gebaut: Kern = vorherKern !== undefined && vorherKern.schluessel === kernSchluessel(beschreibung) ? vorherKern : baueKern(beschreibung);
  const kern = gebaut.massstabArcsecProPx === massstabArcsecProPx ? gebaut : { ...gebaut, massstabArcsecProPx };

  // Die Mitte geht ungerundet in den Schluessel: Verschieben um weniger als die vierte Stelle
  // ist bei feinem Massstab mehrere Arbeitspixel weit. Punktquellen kommen mit Issue #14.
  const quellbild: Quellbild = {
    schluessel: schluessel("quellbild", k.objekt.kennung, massstabArcsecProPx, rasterPx, String(fenster.mitteXArcsec), String(fenster.mitteYArcsec)),
    objekt: k.objekt.kennung,
    massstabArcsecProPx,
    rasterPx,
    mitteXArcsec: fenster.mitteXArcsec,
    mitteYArcsec: fenster.mitteYArcsec,
    punktquellen: []
  };

  const stufe = seeingstufe(k.bedingungen.seeingFwhmArcsec);
  return {
    parameter: {
      quellbild,
      kern,
      helligkeit: helligkeit(o, a, k.bedingungen.bortle, k.objekt),
      gesichtsfeld: o.gesichtsfeld,
      fenster
    },
    anzeige: {
      vergroesserung: o.vergroesserung,
      wahresGesichtsfeldGrad: o.gesichtsfeld.breiteArcsec / ARCSEC_PRO_GRAD,
      austrittspupilleMm: o.austrittspupilleMm,
      aufloesung: aufl,
      seeingWortstufe: stufe.wortstufe,
      pickeringVon: stufe.pickeringVon,
      pickeringBis: stufe.pickeringBis,
      luftmasse: a.luftmasse,
      extinktionMag: a.extinktionMag
    },
    warnungen: warnungen(o)
  };
}
