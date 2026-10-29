import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import m45Json from "../../daten/sterne/m45.json";
import { pruefeBildnachweise, pruefeObjekte, pruefeVerweise } from "../daten";
import { TEXTE } from "../texte";
import { nachweiseImFuss, sterndatenImFuss } from "./bildnachweise";

const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);

describe("nachweiseImFuss (A-X4, #23)", () => {
  const eintraege = nachweiseImFuss({ objekte, nachweise });

  it("listet jedes Bild aus bilder.json genau einmal in dessen Reihenfolge", () => {
    expect(eintraege.map((e) => e.id)).toEqual(nachweise.map((n) => n.id));
  });

  it("uebernimmt Credit-Zeile, Lizenz und Quelle woertlich aus bilder.json, mit Links", () => {
    for (const [i, e] of eintraege.entries()) {
      const n = nachweise[i]!;
      const zeile = (b: string) => e.zeilen.find((z) => z.beschriftung === b);
      expect(zeile(TEXTE.fuss.credit)).toEqual({ beschriftung: TEXTE.fuss.credit, text: n.namensnennung });
      expect(zeile(TEXTE.fuss.lizenz)).toEqual({ beschriftung: TEXTE.fuss.lizenz, text: n.lizenz, href: n.lizenzUrl });
      expect(zeile(TEXTE.fuss.quelle)?.href).toBe(n.quelleUrl);
      expect(zeile(TEXTE.fuss.bearbeitung)?.text).toBe(n.bearbeitung);
      for (const z of e.zeilen) if (z.href !== undefined) expect(z.href).toMatch(/^https:\/\//);
    }
  });

  it("nennt in der Ueberschrift alle Zustaende, die ein Bild teilen", () => {
    for (const e of eintraege) {
      const namen = objekte.flatMap((o) => o.zustaende).filter((z) => z.bild === e.id).map((z) => z.name);
      expect(namen.length).toBeGreaterThan(0);
      expect(e.titel).toBe(namen.join(", "));
    }
    // Ein Bild fuer mehrere Zustaende (Mars 14" und 6", Jupiter, Saturn) steht trotzdem nur einmal da.
    expect(eintraege.length).toBeLessThan(objekte.flatMap((o) => o.zustaende).length);
  });
});

describe("sterndatenImFuss (#103)", () => {
  const eintraege = sterndatenImFuss();
  const T = TEXTE.fuss;

  it("listet jede Quelle aus TEXTE.fuss.sterndaten genau einmal, mit Lizenz woertlich und Link auf die Quelle", () => {
    expect(eintraege.map((e) => e.titel)).toEqual(T.sterndaten.quellen.map((q) => q.titel));
    for (const [i, e] of eintraege.entries()) {
      const q = T.sterndaten.quellen[i]!;
      const zeile = (b: string) => e.zeilen.find((z) => z.beschriftung === b);
      expect(zeile(T.verwendet)?.text).toBe(q.verwendet);
      expect(zeile(T.lizenz)?.text).toBe(q.lizenz);
      expect(zeile(T.lizenz)?.href).toBe(q.lizenzUrl);
      expect(zeile(T.danksagung)?.text).toBe(q.danksagung);
      expect(zeile(T.quelle)).toEqual({ beschriftung: T.quelle, text: q.url, href: q.url });
      for (const z of e.zeilen) if (z.href !== undefined) expect(z.href).toMatch(/^https:\/\//);
    }
  });

  it("nennt WDS, ORB6 und die ESA-Lizenz der Hipparcos- und Tycho-Kataloge mit Credit: ESA", () => {
    const titel = eintraege.map((e) => e.titel).join(" | ");
    expect(titel).toMatch(/Washington Double Star Catalog/);
    expect(titel).toMatch(/ORB6/);
    const esa = T.sterndaten.quellen.find((q) => q.titel.startsWith("Hipparcos"))!;
    expect(esa.lizenz).toContain("CC BY-NC 3.0 IGO");
    expect(esa.danksagung).toBe("Credit: ESA");
  });

  it("deckt jede quelle_farbe der Doppelsterne in objekte.json durch eine Quelle ab", () => {
    const zuQuelle: Record<string, RegExp> = {
      Hipparcos: /^Hipparcos/,
      TDSC: /^Hipparcos/,
      BSC: /^Bright Star Catalogue/,
      SIMBAD: /^SIMBAD/,
      "Usenko und Klochkova 2007 nach Turner 2005": /^Usenko und Klochkova/
    };
    const doppelsterne = objekte.filter((o) => o.klasse === "doppelstern");
    const farben = new Set(doppelsterne.flatMap((o) => o.zustaende.flatMap((z) => z.sterne.map((s) => s.quelleFarbe ?? ""))));
    for (const f of farben) {
      const muster = zuQuelle[f];
      expect(muster, f).toBeDefined();
      expect(eintraege.some((e) => muster!.test(e.titel)), f).toBe(true);
    }
  });

  it("deckt die Herkunft der M45-Sternliste ab (HIP, GDR3)", () => {
    const zuQuelle: Record<string, RegExp> = { HIP: /^Hipparcos/, GDR3: /^Gaia DR3/ };
    const farben = new Set(m45Json.sterne.map((s) => s.quelle_farbe));
    for (const f of farben) {
      const muster = zuQuelle[f];
      expect(muster, f).toBeDefined();
      expect(eintraege.some((e) => muster!.test(e.titel)), f).toBe(true);
    }
    const gaia = T.sterndaten.quellen.find((q) => q.titel.startsWith("Gaia"))!;
    expect(gaia.lizenz).toContain("CC BY-NC 3.0 IGO");
    expect(gaia.danksagung).toMatch(/^Credit: ESA, Gaia DPAC\./);
  });
});
