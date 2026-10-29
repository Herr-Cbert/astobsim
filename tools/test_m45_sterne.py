"""Tests fuer tools/m45_sterne.py (Issue #104). Aufruf aus dem Repo-Root:

    python3 -m unittest discover -s tools

Die Faelle mit den echten Rohdaten laufen nur, wenn data/roh/ sie enthaelt (gitignored).
"""

import os
import unittest

import m45_sterne as m

ROH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "roh")


def gaia_zeile(source_id, ra, dec, g, bp_rp, plx=7.3, pmra=20.0, pmdec=-45.5):
    return {"source_id": source_id, "ra": ra, "dec": dec, "phot_g_mean_mag": g, "bp_rp": bp_rp,
            "parallax": plx, "pmra": pmra, "pmdec": pmdec, "ruwe": 1.0}


class Umrechnung(unittest.TestCase):
    def test_v_aus_gaia_bei_farbe_null_und_eins(self):
        # G - V = -0,02704 + 0,01424 x - 0,2156 x^2 + 0,01426 x^3 (Gaia DR3 Dok. Tab. 5.9)
        self.assertAlmostEqual(m.v_aus_gaia(7.0, 0.0), 7.02704, places=5)
        self.assertAlmostEqual(m.v_aus_gaia(7.0, 1.0), 7.0 + 0.21414, places=5)

    def test_v_aus_gaia_ausserhalb_des_gueltigkeitsbereichs(self):
        self.assertIsNone(m.v_aus_gaia(7.0, -0.6))
        self.assertIsNone(m.v_aus_gaia(7.0, None))

    def test_bv_aus_bprp_kehrt_die_tabelle_um(self):
        for bv in (-0.3, -0.1, 0.0, 0.2, 0.65, 1.5):
            self.assertAlmostEqual(m.bv_aus_bprp(m.polynom(m.BPRP_AUS_BV, bv)), bv, places=9)
        # B-V = 0 gehoert zu BP-RP = 0,06483
        self.assertAlmostEqual(m.bv_aus_bprp(0.06483), 0.0, places=9)
        self.assertIsNone(m.bv_aus_bprp(-2.0))


class Mitgliedschaft(unittest.TestCase):
    def test_gaia_schnitte(self):
        self.assertTrue(m.gaia_mitglied(gaia_zeile(1, 56.75, 24.1167, 8.0, 0.2)))
        # Merope: Eigenbewegung 13 statt 20 mas/a, nur ueber Hipparcos-2 Mitglied (deep-sky.md 4.2)
        self.assertFalse(m.gaia_mitglied(gaia_zeile(1, 56.75, 24.1167, 4.2, 0.0, plx=7.07, pmra=13.1)))
        self.assertFalse(m.gaia_mitglied(gaia_zeile(1, 56.75, 24.1167, 8.0, 0.2, plx=8.8)))
        self.assertFalse(m.gaia_mitglied(gaia_zeile(1, 56.75, 24.1167, 2.9, 0.15, plx=None, pmra=None, pmdec=None)))

    def test_hipparcos_wird_ueber_die_lage_zugeordnet_und_liefert_v(self):
        gaia = [gaia_zeile(11, 56.8, 24.2, 4.2, 0.0, plx=7.07, pmra=13.1)]
        hip = [{"hip": 5.0, "hd": 1.0, "ra": 56.8001, "de": 24.2001, "vmag": 4.14, "b_v": -0.05, "varflag": "", "sptype": ""}]
        hip2 = [{"hip": 5.0, "ra": 56.8001, "dec": 24.2001, "plx": 8.0, "e_plx": 0.3, "pm_ra": 20.0, "pm_de": -45.0,
                 "hp_mag": 4.2},
                {"hip": 6.0, "ra": 57.0, "dec": 24.0, "plx": 15.5, "e_plx": 0.5, "pm_ra": 0.0, "pm_de": 0.0, "hp_mag": 7.0}]
        sterne = list(m.kandidaten(gaia, hip, hip2))
        self.assertEqual(len(sterne), 2)
        merope = sterne[0]
        self.assertEqual((merope["hip"], merope["gaia"], merope["v"], merope["v_herkunft"]), ("5", "11", 4.14, "HIP"))
        self.assertTrue(merope["mitglied"])
        # Hipparcos-Stern ohne Gaia-Gegenstueck, Vordergrund (15,5 mas): kein Mitglied, Lage aus Hipparcos
        self.assertFalse(sterne[1]["mitglied"])
        self.assertEqual(sterne[1]["epoche"], 1991.25)

    def test_gaia_nachbar_mit_falscher_helligkeit_bricht_ab(self):
        gaia = [gaia_zeile(11, 56.8, 24.2, 6.5, 0.0)]
        hip2 = [{"hip": 5.0, "ra": 56.8001, "dec": 24.2001, "plx": 8.0, "e_plx": 0.3, "pm_ra": 20.0, "pm_de": -45.0,
                 "hp_mag": 4.2}]
        with self.assertRaises(SystemExit):
            list(m.kandidaten(gaia, [], hip2))

    def test_lage_nach_osten_und_norden(self):
        dx, dy = m.lage_arcsec(m.MITTE_RA_GRAD + 0.1, m.MITTE_DEC_GRAD - 0.1)
        self.assertGreater(dx, 0)
        self.assertAlmostEqual(dy, -360.0, places=6)


@unittest.skipUnless(all(os.path.exists(os.path.join(ROH, d)) for d in m.ROHDATEN), "Rohdaten fehlen in data/roh/")
class EchteRohdaten(unittest.TestCase):
    def test_zaehlung_nach_deep_sky_4_2(self):
        liste = m.sternliste(*m.lade_rohdaten(ROH))["sterne"]
        bis = lambda v: sum(1 for s in liste if s["magnitude"] <= v)
        self.assertEqual([bis(v) for v in (5.0, 6.0, 6.5, 8.0, 8.5)], [6, 11, 14, 31, 44])


if __name__ == "__main__":
    unittest.main()
