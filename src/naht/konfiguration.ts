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

/**
 * Zustand eines Objekts: Winkelgroesse in Bogensekunden, Magnitude (fuer die Blendungsregel
 * A-P6), Quellbild mit Pixelmassstab und Trabanten. weissMagProArcsec2 ist die
 * Flaechenhelligkeit in mag je Quadratbogensekunde, die Weiss (1,0) im Quellbild bedeutet;
 * alle Helligkeiten an der Naht sind relativ dazu.
 */
export interface Objektzustand {
  /** Kennung des Zustands (id aus daten/objekte.json), z. B. "jup_47", "mond_ev"; ui waehlt danach die Bildquelle. */
  kennung: string;
  durchmesserArcsec: number;
  magnitude: number;
  quelle: {
    breitePx: number;
    hoehePx: number;
    massstabArcsecProPx: number;
    weissMagProArcsec2: number;
  };
  trabanten: Trabant[];
}

/** Alles, was der Nutzer einstellt; vollstaendig in der URL abbildbar (A-F7). */
export interface Konfiguration {
  geraet: Geraet;
  objekt: Objektzustand;
  bedingungen: Bedingungen;
}
