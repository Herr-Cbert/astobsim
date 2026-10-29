// Einstieg des Moduls physik (docs/architektur.md Abschnitt 3). Stufe 0: Einzelformeln,
// jede einzeln getestet gegen docs/recherche/physik.md Abschnitt 8 (A-Q1). Stufe 1:
// Konfiguration zu Zwischengroessen (optik, atmosphaere, aufloesung, helligkeit, punktquellen,
// arbeitsmassstab, kernbeschreibung) und begrenze. Stufe 2: baueKern mit den Testhelfern
// kontrastUebertragung und kernFwhmArcsec (Issue #4) sowie profilDelle (Issue #21). Stufe 3:
// auswerten mit Anzeigewerten, Warnungen und Wiederverwendung des Kerns (Issue #5). ui und zustand
// importieren nur von hier; bild importiert physik nicht (docs/architektur.md Abschnitt 4).

export * from "../naht/konfiguration";
export { PhysikFehler, quelleVon } from "./fehler";
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
export { type Optik, austrittspupilleMm, flaechenhelligkeitsfaktor, okularBrennweiteFuer, optik, vergroesserungsgrenzen } from "./optik";
export { airyProfil, gaussProfil, moffatProfil, quadratur } from "./profile";
export { type Aufloesung, type Aufloesungsgrenze, aufloesung } from "./aufloesung";
export { anzeigefaktor, bortleMagProArcsec2, helligkeit, leuchtdichteRelativ, type Okularhelligkeit, okularhelligkeit } from "./helligkeit";
export { arbeitsmassstab, arbeitsmassstabOhneFenster, kernSchluessel, kernbeschreibung } from "./arbeitsmassstab";
export { geblendet, helligkeitRelativ, punktquellen, scheibenFlaechenhelligkeit } from "./punktquellen";
export { GRENZEN, type Grenze, type Hinweis, aufSchritt, begrenze } from "./begrenze";
export { baueKern, kernFwhmArcsec, kontrastUebertragung, type Profilstufe, profilDelle } from "./kern";
export { type Anzeigewerte, type Auswertoptionen, type Auswertung, type Warnung, auswerten } from "./auswerten";
export { freiesPaar, gesamthelligkeit, KENNUNG_FREIES_PAAR, UEBERSTRAHLUNG_ABSTAND_ARCSEC, UEBERSTRAHLUNG_DELTA_MAG, ueberstrahlung } from "./doppelstern";
