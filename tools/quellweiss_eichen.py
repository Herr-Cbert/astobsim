#!/usr/bin/env python3
"""Quellweiss eichen: weiss_mag_arcsec2 je Zustand gegen das Quellbild pruefen (Issue #71).

Quellweiss (GLOSSARY.md) ist die Flaechenhelligkeit, die der Pixelwert 1,0 im
Quellbild eines Zustands bedeutet. Das Skript liest daten/objekte.json,
daten/bilder.json und die Bilder unter daten/bilder/ (schreibt nichts) und
rechnet je Zustand:
    - das Bild linear wie die Anwendung (sRGB-Kennlinie nach IEC 61966-2-1,
      255 = 1,0, srgbZuLinear in src/daten/kachellader.ts); als Helligkeit
      eines Pixels gilt die Leuchtdichte Y = 0,2126 R + 0,7152 G + 0,0722 B
      (IEC 61966-2-1, Weiss 1,1,1 hat Y = 1; ein graues Pixel wie die
      Trabanten aus #14 hat Y gleich seinem Kanalwert),
    - den Massstab des Zustands wie die Anwendung: winkelgroesse_arcsec des
      Zustands / objekt_durchmesser_px des Bildnachweises (einzelbildMassstab
      in src/daten/quelle_einzelbild.ts, pyramidengeometrie in
      src/daten/kacheln.ts); beim Mond die feinste Stufe 0 der Kachelpyramide,
      zusammengesetzt aus allen Kacheln,
    - den Gesamtfluss F = Summe Y * Massstab^2 in Quellweiss-Quadratbogensekunden
      (ganzes Bild: Scheibe, bei Saturn Kugel plus Ring; ausserhalb ist das Bild
      schwarz),
    - Vorschlag weiss = magnitude + 2,5 log10(F) (auf 0,01 gerundet) und die
      Probe: magnitude aus dem Bild = weiss_mag_arcsec2 - 2,5 log10(F) gegen
      magnitude des Zustands, Toleranz 0,05 mag.
Beim Mond zusaetzlich: Phasenmagnitude nach Krisciunas und Schaefer 1991,
Gl. 9 (m = -12,73 + 0,026 a + 4e-9 a^4, a = phasenwinkel_grad), und der
Quellweiss, der daraus folgen wuerde, als Plausibilitaet fuer die Magnitude
des Zustands (docs/recherche/objekte.md 5.3).

Exit-Code 0, wenn alle Zustaende die Probe bestehen, sonst 1.

Verwendung (aus dem Repo-Root, nur numpy und Pillow noetig):
    python3 tools/quellweiss_eichen.py [--objekte daten/objekte.json]
        [--bildnachweis daten/bilder.json] [--bilder daten/bilder]
"""

import argparse
import json
import math
import os
import sys

import numpy as np
from PIL import Image

TOLERANZ_MAG = 0.05
GEWICHTE_Y = np.array([0.2126, 0.7152, 0.0722])


def srgb_zu_linear(kodewert):
    """8-Bit-sRGB in lineare Helligkeit 0..1 (IEC 61966-2-1), wie srgbZuLinear in der Anwendung."""
    c = kodewert.astype(np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lade_linear(pfad):
    with Image.open(pfad) as bild:
        return srgb_zu_linear(np.asarray(bild.convert("RGB")))


def leuchtdichte(nachweis, bilder):
    """Lineare Leuchtdichte Y des ganzen Quellbilds (Einzelbild oder Stufe 0 der Kachelpyramide)."""
    kacheln = nachweis.get("kacheln")
    if kacheln is None:
        rgb = lade_linear(os.path.join(bilder, nachweis["datei"]))
        if rgb.shape[1] != nachweis["pixel_breite"] or rgb.shape[0] != nachweis["pixel_hoehe"]:
            raise ValueError(f"{nachweis['id']}: Masse {rgb.shape[1]}x{rgb.shape[0]} statt laut Nachweis")
        return rgb @ GEWICHTE_Y
    stufe = min(kacheln["stufen"], key=lambda s: s["stufe"])
    if stufe["breite_px"] != nachweis["pixel_breite"] or stufe["hoehe_px"] != nachweis["pixel_hoehe"]:
        raise ValueError(f"{nachweis['id']}: feinste Stufe hat nicht die Masse des Nachweises")
    k = kacheln["kachel_px"]
    y = np.zeros((stufe["hoehe_px"], stufe["breite_px"]))
    for ky in range(stufe["kacheln_y"]):
        for kx in range(stufe["kacheln_x"]):
            name = kacheln["muster"].format(stufe=stufe["stufe"], x=kx, y=ky)
            teil = lade_linear(os.path.join(bilder, nachweis["datei"], name)) @ GEWICHTE_Y
            y[ky * k:ky * k + teil.shape[0], kx * k:kx * k + teil.shape[1]] = teil
    return y


def mond_magnitude_ks(phasenwinkel_grad):
    """V-Magnitude des Mondes nach Krisciunas und Schaefer 1991, Gl. 9."""
    a = abs(phasenwinkel_grad)
    return -12.73 + 0.026 * a + 4e-9 * a ** 4


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--objekte", default="daten/objekte.json")
    parser.add_argument("--bildnachweis", default="daten/bilder.json")
    parser.add_argument("--bilder", default="daten/bilder")
    args = parser.parse_args()

    with open(args.objekte, encoding="utf-8") as f:
        objekte = json.load(f)
    with open(args.bildnachweis, encoding="utf-8") as f:
        nachweise = {e["id"]: e for e in json.load(f)}

    cache = {}
    fehler = 0
    print(f"{'Zustand':<9} {'Bild':<22} {'Massstab':>9} {'Fluss F':>11} {'m':>6} "
          f"{'weiss':>6} {'Vorschlag':>9} {'m Bild':>7} {'Abw.':>6}  Probe")
    for objekt in objekte:
        for z in objekt["zustaende"]:
            nachweis = nachweise[z["bild"]]
            if z["bild"] not in cache:
                cache[z["bild"]] = float(leuchtdichte(nachweis, args.bilder).sum())
            massstab = z["winkelgroesse_arcsec"] / nachweis["objekt_durchmesser_px"]
            fluss = cache[z["bild"]] * massstab ** 2
            vorschlag = round(z["magnitude"] + 2.5 * math.log10(fluss), 2)
            m_bild = z["weiss_mag_arcsec2"] - 2.5 * math.log10(fluss)
            abweichung = m_bild - z["magnitude"]
            ok = abs(abweichung) <= TOLERANZ_MAG
            fehler += 0 if ok else 1
            print(f"{z['id']:<9} {z['bild']:<22} {massstab:>9.6f} {fluss:>11.2f} {z['magnitude']:>6.2f} "
                  f"{z['weiss_mag_arcsec2']:>6.2f} {vorschlag:>9.2f} {m_bild:>7.3f} {abweichung:>+6.3f}  "
                  f"{'ok' if ok else 'FEHLER'}")
            if objekt["typ"] == "mond":
                m_ks = mond_magnitude_ks(z["phasenwinkel_grad"])
                print(f"          Plausibilitaet Mond: Krisciunas/Schaefer Gl. 9 bei {z['phasenwinkel_grad']} Grad "
                      f"m = {m_ks:.2f}, daraus weiss = {m_ks + 2.5 * math.log10(fluss):.2f}")
    if fehler:
        print(f"{fehler} Zustaende ausserhalb der Toleranz {TOLERANZ_MAG} mag", file=sys.stderr)
        return 1
    print(f"alle Zustaende innerhalb {TOLERANZ_MAG} mag")
    return 0


if __name__ == "__main__":
    sys.exit(main())
