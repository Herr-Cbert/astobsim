# tools

Python-Skripte zur Bildaufbereitung (nur numpy und Pillow, kein pip noetig). Sie laufen offline aus dem Repo-Root und sind die einzigen Erzeuger von Bildern unter `daten/` und der Eintraege in `daten/bilder.json` (ADR-0003). Rohbilder liegen in `data/roh/` (gitignored, Herkunft in `data/roh/LIESMICH.md`).

| Skript | Zweck | Aufruf |
|---|---|---|
| `mond_kacheln.py` | Mondbild (NASA SVS 5587, Frame 6285) zentrieren, Hintergrund schwaerzen, Kachelpyramide 512 px nach `daten/bilder/mond/<stufe>/<x>_<y>.webp`, Mond-Eintrag in `daten/bilder.json` | `python3 tools/mond_kacheln.py [data/roh/svs5587_moon.6285.tif] [--qualitaet 95]`; `--ziel` setzt den Zielordner der Kacheln (Standard `daten/bilder/mond`), `--bildnachweis` die Datei fuer den Bildnachweis (Standard `daten/bilder.json`), `--messen` gibt nur Fehler und Groesse fuer mehrere WebP-Qualitaeten aus und schreibt nichts |

Alle Skripte sind idempotent: ein zweiter Lauf erzeugt dieselben Dateien und ersetzt den eigenen Eintrag in `bilder.json`, andere Eintraege bleiben erhalten.
