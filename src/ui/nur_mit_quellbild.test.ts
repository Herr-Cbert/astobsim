import { describe, expect, it } from "vitest";
import objekteJson from "../../daten/objekte.json";
import { pruefeObjekte } from "../daten";
import { nurMitQuellbild } from "./nur_mit_quellbild";

describe("nurMitQuellbild (vorlaeufig bis #109)", () => {
  const objekte = pruefeObjekte(objekteJson);

  it("laesst Mond, Planeten und M57 stehen und nimmt M45 und die Doppelsterne heraus", () => {
    const ids = nurMitQuellbild(objekte).map((o) => o.id);
    expect(ids).toEqual(["mond", "mars", "jupiter", "saturn", "m57"]);
  });

  it("veraendert die Eingabe nicht", () => {
    const vorher = objekte.length;
    nurMitQuellbild(objekte);
    expect(objekte.length).toBe(vorher);
  });
});
