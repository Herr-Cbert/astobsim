// Einstieg des Moduls bild, beschraenkt auf das Interface aus docs/architektur.md Abschnitt 1.
// Interne Schritte (mittele, skaliere, tonwert, maskiere) importieren Tests aus ihren Dateien.
export { BildFehler } from "./fehler";
export { FalterJs, type Falter } from "./falter";
export {
  ANZEIGEGRENZE_OHNE_WEBGL2_PX,
  waehleFalter,
  type FalterArt,
  type FalterGrund,
  type FalterWahlOptionen,
  type Falterwahl
} from "./falter_webgl2";
export { QuelleAusRaster, type Objektpunkt, type Quellausschnitt, type Quelle } from "./quelle";
export { neuesRaster, type Kanaele, type Raster } from "./raster";
export { rendere, type Anblick, type Zwischenspeicher } from "./rendere";
