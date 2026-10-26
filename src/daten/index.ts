// Einstieg des Moduls daten, beschraenkt auf das Interface aus docs/architektur.md Abschnitt 1:
// ladeBildnachweise(), ladeObjekte(nachweise), objektzustand fuer die Naht und die Quellen aus der Kachelpyramide
// (QuelleKacheln) und aus einem Einzelbild (QuelleEinzelbild, Planeten). Die
// Geraeteliste (ladeGeraete) kommt mit #11. Interne Pruefhilfen importieren Tests aus pruefe.ts,
// den Test-Adapter QuelleRaster aus testkacheln.ts.
export {
  BILDER_DATEI,
  bildBytes,
  ladeBildnachweise,
  pruefeBildnachweise,
  type Bildnachweis,
  type Kachelpyramide,
  type Kachelstufe
} from "./bildnachweise";
export { DatenFehler } from "./fehler";
export { kachelLaderBrowser, quelleEinzelbildBrowser, quelleKachelnBrowser } from "./kachellader";
export { pyramidengeometrie, QuelleKacheln, type Kacheladresse, type KachelLader, type Pyramidengeometrie } from "./kacheln";
export { ladeObjekte, OBJEKTE_DATEI, pruefeObjekte, pruefeVerweise, type Objekt, type ZustandEintrag } from "./objekte";
export { findeZustand, objektzustand } from "./objektzustand";
export { einzelbildMassstab, quelleEinzelbild, QuelleEinzelbild } from "./quelle_einzelbild";
export * from "./geraete";
