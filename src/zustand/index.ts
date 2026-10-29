// Einstieg des Moduls zustand (docs/architektur.md Abschnitt 1): Startkonfiguration A-D9 und
// Konfiguration in die URL und zurueck. Reine Funktionen, kein DOM; history.replaceState ruft
// erst die UI auf. Parameternamen in LIESMICH.md.
export type { Kataloge } from "./kataloge";
export { ausUrl, inUrl, listeneintragZu, PARAMETER } from "./url";
export { PAAR_VORGABE, VOREINSTELLUNG, voreinstellung } from "./voreinstellung";
