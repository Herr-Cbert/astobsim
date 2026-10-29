// Einstieg der UI (docs/architektur.md Abschnitt 1: starte(wurzelElement)). Ablauf: Seite
// aufbauen -> Daten laden -> Konfiguration aus der URL (zustand, sonst Voreinstellung A-D9) ->
// Steuerung starten -> Formulare und Gesichtsfeld anhaengen. Die UI verdrahtet nur; Physik steckt
// in physik, die Bildpipeline in bild, die Schleife aus Aendern und Rechnen in steuerung.ts.
// Ladezustand und Fehler erscheinen als Text in der Statuszeile, nie als leere Seite.

import "./stil.css";
import { type Falterwahl, waehleFalter } from "../bild";
import { ladeBildnachweise, ladeGeraete, ladeObjekte, nachweisZu, quelleEinzelbildBrowser, quelleKachelnBrowser } from "../daten";
import type { Objektzustand } from "../naht/konfiguration";
import { TEXTE } from "../texte";
import { ausUrl, type Kataloge } from "../zustand";
import { baueFuss } from "./bildnachweise";
import { waehleAnzeigePx } from "./fenster";
import { baueFormularBedingungen } from "./formular_bedingungen";
import { baueFormularGeraet } from "./formular_geraet";
import { baueFormularObjekt } from "./formular_objekt";
import { baueGesichtsfeld, type GesichtsfeldPlaetze } from "./gesichtsfeld";
import { type Bildquelle, type Stand, Steuerung } from "./steuerung";
import { waermeVor } from "./vorwaermen";
import { baueZoomansicht } from "./zoomansicht";

/**
 * Groesste Anzeige mit WebGL2 (Kantenlaenge in Geraetepixeln). Die Bildspalte ist hoechstens
 * 720 CSS-Pixel breit, bei devicePixelRatio 2 also 1440; 2048 laesst Luft fuer hoehere
 * Pixeldichten und haelt den Kern unter 17 px (ADR-0002, Nachtrag Issue #4).
 */
const ANZEIGEGRENZE_WEBGL2_PX = 2048;

/** Die Elemente der Seite, die starte nach dem Aufbau beschreibt. */
interface Seite extends GesichtsfeldPlaetze {
  geraet: HTMLElement;
  objekt: HTMLElement;
  bedingungen: HTMLElement;
  status: HTMLElement;
  /** Gesichtsfeld mit Nachweis und Warnungen (Uebersicht). */
  bild: HTMLElement;
  /** Platz der Zoomansicht (A-D3), ersetzt im Zoom das Gesichtsfeld. */
  zoom: HTMLElement;
  /** Seitenfuss mit Lizenz und Bildnachweisen (A-T5, A-X4), gefuellt nach dem Laden der Kataloge. */
  fuss: HTMLElement;
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
  // Klickbar (oeffnet die Zoomansicht): Schaltflaeche, die Beschriftung nennt Bild und Bedienung.
  canvas.setAttribute("role", "button");
  canvas.setAttribute("aria-label", TEXTE.gesichtsfeld);
  const bild = element("figure", "bild");
  const nachweis = element("figcaption", "nachweis");
  const warnungen = element("div", "warnungen");
  warnungen.hidden = true;
  bild.append(element("div", "norden", TEXTE.nordenOben), canvas, warnungen, nachweis);

  const info = element("aside", "info");
  info.setAttribute("aria-label", TEXTE.info.ueberschrift);

  const ansicht = element("main", "ansicht");
  // Zoomansicht (#20) an der Stelle des Gesichtsfelds; baueZoomansicht fuellt und verbirgt sie.
  const zoom = element("section", "zoom");
  zoom.hidden = true;

  ansicht.append(formular, bild, zoom, info);

  const status = element("p", "status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const fuss = element("footer", "fuss");

  wurzel.replaceChildren(kopf, ansicht, status, fuss);
  return { canvas, info, nachweis, warnungen, geraet, objekt, bedingungen, status, bild, zoom, fuss };
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

/** Statuszeile zum Stand der Steuerung; mit JavaScript-Faltung der kurze Hinweis aus ADR-0002. */
function zeigeStand(seite: Seite, stand: Readonly<Stand>, falter: Falterwahl): void {
  switch (stand.phase) {
    case "laedt":
      zeigeStatus(seite, TEXTE.status.ladeBild);
      break;
    case "rechnet":
      zeigeStatus(seite, TEXTE.status.rechne);
      break;
    case "fertig":
      zeigeStatus(seite, statusFertig(stand.ms ?? 0, falter));
      break;
    case "fehler":
      zeigeFehler(seite, stand.fehler?.art === "bild" ? TEXTE.fehler.bild : TEXTE.fehler.rechnen, stand.fehler?.ursache);
      break;
  }
}

function statusFertig(ms: number, falter: Falterwahl): string {
  if (falter.art === "webgl2") return TEXTE.status.fertig(ms, TEXTE.status.falterWebgl2);
  const hinweis = TEXTE.status.ohneWebgl2(falter.anzeigeGrenzePx ?? 0, falter.grund);
  return `${TEXTE.status.fertig(ms, TEXTE.falterJs)} ${hinweis}`;
}

/** Leerlauf fuer das Vorwaermen; requestIdleCallback fehlt in Safari, dann setTimeout. */
function planeLeerlauf(f: () => void): void {
  if (typeof requestIdleCallback === "function") requestIdleCallback(() => f(), { timeout: 500 });
  else setTimeout(f, 50);
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

/**
 * Bildquelle im Browser: Kachelpyramide, wenn der Nachweis eine hat, sonst ein Einzelbild. Zustaende
 * ohne Quellbild kommen nicht hierher, fuer sie nimmt die Steuerung QuelleLeer.
 */
async function bildquelleBrowser(kataloge: Kataloge, objekt: Objektzustand): Promise<Bildquelle> {
  const nachweis = nachweisZu(kataloge.objekte, kataloge.nachweise, objekt.kennung);
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
  baueFuss(seite.fuss, kataloge);

  // Der Falter meldet den Wechsel auf JavaScript (Kontextverlust, WebGL2-Fehler): dann gilt die
  // Anzeigegrenze, und die Steuerung rechnet mit der kleineren Anzeige neu.
  // Im Zoom zaehlt die Breite eines der beiden Bilder; die Zoomansicht entsteht erst nach der
  // Steuerung, bis dahin gilt das Gesichtsfeld.
  let steuerungFuerWechsel: Steuerung | undefined;
  let zoomCanvas: HTMLCanvasElement | undefined;
  const anzeigePx = (zoom: boolean): number =>
    waehleAnzeigePx(
      (zoom && zoomCanvas !== undefined ? zoomCanvas : seite.canvas).getBoundingClientRect().width,
      window.devicePixelRatio,
      falter.anzeigeGrenzePx ?? ANZEIGEGRENZE_WEBGL2_PX
    );
  const falter = waehleFalter({ beiWechsel: () => steuerungFuerWechsel?.rechneNeu() });
  const steuerung = new Steuerung(
    {
      kataloge,
      falter,
      bildquelle: (objekt) => bildquelleBrowser(kataloge, objekt),
      plane: planeFrame,
      warte: naechsterFrame,
      schreibeUrl: (suche) => window.history.replaceState(null, "", suche + window.location.hash),
      anzeigePx,
      uhr: () => performance.now()
    },
    start.konfiguration
  );
  steuerungFuerWechsel = steuerung;

  // Geschnittene Werte aus einem Link (A-F8) einmal mit der ersten fertigen Rechnung melden.
  let linkHinweise = start.hinweise.length;
  // Nach dem ersten Anblick die Shader der wahrscheinlichen Kerngroessen vorwaermen (vorwaermen.ts).
  let vorgewaermt = false;
  steuerung.beobachte((stand) => {
    zeigeStand(seite, stand, falter);
    if (linkHinweise > 0 && stand.phase === "fertig") {
      zeigeStatus(seite, `${TEXTE.status.linkGeschnitten(linkHinweise)} ${seite.status.textContent ?? ""}`);
      linkHinweise = 0;
    }
    if (!vorgewaermt && stand.phase === "fertig" && stand.anblick !== undefined && falter.art === "webgl2") {
      vorgewaermt = true;
      const erste = stand.anblick.raster.kanaele;
      waermeVor(falter, {
        kanaele: erste === 3 ? [3, 1] : [1, 3],
        plane: planeLeerlauf,
        aktiv: () => falter.art === "webgl2",
        uhr: () => performance.now(),
        fertig: (anzahl, ms) => {
          seite.canvas.dataset["vorgewaermt"] = `${anzahl}|${ms}`;
        }
      });
    }
  });

  baueGesichtsfeld(seite, steuerung);
  zoomCanvas = baueZoomansicht({ zoom: seite.zoom, uebersicht: seite.bild, gesichtsfeld: seite.canvas }, steuerung).anblick;

  // Neue Breite der Bildspalte: nur wenn sich die Anzeigegroesse der gezeigten Ansicht gegenueber
  // ihrer letzten Messung aendert, neu rechnen. Die erste Messung einer Ansicht rechnet nicht: den
  // Wechsel selbst rechnet zoome, und die Rechnung misst nach warte selbst.
  const gemessen = new Map<boolean, number>([[steuerung.stand.zoom, anzeigePx(steuerung.stand.zoom)]]);
  if (typeof ResizeObserver === "function") {
    const beobachter = new ResizeObserver(() => {
      const zoom = steuerung.stand.zoom;
      const neu = anzeigePx(zoom);
      const alt = gemessen.get(zoom);
      gemessen.set(zoom, neu);
      if (alt !== undefined && alt !== neu) steuerung.rechneNeu();
    });
    beobachter.observe(seite.canvas);
    beobachter.observe(zoomCanvas);
  }

  baueFormularGeraet(seite.geraet, steuerung);
  baueFormularObjekt(seite.objekt, steuerung);
  baueFormularBedingungen(seite.bedingungen, steuerung);
}
