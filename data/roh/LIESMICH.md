# Rohbilder (nicht versioniert)

Nur diese Datei liegt im Repo (`.gitignore`: `data/roh/*`, `!data/roh/LIESMICH.md`). Die Rohbilder selbst liegen lokal; aus ihnen erzeugen die Skripte unter `tools/` die Bilder unter `daten/` (ADR-0003).

- `svs5587_moon.6285.tif`: NASA SVS 5587 "Moon Phase and Libration 2026", Frame 6285 (19.09.2026 20:00 UT), 5760x3240 RGBA, Public Domain. https://svs.gsfc.nasa.gov/5587 , Datei `frames/5760x3240_16x9_30p/plain/moon.6285.tif`.
  Phase 59,3 %, Kolongitude 11,2 Grad, Durchmesser 1774,4", Positionswinkel der Achse 357,8 Grad, Scheibe 2758 px (Mitte Pixel 2877/1622), also 0,643"/px. Himmelsnorden oben (SVS: "Celestial north is up in these images").
  Abgerufen 2026-10-23, 10370890 Byte, SHA-256 `d0d586f67118288e2e9552fb45a26f07d4fb45697ad05b0a7cfc02a5cb42f99d`.
  Verarbeitet durch `tools/mond_kacheln.py` nach `daten/bilder/mond/`, Bildnachweis `mond_svs5587_6285` in `daten/bilder.json`.
- `mond_svs6285_2800.png`: quadratischer Ausschnitt 2800x2800 um die Scheibenmitte (Pixel 2877, 1622); lokale Hilfsdatei des Prototyps (Branch `prototyp-faltung`), wird von `tools/` nicht gebraucht.
- `mond_svs6285_1400.png`: dasselbe, halbiert (1,29"/px); ebenfalls nur fuer den Prototyp.
- `mooninfo_2026.json`: Stundentabelle des SVS (Phase, Kolongitude ueber `90 - subsolar.lon`, Durchmesser, Positionswinkel). Liste mit 8760 Eintraegen, Index 0 = 01.01.2026 00:00 UT; Frame N der Animation entspricht Index N-1.
- `hubble_mars_2003-08-26.tif`: Hubble WFPC2, Mars am 26.08.2003, 11 h vor der groessten Annaeherung (Zustand mars_25). Abgerufen 2026-10-26 von https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2003/08/STScI-01EVT923FVB2K9794Z9T30P5MJ.tif (Seite https://science.nasa.gov/asset/hubble/hubbles-close-encounter-with-mars-august-26-2003), 800x800 RGB, 8 Bit, unkomprimiert, ohne Farbprofil, 1927708 Byte, SHA-256 `b3fc9b4e5ef87607689539d552cd8d714e67993c7c4eda6573c93d1cc8111b27`.
  Die ESA-Kopie https://esahubble.org/media/archives/images/original/opo0322a.tif (612000 Byte, SHA-256 `ca1cf115d8673df1e69f6f1b6a51eedc86d6eba576b4425e87c757ed13bfe89c`, LZW) hat dieselben Pixel; nicht abgelegt.
  Scheibe gemessen (Halbwertskante): Mitte Pixel 398,8/400,0, Aequatordurchmesser 696,3 px (25,12", 0,0361"/px). Verarbeitet durch `tools/bild_aufbereiten.py` mit `tools/parameter/mars_hst_20030826.json`.
- `heic1609a.tif`: ESA/Hubble heic1609a, WFC3/UVIS, Mars am 12.05.2016 (Zustaende mars_14 und mars_6). Abgerufen 2026-10-26 von https://esahubble.org/media/archives/images/original/heic1609a.tif (Seite https://esahubble.org/images/heic1609a/), 2000x2000 RGB, 8 Bit, LZW, Farbprofil Adobe RGB (1998), 1552612 Byte, SHA-256 `20f0271cec5fa5785dfa4794bb2c98b9bbd7663fdc73be8df47d93967c9582a7`.
  Die NASA-Kopie https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2016/05/STScI-01EVVGXC44WYNCE97WGCC9XGKQ.tif (1535604 Byte, SHA-256 `374aaa25dd37e021d2e5534fcf3992dce9ca2e2f9f100085fd3572a8c5d14ffe`) hat dieselben Pixel; nicht abgelegt.
  Scheibe gemessen (Halbwertskante): Mitte Pixel 998,0/979,25, Aequatordurchmesser 1374,4 px (17,51", 0,0127"/px). Verarbeitet durch `tools/bild_aufbereiten.py` mit `tools/parameter/mars_hst_20160512.json`.
