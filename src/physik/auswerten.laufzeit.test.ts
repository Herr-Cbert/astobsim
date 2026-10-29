import { describe, expect, it } from "vitest";
import type { Konfiguration } from "../naht/konfiguration";
import { auswerten } from "./auswerten";
import { DEEP_SKY_RING, KONFIGURATION_A_D9 } from "./testdaten";

// Laufzeit von auswerten ohne Kernbau (Issue #5: unter 0,1 ms je Aufruf, A-D7). Eigene Datei,
// damit kein Fehlerfall-Test mit ungueltigen Werten vorher die Objektformen in V8 verschlechtert.
// Ausgabe mit npm test -- --silent=false sichtbar. Harte Grenze 0,1 ms wie im Kriterium.

/** Reglerzug ueber Bortle 1 bis 9 mit vorher, Mittel in ms je Aufruf; der Kern bleibt derselbe. */
function reglerzug(basis: Konfiguration, name: string): number {
  const erste = auswerten(basis);
  const konfigurationen: Konfiguration[] = [];
  for (let i = 0; i < 9; i++) konfigurationen.push({ ...basis, bedingungen: { ...basis.bedingungen, bortle: i + 1 } });
  for (let i = 0; i < 2000; i++) auswerten(konfigurationen[i % 9]!, { vorher: erste.parameter });
  const wiederholungen = 20000;
  const start = performance.now();
  let letzte = erste;
  for (let i = 0; i < wiederholungen; i++) letzte = auswerten(konfigurationen[i % 9]!, { vorher: erste.parameter });
  const ms = (performance.now() - start) / wiederholungen;
  console.log(`auswerten ohne Kernbau, ${name}: ${(ms * 1000).toFixed(2)} us je Aufruf (Mittel ueber ${wiederholungen}, Ziel unter 100 us)`);
  expect(letzte.parameter.kern).toBe(erste.parameter.kern);
  return ms;
}

describe("Laufzeit auswerten (Protokoll)", () => {
  it("Deep-Sky mit Flaechentabelle (11 Zeilen) und zwei Sternen: sichtbareIsophote, Grenzgroesse und Sockel je Aufruf, unter 0,1 ms", () => {
    expect(reglerzug({ ...KONFIGURATION_A_D9, objekt: DEEP_SKY_RING }, "Deep-Sky")).toBeLessThan(0.1);
  });
  it("Bortle-Reglerzug mit vorher: kein Kernbau, im Mittel unter 0,1 ms je Aufruf", () => {
    const erste = auswerten(KONFIGURATION_A_D9);
    // Reglerzug ueber Bortle 1 bis 9: jede Konfiguration frisch, der Kern bleibt derselbe.
    const konfigurationen: Konfiguration[] = [];
    for (let i = 0; i < 9; i++) {
      konfigurationen.push({ ...KONFIGURATION_A_D9, bedingungen: { ...KONFIGURATION_A_D9.bedingungen, bortle: i + 1 } });
    }
    // Aufwaermen, damit der JIT optimiert hat.
    for (let i = 0; i < 2000; i++) auswerten(konfigurationen[i % 9]!, { vorher: erste.parameter });

    const wiederholungen = 20000;
    const start = performance.now();
    let letzte = erste;
    for (let i = 0; i < wiederholungen; i++) letzte = auswerten(konfigurationen[i % 9]!, { vorher: erste.parameter });
    const ms = (performance.now() - start) / wiederholungen;
    console.log(`auswerten ohne Kernbau: ${(ms * 1000).toFixed(2)} us je Aufruf (Mittel ueber ${wiederholungen}, Ziel unter 100 us)`);

    expect(letzte.parameter.kern).toBe(erste.parameter.kern);
    expect(ms).toBeLessThan(0.1);
  });
});
