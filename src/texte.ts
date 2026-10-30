// Alle Oberflaechentexte an einer Stelle (A-D10), damit eine Uebersetzung spaeter moeglich ist.
// Ausnahme von der ASCII-Regel (CLAUDE.md): Die Oberflaechentexte in dieser Datei stehen in
// UTF-8 mit echten Umlauten und Sonderzeichen (Grad, Bogenminute, Bogensekunde, Malzeichen).
// Bezeichner und Kommentare bleiben ASCII.

/** Eine Quelle der Sterndaten im Seitenfuss (src/ui/bildnachweise.ts); lizenzUrl und danksagung nur, wo die Quelle sie nennt. */
export interface Sterndatenquelle {
  titel: string;
  verwendet: string;
  lizenz: string;
  lizenzUrl?: string;
  danksagung?: string;
  url: string;
}

/**
 * Seeing als Langzeitmittel bei engen Doppelsternen (Entscheidung 3 in docs/recherche/README.md,
 * docs/recherche/doppelsterne.md 4): im Hilfetext zum Seeing und zum Seeing am Objekt bei Doppelsternen.
 */
const SEEING_PAARE =
  "Bei engen Doppelsternen heißt das: Paare nahe der Beugungsgrenze trennen Beobachter oft nur in kurzen ruhigen Momenten, " +
  "im Bild erscheinen sie erst bei ausgezeichnetem Seeing (etwa 0,5″) getrennt.";

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
    bearbeitung: "Bearbeitung",
    verwendet: "Verwendet für",
    danksagung: "Danksagung",
    /**
     * Sterndaten (Issue #103, ADR-0003 Nachtrag V2), gleicher Inhalt wie README.md Abschnitt Sterndaten.
     * Ein Katalog ist ein Listeneintrag; lizenz und danksagung woertlich von der Quelle (englisch),
     * gelesen am 2026-10-29. Fehlt eine Lizenzangabe an der Quelle, steht das so da.
     */
    sterndaten: {
      titel: (anzahl: number): string => `Sterndaten (${anzahl} Quellen, jede unter ihrer eigenen Lizenz)`,
      quellen: [
        {
          titel: "Washington Double Star Catalog (WDS), U.S. Naval Observatory",
          verwendet: "Abstand, Positionswinkel und Helligkeit der Doppelsterne außer Albireo B und Polaris B (Mason et al. 2001, AJ 122, 3466)",
          lizenz: "Laut data.gov (Eintrag der HEASARC): U.S. Government Works („License: https://www.usa.gov/government-works“, „Access Level: public“); an der Quelle selbst keine Lizenzangabe.",
          lizenzUrl: "https://catalog.data.gov/dataset/washington-double-star-catalog",
          danksagung: "This research has made use of the Washington Double Star Catalog maintained at the U.S. Naval Observatory.",
          url: "https://www.astro.gsu.edu/wds/"
        },
        {
          titel: "Sixth Catalog of Orbits of Visual Binary Stars (ORB6), U.S. Naval Observatory",
          verwendet: "Abstand und Positionswinkel der Bahnpaare, Ephemeride 2027,0 (Matson, Williams, Hartkopf und Mason)",
          lizenz: "An der Quelle keine Lizenzangabe; Katalog des U.S. Naval Observatory wie der WDS.",
          url: "https://www.astro.gsu.edu/wds/orb6.html"
        },
        {
          titel: "Hipparcos- und Tycho-Kataloge, ESA",
          verwendet:
            "B-V und V von Albireo B aus dem Hipparcos-Hauptkatalog (ESA 1997) und dem Tycho Double Star Catalogue (Fabricius et al. 2002, A&A 384, 180), " +
            "abgefragt im Hipparcos and Tycho Legacy Archive der ESA; V und B-V von 25 Plejaden-Sternen (M45), abgefragt im Gaia-Archiv",
          lizenz:
            "„The Hipparcos and Tycho Catalogues are distributed under the CC BY-NC 3.0 IGO licence and the Terms and Conditions " +
            "for the use of these data require users to acknowledge ESA using “Credit: ESA”.“",
          lizenzUrl: "https://creativecommons.org/licenses/by-nc/3.0/igo/deed.en",
          danksagung: "Credit: ESA",
          url: "https://www.cosmos.esa.int/web/hipparcos/catalogues"
        },
        {
          titel: "Gaia DR3, ESA",
          verwendet: "Lage aller 44 Plejaden-Sterne (M45) und V und B-V der 19 Sterne ohne Hipparcos-Wert, umgerechnet nach der Gaia-DR3-Dokumentation 5.5.1",
          lizenz: "„Gaia data are distributed under the CC BY-NC 3.0 IGO license.“",
          lizenzUrl: "https://creativecommons.org/licenses/by-nc/3.0/igo/",
          danksagung:
            "Credit: ESA, Gaia DPAC. This work has made use of data from the European Space Agency (ESA) mission Gaia (https://www.cosmos.esa.int/gaia), " +
            "processed by the Gaia Data Processing and Analysis Consortium (DPAC, https://www.cosmos.esa.int/web/gaia/dpac/consortium). " +
            "Funding for the DPAC has been provided by national institutions, in particular the institutions participating in the Gaia Multilateral Agreement.",
          url: "https://www.cosmos.esa.int/web/gaia-users/license"
        },
        {
          titel: "Bright Star Catalogue, 5. Ausgabe (Hoffleit und Warren 1991)",
          verwendet: "B-V von Mizar, Castor und Gamma Andromedae, abgefragt bei der HEASARC (NASA)",
          lizenz: "An der Quelle keine Lizenzangabe.",
          url: "https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html"
        },
        {
          titel: "SIMBAD, CDS Straßburg (Wenger et al. 2000, A&AS 143, 9)",
          verwendet: "B und V von Antares B, abgefragt über den Spiegel in Harvard",
          lizenz: "„Use of SIMBAD service is free without any registration under ODbL licence. We request that users cite the original paper reference.“",
          danksagung: "This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France",
          url: "https://simbad.cfa.harvard.edu/simbad/"
        },
        {
          titel: "Usenko und Klochkova: Polaris B (arXiv:0708.0333)",
          verwendet: "Helligkeit (V 8,60) und B-V (0,42 nach Turner 2005) von Polaris B",
          lizenz: "Zahlenwerte aus einer Fachveröffentlichung, mit Zitat übernommen.",
          url: "https://arxiv.org/abs/0708.0333"
        }
      ] as readonly Sterndatenquelle[]
    }
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
    /** Schaltflaeche fuer das Detailfenster (#77), nur wo es angeboten wird; aria-pressed zeigt den Zustand. */
    detail: "Detail",
    detailTitel: "Zeigt einen kleineren Ausschnitt so fein, dass die Auflösungsgrenze von Fernrohr, Luft und Auge zu sehen ist.",
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
      "Gezeigt wird der Anblick über längere Zeit, nicht der beste ruhige Moment. " +
      SEEING_PAARE,
    bortle:
      "Die Bortle-Skala beschreibt, wie hell der Nachthimmel ist: 1 ist ein ausgezeichneter dunkler Himmel fern jeder Stadt, 9 der Himmel einer Innenstadt. " +
      "Daneben steht die Himmelshelligkeit in Magnituden je Quadratbogensekunde (größer ist dunkler). " +
      "Die Stufe bestimmt die Helligkeit des Hintergrunds im Gesichtsfeld und die Wahrnehmungsschwelle: Je heller der Himmel, desto weniger schwache Sterne sind zu sehen (Grenzgröße) " +
      "und desto weniger bleibt von Nebeln, Galaxien und Sternhaufen übrig (sichtbare Isophote). Mond und Planeten sind so viel heller als der Himmel, dass sie sich kaum ändern. " +
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
    /** Statt quellbild bei Objekten ohne Aufnahme (Doppelsterne, freies Paar, M45), Issue #109. */
    quellbildOhneAufnahme:
      "Für dieses Objekt gibt es keine Aufnahme. Das Feld zeigt die Sterne als berechnete, ideale Punkte an ihren Katalogpositionen, im selben Maßstab und Ausschnitt wie der Anblick, " +
      "ohne Beugung, Seeing und Augenauflösung. Liegen hier zwei Punkte getrennt, im Anblick aber nicht, trennen Fernrohr und Bedingungen das Paar nicht.",
    /**
     * Statt quellbild bei Deep-Sky-Objekten mit Aufnahme (Issue #110), je Abbildung des
     * Vergleichsbilds (Vergleichsabbildung in src/ui/zoom.ts; entschieden: kubikwurzelUeberBoden).
     */
    quellbildDeepSky: {
      linear:
        "Die Aufnahme, aus der der Anblick entsteht, im selben Maßstab und Ausschnitt, ohne Verschmierung und ohne Anpassung der Helligkeit: Weiß im Quellbild ist Weiß auf dem Bildschirm. " +
        "Schwache äußere Teile des Objekts sind so kaum zu sehen, obwohl sie in der Aufnahme stecken. Sterne erscheinen so blass wie im Anblick.",
      kubikwurzel:
        "Die Aufnahme, aus der der Anblick entsteht, im selben Maßstab und Ausschnitt, ohne Verschmierung; die Fläche ohne Wahrnehmungsschwelle. " +
        "Die Helligkeit ist gestreckt (Kubikwurzel, wie im Anblick), damit auch die schwachen äußeren Teile zu sehen sind: Ein Tausendstel der hellsten Stelle erscheint noch als dunkles Grau. " +
        "Was hier zu sehen ist und im Anblick fehlt, liegt unter den eingestellten Bedingungen unter der Wahrnehmungsschwelle oder ist zu fein. Sterne erscheinen so blass wie im Anblick.",
      kubikwurzelUeberBoden:
        "Die Aufnahme, aus der der Anblick entsteht, im selben Maßstab und Ausschnitt, ohne Verschmierung; die Fläche ohne Wahrnehmungsschwelle. " +
        "Die Helligkeit ist gestreckt (Kubikwurzel, wie im Anblick), damit auch die schwachen äußeren Teile zu sehen sind; der dunkle Hintergrund der Aufnahme erscheint schwarz. " +
        "Ein grauer Grund bis an den Bildrand ist schwaches Licht des Objekts selbst, etwa ein äußerer Halo; die Aufnahme endet dort. " +
        "Was hier zu sehen ist und im Anblick fehlt, liegt unter den eingestellten Bedingungen unter der Wahrnehmungsschwelle oder ist zu fein. Sterne erscheinen so blass wie im Anblick.",
      okularOhneSchwelle:
        "Die Aufnahme so hell, wie sie im Okular erscheint, mit demselben Himmel wie der Anblick, aber ohne Verschmierung; die Fläche ohne Wahrnehmungsschwelle. " +
        "Was hier zu sehen ist und im Anblick fehlt, kann das Auge unter den eingestellten Bedingungen nicht wahrnehmen oder es ist zu fein. Sterne erscheinen so blass wie im Anblick."
    },

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
        "Sie zeigt, was am meisten bringt: mehr Öffnung bei der Beugung, ruhigere Luft bei Seeing, mehr Vergrößerung beim Auge.",
      /** Zusatz zu seeing bei Doppelsternen. */
      seeingPaare: `Gezeigt wird das Mittel über längere Zeit. ${SEEING_PAARE}`,
      // Beobachtermodell: ADR-0004 (Feldfaktor 1,4), docs/recherche/wahrnehmung.md 7 Punkt 2.
      grenzgroesse:
        "Die Helligkeit des schwächsten Sterns, den man unter den eingestellten Bedingungen gerade noch sieht, in Magnituden (größer ist schwächer). " +
        "Das Bild zeigt Sterne nahe der Grenzgröße blass und deutlich schwächere gar nicht. " +
        "astobsim rechnet mit einem festen Beobachter: voll an die Dunkelheit gewöhnt und mit etwas Übung (Feldfaktor 1,4 nach Crumey); am Fernrohr sieht er mit einem Auge, das kostet etwas. " +
        "Sehr geübte Beobachter erreichen bei dunklem Himmel bis etwa 1 mag mehr, ungeübte weniger. Alter, Blendung und die Zeit der Gewöhnung an die Dunkelheit sind keine Eingaben.",
      isophote:
        "Nebel und Galaxien werden nach außen immer schwächer. Die sichtbare Isophote ist die schwächste Flächenhelligkeit (Magnituden je Quadratbogensekunde, größer ist schwächer), " +
        "die sich unter den eingestellten Bedingungen noch vom Himmel abhebt; was schwächer ist, verblasst im Bild in den Himmel. " +
        "„Unter der Schwelle“ heißt: Kein Teil des Objekts hebt sich sicher ab, das Bild zeigt es höchstens als Hauch. Ein dunklerer Himmel oder mehr Öffnung helfen. " +
        "Die Schwelle gilt für denselben festen Beobachter wie die Grenzgröße.",
      ausdehnung:
        "Wie groß der sichtbare Teil des Objekts ist: der Durchmesser eines Kreises mit derselben Fläche wie alles innerhalb der sichtbaren Isophote. " +
        "Bei länglichen Objekten ist die längste Ausdehnung größer. „Mindestens“ heißt, dass auch die schwächsten in der Aufnahme gemessenen Teile sichtbar sind."
    },

    /** Hilfetexte zu den Hinweisen unter den Kennwerten (src/ui/infopanel.ts, Issue #110). */
    hinweis: {
      // A-P10; Uebergang nach docs/recherche/wahrnehmung.md 3.2.
      unaufgeloest:
        "Erscheint ein Objekt im Okular kleiner als etwa ein bis zwei Bogenminuten (Größe mal Vergrößerung), kann das Auge es nicht als Scheibe auflösen: " +
        "Es sieht einen Punkt wie bei einem Stern, so wie Jupiter mit bloßem Auge. Der Übergang ist gleitend; mehr Vergrößerung zeigt wieder die Scheibe.",
      // grund "unter_schwelle" (docs/architektur.md 5.3), Schnitt 5 mag unter der Grenzgroesse (physik.md Abschnitt 20).
      unterSchwelle:
        "Sterne und Monde, die schwächer als die Grenzgröße sind, liegen unter der Wahrnehmungsschwelle: Das Bild zeigt sie umso blasser, je schwächer sie sind, " +
        "und etwa 5 mag unter der Grenzgröße gar nicht mehr. Ein dunklerer Himmel und mehr Öffnung heben die Grenzgröße, oft auch mehr Vergrößerung, weil sie den Himmel im Okular dunkler macht.",
      // A-Z9, A-P9: Ueberstrahlung ab 4 mag Unterschied unter 10'' (docs/recherche/doppelsterne.md 5).
      ueberstrahlung:
        "Neben einem viel helleren Stern ist ein schwacher Begleiter in Wirklichkeit schwerer zu sehen, als das Bild zeigt: Das Licht des hellen Sterns streut im Auge und im Fernrohr und überstrahlt seine Umgebung. " +
        "astobsim simuliert diese Blendung nicht; bei engen Paaren (unter 10″) mit mehr als etwa 4 mag Unterschied erscheint der Begleiter im Bild daher zu leicht.",
      // A-X11: grobe Quellbilder grosser Deep-Sky-Objekte; Kriterium wie der Arbeitsmassstab (ADR-0002).
      quellbildGrenze:
        "Jede Aufnahme besteht aus Pixeln. Bei großen Objekten ist sie nur so fein, wie es für kleine Vergrößerungen nötig ist, sonst würde die Datei zu groß. " +
        "Bei hoher Vergrößerung begrenzt dann die Aufnahme und nicht Fernrohr, Luft oder Auge die Schärfe: Einzelheiten feiner als einige Pixel fehlen im Anblick, auch wenn das Fernrohr sie zeigen könnte. " +
        "Das ist eine Grenze von astobsim, nicht des Fernrohrs."
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
    laedt: "Lade Bild …",
    /** Gruppen der Objektauswahl je Objektklasse (A-D18), in dieser Reihenfolge. */
    klassen: { sonnensystem: "Sonnensystem", doppelstern: "Doppelsterne", deep_sky: "Deep-Sky" },
    /** Eintrag des freien Paars am Ende der Gruppe Doppelsterne (A-Z9). */
    freiesPaar: "Freies Paar (eigene Werte)",
    /** Eingaben des freien Paars (A-Z9), nur sichtbar, wenn es gewählt ist. */
    paar: {
      ueberschrift: "Freies Paar",
      trennung: "Trennung",
      magnitudeA: "Helligkeit Stern A",
      magnitudeB: "Helligkeit Stern B",
      bvA: "Farbindex B-V Stern A",
      bvB: "Farbindex B-V Stern B",
      einheitMag: "mag",
      trennungHilfe:
        "Abstand der beiden Sterne am Himmel in Bogensekunden (″). Die Sterne stehen fest in Ost-West-Richtung nebeneinander. " +
        "Unter 10″ lässt sich die Trennung in Schritten von 0,05″ einstellen, darüber in ganzen Bogensekunden.",
      magnitudeHilfe:
        "Scheinbare Helligkeit des Sterns in Magnituden; kleinere Werte sind heller, 1 mag Unterschied ist etwa das 2,5-Fache. " +
        "Vorgabe: Stern A 5 mag, Stern B 6 mag.",
      bvHilfe:
        "Farbindex B-V des Sterns: negative Werte sind bläulich weiß, 0,6 etwa sonnenähnlich (Vorgabe), über 1,2 orange bis rot. " +
        "Farbe zeigt das Bild nur bei Sternen, die im Fernrohr hell genug dafür erscheinen."
    }
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
    dominant: "Dominante Grenze",
    grenzgroesse: "Grenzgröße",
    isophote: "Sichtbare Isophote",
    ausdehnung: "Sichtbare Ausdehnung",
    /** Wert der Isophote, wenn kein Teil des Objekts die Schwelle erreicht. */
    unterSchwelle: "unter der Schwelle",
    /** Wert der Isophote, wenn auch die schwaechste Zeile der Flaechentabelle sichtbar ist. */
    isophoteOderSchwaecher: (mu: string): string => `${mu} oder schwächer`,
    ausdehnungEtwa: (winkel: string): string => `etwa ${winkel}`,
    ausdehnungMindestens: (winkel: string): string => `mindestens ${winkel}`,
    /** Saetze unter den Kennwerten (Issue #110); Hilfetexte unter TEXTE.hilfe.hinweis. */
    hinweise: "Hinweise",
    unaufgeloest: (v: string, scheinbar: string): string =>
      `Unaufgelöst: Bei ${v} erscheint das Objekt nur ${scheinbar} groß, das Auge sieht es als Punkt wie einen Stern.`,
    unaufgeloestThema: "unaufgelöst",
    /** Namen bis zu drei Punktquellen unter der Grenzgroesse, sonst nur die Anzahl. */
    unterGrenzgroesseNamen: (namen: readonly string[]): string => `Schwächer als die Grenzgröße, im Bild blass oder unsichtbar: ${namen.join(", ")}.`,
    unterGrenzgroesseAnzahl: (anzahl: number, gesamt: number): string =>
      `${anzahl} von ${gesamt} Sternen sind schwächer als die Grenzgröße, im Bild blass oder unsichtbar.`,
    unterGrenzgroesseThema: "Sternen unter der Grenzgröße",
    ueberstrahlung: (a: string, b: string, deltaMag: string): string =>
      `Überstrahlung nicht simuliert: ${a} und ${b} unterscheiden sich um ${deltaMag} mag, der schwächere Stern ist in Wirklichkeit schwerer zu sehen.`,
    ueberstrahlungThema: "Überstrahlung",
    /** Komponente eines Doppelsterns in den Saetzen; die Daten nennen nur den Buchstaben ("B", "eps1 A"). */
    komponente: (name: string): string => `Stern ${name}`,
    quellbildGrenze: (massstab: string): string => `Grenze des Quellbilds: Die Aufnahme hat ${massstab} je Pixel; feinere Einzelheiten fehlen im Anblick.`,
    quellbildGrenzeThema: "Grenze des Quellbilds"
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
    mm: "mm",
    mag: "mag",
    magProBogensekunde2: "mag/″²"
  }
} as const;
