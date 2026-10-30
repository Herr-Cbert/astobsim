// rendere: aus Simulationsparametern und einer Quelle entsteht der Anblick (docs/architektur.md
// Abschnitt 3): Anblick = tonwert(falte(mittele(quelle, quellbild), kern),
// faltePunkte(male(quellbild.punkte.punktquellen), kern), helligkeit), maskiert mit gesichtsfeld,
// gezeichnet in fenster. Objekt und Punktquellen liegen seit Issue #72 in getrennten Ebenen, weil
// tonwert sie verschieden auf die Anzeige abbildet (docs/recherche/physik.md Abschnitt 14).
// Zwischenergebnisse der Stufen 1, 1b und 2 werden nach Stufenschluessel wiederverwendet, Objekt und
// Punkte getrennt (docs/architektur.md 5.3 und 5.4); der Aufrufer haelt dazu einen Zwischenspeicher.
// Version 2 (Issue #101): tonwert mit den drei Faellen der Flaechenformel und optionaler Faerbung der
// Punktebene; ohne Quellbild (schwarzer Ausschnitt, etwa QuelleLeer) weder mittele noch falte.

import type { Fenster, Gesichtsfeld, Helligkeit, Simulationsparameter } from "../naht/simulationsparameter";
import { pruefeKern, type Falter } from "./falter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import { malePunktquellen, type Scheibchen } from "./male";
import { mittele, skaliere } from "./mittele";
import { brauchtFaerbung, falteFaerbung, faltePunkte } from "./punktebene";
import type { Quelle } from "./quelle";
import { pruefeRaster, type Kanaele, type Raster } from "./raster";

/**
 * Das Ergebnisbild (GLOSSARY: Anblick). Noch nicht in src/naht definiert, deshalb hier.
 * raster hat fenster.px x fenster.px Pixel, Anzeigehelligkeiten (linear, 1 = Bildschirmweiss, Quellweiss
 * erscheint als helligkeit.faktorObjekt), nicht negativ, koennen 1 ueberschreiten; Begrenzung und
 * Bit-Tiefe erst beim Zeichnen. Zeile 0 ist Norden.
 */
export interface Anblick {
  fenster: Fenster;
  /** Anzeigemassstab fenster.breiteArcsec / fenster.px. */
  massstabArcsecProPx: number;
  raster: Raster;
}

/** Behaelt je Stufe das letzte Ergebnis mit seinem Schluessel. Einer je Anzeige, vom Aufrufer als {} angelegt. */
export interface Zwischenspeicher {
  /** Stufe 1: gemitteltes Objektraster (undefined ohne Quellbild: der Ausschnitt ist ganz schwarz). */
  objekt?: { schluessel: string; raster: Raster | undefined; kanaele: Kanaele };
  /** Stufe 1b: die gemalten Punktquellen. */
  punkte?: { schluessel: string; scheibchen: Scheibchen[] };
  /** Stufe 2: gefaltetes Objektraster (undefined ohne Quellbild). */
  gefaltet?: { schluessel: string; raster: Raster | undefined };
  /**
   * Stufe 2: gefaltete Punktebene (undefined ohne Punktquelle im Raster) und Faerbung (undefined,
   * wenn alle Punktquellen grau mit Deckkraft 1 sind).
   */
  punktebene?: { schluessel: string; raster: Raster | undefined; faerbung: Raster | undefined };
}

/** Relative Toleranz fuer Gleichheit von Massstaeben und Breiten, die physik gerundet liefert. */
const TOLERANZ = 1e-6;

function ungefaehrGleich(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANZ * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Wirft BildFehler bei Parametern, die den Invarianten der Naht widersprechen. */
function pruefeParameter(p: Simulationsparameter): void {
  const { quellbild, kern, helligkeit, fenster } = p;
  pruefePositivGanz("fenster.px", fenster.px);
  // Hier pruefen: ohne Quellbild und ohne Punktquelle laeuft weder falte noch faltePunkte.
  pruefeKern(kern);
  if (!(fenster.breiteArcsec > 0)) throw new BildFehler(`fenster.breiteArcsec muss positiv sein, nicht ${fenster.breiteArcsec}`);
  if (!ungefaehrGleich(quellbild.rasterPx * quellbild.massstabArcsecProPx, fenster.breiteArcsec)) {
    throw new BildFehler(`rasterPx * massstab (${quellbild.rasterPx * quellbild.massstabArcsecProPx}) muss fenster.breiteArcsec (${fenster.breiteArcsec}) sein`);
  }
  if (!ungefaehrGleich(kern.massstabArcsecProPx, quellbild.massstabArcsecProPx)) {
    throw new BildFehler(`Kernmassstab ${kern.massstabArcsecProPx} muss dem Arbeitsmassstab ${quellbild.massstabArcsecProPx} gleichen`);
  }
  if (!ungefaehrGleich(quellbild.mitteXArcsec, fenster.mitteXArcsec) || !ungefaehrGleich(quellbild.mitteYArcsec, fenster.mitteYArcsec)) {
    throw new BildFehler("quellbild.mitte muss fenster.mitte gleichen");
  }
  if (!(helligkeit.faktorObjekt >= 0) || !(helligkeit.hintergrundRelativ >= 0)) {
    throw new BildFehler(`Helligkeit: faktorObjekt ${helligkeit.faktorObjekt} und hintergrundRelativ ${helligkeit.hintergrundRelativ} muessen >= 0 sein`);
  }
  if (!(helligkeit.punktFaktor >= 0) || !(helligkeit.punktExponent > 0) || !Number.isFinite(helligkeit.punktExponent)) {
    throw new BildFehler(`Helligkeit: punktFaktor ${helligkeit.punktFaktor} muss >= 0, punktExponent ${helligkeit.punktExponent} positiv sein`);
  }
  if (!(helligkeit.mischgewicht >= 0 && helligkeit.mischgewicht < 1)) {
    throw new BildFehler(`Helligkeit: mischgewicht ${helligkeit.mischgewicht} muss in [0, 1) liegen`);
  }
  const ds = helligkeit.deepSky;
  if (ds !== undefined) {
    // himmel darf negativ sein: das Vergleichsbild (src/ui/zoom.ts, Issue #110) setzt so den Boden der
    // Kennlinie auf Schwarz; deepSkyWert begrenzt die Basis mit max(0, ...). physik liefert himmel >= 0.
    if (!(ds.faktor >= 0) || !(ds.sockel >= 0) || !Number.isFinite(ds.faktor) || !Number.isFinite(ds.himmel) || !Number.isFinite(ds.sockel)) {
      throw new BildFehler(`Helligkeit.deepSky: faktor ${ds.faktor} und sockel ${ds.sockel} muessen endlich und >= 0 sein, himmel ${ds.himmel} endlich`);
    }
    if (!(ds.schwelleRelativ > 0) || !(ds.breite > 0) || !Number.isFinite(ds.schwelleRelativ) || !Number.isFinite(ds.breite)) {
      throw new BildFehler(`Helligkeit.deepSky: schwelleRelativ ${ds.schwelleRelativ} und breite ${ds.breite} muessen positiv sein`);
    }
  }
}

/** true, wenn alle Werte des Rasters 0 sind (Ausschnitt ohne Quellbild, QuelleLeer). */
function istSchwarz(raster: Raster): boolean {
  const d = raster.daten;
  for (let i = 0; i < d.length; i++) if ((d[i] as number) !== 0) return false;
  return true;
}

/** Zusaetzliche Eingaben von tonwert in Version 2. */
export interface TonwertZusatz {
  /** Gefaltete Faerbung (3 Kanaele, Masse der Punktebene); dann hat das Ergebnis 3 Kanaele. */
  faerbung?: Raster;
  /** Kantenlaenge des Arbeitsrasters; noetig, wenn das Objektraster fehlt (ohne Quellbild, q = 0). */
  rasterPx?: number;
  /** Kanaele des fehlenden Objektrasters (Standard 1); mit Objektraster ohne Bedeutung. */
  kanaele?: Kanaele;
}

/**
 * Stufe 3: Tonwert je Arbeitspixel nach dem Vertrag fuer bild (docs/architektur.md 5.3). Eingaben:
 * q das gefaltete Objektraster (1 oder 3 Kanaele; undefined ohne Quellbild, dann q = 0), p die
 * gefaltete Punktebene (1 Kanal, Fluss relativ zu Quellweiss), optional c die gefaltete Faerbung.
 * Flaechenanteil F_k mit f = faktorObjekt, h = hintergrundRelativ, aP = punktFaktor,
 * n = punktExponent, g = mischgewicht, d = deepSky:
 * - d fehlt, g = 0: f * q_k + h (Version 1, gleicher Ausdruck, gleiche Reihenfolge);
 * - d fehlt, g > 0: (1 - g) * f * q_k + h + g * min(1, (aP * q_k)^n) (unaufgeloest, A-P10);
 * - d vorhanden (hat Vorrang vor g): P = Phi((q / d.schwelleRelativ - 1) / d.breite),
 *   F = h + P * (min(1, (d.faktor * q + d.himmel)^n) - h + d.sockel) (ADR-0004 Ebene b).
 * Punktanteil, nur wo p > 0: W = min(1, (aP * p)^n), Pixel_k = F_k + (c ? c_k / p : 1) * W. Ohne c
 * wird W in allen Kanaelen addiert; mit c hat das Ergebnis 3 Kanaele (ein einkanaliges q wird
 * verbreitert). Nicht begrenzt; das geschieht erst beim Zeichnen.
 */
export function tonwert(raster: Raster | undefined, punktebene: Raster | undefined, helligkeit: Helligkeit, zusatz: TonwertZusatz = {}): Raster {
  const faerbung = zusatz.faerbung;
  const breite = raster !== undefined ? raster.breite : zusatz.rasterPx;
  const hoehe = raster !== undefined ? raster.hoehe : zusatz.rasterPx;
  if (breite === undefined || hoehe === undefined) throw new BildFehler("tonwert: ohne Objektraster ist rasterPx noetig");
  pruefePositivGanz("tonwert: Breite", breite);
  pruefePositivGanz("tonwert: Hoehe", hoehe);
  if (punktebene !== undefined && (punktebene.breite !== breite || punktebene.hoehe !== hoehe || punktebene.kanaele !== 1)) {
    throw new BildFehler(`Punktebene ${punktebene.breite}x${punktebene.hoehe}x${punktebene.kanaele} passt nicht zum Raster ${breite}x${hoehe}`);
  }
  if (faerbung !== undefined && (punktebene === undefined || faerbung.breite !== breite || faerbung.hoehe !== hoehe || faerbung.kanaele !== 3)) {
    throw new BildFehler(`Faerbung ${faerbung.breite}x${faerbung.hoehe}x${faerbung.kanaele} braucht eine Punktebene und muss ${breite}x${hoehe}x3 sein`);
  }
  const kanaeleFlaeche = raster !== undefined ? raster.kanaele : (zusatz.kanaele ?? 1);
  const flaeche = flaechenanteil(raster, breite * hoehe * kanaeleFlaeche, helligkeit);
  const kanaele = faerbung !== undefined ? 3 : kanaeleFlaeche;
  const ergebnis = kanaele === kanaeleFlaeche ? flaeche : verbreitere(flaeche);
  const ergebnisRaster: Raster = { breite, hoehe, kanaele, daten: ergebnis };
  if (punktebene === undefined) return ergebnisRaster;
  const p = punktebene.daten;
  const a = helligkeit.punktFaktor;
  const n = helligkeit.punktExponent;
  if (faerbung === undefined) {
    const k = kanaele | 0;
    for (let i = 0; i < p.length; i++) {
      const wert = p[i] as number;
      if (!(wert > 0)) continue;
      const w = Math.min(1, Math.pow(a * wert, n));
      for (let c = i * k; c < (i + 1) * k; c++) ergebnis[c] = (ergebnis[c] as number) + w;
    }
    return ergebnisRaster;
  }
  const fd = faerbung.daten;
  for (let i = 0; i < p.length; i++) {
    const wert = p[i] as number;
    if (!(wert > 0)) continue;
    const w = Math.min(1, Math.pow(a * wert, n));
    for (let c = 3 * i; c < 3 * i + 3; c++) ergebnis[c] = (ergebnis[c] as number) + ((fd[c] as number) / wert) * w;
  }
  return ergebnisRaster;
}

/**
 * Flaechenanteil F je Wert des Objektrasters (Faelle siehe tonwert); ohne Objektraster anzahl
 * Werte F(0). Jeder Fall hat seine eigene Schleife, damit der Fall aus Version 1 Zeichen fuer
 * Zeichen derselbe Ausdruck bleibt. In Fall 2 und 3 nimmt q = 0 den vorab gerechneten Wert F(0)
 * (bitgleich, derselbe Ausdruck; spart pow und exp im leeren Himmel). Die Basis von pow ist mit
 * max(0, ...) abgesichert: ein leicht negatives q aus der Faltung gaebe sonst NaN.
 */
function flaechenanteil(raster: Raster | undefined, anzahl: number, helligkeit: Helligkeit): Float32Array {
  const f = helligkeit.faktorObjekt;
  const h = helligkeit.hintergrundRelativ;
  const g = helligkeit.mischgewicht;
  const ds = helligkeit.deepSky;
  if (raster === undefined) {
    const ergebnis = new Float32Array(anzahl);
    if (ds !== undefined) ergebnis.fill(deepSkyWert(0, h, helligkeit.punktExponent, ds));
    else if (g > 0) ergebnis.fill(mischWert(0, f, h, g, helligkeit.punktFaktor, helligkeit.punktExponent));
    else ergebnis.fill(f * 0 + h);
    return ergebnis;
  }
  const d = raster.daten;
  const ergebnis = new Float32Array(d.length);
  if (ds !== undefined) {
    const n = helligkeit.punktExponent;
    const leer = deepSkyWert(0, h, n, ds);
    for (let i = 0; i < d.length; i++) {
      const q = d[i] as number;
      ergebnis[i] = q === 0 ? leer : deepSkyWert(q, h, n, ds);
    }
  } else if (g > 0) {
    const a = helligkeit.punktFaktor;
    const n = helligkeit.punktExponent;
    const leer = mischWert(0, f, h, g, a, n);
    for (let i = 0; i < d.length; i++) {
      const q = d[i] as number;
      ergebnis[i] = q === 0 ? leer : mischWert(q, f, h, g, a, n);
    }
  } else {
    for (let i = 0; i < d.length; i++) ergebnis[i] = f * (d[i] as number) + h;
  }
  return ergebnis;
}

/** Fall unaufgeloest: (1 - g) f q + h + g min(1, (aP q)^n), Basis von pow nicht negativ. */
function mischWert(q: number, f: number, h: number, g: number, a: number, n: number): number {
  return (1 - g) * f * q + h + g * Math.min(1, Math.pow(Math.max(0, a * q), n));
}

/** Fall Deep-Sky: h + P * (min(1, (a q + s)^n) - h + Sockel) mit P = Phi((q / q* - 1) / Breite). */
function deepSkyWert(q: number, h: number, n: number, ds: NonNullable<Helligkeit["deepSky"]>): number {
  const deckkraft = phi((q / ds.schwelleRelativ - 1) / ds.breite);
  return h + deckkraft * (Math.min(1, Math.pow(Math.max(0, ds.faktor * q + ds.himmel), n)) - h + ds.sockel);
}

/** Einkanalige Werte auf drei gleiche Kanaele. */
function verbreitere(einkanalig: Float32Array): Float32Array {
  const ergebnis = new Float32Array(einkanalig.length * 3);
  for (let i = 0; i < einkanalig.length; i++) {
    const wert = einkanalig[i] as number;
    ergebnis[3 * i] = wert;
    ergebnis[3 * i + 1] = wert;
    ergebnis[3 * i + 2] = wert;
  }
  return ergebnis;
}

/**
 * Verteilungsfunktion der Standardnormalverteilung, Phi(x) = erfc(-x / sqrt 2) / 2, mit erfc nach
 * Abramowitz und Stegun 7.1.26 (absoluter Fehler von erf hoechstens 1,5e-7, weit unter einer
 * 8-Bit-Stufe). Reine Mathematik (docs/architektur.md 5.3), keine Physik.
 */
export function phi(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const polynom = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erfcZ = polynom * Math.exp(-z * z);
  return x >= 0 ? 1 - erfcZ / 2 : erfcZ / 2;
}

/**
 * Maske des wahren Gesichtsfelds (A-D1): Kreis oder Rechteck, zentriert auf die Fenstermitte
 * (Entscheidung Herbert 2026-10-26: die Feldblende des Okulars bleibt in der Mitte, beim
 * Verschieben nach A-D2 wandert das Objekt), Masse in Bogensekunden. Ausserhalb wird Schwarz,
 * entschieden am Pixelmittelpunkt. Pixel (i, j) hat relativ zur Fenstermitte die Mitte bei
 * ((i + 0,5) - px/2, px/2 - (j + 0,5)) * massstab.
 */
export function maskiere(raster: Raster, gesichtsfeld: Gesichtsfeld, fenster: Fenster): Raster {
  const kopie = { ...raster, daten: new Float32Array(raster.daten) };
  maskiereAn(kopie, gesichtsfeld, fenster);
  return kopie;
}

/**
 * Wie maskiere, aber auf dem Raster selbst. rendere nutzt es fuer das Ergebnis von skaliere, das
 * der Pipeline allein gehoert (tonwert legt immer ein neues Raster an): spart eine Kopie des
 * Anzeigebilds je Reglerzug (bei 2048 px und drei Kanaelen 50 MB).
 */
function maskiereAn(raster: Raster, gesichtsfeld: Gesichtsfeld, fenster: Fenster): void {
  const { breite, hoehe, kanaele } = raster;
  const massstab = fenster.breiteArcsec / breite;
  const ergebnis = raster.daten;
  const halbeBreite = gesichtsfeld.breiteArcsec / 2;
  const halbeHoehe = gesichtsfeld.hoeheArcsec / 2;
  const kreis = gesichtsfeld.form === "kreis";
  for (let j = 0; j < hoehe; j++) {
    const y = (hoehe / 2 - (j + 0.5)) * massstab;
    for (let i = 0; i < breite; i++) {
      const x = (i + 0.5 - breite / 2) * massstab;
      const innen = kreis
        ? (x * x) / (halbeBreite * halbeBreite) + (y * y) / (halbeHoehe * halbeHoehe) <= 1
        : Math.abs(x) <= halbeBreite && Math.abs(y) <= halbeHoehe;
      if (!innen) ergebnis.fill(0, (j * breite + i) * kanaele, (j * breite + i + 1) * kanaele);
    }
  }
}

/**
 * Fuehrt die Pipeline aus. Stufe 1 (Ausschnitt holen, mitteln) wird unter quellbild.schluessel
 * behalten; ist der Ausschnitt ganz schwarz (Zustand ohne Quellbild, QuelleLeer, oder Fenster ganz
 * neben dem Bild), gibt es kein Objektraster, weder mittele noch falte laufen, tonwert rechnet mit
 * q = 0 und den Kanaelen des Ausschnitts (docs/architektur.md 5.3; das Ergebnis gleicht dem
 * gefalteten Nullraster). Stufe 1b (Punktquellen malen) unter quellbild.schluessel plus
 * quellbild.punkte.schluessel, weil das Malen auch Massstab, Raster und Mitte braucht. Stufe 2
 * getrennt: die Faltung des Objekts mit dem Falter unter kern.schluessel plus Objektschluessel, die
 * der Punktebene (lokal in punktebene.ts) unter kern.schluessel plus Punkteschluessel.
 * Wer den Zwischenspeicher weglaesst, rechnet alles neu. Der Zwischenspeicher gehoert zu genau
 * einer Quelle; bei Wechsel der Quelle einen neuen anlegen.
 */
export function rendere(parameter: Simulationsparameter, quelle: Quelle, falter: Falter, zwischen: Zwischenspeicher = {}): Anblick {
  pruefeParameter(parameter);
  const { quellbild, kern, helligkeit, gesichtsfeld, fenster } = parameter;

  let objekt = zwischen.objekt;
  if (!objekt || objekt.schluessel !== quellbild.schluessel) {
    const mitte = { xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec };
    const ausschnitt = quelle.ausschnitt(mitte, quellbild.rasterPx * quellbild.massstabArcsecProPx, quellbild.massstabArcsecProPx);
    pruefeRaster(ausschnitt.raster, "Quellausschnitt");
    const raster = istSchwarz(ausschnitt.raster) ? undefined : mittele(ausschnitt, quellbild);
    objekt = { schluessel: quellbild.schluessel, raster, kanaele: ausschnitt.raster.kanaele };
    zwischen.objekt = objekt;
  }

  const schluesselPunkte = `${quellbild.schluessel}|${quellbild.punkte.schluessel}`;
  let punkte = zwischen.punkte;
  if (!punkte || punkte.schluessel !== schluesselPunkte) {
    punkte = { schluessel: schluesselPunkte, scheibchen: malePunktquellen(quellbild) };
    zwischen.punkte = punkte;
  }

  const schluesselGefaltet = `${kern.schluessel}|${objekt.schluessel}`;
  let gefaltet = zwischen.gefaltet;
  if (!gefaltet || gefaltet.schluessel !== schluesselGefaltet) {
    gefaltet = { schluessel: schluesselGefaltet, raster: objekt.raster === undefined ? undefined : falter.falte(objekt.raster, kern) };
    zwischen.gefaltet = gefaltet;
  }

  const schluesselPunktebene = `${kern.schluessel}|${punkte.schluessel}`;
  let punktebene = zwischen.punktebene;
  if (!punktebene || punktebene.schluessel !== schluesselPunktebene) {
    const raster = faltePunkte(punkte.scheibchen, kern, quellbild.rasterPx);
    const faerbung = raster !== undefined && brauchtFaerbung(punkte.scheibchen) ? falteFaerbung(punkte.scheibchen, kern, quellbild.rasterPx) : undefined;
    punktebene = { schluessel: schluesselPunktebene, raster, faerbung };
    zwischen.punktebene = punktebene;
  }

  const zusatz: TonwertZusatz = { rasterPx: quellbild.rasterPx, kanaele: objekt.kanaele };
  if (punktebene.faerbung !== undefined) zusatz.faerbung = punktebene.faerbung;
  const getont = tonwert(gefaltet.raster, punktebene.raster, helligkeit, zusatz);
  const raster = skaliere(getont, fenster.px);
  maskiereAn(raster, gesichtsfeld, fenster);
  return { fenster, massstabArcsecProPx: fenster.breiteArcsec / fenster.px, raster };
}
