"""Tests fuer tools/m13_aufbereiten.py (Issue #108). Aufruf aus dem Repo-Root:

    python3 -m unittest discover -s tools

Geprueft: Lage und Mitgliedschaft, King-Normierung auf V_t, Ausrichtung ueber die affine Abbildung,
Sternentfernung an Katalogorten, Himmelsgradient, Ringgruppen und Tonkurve an synthetischen Bildern,
dazu an den Dateien unter daten/: Summe aus Flaeche und Sternen gleich V_t. Die Faelle mit den
echten Rohdaten (Zaehlung, Gleichheit mit daten/sterne/m13.json) laufen nur, wenn data/roh/m13/ sie
enthaelt (gitignored).
"""

import io
import json
import math
import os
import unittest

import numpy as np
from PIL import Image

import deep_sky_aufbereiten as ds
import m13_aufbereiten as m

WURZEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ROH = os.path.join(WURZEL, "data", "roh", "m13")


def gaia_zeile(source_id, dra_arcsec=0.0, ddec_arcsec=0.0, g=14.0, bp_rp=1.0, plx=0.1, pmra=-3.15, pmdec=-2.57):
    ra = m.MITTE_RA_GRAD + dra_arcsec / 3600.0 / math.cos(math.radians(m.MITTE_DEC_GRAD))
    return {"source_id": str(source_id), "ra": ra, "dec": m.MITTE_DEC_GRAD + ddec_arcsec / 3600.0,
            "phot_g_mean_mag": g, "bp_rp": bp_rp, "parallax": plx, "parallax_error": 0.05, "pmra": pmra,
            "pmdec": pmdec, "ruwe": 1.0}


class LageUndMitgliedschaft(unittest.TestCase):
    def test_osten_links_norden_oben(self):
        # Ein Stern mit groesserer Rektaszension steht oestlich, also links: dx negativ (Naht, deep-sky.md Kopf).
        dx, dy = m.lage_arcsec(m.MITTE_RA_GRAD + 0.01, m.MITTE_DEC_GRAD + 0.01)
        self.assertAlmostEqual(dx, -36.0 * math.cos(math.radians(m.MITTE_DEC_GRAD)), places=6)
        self.assertAlmostEqual(dy, 36.0, places=6)

    def test_schnitte_wie_deep_sky_33(self):
        self.assertTrue(m.ist_mitglied(gaia_zeile(1)))
        self.assertTrue(m.ist_mitglied(gaia_zeile(1, pmra=-3.15 + 1.19)))
        self.assertFalse(m.ist_mitglied(gaia_zeile(1, pmra=-3.15 + 1.21)))
        self.assertFalse(m.ist_mitglied(gaia_zeile(1, plx=1.0)))
        self.assertFalse(m.ist_mitglied(gaia_zeile(1, pmra=None, pmdec=None, plx=None)))

    def test_arten_und_grenze_v_15(self):
        zeilen = [
            gaia_zeile(1, g=11.5, bp_rp=1.7),                  # Riese, Mitglied
            gaia_zeile(2, g=15.5, bp_rp=0.6),                  # V etwa 15,57: Restlicht
            gaia_zeile(3, g=12.0, bp_rp=0.8, pmra=5.0),        # Feldstern
            gaia_zeile(4, g=13.0, bp_rp=None),                 # Mitglied ohne Farbe: Restlicht
            gaia_zeile(5, g=13.0, pmra=None, pmdec=None, plx=None),  # ohne Eigenbewegung: Restlicht
        ]
        arten = [s["art"] for s in m.katalog(zeilen)]
        self.assertEqual(arten, ["stern", "rest", "feld", "rest", "rest"])

    def test_sternliste_hellste_zuerst_mit_nachweis(self):
        # Stern 1 steht 20" westlich (kleinere Rektaszension), also rechts: dx +20.
        zeilen = [gaia_zeile(2, 10, 0, g=14.0), gaia_zeile(1, -20, 5, g=12.0, bp_rp=1.6)]
        liste = m.sternliste(m.katalog(zeilen))
        self.assertEqual([s["name"] for s in liste["sterne"]], ["Gaia DR3 1", "Gaia DR3 2"])
        self.assertEqual((liste["sterne"][0]["dx_arcsec"], liste["sterne"][0]["dy_arcsec"]), (20.0, 5.0))
        self.assertIn("CC BY-NC 3.0 IGO", liste["lizenz"])
        self.assertIn("ESA, Gaia DPAC", liste["quelle"])


class King(unittest.TestCase):
    def test_normiert_auf_v_t(self):
        i0 = m.king_i0_normiert()
        self.assertAlmostEqual(-2.5 * math.log10(i0 * m.king_integral()), m.V_T, places=9)
        # Harris' mu0 16,59 ergibt 5,88 (deep-sky.md 3.2); auf V_t normiert also 0,10 mag heller.
        self.assertAlmostEqual(m.KING_MU0 - 2.5 * math.log10(m.king_integral()), 5.88, places=2)
        self.assertAlmostEqual(-2.5 * math.log10(i0), 16.49, places=2)

    def test_profil_werte_deep_sky_32(self):
        # Tabelle in deep-sky.md 3.2: mu bei 1' 18,04, bei 6' 22,20.
        for r, mu in ((60.0, 18.04), (360.0, 22.20)):
            self.assertAlmostEqual(m.KING_MU0 - 2.5 * math.log10(float(m.king_relativ(r))), mu, places=2)
        self.assertEqual(float(m.king_relativ(m.KING_RT_ARCSEC + 1)), 0.0)


class Ausrichtung(unittest.TestCase):
    def test_affine_abbildung_fuer_ausrichten(self):
        # Rohbild wie das gedrehte TIFF (Zeile 0 oben): Mitte bei (60, 50), 0,4"/px, Westen rechts.
        h, w = 100, 120
        ax = np.array([60.0, 1 / 0.4, 0.0])
        ay = np.array([50.0, 0.0, -1 / 0.4])
        # Fleck 8" westlich (20 px rechts) und 4" noerdlich (10 px hoeher) der Mitte.
        yy, xx = np.mgrid[0:h, 0:w]
        roh = np.exp(-((xx - 80.0) ** 2 + (yy - 40.0) ** 2) / (2 * 2.0 ** 2))
        cd, mitte = m.cd_aus_affin(ax, ay, h)
        self.assertLess(np.linalg.det(cd), 0)  # nicht gespiegelt im Sinne von ausrichten
        bild, _ = ds.ausrichten(roh[::-1], cd, mitte, 1.0, 40, 3)
        y, x = np.unravel_index(int(np.argmax(bild)), bild.shape)
        # Leinwand 40 px bei 1"/px: dx +8" -> Spalte 20 + 8 (Zentrum 28,5), dy +4" -> Zeile 20 - 4 - 1.
        self.assertEqual((int(x), int(y)), (28, 15))


class Sternentfernung(unittest.TestCase):
    def test_stern_am_katalogort_entfernt_hintergrund_bleibt(self):
        n = 80
        yy, xx = np.mgrid[0:n, 0:n]
        hintergrund = 10.0 + 0.01 * xx
        stern = 500.0 * np.exp(-((xx - 40.2) ** 2 + (yy - 39.7) ** 2) / (2 * 1.5 ** 2))
        rng = np.random.default_rng(3)
        bild = hintergrund + stern + rng.normal(0, 0.2, (n, n))
        bereinigt, maske = m.sterne_entfernen_katalog(bild, [(40.2, 39.7, 6.0, False)], 0.5)
        self.assertLess(float(np.abs(bereinigt - hintergrund)[30:50, 30:50].max()), 2.0)
        self.assertTrue(maske[40, 40])
        self.assertFalse(maske[5:15, 5:15].any())
        self.assertTrue(np.array_equal(bereinigt[~maske], bild[~maske]))

    def test_volle_scheibe(self):
        bild = np.ones((40, 40))
        _, maske = m.sterne_entfernen_katalog(bild, [(20.0, 20.0, 5.0, True)], 0.5)
        self.assertEqual(int(maske.sum()), int((np.hypot(*np.mgrid[-20:20, -20:20]) <= 10).sum()))

    def test_stern_radius(self):
        self.assertAlmostEqual(m.stern_radius_arcsec(16.5), 3.2)
        self.assertEqual(m.stern_radius_arcsec(20.0), m.RADIUS_GRENZEN_ARCSEC[0])
        self.assertEqual(m.stern_radius_arcsec(5.0), m.RADIUS_GRENZEN_ARCSEC[1])


class HimmelUndTonkurve(unittest.TestCase):
    def test_gradient_ohne_radiale_struktur(self):
        n = 400
        r = m.radien_leinwand(n, 2.0)
        achse = np.arange(n) + 0.5 - n / 2
        xx, yy = np.meshgrid(achse, achse)
        bild = 100.0 * np.exp(-r / 150.0) + 0.003 * xx - 0.002 * yy + 1.0
        ebene, b, c = m.himmel_gradient(bild, 2.0, r_min=200.0, ring_breite=10.0, block=20)
        self.assertAlmostEqual(b, 0.003, places=4)
        self.assertAlmostEqual(c, -0.002, places=4)
        self.assertLess(float(np.abs(ebene - (0.003 * xx - 0.002 * yy)).max()), 0.01)

    def test_restlicht_trifft_das_soll_ohne_plateaus(self):
        # Bild = log-gestreckte Fassung eines Profils mit Textur; L^1,85 mal g(r) soll die Ringmittel treffen,
        # und die Abbildung der Pixelwerte bleibt streng monoton (keine flachen Stuecke wie die alte Tonkurve).
        n = 300
        r = m.radien_leinwand(n, 1.0)
        grenzen = (10, 20, 35, 50, 70, 90, 110, 140)
        ring = m.ringe(r, grenzen)
        rng = np.random.default_rng(7)
        wahr = np.exp(-r / 25.0) * (1 + 0.1 * rng.standard_normal((n, n)))
        bild = np.log10(1 + 1000 * np.maximum(wahr, 0))
        zahl = np.bincount(ring[ring >= 0], minlength=len(grenzen))
        soll = np.bincount(ring[ring >= 0], weights=wahr[ring >= 0], minlength=len(grenzen)) / zahl
        aus, knoten, ist = m.restlicht_anpassen(bild, ring, r, soll, grenzen=grenzen)
        self.assertLess(float(np.max(np.abs(2.5 * np.log10(ist / soll)))), 0.02)
        self.assertTrue((knoten > 0).all())
        # Die Kennlinie der Pixelwerte ist global und streng steigend, mit fester Steigung in log-log.
        x = np.geomspace(0.01, 1000.0, 50)
        y = m.kennlinie_bild(x)
        self.assertTrue((np.diff(y) > 0).all())
        self.assertTrue(np.allclose(np.diff(np.log10(y)) / np.diff(np.log10(x)), m.EXPONENT))

    def test_auslauf(self):
        self.assertEqual(float(m.auslauf(100.0)), 1.0)
        self.assertAlmostEqual(float(m.auslauf(540.0)), 0.5)
        self.assertEqual(float(m.auslauf(700.0)), 0.0)

    def test_restspitze_wird_gefunden(self):
        n = 200
        flaeche = np.full((n, n), 1e-6)
        yy, xx = np.mgrid[0:n, 0:n]
        # Stern V 14 (Fluss 10^-5,6) als Gauss mit sigma 1" bei 0,5"/px, 35" rechts der Mitte.
        sigma = 2.0
        flaeche += 10 ** -5.6 / (2 * math.pi * (sigma * 0.5) ** 2) * np.exp(-((xx - 170) ** 2 + (yy - 100) ** 2) / (2 * sigma ** 2))
        spitzen = m.restspitzen(flaeche, 0.5, r_bereich=(20.0, 300.0))
        self.assertEqual(len(spitzen), 1)
        self.assertAlmostEqual(spitzen[0][0], 14.0, delta=0.05)

    def test_kasten_erhaelt_den_fluss_innen(self):
        bild = np.zeros((31, 31))
        bild[15, 15] = 9.0
        k = m.kasten(bild, 3)
        self.assertAlmostEqual(float(k.sum()), 9.0)
        self.assertAlmostEqual(float(k[14, 14]), 1.0)


class DatenImRepo(unittest.TestCase):
    """Die geschriebenen Dateien unter daten/ (ohne Rohdaten pruefbar)."""

    def setUp(self):
        with open(os.path.join(WURZEL, "daten", "sterne", "m13.json"), encoding="utf-8") as f:
            self.sterne = json.load(f)["sterne"]
        with open(os.path.join(WURZEL, "daten", "bilder.json"), encoding="utf-8") as f:
            self.nachweis = next(e for e in json.load(f) if e["id"] == m.BILDNACHWEIS["id"])

    def test_531_mitglieder_bis_v_15(self):
        self.assertEqual(len(self.sterne), 531)
        v = [s["magnitude"] for s in self.sterne]
        self.assertEqual(v, sorted(v))
        self.assertLessEqual(max(v), 15.0)

    def test_flaeche_plus_sterne_gleich_v_t(self):
        k = self.nachweis["kennlinie"]
        with open(os.path.join(WURZEL, "daten", "bilder", self.nachweis["datei"]), "rb") as f:
            kodes = ds.webp_kodes(f.read())
        m_flaeche = ds.gesamtmagnitude(kodes, k["mag_hell"], k["mag_dunkel"], self.nachweis["bogensekunden_pro_pixel"])
        stern = sum(10 ** (-0.4 * s["magnitude"]) for s in self.sterne)
        summe = -2.5 * math.log10(10 ** (-0.4 * m_flaeche) + stern)
        self.assertLess(abs(summe - m.V_T), 0.1)
        self.assertLess(abs(summe - m.V_T), 0.01)  # geeicht; die 0,1 mag des Issues sind die Toleranz


@unittest.skipUnless(os.path.isfile(os.path.join(ROH, m.GAIA_DATEI)), "Gaia-Rohdaten fehlen (data/roh/m13/)")
class Rohdaten(unittest.TestCase):
    def test_zaehlung_deep_sky_33(self):
        kat = m.katalog(m.lade_gaia(ROH))
        liste = m.sterne(kat)
        self.assertEqual([sum(1 for s in liste if s["v"] <= g) for g in (12.5, 13, 13.5, 14, 14.5, 15)],
                         [22, 62, 115, 188, 301, 531])
        self.assertEqual(sum(1 for s in kat if s["mitglied"]), 2184)

    def test_sternliste_wie_im_repo(self):
        erzeugt = m.sternliste(m.katalog(m.lade_gaia(ROH)))
        with open(os.path.join(WURZEL, "daten", "sterne", "m13.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f), json.loads(json.dumps(erzeugt, ensure_ascii=False)))


if __name__ == "__main__":
    unittest.main()
