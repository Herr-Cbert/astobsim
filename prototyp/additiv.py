import sys, math
import deep_sky as ds
ds.ADDITIV = True
from pathlib import Path
ziel = Path("ausgabe_additiv"); ziel.mkdir(exist_ok=True)
faelle = [("M31 10x50 Bortle 5 additiv", ds.m31_bild, 450, 16.0, 6.0, 50, 10, 0.85, 0.0, 5),
          ("M31 Auge Bortle 1 additiv", ds.m31_bild, 450, 40.0, 60.0, 6, 1, 1.0, 0.0, 1)]
d, v = 80, 80
airy = 1.029*550e-9/(d/1000)*206264.8
faelle.append(("M57 80 mm 80x additiv", ds.m57_bild, 300, 0.5, math.sqrt(4+airy**2+(60/v)**2), d, v, 0.9, 0.0, 5))
for f in faelle:
    info, ohne, zeilen = ds.fall(*f, [0, 3, 6])
    ds.tafel(info, ohne, zeilen, ziel / (info["name"].replace(" ", "_").lower() + ".png"))
    print(info["name"], [(dm, round(g, 4)) for dm, g, _ in zeilen], "Kern", [int(b.max()) for _,_,b in zeilen])
