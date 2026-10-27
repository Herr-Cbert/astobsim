// Formular Geraet und Okular (A-F1 bis A-F8): Liste aus geraete.json, freie Eingabe, Okular-Presets.
// starte ruft baueFormularGeraet(platz, steuerung) einmal nach dem Laden der Daten auf. Das Formular
// liest die Werte aus steuerung.konfiguration, haengt sich mit steuerung.beobachte an Aenderungen
// von aussen und meldet jede Eingabe ueber steuerung.aendere (begrenzt, schreibt die URL, rechnet neu).
// Felder ueber feld.ts, Hilfetexte ueber hilfe.ts, alle Texte aus src/texte.ts; die reine Logik
// (Gruppen, Zuordnung zur Liste, Vorschlag der Obstruktion, Umrechnungen) steht in geraetewahl.ts.
// Vergroesserung als Eingabe (A-F7): begrenze meldet den Hinweis auf geraet.okular.brennweiteMm;
// beiAenderung des Vergroesserungsfelds rechnet ihn in Vergroesserung um und gibt ihn mit dem
// eigenen Feldpfad zurueck (zahlenfeld erwartet hinweis.wert im Mass des Felds). Ebenso zeigt das
// Feld Obstruktion Prozent (A-F1), die Konfiguration traegt das Verhaeltnis.

import { BAUARTEN, type Fernrohr, type Geraet, GRENZEN, type Hinweis, type Okular, okularBrennweiteFuer, optik } from "../physik";
import { TEXTE } from "../texte";
import { VOREINSTELLUNG } from "../zustand";
import { auswahl, regler, type Zahlenfeld, zahlenfeld } from "./feld";
import {
  auswahlNach,
  eintragZu,
  FREI,
  freiesFernrohr,
  geraetegruppen,
  geraetZuEintrag,
  mitBauart,
  obstruktionProzent,
  skaliereHinweise,
  VERGROESSERUNG_FELD,
  vergroesserungsHinweis
} from "./geraetewahl";
import type { Steuerung } from "./steuerung";

/** Presets fuer das scheinbare Gesichtsfeld in Grad (A-F6). */
const PRESETS_GRAD = [50, 68, 82, 100] as const;

const T = TEXTE.geraet;

export function baueFormularGeraet(platz: HTMLElement, steuerung: Steuerung): void {
  const d = platz.ownerDocument;
  const eintraege = steuerung.kataloge.geraete;
  const k = (): Geraet => steuerung.konfiguration.geraet;
  const fernrohr = (): Fernrohr | undefined => {
    const g = k();
    return g.art === "fernrohr" ? g : undefined;
  };
  const aendereGeraet = (geraet: Geraet): Hinweis[] => steuerung.aendere({ ...steuerung.konfiguration, geraet });
  /** Aenderung am aktuellen Fernrohr; bei Auge oder Fernglas (Feld ausgeblendet) nichts. */
  const aendereFernrohr = (f: (alt: Fernrohr) => Fernrohr): Hinweis[] => {
    const alt = fernrohr();
    return alt === undefined ? [] : aendereGeraet(f(alt));
  };

  // Gemerktes Okular: Auge und Fernglas haben keins, beim Wechsel zurueck zum Fernrohr gilt das letzte.
  const start = k();
  let okular: Okular = start.art === "fernrohr" ? { ...start.okular } : { ...VOREINSTELLUNG.okular };
  let modus = eintragZu(eintraege, start);

  const ueberschrift = d.createElement("h2");
  ueberschrift.className = "formular-ueberschrift";
  ueberschrift.textContent = T.ueberschrift;

  const wahl = auswahl(d, {
    id: "geraet-auswahl",
    beschriftung: T.auswahl,
    hilfe: T.auswahlHilfe,
    gruppen: [
      ...geraetegruppen(eintraege).map((g) => ({ beschriftung: T.gruppen[g.gruppe], optionen: g.eintraege.map((e) => ({ wert: e.id, text: e.name })) })),
      { optionen: [{ wert: FREI, text: T.frei }] }
    ],
    wert: modus,
    beiAenderung: (wert) => {
      if (wert === FREI) {
        modus = FREI;
        const ersatz = geraetZuEintrag(eintraege, VOREINSTELLUNG.geraetId, okular);
        // Ein Fernrohr bleibt wie es ist und wird nur editierbar; Auge und Fernglas werden zum Startfernrohr.
        if (ersatz?.art === "fernrohr") aendereGeraet(freiesFernrohr(k(), ersatz, okular));
      } else {
        const geraet = geraetZuEintrag(eintraege, wert, okular);
        if (geraet === undefined) return;
        modus = wert;
        aendereGeraet(geraet);
      }
      // Eine Geraetewahl ist eine gueltige Eingabe: alle Felder neu setzen, damit alte Hinweise
      // verschwinden. Gleiche Werte (Wechsel auf "Frei eingeben") melden die Steuerung nicht;
      // Sichtbarkeit und Werte deshalb hier nachziehen.
      zuletzt.clear();
      zeige();
    }
  });

  // Freie Eingabe eines Fernrohrs (A-F2): Oeffnung, Brennweite, Bauart, Obstruktion.
  const frei = d.createElement("div");
  frei.className = "geraet-frei";
  const oeffnung = zahlenfeld(d, {
    id: "geraet-oeffnung",
    beschriftung: T.oeffnung,
    hilfe: T.oeffnungHilfe(GRENZEN.oeffnungMm.min, GRENZEN.oeffnungMm.max),
    feld: GRENZEN.oeffnungMm.feld,
    einheit: TEXTE.einheiten.mm,
    min: GRENZEN.oeffnungMm.min,
    max: GRENZEN.oeffnungMm.max,
    schritt: GRENZEN.oeffnungMm.schritt,
    stellen: 0,
    wert: fernrohr()?.oeffnungMm ?? 0,
    beiAenderung: (wert) => aendereFernrohr((f) => ({ ...f, oeffnungMm: wert })),
    verwendet: () => fernrohr()?.oeffnungMm
  });
  const brennweite = zahlenfeld(d, {
    id: "geraet-brennweite",
    beschriftung: T.brennweite,
    hilfe: T.brennweiteHilfe(GRENZEN.brennweiteMm.min, GRENZEN.brennweiteMm.max),
    feld: GRENZEN.brennweiteMm.feld,
    einheit: TEXTE.einheiten.mm,
    min: GRENZEN.brennweiteMm.min,
    max: GRENZEN.brennweiteMm.max,
    schritt: GRENZEN.brennweiteMm.schritt,
    stellen: 0,
    wert: fernrohr()?.brennweiteMm ?? 0,
    beiAenderung: (wert) => aendereFernrohr((f) => ({ ...f, brennweiteMm: wert })),
    verwendet: () => fernrohr()?.brennweiteMm
  });
  const bauart = auswahl(d, {
    id: "geraet-bauart",
    beschriftung: T.bauart,
    hilfe: T.bauartHilfe,
    gruppen: [{ optionen: BAUARTEN.map((b) => ({ wert: b, text: T.bauarten[b] })) }],
    wert: fernrohr()?.bauart ?? "refraktor",
    beiAenderung: (wert) => {
      const b = BAUARTEN.find((x) => x === wert);
      if (b !== undefined) aendereFernrohr((f) => mitBauart(f, b));
    }
  });
  const obstruktion = zahlenfeld(d, {
    id: "geraet-obstruktion",
    beschriftung: T.obstruktion,
    hilfe: T.obstruktionHilfe(GRENZEN.obstruktion.min * 100, GRENZEN.obstruktion.max * 100),
    feld: GRENZEN.obstruktion.feld,
    einheit: T.prozent,
    min: GRENZEN.obstruktion.min * 100,
    max: GRENZEN.obstruktion.max * 100,
    schritt: GRENZEN.obstruktion.schritt * 100,
    stellen: 1,
    wert: (fernrohr()?.obstruktion ?? 0) * 100,
    beiAenderung: (prozent) => skaliereHinweise(aendereFernrohr((f) => ({ ...f, obstruktion: prozent / 100 })), GRENZEN.obstruktion.feld, 100),
    verwendet: () => obstruktionProzent(fernrohr())
  });
  frei.append(oeffnung.element, brennweite.element, bauart.element, obstruktion.element);

  // Okular (A-F6, A-F7); nur bei Fernrohren (A-F3, A-F4).
  const okularTeil = d.createElement("fieldset");
  okularTeil.className = "geraet-okular";
  const legende = d.createElement("legend");
  legende.textContent = T.okular;
  const okularBrennweite = regler(d, {
    id: "geraet-okular-brennweite",
    beschriftung: T.okularBrennweite,
    hilfe: T.okularBrennweiteHilfe(GRENZEN.okularBrennweiteMm.min, GRENZEN.okularBrennweiteMm.max),
    feld: GRENZEN.okularBrennweiteMm.feld,
    einheit: TEXTE.einheiten.mm,
    min: GRENZEN.okularBrennweiteMm.min,
    max: GRENZEN.okularBrennweiteMm.max,
    // Der Regler zieht in halben Millimetern (Okulare gibt es nicht feiner); eingegeben und
    // gerechnet wird auf GRENZEN.okularBrennweiteMm.schritt (0,01 mm, Vergroesserung als Eingabe, A-F7).
    schritt: 0.5,
    stellen: 1,
    wert: okular.brennweiteMm,
    beiAenderung: (wert) => aendereFernrohr((f) => ({ ...f, okular: { ...f.okular, brennweiteMm: wert } })),
    verwendet: () => fernrohr()?.okular.brennweiteMm
  });
  const gesichtsfeld = zahlenfeld(d, {
    id: "geraet-okular-gesichtsfeld",
    beschriftung: T.gesichtsfeld,
    hilfe: T.gesichtsfeldHilfe(GRENZEN.scheinbaresGesichtsfeldGrad.min, GRENZEN.scheinbaresGesichtsfeldGrad.max),
    feld: GRENZEN.scheinbaresGesichtsfeldGrad.feld,
    einheit: TEXTE.einheiten.grad,
    min: GRENZEN.scheinbaresGesichtsfeldGrad.min,
    max: GRENZEN.scheinbaresGesichtsfeldGrad.max,
    schritt: GRENZEN.scheinbaresGesichtsfeldGrad.schritt,
    stellen: 0,
    wert: okular.scheinbaresGesichtsfeldGrad,
    beiAenderung: (wert) => aendereFernrohr((f) => ({ ...f, okular: { ...f.okular, scheinbaresGesichtsfeldGrad: wert } })),
    verwendet: () => fernrohr()?.okular.scheinbaresGesichtsfeldGrad
  });
  const presets = d.createElement("div");
  presets.className = "geraet-presets";
  presets.setAttribute("role", "group");
  presets.setAttribute("aria-label", T.presets);
  const presetKnoepfe = PRESETS_GRAD.map((grad) => {
    const knopf = d.createElement("button");
    knopf.type = "button";
    knopf.className = "geraet-preset";
    knopf.textContent = T.preset(grad);
    knopf.title = T.presetName(grad);
    knopf.setAttribute("aria-label", T.presetName(grad));
    knopf.addEventListener("click", () => {
      gesichtsfeld.setzeWert(grad);
      aendereFernrohr((f) => ({ ...f, okular: { ...f.okular, scheinbaresGesichtsfeldGrad: grad } }));
    });
    presets.append(knopf);
    return { grad, knopf };
  });
  gesichtsfeld.element.append(presets);
  const vergroesserung = zahlenfeld(d, {
    id: "geraet-vergroesserung",
    beschriftung: T.vergroesserung,
    hilfe: T.vergroesserungHilfe,
    feld: VERGROESSERUNG_FELD,
    einheit: TEXTE.einheiten.fach,
    // GRENZEN.vergroesserung ist die Grenze des Fernglases; zahlenfeld wertet min und max nicht aus.
    // Beim Fernrohr begrenzt die Okularbrennweite (begrenze), der Hinweis kommt aus beiAenderung.
    min: GRENZEN.vergroesserung.min,
    max: GRENZEN.vergroesserung.max,
    schritt: 1,
    stellen: 0,
    wert: start.art === "fernrohr" ? optik(start).vergroesserung : 1,
    beiAenderung: (v) => {
      const f = fernrohr();
      if (f === undefined) return [];
      const hinweise = aendereGeraet({ ...f, okular: { ...f.okular, brennweiteMm: okularBrennweiteFuer(f.brennweiteMm, v) } });
      return vergroesserungsHinweis(hinweise, f.brennweiteMm, v);
    },
    verwendet: () => {
      const f = fernrohr();
      return f === undefined ? undefined : optik(f).vergroesserung;
    }
  });
  okularTeil.append(legende, okularBrennweite.element, gesichtsfeld.element, vergroesserung.element);

  platz.replaceChildren(ueberschrift, wahl.element, frei, okularTeil);

  // Nur Felder nachziehen, deren Wert sich geaendert hat: setzeWert loescht den Hinweis des Felds,
  // und der Hinweis soll bis zur naechsten gueltigen Eingabe in diesem Feld stehen bleiben.
  const zuletzt = new Map<Zahlenfeld, number>();
  const nachziehe = (feld: Zahlenfeld, wert: number): void => {
    if (zuletzt.get(feld) === wert) return;
    zuletzt.set(feld, wert);
    feld.setzeWert(wert);
  };

  /** Sichtbarkeit und Werte aus der aktuellen Konfiguration. */
  function zeige(): void {
    const g = k();
    modus = auswahlNach(modus, eintraege, g);
    wahl.setzeWert(modus);
    frei.hidden = modus !== FREI || g.art !== "fernrohr";
    okularTeil.hidden = g.art !== "fernrohr";
    if (g.art !== "fernrohr") return;
    okular = { ...g.okular };
    nachziehe(oeffnung, g.oeffnungMm);
    nachziehe(brennweite, g.brennweiteMm);
    bauart.setzeWert(g.bauart);
    nachziehe(obstruktion, g.obstruktion * 100);
    nachziehe(okularBrennweite, g.okular.brennweiteMm);
    nachziehe(gesichtsfeld, g.okular.scheinbaresGesichtsfeldGrad);
    nachziehe(vergroesserung, optik(g).vergroesserung);
    for (const p of presetKnoepfe) p.knopf.setAttribute("aria-pressed", String(p.grad === g.okular.scheinbaresGesichtsfeldGrad));
  }

  let gesehen: Geraet | undefined;
  steuerung.beobachte((stand) => {
    if (stand.konfiguration.geraet === gesehen) return;
    gesehen = stand.konfiguration.geraet;
    zeige();
  });
}
