#!/usr/bin/env python3
"""Sternliste der Plejaden (M45) aus Gaia DR3 und Hipparcos erzeugen (Issue #104, A-Z10).

Grundlage: docs/recherche/deep-sky.md 4.2 (Kegel, Mitgliedschaft, Zaehlwerte) und
docs/recherche/physik.md 22 (V und B-V aus Gaia). Drei Abfragen im Gaia-Archiv
(TAP, ADQL), alle im Kegel 1,3 Grad um RA 56,75, Dec +24,1167 Grad (03 47 00, +24 07 00):

    - Gaia DR3 (gaiadr3.gaia_source) bis G = 9,0: Position, G, BP-RP, Parallaxe, Eigenbewegung;
    - Hipparcos (ESA 1997, public.hipparcos): Johnson V und B-V;
    - Hipparcos-Neureduktion (van Leeuwen 2007, public.hipparcos_newreduction): Parallaxe.

Mitglied ist ein Stern, wenn seine Gaia-Eigenbewegung innerhalb (20 +- 4,5; -45,5 +- 5,5)
mas/a und seine Gaia-Parallaxe 6,4 bis 8,5 mas betragen, oder seine Hipparcos-2-Parallaxe
7,3 bis 9,9 mas (deep-sky.md 4.2: Gaia-Astrometrie ist fuer Sterne heller als etwa 5 mag
gestoert). Hipparcos und Gaia werden ueber die Lage zugeordnet (Abstand unter 5'' und
|G - Hp| unter 1 mag); die Tabelle gaiadr3.hipparcos2_best_neighbour fuehrt Merope, Taygeta
und HIP 17791 nicht. V und B-V kommen aus Hipparcos, wo es den Stern gibt, sonst aus Gaia
(physik.md 22). Lage: Gaia-Position (Epoche 2016,0), ohne Gaia-Gegenstueck die
Hipparcos-Position (1991,25); bei 50 mas/a ist der Unterschied hoechstens 1,3''.

Aufruf aus dem Repo-Root:
    python3 tools/m45_sterne.py --abrufen   Rohdaten nach data/roh/ holen (Netz), Bytes und SHA-256 ausgeben
    python3 tools/m45_sterne.py             Rohdaten pruefen (SHA-256) und daten/sterne/m45.json schreiben
    python3 tools/m45_sterne.py --bericht   Vergleich Gaia gegen Hipparcos, Zaehlung, verworfene Sterne; schreibt nichts
    python3 tools/m45_sterne.py --liesmich  Eintrag fuer data/roh/LIESMICH.md ausgeben; schreibt nichts

Nur Python-Standardbibliothek. Idempotent: ein zweiter Lauf schreibt dieselbe Datei.
"""

import argparse
import csv
import hashlib
import io
import json
import math
import os
import sys
import urllib.parse
import urllib.request

TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
MITTE_RA_GRAD = 56.75
MITTE_DEC_GRAD = 24.1167
KEGEL_GRAD = 1.3
V_GRENZE = 8.5

KEGEL = (f"1 = CONTAINS(POINT('ICRS', {{ra}}, {{dec}}), "
         f"CIRCLE('ICRS', {MITTE_RA_GRAD}, {MITTE_DEC_GRAD}, {KEGEL_GRAD}))")

# Abfragen: Rohdatei -> ADQL. Wortlaut geht unveraendert nach data/roh/LIESMICH.md.
ABFRAGEN = {
    "m45_gaiadr3.csv": (
        "SELECT source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax, pmra, pmdec, ruwe "
        "FROM gaiadr3.gaia_source WHERE " + KEGEL.format(ra="ra", dec="dec")
        + " AND phot_g_mean_mag < 9.0 ORDER BY phot_g_mean_mag"
    ),
    "m45_hipparcos.csv": (
        "SELECT hip, hd, ra, de, vmag, b_v, varflag, sptype "
        "FROM public.hipparcos WHERE " + KEGEL.format(ra="ra", dec="de") + " ORDER BY hip"
    ),
    "m45_hipparcos2.csv": (
        "SELECT hip, ra, dec, plx, e_plx, pm_ra, pm_de, hp_mag "
        "FROM public.hipparcos_newreduction WHERE " + KEGEL.format(ra="ra", dec="dec") + " ORDER BY hip"
    ),
}

# Ergebnis von --abrufen; der Erzeugungslauf bricht ab, wenn eine Rohdatei davon abweicht.
ROHDATEN = {
    "m45_gaiadr3.csv": {"bytes": 10775, "abruf": "2026-10-29",
                        "sha256": "52e1d261bb7a8a402aec29797acf8850c70628307e96fd3d80eb147f883fd94e"},
    "m45_hipparcos.csv": {"bytes": 1672, "abruf": "2026-10-29",
                          "sha256": "f7279da0ce4170554172fc36606eae6b541dc86874058e9ec7dc08647ba064e1"},
    "m45_hipparcos2.csv": {"bytes": 2289, "abruf": "2026-10-29",
                           "sha256": "4680615f1a0b65cbd9e0702c42a514fd5333a54fe9a817cef3cd39c081972203"},
}

# Mitgliedschaft (deep-sky.md 4.2)
PM_RA_MITTE, PM_RA_HALB = 20.0, 4.5
PM_DE_MITTE, PM_DE_HALB = -45.5, 5.5
PLX_GAIA = (6.4, 8.5)
PLX_HIP2 = (7.3, 9.9)
# Zuordnung Hipparcos zu Gaia
ZUORDNUNG_ARCSEC = 5.0
ZUORDNUNG_MAG = 1.0

# Gaia DR3 Dokumentation, Kap. 5.5.1, Tabelle 5.9 (Johnson-Cousins), physik.md 22:
# G - V = f(BP-RP), gueltig -0,5 < BP-RP < 5,0, Streuung 0,030 mag
G_MINUS_V = (-0.02704, 0.01424, -0.2156, 0.01426)
BPRP_GUELTIG = (-0.5, 5.0)
# BP-RP = f(B-V), gueltig -0,5 < B-V < 3,5, Streuung 0,066 mag; fuer B-V numerisch invertiert
BPRP_AUS_BV = (0.06483, 1.575, -0.7815, 0.5707, -0.176, 0.01916)
BV_GUELTIG = (-0.5, 3.5)

# Eigennamen (deep-sky.md 4.2); sonst heisst der Stern wie sein Katalogeintrag.
NAMEN_HIP = {
    "17702": "Alkyone", "17847": "Atlas", "17499": "Elektra", "17573": "Maia", "17608": "Merope",
    "17531": "Taygeta", "17851": "Pleione", "17489": "Kelaeno", "17527": "18 Tau", "17579": "Asterope",
    "17588": "22 Tau", "17776": "HD 23753", "17900": "HD 23923", "17862": "HD 23873",
}
NAMEN_GAIA = {"66715105696289024": "24 Tau"}

QUELLE = ("ESA Gaia DR3 (gaiadr3.gaia_source; Gaia Collaboration, Vallenari et al. 2023, A&A 674, A1), "
          "Hipparcos (ESA 1997, ESA SP-1200, public.hipparcos) und Hipparcos-Neureduktion "
          "(van Leeuwen 2007, A&A 474, 653, public.hipparcos_newreduction), abgefragt im Gaia-Archiv "
          + TAP_URL + ". Credit: ESA, Gaia DPAC; Hipparcos: ESA.")
LIZENZ = ("CC BY-NC 3.0 IGO (https://creativecommons.org/licenses/by-nc/3.0/igo/), "
          "Daten der ESA Space Science Archives; kommerzielle Nutzung nur nach Genehmigung "
          "(data.licences@esa.int, https://www.cosmos.esa.int/web/esdc/terms-and-conditions)")


def de(x):
    """Zahl mit Dezimalkomma fuer deutsche Texte."""
    return f"{x:g}".replace(".", ",")


def polynom(koeff, x):
    return sum(k * x ** n for n, k in enumerate(koeff))


def v_aus_gaia(g, bp_rp):
    """Johnson V aus G und BP-RP (Gaia DR3 Dok. Tab. 5.9); None ausserhalb des Gueltigkeitsbereichs."""
    if bp_rp is None or not BPRP_GUELTIG[0] < bp_rp < BPRP_GUELTIG[1]:
        return None
    return g - polynom(G_MINUS_V, bp_rp)


def bv_aus_bprp(bp_rp):
    """B-V aus BP-RP: BP-RP = f(B-V) (Tab. 5.9) per Bisektion invertiert; f steigt im Gueltigkeitsbereich."""
    unten, oben = BV_GUELTIG
    if bp_rp is None or not polynom(BPRP_AUS_BV, unten) < bp_rp < polynom(BPRP_AUS_BV, oben):
        return None
    for _ in range(60):
        mitte = 0.5 * (unten + oben)
        if polynom(BPRP_AUS_BV, mitte) < bp_rp:
            unten = mitte
        else:
            oben = mitte
    return 0.5 * (unten + oben)


def zahl(text):
    return None if text is None or text.strip() == "" else float(text)


def lage_arcsec(ra, dec):
    """Offset zur Mitte: dx positiv nach Osten, dy nach Norden (deep-sky.md, Kopf)."""
    dx = (ra - MITTE_RA_GRAD) * math.cos(math.radians(MITTE_DEC_GRAD)) * 3600.0
    dy = (dec - MITTE_DEC_GRAD) * 3600.0
    return dx, dy


def abstand_arcsec(ra1, dec1, ra2, dec2):
    return math.hypot((ra1 - ra2) * math.cos(math.radians(MITTE_DEC_GRAD)), dec1 - dec2) * 3600.0


def gaia_mitglied(z):
    plx, pmra, pmdec = z["parallax"], z["pmra"], z["pmdec"]
    if plx is None or pmra is None or pmdec is None:
        return False
    return (abs(pmra - PM_RA_MITTE) <= PM_RA_HALB and abs(pmdec - PM_DE_MITTE) <= PM_DE_HALB
            and PLX_GAIA[0] <= plx <= PLX_GAIA[1])


def hip2_mitglied(h2):
    return h2 is not None and h2["plx"] is not None and PLX_HIP2[0] <= h2["plx"] <= PLX_HIP2[1]


def lies_csv(text, felder_text=()):
    """CSV des TAP-Dienstes zu Zeilen mit Zahlen; felder_text bleiben Text."""
    zeilen = []
    for roh in csv.DictReader(io.StringIO(text)):
        zeilen.append({k: (v.strip() if k in felder_text else zahl(v)) for k, v in roh.items()})
    return zeilen


def kandidaten(gaia, hip, hip2):
    """Alle Sterne mit Mitgliedschaft, V, B-V und Herkunft; auch Nicht-Mitglieder (fuer den Bericht)."""
    hip_nach = {h["hip"]: h for h in hip}
    hip2_nach = {h["hip"]: h for h in hip2}
    zugeordnet = {}
    for g in gaia:
        treffer = [h for h in hip2 if abstand_arcsec(h["ra"], h["dec"], g["ra"], g["dec"]) < ZUORDNUNG_ARCSEC
                   and h["hp_mag"] is not None and abs(h["hp_mag"] - g["phot_g_mean_mag"]) < ZUORDNUNG_MAG]
        if len(treffer) > 1:
            raise SystemExit(f"Gaia DR3 {g['source_id']}: mehrere Hipparcos-Sterne in {ZUORDNUNG_ARCSEC}''")
        if treffer:
            if treffer[0]["hip"] in zugeordnet:
                raise SystemExit(f"HIP {treffer[0]['hip']}: mehreren Gaia-Quellen zugeordnet")
            zugeordnet[treffer[0]["hip"]] = g["source_id"]
            g = dict(g, hip=treffer[0]["hip"])
        yield stern_aus(g, hip_nach.get(g.get("hip")), hip2_nach.get(g.get("hip")))
    for nr, h2 in hip2_nach.items():
        if nr not in zugeordnet:
            yield stern_aus(None, hip_nach.get(nr), h2)


def stern_aus(g, h, h2):
    v_gaia = bv_gaia = None
    if g is not None:
        v_gaia = v_aus_gaia(g["phot_g_mean_mag"], g["bp_rp"])
        bv_gaia = bv_aus_bprp(g["bp_rp"])
    hip_v = h is not None and h["vmag"] is not None
    hip_bv = h is not None and h["b_v"] is not None
    v = h["vmag"] if hip_v else v_gaia
    bv = h["b_v"] if hip_bv else bv_gaia
    ra, dec = (g["ra"], g["dec"]) if g is not None else (h2["ra"], h2["dec"])
    hip_nr = None if h2 is None else str(int(h2["hip"]))
    gaia_nr = None if g is None else str(int(g["source_id"]))
    return {
        "hip": hip_nr, "gaia": gaia_nr, "v": v, "bv": bv, "v_gaia": v_gaia, "bv_gaia": bv_gaia,
        "v_herkunft": "HIP" if hip_v else "GDR3", "bv_herkunft": "HIP" if hip_bv else "GDR3",
        "lage": lage_arcsec(ra, dec), "epoche": 2016.0 if g is not None else 1991.25,
        "mitglied": (g is not None and gaia_mitglied(g)) or hip2_mitglied(h2),
        "gaia_zeile": g, "hip2_zeile": h2,
    }


def katalogname(s):
    return f"HIP {s['hip']}" if s["v_herkunft"] == "HIP" else f"Gaia DR3 {s['gaia']}"


def sternname(s):
    return NAMEN_HIP.get(s["hip"]) or NAMEN_GAIA.get(s["gaia"]) or katalogname(s)


def mitglieder(sterne):
    """Mitglieder bis V_GRENZE, hellste zuerst; ohne V (keine Farbe in Gaia, nicht in Hipparcos) ein Fehler."""
    liste = []
    for s in sterne:
        if not s["mitglied"]:
            continue
        if s["v"] is None or s["bv"] is None:
            raise SystemExit(f"{katalogname(s)}: Mitglied ohne V oder B-V")
        if round(s["v"], 2) <= V_GRENZE:
            liste.append(s)
    liste.sort(key=lambda s: (round(s["v"], 2), s["gaia"] or "", s["hip"] or ""))
    return liste


def eintrag(s):
    dx, dy = s["lage"]
    stern = {
        "name": sternname(s),
        "dx_arcsec": round(dx, 1),
        "dy_arcsec": round(dy, 1),
        "magnitude": round(s["v"], 2),
        "b_v": round(s["bv"], 2),
        "katalog": katalogname(s),
    }
    stern["quelle_farbe"] = s["bv_herkunft"]
    return stern


def lade_rohdaten(ordner, pruefen=True):
    texte = {}
    for datei, soll in ROHDATEN.items():
        pfad = os.path.join(ordner, datei)
        with open(pfad, "rb") as f:
            roh = f.read()
        if pruefen and (len(roh) != soll["bytes"] or hashlib.sha256(roh).hexdigest() != soll["sha256"]):
            raise SystemExit(f"{pfad}: Bytes oder SHA-256 weichen von ROHDATEN ab (neu abgerufen?)")
        texte[datei] = roh.decode("utf-8")
    gaia = lies_csv(texte["m45_gaiadr3.csv"])
    hip = lies_csv(texte["m45_hipparcos.csv"], felder_text=("varflag", "sptype"))
    hip2 = lies_csv(texte["m45_hipparcos2.csv"])
    return gaia, hip, hip2


def sternliste(gaia, hip, hip2):
    sterne = mitglieder(kandidaten(gaia, hip, hip2))
    n_hip = sum(1 for s in sterne if s["v_herkunft"] == "HIP")
    gesamt = -2.5 * math.log10(sum(10 ** (-0.4 * round(s["v"], 2)) for s in sterne))
    abrufe = ", ".join(sorted({r["abruf"] for r in ROHDATEN.values()}))
    kommentar = (
        f"Erzeugt von tools/m45_sterne.py aus drei Abfragen im Gaia-Archiv (Abruf {abrufe}, ADQL und "
        f"SHA-256 in data/roh/LIESMICH.md): Kegel {de(KEGEL_GRAD)} Grad um RA {de(MITTE_RA_GRAD)}, Dec +{de(MITTE_DEC_GRAD)} Grad, "
        f"Mitglieder nach deep-sky.md 4.2 (Gaia-Eigenbewegung ({de(PM_RA_MITTE)} +- {de(PM_RA_HALB)}; "
        f"{de(PM_DE_MITTE)} +- {de(PM_DE_HALB)}) mas/a und Gaia-Parallaxe {de(PLX_GAIA[0])} bis {de(PLX_GAIA[1])} mas, "
        f"oder Hipparcos-2-Parallaxe {de(PLX_HIP2[0])} bis {de(PLX_HIP2[1])} mas), bis V {de(V_GRENZE)}: "
        f"{len(sterne)} Sterne. katalog nennt die Herkunft von V: HIP = Hipparcos (ESA 1997, {n_hip} Sterne), "
        f"Gaia DR3 = V aus G und BP-RP nach Gaia DR3 Dokumentation 5.5.1 Tabelle 5.9 ({len(sterne) - n_hip} Sterne, "
        "physik.md 22). quelle_farbe nennt die Herkunft von B-V: HIP oder GDR3 (BP-RP = f(B-V) aus "
        "Tabelle 5.9, invertiert). Lage dx nach Osten, dy nach Norden relativ zu 03 47 00, +24 07 00, "
        "Gaia-Epoche 2016,0, ohne Gaia-Gegenstueck Hipparcos 1991,25. Pleione (HIP 17851) ist veraenderlich. "
        "Summe der Sterne V " + f"{gesamt:.2f}".replace(".", ",") + "."
    )
    return {
        "objekt": "m45",
        "quelle": QUELLE,
        "lizenz": LIZENZ,
        "kommentar": kommentar,
        "sterne": [eintrag(s) for s in sterne],
    }


def abrufen(ordner):
    os.makedirs(ordner, exist_ok=True)
    for datei, adql in ABFRAGEN.items():
        daten = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": adql}).encode()
        with urllib.request.urlopen(urllib.request.Request(TAP_URL, data=daten), timeout=300) as antwort:
            roh = antwort.read()
        pfad = os.path.join(ordner, datei)
        with open(pfad, "wb") as f:
            f.write(roh)
        zeilen = roh.decode("utf-8").count("\n") - 1
        print(f"{pfad}: {len(roh)} Byte, {zeilen} Zeilen, SHA-256 {hashlib.sha256(roh).hexdigest()}")


def liesmich():
    zeilen = []
    for datei, adql in ABFRAGEN.items():
        r = ROHDATEN[datei]
        zeilen.append(
            f"- `{datei}`: Gaia-Archiv (ESA), TAP {TAP_URL}, HTTP-POST mit `REQUEST=doQuery`, `LANG=ADQL`, "
            f"`FORMAT=csv`. Abgerufen {r['abruf']}, {r['bytes']} Byte, SHA-256 `{r['sha256']}`. ADQL:\n"
            f"  `{adql}`\n"
            f"  Lizenz CC BY-NC 3.0 IGO (ESA Space Science Archives). Verarbeitet durch `tools/m45_sterne.py` "
            "nach `daten/sterne/m45.json` (Issue #104)."
        )
    return "\n".join(zeilen)


def bericht(gaia, hip, hip2):
    alle = list(kandidaten(gaia, hip, hip2))
    sterne = mitglieder(alle)
    print(f"Mitglieder bis V {V_GRENZE}: {len(sterne)}")
    for nr, s in enumerate(sterne, 1):
        e = eintrag(s)
        vg = "" if s["v_gaia"] is None else f"  Gaia: V {s['v_gaia']:.2f} B-V {s['bv_gaia']:.3f}"
        print(f"{nr:3d} {e['name']:<26} {e['dx_arcsec']:8.1f} {e['dy_arcsec']:8.1f} {e['magnitude']:5.2f} "
              f"{e['b_v']:6.2f} {e['katalog']:<28}{vg}")
    print("Verworfen bis V 8,5 (kein Mitglied):")
    for s in alle:
        if not s["mitglied"] and s["v"] is not None and s["v"] <= V_GRENZE:
            g = s["gaia_zeile"] or {}
            h2 = s["hip2_zeile"] or {}
            print(f"    {katalogname(s):<28} V {s['v']:.2f}  Gaia plx {g.get('parallax')} pm {g.get('pmra')} "
                  f"{g.get('pmdec')}  HIP2 plx {h2.get('plx')}")
    print("Zaehlung (deep-sky.md 4.2: 6 / 6 / 9 / 11 / 14 / 22 / 24 / 31 / 44):")
    for grenze in (4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5):
        print(f"    V <= {grenze}: {sum(1 for s in sterne if round(s['v'], 2) <= grenze)}")
    beide = [s for s in sterne if s["v_herkunft"] == "HIP" and s["v_gaia"] is not None]
    for titel, ohne in (("alle", ()), ("ohne Alkyone und Pleione", ("17702", "17851"))):
        auswahl = [s for s in beide if s["hip"] not in ohne]
        dv = [s["v_gaia"] - s["v"] for s in auswahl]
        dbv = [s["bv_gaia"] - s["bv"] for s in auswahl]
        for name, d in (("V", dv), ("B-V", dbv)):
            mittel = sum(d) / len(d)
            streu = math.sqrt(sum((x - mittel) ** 2 for x in d) / len(d))
            print(f"Gaia minus Hipparcos {name} ({titel}, {len(d)} Sterne): Mittel {mittel:+.3f}, "
                  f"Streuung {streu:.3f}, groesste {max(d, key=abs):+.3f}")


def main(argv=None):
    a = argparse.ArgumentParser(description="Sternliste M45 aus Gaia DR3 und Hipparcos")
    a.add_argument("--roh", default="data/roh", help="Ordner der Rohdaten (Standard data/roh)")
    a.add_argument("--ziel", default="daten/sterne/m45.json", help="Ausgabedatei (Standard daten/sterne/m45.json)")
    modus = a.add_mutually_exclusive_group()
    modus.add_argument("--abrufen", action="store_true", help="Rohdaten aus dem Gaia-Archiv holen")
    modus.add_argument("--bericht", action="store_true", help="Vergleich und Zaehlung ausgeben, nichts schreiben")
    modus.add_argument("--liesmich", action="store_true", help="Eintrag fuer data/roh/LIESMICH.md ausgeben")
    args = a.parse_args(argv)
    if args.abrufen:
        abrufen(args.roh)
        return 0
    if args.liesmich:
        print(liesmich())
        return 0
    gaia, hip, hip2 = lade_rohdaten(args.roh)
    if args.bericht:
        bericht(gaia, hip, hip2)
        return 0
    liste = sternliste(gaia, hip, hip2)
    os.makedirs(os.path.dirname(args.ziel), exist_ok=True)
    with open(args.ziel, "w", encoding="utf-8") as f:
        json.dump(liste, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{args.ziel}: {len(liste['sterne'])} Sterne")
    return 0


if __name__ == "__main__":
    sys.exit(main())
