/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";

// Content-Security-Policy (Issue #22, docs/validierung.md Abschnitt 7): GitHub Pages erlaubt keine
// eigenen HTTP-Header, daher als meta-Tag. Alles kommt vom eigenen Ursprung (A-T4: keine fremden
// Dienste); Kacheln und JSON laedt fetch, Bilder dekodiert createImageBitmap aus dem Blob, beides
// faellt unter default-src. Nur im Bau: der Dev-Server fuegt CSS als <style>-Element ein, das
// style-src 'self' blockieren wuerde. frame-ancestors wirkt im meta-Tag nicht.
const CSP = "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

function sicherheitsrichtlinie(): Plugin {
  return {
    name: "astobsim-csp",
    apply: "build",
    transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" }]
  };
}

// Basis-Pfad: GitHub Pages bedient die Projektseite unter herr-cbert.github.io/astobsim/,
// also brauchen Build und Preview base "/astobsim/". Der Dev-Server bleibt unter "/"
// (Issue #10), damit localhost:5173/ direkt die Seite zeigt. Code haengt nie am festen
// Pfad, sondern nutzt import.meta.env.BASE_URL, z. B. BASE_URL + "daten/geraete.json".
//
// Dateien unter daten/ (ADR-0003: Bilder, und JSON, falls es zur Laufzeit geladen wird)
// sind in Dev, Preview und Pages unter BASE_URL + "daten/..." erreichbar: im Dev-Server
// liefert Vite sie als statische Dateien aus dem Projektordner aus, fuer Preview und
// Pages kopiert scripts/build-abschluss.mjs den Ordner nach dist/daten/. Ob JSON als
// Modul importiert oder per fetch geladen wird, entscheidet Issue #8.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "serve" && !isPreview ? "/" : "/astobsim/",
  plugins: [sicherheitsrichtlinie()],
  build: { target: "es2022" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node"
  }
}));
