// Einstieg des Moduls physik (docs/architektur.md Abschnitt 3). Stufe 0: Einzelformeln,
// jede einzeln getestet gegen docs/recherche/physik.md Abschnitt 8 (A-Q1). Stufe 1:
// Konfiguration zu Zwischengroessen (optik, atmosphaere, aufloesung, helligkeit,
// arbeitsmassstab, kernbeschreibung) und begrenze. Stufe 2: baueKern mit den Testhelfern
// kontrastUebertragung und kernFwhmArcsec (Issue #4). Stufe 3: auswerten mit Anzeigewerten,
// Warnungen und Wiederverwendung des Kerns (Issue #5). ui und bild importieren nur von hier.

export * from "../naht/konfiguration";
export {
  ANZEIGE_PX_STANDARD,
  ARCSEC_PRO_RAD,
  AUGE_AUFLOESUNG_ARCSEC,
  AUGE_GESICHTSFELD_GRAD,
  AUSTRITTSPUPILLE_MIN_MM,
  BETA_MOFFAT,
  BORTLE_MAG_PRO_ARCSEC2,
  EXTINKTION_MAG_PRO_LUFTMASSE,
  KERN_GROESSE_MAX,
  KERN_RADIUS_MIN,
  KERN_RADIUS_PRO_FWHM,
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
export { anzeigefaktor, bortleMagProArcsec2, helligkeit, type Okularhelligkeit, okularhelligkeit } from "./helligkeit";
export { arbeitsmassstab, kernSchluessel, kernbeschreibung } from "./arbeitsmassstab";
export { GRENZEN, type Grenze, type Hinweis, aufSchritt, begrenze } from "./begrenze";
export { baueKern, kernFwhmArcsec, kontrastUebertragung } from "./kern";
export { type Anzeigewerte, type Auswertoptionen, type Auswertung, type Warnung, auswerten } from "./auswerten";
