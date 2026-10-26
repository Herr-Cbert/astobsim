// Browsertest Falter (Issue #15): FalterWebgl2 gegen FalterJs, Zeitmessung, Kontextverlust.
// Laeuft synchron beim Laden des Moduls, also vor dem load-Ereignis: Chrome mit --dump-dom gibt
// das DOM erst danach aus, und performance.now() laeuft echt (kein --virtual-time-budget).
// Ergebnis als JSON in <pre id="ergebnis">; scripts/browser-test.mjs wertet es aus.

import type { Kern } from "../../src/naht/simulationsparameter";
import { FalterJs, type Falter } from "../../src/bild/falter";
import { FalterWebgl2, waehleFalter, type Falterwahl } from "../../src/bild/falter_webgl2";
import { neuesRaster, pixelIndex, type Kanaele, type Raster } from "../../src/bild/raster";
import { deltaKern, kastenKern, kernAusDaten, verschobenerDeltaKern } from "../../src/bild/testkerne";

interface Vergleich {
  name: string;
  /** Groesste Abweichung in 8-Bit-Stufen (Wert mal 255), ungerundet. */
  maxStufen: number;
  /** Groesste Abweichung der auf 8 Bit gerundeten Werte. */
  maxStufenGerundet: number;
  mittelStufen: number;
}

interface Zeit {
  name: string;
  /** Erster Aufruf, mit Uebersetzen des Shaders. */
  ersterMs: number;
  /** Median der folgenden Aufrufe. */
  medianMs: number;
  laeufe: number;
}

const ergebnis: {
  userAgent: string;
  renderer: string;
  webgl2: boolean;
  wahl: { art: string; grund: string; anzeigeGrenzePx: number | null } | null;
  vergleiche: Vergleich[];
  zeitenWebgl2: Zeit[];
  zeitenJs: Zeit[];
  kontextverlust: Record<string, unknown> | null;
  fehler: string[];
} = {
  userAgent: navigator.userAgent,
  renderer: "",
  webgl2: false,
  wahl: null,
  vergleiche: [],
  zeitenWebgl2: [],
  zeitenJs: [],
  kontextverlust: null,
  fehler: []
};

function zufallsRaster(breite: number, hoehe: number, kanaele: Kanaele, saat = 12345): Raster {
  const raster = neuesRaster(breite, hoehe, kanaele);
  let z = saat;
  for (let i = 0; i < raster.daten.length; i++) {
    z = (z * 1103515245 + 12345) % 2147483648;
    raster.daten[i] = z / 2147483648;
  }
  return raster;
}

function kantenRaster(breite: number, hoehe: number, kante: number): Raster {
  const raster = neuesRaster(breite, hoehe);
  for (let y = 0; y < hoehe; y++) for (let x = kante; x < breite; x++) raster.daten[pixelIndex(raster, x, y)] = 1;
  return raster;
}

/** Gauss-Kern mit Summe 1, nicht trennbar gemacht durch leichte Elliptizitaet und Versatz im Fluegel. */
function gaussKern(groesse: number, sigma: number): Kern {
  const r = (groesse - 1) / 2;
  const daten = new Float32Array(groesse * groesse);
  let summe = 0;
  for (let t = 0; t < groesse; t++) {
    for (let s = 0; s < groesse; s++) {
      const dx = s - r;
      const dy = t - r;
      const w = Math.exp(-(dx * dx / (2 * sigma * sigma) + dy * dy / (2 * 1.3 * sigma * 1.3 * sigma))) + 0.002 * (dx > 0 ? 1 : 0);
      daten[t * groesse + s] = w;
      summe += w;
    }
  }
  for (let i = 0; i < daten.length; i++) daten[i] = (daten[i] as number) / summe;
  return kernAusDaten(groesse, daten, `gauss${groesse}`);
}

function vergleiche(name: string, a: Raster, b: Raster): Vergleich {
  if (a.breite !== b.breite || a.hoehe !== b.hoehe || a.kanaele !== b.kanaele || a.daten.length !== b.daten.length) {
    throw new Error(`${name}: Masse verschieden`);
  }
  let max = 0;
  let maxGerundet = 0;
  let summe = 0;
  for (let i = 0; i < a.daten.length; i++) {
    const x = (a.daten[i] as number) * 255;
    const y = (b.daten[i] as number) * 255;
    const d = Math.abs(x - y);
    if (!(d <= max)) max = Number.isNaN(d) ? Infinity : d;
    const g = Math.abs(Math.round(x) - Math.round(y));
    if (g > maxGerundet) maxGerundet = g;
    summe += d;
  }
  return { name, maxStufen: max, maxStufenGerundet: maxGerundet, mittelStufen: summe / a.daten.length };
}

function miss(name: string, falter: Falter, raster: Raster, kern: Kern, laeufe: number): Zeit {
  let start = performance.now();
  falter.falte(raster, kern);
  const ersterMs = performance.now() - start;
  const zeiten: number[] = [];
  for (let i = 0; i < laeufe; i++) {
    start = performance.now();
    falter.falte(raster, kern);
    zeiten.push(performance.now() - start);
  }
  zeiten.sort((x, y) => x - y);
  const medianMs = zeiten.length > 0 ? (zeiten[Math.floor(zeiten.length / 2)] as number) : ersterMs;
  return { name, ersterMs: runde(ersterMs), medianMs: runde(medianMs), laeufe };
}

const runde = (x: number): number => Math.round(x * 10) / 10;

function lauf(): void {
  const js = new FalterJs();
  const gl = FalterWebgl2.erzeuge();
  ergebnis.webgl2 = gl !== null;
  const wahl = waehleFalter();
  ergebnis.wahl = { art: wahl.art, grund: wahl.grund, anzeigeGrenzePx: wahl.anzeigeGrenzePx };
  const pruef = document.createElement("canvas").getContext("webgl2");
  if (pruef) {
    const info = pruef.getExtension("WEBGL_debug_renderer_info");
    ergebnis.renderer = String(pruef.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : pruef.RENDERER));
    pruef.getExtension("WEBGL_lose_context")?.loseContext();
  }
  if (!gl) {
    ergebnis.fehler.push("FalterWebgl2.erzeuge lieferte null: kein WebGL2 mit Float-Rendering");
    return;
  }

  // Kleine Faelle aus falter.test.ts: Rand, Richtung, ungerade Masse, ein und drei Kanaele.
  const faelle: [string, Raster, Kern][] = [
    ["Delta 5, 13x9, 3 Kanaele", zufallsRaster(13, 9, 3), deltaKern(5)],
    ["Delta 5, 13x9, 1 Kanal", zufallsRaster(13, 9, 1), deltaKern(5)],
    ["Kasten 3, Kante 8x4", kantenRaster(8, 4, 4), kastenKern(3)],
    ["Kasten 5, Kante am Rand 6x3", kantenRaster(6, 3, 3), kastenKern(5)],
    ["Kasten 7, konstant 10x7", neuesRaster(10, 7, 1, 0.7), kastenKern(7)],
    ["Delta rechts, 5x5", zufallsRaster(5, 5, 1), verschobenerDeltaKern(1, 0)],
    ["Delta Norden, 5x5", zufallsRaster(5, 5, 1), verschobenerDeltaKern(0, -1)],
    ["Delta schraeg, 31x17, 3 Kanaele", zufallsRaster(31, 17, 3), verschobenerDeltaKern(2, 1, 7)],
    ["Gauss 25 groesser als Raster, 11x7", zufallsRaster(11, 7, 1), gaussKern(25, 4)],
    ["Gauss 81, 200x150, 3 Kanaele", zufallsRaster(200, 150, 3), gaussKern(81, 12)],
    // Schleifen-Shader (Kern ueber 25 px): Richtung in x und y (Spiegelung), R32F- und RGB32F-Pfad.
    ["Schleife: Delta (3, -5) Kern 27, 33x21, 1 Kanal", zufallsRaster(33, 21, 1), verschobenerDeltaKern(3, -5, 27)],
    ["Schleife: Delta (3, -5) Kern 27, 33x21, 3 Kanaele", zufallsRaster(33, 21, 3), verschobenerDeltaKern(3, -5, 27)],
    // Dasselbe im ausgerollten Shader zum Vergleich.
    ["Ausgerollt: Delta (3, -5) Kern 25, 33x21, 3 Kanaele", zufallsRaster(33, 21, 3), verschobenerDeltaKern(3, -5, 25)]
  ];
  for (const [name, raster, kern] of faelle) ergebnis.vergleiche.push(vergleiche(name, gl.falte(raster, kern), js.falte(raster, kern)));

  // Hauptfall des Issues: 1024 px, Kern 25 px, Kasten und Gauss, ein und drei Kanaele.
  const bild1 = zufallsRaster(1024, 1024, 1);
  const bild3 = zufallsRaster(1024, 1024, 3, 777);
  const gauss25 = gaussKern(25, 4);
  const kasten25 = kastenKern(25);
  const gauss17 = gaussKern(17, 2.5);
  ergebnis.vergleiche.push(vergleiche("Gauss 25, 1024 px, 1 Kanal", gl.falte(bild1, gauss25), js.falte(bild1, gauss25)));
  ergebnis.vergleiche.push(vergleiche("Kasten 25, 1024 px, 1 Kanal", gl.falte(bild1, kasten25), js.falte(bild1, kasten25)));
  ergebnis.vergleiche.push(vergleiche("Gauss 25, 1024 px, 3 Kanaele", gl.falte(bild3, gauss25), js.falte(bild3, gauss25)));

  // Zeiten: frischer Falter, damit der erste Aufruf das Uebersetzen enthaelt.
  const messGl = FalterWebgl2.erzeuge();
  if (!messGl) throw new Error("zweiter FalterWebgl2 nicht angelegt");
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 25, 1 Kanal", messGl, bild1, gauss25, 5));
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 25, 3 Kanaele", messGl, bild3, gauss25, 5));
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 17, 1 Kanal", messGl, bild1, gauss17, 5));
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 17, 3 Kanaele", messGl, bild3, gauss17, 5));
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 21, 3 Kanaele", messGl, bild3, gaussKern(21, 3), 3));
  ergebnis.zeitenWebgl2.push(miss("1024 px, Kern 27, 3 Kanaele (Schleifen-Shader)", messGl, bild3, gaussKern(27, 4), 2));
  messGl.freigeben();
  ergebnis.zeitenJs.push(miss("1024 px, Kern 25, 1 Kanal", js, bild1, gauss25, 1));
  ergebnis.zeitenJs.push(miss("1024 px, Kern 25, 3 Kanaele", js, bild3, gauss25, 0));

  // Kontextverlust: eigene Flaeche, damit der Test an den Kontext kommt und ihn per
  // WEBGL_lose_context verliert. Erwartet: kein Fehler, Wechsel auf JavaScript, gleiches Ergebnis.
  const flaeche = document.createElement("canvas");
  let wechsel: string | null = null;
  let ereignis = false;
  flaeche.addEventListener("webglcontextlost", () => {
    ereignis = true;
  });
  const verlustWahl: Falterwahl = waehleFalter({ flaeche, beiWechsel: (w) => (wechsel = `${w.art}/${w.grund}`) });
  const klein = zufallsRaster(64, 48, 3);
  const vorher = { art: verlustWahl.art, grund: verlustWahl.grund };
  const vorVerlust = verlustWahl.falte(klein, gauss17);
  const kontext = flaeche.getContext("webgl2");
  const lose = kontext?.getExtension("WEBGL_lose_context");
  if (!lose) throw new Error("WEBGL_lose_context fehlt");
  lose.loseContext();
  let nachVerlust: Raster | null = null;
  let wurf: string | null = null;
  try {
    nachVerlust = verlustWahl.falte(klein, gauss17);
  } catch (e) {
    wurf = String(e);
  }
  ergebnis.kontextverlust = {
    vorher,
    nachher: { art: verlustWahl.art, grund: verlustWahl.grund, anzeigeGrenzePx: verlustWahl.anzeigeGrenzePx },
    beiWechsel: wechsel,
    ereignisSynchron: ereignis,
    wurf,
    vergleichVorVerlust: vergleiche("vor Verlust gegen JS", vorVerlust, js.falte(klein, gauss17)),
    vergleichNachVerlust: nachVerlust ? vergleiche("nach Verlust gegen JS", nachVerlust, js.falte(klein, gauss17)) : null
  };
}

try {
  lauf();
} catch (e) {
  ergebnis.fehler.push(e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ""}` : String(e));
}
const pre = document.createElement("pre");
pre.id = "ergebnis";
pre.textContent = JSON.stringify(ergebnis, null, 1);
document.body.appendChild(pre);
document.title = "FERTIG";
