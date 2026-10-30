// Echte Umlaute in den Datentexten, die die Oberflaeche zeigt (Issue #133, CLAUDE.md): Namen der
// Objekte, Zustaende, Sterne und Geraete, hinweis_hilfe, im Bildnachweis mission, instrument,
// aufnahmedatum, bearbeitung und der Bearbeitungsvermerk hinter "; bearbeitet:" in namensnennung.
// Die Credit-Zeile Dritter davor bleibt woertlich und wird nicht geprueft, ebenso die nicht
// angezeigten Felder kommentar und hinweise. Gesucht wird nach Ersatzschreibungen typischer Woerter;
// die Staemme sind so gewaehlt, dass Eigennamen und richtige Schreibungen (Schaefer, Kelaeno,
// Ursae, Masse, Fluss, dass) nicht anschlagen.

import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";

/** Wortteile, die nur als Ersatzschreibung vorkommen (ae, oe, ue, ss statt Umlaut oder sz). */
const ERSATZ_STAEMME = [
  "groess", "flaech", "ausserhalb", "aussen", "ausser", "aeuss", "ueber", "fuer", "hoeh", "gruen", "qualitaet",
  "verhaeltnis", "massstab", "haelfte", "sued", "geprueft", "zurueck", "zusaetz", "saettig", "glaett", "naeher",
  "oeffnung", "veroeffentlich", "bloss", "heiss", "kanaele", "baender", "laeng", "aufloes", "bestaetig",
  "aequator", "hoef", "fluegel", "stuetz", "faellt", "traegt", "enthaelt", "waere", "laege", "schwaech"
] as const;

const MUSTER = new RegExp(ERSATZ_STAEMME.join("|"), "i");

/** Fundstellen eines Texts: die Woerter, die einen Stamm enthalten. */
function ersatzschreibungen(text: string): string[] {
  return text.split(/[^\p{L}]+/u).filter((w) => MUSTER.test(w));
}

interface Fund {
  ort: string;
  woerter: string[];
}

type Roh = Record<string, unknown>;

function sichtbareTexte(): Array<{ ort: string; text: string }> {
  const texte: Array<{ ort: string; text: string }> = [];
  const dazu = (ort: string, text: unknown): void => {
    if (typeof text === "string") texte.push({ ort, text });
  };
  for (const o of objekteJson as unknown as Roh[]) {
    dazu(`objekte.json ${String(o.id)} name`, o.name);
    dazu(`objekte.json ${String(o.id)} hinweis_hilfe`, o.hinweis_hilfe);
    for (const z of (o.zustaende ?? []) as Roh[]) {
      dazu(`objekte.json ${String(z.id)} name`, z.name);
      dazu(`objekte.json ${String(z.id)} hinweis_hilfe`, z.hinweis_hilfe);
      if (Array.isArray(z.sterne)) for (const s of z.sterne as Roh[]) dazu(`objekte.json ${String(z.id)} Stern`, s.name);
    }
  }
  const sternlisten = import.meta.glob("../../daten/sterne/*.json", { import: "default", eager: true }) as Record<string, Roh>;
  for (const [pfad, liste] of Object.entries(sternlisten)) {
    for (const s of (liste.sterne ?? []) as Roh[]) dazu(`${pfad} Stern`, s.name);
  }
  for (const g of geraeteJson as unknown as Roh[]) dazu(`geraete.json ${String(g.id)} name`, g.name);
  for (const b of bilderJson as unknown as Roh[]) {
    for (const feld of ["mission", "instrument", "aufnahmedatum", "bearbeitung"]) dazu(`bilder.json ${String(b.id)} ${feld}`, b[feld]);
    const credit = String(b.namensnennung);
    const ab = credit.indexOf("; bearbeitet:");
    if (ab >= 0) dazu(`bilder.json ${String(b.id)} Bearbeitungsvermerk`, credit.slice(ab));
  }
  return texte;
}

describe("Umlaute in sichtbaren Datentexten (Issue #133)", () => {
  it("das Muster findet typische Ersatzschreibungen", () => {
    for (const w of ["Vergroesserung", "Flaechenhelligkeitsprofil", "ausserhalb", "ueberbelichtet", "Gruenkanal", "Blosses", "Qualitaet", "Suedhaelfte"]) {
      expect(ersatzschreibungen(w), w).toEqual([w]);
    }
  });

  it("das Muster laesst Eigennamen und richtige Schreibungen stehen", () => {
    for (const w of ["Schaefer", "Kelaeno", "Ursae", "Lyrae", "Luftmasse", "Gesamtfluss", "dass", "angepasst", "Israel", "Vergrößerung", "außerhalb", "Ausschnitt"]) {
      expect(ersatzschreibungen(w), w).toEqual([]);
    }
  });

  it("findet sichtbare Texte (Import greift)", () => {
    const texte = sichtbareTexte();
    expect(texte.length).toBeGreaterThan(100);
    expect(texte.some((t) => /[äöüß]/.test(t.text))).toBe(true);
  });

  it("keine Ersatzschreibungen in Namen, Hilfetexten und Bildnachweisen", () => {
    const funde: Fund[] = sichtbareTexte()
      .map((t) => ({ ort: t.ort, woerter: ersatzschreibungen(t.text) }))
      .filter((f) => f.woerter.length > 0);
    expect(funde).toEqual([]);
  });
});
