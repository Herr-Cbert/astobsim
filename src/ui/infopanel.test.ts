import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import m45Json from "../../daten/sterne/m45.json";
import { mitOkular, objektzustand, pruefeBildnachweise, pruefeGeraete, pruefeObjekte, pruefeSternliste } from "../daten";
import type { Konfiguration, Objektzustand } from "../naht/konfiguration";
import { auswerten, freiesPaar } from "../physik";
import { TEXTE } from "../texte";
import { type Kataloge, voreinstellung } from "../zustand";
import { austrittspupille, infohinweise, infozeilen, kreisdurchmesserArcsec, MISCHGEWICHT_UNAUFGELOEST, unterDerSchwelle, winkel } from "./infopanel";

const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte: pruefeObjekte(objekteJson), nachweise: pruefeBildnachweise(bilderJson) };
// Sterne von M45 aus daten/sterne/ wie ladeSterne, aber synchron.
const M45 = KATALOGE.objekte.find((o) => o.id === "m45")!.zustaende[0]!;
M45.sterne = pruefeSternliste(m45Json, "m45.json", "m45");
const I = TEXTE.info;
const H = TEXTE.hilfe.anzeige;

/** Voreinstellung (80/600, Okular 10 mm: 60-fach, Seeing 2'', Bortle 5, 45 Grad) mit anderem Zustand, Geraet, Okular oder Bortle. */
function mit(id: string, aenderung: { geraet?: string; okularMm?: number; bortle?: number } = {}): Konfiguration {
  const k = voreinstellung(KATALOGE);
  const objekt = objektzustand(KATALOGE.objekte, KATALOGE.nachweise, id);
  if (objekt === undefined) throw new Error(`Testdaten: Zustand ${id} fehlt`);
  const eintrag = KATALOGE.geraete.find((e) => e.id === (aenderung.geraet ?? "refraktor-80-600-ed"));
  if (eintrag === undefined) throw new Error(`Testdaten: Geraet ${aenderung.geraet} fehlt`);
  const geraet = mitOkular(eintrag.geraet, { brennweiteMm: aenderung.okularMm ?? 10, scheinbaresGesichtsfeldGrad: 50 });
  return { geraet, objekt, bedingungen: { ...k.bedingungen, bortle: aenderung.bortle ?? k.bedingungen.bortle } };
}

function zeilen(k: Konfiguration): ReturnType<typeof infozeilen> {
  return infozeilen(auswerten(k, { anzeigePx: 64 }).anzeige, k);
}

function hinweise(k: Konfiguration): ReturnType<typeof infohinweise> {
  return infohinweise(auswerten(k, { anzeigePx: 64 }), k);
}

const V1 = [I.vergroesserung, I.wahresGesichtsfeld, I.austrittspupille, I.rayleigh, I.dawes, I.seeing, I.auge, I.dominant];

describe("infozeilen", () => {
  it("zeigt alle Werte nach A-D4 und die Grenzgroesse in fester Reihenfolge, je mit Hilfetext (A-D6)", () => {
    const k = voreinstellung(KATALOGE);
    const z = zeilen(k);
    expect(z.map((x) => x.beschriftung)).toEqual([...V1, I.grenzgroesse]);
    expect(z[0]?.wert).toBe("60×");
    expect(z[2]?.wert).toBe("1,3 mm");
    expect(z[8]?.wert).toMatch(/^\d+,\d mag$/);
    expect(z.map((x) => x.hilfe)).toEqual([H.vergroesserung, H.wahresGesichtsfeld, H.austrittspupille, H.rayleigh, H.dawes, H.seeing, H.auge, H.dominant, H.grenzgroesse]);
  });

  it("ohne Konfiguration nur die Werte aus den Anzeigewerten", () => {
    const k = voreinstellung(KATALOGE);
    expect(infozeilen(auswerten(k, { anzeigePx: 64 }).anzeige).map((x) => x.beschriftung)).toEqual([...V1, I.grenzgroesse]);
  });

  it("Grenzgroesse mit blossem Auge bei Bortle 3 etwa 6 mag (wahrnehmung.md 8, W1; hier 45 Grad Hoehe)", () => {
    const z = zeilen(mit("m45", { geraet: "auge", bortle: 3 }));
    const m = Number(z.find((x) => x.beschriftung === I.grenzgroesse)!.wert.replace(" mag", "").replace(",", "."));
    expect(m).toBeGreaterThan(5.7);
    expect(m).toBeLessThan(6.5);
  });

  it("nennt bei Doppelsternen im Hilfetext zum Seeing das Langzeitmittel (Entscheidung 3)", () => {
    const seeing = (k: Konfiguration): string | undefined => zeilen(k).find((x) => x.beschriftung === I.seeing)?.hilfe;
    expect(seeing(mit("eps_lyr_2027"))).toBe(`${H.seeing} ${H.seeingPaare}`);
    expect(seeing(mit("jup_47"))).toBe(H.seeing);
    expect(H.seeingPaare).toContain("0,5″");
  });

  it("M57 am 80 mm bei 100x: sichtbare Isophote und Ausdehnung", () => {
    const k = mit("m57", { okularMm: 6 });
    expect(unterDerSchwelle(k)).toBe(false);
    const z = zeilen(k);
    expect(z.map((x) => x.beschriftung)).toEqual([...V1, I.grenzgroesse, I.isophote, I.ausdehnung]);
    const iso = auswerten(k, { anzeigePx: 64 }).anzeige.isophote!;
    expect(iso.alleSichtbar).toBe(false);
    expect(z[9]?.wert).toBe(`${iso.magProArcsec2.toFixed(1).replace(".", ",")} mag/″²`);
    const d = kreisdurchmesserArcsec(iso.flaecheArcsec2);
    expect(z[10]?.wert).toBe(I.ausdehnungEtwa(winkel(d)));
    // Ring etwa 1' (deep-sky.md 2): die sichtbare Ausdehnung liegt zwischen 20'' und 2'.
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(120);
    expect(z[9]?.hilfe).toBe(H.isophote);
    expect(z[10]?.hilfe).toBe(H.ausdehnung);
  });

  it("M57 mit blossem Auge bei Bortle 9: unter der Schwelle, ohne Ausdehnung", () => {
    const k = mit("m57", { geraet: "auge", bortle: 9 });
    expect(unterDerSchwelle(k)).toBe(true);
    const z = zeilen(k);
    expect(z.map((x) => x.beschriftung)).toEqual([...V1, I.grenzgroesse, I.isophote]);
    expect(z[9]?.wert).toBe(I.unterSchwelle);
  });

  it("alle Isophoten sichtbar (Testdaten): 'oder schwaecher' und 'mindestens'", () => {
    // Flaechentabelle mit sehr hellen Isophoten: auch die schwaechste Zeile liegt ueber der Schwelle.
    const m57 = mit("m57", { okularMm: 6 });
    const hell: Objektzustand = {
      ...m57.objekt,
      isophoten: [
        { magProArcsec2: 10, flaecheArcsec2: 100 },
        { magProArcsec2: 11, flaecheArcsec2: 400 }
      ]
    };
    const k = { ...m57, objekt: hell };
    expect(auswerten(k, { anzeigePx: 64 }).anzeige.isophote?.alleSichtbar).toBe(true);
    const z = zeilen(k);
    expect(z[9]?.wert).toBe(I.isophoteOderSchwaecher("11,0 mag/″²"));
    expect(z[10]?.wert).toBe(I.ausdehnungMindestens(winkel(kreisdurchmesserArcsec(400))));
  });

  it("ohne Flaechentabelle (M45, Doppelstern, Planet) keine Isophote", () => {
    for (const id of ["m45", "albireo_2025", "jup_47"]) {
      expect(zeilen(mit(id)).map((x) => x.beschriftung)).toEqual([...V1, I.grenzgroesse]);
      expect(unterDerSchwelle(mit(id))).toBeUndefined();
    }
  });
});

describe("winkel und kreisdurchmesserArcsec", () => {
  it("Bogensekunden, Bogenminuten oder Grad", () => {
    expect(winkel(45.4)).toBe("45″");
    expect(winkel(72)).toBe("1,2′");
    expect(winkel(1500)).toBe("25′");
    expect(winkel(6480)).toBe("1,8°");
  });

  it("Kreis gleicher Flaeche", () => {
    expect(kreisdurchmesserArcsec(Math.PI * 30 * 30)).toBeCloseTo(60, 9);
  });
});

describe("infohinweise", () => {
  it("Jupiter mit blossem Auge unaufgeloest, im 10x50 nicht (A-P10)", () => {
    const auge = mit("jup_47", { geraet: "auge" });
    const a = auswerten(auge, { anzeigePx: 64 });
    expect(a.anzeige.mischgewicht).toBeGreaterThanOrEqual(MISCHGEWICHT_UNAUFGELOEST);
    const h = infohinweise(a, auge).find((x) => x.art === "unaufgeloest");
    expect(h?.text).toBe(I.unaufgeloest("1×", "47″"));
    expect(h?.hilfe).toBe(TEXTE.hilfe.hinweis.unaufgeloest);
    const glas = mit("jup_47", { geraet: "fernglas-10x50" });
    expect(auswerten(glas, { anzeigePx: 64 }).anzeige.mischgewicht).toBeLessThan(MISCHGEWICHT_UNAUFGELOEST);
    expect(hinweise(glas).some((x) => x.art === "unaufgeloest")).toBe(false);
  });

  it("Schwelle 0,5 liegt bei etwa 1,7' scheinbarer Groesse", () => {
    // Mars 6'' am 80/600: bei 16,8x (101'') knapp unaufgeloest, bei 17,2x (103'') nicht mehr.
    const mars = (v: number): number => auswerten(mit("mars_6", { okularMm: 600 / v }), { anzeigePx: 64 }).anzeige.mischgewicht!;
    expect(mars(16.8)).toBeGreaterThan(MISCHGEWICHT_UNAUFGELOEST);
    expect(mars(17.2)).toBeLessThan(MISCHGEWICHT_UNAUFGELOEST);
  });

  it("Ueberstrahlung mit den Sternnamen bei Antares, nicht bei Albireo (A-Z9)", () => {
    const k = mit("antares_2027");
    const a = auswerten(k, { anzeigePx: 64 });
    const w = a.warnungen.find((x) => x.art === "ueberstrahlung")!;
    const h = infohinweise(a, k).filter((x) => x.art === "ueberstrahlung");
    expect(h).toHaveLength(1);
    expect(h[0]?.text).toBe(I.ueberstrahlung("Stern A", "Stern B", "4,4"));
    expect(w.sterne).toEqual([k.objekt.sterne[0]!.name, k.objekt.sterne[1]!.name]);
    expect(h[0]?.hilfe).toBe(TEXTE.hilfe.hinweis.ueberstrahlung);
    expect(hinweise(mit("albireo_2025")).some((x) => x.art === "ueberstrahlung")).toBe(false);
  });

  it("Sterne unter der Grenzgroesse: Namen beim Paar, Anzahl bei M45", () => {
    // Albireo B (5,1 mag) mit blossem Auge unter Innenstadthimmel (Bortle 9) unter der Grenzgroesse, A (3,2) nicht.
    const albireo = mit("albireo_2025", { geraet: "auge", bortle: 9 });
    const h = hinweise(albireo).find((x) => x.art === "unter-grenzgroesse");
    expect(h?.text).toBe(I.unterGrenzgroesseNamen([`Stern ${albireo.objekt.sterne[1]!.name}`]));
    expect(h?.hilfe).toBe(TEXTE.hilfe.hinweis.unterSchwelle);
    // M45 mit blossem Auge bei Bortle 5: viele der 44 Sterne (bis 8,5 mag) unter der Grenzgroesse.
    const m45 = mit("m45", { geraet: "auge" });
    const grenze = auswerten(m45, { anzeigePx: 64 }).anzeige.grenzgroesseMag;
    const anzahl = m45.objekt.sterne.filter((s) => s.magnitude > grenze).length;
    expect(anzahl).toBeGreaterThan(3);
    expect(hinweise(m45).find((x) => x.art === "unter-grenzgroesse")?.text).toBe(I.unterGrenzgroesseAnzahl(anzahl, 44));
    // Am 80 mm sind alle Plejaden-Sterne heller als die Grenzgroesse.
    expect(hinweise(mit("m45")).some((x) => x.art === "unter-grenzgroesse")).toBe(false);
  });

  it("nennt auch Sterne mit grund unter_schwelle, aber keine geblendeten Trabanten (A-P6)", () => {
    // Freies Paar (Testdaten) am 80 mm bei 60x: B mit 20 mag liegt mehr als 5 mag unter der
    // Grenzgroesse, wird also nicht gemalt; 30'' mal 60 liegt ueber 10', also keine Blendung.
    const paar = { ...mit("albireo_2025"), objekt: freiesPaar({ trennungArcsec: 30, magnitudeA: 5, magnitudeB: 20, bvA: 0.6, bvB: 0.6 }) };
    const ap = auswerten(paar, { anzeigePx: 64 });
    expect(ap.parameter.quellbild.punkte.punktquellen[1]?.grund).toBe("unter_schwelle");
    expect(infohinweise(ap, paar).find((x) => x.art === "unter-grenzgroesse")?.text).toBe(I.unterGrenzgroesseNamen(["Stern B"]));
    // Jupiter mit blossem Auge: alle Trabanten geblendet, kein Hinweis zur Grenzgroesse.
    const jupiter = mit("jup_47", { geraet: "auge" });
    const a = auswerten(jupiter, { anzeigePx: 64 });
    expect(a.parameter.quellbild.punkte.punktquellen.every((p) => p.grund === "blendung")).toBe(true);
    expect(infohinweise(a, jupiter).some((x) => x.art === "unter-grenzgroesse")).toBe(false);
  });

  it("Grenze des Quellbilds nur, wenn der Quellmassstab den Arbeitsmassstab bestimmt (A-X11, Testdaten)", () => {
    // M57 hat 0,1''/px: keine Grenze. Dasselbe Objekt mit 4''/px (wie ein grobes M31-Bild) am 80 mm bei 60x: Grenze.
    const k = mit("m57");
    expect(hinweise(k).some((x) => x.art === "quellbild-grenze")).toBe(false);
    const grob = { ...k, objekt: { ...k.objekt, quelle: { ...k.objekt.quelle!, massstabArcsecProPx: 4 } } };
    const h = hinweise(grob).find((x) => x.art === "quellbild-grenze");
    expect(h?.text).toBe(I.quellbildGrenze("4,0″"));
    expect(h?.hilfe).toBe(TEXTE.hilfe.hinweis.quellbildGrenze);
    // Mit blossem Auge (Gesamt-FWHM ueber 1') reicht auch das grobe Bild.
    const auge = { ...mit("m57", { geraet: "auge" }), objekt: grob.objekt };
    expect(hinweise(auge).some((x) => x.art === "quellbild-grenze")).toBe(false);
  });

  it("Voreinstellung (Mond am 80 mm) ohne Hinweis", () => {
    expect(hinweise(voreinstellung(KATALOGE))).toEqual([]);
  });
});

describe("austrittspupille", () => {
  it("unter 1 mm zwei Nachkommastellen, sonst eine", () => {
    expect(austrittspupille(0.267)).toBe("0,27");
    expect(austrittspupille(1.333)).toBe("1,3");
    expect(austrittspupille(6.67)).toBe("6,7");
    // Stellen nach dem gerundeten Wert: 0,996 wird 1,0, nicht 1,00.
    expect(austrittspupille(0.996)).toBe("1,0");
  });
});
