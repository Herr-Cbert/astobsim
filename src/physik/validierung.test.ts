import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import geraeteJson from "../../daten/geraete.json";
import objekteJson from "../../daten/objekte.json";
import { malePunktquellen } from "../bild/male";
import { faltePunkte } from "../bild/punktebene";
import { eckeLinksOben } from "../bild/quelle";
import { pruefeBildnachweise } from "../daten/bildnachweise";
import { pruefeGeraete } from "../daten/geraete";
import { pruefeObjekte, pruefeSternliste, pruefeVerweise } from "../daten/objekte";
import type { Bedingungen, Geraet, Konfiguration, Objektzustand } from "../naht/konfiguration";
import { zoomfenster } from "../ui/zoom";
import { ausUrl } from "../zustand";
import type { Kern } from "../naht/simulationsparameter";
import { type Auswertung, auswerten } from "./auswerten";
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
 * Helligkeiten relativ zum aeusseren B-Ring aus dem Quellbild (tools/strukturprofile.py; seit #79 an Salo und
 * French 2010 angeglichen, objekte.md 4.6), Himmel 0.
 */
const SATURN_ANSE: Profilstufe[] = [
  stufe(12.36, 15.26, 0.07),
  stufe(15.26, 17.5, 0.78),
  stufe(17.5, 19.5, 1),
  stufe(19.5, 20.25, 0.17),
  stufe(20.25, 21.0, 0.82),
  stufe(21.0, 22.69, 0.54)
];

/** Mars-Scheibe mit Radius r und Syrtis Major der Breite b in der Mitte, dunkel/hell 0,47 (Quellbild seit #78), Himmel 0. */
const mars = (radiusArcsec: number, syrtisArcsec: number): Profilstufe[] => [
  stufe(-radiusArcsec, -syrtisArcsec / 2, 1),
  stufe(-syrtisArcsec / 2, syrtisArcsec / 2, 0.47),
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
  const ohneFenster = arbeitsmassstabOhneFenster(a.anzeige.aufloesung, f.objekt.quelle!);
  // Das Arbeitsraster rundet die Pixelzahl im Fenster ab, der Massstab wird daher hoechstens etwas groeber.
  expect(a.parameter.kern.massstabArcsecProPx).toBeGreaterThanOrEqual(ohneFenster);
  expect(a.parameter.kern.massstabArcsecProPx).toBeLessThan(1.02 * ohneFenster);
  return a.parameter.kern;
}

const FAELLE: Fall[] = [
  { fall: "T1", struktur: "Baender, 70 mm, 100-fach, Seeing 2''", geraet: refraktorMitVergroesserung(70, 100), objekt: JUPITER_47, bedingungen: zenit(2), stufen: JUPITER_BAENDER, grund: 1, suche: [-8, 8], erkennbar: true },
  // T2a: im Langzeitmittel nicht erkennbar, erst im ruhigen Moment (Erwartung nach Issue #76 angepasst, physik.md 15).
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
    expect(p.quellbild.punkte.punktquellen).toHaveLength(4);
    for (const q of p.quellbild.punkte.punktquellen) {
      expect(q.sichtbar).toBe(false);
      expect(q.grund).toBe("blendung");
    }
    expect(p.gesichtsfeld.form).toBe("rechteck");
  });

  it("Fernglas 10x50: alle vier Jupitertrabanten sichtbar, Gesichtsfeld rund", () => {
    const p = jupiter(FERNGLAS_10X50);
    expect(p.quellbild.punkte.punktquellen.map((q) => q.sichtbar)).toEqual([true, true, true, true]);
    expect(p.gesichtsfeld.form).toBe("kreis");
  });
});

// ---------------------------------------------------------------------------------------------
// Version 2: T7 bis T11 und Sternzahl M13 (Issue #112, docs/validierung.md Abschnitt 14). Anders als
// T1 bis T6 rechnen diese Tests mit den echten Daten (daten/objekte.json, daten/sterne/) und genau
// den Suchteilen der Validierungsbilder (scripts/validierung-bilder.mjs), ueber ausUrl wie die
// Anwendung; deshalb importieren sie daten, zustand, ui (Zoomfenster) und bild (Punktebene). Die
// Werte sind auf den Stand vom 2026-10-30 eingefroren; wo das Bild von der Erwartung aus
// docs/recherche/README.md abweicht, steht es beim Fall und in docs/validierung.md 14.

const sternlisten = import.meta.glob("../../daten/sterne/*.json", { import: "default", eager: true });
const nachweise = pruefeBildnachweise(bilderJson);
const objekte = pruefeObjekte(objekteJson);
pruefeVerweise(objekte, nachweise);
for (const o of objekte) {
  for (const z of o.zustaende) {
    if (z.sterneDatei !== undefined) z.sterne = pruefeSternliste(sternlisten[`../../daten/sterne/${z.sterneDatei}`], z.sterneDatei, o.id);
  }
}
const KATALOGE = { geraete: pruefeGeraete(geraeteJson), objekte, nachweise };

/** Freier Refraktor wie in scripts/validierung-bilder.mjs. */
const R = (d: number, f: number, ok: number): string => `a=fernrohr&ba=refraktor&d=${d}&f=${f}&o=0&ok=${ok}&sg=50`;
/** Bedingungen: klar, Zenit, Bortle b (Standard 5), Hoehe h. */
const bed = (bortle = 5, hoeheGrad = 90): string => `b=${bortle}&t=klar&h=${hoeheGrad}`;
const konfiguration = (such: string): Konfiguration => ausUrl(`?v=1&${such}`, KATALOGE).konfiguration;

/** Delle eines Profils wie profilDelle: 1 - lokales Minimum / kleineres der hoechsten Maxima links und rechts; ohne Minimum (oder auf leerem Grund) 0. */
function delle(profil: readonly number[]): number {
  let ergebnis = 0;
  for (let k = 1; k < profil.length - 1; k++) {
    if (profil[k]! > profil[k - 1]! || profil[k]! > profil[k + 1]!) continue;
    const links = Math.max(...profil.slice(0, k));
    const rechts = Math.max(...profil.slice(k + 1));
    const nachbar = Math.min(links, rechts);
    if (nachbar > 0) ergebnis = Math.max(ergebnis, 1 - profil[k]! / nachbar);
  }
  return ergebnis;
}

/**
 * Trennung zweier Sterne, wie das Bild sie zeigt: Punktebene im Zoomfenster (malePunktquellen und
 * faltePunkte aus bild, Arbeitsmassstab Gesamt-FWHM / 2,5), linear vor tonwert, bilinear abgetastet
 * entlang der Verbindungslinie von 0,3 Abstaenden vor dem ersten bis 0,3 hinter dem zweiten Stern.
 * Mass wie doppelsterne.md 4: delta = 1 - I_min / I_B.
 */
function trennung(such: string, sternA: string, sternB: string): { delle: number; auswertung: Auswertung } {
  const k = konfiguration(such);
  const auswertung = auswerten(k, { fenster: zoomfenster(k, { xArcsec: 0, yArcsec: 0 }, 540) });
  const { quellbild, kern } = auswertung.parameter;
  const ebene = faltePunkte(malePunktquellen(quellbild), kern, quellbild.rasterPx)!;
  const n = quellbild.rasterPx;
  const m = quellbild.massstabArcsecProPx;
  const ecke = eckeLinksOben({ xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec }, n, n, m);
  /** Pixelkoordinaten (Mitte von Pixel i bei i). */
  const lage = (name: string): [number, number] => {
    const p = quellbild.punkte.punktquellen.find((q) => q.name === name)!;
    return [(p.xArcsec - ecke.xArcsec) / m - 0.5, (ecke.yArcsec - p.yArcsec) / m - 0.5];
  };
  const pixel = (x: number, y: number): number => ebene.daten[Math.min(n - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))]!;
  const bilinear = (u: number, v: number): number => {
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = u - i;
    const fv = v - j;
    return (1 - fu) * (1 - fv) * pixel(i, j) + fu * (1 - fv) * pixel(i + 1, j) + (1 - fu) * fv * pixel(i, j + 1) + fu * fv * pixel(i + 1, j + 1);
  };
  const [ua, va] = lage(sternA);
  const [ub, vb] = lage(sternB);
  const profil = Array.from({ length: 401 }, (_, t) => {
    const s = -0.3 + (1.6 * t) / 400;
    return bilinear(ua + s * (ub - ua), va + s * (vb - va));
  });
  return { delle: delle(profil), auswertung };
}

interface Paarfall {
  fall: string;
  such: string;
  sterne: [string, string];
  /** Delle am 2026-10-30 (eingefroren auf 0,03). */
  heute: number;
  /** Was das Bild zeigt: getrennt, wenn die Delle ueber SCHWELLE_ERKENNBAR liegt (doppelsterne.md 4). */
  getrennt: boolean;
}

const PAARE: Paarfall[] = [
  // T7: Erwartung 80 mm beide nicht getrennt (laenglich), 150 mm beide getrennt.
  { fall: "T7a", such: `${R(80, 800, 5)}&z=pi_aql_2021&s=0.5&${bed()}`, sterne: ["A", "B"], heute: 0, getrennt: false },
  { fall: "T7b", such: `${R(150, 1500, 5)}&z=pi_aql_2021&s=0.5&${bed()}`, sterne: ["A", "B"], heute: 0.214, getrennt: true },
  { fall: "T7c", such: `${R(80, 800, 5)}&z=eps_ari_2027&s=0.5&${bed()}`, sterne: ["A", "B"], heute: 0, getrennt: false },
  { fall: "T7d", such: `${R(150, 1500, 5)}&z=eps_ari_2027&s=0.5&${bed()}`, sterne: ["A", "B"], heute: 0.141, getrennt: true },
  // T8: 10x50 zwei runde Sterne (enge Paare nicht getrennt, weites Paar getrennt); 80 mm bei 0,5'' beide
  // engen Paare getrennt, bei 2'' keines.
  { fall: "T8a", such: `g=fernglas-10x50&z=eps_lyr_2027&s=2&${bed()}`, sterne: ["eps1 A", "eps1 B"], heute: 0, getrennt: false },
  { fall: "T8a", such: `g=fernglas-10x50&z=eps_lyr_2027&s=2&${bed()}`, sterne: ["eps2 C", "eps2 D"], heute: 0, getrennt: false },
  { fall: "T8a", such: `g=fernglas-10x50&z=eps_lyr_2027&s=2&${bed()}`, sterne: ["eps1 A", "eps2 C"], heute: 1, getrennt: true },
  // Abweichung: Epsilon1 am 80 mm bei 0,5'' nicht getrennt (erwartet getrennt). Im feinen Modell 0,139
  // (doppelsterne.md 4: 0,152), am Arbeitsmassstab 0,64'' mit Scheibchen von einem Arbeitspixel 0.
  { fall: "T8b", such: `${R(80, 800, 5)}&z=eps_lyr_2027&s=0.5&${bed()}`, sterne: ["eps1 A", "eps1 B"], heute: 0, getrennt: false },
  { fall: "T8b", such: `${R(80, 800, 5)}&z=eps_lyr_2027&s=0.5&${bed()}`, sterne: ["eps2 C", "eps2 D"], heute: 0.515, getrennt: true },
  { fall: "T8c", such: `${R(80, 800, 5)}&z=eps_lyr_2027&s=2&${bed()}`, sterne: ["eps1 A", "eps1 B"], heute: 0, getrennt: false },
  { fall: "T8c", such: `${R(80, 800, 5)}&z=eps_lyr_2027&s=2&${bed()}`, sterne: ["eps2 C", "eps2 D"], heute: 0.002, getrennt: false },
  // T9: Seeing 0,5'' getrennt, 1,5'' oder 15 Grad Hoehe nicht.
  { fall: "T9a", such: `${R(150, 1200, 6)}&z=antares_2027&s=0.5&${bed()}`, sterne: ["A", "B"], heute: 0.303, getrennt: true },
  { fall: "T9b", such: `${R(150, 1200, 6)}&z=antares_2027&s=1.5&${bed()}`, sterne: ["A", "B"], heute: 0, getrennt: false },
  { fall: "T9c", such: `${R(150, 1200, 6)}&z=antares_2027&s=0.5&${bed(5, 15)}`, sterne: ["A", "B"], heute: 0, getrennt: false }
];

describe("Validierung T7 bis T9: Doppelsterne getrennt oder nicht (Delle der Punktebene, Schwelle 0,125)", () => {
  it.each(PAARE)("$fall $sterne: getrennt $getrennt (Delle heute $heute)", (f) => {
    const { delle: d } = trennung(f.such, ...f.sterne);
    expect(Math.abs(d - f.heute)).toBeLessThan(0.03);
    if (f.getrennt) expect(d).toBeGreaterThan(SCHWELLE_ERKENNBAR);
    else expect(d).toBeLessThan(SCHWELLE_ERKENNBAR);
  });

  it("T9: Antares meldet bei allen drei Bedingungen die Ueberstrahlung (Hinweis im Infopanel)", () => {
    for (const f of PAARE.filter((p) => p.fall.startsWith("T9"))) {
      const ueber = trennung(f.such, ...f.sterne).auswertung.warnungen.filter((w) => w.art === "ueberstrahlung");
      expect(ueber, f.fall).toHaveLength(1);
      expect(ueber[0]!.wert).toBeCloseTo(4.44, 2);
    }
  });
});

/** Grosse Achse in Bogenminuten einer Ellipse mit Achsenverhaeltnis q und Flaeche F (Abschnitt 10). */
const grosseAchseArcmin = (flaecheArcsec2: number, q: number): number => (2 * Math.sqrt(flaecheArcsec2 / (Math.PI * q))) / 60;

describe("Validierung T10 und T11: Grenzgroesse und sichtbare Isophote (Infopanel)", () => {
  const anzeige = (such: string) => auswerten(konfiguration(such)).anzeige;

  it("T10: M57 am 80 mm (80-fach) und 150 mm (120-fach) als Oval sichtbar, Isophote 20,3 bzw. 20,9 mag/arcsec^2", () => {
    const a80 = anzeige(`${R(80, 800, 10)}&z=m57&s=2&${bed()}`).isophote!;
    const a150 = anzeige(`${R(150, 1200, 10)}&z=m57&s=2&${bed()}`).isophote!;
    // Vorzeichenwechsel der Reserve gefunden: ein Teil sichtbar, nicht alle Zeilen.
    for (const iso of [a80, a150]) {
      expect(iso.verhaeltnis).toBe(1);
      expect(iso.alleSichtbar).toBe(false);
    }
    expect(a80.magProArcsec2).toBeCloseTo(20.3, 1);
    expect(a150.magProArcsec2).toBeCloseTo(20.9, 1);
    // Flaeche 4373 und 4692 arcsec^2 (auf 10 %): etwa das ganze Oval 88'' x 60'' (4147 arcsec^2).
    expect(a80.flaecheArcsec2 / 4373).toBeCloseTo(1, 1);
    expect(a150.flaecheArcsec2 / 4692).toBeCloseTo(1, 1);
  });

  it("T11: Grenzgroesse mit blossem Auge etwa 6,2 (Bortle 3) und 5,2 (Bortle 7), mit 0,2 mag Extinktion im Zenit", () => {
    const b3 = anzeige(`g=auge&z=m45&s=2&${bed(3)}`);
    const b7 = anzeige(`g=auge&z=m45&s=2&${bed(7)}`);
    expect(b3.extinktionMag).toBeCloseTo(0.2, 2);
    expect(Math.abs(b3.grenzgroesseMag - 6.2)).toBeLessThan(0.1);
    expect(Math.abs(b7.grenzgroesseMag - 5.2)).toBeLessThan(0.1);
  });

  it("T11: M31 bei Bortle 3 sichtbar, grosse Achse 1,5 bis 3 Grad (heute 101'); bei Bortle 7 C/C_th 0,42", () => {
    const b3 = anzeige(`g=auge&z=m31&s=2&${bed(3)}`).isophote!;
    const b7 = anzeige(`g=auge&z=m31&s=2&${bed(7)}`).isophote!;
    expect(b3.verhaeltnis).toBeGreaterThanOrEqual(1);
    const achse = grosseAchseArcmin(b3.flaecheArcsec2, 0.27);
    expect(achse).toBeGreaterThan(90);
    expect(achse).toBeLessThan(180);
    expect(achse / 101.5).toBeCloseTo(1, 1);
    expect(b7.verhaeltnis).toBeLessThan(1);
    expect(b7.verhaeltnis / 0.42).toBeCloseTo(1, 1);
  });
});

/** Sterne ueber der Grenzgroesse: Deckkraft P' mindestens 0,49 (Wert an der Grenzgroesse, ADR-0004 Nachtrag #100). */
function sternzahl(such: string): { anzahl: number; grenzgroesse: number } {
  const a = auswerten(konfiguration(such));
  const anzahl = a.parameter.quellbild.punkte.punktquellen.filter((p) => p.sichtbar && (p.deckkraft ?? 1) >= 0.49).length;
  return { anzahl, grenzgroesse: a.anzeige.grenzgroesseMag };
}

describe("Validierung T11 und M13: Sternzahl", () => {
  it("T11: Plejaden mit blossem Auge, Bortle 3 zwoelf Sterne (erwartet 11 bis 14)", () => {
    expect(sternzahl(`g=auge&z=m45&s=2&${bed(3)}`).anzahl).toBe(12);
  });

  // Abweichung: erwartet sechs, Pleione mit Atlas verschmolzen. Pleione (5,05 mag) liegt knapp ueber der
  // Grenzgroesse 5,17 und 301'' von Atlas, das Auge mit 1' Aufloesung (A-P2) trennt sie.
  it("T11: Plejaden mit blossem Auge, Bortle 7 sieben Sterne (Abweichung: erwartet sechs)", () => {
    expect(sternzahl(`g=auge&z=m45&s=2&${bed(7)}`).anzahl).toBe(7);
  });

  // Abweichung: deep-sky.md 8 Punkt 4 erwartet am 80 mm hoechstens eine Handvoll, am 200 mm einige
  // Dutzend bis gut hundert Sterne. Grenzgroesse heute 12,77 und 14,39 statt etwa 12 bis 12,5 und 13,5 bis 14.
  it.each([
    ["80 mm, 75-fach", `${R(80, 600, 8)}&z=m13&s=2&${bed(4)}`, 44, 12.77],
    ["200 mm, 150-fach", `g=newton-200-1200&ok=8&z=m13&s=1.5&${bed(4)}`, 281, 14.39],
    ["300 mm, 214-fach", `g=newton-300-1500&ok=7&z=m13&s=1.5&${bed(4)}`, 531, 15.17]
  ])("M13 am %s, Bortle 4: %i Sterne, Grenzgroesse %f (Abweichung, eingefroren)", (_name, such, anzahl, grenze) => {
    const z = sternzahl(such);
    expect(Math.abs(z.anzahl / anzahl - 1)).toBeLessThan(0.1);
    expect(Math.abs(z.grenzgroesse - grenze)).toBeLessThan(0.1);
  });
});
