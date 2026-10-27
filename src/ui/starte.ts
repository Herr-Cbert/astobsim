// Einstieg der UI (docs/architektur.md Abschnitt 1: starte(wurzelElement)). Ablauf: Seite
// aufbauen -> Daten laden -> Konfiguration aus der URL (zustand, sonst Voreinstellung A-D9) ->
// Steuerung starten -> Formulare und Gesichtsfeld anhaengen. Die UI verdrahtet nur; Physik steckt
// in physik, die Bildpipeline in bild, die Schleife aus Aendern und Rechnen in steuerung.ts.
// Ladezustand und Fehler erscheinen als Text in der Statuszeile, nie als leere Seite.

import "./stil.css";
import { ANZEIGEGRENZE_OHNE_WEBGL2_PX, FalterJs } from "../bild";
import { findeZustand, ladeBildnachweise, ladeGeraete, ladeObjekte, quelleEinzelbildBrowser, quelleKachelnBrowser } from "../daten";
import type { Objektzustand } from "../naht/konfiguration";
import { TEXTE } from "../texte";
import { ausUrl, type Kataloge } from "../zustand";
import { waehleAnzeigePx } from "./fenster";
import { baueFormularBedingungen } from "./formular_bedingungen";
import { baueFormularGeraet } from "./formular_geraet";
import { baueFormularObjekt } from "./formular_objekt";
import { baueGesichtsfeld, type GesichtsfeldPlaetze } from "./gesichtsfeld";
import { type Bildquelle, type Stand, Steuerung } from "./steuerung";

/** Die Elemente der Seite, die starte nach dem Aufbau beschreibt. */
interface Seite extends GesichtsfeldPlaetze {
  geraet: HTMLElement;
  objekt: HTMLElement;
  bedingungen: HTMLElement;
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
  kopf.append(element("h1", undefined, TEXTE.titel), element("p", "untertitel", TEXTE.untertitel));

  // Formularspalte: Geraet (#17), Objekt und Bedingungen (#18).
  const formular = element("section", "formular");
  formular.setAttribute("aria-label", TEXTE.formular);
  const geraet = element("div", "formular-geraet");
  const objekt = element("div", "formular-objekt");
  const bedingungen = element("div", "formular-bedingungen");
  formular.append(geraet, objekt, bedingungen);

  const canvas = element("canvas", "gesichtsfeld");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", TEXTE.gesichtsfeld);
  const bild = element("figure", "bild");
  const nachweis = element("figcaption", "nachweis");
  const warnungen = element("div", "warnungen");
  bild.append(element("div", "norden", TEXTE.nordenOben), canvas, warnungen, nachweis);

  const info = element("aside", "info");
  info.setAttribute("aria-label", TEXTE.info.ueberschrift);

  const ansicht = element("main", "ansicht");
  ansicht.append(formular, bild, info);

  const status = element("p", "status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  wurzel.replaceChildren(kopf, ansicht, status);
  return { canvas, info, nachweis, warnungen, geraet, objekt, bedingungen, status };
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

/** Statuszeile zum Stand der Steuerung. */
function zeigeStand(seite: Seite, stand: Readonly<Stand>): void {
  switch (stand.phase) {
    case "laedt":
      zeigeStatus(seite, TEXTE.status.ladeBild);
      break;
    case "rechnet":
      zeigeStatus(seite, TEXTE.status.rechne);
      break;
    case "fertig":
      zeigeStatus(seite, TEXTE.status.fertig(stand.ms ?? 0, TEXTE.falterJs));
      break;
    case "fehler":
      zeigeFehler(seite, stand.fehler?.art === "bild" ? TEXTE.fehler.bild : TEXTE.fehler.rechnen, stand.fehler?.ursache);
      break;
  }
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

/** Wie naechsterFrame: plane darf im Hintergrund-Tab nicht haengen bleiben. */
function planeFrame(f: () => void): void {
  void naechsterFrame().then(f);
}

async function ladeKataloge(): Promise<Kataloge> {
  const [geraete, nachweise] = await Promise.all([ladeGeraete(), ladeBildnachweise()]);
  const objekte = await ladeObjekte(nachweise);
  return { geraete, objekte, nachweise };
}

/** Bildquelle im Browser: Kachelpyramide, wenn der Nachweis eine hat, sonst ein Einzelbild. */
async function bildquelleBrowser(kataloge: Kataloge, objekt: Objektzustand): Promise<Bildquelle> {
  const bild = findeZustand(kataloge.objekte, objekt.kennung)?.zustand.bild;
  const nachweis = kataloge.nachweise.find((n) => n.id === bild);
  if (nachweis === undefined) throw new Error(`ui: kein Bildnachweis zum Zustand "${objekt.kennung}"`);
  if (nachweis.kacheln !== undefined) {
    const quelle = quelleKachelnBrowser(nachweis, objekt.durchmesserArcsec);
    return { quelle, lade: (a) => quelle.lade(a.mitte, a.breiteArcsec, a.massstabArcsecProPx) };
  }
  const quelle = await quelleEinzelbildBrowser(nachweis, objekt.durchmesserArcsec);
  return { quelle, lade: async () => {} };
}

/**
 * Startet die Anwendung in wurzel. Kehrt zurueck, sobald die Steuerung laeuft oder ein Fehler
 * beim Laden der Daten angezeigt wird; wirft nicht.
 */
export async function starte(wurzel: HTMLElement): Promise<void> {
  const seite = baueSeite(wurzel);

  zeigeStatus(seite, TEXTE.status.ladeDaten);
  let kataloge: Kataloge;
  let start: ReturnType<typeof ausUrl>;
  try {
    kataloge = await ladeKataloge();
    start = ausUrl(window.location.search, kataloge);
  } catch (e) {
    zeigeFehler(seite, TEXTE.fehler.daten, e);
    return;
  }

  const steuerung = new Steuerung(
    {
      kataloge,
      falter: new FalterJs(),
      bildquelle: (objekt) => bildquelleBrowser(kataloge, objekt),
      plane: planeFrame,
      warte: naechsterFrame,
      schreibeUrl: (suche) => window.history.replaceState(null, "", suche + window.location.hash),
      anzeigePx: () => waehleAnzeigePx(seite.canvas.getBoundingClientRect().width, window.devicePixelRatio, ANZEIGEGRENZE_OHNE_WEBGL2_PX),
      uhr: () => performance.now()
    },
    start.konfiguration
  );

  // Geschnittene Werte aus einem Link (A-F8) einmal mit der ersten fertigen Rechnung melden.
  let linkHinweise = start.hinweise.length;
  steuerung.beobachte((stand) => {
    zeigeStand(seite, stand);
    if (linkHinweise > 0 && stand.phase === "fertig") {
      zeigeStatus(seite, `${TEXTE.status.linkGeschnitten(linkHinweise)} ${seite.status.textContent ?? ""}`);
      linkHinweise = 0;
    }
  });

  baueGesichtsfeld(seite, steuerung);
  baueFormularGeraet(seite.geraet, steuerung);
  baueFormularObjekt(seite.objekt, steuerung);
  baueFormularBedingungen(seite.bedingungen, steuerung);
}
