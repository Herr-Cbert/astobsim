// Alle Oberflaechentexte an einer Stelle (A-D10), damit eine Uebersetzung spaeter moeglich ist.
// Ausnahme von der ASCII-Regel (CLAUDE.md): Die Oberflaechentexte in dieser Datei stehen in
// UTF-8 mit echten Umlauten und Sonderzeichen (Grad, Bogenminute, Bogensekunde, Malzeichen).
// Bezeichner und Kommentare bleiben ASCII.

export const TEXTE = {
  titel: "astobsim",
  untertitel: "Wie sieht ein Himmelsobjekt durch ein Fernrohr aus?",

  /** Beschreibung der festen Startkonfiguration (A-D9), bis das Formular kommt (#17, #18). */
  startkonfiguration:
    "Refraktor 80/600, Okular 10 mm mit 50°, Mond kurz nach dem ersten Viertel, Seeing 2″, Bortle 5, klar, Höhe 45°",
  nordenOben: "Norden oben",
  /** Namensnennung des Quellbilds unter dem Gesichtsfeld (aus bilder.json). */
  bildnachweis: (namensnennung: string, lizenz: string): string => `Bild: ${namensnennung} Lizenz: ${lizenz}.`,
  /** Platzhalter fuer einen nicht endlichen Zahlenwert. */
  fehlwert: "–",
  gesichtsfeld: "Anblick im wahren Gesichtsfeld",

  status: {
    ladeDaten: "Lade Geräte- und Objektdaten …",
    ladeKacheln: "Lade Mondbild …",
    rechne: "Berechne Anblick …",
    fertig: (ms: number, falter: string): string => `Anblick berechnet in ${ms} ms (${falter}).`
  },
  falterJs: "JavaScript-Faltung",

  fehler: {
    daten: "Die Daten konnten nicht geladen werden.",
    kacheln: "Das Mondbild ist nicht erreichbar.",
    rechnen: "Der Anblick konnte nicht berechnet werden.",
    details: "Details:"
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
