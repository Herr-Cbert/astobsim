import { describe, expect, it } from "vitest";
import { TEXTE } from "./texte";

describe("bildnachweis", () => {
  it("trennt Namensnennung und Lizenz mit einem Punkt", () => {
    expect(TEXTE.bildnachweis("NASA; bearbeitet: skaliert", "CC-BY-4.0")).toBe("Bild: NASA; bearbeitet: skaliert. Lizenz: CC-BY-4.0.");
    expect(TEXTE.bildnachweis("Producer: James Tralie (eMITS).", "Public Domain")).toBe("Bild: Producer: James Tralie (eMITS). Lizenz: Public Domain.");
  });
});
