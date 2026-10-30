"""Tests fuer tools/deep_sky_aufbereiten.py (Issue #105); Aufruf im Ordner tools/: python3 -m unittest.

Geprueft: log-Kennlinie hin und zurueck auf 0,05 mag und gleich der Dekodierung in
src/daten/kennlinie.ts, FITS-Leser an einer selbst geschriebenen Datei, Flaechentabelle an einem
synthetischen Ring, Sternentfernung an einem Stern auf glattem Nebel, Eichung auf die
Gesamthelligkeit.
"""

import math
import os
import tempfile
import unittest

import numpy as np

import deep_sky_aufbereiten as ds


class KennlinieTest(unittest.TestCase):
    MAG_HELL = 16.72
    MAG_DUNKEL = 25.72

    def test_hin_und_rueck_auf_005_mag(self):
        # Bei 12 mag Umfang ist eine Stufe 0,047 mag, der Rundungsfehler hoechstens die halbe Stufe.
        for hell, dunkel in ((self.MAG_HELL, self.MAG_DUNKEL), (10.0, 22.0), (14.3, 26.9)):
            mu = np.random.default_rng(1).uniform(hell, dunkel, 100_000)
            zurueck = ds.kode_zu_mag(ds.kodiere(mu, hell, dunkel), hell, dunkel)
            self.assertLessEqual(float(np.abs(zurueck - mu).max()), (dunkel - hell) / 254 / 2 + 1e-9)
            self.assertLessEqual(float(np.abs(zurueck - mu).max()), 0.05)

    def test_randkodes(self):
        h, d = self.MAG_HELL, self.MAG_DUNKEL
        kodes = ds.kodiere(np.array([h, d, h - 1.0, d + 1.0, np.inf]), h, d)
        self.assertEqual(kodes.tolist(), [255, 1, 255, 0, 0])
        stufe = (d - h) / 254
        # Bis eine halbe Stufe unter mag_dunkel bleibt Kode 1, darunter Schwarz.
        self.assertEqual(ds.kodiere(np.array([d + 0.49 * stufe, d + 0.51 * stufe]), h, d).tolist(), [1, 0])

    def test_tabelle_wie_kennlinie_ts(self):
        # kennlinie.ts: kodeZuMag(v) = d - (v - 1) / 254 (d - h), logZuLinear = 10^(-0,4 (mu - h)),
        # Kode 0 = 0, als Float32Array. Dieselbe Rechnung hier ausgeschrieben.
        h, d = self.MAG_HELL, self.MAG_DUNKEL
        tabelle = ds.log_tabelle(h, d)
        self.assertEqual(tabelle.dtype, np.float32)
        self.assertEqual(tabelle[0], 0.0)
        self.assertEqual(tabelle[255], np.float32(1.0))
        for v in (1, 2, 100, 254):
            soll = np.float32(10 ** (-0.4 * ((d - ((v - 1) / 254) * (d - h)) - h)))
            self.assertEqual(tabelle[v], soll)
        self.assertTrue(np.all(np.diff(tabelle[1:]) > 0))

    def test_kodiere_relativ_haengt_nicht_an_der_lage(self):
        # Die Eichung verschiebt alle mu gemeinsam; die Kodes bleiben gleich (deshalb erst kodieren, dann eichen).
        mu_rel = np.random.default_rng(2).uniform(0, 9, 1000)
        self.assertTrue(np.array_equal(ds.kodiere_relativ(mu_rel, 9.0), ds.kodiere(mu_rel + 17.3, 17.3, 26.3)))


class FitsTest(unittest.TestCase):
    def test_liest_erweiterung_mit_bzero_bscale(self):
        roh = np.array([[1, 2, 3], [4, 5, -6]], dtype=">i2")

        def kopf(karten):
            text = "".join(f"{k:<80}" for k in karten + ["END"])
            return (text + " " * (-len(text) % 2880)).encode("ascii")

        def daten(b):
            return b + b"\0" * (-len(b) % 2880)

        inhalt = (kopf(["SIMPLE  =                    T", "BITPIX  =                    8", "NAXIS   =                    0",
                        "EXTEND  =                    T", "FILTER  = 'F502N   '           / Filter"])
                  + kopf(["XTENSION= 'IMAGE   '", "BITPIX  =                   16", "NAXIS   =                    2",
                          "NAXIS1  =                    3", "NAXIS2  =                    2", "PCOUNT  =                    0",
                          "GCOUNT  =                    1", "EXTNAME = 'SCI     '", "BZERO   =                 10.0",
                          "BSCALE  =                  0.5", "CD1_1   =  -1.0E-05"])
                  + daten(roh.tobytes()))
        with tempfile.TemporaryDirectory() as ordner:
            pfad = os.path.join(ordner, "test.fits")
            with open(pfad, "wb") as f:
                f.write(inhalt)
            kopf_gelesen, bild = ds.lies_fits(pfad, "SCI")
        self.assertEqual(kopf_gelesen["FILTER"], "F502N")
        self.assertEqual(kopf_gelesen["EXTNAME"], "SCI")
        self.assertAlmostEqual(float(kopf_gelesen["CD1_1"]), -1e-5)
        np.testing.assert_array_equal(bild, 10.0 + 0.5 * roh.astype(np.float64))


class AusrichtenTest(unittest.TestCase):
    def test_norden_oben_osten_links(self):
        # Rohbild mit Norden 30 Grad gegen den Uhrzeigersinn von +y und 0,05"/px; ein Lichtpunkt
        # 3" oestlich und 2" noerdlich der Mitte muss auf der Leinwand links oben von der Mitte liegen.
        s, w = 0.05 / 3600, math.radians(30)
        cd = np.array([[-s * math.cos(w), -s * math.sin(w)], [-s * math.sin(w), s * math.cos(w)]])
        self.assertAlmostEqual(ds.nordwinkel_grad(cd), 30.0)
        mitte = np.array([200.0, 200.0])
        punkt = mitte + np.linalg.inv(cd) @ np.array([3.0, 2.0]) / 3600
        roh = np.zeros((400, 400))
        x, y = int(round(punkt[0])), int(round(punkt[1]))
        roh[y, x] = 1.0
        bild, ohne = ds.ausrichten(roh, cd, mitte, 0.1, 100, 3)
        self.assertFalse(ohne.any())
        iy, ix = np.unravel_index(np.argmax(bild), bild.shape)
        dx = -(ix + 0.5 - 50) * 0.1
        dy = (50 - iy - 0.5) * 0.1
        self.assertAlmostEqual(dx, 3.0, delta=0.11)
        self.assertAlmostEqual(dy, 2.0, delta=0.11)
        # Flusserhaltend: Summe Wert je arcsec^2 mal Flaeche gleich Rohsumme.
        self.assertAlmostEqual(bild.sum() * 0.1 ** 2, roh.sum(), delta=0.02)


class FlaechentabelleTest(unittest.TestCase):
    def test_synthetischer_ring(self):
        # Ring 18,0 mag/arcsec^2 zwischen 20" und 40", Loch 19,5, aussen kein Licht; 0,1"/px.
        s, n = 0.1, 1000
        yy, xx = np.mgrid[0:n, 0:n]
        r = np.hypot(xx + 0.5 - n / 2, yy + 0.5 - n / 2) * s
        mu = np.where(r < 20, 19.5, np.where(r < 40, 18.0, np.inf))
        tabelle = dict(ds.flaechentabelle(mu, s, 16.0, 25.0))
        ring = math.pi * (40 ** 2 - 20 ** 2)
        scheibe = math.pi * 40 ** 2
        # Zwischen Ring und Loch nur der Ring (Loch schwaecher als die Isophote), ab 19,5 die Scheibe.
        self.assertEqual(sorted(tabelle), [18.0, 19.5])
        self.assertAlmostEqual(tabelle[18.0] / ring, 1.0, delta=0.005)
        self.assertAlmostEqual(tabelle[19.5] / scheibe, 1.0, delta=0.005)

    def test_streng_steigend_und_im_umfang(self):
        rng = np.random.default_rng(3)
        mu = rng.uniform(17.0, 23.0, (300, 300))
        mu[0, :] = mu[-1, :] = mu[:, 0] = mu[:, -1] = np.inf
        tabelle = ds.flaechentabelle(mu, 0.1, 16.5, 24.0)
        mags = [m for m, _ in tabelle]
        flaechen = [a for _, a in tabelle]
        self.assertTrue(all(b > a for a, b in zip(flaechen, flaechen[1:])))
        self.assertTrue(all(abs(b - a - 0.1) < 1e-9 for a, b in zip(mags, mags[1:])))
        self.assertGreaterEqual(mags[0], 17.0)
        self.assertLessEqual(mags[-1], 23.0)

    def test_endet_vor_dem_bildrand(self):
        # Gleichmaessige Flaeche 21 mag bis an den Rand: keine Isophote ab 21 ist eingeschlossen.
        mu = np.full((200, 200), 21.0)
        mu[80:120, 80:120] = 18.0
        tabelle = ds.flaechentabelle(mu, 0.1, 16.0, 25.0)
        self.assertEqual([m for m, _ in tabelle], [18.0])


class SterneTest(unittest.TestCase):
    def test_stern_auf_nebel(self):
        n = 200
        yy, xx = np.mgrid[0:n, 0:n]
        nebel = 100.0 * np.exp(-((xx - 100) ** 2 + (yy - 100) ** 2) / (2 * 40.0 ** 2))
        rauschen = np.random.default_rng(4).normal(0, 0.5, (n, n))
        stern = 400.0 * np.exp(-((xx - 70) ** 2 + (yy - 120) ** 2) / (2 * 1.0 ** 2))
        bereinigt, maske, sterne = ds.sterne_entfernen(nebel + rauschen + stern)
        self.assertEqual([(x, y) for x, y, _ in sterne], [(70, 120)])
        # Am Stern bleibt der Nebel (auf wenige Rauschstufen), ausserhalb der Maske ist nichts veraendert.
        self.assertLess(abs(bereinigt[120, 70] - nebel[120, 70]), 3.0)
        np.testing.assert_array_equal(bereinigt[~maske], (nebel + rauschen + stern)[~maske])
        self.assertLess(maske.sum(), 150)

    def test_spitze_im_rand_des_nachbarn_waechst(self):
        # Zwei Sterne 6 px auseinander, rand_px 4: die Spitze von B liegt im erweiterten Rand von A
        # (Kern plus 4 px), aber nicht in dessen Kern. B muss trotzdem wachsen, sonst bleibt sein Fluegel
        # jenseits des Rands von A stehen (Issue #106, Review M1).
        n = 200
        yy, xx = np.mgrid[0:n, 0:n]
        nebel = 100.0 * np.exp(-((xx - 100) ** 2 + (yy - 100) ** 2) / (2 * 40.0 ** 2))
        rauschen = np.random.default_rng(5).normal(0, 0.5, (n, n))
        stern = (400.0 * np.exp(-((xx - 60) ** 2 + (yy - 100) ** 2) / (2 * 1.0 ** 2))
                 + 400.0 * np.exp(-((xx - 66) ** 2 + (yy - 100) ** 2) / (2 * 1.0 ** 2)))
        bereinigt, maske, sterne = ds.sterne_entfernen(nebel + rauschen + stern, rand_px=4)
        self.assertEqual(sorted((x, y) for x, y, _ in sterne), [(60, 100), (66, 100)])
        # Jedes Pixel mit mehr als 3 Einheiten Sternlicht (6 Rauschstufen) ist maskiert.
        self.assertTrue(maske[stern > 3.0].all())
        # Kein Sternrest: im Ersatz bleibt nur der Gradient des Nebels ueber dem Ersatzfenster (unter 12).
        self.assertLess(float((bereinigt - nebel)[stern > 3.0].max()), 12.0)


class EichungTest(unittest.TestCase):
    def test_gesamthelligkeit_getroffen(self):
        # Gleichmaessige Scheibe: mag_hell aus der Eichung, dann Gesamthelligkeit aus den Kodes.
        n, s = 200, 0.1
        yy, xx = np.mgrid[0:n, 0:n]
        linear = np.where(np.hypot(xx - 100, yy - 100) < 60, 1.0 + 0.5 * np.cos(xx / 7.0), 0.0)
        kodes = ds.kodiere_relativ(ds.linear_zu_mu_rel(linear), 9.0)
        hell = round(ds.eiche_mag_hell(kodes, 9.0, s, {"art": "gesamt", "magnitude": 8.8}), 2)
        self.assertAlmostEqual(ds.gesamtmagnitude(kodes, hell, hell + 9.0, s), 8.8, delta=0.006)


if __name__ == "__main__":
    unittest.main()
