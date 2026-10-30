// Naht zwischen physik, bild und ui: nur Typen, strukturiert klonbar (keine Klassen,
// keine Funktionen, Float32Array erlaubt). Verbindlich nach docs/architektur.md Abschnitt 3,
// Details in docs/entwuerfe/naht-variante-3.md Abschnitt 1.2.
//
// Koordinaten: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Einheit Bogensekunden.
// Helligkeiten relativ zu Quellweiss (1,0 = Flaechenhelligkeit, die Weiss im Quellbild
// bedeutet), linear. Massstaebe in Bogensekunden je Pixel.
//
// Vertrag fuer bild: Anblick = tonwert(falte(mittele(quelle, quellbild), kern),
// faltePunkte(quellbild.punkte.punktquellen, kern), helligkeit), maskiert mit gesichtsfeld, gezeichnet
// in fenster. Version 2 (docs/architektur.md 5.3): Objektraster (Stufe 1) und Punkte (Stufe 1b)
// tragen getrennte Schluessel, damit ein Zug an Bortle das Objektraster nicht neu faltet.
// Punktquellen liegen in einer eigenen Ebene (Issue #72), nicht im Objektraster, weil tonwert sie
// je Pixel abbildet (docs/recherche/physik.md Abschnitt 14). Jede Stufe traegt einen Schluessel aus
// den gerundeten Eingangsgroessen: gleicher Schluessel heisst gleiches Ergebnis, bild darf das
// Zwischenergebnis der Stufe behalten.

/**
 * Was angezeigt wird: Breite am Himmel in Bogensekunden, Mitte in Objektkoordinaten,
 * Kantenlaenge in Anzeigepixeln. Zoom und Verschieben sind nur andere Fenster.
 */
export interface Fenster {
  breiteArcsec: number;
  mitteXArcsec: number;
  mitteYArcsec: number;
  px: number;
}

/**
 * Stufe 1: Ausschnitt des Quellbilds auf das Arbeitsraster mitteln; Stufe 1b: Punktquellen malen.
 * Invariante: rasterPx * massstabArcsecProPx = fenster.breiteArcsec.
 */
export interface Quellbild {
  /** Objektraster: kennung, Massstab, rasterPx, Mitte; ohne Punktquellen. */
  schluessel: string;
  /** Arbeitsmassstab in Bogensekunden je Arbeitspixel. */
  massstabArcsecProPx: number;
  /** Kantenlaenge des quadratischen Arbeitsrasters in Arbeitspixeln. */
  rasterPx: number;
  /** Mitte des Ausschnitts in Objektkoordinaten, gleich Fenster.mitte. */
  mitteXArcsec: number;
  mitteYArcsec: number;
  /**
   * Stufe 1b: vor der Faltung als Scheibchen in die Punktebene malen (nicht ins Objektraster,
   * Issue #72). Der Schluessel enthaelt Lage, Fluss, Deckkraft und Farbe je gemalter Punktquelle.
   */
  punkte: { schluessel: string; punktquellen: Punktquelle[] };
}

/**
 * Trabant als Punktquelle: Position und Durchmesser in Bogensekunden in Objektkoordinaten.
 * helligkeitRelativ ist die Flaechenhelligkeit relativ zu Quellweiss ohne den gemeinsamen
 * Faktor aus Helligkeit (punktFaktor, punktExponent); ohne Quellbild relativ zu 0 mag/arcsec^2.
 * Blendungsregel (A-P6) und Wahrnehmungsschwelle (A-P11) sind bereits entschieden: sichtbar false
 * mit grund "blendung" heisst unterdrueckt, mit "unter_schwelle" Deckkraft unter 1e-3, nicht gemalt;
 * ui kann das erklaeren.
 */
export interface Punktquelle {
  name: string;
  xArcsec: number;
  yArcsec: number;
  durchmesserArcsec: number;
  helligkeitRelativ: number;
  sichtbar: boolean;
  grund?: "blendung" | "unter_schwelle";
  /** (0, 1], Blackwell (A-P11); fehlt = 1. */
  deckkraft?: number;
  /** Linear sRGB (D65), Y = 1 (A-P12); fehlt = grau. */
  farbe?: [number, number, number];
}

/**
 * Stufe 2: die Gesamt-PSF als diskrete Matrix im Arbeitsmassstab, Eingabe der Faltung.
 * daten hat groesse * groesse Werte, zeilenweise, Summe 1 (Toleranz 1e-6), punktsymmetrisch,
 * keine negativen Werte. groesse und radius in Arbeitspixeln, groesse = 2 * radius + 1, ungerade, 5 bis 81.
 * massstabArcsecProPx ist gleich Quellbild.massstabArcsecProPx.
 */
export interface Kern {
  schluessel: string;
  /** Fuer Tests und zum Ableiten des Vergleichskerns (ui/zoom.ts), nicht fuer bild. */
  beschreibung: Kernbeschreibung;
  groesse: number;
  radius: number;
  /**
   * Genauer Arbeitsmassstab, gleich Quellbild.massstabArcsecProPx. Die daten sind mit dem auf
   * 4 Stellen gerundeten beschreibung.massstabArcsecProPx gerechnet, Abweichung hoechstens 5e-4.
   */
  massstabArcsecProPx: number;
  /**
   * Bei Wiederverwendung ueber vorher teilen sich aufeinanderfolgende Kerne dieses Array: nie per
   * Transfer (postMessage-Transferliste) verschicken, sonst ist es beim naechsten Aufruf detached.
   */
  daten: Float32Array;
}

/**
 * Die fuenf Groessen, aus denen der Kern entsteht, alle auf 4 signifikante Stellen gerundet.
 * Oeffnung in mm, Obstruktion als Verhaeltnis 0 bis 0,5, Seeing-FWHM am Objekt und
 * Augen-FWHM (60 Bogensekunden durch Vergroesserung) in Bogensekunden, Massstab in
 * Bogensekunden je Arbeitspixel.
 */
export interface Kernbeschreibung {
  oeffnungMm: number;
  obstruktion: number;
  seeingFwhmArcsec: number;
  augeFwhmArcsec: number;
  massstabArcsecProPx: number;
}

/**
 * Stufe 3: Tonwert je Arbeitspixel. faktorObjekt und hintergrundRelativ sind Anzeigehelligkeiten
 * (GLOSSARY: linear, 1 = Bildschirmweiss vor der sRGB-Kodierung), nicht die physikalische Daempfung
 * (Issue #55, docs/recherche/physik.md Abschnitt 12): faktorObjekt > 0 ist die Anzeigehelligkeit von
 * Quellweiss aus der Flaechenhelligkeit im Okular (Transmission, Abschattung, Extinktion,
 * Austrittspupille); sie darf 1 uebersteigen (Mars, physik.md 14.4), begrenzt wird erst das Pixel
 * beim Zeichnen. hintergrundRelativ in (0, 1] ist die des Himmels im Okular (Grauton des
 * Gesichtsfelds). Das Quellbild bleibt linear: Pixel mal faktorObjekt plus hintergrundRelativ.
 *
 * Punktebene (Issue #72, physik.md Abschnitt 14): jedes Pixel p (relativ zu Quellweiss) wird wie eine
 * eigene Flaeche abgebildet und addiert: min(1, (punktFaktor * p)^punktExponent). punktFaktor ist die
 * Leuchtdichte von Quellweiss im Okular relativ zum Punktweiss (linear, nicht komprimiert),
 * punktExponent der Kompressionsexponent. faktorObjekt = punktFaktor^punktExponent galt nur, solange
 * Anzeigeweiss und Punktweiss gleich waren (Version 1 beide 3,35; Version 2 8,9 und 6,9, A-P13).
 * hintergrundMagProArcsec2 ist physikalisch; heute liest es niemand ausser dem Schluessel (die UI zeigt
 * die Himmelshelligkeit ueber bortleMagProArcsec2).
 *
 * Bitgleichheit (docs/architektur.md 5.3): mit mischgewicht 0 und ohne deepSky rechnet tonwert den
 * Ausdruck aus Version 1 in gleicher Reihenfolge.
 */
export interface Helligkeit {
  schluessel: string;
  faktorObjekt: number;
  hintergrundRelativ: number;
  hintergrundMagProArcsec2: number;
  punktFaktor: number;
  punktExponent: number;
  /** g in [0, 1) (A-P10), nur sonnensystem; 0 = Flaeche wie Version 1. */
  mischgewicht: number;
  /** Nur deep_sky mit Quellbild (ADR-0004 Ebene b). */
  deepSky?: {
    /** a: Leuchtdichte von Quellweiss im Okular relativ zum Anzeigeweiss. */
    faktor: number;
    /** s: Leuchtdichte des Himmels im Okular relativ zum Anzeigeweiss. */
    himmel: number;
    /** q*: Pixelwert (relativ zu Quellweiss) an der sichtbaren Isophote. */
    schwelleRelativ: number;
    /** Breite der Blackwell-Kurve, 0,484; Konstante aus physik, nicht in bild. */
    breite: number;
    /** Anzeigehelligkeit, >= 0 (Mindestsichtbarkeit, ADR-0004). */
    sockel: number;
  };
}

/**
 * Maske des wahren Gesichtsfelds, zentriert auf die Fenstermitte (Fenster.mitte), Masse in
 * Bogensekunden. Die Feldblende des Okulars bleibt in der Mitte, beim Verschieben (A-D2) wandert
 * das Objekt. Kreis bei Fernrohr und Fernglas, Rechteck beim blossen Auge (A-D1).
 */
export interface Gesichtsfeld {
  form: "kreis" | "rechteck";
  breiteArcsec: number;
  hoeheArcsec: number;
}

/** Alles, was bild braucht, um den Anblick zu zeichnen. Stufe 4 (fenster) ist die Anzeige. */
export interface Simulationsparameter {
  quellbild: Quellbild;
  kern: Kern;
  helligkeit: Helligkeit;
  gesichtsfeld: Gesichtsfeld;
  fenster: Fenster;
}
