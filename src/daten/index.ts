// Einstieg des Moduls daten, beschraenkt auf das Interface aus docs/architektur.md Abschnitt 1:
// ladeBildnachweise(), ladeObjekte(nachweise), objektzustand fuer die Naht und die Quellen aus der Kachelpyramide
// (QuelleKacheln) und aus einem Einzelbild (QuelleEinzelbild, Planeten und Deep-Sky), QuelleLeer fuer
// Zustaende ohne Bild, die log-Kennlinie der Deep-Sky-Bilder (kennlinie.ts), dazu die Geraeteliste
// (geraete.ts). Interne Pruefhilfen importieren Tests aus pruefe.ts,
// den Test-Adapter QuelleRaster aus testkacheln.ts.
export { ladeBildnachweise, pruefeBildnachweise, type Bildnachweis, type Kachelpyramide, type Kachelstufe } from "./bildnachweise";
export { DatenFehler } from "./fehler";
export { quelleBegleiterBrowser, quelleEinzelbildBrowser, quelleKachelnBrowser } from "./kachellader";
export { QuelleKacheln } from "./kacheln";
export { type Kennlinie, kodetabelle, logTabelle } from "./kennlinie";
export {
  ladeObjekte,
  ladeSterne,
  OBJEKTE_DATEI,
  pruefeObjekte,
  pruefeSternliste,
  pruefeVerweise,
  type Objekt,
  type Paarnachweis,
  type BegleiterEintrag,
  type Profil,
  type SternEintrag,
  type ZustandEintrag
} from "./objekte";
export { begleiterMassstab, begleiterNachweise, findeZustand, nachweisZu, objektzustand } from "./objektzustand";
export { quelleBegleiter, QuelleVersetzt } from "./quelle_begleiter";
export { QuelleEinzelbild } from "./quelle_einzelbild";
export { QuelleLeer } from "./quelle_leer";
export * from "./geraete";
