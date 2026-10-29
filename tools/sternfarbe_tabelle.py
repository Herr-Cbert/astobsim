#!/usr/bin/env python3
"""Farbtabelle der Sterne erzeugen: B-V zu linearem sRGB mit Y = 1 (Issue #98, A-P12).

Rezept nach docs/recherche/wahrnehmung.md 5.2 und 5.3:
    - B-V zu Farbtemperatur nach Ballesteros 2012, Gl. 14:
      T = 4600 K (1 / (0,92 (B-V) + 1,7) + 1 / (0,92 (B-V) + 0,62)),
    - Planck-Spektrum B(lambda, T) von 360 bis 830 nm in 1-nm-Schritten,
    - gewichtet mit den CIE-1931-2-Grad-Normspektralwertfunktionen in der
      Mehrfach-Gauss-Naeherung von Wyman, Sloan und Shirley 2013 (wie die
      Recherche; Unterschied zu Charitys Tabelle bis 5 Kodes im Blau),
    - XYZ auf Y = 1 normiert, mit der Matrix aus IEC 61966-2-1 (Weisspunkt
      D65) nach linearem sRGB.

Ausgabe auf stdout: die Stuetzstellen in 0,1-Schritten von B-V = -0,4 bis 2,0
als TypeScript-Zeilen fuer FARBTABELLE in src/physik/sternfarbe.ts, danach als
Probe die Zeilen der Tabelle 5.3 (linear max = 1, Y = 1, sRGB 8 Bit).
Liest und schreibt keine Dateien; die Ausgabe wird von Hand in sternfarbe.ts
uebernommen. Benoetigt numpy.
"""

import numpy as np

BV_MIN, BV_MAX, BV_SCHRITT = -0.4, 2.0, 0.1

# Planck-Konstanten (CODATA 2018), Werte in SI
H = 6.62607015e-34
C = 2.99792458e8
K = 1.380649e-23

# Matrix XYZ zu linearem sRGB, IEC 61966-2-1 (D65)
XYZ_ZU_SRGB = np.array([
    [3.2406, -1.5372, -0.4986],
    [-0.9689, 1.8758, 0.0415],
    [0.0557, -0.2040, 1.0570],
])

LAMBDA_NM = np.arange(360.0, 831.0, 1.0)


def bv_zu_temperatur(bv):
    """Ballesteros 2012, Gl. 14."""
    return 4600.0 * (1.0 / (0.92 * bv + 1.7) + 1.0 / (0.92 * bv + 0.62))


def gauss_stueck(x, mu, s1, s2):
    """Stueckweise Gauss-Funktion: Breite s1 links von mu, s2 rechts."""
    s = np.where(x < mu, s1, s2)
    return np.exp(-0.5 * ((x - mu) / s) ** 2)


def cie1931(lam):
    """Wyman, Sloan, Shirley 2013, Mehrfach-Gauss-Naeherung (Gl. 3)."""
    x = (1.056 * gauss_stueck(lam, 599.8, 37.9, 31.0)
         + 0.362 * gauss_stueck(lam, 442.0, 16.0, 26.7)
         - 0.065 * gauss_stueck(lam, 501.1, 20.4, 26.2))
    y = (0.821 * gauss_stueck(lam, 568.8, 46.9, 40.5)
         + 0.286 * gauss_stueck(lam, 530.9, 16.3, 31.1))
    z = (1.217 * gauss_stueck(lam, 437.0, 11.8, 36.0)
         + 0.681 * gauss_stueck(lam, 459.0, 26.0, 13.8))
    return x, y, z


def planck(lam_nm, t):
    lam = lam_nm * 1e-9
    return 1.0 / (lam ** 5 * (np.exp(H * C / (lam * K * t)) - 1.0))


def temperatur_zu_rgb(t):
    """Lineares sRGB (D65) mit Y = 1 und die Normfarbwertanteile x, y."""
    xq, yq, zq = cie1931(LAMBDA_NM)
    b = planck(LAMBDA_NM, t)
    xyz = np.array([np.sum(b * xq), np.sum(b * yq), np.sum(b * zq)])
    xyz = xyz / xyz[1]
    return XYZ_ZU_SRGB @ xyz, xyz[0] / xyz.sum(), xyz[1] / xyz.sum()


def srgb_kode(v):
    v = np.clip(v, 0.0, 1.0)
    s = np.where(v <= 0.0031308, 12.92 * v, 1.055 * v ** (1 / 2.4) - 0.055)
    return np.round(s * 255).astype(int)


def main():
    anzahl = int(round((BV_MAX - BV_MIN) / BV_SCHRITT)) + 1
    print("// B-V, T [K], R, G, B (linear, Y = 1)")
    for i in range(anzahl):
        bv = BV_MIN + i * BV_SCHRITT
        t = bv_zu_temperatur(bv)
        rgb, _, _ = temperatur_zu_rgb(t)
        print(f"  [{rgb[0]:.4f}, {rgb[1]:.4f}, {rgb[2]:.4f}], // {bv:+.1f}  {t:.0f} K")
    print()
    print("Probe Tabelle 5.3: B-V, T, x, y, linear max = 1, Y = 1, sRGB 8 Bit")
    for bv in (-0.3, 0.0, 0.6, 1.0, 1.5, 1.8):
        t = bv_zu_temperatur(bv)
        rgb, x, y = temperatur_zu_rgb(t)
        m = rgb / rgb.max()
        k = srgb_kode(m)
        print(f"{bv:+.1f} {t:7.0f} {x:.4f}/{y:.4f} "
              f"{m[0]:.3f}/{m[1]:.3f}/{m[2]:.3f} {rgb[0]:.3f}/{rgb[1]:.3f}/{rgb[2]:.3f} "
              f"{k[0]}/{k[1]}/{k[2]}")
    for t in (5800.0, 10000.0, 3500.0):
        rgb, _, _ = temperatur_zu_rgb(t)
        k = srgb_kode(rgb / rgb.max())
        print(f"{t:.0f} K: {k[0]}/{k[1]}/{k[2]}")


if __name__ == "__main__":
    main()
