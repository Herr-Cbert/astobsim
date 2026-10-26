// Einstieg der UI (docs/architektur.md Abschnitt 1: starte(wurzelElement)). Durchstich Issue #9:
// feste Startkonfiguration (A-D9), ohne Formular und URL. Ablauf: Daten laden -> begrenze ->
// auswerten -> Kacheln laden -> rendere mit QuelleKacheln und FalterJs -> Zeichnen. Die UI
// verdrahtet nur; Physik steckt in physik, die Bildpipeline in bild. Ladezustand und Fehler
// erscheinen als Text in der Statuszeile, nie als leere Seite.

import "./stil.css";
import { ANZEIGEGRENZE_OHNE_WEBGL2_PX, FalterJs, rendere, type Zwischenspeicher } from "../bild";
import { ladeBildnachweise, ladeGeraete, ladeObjekte, quelleKachelnBrowser } from "../daten";
import { type Auswertung, auswerten, begrenze, type Konfiguration } from "../physik";
import { TEXTE } from "../texte";
import { ausschnittsanfrage, waehleAnzeigePx } from "./fenster";
import { infozeilen, zeigeInfozeilen } from "./infopanel";
import { type Startkonfiguration, startkonfiguration } from "./startkonfiguration";
import { zeichneAnblick } from "./zeichne";

/** Die Elemente der Seite, die starte nach dem Aufbau beschreibt. */
interface Seite {
  canvas: HTMLCanvasElement;
  info: HTMLElement;
  nachweis: HTMLElement;
  status: HTMLElement;
}

/** Baut das Grundgeruest der Seite in wurzel auf (ersetzt den bisherigen Inhalt). */
function baueSeite(wurzel: HTMLElement): Seite {
  const d = wurzel.ownerDocument;
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, klasse?: string, text?: string): HTMLElementTagNameMap[K] => {
    const e = d.createElement(tag);
    if (klasse !== undefined) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const kopf = element("header", "kopf");
  kopf.append(element("h1", undefined, TEXTE.titel), element("p", "untertitel", TEXTE.untertitel), element("p", "konfiguration", TEXTE.startkonfiguration));

  const canvas = element("canvas", "gesichtsfeld");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", TEXTE.gesichtsfeld);
  const bild = element("figure", "bild");
  const nachweis = element("figcaption", "nachweis");
  bild.append(element("div", "norden", TEXTE.nordenOben), canvas, nachweis);

  const info = element("aside", "info");
  info.setAttribute("aria-label", TEXTE.info.ueberschrift);

  const ansicht = element("main", "ansicht");
  ansicht.append(bild, info);

  const status = element("p", "status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  wurzel.replaceChildren(kopf, ansicht, status);
  return { canvas, info, nachweis, status };
}

function zeigeStatus(seite: Seite, text: string): void {
  seite.status.classList.remove("fehler");
  seite.status.textContent = text;
}

/** Fehler als Text: kurze Meldung aus texte.ts, darunter die technische Meldung. */
function zeigeFehler(seite: Seite, meldung: string, fehler: unknown): void {
  console.error(fehler);
  const d = seite.status.ownerDocument;
  const details = d.createElement("span");
  details.className = "details";
  details.textContent = `${TEXTE.fehler.details} ${fehler instanceof Error ? fehler.message : String(fehler)}`;
  seite.status.classList.add("fehler");
  seite.status.replaceChildren(d.createTextNode(meldung + " "), details);
}

/** Rueckfall fuer naechsterFrame in ms: im Hintergrund-Tab ruft der Browser requestAnimationFrame nicht auf. */
const FRAME_RUECKFALL_MS = 100;

/**
 * Wartet, bis der Browser den Statustext gezeichnet hat, bevor die Faltung den Hauptthread belegt.
 * Kommt kein Frame (Hintergrund-Tab), geht es nach FRAME_RUECKFALL_MS ueber setTimeout weiter.
 */
function naechsterFrame(): Promise<void> {
  return new Promise((weiter) => {
    let fertig = false;
    const einmal = (): void => {
      if (fertig) return;
      fertig = true;
      weiter();
    };
    requestAnimationFrame(() => setTimeout(einmal, 0));
    setTimeout(einmal, FRAME_RUECKFALL_MS);
  });
}

async function ladeStart(): Promise<Startkonfiguration> {
  const [geraete, nachweise] = await Promise.all([ladeGeraete(), ladeBildnachweise()]);
  const objekte = await ladeObjekte(nachweise);
  return startkonfiguration(geraete, objekte, nachweise);
}

/**
 * Startet die Anwendung in wurzel. Kehrt zurueck, wenn der Anblick gezeichnet ist oder ein Fehler
 * angezeigt wird; wirft nicht.
 */
export async function starte(wurzel: HTMLElement): Promise<void> {
  const seite = baueSeite(wurzel);
  /** Zwischenergebnisse von rendere; gehoert zu genau einer Quelle (hier: der Mond). */
  const zwischen: Zwischenspeicher = {};

  zeigeStatus(seite, TEXTE.status.ladeDaten);
  let start: Startkonfiguration;
  try {
    start = await ladeStart();
  } catch (e) {
    zeigeFehler(seite, TEXTE.fehler.daten, e);
    return;
  }

  seite.nachweis.textContent = TEXTE.bildnachweis(start.nachweis.namensnennung, start.nachweis.lizenz);

  let auswertung: Auswertung;
  let konfiguration: Konfiguration;
  try {
    konfiguration = begrenze(start.konfiguration).konfiguration;
    const breiteCss = seite.canvas.getBoundingClientRect().width;
    const anzeigePx = waehleAnzeigePx(breiteCss, window.devicePixelRatio, ANZEIGEGRENZE_OHNE_WEBGL2_PX);
    auswertung = auswerten(konfiguration, { anzeigePx });
    zeigeInfozeilen(seite.info, infozeilen(auswertung.anzeige));
  } catch (e) {
    zeigeFehler(seite, TEXTE.fehler.rechnen, e);
    return;
  }

  const { parameter } = auswertung;
  zeigeStatus(seite, TEXTE.status.ladeKacheln);
  const quelle = quelleKachelnBrowser(start.nachweis, konfiguration.objekt.durchmesserArcsec);
  try {
    const anfrage = ausschnittsanfrage(parameter.quellbild);
    await quelle.lade(anfrage.mitte, anfrage.breiteArcsec, anfrage.massstabArcsecProPx);
  } catch (e) {
    zeigeFehler(seite, TEXTE.fehler.kacheln, e);
    return;
  }

  zeigeStatus(seite, TEXTE.status.rechne);
  await naechsterFrame();
  try {
    const t0 = performance.now();
    const anblick = rendere(parameter, quelle, new FalterJs(), zwischen);
    const ms = Math.round(performance.now() - t0);
    zeichneAnblick(seite.canvas, anblick, parameter.gesichtsfeld);
    seite.canvas.dataset["rendereMs"] = String(ms);
    zeigeStatus(seite, TEXTE.status.fertig(ms, TEXTE.falterJs));
  } catch (e) {
    zeigeFehler(seite, TEXTE.fehler.rechnen, e);
  }
}
