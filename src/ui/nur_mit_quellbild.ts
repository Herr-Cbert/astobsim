// Vorlaeufiger Filter bis zum UI-Durchstich #109 (Entscheidung Herbert 2026-10-29, Welle 2 Version 2):
// Zustaende ohne Quellbild (M45, Doppelsterne) kann die ui noch nicht zeigen (quelleVon wirft,
// architektur.md 5.5), deshalb erscheinen Objekte ohne solche Zustaende nicht in der Auswahl.
// #109 entfernt diese Datei und ihren Aufruf in starte.ts.

import type { Objekt } from "../daten";

/** Objekte mit ihren Zustaenden, die ein Quellbild haben; Objekte ohne einen solchen Zustand fallen weg. */
export function nurMitQuellbild(objekte: readonly Objekt[]): Objekt[] {
  return objekte
    .map((o) => ({ ...o, zustaende: o.zustaende.filter((z) => z.bild !== undefined) }))
    .filter((o) => o.zustaende.length > 0);
}
