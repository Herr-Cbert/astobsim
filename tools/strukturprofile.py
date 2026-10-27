#!/usr/bin/env python3
"""Strukturprofile messen: Helligkeitsstufen fuer die Tabellen-Tests der Validierung (Issue #21).

Die Tabellen-Tests in src/physik/validierung.test.ts falten eindimensionale
Stufenprofile mit dem Kern (profilDelle). Wo die Literatur keine Helligkeiten
nennt, kommen die Stufen aus dem Quellbild, denn die Anwendung zeigt das
Quellbild: Ein Profil mit anderen Stufen wuerde ein anderes Bild einfrieren.
Das Skript liest die Bilder unter daten/bilder/ (schreibt nichts), linear wie
die Anwendung (sRGB-Kennlinie nach IEC 61966-2-1, Leuchtdichte
Y = 0,2126 R + 0,7152 G + 0,0722 B, wie tools/quellweiss_eichen.py), und gibt aus:
    - Saturn (sat_20): Radialprofil durch beide Ansen (Zeile der hellsten
      Stelle bei 2,0 Saturnradien, Mittel ueber 3 Zeilen), dazu die mittlere
      Helligkeit je Ringzone relativ zum aeusseren B-Ring. Die Zonen sind die
      Katalogradien aus docs/recherche/objekte.md 4.2; der waagrechte Schnitt
      liegt wegen der Ringneigung nicht genau radial, daher werden die
      Bildradien linear auf den Katalog abgebildet: die Mitte der gemessenen
      Cassini-Teilung auf 1,9875, der Aussenrand des A-Rings (letzter Wert
      ueber 0,02) auf 2,269. Die Teilung ist der zusammenhaengende Bereich um
      das Minimum zwischen 1,85 und 2,05 Radien, der unter der halben Hoehe
      zwischen Minimum und dem niedrigeren Nachbargipfel (B-Ring aussen,
      A-Ring innen) liegt; fuer sie zusaetzlich Breite und mittlere Helligkeit
      ohne Flanken.
    - Mars (mars_14): Perzentile 10 und 70 der Leuchtdichte im inneren
      Scheibenbereich (Radius unter 0,7) als dunkle und helle Gebiete, und ihr
      Verhaeltnis.

Aufruf: python3 tools/strukturprofile.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image

WURZEL = Path(__file__).resolve().parent.parent
DATEN = WURZEL / "daten"

# Ringzonen in Saturnradien (objekte.md 4.2, PDS Ring-Moon Systems Node);
# B-Ring in innen und aussen geteilt, A-Ring ebenso (das Bild zeigt beide Haelften verschieden hell).
ZONEN = [
    ("C-Ring", 1.236, 1.526),
    ("B-Ring innen", 1.526, 1.75),
    ("B-Ring aussen", 1.75, 1.950),
    ("Cassini-Teilung", 1.950, 2.025),
    ("A-Ring innen", 2.025, 2.10),
    ("A-Ring aussen", 2.10, 2.269),
]
CASSINI_MITTE = (1.950 + 2.025) / 2
A_RING_AUSSEN = 2.269


def leuchtdichte(datei: Path) -> np.ndarray:
    a = np.asarray(Image.open(datei).convert("RGB")).astype(float) / 255.0
    a = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def bildnachweis(zustand: str) -> dict:
    nachweise = json.loads((DATEN / "bilder.json").read_text(encoding="utf-8"))
    liste = nachweise if isinstance(nachweise, list) else nachweise["bilder"]
    return next(n for n in liste if n.get("zustand") == zustand)


def saturn() -> None:
    n = bildnachweis("sat_20")
    y = leuchtdichte(DATEN / "bilder" / n["datei"])
    radius_px = n["objekt_durchmesser_px"] / 2
    spalten = np.where(y.max(axis=0) > 0.05)[0]
    mitte_x = (spalten.min() + spalten.max()) / 2
    print(f"Saturn {n['datei']}: Mitte x {mitte_x:.1f} px, Radius {radius_px:.0f} px")
    for seite, vorzeichen in (("links", -1), ("rechts", 1)):
        zeile = int(np.argmax(y[:, int(round(mitte_x + vorzeichen * 2.0 * radius_px))]))
        profil = y[zeile - 1 : zeile + 2, :].mean(axis=0)
        radien = np.arange(1.2, 2.32, 0.005)
        werte = np.array([profil[int(round(mitte_x + vorzeichen * r * radius_px))] for r in radien])
        # Cassini-Teilung: zusammenhaengend um das Minimum, unter halber Hoehe zum niedrigeren Nachbargipfel
        i_min = int(np.argmin(np.where((radien > 1.85) & (radien < 2.05), werte, np.inf)))
        links = werte[(radien > 1.85) & (radien < radien[i_min])].max()
        rechts = werte[(radien > radien[i_min]) & (radien < 2.05)].max()
        schwelle = (werte[i_min] + min(links, rechts)) / 2
        i_von = i_bis = i_min
        while werte[i_von - 1] < schwelle:
            i_von -= 1
        while werte[i_bis + 1] < schwelle:
            i_bis += 1
        r_mitte = (radien[i_von] + radien[i_bis]) / 2
        r_rand = radien[werte > 0.02].max()
        steigung = (A_RING_AUSSEN - CASSINI_MITTE) / (r_rand - r_mitte)
        r_kat = CASSINI_MITTE + (radien - r_mitte) * steigung
        b_aussen = werte[(r_kat >= 1.75) & (r_kat < 1.95)].mean()
        print(f"  Anse {seite} (Zeile {zeile}): Cassini-Mitte {r_mitte:.3f} R, A-Rand {r_rand:.3f} R, Massstab {steigung:.4f}")
        for name, von, bis in ZONEN:
            w = werte[(r_kat >= von) & (r_kat < bis)]
            print(f"    {name:16s} {von:.3f} bis {bis:.3f} R: Y {w.mean():.3f}, relativ {w.mean() / b_aussen:.3f}")
        # Die Teilung selbst, ohne die Flanken der Katalogzone
        breite_kat = (radien[i_bis] - radien[i_von] + 0.005) * steigung
        tiefe = werte[i_von : i_bis + 1].mean()
        print(f"    Teilung selbst: Breite {breite_kat:.3f} R, Y {tiefe:.3f}, relativ {tiefe / b_aussen:.3f}")

def mars() -> None:
    n = bildnachweis("mars_14")
    y = leuchtdichte(DATEN / "bilder" / n["datei"])
    hoehe, breite = y.shape
    radius_px = n["objekt_durchmesser_px"] / 2
    yy, xx = np.mgrid[:hoehe, :breite]
    innen = y[np.hypot(xx - breite / 2, yy - hoehe / 2) < 0.7 * radius_px]
    p10, p70 = np.percentile(innen, 10), np.percentile(innen, 70)
    print(f"Mars {n['datei']}: Perzentil 10 {p10:.3f}, 70 {p70:.3f}, Verhaeltnis dunkel/hell {p10 / p70:.3f}")


if __name__ == "__main__":
    saturn()
    mars()
