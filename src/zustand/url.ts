// Konfiguration in die URL und zurueck (A-D8, A-T4). Parameternamen und Regeln stehen in
// src/zustand/LIESMICH.md; die Tabelle PARAMETER hier ist dieselbe Liste im Code.
//
// inUrl schreibt ein Geraet der Liste als id, ein freies Geraet als Zahlen. ausUrl liest
// zurueck, jeder fehlende oder unlesbare Parameter faellt einzeln auf die Voreinstellung (A-D9)
// zurueck, nie auf einen Fehler. Danach geht die Konfiguration durch begrenze() aus physik,
// die einzige Stelle fuer die Bereiche A-F8. Zahlen stehen als kuerzeste verlustfreie
// Dezimaldarstellung (String(zahl)), die Obstruktion als Verhaeltnis 0 bis 0,5.
//
// Zur Invariante "nur optik() und begrenze() verzweigen ueber Geraet.art": Die URL muss je
// Geraeteart andere Felder schreiben und lesen. Das Erkennen eines Listengeraets vergleicht
// die Felder dagegen generisch, ohne die Art zu kennen.

import { type Listengeraet, mitOkular, objektzustand, vorschlagObstruktionProzent } from "../daten";
import { BAUARTEN, TRANSPARENZEN } from "../naht/konfiguration";
import type { Bauart, Fernglas, Fernrohr, Geraet, Konfiguration, Okular } from "../naht/konfiguration";
import { begrenze, type Hinweis } from "../physik";
import type { Kataloge } from "./kataloge";
import { VOREINSTELLUNG, voreinstellung } from "./voreinstellung";

/** Version des URL-Formats; ausUrl liest heute jede Version wie Version 1. */
export const URL_VERSION = 1;

/** Kurze Parameternamen der URL (Tabelle mit Einheiten in LIESMICH.md). */
export const PARAMETER = {
  version: "v",
  geraet: "g",
  art: "a",
  bauart: "ba",
  oeffnung: "d",
  brennweite: "f",
  obstruktion: "o",
  vergroesserung: "vg",
  wahresGesichtsfeld: "wg",
  okularBrennweite: "ok",
  scheinbaresGesichtsfeld: "sg",
  zustand: "z",
  seeing: "s",
  bortle: "b",
  transparenz: "t",
  hoehe: "h"
} as const;

const P = PARAMETER;

/**
 * Suchteil der URL zur Konfiguration, mit fuehrendem "?" (fertig fuer history.replaceState).
 * Geschrieben wird begrenze(konfiguration), damit ausUrl(inUrl(k)) auch fuer eine nicht
 * begrenzte Konfiguration gleich begrenze(k) ist.
 */
export function inUrl(eingabe: Konfiguration, kataloge: Kataloge): string {
  const konfiguration = begrenze(eingabe).konfiguration;
  const q = new URLSearchParams();
  q.set(P.version, String(URL_VERSION));
  schreibeGeraet(q, konfiguration.geraet, kataloge);
  q.set(P.zustand, konfiguration.objekt.kennung);
  const b = konfiguration.bedingungen;
  q.set(P.seeing, String(b.seeingFwhmArcsec));
  q.set(P.bortle, String(b.bortle));
  q.set(P.transparenz, b.transparenz);
  q.set(P.hoehe, String(b.hoeheGrad));
  return `?${q.toString()}`;
}

/**
 * Konfiguration aus dem Suchteil der URL (mit oder ohne "?"). Fehlende oder unlesbare Parameter
 * fallen einzeln auf die Voreinstellung zurueck, ebenso eine unbekannte Geraete- oder
 * Zustands-id; Werte ausserhalb A-F8 kommen ueber begrenze() geschnitten zurueck, mit je einem
 * Hinweis pro Schnitt (die UI zeigt sie an). Ein Rueckfall auf die Voreinstellung erzeugt keinen
 * Hinweis. Wirft nur, wenn die Kataloge selbst die Voreinstellung nicht enthalten (DatenFehler).
 */
export function ausUrl(search: string, kataloge: Kataloge): { konfiguration: Konfiguration; hinweise: Hinweis[] } {
  const q = new URLSearchParams(search);
  const start = voreinstellung(kataloge);
  const zahl = (name: string): number | undefined => leseZahl(q.get(name));

  const geraet = leseGeraet(q, start.geraet, kataloge);
  const objekt = objektzustand(kataloge.objekte, kataloge.nachweise, q.get(P.zustand) ?? "") ?? start.objekt;
  const s = start.bedingungen;
  const roh: Konfiguration = {
    geraet,
    objekt,
    bedingungen: {
      seeingFwhmArcsec: zahl(P.seeing) ?? s.seeingFwhmArcsec,
      bortle: zahl(P.bortle) ?? s.bortle,
      transparenz: leseWahl(q.get(P.transparenz), TRANSPARENZEN) ?? s.transparenz,
      hoeheGrad: zahl(P.hoehe) ?? s.hoeheGrad
    }
  };
  return begrenze(roh);
}

// ---------------------------------------------------------------------------------------------
// Geraet schreiben

function schreibeGeraet(q: URLSearchParams, geraet: Geraet, kataloge: Kataloge): void {
  const ohne = ohneOkular(geraet);
  const eintrag = kataloge.geraete.find((e) => gleicheWerte(e.geraet, ohne));
  if (eintrag !== undefined) {
    q.set(P.geraet, eintrag.id);
  } else {
    schreibeFreiesGeraet(q, geraet);
  }
  if ("okular" in geraet) {
    q.set(P.okularBrennweite, String(geraet.okular.brennweiteMm));
    q.set(P.scheinbaresGesichtsfeld, String(geraet.okular.scheinbaresGesichtsfeldGrad));
  }
}

function schreibeFreiesGeraet(q: URLSearchParams, geraet: Geraet): void {
  q.set(P.art, geraet.art);
  switch (geraet.art) {
    case "fernrohr":
      q.set(P.bauart, geraet.bauart);
      q.set(P.oeffnung, String(geraet.oeffnungMm));
      q.set(P.brennweite, String(geraet.brennweiteMm));
      q.set(P.obstruktion, String(geraet.obstruktion));
      break;
    case "fernglas":
      q.set(P.oeffnung, String(geraet.oeffnungMm));
      q.set(P.vergroesserung, String(geraet.vergroesserung));
      q.set(P.wahresGesichtsfeld, String(geraet.wahresGesichtsfeldGrad));
      break;
    case "auge":
      break;
  }
}

/** Das Geraet ohne Okular, so wie es in der Geraeteliste steht. */
function ohneOkular(geraet: Geraet): Listengeraet {
  if ("okular" in geraet) {
    const { okular: _okular, ...rest } = geraet;
    return rest;
  }
  return geraet;
}

/** Gleiche Feldnamen und gleiche Werte (alle Felder eines Listengeraets sind Zahlen oder Texte). */
function gleicheWerte(a: Listengeraet, b: Listengeraet): boolean {
  const ka = Object.keys(a) as (keyof Listengeraet)[];
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => k in b && a[k] === b[k]);
}

// ---------------------------------------------------------------------------------------------
// Geraet lesen

/**
 * Reihenfolge: bekannte Listen-id in g, sonst freies Geraet nach a, sonst das Geraet der
 * Voreinstellung. Das Okular gilt nur fuer Fernrohre und faellt je Feld zurueck.
 */
function leseGeraet(q: URLSearchParams, start: Geraet, kataloge: Kataloge): Geraet {
  const okular = leseOkular(q);
  const eintrag = kataloge.geraete.find((e) => e.id === q.get(P.geraet));
  if (eintrag !== undefined) return mitOkular(eintrag.geraet, okular);
  switch (q.get(P.art)) {
    case "fernrohr":
      return leseFernrohr(q, start, okular);
    case "fernglas":
      return leseFernglas(q, start, kataloge);
    case "auge":
      return { art: "auge" };
    default:
      return mitOkular(ohneOkular(start), okular);
  }
}

/** Okular aus ok und sg, je Feld mit dem Okular der Voreinstellung als Rueckfall. */
function leseOkular(q: URLSearchParams): Okular {
  const basis = VOREINSTELLUNG.okular;
  return {
    brennweiteMm: leseZahl(q.get(P.okularBrennweite)) ?? basis.brennweiteMm,
    scheinbaresGesichtsfeldGrad: leseZahl(q.get(P.scheinbaresGesichtsfeld)) ?? basis.scheinbaresGesichtsfeldGrad
  };
}

/**
 * Freies Fernrohr: fehlende Zahlen aus dem Startgeraet (ein Fernrohr nach A-D9), fehlende
 * Bauart wie dort; fehlende Obstruktion als Vorschlagswert der Bauart (A-F1). Waere das
 * Startgeraet kein Fernrohr, bliebe NaN, und begrenze() setzt die Untergrenze.
 */
function leseFernrohr(q: URLSearchParams, start: Geraet, okular: Okular): Fernrohr {
  const basis = start.art === "fernrohr" ? start : undefined;
  const bauart: Bauart = leseWahl(q.get(P.bauart), BAUARTEN) ?? basis?.bauart ?? "refraktor";
  const oeffnungMm = leseZahl(q.get(P.oeffnung)) ?? basis?.oeffnungMm ?? NaN;
  const brennweiteMm = leseZahl(q.get(P.brennweite)) ?? basis?.brennweiteMm ?? NaN;
  const obstruktion = leseZahl(q.get(P.obstruktion)) ?? vorschlagObstruktionProzent(bauart, oeffnungMm, brennweiteMm) / 100;
  return { art: "fernrohr", oeffnungMm, brennweiteMm, obstruktion, bauart, okular };
}

/**
 * Freies Fernglas: die Voreinstellung hat keins, deshalb fallen fehlende Zahlen auf das erste
 * Fernglas der Geraeteliste zurueck; gibt es keins, auf das Geraet der Voreinstellung.
 */
function leseFernglas(q: URLSearchParams, start: Geraet, kataloge: Kataloge): Geraet {
  const basis = kataloge.geraete.map((e) => e.geraet).find((g): g is Fernglas => g.art === "fernglas");
  const oeffnungMm = leseZahl(q.get(P.oeffnung)) ?? basis?.oeffnungMm;
  const vergroesserung = leseZahl(q.get(P.vergroesserung)) ?? basis?.vergroesserung;
  const wahresGesichtsfeldGrad = leseZahl(q.get(P.wahresGesichtsfeld)) ?? basis?.wahresGesichtsfeldGrad;
  if (oeffnungMm === undefined || vergroesserung === undefined || wahresGesichtsfeldGrad === undefined) return start;
  return { art: "fernglas", oeffnungMm, vergroesserung, wahresGesichtsfeldGrad };
}

// ---------------------------------------------------------------------------------------------
// Werte lesen

/**
 * Zahl oder undefined (fehlt, leer, unlesbar). Plus und minus Unendlich (z. B. 1e400) gehen
 * weiter an begrenze(), das sie auf die Grenze schneidet und meldet; nur NaN wird verworfen.
 */
function leseZahl(text: string | null): number | undefined {
  if (text === null || text.trim() === "") return undefined;
  const wert = Number(text);
  return Number.isNaN(wert) ? undefined : wert;
}

/** Ein Wert aus einer festen Auswahl oder undefined. */
function leseWahl<T extends string>(text: string | null, wahl: readonly T[]): T | undefined {
  return wahl.find((w) => w === text);
}
