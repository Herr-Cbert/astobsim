// Screenshots der Validierung (Issue #21, docs/validierung.md), ohne npm-Abhaengigkeiten: liefert
// den Produktionsbau aus dist/ unter /astobsim/ aus (vorher npm run build), startet Chrome headless
// mit SwiftShader und steuert es ueber das Chrome DevTools Protocol (eingebauter WebSocket von
// Node 22). Je Fall: URL laden, warten bis das Gesichtsfeld fertig gerendert ist, Uebersicht
// speichern (Gesichtsfeld), Zoom per Eingabetaste oeffnen, Zoom speichern (Anblick und Quellbild),
// beides in der Aufloesung der Canvas (devicePixelRatio 2); bietet der Zoom ein Detail an (Mond,
// Issue #77), auch das Detail. Ablage docs/validierung/<fall>-uebersicht.png, -zoom.png und -detail.png.
// Meldet Chrome einen Verstoss gegen die Content-Security-Policy des Baus (Issue #22) oder einen
// Fehler auf der Konsole, endet das Skript mit Exit-Code 1.
//
// Aufruf: node scripts/validierung-bilder.mjs [--gpu] [fall ...]. Chrome ueber CHROME, sonst google-chrome.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = fileURLToPath(new URL("..", import.meta.url));
const bau = join(wurzel, "dist");
const ziel = join(wurzel, "docs", "validierung");
const chrome = process.env.CHROME || "google-chrome";
const BASIS = "/astobsim/";
const BREITE = 1400;
const HOEHE = 1000;
/** devicePixelRatio der Seite: die Canvas rendern doppelt so fein, der Zoom wird so gespeichert. */
const PIXELFAKTOR = 2;
/** Das Bild gilt als fertig, wenn die Rendernummer so lange gleich bleibt (Kacheln laden nach). */
const RUHE_MS = 2000;
const ZEITLIMIT_FALL_MS = 120_000;

// Bedingungen aller Faelle: Bortle 5, klar, Zenit (das Seeing gilt dort ohne Hoehenfaktor).
const B = "b=5&t=klar&h=90";
/** Freier Refraktor ohne Obstruktion, Okular 50 Grad. */
const refraktor = (d, f, ok) => `a=fernrohr&ba=refraktor&d=${d}&f=${f}&o=0&ok=${ok}&sg=50`;

/**
 * Die Faelle aus docs/validierung.md (T1 bis T6, Mondphasen P1 bis P3): Name, Suchteil der URL,
 * optional die Pfeiltaste und Anzahl der Schritte mit Umschalt (je 25 % der Detailbreite), die das
 * Detail an die gepruefte Stelle schieben (T3: knapp rechts vom Terminator, Issue #77).
 */
export const FAELLE = [
  ["T1", `${refraktor(70, 700, 7)}&z=jup_47&s=2`],
  ["T2a", `${refraktor(100, 1200, 8)}&z=sat_20&s=1.5`],
  ["T2b", `${refraktor(60, 600, 6)}&z=sat_20&s=1.5`],
  ["T3", `${refraktor(80, 800, 8)}&z=mond_ev&s=2`, { taste: "ArrowLeft", anzahl: 2 }],
  ["T4a", `${refraktor(300, 3000, 15)}&z=jup_47&s=3`],
  ["T4b", `${refraktor(100, 1000, 5)}&z=jup_47&s=3`],
  ["T4c", `${refraktor(300, 3000, 15)}&z=jup_47&s=1`],
  ["T4d", `${refraktor(100, 1000, 5)}&z=jup_47&s=1`],
  ["T5a", `${refraktor(150, 1200, 6)}&z=mars_14&s=1.5`],
  ["T5b", `${refraktor(80, 960, 8)}&z=mars_6&s=1.5`],
  ["T6a", `g=auge&z=mond_ev&s=2`],
  ["T6b", `g=auge&z=jup_47&s=2`],
  ["T6c", `g=fernglas-10x50&z=jup_47&s=2`],
  // Mondphasen (Issue #36): je Zustand blosses Auge und 10x50 bzw. 80 mm bei 100-fach wie T3.
  ["P1a", `g=auge&z=mond_sichel&s=2`],
  ["P1b", `g=fernglas-10x50&z=mond_sichel&s=2`],
  ["P2a", `g=auge&z=mond_voll&s=2`],
  ["P2b", `${refraktor(80, 800, 8)}&z=mond_voll&s=2`],
  ["P3a", `g=auge&z=mond_lv&s=2`],
  ["P3b", `${refraktor(80, 800, 8)}&z=mond_lv&s=2`]
].map(([name, such, detail]) => ({ name, such: `?v=1&${such}&${B}`, detail }));

if (!existsSync(join(bau, "index.html"))) {
  console.error("validierung-bilder: dist/index.html fehlt, vorher npm run build");
  process.exit(1);
}
const auswahl = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const faelle = auswahl.length > 0 ? FAELLE.filter((f) => auswahl.includes(f.name)) : FAELLE;
mkdirSync(ziel, { recursive: true });

const typen = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};
const server = createServer((anfrage, antwort) => {
  const pfadUrl = new URL(anfrage.url ?? "/", "http://x").pathname;
  if (!pfadUrl.startsWith(BASIS)) {
    antwort.writeHead(404).end();
    return;
  }
  const pfad = normalize(decodeURIComponent(pfadUrl.slice(BASIS.length))).replace(/^([/\\])+/, "");
  const datei = join(bau, pfad === "" || pfad === "." ? "index.html" : pfad);
  // Mit Trennzeichen, sonst kaeme "../dist-x/..." an einem Nachbarordner vorbei (Issue #22).
  if (!datei.startsWith(bau + sep) || !existsSync(datei)) {
    antwort.writeHead(404).end();
    return;
  }
  antwort.writeHead(200, { "content-type": typen[extname(datei)] ?? "application/octet-stream" });
  antwort.end(readFileSync(datei));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const adresse = server.address();
const ursprung = `http://127.0.0.1:${typeof adresse === "object" && adresse ? adresse.port : 0}${BASIS}`;

const profil = mkdtempSync(join(tmpdir(), "astobsim-chrome-"));
const prozess = spawn(
  chrome,
  [
    "--headless=new",
    ...(process.argv.includes("--gpu") ? ["--use-angle=gl"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profil}`,
    "about:blank"
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
let stoerung = "";
prozess.stderr.on("data", (d) => (stoerung += d));

const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Schliesst Chrome ueber CDP, sobald die Verbindung steht. */
let schliesseBrowser;

/** Beendet Chrome und raeumt das Profil erst danach weg; Chrome schreibt bis zum Ende hinein. */
async function aufraeumen() {
  const beendet = new Promise((ok) => (prozess.exitCode !== null || prozess.signalCode !== null ? ok() : prozess.once("exit", ok)));
  // Browser.close beendet Chrome mit allen Kindprozessen; sonst SIGTERM, SIGKILL nur als letztes Mittel.
  if (schliesseBrowser) await schliesseBrowser().catch(() => prozess.kill("SIGTERM"));
  else prozess.kill("SIGTERM");
  const wecker = setTimeout(() => prozess.kill("SIGKILL"), 5000);
  await beendet;
  clearTimeout(wecker);
  server.close();
  try {
    rmSync(profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    console.error(`validierung-bilder: Chrome-Profil ${profil} nicht entfernt`);
  }
}

/** Chrome schreibt Port und Pfad des Browser-Endpunkts nach DevToolsActivePort. */
async function endpunkt() {
  const datei = join(profil, "DevToolsActivePort");
  for (let i = 0; i < 200; i++) {
    if (existsSync(datei)) {
      const [port, pfad] = readFileSync(datei, "utf8").split("\n");
      if (port && pfad) return `ws://127.0.0.1:${port}${pfad}`;
    }
    await warte(100);
  }
  throw new Error(`Chrome meldet keinen DevTools-Port\n${stoerung.split("\n").slice(-10).join("\n")}`);
}

/** Fehler und CSP-Verstoesse, die Chrome auf der Konsole meldet (Log.entryAdded, Runtime.exceptionThrown). */
const konsolenfehler = [];

/** Minimaler CDP-Client: senden(methode, parameter, sitzung) liefert result oder wirft. */
function cdp(ws) {
  let naechste = 1;
  const offen = new Map();
  ws.addEventListener("message", (e) => {
    const nachricht = JSON.parse(String(e.data));
    if (nachricht.method === "Log.entryAdded" && nachricht.params.entry.level === "error") {
      const { text, url } = nachricht.params.entry;
      // Das favicon fragt Chrome von sich aus an der Wurzel an; astobsim hat keins, auch Pages nicht.
      if (!url?.endsWith("/favicon.ico")) konsolenfehler.push(url ? `${text} (${url})` : text);
    }
    if (nachricht.method === "Runtime.exceptionThrown") konsolenfehler.push(nachricht.params.exceptionDetails.exception?.description ?? nachricht.params.exceptionDetails.text);
    const eintrag = nachricht.id !== undefined ? offen.get(nachricht.id) : undefined;
    if (!eintrag) return;
    offen.delete(nachricht.id);
    if (nachricht.error) eintrag.nein(new Error(`${eintrag.methode}: ${nachricht.error.message}`));
    else eintrag.ja(nachricht.result);
  });
  return (methode, params = {}, sessionId = undefined) =>
    new Promise((ja, nein) => {
      const id = naechste++;
      offen.set(id, { ja, nein, methode });
      ws.send(JSON.stringify({ id, method: methode, params, ...(sessionId ? { sessionId } : {}) }));
    });
}

try {
  const ws = new WebSocket(await endpunkt());
  await new Promise((ok, nein) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", () => nein(new Error("WebSocket zu Chrome nicht offen")), { once: true });
  });
  const senden = cdp(ws);
  schliesseBrowser = () => senden("Browser.close");

  for (const fall of faelle) {
    const { targetId } = await senden("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await senden("Target.attachToTarget", { targetId, flatten: true });
    const s = (methode, params) => senden(methode, params, sessionId);
    await s("Emulation.setDeviceMetricsOverride", { width: BREITE, height: HOEHE, deviceScaleFactor: PIXELFAKTOR, mobile: false });
    await s("Page.enable");
    await s("Log.enable");
    await s("Runtime.enable");
    await s("Page.navigate", { url: ursprung + fall.such });

    const wert = async (ausdruck) => (await s("Runtime.evaluate", { expression: ausdruck, returnByValue: true })).result.value;
    /** Wartet, bis data-nummer des Canvas gesetzt, ungleich vorher ist und RUHE_MS lang gleich bleibt. */
    const fertig = async (selektor, vorher = null) => {
      const ende = Date.now() + ZEITLIMIT_FALL_MS;
      let letzte = null;
      let seit = Date.now();
      while (Date.now() < ende) {
        const nummer = await wert(`document.querySelector(${JSON.stringify(selektor)})?.dataset.nummer ?? null`);
        if (nummer !== letzte) {
          letzte = nummer;
          seit = Date.now();
        } else if (nummer !== null && nummer !== vorher && Date.now() - seit >= RUHE_MS) return nummer;
        await warte(200);
      }
      const konsole = konsolenfehler.length > 0 ? `; Konsole:\n  ${konsolenfehler.join("\n  ")}` : "";
      throw new Error(`${fall.name}: ${selektor} nicht fertig nach ${ZEITLIMIT_FALL_MS / 1000} s (Nummer ${letzte})${konsole}`);
    };
    /** Speichert den Ausschnitt des Elements in voller Aufloesung (PIXELFAKTOR je CSS-Pixel). */
    const speichere = async (teil, selektor) => {
      const r = await wert(`(() => { const r = document.querySelector(${JSON.stringify(selektor)}).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
      const { data } = await s("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 1 } });
      const datei = join(ziel, `${fall.name}-${teil}.png`);
      writeFileSync(datei, Buffer.from(data, "base64"));
      return datei;
    };

    await fertig("canvas.gesichtsfeld");
    const uebersicht = await speichere("uebersicht", "canvas.gesichtsfeld");
    await wert(`document.querySelector("canvas.gesichtsfeld").focus()`);
    for (const type of ["keyDown", "keyUp"]) {
      await s("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    }
    const nummerZoom = await fertig(".zoom canvas.zoom-canvas");
    const zoom = await speichere("zoom", ".zoom-bilder");
    let detail = "";
    if (await wert(`document.querySelector(".zoom-detail")?.hidden === false`)) {
      await wert(`document.querySelector(".zoom-detail").click()`);
      // Der Fokus liegt seit der Eingabetaste auf dem Anblick im Zoom; Umschalt (8) fuer grosse Schritte.
      for (let i = 0; i < (fall.detail?.anzahl ?? 0); i++) {
        for (const type of ["keyDown", "keyUp"]) await s("Input.dispatchKeyEvent", { type, key: fall.detail.taste, code: fall.detail.taste, modifiers: 8 });
      }
      await fertig(".zoom canvas.zoom-canvas", nummerZoom);
      detail = `, ${(await speichere("detail", ".zoom-bilder")).slice(wurzel.length)}`;
    }
    console.log(`${fall.name}: ${uebersicht.slice(wurzel.length)}, ${zoom.slice(wurzel.length)}${detail}  ${ursprung}${fall.such}`);
    await senden("Target.closeTarget", { targetId });
    if (konsolenfehler.length > 0) throw new Error(`${fall.name}: Fehler auf der Konsole:\n  ${konsolenfehler.join("\n  ")}`);
  }
} catch (e) {
  console.error(`validierung-bilder: ${e instanceof Error ? e.message : String(e)}`);
  await aufraeumen();
  process.exit(1);
}
await aufraeumen();
