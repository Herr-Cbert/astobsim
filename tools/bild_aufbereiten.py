#!/usr/bin/env python3
"""Planetenbild aufbereiten: Einzelbild und Bildnachweis (Issue #12 und #13, ADR-0003).

Liest je Bild eine kleine Parameterdatei (JSON, unter tools/parameter/), laedt
das Rohbild aus data/roh/, prueft Masse, Pruefsumme und Scheibenlage und
schreibt ein WebP nach daten/bilder/<datei> (quadratisch, ausser die
Parameterdatei nennt leinwand_hoehe_px):
    - Farbraum nach sRGB (eingebettetes ICC-Profil, z. B. Adobe RGB 1998,
      farbmetrisch umgerechnet; ohne Profil gilt das Rohbild als sRGB),
    - optional ausrichten (Planetennorden oben, ADR-0003): spiegeln (true:
      links-rechts) und danach drehung_grad (gegen den Uhrzeigersinn positiv,
      um die Bildmitte, Bild vergroessert, damit nichts abgeschnitten wird),
      bikubisch in linearem Licht; ohne diese Felder wird nichts gedreht,
    - Scheibenmitte auf die Leinwandmitte (Randkoordinate leinwand_px / 2,
      wie QuelleEinzelbild und QuelleKacheln sie annehmen),
    - Skalierung auf ziel_durchmesser_px (600 bis 1200 px, bilder.md
      Abschnitt 9, Schritt 7), gerechnet in linearem Licht mit Lanczos,
    - ausserhalb der Scheibe plus rand_px Rand schwarz; mit roh_ring_aussen_px
      (Saturn) bleibt zusaetzlich die Ellipse des aeusseren Ringrands
      (roh_ring_aussen_px x roh_ring_aussen_klein_px) plus Rand erhalten,
    - die Orientierung belegt die Parameterdatei (Feld orientierung), was die
      Maske entfernt (Monde, Beschriftungen) das Feld entfernt; beides landet
      im Feld bearbeitung.
Alle roh_*-Koordinaten gelten im ausgerichteten Rohbild (nach Spiegeln und
Drehen); ohne Ausrichtung ist das das Rohbild selbst.
Die Namensnennung ist die Credit-Zeile der Parameterdatei woertlich; bei
CC-Lizenzen haengt das Skript "; bearbeitet: <aenderungsvermerk>" an
(Pflichtfeld aenderungsvermerk, bilder.md Abschnitt 9, Schritt 8).
Danach wird der Eintrag mit der id der Parameterdatei in daten/bilder.json
ersetzt oder angehaengt; andere Eintraege bleiben erhalten.

Verwendung (aus dem Repo-Root, nur numpy und Pillow noetig):
    python3 tools/bild_aufbereiten.py tools/parameter/*.json
    python3 tools/bild_aufbereiten.py tools/parameter/mars_hst_20030826.json --messen
    python3 tools/bild_aufbereiten.py ... --vorschau ordner/   # verkleinerte PNG-Vorschau
    python3 tools/bild_aufbereiten.py ... --ziel daten/bilder --bildnachweis daten/bilder.json

--messen misst nur Scheibe und WebP-Fehler fuer mehrere Qualitaeten und
schreibt nichts. Das Skript ist idempotent: gleiche Eingaben ergeben
dieselben Dateien und denselben Eintrag.

Ringmessung (mit roh_ring_aussen_px): die Spalte durch die Mitte liefert
Nord- und Suedrand der Kugel (die Ringe liegen bei mittlerer Oeffnung
innerhalb), die Zeile durch die Mitte aussen den Ringrand (grosse Achse) und
von der Mitte nach aussen den Aequatorrand der Kugel (im Spalt vor dem
C-Ring). Schwelle: Haelfte der mittleren Helligkeit der Spalte im Bereich
0,85 bis 0,95 der oberen Halbhoehe (nur Kugel). Geprueft wird ausserdem das
Verhaeltnis Ringrand zu Kugel gegen 2,269 (A-Ring aussen 136 770 km in
Saturnradien, docs/recherche/objekte.md 1.1) auf 1 Prozent.

Scheibenmessung: Mitte und Aequatordurchmesser aus den Kanten in Zeilen und
Spalten durch den Helligkeitsschwerpunkt, Kante bei der Haelfte der mittleren
Helligkeit im Ring 0,85 bis 0,95 Radius (Rand mit Randverdunklung und Dunst).
Die Parameterdatei nennt Mitte und Durchmesser (roh_mitte_px, Pixelindex,
Zentrum von Pixel 0 bei 0; roh_durchmesser_px); weicht die Messung um mehr
als die Toleranz ab, bricht das Skript ab. Verwendet werden die Werte der
Parameterdatei, damit das Ergebnis nicht an der Messung haengt.

WebP-Qualitaet: wie beim Mond 95 (tools/mond_kacheln.py). Gemessen mit
--messen an der ganzen Leinwand, Fehler in 8-Bit-Stufen je RGB-Kanal,
"Hintergrund" ist der groesste Wert ausserhalb der Scheibe plus Rand:
    Mars 2003 (768 px): q85 mittel 1,40, 26 KB; q90 mittel 1,25, 41 KB;
                        q95 mittel 1,00, Hintergrund 24, 78 KB; q98 mittel 0,93, 102 KB
    Mars 2016 (960 px): q85 mittel 1,00, 31 KB; q90 mittel 0,87, 42 KB;
                        q95 mittel 0,71, Hintergrund 6, 73 KB; q98 mittel 0,66, 92 KB
    verlustfrei: Fehler 0, 423 KB bzw. 482 KB
Der Maximalfehler (50 bis 60 Stufen) ist in allen Qualitaeten gleich: er
sitzt an rund 130 Pixeln des blauen Dunstsaums am Rand gegen Schwarz und
kommt von der Farbunterabtastung (4:2:0) des verlustbehafteten WebP, nicht
von der Qualitaet. In 2-fach vergroesserten Randausschnitten ist kein
Unterschied zu sehen; die PSF verschmiert den Rand ohnehin ueber mehrere
Pixel. Weichen die Werte ab, Kommentar nachfuehren.
"""

import argparse
import hashlib
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageCms

BILDNACHWEIS_STANDARD = os.path.join("daten", "bilder.json")
ZIEL_STANDARD = os.path.join("daten", "bilder")
TOLERANZ_MITTE_PX = 2.0
TOLERANZ_DURCHMESSER_PX = 3.0
RING_AUSSEN_SATURNRADIEN = 2.269  # docs/recherche/objekte.md 1.1, Quelle [6]
TOLERANZ_RINGVERHAELTNIS = 0.01
MIN_DURCHMESSER_PX = 600
MAX_DURCHMESSER_PX = 1200
RAND_PX_STANDARD = 4
QUALITAET_STANDARD = 95

PFLICHT = [
    "id", "objekt", "zustand", "datei", "rohbild", "roh_url", "roh_sha256", "roh_bytes", "roh_abruf",
    "original_pixel", "roh_mitte_px", "roh_durchmesser_px", "ziel_durchmesser_px", "leinwand_px",
    "native_bogensekunden_pro_pixel", "native_instrument", "quelle_url", "mission", "instrument",
    "aufnahmedatum", "lizenz", "lizenz_url", "namensnennung", "winkelgroesse_arcsec", "orientierung",
]
# Felder, die unveraendert aus der Parameterdatei in den Nachweis gehen (sofern vorhanden).
ZUSATZ = ["sub_erde_breite_grad", "sub_erde_laenge_grad", "phase", "positionswinkel_achse_grad"]


def lade_parameter(pfad):
    with open(pfad, encoding="utf-8") as f:
        p = json.load(f)
    fehlt = [k for k in PFLICHT if k not in p]
    if fehlt:
        raise SystemExit(f"{pfad}: Pflichtfelder fehlen: {', '.join(fehlt)}")
    d = p["ziel_durchmesser_px"]
    if not (MIN_DURCHMESSER_PX <= d <= MAX_DURCHMESSER_PX) or int(d) != d:
        raise SystemExit(f"{pfad}: ziel_durchmesser_px {d} liegt nicht in {MIN_DURCHMESSER_PX} bis {MAX_DURCHMESSER_PX}")
    if p["leinwand_px"] < d + 2 * p.get("rand_px", RAND_PX_STANDARD):
        raise SystemExit(f"{pfad}: leinwand_px {p['leinwand_px']} ist kleiner als die Scheibe plus Rand")
    if p["leinwand_px"] % 2 or p.get("leinwand_hoehe_px", 0) % 2:
        raise SystemExit(f"{pfad}: leinwand_px und leinwand_hoehe_px muessen gerade sein (Scheibenmitte auf einer Pixelgrenze)")
    if ("roh_ring_aussen_px" in p) != ("roh_ring_aussen_klein_px" in p):
        raise SystemExit(f"{pfad}: roh_ring_aussen_px und roh_ring_aussen_klein_px nur gemeinsam")
    breite, hoehe = maskenhalbachsen(p, d / p["roh_durchmesser_px"])
    if p["leinwand_px"] < 2 * breite or leinwand_hoehe(p) < 2 * hoehe:
        raise SystemExit(f"{pfad}: Leinwand {p['leinwand_px']}x{leinwand_hoehe(p)} ist kleiner als die Maske "
                         f"{2 * breite:.0f}x{2 * hoehe:.0f} px")
    if not isinstance(p.get("spiegeln", False), bool):
        raise SystemExit(f"{pfad}: spiegeln muss true oder false sein")
    if "CC" in p["lizenz"] and not p.get("aenderungsvermerk"):
        raise SystemExit(f"{pfad}: CC-Lizenz verlangt aenderungsvermerk (bilder.md Abschnitt 9, Schritt 8)")
    if not p["datei"].endswith(".webp") or p["datei"].startswith("/") or ".." in p["datei"]:
        raise SystemExit(f"{pfad}: datei muss ein relativer Pfad unter daten/bilder/ auf .webp sein")
    return p


def lade_rohbild(p):
    """Rohbild als float32 HxWx3 in sRGB-Kodewerten 0..255, plus Name des Quellfarbraums."""
    pfad = p["rohbild"]
    if not os.path.isfile(pfad):
        raise SystemExit(f"Rohbild nicht gefunden: {pfad} (Herkunft und Abruf: data/roh/LIESMICH.md)")
    with open(pfad, "rb") as f:
        roh = f.read()
    if len(roh) != p["roh_bytes"] or hashlib.sha256(roh).hexdigest() != p["roh_sha256"]:
        raise SystemExit(f"Rohbild {pfad}: Groesse oder SHA-256 passen nicht zur Parameterdatei (anderer Abruf?)")
    with Image.open(io.BytesIO(roh)) as im:
        if f"{im.size[0]}x{im.size[1]}" != p["original_pixel"]:
            raise SystemExit(f"Rohbild hat {im.size}, erwartet {p['original_pixel']}")
        im = im.convert("RGB") if im.mode != "RGB" else im.copy()
        icc = im.info.get("icc_profile") or Image.open(io.BytesIO(roh)).info.get("icc_profile")
    farbraum = "sRGB (kein eingebettetes Profil)"
    if icc:
        quelle = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        name = ImageCms.getProfileDescription(quelle).strip()
        farbraum = name
        if "srgb" not in name.lower():
            ziel = ImageCms.createProfile("sRGB")
            im = ImageCms.profileToProfile(im, quelle, ziel, renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,
                                           outputMode="RGB")
    return np.asarray(im).astype(np.float32), farbraum


def leinwand_hoehe(p):
    return p.get("leinwand_hoehe_px", p["leinwand_px"])


def maskenhalbachsen(p, faktor):
    """Halbe Breite und Hoehe der erhaltenen Flaeche in Zielpixeln (Scheibe bzw. Ringellipse, ohne Rand)."""
    r = p["ziel_durchmesser_px"] / 2 + p.get("rand_px", RAND_PX_STANDARD)
    if "roh_ring_aussen_px" not in p:
        return r, r
    rand = p.get("rand_px", RAND_PX_STANDARD)
    return max(r, p["roh_ring_aussen_px"] * faktor / 2 + rand), max(r, p["roh_ring_aussen_klein_px"] * faktor / 2 + rand)


def ausrichten(p, rgb):
    """Spiegeln und Drehen nach der Parameterdatei, bikubisch in linearem Licht; ohne Felder unveraendert."""
    winkel = p.get("drehung_grad", 0.0)
    if not p.get("spiegeln", False) and winkel == 0:
        return rgb
    linear = srgb_zu_linear(rgb)
    if p.get("spiegeln", False):
        linear = linear[:, ::-1]
    if winkel != 0:
        kanaele = [Image.fromarray(np.ascontiguousarray(linear[..., c]), "F").rotate(
            winkel, resample=Image.BICUBIC, expand=True) for c in range(3)]
        linear = np.dstack([np.asarray(k) for k in kanaele])
    w = np.clip(linear, 0.0, 1.0)
    return (np.where(w <= 0.0031308, w * 12.92, 1.055 * w ** (1 / 2.4) - 0.055) * 255.0).astype(np.float32)


def srgb_zu_linear(kodewert):
    w = kodewert / 255.0
    return np.where(w <= 0.04045, w / 12.92, ((w + 0.055) / 1.055) ** 2.4).astype(np.float32)


def linear_zu_srgb(linear):
    w = np.clip(linear, 0.0, 1.0)
    s = np.where(w <= 0.0031308, w * 12.92, 1.055 * w ** (1 / 2.4) - 0.055)
    return np.rint(s * 255.0).clip(0, 255).astype(np.uint8)


def kanten(profil, schwelle):
    """Erste und letzte Position (Sub-Pixel, linear interpoliert), an der profil die Schwelle kreuzt."""
    ueber = np.nonzero(profil >= schwelle)[0]
    if len(ueber) == 0:
        return None
    a, b = ueber[0], ueber[-1]

    def kreuzung(i0, i1):
        v0, v1 = profil[i0], profil[i1]
        return i0 + (schwelle - v0) / (v1 - v0) if v1 != v0 else float(i0)

    links = kreuzung(a - 1, a) if a > 0 else float(a)
    rechts = kreuzung(b, b + 1) if b + 1 < len(profil) else float(b)
    return links, rechts


def miss_scheibe(rgb):
    """Mitte (Pixelindex) und Durchmesser in x und y aus den Halbwertskanten (siehe Kopfkommentar)."""
    g = rgb.mean(axis=2)
    maske = g > 10
    if maske.sum() == 0:
        raise SystemExit("Keine Scheibe im Rohbild gefunden")
    yy, xx = np.mgrid[0:g.shape[0], 0:g.shape[1]]
    cx, cy = xx[maske].mean(), yy[maske].mean()
    r = np.sqrt(maske.sum() / np.pi)
    ring = (np.hypot(xx - cx, yy - cy) > 0.85 * r) & (np.hypot(xx - cx, yy - cy) < 0.95 * r)
    schwelle = 0.5 * g[ring].mean()
    for _ in range(3):
        # Mittel ueber 5 Zeilen bzw. Spalten durch die Mitte, iteriert, bis die Mitte steht.
        zy, zx = int(round(cy)), int(round(cx))
        zeile = g[zy - 2:zy + 3].mean(axis=0)
        spalte = g[:, zx - 2:zx + 3].mean(axis=1)
        kx, ky = kanten(zeile, schwelle), kanten(spalte, schwelle)
        if kx is None or ky is None:
            raise SystemExit(f"Keine Scheibenkante durch die Mitte {cx:.1f}/{cy:.1f} gefunden (Schwelle {schwelle:.1f}); "
                             "Rohbild und roh_mitte_px pruefen")
        (x0, x1), (y0, y1) = kx, ky
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    # Kreuzungen liegen zwischen Pixelzentren; der Durchmesser ist der Abstand der Kanten.
    return {"mitte": (cx, cy), "breite": x1 - x0, "hoehe": y1 - y0, "schwelle": schwelle}


def miss_ring(rgb):
    """Saturn: Mitte, Aequatordurchmesser der Kugel und grosse Achse des Ringrands (siehe Kopfkommentar)."""
    g = rgb.mean(axis=2)
    maske = g > 10
    if maske.sum() == 0:
        raise SystemExit("Keine Scheibe im Rohbild gefunden")
    yy, xx = np.nonzero(maske)
    cx, cy = xx.mean(), yy.mean()
    schwelle = 10.0
    for _ in range(4):
        zy, zx = int(round(cy)), int(round(cx))
        zeile = g[zy - 2:zy + 3].mean(axis=0)
        spalte = g[:, zx - 2:zx + 3].mean(axis=1)
        ky, kx = kanten(spalte, schwelle), kanten(zeile, schwelle)
        if kx is None or ky is None:
            raise SystemExit("Keine Kante durch die Mitte gefunden; Rohbild und roh_mitte_px pruefen")
        (y0, y1), (r0, r1) = ky, kx
        cx, cy = (r0 + r1) / 2, (y0 + y1) / 2
        halb = cy - y0
        oben = spalte[int(round(cy - 0.95 * halb)):int(round(cy - 0.85 * halb)) + 1]
        schwelle = 0.5 * oben.mean()
    # Aequatorrand der Kugel: von der Mitte nach aussen die erste Unterschreitung der Schwelle.
    zx = int(round(cx))

    def nach_aussen(schritt):
        i = zx
        while 0 < i < len(zeile) - 1 and zeile[i] >= schwelle:
            i += schritt
        v0, v1 = zeile[i - schritt], zeile[i]
        return i - schritt + schritt * (v0 - schwelle) / (v0 - v1)

    k0, k1 = nach_aussen(-1), nach_aussen(1)
    return {"mitte": (cx, cy), "breite": k1 - k0, "hoehe": y1 - y0, "ring": r1 - r0, "schwelle": schwelle}


def pruefe_scheibe(p, messung):
    mx, my = p["roh_mitte_px"]
    cx, cy = messung["mitte"]
    print(f"Scheibe gemessen: Mitte {cx:.2f}/{cy:.2f}, Durchmesser x {messung['breite']:.2f} px, "
          f"y {messung['hoehe']:.2f} px (Schwelle {messung['schwelle']:.1f}); Vorgabe Mitte {mx}/{my}, "
          f"Durchmesser {p['roh_durchmesser_px']} px")
    if abs(cx - mx) > TOLERANZ_MITTE_PX or abs(cy - my) > TOLERANZ_MITTE_PX:
        raise SystemExit("Scheibenmitte weicht von roh_mitte_px ab; Parameterdatei pruefen")
    if abs(messung["breite"] - p["roh_durchmesser_px"]) > TOLERANZ_DURCHMESSER_PX:
        raise SystemExit("Aequatordurchmesser weicht von roh_durchmesser_px ab; Parameterdatei pruefen")
    if "roh_ring_aussen_px" in p:
        verhaeltnis = p["roh_ring_aussen_px"] / p["roh_durchmesser_px"]
        print(f"Ringrand gemessen {messung['ring']:.2f} px, Vorgabe {p['roh_ring_aussen_px']} px; "
              f"Ringrand / Kugel {verhaeltnis:.4f} (erwartet {RING_AUSSEN_SATURNRADIEN})")
        if abs(messung["ring"] - p["roh_ring_aussen_px"]) > TOLERANZ_DURCHMESSER_PX:
            raise SystemExit("Ringrand weicht von roh_ring_aussen_px ab; Parameterdatei pruefen")
        if abs(verhaeltnis / RING_AUSSEN_SATURNRADIEN - 1) > TOLERANZ_RINGVERHAELTNIS:
            raise SystemExit("Ringrand passt nicht zu 2,269 Kugelradien; Massstab pruefen")


def leinwand(p, rgb):
    """Zentrierte, skalierte Leinwand in sRGB-Kodewerten (uint8), Hintergrund schwarz."""
    n, h = p["leinwand_px"], leinwand_hoehe(p)
    faktor = p["ziel_durchmesser_px"] / p["roh_durchmesser_px"]
    mx, my = p["roh_mitte_px"]
    linear = srgb_zu_linear(rgb)
    # Pillow-Boxkoordinaten sind Randkoordinaten: Pixelzentrum i liegt bei i + 0,5.
    halb, halb_h = n / 2 / faktor, h / 2 / faktor
    bx, by = mx + 0.5, my + 0.5
    rand = int(np.ceil(max(halb, halb_h))) + 2
    gepolstert = np.zeros((linear.shape[0] + 2 * rand, linear.shape[1] + 2 * rand, 3), np.float32)
    gepolstert[rand:rand + linear.shape[0], rand:rand + linear.shape[1]] = linear
    box = (bx - halb + rand, by - halb_h + rand, bx + halb + rand, by + halb_h + rand)
    kanaele = [Image.fromarray(np.ascontiguousarray(gepolstert[..., c]), "F").resize((n, h), Image.LANCZOS, box=box)
               for c in range(3)]
    aus = np.dstack([np.asarray(k) for k in kanaele])
    aus[~erhalten(p, faktor)] = 0.0
    return linear_zu_srgb(aus), faktor


def erhalten(p, faktor):
    """Maske der erhaltenen Pixel: Scheibe plus Rand, bei Saturn vereinigt mit der Ringellipse plus Rand."""
    n, h = p["leinwand_px"], leinwand_hoehe(p)
    yy, xx = np.mgrid[0:h, 0:n]
    dx, dy = xx + 0.5 - n / 2, yy + 0.5 - h / 2
    rand = p.get("rand_px", RAND_PX_STANDARD)
    maske = np.hypot(dx, dy) <= p["ziel_durchmesser_px"] / 2 + rand
    if "roh_ring_aussen_px" in p:
        a = p["roh_ring_aussen_px"] * faktor / 2 + rand
        b = p["roh_ring_aussen_klein_px"] * faktor / 2 + rand
        maske |= (dx / a) ** 2 + (dy / b) ** 2 <= 1.0
    return maske


def webp_bytes(bild, qualitaet):
    puffer = io.BytesIO()
    Image.fromarray(bild, "RGB").save(puffer, "WEBP", quality=qualitaet, method=6)
    return puffer.getvalue()


def messe_qualitaet(bild, p):
    aussen = ~erhalten(p, p["ziel_durchmesser_px"] / p["roh_durchmesser_px"])
    for q in (85, 90, 95, 98):
        daten = webp_bytes(bild, q)
        dek = np.asarray(Image.open(io.BytesIO(daten)).convert("RGB")).astype(np.int16)
        diff = np.abs(dek - bild.astype(np.int16))
        print(f"q{q}: max {diff.max()}, mittel {diff.mean():.2f}, Hintergrund max {dek[aussen].max()}, "
              f"{len(daten)} Byte")


def bildnachweis(p, farbraum, faktor, datei_bytes):
    d = p["ziel_durchmesser_px"]
    n, h = p["leinwand_px"], leinwand_hoehe(p)
    winkel = p["winkelgroesse_arcsec"]
    nativ_px = winkel / p["native_bogensekunden_pro_pixel"]
    hoch_roh = p["roh_durchmesser_px"] / nativ_px
    hoch_ziel = d / nativ_px
    qualitaet = p.get("qualitaet", QUALITAET_STANDARD)
    farbe = (f"Farbraum {farbraum} farbmetrisch nach sRGB umgerechnet (relativ farbmetrisch), sonst keine Farb- "
             f"oder Kontrastaenderung" if "srgb" not in farbraum.lower()
             else "keine Farb- oder Kontrastaenderung (Rohbild sRGB)")
    skalierung = ("nicht skaliert" if abs(faktor - 1) < 1e-9
                  else f"in linearem Licht mit Lanczos um den Faktor {faktor:.4f} skaliert")
    rand = p.get("rand_px", RAND_PX_STANDARD)
    ausrichtung = []
    if p.get("spiegeln", False):
        ausrichtung.append("links-rechts gespiegelt")
    if p.get("drehung_grad", 0):
        w = p["drehung_grad"]
        ausrichtung.append(f"um {abs(w)} Grad {'gegen den' if w > 0 else 'im'} Uhrzeigersinn gedreht "
                           f"(bikubisch in linearem Licht)")
    if ausrichtung:
        vorher = f"Rohbild {p['original_pixel']} {' und '.join(ausrichtung)}; darin Scheibe"
        bezug = "im ausgerichteten Rohbild"
    else:
        vorher = "Scheibe"
        bezug = f"im Rohbild {p['original_pixel']}"
    if "roh_ring_aussen_px" in p:
        ring = (f", aeusserer Ringrand {p['roh_ring_aussen_px']} x {p['roh_ring_aussen_klein_px']} px, "
                f"Verhaeltnis zur Kugel {p['roh_ring_aussen_px'] / p['roh_durchmesser_px']:.3f} gegen 2,269 geprueft")
        maske = f"ausserhalb der Scheibe und der Ringellipse plus je {rand} px Rand"
    else:
        ring = ""
        maske = f"ausserhalb der Scheibe plus {rand} px Rand"
    entfernt = f"; durch die Maske entfernt: {p['entfernt']}" if p.get("entfernt") else ""
    gedreht = "" if ausrichtung else "; nicht gedreht oder gespiegelt"
    bearbeitung = (
        f"{vorher} (Mitte {p['roh_mitte_px'][0]}/{p['roh_mitte_px'][1]}, Aequatordurchmesser "
        f"{p['roh_durchmesser_px']} px {bezug}{ring}) auf die Mitte einer Leinwand von "
        f"{n}x{h} px gelegt und {skalierung} auf {d} px Scheibendurchmesser; {maske} auf Schwarz gesetzt; "
        f"{farbe}{gedreht}{entfernt}. {p['orientierung']} WebP verlustbehaftet, Qualitaet {qualitaet} "
        f"(tools/bild_aufbereiten.py)."
    )
    hinweise = (
        f"Hochskalierung gegen die native Aufloesung ({p['native_instrument']}, "
        f"{p['native_bogensekunden_pro_pixel']}\"/px, also {nativ_px:.0f} px Scheibe): Rohbild {hoch_roh:.2f}-fach, "
        f"Repo-Datei {hoch_ziel:.2f}-fach. Rohdatei {os.path.basename(p['rohbild'])} von {p['roh_url']}: "
        f"{p['roh_bytes']} Byte, SHA-256 {p['roh_sha256']}, abgerufen {p['roh_abruf']}."
    )
    if p.get("hinweise"):
        hinweise = p["hinweise"] + " " + hinweise
    eintrag = {
        "id": p["id"],
        "objekt": p["objekt"],
        "zustand": p["zustand"],
        "datei": p["datei"],
        "quelle_url": p["quelle_url"],
    }
    if p.get("quelle_datei"):
        eintrag["quelle_datei"] = p["quelle_datei"]
    eintrag.update({
        "mission": p["mission"],
        "instrument": p["instrument"],
        "aufnahmedatum": p["aufnahmedatum"],
        "lizenz": p["lizenz"],
        "lizenz_url": p["lizenz_url"],
        "namensnennung": namensnennung(p),
        "pixel_breite": n,
        "pixel_hoehe": h,
        "original_pixel": p["original_pixel"],
        "winkelgroesse_arcsec": winkel,
    })
    if "roh_ring_aussen_px" in p:
        eintrag["ringe_arcsec"] = round(winkel * p["roh_ring_aussen_px"] / p["roh_durchmesser_px"], 2)
    eintrag.update({
        "objekt_durchmesser_px": d,
        "bogensekunden_pro_pixel": round(winkel / d, 6),
        "norden_oben": True,
    })
    for feld in ZUSATZ:
        if feld in p:
            eintrag[feld] = p[feld]
    eintrag["datei_bytes"] = datei_bytes
    eintrag["bearbeitung"] = bearbeitung
    eintrag["hinweise"] = hinweise
    return eintrag


def namensnennung(p):
    """Credit-Zeile woertlich, bei CC-Lizenzen gefolgt vom Aenderungsvermerk (bilder.md 9, Schritt 8)."""
    if p.get("aenderungsvermerk"):
        return f"{p['namensnennung']}; bearbeitet: {p['aenderungsvermerk']}"
    return p["namensnennung"]


def schreibe_bildnachweis(pfad, eintrag):
    """Eintrag mit derselben id ersetzen (an seiner Stelle) oder anhaengen, andere erhalten."""
    liste = []
    if os.path.isfile(pfad):
        with open(pfad, encoding="utf-8") as f:
            liste = json.load(f)
        if not isinstance(liste, list):
            raise SystemExit(f"{pfad} enthaelt keine Liste")
    ids = [e.get("id") for e in liste]
    if eintrag["id"] in ids:
        liste[ids.index(eintrag["id"])] = eintrag
    else:
        liste.append(eintrag)
    with open(pfad, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")


def vorschau(bild, pfad, kante=400):
    """Verkleinerte PNG mit Fadenkreuz in Blau (Leinwandmitte) zur Sichtpruefung."""
    v = bild.copy()
    h, n = v.shape[:2]
    v[h // 2 - 1:h // 2 + 1, :, 2] = 255
    v[:, n // 2 - 1:n // 2 + 1, 2] = 255
    Image.fromarray(v, "RGB").resize((kante, max(1, round(kante * h / n))), Image.LANCZOS).save(pfad)


def verarbeite(pfad, args):
    p = lade_parameter(pfad)
    print(f"== {p['id']} ({pfad}), Rohbild {p['rohbild']}")
    rgb, farbraum = lade_rohbild(p)
    print(f"Farbraum: {farbraum}")
    rgb = ausrichten(p, rgb)
    pruefe_scheibe(p, miss_ring(rgb) if "roh_ring_aussen_px" in p else miss_scheibe(rgb))
    bild, faktor = leinwand(p, rgb)
    if args.vorschau:
        os.makedirs(args.vorschau, exist_ok=True)
        ziel = os.path.join(args.vorschau, f"{p['id']}.png")
        vorschau(bild, ziel)
        print(f"Vorschau: {ziel}")
    if args.messen:
        messe_qualitaet(bild, p)
        return
    qualitaet = p.get("qualitaet", QUALITAET_STANDARD)
    daten = webp_bytes(bild, qualitaet)
    ziel = os.path.join(args.ziel, p["datei"])
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    with open(ziel, "wb") as f:
        f.write(daten)
    print(f"{ziel}: {bild.shape[1]}x{bild.shape[0]} px, Scheibe {p['ziel_durchmesser_px']} px, "
          f"{p['winkelgroesse_arcsec'] / p['ziel_durchmesser_px']:.5f}\"/px, {len(daten)} Byte")
    schreibe_bildnachweis(args.bildnachweis, bildnachweis(p, farbraum, faktor, len(daten)))
    print(f"Bildnachweis {p['id']} in {args.bildnachweis} geschrieben")


def main(argv=None):
    a = argparse.ArgumentParser(description="Planetenbild zu Einzelbild und Bildnachweis aufbereiten")
    a.add_argument("parameter", nargs="+", help="Parameterdateien (tools/parameter/*.json)")
    a.add_argument("--ziel", default=ZIEL_STANDARD, help="Wurzel der Bilddateien (Standard daten/bilder)")
    a.add_argument("--bildnachweis", default=BILDNACHWEIS_STANDARD, help="Pfad zu bilder.json")
    a.add_argument("--vorschau", help="Ordner fuer verkleinerte PNG-Vorschauen (nicht ins Repo)")
    a.add_argument("--messen", action="store_true", help="nur Scheibe und WebP-Qualitaet messen, nichts schreiben")
    args = a.parse_args(argv)
    for pfad in args.parameter:
        verarbeite(pfad, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
