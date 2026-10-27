// Gesichtsfeld, Infopanel, Warnungen und Bildnachweis als Beobachter der Steuerung (Issue #19).
// Anblick zeichnen, sobald ein neuer fertig ist (das alte Bild bleibt bis dahin stehen, A-D7);
// Form Kreis oder Rechteck beim blossen Auge (A-D1, Maske aus bild, Rand per CSS); Kennwerte
// (A-D4) und Warnungen (A-D5) zur letzten Auswertung; Namensnennung zum Quellbild des Zustands.
// Verschieben (A-D2) mit Maus (Ziehen) und Pfeiltasten, nur wenn das Objekt groesser als das
// Gesichtsfeld ist; es aendert ueber steuerung.verschiebe nur die Fenstermitte (kein Kernbau,
// keine URL). Grenzen und Richtungen in verschieben.ts.

import { findeZustand } from "../daten";
import { type Auswertung, optik } from "../physik";
import { TEXTE } from "../texte";
import { infozeilen, zeigeInfozeilen } from "./infopanel";
import type { Stand, Steuerung } from "./steuerung";
import { type Mitte, mitteNachTaste, mitteNachZiehen, sollMitte, verschiebbar } from "./verschieben";
import { warnzeilen, zeigeWarnzeilen } from "./warnungen";
import { zeichneAnblick } from "./zeichne";

/** Die Plaetze auf der Seite, die das Gesichtsfeld beschreibt (baut starte). */
export interface GesichtsfeldPlaetze {
  canvas: HTMLCanvasElement;
  info: HTMLElement;
  nachweis: HTMLElement;
  warnungen: HTMLElement;
}

/** Durchmesser des Objekts und Breite des Gesichtsfelds zur Konfiguration; undefined bei unlesbarem Geraet. */
function verschiebeLage(stand: Readonly<Stand>): { durchmesser: number; breite: number; erlaubt: boolean } | undefined {
  try {
    const gesichtsfeld = optik(stand.konfiguration.geraet).gesichtsfeld;
    const durchmesser = stand.konfiguration.objekt.durchmesserArcsec;
    return { durchmesser, breite: gesichtsfeld.breiteArcsec, erlaubt: verschiebbar(durchmesser, gesichtsfeld) };
  } catch {
    return undefined;
  }
}

export function baueGesichtsfeld(plaetze: GesichtsfeldPlaetze, steuerung: Steuerung): void {
  const { canvas } = plaetze;
  let gezeichnet = 0;
  let auswertung: Auswertung | undefined;
  let kennung: string | undefined;
  let erlaubt: boolean | undefined;

  steuerung.beobachte((stand) => {
    // Die Nummer springt nur mit phase "fertig"; dann gehoert die Auswertung zum Anblick.
    if (stand.anblick !== undefined && stand.nummer !== gezeichnet && stand.auswertung !== undefined) {
      gezeichnet = stand.nummer;
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
      const { objekte, nachweise } = steuerung.kataloge;
      const bild = findeZustand(objekte, kennung)?.zustand.bild;
      const nachweis = nachweise.find((n) => n.id === bild);
      plaetze.nachweis.textContent = nachweis === undefined ? "" : TEXTE.bildnachweis(nachweis.namensnennung, nachweis.lizenz);
    }

    // Verschieben an- oder abschalten; eine Mitte ausserhalb der Grenze (z. B. nach einem
    // Zustandswechsel mit kleinerem Objekt) zurueckholen.
    const lage = verschiebeLage(stand);
    const jetzt = lage?.erlaubt ?? false;
    if (jetzt !== erlaubt) {
      erlaubt = jetzt;
      canvas.classList.toggle("verschiebbar", jetzt);
      if (jetzt) {
        canvas.tabIndex = 0;
        canvas.title = TEXTE.gesichtsfeldVerschieben;
        canvas.setAttribute("aria-label", `${TEXTE.gesichtsfeld}. ${TEXTE.gesichtsfeldVerschieben}`);
      } else {
        canvas.removeAttribute("tabindex");
        canvas.removeAttribute("title");
        canvas.setAttribute("aria-label", TEXTE.gesichtsfeld);
      }
    }
    const m = stand.mitte;
    const soll = sollMitte(m, lage?.durchmesser, lage?.erlaubt ?? false);
    if (soll.xArcsec !== m.xArcsec || soll.yArcsec !== m.yArcsec) steuerung.verschiebe(soll.xArcsec, soll.yArcsec);
  });

  // Ziehen: Start merken, jede Bewegung rechnet vom Start aus (verschieben.ts). Die Steuerung
  // fasst mehrere Bewegungen je Frame zu einer Rechnung zusammen.
  let ziehen: { zeiger: number; x: number; y: number; start: Mitte } | undefined;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || verschiebeLage(steuerung.stand)?.erlaubt !== true) return;
    ziehen = { zeiger: e.pointerId, x: e.clientX, y: e.clientY, start: { ...steuerung.stand.mitte } };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("zieht");
    canvas.focus({ preventScroll: true });
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (ziehen === undefined || e.pointerId !== ziehen.zeiger) return;
    // Taste los, ohne dass pointerup ankam (z. B. ausserhalb des Fensters losgelassen): Ziehen endet.
    if (e.buttons === 0) {
      ende(e);
      return;
    }
    const lage = verschiebeLage(steuerung.stand);
    const breitePx = canvas.getBoundingClientRect().width;
    if (lage === undefined || !lage.erlaubt || !(breitePx > 0)) return;
    const m = mitteNachZiehen(ziehen.start, e.clientX - ziehen.x, e.clientY - ziehen.y, lage.breite / breitePx, lage.durchmesser);
    steuerung.verschiebe(m.xArcsec, m.yArcsec);
  });
  function ende(e: PointerEvent): void {
    if (ziehen === undefined || e.pointerId !== ziehen.zeiger) return;
    ziehen = undefined;
    canvas.classList.remove("zieht");
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }
  canvas.addEventListener("pointerup", ende);
  canvas.addEventListener("pointercancel", ende);
  canvas.addEventListener("lostpointercapture", ende);

  canvas.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const lage = verschiebeLage(steuerung.stand);
    if (lage === undefined || !lage.erlaubt) return;
    const m = mitteNachTaste(steuerung.stand.mitte, e.key, e.shiftKey, lage.breite, lage.durchmesser);
    if (m === undefined) return;
    e.preventDefault();
    steuerung.verschiebe(m.xArcsec, m.yArcsec);
  });
}
