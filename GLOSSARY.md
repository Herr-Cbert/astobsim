# astobsim

Simulation des visuellen Anblicks von Himmelsobjekten am Okular eines Geraets unter gegebenen Bedingungen. Ein Kontext, ein Glossar. Begriffe gelten fuer Code, Dokumente, Issues und Oberflaeche.

## Sprache

### Geraet und Optik

**Geraet**:
Das optische System vor dem Auge: Fernrohr, Fernglas oder blosses Auge. Beschrieben durch Oeffnung, Brennweite, Obstruktion und Bauart.
_Vermeiden_: Teleskop, Instrument, Optik

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
Mond, Mars, Jupiter oder Saturn. Hat einen oder mehrere Zustaende.
_Vermeiden_: Himmelskoerper, Ziel, Target

**Zustand**:
Eine feste, repraesentative Erscheinung eines Objekts mit Winkelgroesse, Phase, Ringoeffnung, Magnitude und zugeordnetem Quellbild, z. B. "Jupiter 47 Bogensekunden".
_Vermeiden_: Variante, Preset, Ephemeride

**Mond**:
Der Erdmond. Nur dieser.
_Vermeiden_: Luna; und nie fuer Planetenmonde

**Trabant**:
Ein Mond eines Planeten (Io, Europa, Ganymed, Kallisto, Titan, Rhea). Wird als Punktquelle mit Winkeldurchmesser und Magnitude an fester Position relativ zum Planeten dargestellt.
_Vermeiden_: Mond, Satellit, Begleiter

**Punktquelle**:
Ein Objekt, dessen Winkeldurchmesser unter der Aufloesungsgrenze liegt und das durch Magnitude statt Flaechenhelligkeit beschrieben wird. In Version 1 nur Trabanten.
_Vermeiden_: Stern

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

**Aufloesungsgrenze**:
Eine der drei Grenzen des Modells: Beugung (Oeffnung und Obstruktion), Seeing (Langzeit-PSF) und Auge (eine Bogenminute geteilt durch die Vergroesserung). Die groesste ist die dominante Grenze.

**Gesamt-PSF**:
Die Punktbildfunktion, die Beugung, Seeing und Auge zusammen auf das Objekt wirken laesst; das Quellbild wird mit ihr gefaltet.
_Vermeiden_: Unschaerfe, Blur, Kernel (der Kern ist die diskrete Form der Gesamt-PSF im Arbeitsmassstab)

**Kern**:
Die Gesamt-PSF als diskrete Matrix im Arbeitsmassstab.

**Arbeitsmassstab**:
Der Pixelmassstab in Bogensekunden je Pixel, in dem gefaltet wird: nie feiner als das Quellbild, nie feiner als noetig fuer die Gesamt-PSF, nie feiner als die Anzeige.

**Anblick**:
Das Ergebnisbild: das Objekt im wahren Gesichtsfeld, gefaltet mit der Gesamt-PSF, in Helligkeit und Kontrast angepasst. Zeigt den typischen Langzeit-Anblick, nicht den besten Moment.
_Vermeiden_: Simulation (ist der Vorgang), Ergebnis, Rendering

**Zoomansicht**:
Vergroesserte Ansicht des Objekts im Anblick neben dem unverschlechterten Quellbild zum Vergleich.

### Daten

**Quellbild**:
Die echte hochaufgeloeste Aufnahme eines Zustands (Raumsonde, Hubble) oder beim Mond das zugelassene NASA-Rendering, mit bekanntem Pixelmassstab und Nordrichtung.
_Vermeiden_: Originalbild, Textur, Rohbild (Rohbild ist die unbearbeitete Datei vor der Aufbereitung)

**Bildnachweis**:
Der Datensatz zu jedem Quellbild: Quelle, Mission, Lizenz, Namensnennung, Pixelmassstab, Bearbeitung.
_Vermeiden_: Credit, Metadaten

**Kachel**:
Ein quadratischer Ausschnitt eines Quellbilds auf einer Stufe, damit grosse Quellbilder (Mond) teilweise und stufenweise geladen werden.

**Stufe**:
Eine Aufloesungsstufe einer Kachelpyramide; jede Stufe hat den halben Pixelmassstab der naechstfeineren.
_Vermeiden_: Level, Zoomstufe

**Geraeteliste**:
Die von Hand erweiterbare Datendatei mit den vordefinierten Geraeten.

**Testfall**:
Einer der sechs Beobachtungs-Testfaelle T1 bis T6 aus den Anforderungen, mit dem der Anblick gegen Beobachtungserfahrung geprueft wird.
