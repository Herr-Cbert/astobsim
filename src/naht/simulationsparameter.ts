// Naht zwischen physik, bild und ui: nur Typen, strukturiert klonbar (keine Klassen,
// keine Funktionen, Float32Array erlaubt). Verbindlich nach docs/architektur.md Abschnitt 3,
// Details in docs/entwuerfe/naht-variante-3.md Abschnitt 1.2.
//
// Koordinaten: Objektmitte 0/0, +x rechts, +y Norden (A-D11), Einheit Bogensekunden.
// Helligkeiten relativ zu Quellweiss (1,0 = Flaechenhelligkeit, die Weiss im Quellbild
// bedeutet), linear. Massstaebe in Bogensekunden je Pixel.
//
// Vertrag fuer bild: Anblick = tonwert(falte(male(mittele(quelle, quellbild)), kern), helligkeit),
// maskiert mit gesichtsfeld, gezeichnet in fenster. Jede Stufe traegt einen Schluessel aus den
// gerundeten Eingangsgroessen: gleicher Schluessel heisst gleiches Ergebnis, bild darf das
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
 * Stufe 1: Ausschnitt des Quellbilds auf das Arbeitsraster mitteln, Punktquellen malen.
 * Invariante: rasterPx * massstabArcsecProPx = fenster.breiteArcsec.
 */
export interface Quellbild {
  schluessel: string;
  /** Kennung des Objektzustands, z. B. "mond-q1"; bild laedt danach das Quellbild. */
  objekt: string;
  /** Arbeitsmassstab in Bogensekunden je Arbeitspixel. */
  massstabArcsecProPx: number;
  /** Kantenlaenge des quadratischen Arbeitsrasters in Arbeitspixeln. */
  rasterPx: number;
  /** Mitte des Ausschnitts in Objektkoordinaten, gleich Fenster.mitte. */
  mitteXArcsec: number;
  mitteYArcsec: number;
  /** Vor der Faltung als Scheibchen ins Arbeitsraster malen. */
  punktquellen: Punktquelle[];
}

/**
 * Trabant als Punktquelle: Position und Durchmesser in Bogensekunden in Objektkoordinaten.
 * helligkeitRelativ ist die Flaechenhelligkeit relativ zu Quellweiss ohne den gemeinsamen
 * Faktor aus Helligkeit.faktorObjekt. Die Blendungsregel (A-P6) ist bereits entschieden:
 * sichtbar false mit grund "blendung" heisst unterdrueckt, ui kann das erklaeren.
 */
export interface Punktquelle {
  name: string;
  xArcsec: number;
  yArcsec: number;
  durchmesserArcsec: number;
  helligkeitRelativ: number;
  sichtbar: boolean;
  grund?: "blendung";
}

/**
 * Stufe 2: die Gesamt-PSF als diskrete Matrix im Arbeitsmassstab, Eingabe der Faltung.
 * daten hat groesse * groesse Werte, zeilenweise, Summe 1 (Toleranz 1e-6), punktsymmetrisch,
 * keine negativen Werte. groesse und radius in Arbeitspixeln, groesse = 2 * radius + 1, ungerade, 5 bis 81.
 * massstabArcsecProPx ist gleich Quellbild.massstabArcsecProPx.
 */
export interface Kern {
  schluessel: string;
  /** Fuer Tests und Anzeige, nicht fuer bild. */
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
 * Stufe 3: Tonwert, nur Multiplikation und Addition.
 * faktorObjekt in (0, 1]: Transmission mal (1 - Obstruktion^2) mal Extinktion mal
 * min(1, (Austrittspupille / Augenpupille)^2). hintergrundRelativ ist der Grauton des
 * Gesichtsfelds relativ zu Quellweiss; hintergrundMagProArcsec2 dient nur Anzeige und Hilfetext.
 */
export interface Helligkeit {
  schluessel: string;
  faktorObjekt: number;
  hintergrundRelativ: number;
  hintergrundMagProArcsec2: number;
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
