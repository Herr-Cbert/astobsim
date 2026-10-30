// rendere: aus Simulationsparametern und einer Quelle entsteht der Anblick (docs/architektur.md
// Abschnitt 3): Anblick = tonwert(falte(mittele(quelle, quellbild), kern),
// faltePunkte(male(quellbild.punkte.punktquellen), kern), helligkeit), maskiert mit gesichtsfeld,
// gezeichnet in fenster. Objekt und Punktquellen liegen seit Issue #72 in getrennten Ebenen, weil
// tonwert sie verschieden auf die Anzeige abbildet (docs/recherche/physik.md Abschnitt 14).
// Zwischenergebnisse der Stufen 1, 1b und 2 werden nach Stufenschluessel wiederverwendet, Objekt und
// Punkte getrennt (docs/architektur.md 5.3 und 5.4); der Aufrufer haelt dazu einen Zwischenspeicher.
// Version 2 (Issue #101): tonwert mit den drei Faellen der Flaechenformel und optionaler Faerbung der
// Punktebene; ohne Quellbild (schwarzer Ausschnitt, etwa QuelleLeer) weder mittele noch falte.
// Issue #135: im Fall unaufgeloest geht der Mischanteil durch eine zweite Faltung mit halokern
// (Randfenster, docs/recherche/physik.md Abschnitt 28), sonst stuende der Planet in einem Quadrat.
// Issue #136: Begleiter (M32 bei M31) kommen aus eigenen Quellen, werden je fuer sich gemittelt und
// gefaltet (nur im Teilfenster um ihr Licht) und bekommen in tonwert eine eigene Deckkraft
// (ADR-0004 Nachtrag, docs/recherche/physik.md Abschnitt 29).
// Issue #145: mit parameter.punktkern liegt die Punktebene auf einem feineren Raster (bis fuenffach,
// hoechstens so fein wie die Anzeige); Flaeche und Punktanteil werden dann getrennt auf die Anzeige
// skaliert und erst dort addiert (docs/recherche/physik.md Abschnitt 31).

import type { Fenster, Gesichtsfeld, Helligkeit, Kern, Quellbild, Simulationsparameter } from "../naht/simulationsparameter";
import { pruefeKern, type Falter } from "./falter";
import { BildFehler, pruefePositivGanz } from "./fehler";
import { malePunktquellen, type Scheibchen } from "./male";
import { mittele, skaliere } from "./mittele";
import { brauchtFaerbung, falteFaerbung, faltePunkte, FENSTER_ENDE_ZUSATZ_PX, halokern } from "./punktebene";
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
  /** Stufe 2, nur im Fall unaufgeloest: Objektraster mit halokern gefaltet (Issue #135). */
  halo?: { schluessel: string; raster: Raster };
  /** Stufe 1 je Begleiter (Issue #136, #141): gemittelt, undefined ohne Licht im Fenster; unabhaengig vom Kern. */
  begleiterGemittelt?: { schluessel: string; raster: Raster | undefined }[];
  /** Stufe 2 je Begleiter (Issue #136): gefaltet (im Teilfenster), undefined ohne Licht im Fenster. */
  begleiter?: { schluessel: string; raster: Raster | undefined }[];
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
  if (p.punktkern !== undefined) {
    pruefeKern(p.punktkern);
    const punktPx = Math.round(fenster.breiteArcsec / p.punktkern.massstabArcsecProPx);
    if (!(punktPx > quellbild.rasterPx) || !ungefaehrGleich(punktPx * p.punktkern.massstabArcsecProPx, fenster.breiteArcsec)) {
      throw new BildFehler(`Punktkern: Massstab ${p.punktkern.massstabArcsecProPx} muss fenster.breiteArcsec / punktPx mit ganzzahligem punktPx > rasterPx sein`);
    }
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
    // Begleiter (Issue #141): dieselben Bedingungen wie fuer das Hauptobjekt, sonst rechnet tonwert NaN.
    for (const [k, b] of (ds.begleiter ?? []).entries()) {
      if (!(b.schwelleRelativ > 0) || !Number.isFinite(b.schwelleRelativ) || !(b.sockel >= 0) || !Number.isFinite(b.sockel)) {
        throw new BildFehler(`Helligkeit.deepSky.begleiter[${k}]: schwelleRelativ ${b.schwelleRelativ} muss positiv, sockel ${b.sockel} >= 0 sein, beide endlich`);
      }
    }
  }
}

/** Quellbild, Kern und Ende des Randfensters (faltePunkte) fuer die Punktebene. */
export interface Punktbasis {
  quellbild: Quellbild;
  kern: Kern;
  randZusatzPx: number;
}

/**
 * Quellbild und Kern der Punktebene (Issue #145, physik.md Abschnitt 31): mit parameter.punktkern
 * das Quellbild auf dessen Raster, punktPx = fenster.breiteArcsec / punktkern.massstabArcsecProPx
 * (gerundet), gleiche Mitte, also gleiche linke obere Ecke und dieselben Punktquellen; sonst
 * Quellbild und Kern des Arbeitsrasters. Werte der Punktebene bleiben relativ zu Quellweiss (eine
 * Flaechenhelligkeit), unabhaengig vom Massstab. Der Schluessel des Quellbilds bekommt punktPx
 * angehaengt, damit Stufe 1b je Raster gilt. randZusatzPx: das Randfenster (physik.md 24) endet
 * wie am Arbeitsraster ein halbes Arbeitspixel ausserhalb des Kernradius, in Pixeln der Punktebene
 * 0,5 * punktPx / rasterPx.
 */
export function punktquellbild(parameter: Simulationsparameter): Punktbasis {
  const { quellbild, punktkern, fenster } = parameter;
  if (punktkern === undefined) return { quellbild, kern: parameter.kern, randZusatzPx: FENSTER_ENDE_ZUSATZ_PX };
  const rasterPx = Math.round(fenster.breiteArcsec / punktkern.massstabArcsecProPx);
  return {
    quellbild: { ...quellbild, schluessel: `${quellbild.schluessel}|punkte ${rasterPx}`, massstabArcsecProPx: fenster.breiteArcsec / rasterPx, rasterPx },
    kern: punktkern,
    randZusatzPx: (FENSTER_ENDE_ZUSATZ_PX * rasterPx) / quellbild.rasterPx
  };
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
  /**
   * Objektraster mit halokern gefaltet (Issue #135), Masse wie das Objektraster; nur im Fall
   * unaufgeloest genutzt, dort fuer den Mischanteil. Fehlt es, gilt q (wie vor #135).
   */
  halo?: Raster;
  /**
   * Gefaltete Begleiterraster (Issue #136), Masse und Kanaele wie das Objektraster, Werte relativ zu
   * Quellweiss des Hauptobjekts; undefined fuer einen Begleiter ohne Licht im Fenster. Mit
   * deepSky.begleiter (gleiche Anzahl) eigene Deckkraft je Begleiter, ohne deepSky werden sie zum
   * Objektraster addiert (Vergleichsbild linear).
   */
  begleiter?: (Raster | undefined)[];
}

/**
 * Stufe 3: Tonwert je Arbeitspixel nach dem Vertrag fuer bild (docs/architektur.md 5.3). Eingaben:
 * q das gefaltete Objektraster (1 oder 3 Kanaele; undefined ohne Quellbild, dann q = 0), p die
 * gefaltete Punktebene (1 Kanal, Fluss relativ zu Quellweiss), optional c die gefaltete Faerbung.
 * Flaechenanteil F_k mit f = faktorObjekt, h = hintergrundRelativ, aP = punktFaktor,
 * n = punktExponent, g = mischgewicht, d = deepSky:
 * - d fehlt, g = 0: f * q_k + h (Version 1, gleicher Ausdruck, gleiche Reihenfolge);
 * - d fehlt, g > 0: (1 - g) * f * q_k + h + g * min(1, (aP * qH_k)^n) (unaufgeloest, A-P10), qH das
 *   Objektraster mit halokern gefaltet (zusatz.halo, Issue #135), ohne zusatz.halo qH = q;
 * - d vorhanden (hat Vorrang vor g): P = Phi((q / d.schwelleRelativ - 1) / d.breite),
 *   F = h + P * (min(1, (d.faktor * q + d.himmel)^n) - h + d.sockel) (ADR-0004 Ebene b);
 *   mit Begleitern (zusatz.begleiter, d.begleiter, Issue #136) kommt je Begleiter k mit q_k > 0 der
 *   Zuwachs P'_k * (Z(Q_k) - Z(Q_(k-1)) + sockel_k) dazu, Z(x) = min(1, (d.faktor * x + d.himmel)^n),
 *   Q_0 = q, Q_k = Q_(k-1) + q_k, P'_k = max(0, (P_k - P0) / (1 - P0)), P_k = Phi((q_k / q*_k - 1) / d.breite),
 *   P0 = Phi(-1 / d.breite). Ohne Begleiter derselbe Ausdruck wie bisher.
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
  const halo = zusatz.halo;
  if (halo !== undefined && (raster === undefined || halo.breite !== breite || halo.hoehe !== hoehe || halo.kanaele !== raster.kanaele)) {
    throw new BildFehler(`Halo ${halo.breite}x${halo.hoehe}x${halo.kanaele} braucht ein Objektraster gleicher Masse`);
  }
  const begleiter = pruefeBegleiter(zusatz.begleiter, breite, hoehe, kanaeleFlaeche, helligkeit);
  const ds = helligkeit.deepSky;
  const flaeche =
    begleiter.length === 0
      ? flaechenanteil(raster, breite * hoehe * kanaeleFlaeche, helligkeit, halo)
      : ds?.begleiter !== undefined
        ? flaechenanteilMitBegleitern(raster, breite * hoehe * kanaeleFlaeche, helligkeit.hintergrundRelativ, helligkeit.punktExponent, ds, begleiter)
        : flaechenanteil(summe(raster, begleiter, breite, hoehe, kanaeleFlaeche), breite * hoehe * kanaeleFlaeche, helligkeit, halo);
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
 * Punktanteil allein (Issue #145): je Pixel der Punktebene W = min(1, (aP * p)^n), mit Faerbung
 * c_k / p * W je Kanal, wo p > 0, sonst 0; derselbe Ausdruck wie in tonwert. Fuer die feinere
 * Punktebene, die rendere getrennt von der Flaeche auf die Anzeige skaliert. Ergebnis 1 Kanal ohne,
 * 3 Kanaele mit Faerbung.
 */
export function punktanteil(punktebene: Raster, helligkeit: Helligkeit, faerbung?: Raster): Raster {
  const { breite, hoehe } = punktebene;
  if (punktebene.kanaele !== 1) throw new BildFehler(`Punktebene braucht 1 Kanal, nicht ${punktebene.kanaele}`);
  if (faerbung !== undefined && (faerbung.breite !== breite || faerbung.hoehe !== hoehe || faerbung.kanaele !== 3)) {
    throw new BildFehler(`Faerbung ${faerbung.breite}x${faerbung.hoehe}x${faerbung.kanaele} muss ${breite}x${hoehe}x3 sein`);
  }
  const p = punktebene.daten;
  const a = helligkeit.punktFaktor;
  const n = helligkeit.punktExponent;
  if (faerbung === undefined) {
    const daten = new Float32Array(p.length);
    for (let i = 0; i < p.length; i++) {
      const wert = p[i] as number;
      if (wert > 0) daten[i] = Math.min(1, Math.pow(a * wert, n));
    }
    return { breite, hoehe, kanaele: 1, daten };
  }
  const fd = faerbung.daten;
  const daten = new Float32Array(3 * p.length);
  for (let i = 0; i < p.length; i++) {
    const wert = p[i] as number;
    if (!(wert > 0)) continue;
    const w = Math.min(1, Math.pow(a * wert, n));
    for (let c = 3 * i; c < 3 * i + 3; c++) daten[c] = ((fd[c] as number) / wert) * w;
  }
  return { breite, hoehe, kanaele: 3, daten };
}

/** Addiert den skalierten Punktanteil (1 oder 3 Kanaele) zur skalierten Flaeche; gleiche Breite und Hoehe. */
function addierePunkte(flaeche: Raster, punkte: Raster): Raster {
  const ziel: Raster = punkte.kanaele === 3 && flaeche.kanaele === 1 ? { ...flaeche, kanaele: 3, daten: verbreitere(flaeche.daten) } : flaeche;
  const d = ziel.daten;
  const q = punkte.daten;
  const k = ziel.kanaele;
  if (punkte.kanaele === k) {
    for (let i = 0; i < d.length; i++) d[i] = (d[i] as number) + (q[i] as number);
  } else {
    for (let i = 0; i < q.length; i++) {
      const w = q[i] as number;
      for (let c = i * k; c < (i + 1) * k; c++) d[c] = (d[c] as number) + w;
    }
  }
  return ziel;
}

/**
 * Flaechenanteil F je Wert des Objektrasters (Faelle siehe tonwert); ohne Objektraster anzahl
 * Werte F(0). Jeder Fall hat seine eigene Schleife, damit der Fall aus Version 1 Zeichen fuer
 * Zeichen derselbe Ausdruck bleibt. In Fall 2 und 3 nimmt q = 0 den vorab gerechneten Wert F(0)
 * (bitgleich, derselbe Ausdruck; spart pow und exp im leeren Himmel). Die Basis von pow ist mit
 * max(0, ...) abgesichert: ein leicht negatives q aus der Faltung gaebe sonst NaN. halo ist qH aus
 * Fall 2 (fehlt es, qH = q); der schnelle Weg gilt dort nur, wenn q und qH beide 0 sind.
 */
function flaechenanteil(raster: Raster | undefined, anzahl: number, helligkeit: Helligkeit, halo?: Raster): Float32Array {
  const f = helligkeit.faktorObjekt;
  const h = helligkeit.hintergrundRelativ;
  const g = helligkeit.mischgewicht;
  const ds = helligkeit.deepSky;
  if (raster === undefined) {
    const ergebnis = new Float32Array(anzahl);
    if (ds !== undefined) ergebnis.fill(deepSkyWert(0, h, helligkeit.punktExponent, ds));
    else if (g > 0) ergebnis.fill(mischWert(0, 0, f, h, g, helligkeit.punktFaktor, helligkeit.punktExponent));
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
    const leer = mischWert(0, 0, f, h, g, a, n);
    const dh = halo !== undefined ? halo.daten : d;
    for (let i = 0; i < d.length; i++) {
      const q = d[i] as number;
      const qh = dh[i] as number;
      ergebnis[i] = q === 0 && qh === 0 ? leer : mischWert(q, qh, f, h, g, a, n);
    }
  } else {
    for (let i = 0; i < d.length; i++) ergebnis[i] = f * (d[i] as number) + h;
  }
  return ergebnis;
}

/**
 * Prueft die Begleiterraster gegen das Arbeitsraster und deepSky.begleiter; liefert sie als Liste
 * (leer ohne Begleiter oder wenn keiner Licht im Fenster hat und deepSky keine Begleiter nennt).
 */
function pruefeBegleiter(begleiter: (Raster | undefined)[] | undefined, breite: number, hoehe: number, kanaele: number, helligkeit: Helligkeit): (Raster | undefined)[] {
  const liste = begleiter ?? [];
  const ds = helligkeit.deepSky;
  if (ds?.begleiter !== undefined && ds.begleiter.length !== liste.length) {
    throw new BildFehler(`deepSky nennt ${ds.begleiter.length} Begleiter, tonwert bekommt ${liste.length} Raster`);
  }
  if (ds !== undefined && ds.begleiter === undefined && liste.length > 0) {
    throw new BildFehler("Begleiterraster ohne Schwelle in deepSky.begleiter");
  }
  for (const b of liste) {
    if (b !== undefined && (b.breite !== breite || b.hoehe !== hoehe || b.kanaele !== kanaele)) {
      throw new BildFehler(`Begleiter ${b.breite}x${b.hoehe}x${b.kanaele} passt nicht zum Raster ${breite}x${hoehe}x${kanaele}`);
    }
  }
  return ds?.begleiter !== undefined || liste.some((b) => b !== undefined) ? liste : [];
}

/** Objektraster plus alle Begleiter (Vergleichsbild ohne deepSky); undefined, wenn alles fehlt. */
function summe(raster: Raster | undefined, begleiter: (Raster | undefined)[], breite: number, hoehe: number, kanaele: Kanaele): Raster | undefined {
  const vorhanden = begleiter.filter((b): b is Raster => b !== undefined);
  if (vorhanden.length === 0) return raster;
  const daten = raster !== undefined ? new Float32Array(raster.daten) : new Float32Array(breite * hoehe * kanaele);
  for (const b of vorhanden) for (let i = 0; i < daten.length; i++) daten[i] = (daten[i] as number) + (b.daten[i] as number);
  return { breite, hoehe, kanaele, daten };
}

/**
 * Fall Deep-Sky mit Begleitern (Issue #136, Formel in tonwert): je Pixel der Wert des Hauptobjekts
 * nach deepSkyWert, dazu je Begleiter mit q_k > 0 sein Zuwachs mit eigener Deckkraft P'_k.
 * Ohne Objektraster ist q = 0.
 */
function flaechenanteilMitBegleitern(
  raster: Raster | undefined,
  anzahl: number,
  h: number,
  n: number,
  ds: NonNullable<Helligkeit["deepSky"]>,
  begleiter: (Raster | undefined)[]
): Float32Array {
  const schwellen = ds.begleiter ?? [];
  const p0 = phi(-1 / ds.breite);
  const d = raster?.daten;
  const leer = deepSkyWert(0, h, n, ds);
  const ergebnis = new Float32Array(anzahl);
  const z = (x: number): number => Math.min(1, Math.pow(Math.max(0, ds.faktor * x + ds.himmel), n));
  for (let i = 0; i < anzahl; i++) {
    const q = d !== undefined ? (d[i] as number) : 0;
    let wert = q === 0 ? leer : deepSkyWert(q, h, n, ds);
    let basis = q;
    for (let k = 0; k < begleiter.length; k++) {
      const qk = begleiter[k]?.daten[i];
      if (qk === undefined || !(qk > 0)) continue;
      const s = schwellen[k]!;
      const deckkraft = Math.max(0, (phi((qk / s.schwelleRelativ - 1) / ds.breite) - p0) / (1 - p0));
      const vorher = z(basis);
      basis += qk;
      wert += deckkraft * (z(basis) - vorher + s.sockel);
    }
    ergebnis[i] = wert;
  }
  return ergebnis;
}

/**
 * Faltet ein Begleiterraster nur im Teilfenster um sein Licht (Issue #136): Rechteck um alle Werte
 * ungleich 0, um den Kernradius erweitert und auf das Raster begrenzt. Das Ergebnis gleicht der
 * Faltung des ganzen Rasters: ausserhalb liegt alles weiter als der Kernradius vom Licht (0), und am
 * Rand des Teilfensters klemmt der Falter auf Werte 0 statt auf die (ebenfalls 0) des ganzen Rasters,
 * ausser wo das Teilfenster am Rasterrand endet, dort gleich. undefined, wenn alles 0 ist.
 */
export function falteTeilfenster(raster: Raster, kern: Kern, falter: Falter): Raster | undefined {
  const { breite, hoehe, kanaele, daten } = raster;
  let x0 = breite;
  let x1 = -1;
  let y0 = hoehe;
  let y1 = -1;
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      for (let c = 0; c < kanaele; c++) {
        if ((daten[(y * breite + x) * kanaele + c] as number) !== 0) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
  }
  if (x1 < 0) return undefined;
  const r = kern.radius;
  x0 = Math.max(0, x0 - r);
  y0 = Math.max(0, y0 - r);
  x1 = Math.min(breite - 1, x1 + r);
  y1 = Math.min(hoehe - 1, y1 + r);
  const tb = x1 - x0 + 1;
  const th = y1 - y0 + 1;
  const teil: Raster = { breite: tb, hoehe: th, kanaele, daten: new Float32Array(tb * th * kanaele) };
  for (let y = 0; y < th; y++) {
    const von = ((y + y0) * breite + x0) * kanaele;
    teil.daten.set(daten.subarray(von, von + tb * kanaele), y * tb * kanaele);
  }
  const gefaltet = falter.falte(teil, kern);
  const ergebnis: Raster = { breite, hoehe, kanaele, daten: new Float32Array(daten.length) };
  for (let y = 0; y < th; y++) {
    const nach = ((y + y0) * breite + x0) * kanaele;
    ergebnis.daten.set(gefaltet.daten.subarray(y * tb * kanaele, (y + 1) * tb * kanaele), nach);
  }
  return ergebnis;
}

/** Fall unaufgeloest: (1 - g) f q + h + g min(1, (aP qH)^n), Basis von pow nicht negativ. */
function mischWert(q: number, qh: number, f: number, h: number, g: number, a: number, n: number): number {
  return (1 - g) * f * q + h + g * Math.min(1, Math.pow(Math.max(0, a * qh), n));
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
 * der Punktebene (lokal in punktebene.ts) unter kern.schluessel plus Punkteschluessel. Im Fall
 * unaufgeloest (mischgewicht > 0, ohne deepSky, mit Objektraster, Kern kein Delta) faltet der Falter das Objekt
 * zusaetzlich mit halokern, unter dessen Schluessel plus Objektschluessel (Issue #135).
 * begleiter (Issue #136): je Begleiter des Zustands seine Quelle, in der Reihenfolge von
 * helligkeit.deepSky.begleiter; Ausschnitt und mittele unter Objektschluessel plus Index (Stufe 1,
 * unabhaengig vom Kern, Issue #141), die Faltung im Teilfenster (falteTeilfenster) unter
 * kern.schluessel plus diesem Schluessel.
 * Wer den Zwischenspeicher weglaesst, rechnet alles neu. Der Zwischenspeicher gehoert zu genau
 * einer Quelle; bei Wechsel der Quelle einen neuen anlegen.
 */
export function rendere(
  parameter: Simulationsparameter,
  quelle: Quelle,
  falter: Falter,
  zwischen: Zwischenspeicher = {},
  begleiter: readonly Quelle[] = []
): Anblick {
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

  const punktbasis = punktquellbild(parameter);
  const schluesselPunkte = `${punktbasis.quellbild.schluessel}|${quellbild.punkte.schluessel}`;
  let punkte = zwischen.punkte;
  if (!punkte || punkte.schluessel !== schluesselPunkte) {
    punkte = { schluessel: schluesselPunkte, scheibchen: malePunktquellen(punktbasis.quellbild) };
    zwischen.punkte = punkte;
  }

  const schluesselGefaltet = `${kern.schluessel}|${objekt.schluessel}`;
  let gefaltet = zwischen.gefaltet;
  if (!gefaltet || gefaltet.schluessel !== schluesselGefaltet) {
    gefaltet = { schluessel: schluesselGefaltet, raster: objekt.raster === undefined ? undefined : falter.falte(objekt.raster, kern) };
    zwischen.gefaltet = gefaltet;
  }

  const schluesselPunktebene = `${punktbasis.kern.schluessel}|${punkte.schluessel}`;
  let punktebene = zwischen.punktebene;
  if (!punktebene || punktebene.schluessel !== schluesselPunktebene) {
    const punktPx = punktbasis.quellbild.rasterPx;
    const { kern: punktkern, randZusatzPx } = punktbasis;
    const raster = faltePunkte(punkte.scheibchen, punktkern, punktPx, randZusatzPx);
    const faerbung = raster !== undefined && brauchtFaerbung(punkte.scheibchen) ? falteFaerbung(punkte.scheibchen, punktkern, punktPx, randZusatzPx) : undefined;
    punktebene = { schluessel: schluesselPunktebene, raster, faerbung };
    zwischen.punktebene = punktebene;
  }

  // Feinere Punktebene (Issue #145): tonwert nur fuer die Flaeche, der Punktanteil getrennt.
  const fein = parameter.punktkern !== undefined ? punktebene.raster : undefined;
  const zusatz: TonwertZusatz = { rasterPx: quellbild.rasterPx, kanaele: objekt.kanaele };
  if (punktebene.faerbung !== undefined && fein === undefined) zusatz.faerbung = punktebene.faerbung;
  // Ein Delta (Radius 0, Vergleichsbild) hat kein Randfenster: halokern gleicht dem Kern, qH = q.
  if (helligkeit.deepSky === undefined && helligkeit.mischgewicht > 0 && objekt.raster !== undefined && kern.radius > 0) {
    const kernHalo = halokern(kern, helligkeit.punktExponent);
    const schluesselHalo = `${kernHalo.schluessel}|${objekt.schluessel}`;
    let halo = zwischen.halo;
    if (!halo || halo.schluessel !== schluesselHalo) {
      halo = { schluessel: schluesselHalo, raster: falter.falte(objekt.raster, kernHalo) };
      zwischen.halo = halo;
    }
    zusatz.halo = halo.raster;
  }
  if (begleiter.length > 0) {
    const gemittelt = zwischen.begleiterGemittelt ?? [];
    const gespeichert = zwischen.begleiter ?? [];
    zusatz.begleiter = begleiter.map((b, k) => {
      const schluesselGemittelt = `${objekt.schluessel}|begleiter ${k}`;
      let stufe1 = gemittelt[k];
      if (!stufe1 || stufe1.schluessel !== schluesselGemittelt) {
        const mitte = { xArcsec: quellbild.mitteXArcsec, yArcsec: quellbild.mitteYArcsec };
        const ausschnitt = b.ausschnitt(mitte, quellbild.rasterPx * quellbild.massstabArcsecProPx, quellbild.massstabArcsecProPx);
        pruefeRaster(ausschnitt.raster, "Begleiterausschnitt");
        stufe1 = { schluessel: schluesselGemittelt, raster: istSchwarz(ausschnitt.raster) ? undefined : mittele(ausschnitt, quellbild) };
        gemittelt[k] = stufe1;
      }
      const schluessel = `${kern.schluessel}|${schluesselGemittelt}`;
      let eintrag = gespeichert[k];
      if (!eintrag || eintrag.schluessel !== schluessel) {
        eintrag = { schluessel, raster: stufe1.raster === undefined ? undefined : falteTeilfenster(stufe1.raster, kern, falter) };
        gespeichert[k] = eintrag;
      }
      return eintrag.raster;
    });
    zwischen.begleiterGemittelt = gemittelt;
    zwischen.begleiter = gespeichert;
  }
  let raster: Raster;
  if (fein !== undefined) {
    const flaeche = skaliere(tonwert(gefaltet.raster, undefined, helligkeit, zusatz), fenster.px);
    raster = addierePunkte(flaeche, skaliere(punktanteil(fein, helligkeit, punktebene.faerbung), fenster.px));
  } else {
    raster = skaliere(tonwert(gefaltet.raster, punktebene.raster, helligkeit, zusatz), fenster.px);
  }
  maskiereAn(raster, gesichtsfeld, fenster);
  return { fenster, massstabArcsecProPx: fenster.breiteArcsec / fenster.px, raster };
}
