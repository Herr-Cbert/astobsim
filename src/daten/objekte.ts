// Objekte und ihre Zustaende aus daten/objekte.json (ADR-0003, Felder nach
// docs/recherche/objekte.md Abschnitt 6.2): pruefeObjekte prueft die rohe Liste, pruefeVerweise
// den Verweis Zustand -> Bildnachweis in beide Richtungen, ladeObjekte holt die Datei per fetch
// und prueft beides. Trabanten heissen in der Datei "trabanten" (GLOSSARY.md: nie "Mond" fuer
// Planetenmonde), Einheiten im Feldnamen.

import { BILDER_DATEI, type Bildnachweis } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import type { Trabant } from "../naht/konfiguration";
import { alsListe, alsObjekt, ladeJson, nurBekannteFelder, optional, text, wahl, zahl, type Ort } from "./pruefe";

export const OBJEKTE_DATEI = "objekte.json";

const OBJEKTTYPEN = ["mond", "planet"] as const;
type Objekttyp = (typeof OBJEKTTYPEN)[number];

/** Erlaubte Felder je Ebene; alles andere ist ein Tippfehler der Handpflege. */
const FELDER_OBJEKT = ["id", "name", "typ", "quelle_physik", "zustaende"] as const;
const FELDER_ZUSTAND = [
  "id", "name", "winkelgroesse_arcsec", "polar_arcsec", "phase", "phasenwinkel_grad", "kolongitude_grad",
  "ringneigung_grad", "ring_aussen_arcsec", "magnitude", "weiss_mag_arcsec2", "entfernung_au", "bild", "trabanten", "hinweis_hilfe",
  "kommentar"
] as const;
const FELDER_TRABANT = ["name", "dx_arcsec", "dy_arcsec", "durchmesser_arcsec", "magnitude"] as const;

/** Zustand eines Objekts, wie er in objekte.json steht. */
export interface ZustandEintrag {
  id: string;
  name: string;
  /** Anzeigegroesse (aequatorial); das Quellbild wird darauf skaliert. */
  winkelgroesseArcsec: number;
  polarArcsec: number;
  /** Beleuchteter Anteil 0 bis 1. */
  phase: number;
  phasenwinkelGrad: number;
  magnitude: number;
  /**
   * Flaechenhelligkeit in mag je Quadratbogensekunde, die Weiss (1,0) im Quellbild bedeutet
   * (Objektzustand.quelle.weissMagProArcsec2); Werte aus docs/recherche/objekte.md 5.2.
   */
  weissMagProArcsec2: number;
  entfernungAu: number;
  /** id des Bildnachweises in bilder.json. */
  bild: string;
  kolongitudeGrad?: number;
  ringneigungGrad?: number;
  ringAussenArcsec?: number;
  trabanten: Trabant[];
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
    if (objektIds.has(id)) throw new DatenFehler(OBJEKTE_DATEI, id, "id", "doppelt vergeben");
    objektIds.add(id);
    nurBekannteFelder(obj, ort, FELDER_OBJEKT);
    const typ = wahl(obj, "typ", ort, OBJEKTTYPEN);
    const rohZustaende = alsListe(obj["zustaende"], ort, "zustaende");
    if (rohZustaende.length === 0) throw new DatenFehler(OBJEKTE_DATEI, id, "zustaende", "mindestens ein Zustand erwartet");
    const zustaende = rohZustaende.map((z, n) => {
      const zustand = pruefeZustand(z, typ, { datei: OBJEKTE_DATEI, eintrag: `${id}, zustaende[${n}]` });
      // Zustands-ids sind global eindeutig, weil bilder.json nur die id nennt.
      if (zustandIds.has(zustand.id)) throw new DatenFehler(OBJEKTE_DATEI, zustand.id, "id", "Zustand doppelt vergeben");
      zustandIds.add(zustand.id);
      return zustand;
    });
    const objekt: Objekt = { id, name: text(obj, "name", ort), typ, zustaende };
    const quellePhysik = optional(obj, "quelle_physik", (o, f) => text(o, f, ort));
    if (quellePhysik !== undefined) objekt.quellePhysik = quellePhysik;
    return objekt;
  });
}

function pruefeZustand(wert: unknown, typ: Objekttyp, ortIndex: Ort): ZustandEintrag {
  const obj = alsObjekt(wert, ortIndex, "Zustand");
  const id = text(obj, "id", ortIndex);
  const ort: Ort = { datei: OBJEKTE_DATEI, eintrag: id };
  if (obj["monde"] !== undefined) throw new DatenFehler(OBJEKTE_DATEI, id, "monde", 'heisst "trabanten" (GLOSSARY.md)');
  nurBekannteFelder(obj, ort, FELDER_ZUSTAND);
  const optZahl = (feld: string, min: number, max: number) => optional(obj, feld, (o, f) => zahl(o, f, ort, min, max));
  const zustand: ZustandEintrag = {
    id,
    name: text(obj, "name", ort),
    winkelgroesseArcsec: zahl(obj, "winkelgroesse_arcsec", ort, 0.1, 4000),
    polarArcsec: zahl(obj, "polar_arcsec", ort, 0.1, 4000),
    phase: zahl(obj, "phase", ort, 0, 1),
    phasenwinkelGrad: zahl(obj, "phasenwinkel_grad", ort, 0, 180),
    magnitude: zahl(obj, "magnitude", ort, -15, 10),
    weissMagProArcsec2: zahl(obj, "weiss_mag_arcsec2", ort, -5, 25),
    entfernungAu: zahl(obj, "entfernung_au", ort, 0.0001, 100),
    bild: text(obj, "bild", ort),
    trabanten: []
  };
  if (zustand.polarArcsec > zustand.winkelgroesseArcsec) {
    throw new DatenFehler(OBJEKTE_DATEI, id, "polar_arcsec", "groesser als winkelgroesse_arcsec (aequatorial)");
  }
  const kolongitude = optZahl("kolongitude_grad", -360, 360);
  if (kolongitude !== undefined) zustand.kolongitudeGrad = kolongitude;
  const ringneigung = optZahl("ringneigung_grad", -90, 90);
  if (ringneigung !== undefined) zustand.ringneigungGrad = ringneigung;
  const ringAussen = optZahl("ring_aussen_arcsec", 0.1, 4000);
  if (ringAussen !== undefined) zustand.ringAussenArcsec = ringAussen;
  const hinweisHilfe = optional(obj, "hinweis_hilfe", (o, f) => text(o, f, ort));
  if (hinweisHilfe !== undefined) zustand.hinweisHilfe = hinweisHilfe;
  const kommentar = optional(obj, "kommentar", (o, f) => text(o, f, ort));
  if (kommentar !== undefined) zustand.kommentar = kommentar;

  const rohTrabanten = optional(obj, "trabanten", (o, f) => alsListe(o[f], ort, f)) ?? [];
  if (typ === "mond" && rohTrabanten.length > 0) throw new DatenFehler(OBJEKTE_DATEI, id, "trabanten", "der Mond hat keine Trabanten");
  zustand.trabanten = rohTrabanten.map((t, n) => {
    const ortT: Ort = { datei: OBJEKTE_DATEI, eintrag: `${id}, trabanten[${n}]` };
    const tObj = alsObjekt(t, ortT, "Trabant");
    nurBekannteFelder(tObj, ortT, FELDER_TRABANT);
    return {
      name: text(tObj, "name", ortT),
      dxArcsec: zahl(tObj, "dx_arcsec", ortT, -7200, 7200),
      dyArcsec: zahl(tObj, "dy_arcsec", ortT, -7200, 7200),
      durchmesserArcsec: zahl(tObj, "durchmesser_arcsec", ortT, 0.001, 100),
      magnitude: zahl(tObj, "magnitude", ortT, -5, 20)
    };
  });
  return zustand;
}

/**
 * Prueft den Verweis Zustand -> Bildnachweis: jedes bild zeigt auf einen vorhandenen Nachweis
 * desselben Objekts, und dessen zustand nennt einen Zustand dieses Objekts. Zwei Zustaende duerfen
 * sich ein Bild teilen (Mars 14" und 6", Jupiter 47" und 35", bilder.md Abschnitte 3 und 4): der
 * Nachweis nennt in zustand den Zustand, fuer den das Bild ausgewaehlt wurde (mars_14), der andere
 * verweist nur ueber bild darauf; die Datei liegt einmal im Repo. Ein Nachweis, den kein
 * Zustand verwendet, ist ebenfalls ein Fehler (Bild im Repo, das niemand nutzt).
 */
export function pruefeVerweise(objekte: readonly Objekt[], nachweise: readonly Bildnachweis[]): void {
  const nachId = new Map(nachweise.map((n) => [n.id, n]));
  const genutzt = new Set<string>();
  for (const objekt of objekte) {
    const zustandIds = new Set(objekt.zustaende.map((z) => z.id));
    for (const zustand of objekt.zustaende) {
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
      genutzt.add(nachweis.id);
    }
  }
  for (const nachweis of nachweise) {
    if (!genutzt.has(nachweis.id)) throw new DatenFehler(BILDER_DATEI, nachweis.id, "id", `von keinem Zustand in ${OBJEKTE_DATEI} verwendet`);
  }
}

/** Laedt daten/objekte.json, prueft sie und die Verweise auf die schon geladenen Bildnachweise. */
export async function ladeObjekte(nachweise: readonly Bildnachweis[]): Promise<Objekt[]> {
  const objekte = pruefeObjekte(await ladeJson(OBJEKTE_DATEI));
  pruefeVerweise(objekte, nachweise);
  return objekte;
}
