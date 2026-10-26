// Eigener Vite-Bau fuer die Browsertests (npm run test:browser), getrennt vom Produktionsbau:
// root ist dieser Ordner (relativ zum Repo-Wurzelordner, aus dem npm die Skripte startet),
// Ausgabe nach test/browser/dist/ (gitignored), relative Pfade, damit scripts/browser-test.mjs
// die Seite unter beliebigem Pfad ausliefern kann.
import { defineConfig } from "vite";

export default defineConfig({
  root: "test/browser",
  base: "./",
  logLevel: "warn",
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true
  }
});
