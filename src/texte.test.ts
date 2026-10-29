import { describe, expect, it } from "vitest";
import { TEXTE } from "./texte";

describe("bildnachweis", () => {
  it("trennt Namensnennung und Lizenz mit einem Punkt", () => {
    expect(TEXTE.bildnachweis("NASA; bearbeitet: skaliert", "CC-BY-4.0")).toBe("Bild: NASA; bearbeitet: skaliert. Lizenz: CC-BY-4.0.");
    expect(TEXTE.bildnachweis("Producer: James Tralie (eMITS).", "Public Domain")).toBe("Bild: Producer: James Tralie (eMITS). Lizenz: Public Domain.");
  });
});

/** Alle Zeichenketten unter wurzel, mit Pfad (Funktionen werden nicht aufgerufen). */
function texte(wurzel: unknown, pfad = ""): [string, string][] {
  if (typeof wurzel === "string") return [[pfad, wurzel]];
  if (wurzel === null || typeof wurzel !== "object") return [];
  return Object.entries(wurzel).flatMap(([k, v]) => texte(v, pfad === "" ? k : `${pfad}.${k}`));
}

describe("Hilfetexte Version 2 (Issue #110)", () => {
  const H = TEXTE.hilfe;

  it("jeder Hilfetext ist ein ganzer Satz mit Punkt am Ende, ohne Ersatzschreibung fuer Umlaute", () => {
    const alle = texte(H).filter(([pfad]) => pfad !== "symbol");
    expect(alle.length).toBeGreaterThan(25);
    for (const [pfad, text] of alle) {
      if (pfad === "beschriftung") continue;
      expect(text, pfad).toMatch(/\.$/);
      // Typische ASCII-Ersatzschreibungen aus Bezeichnern duerfen nicht in die Oberflaeche (CLAUDE.md).
      expect(text, pfad).not.toMatch(/\b(fuer|ueber|groesse|Groesse|Oeffnung|Vergroesserung|schwaecher|heisst)\b/);
    }
  });

  it("Bortle ohne den Satz zur vollen Wirkung (A-B2 V2), mit Grenzgroesse und Isophote", () => {
    expect(H.bortle).not.toContain("volle Wirkung");
    expect(H.bortle).not.toContain("In dieser Version");
    expect(H.bortle).toContain("Wahrnehmungsschwelle");
    expect(H.bortle).toContain("Grenzgröße");
    expect(H.bortle).toContain("sichtbare Isophote");
  });

  it("Beobachtermodell mit Feldfaktor 1,4 im Hilfetext der Grenzgroesse; Isophote verweist darauf", () => {
    expect(H.anzeige.grenzgroesse).toContain("Feldfaktor 1,4");
    expect(H.anzeige.grenzgroesse).toContain("1 mag mehr");
    expect(H.anzeige.isophote).toContain("Beobachter");
    expect(H.anzeige.isophote).toContain("„Unter der Schwelle“");
  });

  it("Seeing als Langzeitmittel bei engen Paaren im Formular und im Infopanel (Entscheidung 3)", () => {
    for (const text of [H.seeing, H.anzeige.seeingPaare]) {
      expect(text).toContain("Doppelsternen");
      expect(text).toContain("ruhigen Momenten");
      expect(text).toContain("0,5″");
    }
  });

  it("Hinweise: grund unter_schwelle, Ueberstrahlung und grobe Quellbilder allgemein, ohne Objektnamen (A-X11)", () => {
    expect(H.hinweis.unterSchwelle).toContain("5 mag unter der Grenzgröße");
    expect(H.hinweis.ueberstrahlung).toContain("4 mag");
    expect(H.hinweis.quellbildGrenze).toContain("Grenze von astobsim");
    for (const text of [H.hinweis.quellbildGrenze, TEXTE.info.quellbildGrenze("4,0″")]) expect(text).not.toMatch(/M ?31|M ?42|Andromeda/);
  });

  it("Saetze des Infopanels setzen die Werte ein", () => {
    const I = TEXTE.info;
    expect(I.unaufgeloest("1×", "47″")).toBe("Unaufgelöst: Bei 1× erscheint das Objekt nur 47″ groß, das Auge sieht es als Punkt wie einen Stern.");
    expect(I.unterGrenzgroesseNamen(["Polaris B"])).toBe("Schwächer als die Grenzgröße, im Bild blass oder unsichtbar: Polaris B.");
    expect(I.unterGrenzgroesseNamen(["A", "B"])).toContain("A, B.");
    expect(I.unterGrenzgroesseAnzahl(12, 44)).toBe("12 von 44 Sternen sind schwächer als die Grenzgröße, im Bild blass oder unsichtbar.");
    expect(I.ueberstrahlung("Antares A", "Antares B", "4,4")).toContain("Antares A und Antares B unterscheiden sich um 4,4 mag");
    expect(I.quellbildGrenze("4,0″")).toBe("Grenze des Quellbilds: Die Aufnahme hat 4,0″ je Pixel; feinere Einzelheiten fehlen im Anblick.");
    expect(I.isophoteOderSchwaecher("25,7 mag/″²")).toBe("25,7 mag/″² oder schwächer");
    expect(I.ausdehnungEtwa("1,2′")).toBe("etwa 1,2′");
    expect(I.ausdehnungMindestens("1,8°")).toBe("mindestens 1,8°");
  });

  it("Vergleichsbild bei Deep-Sky: ein Text je Abbildung", () => {
    expect(Object.keys(H.quellbildDeepSky).sort()).toEqual(["kubikwurzel", "linear", "okularOhneSchwelle"]);
    expect(H.quellbildDeepSky.kubikwurzel).toContain("Kubikwurzel");
  });
});
