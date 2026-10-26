#!/usr/bin/env python3
"""Mondbild aufbereiten: Kachelpyramide und Bildnachweis (Issue #7, ADR-0003).

Liest das NASA-SVS-Rohbild (Frame 6285 aus SVS 5587 "Moon Phase and Libration
2026", 5760x3240 RGBA), prueft Scheibenlage und Orientierung, zentriert die
Scheibe auf einer quadratischen Leinwand von 3072 px, legt den Alphakanal auf
Schwarz, schwaerzt alles ausserhalb der Scheibe plus kleinem Rand und schreibt
Kacheln von 512 px in Stufen halbierender Aufloesung nach
    daten/bilder/mond/<stufe>/<x>_<y>.webp
Stufe 0 ist die volle Aufloesung (0,643"/px, 3072 px), jede weitere Stufe
halbiert (1536 px, 768 px); es wird abgebrochen, sobald eine Stufe unter
1024 px Gesamtbreite liegt. Danach wird der Eintrag fuer den Mond in
daten/bilder.json geschrieben (bestehende andere Eintraege bleiben erhalten).

Verwendung (aus dem Repo-Root, nur numpy und Pillow noetig):
    python3 tools/mond_kacheln.py                       # Standard-Rohbild
    python3 tools/mond_kacheln.py data/roh/svs5587_moon.6285.tif
    python3 tools/mond_kacheln.py --qualitaet 95        # WebP-Qualitaet 0 bis 100
    python3 tools/mond_kacheln.py --ziel daten/bilder/mond          # Zielordner der Kacheln
    python3 tools/mond_kacheln.py --bildnachweis daten/bilder.json  # Datei fuer den Bildnachweis
    python3 tools/mond_kacheln.py --messen              # nur Qualitaet messen, nichts schreiben

Das Skript ist idempotent: der Zielordner wird vorher geleert (nur Stufen-
ordner mit .webp-Kacheln), der Mond-Eintrag in bilder.json wird ersetzt.

Orientierung: Die SVS-Seite sagt "Celestial north is up in these images";
der Positionswinkel der Mondachse im Frame ist 357,8 Grad, der Mondnordpol
weicht also nur 2,2 Grad von Himmelsnorden ab. Das Skript prueft das am
Bild: beleuchtete Seite rechts (zunehmender Mond, IAU-Osten rechts bei
Norden oben), beleuchteter Anteil nahe 0,59, und die obere Haelfte der
Tagseite ist dunkler als die untere (Mare Imbrium und Serenitatis im
Norden, helles Hochland im Sueden). Es wird nicht gedreht oder gespiegelt.

WebP-Qualitaet: gemessen mit --messen an zwei Streifen von Stufe 0 (400 bzw.
312 px breit, 2000 px hoch), einem am Terminator (Schatten, feine Krater-
kanten, Nachtseite) und einem am hellen Ostrand (harte Kante gegen Schwarz).
Fehler in 8-Bit-Stufen je RGB-Kanal, "Hintergrund" ist der groesste Wert
ausserhalb der Scheibe plus Rand (Ringing ins Schwarze), Pyramide alle Stufen:
    q80: Terminator max 30, mittel 2,04; Ostrand max 25, mittel 1,34; Hintergrund 14; 0,56 MB
    q85: Terminator max 24, mittel 1,79; Ostrand max 21, mittel 1,15; Hintergrund 11; 0,74 MB
    q90: Terminator max 18, mittel 1,36; Ostrand max 17, mittel 0,92; Hintergrund  7; 1,09 MB
    q95: Terminator max 16, mittel 0,96; Ostrand max 12, mittel 0,67; Hintergrund  8; 1,76 MB
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

# Rohbild: Scheibe im SVS-Frame 6285 (Pixelmitte und Durchmesser, siehe
# data/roh/LIESMICH.md). Die Werte werden gegen den Alphakanal geprueft.
ROHBILD_STANDARD = "data/roh/svs5587_moon.6285.tif"
ROH_BREITE, ROH_HOEHE = 5760, 3240
MITTE_X, MITTE_Y = 2877, 1622
DURCHMESSER_PX = 2758
BOGENSEKUNDEN_PRO_PIXEL = 0.643
TOLERANZ_MITTE_PX = 4.0
TOLERANZ_DURCHMESSER_PX = 8.0

# Leinwand und Pyramide
LEINWAND_PX = 3072          # 6 Kacheln, Scheibe plus Rand, Mitte bei 1536/1536
KACHEL_PX = 512
RAND_PX = 4                 # bleibt um die Scheibe stehen, dahinter Schwarz
MIN_BREITE_PX = 1024        # letzte Stufe liegt unter dieser Breite
QUALITAET_STANDARD = 95

# Ziel
ZIEL_STANDARD = os.path.join("daten", "bilder", "mond")
BILDNACHWEIS_STANDARD = os.path.join("daten", "bilder.json")
BILD_ID = "mond_svs5587_6285"

# Ephemeride des Frames aus data/roh/mooninfo_2026.json (Index 6284 = Frame 6285)
FRAME = 6285
ZEITPUNKT_UTC = "2026-09-19T20:00:00Z"
WINKELGROESSE_ARCSEC = 1774.4
PHASE = 0.593
KOLONGITUDE_GRAD = 11.2
SUB_ERDE_BREITE_GRAD = 5.36
SUB_ERDE_LAENGE_GRAD = -0.44
POSITIONSWINKEL_ACHSE_GRAD = 357.8

# Rohdatei (bilder.md Abschnitt 9, Schritt 1)
ROH_SHA256 = "d0d586f67118288e2e9552fb45a26f07d4fb45697ad05b0a7cfc02a5cb42f99d"
ROH_BYTES = 10370890
ROH_ABRUF = "2026-10-23"


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


def pruefe_scheibe(alpha):
    """Scheibenmitte und Durchmesser aus dem Alphakanal, Abgleich mit den Konstanten."""
    a = alpha.astype(np.float64)
    gewicht = a.sum()
    if gewicht <= 0:
        raise SystemExit("Alphakanal ist leer, keine Scheibe gefunden")
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    cx = (xx * a).sum() / gewicht
    cy = (yy * a).sum() / gewicht
    durchmesser = 2.0 * np.sqrt(gewicht / 255.0 / np.pi)
    print(f"Scheibe aus Alpha: Mitte {cx:.1f}/{cy:.1f}, Flaechendurchmesser {durchmesser:.1f} px "
          f"(Vorgabe {MITTE_X}/{MITTE_Y}, {DURCHMESSER_PX} px)")
    if abs(cx - MITTE_X) > TOLERANZ_MITTE_PX or abs(cy - MITTE_Y) > TOLERANZ_MITTE_PX:
        raise SystemExit("Scheibenmitte weicht von der Vorgabe ab; Konstanten pruefen")
    if abs(durchmesser - DURCHMESSER_PX) > TOLERANZ_DURCHMESSER_PX:
        raise SystemExit("Scheibendurchmesser weicht von der Vorgabe ab; Konstanten pruefen")


def pruefe_orientierung(rgb, alpha):
    """Norden oben und Osten rechts anhand der Beleuchtung pruefen (siehe Kopfkommentar)."""
    g = rgb.astype(np.float64).mean(axis=2)
    yy, xx = np.mgrid[0:g.shape[0], 0:g.shape[1]]
    r = DURCHMESSER_PX / 2.0
    scheibe = (np.hypot(xx - MITTE_X, yy - MITTE_Y) < r - 10) & (alpha == 255)
    links = scheibe & (xx < MITTE_X)
    rechts = scheibe & (xx > MITTE_X)
    tag = scheibe & (g > 30)
    anteil = tag.sum() / scheibe.sum()
    oben = (tag & (yy < MITTE_Y) & (xx > MITTE_X + 200))
    unten = (tag & (yy > MITTE_Y) & (xx > MITTE_X + 200))
    m_links, m_rechts = g[links].mean(), g[rechts].mean()
    m_oben, m_unten = g[oben].mean(), g[unten].mean()
    print(f"Orientierung: Helligkeit links {m_links:.1f}, rechts {m_rechts:.1f}; "
          f"beleuchteter Anteil {anteil:.3f} (Ephemeride {PHASE}); "
          f"Tagseite oben {m_oben:.1f}, unten {m_unten:.1f}")
    if m_rechts < 3 * m_links:
        raise SystemExit("Beleuchtete Seite ist nicht rechts; Bild waere gespiegelt oder falsche Phase")
    if abs(anteil - PHASE) > 0.05:
        raise SystemExit("Beleuchteter Anteil passt nicht zur Ephemeride; falscher Frame?")
    if m_oben >= m_unten:
        raise SystemExit("Obere Tagseite ist nicht dunkler als untere; Norden scheint nicht oben")


def zentriere_und_schwaerze(rgba):
    """Quadratische Leinwand um die Scheibenmitte, Alpha auf Schwarz, Hintergrund genullt."""
    halb = LEINWAND_PX // 2
    x0, y0 = MITTE_X - halb, MITTE_Y - halb
    if x0 < 0 or y0 < 0 or x0 + LEINWAND_PX > ROH_BREITE or y0 + LEINWAND_PX > ROH_HOEHE:
        raise SystemExit("Leinwand ragt ueber das Rohbild hinaus")
    aus = rgba[y0:y0 + LEINWAND_PX, x0:x0 + LEINWAND_PX]
    rgb = aus[..., :3].astype(np.float32)
    alpha = aus[..., 3:4].astype(np.float32) / 255.0
    bild = rgb * alpha                      # straight alpha ueber Schwarz
    yy, xx = np.mgrid[0:LEINWAND_PX, 0:LEINWAND_PX]
    aussen = np.hypot(xx - halb, yy - halb) > DURCHMESSER_PX / 2.0 + RAND_PX
    bild[aussen] = 0.0
    return np.rint(bild).clip(0, 255).astype(np.uint8)


def halbiere(bild):
    """Flaechenmittel 2x2; Breite und Hoehe muessen gerade sein."""
    h, w = bild.shape[:2]
    if h % 2 or w % 2:
        raise SystemExit(f"Stufe mit ungerader Groesse {w}x{h} laesst sich nicht halbieren")
    b = bild.reshape(h // 2, 2, w // 2, 2, 3).astype(np.float32).mean(axis=(1, 3))
    return np.rint(b).clip(0, 255).astype(np.uint8)


def stufen(bild0):
    """Liste (stufe, bild) von voller Aufloesung bis unter MIN_BREITE_PX."""
    liste = [(0, bild0)]
    while liste[-1][1].shape[1] >= MIN_BREITE_PX:
        s, b = liste[-1]
        liste.append((s + 1, halbiere(b)))
    return liste


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


def schreibe_pyramide(liste, ordner, qualitaet):
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
        massstab = BOGENSEKUNDEN_PRO_PIXEL * 2 ** s
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


def messe_qualitaet(bild0, qualitaeten):
    """Fehler gegen das Original in zwei Streifen von Stufe 0 und Groesse der ganzen Pyramide."""
    halb = LEINWAND_PX // 2
    r = DURCHMESSER_PX / 2.0
    # Terminator: geometrisch bei x = Mitte - r * sin(Kolongitude - Sub-Erde-Laenge)
    xt = int(round(halb - r * np.sin(np.radians(KOLONGITUDE_GRAD - SUB_ERDE_LAENGE_GRAD))))
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


def bildnachweis(stufenliste, qualitaet, gesamt_bytes):
    """Eintrag fuer daten/bilder.json nach docs/recherche/bilder.md Abschnitt 8."""
    return {
        "id": BILD_ID,
        "objekt": "mond",
        "zustand": "mond_ev",
        "datei": "mond/",
        "quelle_url": "https://svs.gsfc.nasa.gov/5587",
        "quelle_datei": f"frames/5760x3240_16x9_30p/plain/moon.{FRAME}.tif",
        "mission": "LRO / NASA SVS",
        "instrument": "Rendering aus LOLA-Hoehenmodell und LROC-WAC-Farbmosaik, Ephemeride JPL DE421",
        "aufnahmedatum": ZEITPUNKT_UTC,
        "lizenz": "Public Domain (NASA)",
        "lizenz_url": "https://svs.gsfc.nasa.gov/help/",
        "namensnennung": "NASA Scientific Visualization Studio. Visualizer: Ernie Wright (USRA). "
                         "Planetary scientist: Noah Petro (NASA/GSFC). Producer: James Tralie (eMITS).",
        "pixel_breite": LEINWAND_PX,
        "pixel_hoehe": LEINWAND_PX,
        "original_pixel": f"{ROH_BREITE}x{ROH_HOEHE}",
        "winkelgroesse_arcsec": WINKELGROESSE_ARCSEC,
        "objekt_durchmesser_px": DURCHMESSER_PX,
        "bogensekunden_pro_pixel": BOGENSEKUNDEN_PRO_PIXEL,
        "norden_oben": True,
        "sub_erde_breite_grad": SUB_ERDE_BREITE_GRAD,
        "sub_erde_laenge_grad": SUB_ERDE_LAENGE_GRAD,
        "phase": PHASE,
        "kolongitude_grad": KOLONGITUDE_GRAD,
        "positionswinkel_achse_grad": POSITIONSWINKEL_ACHSE_GRAD,
        "bearbeitung": (
            f"Quadratischer Ausschnitt {LEINWAND_PX} px um die Scheibenmitte (Pixel {MITTE_X}/{MITTE_Y} "
            f"des Rohbilds), Alphakanal auf Schwarz gelegt, ausserhalb der Scheibe plus {RAND_PX} px Rand "
            f"auf Schwarz gesetzt, nicht gedreht oder gespiegelt (Himmelsnorden oben laut SVS, "
            f"Positionswinkel der Achse {POSITIONSWINKEL_ACHSE_GRAD} Grad), keine Farb- oder "
            f"Kontrastaenderung, in Kacheln von {KACHEL_PX} px mit {len(stufenliste)} Stufen zerlegt "
            f"(WebP, Qualitaet {qualitaet}). Stufe n hat das 2^n-fache Pixelmass von Stufe 0."
        ),
        "kacheln": {
            "kachel_px": KACHEL_PX,
            "format": "webp",
            "qualitaet": qualitaet,
            "muster": "{stufe}/{x}_{y}.webp",
            "gesamt_bytes": gesamt_bytes,
            "stufen": stufenliste,
        },
        "hinweise": (
            "Rendering, zugelassen als Ausnahme A-X9 (ADR-0002). Winkelgroesse 1774,4\" ist die des "
            "Rendering-Zeitpunkts; der Zustand mond_ev zeigt 1865\". Scheibendurchmesser gemessen: "
            "Flaechendurchmesser aus dem Alphakanal 2753,8 px, Bounding-Box 2753x2757 px (Alpha >= 128); "
            "verwendet wird die SVS-Vorgabe 2758 px. Nachtseite ist im Rendering "
            "schwach aufgehellt (etwa 5 Prozent der Tagseite), unveraendert uebernommen. "
            f"Rohdatei moon.{FRAME}.tif: {ROH_BYTES} Byte, SHA-256 {ROH_SHA256}, abgerufen {ROH_ABRUF}. "
            "Die SVS-Seite hat keine einzelne Credit-Zeile; Namensnennung aus dem Abschnitt Credits."
        ),
    }


def schreibe_bildnachweis(pfad, eintrag):
    """Mond-Eintrag ersetzen oder anhaengen, andere Eintraege erhalten."""
    liste = []
    if os.path.isfile(pfad):
        with open(pfad, encoding="utf-8") as f:
            liste = json.load(f)
        if not isinstance(liste, list):
            raise SystemExit(f"{pfad} enthaelt keine Liste")
    liste = [e for e in liste if e.get("id") != eintrag["id"]]
    liste.append(eintrag)
    os.makedirs(os.path.dirname(pfad) or ".", exist_ok=True)
    with open(pfad, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(argv=None):
    p = argparse.ArgumentParser(description="Mondbild zu Kachelpyramide und Bildnachweis aufbereiten")
    p.add_argument("rohbild", nargs="?", default=ROHBILD_STANDARD)
    p.add_argument("--ziel", default=ZIEL_STANDARD, help="Zielordner der Kacheln")
    p.add_argument("--bildnachweis", default=BILDNACHWEIS_STANDARD, help="Pfad zu bilder.json")
    p.add_argument("--qualitaet", type=int, default=QUALITAET_STANDARD, help="WebP-Qualitaet 0 bis 100")
    p.add_argument("--messen", action="store_true",
                   help="nur Fehler und Groesse fuer mehrere Qualitaeten ausgeben, nichts schreiben")
    args = p.parse_args(argv)

    print(f"Rohbild: {args.rohbild}")
    rgba = lade_rohbild(args.rohbild)
    pruefe_scheibe(rgba[..., 3])
    pruefe_orientierung(rgba[..., :3], rgba[..., 3])
    bild0 = zentriere_und_schwaerze(rgba)
    del rgba

    if args.messen:
        messe_qualitaet(bild0, (80, 85, 90, 95, 98))
        return 0

    leere_ziel(args.ziel)
    stufenliste, gesamt = schreibe_pyramide(stufen(bild0), args.ziel, args.qualitaet)
    print(f"Gesamtgroesse aller Kacheln: {gesamt} Byte ({gesamt / 1e6:.2f} MB)")
    if gesamt > 20e6:
        print("WARNUNG: ueber 20 MB (A-X6)", file=sys.stderr)
    schreibe_bildnachweis(args.bildnachweis, bildnachweis(stufenliste, args.qualitaet, gesamt))
    print(f"Bildnachweis {BILD_ID} in {args.bildnachweis} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
