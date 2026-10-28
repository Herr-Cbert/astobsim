#!/usr/bin/env python3
"""Strukturprofile messen: Helligkeitsstufen fuer die Tabellen-Tests der Validierung (Issue #21).

Die Tabellen-Tests in src/physik/validierung.test.ts falten eindimensionale
Stufenprofile mit dem Kern (profilDelle). Wo die Literatur keine Helligkeiten
nennt, kommen die Stufen aus dem Quellbild, denn die Anwendung zeigt das
Quellbild: Ein Profil mit anderen Stufen wuerde ein anderes Bild einfrieren.
Das Skript liest die Bilder unter daten/bilder/ (schreibt nichts), linear wie
die Anwendung (sRGB-Kennlinie nach IEC 61966-2-1, Leuchtdichte
Y = 0,2126 R + 0,7152 G + 0,0722 B, wie tools/quellweiss_eichen.py), und gibt aus:
    - Saturn (sat_20): Radialprofil durch beide Ansen (Zeile der hellsten
      Stelle bei 2,0 Saturnradien, Mittel ueber 3 Zeilen), dazu die mittlere
      Helligkeit je Ringzone relativ zum aeusseren B-Ring. Die Zonen sind die
      Katalogradien aus docs/recherche/objekte.md 4.2; der waagrechte Schnitt
      liegt wegen der Ringneigung nicht genau radial, daher werden die
      Bildradien linear auf den Katalog abgebildet: die Mitte der gemessenen
      Cassini-Teilung auf 1,9875, der Aussenrand des A-Rings (letzter Wert
      ueber 0,02) auf 2,269. Die Teilung ist der zusammenhaengende Bereich um
      das Minimum zwischen 1,85 und 2,05 Radien, der unter der halben Hoehe
      zwischen Minimum und dem niedrigeren Nachbargipfel (B-Ring aussen,
      A-Ring innen) liegt; fuer sie zusaetzlich Breite und mittlere Helligkeit
      ohne Flanken.
    - Mars (mars_14): Perzentile 10 und 70 der Leuchtdichte im inneren
      Scheibenbereich (Radius unter 0,7) als dunkle und helle Gebiete, und ihr
      Verhaeltnis. Dazu die Nordpolkappe (Issue #78): in der hellsten Zeile
      der Nordkappe (oberhalb 0,6 Radien) die Breite an der Halbwertskante
      zwischen Kappenkern (Perzentil 95 der Zeile) und hellen Gebieten
      (Perzentil 70 innen), in Bogensekunden und Scheibendurchmessern, und
      der Kern relativ zu den hellen Gebieten.
    - Jupiter (jup_47, Issue #79): Streifen am Zentralmeridian (96 px breit),
      Kern des NEB gegen die NTrZ, Fenster in Bogensekunden vom Aequator im
      Bild (Massstab des Nachweises), gewaehlt nach dem Profil des Bilds von
      2019 (die Baender liegen nicht genau auf den Katalogbreiten aus
      objekte.md 4.1). SEB und STrZ fallen aus, weil der GRF 2019 fast auf
      dem Zentralmeridian liegt. Ziel nach Orton [56] (objekte.md 4.1):
      Baender 0,62 bis 0,63, Zonen 0,76, also 0,82. Als Plausibilitaet der
      GRF (Pixel mit dem hoechsten Rot/Gruen-Anteil um die roteste Stelle der
      Suedhaelfte) gegen die NTrZ, Orton: 0,64/0,76 = 0,84.

Mit --exponent sucht das Skript fuer Jupiter per Bisektion den Exponenten g,
fuer den die an den Pixeln gemessenen Verhaeltnisse nach L^g je Kanal (wie
kontrast_exponent in tools/bild_aufbereiten.py) das Ziel treffen.

Mit --kurve bestimmt es fuer Saturn die Stuetzstellen einer Tonkurve (wie
kontrast_kurve in tools/bild_aufbereiten.py): eine Potenzkurve passt dort
nicht (Issue #79), das Pressebild hebt die hellen Ringe staerker ab als die
dunklen. Ziele relativ zum aeusseren B-Ring nach Salo und French 2010 [Quelle
in objekte.md 4.2]: A innen 0,83, A aussen 0,56, Cassini-Teilung 0,15 (Median
der Zone). Den C-Ring (Ziel 0,11) trifft keine monotone Kurve zugleich mit der
Teilung, weil beide im Bild etwa gleich dunkel sind; er bleibt ohne
Stuetzstelle und landet bei etwa 0,08. Stuetzstellen sind die gemessenen
Zonenmittel (Mittel beider Ansen),
der aeussere B-Ring bleibt fest; die Zielwerte werden iterativ nachgefuehrt,
bis die Zonen nach Anwenden der Kurve (Geometrie des Ausgangsbilds) treffen.

Gemessen wird immer am WebP in daten/bilder/; --exponent und --kurve nur am
unveraenderten Bild laufen lassen. Nach dem Neuerzeugen muss das Bild die
Ziele zeigen (Probe ohne Option).

Aufruf: python3 tools/strukturprofile.py [--exponent] [--kurve]
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

WURZEL = Path(__file__).resolve().parent.parent
DATEN = WURZEL / "daten"

# Ringzonen in Saturnradien (objekte.md 4.2, PDS Ring-Moon Systems Node);
# B-Ring in innen und aussen geteilt, A-Ring ebenso (das Bild zeigt beide Haelften verschieden hell).
ZONEN = [
    ("C-Ring", 1.236, 1.526),
    ("B-Ring innen", 1.526, 1.75),
    ("B-Ring aussen", 1.75, 1.950),
    ("Cassini-Teilung", 1.950, 2.025),
    ("A-Ring innen", 2.025, 2.10),
    ("A-Ring aussen", 2.10, 2.269),
]
CASSINI_MITTE = (1.950 + 2.025) / 2
A_RING_AUSSEN = 2.269


def linear(datei: Path) -> np.ndarray:
    a = np.asarray(Image.open(datei).convert("RGB")).astype(float) / 255.0
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def y_aus(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def leuchtdichte(datei: Path) -> np.ndarray:
    return y_aus(linear(datei))


def bildnachweis(zustand: str) -> dict:
    nachweise = json.loads((DATEN / "bilder.json").read_text(encoding="utf-8"))
    liste = nachweise if isinstance(nachweise, list) else nachweise["bilder"]
    return next(n for n in liste if n.get("zustand") == zustand)


def saturn_ansen(y: np.ndarray, radius_px: float, geometrie: list[dict] | None = None) -> list[dict]:
    """
    Radialprofil beider Ansen aus der Leuchtdichte y: je Anse Zeile, Abbildung der Bildradien auf
    den Katalog, mittlere Helligkeit je Ringzone (absolut) und die Teilung selbst. Mit geometrie
    (Ergebnis eines frueheren Aufrufs) gelten Zeilen und Abbildung von dort, damit eine Tonkurve
    die Zonengrenzen nicht verschiebt.
    """
    spalten = np.where(y.max(axis=0) > 0.05)[0]
    mitte_x = (spalten.min() + spalten.max()) / 2
    radien = np.arange(1.2, 2.32, 0.005)
    ergebnis = []
    for i, (seite, vorzeichen) in enumerate((("links", -1), ("rechts", 1))):
        if geometrie is None:
            zeile = int(np.argmax(y[:, int(round(mitte_x + vorzeichen * 2.0 * radius_px))]))
        else:
            zeile = geometrie[i]["zeile"]
        profil = y[zeile - 1 : zeile + 2, :].mean(axis=0)
        werte = np.array([profil[int(round(mitte_x + vorzeichen * r * radius_px))] for r in radien])
        if geometrie is None:
            # Cassini-Teilung: zusammenhaengend um das Minimum, unter halber Hoehe zum niedrigeren Nachbargipfel
            i_min = int(np.argmin(np.where((radien > 1.85) & (radien < 2.05), werte, np.inf)))
            links = werte[(radien > 1.85) & (radien < radien[i_min])].max()
            rechts = werte[(radien > radien[i_min]) & (radien < 2.05)].max()
            schwelle = (werte[i_min] + min(links, rechts)) / 2
            i_von = i_bis = i_min
            while werte[i_von - 1] < schwelle:
                i_von -= 1
            while werte[i_bis + 1] < schwelle:
                i_bis += 1
            r_mitte = (radien[i_von] + radien[i_bis]) / 2
            r_rand = radien[werte > 0.02].max()
            steigung = (A_RING_AUSSEN - CASSINI_MITTE) / (r_rand - r_mitte)
        else:
            i_von, i_bis, r_mitte, r_rand, steigung = (geometrie[i][k] for k in ("i_von", "i_bis", "r_mitte", "r_rand", "steigung"))
        r_kat = CASSINI_MITTE + (radien - r_mitte) * steigung
        zonen = {name: float(werte[(r_kat >= von) & (r_kat < bis)].mean()) for name, von, bis in ZONEN}
        zonen["Teilung selbst"] = float(werte[i_von : i_bis + 1].mean())
        ergebnis.append({"seite": seite, "zeile": zeile, "i_von": i_von, "i_bis": i_bis, "r_mitte": r_mitte, "r_rand": r_rand,
                         "steigung": steigung, "breite_teilung": (radien[i_bis] - radien[i_von] + 0.005) * steigung, "zonen": zonen})
    return ergebnis


def saturn() -> None:
    n = bildnachweis("sat_20")
    y = leuchtdichte(DATEN / "bilder" / n["datei"])
    print(f"Saturn {n['datei']}: Radius {n['objekt_durchmesser_px'] / 2:.0f} px")
    for a in saturn_ansen(y, n["objekt_durchmesser_px"] / 2):
        b_aussen = a["zonen"]["B-Ring aussen"]
        print(f"  Anse {a['seite']} (Zeile {a['zeile']}): Cassini-Mitte {a['r_mitte']:.3f} R, A-Rand {a['r_rand']:.3f} R, "
              f"Massstab {a['steigung']:.4f}")
        for name, von, bis in ZONEN:
            w = a["zonen"][name]
            print(f"    {name:16s} {von:.3f} bis {bis:.3f} R: Y {w:.3f}, relativ {w / b_aussen:.3f}")
        w = a["zonen"]["Teilung selbst"]
        print(f"    Teilung selbst: Breite {a['breite_teilung']:.3f} R, Y {w:.3f}, relativ {w / b_aussen:.3f}")


def mars() -> None:
    n = bildnachweis("mars_14")
    y = leuchtdichte(DATEN / "bilder" / n["datei"])
    hoehe, breite = y.shape
    radius_px = n["objekt_durchmesser_px"] / 2
    yy, xx = np.mgrid[:hoehe, :breite]
    innen = y[np.hypot(xx - breite / 2, yy - hoehe / 2) < 0.7 * radius_px]
    p10, p70 = np.percentile(innen, 10), np.percentile(innen, 70)
    print(f"Mars {n['datei']}: Perzentil 10 {p10:.3f}, 70 {p70:.3f}, Verhaeltnis dunkel/hell {p10 / p70:.3f}")
    # Nordpolkappe: hellste Zeile oberhalb 0,6 Radien, nur innerhalb der Scheibe
    in_scheibe = np.hypot(xx - breite / 2, yy - hoehe / 2) < 0.98 * radius_px
    oben = np.where(in_scheibe & (yy < hoehe / 2 - 0.6 * radius_px), y, 0.0)
    zeile = int(np.argmax(oben.mean(axis=1)))
    profil = oben[zeile - 2 : zeile + 3].mean(axis=0)
    kern_y = np.percentile(profil[profil > 0], 95)
    ueber = np.where(profil > (kern_y + p70) / 2)[0]
    breite_px = ueber.max() - ueber.min() + 1
    massstab = n["bogensekunden_pro_pixel"]
    print(f"  Nordpolkappe (Zeile {zeile}, {(hoehe / 2 - zeile) / radius_px:.2f} R ueber der Mitte): Breite {breite_px} px = "
          f"{breite_px * massstab:.2f}\" = {breite_px / n['objekt_durchmesser_px']:.3f} D, Kern {kern_y:.3f}, relativ zu hell {kern_y / p70:.2f}")



# Jupiter: Fenster in Bogensekunden vom Aequator (Norden positiv) und Ziel nach Orton [56].
JUPITER_BAND = (4.4, 7.2)
JUPITER_ZONE = (7.8, 9.4)
JUPITER_ZIEL = 0.82
JUPITER_STREIFEN_PX = 48


def jupiter_verhaeltnisse(rgb: np.ndarray, massstab: float) -> tuple[float, float]:
    """NEB gegen NTrZ am Zentralmeridian und GRF gegen NTrZ, beide aus Y des Bilds rgb (linear)."""
    y = y_aus(rgb)
    hoehe, breite = y.shape
    mitte = breite / 2
    streifen = y[:, int(mitte) - JUPITER_STREIFEN_PX:int(mitte) + JUPITER_STREIFEN_PX].mean(axis=1)

    def fenster(von, bis):
        zeilen = [int(round(hoehe / 2 - v / massstab)) for v in (bis, von)]
        return streifen[zeilen[0]:zeilen[1]].mean()

    zone = fenster(*JUPITER_ZONE)
    rot = (rgb[..., 0] + 1e-4) / (rgb[..., 1] + 1e-4)
    yy, xx = np.mgrid[:hoehe, :breite]
    sued = (np.hypot(xx + 0.5 - mitte, yy + 0.5 - hoehe / 2) < 0.85 * breite / 2) & (yy > hoehe / 2)
    gy, gx = divmod(int(np.argmax(np.where(sued, rot, 0))), breite)
    nah = np.hypot(xx - gx, yy - gy) < 60
    grf = nah & (rot >= np.quantile(rot[nah], 0.75))
    return fenster(*JUPITER_BAND) / zone, y[grf].mean() / zone


def jupiter(exponent: bool) -> None:
    n = bildnachweis("jup_47")
    rgb = linear(DATEN / "bilder" / n["datei"])
    massstab = n["winkelgroesse_arcsec"] / n["objekt_durchmesser_px"]
    band, grf = jupiter_verhaeltnisse(rgb, massstab)
    print(f"Jupiter {n['datei']}: NEB/NTrZ {band:.3f} (Ziel {JUPITER_ZIEL}), GRF/NTrZ {grf:.3f} (Orton 0,84)")
    if not exponent:
        return
    unten, oben = 0.05, 1.0
    for _ in range(40):
        g = (unten + oben) / 2
        if jupiter_verhaeltnisse(rgb ** g, massstab)[0] < JUPITER_ZIEL:
            oben = g
        else:
            unten = g
    g = round((unten + oben) / 2, 3)
    band_g, grf_g = jupiter_verhaeltnisse(rgb ** g, massstab)
    print(f"  Exponent g = {g}: NEB/NTrZ {band_g:.3f}, GRF/NTrZ {grf_g:.3f}")



# Saturn: Ziele relativ zum aeusseren B-Ring (Salo und French 2010, F555W, B ~ 19 Grad, objekte.md 4.2).
# Cassini-Teilung: das Zonenmittel entspricht dem Median 118 000 bis 121 500 km dort (0,15 bis 0,16),
# nicht dem Minimum (0,10).
# Der C-Ring (0,11) hat keine Stuetzstelle, siehe Kopf.
SATURN_ZIEL = {"Cassini-Teilung": 0.15, "A-Ring aussen": 0.56, "A-Ring innen": 0.83}


def tonkurve(rgb: np.ndarray, punkte: list[list[float]]) -> np.ndarray:
    """Tonkurve f auf die Leuchtdichte, Kanaele mit f(Y)/Y skaliert (wie kontrast_kurve in bild_aufbereiten.py)."""
    xs = [0.0] + [x for x, _ in punkte] + [1.0]
    ys = [0.0] + [y for _, y in punkte] + [1.0]
    y = y_aus(rgb)
    faktor = np.where(y > 0, np.interp(y, xs, ys) / np.where(y > 0, y, 1), 1.0)
    return rgb * faktor[..., None]


def saturn_relativ(ansen: list[dict]) -> dict[str, float]:
    """Mittel beider Ansen je Zone relativ zum aeusseren B-Ring."""
    return {k: float(np.mean([a["zonen"][k] / a["zonen"]["B-Ring aussen"] for a in ansen])) for k in ansen[0]["zonen"]}


def saturn_kurve() -> None:
    n = bildnachweis("sat_20")
    rgb = linear(DATEN / "bilder" / n["datei"])
    radius = n["objekt_durchmesser_px"] / 2
    geometrie = saturn_ansen(y_aus(rgb), radius)
    absolut = {k: float(np.mean([a["zonen"][k] for a in geometrie])) for k in geometrie[0]["zonen"]}
    b_aussen = absolut["B-Ring aussen"]
    namen = sorted(SATURN_ZIEL, key=lambda k: absolut[k])
    ziel_abs = {k: SATURN_ZIEL[k] * b_aussen for k in namen}
    for _ in range(12):
        punkte = [[round(absolut[k], 4), round(ziel_abs[k], 4)] for k in namen] + [[round(b_aussen, 4), round(b_aussen, 4)]]
        relativ = saturn_relativ(saturn_ansen(y_aus(tonkurve(rgb, punkte)), radius, geometrie))
        # Nachfuehren, dabei streng monoton bleiben (eine fallende Tonkurve wuerde dunkle Pixel vertauschen).
        unten = 0.0
        for k in namen:
            ziel_abs[k] = min(b_aussen * 0.999, max(unten * 1.001 + 1e-4, ziel_abs[k] * SATURN_ZIEL[k] / relativ[k]))
            unten = ziel_abs[k]
    print("Saturn Tonkurve (kontrast_kurve, linear Y): " + json.dumps(punkte))
    print("  danach relativ zum B-Ring aussen: " + ", ".join(f"{k} {relativ[k]:.3f} (Ziel {SATURN_ZIEL.get(k, '-')})" for k in relativ))


if __name__ == "__main__":
    saturn()
    mars()
    jupiter("--exponent" in sys.argv[1:])
    if "--kurve" in sys.argv[1:]:
        saturn_kurve()
