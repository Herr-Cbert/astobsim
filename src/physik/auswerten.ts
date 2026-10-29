// auswerten (Stufe 3): Konfiguration zu Simulationsparametern, Anzeigewerten und Warnungen in
// einem Aufruf (docs/architektur.md Abschnitt 3 und 5.4, docs/entwuerfe/naht-variante-3.md
// Abschnitt 1.3, A-D4, A-D5, A-D7). Reihenfolge: optik -> atmosphaere -> aufloesung -> fenster ->
// arbeitsmassstab (ohne Quellbild ohne Quellgrenze) -> Arbeitsraster -> kernbeschreibung; dann nur
// bei geaendertem Kernschluessel baueKern; dann grenzgroesse -> punktquellen (Trabanten und Sterne
// mit Deckkraft und Farbe), Quellbild mit Schluesseln fuer Objektraster und Punkte -> helligkeit
// (intern mischgewicht, bei deep_sky sichtbareIsophote und sockel) -> Anzeigewerte -> Warnungen mit
// ueberstrahlung. Formeln stehen in den Stufe-1-Funktionen, hier kommt keine neue hinzu.
//
// Keine Memoisierung: Wiederverwendet wird nur der Kern aus vorher (architektur.md: ein vorher
// statt Cache). Bortle, Transparenz und Verschieben bauen keinen Kern; Seeing, Hoehe, Oeffnung,
// Obstruktion, Vergroesserung, Zoom und Quelle schon, wenn sie den gerundeten Schluessel aendern.

import type { Konfiguration, Objektklasse, Objektzustand } from "../naht/konfiguration";
import type { Fenster, Kern, Punktquelle, Quellbild, Simulationsparameter } from "../naht/simulationsparameter";
import { arbeitsmassstab, kernbeschreibung, kernSchluessel } from "./arbeitsmassstab";
import { atmosphaere, seeingstufe } from "./atmosphaere";
import { type Aufloesung, aufloesung } from "./aufloesung";
import { ueberstrahlung } from "./doppelstern";
import { PhysikFehler, pruefePositiv } from "./fehler";
import { bortleMagProArcsec2, helligkeitUndIsophote } from "./helligkeit";
import { baueKern } from "./kern";
import { ANZEIGE_PX_STANDARD, ARCSEC_PRO_GRAD, AUSTRITTSPUPILLE_MIN_MM, PUPILLE_MM, type Seeingwortstufe } from "./konstanten";
import { type Optik, optik, vergroesserungsgrenzen } from "./optik";
import { punktquellen } from "./punktquellen";
import { schluessel } from "./schluessel";
import { grenzgroesse } from "./schwelle";

/**
 * Objektklassen, fuer die auswerten die Warnung ueberstrahlung prueft (A-Z9, Entscheidung 5 in
 * docs/recherche/README.md betrifft Doppelsterne). Nicht deep_sky: das Trapez in M42 (Theta1 Ori C
 * gegen die schwachen Komponenten) oder Sternpaare in M45 schluegen sonst an, ohne dass die
 * Warnung dort etwas erklaert. Entschieden von Herbert am 2026-10-29 (ADR-0004, Nachtrag Issue #100).
 */
const UEBERSTRAHLUNG_KLASSEN: readonly Objektklasse[] = ["doppelstern"];

/**
 * Was neben dem Bild steht (A-D4): Vergroesserung, wahres Gesichtsfeld in Grad (Breite; beim
 * blossen Auge die Breite des Rechtecks), Austrittspupille in mm, die Aufloesung mit Rayleigh,
 * Dawes, den drei Grenzen und der dominanten, Seeing als Wortstufe und Pickering-Bereich zur
 * eingestellten Zenit-FWHM (A-B1), Luftmasse und Extinktion in mag. Texte macht ui.
 * Version 2 (docs/architektur.md 5.3): Grenzgroesse der Sterne am Okular mit Extinktion (A-P11,
 * Seeing am Objekt), sichtbare Isophote bei deep_sky mit Flaechentabelle, Mischgewicht bei
 * sonnensystem (Hilfetext "unaufgeloest", A-P10; 0 heisst Flaeche).
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
  grenzgroesseMag: number;
  isophote?: { magProArcsec2: number; flaecheArcsec2: number; alleSichtbar: boolean };
  mischgewicht?: number;
}

/**
 * Warnung nach A-D5 mit dem Wert und der ueberschrittenen Grenze: Austrittspupille ueber 6 mm
 * oder unter 0,5 mm (in mm), Vergroesserung ueber 2 D (als Vergroesserung). Unter 0,5 mm und
 * ueber 2 D fallen zusammen (AP = D / V), beide werden gemeldet, ui entscheidet ueber die Anzeige.
 * ueberstrahlung (A-Z9, Version 2): wert ist |Delta m| der beiden Sterne, grenze 4.
 */
export interface Warnung {
  art: "ap-ueber-6" | "ap-unter-0-5" | "v-ueber-2d" | "ueberstrahlung";
  wert: number;
  grenze: number;
  /** Nur ueberstrahlung: die beiden Sterne. */
  sterne?: [string, string];
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

/** Warnungen nach A-D5 (Schwellen aus physik.md Abschnitt 4), danach ueberstrahlung (A-Z9) fuer UEBERSTRAHLUNG_KLASSEN. */
function warnungen(o: Optik, objekt: Objektzustand): Warnung[] {
  const liste: Warnung[] = [];
  const ap = o.austrittspupilleMm;
  if (ap > PUPILLE_MM) liste.push({ art: "ap-ueber-6", wert: ap, grenze: PUPILLE_MM });
  if (ap < AUSTRITTSPUPILLE_MIN_MM) liste.push({ art: "ap-unter-0-5", wert: ap, grenze: AUSTRITTSPUPILLE_MIN_MM });
  const vMax = vergroesserungsgrenzen(o.oeffnungMm).max;
  if (o.vergroesserung > vMax) liste.push({ art: "v-ueber-2d", wert: o.vergroesserung, grenze: vMax });
  if (UEBERSTRAHLUNG_KLASSEN.includes(objekt.klasse)) liste.push(...ueberstrahlung(objekt.sterne));
  return liste;
}

/**
 * Felder einer gemalten Punktquelle fuer den Schluessel von Stufe 1b: Lage, Durchmesser, Fluss
 * (helligkeitRelativ), Deckkraft und Farbe. Deckkraft und Farbe nur, wenn gesetzt, mit Kennwort davor:
 * so bleibt der Schluessel der Punktquellen aus Version 1 (Deckkraft 1, grau) gleich und bild malt die
 * Punktebene bei einem Farbwechsel neu (Hinweis aus PR #120).
 */
function punkteFelder(p: Punktquelle): (number | string)[] {
  const felder: (number | string)[] = [p.name, p.xArcsec, p.yArcsec, p.durchmesserArcsec, p.helligkeitRelativ];
  if (p.deckkraft !== undefined) felder.push("deckkraft", p.deckkraft);
  if (p.farbe !== undefined) felder.push("farbe", ...p.farbe);
  return felder;
}

/**
 * Wertet eine begrenzte Konfiguration aus. Ist vorher gereicht und der Kernschluessel gleich,
 * wird vorher.kern wiederverwendet, sonst baueKern (1 bis 20 ms). Ohne Kernbau unter 0,1 ms.
 *
 * Der Kern wird mit dem auf 4 Stellen gerundeten Massstab der Kernbeschreibung gebaut, traegt
 * aber den genauen Arbeitsmassstab des Quellbilds (Abweichung hoechstens 5e-4 relativ, die
 * Toleranz der Rundung), damit bild beide als gleich prueft.
 *
 * Zustaende ohne Quellbild (Doppelstern, M45) rechnen ohne Quellgrenze im Arbeitsmassstab und mit
 * Bezug 0 mag/arcsec^2 fuer die Helligkeiten (docs/architektur.md 5.2); bild malt dann nur Himmel und
 * Punktquellen.
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
  const quelle = k.objekt.quelle;
  if (quelle !== undefined) pruefePositiv("objekt.quelle.massstabArcsecProPx", quelle.massstabArcsecProPx);

  const { rasterPx, massstabArcsecProPx } = arbeitsraster(fenster, arbeitsmassstab(aufl, quelle, fenster));
  const beschreibung = kernbeschreibung(o, a, aufl, massstabArcsecProPx);
  const vorherKern = optionen.vorher?.kern;
  const gebaut: Kern = vorherKern !== undefined && vorherKern.schluessel === kernSchluessel(beschreibung) ? vorherKern : baueKern(beschreibung);
  const kern = gebaut.massstabArcsecProPx === massstabArcsecProPx ? gebaut : { ...gebaut, massstabArcsecProPx };

  // Grenzgroesse am Okular (A-P11) mit dem Seeing am Objekt, wie im Kern: dieselbe FWHM, die das
  // Sternbild verbreitert, setzt die Seeing-Scheibe der Schwelle (ADR-0004, Nachtrag Issue #100).
  const muHimmel = bortleMagProArcsec2(k.bedingungen.bortle);
  const grenzgroesseMag = grenzgroesse(o, a, muHimmel, a.seeingFwhmArcsec);

  // Massstab und Mitte gehen ungerundet in den Schluessel, damit gleicher Schluessel gleiches
  // Ergebnis heisst: Verschieben um weniger als die vierte Stelle ist bei feinem Massstab mehrere
  // Arbeitspixel weit, und bild fragt mit rasterPx * massstab an. Die Punktquellen haben einen
  // eigenen Schluessel (Stufe 1b, docs/architektur.md 5.4), damit Bortle, Transparenz und Seeing
  // das Objektraster nicht neu rechnen lassen. In ihn gehen die sichtbaren Punktquellen im Fenster
  // mit allen Feldern ein, die bild malt (punkteFelder): die Blendungsregel haengt von der
  // Vergroesserung ab, Deckkraft und Farbe auch von Bortle, Transparenz, Hoehe und Seeing; Stufe 1b
  // kann sich also aendern, ohne dass Ausschnitt oder Massstab sich aendern.
  // Punktquellen ganz ausserhalb des Fensters malt bild nicht, sie bleiben draussen.
  const punkte = punktquellen(k.objekt, o, a, grenzgroesseMag);
  const gemalt = punkte.filter((p) => p.sichtbar && imFenster(p, fenster, massstabArcsecProPx)).flatMap(punkteFelder);
  const quellbild: Quellbild = {
    schluessel: schluessel(
      "quellbild",
      k.objekt.kennung,
      String(massstabArcsecProPx),
      rasterPx,
      String(fenster.mitteXArcsec),
      String(fenster.mitteYArcsec)
    ),
    massstabArcsecProPx,
    rasterPx,
    mitteXArcsec: fenster.mitteXArcsec,
    mitteYArcsec: fenster.mitteYArcsec,
    punkte: { schluessel: schluessel("punkte", ...gemalt), punktquellen: punkte }
  };

  const { helligkeit, isophote } = helligkeitUndIsophote(o, a, k.bedingungen.bortle, k.objekt);
  const stufe = seeingstufe(k.bedingungen.seeingFwhmArcsec);
  const anzeige: Anzeigewerte = {
    vergroesserung: o.vergroesserung,
    wahresGesichtsfeldGrad: o.gesichtsfeld.breiteArcsec / ARCSEC_PRO_GRAD,
    austrittspupilleMm: o.austrittspupilleMm,
    aufloesung: aufl,
    seeingWortstufe: stufe.wortstufe,
    pickeringVon: stufe.pickeringVon,
    pickeringBis: stufe.pickeringBis,
    luftmasse: a.luftmasse,
    extinktionMag: a.extinktionMag,
    grenzgroesseMag
  };
  if (isophote !== undefined) {
    anzeige.isophote = { magProArcsec2: isophote.magProArcsec2, flaecheArcsec2: isophote.flaecheArcsec2, alleSichtbar: isophote.alleSichtbar };
  }
  if (k.objekt.klasse === "sonnensystem") anzeige.mischgewicht = helligkeit.mischgewicht;
  return {
    parameter: { quellbild, kern, helligkeit, gesichtsfeld: o.gesichtsfeld, fenster },
    anzeige,
    warnungen: warnungen(o, k.objekt)
  };
}
