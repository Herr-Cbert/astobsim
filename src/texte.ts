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
  /** Namensnennung des Quellbilds unter dem Gesichtsfeld (aus bilder.json); Punkt ergaenzt, falls sie keinen hat. */
  bildnachweis: (namensnennung: string, lizenz: string): string =>
    `Bild: ${namensnennung}${/[.!?]$/.test(namensnennung) ? "" : "."} Lizenz: ${lizenz}.`,
  /** Seitenfuss (A-T5, A-X4, Issue #23, src/ui/bildnachweise.ts); Credit-Zeilen kommen woertlich aus bilder.json. */
  fuss: {
    codeVor: "astobsim ist freie Software unter der ",
    codeLizenz: "MIT-Lizenz",
    codeMitte: ", Quelltext auf ",
    codeQuelle: "GitHub",
    bildnachweise: (anzahl: number): string => `Bildnachweise (${anzahl} Bilder, jedes unter seiner eigenen Lizenz)`,
    aufnahme: "Aufnahme",
    credit: "Namensnennung",
    lizenz: "Lizenz",
    quelle: "Quelle",
    bearbeitung: "Bearbeitung"
  },
  /** Platzhalter fuer einen nicht endlichen Zahlenwert. */
  fehlwert: "–",
  gesichtsfeld: "Anblick im wahren Gesichtsfeld",
  /** Titel und Zusatz zur Beschriftung des Gesichtsfelds, wenn es sich verschieben laesst (A-D2, #19). */
  gesichtsfeldVerschieben: "Ziehen mit der Maus oder Pfeiltasten verschieben den Ausschnitt, Pos1 zentriert.",
  /** Titel und Zusatz zur Beschriftung des Gesichtsfelds: es oeffnet die Zoomansicht (A-D3, #20). */
  gesichtsfeldZoom: "Klick oder Eingabetaste zeigt das Objekt vergrößert neben dem Quellbild.",

  /** Zoomansicht (A-D3, src/ui/zoomansicht.ts); Hilfetexte unter hilfe.anblick und hilfe.quellbild. */
  zoom: {
    ueberschrift: "Zoomansicht",
    anblick: "Anblick",
    quellbild: "Quellbild",
    anblickBild: "Anblick vergrößert",
    quellbildBild: "Quellbild im selben Maßstab und Ausschnitt",
    zurueck: "Zurück zur Übersicht",
    /** Titel der beiden Bilder, je nachdem ob sich der Ausschnitt verschieben laesst. */
    bedienung: "Klick, Eingabetaste oder Escape führt zurück zur Übersicht.",
    bedienungVerschieben: "Ziehen mit der Maus oder Pfeiltasten verschieben beide Bilder gemeinsam, Pos1 zentriert. Klick, Eingabetaste oder Escape führt zurück zur Übersicht."
  },

  status: {
    ladeDaten: "Lade Geräte- und Objektdaten …",
    ladeBild: "Lade Bild des Objekts …",
    rechne: "Berechne Anblick …",
    fertig: (ms: number, falter: string): string => `Anblick berechnet in ${ms} ms (${falter}).`,
    /** Name des Falters in der Statuszeile (#19). */
    falterWebgl2: "WebGL2-Faltung",
    /** Kurzer Hinweis, solange JavaScript faltet (ADR-0002), je Grund aus waehleFalter. */
    ohneWebgl2: (grenzePx: number, grund: string): string =>
      `${grund === "kein-webgl2" ? "Kein WebGL2 verfügbar" : grund === "kontextverlust" ? "WebGL2-Kontext verloren" : "WebGL2-Fehler"}: Anzeige auf ${grenzePx} px begrenzt.`,
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
    beschriftung: (thema: string): string => `Hilfe zu ${thema}`,

    // Hilfetexte zu den Parametern (A-D6, A-Z2). Zahlen aus docs/recherche/physik.md und
    // docs/recherche/objekte.md, Entscheidungen aus docs/anforderungen.md und docs/adr/.
    objekt:
      "Das Himmelsobjekt, das betrachtet wird. Jedes Objekt hat einen oder mehrere feste Zustände, die zeigen, wie es typischerweise am Himmel erscheint.",
    zustand:
      "Ein Zustand ist eine feste, typische Erscheinung des Objekts mit seiner scheinbaren Größe in Bogensekunden (″). " +
      "Mond: Die Bildvorlage hat 0,643″ je Pixel; ab etwa 200 mm Öffnung bei sehr gutem Seeing begrenzt die Bildvorlage und nicht das Fernrohr die Schärfe. " +
      "Mars 6″ ist in Wirklichkeit nicht voll beleuchtet (etwa 90 Prozent), wird hier aber vereinfacht als volle Scheibe gezeigt. " +
      "Jupiter 35″ und Saturn 16″ zeigen den Planeten fern von der Opposition, so wie man ihn die meiste Zeit des Jahres sieht.",
    seeing:
      "Seeing ist die Luftunruhe: Warme und kalte Luftschichten lassen das Bild flimmern und verschmieren. " +
      "Angegeben wird, wie breit ein Stern im Zenit verschmiert erscheint (Halbwertsbreite in Bogensekunden); kleiner ist besser. " +
      "Unter 1″ ist ausgezeichnet, 1 bis 2″ gut, 2 bis 3″ mittel, darüber schlecht. Bei Hobbybeobachtern sind 2 bis 5″ üblich, 2″ ist ein durchschnittlicher Abend. " +
      "Die Pickering-Stufe (1 bis 10, 10 ist am ruhigsten) ist eine Schätzskala von Beobachtern; die Zuordnung zu Bogensekunden ist nur ungefähr. " +
      "Gezeigt wird der Anblick über längere Zeit, nicht der beste ruhige Moment.",
    bortle:
      "Die Bortle-Skala beschreibt, wie hell der Nachthimmel ist: 1 ist ein ausgezeichneter dunkler Himmel fern jeder Stadt, 9 der Himmel einer Innenstadt. " +
      "Daneben steht die Himmelshelligkeit in Magnituden je Quadratbogensekunde (größer ist dunkler). " +
      "In dieser Version wirkt die Stufe nur auf die Helligkeit des Hintergrunds im Gesichtsfeld: Mond und Planeten sind so viel heller als der Himmel, dass sie sich kaum ändern. " +
      "Ihre volle Wirkung hätte die Stufe erst bei lichtschwachen Objekten wie Nebeln und Galaxien. " +
      "Die Werte für Stufe 8 und 9 sind Schätzungen.",
    transparenz:
      "Wie klar die Luft ist. Dunst und Feuchtigkeit schlucken Licht: Das Objekt wird dunkler, je diesiger die Luft und je tiefer es steht. " +
      "Klar entspricht 0,20 Magnituden Lichtverlust je Luftmasse, leicht diesig 0,30, diesig 0,45.",
    hoehe:
      "Wie hoch das Objekt über dem Horizont steht, in Grad (90° ist der Zenit, senkrecht über dem Beobachter). " +
      "Je tiefer es steht, desto länger ist der Weg des Lichts durch die Luft: Das Seeing wird schlechter und das Objekt dunkler. " +
      "Die Luftmasse gibt diesen Weg an, 1 im Zenit, bei 30° etwa 2, bei 10° etwa 5,6.",

    /** Beschriftungen der Zoomansicht (#20). */
    anblick:
      "So erscheint das Objekt im Okular: verschmiert durch Beugung, Seeing und die Grenze des Auges und in der Helligkeit, die das Auge im Okular sieht. " +
      "Gezeigt wird der Anblick über längere Zeit, nicht der beste ruhige Moment. Hier vergrößert, damit sich die Einzelheiten mit dem Quellbild vergleichen lassen.",
    quellbild:
      "Die Aufnahme, aus der der Anblick entsteht (Raumsonde, Hubble oder beim Mond ein NASA-Rendering), im selben Maßstab und Ausschnitt, aber ohne Verschmierung und ohne Anpassung der Helligkeit: Weiß im Quellbild ist Weiß auf dem Bildschirm. " +
      "Was hier zu sehen ist und im Anblick fehlt, bleibt unter den eingestellten Bedingungen unsichtbar.",

    /** Hilfetexte zu den Zahlen des Infopanels (A-D6), Schluessel wie in TEXTE.info. */
    anzeige: {
      vergroesserung:
        "Wie viel größer das Objekt erscheint als mit bloßem Auge: Brennweite des Fernrohrs geteilt durch die Brennweite des Okulars; bei Fernglas und bloßem Auge fest. " +
        "Mehr als das Doppelte der Öffnung in Millimetern zeigt keine weiteren Einzelheiten, das Bild wird nur größer und dunkler.",
      wahresGesichtsfeld:
        "Wie groß der Ausschnitt des Himmels ist, der im Okular zu sehen ist, in Grad und Bogenminuten (1° = 60′). " +
        "Zum Vergleich: Der Mond ist etwa ein halbes Grad groß. Ungefähr das scheinbare Gesichtsfeld des Okulars geteilt durch die Vergrößerung.",
      austrittspupille:
        "Der Durchmesser des Lichtbündels, das aus dem Okular ins Auge fällt: Öffnung geteilt durch Vergrößerung. " +
        "Über 6 mm passt nicht alles Licht in die Pupille des Auges, unter 0,5 mm wird das Bild dunkel und unscharf. " +
        "Unter 6 mm gilt: Je kleiner die Austrittspupille, desto dunkler erscheinen Flächen wie Mond und Planeten.",
      rayleigh:
        "Die Beugungsgrenze: Wegen der Wellennatur des Lichts zeigt auch ein perfektes Fernrohr einen Stern als kleines Scheibchen. " +
        "Nach Rayleigh lassen sich zwei Punkte gerade noch trennen, wenn sie 138″ geteilt durch die Öffnung in mm auseinander liegen. Größere Öffnung heißt feinere Grenze.",
      dawes:
        "Eine zweite, aus Beobachtung gewonnene Beugungsgrenze für gleich helle Doppelsterne: 116″ geteilt durch die Öffnung in mm. " +
        "Sie ist etwas feiner als die Rayleigh-Grenze; ihr Wert gilt nur für solche Doppelsterne.",
      // Folgerung "hilft mehr Oeffnung kaum": docs/recherche/physik.md 2.3 (Testfall T4).
      seeing:
        "Wie stark die Luftunruhe das Bild in der eingestellten Höhe verschmiert: das Seeing im Zenit, vergrößert durch den längeren Weg durch die Luft. " +
        "Ist dieser Wert die größte Grenze, hilft mehr Öffnung kaum.",
      auge:
        "Das Auge trennt etwa eine Bogenminute (60″). Am Objekt ist das 60″ geteilt durch die Vergrößerung. " +
        "Feine, kontrastarme Einzelheiten auf Planeten braucht das Auge eher zwei- bis dreimal so groß; deshalb lohnt mehr Vergrößerung, als die Beugung allein verlangt.",
      dominant:
        "Welche der drei Grenzen (Beugung, Seeing, Auge) das Bild am stärksten verschmiert. " +
        "Sie zeigt, was am meisten bringt: mehr Öffnung bei der Beugung, ruhigere Luft bei Seeing, mehr Vergrößerung beim Auge."
    }
  },

  /** Formular Geraet und Okular (src/ui/formular_geraet.ts). */
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
    ueberschrift: "Objekt",
    objekt: "Objekt",
    zustand: "Zustand",
    /** Steht unter der Auswahl, solange das Bild des gewaehlten Zustands nachgeladen wird. */
    laedt: "Lade Bild …"
  },

  /** Formular Bedingungen (src/ui/formular_bedingungen.ts). */
  bedingungen: {
    ueberschrift: "Bedingungen",
    seeing: "Seeing",
    /** Wortstufen nach SEEING_WORTSTUFEN in physik (A-B1). */
    wortstufen: {
      ausgezeichnet: "ausgezeichnet",
      gut: "gut",
      mittel: "mittel",
      schlecht: "schlecht"
    },
    /** Anzeige neben dem Seeing-Regler: Wortstufe und Pickering-Bereich. */
    seeingstufe: (wortstufe: string, von: number, bis: number): string => `${wortstufe}, Pickering ${von} bis ${bis}`,
    bortle: "Himmelshelligkeit (Bortle)",
    /** Kurzbeschreibung je Bortle-Stufe 1 bis 9 (Index = Stufe - 1), nach docs/recherche/physik.md 6.1. */
    bortleStufen: [
      "ausgezeichneter Dunkelhimmel",
      "typischer dunkler Standort",
      "ländlich",
      "ländlich bis vorstädtisch",
      "vorstädtisch",
      "helle Vorstadt",
      "Vorstadt bis Stadt",
      "Stadt",
      "Innenstadt"
    ],
    /** Anzeige neben dem Bortle-Regler: Kurzbeschreibung und Himmelshelligkeit. */
    bortleStufe: (beschreibung: string, mag: string): string => `${beschreibung}, ${mag} mag/″²`,
    transparenz: "Transparenz",
    /** Anzeigetexte zu TRANSPARENZEN (A-B3). */
    transparenzen: {
      klar: "klar",
      "leicht-diesig": "leicht diesig",
      diesig: "diesig"
    },
    hoehe: "Höhe über dem Horizont",
    /** Anzeige neben dem Hoehen-Regler (A-B4). */
    luftmasse: (wert: string): string => `Luftmasse ${wert}`
  },

  /** Warnungen neben dem Gesichtsfeld (A-D5, src/ui/gesichtsfeld.ts). */
  // Fachtexte nach docs/recherche/physik.md Abschnitt 4 (Schwellen, 2x-Regel) und 5.1
  // (Flaechenhelligkeit mit Austrittspupille), Quellen dort [32, 33, 35, 37].
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
    /** Ueber 2 D und unter 0,5 mm fallen zusammen (AP = D/V); dann eine Zeile mit beiden Werten. */
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
