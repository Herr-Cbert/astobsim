#!/usr/bin/env python3
"""Deep-Sky-Bild aufbereiten: lineares Archivbild zu Grauwert-WebP mit log-Kennlinie (Issue #105).

Liest je Bild eine Parameterdatei (JSON, unter tools/parameter/), laedt das
lineare Rohbild aus data/roh/ (FITS, z. B. ein kalibriertes HST-Bild aus
MAST; Entscheidung 2 in docs/recherche/README.md) und schreibt
    - ein 8-Bit-Grauwert-WebP nach daten/bilder/<datei> mit der log-Kennlinie
      aus ADR-0003 (Nachtrag Version 2): Kode v = 1 bis 255 bedeutet
      mu(v) = mag_dunkel - (v - 1) / 254 (mag_dunkel - mag_hell) mag/arcsec^2,
      Kode 0 ist Schwarz; Quellweiss ist mag_hell (Kode 255 = 1,0),
    - den Eintrag in daten/bilder.json (mit kennlinie),
    - die Flaechentabelle (isophoten) als JSON auf die Ausgabe; sie wird von
      Hand in daten/objekte.json uebernommen (objekte.json ist von Hand
      formatiert und wird nicht neu geschrieben).

Schritte:
    1. FITS lesen (lies_fits, ohne astropy): Kopf in 2880-Byte-Bloecken mit
       Karten zu 80 Zeichen, Daten Big-Endian nach BITPIX, physikalischer Wert
       = BZERO + BSCALE * Rohwert. Zeile 0 des Felds ist FITS-Zeile y = 1.
    2. Ausrichten und skalieren in einem Schritt: fuer jedes Zielpixel (Norden
       oben, Osten links, bogensekunden_pro_pixel) die Lage im Rohbild ueber
       die CD-Matrix des Kopfs, bilinear abgetastet auf einem um den Faktor
       ueberabtastung feineren Gitter, dann blockweise gemittelt
       (Flaechenmittel, flusserhaltend). Die Objektmitte (roh_mitte_px,
       Pixelindex wie bei bild_aufbereiten.py, Zentrum von Pixel 0 bei 0)
       liegt auf der Leinwandmitte (Randkoordinate leinwand_px / 2). Die
       Tangentialprojektion ist im Bildfeld (unter 2') linear genaehert; der
       Fehler liegt unter 1e-7 relativ. Pixel ohne Daten (NaN) werden 0.
    3. Sterne entfernen (sterne_entfernen): Punktquellen ueber den Rest gegen
       einen gleitenden Median erkennen, Maske um jeden Stern (mit Spikes)
       wachsen lassen und durch den Median der unmaskierten Umgebung
       ersetzen. Feldsterne sind Nicht-Ziel (A-X9); Sterne, die zum Objekt
       gehoeren, kommen als Katalogsterne (sterne in objekte.json). Mit
       sterne.im_bild_entfernen = false bleibt das Bild unveraendert und nur
       die Flaechentabelle wird am bereinigten Bild gemessen (M13, #108).
    4. Kennlinie: mag_hell ist die Flaechenhelligkeit des hellsten Pixels,
       mag_dunkel = mag_hell + kennlinie.umfang_mag. Kodiert wird relativ zum
       hellsten Pixel; erst danach wird die Lage in mag geeicht, weil eine
       Verschiebung aller mu die Kodes nicht aendert.
    5. Eichung von Quellweiss (eichung.art):
       - "gesamt": Gesamthelligkeit eichung.magnitude; mag_hell so, dass der
         Gesamtfluss des dekodierten Bilds sie trifft:
         mag_hell = m + 2,5 log10(Summe q * s^2), q dekodiert relativ zu
         mag_hell, s Massstab in "/px (wie objekte.md 5.3),
       - "flaeche": mittlere Flaechenhelligkeit eichung.mag_arcsec2 im Kreis
         eichung.radius_arcsec um die Mitte (Profilanker, z. B. M13 King mu0
         in kleinem Radius): mag_hell = mu + 2,5 log10(Mittel q).
       mag_hell und mag_dunkel werden auf 0,01 mag gerundet.
    6. Pruefung am geschriebenen WebP (wieder eingelesen): Kodes gleich,
       Gesamthelligkeit aus dem dekodierten Bild gegen eichung.magnitude
       (Toleranz 0,1 mag, Issue #105); bei "flaeche" nur Ausgabe.
    7. Flaechentabelle (flaechentabelle) am dekodierten, sternbereinigten
       Bild in 0,1-mag-Schritten (ADR-0003 Nachtrag V2, ADR-0004): Isophote
       mu_i gegen die Flaeche aller Pixel mit mu <= mu_i (wie der Prototyp
       auf dem Branch prototyp-deep-sky). Ein Loch, das schwaecher ist als
       die Isophote, zaehlt also nicht mit, erst wenn die Isophote es
       erreicht. Zeilen ohne Flaechenzuwachs entfallen (Flaeche streng
       steigend).

WebP verlustfrei (VP8L): ein Grauwert-WebP wird intern als RGB mit R = G = B
gespeichert; verlustbehaftet (VP8) laeuft der Grauwert ueber YUV mit
eingeschraenktem Bereich (Y 16 bis 235) und verliert Kodes, die hier
Flaechenhelligkeiten sind. Verlustfrei bleibt jeder Kode erhalten, daten
liest den Rot-Kanal (kachellader.ts rgbaZuKodes). Groesse siehe LIESMICH.

Verwendung (aus dem Repo-Root, nur numpy und Pillow noetig):
    python3 tools/deep_sky_aufbereiten.py tools/parameter/m57_hst_20110919.json
    python3 tools/deep_sky_aufbereiten.py ... --messen        # nichts schreiben
    python3 tools/deep_sky_aufbereiten.py ... --vorschau ordner/
Das Skript ist idempotent: gleiche Eingaben ergeben dieselbe Datei und
denselben Eintrag in bilder.json.
"""

import argparse
import hashlib
import io
import json
import math
import os
import sys

import numpy as np
from PIL import Image

from bild_aufbereiten import BILDNACHWEIS_STANDARD, ZIEL_STANDARD, namensnennung, schreibe_bildnachweis

FITS_BLOCK = 2880
FITS_KARTE = 80
# BITPIX -> Datentyp Big-Endian (FITS-Standard 4.0, Abschnitt 4.4.1.1).
FITS_TYPEN = {8: ">u1", 16: ">i2", 32: ">i4", 64: ">i8", -32: ">f4", -64: ">f8"}
TOLERANZ_GESAMT_MAG = 0.1
ISOPHOTEN_SCHRITT_MAG = 0.1
RAND_ANTEIL = 0.01
KODE_MAX = 255
STUFEN = 254

PFLICHT = [
    "id", "objekt", "zustand", "datei", "rohbild", "roh_url", "roh_sha256", "roh_bytes", "roh_abruf",
    "original_pixel", "fits_erweiterung", "roh_mitte_px", "bogensekunden_pro_pixel", "leinwand_px",
    "winkelgroesse_arcsec", "eichung", "kennlinie", "sterne", "quelle_url", "mission", "instrument",
    "aufnahmedatum", "lizenz", "lizenz_url", "namensnennung", "orientierung", "bearbeitung_kanal",
]


# ---------------------------------------------------------------------------
# FITS lesen (ohne astropy)

def _kopf_lesen(f):
    """Ein FITS-Kopf ab der aktuellen Position: Schluessel -> Text (Strings ohne Anfuehrungszeichen)."""
    kopf = {}
    while True:
        block = f.read(FITS_BLOCK)
        if len(block) < FITS_BLOCK:
            raise ValueError("FITS-Datei endet mitten im Kopf")
        for i in range(0, FITS_BLOCK, FITS_KARTE):
            karte = block[i:i + FITS_KARTE].decode("ascii", errors="replace")
            schluessel = karte[:8].strip()
            if schluessel == "END":
                return kopf
            if karte[8:10] != "= ":
                continue  # COMMENT, HISTORY, leere Karten
            wert = karte[10:].strip()
            if wert.startswith("'"):
                # String: bis zum naechsten einfachen Anfuehrungszeichen ('' ist ein escaptes ').
                text, j = "", 1
                while j < len(wert):
                    if wert[j] == "'" and wert[j + 1:j + 2] == "'":
                        text, j = text + "'", j + 2
                    elif wert[j] == "'":
                        break
                    else:
                        text, j = text + wert[j], j + 1
                kopf[schluessel] = text.rstrip()
            else:
                kopf[schluessel] = wert.split("/")[0].strip()


def _datenbytes(kopf):
    naxis = int(kopf.get("NAXIS", "0"))
    if naxis == 0:
        return 0
    anzahl = 1
    for i in range(1, naxis + 1):
        anzahl *= int(kopf[f"NAXIS{i}"])
    # Binaertabellen (PCOUNT, GCOUNT) haben NAXIS1 in Byte und BITPIX 8.
    anzahl = int(kopf.get("GCOUNT", "1")) * (int(kopf.get("PCOUNT", "0")) + anzahl)
    return anzahl * abs(int(kopf["BITPIX"])) // 8


def lies_fits(pfad, erweiterung):
    """Bild der Erweiterung EXTNAME = erweiterung ("PRIMARY" fuer die erste HDU) als float64 (Zeilen, Spalten).

    Rueckgabe (kopf, daten): kopf ist der Primaerkopf, ueberschrieben vom Kopf der Erweiterung.
    Zeile 0 ist FITS-Zeile y = 1 (unten in der ueblichen Darstellung). Physikalischer Wert =
    BZERO + BSCALE * Rohwert; bei Gleitkomma bleiben NaN erhalten.
    """
    with open(pfad, "rb") as f:
        primaer = None
        while True:
            try:
                kopf = _kopf_lesen(f)
            except ValueError:
                raise SystemExit(f"{pfad}: keine Erweiterung {erweiterung}")
            if primaer is None:
                primaer = kopf
            name = kopf.get("EXTNAME", "PRIMARY" if kopf is primaer else "")
            laenge = _datenbytes(kopf)
            if name == erweiterung:
                if kopf.get("XTENSION", "IMAGE") not in ("IMAGE",) or int(kopf["NAXIS"]) != 2:
                    raise SystemExit(f"{pfad}: Erweiterung {erweiterung} ist kein zweidimensionales Bild")
                typ = FITS_TYPEN[int(kopf["BITPIX"])]
                roh = np.frombuffer(f.read(laenge), dtype=typ).reshape(int(kopf["NAXIS2"]), int(kopf["NAXIS1"]))
                daten = roh.astype(np.float64) * float(kopf.get("BSCALE", "1")) + float(kopf.get("BZERO", "0"))
                gesamt = dict(primaer)
                gesamt.update(kopf)
                return gesamt, daten
            f.seek((laenge + FITS_BLOCK - 1) // FITS_BLOCK * FITS_BLOCK, 1)


# ---------------------------------------------------------------------------
# Ausrichten und skalieren

def cd_matrix(kopf):
    """CD-Matrix in Grad je Pixel; erste Zeile Rektaszension (Osten), zweite Deklination (Norden)."""
    return np.array([[float(kopf["CD1_1"]), float(kopf["CD1_2"])], [float(kopf["CD2_1"]), float(kopf["CD2_2"])]])


def nordwinkel_grad(cd):
    """Winkel von Himmelsnorden gegen die +y-Achse des Rohbilds, gegen den Uhrzeigersinn positiv (FITS-Darstellung)."""
    return math.degrees(math.atan2(-cd[1, 0], cd[1, 1]))


def ausrichten(daten, cd, mitte_px, massstab, leinwand, ueberabtastung):
    """Leinwand leinwand x leinwand, Norden oben, Osten links, Objektmitte auf der Mitte; NaN -> 0.

    Rueckgabe (bild, ohne_daten): bild in Einheiten des Rohbilds je Quadratbogensekunde (Wert je
    Rohpixel geteilt durch dessen Flaeche), ohne_daten markiert Zielpixel mit mindestens einer
    Abtastung ausserhalb der Daten.
    """
    if np.linalg.det(cd) > 0:
        raise SystemExit("CD-Matrix gespiegelt (Osten rechts bei Norden oben); Spiegeln ist nicht umgesetzt")
    n = leinwand * ueberabtastung
    fein = massstab / ueberabtastung
    # Zielpixelzentren: dx nach Osten (links), dy nach Norden (oben), in Bogensekunden.
    achse = (np.arange(n) + 0.5 - n / 2) * fein
    dx = -achse[None, :]
    dy = -achse[:, None]
    # (xi, eta) in Grad = CD * (Pixel - Mitte); umgekehrt Pixel = Mitte + CD^-1 (xi, eta).
    inv = np.linalg.inv(cd)
    xi, eta = dx / 3600.0, dy / 3600.0
    px = mitte_px[0] + inv[0, 0] * xi + inv[0, 1] * eta
    py = mitte_px[1] + inv[1, 0] * xi + inv[1, 1] * eta
    werte, gueltig = bilinear(daten, px, py)
    flaeche_roh = abs(np.linalg.det(cd)) * 3600.0 ** 2
    werte = werte / flaeche_roh
    bild = werte.reshape(leinwand, ueberabtastung, leinwand, ueberabtastung).mean(axis=(1, 3))
    ohne = ~gueltig.reshape(leinwand, ueberabtastung, leinwand, ueberabtastung).all(axis=(1, 3))
    bild[ohne] = 0.0
    return bild, ohne


def bilinear(daten, px, py):
    """Bilineare Abtastung an Pixelindizes (px Spalte, py Zeile, Zentrum von Pixel 0 bei 0); NaN und aussen ungueltig."""
    h, w = daten.shape
    x0 = np.floor(px).astype(np.int64)
    y0 = np.floor(py).astype(np.int64)
    fx, fy = px - x0, py - y0
    gueltig = (x0 >= 0) & (y0 >= 0) & (x0 + 1 < w) & (y0 + 1 < h)
    x0c, y0c = np.clip(x0, 0, w - 2), np.clip(y0, 0, h - 2)
    summe = np.zeros(px.shape)
    for ox, oy, gewicht in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        wert = daten[y0c + oy, x0c + ox]
        gueltig &= np.isfinite(wert)
        summe += np.where(np.isfinite(wert), wert, 0.0) * gewicht
    return np.where(gueltig, summe, 0.0), gueltig


# ---------------------------------------------------------------------------
# Sterne entfernen

def median_filter(bild, fenster):
    """Gleitender Median mit quadratischem Fenster (ungerade), Rand gespiegelt; zeilenweise in Bloecken."""
    r = fenster // 2
    gepolstert = np.pad(bild, r, mode="reflect")
    fenster_ansicht = np.lib.stride_tricks.sliding_window_view(gepolstert, (fenster, fenster))
    aus = np.empty_like(bild)
    for z in range(0, bild.shape[0], 64):
        block = fenster_ansicht[z:z + 64]
        aus[z:z + 64] = np.median(block.reshape(block.shape[0], block.shape[1], -1), axis=-1)
    return aus


def robuste_streuung(werte):
    """Standardabweichung aus der mittleren absoluten Abweichung vom Median (Normalverteilung: Faktor 1,4826)."""
    return 1.4826 * float(np.median(np.abs(werte - np.median(werte))))


def sterne_entfernen(bild, fenster_px=9, schwelle_sigma=6.0, kontrast=0.5, wachsen_sigma=3.0, max_radius_px=40,
                     rand_px=2, ersatz_px=21, streuung_px=15, zusaetzlich=()):
    """Punktquellen entfernen; Rueckgabe (bereinigt, maske, sterne) mit sterne = [(x, y, rest_spitze), ...].

    Ein Stern ist ein lokales Maximum, dessen Rest gegen den gleitenden Median (fenster_px) ueber
    schwelle_sigma Streuungen und ueber kontrast mal dem Median liegt (Filamente im Nebel sind
    breiter als das Fenster und erreichen den Kontrast nicht). Die Streuung ist lokal: robuste
    Streuung des Rests im Fenster streuung_px, weil das Photonenrauschen im hellen Nebel groesser
    ist als im Halo. Die Maske waechst vom Maximum ueber alle zusammenhaengenden Pixel mit Rest
    ueber wachsen_sigma lokalen Streuungen (Spikes), hoechstens max_radius_px, und wird um
    rand_px erweitert. Erkannt werden auch Reste kosmischer Strahlung und heisse Pixel (dort, wo
    nur eine Belichtung beitraegt); sie gehoeren ebenso wenig zum Objekt. Maskierte Pixel bekommen den Median der
    unmaskierten Pixel im Fenster ersatz_px. zusaetzlich: [(x, y, radius_px), ...] als Kreise
    maskiert (z. B. ein ausgebrannter Kern).
    """
    med = median_filter(bild, fenster_px)
    rest = bild - med
    # Lokale Streuung: Median von |Rest| im Fenster, Faktor 1,4826 wie robuste_streuung (Rest hat Median etwa 0).
    sigma = 1.4826 * median_filter(np.abs(rest), streuung_px)
    sigma = np.maximum(sigma, robuste_streuung(rest) * 0.1)
    h, w = bild.shape
    kandidat = (rest > schwelle_sigma * sigma) & (rest > kontrast * np.abs(med))
    # Rand mit -inf: auch ein Stern, dessen Mitte knapp ausserhalb liegt, hat am Rand ein Maximum.
    gepolstert = np.pad(bild, 1, mode="constant", constant_values=-np.inf)
    nachbarn = np.max(np.stack([gepolstert[1 + oy:1 + oy + h, 1 + ox:1 + ox + w]
                                for oy in (-1, 0, 1) for ox in (-1, 0, 1) if (ox, oy) != (0, 0)]), axis=0)
    spitzen = np.argwhere(kandidat & (bild > nachbarn))
    maske = np.zeros(bild.shape, bool)
    # Kern: gewachsene Masken ohne Randerweiterung. Nur eine Spitze in einem schon gewachsenen Stern
    # wird uebersprungen; liegt sie nur im Rand eines Nachbarn, waechst sie selbst (Issue #106, M1).
    kern = np.zeros(bild.shape, bool)
    sterne = []
    wachsen = rest > wachsen_sigma * sigma
    for y, x in spitzen:
        if kern[y, x]:
            continue
        y0, y1 = max(0, y - max_radius_px), min(h, y + max_radius_px + 1)
        x0, x1 = max(0, x - max_radius_px), min(w, x + max_radius_px + 1)
        erlaubt = wachsen[y0:y1, x0:x1]
        teil = np.zeros(erlaubt.shape, bool)
        teil[y - y0, x - x0] = True
        while True:
            neu = _dehnen(teil) & erlaubt
            neu |= teil
            if (neu == teil).all():
                break
            teil = neu
        kern[y0:y1, x0:x1] |= teil
        for _ in range(rand_px):
            teil = _dehnen(teil)
        maske[y0:y1, x0:x1] |= teil
        sterne.append((int(x), int(y), float(rest[y, x])))
    yy, xx = np.mgrid[0:h, 0:w]
    for x, y, r in zusaetzlich:
        maske |= np.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r
    bereinigt = bild.copy()
    halb = ersatz_px // 2
    for y, x in np.argwhere(maske):
        for weite in (halb, 2 * halb, 4 * halb):
            y0, y1, x0, x1 = max(0, y - weite), min(h, y + weite + 1), max(0, x - weite), min(w, x + weite + 1)
            frei = ~maske[y0:y1, x0:x1]
            if frei.any():
                bereinigt[y, x] = np.median(bild[y0:y1, x0:x1][frei])
                break
    return bereinigt, maske, sterne


def _dehnen(m):
    """Maske um ein Pixel erweitern (8er-Nachbarschaft)."""
    g = np.pad(m, 1)
    aus = np.zeros_like(m)
    for oy in (0, 1, 2):
        for ox in (0, 1, 2):
            aus |= g[oy:oy + m.shape[0], ox:ox + m.shape[1]]
    return aus


# ---------------------------------------------------------------------------
# Kennlinie (gleich src/daten/kennlinie.ts)

def kode_zu_mag(kode, mag_hell, mag_dunkel):
    """Flaechenhelligkeit zum Kode 1 bis 255; Kode 0 (Schwarz) hat keine (inf). Wie kodeZuMag in kennlinie.ts."""
    kode = np.asarray(kode, dtype=np.float64)
    mu = mag_dunkel - (kode - 1) / STUFEN * (mag_dunkel - mag_hell)
    return np.where(kode <= 0, np.inf, mu)


def log_tabelle(mag_hell, mag_dunkel):
    """Die 256 dekodierten linearen Werte relativ zu Quellweiss (mag_hell = 1,0) als float32, wie logTabelle in kennlinie.ts.

    kennlinie.ts rechnet in double (10 ** (-0,4 (mu - mag_hell))) und speichert in einem
    Float32Array; hier dieselbe Formel in float64, dann auf float32 gerundet.
    """
    mu = kode_zu_mag(np.arange(256), mag_hell, mag_dunkel)
    lin = np.where(np.isfinite(mu), 10.0 ** (-0.4 * (np.where(np.isfinite(mu), mu, 0.0) - mag_hell)), 0.0)
    return lin.astype(np.float32)


def kodiere_relativ(mu_rel, umfang):
    """Kodes 0 bis 255 aus mu relativ zu mag_hell (0 = hellster Kode 255); naechster Kode, unter Kode 1 minus halbe Stufe 0.

    mu_rel darf inf (kein Licht) enthalten. Werte heller als 0 werden 255 (Saettigung).
    """
    stufe = umfang / STUFEN
    v = 1.0 + (umfang - mu_rel) / stufe
    kode = np.rint(np.where(np.isfinite(v), v, 0.0))
    kode = np.where(v < 0.5, 0, np.clip(kode, 1, KODE_MAX))
    return kode.astype(np.uint8)


def kodiere(mu, mag_hell, mag_dunkel):
    """Kodes zu absoluten Flaechenhelligkeiten mu (mag/arcsec^2)."""
    return kodiere_relativ(np.asarray(mu, dtype=np.float64) - mag_hell, mag_dunkel - mag_hell)


def linear_zu_mu_rel(linear):
    """mu relativ zum hellsten Wert: -2,5 log10(L / L_max); L <= 0 -> inf."""
    lmax = float(linear.max())
    if not lmax > 0:
        raise SystemExit("Bild ohne positives Pixel")
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(linear > 0, -2.5 * np.log10(np.where(linear > 0, linear, 1.0) / lmax), np.inf)


# ---------------------------------------------------------------------------
# Eichung und Flaechentabelle

def gesamtmagnitude(kodes, mag_hell, mag_dunkel, massstab):
    """Gesamthelligkeit des dekodierten Bilds: mag_hell - 2,5 log10(Summe q s^2)."""
    q = log_tabelle(mag_hell, mag_dunkel).astype(np.float64)[kodes]
    return mag_hell - 2.5 * math.log10(float(q.sum()) * massstab ** 2)


def eiche_mag_hell(kodes, umfang, massstab, eichung):
    """mag_hell (ungerundet) aus der Eichung; die Kodes sind relativ und aendern sich dabei nicht."""
    q = log_tabelle(0.0, umfang).astype(np.float64)[kodes]
    if eichung["art"] == "gesamt":
        return eichung["magnitude"] + 2.5 * math.log10(float(q.sum()) * massstab ** 2)
    if eichung["art"] == "flaeche":
        h, w = kodes.shape
        yy, xx = np.mgrid[0:h, 0:w]
        kreis = np.hypot((xx + 0.5 - w / 2) * massstab, (yy + 0.5 - h / 2) * massstab) <= eichung["radius_arcsec"]
        return eichung["mag_arcsec2"] + 2.5 * math.log10(float(q[kreis].mean()))
    raise SystemExit(f"eichung.art {eichung['art']!r} unbekannt (gesamt oder flaeche)")


def flaechentabelle(mu, massstab, mag_hell, mag_dunkel, schritt=ISOPHOTEN_SCHRITT_MAG, rand_anteil=RAND_ANTEIL):
    """Isophoten in Schritten von schritt mag zwischen mag_hell und mag_dunkel: [(mu_i, Flaeche mu <= mu_i in arcsec^2)].

    mu: Flaechenhelligkeit je Pixel (inf fuer kein Licht). Die Isophoten liegen auf dem Raster
    k * schritt; Zeilen, deren Flaeche nicht waechst, und Zeilen ohne Flaeche entfallen. Die
    Tabelle endet vor der ersten Isophote, die mehr als rand_anteil der Randpixel erreicht: deren
    Flaeche ist nicht mehr vom Bild eingeschlossen, sondern vom Bildausschnitt begrenzt. Der
    Anteil statt eines einzelnen Pixels, damit Rauschen und Reste von Sternen am Rand die Tabelle
    nicht abschneiden.
    """
    sortiert = np.sort(mu[np.isfinite(mu)].ravel())
    randpixel = np.sort(np.concatenate([mu[0], mu[-1], mu[1:-1, 0], mu[1:-1, -1]]))
    rand = float(randpixel[int(rand_anteil * len(randpixel))])
    k0 = math.ceil(round(mag_hell / schritt, 6))
    k1 = math.floor(round(mag_dunkel / schritt, 6))
    zeilen = []
    for k in range(k0, k1 + 1):
        mu_i = round(k * schritt, 6)
        if mu_i + 1e-9 >= rand:
            break
        anzahl = int(np.searchsorted(sortiert, mu_i + 1e-9, side="right"))
        flaeche = anzahl * massstab ** 2
        if anzahl == 0 or (zeilen and flaeche <= zeilen[-1][1]):
            continue
        zeilen.append((mu_i, flaeche))
    return zeilen


# ---------------------------------------------------------------------------
# Ablauf

def lade_parameter(pfad):
    with open(pfad, encoding="utf-8") as f:
        p = json.load(f)
    fehlt = [k for k in PFLICHT if k not in p]
    if fehlt:
        raise SystemExit(f"{pfad}: Pflichtfelder fehlen: {', '.join(fehlt)}")
    if p["leinwand_px"] % 2:
        raise SystemExit(f"{pfad}: leinwand_px muss gerade sein (Objektmitte auf einer Pixelgrenze)")
    d = p["winkelgroesse_arcsec"] / p["bogensekunden_pro_pixel"]
    if abs(d - round(d)) > 1e-6 or round(d) > p["leinwand_px"]:
        raise SystemExit(f"{pfad}: winkelgroesse_arcsec / bogensekunden_pro_pixel = {d} ist keine ganze Pixelzahl "
                         "bis leinwand_px (objekt_durchmesser_px)")
    if p["eichung"].get("art") not in ("gesamt", "flaeche"):
        raise SystemExit(f"{pfad}: eichung.art muss gesamt oder flaeche sein")
    umfang = p["kennlinie"].get("umfang_mag")
    if not (isinstance(umfang, (int, float)) and 1 <= umfang <= 20):
        raise SystemExit(f"{pfad}: kennlinie.umfang_mag muss zwischen 1 und 20 liegen")
    if "CC" in p["lizenz"] and not p.get("aenderungsvermerk"):
        raise SystemExit(f"{pfad}: CC-Lizenz verlangt aenderungsvermerk (bilder.md Abschnitt 9, Schritt 8)")
    if not p["datei"].endswith(".webp") or p["datei"].startswith("/") or ".." in p["datei"]:
        raise SystemExit(f"{pfad}: datei muss ein relativer Pfad unter daten/bilder/ auf .webp sein")
    return p


def pruefe_rohbild(p):
    pfad = p["rohbild"]
    if not os.path.isfile(pfad):
        raise SystemExit(f"Rohbild nicht gefunden: {pfad} (Herkunft und Abruf: data/roh/LIESMICH.md)")
    h = hashlib.sha256()
    groesse = 0
    with open(pfad, "rb") as f:
        for teil in iter(lambda: f.read(1 << 22), b""):
            h.update(teil)
            groesse += len(teil)
    if groesse != p["roh_bytes"] or h.hexdigest() != p["roh_sha256"]:
        raise SystemExit(f"Rohbild {pfad}: Groesse oder SHA-256 passen nicht zur Parameterdatei (anderer Abruf?)")


def webp_bytes(kodes):
    """Grauwert verlustfrei (VP8L); Pillow speichert L als RGB mit R = G = B."""
    puffer = io.BytesIO()
    Image.fromarray(kodes, "L").save(puffer, "WEBP", lossless=True, quality=100, method=6)
    return puffer.getvalue()


def webp_kodes(daten):
    """Kodes aus einem WebP wie daten sie liest: Rot-Kanal (kachellader.ts rgbaZuKodes)."""
    with Image.open(io.BytesIO(daten)) as im:
        return np.asarray(im.convert("RGB"))[..., 0].copy()


def bildnachweis(p, kopf, mag_hell, mag_dunkel, datei_bytes, sterne, ohne_daten, nordwinkel):
    s = p["bogensekunden_pro_pixel"]
    n = p["leinwand_px"]
    native = math.sqrt(abs(np.linalg.det(cd_matrix(kopf)))) * 3600.0
    st = p["sterne"]
    if st.get("im_bild_entfernen", True):
        sterne_text = (f"{len(sterne)} Punktquellen ({st.get('punktquellen', 'Feldsterne')}) erkannt und durch den "
                       f"Median der Umgebung ersetzt (Rest gegen Median {st.get('fenster_px', 9)} px ueber "
                       f"{st.get('schwelle_sigma', 6.0)} lokalen Streuungen)")
        if st.get("zusaetzlich_px"):
            sterne_text += f"; zusaetzlich maskiert: {st['zusaetzlich_beleg']}"
    else:
        sterne_text = "Sterne im Bild belassen, nur fuer die Flaechentabelle entfernt"
    eichung = p["eichung"]
    if eichung["art"] == "gesamt":
        eich_text = (f"Quellweiss mag_hell so geeicht, dass der Gesamtfluss des dekodierten Bilds V = "
                     f"{eichung['magnitude']} ergibt ({eichung['quelle']})")
    else:
        eich_text = (f"Quellweiss mag_hell so geeicht, dass das Mittel im Kreis {eichung['radius_arcsec']}\" um die Mitte "
                     f"{eichung['mag_arcsec2']} mag/arcsec^2 ergibt ({eichung['quelle']})")
    bearbeitung = (
        f"{p['bearbeitung_kanal']} Lineare Werte ({kopf.get('BUNIT', 'Einheit unbekannt')}) aus der FITS-Erweiterung "
        f"{p['fits_erweiterung']} ohne Tonkurve; Himmel nicht abgezogen ({p.get('hintergrund', 'kein Abzug')}). "
        f"Ausgerichtet ueber die CD-Matrix des FITS-Kopfs (Himmelsnorden {abs(nordwinkel):.2f} Grad "
        f"{'gegen den' if nordwinkel > 0 else 'im'} Uhrzeigersinn von oben im Rohbild, nicht gespiegelt), "
        f"Objektmitte (Pixel {p['roh_mitte_px'][0]}/{p['roh_mitte_px'][1]} im Rohbild, {p.get('mitte_beleg', '')}) "
        f"auf die Mitte einer Leinwand von {n}x{n} px, von {native:.4f} auf {s}\"/px bilinear auf einem "
        f"{p.get('ueberabtastung', 3)}-fach feineren Gitter abgetastet und blockweise gemittelt (flusserhaltend); "
        f"{int(ohne_daten.sum())} Pixel ohne Daten auf 0. {sterne_text}. {eich_text}. "
        f"Kodiert als 8-Bit-Grauwert mit log-Kennlinie (ADR-0003 Nachtrag Version 2): Kode 255 = mag_hell "
        f"{mag_hell} (hellstes Pixel), Kode 1 = mag_dunkel {mag_dunkel}, Kode 0 Schwarz (Rauschen und Werte unter "
        f"Kode 1). {p['orientierung']} WebP verlustfrei (tools/deep_sky_aufbereiten.py)."
    )
    hinweise = (
        f"Rohdatei {os.path.basename(p['rohbild'])} von {p['roh_url']}: {p['roh_bytes']} Byte, SHA-256 "
        f"{p['roh_sha256']}, abgerufen {p['roh_abruf']}. Native Aufloesung {native:.4f}\"/px, Repo-Datei "
        f"{s / native:.2f}-fach verkleinert."
    )
    if p.get("hinweise"):
        hinweise = p["hinweise"] + " " + hinweise
    eintrag = {"id": p["id"], "objekt": p["objekt"], "zustand": p["zustand"], "datei": p["datei"],
               "quelle_url": p["quelle_url"]}
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
        "pixel_hoehe": n,
        "original_pixel": p["original_pixel"],
        "winkelgroesse_arcsec": p["winkelgroesse_arcsec"],
        "objekt_durchmesser_px": round(p["winkelgroesse_arcsec"] / s),
        "bogensekunden_pro_pixel": s,
        "norden_oben": True,
        "datei_bytes": datei_bytes,
        "bearbeitung": bearbeitung,
        "hinweise": hinweise,
        "kennlinie": {"art": "log", "mag_hell": mag_hell, "mag_dunkel": mag_dunkel},
    })
    return eintrag


def vorschau(kodes, maske, ordner, name):
    """Kodes als PNG (die log-Kennlinie ist schon eine Anzeige), daneben die Sternmaske in Rot."""
    os.makedirs(ordner, exist_ok=True)
    Image.fromarray(kodes, "L").save(os.path.join(ordner, f"{name}.png"))
    rgb = np.dstack([kodes, kodes, kodes])
    rgb[maske] = (255, 0, 0)
    Image.fromarray(rgb, "RGB").save(os.path.join(ordner, f"{name}_sterne.png"))


def verarbeite(pfad, args):
    p = lade_parameter(pfad)
    print(f"== {p['id']} ({pfad}), Rohbild {p['rohbild']}")
    pruefe_rohbild(p)
    kopf, daten = lies_fits(p["rohbild"], p["fits_erweiterung"])
    if f"{daten.shape[1]}x{daten.shape[0]}" != p["original_pixel"]:
        raise SystemExit(f"Rohbild hat {daten.shape[1]}x{daten.shape[0]}, erwartet {p['original_pixel']}")
    if p.get("fits_filter") and kopf.get("FILTER") != p["fits_filter"]:
        raise SystemExit(f"FITS-Filter {kopf.get('FILTER')!r}, erwartet {p['fits_filter']!r}")
    cd = cd_matrix(kopf)
    nordwinkel = nordwinkel_grad(cd)
    print(f"Massstab {math.sqrt(abs(np.linalg.det(cd))) * 3600:.5f}\"/px, Norden {nordwinkel:.3f} Grad gegen den "
          f"Uhrzeigersinn von +y, Einheit {kopf.get('BUNIT')}")
    s = p["bogensekunden_pro_pixel"]
    bild, ohne_daten = ausrichten(daten, cd, p["roh_mitte_px"], s, p["leinwand_px"], p.get("ueberabtastung", 3))
    print(f"Leinwand {bild.shape[1]}x{bild.shape[0]} px bei {s}\"/px, {int(ohne_daten.sum())} Pixel ohne Daten")

    st = p["sterne"]
    stern_param = {k: st[k] for k in ("fenster_px", "schwelle_sigma", "kontrast", "wachsen_sigma", "max_radius_px",
                                      "rand_px", "ersatz_px", "streuung_px") if k in st}
    zusaetzlich = [tuple(z) for z in st.get("zusaetzlich_px", [])]
    bereinigt, maske, sterne = sterne_entfernen(bild, zusaetzlich=zusaetzlich, **stern_param)
    print(f"Sterne: {len(sterne)} erkannt, {int(maske.sum())} Pixel maskiert")
    for x, y, spitze in sorted(sterne, key=lambda t: -t[2])[:args.sterne_liste]:
        print(f"  Stern bei dx {-(x + 0.5 - bild.shape[1] / 2) * s:+7.2f}\" dy {(bild.shape[0] / 2 - y - 0.5) * s:+7.2f}\", "
              f"Rest {spitze:.4g}")
    im_bild = bereinigt if st.get("im_bild_entfernen", True) else bild

    umfang = float(p["kennlinie"]["umfang_mag"])
    kodes = kodiere_relativ(linear_zu_mu_rel(im_bild), umfang)
    mag_hell = round(eiche_mag_hell(kodes, umfang, s, p["eichung"]), 2)
    mag_dunkel = round(mag_hell + umfang, 2)
    daten_webp = webp_bytes(kodes)
    dekodiert = webp_kodes(daten_webp)
    if not np.array_equal(dekodiert, kodes):
        raise SystemExit("WebP verlustfrei, aber die dekodierten Kodes weichen ab")
    gesamt = gesamtmagnitude(dekodiert, mag_hell, mag_dunkel, s)
    print(f"Kennlinie: mag_hell {mag_hell}, mag_dunkel {mag_dunkel}, Stufe {umfang / STUFEN:.4f} mag; "
          f"Kode 0 bei {(dekodiert == 0).mean() * 100:.1f} % der Pixel, Kode 255 bei {(dekodiert == 255).sum()} Pixeln")
    print(f"Gesamthelligkeit aus dem dekodierten Bild: {gesamt:.3f} mag")
    if p["eichung"]["art"] == "gesamt":
        abweichung = gesamt - p["eichung"]["magnitude"]
        print(f"  Soll {p['eichung']['magnitude']} ({p['eichung']['quelle']}), Abweichung {abweichung:+.3f} mag")
        if abs(abweichung) > TOLERANZ_GESAMT_MAG:
            raise SystemExit(f"Gesamthelligkeit weicht um mehr als {TOLERANZ_GESAMT_MAG} mag ab")

    # Flaechentabelle am dekodierten Bild, sternbereinigt (bei im_bild_entfernen ist es das schon).
    lin = log_tabelle(mag_hell, mag_dunkel).astype(np.float64)[dekodiert]
    if not st.get("im_bild_entfernen", True):
        lin, _, _ = sterne_entfernen(lin, zusaetzlich=zusaetzlich, **stern_param)
    with np.errstate(divide="ignore"):
        mu = np.where(lin > 0, mag_hell - 2.5 * np.log10(np.where(lin > 0, lin, 1.0)), np.inf)
    tabelle = flaechentabelle(mu, s, mag_hell, mag_dunkel)
    isophoten = [{"mag_arcsec2": round(m, 1), "flaeche_arcsec2": round(a, 2)} for m, a in tabelle]
    print(f"Flaechentabelle: {len(isophoten)} Zeilen von {isophoten[0]['mag_arcsec2']} bis "
          f"{isophoten[-1]['mag_arcsec2']} mag/arcsec^2 (Flaeche {isophoten[0]['flaeche_arcsec2']} bis "
          f"{isophoten[-1]['flaeche_arcsec2']} arcsec^2)")

    if args.vorschau:
        vorschau(dekodiert, maske, args.vorschau, p["id"])
        print(f"Vorschau: {args.vorschau}")
    if args.tabelle:
        with open(args.tabelle, "w", encoding="utf-8") as f:
            json.dump(isophoten, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Flaechentabelle nach {args.tabelle} (von Hand in daten/objekte.json als isophoten uebernehmen)")
    if args.messen:
        print(f"WebP verlustfrei: {len(daten_webp)} Byte (nicht geschrieben)")
        return
    ziel = os.path.join(args.ziel, p["datei"])
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    with open(ziel, "wb") as f:
        f.write(daten_webp)
    print(f"{ziel}: {kodes.shape[1]}x{kodes.shape[0]} px, {len(daten_webp)} Byte")
    schreibe_bildnachweis(args.bildnachweis, bildnachweis(p, kopf, mag_hell, mag_dunkel, len(daten_webp), sterne,
                                                          ohne_daten, nordwinkel))
    print(f"Bildnachweis {p['id']} in {args.bildnachweis} geschrieben")


def main(argv=None):
    a = argparse.ArgumentParser(description="Deep-Sky-Bild zu Grauwert-WebP mit log-Kennlinie und Flaechentabelle")
    a.add_argument("parameter", nargs="+", help="Parameterdateien (tools/parameter/*.json)")
    a.add_argument("--ziel", default=ZIEL_STANDARD, help="Wurzel der Bilddateien (Standard daten/bilder)")
    a.add_argument("--bildnachweis", default=BILDNACHWEIS_STANDARD, help="Pfad zu bilder.json")
    a.add_argument("--vorschau", help="Ordner fuer PNG-Vorschauen (Kodes und Sternmaske, nicht ins Repo)")
    a.add_argument("--tabelle", help="Flaechentabelle zusaetzlich als JSON in diese Datei")
    a.add_argument("--sterne-liste", type=int, default=10, help="so viele hellste Sterne ausgeben")
    a.add_argument("--messen", action="store_true", help="alles rechnen und ausgeben, nichts schreiben")
    args = a.parse_args(argv)
    for pfad in args.parameter:
        verarbeite(pfad, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
