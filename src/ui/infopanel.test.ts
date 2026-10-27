import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { pruefeBildnachweise, pruefeGeraete, pruefeObjekte } from "../daten";
import { auswerten } from "../physik";
import { TEXTE } from "../texte";
import { voreinstellung } from "../zustand";
import { austrittspupille, infozeilen } from "./infopanel";

describe("infozeilen", () => {
  it("zeigt alle Werte nach A-D4 in fester Reihenfolge, je mit Hilfetext (A-D6)", () => {
    const kataloge = { geraete: pruefeGeraete(geraeteJson), objekte: pruefeObjekte(objekteJson), nachweise: pruefeBildnachweise(bilderJson) };
    const zeilen = infozeilen(auswerten(voreinstellung(kataloge), { anzeigePx: 64 }).anzeige);
    const I = TEXTE.info;
    expect(zeilen.map((z) => z.beschriftung)).toEqual([I.vergroesserung, I.wahresGesichtsfeld, I.austrittspupille, I.rayleigh, I.dawes, I.seeing, I.auge, I.dominant]);
    expect(zeilen[0]?.wert).toBe("60×");
    expect(zeilen[2]?.wert).toBe("1,3 mm");
    const H = TEXTE.hilfe.anzeige;
    expect(zeilen.map((z) => z.hilfe)).toEqual([H.vergroesserung, H.wahresGesichtsfeld, H.austrittspupille, H.rayleigh, H.dawes, H.seeing, H.auge, H.dominant]);
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
