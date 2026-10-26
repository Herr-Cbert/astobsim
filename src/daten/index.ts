// Einstieg des Moduls daten, beschraenkt auf das Interface aus docs/architektur.md Abschnitt 1:
// ladeBildnachweise(), ladeObjekte(nachweise) und die Quelle aus der Kachelpyramide. Die
// Geraeteliste (ladeGeraete) kommt mit #11. Interne Pruefhilfen importieren Tests aus pruefe.ts,
// den Test-Adapter QuelleRaster aus testkacheln.ts.
export { BILDER_DATEI, ladeBildnachweise, pruefeBildnachweise, type Bildnachweis, type Kachelpyramide, type Kachelstufe } from "./bildnachweise";
export { DatenFehler } from "./fehler";
export { kachelLaderBrowser, quelleKachelnBrowser } from "./kachellader";
export { pyramidengeometrie, QuelleKacheln, type Kacheladresse, type KachelLader, type Pyramidengeometrie } from "./kacheln";
export { ladeObjekte, OBJEKTE_DATEI, pruefeObjekte, pruefeVerweise, type Objekt, type TrabantEintrag, type ZustandEintrag } from "./objekte";
