#!/usr/bin/env python3
"""Bildnachweis pruefen: daten/bilder.json gegen die Dateien unter daten/bilder/ (Issue #12).

Prueft, ohne etwas zu schreiben (A-X3, A-X4, A-X6, ADR-0003):
    - Pflichtfelder je Eintrag (wie FELDER_EINTRAG und pruefeEintrag in
      src/daten/bildnachweise.ts), keine unbekannten Felder, ids eindeutig,
      norden_oben true, URLs mit http(s)://, kennlinie (Deep-Sky) mit art log,
      mag_hell und mag_dunkel > mag_hell,
    - Massstab: bogensekunden_pro_pixel passt auf 1 Prozent zu
      winkelgroesse_arcsec / objekt_durchmesser_px,
    - Einzelbild (ohne kacheln): Datei vorhanden, Masse laut Datei gleich
      pixel_breite x pixel_hoehe, Dateigroesse gleich datei_bytes,
    - Kachelpyramide: jede Kachel jeder Stufe vorhanden, Masse wie erwartet
      (Randkacheln kleiner), Summe gleich kacheln.gesamt_bytes,
    - jede Datei unter daten/bilder/ gehoert zu einem Eintrag; Dateien und
      Ordner, deren Name mit einem Punkt beginnt, werden uebergangen (wie
      import.meta.glob im Nachbau),
    - je Objekt hoechstens 20 MB (20 000 000 Byte).
Exit-Code 0, wenn alles stimmt, sonst 1 mit einer Zeile je Fehler.

Verwendung (aus dem Repo-Root, nur Pillow noetig):
    python3 tools/bildnachweis_pruefen.py [daten/bilder.json] [--bilder daten/bilder]

Die CI ruft stattdessen den Nachbau src/daten/bilddateien.test.ts auf (Teil
von npm test), damit sie kein Python braucht. Beide pruefen dasselbe.
"""

import argparse
import json
import os
import sys

from PIL import Image

GRENZE_BYTES_JE_OBJEKT = 20_000_000
TOLERANZ_MASSSTAB = 0.01
PFLICHT = [
    "id", "objekt", "zustand", "datei", "quelle_url", "mission", "instrument", "aufnahmedatum", "lizenz",
    "lizenz_url", "namensnennung", "pixel_breite", "pixel_hoehe", "original_pixel", "winkelgroesse_arcsec",
    "objekt_durchmesser_px", "bogensekunden_pro_pixel", "norden_oben", "bearbeitung",
]
ERLAUBT = set(PFLICHT) | {
    "quelle_datei", "ringe_arcsec", "sub_erde_breite_grad", "sub_erde_laenge_grad", "phase", "kolongitude_grad",
    "positionswinkel_achse_grad", "datei_bytes", "hinweise", "kacheln", "kennlinie",
}


def pruefe(bildnachweis, bilder):
    fehler = []
    with open(bildnachweis, encoding="utf-8") as f:
        liste = json.load(f)
    if not isinstance(liste, list):
        return [f"{bildnachweis}: Liste erwartet"]
    erwartet = set()
    ids = set()
    bytes_je_objekt = {}
    for index, e in enumerate(liste):
        id_ = e.get("id", f"Index {index}")
        ort = f"{bildnachweis}, {id_}"
        if id_ in ids:
            fehler.append(f"{ort}: id doppelt vergeben")
        ids.add(id_)
        for feld in PFLICHT:
            wert = e.get(feld)
            if wert is None or (isinstance(wert, str) and not wert.strip()):
                fehler.append(f"{ort}: Pflichtfeld {feld} fehlt oder ist leer")
        for feld in e:
            if feld not in ERLAUBT:
                fehler.append(f"{ort}: unbekanntes Feld {feld}")
        if any(e.get(f) is None for f in ("datei", "pixel_breite", "pixel_hoehe", "winkelgroesse_arcsec",
                                          "objekt_durchmesser_px", "bogensekunden_pro_pixel")):
            continue
        kennlinie = e.get("kennlinie")
        if kennlinie is not None:
            # Deep-Sky: log-Kennlinie (ADR-0003 Nachtrag V2, src/daten/bildnachweise.ts pruefeKennlinie).
            if set(kennlinie) != {"art", "mag_hell", "mag_dunkel"} or kennlinie.get("art") != "log":
                fehler.append(f"{ort}: kennlinie braucht genau art = log, mag_hell, mag_dunkel")
            elif not kennlinie["mag_dunkel"] > kennlinie["mag_hell"]:
                fehler.append(f"{ort}: kennlinie.mag_dunkel muss groesser als mag_hell sein")
        if e.get("norden_oben") is not True:
            fehler.append(f"{ort}: norden_oben muss true sein")
        for feld in ("quelle_url", "lizenz_url"):
            if not str(e.get(feld, "")).startswith(("http://", "https://")):
                fehler.append(f"{ort}: {feld} ohne http(s)://")
        abgeleitet = e["winkelgroesse_arcsec"] / e["objekt_durchmesser_px"]
        if abs(e["bogensekunden_pro_pixel"] / abgeleitet - 1) > TOLERANZ_MASSSTAB:
            fehler.append(f"{ort}: bogensekunden_pro_pixel passt nicht zu {abgeleitet:.5f}")
        datei = e["datei"]
        summe = 0
        kacheln = e.get("kacheln")
        if kacheln is None:
            pfad = os.path.join(bilder, datei)
            erwartet.add(os.path.normpath(pfad))
            if not os.path.isfile(pfad):
                fehler.append(f"{ort}: Datei {pfad} fehlt")
                continue
            with Image.open(pfad) as im:
                if im.size != (e["pixel_breite"], e["pixel_hoehe"]):
                    fehler.append(f"{ort}: {pfad} hat {im.size[0]}x{im.size[1]}, eingetragen "
                                  f"{e['pixel_breite']}x{e['pixel_hoehe']}")
            summe = os.path.getsize(pfad)
            if e.get("datei_bytes") != summe:
                fehler.append(f"{ort}: datei_bytes {e.get('datei_bytes')}, Datei hat {summe} Byte")
        else:
            k = kacheln["kachel_px"]
            for s in kacheln["stufen"]:
                for y in range(s["kacheln_y"]):
                    for x in range(s["kacheln_x"]):
                        rel = kacheln["muster"].replace("{stufe}", str(s["stufe"])).replace("{x}", str(x)) \
                            .replace("{y}", str(y))
                        pfad = os.path.join(bilder, datei, rel)
                        erwartet.add(os.path.normpath(pfad))
                        if not os.path.isfile(pfad):
                            fehler.append(f"{ort}: Kachel {pfad} fehlt")
                            continue
                        soll = (min(k, s["breite_px"] - x * k), min(k, s["hoehe_px"] - y * k))
                        with Image.open(pfad) as im:
                            if im.size != soll:
                                fehler.append(f"{ort}: {pfad} hat {im.size}, erwartet {soll}")
                        summe += os.path.getsize(pfad)
            if summe != kacheln["gesamt_bytes"]:
                fehler.append(f"{ort}: kacheln.gesamt_bytes {kacheln['gesamt_bytes']}, Kacheln haben {summe} Byte")
            if kacheln["stufen"][0]["breite_px"] != e["pixel_breite"]:
                fehler.append(f"{ort}: Stufe 0 hat nicht pixel_breite")
        objekt = e.get("objekt")
        bytes_je_objekt[objekt] = bytes_je_objekt.get(objekt, 0) + summe
    for objekt, summe in sorted(bytes_je_objekt.items()):
        print(f"Objekt {objekt}: {summe} Byte ({summe / 1e6:.2f} MB)")
        if summe > GRENZE_BYTES_JE_OBJEKT:
            fehler.append(f"Objekt {objekt}: {summe} Byte, mehr als 20 MB (A-X6)")
    for wurzel, ordner, namen in os.walk(bilder):
        ordner[:] = [o for o in ordner if not o.startswith(".")]
        for name in namen:
            if name.startswith("."):
                continue
            pfad = os.path.normpath(os.path.join(wurzel, name))
            if pfad not in erwartet:
                fehler.append(f"{pfad}: kein Eintrag in {bildnachweis} (A-X3)")
    return fehler


def main(argv=None):
    a = argparse.ArgumentParser(description="daten/bilder.json gegen daten/bilder/ pruefen")
    a.add_argument("bildnachweis", nargs="?", default=os.path.join("daten", "bilder.json"))
    a.add_argument("--bilder", default=os.path.join("daten", "bilder"), help="Wurzel der Bilddateien")
    args = a.parse_args(argv)
    fehler = pruefe(args.bildnachweis, args.bilder)
    for f in fehler:
        print(f"FEHLER {f}", file=sys.stderr)
    print("Bildnachweis in Ordnung" if not fehler else f"{len(fehler)} Fehler")
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
