// Einstieg des Moduls physik (docs/architektur.md Abschnitt 3). Stufe 0: Einzelformeln,
// jede einzeln getestet gegen docs/recherche/physik.md Abschnitt 8 (A-Q1). Stufe 1:
// Konfiguration zu Zwischengroessen (optik, atmosphaere, aufloesung, helligkeit,
// arbeitsmassstab, kernbeschreibung) und begrenze. Die Stufen 2 und 3 (baueKern, auswerten)
// kommen mit den Issues #4 und #5 dazu.

export * from "./konfiguration";
export {
  ARCSEC_PRO_RAD,
  AUGE_AUFLOESUNG_ARCSEC,
  AUGE_GESICHTSFELD_GRAD,
  BETA_MOFFAT,
  BORTLE_MAG_PRO_ARCSEC2,
  EXTINKTION_MAG_PRO_LUFTMASSE,
  PUPILLE_MM,
  SEEING_STUFEN,
  SEEING_WORTSTUFEN,
  type Seeingwortstufe,
  TRANSMISSION,
  WELLENLAENGE_M
} from "./konstanten";
export { PhysikFehler } from "./fehler";
export { besselJ1 } from "./bessel";
export {
  airyAmplitude,
  airyFwhmArcsec,
  airyRadiusArcsec,
  dawesArcsec,
  energieImAiryKern,
  lambdaDurchDArcsec,
  mtfPupille,
  rayleighArcsec
} from "./beugung";
export {
  type Atmosphaere,
  type Seeingstufe,
  atmosphaere,
  extinktionFaktor,
  extinktionMag,
  friedParameterCm,
  luftmasse,
  seeingAmObjektArcsec,
  seeingstufe
} from "./atmosphaere";
export { type Optik, austrittspupilleMm, flaechenhelligkeitsfaktor, optik, vergroesserungsgrenzen } from "./optik";
export { airyProfil, gaussProfil, moffatProfil, quadratur } from "./profile";
export { type Aufloesung, type Aufloesungsgrenze, aufloesung } from "./aufloesung";
export { bortleMagProArcsec2, helligkeit } from "./helligkeit";
export { arbeitsmassstab, kernSchluessel, kernbeschreibung } from "./arbeitsmassstab";
export { rundeSignifikant, schluessel } from "./schluessel";
export { GRENZEN, type Grenze, type Hinweis, begrenze } from "./begrenze";
