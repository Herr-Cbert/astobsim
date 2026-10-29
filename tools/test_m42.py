"""Tests fuer tools/m42_wfi_stapeln.py und tools/m42_sterne.py (Issue #107). Aufruf aus dem Repo-Root:

    python3 -m unittest discover -s tools

Die Faelle mit den echten Rohdaten laufen nur, wenn data/roh/m42/ sie enthaelt (gitignored).
"""

import math
import os
import unittest

import numpy as np

import m42_sterne as s
import m42_wfi_stapeln as w

ROH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "roh", "m42")


class Tangentialebene(unittest.TestCase):
    def test_mitte_und_richtungen(self):
        xi, eta = w.tangential(np.array([w.MITTE_RA_GRAD]), np.array([w.MITTE_DEC_GRAD]))
        self.assertAlmostEqual(float(xi[0]), 0.0, places=9)
        self.assertAlmostEqual(float(eta[0]), 0.0, places=9)
        # 10'' nach Osten (RA groesser) gibt xi positiv, 10'' nach Norden eta positiv
        d_ra = 10.0 / 3600.0 / math.cos(math.radians(w.MITTE_DEC_GRAD))
        xi, eta = w.tangential(np.array([w.MITTE_RA_GRAD + d_ra]), np.array([w.MITTE_DEC_GRAD + 10.0 / 3600.0]))
        self.assertAlmostEqual(float(xi[0]), 10.0, places=3)
        self.assertAlmostEqual(float(eta[0]), 10.0, places=3)


class Astrometrie(unittest.TestCase):
    def test_polynom_trifft_eine_affine_abbildung(self):
        rng = np.random.default_rng(1)
        xi, eta = rng.uniform(-400, 400, 80), rng.uniform(-800, 800, 80)
        x = 1000 - xi / 0.238 + 0.001 * eta
        y = 2000 + eta / 0.238
        p = w.Polynom(xi, eta, x, y, 3)
        px, py = p(xi, eta)
        self.assertLess(float(np.max(np.hypot(px - x, py - y))), 1e-6)
        self.assertAlmostEqual(float(p.jacobi_det(np.array([0.0]), np.array([0.0]))[0]), 1 / 0.238 ** 2, places=3)

    def test_chipursprung_aus_crpix(self):
        self.assertEqual(w.chip_ursprung({"CRPIX1": "49.0", "CRPIX2": "1.0"}), (0.0, 0.0))
        x0, y0 = w.chip_ursprung({"CRPIX1": "-1997.0", "CRPIX2": "-4097.0"})
        self.assertEqual((x0, y0), (2046.0 + w.LUECKE_PX[0], w.NUTZ_ZEILEN + w.LUECKE_PX[1]))

    def test_stern_wird_mit_schwerpunkt_gefunden(self):
        yy, xx = np.mgrid[0:120, 0:100]
        bild = 50.0 + 2000.0 * np.exp(-((xx - 40.3) ** 2 + (yy - 70.6) ** 2) / (2 * 1.8 ** 2))
        bild += np.random.default_rng(2).normal(0, 1.0, bild.shape)
        sx, sy, fl = w.finde_sterne(bild, np.zeros(bild.shape, bool))
        self.assertEqual(len(sx), 1)
        self.assertAlmostEqual(float(sx[0]), 40.3, delta=0.05)
        self.assertAlmostEqual(float(sy[0]), 70.6, delta=0.05)

    def test_aperturphotometrie_zieht_den_ring_ab(self):
        yy, xx = np.mgrid[0:80, 0:80]
        stern = np.exp(-((xx - 40) ** 2 + (yy - 40) ** 2) / (2 * 1.5 ** 2))
        bild = 7.0 + 1000.0 * stern / stern.sum()
        fluss, hg = w.aperturphotometrie(bild, [40.0], [40.0], 8.0, 12.0, 18.0)
        self.assertAlmostEqual(float(fluss[0]), 1000.0, delta=1.0)
        self.assertAlmostEqual(float(hg[0]), 7.0, places=6)


class Loecher(unittest.TestCase):
    def test_loch_wird_aus_der_umgebung_gefuellt(self):
        bild = np.full((600, 600), 3.0, np.float32)
        bild[100:120, 300:330] = np.nan
        bild[590:, :] = np.nan  # ohne Daten, kein Loch: bleibt NaN
        loch = np.zeros(bild.shape, bool)
        loch[100:120, 300:330] = True
        self.assertEqual(w.fuelle_loecher(bild, loch), 600)
        self.assertTrue(np.allclose(bild[:590], 3.0))
        self.assertTrue(np.isnan(bild[590:]).all())


class Fits(unittest.TestCase):
    def test_schreiben_und_lesen(self):
        import tempfile

        from deep_sky_aufbereiten import lies_fits
        bild = np.arange(12, dtype=np.float32).reshape(3, 4)
        with tempfile.TemporaryDirectory() as d:
            pfad = os.path.join(d, "t.fits")
            w.schreibe_fits(pfad, bild, [w.fits_karte("MAGZP", 24.5), w.fits_karte("BUNIT", "ADU/s")], ["Test"])
            kopf, daten = lies_fits(pfad, "PRIMARY")
        self.assertEqual(float(kopf["MAGZP"]), 24.5)
        self.assertEqual(kopf["BUNIT"], "ADU/s")
        # Zeile 0 der Datei ist FITS-Zeile 1 (unten): das Bild steht kopf
        np.testing.assert_array_equal(daten, bild[::-1])


class Trapez(unittest.TestCase):
    def test_lage_westen_positiv(self):
        dx, dy = s.lage_arcsec(s.MITTE_RA_GRAD - 0.001, s.MITTE_DEC_GRAD + 0.001)
        self.assertGreater(dx, 0)
        self.assertGreater(dy, 0)

    @unittest.skipUnless(os.path.isfile(os.path.join(ROH, "m42_trapez_gaiadr3.csv")), "Rohdaten fehlen")
    def test_sternliste_aus_den_rohdaten(self):
        gaia, hip = s.lade_rohdaten(ROH)
        liste = s.sternliste(gaia, hip)
        sterne = {x["name"]: x for x in liste["sterne"]}
        self.assertEqual(len(sterne), 8)
        self.assertEqual((sterne["Theta1 Ori C"]["dx_arcsec"], sterne["Theta1 Ori C"]["dy_arcsec"]), (0.0, 0.0))
        # A liegt nordwestlich von C (WDS AC: PA 132 Grad), D oestlich, Theta2 A suedoestlich
        self.assertGreater(sterne["Theta1 Ori A"]["dx_arcsec"], 0)
        self.assertGreater(sterne["Theta1 Ori A"]["dy_arcsec"], 0)
        self.assertLess(sterne["Theta1 Ori D"]["dx_arcsec"], 0)
        self.assertLess(sterne["Theta2 Ori A"]["dx_arcsec"], 0)
        self.assertLess(sterne["Theta2 Ori A"]["dy_arcsec"], 0)
        self.assertEqual(sterne["Theta1 Ori C"]["magnitude"], 5.13)
        self.assertEqual(sterne["Theta1 Ori E"]["magnitude"], 11.1)


if __name__ == "__main__":
    unittest.main()
