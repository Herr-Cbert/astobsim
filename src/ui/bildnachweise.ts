// Bildnachweise im Seitenfuss (A-X4, A-T5, Issue #23): Lizenz des Codes und je Bild aus
// daten/bilder.json Quelle, Lizenz, Credit und Bearbeitung, aufklappbar. Die Credit-Zeile steht
// woertlich wie in bilder.json (Lizenzbedingung, bilder.md 9 Schritt 8). nachweiseImFuss ist rein
// und in Vitest geprueft; baueFuss setzt nur textContent und href (kein innerHTML, CSP aus #22).

import type { Bildnachweis } from "../daten";
import { TEXTE } from "../texte";
import type { Kataloge } from "../zustand";

/** Lizenztext des Codes und Quelltext (A-T5). */
export const REPO_URL = "https://github.com/herr-cbert/astobsim";
export const LIZENZ_URL = `${REPO_URL}/blob/main/LICENSE`;

/** Eine Zeile eines Nachweises: Beschriftung, Text und wahlweise ein Link auf den Text. */
export interface Nachweiszeile {
  beschriftung: string;
  text: string;
  href?: string;
}

/** Ein Bild im Fuss: Ueberschrift (Objekt und Zustaende, die es nutzen) und die Zeilen. */
export interface NachweisImFuss {
  id: string;
  titel: string;
  zeilen: Nachweiszeile[];
}

/**
 * Alle Bilder in der Reihenfolge von bilder.json. Die Ueberschrift nennt das Objekt und die
 * Zustaende, deren Feld bild auf den Nachweis zeigt (Mars 14" und 6" teilen ein Bild); ein Bild
 * ohne Zustand faellt auf objekt und zustand des Nachweises zurueck.
 */
export function nachweiseImFuss(kataloge: Pick<Kataloge, "objekte" | "nachweise">): NachweisImFuss[] {
  const T = TEXTE.fuss;
  return kataloge.nachweise.map((n: Bildnachweis) => {
    const objekt = kataloge.objekte.find((o) => o.id === n.objekt);
    const zustaende = objekt?.zustaende.filter((z) => z.bild === n.id).map((z) => z.name) ?? [];
    const titel = zustaende.length > 0 ? zustaende.join(", ") : `${objekt?.name ?? n.objekt} (${n.zustand})`;
    return {
      id: n.id,
      titel,
      zeilen: [
        { beschriftung: T.aufnahme, text: `${n.mission}, ${n.instrument}, ${n.aufnahmedatum}` },
        { beschriftung: T.credit, text: n.namensnennung },
        { beschriftung: T.lizenz, text: n.lizenz, href: n.lizenzUrl },
        { beschriftung: T.quelle, text: n.quelleUrl, href: n.quelleUrl },
        { beschriftung: T.bearbeitung, text: n.bearbeitung }
      ]
    };
  });
}

/** Link mit rel gegen Opener und Referrer; geoeffnet im selben Tab. */
function link(d: Document, text: string, href: string): HTMLAnchorElement {
  const a = d.createElement("a");
  a.href = href;
  a.rel = "noopener noreferrer";
  a.textContent = text;
  return a;
}

/** Fuellt den Seitenfuss: Lizenzzeile, darunter die Bildnachweise zum Aufklappen. */
export function baueFuss(fuss: HTMLElement, kataloge: Pick<Kataloge, "objekte" | "nachweise">): void {
  const d = fuss.ownerDocument;
  const T = TEXTE.fuss;
  const lizenz = d.createElement("p");
  lizenz.className = "fuss-lizenz";
  lizenz.append(d.createTextNode(T.codeVor), link(d, T.codeLizenz, LIZENZ_URL), d.createTextNode(T.codeMitte), link(d, T.codeQuelle, REPO_URL), d.createTextNode("."));

  const eintraege = nachweiseImFuss(kataloge);
  const details = d.createElement("details");
  details.className = "fuss-nachweise";
  const kopf = d.createElement("summary");
  kopf.textContent = T.bildnachweise(eintraege.length);
  details.append(kopf);
  for (const e of eintraege) {
    const abschnitt = d.createElement("section");
    abschnitt.className = "fuss-bild";
    const titel = d.createElement("h2");
    titel.textContent = e.titel;
    const liste = d.createElement("dl");
    for (const z of e.zeilen) {
      const dt = d.createElement("dt");
      dt.textContent = z.beschriftung;
      const dd = d.createElement("dd");
      if (z.href !== undefined) dd.append(link(d, z.text, z.href));
      else dd.textContent = z.text;
      liste.append(dt, dd);
    }
    abschnitt.append(titel, liste);
    details.append(abschnitt);
  }
  fuss.replaceChildren(lizenz, details);
}
