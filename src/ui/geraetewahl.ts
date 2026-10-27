// Reine Logik des Formulars Geraet und Okular (#17), ohne DOM, damit Vitest sie in Node prueft:
// Gruppen der Auswahlliste (A-F2), welcher Eintrag zu einer Konfiguration gehoert, freie Eingabe
// eines Fernrohrs mit Obstruktions-Vorschlag (A-F1) und Hinweise zur Vergroesserung als Eingabe
// (A-F7). Bereiche schneidet weiterhin nur begrenze() in physik; die Umrechnung V -> Okular steht in
// physik (okularBrennweiteFuer), der Vergleich mit der Geraeteliste in zustand (listeneintragZu).

import { type Geraeteeintrag, mitOkular, vorschlagObstruktionProzent } from "../daten";
import type { Bauart, Fernrohr, Geraet, Hinweis, Okular } from "../physik";
import { aufSchritt, GRENZEN } from "../physik";
import { listeneintragZu } from "../zustand";

/** Wert des Eintrags "Frei eingeben" in der Auswahlliste; keine Geraete-id (die sind a-z, 0-9, -). */
export const FREI = "frei";

/** Eigener Feldpfad des Vergroesserungsfelds; begrenze kennt ihn nicht, das Formular rechnet um. */
export const VERGROESSERUNG_FELD = "geraet.okular.vergroesserung";

/** Gruppen der Auswahlliste in fester Reihenfolge: Auge, Fernglaeser, Fernrohre (A-F2). */
const GRUPPEN = ["auge", "fernglas", "fernrohr"] as const satisfies readonly Geraet["art"][];
export type Gruppe = (typeof GRUPPEN)[number];

/** Eintraege je Gruppe in der Reihenfolge der Datei; leere Gruppen fallen weg. */
export function geraetegruppen(eintraege: readonly Geraeteeintrag[]): { gruppe: Gruppe; eintraege: Geraeteeintrag[] }[] {
  return GRUPPEN.map((gruppe) => ({ gruppe, eintraege: eintraege.filter((e) => e.geraet.art === gruppe) })).filter((g) => g.eintraege.length > 0);
}

/** id des Listeneintrags mit genau diesem Geraet (Okular egal), sonst FREI. */
export function eintragZu(eintraege: readonly Geraeteeintrag[], geraet: Geraet): string {
  return listeneintragZu(eintraege, geraet)?.id ?? FREI;
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
