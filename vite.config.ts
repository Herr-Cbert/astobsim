/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Basis-Pfad fuer GitHub Pages (Projektseite herr-cbert.github.io/astobsim/)
export default defineConfig({
  base: "/astobsim/",
  build: { target: "es2022" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node"
  }
});
