// Einstieg des Moduls daten, beschraenkt auf das Interface aus docs/architektur.md Abschnitt 1:
// ladeBildnachweise(), ladeObjekte(nachweise), objektzustand fuer die Naht und die Quellen aus der Kachelpyramide
// (QuelleKacheln) und aus einem Einzelbild (QuelleEinzelbild, Planeten), dazu die Geraeteliste
// (geraete.ts). Interne Pruefhilfen importieren Tests aus pruefe.ts,
// den Test-Adapter QuelleRaster aus testkacheln.ts.
export { ladeBildnachweise, pruefeBildnachweise, type Bildnachweis, type Kachelpyramide, type Kachelstufe } from "./bildnachweise";
export { DatenFehler } from "./fehler";
export { quelleEinzelbildBrowser, quelleKachelnBrowser } from "./kachellader";
export { QuelleKacheln } from "./kacheln";
export { ladeObjekte, OBJEKTE_DATEI, pruefeObjekte, pruefeVerweise, type Objekt, type ZustandEintrag } from "./objekte";
export { findeZustand, nachweisZu, objektzustand } from "./objektzustand";
export { QuelleEinzelbild } from "./quelle_einzelbild";
export * from "./geraete";
