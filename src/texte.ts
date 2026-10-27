// Alle Oberflaechentexte an einer Stelle (A-D10), damit eine Uebersetzung spaeter moeglich ist.
// Ausnahme von der ASCII-Regel (CLAUDE.md): Die Oberflaechentexte in dieser Datei stehen in
// UTF-8 mit echten Umlauten und Sonderzeichen (Grad, Bogenminute, Bogensekunde, Malzeichen).
// Bezeichner und Kommentare bleiben ASCII.

export const TEXTE = {
  titel: "astobsim",
  untertitel: "Wie sieht ein Himmelsobjekt durch ein Fernrohr aus?",

  /** Beschriftung der Formularspalte. */
  formular: "Einstellungen",
  nordenOben: "Norden oben",
  /** Namensnennung des Quellbilds unter dem Gesichtsfeld (aus bilder.json). */
  bildnachweis: (namensnennung: string, lizenz: string): string => `Bild: ${namensnennung} Lizenz: ${lizenz}.`,
  /** Platzhalter fuer einen nicht endlichen Zahlenwert. */
  fehlwert: "–",
  gesichtsfeld: "Anblick im wahren Gesichtsfeld",

  status: {
    ladeDaten: "Lade Geräte- und Objektdaten …",
    ladeBild: "Lade Bild des Objekts …",
    rechne: "Berechne Anblick …",
    fertig: (ms: number, falter: string): string => `Anblick berechnet in ${ms} ms (${falter}).`,
    /** Werte aus einem Link lagen ausserhalb der Grenzen (A-F8) und wurden geschnitten. */
    linkGeschnitten: (anzahl: number): string =>
      anzahl === 1 ? "Ein Wert aus dem Link lag außerhalb des erlaubten Bereichs und wurde angepasst." : `${anzahl} Werte aus dem Link lagen außerhalb des erlaubten Bereichs und wurden angepasst.`
  },
  falterJs: "JavaScript-Faltung",

  fehler: {
    daten: "Die Daten konnten nicht geladen werden.",
    bild: "Das Bild des Objekts ist nicht erreichbar.",
    rechnen: "Der Anblick konnte nicht berechnet werden.",
    details: "Details:"
  },

  /** Formularfelder (src/ui/feld.ts): Hinweis neben dem Feld, wenn begrenze geschnitten hat (A-F8). */
  feld: {
    geschnitten: (eingabe: string, wert: string): string => `${eingabe} liegt außerhalb des erlaubten Bereichs, verwendet wird ${wert}.`
  },
  /** Infosymbol (src/ui/hilfe.ts); die Hilfetexte selbst stehen im Abschnitt hilfe und bei den Formularen. */
  hilfe: {
    symbol: "i",
    beschriftung: (thema: string): string => `Hilfe zu ${thema}`
    // Issue #18: Hilfetexte zu Parametern und Anzeigezahlen (A-D6), Hinweise A-X5, A-X1, A-B2.
  },

  /** Formular Gerät und Okular (src/ui/formular_geraet.ts). */
  geraet: {
    ueberschrift: "Gerät und Okular",
    auswahl: "Gerät",
    auswahlHilfe: "Typische Geräte stehen in der Liste; ein eigenes Fernrohr lässt sich über „Frei eingeben“ beschreiben.",
    gruppen: { auge: "Auge", fernglas: "Ferngläser", fernrohr: "Fernrohre" },
    frei: "Frei eingeben …",
    oeffnung: "Öffnung",
    oeffnungHilfe: (min: number, max: number): string => `Durchmesser von Objektiv oder Hauptspiegel. Mehr Öffnung sammelt mehr Licht und zeigt feinere Details (${min} bis ${max} mm).`,
    brennweite: "Brennweite",
    brennweiteHilfe: (min: number, max: number): string => `Brennweite des Fernrohrs. Geteilt durch die Okularbrennweite ergibt sie die Vergrößerung (${min} bis ${max} mm).`,
    bauart: "Bauart",
    bauartHilfe: "Die Bauart setzt einen typischen Wert für die Obstruktion; er bleibt danach änderbar.",
    bauarten: { refraktor: "Refraktor (Linsen)", newton: "Newton", "schmidt-cassegrain": "Schmidt-Cassegrain", maksutov: "Maksutov" },
    obstruktion: "Obstruktion",
    obstruktionHilfe: (min: number, max: number): string => `Durchmesser des Fangspiegels in Prozent der Öffnung. Er kostet etwas Licht und Kontrast; Linsenfernrohre haben keinen (${min} bis ${max} %).`,
    prozent: "%",
    okular: "Okular",
    okularBrennweite: "Okularbrennweite",
    okularBrennweiteHilfe: (min: number, max: number): string => `Brennweite des Okulars. Ein kürzeres Okular vergrößert stärker (${min} bis ${max} mm).`,
    gesichtsfeld: "Scheinbares Gesichtsfeld",
    gesichtsfeldHilfe: (min: number, max: number): string => `Wie groß das Bild im Okular dem Auge erscheint. Einfache Okulare (Plössl) haben etwa 50°, Weitwinkel 68° bis 100° (${min} bis ${max}°).`,
    presets: "Typische Okulare",
    /** Knopftext und Tooltip eines Presets fuer das scheinbare Gesichtsfeld (A-F6). */
    preset: (grad: number): string => `${grad}°`,
    presetName: (grad: number): string => `${({ 50: "Plössl", 68: "Weitwinkel", 82: "Ultraweitwinkel", 100: "Extremweitwinkel" } as Record<number, string>)[grad] ?? "Okular"} ${grad}°`,
    vergroesserung: "Vergrößerung",
    vergroesserungHilfe: "Brennweite des Fernrohrs geteilt durch die des Okulars. Eine direkt eingegebene Vergrößerung passt die Okularbrennweite an."
  },

  /** Formular Objekt und Zustand (src/ui/formular_objekt.ts). */
  objekt: {
    // Issue #18
  },

  /** Formular Bedingungen (src/ui/formular_bedingungen.ts). */
  bedingungen: {
    // Issue #18
  },

  /** Warnungen neben dem Gesichtsfeld (A-D5, src/ui/gesichtsfeld.ts). */
  warnungen: {
    // Issue #19
  },

  /** Infopanel neben dem Bild (A-D4). */
  info: {
    ueberschrift: "Kennwerte",
    vergroesserung: "Vergrößerung",
    wahresGesichtsfeld: "Wahres Gesichtsfeld",
    austrittspupille: "Austrittspupille",
    rayleigh: "Beugungsgrenze (Rayleigh)",
    dawes: "Beugungsgrenze (Dawes)",
    seeing: "Seeing am Objekt",
    auge: "Augengrenze",
    dominant: "Dominante Grenze"
  },
  grenzen: {
    beugung: "Beugung",
    seeing: "Seeing",
    auge: "Auge"
  },
  einheiten: {
    fach: "×",
    grad: "°",
    bogenminute: "′",
    bogensekunde: "″",
    mm: "mm"
  }
} as const;
