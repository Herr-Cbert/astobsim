"""Wegwerf-Prototyp Phase 3 Version 2: Deep-Sky-Anblick (ADR-0004).

Kernfrage: Ergeben gemeinsame Abbildung (min(1, (a q + s)^n)), Schwelle per Isophote nach
Crumey 2014, Deckkraft nach Blackwell und Verstaerkung G ein plausibles Bild, und welches
Delta_min (sRGB-Kodes ueber dem Himmel an der Schwelle)?

Modellbilder aus Profilen (docs/recherche/deep-sky.md 1.2 und 5), keine Downloads.
Formeln: docs/recherche/wahrnehmung.md 1.2, 1.3, 1.4, 4.4; Konstanten ADR-0004.
Aufruf: python3 deep_sky.py <zielordner>
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

# Konstanten (ADR-0004, wahrnehmung.md 1.2)
N = 1 / 3                      # Kompressionsexponent
MU_WEISS = 9.2                 # Anzeigeweiss Flaechenebenen, mag/arcsec^2
F_BEOBACHTER = 2.0             # Feldfaktor
PUPILLE = 6.0                  # mm
K_EXT = 0.2                    # Extinktion klar, Zenit, Luftmasse 1
R1, R2, K1, K2, Q = 6.505e-4, -8.461e-4, 7.633e-3, -7.174e-3, 0.6
B_NULL = 1e-5                  # Nullhintergrund cd/m^2
SIGMA_M = 0.484                # Blackwell-Streuung
SR_PRO_ARCSEC2 = (math.pi / 180 / 3600) ** 2
ADDITIV = False
BORTLE = {1: 21.9, 3: 21.4, 5: 20.0, 7: 18.3, 9: 17.0}


def mu_zu_cd(mu):
    return 10 ** (-0.4 * (mu - 12.58))


def crumey_c(a_sr, b_cd):
    """Schwellenkontrast C(A, B) nach Crumey Gl. 47 (F = 1), A in sr."""
    b = max(b_cd, B_NULL)
    x = b ** -0.25
    r = (R1 * x + R2) ** 2
    c_inf = K1 * x + K2
    return ((r / a_sr) ** Q + c_inf ** Q) ** (1 / Q)


def phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def deckkraft(verhaeltnis):
    """Blackwell: P = Phi((C/C_th - 1) / 0,484), elementweise."""
    v = np.asarray(verhaeltnis, dtype=float)
    return 0.5 * (1 + np.vectorize(math.erf)((v - 1) / SIGMA_M / math.sqrt(2)))


def srgb(lin):
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, 12.92 * lin, 1.055 * lin ** (1 / 2.4) - 0.055)


def srgb_inv(code):
    v = code / 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


# Modellbilder: Flaechenhelligkeit in linearer Einheit 10^(-0,4 mu) je Pixel

def m31_bild(px, massstab):
    """Sersic n=2 Bulge (q 0,8) plus Exponentialscheibe (q 0,27), PA 35 Grad (deep-sky.md 1.2)."""
    y, x = np.mgrid[0:px, 0:px].astype(float)
    x = (x - px / 2 + 0.5) * massstab
    y = -(y - px / 2 + 0.5) * massstab
    pa = math.radians(35)  # von Norden ueber Osten (links)
    # grosse Achse: Richtung PA; Ost ist links (-x)
    ux, uy = -math.sin(pa), math.cos(pa)
    gross = x * ux + y * uy
    klein = -x * uy + y * ux
    n, re, mue = 2.0, 263.0, 19.4
    bn = 1.9992 * n - 0.3271
    r_b = np.sqrt(gross ** 2 + (klein / 0.8) ** 2)
    bulge = 10 ** (-0.4 * mue) * np.exp(-bn * ((r_b / re) ** (1 / n) - 1))
    rd, mu0 = 1474.0, 20.2
    r_d = np.sqrt(gross ** 2 + (klein / 0.27) ** 2)
    scheibe = 10 ** (-0.4 * mu0) * np.exp(-r_d / rd)
    return bulge + scheibe


def m57_bild(px, massstab):
    """Elliptischer Ring 88'' x 60'', PA 60, Loch 1,5 mag unter dem Ring, Mittel 17,8 im Oval."""
    y, x = np.mgrid[0:px, 0:px].astype(float)
    x = (x - px / 2 + 0.5) * massstab
    y = -(y - px / 2 + 0.5) * massstab
    pa = math.radians(60)
    ux, uy = -math.sin(pa), math.cos(pa)
    gross = x * ux + y * uy
    klein = -x * uy + y * ux
    rho = np.sqrt((gross / 44) ** 2 + (klein / 30) ** 2)
    ring = np.exp(-0.5 * ((rho - 0.78) / 0.16) ** 2)
    innen = np.where(rho < 0.78, 10 ** (-0.4 * 1.5), 0.0)
    profil = np.maximum(ring, innen * np.exp(-0.5 * (rho / 0.9) ** 8))
    oval = rho <= 1
    # Eichung: Mittel im Oval = 17,8 mag/arcsec^2
    mittel = profil[oval].mean()
    return profil * 10 ** (-0.4 * 17.8) / mittel


def gauss_falten(bild, fwhm_px):
    s = fwhm_px / 2.3548
    px = bild.shape[0]
    f = np.fft.fftfreq(px)
    fx, fy = np.meshgrid(f, f)
    h = np.exp(-2 * (math.pi * s) ** 2 * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(bild) * h))


def sichtbare_isophote(lin, massstab, mu_himmel, v, b_a, phi_f):
    """Crumey-Verfahren: Isophoten mu_i mit eingeschlossener Flaeche alpha_i; sichtbar,
    wenn C_i >= C_th(V^2 alpha_i). Rueckgabe: (mu_vis oder None, C_th dort, bestes Verhaeltnis)."""
    mu = -2.5 * np.log10(np.maximum(lin, 1e-30))
    stufen = np.arange(np.floor(mu.min() * 10) / 10, 27.0, 0.05)
    pixflaeche = massstab ** 2
    sortiert = np.sort(mu.ravel())
    best = (-1.0, None, None)
    mu_vis, cth_vis = None, None
    for mu_i in stufen:
        anzahl = np.searchsorted(sortiert, mu_i, side="right")
        if anzahl == 0:
            continue
        alpha_sr = anzahl * pixflaeche * SR_PRO_ARCSEC2 * v ** 2
        c_i = 10 ** (-0.4 * (mu_i - mu_himmel))
        cth = phi_f * crumey_c(alpha_sr, b_a)
        verh = c_i / cth
        if verh > best[0]:
            best = (verh, mu_i, cth)
        if verh >= 1:
            mu_vis, cth_vis = mu_i, cth
    return mu_vis, cth_vis, best


def ausdehnung(lin, massstab, mu_grenze):
    """Groesste Ausdehnung (Bogenminuten) der Flaeche heller als mu_grenze."""
    mu = -2.5 * np.log10(np.maximum(lin, 1e-30))
    ys, xs = np.nonzero(mu <= mu_grenze)
    if len(xs) == 0:
        return 0.0
    pts = np.stack([xs, ys], 1).astype(float)
    if len(pts) > 4000:
        pts = pts[np.random.default_rng(0).choice(len(pts), 4000, replace=False)]
    d = np.sqrt(((pts[:, None, :] - pts[None, :, :]) ** 2).sum(-1)).max()
    return d * massstab / 60


def fall(name, bildfunk, px, massstab, fwhm_arcsec, d_mm, v, tau, eps, bortle, deltas):
    mu_himmel = BORTLE[bortle]
    ap = d_mm / v
    okular = tau * (1 - eps ** 2) * min(1, (ap / PUPILLE) ** 2)
    auge = d_mm <= PUPILLE + 1e-9
    phi_f = F_BEOBACHTER * (1 if auge else math.sqrt(2))
    # Crumey Gl. 78: B_a = (min(AP,p)/p)^2 B / F_t, F_t = 1 / (tau (1 - eps^2))
    b_a = mu_zu_cd(mu_himmel - 2.5 * math.log10(okular))

    roh = bildfunk(px, massstab) * 10 ** (-0.4 * K_EXT)  # am Boden, vor dem Okular
    lin = gauss_falten(roh, fwhm_arcsec / massstab)
    lin = np.maximum(lin, 0)
    mu_vis, cth_vis, best = sichtbare_isophote(lin, massstab, mu_himmel, v, b_a, phi_f)

    # Anzeige: a q + s relativ zu Anzeigeweiss, Leuchtdichte im Okular
    l_obj = lin * okular / 10 ** (-0.4 * MU_WEISS)
    l_him = 10 ** (-0.4 * (mu_himmel - MU_WEISS)) * okular
    w_him = min(1.0, l_him ** N)
    w_gem = np.minimum(1, (l_obj + l_him) ** N)
    zuwachs = w_gem - w_him
    c_pix = lin / 10 ** (-0.4 * mu_himmel)

    if cth_vis is None:
        cth_eff = best[2]  # Schwelle der guenstigsten Isophote, Objekt insgesamt unter der Schwelle
    else:
        cth_eff = cth_vis
    p = deckkraft(c_pix / cth_eff)
    code_him = srgb(w_him) * 255
    # Zuwachs an der Schwelle (Pixel mit C = C_th, Deckkraft dort 0,5)
    w_schwelle = min(1, (cth_eff * l_him + l_him) ** N) - w_him

    zeilen = []
    for dmin in deltas:
        if dmin == 0:
            g = 1.0
        else:
            ziel = srgb_inv(min(255, code_him + dmin)) - w_him
            g = max(1.0, ziel / (0.5 * w_schwelle))
        if ADDITIV:
            # Sockel: an der Schwelle (P = 0,5) genau Delta_min ueber dem Himmel, im Kern ohne Wirkung
            sockel = 0.0 if dmin == 0 else max(0.0, 2 * (srgb_inv(min(255, code_him + dmin)) - w_him) - w_schwelle)
            g = sockel
            w = np.minimum(1, w_him + p * (zuwachs + sockel))
        else:
            w = np.minimum(1, w_him + g * p * zuwachs)
        zeilen.append((dmin, g, (srgb(w) * 255 + 0.5).astype(np.uint8)))
    ohne = (srgb(w_gem) * 255 + 0.5).astype(np.uint8)

    info = {
        "name": name, "bortle": bortle, "V": v, "AP": ap, "mu_himmel_ok": mu_himmel - 2.5 * math.log10(okular),
        "B_a": b_a, "himmel_code": code_him, "mu_vis": mu_vis, "C_th": cth_eff,
        "bestes_verh": best[0], "mu_best": best[1],
        "ausdehnung_arcmin": ausdehnung(lin, massstab, mu_vis) if mu_vis else 0.0,
        "kern_code_ohne": int(ohne.max()),
    }
    return info, ohne, zeilen


def tafel(info, ohne, zeilen, ziel):
    h = ohne.shape[0]
    rand = 4
    kopf = 34
    breite = (len(zeilen) + 1) * (h + rand) + rand
    bild = Image.new("L", (breite, h + kopf + rand), 255)
    zeichne = ImageDraw.Draw(bild)
    bilder = [("ohne Schwelle", ohne)] + [(f"Dmin {d}, G {g:.2f}", b) for d, g, b in zeilen]
    for i, (titel, b) in enumerate(bilder):
        x0 = rand + i * (h + rand)
        bild.paste(Image.fromarray(b), (x0, kopf))
        zeichne.text((x0, 18), titel, fill=0)
    mv = f"{info['mu_vis']:.2f}" if info["mu_vis"] else "keine"
    zeichne.text((rand, 3), f"{info['name']}  Himmel sRGB {info['himmel_code']:.0f}  mu_vis {mv}  "
                 f"Ausdehnung {info['ausdehnung_arcmin']:.0f}'  C_th {info['C_th']:.3g}  "
                 f"max C/Cth {info['bestes_verh']:.2f}", fill=0)
    bild.save(ziel)


def main():
    ziel = Path(sys.argv[1] if len(sys.argv) > 1 else "ausgabe")
    ziel.mkdir(parents=True, exist_ok=True)
    deltas = [0, 3, 6]
    faelle = []
    # M31 blosses Auge: 5 Grad Feld auf 450 px (40''/px), Augen-PSF 60''
    for b in (1, 3, 5, 7):
        faelle.append((f"M31 Auge Bortle {b}", m31_bild, 450, 40.0, 60.0, 6, 1, 1.0, 0.0, b))
    # M31 im 10x50
    faelle.append(("M31 10x50 Bortle 5", m31_bild, 450, 16.0, 6.0, 50, 10, 0.85, 0.0, 5))
    # M57: Ausschnitt 300'' auf 300 px (1''/px); Kern Seeing 2'' plus Airy plus Auge 60''/V
    for d, v, tau, eps in ((80, 80, 0.9, 0.0), (150, 120, 0.8, 0.25)):
        airy = 1.029 * 550e-9 / (d / 1000) * 206264.8
        fwhm = math.sqrt(2.0 ** 2 + airy ** 2 + (60 / v) ** 2)
        faelle.append((f"M57 {d} mm {v}x Bortle 5", m57_bild, 300, 0.5, fwhm, d, v, tau, eps, 5))
    for f in faelle:
        info, ohne, zeilen = fall(*f, deltas)
        name = info["name"].replace(" ", "_").lower()
        tafel(info, ohne, zeilen, ziel / f"{name}.png")
        print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in info.items()},
              [(d, round(g, 2)) for d, g, _ in zeilen])


if __name__ == "__main__":
    main()
