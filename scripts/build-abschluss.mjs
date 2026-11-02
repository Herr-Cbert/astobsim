// Abschluss von "npm run build" (laeuft nach "vite build"), ohne npm-Abhaengigkeiten (ADR-0001):
// 1. Groesse des Erstladens pruefen: Summe aller Dateien in dist/ ohne dist/daten/
//    (HTML, JS, CSS, aber auch SVG, Fonts, wasm) plus die Dateien aus daten/, die die
//    Startseite immer laedt (ui/starte.ts): die drei Kataloge und alle Sternlisten, auf die
//    ein Zustand in objekte.json mit sterne_datei zeigt (ladeObjekte laedt sie beim Start,
//    Issue #113). Bilder laedt erst das gewaehlte Objekt; sie zaehlen nicht. Ueber 5 MB
//    (5 000 000 Byte, wie A-X6 es meint) bricht der Build ab.
// 2. daten/ (JSON und Bilder, ADR-0003) nach dist/daten/ kopieren, damit Preview und
//    GitHub Pages sie unter BASE_URL + "daten/..." finden, genau wie der Dev-Server.
//    Fehlt der Ordner (z. B. auf einem Branch ohne Daten), wird nur ein Hinweis ausgegeben.
import { cpSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = fileURLToPath(new URL("..", import.meta.url));
const dist = join(wurzel, "dist");
const daten = join(wurzel, "daten");
const zielDaten = join(dist, "daten");
const grenzeBytes = 5 * 1000 * 1000;
/** Kataloge, die ui/starte.ts beim Start laedt (GERAETE_DATEI, BILDER_DATEI, OBJEKTE_DATEI). */
const KATALOGE = ["geraete.json", "bilder.json", "objekte.json"];

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

/** Dateien unter daten/, die die Startseite immer laedt: Kataloge und Sternlisten (sterne_datei). */
function startdaten() {
  if (!existsSync(daten)) return [];
  const dateien = KATALOGE.filter((name) => existsSync(join(daten, name)));
  if (dateien.includes("objekte.json")) {
    const objekte = JSON.parse(readFileSync(join(daten, "objekte.json"), "utf8"));
    for (const objekt of objekte) {
      for (const zustand of objekt.zustaende ?? []) {
        const name = zustand.sterne_datei && `sterne/${zustand.sterne_datei}`;
        if (name && !dateien.includes(name)) dateien.push(name);
      }
    }
  }
  return dateien;
}

const inMb = (bytes) => (bytes / (1000 * 1000)).toFixed(2).replace(".", ",");
const programm = summeErstladen(dist);
const start = startdaten();
const datenBytes = start.reduce((summe, name) => summe + statSync(join(daten, name)).size, 0);
const groesse = programm + datenBytes;
console.log(
  `Erstladen (dist/ ohne daten/ ${programm} Bytes, dazu ${start.length} Dateien aus daten/ ${datenBytes} Bytes): ` +
    `${groesse} Bytes = ${inMb(groesse)} MB, Grenze ${inMb(grenzeBytes)} MB (A-X6)`
);
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
