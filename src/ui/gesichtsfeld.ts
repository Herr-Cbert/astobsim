// Gesichtsfeld, Infopanel, Warnungen und Bildnachweis als Beobachter der Steuerung (Issue #19).
// Anblick zeichnen, sobald ein neuer fertig ist (das alte Bild bleibt bis dahin stehen, A-D7);
// Form Kreis oder Rechteck beim blossen Auge (A-D1, Maske aus bild, Rand per CSS); Kennwerte
// (A-D4) und Warnungen (A-D5) zur letzten Auswertung; Namensnennung zum Quellbild des Zustands.
// Verschieben (A-D2) mit Maus (Ziehen) und Pfeiltasten, nur wenn das Objekt groesser als das
// Gesichtsfeld ist; es aendert ueber steuerung.verschiebe nur die Fenstermitte (kein Kernbau,
// keine URL). Grenzen und Richtungen in verschieben.ts, Zeiger und Tasten in ziehen.ts. Klick
// oder Eingabetaste oeffnet die Zoomansicht (A-D3, zoomansicht.ts).

import { nachweisZu } from "../daten";
import type { Anblick } from "../bild";
import type { Auswertung } from "../physik";
import { TEXTE } from "../texte";
import type { Kataloge } from "../zustand";
import { infozeilen, zeigeInfozeilen } from "./infopanel";
import type { Steuerung } from "./steuerung";
import { sollMitte } from "./verschieben";
import { warnzeilen, zeigeWarnzeilen } from "./warnungen";
import { zeichneAnblick } from "./zeichne";
import { verbindeBild } from "./ziehen";
import { verschiebelage } from "./zoom";

/** Die Plaetze auf der Seite, die das Gesichtsfeld beschreibt (baut starte). */
export interface GesichtsfeldPlaetze {
  canvas: HTMLCanvasElement;
  info: HTMLElement;
  nachweis: HTMLElement;
  warnungen: HTMLElement;
}

/** Namensnennung zum Quellbild des Zustands (A-X3); leer, wenn der Zustand keinen Nachweis hat. */
export function nachweistext(kataloge: Kataloge, kennung: string): string {
  const nachweis = nachweisZu(kataloge.objekte, kataloge.nachweise, kennung);
  return nachweis === undefined ? "" : TEXTE.bildnachweis(nachweis.namensnennung, nachweis.lizenz);
}

export function baueGesichtsfeld(plaetze: GesichtsfeldPlaetze, steuerung: Steuerung): void {
  const { canvas } = plaetze;
  let gezeichnet: Anblick | undefined;
  let auswertung: Auswertung | undefined;
  let kennung: string | undefined;
  let erlaubt: boolean | undefined;

  steuerung.beobachte((stand) => {
    // Ein neuer Anblick der Uebersicht kommt nur mit phase "fertig"; dann gehoert die Auswertung zu ihm.
    if (stand.anblick !== undefined && stand.anblick !== gezeichnet && stand.auswertung !== undefined) {
      gezeichnet = stand.anblick;
      zeichneAnblick(canvas, stand.anblick, stand.auswertung.parameter.gesichtsfeld);
      canvas.dataset["rendereMs"] = String(stand.ms);
      canvas.dataset["nummer"] = String(stand.nummer);
    }
    if (stand.auswertung !== undefined && stand.auswertung !== auswertung) {
      auswertung = stand.auswertung;
      zeigeInfozeilen(plaetze.info, infozeilen(stand.auswertung.anzeige));
      zeigeWarnzeilen(plaetze.warnungen, warnzeilen(stand.auswertung.warnungen));
    }
    if (stand.konfiguration.objekt.kennung !== kennung) {
      kennung = stand.konfiguration.objekt.kennung;
      plaetze.nachweis.textContent = nachweistext(steuerung.kataloge, kennung);
    }

    // Verschieben an- oder abschalten; das Gesichtsfeld ist immer fokussierbar (Eingabetaste zoomt).
    const jetzt = verschiebelage(stand.konfiguration, false)?.erlaubt ?? false;
    if (jetzt !== erlaubt) {
      erlaubt = jetzt;
      canvas.classList.toggle("verschiebbar", jetzt);
      canvas.tabIndex = 0;
      const hinweis = jetzt ? `${TEXTE.gesichtsfeldVerschieben} ${TEXTE.gesichtsfeldZoom}` : TEXTE.gesichtsfeldZoom;
      canvas.title = hinweis;
      canvas.setAttribute("aria-label", `${TEXTE.gesichtsfeld}. ${hinweis}`);
    }

    // Eine Mitte ausserhalb der Grenze der gezeigten Ansicht (z. B. nach einem Zustandswechsel
    // mit kleinerem Objekt oder beim Wechsel vom Zoom zur Uebersicht) zurueckholen.
    const lage = verschiebelage(stand.konfiguration, stand.zoom);
    const m = stand.mitte;
    const soll = sollMitte(m, lage?.durchmesser, lage?.erlaubt ?? false);
    if (soll.xArcsec !== m.xArcsec || soll.yArcsec !== m.yArcsec) steuerung.verschiebe(soll.xArcsec, soll.yArcsec);
  });

  // Ziehen und Pfeiltasten verschieben (A-D2), Klick oder Eingabetaste oeffnet den Zoom (A-D3).
  verbindeBild(canvas, {
    steuerung,
    lage: () => verschiebelage(steuerung.konfiguration, false),
    breitePx: () => canvas.getBoundingClientRect().width,
    wechsle: () => steuerung.zoome(true)
  });
}
