---
status: accepted
datum: 2026-10-23
---

# Simulationsmodell: Faltung des Quellbilds mit der Gesamt-PSF im Arbeitsmassstab, Helligkeit multiplikativ

Der Anblick entsteht, indem das Quellbild eines Zustands mit der Gesamt-PSF gefaltet wird, die Beugung, Seeing und Auge als Langzeit-Mittel zusammenfasst (A-P2, A-P5), und anschliessend Helligkeit und Hintergrund multiplikativ angepasst werden (A-P4, A-B2). Gefaltet wird nicht im Massstab des Quellbilds, sondern im Arbeitsmassstab, in dem die Gesamt-PSF nur wenige Pixel breit ist. Die Faltung laeuft als direkte Faltung mit kleinem Kern in einem WebGL2-Fragment-Shader; eine JavaScript-Faltung mit identischem Ergebnis dient Tests und als Fallback. Die Formeln und Konstanten stehen in `docs/recherche/physik.md`, Abschnitt 9; sie sind hier nicht wiederholt.

## Das Modell im Einzelnen

- **Gesamt-PSF** = Airy(D, Obstruktion) gefaltet mit Moffat(Seeing-FWHM, beta 4,765) gefaltet mit Gauss(60"/V). Die Seeing-FWHM wird mit Luftmasse hoch 0,6 von der Zenit-Eingabe (A-B1) auf die Hoehe (A-B4) skaliert. Die Obstruktion steckt vollstaendig im Airy-Anteil (A-P3), keine Daumenregel.
- **Arbeitsmassstab** = max(Quellmassstab, Gesamt-FWHM / 2,5 px, Anzeigemassstab). Das Quellbild wird vor der Faltung flaechig auf dieses Raster gemittelt. Der Kern wird im Arbeitsmassstab aufgebaut: jede Komponente vierfach ueberabgetastet, per kleiner FFT gefaltet, auf Arbeitspixel gebinnt. Der Kern ist damit 5 bis 25 Pixel gross, unabhaengig von Quell- und Anzeigegroesse.
- **Faltung**: direkte Faltung des Arbeitsbilds mit dem Kern, Rand geklemmt. Produktion WebGL2, Tests und Fallback JavaScript. Keine FFT fuer das Bild.
- **Helligkeit**: Flaechenhelligkeit mal Transmission der Bauart, mal (1 minus Obstruktion zum Quadrat), mal Atmosphaere (Extinktion aus Transparenz und Luftmasse), mal min(1, (Austrittspupille / 6 mm) zum Quadrat). Nach oben begrenzt, keine Blendung (A-P9).
- **Hintergrund**: Flaechenhelligkeit aus der Bortle-Tabelle, im Okular um dieselben Faktoren gedaempft; in Version 1 nur ein Grauton des Gesichtsfelds (A-B2).
- **Trabanten** (A-P6): als Scheibchen mit Winkeldurchmesser ins Arbeitsbild gezeichnet, Helligkeit aus der Magnitude, mit derselben Gesamt-PSF gefaltet. Blendungsregel: unterdrueckt bei Abstand unter 10 Bogenminuten zu einem mehr als 6 Magnituden helleren Objekt.
- **Anzeige der Grenzen** (A-D4): Rayleigh, Dawes, Seeing-FWHM in der Hoehe, Augengrenze und die Quadratursumme als Gesamt-FWHM; die groesste Komponente ist die dominante Grenze. Die Quadratursumme dient nur der Anzeige und der Wahl des Arbeitsmassstabs, das Bild entsteht aus der echten Faltung.

## Warum

Der Prototyp (Branch `prototyp-faltung`, `prototyp/ERGEBNIS.md`) hat gezeigt:

- Die Faltung im Arbeitsmassstab liefert plausible Bilder fuer die Testfaelle T3, T4 und T6 und ist 10- bis 20-mal billiger als die Faltung in Quellaufloesung; der Aufwand haengt nur von der Anzeige ab, nicht von der Quelle (wichtig fuer den Mond mit 7600 px, A-X5).
- WebGL2 schafft 1024 px Anzeige in unter 0,25 s selbst mit Software-Rasterizer (SwiftShader), auf echter GPU in wenigen Millisekunden. JavaScript einfaedig braucht 0,15 bis 0,6 s bei 1024 px und 1,2 s bei 1536 px, erfuellt A-D7 also nur knapp und nur bei kleiner Anzeige.
- Eine FFT-Faltung des Bilds in JavaScript waere bei 2048 x 2048 Pixeln im Sekundenbereich und ist unnoetig, weil der Kern im Arbeitsmassstab klein bleibt.
- WebGL2- und JavaScript-Faltung stimmen auf eine 8-Bit-Stufe ueberein; die JavaScript-Variante ist damit ein belastbarer Test-Adapter.

Moffat statt Gauss fuer das Seeing, weil die Kolmogorov-Langzeit-PSF Fluegel hat, die ein Gauss unterschlaegt (physik.md 2.2). Langzeit statt Kurzzeit, weil A-P5 den typischen Anblick verlangt; der "ruhige Moment" (A-B6) kann spaeter durch Abzug der Bildbewegungsvarianz ergaenzt werden (physik.md 2.4).

## Folgen

- Die Physik ist eine Sammlung reiner Funktionen mit einer Naht zur Bildpipeline; Schnitt und Datentyp stehen in `docs/architektur.md`.
- Die Quelle des Mondbilds (NASA SVS, 0,643"/px) liegt ueber der A-X5-Messlatte von 0,25"/px. Ab etwa 200 mm Oeffnung bei sehr gutem Seeing ist der Mond quellbegrenzt. Entscheidung (Herbert, 2026-10-23): fuer Version 1 akzeptiert, der Hilfetext zum Mond nennt die Grenze. Eigenes Rendering aus LROC-WAC und LOLA wird als Kann-Punkt in Phase 4 angelegt.
- Browser ohne WebGL2: Anzeige auf 1024 px begrenzen und JavaScript-Faltung nutzen.

## Nachtrag 2026-10-26 (Kernbau, Issue #4)

- **Kerngroesse** 5 bis 81 Arbeitspixel, Radius 3 Gesamt-FWHM (Quadratur), mindestens 2. Die Airy-Ringe bis zum zweiten Minimum (2,23 lambda/D) liegen darin, nicht additiv: 3 FWHM_gesamt ist mindestens 3,09 lambda/D. Mit dem Arbeitsmassstab (FWHM hoechstens 2,5 px) ist der Kern hoechstens 17 px; bei einer FWHM unter einem Pixel wird er ein Delta mit 5 px. Ist der Massstab so fein, dass der Kern ueber 81 px braeuchte, wirft `baueKern` `PhysikFehler` statt wie der Prototyp auf 40 px Radius zu klemmen.
- **Ueberabtastung** vierfach bis 42 px Kerngroesse, darueber zweifach, damit die FFT bei hoechstens 256 Punkten bleibt und der groesste Kern unter 20 ms baut (gemessen 12 ms gegen etwa 50 ms mit 512 Punkten). Bei solchen Kernen ist die FWHM ueber 7 px breit, zwei Feinpixel je Arbeitspixel reichen.
- **Folge des Radius** fuer beugungsbegrenzte Faelle: der Kern enthaelt etwa 94 % der Airy-Energie (Fluegel fallen wie 1/r), die Kern-MTF liegt bei nu = 0,1 um 7 % ueber der Pupillen-MTF, bei nu >= 0,9 stimmt sie. Der Prototyp hatte denselben Schnitt; Pruefung am Bild in Phase 6.
- **Test der Airy-Energie**: 0,838 im Scheibchen ist auf dem abgeschnittenen, normierten Kern nicht absolut pruefbar (physik.md 1.1). Getestet werden das Verhaeltnis Scheibchen zu zweitem Minimum (0,838 / 0,910) und die Kern-MTF gegen `mtfPupille`; der Absolutwert bleibt in `energieImAiryKern`.

## Nachtrag 2026-10-27 (Abbildung der Leuchtdichte, Issue #55)

- **Entscheidung:** Der Abschnitt "Helligkeit" oben bleibt die Physik; zwischen Physik und Bildschirm liegt jetzt eine Abbildung. Objekt und Himmel werden je Ebene aus ihrer Flaechenhelligkeit im Okular $\mu$ mit einer Potenz nach Stevens auf eine Anzeigehelligkeit (linear, 1 = Bildschirmweiss) gebracht: $w = \min(1, (L/L_\mathrm{weiss})^{1/3})$, $L_\mathrm{weiss}$ = Vollmond ohne Verluste (3,35 mag/arcsec$^2$). Das Quellbild bleibt linear und wird nur mit der Anzeigehelligkeit von Quellweiss multipliziert; der Kontrast innerhalb des Quellbilds aendert sich nicht, der zwischen Objekt und Himmel schon (der Himmel wird relativ angehoben, physik.md 12.5). Stevens begruendet nur die Groessenordnung der Kompression, keine Gleichheit der Empfindung: der Betrachter komprimiert den Bildschirm selbst noch einmal. Formel, Quellen und Testwerte: `docs/recherche/physik.md`, Abschnitt 12.
- **Ort:** `src/physik/helligkeit.ts` (`okularhelligkeit` physikalisch, `anzeigefaktor` die Abbildung, `helligkeit` liefert die Naht-Stufe 3). Die Naht-Typen bleiben gleich; `Helligkeit.faktorObjekt` und `hintergrundRelativ` sind jetzt Anzeigehelligkeiten statt physikalischer Faktoren (Kommentar in `src/naht/simulationsparameter.ts`). bild (`tonwert`) und ui (`zeichne.ts`, sRGB) bleiben unveraendert. bild bekommt keine absolute Leuchtdichte ueber die Naht, deshalb liegt die Abbildung in physik.
- **Wirkung:** Startkonfiguration A-D9 Quellweiss sRGB 154 statt 52; Fernglas 10x50 227, 80 mm bei 200x 106; Himmel Bortle 1 bis 9 sichtbar als dunkles Grau (A-D9: 4 bis 16, Fernglas: 9 bis 30), fuer Mond und Mars immer mindestens 20-mal dunkler als Quellweiss (Jupiter und Saturn bei diesig und 10 Grad nur 16- bzw. 11-mal, physik.md 12.3). Streng monoton in der Austrittspupille bis 6 mm.
- **Verworfen:** linear (Stand #9, zu dunkel bei kleiner Austrittspupille); absolut bzw. fester Faktor (schneidet den Mond bis etwa 1,5 mm Austrittspupille ab); adaptionsabhaengige Operatoren nach Tumblin & Rushmeier oder Ward mit dem Niveau der Szene (Adaption des Auges, A-P9); automatische Belichtung nach Reinhard (alle Austrittspupillen gleich hell, widerspricht A-P4); Kompression je Pixel ($L/(1+L)$, $L^{1/3}$; aendert den Bildkontrast und saettigt oben); logarithmisch (willkuerliche untere Grenze).
- **Offen fuer Phase 6:** Wahl von $\mu_\mathrm{weiss}$ (`ANZEIGE_WEISS_MAG_PRO_ARCSEC2`) und des Exponenten (`KOMPRESSIONSEXPONENT`) am Bild pruefen (unbekannter Bildschirm und Umgebung), ebenso den Schleier des Himmels ueber dunklen Bildteilen (physik.md 12.5).

## Nachtrag 2026-10-27 (Blendungsregel, Issue #14)

- **Entscheidung (Herbert, 2026-10-27):** Der Abstand in der Blendungsregel (A-P6) ist der scheinbare, also Abstand am Himmel (Mitte zu Mitte) mal Vergroesserung. Ein Trabant wird unterdrueckt, wenn er scheinbar weniger als 10' von einem mehr als 6 mag helleren Objekt steht.
- **Begruendung:** Mit dem Abstand am Himmel waeren auch im 10x50 alle vier Jupitertrabanten (1,8' bis 8,7' vom Planeten) unterdrueckt, entgegen T6 ("im 10x50 ... zwei bis vier Monde"). Der scheinbare Abstand entspricht dem, was auf der Netzhaut ueberstrahlt wird, und steht so bereits in `docs/entwuerfe/naht-variante-3.md` Abschnitt 3. Mit blossem Auge (V = 1) sind alle Jupitertrabanten unterdrueckt, im 10x50 keiner.
- **Schwellen:** 10' und 6 mag sind eine Modellentscheidung ohne Quelle, Ersatz fuer die nicht simulierte Blendung (A-P9); Vorschlag aus `docs/recherche/objekte.md` Punkt 13. Grenzvergroesserungen je Trabant: `docs/recherche/physik.md` Abschnitt 13.3.
