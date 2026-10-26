// Browsertest (npm run test:browser, Issue #15), ohne npm-Abhaengigkeiten: liefert den Bau aus
// test/browser/dist/ (vite build --config test/browser/vite.config.ts) ueber einen kleinen
// HTTP-Server aus, startet Chrome headless mit SwiftShader und liest das Ergebnis per --dump-dom.
// Prueft: WebGL2-Falter vorhanden, Abweichung zu FalterJs hoechstens 1 Stufe von 256,
// Kontextverlust fuehrt zu FalterJs ohne Fehler. Die Zeit wird protokolliert; ueber 250 ms gibt
// es nur einen Hinweis, weil SwiftShader-Zeiten vom Rechner abhaengen.
//
// Chrome: Umgebungsvariable CHROME (Pfad), sonst google-chrome. Volles JSON mit --json.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = fileURLToPath(new URL("..", import.meta.url));
const bau = join(wurzel, "test", "browser", "dist");
const chrome = process.env.CHROME || "google-chrome";
const grenzeStufen = 1;
const zielMs = 250;
const zeitlimitMs = 300_000;

if (!existsSync(join(bau, "index.html"))) {
  console.error("browser-test: test/browser/dist/index.html fehlt, vorher vite build --config test/browser/vite.config.ts");
  process.exit(1);
}

const typen = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".map": "application/json" };
const server = createServer((anfrage, antwort) => {
  const pfad = normalize(decodeURIComponent(new URL(anfrage.url ?? "/", "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = join(bau, pfad === "" ? "index.html" : pfad);
  if (!datei.startsWith(bau) || !existsSync(datei)) {
    antwort.writeHead(404).end();
    return;
  }
  antwort.writeHead(200, { "content-type": typen[extname(datei)] ?? "application/octet-stream" });
  antwort.end(readFileSync(datei));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const adresse = server.address();
const url = `http://127.0.0.1:${typeof adresse === "object" && adresse ? adresse.port : 0}/index.html`;

const profil = mkdtempSync(join(tmpdir(), "astobsim-chrome-"));
const argumente = [
  "--headless=new",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  `--user-data-dir=${profil}`,
  "--dump-dom",
  url
];

let dom = "";
let stoerung = "";
const code = await new Promise((ok) => {
  const prozess = spawn(chrome, argumente, { stdio: ["ignore", "pipe", "pipe"] });
  const wecker = setTimeout(() => {
    stoerung += `Zeitlimit ${zeitlimitMs / 1000} s ueberschritten\n`;
    prozess.kill("SIGKILL");
  }, zeitlimitMs);
  prozess.stdout.on("data", (d) => (dom += d));
  prozess.stderr.on("data", (d) => (stoerung += d));
  prozess.on("error", (e) => {
    stoerung += `${e.message}\n`;
    clearTimeout(wecker);
    ok(-1);
  });
  prozess.on("close", (c) => {
    clearTimeout(wecker);
    ok(c);
  });
});
server.close();
rmSync(profil, { recursive: true, force: true });

const treffer = dom.match(/<pre id="ergebnis">([\s\S]*?)<\/pre>/);
if (!treffer) {
  console.error(`browser-test: kein Ergebnis von Chrome (Exit ${code}).`);
  console.error(stoerung.split("\n").slice(-20).join("\n"));
  process.exit(1);
}
const text = treffer[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const e = JSON.parse(text);
if (process.argv.includes("--json")) console.log(JSON.stringify(e, null, 1));

const fehler = [...e.fehler];
const f = (x, n = 3) => (Number.isFinite(x) ? x.toFixed(n) : String(x));
console.log(`Chrome: ${e.userAgent}`);
console.log(`Renderer: ${e.renderer}`);
console.log(`waehleFalter: ${JSON.stringify(e.wahl)}`);
if (!e.webgl2) fehler.push("kein WebGL2-Falter im Browser");
if (e.wahl && e.wahl.art !== "webgl2") fehler.push(`waehleFalter waehlte ${e.wahl.art}, erwartet webgl2`);

console.log("\nGleichheit WebGL2 gegen JavaScript (8-Bit-Stufen: max ungerundet / max gerundet / Mittel):");
for (const v of e.vergleiche) {
  console.log(`  ${v.name}: ${f(v.maxStufen, 5)} / ${v.maxStufenGerundet} / ${f(v.mittelStufen, 6)}`);
  if (!(v.maxStufen <= grenzeStufen) || v.maxStufenGerundet > grenzeStufen) fehler.push(`${v.name}: Abweichung ueber ${grenzeStufen} Stufe`);
}

console.log(`\nZeit WebGL2 (SwiftShader), erster Aufruf mit Uebersetzen / Median, Ziel unter ${zielMs} ms:`);
const hinweise = [];
for (const z of e.zeitenWebgl2) {
  console.log(`  ${z.name}: ${f(z.ersterMs, 1)} ms / ${f(z.medianMs, 1)} ms (${z.laeufe} Laeufe)`);
  if (z.medianMs > zielMs) hinweise.push(`${z.name}: ${f(z.medianMs, 1)} ms ueber ${zielMs} ms`);
}
console.log("Zeit JavaScript im selben Browser, zum Vergleich:");
for (const z of e.zeitenJs) console.log(`  ${z.name}: ${f(z.ersterMs, 1)} ms`);

const k = e.kontextverlust;
console.log(`\nKontextverlust: ${JSON.stringify(k && { vorher: k.vorher, nachher: k.nachher, beiWechsel: k.beiWechsel, wurf: k.wurf })}`);
if (!k) fehler.push("Kontextverlust nicht geprueft");
else {
  if (k.wurf) fehler.push(`Kontextverlust: falte warf ${k.wurf}`);
  if (k.vorher.art !== "webgl2") fehler.push("Kontextverlust: vor dem Verlust nicht webgl2");
  if (k.nachher.art !== "javascript" || k.nachher.grund !== "kontextverlust") fehler.push("Kontextverlust: kein Wechsel auf javascript");
  if (k.nachher.anzeigeGrenzePx !== 1024) fehler.push("Kontextverlust: Anzeigegrenze nicht 1024 px");
  if (!k.beiWechsel) fehler.push("Kontextverlust: beiWechsel nicht gerufen");
  if (!k.vergleichNachVerlust || k.vergleichNachVerlust.maxStufen > grenzeStufen) fehler.push("Kontextverlust: Ergebnis nach dem Verlust weicht ab");
}

for (const h of hinweise) console.log(`Hinweis: ${h}`);
if (fehler.length > 0) {
  console.error("\nbrowser-test FEHLGESCHLAGEN:");
  for (const x of fehler) console.error(`  ${x}`);
  process.exit(1);
}
console.log("\nbrowser-test bestanden.");
