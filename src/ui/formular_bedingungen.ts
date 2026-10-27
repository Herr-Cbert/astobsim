// Formular Bedingungen (A-B1 bis A-B4): Seeing, Bortle, Transparenz, Hoehe.
// starte ruft baueFormularBedingungen(platz, steuerung) einmal nach dem Laden der Daten auf. Das
// Formular liest die Werte aus steuerung.konfiguration, haengt sich mit steuerung.beobachte an
// Aenderungen von aussen und meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die
// URL, rechnet neu). Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts.
// Wortstufe, Pickering, Himmelshelligkeit und Luftmasse rechnet physik; hier wird nur beschriftet.

import {
  type Bedingungen,
  bortleMagProArcsec2,
  GRENZEN,
  type Konfiguration,
  luftmasse,
  seeingstufe,
  type Transparenz,
  TRANSPARENZEN
} from "../physik";
import { TEXTE } from "../texte";
import { auswahl, type Regler, regler } from "./feld";
import { zahl } from "./format";
import type { Steuerung } from "./steuerung";

const T = TEXTE.bedingungen;

/** Nachkommastellen der Felder; die Eingabe wird darauf gerundet (Seeing in Schritten von 0,1, A-B1). */
const STELLEN = { seeing: 1, bortle: 0, hoehe: 0 } as const;

/** wert auf stellen Nachkommastellen gerundet, ohne Gleitkommareste (2,3 statt 2,3000000000000003). */
export function rundeAuf(wert: number, stellen: number): number {
  const faktor = 10 ** stellen;
  return Math.round(wert * faktor) / faktor;
}

/**
 * Eingabe auf die Feldstellen gerundet, wenn der gerundete Wert in [min, max] liegt; sonst
 * ungerundet, damit begrenze die echte Eingabe schneidet und im Hinweis meldet.
 */
export function rundeImBereich(wert: number, stellen: number, grenze: { min: number; max: number }): number {
  const gerundet = rundeAuf(wert, stellen);
  return gerundet >= grenze.min && gerundet <= grenze.max ? gerundet : wert;
}

/**
 * Bedingungen auf das Raster der Felder gerundet (Seeing 0,1, Bortle und Hoehe 1). Ein Link kann
 * Zwischenwerte tragen (?s=1.25&h=45.5); ohne Rundung zeigten die Felder 1,3 und 46, waehrend
 * Rechnung, URL und Luftmasse 1,25 und 45,5 nutzten.
 */
export function aufRaster(b: Bedingungen): Bedingungen {
  return {
    ...b,
    seeingFwhmArcsec: rundeImBereich(b.seeingFwhmArcsec, STELLEN.seeing, GRENZEN.seeingFwhmArcsec),
    bortle: rundeImBereich(b.bortle, STELLEN.bortle, GRENZEN.bortle),
    hoeheGrad: rundeImBereich(b.hoeheGrad, STELLEN.hoehe, GRENZEN.hoeheGrad)
  };
}

/** Kopie von k mit geaenderten Bedingungen. */
export function mitBedingungen(k: Konfiguration, teil: Partial<Bedingungen>): Konfiguration {
  return { ...k, bedingungen: { ...k.bedingungen, ...teil } };
}

/** Anzeige neben dem Seeing: Wortstufe und Pickering-Bereich aus physik (A-B1). */
export function seeinganzeige(fwhmZenitArcsec: number): string {
  const s = seeingstufe(fwhmZenitArcsec);
  return T.seeingstufe(T.wortstufen[s.wortstufe], s.pickeringVon, s.pickeringBis);
}

/** Anzeige neben dem Bortle-Regler: Kurzbeschreibung und Himmelshelligkeit; leer ausserhalb 1 bis 9. */
export function bortleanzeige(bortle: number): string {
  const beschreibung = Number.isInteger(bortle) ? T.bortleStufen[bortle - 1] : undefined;
  if (beschreibung === undefined) return "";
  return T.bortleStufe(beschreibung, zahl(bortleMagProArcsec2(bortle), 1));
}

/** Anzeige neben der Hoehe: Luftmasse aus physik (A-B4). */
export function luftmasseanzeige(hoeheGrad: number): string {
  return T.luftmasse(zahl(luftmasse(hoeheGrad), 2));
}

export function istTransparenz(wert: string): wert is Transparenz {
  return (TRANSPARENZEN as readonly string[]).includes(wert);
}

/** Zeile unter dem Regler fuer die abgeleitete Anzeige; der Regler verweist per aria-describedby darauf. */
function anzeigezeile(d: Document, feld: Regler, id: string): HTMLElement {
  const zeile = d.createElement("p");
  zeile.className = "feld-anzeige";
  zeile.id = id;
  feld.element.querySelector(".feld-zeile")?.after(zeile);
  feld.regler.setAttribute("aria-describedby", id);
  return zeile;
}

/**
 * Gleicht ein Feld mit der Konfiguration ab, wenn sich der Wert von aussen geaendert hat. Nur
 * ein neuer Wert ersetzt den Text: so bleiben der Hinweis bei geschnittenen Werten und eine
 * angefangene Eingabe stehen, wenn der Stand nur wegen der Rechnung neu gemeldet wird.
 */
function abgleich(feld: Regler, stellen: number, start: number): (wert: number) => void {
  let bekannt = start;
  return (wert) => {
    if (wert === bekannt) return;
    bekannt = wert;
    if (feld.eingabe.value !== zahl(wert, stellen)) feld.setzeWert(wert);
  };
}

export function baueFormularBedingungen(platz: HTMLElement, steuerung: Steuerung): void {
  const d = platz.ownerDocument;
  const H = TEXTE.hilfe;
  const E = TEXTE.einheiten;
  // Startwerte aus einem Link einmal aufs Raster der Felder bringen (Rechnung, URL und Anzeige gleich).
  const roh = steuerung.konfiguration.bedingungen;
  const gerastert = aufRaster(roh);
  if (JSON.stringify(gerastert) !== JSON.stringify(roh)) steuerung.aendere(mitBedingungen(steuerung.konfiguration, gerastert));
  const start = steuerung.konfiguration.bedingungen;
  const aendere = (teil: Partial<Bedingungen>) => steuerung.aendere(mitBedingungen(steuerung.konfiguration, teil));

  const ueberschrift = d.createElement("h2");
  ueberschrift.className = "formular-ueberschrift";
  ueberschrift.textContent = T.ueberschrift;

  const g = GRENZEN;
  const seeing = regler(d, {
    id: "bedingungen-seeing",
    feld: g.seeingFwhmArcsec.feld,
    beschriftung: T.seeing,
    hilfe: H.seeing,
    einheit: E.bogensekunde,
    min: g.seeingFwhmArcsec.min,
    max: g.seeingFwhmArcsec.max,
    schritt: 0.1,
    stellen: STELLEN.seeing,
    wert: start.seeingFwhmArcsec,
    beiAenderung: (wert) => aendere({ seeingFwhmArcsec: rundeImBereich(wert, STELLEN.seeing, g.seeingFwhmArcsec) })
  });
  const seeingStufe = anzeigezeile(d, seeing, "bedingungen-seeing-stufe");

  const bortle = regler(d, {
    id: "bedingungen-bortle",
    feld: g.bortle.feld,
    beschriftung: T.bortle,
    hilfe: H.bortle,
    min: g.bortle.min,
    max: g.bortle.max,
    schritt: 1,
    stellen: STELLEN.bortle,
    wert: start.bortle,
    // Gerundet, bevor begrenze schneidet: sonst meldet begrenze das Runden von 4,6 auf 5 als Schnitt.
    beiAenderung: (wert) => aendere({ bortle: rundeImBereich(wert, STELLEN.bortle, g.bortle) })
  });
  const bortleStufe = anzeigezeile(d, bortle, "bedingungen-bortle-stufe");

  const transparenz = auswahl(d, {
    id: "bedingungen-transparenz",
    beschriftung: T.transparenz,
    hilfe: H.transparenz,
    gruppen: [{ optionen: TRANSPARENZEN.map((t) => ({ wert: t, text: T.transparenzen[t] })) }],
    wert: start.transparenz,
    beiAenderung: (wert) => {
      if (istTransparenz(wert)) aendere({ transparenz: wert });
    }
  });

  const hoehe = regler(d, {
    id: "bedingungen-hoehe",
    feld: g.hoeheGrad.feld,
    beschriftung: T.hoehe,
    hilfe: H.hoehe,
    einheit: E.grad,
    min: g.hoeheGrad.min,
    max: g.hoeheGrad.max,
    schritt: 1,
    stellen: STELLEN.hoehe,
    wert: start.hoeheGrad,
    beiAenderung: (wert) => aendere({ hoeheGrad: rundeImBereich(wert, STELLEN.hoehe, g.hoeheGrad) })
  });
  const hoeheLuftmasse = anzeigezeile(d, hoehe, "bedingungen-hoehe-luftmasse");

  platz.replaceChildren(ueberschrift, seeing.element, bortle.element, transparenz.element, hoehe.element);

  const seeingAbgleich = abgleich(seeing, STELLEN.seeing, start.seeingFwhmArcsec);
  const bortleAbgleich = abgleich(bortle, STELLEN.bortle, start.bortle);
  const hoeheAbgleich = abgleich(hoehe, STELLEN.hoehe, start.hoeheGrad);
  steuerung.beobachte((stand) => {
    const b = stand.konfiguration.bedingungen;
    seeingAbgleich(b.seeingFwhmArcsec);
    bortleAbgleich(b.bortle);
    hoeheAbgleich(b.hoeheGrad);
    if (transparenz.auswahl.value !== b.transparenz) transparenz.setzeWert(b.transparenz);
    seeingStufe.textContent = seeinganzeige(b.seeingFwhmArcsec);
    bortleStufe.textContent = bortleanzeige(b.bortle);
    hoeheLuftmasse.textContent = luftmasseanzeige(b.hoeheGrad);
  });
}
