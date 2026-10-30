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
 * Groessenordnung nach [32, 38]). Ohne Abschattung: der Faktor (1 - eps^2) steht in
 * transmissionMitAbschattung() (optik.ts), die okularhelligkeit() und schwelle.ts teilen (Issue #100).
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
 * mag je Quadratbogensekunde, die als Bildschirmweiss erscheint (Anzeigeweiss). Version 1: 3,35,
 * der Vollmond ohne Verluste (docs/recherche/objekte.md 5.2). Version 2 (A-P13 i, ADR-0004, seit
 * Issue #100): fuer die Flaechenebenen und den Himmel, damit das hellste Perzentil des Monds bei
 * etwa 1 mm Austrittspupille nahezu Weiss erreicht. Am Bild nachgemessen in #111
 * (docs/recherche/helligkeit-v2.md 1.1): 8,9 statt 9,2 (Entscheidung Herbert 2026-10-30), Mond bei
 * AP 1 mm P99 sRGB 253, in T4a und T4c bleiben Zonen, weisse Ovale und die Farbe des GRF erhalten.
 */
export const ANZEIGE_WEISS_MAG_PRO_ARCSEC2 = 8.9;

/**
 * Punktweiss: Flaechenhelligkeit im Okular, die in der Punktebene als Bildschirmweiss erscheint
 * (A-P13 ii, ADR-0004), damit Jupiter mit blossem Auge im Kern nahezu weiss ist (seit Issue #100;
 * Version 1 wie das Anzeigeweiss 3,35). Am Bild nachgemessen in #111 (helligkeit-v2.md 1.1): 6,9
 * statt 6,4 (Entscheidung Herbert 2026-10-30), Jupiter im Kern sRGB 237, Mars 14'' 212, Saturn 176.
 */
export const PUNKT_WEISS_MAG_PRO_ARCSEC2 = 6.9;

/**
 * Kompressionsexponent der Abbildung auf den Bildschirm (Abschnitt 12): Groessenordnung nach Stevens
 * 1961 (Helligkeit eines 5-Grad-Felds 0,33, [53]), keine Gleichheit der Empfindung. In Phase 6 am Bild
 * geprueft und beibehalten (docs/validierung.md 5).
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

/**
 * Blendungsregel (A-P6, Abschnitt 13): eine Punktquelle wird unterdrueckt, wenn sie scheinbar (V mal
 * Abstand am Himmel) weniger als 10 Bogenminuten von einem Objekt entfernt steht, das mehr als
 * 6 Magnituden heller ist. Ersatz fuer die nicht simulierte Blendung (A-P9).
 */
export const BLENDUNG_ABSTAND_SCHEINBAR_ARCSEC = 600;
export const BLENDUNG_DELTA_MAG = 6;

/**
 * Hinweis "Ueberstrahlung nicht simuliert" ab diesem Helligkeitsunterschied |Delta m| in mag
 * (A-Z9, doppelsterne.md 5) ...
 */
export const UEBERSTRAHLUNG_DELTA_MAG = 4;

/**
 * ... und nur unter diesem Sternabstand am Himmel in Bogensekunden (Entscheidung 5 in
 * docs/recherche/README.md; bei weiten Paaren wie Polaris, 18,4'', zaehlt Ueberstrahlung kaum).
 */
export const UEBERSTRAHLUNG_ABSTAND_ARCSEC = 10;

/**
 * Feldfaktor F der Wahrnehmungsschwelle (A-P11, A-P9 V2): fester, erfahrener Beobachter, gilt fuer
 * alle Geraete (ADR-0004 Punkt 2, docs/recherche/wahrnehmung.md 1.3; Crumey 2014 nennt 2 als typisch).
 */
export const FELDFAKTOR = 1.4;

/** Zusaetzlicher Feldfaktor F_T am Fernrohr: einaeugig statt beidaeugig (wahrnehmung.md 1.3, Lythgoe & Phillips nach Crumey). */
export const FELDFAKTOR_FERNROHR = Math.SQRT2;

/**
 * Breite sigma/M der Blackwell-Wahrscheinlichkeitskurve P = Phi((C/C_th - 1) / 0,484) fuer die
 * Deckkraft (ADR-0004, wahrnehmung.md 1.3: 0,62 / 1,2816).
 */
export const BLACKWELL_BREITE = 0.484;

/** Nullhintergrund in cd/m^2: darunter bleibt die Schwelle fest (wahrnehmung.md 2, Crumey Gl. 50 und 71). */
export const NULLHINTERGRUND_CD_M2 = 1e-5;

/**
 * Winkeldurchmesser, mit dem ein Stern als Punktquelle gemalt wird: weit unter jedem Kern, bild malt
 * ohnehin mindestens ein Arbeitspixel, der Fluss haengt nicht davon ab (docs/architektur.md 5.4,
 * docs/entwuerfe/naht-v2-variante-b.md).
 */
export const STERN_DURCHMESSER_ARCSEC = 0.01;

/**
 * Punktquellen mit einer Deckkraft darunter malt bild nicht (sichtbar false, grund "unter_schwelle",
 * docs/architektur.md 5.3). Bezogen auf die gezeigte Deckkraft (punktquellen.ts, physik.md Abschnitt 20),
 * die fuer sehr schwache Sterne gegen 0 geht; Blackwells Kurve selbst endet bei 0,019.
 */
export const DECKKRAFT_MIN = 1e-3;

/** Mindestsichtbarkeit: Sockel von Delta_min sRGB-Kodes ueber dem Himmel an der Schwelle (ADR-0004 Punkt 3). */
export const SOCKEL_DELTA_KODES = 3;

/**
 * Reserve in sRGB-Kodes gegen das Runden beim Zeichnen: Himmel und Schwellenpixel werden einzeln
 * auf ganze Kodes gerundet (Float32-Raster, Tabelle in src/ui/zeichne.ts). Ohne Reserve blieben bei
 * etwa 0,6 % der Himmelskodes (Nachkommateil um 0,43 bis 0,58, meist Kode unter 40) nur
 * Delta_min - 1 Kodes Abstand; mit 0,15 im Test ueber Kode 0,5 bis 240 keiner (Review PR #118,
 * physik.md Abschnitt 17).
 */
export const SOCKEL_RESERVE_KODES = 0.15;

/**
 * Schnitt des Mischgewichts: g' = max(0, (g - 0,005) / 0,995), stetig in g, exakt 0 ab
 * x = sqrt(199 / 0,3466) = 23,96 (ADR-0004, architektur.md 5.3). Damit rechnen T1 bis T4 und
 * T5 Mars 14'' den Ausdruck aus Version 1.
 */
export const MISCHGEWICHT_SCHNITT = 0.005;

/**
 * Kontrastschwelle "erkennbar" der Tabellen-Tests (A-Q2, docs/validierung.md): eine Struktur gilt
 * als erkennbar, wenn ihre Delle nach der Faltung (profilDelle, physik.md 8.1) darueber liegt.
 * Kalibrierkonstante, keine Physik: am Bild der Testfaelle T1 bis T6 festgelegt, als geometrisches
 * Mittel des Intervalls zwischen der tiefsten nicht erkennbaren (T4d) und der flachsten
 * erkennbaren Delle (T4c). Nur die Tests verwenden sie; das Bild haengt nicht davon ab.
 */
export const SCHWELLE_ERKENNBAR = 0.125;

/** Beleuchtungsstaerke eines Sterns der Magnitude 0 ausserhalb der Atmosphaere in lx (wahrnehmung.md, Konventionen; Crumey 2014). */
export const BELEUCHTUNG_NULL_MAG_LX = 2.54e-6;

/** Grenze des Farbsehens mit blossem Auge: Sterne ab etwa 2,3 mag sind farbig (wahrnehmung.md 5.1, [13]). */
export const FARBGRENZE_AUGE_MAG = 2.3;

/**
 * Schwelle des Farbsehens als Beleuchtungsstaerke am Auge: Z 10^(-0,4 2,3) = 3,05e-7 lx, in der
 * Recherche gerundet 3,1e-7 (wahrnehmung.md 5.1). Aus der Magnitude gerechnet, damit die Grenze
 * mit blossem Auge genau 2,3 mag ist.
 */
export const FARBSCHWELLE_LX = BELEUCHTUNG_NULL_MAG_LX * Math.pow(10, -0.4 * FARBGRENZE_AUGE_MAG);

