// Infopanel neben dem Gesichtsfeld (A-D4): Vergroesserung, wahres Gesichtsfeld, Austrittspupille,
// Beugungsgrenze (Rayleigh, Dawes), Seeing am Objekt, Augengrenze und die dominante Grenze.
// Version 2 (Issue #110, docs/architektur.md 5.3 und 5.5): Grenzgroesse (A-P11), bei Deep-Sky die
// sichtbare Isophote und Ausdehnung oder "unter der Schwelle"; darunter Hinweise als Saetze:
// unaufgeloest ab einem Mischgewicht (A-P10), Sterne unter der Grenzgroesse (grund "unter_schwelle"),
// Ueberstrahlung (A-Z9) und die Grenze grober Quellbilder (A-X11).
// Die Werte rechnet physik (Anzeigewerte und Warnungen aus auswerten); hier wird nur beschriftet,
// formatiert und entschieden, welcher Hinweis erscheint.

import type { Konfiguration } from "../naht/konfiguration";
import {
  arbeitsmassstabOhneFenster,
  type Anzeigewerte,
  atmosphaere,
  type Auswertung,
  bortleMagProArcsec2,
  optik,
  sichtbareIsophote
} from "../physik";
import { TEXTE } from "../texte";
import { zahl } from "./format";
import { hilfesymbol } from "./hilfe";

export interface Infozeile {
  beschriftung: string;
  wert: string;
  /** Hilfetext zur Zahl (A-D6, TEXTE.hilfe.anzeige aus #18); gesetzt, erscheint ein Infosymbol. */
  hilfe?: string;
}

const E = TEXTE.einheiten;

/** Bogensekunden mit zwei Nachkommastellen, z. B. 1,73 mit dem Bogensekundenzeichen aus TEXTE.einheiten. */
function bogensekunden(wert: number): string {
  return `${zahl(wert, 2)}${E.bogensekunde}`;
}

/** Austrittspupille ohne Einheit: unter 1 mm zwei Nachkommastellen (0,45 nicht als 0,5), sonst eine. */
export function austrittspupille(mm: number): string {
  return zahl(mm, apStellen(mm));
}

/** Stellen der Austrittspupille, gewaehlt am gerundeten Wert (0,996 wird 1,0, nicht 1,00). */
export function apStellen(mm: number): number {
  return Number(mm.toFixed(2)) < 1 ? 2 : 1;
}

/**
 * Winkel fuer die Ausdehnung: unter 1' in Bogensekunden, unter 1 Grad in Bogenminuten (unter 10'
 * mit einer Stelle), sonst in Grad mit einer Stelle.
 */
export function winkel(arcsec: number): string {
  if (arcsec < 60) return `${zahl(arcsec, 0)}${E.bogensekunde}`;
  const bogenminuten = arcsec / 60;
  if (bogenminuten < 60) return `${zahl(bogenminuten, bogenminuten < 10 ? 1 : 0)}${E.bogenminute}`;
  return `${zahl(bogenminuten / 60, 1)}${E.grad}`;
}

/** Durchmesser des Kreises mit der Flaeche flaecheArcsec2 (Ausdehnung der sichtbaren Isophote). */
export function kreisdurchmesserArcsec(flaecheArcsec2: number): number {
  return 2 * Math.sqrt(flaecheArcsec2 / Math.PI);
}

/**
 * Liegt bei Deep-Sky kein Teil des Objekts ueber der Schwelle? Anzeigewerte.isophote traegt das
 * Verhaeltnis C/C_th nicht; es kommt aus sichtbareIsophote mit denselben Eingaben wie in auswerten
 * (helligkeitUndIsophote). Verhaeltnis unter 1 heisst: auch die guenstigste Isophote liegt unter der
 * Schwelle (schwelle.ts). undefined ohne Flaechentabelle.
 */
export function unterDerSchwelle(k: Konfiguration): boolean | undefined {
  const isophoten = k.objekt.isophoten;
  if (k.objekt.klasse !== "deep_sky" || k.objekt.quelle === undefined || isophoten === undefined || isophoten.length === 0) return undefined;
  return sichtbareIsophote(isophoten, optik(k.geraet), atmosphaere(k.bedingungen), bortleMagProArcsec2(k.bedingungen.bortle)).verhaeltnis < 1;
}

/**
 * Die Zeilen des Infopanels in fester Reihenfolge: die Kennwerte aus Version 1, die Grenzgroesse und
 * bei Deep-Sky mit Flaechentabelle die sichtbare Isophote mit Ausdehnung oder "unter der Schwelle".
 * k ist die Konfiguration, aus der die Auswertung entstand; bei Doppelsternen nennt der Hilfetext
 * zum Seeing das Langzeitmittel.
 */
export function infozeilen(anzeige: Anzeigewerte, k?: Konfiguration): Infozeile[] {
  const a = anzeige.aufloesung;
  const gf = anzeige.wahresGesichtsfeldGrad;
  const I = TEXTE.info;
  const H = TEXTE.hilfe.anzeige;
  const zeilen: Infozeile[] = [
    { beschriftung: I.vergroesserung, wert: `${zahl(anzeige.vergroesserung, 0)}${E.fach}`, hilfe: H.vergroesserung },
    { beschriftung: I.wahresGesichtsfeld, wert: `${zahl(gf, 2)}${E.grad} (${zahl(gf * 60, 0)}${E.bogenminute})`, hilfe: H.wahresGesichtsfeld },
    { beschriftung: I.austrittspupille, wert: `${austrittspupille(anzeige.austrittspupilleMm)} ${E.mm}`, hilfe: H.austrittspupille },
    { beschriftung: I.rayleigh, wert: bogensekunden(a.rayleighArcsec), hilfe: H.rayleigh },
    { beschriftung: I.dawes, wert: bogensekunden(a.dawesArcsec), hilfe: H.dawes },
    {
      beschriftung: I.seeing,
      wert: bogensekunden(a.seeingFwhmArcsec),
      hilfe: k?.objekt.klasse === "doppelstern" ? `${H.seeing} ${H.seeingPaare}` : H.seeing
    },
    { beschriftung: I.auge, wert: bogensekunden(a.augeFwhmArcsec), hilfe: H.auge },
    { beschriftung: I.dominant, wert: TEXTE.grenzen[a.dominant], hilfe: H.dominant },
    { beschriftung: I.grenzgroesse, wert: `${zahl(anzeige.grenzgroesseMag, 1)} ${E.mag}`, hilfe: H.grenzgroesse }
  ];
  const iso = anzeige.isophote;
  if (iso !== undefined) {
    if (k !== undefined && unterDerSchwelle(k) === true) {
      zeilen.push({ beschriftung: I.isophote, wert: I.unterSchwelle, hilfe: H.isophote });
    } else {
      const mu = `${zahl(iso.magProArcsec2, 1)} ${E.magProBogensekunde2}`;
      const d = winkel(kreisdurchmesserArcsec(iso.flaecheArcsec2));
      zeilen.push(
        { beschriftung: I.isophote, wert: iso.alleSichtbar ? I.isophoteOderSchwaecher(mu) : mu, hilfe: H.isophote },
        { beschriftung: I.ausdehnung, wert: iso.alleSichtbar ? I.ausdehnungMindestens(d) : I.ausdehnungEtwa(d), hilfe: H.ausdehnung }
      );
    }
  }
  return zeilen;
}

/** Ein Satz unter den Kennwerten mit Infosymbol (Issue #110). */
export interface Infohinweis {
  art: "unaufgeloest" | "unter-grenzgroesse" | "ueberstrahlung" | "quellbild-grenze";
  text: string;
  hilfe: string;
  /** Thema fuer die Beschriftung des Infosymbols ("Hilfe zu ..."). */
  thema: string;
}

/**
 * Ab diesem Mischgewicht heisst ein Zustand im Infopanel "unaufgeloest": die Punktebene ueberwiegt
 * die Flaeche. g' = 0,5 liegt bei x = theta V / 60'' = 1,69 (mischung.ts, g = 1/(1 + 0,3466 x^2)
 * vor dem Schnitt), also bei einer scheinbaren Groesse von etwa 1,7'. Jupiter 47'' mit blossem Auge
 * (x = 0,78, g' = 0,82) ist unaufgeloest, im 10x50 (x = 7,8, g' = 0,04) nicht.
 */
export const MISCHGEWICHT_UNAUFGELOEST = 0.5;

/** Hoechstens so viele Sternnamen nennt der Hinweis zu Sternen unter der Grenzgroesse, sonst die Anzahl. */
export const NAMEN_MAX = 3;

/**
 * Die Hinweise zur Auswertung aus der Konfiguration k in fester Reihenfolge: unaufgeloest,
 * Punktquellen unter der Grenzgroesse, Ueberstrahlung je Paar, Grenze des Quellbilds.
 *
 * Unter der Grenzgroesse: Trabanten und Sterne mit Magnitude ueber der Grenzgroesse, ohne die
 * geblendeten (grund "blendung", die erklaert die Blendungsregel); dazu gehoeren alle mit grund
 * "unter_schwelle" (5 mag unter der Grenzgroesse) und die blass gezeigten dazwischen.
 *
 * Grenze des Quellbilds (A-X11): wenn der Quellmassstab den Arbeitsmassstab bestimmt, also groeber ist
 * als Gesamt-FWHM / 2,5 (arbeitsmassstabOhneFenster, ADR-0002); dann zeigt der Anblick die Pixel der
 * Aufnahme und nicht die Aufloesung von Fernrohr, Luft und Auge. Haengt nur am Massstab im Quellbild,
 * nicht am Objekt.
 */
export function infohinweise(auswertung: Auswertung, k: Konfiguration): Infohinweis[] {
  const I = TEXTE.info;
  const H = TEXTE.hilfe.hinweis;
  const { anzeige, warnungen, parameter } = auswertung;
  const hinweise: Infohinweis[] = [];
  // Doppelsterne nennen ihre Sterne nur mit dem Buchstaben der Komponente; im Satz "Stern B".
  const name = (n: string): string => (k.objekt.klasse === "doppelstern" ? I.komponente(n) : n);

  const g = anzeige.mischgewicht;
  if (g !== undefined && g >= MISCHGEWICHT_UNAUFGELOEST) {
    const scheinbar = winkel(k.objekt.durchmesserArcsec * anzeige.vergroesserung);
    hinweise.push({ art: "unaufgeloest", text: I.unaufgeloest(`${zahl(anzeige.vergroesserung, 0)}${E.fach}`, scheinbar), hilfe: H.unaufgeloest, thema: I.unaufgeloestThema });
  }

  // punktquellen liefert erst die Trabanten, dann die Sterne, je in Listenreihenfolge (punktquellen.ts).
  const quellen = [...k.objekt.trabanten, ...k.objekt.sterne];
  const punkte = parameter.quellbild.punkte.punktquellen;
  const schwach = quellen.filter((q, i) => punkte[i]?.grund !== "blendung" && q.magnitude > anzeige.grenzgroesseMag).map((q) => name(q.name));
  if (schwach.length > 0) {
    // Trabanten (hoechstens vier) immer mit Namen; die Anzahl nur bei Sternen (M45: 44 Sterne).
    const namen = schwach.length <= NAMEN_MAX || k.objekt.sterne.length === 0;
    const text = namen ? I.unterGrenzgroesseNamen(schwach) : I.unterGrenzgroesseAnzahl(schwach.length, quellen.length);
    hinweise.push({ art: "unter-grenzgroesse", text, hilfe: H.unterSchwelle, thema: I.unterGrenzgroesseThema });
  }

  for (const w of warnungen) {
    if (w.art !== "ueberstrahlung" || w.sterne === undefined) continue;
    hinweise.push({ art: "ueberstrahlung", text: I.ueberstrahlung(name(w.sterne[0]), name(w.sterne[1]), zahl(w.wert, 1)), hilfe: H.ueberstrahlung, thema: I.ueberstrahlungThema });
  }

  const quelle = k.objekt.quelle;
  if (quelle !== undefined && arbeitsmassstabOhneFenster(anzeige.aufloesung, quelle) > arbeitsmassstabOhneFenster(anzeige.aufloesung, undefined)) {
    const m = quelle.massstabArcsecProPx;
    hinweise.push({
      art: "quellbild-grenze",
      text: I.quellbildGrenze(`${zahl(m, m < 1 ? 2 : 1)}${E.bogensekunde}`),
      hilfe: H.quellbildGrenze,
      thema: I.quellbildGrenzeThema
    });
  }
  return hinweise;
}

/**
 * Schreibt die Zeilen als Definitionsliste und darunter die Hinweise als Liste in das Element.
 * Haben die Zeilen dieselben Beschriftungen und Hilfetexte wie die angezeigten, werden nur die
 * Werte ersetzt: ein offener Tooltip bleibt beim Reglerzug stehen. Sonst wird die Liste neu gebaut.
 * Fuer die Hinweise gilt dasselbe mit Art und Hilfetext (der Text des Hinweises aendert sich mit
 * der Vergroesserung).
 */
export function zeigeInfozeilen(element: HTMLElement, zeilen: readonly Infozeile[], hinweise: readonly Infohinweis[] = []): void {
  const liste = zeigeListe(element, zeilen);
  zeigeHinweise(element, liste, hinweise);
}

function zeigeListe(element: HTMLElement, zeilen: readonly Infozeile[]): HTMLElement {
  const dokument = element.ownerDocument;
  const form = JSON.stringify(zeilen.map((z) => [z.beschriftung, z.hilfe ?? null]));
  const vorhanden = element.querySelector<HTMLElement>(":scope > dl.info-liste");
  if (vorhanden !== null && vorhanden.dataset["form"] === form) {
    const werte = vorhanden.querySelectorAll(":scope > dd");
    zeilen.forEach((z, i) => {
      const dd = werte[i];
      if (dd !== undefined && dd.textContent !== z.wert) dd.textContent = z.wert;
    });
    return vorhanden;
  }
  const liste = dokument.createElement("dl");
  liste.className = "info-liste";
  liste.dataset["form"] = form;
  zeilen.forEach((z, i) => {
    const dt = dokument.createElement("dt");
    dt.textContent = z.beschriftung;
    if (z.hilfe !== undefined) dt.append(" ", hilfesymbol(dokument, `info-hilfe-${i}`, z.hilfe, z.beschriftung));
    const dd = dokument.createElement("dd");
    dd.textContent = z.wert;
    liste.append(dt, dd);
  });
  if (vorhanden !== null) vorhanden.replaceWith(liste);
  else element.prepend(liste);
  return liste;
}

function zeigeHinweise(element: HTMLElement, liste: HTMLElement, hinweise: readonly Infohinweis[]): void {
  const dokument = element.ownerDocument;
  const vorhanden = element.querySelector<HTMLElement>(":scope > ul.info-hinweise");
  // Alles ausser der Definitionsliste und den Hinweisen entfernen (frueherer Inhalt des Elements).
  for (const kind of Array.from(element.children)) if (kind !== liste && kind !== vorhanden) kind.remove();
  if (hinweise.length === 0) {
    vorhanden?.remove();
    return;
  }
  const form = JSON.stringify(hinweise.map((h) => [h.art, h.hilfe]));
  if (vorhanden !== null && vorhanden.dataset["form"] === form) {
    const texte = vorhanden.querySelectorAll(":scope > li > .info-hinweis-text");
    hinweise.forEach((h, i) => {
      const t = texte[i];
      if (t !== undefined && t.textContent !== h.text) t.textContent = h.text;
    });
    return;
  }
  const ul = dokument.createElement("ul");
  ul.className = "info-hinweise";
  ul.dataset["form"] = form;
  ul.setAttribute("aria-label", TEXTE.info.hinweise);
  hinweise.forEach((h, i) => {
    const li = dokument.createElement("li");
    li.className = "info-hinweis";
    li.dataset["art"] = h.art;
    const text = dokument.createElement("span");
    text.className = "info-hinweis-text";
    text.textContent = h.text;
    li.append(text, " ", hilfesymbol(dokument, `info-hinweis-${i}`, h.hilfe, h.thema));
    ul.append(li);
  });
  if (vorhanden !== null) vorhanden.replaceWith(ul);
  else liste.after(ul);
}
