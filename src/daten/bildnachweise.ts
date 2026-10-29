// Bildnachweise aus daten/bilder.json (A-X4, ADR-0003, Felder nach docs/recherche/bilder.md
// Abschnitt 8): pruefeBildnachweise prueft die rohe Liste, ladeBildnachweise holt sie per fetch.
// Kachelpyramiden (Mond) tragen das Unterobjekt kacheln; geprueft wird auch, dass die Stufen
// zusammenpassen (halbierende Masse, verdoppelter Massstab, Kachelanzahl), weil QuelleKacheln
// sich darauf verlaesst. Einzelbilder (Planeten, QuelleEinzelbild) haben kein kacheln, dafuer
// datei_bytes, damit die Grenze von 20 MB je Objekt (A-X6) auch sie erfasst. Dass Masse und
// Bytes zu den Dateien passen, prueft bilddateien.test.ts (und tools/bildnachweis_pruefen.py).
// Deep-Sky-Bilder tragen die log-Kennlinie (kennlinie, ADR-0003 Nachtrag Version 2, kennlinie.ts);
// ohne kennlinie sind die Kodewerte sRGB (Planeten, Mond).

import { DatenFehler } from "./fehler";
import type { Kennlinie } from "./kennlinie";
import { alsListe, alsObjekt, ganzzahl, ladeJson, nurBekannteFelder, optional, text, wahl, wahrheitswert, zahl, type Ort } from "./pruefe";

export const BILDER_DATEI = "bilder.json";

/** Eine Stufe der Kachelpyramide; Massstab bezogen auf winkelgroesseArcsec des Nachweises. */
export interface Kachelstufe {
  stufe: number;
  breitePx: number;
  hoehePx: number;
  bogensekundenProPixel: number;
  kachelnX: number;
  kachelnY: number;
}

/** Kachelpyramide: Kacheln je Stufe unter datei + muster, Randkacheln duerfen kleiner sein. */
export interface Kachelpyramide {
  kachelPx: number;
  format: string;
  /** Pfad der Kachel relativ zu datei, mit den Platzhaltern {stufe}, {x}, {y}. */
  muster: string;
  gesamtBytes: number;
  /** Stufe 0 (volle Aufloesung) zuerst, jede weitere halbiert. */
  stufen: Kachelstufe[];
}

/** Ein Eintrag aus bilder.json. Pixelmasse beziehen sich auf die Datei im Repo (Stufe 0). */
export interface Bildnachweis {
  id: string;
  objekt: string;
  /**
   * Zustand, fuer den das Bild ausgewaehlt wurde. Weitere Zustaende desselben Objekts duerfen es
   * ueber ihr Feld bild mitbenutzen (mars_6 nutzt das Bild von mars_14, pruefeVerweise).
   */
  zustand: string;
  /** Pfad relativ zu daten/bilder/, bei Kachelpyramiden das Verzeichnis (endet auf /). */
  datei: string;
  quelleUrl: string;
  quelleDatei?: string;
  mission: string;
  instrument: string;
  aufnahmedatum: string;
  lizenz: string;
  lizenzUrl: string;
  namensnennung: string;
  pixelBreite: number;
  pixelHoehe: number;
  originalPixel: string;
  /** Winkelgroesse zum Aufnahme- oder Rendering-Zeitpunkt, nicht die des Zustands. */
  winkelgroesseArcsec: number;
  objektDurchmesserPx: number;
  bogensekundenProPixel: number;
  nordenOben: boolean;
  bearbeitung: string;
  hinweise?: string;
  /** Nur Einzelbilder: Groesse der Datei in Byte (A-X6); Kachelpyramiden nennen kacheln.gesamtBytes. */
  dateiBytes?: number;
  kacheln?: Kachelpyramide;
  /** Nur Deep-Sky-Bilder: 8-Bit-Grauwert mit log-Kennlinie; fehlt = sRGB. */
  kennlinie?: Kennlinie;
}

/** Erlaubte relative Abweichung zwischen gespeicherten und abgeleiteten Massstaeben. */
const TOLERANZ_MASSSTAB = 0.01;

/** Grenze fuer nachgeladene Bilder je Objekt (A-X6), 20 MB wie scripts/build-abschluss.mjs in Byte. */
export const GRENZE_BYTES_JE_OBJEKT = 20_000_000;

/** Erlaubte Felder je Ebene; alles andere ist ein Tippfehler der Handpflege. */
const FELDER_EINTRAG = [
  "id", "objekt", "zustand", "datei", "quelle_url", "quelle_datei", "mission", "instrument", "aufnahmedatum",
  "lizenz", "lizenz_url", "namensnennung", "pixel_breite", "pixel_hoehe", "original_pixel", "winkelgroesse_arcsec",
  "ringe_arcsec", "objekt_durchmesser_px", "bogensekunden_pro_pixel", "norden_oben", "sub_erde_breite_grad",
  "sub_erde_laenge_grad", "phase", "kolongitude_grad", "positionswinkel_achse_grad", "datei_bytes", "bearbeitung", "hinweise",
  "kacheln", "kennlinie"
] as const;
const FELDER_KENNLINIE = ["art", "mag_hell", "mag_dunkel"] as const;
/** Grenzen der Flaechenhelligkeit in der Kennlinie, mag/arcsec^2. */
const MAG_KENNLINIE_MIN = -5;
const MAG_KENNLINIE_MAX = 35;
/** Groesste Winkelgroesse eines Bilds: M31 rund 11400'' (deep-sky.md 1.1), 5 Grad Gesichtsfeld des Auges. */
const WINKELGROESSE_MAX_ARCSEC = 18000;
const FELDER_KACHELN = ["kachel_px", "format", "qualitaet", "muster", "gesamt_bytes", "stufen"] as const;
const FELDER_STUFE = ["stufe", "breite_px", "hoehe_px", "bogensekunden_pro_pixel", "kacheln_x", "kacheln_y"] as const;

/** Prueft die rohe Liste aus bilder.json; wirft DatenFehler mit Datei, Eintrag und Feld. */
export function pruefeBildnachweise(roh: unknown): Bildnachweis[] {
  const liste = alsListe(roh, { datei: BILDER_DATEI, eintrag: "-" }, "Wurzel");
  const ids = new Set<string>();
  const nachweise = liste.map((wert, index) => {
    const obj = alsObjekt(wert, { datei: BILDER_DATEI, eintrag: `Index ${index}` }, "Eintrag");
    const id = text(obj, "id", { datei: BILDER_DATEI, eintrag: `Index ${index}` });
    const ort: Ort = { datei: BILDER_DATEI, eintrag: id };
    if (ids.has(id)) throw new DatenFehler(BILDER_DATEI, id, "id", "doppelt vergeben");
    ids.add(id);
    nurBekannteFelder(obj, ort, FELDER_EINTRAG);
    return pruefeEintrag(obj, id, ort);
  });
  // Nachgeladene Bilder je Objekt unter 20 MB (A-X6): Kachelpyramiden und Einzelbilder zusammen.
  const bytesJeObjekt = new Map<string, number>();
  for (const n of nachweise) {
    const summe = (bytesJeObjekt.get(n.objekt) ?? 0) + bildBytes(n);
    bytesJeObjekt.set(n.objekt, summe);
    if (summe > GRENZE_BYTES_JE_OBJEKT) {
      const feld = n.kacheln === undefined ? "datei_bytes" : "kacheln.gesamt_bytes";
      throw new DatenFehler(BILDER_DATEI, n.id, feld, `Objekt ${n.objekt} hat ${summe} Byte, mehr als 20 MB (A-X6)`);
    }
  }
  return nachweise;
}

/** Bytes, die ein Nachweis im Repo belegt: alle Kacheln oder die eine Datei. */
export function bildBytes(nachweis: Bildnachweis): number {
  return nachweis.kacheln?.gesamtBytes ?? nachweis.dateiBytes ?? 0;
}

/** Laedt daten/bilder.json und prueft sie. */
export async function ladeBildnachweise(): Promise<Bildnachweis[]> {
  return pruefeBildnachweise(await ladeJson(BILDER_DATEI));
}

function pruefeEintrag(obj: Record<string, unknown>, id: string, ort: Ort): Bildnachweis {
  const optText = (feld: string) => optional(obj, feld, (o, f) => text(o, f, ort));
  const nachweis: Bildnachweis = {
    id,
    objekt: text(obj, "objekt", ort),
    zustand: text(obj, "zustand", ort),
    datei: text(obj, "datei", ort),
    quelleUrl: text(obj, "quelle_url", ort),
    mission: text(obj, "mission", ort),
    instrument: text(obj, "instrument", ort),
    aufnahmedatum: text(obj, "aufnahmedatum", ort),
    lizenz: text(obj, "lizenz", ort),
    lizenzUrl: text(obj, "lizenz_url", ort),
    namensnennung: text(obj, "namensnennung", ort),
    pixelBreite: ganzzahl(obj, "pixel_breite", ort, 1, 100000),
    pixelHoehe: ganzzahl(obj, "pixel_hoehe", ort, 1, 100000),
    originalPixel: text(obj, "original_pixel", ort),
    winkelgroesseArcsec: zahl(obj, "winkelgroesse_arcsec", ort, 0.1, WINKELGROESSE_MAX_ARCSEC),
    objektDurchmesserPx: ganzzahl(obj, "objekt_durchmesser_px", ort, 1, 100000),
    bogensekundenProPixel: zahl(obj, "bogensekunden_pro_pixel", ort, 0.001, 100),
    nordenOben: wahrheitswert(obj, "norden_oben", ort),
    bearbeitung: text(obj, "bearbeitung", ort)
  };
  // Bild und Simulation setzen Norden oben voraus (A-D11); gedreht wird nur in tools/.
  if (!nachweis.nordenOben) throw new DatenFehler(ort.datei, id, "norden_oben", "Bild muss Norden oben haben; in tools/ nach Norden drehen");
  // Zusatzangaben zur Dokumentation: nur Typ und Bereich pruefen.
  for (const [feld, min, max] of [
    ["ringe_arcsec", 0.1, 4000],
    ["sub_erde_breite_grad", -90, 90],
    ["sub_erde_laenge_grad", -360, 360],
    ["phase", 0, 1],
    ["kolongitude_grad", -360, 360],
    ["positionswinkel_achse_grad", -360, 360]
  ] as const) {
    optional(obj, feld, (o, f) => zahl(o, f, ort, min, max));
  }
  const quelleDatei = optText("quelle_datei");
  if (quelleDatei !== undefined) nachweis.quelleDatei = quelleDatei;
  const hinweise = optText("hinweise");
  if (hinweise !== undefined) nachweis.hinweise = hinweise;

  for (const url of ["quelle_url", "lizenz_url"] as const) {
    if (!/^https?:\/\//.test(obj[url] as string)) throw new DatenFehler(ort.datei, id, url, "URL mit http(s):// erwartet");
  }
  if (nachweis.datei.startsWith("/") || nachweis.datei.includes("..")) {
    throw new DatenFehler(ort.datei, id, "datei", "relativer Pfad unter daten/bilder/ ohne .. erwartet");
  }
  if (nachweis.objektDurchmesserPx > Math.max(nachweis.pixelBreite, nachweis.pixelHoehe)) {
    throw new DatenFehler(ort.datei, id, "objekt_durchmesser_px", "groesser als das Bild");
  }
  // Der Massstab folgt aus Winkelgroesse und Scheibendurchmesser; beide werden von Hand gepflegt.
  const abgeleitet = nachweis.winkelgroesseArcsec / nachweis.objektDurchmesserPx;
  if (Math.abs(nachweis.bogensekundenProPixel / abgeleitet - 1) > TOLERANZ_MASSSTAB) {
    throw new DatenFehler(
      ort.datei,
      id,
      "bogensekunden_pro_pixel",
      `passt nicht zu winkelgroesse_arcsec / objekt_durchmesser_px = ${abgeleitet.toFixed(4)}`
    );
  }
  const kacheln = optional(obj, "kacheln", (o, f) => pruefeKacheln(alsObjekt(o[f], ort, f), nachweis, ort));
  const dateiBytes = optional(obj, "datei_bytes", (o, f) => ganzzahl(o, f, ort, 1));
  if (kacheln !== undefined) {
    if (!nachweis.datei.endsWith("/")) throw new DatenFehler(ort.datei, id, "datei", "Verzeichnis mit / am Ende erwartet (Kachelpyramide)");
    if (dateiBytes !== undefined) throw new DatenFehler(ort.datei, id, "datei_bytes", "nur bei Einzelbildern; Kachelpyramiden nennen kacheln.gesamt_bytes");
    nachweis.kacheln = kacheln;
  } else {
    // Einzelbild: eine Datei, deren Groesse fuer A-X6 bekannt sein muss.
    if (nachweis.datei.endsWith("/")) throw new DatenFehler(ort.datei, id, "datei", "Datei erwartet, kein Verzeichnis (Einzelbild ohne kacheln)");
    if (dateiBytes === undefined) throw new DatenFehler(ort.datei, id, "datei_bytes", "Pflicht bei Einzelbildern (A-X6)");
    nachweis.dateiBytes = dateiBytes;
  }
  const kennlinie = optional(obj, "kennlinie", (o, f) => pruefeKennlinie(alsObjekt(o[f], ort, f), ort));
  if (kennlinie !== undefined) nachweis.kennlinie = kennlinie;
  return nachweis;
}

function pruefeKennlinie(obj: Record<string, unknown>, ort: Ort): Kennlinie {
  const ortK: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, kennlinie` };
  nurBekannteFelder(obj, ortK, FELDER_KENNLINIE);
  const kennlinie: Kennlinie = {
    art: wahl(obj, "art", ortK, ["log"] as const),
    magHell: zahl(obj, "mag_hell", ortK, MAG_KENNLINIE_MIN, MAG_KENNLINIE_MAX),
    magDunkel: zahl(obj, "mag_dunkel", ortK, MAG_KENNLINIE_MIN, MAG_KENNLINIE_MAX)
  };
  // Kode 255 ist heller als Kode 1; gleiche Werte gaeben eine Kennlinie ohne Umfang.
  if (!(kennlinie.magDunkel > kennlinie.magHell)) {
    throw new DatenFehler(ortK.datei, ortK.eintrag, "mag_dunkel", `muss groesser als mag_hell (${kennlinie.magHell}) sein`);
  }
  return kennlinie;
}

function pruefeKacheln(obj: Record<string, unknown>, nachweis: Bildnachweis, ort: Ort): Kachelpyramide {
  // Felder im Unterobjekt: der Eintrag nennt den Pfad dorthin, z. B. "mond_..., kacheln".
  const ortK: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, kacheln` };
  nurBekannteFelder(obj, ortK, FELDER_KACHELN);
  optional(obj, "qualitaet", (o, f) => ganzzahl(o, f, ortK, 0, 100));
  const kachelPx = ganzzahl(obj, "kachel_px", ortK, 16, 8192);
  const format = text(obj, "format", ortK);
  const muster = text(obj, "muster", ortK);
  const gesamtBytes = ganzzahl(obj, "gesamt_bytes", ortK, 1);
  for (const platzhalter of ["{stufe}", "{x}", "{y}"]) {
    if (!muster.includes(platzhalter)) throw new DatenFehler(ortK.datei, ortK.eintrag, "muster", `Platzhalter ${platzhalter} fehlt`);
  }
  const rohStufen = alsListe(obj["stufen"], ortK, "stufen");
  if (rohStufen.length === 0) throw new DatenFehler(ortK.datei, ortK.eintrag, "stufen", "mindestens eine Stufe erwartet");

  const stufen = rohStufen.map((roh, n): Kachelstufe => {
    const ortS: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, kacheln.stufen[${n}]` };
    const s = alsObjekt(roh, ortK, `stufen[${n}]`);
    nurBekannteFelder(s, ortS, FELDER_STUFE);
    const stufe: Kachelstufe = {
      stufe: ganzzahl(s, "stufe", ortS, n, n),
      breitePx: ganzzahl(s, "breite_px", ortS, 1),
      hoehePx: ganzzahl(s, "hoehe_px", ortS, 1),
      bogensekundenProPixel: zahl(s, "bogensekunden_pro_pixel", ortS, 0.001, 1000),
      kachelnX: ganzzahl(s, "kacheln_x", ortS, 1),
      kachelnY: ganzzahl(s, "kacheln_y", ortS, 1)
    };
    // Stufe n hat das 2^n-fache Pixelmass von Stufe 0; Masse aufgerundet halbiert.
    const faktor = 2 ** n;
    const vergleiche: [string, number, number][] = [
      ["breite_px", stufe.breitePx, Math.ceil(nachweis.pixelBreite / faktor)],
      ["hoehe_px", stufe.hoehePx, Math.ceil(nachweis.pixelHoehe / faktor)],
      ["kacheln_x", stufe.kachelnX, Math.ceil(stufe.breitePx / kachelPx)],
      ["kacheln_y", stufe.kachelnY, Math.ceil(stufe.hoehePx / kachelPx)]
    ];
    for (const [feld, ist, soll] of vergleiche) {
      if (ist !== soll) throw new DatenFehler(ortS.datei, ortS.eintrag, feld, `${soll} erwartet, ${ist} eingetragen`);
    }
    const massstab = (nachweis.bogensekundenProPixel * nachweis.pixelBreite) / stufe.breitePx;
    if (Math.abs(stufe.bogensekundenProPixel / massstab - 1) > TOLERANZ_MASSSTAB) {
      throw new DatenFehler(ortS.datei, ortS.eintrag, "bogensekunden_pro_pixel", `${massstab.toFixed(4)} erwartet`);
    }
    return stufe;
  });
  // tools/mond_kacheln.py halbiert ohne Rest; sonst decken die Stufen nicht genau dieselbe Flaeche ab
  // und pyramidengeometrie (Massstab aus dem Breitenverhaeltnis) waere nicht exakt.
  const teiler = 2 ** (stufen.length - 1);
  for (const [feld, wert] of [["pixel_breite", nachweis.pixelBreite], ["pixel_hoehe", nachweis.pixelHoehe]] as const) {
    if (wert % teiler !== 0) throw new DatenFehler(ort.datei, ort.eintrag, feld, `${wert} ist nicht durch ${teiler} teilbar (${stufen.length} Stufen)`);
  }
  return { kachelPx, format, muster, gesamtBytes, stufen };
}
