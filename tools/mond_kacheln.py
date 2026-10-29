#!/usr/bin/env python3
"""Mondbild aufbereiten: Kachelpyramide und Bildnachweis (Issue #7, #36, ADR-0003).

Liest ein NASA-SVS-Rohbild aus SVS 5587 "Moon Phase and Libration 2026"
(5760x3240 RGBA, ein Frame je Stunde), prueft Scheibenlage und Orientierung,
zentriert die Scheibe auf einer quadratischen Leinwand von 3072 px, legt den
Alphakanal auf Schwarz, schwaerzt alles ausserhalb der Scheibe plus kleinem
Rand und schreibt Kacheln von 512 px in Stufen halbierender Aufloesung nach
    daten/bilder/<ordner>/<stufe>/<x>_<y>.webp
Stufe 0 ist die volle Aufloesung (etwa 0,644"/px, 3072 px), jede weitere Stufe
halbiert (1536 px, 768 px); es wird abgebrochen, sobald eine Stufe unter
1024 px Gesamtbreite liegt. Halbiert wird in linearer Helligkeit: sRGB-
Kodewerte nach IEC 61966-2-1 linearisieren, 2x2 mitteln, zurueck nach sRGB
8 Bit (Issue #51); vor dem Schreiben prueft eine Probe, dass jeder 2x2-Block
einer Stufe linear gemittelt bis auf eine 8-Bit-Stufe das Pixel der naechsten
Stufe ergibt. Danach wird der Eintrag des Frames in daten/bilder.json
geschrieben (bestehende andere Eintraege bleiben erhalten).

Frames (Tabelle FRAMES, Ephemeride aus data/roh/mooninfo_2026.json, Index
N-1 = Frame N; docs/recherche/bilder-v2.md 8):
    6285  mond_ev      19.09.2026 20:00 UT, 59,3 %  -> daten/bilder/mond/
    6173  mond_sichel  15.09.2026 04:00 UT, 17,3 %  -> daten/bilder/mond_sichel/
    6449  mond_voll    26.09.2026 16:00 UT, 99,9 %  -> daten/bilder/mond_voll/
    6615  mond_lv      03.10.2026 14:00 UT, 49,9 %  -> daten/bilder/mond_lv/
Frame 6285 (Issue #7) nutzt fuer Ausschnitt und Massstab die festen Vorgaben
(Mitte 2877/1622, 2758 px, 0,643"/px), damit Geometrie und Kachelraster von
mond_ev gleich bleiben; die Nachtseitenmaske nimmt dort die gemessene Scheibe.
Fuer die anderen Frames (Issue #36) werden Mitte und Durchmesser am Alphakanal
gemessen (Schwerpunkt und Flaechendurchmesser, Durchmesser auf ganze Pixel
gerundet), der Massstab ist winkelgroesse / Durchmesser. Bei allen Frames wird
die Nachtseite geschwaerzt (siehe schwaerze_nachtseite; ADR-0003 Nachtrag V2,
bilder-v2.md 8.3; bei mond_ev seit der Entscheidung von Herbert vom 2026-10-29).

Verwendung (aus dem Repo-Root, nur numpy und Pillow noetig):
    python3 tools/mond_kacheln.py                       # Frame 6285 (mond_ev)
    python3 tools/mond_kacheln.py --frame 6173          # zunehmende Sichel
    python3 tools/mond_kacheln.py --alle                # alle Frames der Tabelle
    python3 tools/mond_kacheln.py --frame 6449 data/roh/svs5587_moon.6449.tif
    python3 tools/mond_kacheln.py --qualitaet 95        # WebP-Qualitaet 0 bis 100
    python3 tools/mond_kacheln.py --ziel daten/bilder/mond          # Zielordner der Kacheln
    python3 tools/mond_kacheln.py --bildnachweis daten/bilder.json  # Datei fuer den Bildnachweis
    python3 tools/mond_kacheln.py --messen              # nur Qualitaet messen, nichts schreiben
    python3 tools/mond_kacheln.py --pruefen             # nur Pyramide rechnen und Probe, nichts schreiben

Das Skript ist idempotent: der Zielordner wird vorher geleert (nur Stufen-
ordner mit .webp-Kacheln), der Eintrag des Frames in bilder.json wird ersetzt.

Orientierung: Die SVS-Seite sagt "Celestial north is up in these images";
der Positionswinkel der Mondachse liegt in den vier Frames zwischen 337,8
und 18,2 Grad (echt, bleibt). Das Skript prueft das am Bild:
    - beleuchteter Anteil der Scheibe (mittlerer Kodewert ueber 30) auf 0,05
      gleich der Phase der Ephemeride,
    - bei Phase unter 0,95: die Tagseite nach der Ephemeride (Sonnenhoehe
      ueber 0 Grad, siehe sonnenhoehe) deckt sich mit der hellen Flaeche
      (Schnitt durch Vereinigung mindestens 0,8) und besser als ihre Spiegelung
      an der Nord-Sued- oder der Ost-West-Achse (Abstand mindestens 0,02); das
      schliesst Spiegeln, Drehen um 180 Grad und einen falschen Frame aus,
    - wo die Tagseite die Maria im Norden enthaelt (Frames 6285, 6449, 6615,
      Feld norden_dunkler): die obere Haelfte der Tagseite ist im Mittel
      dunkler als die untere (Mare Imbrium und Serenitatis im Norden, helles
      Hochland im Sueden). Bei der Sichel (6173) traegt das nicht (Tagseite
      oben 105, unten 100), dort reicht die Spiegelprobe (0,86 gegen 0,39).
Es wird nicht gedreht oder gespiegelt.

Nachtseite (alle Frames): Das Rendering hellt die Nachtseite kuenstlich
auf (lineare Leuchtdichte im Median 0,0036, bis 0,04, gegen 0,2 bis 0,3 der
Tagseite), zum Terminator hin abnehmend; echtes Erdlicht ist um eine
Groessenordnung dunkler (bilder-v2.md 8.3) und wird nicht simuliert (#94).
Geschwaerzt wird jedes Pixel mit Sonnenhoehe unter 0 Grad, ausser beleuchteten
Gipfeln: Leuchtdichte ab NACHT_SCHWELLE_Y (0,02, ueber dem Hoechstwert der
Aufhellung naeher als 10 Grad am Terminator) und hoechstens NACHT_GIPFEL_GRAD
(6 Grad) hinter dem Terminator, samt einem Saum von NACHT_SAUM_PX Pixeln.
Gemessen an den Frames 6173 und 6615: ab 6 Grad hinter dem Terminator kein
Pixel ueber 0,02, bis 4 Grad dahinter beleuchtete Gipfel bis 0,42.

WebP-Qualitaet: gemessen mit --messen an zwei Streifen von Stufe 0 (400 bzw.
312 px breit, 2000 px hoch), einem am Terminator (Schatten, feine Krater-
kanten, Nachtseite) und einem am hellen Ostrand (harte Kante gegen Schwarz).
Fehler in 8-Bit-Stufen je RGB-Kanal, "Hintergrund" ist der groesste Wert
ausserhalb der Scheibe plus Rand (Ringing ins Schwarze), Pyramide alle Stufen:
    q80: Terminator max 30, mittel 2,04; Ostrand max 25, mittel 1,34; Hintergrund 14; 0,56 MB
    q85: Terminator max 24, mittel 1,79; Ostrand max 21, mittel 1,15; Hintergrund 11; 0,74 MB
    q90: Terminator max 18, mittel 1,36; Ostrand max 17, mittel 0,92; Hintergrund  7; 1,09 MB
    q95: Terminator max 16, mittel 0,96; Ostrand max 12, mittel 0,67; Hintergrund  8; 1,77 MB
    q98: Terminator max 11, mittel 0,76; Hintergrund 4; 2,32 MB
    verlustfrei: Fehler 0; 6,06 MB
Gewaehlt ist q95: mittlerer Fehler unter einer Stufe, Maximalfehler nur an
einzelnen Pixeln von Schattenkanten, in 3-fach vergroesserten Ausschnitten
keine Bloecke oder Saeume sichtbar, Gesamtgroesse weit unter 20 MB (A-X6);
q98 bringt wenig, verlustfrei kostet das Dreifache. Das Ringing in den
Hintergrund (bis 8 Stufen, nur in den ersten etwa 10 px um den Rand) liegt
unter dem, was die PSF-Faltung am Rand ohnehin verschmiert; der Kachel-
Loader kann ausserhalb von objekt_durchmesser_px zusaetzlich schwaerzen.
Die Werte werden mit --messen reproduziert; weichen sie ab, Kommentar
nachfuehren.
"""

import argparse
import json
import os
import shutil
import sys
from io import BytesIO

import numpy as np
from PIL import Image

ROH_BREITE, ROH_HOEHE = 5760, 3240
TOLERANZ_MITTE_PX = 4.0
TOLERANZ_DURCHMESSER_PX = 8.0

# Leinwand und Pyramide
LEINWAND_PX = 3072          # 6 Kacheln, Scheibe plus Rand, Mitte bei 1536/1536
KACHEL_PX = 512
RAND_PX = 4                 # bleibt um die Scheibe stehen, dahinter Schwarz
MIN_BREITE_PX = 1024        # letzte Stufe liegt unter dieser Breite
QUALITAET_STANDARD = 95

# Ziel
ZIEL_BASIS = os.path.join("daten", "bilder")
BILDNACHWEIS_STANDARD = os.path.join("daten", "bilder.json")
FRAME_STANDARD = 6285

# Nachtseite (siehe Kopfkommentar)
NACHT_SCHWELLE_Y = 0.02
NACHT_GIPFEL_GRAD = 6.0
NACHT_SAUM_PX = 2
GEWICHTE_Y = np.array([0.2126, 0.7152, 0.0722])   # Leuchtdichte aus linearem sRGB (IEC 61966-2-1)

# Frames aus SVS 5587. Ephemeride aus data/roh/mooninfo_2026.json (Index N-1 = Frame N):
# Phase = phase / 100, Kolongitude = 90 Grad - subsolar.lon, Sub-Erde = subearth, Sub-Sonne =
# subsolar, Positionswinkel = posangle, Winkelgroesse = diameter. Rohdateien in data/roh/LIESMICH.md.
FRAMES = {
    6285: {
        "zustand": "mond_ev",
        "ordner": "mond",
        "zeitpunkt_utc": "2026-09-19T20:00:00Z",
        "winkelgroesse_arcsec": 1774.4,
        "phase": 0.593,
        "kolongitude_grad": 11.2,
        "sub_erde_breite_grad": 5.36,
        "sub_erde_laenge_grad": -0.44,
        "sub_sonne_breite_grad": -0.726,
        "sub_sonne_laenge_grad": 78.763,
        "positionswinkel_achse_grad": 357.8,
        "roh_sha256": "d0d586f67118288e2e9552fb45a26f07d4fb45697ad05b0a7cfc02a5cb42f99d",
        "roh_bytes": 10370890,
        "roh_abruf": "2026-10-23",
        # Feste Vorgabe aus Issue #7 (Pixelmitte, Durchmesser, Massstab) fuer Ausschnitt und Massstab.
        "vorgabe": {"mitte_x": 2877, "mitte_y": 1622, "durchmesser_px": 2758, "bogensekunden_pro_pixel": 0.643},
        "nachtseite_schwarz": True,
        "norden_dunkler": True,
    },
    6173: {
        "zustand": "mond_sichel",
        "ordner": "mond_sichel",
        "zeitpunkt_utc": "2026-09-15T04:00:00Z",
        "winkelgroesse_arcsec": 1814.9,
        "phase": 0.1729,
        "kolongitude_grad": 314.3,
        "sub_erde_breite_grad": 6.47,
        "sub_erde_laenge_grad": 4.66,
        "sub_sonne_breite_grad": -0.636,
        "sub_sonne_laenge_grad": 135.741,
        "positionswinkel_achse_grad": 18.2,
        "roh_sha256": "861569753cd990632347dfaeadbc0c0e3d29606350ee03b14a03688320dfa70d",
        "roh_bytes": 9351110,
        "roh_abruf": "2026-10-29",
        "vorgabe": None,
        "nachtseite_schwarz": True,
        "norden_dunkler": False,
    },
    6449: {
        "zustand": "mond_voll",
        "ordner": "mond_voll",
        "zeitpunkt_utc": "2026-09-26T16:00:00Z",
        "winkelgroesse_arcsec": 1888.3,
        "phase": 0.9994,
        "kolongitude_grad": 94.4,
        "sub_erde_breite_grad": -3.74,
        "sub_erde_laenge_grad": -4.93,
        "sub_sonne_breite_grad": -0.878,
        "sub_sonne_laenge_grad": -4.444,
        "positionswinkel_achse_grad": 337.8,
        "roh_sha256": "e0dd6f675ec849c72c309491d7c5daf9c2a2365583e0d5e02ef541397188d979",
        "roh_bytes": 10974974,
        "roh_abruf": "2026-10-29",
        "vorgabe": None,
        "nachtseite_schwarz": True,
        "norden_dunkler": True,
    },
    6615: {
        "zustand": "mond_lv",
        "ordner": "mond_lv",
        "zeitpunkt_utc": "2026-10-03T14:00:00Z",
        "winkelgroesse_arcsec": 1936.4,
        "phase": 0.4985,
        "kolongitude_grad": 178.6,
        "sub_erde_breite_grad": -4.97,
        "sub_erde_laenge_grad": 1.63,
        "sub_sonne_breite_grad": -1.045,
        "sub_sonne_laenge_grad": -88.641,
        "positionswinkel_achse_grad": 3.5,
        "roh_sha256": "3624dd84f049493d2a537264bf61b2dd9cd527b79f2bbd7b41d2eba105137d7f",
        "roh_bytes": 11993450,
        "roh_abruf": "2026-10-29",
        "vorgabe": None,
        "nachtseite_schwarz": True,
        "norden_dunkler": True,
    },
}


def rohbild_standard(frame):
    return os.path.join("data", "roh", f"svs5587_moon.{frame}.tif")


def bild_id(frame):
    return f"mond_svs5587_{frame}"


def lade_rohbild(pfad):
    """Rohbild als uint8-Array HxWx4 (RGBA). Fehlt der Alphakanal, wird er voll gesetzt."""
    if not os.path.isfile(pfad):
        raise SystemExit(f"Rohbild nicht gefunden: {pfad} (Herkunft und Abruf: data/roh/LIESMICH.md)")
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(pfad) as im:
        if im.size != (ROH_BREITE, ROH_HOEHE):
            raise SystemExit(f"Rohbild hat {im.size}, erwartet {(ROH_BREITE, ROH_HOEHE)}: {pfad}")
        if im.mode == "RGBA":
            rgba = np.asarray(im)
        elif im.mode == "RGB":
            rgb = np.asarray(im)
            rgba = np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)])
        else:
            rgba = np.asarray(im.convert("RGBA"))
    if rgba.dtype != np.uint8:
        raise SystemExit(f"Rohbild ist {rgba.dtype}, erwartet 8 Bit je Kanal")
    return rgba


def miss_scheibe(alpha):
    """Schwerpunkt (Pixelindex, Mitte von Pixel 0 bei 0) und Flaechendurchmesser aus dem Alphakanal,
    dazu die Bounding-Box der Pixel mit Alpha >= 128."""
    a = alpha.astype(np.float64)
    gewicht = a.sum()
    if gewicht <= 0:
        raise SystemExit("Alphakanal ist leer, keine Scheibe gefunden")
    cx = (a.sum(axis=0) * np.arange(a.shape[1])).sum() / gewicht
    cy = (a.sum(axis=1) * np.arange(a.shape[0])).sum() / gewicht
    durchmesser = 2.0 * np.sqrt(gewicht / 255.0 / np.pi)
    ys, xs = np.nonzero(alpha >= 128)
    box = (int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1))
    return cx, cy, durchmesser, box


def scheibe(alpha, f):
    """Lage der Scheibe im Rohbild und auf der Leinwand.

    Mit Vorgabe (Frame 6285): Mitte und Durchmesser aus der Vorgabe, gegen die Messung geprueft,
    Leinwandmitte bei Pixel 1536 (wie Issue #7). Ohne Vorgabe: gemessene Mitte, Ausschnitt so, dass
    sie auf 0,5 px an der Leinwandmitte (Pixelindex 1535,5) liegt, Durchmesser gemessen und auf
    ganze Pixel gerundet, Massstab = Winkelgroesse / Durchmesser auf 4 Stellen.
    """
    cx, cy, d, box = miss_scheibe(alpha)
    halb = LEINWAND_PX // 2
    v = f["vorgabe"]
    if v is not None:
        print(f"Scheibe aus Alpha: Mitte {cx:.1f}/{cy:.1f}, Flaechendurchmesser {d:.1f} px "
              f"(Vorgabe {v['mitte_x']}/{v['mitte_y']}, {v['durchmesser_px']} px)")
        if abs(cx - v["mitte_x"]) > TOLERANZ_MITTE_PX or abs(cy - v["mitte_y"]) > TOLERANZ_MITTE_PX:
            raise SystemExit("Scheibenmitte weicht von der Vorgabe ab; Konstanten pruefen")
        if abs(d - v["durchmesser_px"]) > TOLERANZ_DURCHMESSER_PX:
            raise SystemExit("Scheibendurchmesser weicht von der Vorgabe ab; Konstanten pruefen")
        x0, y0 = v["mitte_x"] - halb, v["mitte_y"] - halb
        # Nachtmaske an der gemessenen Scheibe (die Vorgabe liegt bis 2 px daneben, Issue #36)
        geo = {"x0": x0, "y0": y0, "kx": float(halb), "ky": float(halb),
               "durchmesser_px": v["durchmesser_px"], "bogensekunden_pro_pixel": v["bogensekunden_pro_pixel"],
               "nacht_kx": cx - x0, "nacht_ky": cy - y0, "nacht_r": d / 2.0}
    else:
        x0 = int(round(cx - (halb - 0.5)))
        y0 = int(round(cy - (halb - 0.5)))
        dp = int(round(d))
        massstab = round(f["winkelgroesse_arcsec"] / dp, 4)
        print(f"Scheibe aus Alpha: Mitte {cx:.2f}/{cy:.2f}, Flaechendurchmesser {d:.1f} px, "
              f"Bounding-Box {box[0]}x{box[1]} px; verwendet {dp} px, {massstab}\"/px")
        if abs(box[0] - d) > TOLERANZ_DURCHMESSER_PX or abs(box[1] - d) > TOLERANZ_DURCHMESSER_PX:
            raise SystemExit("Bounding-Box passt nicht zum Flaechendurchmesser; Scheibe nicht rund?")
        geo = {"x0": x0, "y0": y0, "kx": cx - x0, "ky": cy - y0,
               "durchmesser_px": dp, "bogensekunden_pro_pixel": massstab}
    if geo["x0"] < 0 or geo["y0"] < 0 or geo["x0"] + LEINWAND_PX > ROH_BREITE or geo["y0"] + LEINWAND_PX > ROH_HOEHE:
        raise SystemExit("Leinwand ragt ueber das Rohbild hinaus")
    if geo["durchmesser_px"] + 2 * RAND_PX > LEINWAND_PX:
        raise SystemExit("Scheibe plus Rand passt nicht auf die Leinwand")
    geo.update({"mess_x": cx, "mess_y": cy, "mess_durchmesser": d, "mess_box": box})
    return geo


def einheitsvektor(breite_grad, laenge_grad):
    b, l = np.radians(breite_grad), np.radians(laenge_grad)
    return np.array([np.cos(b) * np.cos(l), np.cos(b) * np.sin(l), np.sin(b)])


def sonnenhoehe(groesse, kx, ky, r, f):
    """Sonnenhoehe in Grad je Pixel einer Leinwand (Kugel ohne Relief, orthografisch).

    Selenografisches System: x zur Laenge 0 / Breite 0, y zur Laenge +90 (Osten, IAU), z zum
    Nordpol. E = Richtung zur Erde (Sub-Erde-Punkt), S = zur Sonne (Sub-Sonne-Punkt). Bildachsen
    vor der Drehung: oben = Nordpol senkrecht zu E projiziert, rechts = oben x E (die Laenge +90,
    Mare Crisium, erscheint rechts). Dann um den Positionswinkel P der Achse gedreht (von
    Himmelsnorden ueber Osten, bei Norden oben gegen den Uhrzeigersinn). Pixel ausserhalb der
    Scheibe bekommen den Wert am Rand in ihrer Richtung. Probe: Anteil mit Hoehe ueber 0 gleich
    der Phase der Ephemeride auf 0,001 (alle vier Frames, gemessen 2026-10-29).
    """
    e = einheitsvektor(f["sub_erde_breite_grad"], f["sub_erde_laenge_grad"])
    s = einheitsvektor(f["sub_sonne_breite_grad"], f["sub_sonne_laenge_grad"])
    oben = np.array([0.0, 0.0, 1.0]) - e * e[2]
    oben /= np.linalg.norm(oben)
    rechts = np.cross(oben, e)
    p = np.radians(f["positionswinkel_achse_grad"])
    yy, xx = np.mgrid[0:groesse, 0:groesse]
    bx = (xx - kx) / r
    by = -(yy - ky) / r
    del xx, yy
    u = bx * np.cos(p) + by * np.sin(p)        # rechts vor der Drehung
    v = -bx * np.sin(p) + by * np.cos(p)       # oben vor der Drehung
    del bx, by
    w = np.sqrt(np.clip(1.0 - u * u - v * v, 0.0, None))
    sinus = (u * (rechts @ s) + v * (oben @ s) + w * (e @ s)) / np.sqrt(u * u + v * v + w * w)
    return np.degrees(np.arcsin(np.clip(sinus, -1.0, 1.0)))


def pruefe_orientierung(bild, alpha, geo, f):
    """Norden oben, Osten rechts und Phase am zentrierten Bild pruefen (siehe Kopfkommentar)."""
    g = bild.astype(np.float64).mean(axis=2)
    yy, xx = np.mgrid[0:LEINWAND_PX, 0:LEINWAND_PX]
    kx, ky = geo["mess_x"] - geo["x0"], geo["mess_y"] - geo["y0"]
    r = geo["mess_durchmesser"] / 2.0
    innen = (np.hypot(xx - kx, yy - ky) < r - 10) & (alpha == 255)
    tag = innen & (g > 30)
    anteil = tag.sum() / innen.sum()
    oben, unten = g[tag & (yy < ky)].mean(), g[tag & (yy > ky)].mean()
    print(f"Orientierung: beleuchteter Anteil {anteil:.3f} (Ephemeride {f['phase']}); "
          f"Tagseite oben {oben:.1f}, unten {unten:.1f}")
    if abs(anteil - f["phase"]) > 0.05:
        raise SystemExit("Beleuchteter Anteil passt nicht zur Ephemeride; falscher Frame?")
    if f["phase"] < 0.95:
        vorher = innen & (sonnenhoehe(LEINWAND_PX, kx, ky, r, f) > 0)
        # Spiegelung an der Scheibenmitte (auf ganze Pixel gerundet)
        sy = np.clip(np.rint(2 * ky - yy).astype(int), 0, LEINWAND_PX - 1)
        sx = np.clip(np.rint(2 * kx - xx).astype(int), 0, LEINWAND_PX - 1)

        def deckung(m):
            return (tag & m).sum() / (tag | m).sum()
        d, d_ns, d_ow = deckung(vorher), deckung(vorher[sy, xx]), deckung(vorher[yy, sx])
        print(f"Tagseite nach Ephemeride: Deckung {d:.3f}, nord-sued gespiegelt {d_ns:.3f}, "
              f"ost-west gespiegelt {d_ow:.3f}")
        if d < 0.8 or d < d_ns + 0.02 or d < d_ow + 0.02:
            raise SystemExit("Tagseite passt nicht zur Ephemeride; Bild gespiegelt, gedreht oder falscher Frame")
    if f["norden_dunkler"] and oben >= unten:
        raise SystemExit("Obere Tagseite ist nicht dunkler als untere; Norden scheint nicht oben")


def zentriere_und_schwaerze(rgba, geo):
    """Quadratische Leinwand um die Scheibenmitte, Alpha auf Schwarz, Hintergrund genullt.
    Gibt das Bild und den Alphakanal des Ausschnitts zurueck."""
    x0, y0 = geo["x0"], geo["y0"]
    aus = rgba[y0:y0 + LEINWAND_PX, x0:x0 + LEINWAND_PX]
    rgb = aus[..., :3].astype(np.float32)
    alpha = aus[..., 3:4].astype(np.float32) / 255.0
    bild = rgb * alpha                      # straight alpha ueber Schwarz
    yy, xx = np.mgrid[0:LEINWAND_PX, 0:LEINWAND_PX]
    aussen = np.hypot(xx - geo["kx"], yy - geo["ky"]) > geo["durchmesser_px"] / 2.0 + RAND_PX
    bild[aussen] = 0.0
    return np.rint(bild).clip(0, 255).astype(np.uint8), aus[..., 3].copy()


def erweitere(maske, px):
    """Maske um px Pixel in jede Richtung erweitern (quadratisches Fenster)."""
    aus = maske.copy()
    for dy in range(-px, px + 1):
        for dx in range(-px, px + 1):
            if dx or dy:
                aus |= np.roll(np.roll(maske, dy, axis=0), dx, axis=1)
    return aus


def schwaerze_nachtseite(bild, geo, f):
    """Nachtseite auf Schwarz (siehe Kopfkommentar). Aendert bild, gibt Kennzahlen zurueck."""
    hoehe = sonnenhoehe(LEINWAND_PX, geo.get("nacht_kx", geo["kx"]), geo.get("nacht_ky", geo["ky"]),
                        geo.get("nacht_r", geo["durchmesser_px"] / 2.0), f)
    y = srgb_zu_linear(bild) @ GEWICHTE_Y
    gipfel = erweitere((y >= NACHT_SCHWELLE_Y) & (hoehe > -NACHT_GIPFEL_GRAD), NACHT_SAUM_PX)
    nacht = (hoehe < 0) & ~gipfel & (bild.max(axis=2) > 0)
    scheibe_px = int((bild.max(axis=2) > 0).sum())
    kennzahlen = {
        "pixel": int(nacht.sum()),
        "anteil_scheibe": float(nacht.sum() / scheibe_px),
        "anteil_fluss": float(y[nacht].sum() / y.sum()),
        "gipfel_px": int(((hoehe < 0) & gipfel & (y > 0)).sum()),
    }
    bild[nacht] = 0
    print(f"Nachtseite: {kennzahlen['pixel']} Pixel geschwaerzt ({kennzahlen['anteil_scheibe']:.1%} der "
          f"Pixel ueber Schwarz, {kennzahlen['anteil_fluss']:.2%} des Flusses), "
          f"{kennzahlen['gipfel_px']} Pixel hinter dem Terminator bleiben (Gipfel und Saum)")
    return kennzahlen


def srgb_zu_linear(kodewert):
    """sRGB-Kodewert 0..255 in lineare Helligkeit 0..1 (IEC 61966-2-1), float64."""
    w = np.asarray(kodewert, dtype=np.float64) / 255.0
    return np.where(w <= 0.04045, w / 12.92, ((w + 0.055) / 1.055) ** 2.4)


def linear_zu_srgb(linear):
    """Lineare Helligkeit 0..1 in sRGB-Kodewert 0..255 (IEC 61966-2-1), gerundet auf 8 Bit."""
    w = np.clip(linear, 0.0, 1.0)
    k = np.where(w <= 0.0031308, w * 12.92, 1.055 * w ** (1.0 / 2.4) - 0.055)
    return np.rint(k * 255.0).clip(0, 255).astype(np.uint8)


def halbiere(linear):
    """Flaechenmittel 2x2 in linearer Helligkeit; Breite und Hoehe muessen gerade sein."""
    h, w = linear.shape[:2]
    if h % 2 or w % 2:
        raise SystemExit(f"Stufe mit ungerader Groesse {w}x{h} laesst sich nicht halbieren")
    return linear.reshape(h // 2, 2, w // 2, 2, 3).mean(axis=(1, 3))


def stufen(bild0):
    """Liste (stufe, bild) von voller Aufloesung bis unter MIN_BREITE_PX.

    Stufe 0 ist bild0 unveraendert. Jede weitere Stufe entsteht aus der ungerundeten
    linearen Helligkeit der vorigen (2x2-Mittel), erst danach wird nach sRGB 8 Bit
    kodiert; so mittelt Stufe n linear ueber 2^n x 2^n Pixel von Stufe 0, ohne dass
    sich Rundungsfehler der Zwischenstufen aufaddieren. QuelleKacheln linearisiert
    beim Laden mit derselben Kennlinie und erwartet in allen Stufen dieselbe lineare
    Helligkeit (Issue #51).
    """
    liste = [(0, bild0)]
    linear = srgb_zu_linear(bild0)
    while liste[-1][1].shape[1] >= MIN_BREITE_PX:
        linear = halbiere(linear)
        liste.append((liste[-1][0] + 1, linear_zu_srgb(linear)))
    return liste


def pruefe_stufen(liste):
    """Probe (Issue #51): mittlere lineare Helligkeit jedes 2x2-Blocks einer Stufe gleich
    dem Pixel der naechsten Stufe, Toleranz eine 8-Bit-Stufe. Verglichen werden die 8-Bit-
    Werte vor der WebP-Kodierung (deren Fehler bei q95 bis 16 Stufen gehen, siehe oben):
    Blockmittel zurueck nach sRGB kodiert gegen den Kodewert der groeberen Stufe, und die
    lineare Abweichung gegen den linearen Abstand einer 8-Bit-Stufe am selben Wert.
    """
    for (s, fein), (_, grob) in zip(liste, liste[1:]):
        mittel = halbiere(srgb_zu_linear(fein))
        d_kode = np.abs(linear_zu_srgb(mittel).astype(np.int16) - grob.astype(np.int16))
        lin_grob = srgb_zu_linear(grob)
        stufe_lin = srgb_zu_linear(np.minimum(grob.astype(np.int16) + 1, 255)) - lin_grob
        stufe_lin = np.maximum(stufe_lin, lin_grob - srgb_zu_linear(np.maximum(grob.astype(np.int16) - 1, 0)))
        d_lin = np.abs(mittel - lin_grob)
        verletzt = int((d_lin > stufe_lin + 1e-12).sum())
        print(f"Probe Stufe {s} -> {s + 1}: Abweichung max {d_kode.max()} Kodestufen "
              f"(mittel {d_kode.mean():.4f}), linear max {d_lin.max():.2e}, "
              f"ueber einer 8-Bit-Stufe: {verletzt} von {d_lin.size} Werten")
        if d_kode.max() > 1 or verletzt:
            raise SystemExit(f"Probe verletzt: Stufe {s + 1} ist nicht das lineare 2x2-Mittel von Stufe {s}")


def kachel_bytes(kachel, qualitaet):
    puffer = BytesIO()
    Image.fromarray(kachel, "RGB").save(puffer, "WEBP", quality=qualitaet, method=6)
    return puffer.getvalue()


def kacheln(bild):
    """Alle Kacheln einer Stufe: (x, y, Array). Randkacheln duerfen kleiner sein."""
    h, w = bild.shape[:2]
    nx = -(-w // KACHEL_PX)
    ny = -(-h // KACHEL_PX)
    for y in range(ny):
        for x in range(nx):
            yield x, y, bild[y * KACHEL_PX:(y + 1) * KACHEL_PX, x * KACHEL_PX:(x + 1) * KACHEL_PX]


def anzahl_kacheln(bild):
    h, w = bild.shape[:2]
    return -(-w // KACHEL_PX), -(-h // KACHEL_PX)


def leere_ziel(ordner):
    """Zielordner leeren; nur Stufenordner mit WebP-Kacheln werden entfernt."""
    if os.path.isdir(ordner):
        for name in os.listdir(ordner):
            pfad = os.path.join(ordner, name)
            if os.path.isdir(pfad) and name.isdigit() and all(
                    f.endswith(".webp") for f in os.listdir(pfad)):
                shutil.rmtree(pfad)
            else:
                raise SystemExit(f"Unerwarteter Eintrag im Zielordner, nicht geloescht: {pfad}")
    os.makedirs(ordner, exist_ok=True)


def schreibe_pyramide(liste, ordner, qualitaet, massstab0):
    """Schreibt alle Stufen, gibt Stufenliste fuer den Bildnachweis und Gesamtgroesse zurueck."""
    eintraege = []
    gesamt = 0
    for s, b in liste:
        stufenordner = os.path.join(ordner, str(s))
        os.makedirs(stufenordner, exist_ok=True)
        nx, ny = anzahl_kacheln(b)
        groesse = 0
        for x, y, k in kacheln(b):
            daten = kachel_bytes(k, qualitaet)
            with open(os.path.join(stufenordner, f"{x}_{y}.webp"), "wb") as f:
                f.write(daten)
            groesse += len(daten)
        gesamt += groesse
        massstab = massstab0 * 2 ** s
        eintraege.append({
            "stufe": s,
            "breite_px": int(b.shape[1]),
            "hoehe_px": int(b.shape[0]),
            "bogensekunden_pro_pixel": round(massstab, 4),
            "kacheln_x": nx,
            "kacheln_y": ny,
        })
        print(f"Stufe {s}: {b.shape[1]}x{b.shape[0]} px, {nx}x{ny} Kacheln, "
              f"{massstab:.3f}\"/px, {groesse / 1e6:.2f} MB")
    return eintraege, gesamt


def messe_qualitaet(bild0, qualitaeten, geo, f):
    """Fehler gegen das Original in zwei Streifen von Stufe 0 und Groesse der ganzen Pyramide."""
    halb = LEINWAND_PX // 2
    r = geo["durchmesser_px"] / 2.0
    # Terminator: geometrisch bei x = Mitte - r * sin(Kolongitude - Sub-Erde-Laenge)
    xt = int(round(halb - r * np.sin(np.radians(f["kolongitude_grad"] - f["sub_erde_laenge_grad"]))))
    streifen = {
        "Terminator": (slice(halb - 1000, halb + 1000), slice(xt - 200, xt + 200)),
        "Ostrand": (slice(halb - 1000, halb + 1000), slice(int(halb + r) - 300, int(halb + r) + 12)),
    }
    yy, xx = np.mgrid[0:LEINWAND_PX, 0:LEINWAND_PX]
    aussen = np.hypot(xx - halb, yy - halb) > r + RAND_PX
    liste = stufen(bild0)
    print(f"Terminator angenommen bei x={xt} der Leinwand; Streifen: "
          + ", ".join(f"{n} x {s[1].start}..{s[1].stop}" for n, s in streifen.items()))
    for q in qualitaeten:
        gesamt = 0
        dekodiert = None
        for s, b in liste:
            if s == 0:
                dekodiert = np.zeros_like(b)
            for x, y, k in kacheln(b):
                daten = kachel_bytes(k, q)
                gesamt += len(daten)
                if s == 0:
                    dekodiert[y * KACHEL_PX:y * KACHEL_PX + k.shape[0],
                              x * KACHEL_PX:x * KACHEL_PX + k.shape[1]] = \
                        np.asarray(Image.open(BytesIO(daten)).convert("RGB"))
        diff = np.abs(dekodiert.astype(np.int16) - bild0.astype(np.int16))
        teile = []
        for name, (sy, sx) in streifen.items():
            d = diff[sy, sx]
            teile.append(f"{name} max {d.max()}, mittel {d.mean():.2f}")
        teile.append(f"Hintergrund max {dekodiert[aussen].max()}")
        print(f"q{q}: " + "; ".join(teile) + f"; Pyramide {gesamt / 1e6:.2f} MB")


def bildnachweis(frame, geo, stufenliste, qualitaet, gesamt_bytes, nacht):
    """Eintrag fuer daten/bilder.json nach docs/recherche/bilder.md Abschnitt 8."""
    f = FRAMES[frame]
    pa = f["positionswinkel_achse_grad"]
    kacheltext = (
        f"in Kacheln von {KACHEL_PX} px mit {len(stufenliste)} Stufen zerlegt "
        f"(WebP, Qualitaet {qualitaet}). Stufe n hat das 2^n-fache Pixelmass von Stufe 0 und ist "
        f"das Flaechenmittel in linearer Helligkeit (sRGB-Kennlinie IEC 61966-2-1), nach sRGB 8 Bit "
        f"zurueckkodiert."
    )
    rohtext = (f"Rohdatei moon.{frame}.tif: {f['roh_bytes']} Byte, SHA-256 {f['roh_sha256']}, "
               f"abgerufen {f['roh_abruf']}. ")
    komma = lambda x, n=1: f"{x:.{n}f}".replace(".", ",")
    nachttext = (
        f"Nachtseite auf Schwarz gesetzt (Erdlicht wird nicht simuliert, "
        f"ADR-0003 Nachtrag V2): jedes Pixel mit Sonnenhoehe unter 0 Grad nach der Ephemeride "
        f"(Kugel, Sub-Sonne {komma(f['sub_sonne_breite_grad'], 3)}/{komma(f['sub_sonne_laenge_grad'], 3)} "
        f"Grad), ausser beleuchteten Gipfeln (lineare Leuchtdichte ab {komma(NACHT_SCHWELLE_Y, 2)}, "
        f"hoechstens {komma(NACHT_GIPFEL_GRAD, 0)} Grad hinter dem Terminator, mit {NACHT_SAUM_PX} px "
        f"Saum); das sind {komma(100 * nacht['anteil_scheibe'])} Prozent der Scheibe und "
        f"{komma(100 * nacht['anteil_fluss'], 2)} Prozent ihres Flusses im Rendering. "
    )
    nachthinweis = (
        "Das Rendering hellt die Nachtseite kuenstlich auf (gemessen an Frame 6173: Median der "
        "linearen Leuchtdichte 0,0036 fern vom Terminator gegen 0,21 auf der Tagseite, etwa 1,7 Prozent; "
        "um eine Groessenordnung heller als Erdlicht, docs/recherche/bilder-v2.md 8.3); sie ist hier "
        "geschwaerzt. "
    )
    if f["vorgabe"] is not None:
        v = f["vorgabe"]
        bearbeitung = (
            f"Quadratischer Ausschnitt {LEINWAND_PX} px um die Scheibenmitte (Pixel {v['mitte_x']}/{v['mitte_y']} "
            f"des Rohbilds), Alphakanal auf Schwarz gelegt, ausserhalb der Scheibe plus {RAND_PX} px Rand "
            f"auf Schwarz gesetzt. " + nachttext +
            f"Nicht gedreht oder gespiegelt (Himmelsnorden oben laut SVS, "
            f"Positionswinkel der Achse {pa} Grad), Tagseite ohne Farb- oder "
            f"Kontrastaenderung, " + kacheltext
        )
        hinweise = (
            "Rendering, zugelassen als Ausnahme A-X9 (ADR-0002). Winkelgroesse 1774,4\" ist die des "
            "Rendering-Zeitpunkts; der Zustand mond_ev zeigt 1865\". Scheibendurchmesser gemessen: "
            "Flaechendurchmesser aus dem Alphakanal 2753,8 px, Bounding-Box 2753x2757 px (Alpha >= 128); "
            "verwendet wird die SVS-Vorgabe 2758 px; die Nachtseitenmaske nutzt die gemessene Scheibe. "
            + nachthinweis + rohtext +
            "Die SVS-Seite hat keine einzelne Credit-Zeile; Namensnennung aus dem Abschnitt Credits."
        )
    else:
        bearbeitung = (
            f"Quadratischer Ausschnitt {LEINWAND_PX} px um die gemessene Scheibenmitte (Schwerpunkt des "
            f"Alphakanals, Pixel {komma(geo['mess_x'])}/{komma(geo['mess_y'])} des Rohbilds, auf 0,5 px "
            f"in der Leinwandmitte), Alphakanal auf Schwarz gelegt, ausserhalb der Scheibe plus {RAND_PX} px "
            f"Rand auf Schwarz gesetzt. " + nachttext +
            f"Nicht gedreht "
            f"oder gespiegelt (Himmelsnorden oben laut SVS, Positionswinkel der Achse {pa} Grad), "
            f"Tagseite ohne Farb- oder Kontrastaenderung, " + kacheltext
        )
        hinweise = (
            f"Rendering, zugelassen als Ausnahme A-X9 (ADR-0002). Winkelgroesse "
            f"{komma(f['winkelgroesse_arcsec'])}\" ist die des Rendering-Zeitpunkts; der Zustand "
            f"{f['zustand']} zeigt den Mittelwert 1865\". Scheibe gemessen: Flaechendurchmesser aus dem "
            f"Alphakanal {komma(geo['mess_durchmesser'])} px, Bounding-Box {geo['mess_box'][0]}x"
            f"{geo['mess_box'][1]} px (Alpha >= 128); verwendet {geo['durchmesser_px']} px. "
            + nachthinweis + rohtext +
            "Die SVS-Seite hat keine einzelne Credit-Zeile; Namensnennung aus dem Abschnitt Credits."
        )
    return {
        "id": bild_id(frame),
        "objekt": "mond",
        "zustand": f["zustand"],
        "datei": f["ordner"] + "/",
        "quelle_url": "https://svs.gsfc.nasa.gov/5587",
        "quelle_datei": f"frames/5760x3240_16x9_30p/plain/moon.{frame}.tif",
        "mission": "LRO / NASA SVS",
        "instrument": "Rendering aus LOLA-Hoehenmodell und LROC-WAC-Farbmosaik, Ephemeride JPL DE421",
        "aufnahmedatum": f["zeitpunkt_utc"],
        "lizenz": "Public Domain (NASA)",
        "lizenz_url": "https://svs.gsfc.nasa.gov/help/",
        "namensnennung": "NASA Scientific Visualization Studio. Visualizer: Ernie Wright (USRA). "
                         "Planetary scientist: Noah Petro (NASA/GSFC). Producer: James Tralie (eMITS).",
        "pixel_breite": LEINWAND_PX,
        "pixel_hoehe": LEINWAND_PX,
        "original_pixel": f"{ROH_BREITE}x{ROH_HOEHE}",
        "winkelgroesse_arcsec": f["winkelgroesse_arcsec"],
        "objekt_durchmesser_px": geo["durchmesser_px"],
        "bogensekunden_pro_pixel": geo["bogensekunden_pro_pixel"],
        "norden_oben": True,
        "sub_erde_breite_grad": f["sub_erde_breite_grad"],
        "sub_erde_laenge_grad": f["sub_erde_laenge_grad"],
        "phase": f["phase"],
        "kolongitude_grad": f["kolongitude_grad"],
        "positionswinkel_achse_grad": pa,
        "bearbeitung": bearbeitung,
        "kacheln": {
            "kachel_px": KACHEL_PX,
            "format": "webp",
            "qualitaet": qualitaet,
            "muster": "{stufe}/{x}_{y}.webp",
            "gesamt_bytes": gesamt_bytes,
            "stufen": stufenliste,
        },
        "hinweise": hinweise,
    }


def schreibe_bildnachweis(pfad, eintrag):
    """Mond-Eintrag an seiner Stelle ersetzen oder anhaengen, andere Eintraege erhalten."""
    liste = []
    if os.path.isfile(pfad):
        with open(pfad, encoding="utf-8") as f:
            liste = json.load(f)
        if not isinstance(liste, list):
            raise SystemExit(f"{pfad} enthaelt keine Liste")
    stellen = [i for i, e in enumerate(liste) if e.get("id") == eintrag["id"]]
    if stellen:
        liste[stellen[0]] = eintrag          # an alter Stelle ersetzen, Reihenfolge bleibt
        liste = [e for i, e in enumerate(liste) if i not in stellen[1:]]
    else:
        liste.append(eintrag)
    os.makedirs(os.path.dirname(pfad) or ".", exist_ok=True)
    with open(pfad, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")


def bearbeite(frame, rohbild, ziel, bildnachweis_pfad, qualitaet, messen, pruefen):
    f = FRAMES[frame]
    print(f"Frame {frame} ({f['zustand']}), Rohbild: {rohbild}")
    rgba = lade_rohbild(rohbild)
    geo = scheibe(rgba[..., 3], f)
    bild0, alpha = zentriere_und_schwaerze(rgba, geo)
    del rgba
    pruefe_orientierung(bild0, alpha, geo, f)
    nacht = schwaerze_nachtseite(bild0, geo, f) if f["nachtseite_schwarz"] else None

    if messen:
        messe_qualitaet(bild0, (80, 85, 90, 95, 98), geo, f)
        return
    liste = stufen(bild0)
    pruefe_stufen(liste)
    if pruefen:
        return
    leere_ziel(ziel)
    stufenliste, gesamt = schreibe_pyramide(liste, ziel, qualitaet, geo["bogensekunden_pro_pixel"])
    print(f"Gesamtgroesse aller Kacheln: {gesamt} Byte ({gesamt / 1e6:.2f} MB)")
    if gesamt > 20e6:
        print("WARNUNG: ueber 20 MB (A-X6)", file=sys.stderr)
    schreibe_bildnachweis(bildnachweis_pfad, bildnachweis(frame, geo, stufenliste, qualitaet, gesamt, nacht))
    print(f"Bildnachweis {bild_id(frame)} in {bildnachweis_pfad} geschrieben")


def main(argv=None):
    p = argparse.ArgumentParser(description="Mondbild zu Kachelpyramide und Bildnachweis aufbereiten")
    p.add_argument("rohbild", nargs="?", default=None,
                   help="Rohbild (Standard data/roh/svs5587_moon.<frame>.tif)")
    p.add_argument("--frame", type=int, default=FRAME_STANDARD, choices=sorted(FRAMES),
                   help=f"SVS-Frame (Standard {FRAME_STANDARD}, mond_ev)")
    p.add_argument("--alle", action="store_true", help="alle Frames der Tabelle mit Standardpfaden")
    p.add_argument("--ziel", default=None, help="Zielordner der Kacheln (Standard daten/bilder/<ordner>)")
    p.add_argument("--bildnachweis", default=BILDNACHWEIS_STANDARD, help="Pfad zu bilder.json")
    p.add_argument("--qualitaet", type=int, default=QUALITAET_STANDARD, help="WebP-Qualitaet 0 bis 100")
    p.add_argument("--messen", action="store_true",
                   help="nur Fehler und Groesse fuer mehrere Qualitaeten ausgeben, nichts schreiben")
    p.add_argument("--pruefen", action="store_true",
                   help="nur Pyramide rechnen und die Probe (lineares 2x2-Mittel) ausfuehren, nichts schreiben")
    args = p.parse_args(argv)
    if args.alle and (args.rohbild or args.ziel):
        p.error("--alle nimmt die Standardpfade; rohbild und --ziel nur mit --frame")

    for frame in (sorted(FRAMES) if args.alle else [args.frame]):
        ordner = FRAMES[frame]["ordner"]
        bearbeite(frame,
                  args.rohbild or rohbild_standard(frame),
                  args.ziel or os.path.join(ZIEL_BASIS, ordner),
                  args.bildnachweis, args.qualitaet, args.messen, args.pruefen)
    return 0


if __name__ == "__main__":
    sys.exit(main())
