"""Tests fuer tools/mond_kacheln.py und die Eichung der Mondzustaende (Issue #36).

Aufruf im Ordner tools/: python3 -m unittest (oder aus dem Repo-Root
python3 -m unittest discover -s tools). Nur numpy und Pillow.

Geprueft: Sonnenhoehe auf der Kugel (Phase, Seite, Positionswinkel), Schwaerzen der Nachtseite an
einem synthetischen Bild (beleuchteter Gipfel bleibt, Aufhellung verschwindet, Tagseite bleibt
gleich), Eichung von Quellweiss aller Mondzustaende an den Kacheln unter daten/ (Probe auf
0,01 mag) samt Magnitude nach Krisciunas und Schaefer 1991, Gl. 9. Mit den Rohbildern unter
data/roh/ zusaetzlich: gemessener Scheibendurchmesser gleich objekt_durchmesser_px.
"""

import json
import math
import os
import unittest

import numpy as np

import mond_kacheln as mk
import quellweiss_eichen as qe

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATEN = os.path.join(WURZEL, "daten")


def lade_json(name):
    with open(os.path.join(DATEN, name), encoding="utf-8") as f:
        return json.load(f)


def frame(**werte):
    """Frame-Eintrag mit Sub-Erde 0/0, Sub-Sonne 0/0 und Positionswinkel 0, ueberschrieben durch werte."""
    f = {"sub_erde_breite_grad": 0.0, "sub_erde_laenge_grad": 0.0, "sub_sonne_breite_grad": 0.0,
         "sub_sonne_laenge_grad": 0.0, "positionswinkel_achse_grad": 0.0}
    f.update(werte)
    return f


class SonnenhoeheTest(unittest.TestCase):
    N = 201
    K = 100.0
    R = 90.0

    def scheibe(self):
        yy, xx = np.mgrid[0:self.N, 0:self.N]
        return np.hypot(xx - self.K, yy - self.K) < self.R - 1, xx, yy

    def test_vollmond_mitte_im_zenit(self):
        h = mk.sonnenhoehe(self.N, self.K, self.K, self.R, frame())
        innen, _, _ = self.scheibe()
        self.assertAlmostEqual(float(h[100, 100]), 90.0, places=6)
        self.assertTrue((h[innen] > 0).all())

    def test_sonne_bei_laenge_90_beleuchtet_rechts(self):
        # Laenge +90 (Osten, IAU, Mare Crisium) erscheint rechts: zunehmender Halbmond.
        h = mk.sonnenhoehe(self.N, self.K, self.K, self.R, frame(sub_sonne_laenge_grad=90.0))
        innen, xx, _ = self.scheibe()
        self.assertTrue((h[innen & (xx > self.K + 1)] > 0).all())
        self.assertTrue((h[innen & (xx < self.K - 1)] < 0).all())

    def test_beleuchteter_anteil_gleich_phase(self):
        # Sub-Erde 0/0: Phasenwinkel i = Laenge der Sonne; Anteil mit Hoehe ueber 0 = (1 + cos i) / 2.
        n, k, r = 1201, 600.0, 580.0
        yy, xx = np.mgrid[0:n, 0:n]
        innen = np.hypot(xx - k, yy - k) < r
        for laenge in (45.0, 90.0, 135.7):
            h = mk.sonnenhoehe(n, k, k, r, frame(sub_sonne_laenge_grad=laenge))
            soll = (1 + math.cos(math.radians(laenge))) / 2
            self.assertAlmostEqual(float((h[innen] > 0).mean()), soll, delta=0.003)

    def test_positionswinkel_dreht_gegen_uhrzeigersinn(self):
        # Sonne ueber dem Nordpol: ohne Drehung oben hell; bei P = 90 Grad liegt der Pol im Osten
        # des Himmels, bei Norden oben also links.
        innen, xx, yy = self.scheibe()
        h0 = mk.sonnenhoehe(self.N, self.K, self.K, self.R, frame(sub_sonne_breite_grad=90.0))
        self.assertTrue((h0[innen & (yy < self.K - 1)] > 0).all())
        h90 = mk.sonnenhoehe(self.N, self.K, self.K, self.R,
                             frame(sub_sonne_breite_grad=90.0, positionswinkel_achse_grad=90.0))
        self.assertTrue((h90[innen & (xx < self.K - 1)] > 0).all())
        self.assertTrue((h90[innen & (xx > self.K + 1)] < 0).all())


class NachtseiteTest(unittest.TestCase):
    def test_schwaerzt_aufhellung_und_behaelt_gipfel_und_tagseite(self):
        n = mk.LEINWAND_PX
        k = n / 2 - 0.5
        geo = {"kx": k, "ky": k, "durchmesser_px": 2800}
        f = frame(sub_sonne_laenge_grad=90.0)          # Halbmond, rechts hell
        h = mk.sonnenhoehe(n, k, k, 1400.0, f)
        yy, xx = np.mgrid[0:n, 0:n]
        innen = np.hypot(xx - k, yy - k) < 1400
        bild = np.zeros((n, n, 3), np.uint8)
        bild[innen & (h >= 0)] = 150                  # Tagseite
        bild[innen & (h < 0)] = 12                    # Aufhellung des Renderings (Y etwa 0,004)
        # Gipfel 3 Grad hinter dem Terminator (links der Mitte), hell
        xg = int(round(k - 1400 * math.sin(math.radians(3.0))))
        bild[1530:1542, xg - 6:xg + 6] = 120
        # heller Fleck 8 Grad hinter dem Terminator: zu weit fuer einen Gipfel, wird schwarz
        xf = int(round(k - 1400 * math.sin(math.radians(8.0))))
        bild[1200:1206, xf - 3:xf + 3] = 120
        tag_vorher = bild[innen & (h >= 0)].copy()
        kennzahlen = mk.schwaerze_nachtseite(bild, geo, f)
        self.assertTrue((bild[innen & (h >= 0)] == tag_vorher).all())
        self.assertTrue((bild[1530:1542, xg - 6:xg + 6] == 120).all())
        self.assertTrue((bild[1200:1206, xf - 3:xf + 3] == 0).all())
        nacht = innen & (h < -1)
        nacht[1520:1552, xg - 16:xg + 16] = False
        self.assertEqual(int(bild[nacht].max()), 0)
        self.assertAlmostEqual(kennzahlen["anteil_scheibe"], 0.5, delta=0.01)


class EichungTest(unittest.TestCase):
    """Quellweiss jedes Mondzustands gegen die Kacheln: weiss - 2,5 log10(F) trifft magnitude."""

    @classmethod
    def setUpClass(cls):
        cls.nachweise = {e["id"]: e for e in lade_json("bilder.json")}
        cls.mond = next(o for o in lade_json("objekte.json") if o["id"] == "mond")

    def test_quellweiss_je_zustand(self):
        for z in self.mond["zustaende"]:
            with self.subTest(zustand=z["id"]):
                nachweis = self.nachweise[z["bild"]]
                summe = float(qe.leuchtdichte(nachweis, os.path.join(DATEN, "bilder")).sum())
                fluss = summe * (z["winkelgroesse_arcsec"] / nachweis["objekt_durchmesser_px"]) ** 2
                m_bild = z["weiss_mag_arcsec2"] - 2.5 * math.log10(fluss)
                self.assertLessEqual(abs(m_bild - z["magnitude"]), 0.01)

    def test_magnitude_nach_krisciunas_schaefer(self):
        # Seit #36 alle vier Mondzustaende, auch mond_ev (Entscheidung Herbert 2026-10-29).
        for z in self.mond["zustaende"]:
            with self.subTest(zustand=z["id"]):
                self.assertLessEqual(abs(qe.mond_magnitude_ks(z["phasenwinkel_grad"]) - z["magnitude"]), 0.01)

    def test_nachweis_passt_zum_frame(self):
        for frame_nr, f in mk.FRAMES.items():
            with self.subTest(frame=frame_nr):
                nachweis = self.nachweise[mk.bild_id(frame_nr)]
                self.assertEqual(nachweis["zustand"], f["zustand"])
                self.assertEqual(nachweis["datei"], f["ordner"] + "/")
                self.assertTrue(any(z["id"] == f["zustand"] and z["bild"] == nachweis["id"]
                                    for z in self.mond["zustaende"]))
                self.assertEqual("geschwaerzt" in nachweis["hinweise"], f["nachtseite_schwarz"])


@unittest.skipUnless(all(os.path.isfile(os.path.join(WURZEL, mk.rohbild_standard(n))) for n in mk.FRAMES),
                     "Rohbilder fehlen in data/roh/ (Herkunft: data/roh/LIESMICH.md)")
class RohbildTest(unittest.TestCase):
    def test_gemessene_scheibe_gleich_nachweis(self):
        nachweise = {e["id"]: e for e in lade_json("bilder.json")}
        for frame_nr, f in mk.FRAMES.items():
            with self.subTest(frame=frame_nr):
                rgba = mk.lade_rohbild(os.path.join(WURZEL, mk.rohbild_standard(frame_nr)))
                geo = mk.scheibe(rgba[..., 3], f)
                nachweis = nachweise[mk.bild_id(frame_nr)]
                self.assertEqual(geo["durchmesser_px"], nachweis["objekt_durchmesser_px"])
                self.assertEqual(geo["bogensekunden_pro_pixel"], nachweis["bogensekunden_pro_pixel"])
                # Massstab des Renderings ist fuer alle Frames gleich (bilder-v2.md 8.1, Punkt 5):
                # Winkelgroesse / gemessener Flaechendurchmesser auf 0,1 Prozent bei 0,6444"/px.
                self.assertAlmostEqual(f["winkelgroesse_arcsec"] / geo["mess_durchmesser"], 0.6444, delta=0.0007)


if __name__ == "__main__":
    unittest.main()
