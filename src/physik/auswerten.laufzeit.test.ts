import { describe, expect, it } from "vitest";
import type { Konfiguration } from "../naht/konfiguration";
import { auswerten } from "./auswerten";
import { KONFIGURATION_A_D9 } from "./testdaten";

// Laufzeit von auswerten ohne Kernbau (Issue #5: unter 0,1 ms je Aufruf, A-D7). Eigene Datei,
// damit kein Fehlerfall-Test mit ungueltigen Werten vorher die Objektformen in V8 verschlechtert.
// Ausgabe mit npm test -- --silent=false sichtbar. Die harte Grenze im Test ist grosszuegiger
// (0,5 ms), damit langsamere CI-Rechner nicht scheitern; die Zielzahl steht im Protokoll.

describe("Laufzeit auswerten (Protokoll)", () => {
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
    expect(ms).toBeLessThan(0.5);
  });
});
