// Issue #19: Verschieben baut keinen Kern (A-D2), ein Reglerzug am Seeing liest die Quelle nicht
// neu (Zwischenergebnis Stufe 1 bleibt in bild). Eigene, kleine Umgebung, damit die Tests von
// steuerung.test.ts unberuehrt bleiben.

import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { FalterJs, neuesRaster, QuelleAusRaster, type Objektpunkt, type Quellausschnitt } from "../bild";
import { pruefeBildnachweise, pruefeGeraete, pruefeObjekte } from "../daten";
import type { Konfiguration, Objektzustand } from "../naht/konfiguration";
import { voreinstellung, type Kataloge } from "../zustand";
import { type Bildquelle, Steuerung, type Umgebung } from "./steuerung";

const nachweise = pruefeBildnachweise(bilderJson);
const KATALOGE: Kataloge = { geraete: pruefeGeraete(geraeteJson), objekte: pruefeObjekte(objekteJson), nachweise };

/** Zaehlt die Ausschnitte, die rendere holt. */
class ZaehlQuelle extends QuelleAusRaster {
  ausschnitte = 0;
  override ausschnitt(mitte: Objektpunkt, breiteArcsec: number, massstab: number): Quellausschnitt {
    this.ausschnitte++;
    return super.ausschnitt(mitte, breiteArcsec, massstab);
  }
}

function umgebung(quelle: (o: Objektzustand) => ZaehlQuelle): { u: Umgebung; frame: () => Promise<void> } {
  let frames: (() => void)[] = [];
  const u: Umgebung = {
    kataloge: KATALOGE,
    falter: new FalterJs(),
    bildquelle: async (o): Promise<Bildquelle> => ({ quelle: quelle(o), lade: async () => {} }),
    plane: (f) => frames.push(f),
    warte: async () => {},
    schreibeUrl: () => {},
    anzeigePx: () => 64,
    uhr: () => 0
  };
  const frame = async (): Promise<void> => {
    const f = frames;
    frames = [];
    for (const g of f) g();
    await new Promise((weiter) => setTimeout(weiter, 0));
  };
  return { u, frame };
}

function mitSeeing(k: Konfiguration, seeingFwhmArcsec: number): Konfiguration {
  return { ...k, bedingungen: { ...k.bedingungen, seeingFwhmArcsec } };
}

describe("Steuerung: Wiederverwendung (Issue #19)", () => {
  it("Verschieben behaelt den Kern (kein Kernbau) und aendert nur die Fenstermitte", async () => {
    let q: ZaehlQuelle | undefined;
    const { u, frame } = umgebung((o) => (q = new ZaehlQuelle(neuesRaster(64, 64, 3, 0.5), o.durchmesserArcsec / 48)));
    const s = new Steuerung(u, voreinstellung(KATALOGE));
    await frame();
    const kern = s.stand.auswertung!.parameter.kern;
    s.verschiebe(200, 100);
    await frame();
    expect(s.stand.nummer).toBe(2);
    expect(s.stand.auswertung!.parameter.kern).toBe(kern);
    expect(s.stand.auswertung!.parameter.fenster).toMatchObject({ mitteXArcsec: 200, mitteYArcsec: 100 });
    expect(q!.ausschnitte).toBe(2);
  });

  it("ein Reglerzug am Seeing holt keinen neuen Ausschnitt, baut aber den Kern neu", async () => {
    let q: ZaehlQuelle | undefined;
    const { u, frame } = umgebung((o) => (q = new ZaehlQuelle(neuesRaster(64, 64, 3, 0.5), o.durchmesserArcsec / 48)));
    const s = new Steuerung(u, voreinstellung(KATALOGE));
    await frame();
    const kern = s.stand.auswertung!.parameter.kern;
    const quellbild = s.stand.auswertung!.parameter.quellbild.schluessel;
    s.aendere(mitSeeing(s.konfiguration, 3));
    await frame();
    expect(s.stand.nummer).toBe(2);
    expect(s.stand.auswertung!.parameter.kern.schluessel).not.toBe(kern.schluessel);
    // Bei 64 px bestimmt der Anzeigemassstab den Arbeitsmassstab: Stufe 1 bleibt gleich.
    expect(s.stand.auswertung!.parameter.quellbild.schluessel).toBe(quellbild);
    expect(q!.ausschnitte).toBe(1);
  });
});
