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
    /** Name des Falters in der Statuszeile (#19). */
    falterWebgl2: "WebGL2-Faltung",
    /** Kurzer Hinweis, solange JavaScript faltet (ADR-0002), je Grund aus waehleFalter. */
    ohneWebgl2: (grenzePx: number, grund: "kein-webgl2" | "kontextverlust" | "webgl2-fehler"): string =>
      `${grund === "kein-webgl2" ? "Kein WebGL2 verfügbar" : grund === "kontextverlust" ? "WebGL2-Kontext verloren" : "WebGL2-Fehler"}: Anzeige auf ${grenzePx} px begrenzt.`,
    verschieben: "Ziehen mit der Maus oder Pfeiltasten verschieben den Ausschnitt, Pos1 zentriert.",
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
    // Issue #17
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
  // Fachtexte nach docs/recherche/physik.md Abschnitt 4 (Schwellen, 2×-Regel) und 5.1
  // (Flächenhelligkeit mit Austrittspupille), Quellen dort [32, 33, 35, 37].
  warnungen: {
    ueberschrift: "Warnungen",
    apUeber6: (ap: string, grenze: string): string => `Austrittspupille ${ap} mm größer als ${grenze} mm: Das Auge nimmt nicht das ganze Licht auf.`,
    apUeber6Thema: "großer Austrittspupille",
    apUeber6Hilfe:
      "Die Augenpupille öffnet sich nachts auf etwa 6 bis 7 mm, astobsim rechnet mit 6 mm. Ist die Austrittspupille größer, schneidet die Iris das Lichtbündel ab: Ein Teil der Öffnung bleibt ungenutzt, und das Bild wird nicht heller (kein Fernrohr zeigt eine Fläche heller als das bloße Auge). Abhilfe: Okular mit kürzerer Brennweite, also höhere Vergrößerung.",
    apUnter05: (ap: string, grenze: string): string => `Austrittspupille ${ap} mm kleiner als ${grenze} mm: Das Bild wird dunkel, ohne mehr zu zeigen.`,
    apUnter05Thema: "kleiner Austrittspupille",
    apUnter05Hilfe:
      "Die Flächenhelligkeit sinkt mit dem Quadrat der Austrittspupille: Bei 0,5 mm ist sie auf 1/144 des Werts bei 6 mm gefallen. Unter etwa 0,5 mm begrenzt außerdem die Beugung im Auge die Schärfe. Abhilfe: Okular mit längerer Brennweite.",
    vUeber2d: (v: string, grenze: string): string => `Vergrößerung ${v}× über der doppelten Öffnung in mm (${grenze}×): leere Vergrößerung.`,
    /** Über 2 D und unter 0,5 mm fallen zusammen (AP = D/V); dann eine Zeile mit beiden Werten. */
    vUeber2dMitAp: (v: string, grenze: string, ap: string): string =>
      `Vergrößerung ${v}× über der doppelten Öffnung in mm (${grenze}×), Austrittspupille ${ap} mm: leere Vergrößerung.`,
    vUeber2dThema: "leerer Vergrößerung",
    vUeber2dHilfe:
      "Ab etwa der doppelten Öffnung in mm (50× pro Zoll) ist die Beugungsstruktur ausvergrößert: Der Rayleigh-Abstand erscheint dem Auge dann unter rund 4,6′, weit über seiner Auflösung. Mehr Vergrößerung zeigt keine neuen Einzelheiten, nur ein größeres und dunkleres Bild."
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
