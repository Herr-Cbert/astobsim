// Gesichtsfeld, Infopanel und Bildnachweis als Beobachter der Steuerung. Heute: Anblick zeichnen,
// sobald ein neuer fertig ist, Kennwerte (A-D4) zur letzten Auswertung, Namensnennung zum
// Quellbild des Zustands. Issue #19 erweitert hier: Verschieben (A-D2), Warnungen (A-D5) im
// Platz warnungen, Form beim blossen Auge (A-D1), WebGL2 mit Anzeigegrenze und Hinweis.

import { findeZustand } from "../daten";
import type { Auswertung } from "../physik";
import { TEXTE } from "../texte";
import { infozeilen, zeigeInfozeilen } from "./infopanel";
import type { Steuerung } from "./steuerung";
import { zeichneAnblick } from "./zeichne";

/** Die Plaetze auf der Seite, die das Gesichtsfeld beschreibt (baut starte). */
export interface GesichtsfeldPlaetze {
  canvas: HTMLCanvasElement;
  info: HTMLElement;
  nachweis: HTMLElement;
  warnungen: HTMLElement;
}

export function baueGesichtsfeld(plaetze: GesichtsfeldPlaetze, steuerung: Steuerung): void {
  let gezeichnet = 0;
  let auswertung: Auswertung | undefined;
  let kennung: string | undefined;
  steuerung.beobachte((stand) => {
    // Die Nummer springt nur mit phase "fertig"; dann gehoert die Auswertung zum Anblick.
    if (stand.anblick !== undefined && stand.nummer !== gezeichnet && stand.auswertung !== undefined) {
      gezeichnet = stand.nummer;
      zeichneAnblick(plaetze.canvas, stand.anblick, stand.auswertung.parameter.gesichtsfeld);
      plaetze.canvas.dataset["rendereMs"] = String(stand.ms);
    }
    if (stand.auswertung !== undefined && stand.auswertung !== auswertung) {
      auswertung = stand.auswertung;
      zeigeInfozeilen(plaetze.info, infozeilen(stand.auswertung.anzeige));
    }
    if (stand.konfiguration.objekt.kennung !== kennung) {
      kennung = stand.konfiguration.objekt.kennung;
      const { objekte, nachweise } = steuerung.kataloge;
      const bild = findeZustand(objekte, kennung)?.zustand.bild;
      const nachweis = nachweise.find((n) => n.id === bild);
      plaetze.nachweis.textContent = nachweis === undefined ? "" : TEXTE.bildnachweis(nachweis.namensnennung, nachweis.lizenz);
    }
  });
}
