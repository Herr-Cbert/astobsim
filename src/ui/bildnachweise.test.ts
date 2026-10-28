import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import objekteJson from "../../daten/objekte.json";
import { pruefeBildnachweise, pruefeObjekte, pruefeVerweise } from "../daten";
import { TEXTE } from "../texte";
import { nachweiseImFuss } from "./bildnachweise";

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
