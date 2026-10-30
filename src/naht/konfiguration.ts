// Konfiguration: alles, was der Nutzer einstellt (Geraet, Okular, Objektzustand, Bedingungen).
// Nur Typen und Konstanten, strukturiert klonbar; Teil der Naht (docs/architektur.md Abschnitt 1),
// damit daten und zustand sie ohne physik lesen. Nach docs/entwuerfe/naht-variante-3.md
// Abschnitt 1.1 und docs/architektur.md Abschnitt 3; Begriffe nach GLOSSARY.md.
//
// Eine Konfiguration ist bereits begrenzt (A-F8); begrenze() in physik ist dafuer die einzige
// Stelle. Bogensekunden ueberall, Grad nur in Gesichtsfeld-Eingaben und -Anzeigen.
// Obstruktion ist ein Verhaeltnis 0 bis 0,5, nicht Prozent.

/** Bauarten eines Fernrohrs; die Bauart setzt einen Vorschlagswert fuer die Obstruktion. */
export const BAUARTEN = ["refraktor", "newton", "schmidt-cassegrain", "maksutov"] as const;
export type Bauart = (typeof BAUARTEN)[number];

/** Transparenz der Luft in drei Stufen, wirkt als Extinktion (A-B3). */
export const TRANSPARENZEN = ["klar", "leicht-diesig", "diesig"] as const;
export type Transparenz = (typeof TRANSPARENZEN)[number];

/** Okular: Brennweite in mm, scheinbares Gesichtsfeld in Grad. */
export interface Okular {
  brennweiteMm: number;
  scheinbaresGesichtsfeldGrad: number;
}

/**
 * Fernrohr mit Okular. Das Okular haengt am Fernrohr, nicht an der Konfiguration:
 * Fernglas und Auge haben keins, so gibt es im Normalfall kein nullable Feld.
 * Oeffnung und Brennweite in mm, Obstruktion als Verhaeltnis 0 bis 0,5.
 */
export interface Fernrohr {
  art: "fernrohr";
  oeffnungMm: number;
  brennweiteMm: number;
  obstruktion: number;
  bauart: Bauart;
  okular: Okular;
}

/** Fernglas: feste Vergroesserung und festes wahres Gesichtsfeld in Grad, Oeffnung in mm. */
export interface Fernglas {
  art: "fernglas";
  oeffnungMm: number;
  vergroesserung: number;
  wahresGesichtsfeldGrad: number;
}

/** Blosses Auge: 6 mm Oeffnung, Vergroesserung 1, rechteckiges Gesichtsfeld 5 Grad (A-F3, A-D1). */
export interface Auge {
  art: "auge";
}

/** Das Geraet vor dem Auge; optik() in physik ist die einzige Stelle, die ueber art verzweigt. */
export type Geraet = Fernrohr | Fernglas | Auge;

/**
 * Bedingungen: Seeing als FWHM der Langzeit-PSF im Zenit in Bogensekunden (A-B1),
 * Himmelshelligkeit als Bortle-Stufe 1 bis 9 (A-B2), Transparenz (A-B3),
 * Hoehe ueber dem Horizont in Grad 0 bis 90 (A-B4).
 */
export interface Bedingungen {
  seeingFwhmArcsec: number;
  bortle: number;
  transparenz: Transparenz;
  hoeheGrad: number;
}

/**
 * Trabant eines Planeten: Position relativ zur Objektmitte (+x rechts, +y Norden) und
 * Winkeldurchmesser in Bogensekunden, Helligkeit als Magnitude.
 */
export interface Trabant {
  name: string;
  dxArcsec: number;
  dyArcsec: number;
  durchmesserArcsec: number;
  magnitude: number;
}

/** Objektklassen (A-D18); objekte.json "typ" mond und planet gehoeren zu sonnensystem. */
export const OBJEKTKLASSEN = ["sonnensystem", "doppelstern", "deep_sky"] as const;
export type Objektklasse = (typeof OBJEKTKLASSEN)[number];

/** Kennung des freien Paars in Objektzustand und URL (z=frei, A-D18); objekte.json darf sie nicht verwenden. */
export const KENNUNG_FREIES_PAAR = "frei";

/**
 * Stern eines Doppel-, Mehrfachsterns oder Deep-Sky-Objekts: Lage wie Trabant (relativ zur
 * Objektmitte, +x rechts, +y Norden), kein Durchmesser, Farbindex B-V (A-P12).
 */
export interface Stern {
  name: string;
  dxArcsec: number;
  dyArcsec: number;
  magnitude: number;
  bv: number;
}

/** Zeile der Flaechentabelle: Isophote am Himmel (mag/arcsec^2, V) und eingeschlossene Flaeche (arcsec^2). */
export interface Isophote {
  magProArcsec2: number;
  flaecheArcsec2: number;
}

/**
 * Begleiter eines Deep-Sky-Objekts mit Quellbild (Issue #136, ADR-0004 Nachtrag): kompakte Quelle im
 * Feld des Hauptobjekts (M32 bei M31) mit eigenem Bild und eigener Flaechentabelle, damit sie eine
 * eigene Wahrnehmungsschwelle bekommt. dxArcsec, dyArcsec ist die Mitte des Begleiterbilds relativ
 * zur Objektmitte (+x rechts, +y Norden). Pixelwerte des Begleiterbilds sind wie die des Hauptbilds
 * relativ zum Quellweiss des Hauptobjekts (quelle.weissMagProArcsec2 des Zustands). Nur was physik
 * und ui brauchen (Issue #141); Name, Magnitude und Bildnachweis stehen in daten (BegleiterEintrag).
 */
export interface Begleiter {
  dxArcsec: number;
  dyArcsec: number;
  /** mag aufsteigend, Flaeche steigend, wie Objektzustand.isophoten. */
  isophoten: Isophote[];
}

/** Eingaben des freien Paars (A-Z9); Quelle der Wahrheit fuer URL und begrenze. Trennung in Bogensekunden. */
export interface Paareingaben {
  trennungArcsec: number;
  magnitudeA: number;
  magnitudeB: number;
  bvA: number;
  bvB: number;
}

/**
 * Zustand eines Objekts: Winkelgroesse in Bogensekunden, Magnitude (fuer die Blendungsregel
 * A-P6), Quellbild mit Pixelmassstab, Trabanten und Sterne. weissMagProArcsec2 ist die
 * Flaechenhelligkeit in mag je Quadratbogensekunde, die Weiss (1,0) im Quellbild bedeutet;
 * alle Helligkeiten an der Naht sind relativ dazu (ohne Quellbild relativ zu 0 mag/arcsec^2).
 * Welche Felder belegt sind, haengt an klasse (docs/architektur.md 5.3): trabanten nur bei
 * sonnensystem, sterne bei doppelstern und deep_sky, isophoten nur bei deep_sky mit Quellbild.
 */
export interface Objektzustand {
  /** Kennung des Zustands (id aus daten/objekte.json), z. B. "jup_47", "mond_ev"; ui waehlt danach die Bildquelle. */
  kennung: string;
  klasse: Objektklasse;
  /** Doppelstern: groesster Sternabstand (nur Anzeige). */
  durchmesserArcsec: number;
  /** Doppelstern: Gesamthelligkeit. */
  magnitude: number;
  /** Fehlt bei Zustaenden ohne Quellbild (Doppelstern, M45). */
  quelle?: {
    breitePx: number;
    hoehePx: number;
    massstabArcsecProPx: number;
    weissMagProArcsec2: number;
  };
  /** Nur sonnensystem. */
  trabanten: Trabant[];
  /** doppelstern und deep_sky; sonst leer. */
  sterne: Stern[];
  /** Nur deep_sky mit Quellbild: mag aufsteigend, Flaeche steigend. */
  isophoten?: Isophote[];
  /** Nur deep_sky mit Quellbild, optional (Issue #136); Reihenfolge wie in daten/objekte.json. */
  begleiter?: Begleiter[];
  /** Nur das freie Paar (kennung "frei"). */
  paar?: Paareingaben;
}

/** Alles, was der Nutzer einstellt; vollstaendig in der URL abbildbar (A-F7). */
export interface Konfiguration {
  geraet: Geraet;
  objekt: Objektzustand;
  bedingungen: Bedingungen;
}
