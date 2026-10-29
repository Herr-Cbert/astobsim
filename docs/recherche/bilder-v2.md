# Recherche: Bilder Version 2 (Deep-Sky und Mondphasen)

- Auftrag: Quellbilder mit freier Lizenz fuer M31, M42, M13 und M57 (A-Z10, A-X11) und fuer die Mondphasen aus NASA SVS 5587 (A-X7) finden, Lizenz beim Datenhalter belegen, Massstab, Bearbeitung, Linearitaet und Dateigroesse bewerten. Offene Fragen 7 und 8 aus Abschnitt 10 der Anforderungen.
- Datum: 2026-10-29 (Phase 2, Version 2)
- Zugeordnete Kennungen: A-X3, A-X4, A-X5, A-X6, A-X7, A-X9, A-X11, A-Z10, A-P12, A-T4, A-Q5.
- Vorgehen: Nur Bildseiten und Lizenzseiten der Datenhalter gelesen (NOIRLab, ESO, ESA/Hubble, MAST, NASA SVS, Lowell, SDSS, Wikimedia Commons). Kein Bild heruntergeladen. Die Mondphasen sind aus der lokal vorhandenen SVS-Stundentabelle `data/roh/mooninfo_2026.json` bestimmt (dieselbe Datei, aus der der Zustand `mond_ev` stammt).
- Bogensekunden je Pixel sind aus Pixelzahl und Bildfeld der Bildseite gerechnet (ber.). Physikalische Groessen und Flaechenhelligkeiten der Objekte liefert `docs/recherche/deep-sky.md`; die Ausdehnungen hier sind nur Richtwerte fuer den Bildausschnitt.
- Massstab der Messlatte wie `bilder.md` 1: A-X5 verlangt 0,25"/px **echte** Aufloesung (300 mm, Seeing 0,5"). A-X11 nimmt M31, M45 und M42 aus (fuer M31 etwa 3 bis 5"/px). M13 und M57 fallen unter A-X5.

## Kurzfassung

- **M31:** Kein Pressebild deckt die ganze helle Scheibe (etwa 190' x 60') in Breitband ab. Empfehlung: NOIRLab-Panorama aus dem Local Group Survey (217' x 55', CC BY 4.0, 0,27"/px nativ), auf 4"/px verkleinert. Linearer Datensatz: die gestapelten LGGS-V-Bilder (FITS, Lowell/NOIRLab-Archiv), Lizenz nicht angegeben.
- **M42:** Empfehlung ESO eso1103a (WFI, 35' x 34', 0,24"/px, U B V R H-alpha, CC BY 4.0); die Rohdaten im ESO-Archiv stehen ebenfalls unter CC BY 4.0, also gibt es einen linearen V-Datensatz mit klarer Lizenz. Alternative Hubble heic0601a (0,10"/px, 30'), lineare Mosaike als MAST-HLSP (gemeinfrei).
- **M13:** Es gibt ein freies Foto **ohne ausgebrannten Kern**: NOIRLab noao-m13kpno4m (Mayall 4 m, Mosaic, B V I, 21,5' x 21,5', 0,26"/px, CC BY 4.0). Die Bildseite sagt ausdruecklich, der Kern sei mit vielen kurzen Belichtungen aufgenommen, "so that it would not be over exposed" [Q25]. Pixelmass erfuellt A-X5 knapp, die echte Aufloesung (Seeing) nicht. Damit ist die Bedingung von A-Z10 fuer das Quellbild erfuellt.
- **M57:** Hubble heic1310a (WFC3, 0,04"/px, CC BY 4.0) erfuellt A-X5 weit. Schmalband (OIII, H-alpha, NII u. a.), was fuer M57 visuell eher ein Vorteil ist (Auge nachts im Gruenen, OIII 501 nm). Lineare, photometrisch kalibrierte WFC3-Bilder (GO 12309, O'Dell et al. 2013) liegen in MAST (gemeinfrei).
- **Mondphasen:** Drei Stundenbilder aus SVS 5587 im selben Mondumlauf wie `mond_ev` (September/Oktober 2026): zunehmende Sichel Frame 6173 (15.09.2026 04:00 UT, 17,3 %, 4,0 d), Vollmond Frame 6449 (26.09.2026 16:00 UT, 99,94 %), letztes Viertel Frame 6615 (03.10.2026 14:00 UT, 49,9 %). Gleiche Datei, gleiches Format, gleicher Massstab 0,643"/px (Annahme, nachmessen).
- **Lizenzen:** NOIRLab, ESO, ESA/Hubble, SDSS und ESO-Archivdaten CC BY 4.0 bzw. CC BY; NASA/MAST und SVS gemeinfrei; DSS urheberrechtlich geschuetzt (kommerziell nur mit Genehmigung), daher ungeeignet ausser in ESO-Bearbeitungen unter CC BY 4.0 (Restfrage).
- **Linearitaet:** Alle Pressebilder sind nichtlinear gestreckt; die Eichung von Quellweiss (`objekte.md` 5.3) setzt aber lineare Pixel voraus. Fuer drei der vier Objekte gibt es lineare FITS mit belegter freier Lizenz (M42 ESO-Archiv, M42/M13/M57 MAST); fuer M31 nur mit Rueckfrage.
- **Dateigroesse:** Alle vier Deep-Sky-Bilder bleiben als Graustufen-WebP unter 3 MB, wenn sie auf den vorgeschlagenen Massstab gebracht werden. Kacheln braucht nur M42 bei 0,5"/px oder M13 bei vollem Pixelmass.

## 1. Bewertungsmassstab

| Objekt | Messlatte | Richtwert Ausdehnung fuer den Ausschnitt | Noetige Pixel (ber.) |
|---|---|---|---|
| M31 | A-X11, 3 bis 5"/px | helle Scheibe etwa 190' x 60', PA etwa 38 Grad | bei 4"/px und Norden oben 1900 x 2310 px (umschliessendes Rechteck der Ellipse, ber.) |
| M42 | A-X11 (Wert fuer M42 nicht festgelegt; Vorschlag 1"/px, siehe 6) | Kern (Huygens-Region) etwa 20', Gesamtnebel mit M43 etwa 60' | bei 1"/px fuer 35' etwa 2100 px |
| M45 | A-X11, nur Lage | Sterne aus Katalog, Reflexionsnebel nicht gezeigt (A-Z10) | kein Bild |
| M13 | A-X5, 0,25"/px echt | etwa 20' (Sternfeld), Kern etwa 1' | 4800 px fuer 20' |
| M57 | A-X5, 0,25"/px echt | heller Ring etwa 86" x 62", Halo etwa 4' | 350 px fuer den Ring |

Farbe: Deep-Sky-Flaechen werden grau gezeigt (A-P12). Aus einem Farbkomposit nimmt man am besten den Kanal, der dem V-Band oder dem Nachtsehen am naechsten ist. Das Auge sieht schwache Flaechen mit den Staebchen, deren Empfindlichkeit bei 507 nm am groessten ist (CIE 1951, [Q37]); H-alpha (656 nm) traegt dort fast nichts bei. Fuer Emissionsnebel (M42, M57) heisst das: OIII (501 nm) und H-beta sind visuell wichtiger als H-alpha, ein Bild mit hervorgehobenem H-alpha zeigt rote Strukturen, die am Okular nicht zu sehen sind.

Linearitaet: Pressebilder sind fuer die Anzeige nichtlinear gestreckt (Logarithmus, Arcsinh, Kurven, oft HDR-Masken, Schaerfung). Fuer astobsim gilt Quellweiss als lineare Flaechenhelligkeit des Pixelwerts 1,0 (`objekte.md` 5.3). Bei einem gestreckten Bild stimmen dann die Verhaeltnisse zwischen Kern und Rand nicht, also gerade das, was A-P11 (Wahrnehmungsschwelle) entscheidet. Drei Wege: (a) lineare FITS mit Kalibration verwenden und mit `tools/` in 8-Bit-Graustufe mit sRGB-Kennlinie umwandeln (bevorzugt); (b) das Pressebild ueber ein veroeffentlichtes Flaechenhelligkeitsprofil zuruecklinearisieren (Tonkurve wie `kontrast_kurve` bei Saturn, Profil aus `deep-sky.md`); (c) das Pressebild so verwenden und die Abweichung im Hilfetext nennen.

## 2. M31 (Andromedagalaxie)

| Kandidat | Urheber, Credit-Zeile | Lizenz | Pixel, Feld | "/px (ber.) | Filter, Farbe | Bearbeitung | Linearer Datensatz | Eignung |
|---|---|---|---|---|---|---|---|---|
| A: NOIRLab noao-m31lgs_ubvIha "Panorama of Spiral Galaxy, M31" [Q14] | "Local Group Survey Team and T.A. Rector (University of Alaska Anchorage)" | CC BY 4.0 [Q8] | 48 327 x 12 185 px, 217,62' x 54,87'; Downloads: Original 717 MB, Publication TIFF 40K 465 MB, 25K 180 MB, 10K 29,9 MB | 0,270 (nativ); 10K-Fassung 1,31 | U, B, V ("cyan"), I, H-alpha ("red"); Mayall 4 m, Mosaic I, zehn Felder | Farbkomposit, HII-Gebiete hervorgehoben; "rotated CW 127 degrees from North is up" | ja: LGGS, gestapelte UBVRI-Bilder je Feld als FITS (Lowell-FTP, NOAO-Archiv) [Q15][Q16]; Lizenz nicht angegeben, Bitte um Nachricht bei Nutzung | **Empfohlen.** Einzige freie Aufnahme, die die helle Scheibe in voller Laenge zeigt. 10K-TIFF genuegt (1,31"/px, auf 4"/px verkleinern). H-alpha-Knoten wirken im Graubild zu hell: Graustufe aus dem Kanal mit dem V-Anteil bilden (Zuordnung pruefen) oder aus den LGGS-V-Daten. |
| B: NOIRLab noao-m31 "The Andromeda Galaxy" [Q13] | "T.A.Rector and B.A.Wolpa/NOIRLab/NSF/AURA" (ESA/Hubble-Kopie opo1204c: "T. Rector and B. Wolpa (NOAO/AURA/NSF)" [Q19]) | CC BY 4.0 [Q8] | 8175 x 8292 px, 57,79' x 58,65'; Original 194 MB, Publication TIFF 4K 36 MB | 0,424 | U, B, V, R, I, H-alpha, OIII; KPNO 0,9 m, Mosaic I, 13.01.2001 | "true-color image ... combining images taken in seven filters", Norden 0,3 Grad rechts der Senkrechten | Rohdaten vermutlich im NOIRLab-Archiv, nicht geprueft | Gute Qualitaet, Staubbaender, M32 im Bild. Deckt aber nur das innere Grad ab; die Scheibe ist an beiden Enden abgeschnitten. Fuer Fernglas und blosses Auge (T-Faelle M31) ungeeignet, nur mit weichem Randabfall. |
| C: Commons "Andromeda Galaxy 560mm FL.jpg" [Q17] | David (Deddy) Dayag | CC BY-SA 4.0 (Copyleft) | 4114 x 2778 px, Feld nicht angegeben | etwa 1,7 (ber. aus ASI294MC 4,63 µm bei 560 mm), Feld also etwa 117' x 79' | RGB plus H-alpha; Celestron CPC 1100 mit Hyperstar (f/2), ASI294MC | PixInsight, Photoshop "noise reduction, sharpening, and enhancement" | nein | Amateur, Scheibe am Rand knapp, geschaerft; nur Notloesung |
| (verworfen) Commons "Andromeda Galaxy (with h-alpha).jpg" [Q18] | Adam Evans | CC BY 2.0, Commons vermerkt, dass der Flickr-Nutzer die Lizenz spaeter zurueckgezogen hat | 3000 x 1971 px | unbekannt | LRGB plus H-alpha | Farbbalance geaendert | nein | CC-Lizenzen sind unwiderruflich, das Risiko bleibt aber; nicht empfohlen |
| (Hinweis) SDSS-Sonderstreifen M31 | SDSS | CC BY [Q12] | 0,396"/px | - | u g r i z, linear | keine (Archivdaten) | ja, linear, frei | Kern und helle Sterne gesaettigt (SDSS saettigt um r = 14 mag, Lehrbuchwert, nicht eigens belegt); nicht weiter geprueft |
| (Hinweis) DSS2-Mosaike | Caltech/Palomar | urheberrechtlich geschuetzt, kommerziell nur mit Genehmigung [Q10][Q11] | 1"/px | - | Fotoplatten | nichtlinear (Platte) | ja, aber nicht frei | ungeeignet (A-X3) |

Linearer Datensatz im Detail: Die LGGS-Seite nennt "We have now released all of our images ... The stacked images can be downloaded either from ftp://ftp.lowell.edu/pub/massey/lgsurvey or from http://www.archive.noao.edu/nsa/" und bittet: "PLEASE send me (phil.massey at lowell.edu) a note giving publication information if you use our data" [Q15]. Eine Lizenz steht dort nicht; das NOIRLab Astro Data Archive nennt auf seiner Uebersichtsseite ebenfalls keine [Q36]. Die LGGS-Mosaike haben etwa 0,26"/px und je Feld etwa 36' (Massey et al. 2006 [Q16]); zehn Felder ueberdecken die Scheibe. Massey et al. raten von Praezisionsphotometrie auf den Mosaiken ab, fuer eine Flaechenhelligkeits-Vorlage ist das unerheblich.

## 3. M42 (Orionnebel)

| Kandidat | Urheber, Credit-Zeile | Lizenz | Pixel, Feld | "/px (ber.) | Filter, Farbe | Bearbeitung | Linearer Datensatz | Eignung |
|---|---|---|---|---|---|---|---|---|
| A: ESO eso1103a "The Orion Nebula" [Q20] | "ESO/Igor Chekalin" | CC BY 4.0 [Q7] | 8948 x 8597 px, 35,49' x 34,10'; Norden oben | 0,238 | U (340 nm), B (451), V (539), R (651), H-alpha (658); MPG/ESO 2,2 m, WFI; "about 52 minutes through each filter" | R und H-alpha rot, V gruen, B blau, U violett; von ESO aus Archivdaten verarbeitet (Hidden Treasures 2010), stark gestreckt | **ja**: WFI-Rohdaten im ESO Science Archive, "distributed according to the terms of the Creative Commons Attribution 4.0 International license" [Q9] | **Empfohlen.** Breitband-V als eigener Kanal (Gruen), Bildfeld deckt Kern, M43 und Fluegel ab, Norden oben, klare Lizenz fuer Bild und Rohdaten. Ob der Kern in 52-min-Summen gesaettigt ist, ist auf der Seite nicht gesagt; die Rohdaten (Einzelbelichtungen) entscheiden. |
| B: ESA/Hubble heic0601a "Hubble's sharpest view of the Orion Nebula" [Q21] | "NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA) and the Hubble Space Telescope Orion Treasury Project Team" | CC BY 4.0 (ESA/Hubble) / gemeinfrei (NASA), Lesart wie `bilder.md` 6.3 [Q5][Q6] | 18 000 x 18 000 px, 30,03' x 30,03'; Original 385 MB, Publication TIFF 133 MB | 0,100 | ACS B (435), V (555), H-alpha (658), I (775), z (850); Zusatzdaten WFI 2,2 m | Mosaik, HDR-artig gestreckt (Kern und Fluegel zugleich sichtbar), Luecken mit Bodendaten gefuellt | **ja**: HLSP Orion Treasury (GO 10246), Mosaike je Filter unter archive.stsci.edu/pub/hlsp/orion/ [Q22]; MAST: "Most data hosted at MAST are in the public domain" [Q10] | Feinstes Bild, fuer A-X11 weit ueberdimensioniert; als zweite Wahl, falls eso1103a im Kern ausgebrannt ist. Feld 30' etwas kleiner als A. |
| C: NOIRLab noao-m42steinberg "M42: The Orion Nebula Wide" [Q23] | "KPNO/NOIRLab/NSF/AURA/Ryan Steinberg and Family/Adam Block" | CC BY 4.0 [Q8] | 1526 x 853 px, 130,89' x 73,22' | 5,15 | B, G, R, Luminanz (555 nm), RCOS 16 Zoll | Amateurbearbeitung (AOP 2014) | nein | Nur fuer kleinste Vergroesserungen (Fernglas), zu grob fuer Fernrohr |
| D: ESO eso1304c "Wide-field view of part of Orion in visible light" [Q24] | "ESO/Digitized Sky Survey 2. Acknowledgement: Davide De Martin" | CC BY 4.0 laut ESO [Q7] | 10 615 x 10 444 px, 178,2' x 175,3' | 1,01 | DSS2-Fotoplatten (blau, rot) | Komposit aus Platten, Kern vermutlich gesaettigt | DSS-Platten nicht frei [Q11] | Grossfeld fuer Fernglas; Lizenzkette DSS zu ESO unklar (siehe 7) |

## 4. M13 (Kugelsternhaufen im Herkules)

| Kandidat | Urheber, Credit-Zeile | Lizenz | Pixel, Feld | "/px (ber.) | Filter, Farbe | Bearbeitung | Linearer Datensatz | Eignung |
|---|---|---|---|---|---|---|---|---|
| A: NOIRLab noao-m13kpno4m "M13, NGC 6205" [Q25] | "T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA)" | CC BY 4.0 [Q8] | 4929 x 4928 px, 21,50' x 21,50'; Original 152 MB, Publication TIFF 4K 35 MB | 0,262 | B (436), V (537), I (805); Mayall 4 m, Mosaic I | "Because the core of the cluster is very bright, many short exposures had to be taken so that it would not be over exposed"; "North is left, East is down" | Rohdaten vermutlich im NOIRLab-Archiv, Lizenz nicht angegeben [Q36] | **Empfohlen.** Kern laut Bildseite nicht ueberbelichtet (A-Z10 erfuellt, nach dem Laden am Histogramm pruefen). Feld deckt den Haufen ab. Pixelmass 0,26" erfuellt A-X5 fast, die echte Aufloesung ist durch das Seeing begrenzt (nicht angegeben, Kitt Peak typisch um 1", Schaetzung). Um 90 Grad drehen (Norden oben). V-Kanal (Gruen) als Graustufe. |
| B: ESA/Hubble potw1011a "The crowded heart of the Hercules globular cluster" [Q26] | "ESA/Hubble and NASA" | CC BY 4.0 [Q6] | 3018 x 3018 px, 2,52' x 2,52'; Original 24 MB | 0,050 | ACS/WFC F435W (blau), F625W (gruen), F814W (rot); 1480 s, 380 s, 567 s | Norden 249,5 Grad links der Senkrechten | **ja**: ACS-Daten in MAST, gemeinfrei [Q10]; zusaetzlich vermutlich ACS Globular Cluster Treasury (GO 10775, F606W/F814W), nicht geprueft | Kern voll aufgeloest, erfuellt A-X5 weit, aber nur 2,5' Feld (Kern). Als Ergaenzung fuer den Kern bei hoher Vergroesserung oder zur Pruefung von A. Helle Riesen in 380 s wahrscheinlich gesaettigt (Spikes). |
| C: ESA/Hubble opo0840a "Hubble image of globular cluster M13" [Q27] | "NASA, ESA, and the Hubble Heritage Team (STScI/AURA)" | CC BY 4.0 / gemeinfrei | 6360 x 6360 px, 3,53' x 3,53'; Original 53 MB (Ausschnitt opo0840d 4465 x 4496 px, 2,48') | 0,033 | WFPC2 und ACS, B, V, I (Daten 1999 bis 2006) | Komposit aus vier Programmen | ja, MAST | wie B, etwas groesseres Feld |
| D: NOIRLab noao0103a [Q28] | "N.A.Sharp, REU program/NOIRLab/NSF/AURA" | CC BY 4.0 | 1800 x 1366 px, 30,46' x 23,11' | 1,02 | Burrell-Schmidt, Farbe | "moderately shallow color picture" | nein | zu grob fuer A-X5 |

> Nachtrag 2026-10-29 (Issue #108): Am Publication TIFF 4K (4000 x 3999 px) geprueft: im Umkreis von 1' um die Mitte 8 von 108821 Pixeln des V-Kanals bei Kode 255, Median 215, die Kernsterne sind aufgeloest; der Kern ist nicht gesaettigt. Das Bild ist aber nicht linear (FITS-Liberator-Streckung Log(x) laut AVM-Kopf, danach in Photoshop bearbeitet, physik.md 27.1) und hat einen Himmelsrest in der Groesse des aeusseren Halos. Umgesetzt ist "Sterne plus Restlicht" (Entscheidung Herbert): das Bild traegt nur das Restlicht bis 3', aussen ein Profilmodell.

Ergebnis fuer A-Z10: Ein freies Foto von M13 ohne ausgebrannten Kern **wurde gefunden** (A). Die Aussage stammt von der Bildseite; ob die hellsten Sterne im Kern unter der Saettigung liegen, laesst sich erst an der Datei pruefen (Anteil der Pixel bei 255 im V-Kanal im inneren 1'). Weil die echte Aufloesung von A schlechter als 0,25" ist, bleibt fuer 200 bis 300 mm bei sehr gutem Seeing die Wahl: (a) A-X11 auf M13 erweitern (Hilfetext), (b) A fuer das Restlicht und Katalogsterne fuer die hellen Haufensterne, (c) A fuer das Gesamtfeld plus Hubble (B) fuer den inneren Bereich.

## 5. M57 (Ringnebel)

| Kandidat | Urheber, Credit-Zeile | Lizenz | Pixel, Feld | "/px (ber.) | Filter, Farbe | Bearbeitung | Linearer Datensatz | Eignung |
|---|---|---|---|---|---|---|---|---|
| A: ESA/Hubble heic1310a "Hubble image of the Ring Nebula (Messier 57)" [Q29] | "NASA, ESA, and C. Robert O'Dell (Vanderbilt University)." | CC BY 4.0 (ESA/Hubble) / gemeinfrei (NASA) | 3179 x 3179 px, 2,10' x 2,10'; Original 18 MB | 0,040 | WFC3 Schmalband: H-beta 487, HeII 469, OIII 502, Kontinuum 645, H-alpha 656, SII 673, NII 658 nm; Aufnahme 19.09.2011 | Komposit, Norden 11,7 Grad links der Senkrechten | **ja**: GO 12309, Emissionslinienbilder mit Kalibration gegen Bodenspektrophotometrie (O'Dell et al. 2013, AJ 145, 92) [Q30]; MAST gemeinfrei [Q10] | **Empfohlen.** Erfuellt A-X5 um Faktor 6. F502N (OIII) linear ist fuer das Nachtsehen die passendste Graustufe. Feld 2,1' zeigt den Ring, den aeusseren Halo nur teilweise (visuell ohnehin kaum sichtbar). |
| B: NOIRLab noao-ring "Ring Nebula, M57 (NGC 6720)" [Q31] | "C.F.Claver/WIYN/NOIRLab/NSF" | CC BY 4.0 [Q8] | 1000 x 1000 px, 1,83' x 1,83' | 0,110 | H-alpha plus NII (rot), OIII (gruen); WIYN 3,5 m mit Tip-Tilt, 02.04.2002, 3 min | "The corrected 'seeing' in this image is about 0.3 arc seconds (FWHM)" | nein | Bodenaufnahme mit fast A-X5-Aufloesung, kleine Datei; Feld knapp um den Ring |
| C: NOIRLab noao-m57largeblock "M57 (Ring Nebula)" [Q32] | "KPNO/NOIRLab/NSF/AURA/Adam Block" | CC BY 4.0 [Q8] | 1240 x 1196 px, 3,52' x 3,40' | 0,170 | Breitband B, G, R, Luminanz; Visitor Center, 2014 | Amateurbearbeitung, Halo und IC 1296 hervorgehoben | nein | Einziges Breitbandbild mit Halo; echte Aufloesung Seeing-begrenzt, A-X5 verfehlt |
| D: ESA/Hubble opo9901a "Looking down a barrel of gas at a doomed star" [Q33] | "Hubble Heritage Team (AURA/STScI/NASA/ESA)" | CC BY 4.0 / gemeinfrei | 1215 x 1241 px, 2,01' x 2,06' | 0,099 | WFPC2 HeII, OIII, NII; Oktober 1998 | Norden 33,4 Grad rechts | ja, MAST (GO 7632) | aelter, durch A ersetzt |
| (verworfen) JWST 2023 | ESA/Webb | CC BY 4.0 | - | - | Infrarot | - | - | nicht visuell |

## 6. Dateigroesse und Kacheln (A-X6)

Bezug: Der Mond (`mond_svs5587_6285`) belegt in drei Stufen 12,4 Mpx mit 1 767 214 Byte WebP (RGB, Qualitaet 95), also etwa 1,1 bit/px (ber. aus `bilder.json`). Deep-Sky-Bilder in Graustufe haben dunkle, glatte Flaechen, aber Sternfelder und Rauschen; angenommen 1 bis 3 bit/px fuer Graustufen-WebP Qualitaet 90 bis 95 (Schaetzung). Bilder unter `daten/` zaehlen nicht zum Erstladen (5 MB), sondern zur Grenze von 20 MB je Objekt (`bilder.md` 7, A-X6).

| Objekt, Bild | Ziel-"/px | Pixel (ber.) | Graustufe WebP (Schaetzung) | Kacheln? |
|---|---|---|---|---|
| M31, LGS-Panorama, Norden oben | 4,0 | 1900 x 2310 (4,4 Mpx, Rand schwarz) | 0,6 bis 1,6 MB | nein (A-X11: nur wenn die Groesse es verlangt) |
| M31, dasselbe bei 3"/px | 3,0 | 2520 x 3080 (7,8 Mpx) | 1,0 bis 2,9 MB | nein |
| M42, eso1103a | 1,0 | 2130 x 2050 (4,4 Mpx) | 0,6 bis 1,6 MB | nein |
| M42, eso1103a | 0,5 | 4260 x 4090 (17 Mpx) | 2,2 bis 6,5 MB | ja, sinnvoll (512 px, 4 Stufen) |
| M13, noao-m13kpno4m voll | 0,262 | 4928 x 4928 (24 Mpx) | 3 bis 9 MB | ja (wie Mond) |
| M13, auf 0,5"/px | 0,5 | 2580 x 2580 (6,7 Mpx) | 0,8 bis 2,5 MB | nein; echte Aufloesung (Seeing) geht kaum verloren |
| M57, heic1310a auf 0,1"/px | 0,1 | 1260 x 1260 (1,6 Mpx) | 0,2 bis 0,6 MB | nein |
| Mond, drei neue Phasen | 0,643 | je 3072 x 3072 plus Stufen | Sichel etwa 0,6 MB, letztes Viertel etwa 1,8 MB, Vollmond etwa 3,4 MB (ber. aus beleuchteter Flaeche gegen `mond_ev`) | ja, wie `mond_ev` |

Folgerung: Alle Objekte bleiben weit unter 20 MB. Die Kachelpyramide (ADR-0003, `tools/mond_kacheln.py`) ist nur fuer die Mondphasen und, falls gewuenscht, fuer M42 bei 0,5"/px und M13 bei vollem Pixelmass noetig. Fuer M31 ist eine Einzeldatei ausreichend. Zusaetzlich zum 8-Bit-Format: Bei Deep-Sky-Bildern reicht der Dynamikumfang von 8 Bit mit sRGB-Kennlinie (etwa 1:3000 bis zum ersten Kodewert, also etwa 8,7 mag) fuer den Kern von M31 bis zur aeusseren Scheibe gerade aus (Lehrbuchwert der sRGB-Kennlinie, ber.); fuer M42 (Kern gegen Fluegel deutlich mehr als 9 mag) waere ein 16-Bit-PNG oder eine zweite Belichtungsebene zu erwaegen. Das gehoert zur ADR-0004 (Helligkeit).

## 7. Lizenzen

### 7.1 NOIRLab [Q8]

"Unless specifically noted, the images, and videos distributed on the public NOIRLab website, along with the texts of press releases ... are licensed under a Creative Commons Attribution 4.0 International License, and hence may on a non-exclusive basis be reproduced without fee provided the credit is clear and visible." Bedingungen: keine Werbung mit Billigung durch NOIRLab, keine kommerzielle Nutzung von Bildern mit erkennbaren Personen, Logo ausgenommen. Die Bildseiten wiederholen: "Crediting this image with the full credit line, in a visible way is MANDATORY, if you want to use it without paying a fee." Bewertung: erfuellt A-X3, Credit-Zeile woertlich und sichtbar. Die Rohdaten im Astro Data Archive tragen keine eigene Lizenzangabe [Q36].

### 7.2 ESO, Bilder und Archivdaten [Q7][Q9]

- Bilder: "Unless specifically noted, the images, videos, and music distributed on the public ESO website ... are licensed under a Creative Commons Attribution 4.0 International License ... The license allows adaptation of the material". Credit "with the wording unaltered".
- Archiv (Data Access Policy, 07.11.2022): "All data in the ESO archive retain ESO's copyright, and are distributed according to the terms of the Creative Commons Attribution 4.0 International license." Weitergabe durch Dritte erlaubt, wenn "Credit to the ESO provenance of the data must be acknowledged, and the file headers preserved." Proprietaere Frist meist ein Jahr; die WFI-Daten von M42 (Da Rio et al. 2009) sind laengst frei.
- Bewertung: Fuer M42 die sauberste Lizenzlage (Bild und lineare Rohdaten unter derselben Lizenz).

### 7.3 ESA/Hubble und NASA/MAST [Q5][Q6][Q10]

- ESA/Hubble CC BY 4.0, NASA-Fassungen gemeinfrei; Lesart wie `bilder.md` 6.3 (Lizenzfeld mit beiden Angaben, Credit unveraendert, Aenderungsvermerk dahinter).
- MAST: "Most data hosted at MAST are in the public domain"; Ausnahmen sind Daten mit exklusiver Frist, lizenzierte HLSPs und die urheberrechtlich geschuetzten Sammlungen DSS und Guide Star Catalogs; "Commercial, for-profit use of the copyrighted collections is prohibited" ohne Genehmigung. Fuer HST-Daten wird eine Danksagung erwartet.

### 7.4 DSS [Q11]

POSS-Digitalisate "are copyright (c) 1993-1995 by the California Institute of Technology", UK-Schmidt-Digitalisate (c) Anglo-Australian Observatory bzw. UK SERC/PPARC, der Rest (c) AURA. Bewertung: nicht frei, ungeeignet. ESO veroeffentlicht DSS2-Komposite (eso1304c) dennoch unter CC BY 4.0; ob ESO die Rechte an den Platten weiterlizenzieren kann, ist offen. Fuer astobsim nicht noetig.

### 7.5 SDSS [Q12]

"Any SDSS image on the SDSS Web site may be downloaded, linked to, or otherwise used for any purpose, provided that you maintain the image credits." "We provide all images on a Creative Commons Attribution license (CC-BY)." Credit "Sloan Digital Sky Survey". Bewertung: frei, aber fuer M31 und M13 wegen Saettigung wenig nuetzlich.

### 7.6 Wikimedia Commons [Q17][Q18]

Wie `bilder.md` 6.5: Selbstauskunft des Uploaders, CC BY-SA ist Copyleft. Bei "Andromeda Galaxy (with h-alpha).jpg" vermerkt Commons, dass der Urheber das Bild auf Flickr nicht mehr unter CC BY 2.0 anbietet.

### 7.7 NASA SVS [Q2]

"All of our content is in the public domain (unless otherwise noted)", "free to download, use, and redistribute for whatever purposes you see fit"; Ausnahme lizenzierte Musik (SVS 5587 nennt fuer das Video "Universal Production Music", die Einzelbilder sind davon nicht betroffen [Q1]). Eine Credit-Pflicht nennt die Seite nicht; die Namensnennung kommt wie bei `mond_ev` aus dem Abschnitt Credits. Am 2026-10-29 erneut bestaetigt.

## 8. Mondphasen aus NASA SVS 5587 (A-X7)

### 8.1 Quelle und Format

- Dieselbe Bildfolge wie `mond_ev`: `frames/5760x3240_16x9_30p/plain/moon.NNNN.tif`, 8760 Stundenbilder fuer 2026, RGBA, "Celestial north is up in these images" [Q1]. Frame N entspricht Index N-1 der Tabelle `mooninfo_2026.json` [Q3] (`data/roh/LIESMICH.md`).
- Die benannten Phasenbilder auf der Seite (z. B. `phase_full.1571.tif`, 3240 x 3240 px) liegen im Verzeichnis `a005048`, gehoeren also zur Visualisierung **SVS 5048** (anderes Jahr), nicht zu 5587 [Q1][Q4]. Ihre Nummern passen nicht zu den Phasen der Tabelle 2026 (geprueft: Frame 1571 von 2026 hat 84,6 %, nicht Vollmond). **Nicht verwenden**, sonst stimmen Herkunft und Ephemeride nicht.
- Scheinbarer Durchmesser: Die Seite sagt nicht ausdruecklich, ob der Bildmassstab konstant ist, nur dass der Mond "looks largest at perigee" und die Tabelle den Durchmesser je Stunde nennt [Q1]. Annahme: konstanter Massstab 0,643"/px (aus `mond_ev`: 1774,4" auf 2758 px). Daraus die Scheibenpixel unten (ber.); nach dem Laden mit dem Alphakanal nachmessen, wie bei `mond_ev`.
- Alle drei Zeitpunkte liegen im selben Mondumlauf wie `mond_ev` (Neumond 11.09.2026 etwa 04:00 UT, `mond_ev` 19.09.2026 20:00 UT). Kolongitude wie in `data/roh/LIESMICH.md` als 90 Grad minus `subsolar.lon`.

### 8.2 Vorgeschlagene Zeitpunkte

| Zustand | Frame | Zeit (UT) | Phase | Alter | Durchmesser | Abstand | Libration (sub-Erde Laenge, Breite) | Positionswinkel Achse | Kolongitude | Phasenwinkel (ber.) | Scheibe (ber.) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| zunehmende Sichel | 6173 | 15.09.2026 04:00 | 17,29 % | 4,02 d | 1814,9" | 394 920 km | +4,66 / +6,47 Grad | 18,2 Grad | 314,3 Grad | 130,9 Grad | 2821 px |
| erstes Viertel (vorhanden, `mond_ev`) | 6285 | 19.09.2026 20:00 | 59,27 % | 8,69 d | 1774,4" | 403 935 km | -0,44 / +5,36 | 357,8 | 11,2 | 79,3 | 2758 px (gemessen) |
| Vollmond | 6449 | 26.09.2026 16:00 | 99,94 % | 15,52 d | 1888,3" | 379 570 km | -4,93 / -3,74 | 337,8 | 94,4 | 2,8 | 2935 px |
| letztes Viertel | 6615 | 03.10.2026 14:00 | 49,85 % | 22,44 d | 1936,4" | 370 129 km | +1,63 / -4,97 | 3,5 | 178,6 | 90,2 | 3010 px |

Begruendung der Wahl:
- Sichel: Alter 4,0 d trifft "etwa 4 Tage" (A-X7); im Juli/August-Umlauf laege der Wert aehnlich, aber nur der September-Umlauf haelt Libration und Bildherkunft eng bei `mond_ev`.
- Vollmond: Stunde der groessten Phase im Umlauf (99,94 %); keine Finsternis (die partielle Mondfinsternis 2026 liegt am 28.08., dort hat die Tabelle 100,0 %; ob SVS Finsternisse rendert, steht nicht auf der Seite).
- Letztes Viertel: erste Stunde unter 50 % nach Vollmond. Das letzte Viertel hat im Umlauf die groesste Scheibe (Erdnaehe), passt aber in die 3072-px-Leinwand von `mond_kacheln.py` (3010 px plus 2 x 4 px Rand; ber.).
- Positionswinkel: Die Mondachse steht im Himmelsbild zwischen 338 und 18 Grad; das ist echt und bleibt (Himmelsnorden oben, ADR-0003).
- Phasenmagnitude nach Krisciunas und Schaefer (`objekte.md` 5.3, dort als nicht primaer belegt markiert): Sichel -8,15, Vollmond -12,66, letztes Viertel -10,12 mag (ber., ohne Oppositionseffekt). Quellweiss je Zustand mit `tools/quellweiss_eichen.py` neu eichen (A-X7: "dieselbe Aufbereitung und Eichung von Quellweiss").

### 8.3 Nachtseite und Erdlicht

`bilder.json` vermerkt fuer `mond_ev`: "Nachtseite ist im Rendering schwach aufgehellt (etwa 5 Prozent der Tagseite)"; nach `objekte.md` 5.3 traegt sie 0,6 Prozent zum Fluss bei. Bei der Sichel (83 Prozent der Scheibe dunkel) waechst dieser Anteil stark. Echtes Erdlicht hat nach Montanes-Rodriguez et al. 2007 eine Flaechenhelligkeit von +12 bis +17 mV/"^2 [Q34], die Tagseite etwa 4 bis 5 mag/"^2 (`objekte.md` 5.2), also ein Verhaeltnis von hoechstens etwa 1:600 (ber.). Die Aufhellung im Rendering ist demnach eine kuenstliche Grundbeleuchtung und um eine Groessenordnung zu hell. Vorschlag: in `mond_kacheln.py` fuer alle Phasen die Nachtseite auf Schwarz setzen (Maske ueber den Terminator aus Sonnenrichtung, oder Schwelle) und das im Feld `bearbeitung` vermerken, oder sie auf die Erdlicht-Flaechenhelligkeit skalieren (A-X8-Thema, Kann). Vor der Entscheidung den Wert an Frame 6173 messen.

### 8.4 Aufbereitung

Wie `mond_ev` mit `tools/mond_kacheln.py`: Scheibenmitte und Durchmesser aus dem Alphakanal, quadratischer Ausschnitt 3072 px, Hintergrund schwarz, Kacheln 512 px in drei Stufen, WebP Qualitaet 95, Mittelung in linearem Licht. Das Skript nimmt derzeit Frame 6285 fest an (Mitte 2877/1622); fuer die neuen Frames muessen Mitte und Durchmesser je Bild gemessen werden. Rohdateien je etwa 9 bis 15 MB TIFF (Schaetzung nach Frame 6285 mit 10,37 MB).

### 8.5 Nachtrag Umsetzung (Issue #36, 2026-10-29)

- Frames 6173, 6449, 6615 wie vorgeschlagen, Zustaende `mond_sichel`, `mond_voll`, `mond_lv`, Ordner `daten/bilder/<zustand>/`, Bildnachweise `mond_svs5587_<frame>` (Herkunft und Pruefsummen in `data/roh/LIESMICH.md`).
- Massstab (Punkt 5 unten): konstant. Durchmesser der Tabelle durch gemessenen Flaechendurchmesser des Alphakanals ergibt 0,6443 (6173, 6285), 0,6445 (6449) und 0,6446"/px (6615). Gemessen 2817, 2930 und 3004 px statt 2821, 2935 und 3010 (ber. mit 0,643); die Vorgabe 2758 px bei `mond_ev` liegt 4 px ueber ihrer Flaechenmessung und bleibt fuer Ausschnitt und Massstab; die Nachtmaske nimmt dort die gemessene Scheibe.
- Nachtseite (8.3, Punkt 6 unten): an Frame 6173 gemessen liegt die Aufhellung im Median bei linear 0,0036 (bis 0,024) gegen 0,21 im Median der Tagseite (Sonnenhoehe ueber 10 Grad), also etwa 1:60, zum Terminator hin abnehmend. Entschieden (ADR-0003 Nachtrag V2): geschwaerzt ueber die Sonnenhoehe aus der Ephemeride, beleuchtete Gipfel bleiben (physik.md 23.1). Sie trug bei der Sichel 10,4 Prozent des Flusses. Seit der Entscheidung von Herbert (2026-10-29) auch bei `mond_ev` geschwaerzt (0,55 Prozent).
- Magnituden (8.2) im Original von Krisciunas und Schaefer geprueft (physik.md 23): -8,15, -12,66, -10,12; Quellweiss 3,99, 2,29, 3,48 (objekte.md 5.3). `mond_ev` vereinheitlicht: -10,51, Quellweiss 3,60.

## 9. Vorschlag fuer den Bildnachweis (A-X4)

Format wie `daten/bilder.json`. Werte mit "(ber.)" in `bilder.md`-Konvention sind Vorschlaege; `pixel_*`, `objekt_durchmesser_px`, `datei_bytes`, `kacheln` und die Pruefsummen schreibt das Werkzeug. Bei Deep-Sky-Objekten gibt es keine Scheibe: Vorschlag, `objekt_durchmesser_px` durch das neue Feld `bogensekunden_pro_pixel` allein zu ersetzen (Massstab direkt), Entscheidung in Phase 3.

```json
[
  {
    "id": "m31_noirlab_lgs",
    "objekt": "m31",
    "zustand": "m31",
    "datei": "m31/lgs_v.webp",
    "quelle_url": "https://noirlab.edu/public/images/noao-m31lgs_ubvIha/",
    "mission": "KPNO Mayall 4 m, Local Group Survey",
    "instrument": "Mosaic I, Filter U, B, V, I, H-alpha (zehn Felder)",
    "aufnahmedatum": "2000/2001",
    "lizenz": "CC-BY-4.0",
    "lizenz_url": "https://noirlab.edu/public/copyright/",
    "namensnennung": "Local Group Survey Team and T.A. Rector (University of Alaska Anchorage); bearbeitet: gedreht (Norden oben), Graustufe, skaliert, Hintergrund geschwaerzt",
    "original_pixel": "10000x2521 (Publication TIFF 10K, ber.)",
    "bogensekunden_pro_pixel": 4.0,
    "norden_oben": true,
    "bearbeitung": "Um 127 Grad gegen den Uhrzeigersinn gedreht (Bildseite: 127 Grad im Uhrzeigersinn gegen Norden oben; Richtung an Sternen pruefen), Graustufe aus dem Kanal mit V-Anteil, in linearem Licht auf 4\"/px verkleinert.",
    "hinweise": "Pressebild nichtlinear gestreckt; H-alpha hervorgehoben. Linearer Ersatz: LGGS-V-Mosaike (Lowell), Lizenz offen (bilder-v2.md 2)."
  },
  {
    "id": "m42_eso1103a",
    "objekt": "m42",
    "zustand": "m42",
    "datei": "m42/eso1103a_v.webp",
    "quelle_url": "https://www.eso.org/public/images/eso1103a/",
    "mission": "MPG/ESO 2,2 m, La Silla",
    "instrument": "WFI, Filter U, B, V, R, H-alpha; verwendet V",
    "aufnahmedatum": "aus Archivdaten (Da Rio et al. 2009), Veroeffentlichung 2011-01-19",
    "lizenz": "CC-BY-4.0",
    "lizenz_url": "https://www.eso.org/public/outreach/copyright/",
    "namensnennung": "ESO/Igor Chekalin; bearbeitet: Graustufe (V-Kanal), skaliert, linearisiert",
    "original_pixel": "8948x8597",
    "bogensekunden_pro_pixel": 1.0,
    "norden_oben": true,
    "bearbeitung": "Gruenkanal (V, 539 nm) als Graustufe, in linearem Licht von 0,238 auf 1,0\"/px verkleinert.",
    "hinweise": "Bei Verwendung der Archivrohdaten statt des Pressebilds: Credit 'Based on observations collected at the European Southern Observatory under ESO programme <ID>', Lizenz CC BY 4.0 (ESO Data Access Policy)."
  },
  {
    "id": "m13_noirlab_kpno4m",
    "objekt": "m13",
    "zustand": "m13",
    "datei": "m13/kpno4m_v.webp",
    "quelle_url": "https://noirlab.edu/public/images/noao-m13kpno4m/",
    "mission": "KPNO Mayall 4 m",
    "instrument": "Mosaic I, Filter B, V, I; verwendet V",
    "aufnahmedatum": "unbekannt, Veroeffentlichung 2020-06-30",
    "lizenz": "CC-BY-4.0",
    "lizenz_url": "https://noirlab.edu/public/copyright/",
    "namensnennung": "T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA); bearbeitet: gedreht (Norden oben), Graustufe, skaliert",
    "original_pixel": "4929x4928",
    "bogensekunden_pro_pixel": 0.5,
    "norden_oben": true,
    "bearbeitung": "Um 90 Grad im Uhrzeigersinn gedreht (Bildseite: North is left, East is down; Richtung pruefen), Gruenkanal (V) als Graustufe, auf 0,5\"/px verkleinert.",
    "hinweise": "Kern laut Bildseite mit kurzen Belichtungen nicht ueberbelichtet (A-Z10); Anteil gesaettigter Pixel im inneren 1' pruefen. Echte Aufloesung Seeing-begrenzt, A-X5 nicht erfuellt."
  },
  {
    "id": "m57_hst_20110919",
    "objekt": "m57",
    "zustand": "m57",
    "datei": "m57/hst_2011-09-19.webp",
    "quelle_url": "https://esahubble.org/images/heic1310a/",
    "mission": "Hubble Space Telescope",
    "instrument": "WFC3/UVIS, Schmalband F469N, F487N, F502N, F645N, F656N, F658N, F673N",
    "aufnahmedatum": "2011-09-19",
    "lizenz": "CC-BY-4.0 (ESA/Hubble) / Public Domain (NASA)",
    "lizenz_url": "https://esahubble.org/copyright/",
    "namensnennung": "NASA, ESA, and C. Robert O'Dell (Vanderbilt University); bearbeitet: gedreht (Norden oben), Graustufe, skaliert",
    "original_pixel": "3179x3179",
    "bogensekunden_pro_pixel": 0.1,
    "norden_oben": true,
    "bearbeitung": "Um 11,7 Grad gedreht (Bildseite: North is 11.7 deg left of vertical), Graustufe aus dem OIII-nahen Kanal, auf 0,1\"/px verkleinert.",
    "hinweise": "Besser: lineares F502N-Bild aus MAST (GO 12309, O'Dell et al. 2013, AJ 145, 92), gemeinfrei."
  },
  {
    "id": "mond_svs5587_6173",
    "objekt": "mond",
    "zustand": "mond_sichel",
    "datei": "mond_sichel/",
    "quelle_url": "https://svs.gsfc.nasa.gov/5587",
    "quelle_datei": "frames/5760x3240_16x9_30p/plain/moon.6173.tif",
    "mission": "LRO / NASA SVS",
    "instrument": "Rendering aus LOLA-Hoehenmodell und LROC-WAC-Farbmosaik, Ephemeride JPL DE421",
    "aufnahmedatum": "2026-09-15T04:00:00Z",
    "lizenz": "Public Domain (NASA)",
    "lizenz_url": "https://svs.gsfc.nasa.gov/help/",
    "namensnennung": "NASA Scientific Visualization Studio. Visualizer: Ernie Wright (USRA). Planetary scientist: Noah Petro (NASA/GSFC). Producer: James Tralie (eMITS).",
    "original_pixel": "5760x3240",
    "winkelgroesse_arcsec": 1814.9,
    "bogensekunden_pro_pixel": 0.643,
    "norden_oben": true,
    "sub_erde_breite_grad": 6.47,
    "sub_erde_laenge_grad": 4.66,
    "phase": 0.173,
    "kolongitude_grad": 314.3,
    "positionswinkel_achse_grad": 18.2,
    "bearbeitung": "wie mond_svs5587_6285 (tools/mond_kacheln.py); Nachtseite nach Entscheidung bilder-v2.md 8.3",
    "hinweise": "Scheibe erwartet 2821 px (ber. bei konstantem SVS-Massstab), nachmessen."
  },
  {
    "id": "mond_svs5587_6449",
    "zustand": "mond_voll",
    "quelle_datei": "frames/5760x3240_16x9_30p/plain/moon.6449.tif",
    "aufnahmedatum": "2026-09-26T16:00:00Z",
    "winkelgroesse_arcsec": 1888.3,
    "sub_erde_breite_grad": -3.74,
    "sub_erde_laenge_grad": -4.93,
    "phase": 0.9994,
    "kolongitude_grad": 94.4,
    "positionswinkel_achse_grad": 337.8,
    "hinweise": "Uebrige Felder wie mond_svs5587_6173; Scheibe erwartet 2935 px (ber.)."
  },
  {
    "id": "mond_svs5587_6615",
    "zustand": "mond_lv",
    "quelle_datei": "frames/5760x3240_16x9_30p/plain/moon.6615.tif",
    "aufnahmedatum": "2026-10-03T14:00:00Z",
    "winkelgroesse_arcsec": 1936.4,
    "sub_erde_breite_grad": -4.97,
    "sub_erde_laenge_grad": 1.63,
    "phase": 0.4985,
    "kolongitude_grad": 178.6,
    "positionswinkel_achse_grad": 3.5,
    "hinweise": "Uebrige Felder wie mond_svs5587_6173; Scheibe erwartet 3010 px (ber.), passt in 3072 px."
  }
]
```

Die beiden letzten Mondeintraege sind verkuerzt; im Repo traegt jeder Eintrag alle Pflichtfelder.

## 10. Testfaelle (Vorschlag fuer A-Q5)

| Nr (Vorschlag) | Konfiguration | Erwartung | Quelle |
|---|---|---|---|
| T-Mond-Sichel | Mond, zunehmende Sichel 4 d, blosses Auge und 10x50, Daemmerung bzw. Bortle 5 | Sichel mit Mare Crisium am Rand; die Nachtseite bleibt dunkel. Am Himmel ist das aschgraue Erdlicht bei duenner Sichel mit blossem Auge sichtbar (+12 mV/"^2 bei kleiner Phase [Q34]); astobsim simuliert es nicht, der Hilfetext nennt das. Pruefgroesse: Nachtseite im Anzeigebild nicht heller als der Himmelshintergrund plus ein Kodewert. | [Q34], bilder-v2.md 8.3 |
| T-M13-Kern | M13, 200 mm, 150-fach, Seeing 2", Bortle 4 | Haufen bis nahe zur Mitte in Einzelsterne aufgeloest, Kern als heller, koerniger Fleck, nicht als weisse Flaeche. Prueft zugleich, dass das Quellbild im Kern nicht gesaettigt ist. | Bildseite [Q25]; Beobachtungsliteratur fuer die Erwartung liefert deep-sky.md |

## Empfehlung fuer astobsim

| Objekt, Zustand | Empfohlenes Bild | Lizenz | "/px Quelle / Ziel | Linear verfuegbar | Aufwand |
|---|---|---|---|---|---|
| M31 | NOIRLab noao-m31lgs_ubvIha (10K-TIFF) | CC BY 4.0 | 1,31 / 4 | LGGS-V-FITS, Lizenz erfragen | mittel: drehen, Graukanal waehlen, Randabfall |
| M42 | ESO eso1103a | CC BY 4.0 | 0,238 / 1 (oder 0,5 mit Kacheln) | ja, ESO-Archiv WFI V, CC BY 4.0 | mittel; mit Rohdaten hoch (Stapeln, Kalibration) |
| M13 | NOIRLab noao-m13kpno4m | CC BY 4.0 | 0,262 / 0,5 | nicht geprueft (NOIRLab-Archiv) | gering bis mittel; Kernsaettigung pruefen |
| M57 | ESA/Hubble heic1310a, besser F502N aus MAST | CC BY 4.0 / gemeinfrei | 0,040 / 0,1 | ja, MAST GO 12309, kalibriert | gering (Pressebild) bis mittel (FITS) |
| M45 | kein Bild (Katalogsterne) | - | - | - | - |
| Mond Sichel | SVS 5587 Frame 6173 | gemeinfrei | 0,643 | - | gering (Skript verallgemeinern) |
| Mond voll | SVS 5587 Frame 6449 | gemeinfrei | 0,643 | - | gering |
| Mond letztes Viertel | SVS 5587 Frame 6615 | gemeinfrei | 0,643 | - | gering |

Antwort auf offene Frage 7 (Bildteil): Fuer alle vier Objekte gibt es freie Quellbilder; M13 ohne ausgebrannten Kern ist gefunden. Antwort auf offene Frage 8: Ja, alle drei Phasen aus derselben SVS-Bildfolge, im selben Umlauf wie der vorhandene Zustand.

## Unsicher oder zu pruefen (fuer Herbert)

1. **Linearitaet und Quellweiss:** Alle Pressebilder sind gestreckt. Entscheidung: lineare FITS aufbereiten (Aufwand, neues Werkzeug mit FITS-Leser; numpy kann FITS ohne Zusatzpaket lesen, aber das ist Handarbeit) oder Pressebild per Tonkurve gegen ein Profil aus `deep-sky.md` linearisieren. Gehoert zu ADR-0004.
2. **M31-Daten:** LGGS-FITS ohne Lizenzangabe; Rueckfrage bei Phil Massey bzw. NOIRLab, ob Weitergabe bearbeiteter Bilder unter CC BY 4.0 erlaubt ist. Sonst bleibt das gestreckte Panorama.
3. **M13-Kern:** Aussage "not over exposed" stammt von der Bildseite; erst an der Datei pruefen. Echte Aufloesung Seeing-begrenzt (Seeing nicht angegeben); Wahl (a) bis (c) aus Abschnitt 4.
4. **M42-Kern in eso1103a:** Saettigung der Huygens-Region nicht belegt; Pressebild ist HDR-artig. Bei Saettigung Hubble heic0601a oder kurze WFI-Einzelbelichtungen aus dem Archiv.
5. **SVS-Massstab:** konstante 0,643"/px angenommen; die Seite sagt es nicht. Nach dem Laden der Frames 6173, 6449, 6615 Scheibe messen; falls der Massstab nicht konstant ist, Kachelstufen und `bogensekunden_pro_pixel` je Phase eintragen.
6. **Nachtseite des Renderings:** fuer die Sichel zu hell gegen echtes Erdlicht (8.3). Schwarz setzen oder skalieren; aendert auch Quellweiss von `mond_ev` (0,6 Prozent, vernachlaessigbar).
7. **Graukanal aus Komposit:** Kanalzuordnung (welcher Filter in welchem RGB-Kanal) steht nur fuer eso1103a und noao-m13kpno4m eindeutig auf der Seite; bei LGS ("V cyan") und heic1310a am Bild pruefen.
8. **Massstabsfeld fuer Deep-Sky:** `objekt_durchmesser_px` passt nicht zu Flaechenobjekten; Phase 3 legt fest, ob `bogensekunden_pro_pixel` allein reicht.
9. **Dynamikumfang 8 Bit:** fuer M42 knapp; 16-Bit-PNG oder zweite Ebene in ADR-0004 klaeren.
10. **DSS ueber ESO:** eso1304c steht unter CC BY 4.0, die Platten selbst sind geschuetzt; nicht noetig, aber falls ein Grossfeld fuer das Fernglas gewuenscht ist, vorher klaeren.
11. **Programmnummern** GO 10775 (ACS GC Treasury, M13) und die WFI-Programmnummer fuer M42 nicht auf Datensatzebene geprueft; GO 12309 (M57) und GO 10246 (Orion) sind belegt [Q22][Q30].

## Quellen

1. [Q1] NASA SVS 5587 Moon Phase and Libration 2026: https://svs.gsfc.nasa.gov/5587 (Seiten-API: https://svs.gsfc.nasa.gov/api/5587)
2. [Q2] NASA SVS Help/FAQ (Public Domain): https://svs.gsfc.nasa.gov/help/
3. [Q3] SVS-Stundentabelle 2026: http://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json (lokal `data/roh/mooninfo_2026.json`)
4. [Q4] Benannte Phasenbilder im Verzeichnis von SVS 5048: http://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/ (z. B. phase_full.1571.tif)
5. [Q5] NASA Media Usage Guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
6. [Q6] ESA/Hubble Copyright (CC BY 4.0): https://esahubble.org/copyright/
7. [Q7] ESO Usage of images, videos, music and web texts: https://www.eso.org/public/outreach/copyright/
8. [Q8] NOIRLab Usage of images, videos and web texts: https://noirlab.edu/public/copyright/
9. [Q9] ESO Data Access Policy (Science Archive, CC BY 4.0): https://archive.eso.org/cms/eso-data-access-policy.html
10. [Q10] MAST Data Use Policy: https://archive.stsci.edu/data_use.html
11. [Q11] STScI DSS Copyright: https://archive.stsci.edu/dss/copyright.html
12. [Q12] SDSS Image Use Policy: https://www.sdss.org/collaboration/image-use-policy/
13. [Q13] NOIRLab noao-m31 The Andromeda Galaxy: https://noirlab.edu/public/images/noao-m31/
14. [Q14] NOIRLab noao-m31lgs_ubvIha Panorama of Spiral Galaxy, M31: https://noirlab.edu/public/images/noao-m31lgs_ubvIha/
15. [Q15] Local Group Survey (Massey, Lowell), Datenfreigabe: http://www2.lowell.edu/users/massey/lgsurvey.html
16. [Q16] Massey et al. 2006, AJ 131, 2478, A Survey of Local Group Galaxies Currently Forming Stars I: https://arxiv.org/abs/astro-ph/0602128
17. [Q17] Commons, Andromeda Galaxy 560mm FL.jpg (CC BY-SA 4.0): https://commons.wikimedia.org/wiki/File:Andromeda_Galaxy_560mm_FL.jpg
18. [Q18] Commons, Andromeda Galaxy (with h-alpha).jpg (CC BY 2.0): https://commons.wikimedia.org/wiki/File:Andromeda_Galaxy_(with_h-alpha).jpg
19. [Q19] ESA/Hubble opo1204c Ground-based image of Andromeda Galaxy: https://esahubble.org/images/opo1204c/
20. [Q20] ESO eso1103a The Orion Nebula: https://www.eso.org/public/images/eso1103a/ ; Pressemitteilung: https://www.eso.org/public/news/eso1103/
21. [Q21] ESA/Hubble heic0601a Hubble's sharpest view of the Orion Nebula: https://esahubble.org/images/heic0601a/
22. [Q22] MAST HLSP Orion Treasury (GO 10246): https://archive.stsci.edu/prepds/orion/ ; Robberto et al. 2013: https://arxiv.org/abs/1304.4866
23. [Q23] NOIRLab noao-m42steinberg M42: The Orion Nebula Wide: https://noirlab.edu/public/images/noao-m42steinberg/
24. [Q24] ESO eso1304c Wide-field view of part of Orion in visible light: https://www.eso.org/public/images/eso1304c/
25. [Q25] NOIRLab noao-m13kpno4m M13, NGC 6205: https://noirlab.edu/public/images/noao-m13kpno4m/
26. [Q26] ESA/Hubble potw1011a The crowded heart of the Hercules globular cluster: https://esahubble.org/images/potw1011a/
27. [Q27] ESA/Hubble opo0840a Hubble image of globular cluster M13: https://esahubble.org/images/opo0840a/ ; Ausschnitt: https://esahubble.org/images/opo0840d/
28. [Q28] NOIRLab noao0103a M13 (Burrell Schmidt): https://noirlab.edu/public/images/noao0103a/ ; noao-m13bash2: https://noirlab.edu/public/images/noao-m13bash2/
29. [Q29] ESA/Hubble heic1310a Hubble image of the Ring Nebula: https://esahubble.org/images/heic1310a/
30. [Q30] O'Dell, Ferland, Henney, Peimbert 2013, Studies of NGC 6720 with Calibrated HST WFC3 Emission-Line Filter Images I, AJ 145, 92 (GO 12309): https://arxiv.org/abs/1301.6636
31. [Q31] NOIRLab noao-ring Ring Nebula (WIYN, Tip-Tilt): https://noirlab.edu/public/images/noao-ring/
32. [Q32] NOIRLab noao-m57largeblock M57 (Ring Nebula): https://noirlab.edu/public/images/noao-m57largeblock/
33. [Q33] ESA/Hubble opo9901a Ring Nebula 1998: https://esahubble.org/images/opo9901a/
34. [Q34] Montanes-Rodriguez, Palle, Goode 2007, Measurements of the Surface Brightness of the Earthshine with Applications to Calibrate Lunar Flashes, AJ 134, 1145: https://bbso.njit.edu/pub/staff/pgoode/website/publications/Montanes_etal_2007_AJ.pdf
35. [Q36] NOIRLab Astro Data Archive, Uebersicht (ohne Lizenzangabe): https://astroarchive.noirlab.edu/about
36. [Q37] CIE 1951 skotopische Hellempfindlichkeit V'(lambda), Maximum 507 nm (Lehrbuchwert, Tabellen bei CVRL, nicht eigens abgerufen): http://www.cvrl.org/
