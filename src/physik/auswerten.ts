// auswerten (Stufe 3): Konfiguration zu Simulationsparametern, Anzeigewerten und Warnungen in
// einem Aufruf (docs/architektur.md Abschnitt 3, docs/entwuerfe/naht-variante-3.md Abschnitt 1.3,
// A-D4, A-D5, A-D7). Reihenfolge: optik -> atmosphaere -> aufloesung -> fenster -> arbeitsmassstab
// -> Arbeitsraster -> kernbeschreibung; dann nur bei geaendertem Kernschluessel baueKern; dann
// punktquellen, Quellbild mit Schluessel, helligkeit, Anzeigewerte, Warnungen. Formeln stehen in den Stufe-1-Funktionen, hier kommt keine neue hinzu.
//
// Keine Memoisierung: Wiederverwendet wird nur der Kern aus vorher (architektur.md: ein vorher
// statt Cache). Bortle, Transparenz und Verschieben bauen keinen Kern; Seeing, Hoehe, Oeffnung,
// Obstruktion, Vergroesserung, Zoom und Quelle schon, wenn sie den gerundeten Schluessel aendern.

import type { Konfiguration } from "../naht/konfiguration";
import type { Fenster, Kern, Punktquelle, Quellbild, Simulationsparameter } from "../naht/simulationsparameter";
import { arbeitsmassstab, kernbeschreibung, kernSchluessel } from "./arbeitsmassstab";
import { atmosphaere, seeingstufe } from "./atmosphaere";
import { type Aufloesung, aufloesung } from "./aufloesung";
import { PhysikFehler, pruefePositiv } from "./fehler";
import { helligkeit } from "./helligkeit";
import { baueKern } from "./kern";
import { ANZEIGE_PX_STANDARD, ARCSEC_PRO_GRAD, AUSTRITTSPUPILLE_MIN_MM, PUPILLE_MM, type Seeingwortstufe } from "./konstanten";
import { type Optik, optik, vergroesserungsgrenzen } from "./optik";
import { punktquellen } from "./punktquellen";
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
 * wiederverwendet wird. Dabei teilen sich alter und neuer Kern kern.daten: die Parameter nie per
 * Transfer verschicken (postMessage mit Transferliste), sonst ist vorher.kern.daten danach
 * detached und der naechste Reglerzug liefert einen leeren Kern. Ohne Transferliste wird kopiert.
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

/** Programmierfehler im Fenster: Mitte nicht endlich, px keine ganze Zahl (px < 16 und Breite <= 0 prueft arbeitsmassstab, zu schmale Breite arbeitsraster). */
function pruefeFenster(f: Fenster): void {
  if (!Number.isFinite(f.mitteXArcsec)) throw new PhysikFehler("fenster.mitteXArcsec", f.mitteXArcsec, "ist nicht endlich");
  if (!Number.isFinite(f.mitteYArcsec)) throw new PhysikFehler("fenster.mitteYArcsec", f.mitteYArcsec, "ist nicht endlich");
  if (!Number.isInteger(f.px)) throw new PhysikFehler("fenster.px", f.px, "ist keine ganze Zahl");
}

/**
 * Arbeitsraster zum Fenster: rasterPx ganzzahlig, Massstab genau fenster.breite / rasterPx
 * (Invariante rasterPx * massstab = fenster.breiteArcsec). rasterPx wird abgerundet, damit der
 * Massstab nie feiner als der aus arbeitsmassstab() wird (ADR-0002 bleibt erfuellt). Ein Fenster
 * schmaler als ein Arbeitspixel (Zoom unter 0,4 Gesamt-FWHM oder unter einem Quellpixel) ist ein
 * Programmierfehler der ui: PhysikFehler.
 */
function arbeitsraster(fenster: Fenster, massstabMin: number): { rasterPx: number; massstabArcsecProPx: number } {
  // 1e-9: ist der Fenstermassstab massgebend, ergibt breite / (breite / px) sonst 1023,999... statt 1024.
  const rasterPx = Math.floor(fenster.breiteArcsec / massstabMin + 1e-9);
  if (rasterPx < 1) {
    throw new PhysikFehler("fenster.breiteArcsec", fenster.breiteArcsec, `ist schmaler als ein Arbeitspixel (${massstabMin}'')`);
  }
  return { rasterPx, massstabArcsecProPx: fenster.breiteArcsec / rasterPx };
}

/**
 * Beruehrt das gemalte Scheibchen (Durchmesser mindestens ein Arbeitspixel, wie in bild/male.ts)
 * das Fenster? Grosszuegig mit einem Arbeitspixel Rand, damit der Schluessel nie eine gemalte
 * Punktquelle auslaesst.
 */
function imFenster(p: Punktquelle, fenster: Fenster, massstabArcsecProPx: number): boolean {
  const reichweite = fenster.breiteArcsec / 2 + Math.max(p.durchmesserArcsec, massstabArcsecProPx) / 2 + massstabArcsecProPx;
  return Math.abs(p.xArcsec - fenster.mitteXArcsec) < reichweite && Math.abs(p.yArcsec - fenster.mitteYArcsec) < reichweite;
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

  // Massstab und Mitte gehen ungerundet in den Schluessel, damit gleicher Schluessel gleiches
  // Ergebnis heisst: Verschieben um weniger als die vierte Stelle ist bei feinem Massstab mehrere
  // Arbeitspixel weit, und bild fragt mit rasterPx * massstab an. Die sichtbaren Punktquellen im
  // Fenster gehen mit allen Feldern ein, die bild malt: die Blendungsregel haengt von der
  // Vergroesserung ab, ein Okularwechsel kann also Stufe 1 aendern, ohne Ausschnitt oder Massstab
  // zu aendern. Punktquellen ganz ausserhalb des Fensters malt bild nicht, sie bleiben draussen.
  const punkte = punktquellen(k.objekt, o);
  const gemalt = punkte
    .filter((p) => p.sichtbar && imFenster(p, fenster, massstabArcsecProPx))
    .flatMap((p) => [p.name, p.xArcsec, p.yArcsec, p.durchmesserArcsec, p.helligkeitRelativ]);
  const quellbild: Quellbild = {
    schluessel: schluessel(
      "quellbild",
      k.objekt.kennung,
      String(massstabArcsecProPx),
      rasterPx,
      String(fenster.mitteXArcsec),
      String(fenster.mitteYArcsec),
      ...gemalt
    ),
    massstabArcsecProPx,
    rasterPx,
    mitteXArcsec: fenster.mitteXArcsec,
    mitteYArcsec: fenster.mitteYArcsec,
    punktquellen: punkte
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
