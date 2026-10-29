import math, numpy as np, deep_sky as ds
px, m = 450, 40.0
roh0 = ds.m31_bild(px, m)
print("F  dmu  Bortle  mu_vis  Ausdehnung'  maxC/Cth  bei_mu")
for F in (1.0, 1.4, 2.0):
    for dmu in (0.0, -0.5, -1.0, -1.5):
        for b in (3, 5, 7):
            mu_h = ds.BORTLE[b]
            lin = np.maximum(ds.gauss_falten(roh0 * 10**(-0.4*(ds.K_EXT+dmu)), 60/m), 0)
            mv, cth, best = ds.sichtbare_isophote(lin, m, mu_h, 1, ds.mu_zu_cd(mu_h), F)
            ext = ds.ausdehnung(lin, m, mv) if mv else 0
            print(f"{F:.1f} {dmu:+.1f}  {b}  {mv if mv is None else round(mv,2)}  {ext:5.0f}  {best[0]:.2f}  {best[1]:.2f}")
# Sky, bei dem M31 mit F=2 gerade sichtbar wird
for mu_h in np.arange(17.0, 22.01, 0.25):
    lin = np.maximum(ds.gauss_falten(roh0 * 10**(-0.4*ds.K_EXT), 60/m), 0)
    mv, cth, best = ds.sichtbare_isophote(lin, m, mu_h, 1, ds.mu_zu_cd(mu_h), 2.0)
    print(f"Himmel {mu_h:.2f}: maxC/Cth {best[0]:.2f}")
