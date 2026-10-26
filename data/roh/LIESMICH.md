# Rohbilder (nicht versioniert)

Nur diese Datei liegt im Repo (`.gitignore`: `data/roh/*`, `!data/roh/LIESMICH.md`). Die Rohbilder selbst liegen lokal; aus ihnen erzeugen die Skripte unter `tools/` die Bilder unter `daten/` (ADR-0003).

- `svs5587_moon.6285.tif`: NASA SVS 5587 "Moon Phase and Libration 2026", Frame 6285 (19.09.2026 20:00 UT), 5760x3240 RGBA, Public Domain. https://svs.gsfc.nasa.gov/5587 , Datei `frames/5760x3240_16x9_30p/plain/moon.6285.tif`.
  Phase 59,3 %, Kolongitude 11,2 Grad, Durchmesser 1774,4", Positionswinkel der Achse 357,8 Grad, Scheibe 2758 px (Mitte Pixel 2877/1622), also 0,643"/px. Himmelsnorden oben (SVS: "Celestial north is up in these images").
  Abgerufen 2026-10-23, 10370890 Byte, SHA-256 `d0d586f67118288e2e9552fb45a26f07d4fb45697ad05b0a7cfc02a5cb42f99d`.
  Verarbeitet durch `tools/mond_kacheln.py` nach `daten/bilder/mond/`, Bildnachweis `mond_svs5587_6285` in `daten/bilder.json`.
- `mond_svs6285_2800.png`: quadratischer Ausschnitt 2800x2800 um die Scheibenmitte (Pixel 2877, 1622), fuer den Prototyp.
- `mond_svs6285_1400.png`: dasselbe, halbiert (1,29"/px).
- `mooninfo_2026.json`: Stundentabelle des SVS (Phase, Kolongitude ueber `90 - subsolar.lon`, Durchmesser, Positionswinkel). Liste mit 8760 Eintraegen, Index 0 = 01.01.2026 00:00 UT; Frame N der Animation entspricht Index N-1.
