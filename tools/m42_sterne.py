#!/usr/bin/env python3
"""Sternliste des Trapezes in M42 aus Gaia DR3 und Hipparcos erzeugen (Issue #107, A-Z10).

Grundlage: docs/recherche/deep-sky.md 2.2 (Auswahl, Herkunft der Helligkeiten) und
docs/recherche/physik.md 22 (V und B-V aus Gaia). Zwei Abfragen im Gaia-Archiv (TAP, ADQL):

    - Gaia DR3 (gaiadr3.gaia_source) bis G 13 im Kegel 0,06 Grad um Theta1 Ori C;
    - Hipparcos (ESA 1997, public.hipparcos) im Kegel 0,1 Grad.

Sterne: Theta1 Ori A bis F (Trapez) und Theta2 Ori A und B (deep-sky.md 2.2: "Theta2 B
ergaenzen, wenn das Quellbild die Gegend zeigt"; das WFI-Bild zeigt sie). Zuordnung fest ueber
die Gaia-Kennung (STERNE), geprueft gegen die WDS-Abstaende (WDS_PROBE, 0,5''). Helligkeit:
Hipparcos fuer C, D und Theta2 A; Gaia (G, BP-RP, physik.md 22) fuer A (Hipparcos zaehlt dort
C mit), B, F und Theta2 B; E aus dem WDS (11,1; Gaia ergaebe 10,06, deep-sky.md 2.2). B-V aus
Hipparcos, wo vorhanden, sonst aus Gaia. Die Gaia-Photometrie von E und F ist durch den Nebel
und die hellen Nachbarn in 4,5'' gestoert (BP/RP-Ueberschuss 1,43), beide sind bis 1,5 mag
unsicher.

Lage: dx positiv nach Westen (Norden oben, Osten links wie im Bild, Naht +x rechts), dy nach
Norden, relativ zu Theta1 Ori C (Gaia DR3, Epoche 2016,0); die Tabelle in deep-sky.md 2.2 hat
dx noch mit dem alten Vorzeichen (Osten positiv) und wird hier nicht uebernommen.

Aufruf aus dem Repo-Root:
    python3 tools/m42_sterne.py --abrufen   Rohdaten nach data/roh/m42/ holen (Netz)
    python3 tools/m42_sterne.py             Rohdaten pruefen (SHA-256) und daten/sterne/m42.json schreiben
    python3 tools/m42_sterne.py --bericht   Liste, Gaia gegen Hipparcos und WDS-Probe; schreibt nichts
    python3 tools/m42_sterne.py --liesmich  Eintrag fuer data/roh/LIESMICH.md ausgeben

Nur Python-Standardbibliothek. Idempotent.
"""

import argparse
import hashlib
import json
import math
import os
import sys
import urllib.parse
import urllib.request

from m45_sterne import LIZENZ, TAP_URL, bv_aus_bprp, lies_csv, mit_komma, v_aus_gaia

MITTE_RA_GRAD = 83.81861966629604   # Theta1 Ori C, Gaia DR3 3017364063330718080
MITTE_DEC_GRAD = -5.389696084726389

ABFRAGEN = {
    "m42_trapez_gaiadr3.csv": (
        "SELECT source_id, ra, dec, phot_g_mean_mag, bp_rp, phot_bp_rp_excess_factor, ruwe, pmra, pmdec "
        "FROM gaiadr3.gaia_source WHERE 1 = CONTAINS(POINT('ICRS', ra, dec), "
        "CIRCLE('ICRS', 83.81862, -5.389696, 0.06)) AND phot_g_mean_mag < 13.0 ORDER BY phot_g_mean_mag"
    ),
    "m42_trapez_hipparcos.csv": (
        "SELECT hip, hd, ra, de, vmag, b_v, varflag, sptype FROM public.hipparcos WHERE "
        "1 = CONTAINS(POINT('ICRS', ra, de), CIRCLE('ICRS', 83.81862, -5.389696, 0.1)) ORDER BY vmag"
    ),
}

ROHDATEN = {
    "m42_trapez_gaiadr3.csv": {"bytes": 4804, "abruf": "2026-10-29",
                               "sha256": "0163cfc6bd84604ac6f0f0d9bd3535fe50b186e67d8137ada08e8565ea17b1df"},
    "m42_trapez_hipparcos.csv": {"bytes": 249, "abruf": "2026-10-29",
                                 "sha256": "9fdf62c4991f5b0e5f400776247f7990d1f9b147084dd8ee2d59dbff992f7ccb"},
}

# Name, Gaia-DR3-Kennung, HIP-Nummer (nur wenn V und B-V aus Hipparcos), Herkunft von V
STERNE = [
    ("Theta1 Ori C", "3017364063330718080", "26221", "HIP"),
    ("Theta1 Ori A", "3017364132050194688", None, "GDR3"),
    ("Theta1 Ori D", "3017364063330465152", "26224", "HIP"),
    ("Theta1 Ori B", "3017364132049943680", None, "GDR3"),
    ("Theta1 Ori E", "3017364127743288704", None, "WDS"),
    ("Theta1 Ori F", "3017364063331140224", None, "GDR3"),
    ("Theta2 Ori A", "3017360936587007616", "26235", "HIP"),
    ("Theta2 Ori B", "3017360833515044480", None, "GDR3"),
]

# WDS 05353-0523 (STF 748), Datei wdsweb_summ2.txt (Stand 13.10.2026, Abruf 2026-10-29 fuer #103,
# data/roh/doppelsterne/): Komponente E mag2 11,1 (Zeile STF 748AE).
WDS_V = {"Theta1 Ori E": 11.1}
# Probe der Lage: letzte WDS-Messung (Abstand ''), Paare aus STF 748
WDS_PROBE = [("Theta1 Ori A", "Theta1 Ori C", 12.8), ("Theta1 Ori A", "Theta1 Ori E", 4.5),
             ("Theta1 Ori C", "Theta1 Ori F", 4.6), ("Theta1 Ori A", "Theta1 Ori B", 8.8),
             ("Theta1 Ori A", "Theta1 Ori D", 21.4), ("Theta1 Ori C", "Theta1 Ori D", 13.8)]
WDS_TOLERANZ_ARCSEC = 0.5  # C - D weicht um 0,4" ab (C ist ein enges Paar, Gaia 2016 gegen WDS 2021)

QUELLE = ("ESA Gaia DR3 (gaiadr3.gaia_source; Gaia Collaboration, Vallenari et al. 2023, A&A 674, A1) und "
          "Hipparcos (ESA 1997, ESA SP-1200, public.hipparcos), abgefragt im Gaia-Archiv " + TAP_URL
          + "; V von Theta1 Ori E aus dem Washington Double Star Catalog (Mason et al., WDS 05353-0523, STF 748). "
          "Credit: ESA, Gaia DPAC; Hipparcos: ESA.")


def lage_arcsec(ra, dec):
    """Offset zu Theta1 Ori C: dx positiv nach Westen, dy nach Norden (deep-sky.md, Kopf)."""
    dx = -(ra - MITTE_RA_GRAD) * math.cos(math.radians(MITTE_DEC_GRAD)) * 3600.0
    dy = (dec - MITTE_DEC_GRAD) * 3600.0
    return dx, dy


def lade_rohdaten(ordner, pruefen=True):
    texte = {}
    for datei, soll in ROHDATEN.items():
        pfad = os.path.join(ordner, datei)
        with open(pfad, "rb") as f:
            roh = f.read()
        if pruefen and (len(roh) != soll["bytes"] or hashlib.sha256(roh).hexdigest() != soll["sha256"]):
            raise SystemExit(f"{pfad}: Bytes oder SHA-256 weichen von ROHDATEN ab (neu abgerufen?)")
        texte[datei] = roh.decode("utf-8")
    gaia = lies_csv(texte["m42_trapez_gaiadr3.csv"], felder_text=("source_id",))
    hip = lies_csv(texte["m42_trapez_hipparcos.csv"], felder_text=("hip", "varflag", "sptype"))
    return gaia, hip


def sterne_aus(gaia, hip):
    nach_id = {z["source_id"]: z for z in gaia}
    nach_hip = {z["hip"]: z for z in hip}
    sterne = []
    for name, gid, hipnr, herkunft in STERNE:
        g = nach_id.get(gid)
        if g is None:
            raise SystemExit(f"{name}: Gaia DR3 {gid} fehlt in der Abfrage")
        h = nach_hip.get(hipnr) if hipnr else None
        if hipnr and h is None:
            raise SystemExit(f"{name}: HIP {hipnr} fehlt in der Abfrage")
        v_gaia = v_aus_gaia(g["phot_g_mean_mag"], g["bp_rp"])
        bv_gaia = bv_aus_bprp(g["bp_rp"])
        if herkunft == "HIP":
            v, bv, katalog, quelle_farbe = h["vmag"], h["b_v"], f"HIP {hipnr}", "HIP"
        elif herkunft == "WDS":
            v, bv, katalog, quelle_farbe = WDS_V[name], bv_gaia, f"WDS 05353-0523 E (V), Gaia DR3 {gid} (Lage)", "GDR3"
        else:
            v, bv, katalog, quelle_farbe = v_gaia, bv_gaia, f"Gaia DR3 {gid}", "GDR3"
        if v is None or bv is None:
            raise SystemExit(f"{name}: V oder B-V nicht bestimmbar")
        sterne.append({"name": name, "lage": lage_arcsec(g["ra"], g["dec"]), "v": v, "bv": bv,
                       "katalog": katalog, "quelle_farbe": quelle_farbe, "v_gaia": v_gaia, "bv_gaia": bv_gaia,
                       "gaia": g, "hip": h})
    return sterne


def pruefe_wds(sterne):
    lage = {s["name"]: s["lage"] for s in sterne}
    fehler = []
    for a, b, rho in WDS_PROBE:
        d = math.hypot(lage[a][0] - lage[b][0], lage[a][1] - lage[b][1])
        if abs(d - rho) > WDS_TOLERANZ_ARCSEC:
            fehler.append(f"{a} - {b}: {d:.2f}'' statt {rho}''")
    return fehler


def eintrag(s):
    dx, dy = s["lage"]
    # + 0.0 macht aus -0.0 (Theta1 Ori C) eine 0.0
    return {"name": s["name"], "dx_arcsec": round(dx, 2) + 0.0, "dy_arcsec": round(dy, 2) + 0.0, "magnitude": round(s["v"], 2),
            "b_v": round(s["bv"], 2), "katalog": s["katalog"], "quelle_farbe": s["quelle_farbe"]}


def sternliste(gaia, hip):
    sterne = sterne_aus(gaia, hip)
    fehler = pruefe_wds(sterne)
    if fehler:
        raise SystemExit("Lage passt nicht zum WDS: " + "; ".join(fehler))
    abrufe = ", ".join(sorted({r["abruf"] for r in ROHDATEN.values()}))
    e = next(s for s in sterne if s["name"] == "Theta1 Ori E")
    f = next(s for s in sterne if s["name"] == "Theta1 Ori F")
    gesamt = -2.5 * math.log10(sum(10 ** (-0.4 * round(s["v"], 2)) for s in sterne))
    kommentar = (
        f"Erzeugt von tools/m42_sterne.py aus zwei Abfragen im Gaia-Archiv (Abruf {abrufe}, ADQL und SHA-256 in "
        "data/roh/LIESMICH.md): Theta1 Ori A bis F (Trapez) und Theta2 Ori A und B (deep-sky.md 2.2). Lage aus "
        "Gaia DR3 (Epoche 2016,0) relativ zu Theta1 Ori C, dx nach Westen (Norden oben, Osten links), dy nach Norden; "
        "Probe gegen die WDS-Abstaende von STF 748 auf 0,5''. katalog nennt die Herkunft von V: HIP = Hipparcos (C, D, "
        "Theta2 A), Gaia DR3 = V aus G und BP-RP (physik.md 22; A, weil Hipparcos dort C mitzaehlt, B, F, Theta2 B), "
        "WDS fuer E. quelle_farbe: HIP oder GDR3 (BP-RP = f(B-V), Tabelle 5.9, invertiert). Unsicher: E und F bis "
        f"1,5 mag. E: WDS {mit_komma(e['v'])}, Gaia ergaebe {e['v_gaia']:.2f}".replace(".", ",")
        + f"; F: Gaia {f['v']:.2f}, WDS 11,5".replace(".", ",")
        + ". Beide stehen 4,5'' neben A bzw. C im hellsten Nebel; Gaia-BP/RP-Ueberschuss 1,43, also Fremdlicht in "
        "BP und RP. A (V1016 Ori) und B (BM Ori) sind Bedeckungsveraenderliche, C ist ein enges Paar. "
        "Summe der Sterne V " + f"{gesamt:.2f}".replace(".", ",") + "."
    )
    return {"objekt": "m42", "quelle": QUELLE, "lizenz": LIZENZ, "kommentar": kommentar,
            "sterne": [eintrag(s) for s in sterne]}


def abrufen(ordner):
    os.makedirs(ordner, exist_ok=True)
    for datei, adql in ABFRAGEN.items():
        daten = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": adql}).encode()
        with urllib.request.urlopen(urllib.request.Request(TAP_URL, data=daten), timeout=300) as antwort:
            roh = antwort.read()
        pfad = os.path.join(ordner, datei)
        with open(pfad, "wb") as f:
            f.write(roh)
        print(f"{pfad}: {len(roh)} Byte, SHA-256 {hashlib.sha256(roh).hexdigest()}")


def liesmich():
    zeilen = []
    for datei, adql in ABFRAGEN.items():
        r = ROHDATEN[datei]
        zeilen.append(
            f"- `m42/{datei}`: Gaia-Archiv (ESA), TAP {TAP_URL}, HTTP-POST mit `REQUEST=doQuery`, `LANG=ADQL`, "
            f"`FORMAT=csv`. Abgerufen {r['abruf']}, {r['bytes']} Byte, SHA-256 `{r['sha256']}`. ADQL:\n"
            f"  `{adql}`\n"
            "  Lizenz CC BY-NC 3.0 IGO (ESA Space Science Archives). Verarbeitet durch `tools/m42_sterne.py` "
            "nach `daten/sterne/m42.json` (Issue #107)."
        )
    return "\n".join(zeilen)


def bericht(gaia, hip):
    sterne = sterne_aus(gaia, hip)
    for s in sterne:
        e = eintrag(s)
        g = s["gaia"]
        print(f"{e['name']:<14} dx {e['dx_arcsec']:+8.2f} dy {e['dy_arcsec']:+8.2f}  V {e['magnitude']:5.2f} "
              f"B-V {e['b_v']:5.2f}  ({e['katalog']}; Gaia G {g['phot_g_mean_mag']:.2f} BP-RP {g['bp_rp']:.3f} "
              f"Ueberschuss {g['phot_bp_rp_excess_factor']:.2f} RUWE {g['ruwe']:.2f} -> V {s['v_gaia']:.2f})")
        if s["hip"]:
            print(f"{'':14} Hipparcos V {s['hip']['vmag']} B-V {s['hip']['b_v']}: Gaia minus HIP "
                  f"V {s['v_gaia'] - s['hip']['vmag']:+.2f}")
    lage = {s["name"]: s["lage"] for s in sterne}
    for a, b, rho in WDS_PROBE:
        d = math.hypot(lage[a][0] - lage[b][0], lage[a][1] - lage[b][1])
        pa = math.degrees(math.atan2(-(lage[b][0] - lage[a][0]), lage[b][1] - lage[a][1])) % 360
        print(f"WDS-Probe {a} - {b}: {d:.2f}'' bei PA {pa:.0f} Grad (WDS {rho}'')")
    fehler = pruefe_wds(sterne)
    print("WDS-Probe: " + ("in Ordnung" if not fehler else "; ".join(fehler)))


def main(argv=None):
    a = argparse.ArgumentParser(description="Sternliste des Trapezes (M42) aus Gaia DR3 und Hipparcos")
    a.add_argument("--roh", default="data/roh/m42", help="Ordner der Rohdaten (Standard data/roh/m42)")
    a.add_argument("--ziel", default="daten/sterne/m42.json", help="Ausgabedatei (Standard daten/sterne/m42.json)")
    modus = a.add_mutually_exclusive_group()
    modus.add_argument("--abrufen", action="store_true", help="Rohdaten aus dem Gaia-Archiv holen")
    modus.add_argument("--bericht", action="store_true", help="Liste und Proben ausgeben, nichts schreiben")
    modus.add_argument("--liesmich", action="store_true", help="Eintrag fuer data/roh/LIESMICH.md ausgeben")
    args = a.parse_args(argv)
    if args.abrufen:
        abrufen(args.roh)
        return 0
    if args.liesmich:
        print(liesmich())
        return 0
    gaia, hip = lade_rohdaten(args.roh)
    if args.bericht:
        bericht(gaia, hip)
        return 0
    liste = sternliste(gaia, hip)
    os.makedirs(os.path.dirname(args.ziel), exist_ok=True)
    with open(args.ziel, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{args.ziel}: {len(liste['sterne'])} Sterne")
    return 0


if __name__ == "__main__":
    sys.exit(main())
