#!/usr/bin/env python3
"""M42: lineares V-Bild aus den WFI-Rohdaten des ESO-Archivs stapeln (Issue #107).

Eingang (data/roh/m42/, gitignored, Herkunft in data/roh/LIESMICH.md):
    - wfi/WFI.<Zeit>.fits.Z: Rohdaten MPG/ESO 2,2 m, Wide Field Imager, Filter V/89 (ESO843),
      Programm 273.C-5042(A), Orionnebel am 02. und 03.01.2005: je Nacht 5 x 280 s,
      5 x 30 s, 1 x 3 s (gedithert); dazu 5 Bias (02.01.2005), 5 Himmelsflats V (02. und
      03.01.2005) und eine Standardsternaufnahme (02.01.2005 01:28 UT, 30 s) fuer den Himmel.
      Mosaik aus 8 CCDs zu 2046 x 4098 Nutzpixeln, 0,238"/px; Dateien mit Unix-compress
      (.Z), gelesen ueber "gzip -dc".
    - m42_feld_gaiadr3.csv: Gaia DR3 im Kegel 0,36 Grad um die Feldmitte bis G 19,5
      (Astrometrie und Nullpunkt; Abfrage in ABFRAGE_FELD).

Ausgabe: data/roh/m42/m42_wfi_v.fits (float32, eine HDU), Tangentialebene um die Mitte des
Theta1 Ori C (MITTE_* aus m42_sterne.py), Norden oben, Osten links, MASSSTAB "/px, Werte ADU/s je
Ausgabepixel nach Flat (Einheit: ADU eines Chips, dessen Flat dem Median ueber alle 8 Chips
entspricht), Himmel abgezogen, Kopf mit CD-Matrix und MAGZP (V = MAGZP - 2,5 log10(ADU/s)).
Daraus macht tools/deep_sky_aufbereiten.py mit tools/parameter/m42_wfi_20050102.json das
WebP (eichung.art "nullpunkt").

Schritte:
    1. Bias je Chip: Overscan (Spalten 2100 bis 2139) zeilenweise abziehen (gleitender Median
       ueber 51 Zeilen), dann der Median der 5 Biasbilder als Restmuster.
    2. Flat je Chip: Himmelsflats nach Bias, jede Aufnahme durch ihren Median ueber alle
       Chips geteilt, Median der 5; so gleicht der Flat auch die Empfindlichkeit der Chips
       untereinander an. Pixel mit Flat unter 0,5 oder ueber 1,5 sind ungueltig.
    3. Jede Aufnahme: (Roh - Bias) / Flat / Belichtungszeit in ADU/s. Rohwerte ab
       SAETTIGUNG_ADU gelten als gesaettigt (Maske um 2 Pixel erweitert); Rohwert 0 (tote
       Spalten) ungueltig.
    4. Astrometrie je Chip und Aufnahme: Sterne finden (Spitze gegen Ring), mit Gaia DR3
       (Lage auf 2005,0 zurueckgerechnet) zuordnen, Polynom 3. Grades von der
       Tangentialebene (xi, eta) auf Chippixel anpassen (Rest typisch unter 0,1").
    5. Abtasten auf das Ausgabegitter: je Ausgabepixel 2 x 2 Unterpunkte, bilinear,
       mal Jacobi-Determinante (Chippixel je Quadratbogensekunde) -> ADU/s je
       Quadratbogensekunde; ein ungueltiger Unterpunkt macht das Ausgabepixel ungueltig.
    6. Stapeln je Belichtungszeit (Median, gegen kosmische Strahlung und Chipluecken),
       beim 3-s-Stapel aus zwei Aufnahmen das Mittel (ein kosmischer Treffer bleibt zur Haelfte;
       3 s traegt nur die Kerne der hellsten Sterne, die ohnehin entfernt werden),
       dann zusammensetzen: 280 s, wo keine 280-s-Aufnahme gesaettigt ist, sonst 30 s,
       sonst 3 s. Die kuerzeren Stapel werden ueber ihr gemessenes Verhaeltnis im gemeinsamen
       hellen, ungesaettigten Bereich auf den 280-s-Stapel bezogen. Loecher, die in allen
       Belichtungen gesaettigt sind (Kerne der hellsten Sterne), werden aus der Umgebung gefuellt.
    7. Nullpunkt: Aperturphotometrie (Radius 8", Ring 10" bis 14", ohne Blendenverlust ueber
       0,005 mag) an isolierten Gaia-Sternen
       mit 14 < V < 17,5 im 280-s-Stapel, V aus G und BP-RP (physik.md 22); Median.
    8. Himmel: Median der Standardsternaufnahme (alle Chips, Sterne ueber Sigma-Clipping
       verworfen; Sonne 19 Grad unter dem Horizont, Mond unter dem Horizont), gleich kalibriert,
       in ADU/s je Quadratbogensekunde, mit Krisciunas und Schaefer 1991 (Gl. 2 und 3) von deren
       Luftmasse 1,77 auf die mittlere Luftmasse der 280-s-Aufnahmen umgerechnet; abgezogen.
       Das Bildfeld selbst hat keine nebelfreie Stelle.

Aufruf aus dem Repo-Root (numpy, Pillow nicht noetig; gzip im Pfad):
    python3 tools/m42_wfi_stapeln.py --abrufen   fehlende Rohdaten holen (Netz, etwa 2,9 GB), Bytes und SHA-256 ausgeben
    python3 tools/m42_wfi_stapeln.py             pruefen und data/roh/m42/m42_wfi_v.fits schreiben (etwa 11 min)
"""

import argparse
import csv
import hashlib
import io
import math
import os
import subprocess
import sys
import urllib.parse
import urllib.request
import warnings

import numpy as np

from deep_sky_aufbereiten import FITS_BLOCK, FITS_KARTE, FITS_TYPEN, _datenbytes, _kopf_lesen
from m42_sterne import MITTE_DEC_GRAD, MITTE_RA_GRAD
from m45_sterne import TAP_URL, v_aus_gaia

ROH_STANDARD = "data/roh/m42"
AUSGABE_STANDARD = "data/roh/m42/m42_wfi_v.fits"
ESO_DATEI_URL = "https://dataportal.eso.org/dataportal_new/file/"
PROGRAMM = "273.C-5042(A)"
FILTER = "BB#V/89_ESO843"

# Mitte der Tangentialebene und des Bilds: MITTE_RA_GRAD, MITTE_DEC_GRAD aus m42_sterne.py
# (Theta1 Ori C, gleich der Objektmitte der Sternliste)
MASSSTAB = 0.5          # "/px des Stapels
AUSGABE_PX = 4800       # 40' x 40': deckt das WFI-Feld um Theta1 Ori C (4' noerdlich, 3,5' oestlich der Feldmitte) ab
UNTERPUNKTE = 2
EPOCHE = 2005.0
SAETTIGUNG_ADU = 55000.0
NUTZ_SPALTEN = (48, 2094)
OVERSCAN_SPALTEN = (2100, 2140)
NUTZ_ZEILEN = 4098
CHIP_PIXEL_ARCSEC = 0.238
# Luecken zwischen den Chips in Pixeln (x, y), gemessen an der Astrometrie der Aufnahme 02.01.2005 02:08
LUECKE_PX = (97.0, 67.0)
# Extinktion V auf La Silla (Annahme; der Himmel aendert sich zwischen k 0,10 und 0,20 um 0,02 mag, physik.md 26)
K_V = 0.15

ABFRAGE_FELD = (
    "SELECT source_id, ra, dec, pmra, pmdec, phot_g_mean_mag, bp_rp, phot_bp_rp_excess_factor, ruwe "
    "FROM gaiadr3.gaia_source WHERE 1 = CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 83.76, -5.455, 0.36)) "
    "AND phot_g_mean_mag < 19.5 ORDER BY source_id"
)

# Rohdateien: Name -> (Rolle, Bytes, SHA-256); Rolle "wiss" (Wissenschaft), "bias", "flat", "himmel".
ROHDATEN = {
    "wfi/WFI.2005-01-02T00:11:13.218.fits.Z": ("flat", 124048269, "4e23364b65bec7a5ffcc1d53693e70a2f9f868d09da98dc085a8b27874a95190"),
    "wfi/WFI.2005-01-02T00:12:26.911.fits.Z": ("flat", 124004513, "ae3c36e9b5fcec3663a7d7493164c83359414768db06ad6a29fe79a6b20f4d4e"),
    "wfi/WFI.2005-01-02T00:13:41.592.fits.Z": ("flat", 122801009, "d110bf552fb3e5b3db0f820c6a15a04183c67b5749094c4a77e4bc8d1b229d7b"),
    "wfi/WFI.2005-01-02T01:28:31.304.fits.Z": ("himmel", 47775589, "178152baa0cca680b0ddde0bef0c63bbc4ca948b8c17aecab3ee1b7ed06e4999"),
    "wfi/WFI.2005-01-02T02:08:08.288.fits.Z": ("wiss", 112838427, "43b9ebf5f8cfca2ef1301844af381a62c437fc7f8fc3c4e01ed0f7d1d51a566c"),
    "wfi/WFI.2005-01-02T02:14:28.526.fits.Z": ("wiss", 112105089, "eda95c8035a33d425ef7a8f41a8b50622b19f2b40fedec31cf04ec9362cf06ca"),
    "wfi/WFI.2005-01-02T02:20:51.950.fits.Z": ("wiss", 112658783, "c53247dd6491c75180a6cf9f13ead917f2d279db995687360cafd48e54c6d374"),
    "wfi/WFI.2005-01-02T02:27:09.734.fits.Z": ("wiss", 111733371, "3c4331194aae2173a1481f9cba6db3b2f431455f846e4ecfeb7be4f508ff350b"),
    "wfi/WFI.2005-01-02T02:33:29.967.fits.Z": ("wiss", 113539537, "108d9ed6baee7e972389c2c237aaea641106478af084fade029cb42c869be978"),
    "wfi/WFI.2005-01-02T02:40:26.065.fits.Z": ("wiss", 74410239, "5e8d7846815605318594d6c9d5af5c4ca7bdd6cc0a357fe396a46a1f8ee82e2c"),
    "wfi/WFI.2005-01-02T02:42:46.212.fits.Z": ("wiss", 73067207, "923b94e6bf2e4819f5018bbbe848ae864691f524cda8ee1b88aa5045d06ab2fd"),
    "wfi/WFI.2005-01-02T02:45:02.002.fits.Z": ("wiss", 74120261, "7318eda22e76b733c8c8a859fe6ef5ce7c6025b7cdfcf5de1f6f307a17f9d271"),
    "wfi/WFI.2005-01-02T02:47:11.736.fits.Z": ("wiss", 72671929, "08a94ec2190e789f4cb7b9633d601856edf93e4493ec695a26d80c24b4faeb7d"),
    "wfi/WFI.2005-01-02T02:49:25.601.fits.Z": ("wiss", 72455815, "070fbae072773a316fc11eec54e620332a3e1b0e9cd74a1824d523dca005bcfb"),
    "wfi/WFI.2005-01-02T02:51:57.913.fits.Z": ("wiss", 49225685, "c1c97c4764470abbc5dcc9550340561e9cddf992f6806d78d404f9d7823bd746"),
    "wfi/WFI.2005-01-02T15:13:02.056.fits.Z": ("bias", 36293391, "98f20e93929d16faf05f6f04cd1f6b85f3fcdddf0848e6035ba08dc0bff0b557"),
    "wfi/WFI.2005-01-02T15:13:54.689.fits.Z": ("bias", 36146557, "f761641511cdf13f8cbc1fe19dac53c9058db8302857651ac0ef3e82f4507002"),
    "wfi/WFI.2005-01-02T15:14:46.162.fits.Z": ("bias", 36090193, "098ea3dde6f091ed94cac9f1c62efb102f8f47a2800e052a16daaa2f707cf7da"),
    "wfi/WFI.2005-01-02T15:15:42.948.fits.Z": ("bias", 36105687, "da6a9e9235640925a9b6d35c822d67aed0d4dd0e0fa4e43ac8553b734c4db617"),
    "wfi/WFI.2005-01-02T15:16:35.090.fits.Z": ("bias", 36147401, "1a64944b052fbad0c35a2e5f08d1436b3bce04fbbcb6b853e5cfc9b287eb9569"),
    "wfi/WFI.2005-01-03T00:16:42.580.fits.Z": ("flat", 124876817, "b64227411340d2b94e9aa7ea6cf9007d38dd3bd8963625c39456ad931e9053a9"),
    "wfi/WFI.2005-01-03T00:18:18.244.fits.Z": ("flat", 123930333, "980e531892efd990df3995156d9c03d55fd16087933a8de93a0e6c90060d3071"),
    "wfi/WFI.2005-01-03T02:56:08.559.fits.Z": ("wiss", 111127521, "71ab3b589c51f6cdaa7137cec0901dc06935ae86d56873d448e4d3c93b7987d0"),
    "wfi/WFI.2005-01-03T03:02:32.514.fits.Z": ("wiss", 112024595, "b529c00858d3b4dd1866478eb5003da6ade514af91961e0d5cbbd71916d0ca0c"),
    "wfi/WFI.2005-01-03T03:08:57.778.fits.Z": ("wiss", 112301881, "6df2ca20a2dfd96548a3755b757f94fa97ea1eb7fdabdfc505d63718051af4ec"),
    "wfi/WFI.2005-01-03T03:15:17.572.fits.Z": ("wiss", 112483207, "5434fe0570a0833f59d29f538648c3cdeb75be2a502706e4c3da7607c04c10ee"),
    "wfi/WFI.2005-01-03T03:21:42.893.fits.Z": ("wiss", 110800235, "d2a82e0e6c835961fab1c82af1a04027a46c01fbdc4492c0dda57494dbd73d43"),
    "wfi/WFI.2005-01-03T03:54:57.622.fits.Z": ("wiss", 74249027, "67d1319ae862f3ff7ed6560d7248ef2c46d01315cf37131f16bcdd505b423924"),
    "wfi/WFI.2005-01-03T03:57:12.104.fits.Z": ("wiss", 72909697, "ecf423f3959bdd08d21fb28f74f259159face642ed197ae703465e02df4794a0"),
    "wfi/WFI.2005-01-03T03:59:30.082.fits.Z": ("wiss", 73790055, "eefe6756c111b66030661360bed18ca3741914149050ead5772e43a91fba26ce"),
    "wfi/WFI.2005-01-03T04:01:46.493.fits.Z": ("wiss", 73532521, "bf3994468b4c22ed93711b276431ea4180869c697f07c7dd287481408daf3af0"),
    "wfi/WFI.2005-01-03T04:03:54.292.fits.Z": ("wiss", 72744749, "474a14a96fdea706f720dcb716111314022085cab4e4c86e3fb979be536027d4"),
    "wfi/WFI.2005-01-03T04:06:30.006.fits.Z": ("wiss", 48563561, "4e212fa5112f071de4f2feaff8a8497188c37ad65e4256c00897769b28f69040"),
    "m42_feld_gaiadr3.csv": ("gaia", 287700, "5604007a7468574a1c31ded1ecb1a4c35e10d538b106fd503121f6ca78048119"),
}


def gzip_lesen(pfad):
    if pfad.endswith(".Z") or pfad.endswith(".gz"):
        return subprocess.run(["gzip", "-dc", pfad], check=True, capture_output=True).stdout
    with open(pfad, "rb") as f:
        return f.read()


def lies_mef(pfad):
    """Alle Bild-HDUs einer Mehrfach-FITS-Datei: (Primaerkopf, [(Kopf, float32-Feld), ...])."""
    roh = gzip_lesen(pfad)
    f = io.BytesIO(roh)
    primaer, hdus = None, []
    while True:
        try:
            kopf = _kopf_lesen(f)
        except ValueError:
            break
        if primaer is None:
            primaer = kopf
            primaer.update(hierarch_karten(roh))
        n = _datenbytes(kopf)
        if n:
            roh = np.frombuffer(f.read(n), dtype=FITS_TYPEN[int(kopf["BITPIX"])])
            feld = roh.reshape(int(kopf["NAXIS2"]), int(kopf["NAXIS1"])).astype(np.float32)
            feld = feld * float(kopf.get("BSCALE", "1")) + float(kopf.get("BZERO", "0"))
            hdus.append((kopf, feld))
            f.seek((n + FITS_BLOCK - 1) // FITS_BLOCK * FITS_BLOCK - n, 1)
    return primaer, hdus


def hierarch_karten(daten):
    """ESO-HIERARCH-Karten des Primaerkopfs ("HIERARCH ESO TEL AIRM START = 1.164 / ...") als Schluessel -> Text;
    _kopf_lesen liest nur Schluessel mit 8 Zeichen."""
    karten = {}
    for i in range(0, len(daten), FITS_KARTE):
        karte = daten[i:i + FITS_KARTE].decode("ascii", errors="replace")
        if karte.startswith("END "):
            break
        if karte.startswith("HIERARCH ") and "=" in karte:
            schluessel, wert = karte.split("=", 1)
            wert = wert.strip()
            if wert.startswith("'"):
                wert = wert[1:wert.index("'", 1)].strip()
            else:
                wert = wert.split("/")[0].strip()
            karten[schluessel.strip()] = wert
    return karten


def chip_name(kopf):
    return kopf["EXTNAME"].split(".")[1]  # CHIP1 ... CHIP8


def nutzzeilen(kopf):
    """Obere Reihe (CRPIX2 < 0): Overscan in den ersten 30 Zeilen; untere Reihe: am Ende."""
    if float(kopf["CRPIX2"]) < 0:
        return slice(30, 30 + NUTZ_ZEILEN)
    return slice(0, NUTZ_ZEILEN)


def gleitender_median_1d(werte, fenster):
    r = fenster // 2
    g = np.pad(werte, r, mode="edge")
    return np.median(np.lib.stride_tricks.sliding_window_view(g, fenster), axis=-1)


def overscan_ab(kopf, feld):
    """Nutzbereich minus zeilenweisem Overscan (gleitender Median ueber 51 Zeilen); Rohwerte dazu."""
    z = nutzzeilen(kopf)
    os_zeilen = np.median(feld[z, OVERSCAN_SPALTEN[0]:OVERSCAN_SPALTEN[1]], axis=1)
    os_zeilen = gleitender_median_1d(os_zeilen, 51).astype(np.float32)
    roh = feld[z, NUTZ_SPALTEN[0]:NUTZ_SPALTEN[1]]
    return roh - os_zeilen[:, None], roh


# ---------------------------------------------------------------------------
# Kalibration

def master_bias(dateien):
    stapel = {}
    for pfad in dateien:
        _, hdus = lies_mef(pfad)
        for kopf, feld in hdus:
            stapel.setdefault(chip_name(kopf), []).append(overscan_ab(kopf, feld)[0])
    return {c: np.median(np.stack(v), axis=0).astype(np.float32) for c, v in stapel.items()}


def master_flat(dateien, bias):
    stapel = {}
    for pfad in dateien:
        _, hdus = lies_mef(pfad)
        bilder = {chip_name(k): overscan_ab(k, f)[0] - bias[chip_name(k)] for k, f in hdus}
        norm = float(np.median(np.concatenate([b[::4, ::4].ravel() for b in bilder.values()])))
        for c, b in bilder.items():
            stapel.setdefault(c, []).append(b / norm)
    flats = {}
    for c, v in stapel.items():
        flat = np.median(np.stack(v), axis=0).astype(np.float32)
        flat[(flat < 0.5) | (flat > 1.5)] = np.nan
        flats[c] = flat
    return flats


def kalibriere(pfad, bias, flat):
    """Eine Aufnahme: {Chip: (ADU/s je Chippixel mit NaN, Saettigungsmaske, Kopf)}, Primaerkopf."""
    primaer, hdus = lies_mef(pfad)
    zeit = float(primaer["EXPTIME"])
    aus = {}
    for kopf, feld in hdus:
        c = chip_name(kopf)
        wert, roh = overscan_ab(kopf, feld)
        bild = (wert - bias[c]) / flat[c] / zeit
        bild[roh <= 0] = np.nan
        satt = dehnen(roh >= SAETTIGUNG_ADU, 2)
        aus[c] = (bild.astype(np.float32), satt, kopf)
    return aus, primaer


def dehnen(maske, n):
    m = maske.copy()
    for _ in range(n):
        g = np.pad(m, 1)
        m = g[1:-1, 1:-1] | g[:-2, 1:-1] | g[2:, 1:-1] | g[1:-1, :-2] | g[1:-1, 2:]
    return m


# ---------------------------------------------------------------------------
# Astrometrie

def tangential(ra, dec, ra0=MITTE_RA_GRAD, dec0=MITTE_DEC_GRAD):
    """Gnomonische Projektion: (xi nach Osten, eta nach Norden) in Bogensekunden."""
    a, d = np.radians(ra), np.radians(dec)
    a0, d0 = math.radians(ra0), math.radians(dec0)
    cosc = math.sin(d0) * np.sin(d) + math.cos(d0) * np.cos(d) * np.cos(a - a0)
    xi = np.cos(d) * np.sin(a - a0) / cosc
    eta = (math.cos(d0) * np.sin(d) - math.sin(d0) * np.cos(d) * np.cos(a - a0)) / cosc
    return np.degrees(xi) * 3600.0, np.degrees(eta) * 3600.0


def lies_gaia(pfad):
    with open(pfad, newline="") as f:
        zeilen = list(csv.DictReader(f))

    def z(t):
        return float(t) if t not in ("", None) else math.nan
    g = {k: np.array([z(r[k]) for r in zeilen]) for k in
         ("ra", "dec", "pmra", "pmdec", "phot_g_mean_mag", "bp_rp", "phot_bp_rp_excess_factor", "ruwe")}
    # Lage auf die Epoche der Aufnahmen (Gaia DR3: 2016,0); ohne Eigenbewegung unveraendert.
    dt = EPOCHE - 2016.0
    pmra = np.nan_to_num(g["pmra"]) / 3.6e6
    pmdec = np.nan_to_num(g["pmdec"]) / 3.6e6
    g["ra_ep"] = g["ra"] + dt * pmra / np.cos(np.radians(g["dec"]))
    g["dec_ep"] = g["dec"] + dt * pmdec
    g["xi"], g["eta"] = tangential(g["ra_ep"], g["dec_ep"])
    return g


def kastenmittel(bild, r):
    """Mittel im Quadrat (2r+1)^2 ueber Summentabelle; NaN zaehlen als 0 mit Gewicht 0."""
    gueltig = np.isfinite(bild)
    b = np.where(gueltig, bild, 0.0).astype(np.float64)
    def summe(a):
        s = np.pad(a, ((r + 1, r), (r + 1, r)), mode="constant").cumsum(0).cumsum(1)
        n = 2 * r + 1
        return s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]
    return summe(b) / np.maximum(summe(gueltig.astype(np.float64)), 1)


def finde_sterne(bild, satt, schwelle=8.0):
    """Sterne fuer die Astrometrie: Spitze gegen den Ring zwischen 4 und 7 Pixeln; Lage ueber log-Parabeln."""
    innen = kastenmittel(bild, 2)
    gross = kastenmittel(bild, 7)
    mittel = kastenmittel(bild, 4)
    ring = (gross * 225 - mittel * 81) / (225 - 81)
    rest = innen - ring
    ok = np.isfinite(rest)
    sigma = 1.4826 * np.median(np.abs(rest[ok][::7] - np.median(rest[ok][::7])))
    kandidat = ok & (rest > schwelle * sigma) & ~dehnen(satt, 6)
    g = np.pad(np.where(ok, innen, -np.inf), 2, constant_values=-np.inf)
    h, w = bild.shape
    nachbar = np.max(np.stack([g[2 + dy:2 + dy + h, 2 + dx:2 + dx + w] for dy in range(-2, 3) for dx in range(-2, 3)
                               if (dx, dy) != (0, 0)]), axis=0)
    ys, xs = np.nonzero(kandidat & (innen > nachbar))
    rand = (xs >= 3) & (ys >= 3) & (xs < w - 3) & (ys < h - 3)
    xs, ys = xs[rand], ys[rand]
    sx, sy, fl = [], [], []
    for x, y in zip(xs, ys):
        teil = bild[y - 2:y + 3, x - 2:x + 3] - ring[y, x]
        if not np.isfinite(teil).all():
            continue
        s = np.clip(teil, 0, None).sum()
        # Lage ueber eine Parabel durch den Logarithmus der drei mittleren Werte je Achse
        # (exakt fuer ein Gauss-Profil; der Schwerpunkt im Fenster waere zur Mitte gezogen).
        zeile, spalte = teil[2, 1:4], teil[1:4, 2]
        if s <= 0 or (zeile <= 0).any() or (spalte <= 0).any():
            continue
        ox, oy = _parabel(np.log(zeile)), _parabel(np.log(spalte))
        if abs(ox) > 1 or abs(oy) > 1:
            continue
        sx.append(x + ox)
        sy.append(y + oy)
        fl.append(s)
    return np.array(sx), np.array(sy), np.array(fl)


def _parabel(l):
    """Scheitel einer Parabel durch (-1, l0), (0, l1), (1, l2) relativ zur Mitte."""
    nenner = l[0] - 2 * l[1] + l[2]
    return 0.5 * (l[0] - l[2]) / nenner if nenner < 0 else 0.0


def terme(u, v, grad):
    return np.stack([u ** i * v ** (k - i) for k in range(grad + 1) for i in range(k + 1)], axis=-1)


class Polynom:
    """(xi, eta) in Bogensekunden -> Chippixel (x, y), Polynom in normierten Koordinaten."""

    def __init__(self, xi, eta, x, y, grad):
        self.m = np.array([np.mean(xi), np.mean(eta)])
        self.s = 1000.0
        self.grad = grad
        a = terme((xi - self.m[0]) / self.s, (eta - self.m[1]) / self.s, grad)
        self.kx = np.linalg.lstsq(a, x, rcond=None)[0]
        self.ky = np.linalg.lstsq(a, y, rcond=None)[0]

    def __call__(self, xi, eta):
        a = terme((xi - self.m[0]) / self.s, (eta - self.m[1]) / self.s, self.grad)
        return a @ self.kx, a @ self.ky

    def jacobi_det(self, xi, eta, h=0.5):
        """Chippixel je Quadratbogensekunde (Betrag der Jacobi-Determinante, numerisch)."""
        x1, y1 = self(xi + h, eta)
        x0, y0 = self(xi - h, eta)
        x3, y3 = self(xi, eta + h)
        x2, y2 = self(xi, eta - h)
        return np.abs((x1 - x0) * (y3 - y2) - (x3 - x2) * (y1 - y0)) / (4 * h * h)


def chip_ursprung(kopf):
    """Lage des Chips im Mosaik in Pixeln aus CRPIX1/2 (Spalte und Reihe) mit den Luecken LUECKE_PX."""
    spalte = round((49.0 - float(kopf["CRPIX1"])) / 2046.0)
    reihe = 1 if float(kopf["CRPIX2"]) < 0 else 0
    return spalte * (2046.0 + LUECKE_PX[0]), reihe * (NUTZ_ZEILEN + LUECKE_PX[1])


def startloesung(primaer, kopf):
    """Naeherung (xi, eta) -> Chippixel: RA/DEC des Kopfs in der Mosaikmitte, Norden +y, Osten -x."""
    x0, y0 = chip_ursprung(kopf)
    mx = (4 * 2046.0 + 3 * LUECKE_PX[0]) / 2
    my = (2 * NUTZ_ZEILEN + LUECKE_PX[1]) / 2
    xi_m, eta_m = tangential(np.array([float(primaer["RA"])]), np.array([float(primaer["DEC"])]))
    s = CHIP_PIXEL_ARCSEC

    def abbild(xi, eta):
        return mx - x0 - (xi - xi_m[0]) / s, my - y0 + (eta - eta_m[0]) / s
    return abbild


def zuordnen(px, py, sx, sy, radius):
    """Naechster gefundener Stern je Vorhersage innerhalb radius; Indizes (Katalog, Fund)."""
    if len(sx) == 0:
        return np.array([], int), np.array([], int)
    reihenfolge = np.argsort(sy)
    sy_s = sy[reihenfolge]
    ik, jf = [], []
    for i in range(len(px)):
        a = np.searchsorted(sy_s, py[i] - radius)
        b = np.searchsorted(sy_s, py[i] + radius)
        if a == b:
            continue
        kand = reihenfolge[a:b]
        d = np.hypot(sx[kand] - px[i], sy[kand] - py[i])
        k = int(np.argmin(d))
        if d[k] <= radius:
            ik.append(i)
            jf.append(int(kand[k]))
    return np.array(ik, int), np.array(jf, int)


def astrometrie(gaia, bild, satt, abbild, name):
    sx, sy, fl = finde_sterne(bild, satt)
    h, w = bild.shape
    auswahl = np.isfinite(gaia["xi"]) & (gaia["phot_g_mean_mag"] < 19.0)
    gx, gy = abbild(gaia["xi"][auswahl], gaia["eta"][auswahl])
    innen = (gx > -300) & (gy > -300) & (gx < w + 300) & (gy < h + 300)
    xi, eta = gaia["xi"][auswahl][innen], gaia["eta"][auswahl][innen]
    gx, gy = gx[innen], gy[innen]
    # Versatz ueber ein Abstimmungshistogramm (Fund minus Vorhersage, 4-px-Faecher).
    hellste = np.argsort(-fl)[:300]
    dx = (sx[hellste][:, None] - gx[None, :]).ravel()
    dy = (sy[hellste][:, None] - gy[None, :]).ravel()
    nah = (np.abs(dx) < 250) & (np.abs(dy) < 250)
    hist, ex, ey = np.histogram2d(dx[nah], dy[nah], bins=125, range=[[-250, 250], [-250, 250]])
    i, j = np.unravel_index(np.argmax(hist), hist.shape)
    vx, vy = 0.5 * (ex[i] + ex[i + 1]), 0.5 * (ey[j] + ey[j + 1])
    ik, jf = zuordnen(gx + vx, gy + vy, sx, sy, 12.0)
    for radius, grad in ((6.0, 1), (3.0, 2), (2.0, 3), (1.5, 3)):
        if len(ik) < 12:
            raise SystemExit(f"{name}: nur {len(ik)} Gaia-Sterne zugeordnet (Versatz {vx:.0f}/{vy:.0f} px)")
        p = Polynom(xi[ik], eta[ik], sx[jf], sy[jf], grad if len(ik) >= 60 else min(grad, 2))
        px, py = p(xi, eta)
        ik, jf = zuordnen(px, py, sx, sy, radius)
    # Polynom 3. Grades nur mit mindestens 60 Sternen (10 Terme je Achse), sonst 2. Grades.
    grad = 3 if len(ik) >= 60 else 2
    p = Polynom(xi[ik], eta[ik], sx[jf], sy[jf], grad)
    px, py = p(xi[ik], eta[ik])
    rest = np.hypot(px - sx[jf], py - sy[jf])
    # Ein Durchgang ohne Ausreisser (ueber 3 Streuungen).
    gut = rest < max(3 * 1.4826 * np.median(rest), 0.3)
    p = Polynom(xi[ik][gut], eta[ik][gut], sx[jf][gut], sy[jf][gut], grad)
    px, py = p(xi[ik][gut], eta[ik][gut])
    rms = float(np.sqrt(np.mean((px - sx[jf][gut]) ** 2 + (py - sy[jf][gut]) ** 2))) * CHIP_PIXEL_ARCSEC
    return p, int(gut.sum()), rms


# ---------------------------------------------------------------------------
# Abtasten

def ausgabe_achsen():
    """Zentren der Ausgabepixel: xi (Osten) faellt nach rechts, eta (Norden) steigt nach oben (Zeile 0 oben)."""
    n = AUSGABE_PX
    achse = (np.arange(n) + 0.5 - n / 2) * MASSSTAB
    return -achse, -achse  # xi je Spalte, eta je Zeile


def abtasten(bild, satt, poly):
    """Chip auf das Ausgabegitter: (Wert ADU/s je arcsec^2 mit NaN, gesaettigt, Bereich (z0, z1, s0, s1))."""
    h, w = bild.shape
    xi_achse, eta_achse = ausgabe_achsen()
    # Bereich der Ausgabe, den der Chip trifft: Ecken des Chips ueber die Umkehrung suchen.
    raster_xi, raster_eta = np.meshgrid(xi_achse[::20], eta_achse[::20])
    rx, ry = poly(raster_xi.ravel(), raster_eta.ravel())
    drin = ((rx > -2) & (ry > -2) & (rx < w + 1) & (ry < h + 1)).reshape(raster_xi.shape)
    if not drin.any():
        return None
    zz, ss = np.nonzero(drin)
    z0, z1 = max(0, zz.min() * 20 - 20), min(AUSGABE_PX, zz.max() * 20 + 21)
    s0, s1 = max(0, ss.min() * 20 - 20), min(AUSGABE_PX, ss.max() * 20 + 21)
    nz, ns = z1 - z0, s1 - s0
    u = UNTERPUNKTE
    versatz = (np.arange(u) + 0.5) / u - 0.5
    summe = np.zeros((nz, ns))
    gueltig = np.ones((nz, ns), bool)
    gesaettigt = np.zeros((nz, ns), bool)
    satt_f = satt.astype(np.float32)
    for oy in versatz:
        eta = (eta_achse[z0:z1] - oy * MASSSTAB)[:, None] * np.ones((1, ns))
        for ox in versatz:
            xi = (xi_achse[s0:s1] - ox * MASSSTAB)[None, :] * np.ones((nz, 1))
            x, y = poly(xi.ravel(), eta.ravel())
            x, y = x.reshape(nz, ns), y.reshape(nz, ns)
            werte, ok = bilinear_nan(bild, x, y)
            s_w, _ = bilinear_nan(satt_f, x, y)
            summe += werte * poly.jacobi_det(xi, eta)
            gueltig &= ok
            gesaettigt |= ok & (s_w > 0)
    wert = np.where(gueltig, summe / (u * u), np.nan)
    return wert.astype(np.float32), gesaettigt, (z0, z1, s0, s1)


def bilinear_nan(daten, px, py):
    h, w = daten.shape
    x0 = np.floor(px).astype(np.int64)
    y0 = np.floor(py).astype(np.int64)
    fx, fy = px - x0, py - y0
    ok = (x0 >= 0) & (y0 >= 0) & (x0 + 1 < w) & (y0 + 1 < h)
    x0c, y0c = np.clip(x0, 0, w - 2), np.clip(y0, 0, h - 2)
    summe = np.zeros(px.shape)
    for ox, oy, g in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
        v = daten[y0c + oy, x0c + ox]
        ok &= np.isfinite(v)
        summe += np.where(np.isfinite(v), v, 0.0) * g
    return np.where(ok, summe, 0.0), ok


def fuelle_loecher(bild, loch, kachel=256, rand=128):
    """Loecher kachelweise fuellen (Kachel plus Rand, damit grosse Felder schnell bleiben); Anzahl gefuellt."""
    gefuellt = 0
    h, w = bild.shape
    for z in range(0, h, kachel):
        for s in range(0, w, kachel):
            if not loch[z:z + kachel, s:s + kachel].any():
                continue
            z0, z1, s0, s1 = max(0, z - rand), min(h, z + kachel + rand), max(0, s - rand), min(w, s + kachel + rand)
            teil_loch = np.zeros((z1 - z0, s1 - s0), bool)
            teil_loch[z - z0:z - z0 + kachel, s - s0:s - s0 + kachel] = loch[z:z + kachel, s:s + kachel]
            ausschnitt = bild[z0:z1, s0:s1]
            gefuellt += _fuelle(ausschnitt, teil_loch)
    return gefuellt


def _fuelle(bild, loch, runden=500):
    """Pixel in loch schrittweise vom Rand her mit dem Mittel der gueltigen 8 Nachbarn fuellen (in place)."""
    offen = loch.copy()
    anzahl = int(offen.sum())
    for _ in range(runden):
        if not offen.any():
            break
        g = np.pad(np.where(np.isfinite(bild), bild, 0.0), 1)
        n = np.pad(np.isfinite(bild).astype(np.float64), 1)
        h, w = bild.shape
        summe = sum(g[1 + dy:1 + dy + h, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy)
        zahl = sum(n[1 + dy:1 + dy + h, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy)
        jetzt = offen & (zahl >= 3)
        bild[jetzt] = (summe[jetzt] / zahl[jetzt]).astype(bild.dtype)
        offen &= ~jetzt
    return anzahl - int(offen.sum())


# ---------------------------------------------------------------------------
# Photometrie und Himmel

def aperturphotometrie(bild, xs, ys, r_ap, r_in, r_aus):
    """Fluss (Summe minus Ringmedian mal Flaeche) in Einheiten bild * Pixel; NaN, wenn unvollstaendig."""
    fluss, hintergrund = [], []
    r = int(math.ceil(r_aus)) + 1
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    for x, y in zip(xs, ys):
        xi, yi = int(round(x)), int(round(y))
        if xi < r or yi < r or xi >= bild.shape[1] - r or yi >= bild.shape[0] - r:
            fluss.append(np.nan)
            hintergrund.append(np.nan)
            continue
        teil = bild[yi - r:yi + r + 1, xi - r:xi + r + 1]
        d = np.hypot(xx + xi - x, yy + yi - y)
        ap, ring = d <= r_ap, (d >= r_in) & (d <= r_aus)
        if not np.isfinite(teil[ap]).all() or np.isfinite(teil[ring]).sum() < 0.8 * ring.sum():
            fluss.append(np.nan)
            hintergrund.append(np.nan)
            continue
        hg = float(np.nanmedian(teil[ring]))
        fluss.append(float(teil[ap].sum() - hg * ap.sum()))
        hintergrund.append(hg)
    return np.array(fluss), np.array(hintergrund)


def nullpunkt(stapel, gaia):
    """MAGZP fuer Werte in ADU/s je Ausgabepixel (V = MAGZP - 2,5 log10(Fluss))."""
    v = np.array([v_aus_gaia(g, b) if np.isfinite(g) and np.isfinite(b) else None
                  for g, b in zip(gaia["phot_g_mean_mag"], gaia["bp_rp"])], dtype=object)
    v = np.array([x if x is not None else np.nan for x in v], float)
    sp = (AUSGABE_PX / 2 - 0.5) - gaia["xi"] / MASSSTAB
    ze = (AUSGABE_PX / 2 - 0.5) - gaia["eta"] / MASSSTAB
    # Isoliert: kein Gaia-Stern bis 2 mag schwaecher innerhalb 16".
    isoliert = np.ones(len(v), bool)
    for i in range(len(v)):
        d = np.hypot(gaia["xi"] - gaia["xi"][i], gaia["eta"] - gaia["eta"][i])
        nah = (d > 0) & (d < 16.0) & (gaia["phot_g_mean_mag"] < gaia["phot_g_mean_mag"][i] + 2.0)
        isoliert[i] = not nah.any()
    # Saubere Farbe: BP/RP-Ueberschuss nahe am Erwartungswert (Riello et al. 2021, grob), RUWE < 1,4.
    x = gaia["bp_rp"]
    sauber = (gaia["phot_bp_rp_excess_factor"] < 1.3 + 0.06 * x ** 2) & (gaia["ruwe"] < 1.4)
    wahl = np.isfinite(v) & (v > 14.0) & (v < 17.5) & isoliert & sauber
    fluss, hg = aperturphotometrie(stapel, sp[wahl], ze[wahl], 8.0 / MASSSTAB, 10.0 / MASSSTAB, 14.0 / MASSSTAB)
    ok = np.isfinite(fluss) & (fluss > 0)
    zp = v[wahl][ok] + 2.5 * np.log10(fluss[ok])
    med = float(np.median(zp))
    streu = 1.4826 * float(np.median(np.abs(zp - med)))
    return med, streu, int(ok.sum()), (v[wahl][ok], zp, hg[ok])


def himmel_luftmasse(luftmasse, k=None):
    """Relative Himmelshelligkeit nach Krisciunas und Schaefer 1991, Gl. 2 und 3: X 10^(-0,4 k (X - 1)),
    X = (1 - 0,96 sin^2 Z)^(-1/2) mit Z aus der Luftmasse des Kopfs (sec Z); physik.md 26."""
    k = K_V if k is None else k
    z = math.acos(1.0 / luftmasse)
    x = (1.0 - 0.96 * math.sin(z) ** 2) ** -0.5
    return x * 10 ** (-0.4 * k * (x - 1.0))


def himmel_aus(pfad, bias, flat):
    """Himmel der Standardsternaufnahme in ADU/s je Quadratbogensekunde (Median, 3-Sigma-Clipping)."""
    chips, primaer = kalibriere(pfad, bias, flat)
    werte = np.concatenate([b[::3, ::3][np.isfinite(b[::3, ::3])].ravel() for b, _, _ in chips.values()])
    for _ in range(5):
        med = np.median(werte)
        s = 1.4826 * np.median(np.abs(werte - med))
        werte = werte[np.abs(werte - med) < 3 * s]
    return float(np.median(werte)) / CHIP_PIXEL_ARCSEC ** 2, primaer


# ---------------------------------------------------------------------------
# FITS schreiben

def fits_karte(schluessel, wert, kommentar=""):
    if isinstance(wert, bool):
        w = f"{'T' if wert else 'F':>20}"
    elif isinstance(wert, (int, np.integer)):
        w = f"{wert:>20d}"
    elif isinstance(wert, float):
        w = f"{wert:>20.10G}"
    else:
        w = f"'{str(wert).replace(chr(39), chr(39) * 2):<8}'"
        w = f"{w:<20}"
    karte = f"{schluessel:<8}= {w} / {kommentar}" if kommentar else f"{schluessel:<8}= {w}"
    return karte[:80].ljust(80)


def schreibe_fits(pfad, bild, karten, historie):
    kopf = [fits_karte("SIMPLE", True), fits_karte("BITPIX", -32), fits_karte("NAXIS", 2),
            fits_karte("NAXIS1", bild.shape[1]), fits_karte("NAXIS2", bild.shape[0])] + karten
    kopf += [f"HISTORY {h}"[:80].ljust(80) for h in historie]
    kopf.append("END".ljust(80))
    text = "".join(kopf).encode("ascii")
    text += b" " * (-len(text) % FITS_BLOCK)
    daten = np.ascontiguousarray(bild[::-1].astype(">f4")).tobytes()  # FITS-Zeile 1 unten
    daten += b"\0" * (-len(daten) % FITS_BLOCK)
    tmp = pfad + ".tmp"
    with open(tmp, "wb") as f:
        f.write(text)
        f.write(daten)
    os.replace(tmp, pfad)


# ---------------------------------------------------------------------------
# Ablauf

def sha256_datei(pfad):
    h = hashlib.sha256()
    n = 0
    with open(pfad, "rb") as f:
        for teil in iter(lambda: f.read(1 << 22), b""):
            h.update(teil)
            n += len(teil)
    return n, h.hexdigest()


def pruefe_rohdaten(ordner):
    for name, (rolle, groesse, sha) in ROHDATEN.items():
        pfad = os.path.join(ordner, name)
        if not os.path.isfile(pfad):
            raise SystemExit(f"Rohdatei fehlt: {pfad} (python3 tools/m42_wfi_stapeln.py --abrufen)")
        n, h = sha256_datei(pfad)
        if n != groesse or h != sha:
            raise SystemExit(f"Rohdatei {pfad}: Groesse oder SHA-256 weichen ab")


def dateien(rolle, ordner):
    return [os.path.join(ordner, n) for n, r in sorted(ROHDATEN.items()) if r[0] == rolle]


def stapeln(ordner, ausgabe, pruefen=True):
    if pruefen:
        pruefe_rohdaten(ordner)
    gaia = lies_gaia(os.path.join(ordner, "m42_feld_gaiadr3.csv"))
    print("Bias ...")
    bias = master_bias(dateien("bias", ordner))
    print("Flat ...")
    flat = master_flat(dateien("flat", ordner), bias)
    gruppen = {}
    luftmassen = {}
    historie = []
    for pfad in dateien("wiss", ordner):
        chips, primaer = kalibriere(pfad, bias, flat)
        zeit = float(primaer["EXPTIME"])
        gruppe = int(round(zeit))
        luftmassen.setdefault(gruppe, []).append(0.5 * (float(primaer["HIERARCH ESO TEL AIRM START"])
                                                        + float(primaer["HIERARCH ESO TEL AIRM END"])))
        if primaer.get("HIERARCH ESO OBS PROG ID") != PROGRAMM or primaer.get("HIERARCH ESO INS FILT1 NAME") != FILTER:
            raise SystemExit(f"{pfad}: Programm {primaer.get('HIERARCH ESO OBS PROG ID')}, "
                             f"Filter {primaer.get('HIERARCH ESO INS FILT1 NAME')}")
        historie.append(f"{primaer['ARCFILE']} {zeit:.3f}s")
        wert = np.full((AUSGABE_PX, AUSGABE_PX), np.nan, np.float32)
        satt = np.zeros((AUSGABE_PX, AUSGABE_PX), bool)
        bericht = []
        for c, (bild, s, kopf) in sorted(chips.items()):
            abbild = startloesung(primaer, kopf)
            try:
                poly, n, rms = astrometrie(gaia, bild, s, abbild, f"{os.path.basename(pfad)} {c}")
            except SystemExit as fehler:
                bericht.append(f"{c}: verworfen ({fehler})")
                continue
            bericht.append(f"{c} {n} Sterne {rms:.3f}\"")
            erg = abtasten(bild, s, poly)
            if erg is None:
                continue
            w, sa, (z0, z1, s0, s1) = erg
            ziel = wert[z0:z1, s0:s1]
            neu = np.isfinite(w) & ~np.isfinite(ziel)
            ziel[neu] = w[neu]
            satt[z0:z1, s0:s1] |= sa
        print(f"{os.path.basename(pfad)} {zeit:7.3f} s: " + ", ".join(bericht))
        gruppen.setdefault(gruppe, []).append((wert, satt))

    stapel = {}
    for gruppe, liste in sorted(gruppen.items()):
        werte = np.stack([w for w, _ in liste])
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)  # Pixel ohne Daten in allen Aufnahmen bleiben NaN
            med = np.nanmedian(werte, axis=0) if len(liste) > 2 else np.nanmean(werte, axis=0)
        satt = np.any(np.stack([s for _, s in liste]), axis=0)
        stapel[gruppe] = (med.astype(np.float32), satt)
        print(f"Stapel {gruppe} s: {len(liste)} Aufnahmen, {int(np.isfinite(med).sum())} Pixel mit Daten, "
              f"{int(satt.sum())} gesaettigt")
    lang, mittel, kurz = sorted(stapel)[::-1]
    # Verhaeltnis der Stapel, wo beide ungesaettigt und hell genug sind; die kuerzeren Stapel werden
    # darauf auf den langen bezogen (der Verschluss verkuerzt die 3-s-Aufnahmen um etwa 2 Prozent).
    faktor = {lang: 1.0}
    for a, b in ((lang, mittel), (mittel, kurz)):
        wa, sa = stapel[a]
        wb, sb = stapel[b]
        ok = np.isfinite(wa) & np.isfinite(wb) & ~sa & ~sb & (wb > np.nanpercentile(wb, 90))
        verhaeltnis = float(np.median(wb[ok] / wa[ok]))
        faktor[b] = faktor[a] / verhaeltnis
        print(f"Verhaeltnis {b} s / {a} s im gemeinsamen hellen Bereich: {verhaeltnis:.4f} ({int(ok.sum())} Pixel); "
              f"{b}-s-Stapel mal {faktor[b]:.4f}")
    for g in (mittel, kurz):
        stapel[g] = (stapel[g][0] * np.float32(faktor[g]), stapel[g][1])
    ergebnis = stapel[lang][0].copy()
    quelle = np.where(np.isfinite(ergebnis) & ~stapel[lang][1], lang, 0)
    for g in (mittel, kurz):
        w, s = stapel[g]
        nimm = (quelle == 0) & np.isfinite(w) & ~s
        ergebnis[nimm] = w[nimm]
        quelle[nimm] = g
    rest = quelle == 0
    ergebnis[rest] = np.nan
    print(f"Zusammengesetzt: {int((quelle == lang).sum())} Pixel aus {lang} s, {int((quelle == mittel).sum())} aus "
          f"{mittel} s, {int((quelle == kurz).sum())} aus {kurz} s, {int(rest.sum())} ohne Daten oder gesaettigt")
    # Gesaettigte Loecher (Kerne der hellsten Sterne in allen Belichtungen) von aussen nach innen
    # mit dem Mittel der Nachbarn fuellen; die Sterne entfernt ohnehin deep_sky_aufbereiten.py.
    bedeckt = np.zeros(ergebnis.shape, bool)
    for w_, _ in stapel.values():
        bedeckt |= np.isfinite(w_)
    loch = bedeckt & ~np.isfinite(ergebnis)
    gefuellt = fuelle_loecher(ergebnis, loch)
    print(f"Gesaettigte Loecher gefuellt: {gefuellt} Pixel")

    # ADU/s je arcsec^2 -> ADU/s je Ausgabepixel
    pixel = MASSSTAB ** 2
    zp, streu, n, _ = nullpunkt(stapel[lang][0] * pixel, gaia)
    print(f"Nullpunkt V: MAGZP {zp:.3f} (Streuung {streu:.3f} mag, {n} Sterne) fuer ADU/s")
    himmel_std, h_kopf = himmel_aus(dateien("himmel", ordner)[0], bias, flat)
    x_std = float(h_kopf["HIERARCH ESO TEL AIRM START"])
    x_m42 = float(np.mean(luftmassen[lang]))
    himmel = himmel_std * himmel_luftmasse(x_m42) / himmel_luftmasse(x_std)
    mu_std = zp - 2.5 * math.log10(himmel_std)
    mu_himmel = zp - 2.5 * math.log10(himmel)
    print(f"Himmel aus {h_kopf['ARCFILE']} (Luftmasse {x_std:.3f}): {mu_std:.2f} mag/arcsec^2 V; "
          f"auf Luftmasse {x_m42:.3f} der {lang}-s-Aufnahmen (Krisciunas und Schaefer 1991, Gl. 2 und 3, k_V {K_V}): "
          f"{himmel:.4f} ADU/s/arcsec^2 = {mu_himmel:.2f} mag/arcsec^2 V")
    minimum = float(np.nanpercentile(ergebnis, 0.1))
    print(f"Stapel vor Abzug: 0,1-Perzentil {minimum:.4f} ADU/s/arcsec^2 "
          f"({zp - 2.5 * math.log10(max(minimum, 1e-9)):.2f} mag/arcsec^2)")
    ergebnis = (ergebnis - himmel) * pixel
    karten = [
        fits_karte("BUNIT", "ADU/s", "je Pixel, nach Flat, Himmel abgezogen"),
        fits_karte("CTYPE1", "RA---TAN"), fits_karte("CTYPE2", "DEC--TAN"),
        fits_karte("CRVAL1", MITTE_RA_GRAD, "Theta1 Ori C (Gaia DR3)"), fits_karte("CRVAL2", MITTE_DEC_GRAD),
        fits_karte("CRPIX1", AUSGABE_PX / 2 + 0.5), fits_karte("CRPIX2", AUSGABE_PX / 2 + 0.5),
        fits_karte("CD1_1", -MASSSTAB / 3600.0), fits_karte("CD1_2", 0.0),
        fits_karte("CD2_1", 0.0), fits_karte("CD2_2", MASSSTAB / 3600.0),
        fits_karte("MAGZP", round(zp, 4), "V = MAGZP - 2.5 log10(ADU/s)"),
        fits_karte("MAGZPSIG", round(streu, 4), "Streuung des Nullpunkts (mag)"),
        fits_karte("MAGZPN", n, "Gaia-Sterne fuer den Nullpunkt"),
        fits_karte("SKYMU", round(mu_himmel, 3), "abgezogener Himmel V mag/arcsec2"),
        fits_karte("FILTER", "V/89 ESO843"), fits_karte("INSTRUME", "WFI"), fits_karte("TELESCOP", "MPI-2.2"),
        fits_karte("PROGID", PROGRAMM), fits_karte("ORIGIN", "ESO Science Archive, tools/m42_wfi_stapeln.py"),
    ]
    schreibe_fits(ausgabe, ergebnis, karten, historie)
    print(f"{ausgabe}: {AUSGABE_PX}x{AUSGABE_PX} px, {MASSSTAB}\"/px")


def abrufen(ordner):
    """Fehlende Rohdateien holen: WFI aus dem ESO-Archiv (ohne Anmeldung), Gaia-Feldsterne ueber TAP."""
    os.makedirs(os.path.join(ordner, "wfi"), exist_ok=True)
    for datei in ROHDATEN:
        ziel = os.path.join(ordner, datei)
        if os.path.isfile(ziel):
            continue
        if datei.startswith("wfi/"):
            name = os.path.basename(datei)[:-len(".fits.Z")]
            urllib.request.urlretrieve(ESO_DATEI_URL + name, ziel + ".tmp")
            os.replace(ziel + ".tmp", ziel)
        else:
            daten = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv",
                                            "QUERY": ABFRAGE_FELD}).encode()
            with urllib.request.urlopen(urllib.request.Request(TAP_URL, data=daten), timeout=300) as antwort:
                inhalt = antwort.read()
            with open(ziel, "wb") as f:
                f.write(inhalt)
        n, h = sha256_datei(ziel)
        print(f"{ziel}: {n} Byte, SHA-256 {h}")


def main(argv=None):
    a = argparse.ArgumentParser(description="M42: WFI-V-Rohdaten zu einem linearen, geeichten Stapel")
    a.add_argument("--roh", default=ROH_STANDARD)
    a.add_argument("--ausgabe", default=AUSGABE_STANDARD)
    a.add_argument("--ohne-pruefung", action="store_true", help="SHA-256 der Rohdaten nicht pruefen")
    a.add_argument("--abrufen", action="store_true", help="fehlende Rohdaten holen, nichts stapeln")
    args = a.parse_args(argv)
    if args.abrufen:
        abrufen(args.roh)
        return 0
    stapeln(args.roh, args.ausgabe, pruefen=not args.ohne_pruefung)
    return 0


if __name__ == "__main__":
    sys.exit(main())
