/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Basis-Pfad: GitHub Pages bedient die Projektseite unter herr-cbert.github.io/astobsim/,
// also brauchen Build und Preview base "/astobsim/". Der Dev-Server bleibt unter "/"
// (Issue #10), damit localhost:5173/ direkt die Seite zeigt. Code haengt nie am festen
// Pfad, sondern nutzt import.meta.env.BASE_URL, z. B. BASE_URL + "daten/geraete.json".
//
// Daten (daten/, ADR-0003) gehoeren nicht in den Bundle: im Dev-Server liefert Vite sie
// als statische Dateien aus dem Projektordner unter BASE_URL + "daten/..." aus; fuer
// Preview und Pages kopiert scripts/build-abschluss.mjs den Ordner nach dist/daten/.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "serve" && !isPreview ? "/" : "/astobsim/",
  build: { target: "es2022" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node"
  }
}));
