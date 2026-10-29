// Objekte und ihre Zustaende aus daten/objekte.json (ADR-0003, Felder nach
// docs/recherche/objekte.md Abschnitt 6.2, ab Version 2 nach dem Nachtrag in ADR-0003):
// pruefeObjekte prueft die rohe Liste, pruefeVerweise den Verweis Zustand -> Bildnachweis in
// beide Richtungen, ladeObjekte holt die Datei per fetch, prueft beides und laedt die grossen
// Sternlisten aus daten/sterne/ (sterne_datei). Trabanten heissen in der Datei "trabanten"
// (GLOSSARY.md: nie "Mond" fuer Planetenmonde), Einheiten im Feldnamen.
//
// Die Objektklasse (A-D18) folgt aus typ: mond und planet sind sonnensystem, doppelstern und
// deep_sky heissen wie die Klasse. Die Felder eines Zustands haengen an der Klasse:
// - sonnensystem: wie Version 1 (Winkelgroesse, Phase, Bild, Trabanten);
// - doppelstern: sterne und katalog (Nachweis je Paar mit den beiden Komponenten in sterne),
//   kein bild, keine winkelgroesse_arcsec;
// - deep_sky: grosse und kleine Achse, positionswinkel_grad, profil (nur fuer tools/), bild
//   optional (fehlt bei M45), mit Bild Pflicht isophoten; kein weiss_mag_arcsec2, Quellweiss ist
//   kennlinie.mag_hell des Bildnachweises (Entscheidung Herbert 2026-10-29); sterne inline
//   oder als sterne_datei.

import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { KENNUNG_FREIES_PAAR, type Isophote, type Objektklasse, type Trabant } from "../naht/konfiguration";
import { alsListe, alsObjekt, ladeJson, nurBekannteFelder, optional, text, wahl, zahl, type Ort } from "./pruefe";

export const OBJEKTE_DATEI = "objekte.json";
/** Verzeichnis der grossen Sternlisten unter daten/ (ADR-0003 Nachtrag Version 2). */
export const STERNE_VERZEICHNIS = "sterne/";

const OBJEKTTYPEN = ["mond", "planet", "doppelstern", "deep_sky"] as const;
type Objekttyp = (typeof OBJEKTTYPEN)[number];

/** Objektklasse zum typ in objekte.json (A-D18). */
const KLASSE_ZU_TYP: Record<Objekttyp, Objektklasse> = {
  mond: "sonnensystem",
  planet: "sonnensystem",
  doppelstern: "doppelstern",
  deep_sky: "deep_sky"
};

/** Grenze fuer Lagen von Trabanten und Sternen relativ zur Objektmitte (M45 bis 4600''). */
const LAGE_MAX_ARCSEC = 7200;
/** Winkelgroesse: Sonnensystem bis 4000'' (Mond), Deep-Sky bis 5 Grad (M31 rund 11400''). */
const WINKELGROESSE_MAX_ARCSEC = 4000;
const WINKELGROESSE_DEEP_SKY_MAX_ARCSEC = 18000;
/** Grenzen der Magnitude je Klasse: Sonnensystem wie Version 1, Sterne und Deep-Sky bis 25. */
const MAGNITUDE_GRENZEN: Record<Objektklasse, readonly [number, number]> = {
  sonnensystem: [-15, 10],
  doppelstern: [-15, 25],
  deep_sky: [-15, 25]
};
/** Toleranz der Paarpruefung abs(dx_B - dx_A) = Trennung: zwei auf 0,001'' gerundete Lagen. */
const TOLERANZ_TRENNUNG_ARCSEC = 0.002;

/** Erlaubte Felder je Ebene und Klasse; alles andere ist ein Tippfehler der Handpflege. */
const FELDER_OBJEKT = ["id", "name", "typ", "quelle_physik", "zustaende"] as const;
const FELDER_ZUSTAND: Record<Objektklasse, readonly string[]> = {
  sonnensystem: [
    "id", "name", "winkelgroesse_arcsec", "polar_arcsec", "phase", "phasenwinkel_grad", "kolongitude_grad",
    "ringneigung_grad", "ring_aussen_arcsec", "magnitude", "weiss_mag_arcsec2", "entfernung_au", "bild", "trabanten", "hinweis_hilfe",
    "kommentar"
  ],
  doppelstern: ["id", "name", "magnitude", "katalog", "sterne", "hinweis_hilfe", "kommentar"],
  deep_sky: [
    "id", "name", "winkelgroesse_arcsec", "polar_arcsec", "positionswinkel_grad", "magnitude", "bild", "profil",
    "isophoten", "sterne", "sterne_datei", "hinweis_hilfe", "kommentar"
  ]
};
const FELDER_TRABANT = ["name", "dx_arcsec", "dy_arcsec", "durchmesser_arcsec", "magnitude"] as const;
const FELDER_STERN = ["name", "dx_arcsec", "dy_arcsec", "magnitude", "b_v", "katalog", "quelle_farbe"] as const;
const FELDER_PAAR = ["wds", "komponenten", "sterne", "trennung_arcsec", "positionswinkel_grad", "epoche", "quelle"] as const;
const FELDER_ISOPHOTE = ["mag_arcsec2", "flaeche_arcsec2"] as const;
const FELDER_STERNLISTE = ["objekt", "quelle", "lizenz", "kommentar", "sterne"] as const;
/** Profile je art mit ihren Zahlenfeldern (deep-sky.md 7.3); nur tools/ rechnet damit. */
const PROFILFELDER = {
  king: ["mu0_mag_arcsec2", "rc_arcsec", "rt_arcsec"],
  sersic_exp: ["n", "re_arcsec", "mue_mag_arcsec2", "rd_arcsec", "mu0_mag_arcsec2", "q_bulge", "q_scheibe"],
  keins: []
} as const;
type Profilart = keyof typeof PROFILFELDER;
const PROFILARTEN = Object.keys(PROFILFELDER) as Profilart[];

/** Stern, wie er in objekte.json oder einer Sternliste steht; katalog und quelleFarbe nur als Nachweis. */
export interface SternEintrag {
  name: string;
  dxArcsec: number;
  dyArcsec: number;
  /** V-Magnitude. */
  magnitude: number;
  /** Farbindex B-V (Feld b_v). */
  bv: number;
  /** Herkunft, z. B. "HIP 17702". */
  katalog?: string;
  /** Kuerzel der Quelle des Farbindex, z. B. "TDSC". */
  quelleFarbe?: string;
}

/**
 * Nachweis eines Paars aus dem Katalog (WDS, ORB6); trennungArcsec ist der Massstab fuer dx.
 * sterne nennt die beiden Komponenten, jede als Liste von Sternnamen: ein Name ist ein Stern, mehrere
 * sind eine Gruppe, gemessen an ihrem geometrischen Mittelpunkt (Epsilon Lyrae AB gegen CD). In der
 * Datei steht ein einzelner Stern als Name ("A"), eine Gruppe als Liste (["A", "B"]).
 */
export interface Paarnachweis {
  wds: string;
  komponenten: string;
  sterne: [string[], string[]];
  trennungArcsec: number;
  positionswinkelGrad: number;
  epoche: number;
  quelle: string;
}

/** Flaechenhelligkeitsprofil eines Deep-Sky-Objekts, nur zur Eichung in tools/ (deep-sky.md 7.3). */
export interface Profil {
  art: Profilart;
  /** Zahlenfelder der art mit ihren Namen aus der Datei (z. B. rc_arcsec). */
  werte: Record<string, number>;
  quelle?: string;
}

/**
 * Zustand eines Objekts, wie er in objekte.json steht. Welche Felder belegt sind, haengt an der
 * Klasse (Kopfkommentar); die Pruefung stellt sicher, dass die Pflichtfelder der Klasse da sind.
 */
export interface ZustandEintrag {
  id: string;
  name: string;
  /**
   * Anzeigegroesse (aequatorial, bei Deep-Sky die grosse Achse); das Quellbild wird darauf skaliert.
   * Fehlt bei Doppelsternen.
   */
  winkelgroesseArcsec?: number;
  /** Polar, bei Deep-Sky die kleine Achse; fehlt bei Doppelsternen. */
  polarArcsec?: number;
  /** Beleuchteter Anteil 0 bis 1; nur Sonnensystem. */
  phase?: number;
  /** Nur Sonnensystem. */
  phasenwinkelGrad?: number;
  /** Doppelstern: Gesamthelligkeit. */
  magnitude: number;
  /**
   * Flaechenhelligkeit in mag je Quadratbogensekunde, die Weiss (1,0) im Quellbild bedeutet
   * (Objektzustand.quelle.weissMagProArcsec2); Werte aus docs/recherche/objekte.md 5.2. Nur
   * Sonnensystem; bei Deep-Sky gilt kennlinie.mag_hell des Bildnachweises.
   */
  weissMagProArcsec2?: number;
  /** Nur Sonnensystem. */
  entfernungAu?: number;
  /** id des Bildnachweises in bilder.json; Pflicht bei Sonnensystem, fehlt bei Doppelsternen und M45. */
  bild?: string;
  kolongitudeGrad?: number;
  ringneigungGrad?: number;
  ringAussenArcsec?: number;
  /** Nur Sonnensystem; sonst leer. */
  trabanten: Trabant[];
  /** Doppelstern und Deep-Sky; sonst leer. Bei sterne_datei erst nach ladeObjekte gefuellt. */
  sterne: SternEintrag[];
  /** Nur Doppelstern: Nachweis je Paar. */
  katalog?: Paarnachweis[];
  /** Nur Deep-Sky: Positionswinkel der grossen Achse in Grad. */
  positionswinkelGrad?: number;
  /** Nur Deep-Sky, optional. */
  profil?: Profil;
  /** Nur Deep-Sky mit bild: Flaechentabelle, mag aufsteigend, Flaeche streng steigend (ADR-0004). */
  isophoten?: Isophote[];
  /** Nur Deep-Sky: Sternliste unter daten/sterne/, relativ zu diesem Verzeichnis. */
  sterneDatei?: string;
  /**
   * Satz fuer den Hilfetext zu diesem Zustand (z. B. Mars 6" gibbos, aber als Vollscheibe gezeigt,
   * A-X1); ui zeigt ihn an. kommentar dagegen ist nur Dokumentation der Datei.
   */
  hinweisHilfe?: string;
  kommentar?: string;
}

/** Objekt mit seinen Zustaenden. */
export interface Objekt {
  id: string;
  name: string;
  typ: Objekttyp;
  /** Folgt aus typ (A-D18). */
  klasse: Objektklasse;
  quellePhysik?: string;
  zustaende: ZustandEintrag[];
}

/** Prueft die rohe Liste aus objekte.json (ohne Verweise); wirft DatenFehler. */
export function pruefeObjekte(roh: unknown): Objekt[] {
  const liste = alsListe(roh, { datei: OBJEKTE_DATEI, eintrag: "-" }, "Wurzel");
  const objektIds = new Set<string>();
  const zustandIds = new Set<string>();
  return liste.map((wert, index) => {
    const ortIndex: Ort = { datei: OBJEKTE_DATEI, eintrag: `Index ${index}` };
    const obj = alsObjekt(wert, ortIndex, "Eintrag");
    const id = text(obj, "id", ortIndex);
    const ort: Ort = { datei: OBJEKTE_DATEI, eintrag: id };
    // Die Objektauswahl der ui nutzt "frei" als Wert des freien Paars (Issue #109).
    if (id === KENNUNG_FREIES_PAAR) throw new DatenFehler(OBJEKTE_DATEI, id, "id", '"frei" ist das freie Paar in der Objektauswahl (A-Z9)');
    if (objektIds.has(id)) throw new DatenFehler(OBJEKTE_DATEI, id, "id", "doppelt vergeben");
    objektIds.add(id);
    nurBekannteFelder(obj, ort, FELDER_OBJEKT);
    const typ = wahl(obj, "typ", ort, OBJEKTTYPEN);
    const klasse = KLASSE_ZU_TYP[typ];
    const rohZustaende = alsListe(obj["zustaende"], ort, "zustaende");
    if (rohZustaende.length === 0) throw new DatenFehler(OBJEKTE_DATEI, id, "zustaende", "mindestens ein Zustand erwartet");
    const zustaende = rohZustaende.map((z, n) => {
      const zustand = pruefeZustand(z, typ, klasse, { datei: OBJEKTE_DATEI, eintrag: `${id}, zustaende[${n}]` });
      // Zustands-ids sind global eindeutig, weil bilder.json nur die id nennt.
      if (zustandIds.has(zustand.id)) throw new DatenFehler(OBJEKTE_DATEI, zustand.id, "id", "Zustand doppelt vergeben");
      zustandIds.add(zustand.id);
      return zustand;
    });
    const objekt: Objekt = { id, name: text(obj, "name", ort), typ, klasse, zustaende };
    const quellePhysik = optional(obj, "quelle_physik", (o, f) => text(o, f, ort));
    if (quellePhysik !== undefined) objekt.quellePhysik = quellePhysik;
    return objekt;
  });
}

function pruefeZustand(wert: unknown, typ: Objekttyp, klasse: Objektklasse, ortIndex: Ort): ZustandEintrag {
  const obj = alsObjekt(wert, ortIndex, "Zustand");
  const id = text(obj, "id", ortIndex);
  const ort: Ort = { datei: OBJEKTE_DATEI, eintrag: id };
  if (id === KENNUNG_FREIES_PAAR) throw new DatenFehler(OBJEKTE_DATEI, id, "id", '"frei" ist das freie Paar aus der URL (A-Z9)');
  if (obj["monde"] !== undefined) throw new DatenFehler(OBJEKTE_DATEI, id, "monde", 'heisst "trabanten" (GLOSSARY.md)');
  if (klasse === "doppelstern") {
    // Eigene Meldung fuer die Felder, die man aus Gewohnheit eintraegt (ADR-0003 Nachtrag V2).
    for (const feld of ["bild", "winkelgroesse_arcsec"]) {
      if (obj[feld] !== undefined) throw new DatenFehler(OBJEKTE_DATEI, id, feld, "Doppelsterne haben kein bild und keine winkelgroesse_arcsec");
    }
  }
  if (klasse === "deep_sky" && obj["weiss_mag_arcsec2"] !== undefined) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "weiss_mag_arcsec2", "nicht bei Deep-Sky: Quellweiss ist kennlinie.mag_hell in bilder.json");
  }
  nurBekannteFelder(obj, ort, FELDER_ZUSTAND[klasse]);
  const zustand: ZustandEintrag = {
    id,
    name: text(obj, "name", ort),
    magnitude: zahl(obj, "magnitude", ort, ...MAGNITUDE_GRENZEN[klasse]),
    trabanten: [],
    sterne: []
  };
  const hinweisHilfe = optional(obj, "hinweis_hilfe", (o, f) => text(o, f, ort));
  if (hinweisHilfe !== undefined) zustand.hinweisHilfe = hinweisHilfe;
  const kommentar = optional(obj, "kommentar", (o, f) => text(o, f, ort));
  if (kommentar !== undefined) zustand.kommentar = kommentar;
  if (klasse === "sonnensystem") pruefeSonnensystem(obj, typ, zustand, ort);
  else if (klasse === "doppelstern") pruefeDoppelstern(obj, zustand, ort);
  else pruefeDeepSky(obj, zustand, ort);
  return zustand;
}

function pruefeSonnensystem(obj: Record<string, unknown>, typ: Objekttyp, zustand: ZustandEintrag, ort: Ort): void {
  const id = zustand.id;
  const optZahl = (feld: string, min: number, max: number) => optional(obj, feld, (o, f) => zahl(o, f, ort, min, max));
  zustand.winkelgroesseArcsec = zahl(obj, "winkelgroesse_arcsec", ort, 0.1, WINKELGROESSE_MAX_ARCSEC);
  zustand.polarArcsec = zahl(obj, "polar_arcsec", ort, 0.1, WINKELGROESSE_MAX_ARCSEC);
  zustand.phase = zahl(obj, "phase", ort, 0, 1);
  zustand.phasenwinkelGrad = zahl(obj, "phasenwinkel_grad", ort, 0, 180);
  zustand.weissMagProArcsec2 = zahl(obj, "weiss_mag_arcsec2", ort, -5, 25);
  zustand.entfernungAu = zahl(obj, "entfernung_au", ort, 0.0001, 100);
  zustand.bild = text(obj, "bild", ort);
  if (zustand.polarArcsec > zustand.winkelgroesseArcsec) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "polar_arcsec", "groesser als winkelgroesse_arcsec (aequatorial)");
  }
  const kolongitude = optZahl("kolongitude_grad", -360, 360);
  if (kolongitude !== undefined) zustand.kolongitudeGrad = kolongitude;
  const ringneigung = optZahl("ringneigung_grad", -90, 90);
  if (ringneigung !== undefined) zustand.ringneigungGrad = ringneigung;
  const ringAussen = optZahl("ring_aussen_arcsec", 0.1, WINKELGROESSE_MAX_ARCSEC);
  if (ringAussen !== undefined) zustand.ringAussenArcsec = ringAussen;

  const rohTrabanten = optional(obj, "trabanten", (o, f) => alsListe(o[f], ort, f)) ?? [];
  if (typ === "mond" && rohTrabanten.length > 0) throw new DatenFehler(OBJEKTE_DATEI, id, "trabanten", "der Mond hat keine Trabanten");
  zustand.trabanten = rohTrabanten.map((t, n) => {
    const ortT: Ort = { datei: OBJEKTE_DATEI, eintrag: `${id}, trabanten[${n}]` };
    const tObj = alsObjekt(t, ortT, "Trabant");
    nurBekannteFelder(tObj, ortT, FELDER_TRABANT);
    return {
      name: text(tObj, "name", ortT),
      dxArcsec: zahl(tObj, "dx_arcsec", ortT, -LAGE_MAX_ARCSEC, LAGE_MAX_ARCSEC),
      dyArcsec: zahl(tObj, "dy_arcsec", ortT, -LAGE_MAX_ARCSEC, LAGE_MAX_ARCSEC),
      durchmesserArcsec: zahl(tObj, "durchmesser_arcsec", ortT, 0.001, 100),
      magnitude: zahl(tObj, "magnitude", ortT, -5, 20)
    };
  });
}

/**
 * Doppelstern: mindestens zwei Sterne mit eindeutigen Namen und ein Paarnachweis je Paar. Jeder
 * Nachweis nennt in sterne seine beiden Komponenten; deren Abstand muss trennung_arcsec sein (dx
 * wiederholt die Trennung bewusst, Nachweis gegen Modell, ADR-0003 Nachtrag V2). Eine Gruppe zaehlt
 * mit dem geometrischen Mittelpunkt ihrer Sterne; das ist eine Naeherung, der WDS misst zwischen den
 * Photozentren. Bei genau zwei Sternen gilt zusaetzlich die Lage aus A-Z9 (Mitte im Ursprung,
 * Ost-West, dy = 0) und genau ein Nachweis.
 */
function pruefeDoppelstern(obj: Record<string, unknown>, zustand: ZustandEintrag, ort: Ort): void {
  const id = zustand.id;
  zustand.sterne = pruefeSterne(alsListe(obj["sterne"], ort, "sterne"), ort);
  if (zustand.sterne.length < 2) throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", "mindestens zwei Sterne erwartet");
  const nachName = new Map<string, SternEintrag>();
  for (const stern of zustand.sterne) {
    if (nachName.has(stern.name)) throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", `Name "${stern.name}" doppelt vergeben`);
    nachName.set(stern.name, stern);
  }
  if (zustand.sterne.length === 2) {
    // Lage aus A-Z9 nur fuer Zweisternobjekte; Mehrfachsterne stehen in echter Lage.
    const [a, b] = zustand.sterne as [SternEintrag, SternEintrag];
    if (a.dyArcsec !== 0 || b.dyArcsec !== 0) throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", "Paar liegt Ost-West, dy_arcsec = 0 (A-Z9)");
    if (Math.abs(a.dxArcsec + b.dxArcsec) > TOLERANZ_TRENNUNG_ARCSEC) {
      throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", "Mitte des Paars liegt nicht im Ursprung (A bei -rho/2, B bei +rho/2)");
    }
  }
  const rohKatalog = alsListe(obj["katalog"], ort, "katalog");
  if (rohKatalog.length === 0) throw new DatenFehler(OBJEKTE_DATEI, id, "katalog", "mindestens ein Paarnachweis erwartet");
  zustand.katalog = rohKatalog.map((p, n) => {
    const ortP: Ort = { datei: OBJEKTE_DATEI, eintrag: `${id}, katalog[${n}]` };
    const nachweis = pruefePaarnachweis(p, ortP);
    pruefeTrennung(nachweis, nachName, ortP);
    return nachweis;
  });
  // Die Gesamthelligkeit ist heller als jeder einzelne Stern (kleinere Magnitude).
  const hellster = Math.min(...zustand.sterne.map((s) => s.magnitude));
  if (zustand.magnitude > hellster) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "magnitude", `${zustand.magnitude} schwaecher als der hellste Stern (${hellster})`);
  }
  if (zustand.sterne.length === 2 && zustand.katalog.length !== 1) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "katalog", "genau ein Paarnachweis fuer zwei Sterne erwartet");
  }
}

/** Abstand der beiden Komponenten eines Paarnachweises gegen trennung_arcsec; unbekannte Namen sind Fehler. */
function pruefeTrennung(nachweis: Paarnachweis, nachName: ReadonlyMap<string, SternEintrag>, ort: Ort): void {
  const [p, q] = nachweis.sterne.map((namen) => {
    let x = 0;
    let y = 0;
    for (const name of namen) {
      const stern = nachName.get(name);
      if (stern === undefined) throw new DatenFehler(ort.datei, ort.eintrag, "sterne", `kein Stern "${name}" in sterne des Zustands`);
      x += stern.dxArcsec;
      y += stern.dyArcsec;
    }
    return { x: x / namen.length, y: y / namen.length };
  }) as [{ x: number; y: number }, { x: number; y: number }];
  const abstand = Math.hypot(q.x - p.x, q.y - p.y);
  if (Math.abs(abstand - nachweis.trennungArcsec) > TOLERANZ_TRENNUNG_ARCSEC) {
    throw new DatenFehler(
      ort.datei,
      ort.eintrag,
      "trennung_arcsec",
      `${nachweis.trennungArcsec} passt nicht zum Abstand ${abstand.toFixed(4)} der Komponenten in sterne`
    );
  }
}

function pruefeDeepSky(obj: Record<string, unknown>, zustand: ZustandEintrag, ort: Ort): void {
  const id = zustand.id;
  zustand.winkelgroesseArcsec = zahl(obj, "winkelgroesse_arcsec", ort, 0.1, WINKELGROESSE_DEEP_SKY_MAX_ARCSEC);
  zustand.polarArcsec = zahl(obj, "polar_arcsec", ort, 0.1, WINKELGROESSE_DEEP_SKY_MAX_ARCSEC);
  if (zustand.polarArcsec > zustand.winkelgroesseArcsec) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "polar_arcsec", "groesser als winkelgroesse_arcsec (grosse Achse)");
  }
  zustand.positionswinkelGrad = positionswinkel(obj, ort);
  const profil = optional(obj, "profil", (o, f) => pruefeProfil(alsObjekt(o[f], ort, f), { datei: OBJEKTE_DATEI, eintrag: `${id}, profil` }));
  if (profil !== undefined) zustand.profil = profil;

  const bild = optional(obj, "bild", (o, f) => text(o, f, ort));
  if (bild !== undefined) {
    zustand.bild = bild;
    zustand.isophoten = pruefeIsophoten(alsListe(obj["isophoten"], ort, "isophoten"), ort);
  } else {
    // Ohne Bild gibt es keine Flaechentabelle (M45, ADR-0003 Nachtrag V2).
    if (obj["isophoten"] !== undefined) throw new DatenFehler(OBJEKTE_DATEI, id, "isophoten", "nur mit bild");
  }

  const sterneDatei = optional(obj, "sterne_datei", (o, f) => text(o, f, ort));
  if (sterneDatei !== undefined) {
    if (obj["sterne"] !== undefined) throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", "entweder sterne oder sterne_datei");
    if (!/^[a-z0-9_-]+\.json$/.test(sterneDatei)) {
      throw new DatenFehler(OBJEKTE_DATEI, id, "sterne_datei", `Dateiname unter daten/${STERNE_VERZEICHNIS} erwartet (z. B. m13.json)`);
    }
    zustand.sterneDatei = sterneDatei;
  } else {
    zustand.sterne = pruefeSterne(optional(obj, "sterne", (o, f) => alsListe(o[f], ort, f)) ?? [], ort);
    if (bild === undefined && zustand.sterne.length === 0) {
      throw new DatenFehler(OBJEKTE_DATEI, id, "sterne", "ohne bild mindestens ein Stern oder sterne_datei erwartet");
    }
  }
}

/**
 * Feld sterne eines Paarnachweises: genau zwei Komponenten, jede ein Sternname oder eine Liste von
 * mindestens zwei Namen (Gruppe); kein Stern in beiden Komponenten.
 */
function pruefeKomponenten(obj: Record<string, unknown>, ort: Ort): [string[], string[]] {
  const liste = alsListe(obj["sterne"], ort, "sterne");
  if (liste.length !== 2) throw new DatenFehler(ort.datei, ort.eintrag, "sterne", "genau zwei Komponenten erwartet");
  const komponenten = liste.map((k): string[] => {
    if (typeof k === "string" && k.trim() !== "") return [k];
    if (Array.isArray(k) && k.length >= 2 && k.every((n) => typeof n === "string" && n.trim() !== "")) return k as string[];
    throw new DatenFehler(ort.datei, ort.eintrag, "sterne", "Komponente ist ein Sternname oder eine Liste von mindestens zwei Namen");
  }) as [string[], string[]];
  const alle = komponenten.flat();
  if (new Set(alle).size !== alle.length) throw new DatenFehler(ort.datei, ort.eintrag, "sterne", "ein Stern steht mehrfach in den Komponenten");
  return komponenten;
}

/** Positionswinkel in Grad, halboffen [0, 360): 360 ist 0 und soll so eingetragen werden. */
function positionswinkel(obj: Record<string, unknown>, ort: Ort): number {
  const wert = zahl(obj, "positionswinkel_grad", ort, 0, 360);
  if (wert === 360) throw new DatenFehler(ort.datei, ort.eintrag, "positionswinkel_grad", "360 liegt nicht in [0, 360); 0 eintragen");
  return wert;
}

/** Prueft eine Liste roher Sterne; ort nennt den Zustand oder die Sternliste. */
function pruefeSterne(liste: unknown[], ort: Ort): SternEintrag[] {
  return liste.map((s, n) => {
    const ortS: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, sterne[${n}]` };
    const sObj = alsObjekt(s, ortS, "Stern");
    if (sObj["bv"] !== undefined) throw new DatenFehler(ortS.datei, ortS.eintrag, "bv", 'heisst "b_v" (ADR-0003 Nachtrag V2)');
    nurBekannteFelder(sObj, ortS, FELDER_STERN);
    const stern: SternEintrag = {
      name: text(sObj, "name", ortS),
      dxArcsec: zahl(sObj, "dx_arcsec", ortS, -LAGE_MAX_ARCSEC, LAGE_MAX_ARCSEC),
      dyArcsec: zahl(sObj, "dy_arcsec", ortS, -LAGE_MAX_ARCSEC, LAGE_MAX_ARCSEC),
      magnitude: zahl(sObj, "magnitude", ortS, -2, 22),
      bv: zahl(sObj, "b_v", ortS, -0.5, 2.5)
    };
    const katalog = optional(sObj, "katalog", (o, f) => text(o, f, ortS));
    if (katalog !== undefined) stern.katalog = katalog;
    const quelleFarbe = optional(sObj, "quelle_farbe", (o, f) => text(o, f, ortS));
    if (quelleFarbe !== undefined) stern.quelleFarbe = quelleFarbe;
    return stern;
  });
}

function pruefePaarnachweis(wert: unknown, ort: Ort): Paarnachweis {
  const obj = alsObjekt(wert, ort, "Paarnachweis");
  nurBekannteFelder(obj, ort, FELDER_PAAR);
  const wds = text(obj, "wds", ort);
  // WDS-Kennung: Rektaszension hhmmm und Deklination +ddmm (z. B. 16413+3136).
  if (!/^\d{5}[+-]\d{4}$/.test(wds)) throw new DatenFehler(ort.datei, ort.eintrag, "wds", `"${wds}" ist keine WDS-Kennung (hhmmm+ddmm)`);
  return {
    wds,
    komponenten: text(obj, "komponenten", ort),
    sterne: pruefeKomponenten(obj, ort),
    trennungArcsec: zahl(obj, "trennung_arcsec", ort, 0.001, 2 * LAGE_MAX_ARCSEC),
    positionswinkelGrad: positionswinkel(obj, ort),
    epoche: zahl(obj, "epoche", ort, 1700, 2200),
    quelle: text(obj, "quelle", ort)
  };
}

/** Flaechentabelle: mindestens zwei Zeilen, mag streng aufsteigend, Flaeche streng steigend. */
function pruefeIsophoten(liste: unknown[], ort: Ort): Isophote[] {
  if (liste.length < 2) throw new DatenFehler(ort.datei, ort.eintrag, "isophoten", "mindestens zwei Zeilen erwartet");
  const isophoten = liste.map((roh, n): Isophote => {
    const ortI: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, isophoten[${n}]` };
    const obj = alsObjekt(roh, ortI, "Isophote");
    nurBekannteFelder(obj, ortI, FELDER_ISOPHOTE);
    return {
      magProArcsec2: zahl(obj, "mag_arcsec2", ortI, -5, 35),
      flaecheArcsec2: zahl(obj, "flaeche_arcsec2", ortI, 0)
    };
  });
  if (!(isophoten[0]!.flaecheArcsec2 > 0)) throw new DatenFehler(ort.datei, `${ort.eintrag}, isophoten[0]`, "flaeche_arcsec2", "muss positiv sein");
  for (let n = 1; n < isophoten.length; n++) {
    const ortI = `${ort.eintrag}, isophoten[${n}]`;
    const [vor, akt] = [isophoten[n - 1]!, isophoten[n]!];
    if (!(akt.magProArcsec2 > vor.magProArcsec2)) throw new DatenFehler(ort.datei, ortI, "mag_arcsec2", `nicht aufsteigend (${vor.magProArcsec2} davor)`);
    if (!(akt.flaecheArcsec2 > vor.flaecheArcsec2)) throw new DatenFehler(ort.datei, ortI, "flaeche_arcsec2", `nicht streng steigend (${vor.flaecheArcsec2} davor)`);
  }
  return isophoten;
}

function pruefeProfil(obj: Record<string, unknown>, ort: Ort): Profil {
  const art = wahl(obj, "art", ort, PROFILARTEN);
  const zahlenfelder: readonly string[] = PROFILFELDER[art];
  nurBekannteFelder(obj, ort, ["art", "quelle", ...zahlenfelder]);
  const werte: Record<string, number> = {};
  for (const feld of zahlenfelder) werte[feld] = zahl(obj, feld, ort);
  const profil: Profil = { art, werte };
  const quelle = optional(obj, "quelle", (o, f) => text(o, f, ort));
  if (quelle !== undefined) profil.quelle = quelle;
  return profil;
}

/**
 * Prueft eine Sternliste aus daten/sterne/<datei> (grosse Listen wie M13, ADR-0003 Nachtrag V2):
 * Objekt mit objekt (muss passen), Nachweis (quelle, lizenz; Gaia und Hipparcos CC BY-NC 3.0 IGO),
 * optional kommentar, und sterne wie in objekte.json.
 */
export function pruefeSternliste(roh: unknown, datei: string, objektId: string): SternEintrag[] {
  const ort: Ort = { datei: STERNE_VERZEICHNIS + datei, eintrag: "-" };
  const obj = alsObjekt(roh, ort, "Wurzel");
  nurBekannteFelder(obj, ort, FELDER_STERNLISTE);
  const objekt = text(obj, "objekt", ort);
  if (objekt !== objektId) throw new DatenFehler(ort.datei, "-", "objekt", `"${objekt}", verwendet von Objekt "${objektId}"`);
  text(obj, "quelle", ort);
  text(obj, "lizenz", ort);
  optional(obj, "kommentar", (o, f) => text(o, f, ort));
  const sterne = pruefeSterne(alsListe(obj["sterne"], ort, "sterne"), { datei: ort.datei, eintrag: objektId });
  if (sterne.length === 0) throw new DatenFehler(ort.datei, "-", "sterne", "mindestens ein Stern erwartet");
  return sterne;
}

/**
 * Prueft den Verweis Zustand -> Bildnachweis: jedes bild zeigt auf einen vorhandenen Nachweis
 * desselben Objekts, und dessen zustand nennt einen Zustand dieses Objekts. Zwei Zustaende duerfen
 * sich ein Bild teilen (Mars 14" und 6", Jupiter 47" und 35", bilder.md Abschnitte 3 und 4): der
 * Nachweis nennt in zustand den Zustand, fuer den das Bild ausgewaehlt wurde (mars_14), der andere
 * verweist nur ueber bild darauf; die Datei liegt einmal im Repo. Ein Nachweis, den kein
 * Zustand verwendet, ist ebenfalls ein Fehler (Bild im Repo, das niemand nutzt).
 *
 * Kennlinie je Klasse (ADR-0003 Nachtrag V2): Bilder von Deep-Sky-Objekten tragen die log-Kennlinie,
 * Mond und Planeten nicht (sRGB). Bei der log-Kennlinie ist Quellweiss mag_hell (kennlinie.ts,
 * objektzustand), und die Isophoten muessen im Umfang der Kennlinie liegen, weil tools/ sie am
 * dekodierten Bild misst.
 */
export function pruefeVerweise(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[]): void {
  const nachId = new Map(nachweise.map((n) => [n.id, n]));
  const genutzt = new Set<string>();
  for (const objekt of objekte) {
    const zustandIds = new Set(objekt.zustaende.map((z) => z.id));
    for (const zustand of objekt.zustaende) {
      if (zustand.bild === undefined) continue;
      const nachweis = nachId.get(zustand.bild);
      if (nachweis === undefined) {
        throw new DatenFehler(OBJEKTE_DATEI, zustand.id, "bild", `kein Bildnachweis "${zustand.bild}" in ${BILDER_DATEI}`);
      }
      if (nachweis.objekt !== objekt.id) {
        throw new DatenFehler(BILDER_DATEI, nachweis.id, "objekt", `"${nachweis.objekt}", verwendet von Objekt "${objekt.id}"`);
      }
      if (!zustandIds.has(nachweis.zustand)) {
        throw new DatenFehler(BILDER_DATEI, nachweis.id, "zustand", `"${nachweis.zustand}" ist kein Zustand von "${objekt.id}"`);
      }
      pruefeKennlinieZuKlasse(objekt, zustand, nachweis);
      genutzt.add(nachweis.id);
    }
  }
  for (const nachweis of nachweise) {
    if (!genutzt.has(nachweis.id)) throw new DatenFehler(BILDER_DATEI, nachweis.id, "id", `von keinem Zustand in ${OBJEKTE_DATEI} verwendet`);
  }
}

function pruefeKennlinieZuKlasse(objekt: Objekt, zustand: ZustandEintrag, nachweis: Bildnachweis): void {
  const kennlinie = nachweis.kennlinie;
  if (objekt.klasse !== "deep_sky") {
    if (kennlinie !== undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kennlinie", "nur bei Deep-Sky-Bildern; Mond und Planeten sind sRGB");
    return;
  }
  if (kennlinie === undefined) throw new DatenFehler(BILDER_DATEI, nachweis.id, "kennlinie", "Deep-Sky-Bilder brauchen die log-Kennlinie");
  for (const [n, iso] of (zustand.isophoten ?? []).entries()) {
    if (iso.magProArcsec2 < kennlinie.magHell || iso.magProArcsec2 > kennlinie.magDunkel) {
      throw new DatenFehler(
        OBJEKTE_DATEI,
        `${zustand.id}, isophoten[${n}]`,
        "mag_arcsec2",
        `${iso.magProArcsec2} ausserhalb der Kennlinie ${kennlinie.magHell} bis ${kennlinie.magDunkel} von "${nachweis.id}"`
      );
    }
  }
}

/**
 * Laedt daten/objekte.json, prueft sie und die Verweise auf die schon geladenen Bildnachweise und
 * fuellt die Sterne der Zustaende mit sterne_datei aus daten/sterne/ (alle beim Start, damit
 * objektzustand synchron bleibt; M13 hat rund 530 Sterne).
 */
export async function ladeObjekte(nachweise: readonly Bildnachweis[]): Promise<Objekt[]> {
  const objekte = pruefeObjekte(await ladeJson(OBJEKTE_DATEI));
  pruefeVerweise(objekte, nachweise);
  await ladeSterne(objekte);
  return objekte;
}

/** Laedt die Sternlisten aller Zustaende mit sterne_datei ueber BASE_URL und traegt sie ein. */
export async function ladeSterne(objekte: readonly Objekt[]): Promise<void> {
  const auftraege: Promise<void>[] = [];
  for (const objekt of objekte) {
    for (const zustand of objekt.zustaende) {
      const datei = zustand.sterneDatei;
      if (datei === undefined) continue;
      auftraege.push(
        ladeJson(STERNE_VERZEICHNIS + datei).then((roh) => {
          zustand.sterne = pruefeSternliste(roh, datei, objekt.id);
        })
      );
    }
  }
  await Promise.all(auftraege);
}
