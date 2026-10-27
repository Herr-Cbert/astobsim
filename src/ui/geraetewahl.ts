// Reine Logik des Formulars Geraet und Okular (#17), ohne DOM, damit Vitest sie in Node prueft:
// Gruppen der Auswahlliste (A-F2), welcher Eintrag zu einer Konfiguration gehoert, freie Eingabe
// eines Fernrohrs mit Obstruktions-Vorschlag (A-F1) und die Vergroesserung als Eingabe (A-F7).
// Bereiche schneidet weiterhin nur begrenze() in physik; hier wird nur umgerechnet.

import { type Geraeteeintrag, type Listengeraet, mitOkular, vorschlagObstruktionProzent } from "../daten";
import type { Bauart, Fernrohr, Geraet, Hinweis, Okular } from "../physik";
import { aufSchritt, GRENZEN } from "../physik";

/** Wert des Eintrags "Frei eingeben" in der Auswahlliste; keine Geraete-id (die sind a-z, 0-9, -). */
export const FREI = "frei";

/** Eigener Feldpfad des Vergroesserungsfelds; begrenze kennt ihn nicht, das Formular rechnet um. */
export const VERGROESSERUNG_FELD = "geraet.okular.vergroesserung";

/** Gruppen der Auswahlliste in fester Reihenfolge: Auge, Fernglaeser, Fernrohre (A-F2). */
export const GRUPPEN = ["auge", "fernglas", "fernrohr"] as const satisfies readonly Geraet["art"][];
export type Gruppe = (typeof GRUPPEN)[number];

/** Eintraege je Gruppe in der Reihenfolge der Datei; leere Gruppen fallen weg. */
export function geraetegruppen(eintraege: readonly Geraeteeintrag[]): { gruppe: Gruppe; eintraege: Geraeteeintrag[] }[] {
  return GRUPPEN.map((gruppe) => ({ gruppe, eintraege: eintraege.filter((e) => e.geraet.art === gruppe) })).filter((g) => g.eintraege.length > 0);
}

// ohneOkular und gleicheWerte sind Kopien aus src/zustand/url.ts (dort nicht exportiert); beide
// muessen gleich bleiben, sonst zeigt die Liste einen anderen Eintrag als die URL. Folge-Issue: Export aus zustand.

/** Das Geraet ohne Okular, so wie es in der Geraeteliste steht. */
function ohneOkular(geraet: Geraet): Listengeraet {
  if ("okular" in geraet) {
    const { okular: _okular, ...rest } = geraet;
    return rest;
  }
  return geraet;
}

/** Gleiche Feldnamen und gleiche Werte, wie zustand ein Listengeraet in der URL erkennt. */
function gleicheWerte(a: Listengeraet, b: Listengeraet): boolean {
  const ka = Object.keys(a) as (keyof Listengeraet)[];
  return ka.length === Object.keys(b).length && ka.every((k) => k in b && a[k] === b[k]);
}

/** id des Listeneintrags mit genau diesem Geraet (Okular egal), sonst FREI. */
export function eintragZu(eintraege: readonly Geraeteeintrag[], geraet: Geraet): string {
  const ohne = ohneOkular(geraet);
  return eintraege.find((e) => gleicheWerte(e.geraet, ohne))?.id ?? FREI;
}

/**
 * Auswahl nach einer Aenderung der Konfiguration: Wer "Frei eingeben" gewaehlt hat, bleibt dort,
 * solange das Geraet ein Fernrohr ist, auch wenn die Werte zufaellig einem Listeneintrag gleichen.
 * Sonst zeigt die Liste den passenden Eintrag oder FREI.
 */
export function auswahlNach(alt: string, eintraege: readonly Geraeteeintrag[], geraet: Geraet): string {
  if (alt === FREI && geraet.art === "fernrohr") return FREI;
  return eintragZu(eintraege, geraet);
}

/** Geraet zum gewaehlten Listeneintrag; das Okular gilt nur fuer Fernrohre. undefined bei unbekannter id. */
export function geraetZuEintrag(eintraege: readonly Geraeteeintrag[], id: string, okular: Okular): Geraet | undefined {
  const eintrag = eintraege.find((e) => e.id === id);
  return eintrag === undefined ? undefined : mitOkular(eintrag.geraet, okular);
}

/**
 * Startwert der freien Eingabe: das aktuelle Fernrohr unveraendert, sonst (Auge, Fernglas) das
 * Fernrohr ersatz mit dem gemerkten Okular.
 */
export function freiesFernrohr(aktuell: Geraet, ersatz: Fernrohr, okular: Okular): Fernrohr {
  if (aktuell.art === "fernrohr") return aktuell;
  return { ...ersatz, okular: { ...okular } };
}

/** Neue Bauart mit dem Vorschlagswert der Obstruktion (A-F1, Tabelle aus #11); bleibt danach editierbar. */
export function mitBauart(fernrohr: Fernrohr, bauart: Bauart): Fernrohr {
  return { ...fernrohr, bauart, obstruktion: vorschlagObstruktionProzent(bauart, fernrohr.oeffnungMm, fernrohr.brennweiteMm) / 100 };
}

/**
 * Okularbrennweite zur gewuenschten Vergroesserung (A-F7): f = F / V, gerundet auf 0,01 mm, damit
 * die URL kurz bleibt (ok=16.22 statt 16.216216216216218). Eine Vergroesserung bis 0 ergibt Unendlich; begrenze schneidet das auf die laengste Okularbrennweite (kleinste Vergroesserung).
 */
export function okularBrennweiteFuer(brennweiteMm: number, vergroesserung: number): number {
  return vergroesserung > 0 ? Math.round((brennweiteMm / vergroesserung) * 100) / 100 : Number.POSITIVE_INFINITY;
}

/**
 * Hinweis von begrenze zur Okularbrennweite als Hinweis des Vergroesserungsfelds: eingabe ist die
 * eingegebene Vergroesserung, wert die Vergroesserung zur geschnittenen Okularbrennweite.
 */
export function vergroesserungsHinweis(hinweise: readonly Hinweis[], brennweiteMm: number, vergroesserung: number): Hinweis[] {
  const h = hinweise.find((x) => x.feld === GRENZEN.okularBrennweiteMm.feld);
  return h === undefined ? [] : [{ feld: VERGROESSERUNG_FELD, eingabe: vergroesserung, wert: brennweiteMm / h.wert }];
}

/**
 * Obstruktion eines Fernrohrs in Prozent, wie das Feld sie zeigt (A-F1): das Verhaeltnis aus der
 * begrenzten Konfiguration mal 100, ohne Gleitkommareste auf 0,1 Prozent; ohne Fernrohr undefined.
 */
export function obstruktionProzent(fernrohr: Fernrohr | undefined): number | undefined {
  return fernrohr === undefined ? undefined : aufSchritt(fernrohr.obstruktion * 100, GRENZEN.obstruktion.schritt * 100);
}

/** Hinweise mit einem Feld in anderem Mass (z. B. Obstruktion als Verhaeltnis -> Prozent). */
export function skaliereHinweise(hinweise: readonly Hinweis[], feld: string, faktor: number): Hinweis[] {
  return hinweise.map((h) => (h.feld === feld ? { ...h, eingabe: h.eingabe * faktor, wert: h.wert * faktor } : h));
}
