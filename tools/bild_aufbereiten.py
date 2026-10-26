#!/usr/bin/env python3
"""Planetenbild aufbereiten: Einzelbild und Bildnachweis (Issue #12, ADR-0003).

Liest je Bild eine kleine Parameterdatei (JSON, unter tools/parameter/), laedt
das Rohbild aus data/roh/, prueft Masse, Pruefsumme und Scheibenlage und
schreibt ein quadratisches WebP nach daten/bilder/<datei>:
    - Farbraum nach sRGB (eingebettetes ICC-Profil, z. B. Adobe RGB 1998,
      farbmetrisch umgerechnet; ohne Profil gilt das Rohbild als sRGB),
    - Scheibenmitte auf die Leinwandmitte (Randkoordinate leinwand_px / 2,
      wie QuelleEinzelbild und QuelleKacheln sie annehmen),
    - Skalierung auf ziel_durchmesser_px (600 bis 1200 px, bilder.md
      Abschnitt 9, Schritt 7), gerechnet in linearem Licht mit Lanczos,
    - ausserhalb der Scheibe plus rand_px Rand schwarz,
    - nicht gedreht oder gespiegelt; die Orientierung belegt die
      Parameterdatei (Feld orientierung) und landet im Feld bearbeitung.
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
    if p["leinwand_px"] % 2:
        raise SystemExit(f"{pfad}: leinwand_px muss gerade sein (Scheibenmitte auf einer Pixelgrenze)")
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
        (x0, x1), (y0, y1) = kanten(zeile, schwelle), kanten(spalte, schwelle)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    # Kreuzungen liegen zwischen Pixelzentren; der Durchmesser ist der Abstand der Kanten.
    return {"mitte": (cx, cy), "breite": x1 - x0, "hoehe": y1 - y0, "schwelle": schwelle}


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


def leinwand(p, rgb):
    """Zentrierte, skalierte Leinwand in sRGB-Kodewerten (uint8), Hintergrund schwarz."""
    n = p["leinwand_px"]
    faktor = p["ziel_durchmesser_px"] / p["roh_durchmesser_px"]
    mx, my = p["roh_mitte_px"]
    linear = srgb_zu_linear(rgb)
    # Pillow-Boxkoordinaten sind Randkoordinaten: Pixelzentrum i liegt bei i + 0,5.
    halb = n / 2 / faktor
    bx, by = mx + 0.5, my + 0.5
    rand = int(np.ceil(halb)) + 2
    gepolstert = np.zeros((linear.shape[0] + 2 * rand, linear.shape[1] + 2 * rand, 3), np.float32)
    gepolstert[rand:rand + linear.shape[0], rand:rand + linear.shape[1]] = linear
    box = (bx - halb + rand, by - halb + rand, bx + halb + rand, by + halb + rand)
    kanaele = [Image.fromarray(np.ascontiguousarray(gepolstert[..., c]), "F").resize((n, n), Image.LANCZOS, box=box)
               for c in range(3)]
    aus = np.dstack([np.asarray(k) for k in kanaele])
    yy, xx = np.mgrid[0:n, 0:n]
    r = p["ziel_durchmesser_px"] / 2 + p.get("rand_px", RAND_PX_STANDARD)
    aus[np.hypot(xx + 0.5 - n / 2, yy + 0.5 - n / 2) > r] = 0.0
    return linear_zu_srgb(aus), faktor


def webp_bytes(bild, qualitaet):
    puffer = io.BytesIO()
    Image.fromarray(bild, "RGB").save(puffer, "WEBP", quality=qualitaet, method=6)
    return puffer.getvalue()


def messe_qualitaet(bild, p):
    n = p["leinwand_px"]
    yy, xx = np.mgrid[0:n, 0:n]
    r = p["ziel_durchmesser_px"] / 2 + p.get("rand_px", RAND_PX_STANDARD)
    aussen = np.hypot(xx + 0.5 - n / 2, yy + 0.5 - n / 2) > r
    for q in (85, 90, 95, 98):
        daten = webp_bytes(bild, q)
        dek = np.asarray(Image.open(io.BytesIO(daten)).convert("RGB")).astype(np.int16)
        diff = np.abs(dek - bild.astype(np.int16))
        print(f"q{q}: max {diff.max()}, mittel {diff.mean():.2f}, Hintergrund max {dek[aussen].max()}, "
              f"{len(daten)} Byte")


def bildnachweis(p, farbraum, faktor, datei_bytes):
    d = p["ziel_durchmesser_px"]
    n = p["leinwand_px"]
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
    bearbeitung = (
        f"Scheibe (Mitte {p['roh_mitte_px'][0]}/{p['roh_mitte_px'][1]}, Aequatordurchmesser "
        f"{p['roh_durchmesser_px']} px im Rohbild {p['original_pixel']}) auf die Mitte einer Leinwand von "
        f"{n}x{n} px gelegt und {skalierung} auf {d} px Scheibendurchmesser; ausserhalb der Scheibe plus "
        f"{p.get('rand_px', RAND_PX_STANDARD)} px Rand auf Schwarz gesetzt; {farbe}; nicht gedreht oder "
        f"gespiegelt. {p['orientierung']} WebP verlustbehaftet, Qualitaet {qualitaet} (tools/bild_aufbereiten.py)."
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
        "namensnennung": p["namensnennung"],
        "pixel_breite": n,
        "pixel_hoehe": n,
        "original_pixel": p["original_pixel"],
        "winkelgroesse_arcsec": winkel,
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
    n = v.shape[0]
    v[n // 2 - 1:n // 2 + 1, :, 2] = 255
    v[:, n // 2 - 1:n // 2 + 1, 2] = 255
    Image.fromarray(v, "RGB").resize((kante, kante), Image.LANCZOS).save(pfad)


def verarbeite(pfad, args):
    p = lade_parameter(pfad)
    print(f"== {p['id']} ({pfad}), Rohbild {p['rohbild']}")
    rgb, farbraum = lade_rohbild(p)
    print(f"Farbraum: {farbraum}")
    pruefe_scheibe(p, miss_scheibe(rgb))
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
