// Konstanten des Modells, jede genau einmal. Quelle: docs/recherche/physik.md, Abschnitt 9
// (Konstanten) und die dort genannten Abschnitte. 138,4 und 116,8 stehen nirgends als Zahl;
// sie folgen in beugung.ts aus Wellenlaenge und Faktor.

import type { Bauart, Transparenz } from "../naht/konfiguration";

/** Wellenlaenge des Modells in Metern (gruen, Maximum der Augenempfindlichkeit), Abschnitt 9. */
export const WELLENLAENGE_M = 550e-9;

/** Bogensekunden je Radiant, Abschnitt 8: 1 rad = 206 264,8''. */
export const ARCSEC_PRO_RAD = 206264.8;

/** Bogensekunden je Grad; Grad nur in Gesichtsfeld-Eingaben und -Anzeigen. */
export const ARCSEC_PRO_GRAD = 3600;

/** Feste Augenpupille p in mm (A-F3, Abschnitt 5.1). */
export const PUPILLE_MM = 6;

/** Aufloesung des Auges in Bogensekunden, eine Bogenminute (A-P2, Abschnitt 3.1). */
export const AUGE_AUFLOESUNG_ARCSEC = 60;

/** Moffat-Exponent beta, beste Anpassung an die Kolmogorov-Langzeit-PSF (Abschnitt 2.2, [18]). */
export const BETA_MOFFAT = 4.765;

/** Rayleigh-Grenze und Radius des ersten Airy-Minimums: 1,22 lambda/D (Abschnitt 1.1, 1.2). */
export const RAYLEIGH_FAKTOR = 1.22;

/** Halbwertsbreite des Airy-Kerns: 1,029 lambda/D (Abschnitt 1.1). */
export const AIRY_FWHM_FAKTOR = 1.029;

/** Seeing-FWHM = 0,98 lambda / r0 (Abschnitt 2.1, [16] Gl. 5). */
export const SEEING_FAKTOR = 0.98;

/** Dawes-Grenze: 4,56'' bei 1 Zoll Oeffnung (Abschnitt 1.2, [3]). */
export const DAWES_ARCSEC_ZOLL = 4.56;
export const MM_PRO_ZOLL = 25.4;

/** Hoechste sinnvolle Vergroesserung: 2 D in mm, d. h. Austrittspupille 0,5 mm (Abschnitt 4). */
export const VERGROESSERUNG_MAX_PRO_MM = 2;

/** Kleinste sinnvolle Austrittspupille in mm, Warnschwelle in A-D5 (Abschnitt 4). */
export const AUSTRITTSPUPILLE_MIN_MM = 0.5;

/** Kantenlaenge des Standardfensters in Anzeigepixeln, wenn auswerten() kein anzeigePx bekommt (Issue #5). */
export const ANZEIGE_PX_STANDARD = 1024;

/** Extinktionskoeffizient k in mag je Luftmasse fuer die drei Transparenzstufen (Abschnitt 5.4). */
export const EXTINKTION_MAG_PRO_LUFTMASSE: Readonly<Record<Transparenz, number>> = {
  klar: 0.2,
  "leicht-diesig": 0.3,
  diesig: 0.45
};

/** Koeffizienten der Luftmassenformel von Kasten und Young 1989 (Abschnitt 5.3, [39]). */
export const KASTEN_YOUNG = { a: 0.50572, b: 6.07995, c: -1.6364 } as const;

/**
 * Transmission tau der Geraetearten einschliesslich Okular und Zenitspiegel (Abschnitt 5.2,
 * Groessenordnung nach [32, 38]). Ohne Abschattung: der Faktor (1 - eps^2) steht genau einmal
 * in helligkeit() (Abschnitt 9).
 */
export const TRANSMISSION: Readonly<Record<Bauart | "fernglas" | "auge", number>> = {
  refraktor: 0.9,
  newton: 0.8,
  "schmidt-cassegrain": 0.8,
  maksutov: 0.8,
  fernglas: 0.85,
  auge: 1.0
};

/** Himmelshelligkeit in mag je Quadratbogensekunde fuer Bortle 1 bis 9, Index = Stufe - 1 (Abschnitt 6.1, Spalte "Vorschlag astobsim"; 8 und 9 geschaetzt). */
export const BORTLE_MAG_PRO_ARCSEC2: readonly number[] = [21.9, 21.7, 21.4, 21.0, 20.0, 19.0, 18.3, 17.5, 17.0];

/**
 * Abbildung der Leuchtdichte auf den Bildschirm (Abschnitt 12): Flaechenhelligkeit im Okular in
 * mag je Quadratbogensekunde, die als Bildschirmweiss erscheint. Vollmond ohne Verluste
 * (docs/recherche/objekte.md 5.2, daten/objekte.json mond_ev), das hellste Objekt in Version 1.
 */
export const ANZEIGE_WEISS_MAG_PRO_ARCSEC2 = 3.35;

/**
 * Kompressionsexponent der Abbildung auf den Bildschirm (Abschnitt 12): Groessenordnung nach Stevens
 * 1961 (Helligkeit eines 5-Grad-Felds 0,33, [53]), keine Gleichheit der Empfindung. Offen fuer Phase 6.
 */
export const KOMPRESSIONSEXPONENT = 1 / 3;

/** Wortstufen des Seeings (A-B1). */
export const SEEING_WORTSTUFEN = ["ausgezeichnet", "gut", "mittel", "schlecht"] as const;
export type Seeingwortstufe = (typeof SEEING_WORTSTUFEN)[number];

/**
 * Zuordnung Seeing-FWHM im Zenit zu Wortstufe und Pickering-Stufen (Abschnitt 2.5, Tabelle
 * "Vorschlag fuer A-B1"): eine Zeile gilt bis zu ihrer Obergrenze (ausschliesslich).
 */
export const SEEING_STUFEN: readonly {
  bisArcsec: number;
  wortstufe: Seeingwortstufe;
  pickeringVon: number;
  pickeringBis: number;
}[] = [
  { bisArcsec: 1, wortstufe: "ausgezeichnet", pickeringVon: 8, pickeringBis: 10 },
  { bisArcsec: 2, wortstufe: "gut", pickeringVon: 6, pickeringBis: 7 },
  { bisArcsec: 3, wortstufe: "mittel", pickeringVon: 4, pickeringBis: 5 },
  { bisArcsec: Infinity, wortstufe: "schlecht", pickeringVon: 1, pickeringBis: 3 }
];

/** Rechteckiges Gesichtsfeld des blossen Auges in Grad, Breite und Hoehe (A-D1). */
export const AUGE_GESICHTSFELD_GRAD = 5;

/**
 * Arbeitsmassstab: nie feiner als Gesamt-FWHM / 2,5 (ADR-0002). Die Gesamt-FWHM ist damit
 * hoechstens 2,5 Arbeitspixel breit; bei grober Anzeige auch weniger als ein Pixel.
 */
export const ARBEITSPIXEL_PRO_FWHM = 2.5;

/**
 * Kernradius in Gesamt-FWHM (Abschnitt 9: etwa 3 Gesamt-FWHM). Die Airy-Ringe bis zum zweiten
 * Minimum (2,23 lambda/D, Abschnitt 1.1) liegen darin, nicht additiv: 3 FWHM_gesamt >= 3,09 lambda/D.
 */
export const KERN_RADIUS_PRO_FWHM = 3;

/** Kleinster Kernradius in Arbeitspixeln; bei Sub-Pixel-PSF wird der Kern nahezu ein Delta (ADR-0002, Nachtrag). */
export const KERN_RADIUS_MIN = 2;

/** Groesste Kerngroesse in Arbeitspixeln (docs/architektur.md Abschnitt 3: ungerade, 5 bis 81). */
export const KERN_GROESSE_MAX = 81;

/** Kleinste Kantenlaenge eines Fensters in Anzeigepixeln (docs/entwuerfe/naht-variante-3.md 1.3, Fehlerfaelle). */
export const FENSTER_MIN_PX = 16;

/** Rundung der Naht-Schluessel und der Kernbeschreibung auf 4 signifikante Stellen (docs/architektur.md Abschnitt 3). */
export const SIGNIFIKANTE_STELLEN = 4;
