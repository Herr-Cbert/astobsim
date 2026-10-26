// Kataloge: die geladenen und geprueften Listen aus daten (geraete.json, objekte.json,
// bilder.json). Die Konfiguration traegt das volle Geraet und den vollen Objektzustand; um sie
// aus der URL (nur ids und Zahlen) wiederherzustellen, brauchen die reinen Funktionen in zustand
// diese Listen als Parameter (Abweichung von den Signaturen in Issue #16, siehe LIESMICH.md).

import type { Bildnachweis, Geraeteeintrag, Objekt } from "../daten";

export interface Kataloge {
  geraete: readonly Geraeteeintrag[];
  objekte: readonly Objekt[];
  nachweise: readonly Bildnachweis[];
}
