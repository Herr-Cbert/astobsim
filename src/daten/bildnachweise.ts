// Bildnachweise aus daten/bilder.json (A-X4, ADR-0003, Felder nach docs/recherche/bilder.md
// Abschnitt 8): pruefeBildnachweise prueft die rohe Liste, ladeBildnachweise holt sie per fetch.
// Kachelpyramiden (Mond) tragen das Unterobjekt kacheln; geprueft wird auch, dass die Stufen
// zusammenpassen (halbierende Masse, verdoppelter Massstab, Kachelanzahl), weil QuelleKacheln
// sich darauf verlaesst.

import { DatenFehler } from "./fehler";
import { alsListe, alsObjekt, ganzzahl, ladeJson, optional, text, wahrheitswert, zahl, type Ort } from "./pruefe";

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
  kacheln?: Kachelpyramide;
}

/** Erlaubte relative Abweichung zwischen gespeicherten und abgeleiteten Massstaeben. */
const TOLERANZ_MASSSTAB = 0.01;

/** Prueft die rohe Liste aus bilder.json; wirft DatenFehler mit Datei, Eintrag und Feld. */
export function pruefeBildnachweise(roh: unknown): Bildnachweis[] {
  const liste = alsListe(roh, { datei: BILDER_DATEI, eintrag: "-" }, "Wurzel");
  const ids = new Set<string>();
  return liste.map((wert, index) => {
    const obj = alsObjekt(wert, { datei: BILDER_DATEI, eintrag: `Index ${index}` }, "Eintrag");
    const id = text(obj, "id", { datei: BILDER_DATEI, eintrag: `Index ${index}` });
    const ort: Ort = { datei: BILDER_DATEI, eintrag: id };
    if (ids.has(id)) throw new DatenFehler(BILDER_DATEI, id, "id", "doppelt vergeben");
    ids.add(id);
    return pruefeEintrag(obj, id, ort);
  });
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
    winkelgroesseArcsec: zahl(obj, "winkelgroesse_arcsec", ort, 0.1, 4000),
    objektDurchmesserPx: ganzzahl(obj, "objekt_durchmesser_px", ort, 1, 100000),
    bogensekundenProPixel: zahl(obj, "bogensekunden_pro_pixel", ort, 0.001, 100),
    nordenOben: wahrheitswert(obj, "norden_oben", ort),
    bearbeitung: text(obj, "bearbeitung", ort)
  };
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
  if (kacheln !== undefined) {
    if (!nachweis.datei.endsWith("/")) throw new DatenFehler(ort.datei, id, "datei", "Verzeichnis mit / am Ende erwartet (Kachelpyramide)");
    nachweis.kacheln = kacheln;
  }
  return nachweis;
}

function pruefeKacheln(obj: Record<string, unknown>, nachweis: Bildnachweis, ort: Ort): Kachelpyramide {
  // Felder im Unterobjekt: der Eintrag nennt den Pfad dorthin, z. B. "mond_..., kacheln".
  const ortK: Ort = { datei: ort.datei, eintrag: `${ort.eintrag}, kacheln` };
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
  return { kachelPx, format, muster, gesamtBytes, stufen };
}
