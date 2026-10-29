// Zoomansicht (A-D3, Issue #20): das Objekt vergroessert, links der Anblick, rechts das Quellbild
// im selben Massstab und Ausschnitt, darunter der Bildnachweis. Beobachter der Steuerung wie das
// Gesichtsfeld; Fenster und Vergleichsbild rechnet die Steuerung (zoom.ts). Die Zoomansicht
// ersetzt das Gesichtsfeld auf der Seite, solange stand.zoom gilt. Zurueck per Klick auf ein
// Bild, Eingabetaste, Escape oder Schaltflaeche; Verschieben (Mond) bewegt beide Bilder gemeinsam,
// weil beide aus derselben Fenstermitte entstehen. Die Schaltflaeche Detail (Issue #77) schaltet
// auf das schmalere Detailfenster, wo zoom.ts es anbietet (Mond), sonst ist sie verborgen.

import type { Objektzustand } from "../naht/konfiguration";
import { TEXTE } from "../texte";
import { nachweistext } from "./gesichtsfeld";
import { hilfesymbol } from "./hilfe";
import type { Steuerung, Zoombilder } from "./steuerung";
import { zeichneAnblick } from "./zeichne";
import { verbindeBild } from "./ziehen";
import { detailbreiteArcsec, VERGLEICH_DEEP_SKY, type Vergleichsabbildung, verschiebelage } from "./zoom";

/** Die Plaetze, die die Zoomansicht braucht: ihr eigenes Element und das Gesichtsfeld, das sie ersetzt. */
export interface ZoomPlaetze {
  /** Leeres Element fuer die Zoomansicht (baut starte, anfangs verborgen). */
  zoom: HTMLElement;
  /** Element der Uebersicht (Gesichtsfeld mit Nachweis und Warnungen), im Zoom verborgen. */
  uebersicht: HTMLElement;
  /** Canvas des Gesichtsfelds: bekommt den Fokus zurueck, wenn der Zoom per Tastatur schliesst. */
  gesichtsfeld: HTMLCanvasElement;
}

/** Was die Zoomansicht aufbaut; starte braucht den Canvas des Anblicks fuer anzeigePx. */
export interface Zoomansicht {
  anblick: HTMLCanvasElement;
  vergleich: HTMLCanvasElement;
}

/**
 * Hilfetext zum Vergleichsbild: bei Objekten ohne Aufnahme (ohne quelle, Issue #109) der Hinweis auf
 * die berechneten idealen Sternpunkte, bei Deep-Sky mit Aufnahme der Text zur Abbildung des
 * Vergleichsbilds (Issue #110, zoom.ts), sonst der Text zum Quellbild.
 */
export function quellbildHilfe(objekt: Objektzustand, abbildung: Vergleichsabbildung = VERGLEICH_DEEP_SKY): string {
  if (objekt.quelle === undefined) return TEXTE.hilfe.quellbildOhneAufnahme;
  return objekt.klasse === "deep_sky" ? TEXTE.hilfe.quellbildDeepSky[abbildung] : TEXTE.hilfe.quellbild;
}

/** Ein Bild der Zoomansicht: Beschriftung mit Hilfesymbol ueber dem Canvas. */
function baueBild(d: Document, titel: string, hilfe: string, hilfeId: string, bildtext: string): { huelle: HTMLElement; canvas: HTMLCanvasElement } {
  const huelle = d.createElement("div");
  huelle.className = "zoom-bild";
  const kopf = d.createElement("div");
  kopf.className = "zoom-beschriftung";
  const name = d.createElement("span");
  name.textContent = titel;
  kopf.append(name, hilfesymbol(d, hilfeId, hilfe, titel));
  const canvas = d.createElement("canvas");
  canvas.className = "zoom-canvas";
  // Klickbar (zurueck zur Uebersicht): Schaltflaeche, die Beschriftung nennt Bild und Bedienung.
  canvas.setAttribute("role", "button");
  canvas.setAttribute("aria-label", bildtext);
  canvas.tabIndex = 0;
  huelle.append(kopf, canvas);
  return { huelle, canvas };
}

export function baueZoomansicht(plaetze: ZoomPlaetze, steuerung: Steuerung): Zoomansicht {
  const { zoom: wurzel, uebersicht } = plaetze;
  const d = wurzel.ownerDocument;
  wurzel.classList.add("zoom");
  wurzel.setAttribute("aria-label", TEXTE.zoom.ueberschrift);
  wurzel.hidden = true;

  const kopf = d.createElement("div");
  kopf.className = "zoom-kopf";
  const zurueck = d.createElement("button");
  zurueck.type = "button";
  zurueck.className = "zoom-zurueck";
  zurueck.textContent = TEXTE.zoom.zurueck;
  const detail = d.createElement("button");
  detail.type = "button";
  detail.className = "zoom-detail";
  detail.textContent = TEXTE.zoom.detail;
  detail.title = TEXTE.zoom.detailTitel;
  detail.setAttribute("aria-pressed", "false");
  detail.hidden = true;
  detail.addEventListener("click", () => steuerung.zeigeDetail(!steuerung.stand.detail));
  const norden = d.createElement("span");
  norden.className = "norden";
  norden.textContent = TEXTE.nordenOben;
  kopf.append(zurueck, detail, norden);

  const a = baueBild(d, TEXTE.zoom.anblick, TEXTE.hilfe.anblick, "hilfe-zoom-anblick", TEXTE.zoom.anblickBild);
  const v = baueBild(d, TEXTE.zoom.quellbild, TEXTE.hilfe.quellbild, "hilfe-zoom-quellbild", TEXTE.zoom.quellbildBild);
  const nachweis = d.createElement("p");
  nachweis.className = "nachweis";
  v.huelle.append(nachweis);
  const bilder = d.createElement("div");
  bilder.className = "zoom-bilder";
  bilder.append(a.huelle, v.huelle);
  wurzel.replaceChildren(kopf, bilder);

  /** Schliesst den Zoom; stand der Fokus in der Zoomansicht, geht er zurueck aufs Gesichtsfeld. */
  const schliesse = (): void => {
    const fokusDrin = wurzel.contains(d.activeElement);
    steuerung.zoome(false);
    if (fokusDrin) plaetze.gesichtsfeld.focus({ preventScroll: true });
  };
  zurueck.addEventListener("click", schliesse);
  d.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !steuerung.stand.zoom || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    schliesse();
  });
  for (const canvas of [a.canvas, v.canvas]) {
    verbindeBild(canvas, {
      steuerung,
      lage: () => verschiebelage(steuerung.konfiguration, true, steuerung.stand.detail),
      breitePx: () => canvas.getBoundingClientRect().width,
      wechsle: schliesse
    });
  }

  let gezeichnet: Zoombilder | undefined;
  let kennung: string | undefined;
  let offen = false;
  let erlaubt: boolean | undefined;
  steuerung.beobachte((stand) => {
    if (stand.zoom !== offen) {
      offen = stand.zoom;
      // Fokus vom Gesichtsfeld (Eingabetaste) in den Zoom mitnehmen, sonst laege er auf einem verborgenen Element.
      const vomGesichtsfeld = d.activeElement === plaetze.gesichtsfeld;
      wurzel.hidden = !offen;
      uebersicht.hidden = offen;
      if (offen && vomGesichtsfeld) a.canvas.focus({ preventScroll: true });
    }
    const zb = stand.zoombilder;
    if (zb === undefined && gezeichnet !== undefined) {
      // Objekt oder Geraet gewechselt: leere Bilder statt des alten Objekts neben dem neuen Nachweis.
      gezeichnet = undefined;
      for (const canvas of [a.canvas, v.canvas]) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (zb !== undefined && zb !== gezeichnet && stand.auswertung !== undefined) {
      gezeichnet = zb;
      zeichneAnblick(a.canvas, zb.anblick, stand.auswertung.parameter.gesichtsfeld);
      zeichneAnblick(v.canvas, zb.vergleich, stand.auswertung.parameter.gesichtsfeld);
      a.canvas.dataset["nummer"] = String(stand.nummer);
      a.canvas.dataset["rendereMs"] = String(stand.ms);
    }
    if (stand.konfiguration.objekt.kennung !== kennung) {
      kennung = stand.konfiguration.objekt.kennung;
      nachweis.textContent = nachweistext(steuerung.kataloge, kennung);
      const tip = v.huelle.querySelector(".hilfe-text");
      if (tip !== null) tip.textContent = quellbildHilfe(stand.konfiguration.objekt);
    }
    let angeboten = false;
    try {
      angeboten = detailbreiteArcsec(stand.konfiguration) !== undefined;
    } catch {
      // Unlesbares Geraet: kein Detail; den Fehler zeigt die Rechnung.
    }
    detail.hidden = !angeboten;
    detail.setAttribute("aria-pressed", String(angeboten && stand.detail));
    const jetzt = verschiebelage(stand.konfiguration, true, stand.detail)?.erlaubt ?? false;
    if (jetzt !== erlaubt) {
      erlaubt = jetzt;
      const hinweis = jetzt ? TEXTE.zoom.bedienungVerschieben : TEXTE.zoom.bedienung;
      for (const [canvas, text] of [
        [a.canvas, TEXTE.zoom.anblickBild],
        [v.canvas, TEXTE.zoom.quellbildBild]
      ] as const) {
        canvas.classList.toggle("verschiebbar", jetzt);
        canvas.title = hinweis;
        canvas.setAttribute("aria-label", `${text}. ${hinweis}`);
      }
    }
  });

  return { anblick: a.canvas, vergleich: v.canvas };
}
