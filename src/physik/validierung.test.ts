import { describe, expect, it } from "vitest";
import type { Bedingungen, Geraet, Objektzustand } from "../naht/konfiguration";
import type { Kern } from "../naht/simulationsparameter";
import { auswerten } from "./auswerten";
import { arbeitsmassstabOhneFenster } from "./arbeitsmassstab";
import { KOMPRESSIONSEXPONENT, SCHWELLE_ERKENNBAR } from "./konstanten";
import { type Profilstufe, profilDelle } from "./kern";
import { fenster, JUPITER_47, MARS_6, MARS_14, MOND_Q1, refraktorMitVergroesserung, SATURN_20, zenit } from "./testdaten";

// Tabellen-Tests der Validierung (Issue #21, docs/validierung.md): je Testfall T1 bis T6 wird ein
// eindimensionales Stufenprofil der Struktur mit dem Kern gefaltet (profilDelle, physik.md 8.1);
// die Struktur gilt als erkennbar, wenn die Delle ueber SCHWELLE_ERKENNBAR liegt. Erwartet ist,
// was das Bild der Anwendung zeigt (Urteile in docs/validierung.md), nicht die Beobachtungs-
// erfahrung: weicht beides ab, steht die Abweichung als Issue dort. Die Tests frieren den Stand
// gegen Regression ein. Geometrie und Helligkeiten aus docs/recherche/objekte.md 4.6.

const FERNGLAS_10X50: Geraet = { art: "fernglas", oeffnungMm: 50, vergroesserung: 10, wahresGesichtsfeldGrad: 6.5 };
const AUGE: Geraet = { art: "auge" };

/** Stufe von bis (Bogensekunden) mit Helligkeit relativ zur Umgebung. */
const stufe = (vonArcsec: number, bisArcsec: number, helligkeit: number): Profilstufe => ({ vonArcsec, bisArcsec, helligkeit });

/** Ein Balken der Breite b um 0 in der Umgebung 1. */
const balken = (breiteArcsec: number, helligkeit: number): Profilstufe[] => [stufe(-breiteArcsec / 2, breiteArcsec / 2, helligkeit)];

/** Jupiter am Zentralmeridian, Norden positiv: NEB und SEB (objekte.md 4.1), Band/Zone 0,82 (Orton [56]). */
const JUPITER_BAENDER: Profilstufe[] = [stufe(-6.4, -2.7, 0.82), stufe(2.3, 5.7, 0.82)];

/**
 * Saturn 20'', radial durch die Anse (Saturnradius 10''): Ringzonen nach objekte.md 4.2,
 * Helligkeiten relativ zum aeusseren B-Ring aus dem Quellbild (tools/strukturprofile.py), Himmel 0.
 */
const SATURN_ANSE: Profilstufe[] = [
  stufe(12.36, 15.26, 0.03),
  stufe(15.26, 17.5, 0.53),
  stufe(17.5, 19.5, 1),
  stufe(19.5, 20.25, 0.06),
  stufe(20.25, 21.0, 0.5),
  stufe(21.0, 22.69, 0.21)
];

/** Mars-Scheibe mit Radius r und Syrtis Major der Breite b in der Mitte, dunkel/hell 0,41 (Quellbild), Himmel 0. */
const mars = (radiusArcsec: number, syrtisArcsec: number): Profilstufe[] => [
  stufe(-radiusArcsec, -syrtisArcsec / 2, 1),
  stufe(-syrtisArcsec / 2, syrtisArcsec / 2, 0.41),
  stufe(syrtisArcsec / 2, radiusArcsec, 1)
];

interface Fall {
  fall: string;
  struktur: string;
  geraet: Geraet;
  objekt: Objektzustand;
  bedingungen: Bedingungen;
  stufen: Profilstufe[];
  grund: number;
  suche: [number, number];
  erkennbar: boolean;
}

/** Feines Fenster: der Kern hat den Massstab aus Quelle und Gesamt-FWHM, nicht aus der Anzeige. */
function kern(f: Fall): Kern {
  const breite = f.geraet.art === "fernrohr" ? 100 : 2000;
  const a = auswerten({ geraet: f.geraet, objekt: f.objekt, bedingungen: f.bedingungen }, { fenster: fenster(breite, 1024) });
  const ohneFenster = arbeitsmassstabOhneFenster(a.anzeige.aufloesung, f.objekt.quelle);
  // Das Arbeitsraster rundet die Pixelzahl im Fenster ab, der Massstab wird daher hoechstens etwas groeber.
  expect(a.parameter.kern.massstabArcsecProPx).toBeGreaterThanOrEqual(ohneFenster);
  expect(a.parameter.kern.massstabArcsecProPx).toBeLessThan(1.02 * ohneFenster);
  return a.parameter.kern;
}

const FAELLE: Fall[] = [
  { fall: "T1", struktur: "Baender, 70 mm, 100-fach, Seeing 2''", geraet: refraktorMitVergroesserung(70, 100), objekt: JUPITER_47, bedingungen: zenit(2), stufen: JUPITER_BAENDER, grund: 1, suche: [-8, 8], erkennbar: true },
  // T2a: Erfahrung sagt erkennbar, das Bild zeigt die Teilung nicht (docs/validierung.md, Abweichung 1, Issue #76).
  { fall: "T2a", struktur: "Cassini-Teilung, 100 mm, 150-fach, Seeing 1,5''", geraet: refraktorMitVergroesserung(100, 150), objekt: SATURN_20, bedingungen: zenit(1.5), stufen: SATURN_ANSE, grund: 0, suche: [19, 21], erkennbar: false },
  { fall: "T2b", struktur: "Cassini-Teilung, 60 mm, 100-fach, Seeing 1,5''", geraet: refraktorMitVergroesserung(60, 100), objekt: SATURN_20, bedingungen: zenit(1.5), stufen: SATURN_ANSE, grund: 0, suche: [19, 21], erkennbar: false },
  { fall: "T3", struktur: "Kraterschatten 4 km, 80 mm, 100-fach, Seeing 2''", geraet: refraktorMitVergroesserung(80, 100), objekt: MOND_Q1, bedingungen: zenit(2), stufen: balken(2.15, 0), grund: 1, suche: [-2, 2], erkennbar: true },
  { fall: "T3", struktur: "Hadley-Rille, 80 mm, 100-fach, Seeing 2''", geraet: refraktorMitVergroesserung(80, 100), objekt: MOND_Q1, bedingungen: zenit(2), stufen: balken(0.64, 0.7), grund: 1, suche: [-2, 2], erkennbar: false },
  { fall: "T4a", struktur: "Detail 1,5'', 300 mm, 200-fach, Seeing 3''", geraet: refraktorMitVergroesserung(300, 200), objekt: JUPITER_47, bedingungen: zenit(3), stufen: balken(1.5, 0.82), grund: 1, suche: [-2, 2], erkennbar: false },
  { fall: "T4b", struktur: "Detail 1,5'', 100 mm, 200-fach, Seeing 3''", geraet: refraktorMitVergroesserung(100, 200), objekt: JUPITER_47, bedingungen: zenit(3), stufen: balken(1.5, 0.82), grund: 1, suche: [-2, 2], erkennbar: false },
  { fall: "T4c", struktur: "Detail 1,5'', 300 mm, 200-fach, Seeing 1''", geraet: refraktorMitVergroesserung(300, 200), objekt: JUPITER_47, bedingungen: zenit(1), stufen: balken(1.5, 0.82), grund: 1, suche: [-2, 2], erkennbar: true },
  { fall: "T4d", struktur: "Detail 1,5'', 100 mm, 200-fach, Seeing 1''", geraet: refraktorMitVergroesserung(100, 200), objekt: JUPITER_47, bedingungen: zenit(1), stufen: balken(1.5, 0.82), grund: 1, suche: [-2, 2], erkennbar: false },
  { fall: "T5a", struktur: "Syrtis Major 2,1'', Mars 14'', 150 mm, 200-fach, Seeing 1,5''", geraet: refraktorMitVergroesserung(150, 200), objekt: MARS_14, bedingungen: zenit(1.5), stufen: mars(7, 2.1), grund: 0, suche: [-3, 3], erkennbar: true },
  { fall: "T5b", struktur: "Syrtis Major 0,9'', Mars 6'', 80 mm, 120-fach, Seeing 1,5''", geraet: refraktorMitVergroesserung(80, 120), objekt: MARS_6, bedingungen: zenit(1.5), stufen: mars(3, 0.9), grund: 0, suche: [-1.5, 1.5], erkennbar: false },
  { fall: "T6a", struktur: "Mare 5', blosses Auge", geraet: AUGE, objekt: MOND_Q1, bedingungen: zenit(2), stufen: balken(300, 0.6), grund: 1, suche: [-200, 200], erkennbar: true },
  { fall: "T6c", struktur: "Baender, Fernglas 10x50", geraet: FERNGLAS_10X50, objekt: JUPITER_47, bedingungen: zenit(2), stufen: JUPITER_BAENDER, grund: 1, suche: [-8, 8], erkennbar: false }
];

describe("Validierung T1 bis T6: Strukturen erkennbar oder nicht (Schwelle aus docs/validierung.md)", () => {
  it.each(FAELLE)("$fall $struktur: erkennbar $erkennbar", (f) => {
    const delle = profilDelle(kern(f), f.stufen, f.grund, f.suche[0], f.suche[1]);
    if (f.erkennbar) expect(delle).toBeGreaterThan(SCHWELLE_ERKENNBAR);
    else expect(delle).toBeLessThan(SCHWELLE_ERKENNBAR);
  });

  it("T4: der 300 mm ist heller als der 100 mm, Leuchtdichte neunfach (Austrittspupille 1,5 gegen 0,5 mm), angezeigt mit dem Exponenten 1/3", () => {
    const hell = (oeffnungMm: number) => auswerten({ geraet: refraktorMitVergroesserung(oeffnungMm, 200), objekt: JUPITER_47, bedingungen: zenit(3) }).parameter.helligkeit.faktorObjekt;
    expect(hell(300) / hell(100)).toBeCloseTo(9 ** KOMPRESSIONSEXPONENT, 3);
  });
});

describe("Validierung T6: blosses Auge und Fernglas 10x50 (Blendungsregel, Gesichtsfeld)", () => {
  const jupiter = (geraet: Geraet) => auswerten({ geraet, objekt: JUPITER_47, bedingungen: zenit(2) }).parameter;

  it("blosses Auge: alle vier Jupitertrabanten geblendet, Gesichtsfeld rechteckig", () => {
    const p = jupiter(AUGE);
    expect(p.quellbild.punktquellen).toHaveLength(4);
    for (const q of p.quellbild.punktquellen) {
      expect(q.sichtbar).toBe(false);
      expect(q.grund).toBe("blendung");
    }
    expect(p.gesichtsfeld.form).toBe("rechteck");
  });

  it("Fernglas 10x50: alle vier Jupitertrabanten sichtbar, Gesichtsfeld rund", () => {
    const p = jupiter(FERNGLAS_10X50);
    expect(p.quellbild.punktquellen.map((q) => q.sichtbar)).toEqual([true, true, true, true]);
    expect(p.gesichtsfeld.form).toBe("kreis");
  });
});
