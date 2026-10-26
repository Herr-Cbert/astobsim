// Hilfen zum Laden und Pruefen roher JSON-Daten, gemeinsam fuer objekte.json, bilder.json
// (#8) und geraete.json (#11). Jede Pruefung wirft DatenFehler mit Datei, Eintrag und Feld.
// Laden und Pruefen sind getrennt: Vitest prueft die echten Dateien ueber die reinen
// pruefe...-Funktionen, im Browser holt ladeJson die Datei per fetch.

import { DatenFehler } from "./fehler";

/** Ort eines Eintrags fuer Fehlermeldungen: Dateiname und Eintrag (id oder Index). */
export interface Ort {
  datei: string;
  eintrag: string;
}

/** Laedt daten/<datei> relativ zu BASE_URL (Dev "/", Build "/astobsim/") und parst das JSON. */
export async function ladeJson(datei: string): Promise<unknown> {
  const url = import.meta.env.BASE_URL + "daten/" + datei;
  let antwort: Response;
  try {
    antwort = await fetch(url);
  } catch (e) {
    throw new DatenFehler(datei, "-", "-", `nicht erreichbar (${String(e)})`);
  }
  if (!antwort.ok) throw new DatenFehler(datei, "-", "-", `HTTP ${antwort.status}`);
  try {
    return await antwort.json();
  } catch (e) {
    throw new DatenFehler(datei, "-", "-", `kein gueltiges JSON (${String(e)})`);
  }
}

/** wert als JSON-Objekt (nicht null, keine Liste). */
export function alsObjekt(wert: unknown, ort: Ort, feld: string): Record<string, unknown> {
  if (typeof wert !== "object" || wert === null || Array.isArray(wert)) {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, "Objekt erwartet");
  }
  return wert as Record<string, unknown>;
}

/** wert als Liste. */
export function alsListe(wert: unknown, ort: Ort, feld: string): unknown[] {
  if (!Array.isArray(wert)) throw new DatenFehler(ort.datei, ort.eintrag, feld, "Liste erwartet");
  return wert;
}

/** Pflichtfeld als nicht leerer Text. */
export function text(obj: Record<string, unknown>, feld: string, ort: Ort): string {
  const wert = obj[feld];
  if (typeof wert !== "string" || wert.trim() === "") {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, "nicht leerer Text erwartet");
  }
  return wert;
}

/** Pflichtfeld als endliche Zahl in [min, max]. */
export function zahl(obj: Record<string, unknown>, feld: string, ort: Ort, min = -Infinity, max = Infinity): number {
  const wert = obj[feld];
  if (typeof wert !== "number" || !Number.isFinite(wert)) {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, "endliche Zahl erwartet");
  }
  if (wert < min || wert > max) {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, `${wert} liegt nicht in ${min} bis ${max}`);
  }
  return wert;
}

/** Pflichtfeld als einer der erlaubten Texte. */
export function wahl<T extends string>(obj: Record<string, unknown>, feld: string, ort: Ort, erlaubt: readonly T[]): T {
  const wert = obj[feld];
  if (typeof wert !== "string" || !(erlaubt as readonly string[]).includes(wert)) {
    throw new DatenFehler(ort.datei, ort.eintrag, feld, `einer von ${erlaubt.join(", ")} erwartet`);
  }
  return wert as T;
}

/** Feld, das fehlen oder null sein darf; sonst wie pruefer. */
export function optional<T>(obj: Record<string, unknown>, feld: string, pruefer: (obj: Record<string, unknown>, feld: string) => T): T | undefined {
  return obj[feld] === undefined || obj[feld] === null ? undefined : pruefer(obj, feld);
}

/** Pflichtfeld als ganze Zahl in [min, max] (Pixelmasse, Anzahlen). */
export function ganzzahl(obj: Record<string, unknown>, feld: string, ort: Ort, min = -Infinity, max = Infinity): number {
  const wert = zahl(obj, feld, ort, min, max);
  if (!Number.isInteger(wert)) throw new DatenFehler(ort.datei, ort.eintrag, feld, `ganze Zahl erwartet, nicht ${wert}`);
  return wert;
}

/** Pflichtfeld als Wahrheitswert (true oder false). */
export function wahrheitswert(obj: Record<string, unknown>, feld: string, ort: Ort): boolean {
  const wert = obj[feld];
  if (typeof wert !== "boolean") throw new DatenFehler(ort.datei, ort.eintrag, feld, "true oder false erwartet");
  return wert;
}
