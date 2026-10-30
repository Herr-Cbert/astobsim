# astobsim

Simulation des visuellen Anblicks von Himmelsobjekten am Okular eines Geraets unter gegebenen Bedingungen. Ein Kontext, ein Glossar. Begriffe gelten fuer Code, Dokumente, Issues und Oberflaeche.

## Sprache

### Geraet und Optik

**Geraet**:
Das optische System vor dem Auge: Fernrohr, Fernglas oder blosses Auge. Beschrieben durch Oeffnung, Brennweite, Obstruktion und Bauart.
_Vermeiden_: Teleskop, Instrument, Optik

**Listengeraet**:
Ein Geraet aus der Geraeteliste (`daten/geraete.json`), in der URL als id; ein Fernrohr der Liste traegt noch kein Okular.

**Freies Geraet**:
Ein Geraet, dessen Werte der Nutzer selbst eingibt und das mit keinem Listengeraet uebereinstimmt; in der URL als Zahlen.

**Fernrohr**:
Ein Geraet mit wechselbarem Okular. Bauarten: Refraktor, Newton, Schmidt-Cassegrain, Maksutov.
_Vermeiden_: Teleskop

**Fernglas**:
Ein Geraet mit fester Vergroesserung und festem wahren Gesichtsfeld, ohne Okularwahl.
_Vermeiden_: Binokular, Feldstecher

**Blosses Auge**:
Das Geraet mit 6 mm Oeffnung und Vergroesserung 1, ohne Okular. Gesichtsfeld als rechteckiger Ausschnitt.

**Okular**:
Brennweite und scheinbares Gesichtsfeld; bestimmt zusammen mit dem Fernrohr Vergroesserung, wahres Gesichtsfeld und Austrittspupille.

**Bauart**:
Refraktor, Newton, Schmidt-Cassegrain oder Maksutov. Setzt einen Vorschlagswert fuer die Obstruktion.
_Vermeiden_: Typ (ist fuer Fernrohr, Fernglas, Auge reserviert)

**Obstruktion**:
Anteil des Oeffnungsdurchmessers, den der Fangspiegel abschattet, als Zahl 0 bis 0,5.

**Vergroesserung**:
Objektivbrennweite geteilt durch Okularbrennweite; bei Fernglas und Auge fest.

**Austrittspupille**:
Oeffnung geteilt durch Vergroesserung, in mm. Bestimmt mit der festen Augenpupille von 6 mm die Bildhelligkeit.

**Wahres Gesichtsfeld**:
Der Himmelsausschnitt, den das Geraet zeigt, in Grad oder Bogenminuten.
_Vermeiden_: Feld, Field of View

**Scheinbares Gesichtsfeld**:
Der Winkel, unter dem das Auge das Okularbild sieht, in Grad; Eigenschaft des Okulars.

### Objekte

**Objekt**:
Mond, Mars, Jupiter, Saturn, ein Doppelstern oder ein Deep-Sky-Objekt. Hat einen oder mehrere Zustaende und gehoert zu genau einer Objektklasse.
_Vermeiden_: Himmelskoerper, Ziel, Target

**Objektklasse**:
Eine der drei Arten von Objekten: Sonnensystem (Mond und Planeten), Doppelstern oder Deep-Sky-Objekt.
_Vermeiden_: Kategorie, Typ

**Doppelstern**:
Ein Objekt aus zwei Sternen mit Trennung in Bogensekunden, ohne Quellbild; aus einer festen Katalogliste oder als freies Paar eingestellt.
_Vermeiden_: Doppel, Paar (allein)

**Mehrfachstern**:
Ein Objekt der Objektklasse Doppelstern aus mehr als zwei Sternen eines Systems (Epsilon Lyrae), in seiner echten Lage mit Norden oben; Doppelsterne aus zwei Sternen bleiben fest Ost-West (A-Z9). Entschieden in Phase 2 Version 2 (`docs/recherche/README.md`).
_Vermeiden_: Vierfachstern, Doppel-Doppelstern

**Deep-Sky-Objekt**:
Ein Objekt ausserhalb des Sonnensystems mit eigener Flaechenhelligkeit (Nebel, Galaxie, Sternhaufen), z. B. M31, M42, M13, M45, M57. Kann Sterne enthalten.
_Vermeiden_: DSO, Nebel (fuer alle)

**Begleiter**:
Eine kompakte Flaeche im Feld eines Deep-Sky-Objekts mit eigenem Bild, eigener Flaechentabelle und eigener Wahrnehmungsschwelle, z. B. M32 bei M31 (Issue #136, ADR-0004 Nachtrag). Kein Stern und kein eigenes Objekt in der Auswahl; nur fuer Deep-Sky-Zustaende mit Quellbild.
_Vermeiden_: Trabant, Satellitengalaxie, Unterobjekt

**Zustand**:
Eine feste, repraesentative Erscheinung eines Objekts mit Winkelgroesse, Phase, Ringoeffnung, Magnitude und zugeordnetem Quellbild, z. B. "Jupiter 47 Bogensekunden".
_Vermeiden_: Variante, Preset, Ephemeride

**Mond**:
Der Erdmond. Nur dieser.
_Vermeiden_: Luna; und nie fuer Planetenmonde

**Trabant**:
Ein Mond eines Planeten (Io, Europa, Ganymed, Kallisto, Titan, Rhea). Wird als Punktquelle mit Winkeldurchmesser und Magnitude an fester Position relativ zum Planeten dargestellt.
_Vermeiden_: Mond, Satellit, Begleiter (Begleiter ist ein Deep-Sky-Begriff, siehe dort)

**Punktquelle**:
Etwas, dessen Winkeldurchmesser unter der Aufloesungsgrenze liegt und das durch Magnitude statt Flaechenhelligkeit beschrieben wird: ein Trabant, ein Stern oder ein unaufgeloester Zustand.
_Vermeiden_: Punkt, Lichtpunkt

**Stern**:
Eine Punktquelle ausserhalb des Sonnensystems mit Magnitude und Farbindex B-V; Teil eines Doppelsterns oder eines Deep-Sky-Objekts.

**Feldstern**:
Ein Stern im Gesichtsfeld, der nicht zum Objekt gehoert. Wird nicht dargestellt (Nicht-Ziel).
_Vermeiden_: Hintergrundstern

**Unaufgeloest**:
Eigenschaft eines Zustands, dessen Winkelgroesse mal Vergroesserung unter der Aufloesung des Auges liegt (z. B. Jupiter mit blossem Auge). Er wird mit gleitendem Uebergang als Punktquelle statt als Flaeche dargestellt.

**Punktebene**:
Eigene Ebene im Arbeitsraster, in die bild die Punktquellen malt und lokal mit dem Kern faltet, getrennt vom Objektraster (Issue #72). Ihre Pixel werden je Pixel mit `Helligkeit.punktFaktor` und `punktExponent` auf die Anzeigehelligkeit abgebildet (physik.md Abschnitt 14), bezogen auf das Punktweiss. Farbe und Deckkraft der Sterne traegt eine dreikanalige Faerbung neben der einkanaligen Punktebene (`docs/architektur.md` 5.3).

**Winkelgroesse**:
Scheinbarer Durchmesser eines Objekts oder Zustands in Bogensekunden, bei Planeten aequatorial.

### Bedingungen

**Bedingungen**:
Seeing, Himmelshelligkeit, Transparenz und Hoehe ueber dem Horizont zusammen.
_Vermeiden_: Umgebung, Wetter, Atmosphaere

**Seeing**:
Die Luftunruhe, angegeben als Halbwertsbreite der Langzeit-PSF in Bogensekunden im Zenit. Wortstufen und Pickering-Stufe sind abgeleitete Anzeigen.
_Vermeiden_: Luftunruhe (nur als Erklaerung im Hilfetext)

**Himmelshelligkeit**:
Die Flaechenhelligkeit des Himmelshintergrunds, eingegeben als Bortle-Stufe 1 bis 9.
_Vermeiden_: Lichtverschmutzung, Bortle (allein; Bortle ist die Skala, nicht die Groesse)

**Transparenz**:
Die Klarheit der Luft in drei Stufen (klar, leicht diesig, diesig), wirkt als Extinktion.
_Vermeiden_: Dunst, Sicht

**Hoehe**:
Winkel des Objekts ueber dem Horizont in Grad. Bestimmt die Luftmasse.
_Vermeiden_: Elevation, Altitude

**Luftmasse**:
Die relative Weglaenge des Lichts durch die Atmosphaere, 1 im Zenit. Abgeleitet aus der Hoehe.

### Modell

**Konfiguration**:
Alles, was der Nutzer einstellt: Geraet, Okular, Objekt mit Zustand und Bedingungen. Eine Konfiguration ist vollstaendig in der URL abbildbar.
_Vermeiden_: Einstellungen, Setup, Szenario

**Voreinstellung**:
Die Startkonfiguration nach A-D9 und der Rueckfallwert fuer jeden fehlenden oder unlesbaren URL-Parameter.
_Vermeiden_: Default, Preset

**Kataloge**:
Die geladenen Listen aus daten (Geraete, Objekte, Bildnachweise), aus denen zustand eine Konfiguration aus der URL wiederherstellt.

**Aufloesungsgrenze**:
Eine der drei Grenzen des Modells: Beugung (Oeffnung und Obstruktion), Seeing (Langzeit-PSF) und Auge (eine Bogenminute geteilt durch die Vergroesserung). Die groesste ist die dominante Grenze.

**Gesamt-PSF**:
Die Punktbildfunktion, die Beugung, Seeing und Auge zusammen auf das Objekt wirken laesst; das Quellbild wird mit ihr gefaltet.
_Vermeiden_: Unschaerfe, Blur, Kernel (der Kern ist die diskrete Form der Gesamt-PSF im Arbeitsmassstab)

**Kern**:
Die Gesamt-PSF als diskrete Matrix im Arbeitsmassstab.

**Falter**:
Der Baustein der Bildpipeline, der ein Raster mit dem Kern faltet; zwei Adapter (WebGL2 in Produktion, JavaScript fuer Tests und als Rueckfall), die dasselbe Ergebnis liefern.
_Vermeiden_: Convolver, Filter

**Arbeitsmassstab**:
Der Pixelmassstab in Bogensekunden je Pixel, in dem gefaltet wird: nie feiner als das Quellbild, nie feiner als noetig fuer die Gesamt-PSF, nie feiner als die Anzeige.

**Fenster**:
Der Himmelsausschnitt, der gezeichnet wird: Mitte in Objektkoordinaten, Breite in Bogensekunden und Breite in Anzeigepixeln. Ohne Angabe das ganze wahre Gesichtsfeld mit dem Objekt in der Mitte (Standardfenster); Verschieben und Zoom sind nur ein anderes Fenster.
_Vermeiden_: Viewport, Ansicht (die Zoomansicht ist ein eigener Begriff)

**Arbeitsraster**:
Das Pixelraster, auf dem gefaltet wird: das Fenster im Arbeitsmassstab.

**Warnung**:
Ein Hinweis an den Nutzer, dass eine Einstellung physikalisch ungeeignet ist (Austrittspupille ueber 6 mm oder unter 0,5 mm, Vergroesserung ueber dem Doppelten der Oeffnung in mm, A-D5). Eine Warnung verhindert keine Simulation.
_Vermeiden_: Fehler (Fehler sind Programmierfehler oder kaputte Daten)

**Anblick**:
Das Ergebnisbild: das Objekt im wahren Gesichtsfeld, gefaltet mit der Gesamt-PSF, in Helligkeit und Kontrast angepasst. Zeigt den typischen Langzeit-Anblick, nicht den besten Moment.
_Vermeiden_: Simulation (ist der Vorgang), Ergebnis, Rendering

**Anzeigehelligkeit**:
Linearer Wert, mit dem bild ein Pixel zeichnet: 1 = Bildschirmweiss, vor der sRGB-Kodierung. physik bildet die Flaechenhelligkeit im Okular darauf ab (physik.md Abschnitt 12); `Helligkeit.faktorObjekt` ist die Anzeigehelligkeit von Quellweiss, `hintergrundRelativ` die des Himmels.
_Vermeiden_: Anzeigewert (der Typ `Anzeigewerte` sind die Zahlen neben dem Bild), Tonwert (ist der Arbeitsschritt in bild)

**Wahrnehmungsschwelle**:
Der kleinste Kontrast gegen den Himmel im Okular, den der feste, voll dunkeladaptierte Normalbeobachter noch sieht, abhaengig von der Himmelsleuchtdichte und der Ausdehnung des Details; fuer Sterne folgt daraus die Grenzgroesse. Was darunter liegt, zeigt der Anblick als Himmel.
_Vermeiden_: Sichtbarkeitsgrenze, Kontrastgrenze

**Feldfaktor**:
Faktor F, um den die Schwelle des festen Beobachters ueber Blackwells Laborschwelle liegt (Crumey 2014); in astobsim 1,4 (ADR-0004), am Fernrohr zusaetzlich sqrt 2 fuer einaeugiges Sehen. Steht fuer Erfahrung und Alter, keine Eingabe (A-P9).

**Grenzgroesse**:
Die Magnitude des schwaechsten Sterns, der bei der eingestellten Konfiguration an der Wahrnehmungsschwelle liegt (Blackwell-Wahrscheinlichkeit 0,5, gezeigte Deckkraft 0,49); im Infopanel angezeigt.
_Vermeiden_: NELM (nur fuer das blosse Auge gebraeuchlich), Reichweite

**Isophote**:
Linie gleicher Flaechenhelligkeit eines Deep-Sky-Objekts am Himmel, in mag/arcsec². Die sichtbare Isophote ist die schwaechste, deren eingeschlossene Flaeche ueber der Wahrnehmungsschwelle liegt; darunter verblasst das Objekt gleitend in den Himmel.

**Flaechentabelle**:
Je Deep-Sky-Zustand die Liste "Isophote gegen eingeschlossene Flaeche" (`isophoten` in `daten/objekte.json`), von `tools/` am aufbereiteten Quellbild gemessen; aus ihr bestimmt physik die sichtbare Isophote, ohne Pixel zu sehen. Festlegung seit #105 (Stand 2026-10-29, Herbert kann auf die gefuellte Flaeche umentscheiden): "eingeschlossene Flaeche" ist die Flaeche aller Pixel mit $\mu \le$ Isophote; ein schwaecheres Loch (M57 innen) zaehlt erst mit, wenn die Isophote es erreicht. Bei M57 unterscheidet sich das von der gefuellten Flaeche nur zwischen 17,8 und 18,7 mag/arcsec² (17,8: 1618 statt 2626 arcsec², ab 19,0 gleich).

**Deckkraft**:
Anteil 0 bis 1, mit dem ein Stern oder ein Deep-Sky-Pixel ueber dem Himmel erscheint, nach Blackwells Wahrscheinlichkeitskurve aus dem Verhaeltnis Kontrast zu Schwelle (Wahrscheinlichkeit 0,5 an der Schwelle). Bei Sternen und Trabanten gezeigt ohne den Anteil bei Kontrast 0, P' = (P - P0) / (1 - P0), also 0,49 an der Schwelle und 0 fuer sehr schwache Sterne (ADR-0004, Nachtrag Issue #100). Macht die Wahrnehmungsschwelle gleitend.
_Vermeiden_: Alpha, Transparenz (ist eine Bedingung)

**Mischgewicht**:
Anteil g zwischen 0 (Flaeche) und 1 (Punktquelle), mit dem ein unaufgeloester Zustand in die Punktebene statt in die Flaechenebene geht (A-P10); haengt an Winkelgroesse mal Vergroesserung. Ab g = 0,5 (scheinbar etwa 1,7') nennt das Infopanel den Zustand "unaufgeloest" (#110).

**Sockel**:
Fester Zuschlag zur Anzeigehelligkeit eines Deep-Sky-Objekts, mit der Deckkraft gewichtet, damit ein Pixel an der Wahrnehmungsschwelle mindestens 3 sRGB-Kodes ueber dem Himmel liegt (Mindestsichtbarkeit, ADR-0004).
_Vermeiden_: Verstaerkung, Offset

**Anzeigeweiss**:
Die Flaechenhelligkeit im Okular, die als Bildschirmweiss erscheint: 9,2 mag/arcsec² fuer Flaechen und Himmel (Version 2, vorher 3,35). Die Punktebene hat ein eigenes **Punktweiss** von 6,4 mag/arcsec² (ADR-0004, A-P13).

**Uebersicht**:
Die Grundansicht: der Anblick im ganzen wahren Gesichtsfeld (Standardfenster, verschiebbar nach A-D2). Gegenstueck zur Zoomansicht; die Steuerung wechselt mit `zoome` zwischen beiden.
_Vermeiden_: Normalansicht, Hauptansicht

**Zoomansicht**:
Vergroesserte Ansicht des Objekts im Anblick neben dem unverschlechterten Quellbild zum Vergleich (A-D3). Zeigt das Zoomfenster oder auf Wunsch das Detailfenster. Kein URL-Parameter.

**Zoomfenster**:
Das Fenster der Zoomansicht: das Objekt (Ausdehnung inklusive Ringe, aus dem Quellbild) mit 5 % Rand je Seite, hoechstens ein halbes Gesichtsfeld breit, mindestens 16 Arbeitspixel; Mitte wie in der Uebersicht (`src/ui/zoom.ts`).

**Detailfenster**:
Das schmalere Fenster der Zoomansicht (Schaltflaeche "Detail", Issue #77): 120 Arbeitspixel breit, damit die Aufloesungsgrenze sichtbar wird; nur angeboten, wo es hoechstens drei Viertel des Zoomfensters zeigt (praktisch nur beim Mond). Mitte wie im Zoom, `Stand.detail` in der Steuerung (`src/ui/zoom.ts`).
_Vermeiden_: Zoomstufe (ist eine Stufe der Kachelpyramide), Detailzoom

**Vergleichsbild**:
Das Quellbild rechts in der Zoomansicht: dasselbe Zoomfenster, dieselbe Maske und dieselben Punktquellen wie der Anblick, aber ohne Faltung (1x1-Delta-Kern) und ohne Helligkeitsanpassung (Quellweiss = Bildschirmweiss), auf einem Raster so fein wie Quelle und Anzeige es hergeben. Technisch ein `Anblick` aus `rendere`, inhaltlich kein Anblick. Bei Deep-Sky-Objekten mit Quellbild ist die Flaeche gestreckt: Kubikwurzel erst ueber dem Boden der log-Kennlinie (Bildhintergrund schwarz, Quellweiss bleibt Bildschirmweiss), ohne Wahrnehmungsschwelle; Sterne behalten die Deckkraft des Anblicks (entschieden von Herbert, #110, `src/ui/zoom.ts`).
_Vermeiden_: Originalbild, Referenzbild

### Daten

**Quellbild**:
Die echte hochaufgeloeste Aufnahme eines Zustands (Raumsonde, Hubble) oder beim Mond das zugelassene NASA-Rendering, mit bekanntem Pixelmassstab und Nordrichtung.
_Vermeiden_: Originalbild, Textur, Rohbild (Rohbild ist die unbearbeitete Datei vor der Aufbereitung)

**Quellweiss**:
Die Flaechenhelligkeit, die der Wert 1,0 (Weiss) im Quellbild eines Zustands bedeutet, in mag/arcsec² (`weissMagProArcsec2`, `daten/objekte.json`). Bezug aller linearen Helligkeiten im Quellbild und der Punktquellen. Geeicht ueber den Gesamtfluss des Quellbilds: Summe der linearen Pixelwerte mal Massstab² ergibt mit Quellweiss die Magnitude des Zustands (`docs/recherche/objekte.md` 5.3, `tools/quellweiss_eichen.py`). Nicht die mittlere Flaechenhelligkeit der Scheibe.

**Kennlinie**:
Die Zuordnung der 8-Bit-Kodes eines Quellbilds zu Flaechenhelligkeiten: sRGB bei Mond und Planeten, logarithmisch in mag bei Deep-Sky-Bildern (`kennlinie` in `daten/bilder.json`, ADR-0003 Nachtrag V2).

**Bildnachweis**:
Der Datensatz zu jedem Quellbild: Quelle, Mission, Lizenz, Namensnennung, Pixelmassstab, Bearbeitung.
_Vermeiden_: Credit, Metadaten

**Kachel**:
Ein quadratischer Ausschnitt eines Quellbilds auf einer Stufe (am rechten und unteren Rand kleiner), damit grosse Quellbilder (Mond) teilweise und stufenweise geladen werden.

**Einzelbild**:
Ein Quellbild als eine Datei ohne Kacheln (Planeten); zwei Zustaende eines Objekts koennen sich ein Einzelbild teilen (Mars 14 und 6 Bogensekunden).

**Stufe**:
Eine Aufloesungsstufe einer Kachelpyramide; jede Stufe hat den halben Pixelmassstab der naechstfeineren.
_Vermeiden_: Level, Zoomstufe

**Geraeteliste**:
Die von Hand erweiterbare Datendatei mit den vordefinierten Geraeten.

**Geraeteeintrag**:
Eine Zeile der Geraeteliste: id, Name, Kommentar und das Geraet ohne Okular; erst mit dem gewaehlten Okular wird daraus das Geraet der Konfiguration.

**Testfall**:
Einer der Beobachtungs-Testfaelle T1 bis T6 (Version 1) und T7 bis T12 (Version 2) aus den Anforderungen, mit dem der Anblick gegen Beobachtungserfahrung geprueft wird.
