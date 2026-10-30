#!/usr/bin/env python3
"""M13 (Herkuleshaufen) als Katalogsterne plus Restlicht (Issue #108, A-Z10).

Entscheidung Herbert (2026-10-29): "Sterne plus Restlicht". Die Gaia-Mitglieder bis V 15
sind Punktquellen in daten/sterne/m13.json; im Bild wird ihr Licht entfernt, der Rest ist
die Flaeche. Flaeche plus Sterne ergeben V_t = 5,78 (Harris 2010, deep-sky.md 3.1).

Eingaben (data/roh/m13/, Herkunft und SHA-256 in data/roh/LIESMICH.md):
    - noao-m13kpno4m_publicationtiff.tif: NOIRLab noao-m13kpno4m, Publication TIFF 4K
      (4000 x 3999 px, 8 Bit sRGB, B V I als Blau Gruen Rot, "North is left, East is down"),
      CC BY 4.0;
    - m13_gaiadr3.csv: Gaia DR3, Kegel 15' um die Mitte, G < 17 (deep-sky.md 6.2), Gaia-Archiv.

Schritte:
    1. Sternliste (deep-sky.md 3.3, physik.md 22): Mitglied ist eine Quelle mit Eigenbewegung
       innerhalb 1,2 mas/a um (-3,15; -2,57) mas/a und Parallaxe unter 1,0 mas. V aus G und
       BP-RP, B-V aus BP-RP (Funktionen aus m45_sterne.py). Mitglieder bis V 15 (531 Sterne)
       nach daten/sterne/m13.json, hellste zuerst. Lage dx positiv nach Westen (Norden oben,
       Osten links, wie die Naht), dy nach Norden, relativ zur Mitte nach Harris 2010.
    2. Bild: Gruenkanal (V, 537 nm) des TIFF, um 90 Grad im Uhrzeigersinn gedreht (Norden
       oben, Osten links). Lage im Bild ueber eine affine Abbildung aus den hellen Gaia-Sternen
       (Schwerpunkte, Ausgleichsrechnung; Restfehler wird ausgegeben, Abbruch ueber 1,5 px).
    3. Vorlaeufig linear: die Bildseite nennt im AVM-Kopf die Streckung von FITS Liberator,
       Log(x) mit ScaledPeakLevel 1000 und WhiteLevel log10(1001); umgekehrt
       L = 10^(log10(1001) v / 255) - 1 (physik.md 27.1). Die Probe an Sternen zeigt, dass das
       Bild danach weiter bearbeitet ist; L ist deshalb nur eine monotone Zwischenstufe.
    4. Ausrichten und skalieren wie deep_sky_aufbereiten.ausrichten (bilinear auf feinerem
       Gitter, blockweise gemittelt) auf 0,5"/px, Objektmitte auf die Leinwandmitte.
    5. Sterne entfernen (sterne_entfernen_katalog): alle 3082 Gaia-Quellen an ihrer Katalogposition
       (Mitglieder bis V 15, Feldsterne mit Eigenbewegung nach A-X9, schwaechere Mitglieder und
       Quellen ohne Eigenbewegung, deren Licht zum Restlicht gehoert); innerhalb
       3' waechst die Maske vom Katalogort ueber die zusammenhaengenden Pixel mit Rest gegen den
       gleitenden Median ueber wachsen_sigma lokalen Streuungen, hoechstens bis zu einem Radius
       nach der Helligkeit, ausserhalb 3' ist es die ganze Kreisscheibe; maskierte Pixel bekommen
       den Median der unmaskierten Umgebung. Danach erkennt deep_sky_aufbereiten.sterne_entfernen
       was Gaia nicht fuehrt (G ab 17, Luecken im Kern). Das Licht der entfernten schwachen Sterne
       kommt ueber den Radialfaktor als glattes Restlicht zurueck.
    6. Himmelsgradient (himmel_gradient, Ebene aus Blockmedianen ausserhalb 6' nach Abzug der
       Ringmittel) und Himmelssockel (Median ab 8') abgezogen; radial abhaengig glaetten
       (glaetten, Kasten 1,5" bis 1', 7,5" ab 2,5').
    7. Restlicht (physik.md 27.2, deep-sky.md 7.2 Punkt 2): globale glatte Kennlinie L^1,85
       (Exponent aus der Sternprobe 27.1) mal einem glatten radialen Faktor g(r), dessen Knoten an
       den Ringmitten so iteriert werden, dass das Mittel jedes Rings bis 3' dem King-Profil
       (Harris 2010, auf V_t normiert) minus dem Fluss der Katalogsterne folgt. Ab 2' linear in das
       glatte Modell (King minus Sterne) uebergeblendet, ab 3' nur das Modell, das zwischen 8' und
       10' mit cos^2 auf 0 auslaeuft (keine Stufe am Leinwandrand).
    8. Kodieren mit der log-Kennlinie (ADR-0003 Nachtrag V2) und Quellweiss eichen:
       Gesamtfluss des dekodierten Bilds = V_t minus Sterne (eichung "gesamt"); Abbruch, wenn
       Flaeche plus Sterne mehr als 0,1 mag von V_t abweichen.
    9. Flaechentabelle (isophoten) wie deep_sky_aufbereiten am dekodierten, schon
       sternbereinigten Bild, auf die Ausgabe (von Hand in daten/objekte.json uebernehmen).

Aufruf aus dem Repo-Root (numpy und Pillow):
    python3 tools/m13_aufbereiten.py              Sternliste, Bild und Eintrag in bilder.json schreiben
    python3 tools/m13_aufbereiten.py --messen     alles rechnen und ausgeben, nichts schreiben
    python3 tools/m13_aufbereiten.py --bericht    nur Sternliste und Zaehlung ausgeben
    python3 tools/m13_aufbereiten.py --abrufen    Rohdaten holen (Netz), Bytes und SHA-256 ausgeben
    python3 tools/m13_aufbereiten.py --liesmich   Eintrag fuer data/roh/LIESMICH.md ausgeben
    Zusaetzlich: --profil (Ringprofil King, Sterne, Soll, Flaeche), --vorschau <ordner>, --tabelle <datei>.
Idempotent: ein zweiter Lauf schreibt dieselben Dateien.
"""

import argparse
import hashlib
import json
import math
import os
import sys
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image

from bild_aufbereiten import BILDNACHWEIS_STANDARD, ZIEL_STANDARD, schreibe_bildnachweis
from deep_sky_aufbereiten import (
    _dehnen, ausrichten, eiche_mag_hell, flaechentabelle, gesamtmagnitude, kodiere_relativ, linear_zu_mu_rel,
    log_tabelle, median_filter, robuste_streuung, sterne_entfernen, webp_bytes, webp_kodes,
)
from m45_sterne import bv_aus_bprp, lies_csv, mit_komma, v_aus_gaia

# Mitte nach Harris 2010 (deep-sky.md 3.1): 16 41 41,24 +36 27 35,5 (J2000)
MITTE_RA_GRAD = 250.42183
MITTE_DEC_GRAD = 36.45986
KEGEL_GRAD = 0.25
V_T = 5.78
V_GRENZE = 15.0
# Mitgliedschaft (deep-sky.md 3.3)
PM_MITTE = (-3.15, -2.57)
PM_RADIUS = 1.2
PLX_MAX = 1.0
# King-Profil (Harris 2010, deep-sky.md 3.2)
KING_MU0 = 16.59
KING_RC_ARCSEC = 37.2
KING_RT_ARCSEC = 1260.0

ROH_ORDNER = "data/roh/m13"
TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
GAIA_DATEI = "m13_gaiadr3.csv"
GAIA_ADQL = (
    "SELECT source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax, parallax_error, pmra, pmdec, ruwe "
    "FROM gaiadr3.gaia_source WHERE 1 = CONTAINS(POINT('ICRS', ra, dec), "
    f"CIRCLE('ICRS', {MITTE_RA_GRAD}, {MITTE_DEC_GRAD}, {KEGEL_GRAD})) "
    "AND phot_g_mean_mag < 17.0 ORDER BY phot_g_mean_mag"
)
BILD_DATEI = "noao-m13kpno4m_publicationtiff.tif"
BILD_URL = "https://storage.noirlab.edu/media/archives/images/publicationtiff/noao-m13kpno4m.tif"
ROHDATEN = {
    GAIA_DATEI: {"bytes": 468998, "abruf": "2026-10-29",
                 "sha256": "f4c625fdfe9b8094cab87b393fd2620016edbc02edef6c0f925aa46d3ef781b1"},
    BILD_DATEI: {"bytes": 36445644, "abruf": "2026-10-29",
                 "sha256": "7e50eb187af2e281d905d70fdaa710ac15c99ed3e55a4301d865597171454522"},
}

# Bild
KANAL = 1  # Gruen = V (537 nm), AVM Spectral.ColorAssignment
ORIGINAL_PIXEL = "4000x3999"
NATIV_ARCSEC = 0.2617 * 4929 / 4000  # AVM Spatial.Scale 7,27e-5 Grad fuer 4929 px, Datei 4000 px
FL_WEISS = math.log10(1001.0)  # AVM FL.WhiteLevel 3,00043 = log10(ScaledPeakLevel + 1)
START_MITTE_PX = (2084.7, 2001.6)  # Startwert der Ausgleichsrechnung im gedrehten Bild (Spalte, Zeile)
ASTROMETRIE_G_MAX = 14.5
ASTROMETRIE_R_MIN_ARCSEC = 240.0
ASTROMETRIE_REST_MAX_PX = 1.5
MASSSTAB = 0.5
LEINWAND = 2400
UEBERABTASTUNG = 3
WINKELGROESSE_ARCSEC = 1200.0
UMFANG_MAG = 11.0
# Sterne entfernen: Hoechstradius in Bogensekunden nach G (gemessen an freistehenden Sternen
# ausserhalb 6': Rest unter 2 Kodes bei 3,2" fuer G 16,5; Faktor 1,35 je mag, damit auch die
# schwachen Hoefe der Sterne um G 10 unter der Tonkurve verschwinden), Mindestkern 1".
RADIUS_ARCSEC = (3.2, 1.35, 16.5)
RADIUS_GRENZEN_ARCSEC = (2.5, 25.0)
KERN_ARCSEC = 1.0
VOLL_AB_ARCSEC = 180.0  # ausserhalb 3' ganze Kreisscheiben statt gewachsener Masken
FENSTER_PX = 15
WACHSEN_SIGMA = 2.0
RAND_PX = 2
ERSATZ_PX = 21
# Glaettung des Restlichts vor der Kennlinie: Kastenfilter GLATT_KLEIN_PX innen, GLATT_GROSS_PX aussen,
# linear uebergeblendet zwischen GLATT_UEBERGANG_ARCSEC (Rauschen des 8-Bit-Bilds und Reste der zu 50 bis
# 85 % ersetzten Pixel zwischen 1' und 3', sonst Restspitzen heller als V 15).
GLATT_KLEIN_PX = 3
GLATT_GROSS_PX = 15
GLATT_UEBERGANG_ARCSEC = (60.0, 150.0)
# Bild nur, wo der Haufen den Himmelsrest des Pressebilds klar ueberragt: bis BILD_BIS_ARCSEC[0] das Bild,
# bis [1] linear in das glatte Modell (King minus Sterne) uebergeblendet, weiter aussen nur das Modell.
# Gemessen am sternbereinigten Bild: Himmelsrest etwa 2,5 (Einheit von fl_linear je arcsec^2) mit
# +-25 % zwischen acht Sektoren; der Haufen liegt im Ring 180" bis 240" bei 11, im Ring 240" bis 300"
# nur noch bei 4,5, also kaum ueber dem Himmel. Zwischen 2' und 3' sind schon 70 bis 85 % der Pixel
# ersetzt; mit Bild bis 4,5' blieben 46 Restspitzen heller als V 15, mit Bild bis 3' zwei.
# Ringe (Aussenradien in Bogensekunden; der letzte erfasst die Leinwandecken).
BILD_BIS_ARCSEC = (120.0, 180.0)
RINGE_ARCSEC = (8, 16, 24, 32, 40, 50, 60, 75, 90, 105, 120, 140, 160, 180, 210, 240, 270, 300, 340, 380,
                420, 470, 520, 570, 600, 650, 700, 760, 850)
ITERATIONEN = 12
# Kennlinie des Bilds: L^EXPONENT (Sternprobe physik.md 27.1: Steigung 0,54, 1/0,54 = 1,85)
EXPONENT = 1.85
# Modell am Rand: zwischen 8' und 10' mit cos^2 auf 0 (sonst Stufe am Leinwandrand, im 80 mm als Quadrat sichtbar)
AUSLAUF_ARCSEC = (480.0, 600.0)
# Restspitzen: Aperturfluss 3" minus Ring 6" bis 10" zwischen diesen Radien
RESTSPITZEN_R_ARCSEC = (20.0, 300.0)
# Himmelsgradient: Ebene aus den Blockmedianen (BLOCK_PX) ausserhalb GRADIENT_R_MIN_ARCSEC, nach Abzug
# der Ringmittel (20"-Ringe), damit die radiale Struktur des Haufens nicht in die Ebene geht.
GRADIENT_R_MIN_ARCSEC = 360.0
GRADIENT_RING_ARCSEC = 20.0
BLOCK_PX = 40
# Himmelssockel: Median des vorlaeufig linearen Bilds ausserhalb dieses Radius (dort ist der Haufen im
# Pressebild nicht vom Himmel zu trennen, physik.md 27.2), vor der Potenz abgezogen.
HIMMEL_R_MIN_ARCSEC = 480.0

BILDNACHWEIS = {
    "id": "m13_noirlab_mayall",
    "objekt": "m13",
    "zustand": "m13",
    "datei": "m13/noirlab_mayall_v_rest.webp",
    "quelle_url": "https://noirlab.edu/public/images/noao-m13kpno4m/",
    "quelle_datei": "noao-m13kpno4m.tif, Publication TIFF 4K (" + BILD_URL + ")",
    "mission": "NSF Nicholas U. Mayall 4-meter Telescope, Kitt Peak National Observatory",
    "instrument": "Mosaic I, Filter B (436 nm), V (537 nm), I (805 nm); Kern aus vielen kurzen Belichtungen",
    "aufnahmedatum": "nicht angegeben (Bildseite veroeffentlicht 2020-06-30)",
    "lizenz": "CC BY 4.0 (NOIRLab)",
    "lizenz_url": "https://noirlab.edu/public/copyright/",
    "namensnennung": "T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA)",
    "aenderungsvermerk": ("gedreht (Norden oben), zugeschnitten, skaliert, Graustufe aus dem V-Kanal, Tonkurve "
                          "auf ein Flaechenhelligkeitsprofil, Sterne entfernt, ausserhalb 2' bis 3' durch ein Profilmodell ersetzt"),
}

QUELLE = ("ESA Gaia DR3 (gaiadr3.gaia_source; Gaia Collaboration, Vallenari et al. 2023, A&A 674, A1), "
          "abgefragt im Gaia-Archiv " + TAP_URL + ". Credit: ESA, Gaia DPAC.")
LIZENZ = ("CC BY-NC 3.0 IGO (https://creativecommons.org/licenses/by-nc/3.0/igo/), "
          "Daten der ESA Space Science Archives; kommerzielle Nutzung nur nach Genehmigung "
          "(data.licences@esa.int, https://www.cosmos.esa.int/web/esdc/terms-and-conditions)")


# ---------------------------------------------------------------------------
# Sternliste

def lage_arcsec(ra, dec):
    """Offset zur Mitte: dx positiv nach Westen (Osten links, Naht +x rechts), dy nach Norden (deep-sky.md, Kopf)."""
    dx = -(ra - MITTE_RA_GRAD) * math.cos(math.radians(MITTE_DEC_GRAD)) * 3600.0
    dy = (dec - MITTE_DEC_GRAD) * 3600.0
    return dx, dy


def ist_mitglied(z):
    """Eigenbewegung innerhalb PM_RADIUS um PM_MITTE und Parallaxe unter PLX_MAX (deep-sky.md 3.3)."""
    if z["pmra"] is None or z["pmdec"] is None or z["parallax"] is None:
        return False
    return (math.hypot(z["pmra"] - PM_MITTE[0], z["pmdec"] - PM_MITTE[1]) <= PM_RADIUS
            and z["parallax"] < PLX_MAX)


def katalog(gaia):
    """Alle Gaia-Quellen mit Lage, V, B-V und Art: "stern" (Mitglied bis V 15), "feld" (Nicht-Mitglied mit
    Eigenbewegung), "rest" (Mitglied schwaecher als V 15 oder ohne V, Quelle ohne Eigenbewegung)."""
    liste = []
    for z in gaia:
        dx, dy = lage_arcsec(z["ra"], z["dec"])
        v = v_aus_gaia(z["phot_g_mean_mag"], z["bp_rp"])
        bv = bv_aus_bprp(z["bp_rp"])
        mitglied = ist_mitglied(z)
        if mitglied and v is not None and bv is not None and v <= V_GRENZE:
            art = "stern"
        elif not mitglied and z["pmra"] is not None:
            art = "feld"
        else:
            art = "rest"
        liste.append({"gaia": z["source_id"], "dx": dx, "dy": dy, "g": z["phot_g_mean_mag"], "v": v,
                      "bv": bv, "mitglied": mitglied, "art": art})
    return liste


def sterne(kat):
    """Mitglieder bis V 15, hellste zuerst (gleiche V nach Gaia-Kennung)."""
    return sorted((s for s in kat if s["art"] == "stern"), key=lambda s: (s["v"], s["gaia"]))


def fluss(v):
    return 10.0 ** (-0.4 * v)


def sternliste(kat):
    liste = sterne(kat)
    summe = -2.5 * math.log10(sum(fluss(round(s["v"], 2)) for s in liste))
    anteil = sum(fluss(round(s["v"], 2)) for s in liste) / fluss(V_T)
    mitglieder = sum(1 for s in kat if s["mitglied"])
    ohne_v = sum(1 for s in kat if s["mitglied"] and (s["v"] is None or s["bv"] is None))
    abruf = ROHDATEN[GAIA_DATEI]["abruf"]
    kommentar = (
        f"Erzeugt von tools/m13_aufbereiten.py aus einer Abfrage im Gaia-Archiv (Abruf {abruf}, ADQL und SHA-256 in "
        f"data/roh/LIESMICH.md): Kegel {mit_komma(KEGEL_GRAD * 60)}' um 16 41 41,24 +36 27 35,5 (Harris 2010), G < 17, "
        f"{len(kat)} Quellen. Mitglieder nach deep-sky.md 3.3 (Eigenbewegung innerhalb {mit_komma(PM_RADIUS)} mas/a um "
        f"({mit_komma(PM_MITTE[0])}; {mit_komma(PM_MITTE[1])}) mas/a, Parallaxe unter {mit_komma(PLX_MAX)} mas): "
        f"{mitglieder}, davon {ohne_v} ohne BP-RP (kein V, bleiben in der Flaeche). Hier die {len(liste)} Mitglieder "
        f"bis V {mit_komma(V_GRENZE)}; V aus G und BP-RP nach Gaia DR3 Dokumentation 5.5.1 Tabelle 5.9, B-V aus "
        "BP-RP = f(B-V) derselben Tabelle, invertiert (physik.md 22; fuer die roten Riesen Extrapolation der "
        "Plejaden-Probe, deep-sky.md 6.3). Lage dx nach Westen (Norden oben, Osten links), dy nach Norden, "
        "Gaia-Epoche 2016,0. Im Quellbild (bilder.json m13_noirlab_mayall) ist ihr Licht entfernt, die Flaeche "
        "traegt den Rest (Entscheidung Herbert 2026-10-29, Issue #108). Summe der Sterne V "
        + f"{summe:.2f}".replace(".", ",") + f", {anteil * 100:.1f}".replace(".", ",") + " % von V_t 5,78."
    )
    return {
        "objekt": "m13",
        "quelle": QUELLE,
        "lizenz": LIZENZ,
        "kommentar": kommentar,
        "sterne": [{
            "name": f"Gaia DR3 {s['gaia']}",
            "dx_arcsec": round(s["dx"], 1),
            "dy_arcsec": round(s["dy"], 1),
            "magnitude": round(s["v"], 2),
            "b_v": round(s["bv"], 2),
            "katalog": f"Gaia DR3 {s['gaia']}",
            "quelle_farbe": "GDR3",
        } for s in liste],
    }


# ---------------------------------------------------------------------------
# King-Profil

def king_relativ(r):
    """King 1962, I(r)/I0 (deep-sky.md 3.2), null ab r_t."""
    r = np.asarray(r, dtype=np.float64)
    b = (1.0 + (KING_RT_ARCSEC / KING_RC_ARCSEC) ** 2) ** -0.5
    a = (1.0 + (r / KING_RC_ARCSEC) ** 2) ** -0.5
    return np.where(r < KING_RT_ARCSEC, ((a - b) / (1.0 - b)) ** 2, 0.0)


def king_integral():
    """Integral von I/I0 ueber die Flaeche bis r_t in arcsec^2 (Trapezregel, 0,01"-Schritte)."""
    r = np.linspace(0.0, KING_RT_ARCSEC, 126001)
    y = king_relativ(r) * 2.0 * math.pi * r
    return float(((y[1:] + y[:-1]) * 0.5 * np.diff(r)).sum())


def king_i0_normiert():
    """I0 in Fluss je arcsec^2 (Einheit 10^(-0,4 m)), so dass das Profil bis r_t V_t ergibt (physik.md 27.2)."""
    return fluss(V_T) / king_integral()


# ---------------------------------------------------------------------------
# Bild: Lage, Linearisierung, Sterne, Tonkurve

def lade_bild(pfad):
    """V-Kanal (Gruen) des TIFF als float, um 90 Grad im Uhrzeigersinn gedreht (Norden oben, Osten links)."""
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(pfad) as im:
        if im.mode != "RGB" or f"{im.size[0]}x{im.size[1]}" != ORIGINAL_PIXEL:
            raise SystemExit(f"{pfad}: {im.mode} {im.size[0]}x{im.size[1]}, erwartet RGB {ORIGINAL_PIXEL}")
        rgb = np.asarray(im)
    return np.rot90(rgb, k=-1)[..., KANAL].astype(np.float64)


def kern_saettigung(kodes, mitte_px, massstab_px, radius_arcsec=60.0):
    """Anteil der Pixel mit Kode 255 und hoechster Kode im Kreis radius_arcsec um die Mitte."""
    h, w = kodes.shape
    yy, xx = np.mgrid[0:h, 0:w]
    kreis = np.hypot(xx - mitte_px[0], yy - mitte_px[1]) * massstab_px <= radius_arcsec
    werte = kodes[kreis]
    return float((werte >= 255).mean()), int(werte.max()), float(np.median(werte)), int(kreis.sum())


def schwerpunkt(bild, x, y, suche, halb=3):
    """Hellstes Pixel im Fenster +-suche um (x, y), dann Schwerpunkt im Fenster +-halb ueber dessen Minimum."""
    h, w = bild.shape
    xi, yi = int(round(x)), int(round(y))
    if not (suche + halb < xi < w - suche - halb and suche + halb < yi < h - suche - halb):
        return None
    fenster = bild[yi - suche:yi + suche + 1, xi - suche:xi + suche + 1]
    j = np.unravel_index(int(np.argmax(fenster)), fenster.shape)
    py, px = yi - suche + j[0], xi - suche + j[1]
    w_ = bild[py - halb:py + halb + 1, px - halb:px + halb + 1]
    w_ = w_ - w_.min()
    if w_.sum() <= 0:
        return None
    yy, xx = np.mgrid[-halb:halb + 1, -halb:halb + 1]
    return px + float((w_ * xx).sum() / w_.sum()), py + float((w_ * yy).sum() / w_.sum())


def astrometrie(bild, kat, start_mitte=START_MITTE_PX, massstab=NATIV_ARCSEC):
    """Affine Abbildung (dx West, dy Nord in ") -> (Spalte, Zeile) aus hellen, freistehenden Gaia-Quellen.

    Rueckgabe (ax, ay, rest_median_px, anzahl): Spalte = ax0 + ax1 dx + ax2 dy, Zeile = ay0 + ay1 dx + ay2 dy.
    Start: Mitte start_mitte, Westen rechts, Norden oben, Massstab massstab; danach Schwerpunkte mit
    schrumpfendem Suchfenster und Ausgleichsrechnung, Ausreisser (Rest ueber dreimal Median plus 0,5 px)
    verworfen.
    """
    hell = [s for s in kat if s["g"] < ASTROMETRIE_G_MAX and math.hypot(s["dx"], s["dy"]) > ASTROMETRIE_R_MIN_ARCSEC]
    ax = np.array([start_mitte[0], 1.0 / massstab, 0.0])
    ay = np.array([start_mitte[1], 0.0, -1.0 / massstab])
    rest = np.array([np.inf])
    ok = np.zeros(0, bool)
    for suche in (12, 8, 5, 4, 4):
        p, q = [], []
        for s in hell:
            x = ax[0] + ax[1] * s["dx"] + ax[2] * s["dy"]
            y = ay[0] + ay[1] * s["dx"] + ay[2] * s["dy"]
            sp = schwerpunkt(bild, x, y, suche)
            if sp is not None:
                p.append((s["dx"], s["dy"]))
                q.append(sp)
        p, q = np.array(p), np.array(q)
        a = np.c_[np.ones(len(p)), p]
        fx = np.linalg.lstsq(a, q[:, 0], rcond=None)[0]
        fy = np.linalg.lstsq(a, q[:, 1], rcond=None)[0]
        rest = np.hypot(a @ fx - q[:, 0], a @ fy - q[:, 1])
        ok = rest < np.median(rest) * 3 + 0.5
        ax = np.linalg.lstsq(a[ok], q[ok, 0], rcond=None)[0]
        ay = np.linalg.lstsq(a[ok], q[ok, 1], rcond=None)[0]
        rest = np.hypot(a @ ax - q[:, 0], a @ ay - q[:, 1])
    return ax, ay, float(np.median(rest[ok])), int(ok.sum())


def cd_aus_affin(ax, ay, hoehe):
    """CD-Matrix (Grad je Pixel) und Mitte fuer deep_sky_aufbereiten.ausrichten, dessen Zeile 0 unten liegt
    (FITS): das Bild wird dafuer senkrecht gespiegelt (Zeile' = hoehe - 1 - Zeile).

    Aus Spalte = ax0 - ax1 3600 xi + ax2 3600 eta (xi nach Osten = -dx, eta = dy, in Grad) und
    Zeile' = hoehe - 1 - ay0 + ay1 3600 xi - ay2 3600 eta folgt Pixel = Mitte + M (xi, eta), CD = M^-1.
    """
    m = np.array([[-ax[1] * 3600.0, ax[2] * 3600.0], [ay[1] * 3600.0, -ay[2] * 3600.0]])
    return np.linalg.inv(m), (float(ax[0]), float(hoehe - 1 - ay[0]))


def fl_linear(kodes):
    """Umkehrung der Log-Streckung von FITS Liberator laut AVM-Kopf: L = 10^(log10(1001) v/255) - 1 (physik.md 27.1)."""
    return 10.0 ** (FL_WEISS * np.asarray(kodes, dtype=np.float64) / 255.0) - 1.0


def stern_radius_arcsec(g):
    """Hoechstradius der Maske nach der G-Helligkeit (RADIUS_ARCSEC, begrenzt auf RADIUS_GRENZEN_ARCSEC)."""
    basis, faktor, g0 = RADIUS_ARCSEC
    return min(RADIUS_GRENZEN_ARCSEC[1], max(RADIUS_GRENZEN_ARCSEC[0], basis * faktor ** (g0 - g)))


def sterne_entfernen_katalog(bild, orte, massstab, fenster_px=FENSTER_PX, wachsen_sigma=WACHSEN_SIGMA,
                             rand_px=RAND_PX, ersatz_px=ERSATZ_PX, kern_arcsec=KERN_ARCSEC):
    """Sterne an bekannten Orten entfernen; Rueckgabe (bereinigt, maske).

    orte: [(x, y, radius_arcsec, voll)] in Pixelindizes (Zentrum von Pixel 0 bei 0). voll: die ganze
    Kreisscheibe (aussen, wo Sterne nicht gedraengt stehen; so verschwinden auch die schwachen Hoefe).
    Sonst ein Kern von kern_arcsec, dazu alle damit zusammenhaengenden Pixel mit Rest gegen den
    gleitenden Median (fenster_px) ueber wachsen_sigma lokalen Streuungen (robust, Fenster fenster_px),
    nicht weiter als radius_arcsec; dann um rand_px erweitert (innerhalb des Radius). Im dichten Kern
    ist die lokale Streuung gross, die Maske bleibt dort klein. Maskierte Pixel bekommen den Median der
    unmaskierten Pixel im Fenster ersatz_px (bei Bedarf doppelt und vierfach so gross).
    """
    h, w = bild.shape
    med = median_filter(bild, fenster_px)
    rest = bild - med
    sigma = 1.4826 * median_filter(np.abs(rest), fenster_px)
    sigma = np.maximum(sigma, robuste_streuung(rest) * 0.1)
    wachsen = rest > wachsen_sigma * sigma
    maske = np.zeros(bild.shape, bool)
    for x, y, radius_arcsec, voll in orte:
        r = int(math.ceil(radius_arcsec / massstab))
        xi, yi = int(round(x)), int(round(y))
        if not (-r <= xi < w + r and -r <= yi < h + r):
            continue
        y0, y1, x0, x1 = max(0, yi - r), min(h, yi + r + 1), max(0, xi - r), min(w, xi + r + 1)
        if y0 >= y1 or x0 >= x1:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1]
        abstand = np.hypot(xx - x, yy - y)
        kreis = abstand <= radius_arcsec / massstab
        if voll:
            maske[y0:y1, x0:x1] |= kreis
            continue
        erlaubt = wachsen[y0:y1, x0:x1] & kreis
        teil = abstand <= max(1.5, kern_arcsec / massstab)
        while True:
            neu = (_dehnen(teil) & erlaubt) | teil
            if (neu == teil).all():
                break
            teil = neu
        for _ in range(rand_px):
            teil = (_dehnen(teil) & kreis) | teil
        maske[y0:y1, x0:x1] |= teil
    bereinigt = bild.copy()
    halb = ersatz_px // 2
    for y, x in np.argwhere(maske):
        for weite in (halb, 2 * halb, 4 * halb):
            y0, y1, x0, x1 = max(0, y - weite), min(h, y + weite + 1), max(0, x - weite), min(w, x + weite + 1)
            frei = ~maske[y0:y1, x0:x1]
            if frei.any():
                bereinigt[y, x] = np.median(bild[y0:y1, x0:x1][frei])
                break
    return bereinigt, maske


def kode_mu(kodes, mag_hell, mag_dunkel):
    """Flaechenhelligkeit je Pixel aus den Kodes ueber die 256er-Tabelle wie deep_sky_aufbereiten (Kode 0: inf)."""
    lin = log_tabelle(mag_hell, mag_dunkel).astype(np.float64)[kodes]
    with np.errstate(divide="ignore"):
        return np.where(lin > 0, mag_hell - 2.5 * np.log10(np.where(lin > 0, lin, 1.0)), np.inf)


def himmel_gradient(bild, massstab, r_min=GRADIENT_R_MIN_ARCSEC, ring_breite=GRADIENT_RING_ARCSEC, block=BLOCK_PX):
    """Linearer Himmelsgradient (Ebene durch die Leinwandmitte mit Wert 0) ausserhalb r_min.

    Je Pixel wird das Mittel seines Rings (Breite ring_breite) abgezogen; die Ebene b x + c y (x nach
    rechts, y nach unten, in Pixeln von der Mitte) wird an die Mediane dieser Reste in Bloecken
    block x block angepasst (kleinste Quadrate). Die Pressebilder haben einen Rest von Himmel, im
    Rohbild von M13 Kode 11 links oben gegen 4 rechts unten; die Tonkurve, die das schwache Ende stark
    anhebt, machte daraus einen einseitigen Halo. Rueckgabe (Ebene, b, c).
    """
    n = bild.shape[0]
    achse = np.arange(n) + 0.5 - n / 2
    xx, yy = np.meshgrid(achse, achse)
    r = np.hypot(xx, yy) * massstab
    aussen = r >= r_min
    nummer = (r / ring_breite).astype(np.int64)
    zahl = np.bincount(nummer[aussen], minlength=nummer.max() + 1)
    summe = np.bincount(nummer[aussen], weights=bild[aussen], minlength=nummer.max() + 1)
    mittel = np.where(zahl > 0, summe / np.maximum(zahl, 1), 0.0)
    rest = bild - mittel[nummer]
    px, py, wert = [], [], []
    for y0 in range(0, n - block + 1, block):
        for x0 in range(0, n - block + 1, block):
            teil = aussen[y0:y0 + block, x0:x0 + block]
            if teil.mean() < 0.9:
                continue
            px.append(xx[y0:y0 + block, x0:x0 + block].mean())
            py.append(yy[y0:y0 + block, x0:x0 + block].mean())
            wert.append(np.median(rest[y0:y0 + block, x0:x0 + block][teil]))
    a = np.c_[px, py]
    (b, c), *_ = np.linalg.lstsq(a, np.array(wert), rcond=None)
    return b * xx + c * yy, float(b), float(c)


def kasten(bild, breite):
    """Gleitendes Mittel ueber breite x breite Pixel (ungerade), Rand gespiegelt; ueber Summenbilder."""
    r = breite // 2
    g = np.pad(bild, r, mode="reflect")
    s = np.cumsum(np.cumsum(np.pad(g, ((1, 0), (1, 0))), axis=0), axis=1)
    h, w = bild.shape
    return (s[breite:breite + h, breite:breite + w] - s[:h, breite:breite + w] - s[breite:breite + h, :w]
            + s[:h, :w]) / breite ** 2


def glaetten(bild, r, klein=GLATT_KLEIN_PX, gross=GLATT_GROSS_PX, uebergang=GLATT_UEBERGANG_ARCSEC):
    """Restlicht radial abhaengig glaetten: innen Kasten klein, aussen Kasten gross, dazwischen linear
    gemischt. Das Restlicht ist nach dem Entfernen der Sterne glatt; das Rauschen des 8-Bit-Bilds (einige
    Kodes) liegt im aeusseren Halo in der Groesse des Signals und wuerde von der Tonkurve verstaerkt."""
    w = np.clip((r - uebergang[0]) / (uebergang[1] - uebergang[0]), 0.0, 1.0)
    return (1.0 - w) * kasten(bild, klein) + w * kasten(bild, gross)


def gewicht_bild(r, grenzen=BILD_BIS_ARCSEC):
    """Anteil des Bilds am Restlicht: 1 bis grenzen[0], linear auf 0 bei grenzen[1]."""
    return np.clip((grenzen[1] - r) / (grenzen[1] - grenzen[0]), 0.0, 1.0)


def modell(r, soll, i0, grenzen=RINGE_ARCSEC):
    """Glattes Restlicht: King (auf V_t normiert) mal dem Verhaeltnis Soll / King, linear ueber die Ringmitten
    interpoliert (aussen konstant fortgesetzt), am Rand mit auslauf auf 0. Folgt der King-Form, traegt aber
    den Abzug der Sterne."""
    mitten = ringmitten(grenzen)
    king = i0 * king_relativ(mitten)
    return i0 * king_relativ(r) * np.interp(r, mitten, soll / king) * auslauf(r)


def radien_leinwand(n, massstab):
    """Abstand jedes Pixelzentrums von der Leinwandmitte in Bogensekunden."""
    achse = (np.arange(n) + 0.5 - n / 2) * massstab
    return np.hypot(achse[None, :], achse[:, None])


def ringe(r, grenzen=RINGE_ARCSEC):
    """Ringnummer je Pixel (0 bis len(grenzen) - 1), -1 jenseits des letzten Rings."""
    nummer = np.searchsorted(np.asarray(grenzen, dtype=np.float64), r, side="right")
    return np.where(nummer < len(grenzen), nummer, -1)


def ziel_rest(ring, r, massstab, sterne_px, i0, anzahl):
    """Sollmittel je Ring: King (auf V_t normiert) minus Fluss der Katalogsterne je Flaeche (physik.md 27.2).

    sterne_px: [(x, y, fluss)] in Pixelindizes der Leinwand. Der Sternfluss wird ueber den Ring und
    seine beiden Nachbarn gemittelt (weniger Rauschen durch einzelne helle Sterne), das Soll ist
    nach aussen nicht steigend und mindestens 5 Prozent des King-Werts. Rueckgabe (soll, king, sterne)
    je Ring in Fluss je arcsec^2.
    """
    n = ring.shape[0]
    flaeche = np.bincount(ring[ring >= 0], minlength=anzahl).astype(np.float64) * massstab ** 2
    king = np.bincount(ring[ring >= 0], weights=king_relativ(r[ring >= 0]), minlength=anzahl) * massstab ** 2
    king = king / flaeche * i0
    stern = np.zeros(anzahl)
    for x, y, f in sterne_px:
        xi, yi = int(math.floor(x + 0.5)), int(math.floor(y + 0.5))
        if 0 <= xi < n and 0 <= yi < n and ring[yi, xi] >= 0:
            stern[ring[yi, xi]] += f
    geglaettet = np.array([stern[max(0, i - 1):i + 2].sum() / flaeche[max(0, i - 1):i + 2].sum()
                           for i in range(anzahl)])
    soll = np.maximum(king - geglaettet, 0.05 * king)
    for i in range(1, anzahl):
        soll[i] = min(soll[i], soll[i - 1])
    return soll, king, geglaettet


def ringmitten(grenzen=RINGE_ARCSEC):
    """Mittlerer Radius jedes Rings (halbe Summe von Innen- und Aussenradius)."""
    innen = np.r_[0.0, np.asarray(grenzen[:-1], dtype=np.float64)]
    return 0.5 * (innen + np.asarray(grenzen, dtype=np.float64))


def kennlinie_bild(werte, exponent=EXPONENT):
    """Globale, glatte Abbildung des vorlaeufig linearen Bilds: L^exponent, L <= 0 wird 0 (physik.md 27.2).
    Der Exponent kommt aus der Sternprobe (Aperturfluss gegen V mit Steigung 0,54, 1/0,54 = 1,85)."""
    return np.where(werte > 0, np.abs(werte) ** exponent, 0.0)


def radialfaktor(r, knoten_r, knoten_g):
    """Glatter Faktor g(r): linear in log g ueber die Ringmitten interpoliert, aussen konstant."""
    return 10.0 ** np.interp(r, knoten_r, np.log10(knoten_g))


def restlicht_anpassen(bild, ring, r, soll, iterationen=ITERATIONEN, grenzen=RINGE_ARCSEC):
    """Restlicht = g(r) * L^exponent mit einem glatten radialen Faktor g, dessen Knoten (Ringmitten) so
    korrigiert werden, dass die Ringmittel das Soll treffen. Die Abbildung der Pixelwerte ist global und
    streng monoton (keine flachen Stuecke); das Ringmittel traegt g. Rueckgabe (Restlicht, Knoten g, Ist je Ring).

    ring: Ringnummer je Pixel, -1 ausserhalb der angepassten Ringe; soll je angepasstem Ring.
    """
    anzahl = len(soll)
    innen = ring >= 0
    zahl = np.bincount(ring[innen], minlength=anzahl).astype(np.float64)
    f = kennlinie_bild(bild)
    mittel = np.bincount(ring[innen], weights=f[innen], minlength=anzahl) / zahl
    knoten_r = ringmitten(grenzen)[:anzahl]
    knoten_g = soll / mittel
    for _ in range(iterationen):
        aus = radialfaktor(r, knoten_r, knoten_g) * f
        ist = np.bincount(ring[innen], weights=aus[innen], minlength=anzahl) / zahl
        knoten_g = knoten_g * soll / ist
    aus = radialfaktor(r, knoten_r, knoten_g) * f
    ist = np.bincount(ring[innen], weights=aus[innen], minlength=anzahl) / zahl
    return aus, knoten_g, ist


def auslauf(r, grenzen=AUSLAUF_ARCSEC):
    """Faktor des Modells am Rand: 1 bis grenzen[0], cos^2 auf 0 bei grenzen[1] (keine Stufe am Leinwandrand)."""
    x = np.clip((r - grenzen[0]) / (grenzen[1] - grenzen[0]), 0.0, 1.0)
    return np.where(x >= 1.0, 0.0, np.cos(0.5 * math.pi * x) ** 2)


def kodeanteil_je_ring(kodes, ring, anzahl):
    """Groesster Anteil eines einzelnen Kodes (ohne Kode 0, kein Licht) an den Pixeln jedes Rings (Plateau-Pruefung)."""
    aus = np.zeros(anzahl)
    for i in range(anzahl):
        werte = kodes[ring == i]
        if werte.size:
            aus[i] = np.bincount(werte, minlength=256)[1:].max() / werte.size
    return aus


def restspitzen(linear, massstab, r_bereich=RESTSPITZEN_R_ARCSEC, apertur=3.0, hintergrund=(6.0, 10.0),
                grenze_v=V_GRENZE):
    """Lokale Maxima der Flaeche (Fenster 2 Aperturradien) zwischen r_bereich, deren Aperturfluss (Radius
    apertur, minus Median des Rings hintergrund mal Aperturflaeche) heller als grenze_v ist.
    linear: Fluss je arcsec^2 (Einheit 10^(-0,4 m)). Rueckgabe [(V, r, x, y)], hellste zuerst."""
    n = linear.shape[0]
    rr = radien_leinwand(n, massstab)
    k = int(math.ceil(hintergrund[1] / massstab))
    yy, xx = np.mgrid[-k:k + 1, -k:k + 1]
    d = np.hypot(xx, yy) * massstab
    ap, ri = d <= apertur, (d >= hintergrund[0]) & (d <= hintergrund[1])
    h = int(round(apertur / massstab))
    g = np.pad(linear, h, mode="edge")
    nachbar = np.full(linear.shape, -np.inf)
    for oy in range(-h, h + 1):
        for ox in range(-h, h + 1):
            if (ox, oy) != (0, 0):
                np.maximum(nachbar, g[h + oy:h + oy + n, h + ox:h + ox + n], out=nachbar)
    kand = np.argwhere((linear > nachbar) & (rr >= r_bereich[0]) & (rr <= r_bereich[1]))
    aus = []
    for y, x in kand:
        if not (k <= y < n - k and k <= x < n - k):
            continue
        fenster = linear[y - k:y + k + 1, x - k:x + k + 1]
        f = (fenster[ap].sum() - np.median(fenster[ri]) * ap.sum()) * massstab ** 2
        if f > 0 and -2.5 * math.log10(f) < grenze_v:
            aus.append((-2.5 * math.log10(f), float(rr[y, x]), int(x), int(y)))
    return sorted(aus)


# ---------------------------------------------------------------------------
# Ablauf

def pruefe_rohdatei(pfad, soll):
    h = hashlib.sha256()
    groesse = 0
    with open(pfad, "rb") as f:
        for teil in iter(lambda: f.read(1 << 22), b""):
            h.update(teil)
            groesse += len(teil)
    if groesse != soll["bytes"] or h.hexdigest() != soll["sha256"]:
        raise SystemExit(f"{pfad}: Bytes oder SHA-256 weichen von ROHDATEN ab (neu abgerufen?)")


def lade_gaia(ordner, pruefen=True):
    pfad = os.path.join(ordner, GAIA_DATEI)
    if pruefen:
        pruefe_rohdatei(pfad, ROHDATEN[GAIA_DATEI])
    with open(pfad, encoding="utf-8") as f:
        return lies_csv(f.read(), felder_text=("source_id",))  # 19 Stellen: als Text, float verliert Stellen


def bericht(kat):
    liste = sterne(kat)
    print(f"Gaia-Quellen {len(kat)}, Mitglieder {sum(1 for s in kat if s['mitglied'])}, "
          f"davon ohne V {sum(1 for s in kat if s['mitglied'] and (s['v'] is None or s['bv'] is None))}; "
          f"Feldsterne mit Eigenbewegung {sum(1 for s in kat if s['art'] == 'feld')}")
    print("Zaehlung (deep-sky.md 3.3: 22 / 62 / 115 / 188 / 301 / 531 bis V 12,5 / 13 / 13,5 / 14 / 14,5 / 15):")
    print("    " + " / ".join(str(sum(1 for s in liste if s["v"] <= g)) for g in (12.5, 13, 13.5, 14, 14.5, 15)))
    f = sum(fluss(round(s["v"], 2)) for s in liste)
    print(f"Summe der Sterne V {-2.5 * math.log10(f):.3f}, Anteil an V_t {f / fluss(V_T) * 100:.1f} %, "
          f"Rest V {-2.5 * math.log10(fluss(V_T) - f):.3f}")
    for s in liste[:8]:
        print(f"    Gaia DR3 {s['gaia']:<20} dx {s['dx']:8.1f} dy {s['dy']:8.1f} V {s['v']:6.2f} B-V {s['bv']:5.2f}")


def verarbeite(args):
    kat = katalog(lade_gaia(args.roh))
    liste = sternliste(kat)
    bericht(kat)
    stern_fluss = sum(fluss(s["magnitude"]) for s in liste["sterne"])
    m_rest = -2.5 * math.log10(fluss(V_T) - stern_fluss)

    pfad = os.path.join(args.roh, BILD_DATEI)
    pruefe_rohdatei(pfad, ROHDATEN[BILD_DATEI])
    kodes_roh = lade_bild(pfad)
    ax, ay, rest_px, anzahl = astrometrie(kodes_roh, kat)
    massstab_nativ = 1.0 / math.sqrt(abs(ax[1] * ay[2] - ax[2] * ay[1]))
    drehung = math.degrees(math.atan2(-ay[1], ax[1]))
    print(f"Lage: Mitte bei Spalte {ax[0]:.2f}, Zeile {ay[0]:.2f} des gedrehten Bilds, {massstab_nativ:.5f}\"/px, "
          f"Drehung {drehung:+.3f} Grad, Restfehler Median {rest_px:.2f} px aus {anzahl} Sternen")
    if rest_px > ASTROMETRIE_REST_MAX_PX or anzahl < 50 or abs(drehung) > 1.0 or ax[1] * ay[2] - ax[2] * ay[1] > 0:
        raise SystemExit("Lage nicht sicher bestimmt (Restfehler, Sternzahl, Drehung oder Spiegelung)")
    anteil255, kode_max, kode_median, n_kern = kern_saettigung(kodes_roh, (ax[0], ay[0]), massstab_nativ)
    print(f"Kern (1' um die Mitte, {n_kern} Pixel, V-Kanal): Kode 255 bei {anteil255 * 100:.2f} %, hoechster Kode "
          f"{kode_max}, Median {kode_median:.0f}")

    cd, mitte = cd_aus_affin(ax, ay, kodes_roh.shape[0])
    linear, ohne = ausrichten(fl_linear(kodes_roh)[::-1], cd, mitte, MASSSTAB, LEINWAND, UEBERABTASTUNG)
    if ohne.any():
        raise SystemExit(f"{int(ohne.sum())} Leinwandpixel ohne Daten (Leinwand groesser als das Bild)")
    n = LEINWAND
    orte, sterne_px = [], []
    for s in kat:
        x, y = n / 2 + s["dx"] / MASSSTAB - 0.5, n / 2 - s["dy"] / MASSSTAB - 0.5
        orte.append((x, y, stern_radius_arcsec(s["g"]), math.hypot(s["dx"], s["dy"]) > VOLL_AB_ARCSEC))
    for s in liste["sterne"]:
        sterne_px.append((n / 2 + s["dx_arcsec"] / MASSSTAB - 0.5, n / 2 - s["dy_arcsec"] / MASSSTAB - 0.5,
                          fluss(s["magnitude"])))
    orte.sort(key=lambda o: -o[2])
    bereinigt, maske = sterne_entfernen_katalog(linear, orte, MASSSTAB)
    n_feld = sum(1 for s in kat if s["art"] == "feld")
    print(f"Sterne entfernt: {len(orte)} Katalogorte ({len(liste['sterne'])} Mitglieder bis V 15, {n_feld} Feldsterne, "
          f"{len(orte) - len(liste['sterne']) - n_feld} weitere Gaia-Quellen: Mitglieder ab V 15 oder ohne V, Quellen "
          f"ohne Eigenbewegung), {int(maske.sum())} Pixel ({maske.mean() * 100:.1f} %) maskiert")

    # Was Gaia nicht fuehrt (G ab 17, Luecken im Kern), erkennt sterne_entfernen; das Licht der entfernten
    # schwachen Sterne kommt ueber den Radialfaktor als glattes Restlicht zurueck (physik.md 27.2).
    bereinigt, punkt_maske, punkte = sterne_entfernen(bereinigt)
    print(f"Schwache Sterne erkannt und entfernt: {len(punkte)} Punktquellen, {int(punkt_maske.sum())} Pixel "
          f"({punkt_maske.mean() * 100:.1f} %)")
    maske |= punkt_maske
    ebene, gb, gc = himmel_gradient(bereinigt, MASSSTAB)
    bereinigt = bereinigt - ebene
    r_tmp = radien_leinwand(n, MASSSTAB)
    himmel = float(np.median(bereinigt[r_tmp >= HIMMEL_R_MIN_ARCSEC]))
    bereinigt = bereinigt - himmel
    print(f"Himmelssockel abgezogen: {himmel:.4f} (Median ab {HIMMEL_R_MIN_ARCSEC:.0f}\")")
    halbe = n / 2
    print(f"Himmelsgradient abgezogen: {gb * halbe:+.4f} am rechten, {gc * halbe:+.4f} am unteren Rand (Einheit wie "
          f"das vorlaeufig lineare Bild; Ringmittel bei 10': {bereinigt[n // 2, n - 10]:.4f})")
    r = radien_leinwand(n, MASSSTAB)
    ring = ringe(r)
    i0 = king_i0_normiert()
    soll, king, stern_ring = ziel_rest(ring, r, MASSSTAB, sterne_px, i0, len(RINGE_ARCSEC))
    bereinigt = glaetten(bereinigt, r)
    bild_ringe = sum(1 for g in RINGE_ARCSEC if g <= BILD_BIS_ARCSEC[1])
    ring_bild = np.where(ring < bild_ringe, ring, -1)
    bildteil, knoten_g, _ = restlicht_anpassen(bereinigt, ring_bild, r, soll[:bild_ringe])
    gewicht = gewicht_bild(r)
    flaeche = gewicht * bildteil + (1.0 - gewicht) * modell(r, soll, i0)
    zahl = np.bincount(ring[ring >= 0], minlength=len(RINGE_ARCSEC)).astype(np.float64)
    ist = np.bincount(ring[ring >= 0], weights=flaeche[ring >= 0], minlength=len(RINGE_ARCSEC)) / zahl
    ersetzt = np.bincount(ring[ring >= 0], weights=maske[ring >= 0], minlength=len(RINGE_ARCSEC)) / zahl
    abw = np.abs(2.5 * np.log10(ist / soll))
    print(f"King normiert auf V_t: mu0 {-2.5 * math.log10(i0):.3f} (Harris {KING_MU0}); Bild L^{EXPONENT} mal "
          f"Radialfaktor aus {bild_ringe} Ringen bis {BILD_BIS_ARCSEC[1]:.0f}\"; Ringmittel bis 8' hoechstens "
          f"{abw[np.asarray(RINGE_ARCSEC) <= AUSLAUF_ARCSEC[0]].max():.3f} mag vom Soll (aussen Auslauf auf 0)")
    if args.profil:
        print("  Ring        mu King  mu Sterne  mu Soll  mu Flaeche  mu Flaeche+Sterne  ersetzt")
        innen = 0
        for i, aussen in enumerate(RINGE_ARCSEC):
            mu = lambda w: -2.5 * math.log10(w) if w > 0 else float("inf")
            print(f"  {innen:4d}-{aussen:4d}\"  {mu(king[i]):7.2f}  {mu(stern_ring[i]):9.2f}  {mu(soll[i]):7.2f}  "
                  f"{mu(ist[i]):10.2f}  {mu(ist[i] + stern_ring[i]):10.2f}  {ersetzt[i] * 100:6.1f} %")
            innen = aussen

    kodes = kodiere_relativ(linear_zu_mu_rel(flaeche), UMFANG_MAG)
    eichung = {"art": "gesamt", "magnitude": round(m_rest, 3)}
    mag_hell = round(eiche_mag_hell(kodes, UMFANG_MAG, MASSSTAB, eichung), 2)
    mag_dunkel = round(mag_hell + UMFANG_MAG, 2)
    mag_hell_king = -2.5 * math.log10(float(flaeche.max()))
    daten_webp = webp_bytes(kodes)
    dekodiert = webp_kodes(daten_webp)
    if not np.array_equal(dekodiert, kodes):
        raise SystemExit("WebP verlustfrei, aber die dekodierten Kodes weichen ab")
    m_flaeche = gesamtmagnitude(dekodiert, mag_hell, mag_dunkel, MASSSTAB)
    m_summe = -2.5 * math.log10(fluss(m_flaeche) + stern_fluss)
    print(f"Kennlinie: mag_hell {mag_hell} (aus dem King-Soll vor der Eichung {mag_hell_king:.2f}), mag_dunkel "
          f"{mag_dunkel}; Kode 0 bei {(dekodiert == 0).mean() * 100:.2f} % der Pixel")
    print(f"Flaeche V {m_flaeche:.3f} (Soll {m_rest:.3f}), Sterne V {-2.5 * math.log10(stern_fluss):.3f}, "
          f"Summe V {m_summe:.3f} gegen V_t {V_T} ({m_summe - V_T:+.3f} mag)")
    if abs(m_summe - V_T) > 0.1:
        raise SystemExit("Summe aus Flaeche und Sternen weicht um mehr als 0,1 mag von V_t ab")
    plateau = kodeanteil_je_ring(dekodiert, ring, len(RINGE_ARCSEC))
    print("Groesster Anteil eines Kodes je Ring: " + ", ".join(f"{a * 100:.0f}" for a in plateau) + " %")
    spitzen = restspitzen(log_tabelle(mag_hell, mag_dunkel).astype(np.float64)[dekodiert] * fluss(mag_hell), MASSSTAB)
    print(f"Restspitzen heller als V {V_GRENZE:g} ({RESTSPITZEN_R_ARCSEC[0]:.0f}\" bis {RESTSPITZEN_R_ARCSEC[1]:.0f}\", "
          f"Apertur 3\" minus Ring 6\" bis 10\"): {len(spitzen)}"
          + (", hellste " + ", ".join(f"V {v:.2f} bei {rr:.0f}\"" for v, rr, _, _ in spitzen[:5]) if spitzen else ""))

    mu = kode_mu(dekodiert, mag_hell, mag_dunkel)
    tabelle = flaechentabelle(mu, MASSSTAB, mag_hell, mag_dunkel)
    isophoten = [{"mag_arcsec2": round(m, 1), "flaeche_arcsec2": round(a, 2)} for m, a in tabelle]
    print(f"Flaechentabelle (Bild ist schon sternbereinigt): {len(isophoten)} Zeilen von "
          f"{isophoten[0]['mag_arcsec2']} bis {isophoten[-1]['mag_arcsec2']} mag/arcsec^2")

    if args.vorschau:
        os.makedirs(args.vorschau, exist_ok=True)
        Image.fromarray(dekodiert, "L").save(os.path.join(args.vorschau, "m13_flaeche.png"))
        rgb = np.dstack([dekodiert] * 3)
        rgb[maske] = (255, 0, 0)
        Image.fromarray(rgb, "RGB").save(os.path.join(args.vorschau, "m13_maske.png"))
        print(f"Vorschau: {args.vorschau}")
    if args.tabelle:
        with open(args.tabelle, "w", encoding="utf-8") as f:
            json.dump(isophoten, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Flaechentabelle nach {args.tabelle} (von Hand in daten/objekte.json als isophoten uebernehmen)")
    if args.messen:
        print(f"WebP verlustfrei: {len(daten_webp)} Byte (nicht geschrieben)")
        return

    os.makedirs(os.path.dirname(args.sterne), exist_ok=True)
    with open(args.sterne, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{args.sterne}: {len(liste['sterne'])} Sterne")
    ziel = os.path.join(args.ziel, BILDNACHWEIS["datei"])
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    with open(ziel, "wb") as f:
        f.write(daten_webp)
    print(f"{ziel}: {n}x{n} px, {len(daten_webp)} Byte")
    werte = dict(rest_px=rest_px, anzahl=anzahl, drehung=drehung, massstab_nativ=massstab_nativ, anteil255=anteil255,
                 kode_max=kode_max, kode_median=kode_median, n255=round(anteil255 * n_kern), n_kern=n_kern,
                 punkte=len(punkte), orte=len(orte), sterne=len(liste["sterne"]),
                 maskiert=int(maske.sum()), m_rest=m_rest, mag_hell=mag_hell, mag_dunkel=mag_dunkel,
                 i0=i0, plateau=float(plateau.max()), spitzen=len(spitzen))
    schreibe_bildnachweis(args.bildnachweis, bildnachweis(werte, len(daten_webp)))
    print(f"Bildnachweis {BILDNACHWEIS['id']} in {args.bildnachweis} geschrieben")


def bildnachweis(w, datei_bytes):
    b = BILDNACHWEIS
    komma = lambda x, stellen=2: f"{x:.{stellen}f}".replace(".", ",")
    bearbeitung = (
        "Graustufe aus dem V-Kanal (Gruen, 537 nm) des Pressebilds (Publication TIFF 4K, 8 Bit). Um 90 Grad im "
        "Uhrzeigersinn gedreht (Bildseite: \"North is left, East is down\"); Lage ueber eine affine Abbildung aus "
        f"{w['anzahl']} Gaia-DR3-Sternen ausserhalb 4' (Restfehler Median {komma(w['rest_px'])} px, Drehung "
        f"{komma(w['drehung'], 3)} Grad, {komma(w['massstab_nativ'], 4)}\"/px), Mitte nach Harris 2010 auf die Mitte "
        f"einer Leinwand von {LEINWAND}x{LEINWAND} px bei {komma(MASSSTAB, 1)}\"/px (bilinear auf {UEBERABTASTUNG}-fach "
        f"feinerem Gitter, blockweise gemittelt). Kern geprueft: im Umkreis von 1' {w['n255']} von {w['n_kern']} "
        f"Pixeln bei Kode 255 (Median {w['kode_median']:.0f}), die Kernsterne sind aufgeloest, der Kern ist nicht "
        "gesaettigt. Sterne plus Restlicht (Entscheidung Herbert 2026-10-29): die "
        f"{w['sterne']} Gaia-Mitglieder bis V 15 (daten/sterne/m13.json) und alle uebrigen {w['orte'] - w['sterne']} "
        "Gaia-DR3-Quellen bis G 17 (Feldsterne, schwaechere Mitglieder) an ihrer Katalogposition maskiert, danach die "
        f"schwaecheren Sterne ({w['punkte']} erkannte Punktquellen) wie bei M57; zusammen {w['maskiert']} Pixel durch "
        "den Median der Umgebung ersetzt (im inneren 1' 70 bis 92 % je Ring, physik.md 27.4). Linearisierung: "
        "Umkehrung der Log-Streckung aus dem AVM-Kopf (FITS Liberator, physik.md 27.1), Himmelsgradient und -sockel "
        "abgezogen, geglaettet (Kasten 1,5\" bis 1', 7,5\" ab 2,5'), dann L^1,85 (Exponent aus einer Sternprobe) mal "
        "einem glatten radialen Faktor, der das Ringmittel auf das King-Profil nach Harris 2010 (r_c 37,2\", r_t "
        "1260\", auf V_t 5,78 normiert) minus den Fluss der Katalogsterne bringt (physik.md 27.2). Ab 2' linear "
        "uebergeblendet, ab 3' ganz ersetzt durch das glatte Modell (King minus Sterne), das zwischen 8' und 10' auf 0 "
        "auslaeuft; der Haufen liegt dort im 8-Bit-Bild nicht klar ueber dem Himmelsrest. Quellweiss "
        f"mag_hell so geeicht, dass der Gesamtfluss des dekodierten Bilds V = {komma(w['m_rest'], 3)} ergibt (V_t "
        "5,78 minus die Katalogsterne). Kodiert als 8-Bit-Grauwert mit log-Kennlinie (ADR-0003 Nachtrag Version 2): "
        f"Kode 255 = mag_hell {w['mag_hell']}, Kode 1 = mag_dunkel {w['mag_dunkel']}, Kode 0 Schwarz. Himmelsnorden "
        "oben, Osten links (Gaia-Abgleich). WebP verlustfrei (tools/m13_aufbereiten.py)."
    )
    g = ROHDATEN[BILD_DATEI]
    hinweise = (
        "Flaechentabelle in daten/objekte.json (m13, isophoten) aus demselben Lauf, gemessen am dekodierten "
        "Bild. Die Flaeche ist das Restlicht ohne die Katalogsterne, nicht das ganze Objekt. "
        f"Rohdatei {BILD_DATEI} von {BILD_URL}: {g['bytes']} Byte, SHA-256 {g['sha256']}, abgerufen {g['abruf']}. "
        f"Native Aufloesung {komma(w['massstab_nativ'], 4)}\"/px (Original 4929 px: 0,262\"/px), Repo-Datei "
        f"{komma(MASSSTAB / w['massstab_nativ'])}-fach verkleinert."
    )
    return {
        "id": b["id"], "objekt": b["objekt"], "zustand": b["zustand"], "datei": b["datei"],
        "quelle_url": b["quelle_url"], "quelle_datei": b["quelle_datei"], "mission": b["mission"],
        "instrument": b["instrument"], "aufnahmedatum": b["aufnahmedatum"], "lizenz": b["lizenz"],
        "lizenz_url": b["lizenz_url"], "namensnennung": f"{b['namensnennung']}; bearbeitet: {b['aenderungsvermerk']}",
        "pixel_breite": LEINWAND, "pixel_hoehe": LEINWAND, "original_pixel": ORIGINAL_PIXEL,
        "winkelgroesse_arcsec": WINKELGROESSE_ARCSEC, "objekt_durchmesser_px": round(WINKELGROESSE_ARCSEC / MASSSTAB),
        "bogensekunden_pro_pixel": MASSSTAB, "norden_oben": True, "datei_bytes": datei_bytes,
        "bearbeitung": bearbeitung, "hinweise": hinweise,
        "kennlinie": {"art": "log", "mag_hell": w["mag_hell"], "mag_dunkel": w["mag_dunkel"]},
    }


def abrufen(ordner):
    os.makedirs(ordner, exist_ok=True)
    daten = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": GAIA_ADQL}).encode()
    for datei, anfrage in ((GAIA_DATEI, urllib.request.Request(TAP_URL, data=daten)), (BILD_DATEI, BILD_URL)):
        with urllib.request.urlopen(anfrage, timeout=600) as antwort:
            roh = antwort.read()
        pfad = os.path.join(ordner, datei)
        with open(pfad, "wb") as f:
            f.write(roh)
        print(f"{pfad}: {len(roh)} Byte, SHA-256 {hashlib.sha256(roh).hexdigest()}")


def liesmich():
    g, b = ROHDATEN[GAIA_DATEI], ROHDATEN[BILD_DATEI]
    return (
        f"- `m13/{GAIA_DATEI}`: Gaia-Archiv (ESA), TAP {TAP_URL}, HTTP-POST mit `REQUEST=doQuery`, `LANG=ADQL`, "
        f"`FORMAT=csv`. Abgerufen {g['abruf']}, {g['bytes']} Byte, SHA-256 `{g['sha256']}`. ADQL:\n"
        f"  `{GAIA_ADQL}`\n"
        "  Lizenz CC BY-NC 3.0 IGO (ESA Space Science Archives, https://www.cosmos.esa.int/web/gaia-users/license, "
        "gelesen 2026-10-29), Credit: ESA, Gaia DPAC. Verarbeitet durch `tools/m13_aufbereiten.py` nach "
        "`daten/sterne/m13.json` (Issue #108).\n"
        f"- `m13/{BILD_DATEI}`: NOIRLab noao-m13kpno4m \"M13, NGC 6205\", Publication TIFF 4K, {BILD_URL} "
        f"(Bildseite {BILDNACHWEIS['quelle_url']}). Abgerufen {b['abruf']}, {b['bytes']} Byte, SHA-256 `{b['sha256']}`, "
        "4000 x 3999 px, 8 Bit RGB (I, V, B als Rot, Gruen, Blau), \"North is left, East is down\", AVM-Kopf mit "
        "FITS-Liberator-Streckung Log(x). Credit: T.A. Rector (University of Alaska Anchorage) and H. Schweiker "
        "(WIYN and NOIRLab/NSF/AURA). Lizenz CC BY 4.0 (https://noirlab.edu/public/copyright/, gelesen 2026-10-29). "
        "Verarbeitet durch `tools/m13_aufbereiten.py` nach `daten/bilder/m13/` (Issue #108)."
    )


def main(argv=None):
    a = argparse.ArgumentParser(description="M13: Sternliste aus Gaia DR3 und Restlicht aus dem NOIRLab-Bild")
    a.add_argument("--roh", default=ROH_ORDNER, help=f"Ordner der Rohdaten (Standard {ROH_ORDNER})")
    a.add_argument("--sterne", default="daten/sterne/m13.json", help="Ausgabe der Sternliste")
    a.add_argument("--ziel", default=ZIEL_STANDARD, help="Wurzel der Bilddateien (Standard daten/bilder)")
    a.add_argument("--bildnachweis", default=BILDNACHWEIS_STANDARD, help="Pfad zu bilder.json")
    a.add_argument("--vorschau", help="Ordner fuer PNG-Vorschauen (Kodes und Sternmaske, nicht ins Repo)")
    a.add_argument("--tabelle", help="Flaechentabelle zusaetzlich als JSON in diese Datei")
    a.add_argument("--profil", action="store_true", help="Ringprofil King, Sterne, Soll und Flaeche ausgeben")
    modus = a.add_mutually_exclusive_group()
    modus.add_argument("--messen", action="store_true", help="alles rechnen und ausgeben, nichts schreiben")
    modus.add_argument("--bericht", action="store_true", help="nur Sternliste und Zaehlung ausgeben")
    modus.add_argument("--abrufen", action="store_true", help="Rohdaten holen (Netz)")
    modus.add_argument("--liesmich", action="store_true", help="Eintrag fuer data/roh/LIESMICH.md ausgeben")
    args = a.parse_args(argv)
    if args.abrufen:
        abrufen(args.roh)
        return 0
    if args.liesmich:
        print(liesmich())
        return 0
    if args.bericht:
        bericht(katalog(lade_gaia(args.roh)))
        return 0
    verarbeite(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
