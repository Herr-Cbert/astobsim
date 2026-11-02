// Farbkopplung (Issue #146, docs/recherche/physik.md Abschnitt 32): ein Begleiter, der nicht
// getrennt erscheint, hat keine eigene Farbe. Die Faerbung der Punktebene (bild, physik.md 14 und 31)
// mischt flussgewichtet; ohne Kopplung zeigte sie Antares B bei 1,5'' Seeing als blaeulichen Fleck und
// eine blaue Sichel jenseits des Halos von A, obwohl die Helligkeit keine Einsattelung hat (T9b, T9c).
// Beobachter ordnen B die Farbe erst zu, wenn er als eigener Fleck erscheint (doppelsterne.md 10).
//
// Je Paar sichtbarer Punktquellen die Delle delta wie doppelsterne.md 4 im feinen Modell: der Kern der
// Gesamt-PSF mit etwa 12,5 Pixeln je Gesamt-FWHM (farbkern, aus auswerten), die beiden Quellen als
// Punkte, das Profil entlang der Verbindungslinie. Unabhaengig von Fenster und Anzeige. Kopplung
// sigma = min(1, delta / SCHWELLE_ERKENNBAR); jede Quelle bekommt als Anzeigefarbe (farbeAnzeige) das
// flussgewichtete Mittel aus ihrer eigenen Farbe und den Farben der Nachbarn, diese mit (1 - sigma)
// gewichtet. farbe bleibt die eigene Farbe, das Vergleichsbild (ui/zoom.ts) zeigt sie.

import type { Kern, Punktquelle } from "../naht/simulationsparameter";
import { delleImProfil } from "./kern";
import { KERN_RADIUS_PRO_FWHM, SCHWELLE_ERKENNBAR } from "./konstanten";

/** Ein Paar sichtbarer Punktquellen mit sich ueberlappenden Kernen: Indizes in punkte, Delle, Kopplung. */
export interface Farbpaar {
  a: number;
  b: number;
  /** Delle 1 - I_min / I_B im feinen Modell (doppelsterne.md 4); 0 ohne zweites Maximum. */
  delle: number;
  /** min(1, delle / SCHWELLE_ERKENNBAR): 0 nicht getrennt (gemeinsame Farbe), 1 getrennt (eigene Farbe). */
  sigma: number;
}

const GRAU: readonly [number, number, number] = [1, 1, 1];

/** Fluss einer Punktquelle wie in male (helligkeitRelativ mal Flaeche, der Faktor pi/4 kuerzt sich). */
const fluss = (p: Punktquelle): number => p.helligkeitRelativ * p.durchmesserArcsec * p.durchmesserArcsec;

/** Groesster Abstand, bei dem sich zwei Kerne mit Radius 3 Gesamt-FWHM ueberlappen. */
export function farbreichweiteArcsec(gesamtFwhmArcsec: number): number {
  return 2 * KERN_RADIUS_PRO_FWHM * gesamtFwhmArcsec;
}

/** Gleiche Farbe (fehlend = grau): dann aendert die Kopplung nichts. */
function gleicheFarbe(p: Punktquelle, q: Punktquelle): boolean {
  const a = p.farbe ?? GRAU;
  const b = q.farbe ?? GRAU;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * true, wenn zwei sichtbare Punktquellen naeher als reichweiteArcsec liegen und verschiedene Farben
 * tragen; nur dann braucht auswerten den farbkern. Laeuft bei jedem auswerten: ein Paar braucht
 * mindestens eine farbige Quelle, gesucht wird also nur von den farbigen aus (M13: alle grau, kein Paar).
 */
export function farbkopplungNoetig(punkte: readonly Punktquelle[], reichweiteArcsec: number): boolean {
  const sichtbar = punkte.filter((p) => p.sichtbar);
  const r2 = reichweiteArcsec * reichweiteArcsec;
  for (let i = 0; i < sichtbar.length; i++) {
    const p = sichtbar[i]!;
    if (p.farbe === undefined) continue;
    for (let j = 0; j < sichtbar.length; j++) {
      const q = sichtbar[j]!;
      if (j === i) continue;
      const dx = q.xArcsec - p.xArcsec;
      if (dx * dx >= r2) continue;
      const dy = q.yArcsec - p.yArcsec;
      if (dx * dx + dy * dy < r2 && !gleicheFarbe(p, q)) return true;
    }
  }
  return false;
}

/** Radialprofil des Kerns (Mittelzeile, linear zwischen den Pixeln), r in Bogensekunden; ausserhalb des Radius 0. */
function radialprofil(kern: Kern): (rArcsec: number) => number {
  const { groesse, radius, massstabArcsecProPx, daten } = kern;
  const zeile = radius * groesse + radius;
  return (rArcsec) => {
    const u = Math.abs(rArcsec) / massstabArcsecProPx;
    if (u >= radius) return 0;
    const i = Math.floor(u);
    const f = u - i;
    return (1 - f) * daten[zeile + i]! + f * daten[zeile + i + 1]!;
  };
}

/**
 * Delle zweier Punkte mit Fluss fa und fb im Abstand abstandArcsec im feinen Modell (doppelsterne.md 4):
 * Profil fa K(x) + fb K(x - abstand) von 0,3 Abstaenden vor dem ersten bis 0,3 hinter dem zweiten, in
 * Schritten von hoechstens einem halben Pixel des Kerns; Delle 1 - Minimum / kleineres der hoechsten
 * Maxima links und rechts, ohne lokales Minimum 0.
 */
export function paarDelle(kern: Kern, abstandArcsec: number, fa: number, fb: number): number {
  const k = radialprofil(kern);
  const anzahl = Math.max(20, Math.ceil((1.6 * abstandArcsec) / (kern.massstabArcsecProPx / 2)));
  const werte = new Float64Array(anzahl + 1);
  for (let t = 0; t <= anzahl; t++) {
    const x = (-0.3 + (1.6 * t) / anzahl) * abstandArcsec;
    werte[t] = fa * k(x) + fb * k(x - abstandArcsec);
  }
  return delleImProfil(werte);
}

/**
 * Alle Paare sichtbarer Punktquellen, deren Kerne (Radius im farbkern) sich ueberlappen, mit Delle und
 * Kopplung. Die Delle haengt nur von Abstand, Flussverhaeltnis und Kern ab, nicht von den Farben.
 * auswahl: nur Paare, fuer die sie true liefert (koppleFarben: nur verschiedene Farben).
 */
export function farbpaare(punkte: readonly Punktquelle[], kern: Kern, auswahl: (p: Punktquelle, q: Punktquelle) => boolean = () => true): Farbpaar[] {
  const reichweite = 2 * kern.radius * kern.massstabArcsecProPx;
  const paare: Farbpaar[] = [];
  for (let a = 0; a < punkte.length; a++) {
    const p = punkte[a]!;
    if (!p.sichtbar) continue;
    for (let b = a + 1; b < punkte.length; b++) {
      const q = punkte[b]!;
      if (!q.sichtbar) continue;
      const abstand = Math.hypot(q.xArcsec - p.xArcsec, q.yArcsec - p.yArcsec);
      if (!(abstand < reichweite) || !auswahl(p, q)) continue;
      const delle = abstand > 0 ? paarDelle(kern, abstand, fluss(p), fluss(q)) : 0;
      paare.push({ a, b, delle, sigma: Math.min(1, delle / SCHWELLE_ERKENNBAR) });
    }
  }
  return paare;
}

/**
 * Anzeigefarbe je Punktquelle (physik.md 32), in farbeAnzeige (farbe bleibt die eigene Farbe): farbe'_i = (f_i c_i + sum_j (1 - sigma_ij) f_j c_j) /
 * (f_i + sum_j (1 - sigma_ij) f_j), f Fluss, c Farbe (fehlend grau 1, 1, 1; linear sRGB mit Y = 1, das
 * Mittel hat wieder Y = 1). Nur Paare mit verschiedenen Farben zaehlen; eine Quelle ohne solches Paar
 * bleibt unveraendert (dasselbe Objekt). Neue Liste, punkte bleibt unveraendert.
 */
export function koppleFarben(punkte: readonly Punktquelle[], kern: Kern): Punktquelle[] {
  const summen = punkte.map((p) => {
    const f = fluss(p);
    const c = p.farbe ?? GRAU;
    return { gewicht: f, r: f * c[0], g: f * c[1], b: f * c[2], geaendert: false };
  });
  const dazu = (i: number, j: number, anteil: number): void => {
    const q = punkte[j]!;
    const f = anteil * fluss(q);
    const c = q.farbe ?? GRAU;
    const s = summen[i]!;
    s.gewicht += f;
    s.r += f * c[0];
    s.g += f * c[1];
    s.b += f * c[2];
    s.geaendert = true;
  };
  for (const paar of farbpaare(punkte, kern, (p, q) => !gleicheFarbe(p, q))) {
    if (paar.sigma >= 1) continue;
    dazu(paar.a, paar.b, 1 - paar.sigma);
    dazu(paar.b, paar.a, 1 - paar.sigma);
  }
  return punkte.map((p, i) => {
    const s = summen[i]!;
    if (!s.geaendert || !(s.gewicht > 0)) return p;
    return { ...p, farbeAnzeige: [s.r / s.gewicht, s.g / s.gewicht, s.b / s.gewicht] };
  });
}
