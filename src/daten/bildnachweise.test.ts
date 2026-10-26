import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import { pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";

/** Tiefe Kopie der echten Datei als Vorlage fuer gezielt kaputte Varianten. */
function kopie(): Record<string, unknown>[] {
  return JSON.parse(JSON.stringify(bilderJson)) as Record<string, unknown>[];
}

function fehlerVon(roh: unknown): DatenFehler {
  try {
    pruefeBildnachweise(roh);
  } catch (e) {
    if (e instanceof DatenFehler) return e;
    throw e;
  }
  throw new Error("kein DatenFehler geworfen");
}

describe("pruefeBildnachweise", () => {
  it("akzeptiert die echte daten/bilder.json", () => {
    const nachweise = pruefeBildnachweise(bilderJson);
    const mond = nachweise.find((n) => n.id === "mond_svs5587_6285");
    expect(mond?.kacheln?.stufen.map((s) => s.breitePx)).toEqual([3072, 1536, 768]);
    expect(mond?.kacheln?.kachelPx).toBe(512);
    expect(mond?.nordenOben).toBe(true);
  });

  it("nennt Datei, Eintrag und Feld bei fehlendem Pflichtfeld", () => {
    const roh = kopie();
    delete roh[0]!["lizenz"];
    const f = fehlerVon(roh);
    expect([f.datei, f.eintrag, f.feld]).toEqual(["bilder.json", "mond_svs5587_6285", "lizenz"]);
  });

  it("weist doppelte ids zurueck", () => {
    const roh = kopie();
    roh.push(roh[0]!);
    expect(fehlerVon(roh).feld).toBe("id");
  });

  it("prueft den Massstab gegen Winkelgroesse und Scheibendurchmesser", () => {
    const roh = kopie();
    roh[0]!["bogensekunden_pro_pixel"] = 0.7;
    expect(fehlerVon(roh).feld).toBe("bogensekunden_pro_pixel");
  });

  it("prueft die Stufen der Kachelpyramide", () => {
    const roh = kopie();
    const stufen = (roh[0]!["kacheln"] as { stufen: Record<string, unknown>[] }).stufen;
    stufen[2]!["kacheln_x"] = 1;
    const f = fehlerVon(roh);
    expect(f.eintrag).toBe("mond_svs5587_6285, kacheln.stufen[2]");
    expect(f.feld).toBe("kacheln_x");

    const roh2 = kopie();
    (roh2[0]!["kacheln"] as { stufen: Record<string, unknown>[] }).stufen[1]!["bogensekunden_pro_pixel"] = 1.0;
    expect(fehlerVon(roh2).feld).toBe("bogensekunden_pro_pixel");

    const roh3 = kopie();
    (roh3[0]!["kacheln"] as Record<string, unknown>)["muster"] = "{stufe}/{x}.webp";
    expect(fehlerVon(roh3).feld).toBe("muster");
  });

  it("weist falsche Typen und Werte ab", () => {
    expect(fehlerVon({}).feld).toBe("Wurzel");
    const roh = kopie();
    roh[0]!["norden_oben"] = "ja";
    expect(fehlerVon(roh).feld).toBe("norden_oben");
    const roh2 = kopie();
    roh2[0]!["lizenz_url"] = "svs.gsfc.nasa.gov";
    expect(fehlerVon(roh2).feld).toBe("lizenz_url");
    const roh3 = kopie();
    roh3[0]!["datei"] = "../geheim/";
    expect(fehlerVon(roh3).feld).toBe("datei");
  });

  it("weist Bilder ohne Norden oben ab", () => {
    const roh = kopie();
    roh[0]!["norden_oben"] = false;
    const f = fehlerVon(roh);
    expect(f.feld).toBe("norden_oben");
    expect(f.message).toContain("tools/");
  });

  it("meldet unbekannte Felder auf jeder Ebene", () => {
    const roh = kopie();
    roh[0]!["lizens"] = "CC0";
    expect(fehlerVon(roh).feld).toBe("lizens");
    const roh2 = kopie();
    (roh2[0]!["kacheln"] as Record<string, unknown>)["kachelpx"] = 512;
    expect([fehlerVon(roh2).eintrag, fehlerVon(roh2).feld]).toEqual(["mond_svs5587_6285, kacheln", "kachelpx"]);
    const roh3 = kopie();
    (roh3[0]!["kacheln"] as { stufen: Record<string, unknown>[] }).stufen[0]!["breite"] = 3072;
    expect(fehlerVon(roh3).feld).toBe("breite");
  });

  it("verlangt Bildmasse, die sich ueber alle Stufen ohne Rest halbieren lassen", () => {
    // 3070 px: Stufen 1535 und 768 (aufgerundet) sind in sich stimmig, aber nicht durch 4 teilbar.
    const roh = kopie();
    const e = roh[0]!;
    e["pixel_breite"] = 3070;
    const stufen = (e["kacheln"] as { stufen: Record<string, unknown>[] }).stufen;
    stufen[0]!["breite_px"] = 3070;
    stufen[1]!["breite_px"] = 1535;
    stufen[1]!["bogensekunden_pro_pixel"] = (0.643 * 3070) / 1535;
    stufen[2]!["bogensekunden_pro_pixel"] = (0.643 * 3070) / 768;
    expect(fehlerVon(roh).feld).toBe("pixel_breite");
  });

  it("begrenzt die Kacheln je Objekt auf 20 MB (A-X6)", () => {
    const roh = kopie();
    (roh[0]!["kacheln"] as Record<string, unknown>)["gesamt_bytes"] = 20_000_001;
    expect(fehlerVon(roh).feld).toBe("kacheln.gesamt_bytes");
    // Zwei Pyramiden desselben Objekts zaehlen zusammen.
    const roh2 = kopie();
    (roh2[0]!["kacheln"] as Record<string, unknown>)["gesamt_bytes"] = 12_000_000;
    roh2.push({ ...JSON.parse(JSON.stringify(roh2[0])), id: "mond_zweit" });
    expect(fehlerVon(roh2).eintrag).toBe("mond_zweit");
  });
});
