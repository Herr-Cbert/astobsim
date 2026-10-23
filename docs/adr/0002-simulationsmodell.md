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
