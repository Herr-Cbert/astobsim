// Abschluss von "npm run build" (laeuft nach "vite build"), ohne npm-Abhaengigkeiten (ADR-0001):
// 1. Groesse des Erstladens pruefen: Summe aller Dateien in dist/ ohne dist/daten/
//    (HTML, JS, CSS, aber auch SVG, Fonts, wasm). Ueber 5 MB (5 000 000 Byte, wie
//    A-X6 es meint) bricht der Build ab.
// 2. daten/ (JSON und Bilder, ADR-0003) nach dist/daten/ kopieren, damit Preview und
//    GitHub Pages sie unter BASE_URL + "daten/..." finden, genau wie der Dev-Server.
//    Fehlt der Ordner (z. B. auf einem Branch ohne Daten), wird nur ein Hinweis ausgegeben.
import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = fileURLToPath(new URL("..", import.meta.url));
const dist = join(wurzel, "dist");
const daten = join(wurzel, "daten");
const zielDaten = join(dist, "daten");
const grenzeBytes = 5 * 1000 * 1000;

if (!existsSync(dist)) {
  console.error("build-abschluss: dist/ fehlt, vite build ist nicht gelaufen.");
  process.exit(1);
}

function summeErstladen(ordner) {
  let summe = 0;
  for (const name of readdirSync(ordner)) {
    const pfad = join(ordner, name);
    if (pfad === zielDaten) continue;
    const info = statSync(pfad);
    if (info.isDirectory()) summe += summeErstladen(pfad);
    else summe += info.size;
  }
  return summe;
}

const inMb = (bytes) => (bytes / (1000 * 1000)).toFixed(2).replace(".", ",");
const groesse = summeErstladen(dist);
console.log(`Erstladen (alles in dist/ ohne daten/): ${groesse} Bytes = ${inMb(groesse)} MB, Grenze ${inMb(grenzeBytes)} MB (A-X6)`);
if (groesse > grenzeBytes) {
  console.error("build-abschluss: Erstladen ueberschreitet 5 MB, Build abgebrochen.");
  process.exit(1);
}

if (existsSync(daten)) {
  cpSync(daten, zielDaten, { recursive: true });
  console.log("daten/ nach dist/daten/ kopiert.");
} else {
  console.log("Hinweis: daten/ fehlt, nichts nach dist/daten/ kopiert.");
}
