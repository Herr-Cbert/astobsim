#!/usr/bin/env python3
"""Doppelsterne der festen Katalogliste fuer daten/objekte.json erzeugen (Issue #103, A-Z9).

Liest die Katalogauszuege aus data/roh/doppelsterne/ (Herkunft, URL und SHA-256 in
data/roh/LIESMICH.md): WDS (wdsweb_summ2.txt), ORB6-Ephemeriden (orb6ephem.txt), TDSC
und Hipparcos (tdsc_paare.csv, hip_paare.csv, ESA), BSC (bsc_paare.csv, HEASARC) und
SIMBAD (simbad_begleiter.csv). Liste und Auswahl nach docs/recherche/doppelsterne.md 2,
Format nach ADR-0003 Nachtrag Version 2.

Konvention der Naht (src/naht/konfiguration.ts, docs/architektur.md 5.3): dx positiv =
rechts, dy positiv = Norden; bei Norden oben liegt Osten links, also dx = -rho sin(PA),
dy = rho cos(PA) mit dem Positionswinkel PA von Norden ueber Osten. Paare aus zwei
Sternen liegen Ost-West mit der Mitte im Ursprung: A bei -rho/2 (links, Osten), B bei
+rho/2 (rechts, Westen). Epsilon Lyrae steht als Mehrfachstern in echter Lage.
B-V aus dem TDSC mit B-V = 0,850 (BT - VT) (docs/recherche/physik.md 21).

Ersetzt die Objekte mit typ "doppelstern" in daten/objekte.json an ihrer Stelle oder
setzt sie, wenn es noch keine gibt, hinter saturn ein. Alle anderen Eintraege bleiben
Zeichen fuer Zeichen erhalten; ein zweiter Lauf aendert nichts. Nur Standardbibliothek.

Aufruf aus dem Repo-Root:
    python3 tools/doppelsterne.py [--roh data/roh/doppelsterne] [--objekte daten/objekte.json] [--pruefen]
--pruefen schreibt nichts und endet mit Exit-Code 1, wenn die Datei abweicht.
"""

import argparse
import csv
import json
import math
import sys

def erzeuge(roh):
    """Liste der Doppelstern-Objekte in der Reihenfolge von doppelsterne.md 2.2."""
    GESUCHT = {"19307+2758", "13239+5456", "02039+4220", "07346+3153", "12417-0127", "22288-0001", "18443+3940",
               "19487+1149", "02592+2120", "05480+0627", "03054+2515", "16413+3136", "16294-2626", "02318+8916"}


    def zw(t):
        try:
            return float(t)
        except ValueError:
            return None


    wds = {}
    for z in open(f"{roh}/wdsweb_summ2.txt", encoding="latin-1"):
        if len(z) < 70 or not z[0].isdigit():
            continue
        schluessel = (z[0:10], z[10:17].strip(), z[17:22].strip())
        if schluessel[0] not in GESUCHT:
            continue
        wds[schluessel] = dict(
            letzte=int(z[28:32]), anzahl=int(z[33:37]), pa=int(z[42:45]), sep=float(z[52:57]),
            m1=zw(z[58:63]), m2=zw(z[64:69]))

    orb6 = {}
    for z in open(f"{roh}/orb6ephem.txt", encoding="latin-1"):
        if len(z) < 100 or not z[0].isdigit() or z[0:10] not in GESUCHT:
            continue
        # Spalten: WDS, Name (mit Leerzeichen), Note, Referenz, dann 5 x (Theta, Rho)
        werte = z[46:].split()
        name = z[11:27].strip()
        note = z[27:33].strip()
        ref = z[33:46].strip()
        if zw(werte[4]) is None:
            continue
        orb6.setdefault((z[0:10], " ".join(name.split()), ref), (note, float(werte[4]), float(werte[5])))

    tdsc = {}
    with open(f"{roh}/tdsc_paare.csv") as f:
        for r in csv.DictReader(f):
            tdsc[(r["WDS"], r["m_TDSC"].strip())] = (float(r["BTmag"]), float(r["VTmag"]), r["TDSC"])
    hip = {}
    with open(f"{roh}/hip_paare.csv") as f:
        for r in csv.DictReader(f):
            hip[int(r["HIP"])] = float(r["B-V"])
    bsc = {}
    with open(f"{roh}/bsc_paare.csv") as f:
        for r in csv.DictReader(f):
            bsc[int(r["hr"])] = float(r["bv_color"])
    simbad = {}
    with open(f"{roh}/simbad_begleiter.csv") as f:
        for r in csv.DictReader(f):
            simbad[(r["id"], r["filter"])] = float(r["flux"])


    def farbe_tdsc(w, komp):
        bt, vt, nr = tdsc[(w, komp)]
        return round(0.850 * (bt - vt), 2), f"TDSC {nr} {komp}"


    # --- Paare ----------------------------------------------------------------------------------
    # id, Name, WDS, Discoverer, Komponenten, ORB6-Referenz (oder None), Farben je Stern
    # (b_v, katalog, quelle_farbe), Magnitude B (falls nicht WDS), hinweis_hilfe, kommentar
    def h(n): return (hip[n], f"HIP {n}", "Hipparcos")
    def y(n): return (bsc[n], f"HR {n}", "BSC")
    def t(w, k):
        bv, kat = farbe_tdsc(w, k)
        return (bv, kat, "TDSC")

    KOMMENTAR_TDSC = "B-V aus dem TDSC (Fabricius et al. 2002) umgerechnet mit B-V = 0,850 (BT - VT), ESA 1997 Bd. 1 Gl. 1.3.20 (physik.md 21). Credit: ESA."
    KOMMENTAR_WDS = "Trennung, Positionswinkel und Magnituden aus dem WDS (USNO), Abruf 2026-10-29."
    KOMMENTAR_ORB6 = "Trennung und Positionswinkel aus der ORB6-Ephemeride 2027,0 (USNO), Magnituden aus dem WDS, Abruf 2026-10-29."

    paare = [
        dict(id="albireo", name="Albireo (Beta Cygni)", wds="19307+2758", disc="STFA 43", komp="AB", orb=None,
             # Ausnahme vom WDS (Entscheidung Herbert 2026-10-29): WDS und TDSC geben fuer B 4,68 (VT des TDSC),
             # der Hipparcos-Hauptkatalog Vmag 5,12 (HIP 95951) und der Tycho-Hauptkatalog BT 5,01, VT 5,082,
             # also V_J = VT - 0,090 (BT - VT) = 5,09. Genommen 5,1.
             farben=[h(95947), h(95951)], mag_b=5.1,
             kommentar="A ist selbst eng doppelt (Aa,Ac 0,4\"), fuer astobsim ein Stern; Magnitude und B-V von A gelten fuer A gesamt. B-V aus dem Hipparcos-Hauptkatalog (ESA 1997, Johnson B-V; Credit: ESA). Magnitude von B 5,1 statt WDS 4,68 (= VT des TDSC): Hipparcos Vmag 5,12 (HIP 95951), Tycho-Hauptkatalog BT 5,01 und VT 5,082 ergeben V 5,09 (Entscheidung Herbert 2026-10-29, docs/recherche/README.md). Trennung und Positionswinkel aus dem WDS (USNO), Magnitude von A aus dem WDS, Abruf 2026-10-29."),
        dict(id="mizar", name="Mizar (Zeta Ursae Majoris)", wds="13239+5456", disc="STF1744", komp="AB", orb=None,
             farben=[y(5054), y(5055)],
             kommentar="B-V aus dem Bright Star Catalogue, 5. Aufl. (Hoffleit und Warren 1991), HR 5054 und 5055. " + KOMMENTAR_WDS),
        dict(id="gamma_and", name="Gamma Andromedae (Alamak)", wds="02039+4220", disc="STF 205", komp="A,BC", orb=None,
             namen=["A", "BC"], farben=[y(603), y(604)],
             kommentar="BC ist eng doppelt (STT 38, 0,37\" fuer 2027,0 nach ORB6), fuer astobsim ein Stern. B-V aus dem Bright Star Catalogue (HR 603, 604). Magnitude von BC nach WDS 5,02 (BSC 4,84). " + KOMMENTAR_WDS),
        dict(id="castor", name="Castor (Alpha Geminorum)", wds="07346+3153", disc="STF1110", komp="AB", orb="CIA2022d",
             farben=[y(2891), y(2890)],
             kommentar="C (YY Gem, 70\") entfaellt (doppelsterne.md 2.2). B-V aus dem Bright Star Catalogue (HR 2891 fuer A, HR 2890 fuer B). " + KOMMENTAR_ORB6),
        dict(id="porrima", name="Porrima (Gamma Virginis)", wds="12417-0127", disc="STF1670", komp="AB", orb="Sca2007c",
             farben=[t("12417-0127", "A"), t("12417-0127", "B")],
             hinweis="Die beiden Sterne von Porrima umlaufen einander in rund 169 Jahren; 2005 standen sie nur 0,4 Bogensekunden auseinander, gezeigt ist der Abstand für 2027.",
             kommentar=KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="zeta_aqr", name="Zeta Aquarii", wds="22288-0001", disc="STF2909", komp="AB", orb="Izm2019",
             farben=[t("22288-0001", "A"), t("22288-0001", "B")],
             kommentar=KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="pi_aql", name="Pi Aquilae", wds="19487+1149", disc="STF2583", komp="AB", orb=None,
             farben=[t("19487+1149", "A"), t("19487+1149", "B")],
             kommentar="Keine Bahn in ORB6. " + KOMMENTAR_TDSC + " " + KOMMENTAR_WDS),
        dict(id="eps_ari", name="Epsilon Arietis", wds="02592+2120", disc="STF 333", komp="AB", orb="Izm2019",
             farben=[t("02592+2120", "A"), t("02592+2120", "B")],
             kommentar=KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="ori_52", name="52 Orionis", wds="05480+0627", disc="STF 795", komp="", orb="Izm2019",
             farben=[t("05480+0627", "A"), t("05480+0627", "B")],
             kommentar=KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="ari_52", name="52 Arietis", wds="03054+2515", disc="STF 346", komp="AB", orb="Hei1981a",
             farben=[(farbe_tdsc("03054+2515", "AB")[0], "TDSC 6733 AB", "TDSC"), (farbe_tdsc("03054+2515", "AB")[0], "TDSC 6733 AB", "TDSC")],
             kommentar="Im TDSC nicht aufgeloest: B-V des Systems fuer beide Sterne (beide B7V; Hipparcos -0,031). Bahn von 1981 (Note 3), die Ephemeride ist unsicher (WDS 2024: 0,5\"). " + KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="zeta_her", name="Zeta Herculis", wds="16413+3136", disc="STF2084", komp="", orb="Izm2019",
             farben=[t("16413+3136", "A"), t("16413+3136", "B")],
             kommentar="Bahn mit 34,5 Jahren Umlauf (Note 1). " + KOMMENTAR_TDSC + " " + KOMMENTAR_ORB6),
        dict(id="antares", name="Antares (Alpha Scorpii)", wds="16294-2626", disc="GNT   1", komp="", orb="Izm2019",
             farben=[h(80763), (round(simbad[("* alf Sco B", "B")] - simbad[("* alf Sco B", "V")], 2), "SIMBAD alf Sco B", "SIMBAD")],
             kommentar="B-V von A ist der Hipparcos-Wert des Systems (HIP 80763, Credit: ESA); B traegt weniger als 2 % zum Fluss bei. B-V von B aus SIMBAD B 5,0 und V 5,2 (Qualitaet E, ohne Bibcode). Bahn Note 5. " + KOMMENTAR_ORB6),
        dict(id="polaris", name="Polaris (Alpha Ursae Minoris)", wds="02318+8916", disc="STF  93", komp="AB", orb=None,
             farben=[h(11767), (0.42, "arXiv:0708.0333", "Usenko und Klochkova 2007 nach Turner 2005")], mag_b=8.60,
             kommentar="B-V von A ist der Hipparcos-Wert des Systems (HIP 11767, Credit: ESA; Ab mit 0,2\" eingeschlossen). Polaris B mit V 8,60 und B-V 0,42 nach Usenko und Klochkova 2007 (arXiv:0708.0333, doi:10.1111/j.1745-3933.2008.00426.x), die B-V von Turner 2005 uebernehmen; WDS nennt 9,1, SIMBAD 8,2 (Lee 2008). Entscheidung Herbert 2026-10-29 (docs/recherche/README.md, Entscheidung 7). Trennung und Positionswinkel aus dem WDS, Abruf 2026-10-29."),
    ]


    def gesamt(mags):
        return round(-2.5 * math.log10(sum(10 ** (-0.4 * m) for m in mags)), 2)


    def zahl_de(x, stellen):
        return f"{x:.{stellen}f}".replace(".", ",")


    def nachweis(p, sterne):
        w, disc, komp = p["wds"], p["disc"], p["komp"]
        if p["orb"]:
            name = " ".join((disc + komp).split()) if komp else " ".join(disc.split())
            note, pa, rho = orb6[(w, name, p["orb"])]
            epoche = 2027.0
            quelle = f"ORB6 {p['orb']} (Note {note}), Ephemeride 2027,0; Magnituden WDS"
        else:
            e = wds[(w, disc, komp)]
            pa, rho, epoche = float(e["pa"]), e["sep"], float(e["letzte"])
            quelle = f"WDS, letzte Messung {e['letzte']} ({e['anzahl']} Messungen)"
        return dict(wds=w, komponenten=" ".join(disc.split()) + (" " + komp if komp else ""), sterne=sterne,
                    trennung_arcsec=rho, positionswinkel_grad=pa, epoche=epoche, quelle=quelle)


    objekte_neu = []
    for p in paare:
        e = wds[(p["wds"], p["disc"], p["komp"])]
        namen = p.get("namen", ["A", "B"])
        nw = nachweis(p, namen)
        rho = nw["trennung_arcsec"]
        halb = round(rho / 2, 4)
        mags = [e["m1"], p.get("mag_b", e["m2"])]
        sterne = []
        for i, (name, (bv, kat, qf)) in enumerate(zip(namen, p["farben"])):
            sterne.append(dict(name=name, dx_arcsec=-halb if i == 0 else halb, dy_arcsec=0, magnitude=mags[i],
                               b_v=bv, katalog=kat, quelle_farbe=qf))
        epo = int(nw["epoche"])
        zustand = dict(id=f"{p['id']}_{epo}",
                       name=f"{p['name'].split(' (')[0]} ({zahl_de(rho, 2 if rho < 1 else 1)}\", {zahl_de(mags[0], 2)} und {zahl_de(mags[1], 2)} mag)",
                       magnitude=gesamt(mags), katalog=[nw], sterne=sterne)
        if "hinweis" in p:
            zustand["hinweis_hilfe"] = p["hinweis"]
        zustand["kommentar"] = p["kommentar"] + " Lage nach A-Z9: Mitte im Ursprung, A bei -rho/2 (links, bei Norden oben Osten), B bei +rho/2 (rechts, Westen), dy = 0."
        objekte_neu.append(dict(id=p["id"], name=p["name"], typ="doppelstern", quelle_physik="docs/recherche/doppelsterne.md",
                                zustaende=[zustand]))

    # --- Epsilon Lyrae: Mehrfachstern in echter Lage, Norden oben ---------------------------------
    W = "18443+3940"
    n1, pa1, r1 = orb6[(W, "STF2382AB", "Doc2020e")]
    n2, pa2, r2 = orb6[(W, "STF2383CD", "Doc2020e")]
    weit = wds[(W, "STFA 37", "AB,CD")]
    e1 = wds[(W, "STF2382", "AB")]
    e2 = wds[(W, "STF2383", "CD")]


    def versatz(pa, rho):
        # dx positiv = rechts = Westen bei Norden oben, dy positiv = Norden; PA von Norden ueber Osten.
        return -rho * math.sin(math.radians(pa)), rho * math.cos(math.radians(pa))


    vx, vy = versatz(weit["pa"], weit["sep"])
    m1 = (-vx / 2, -vy / 2)  # Mitte eps1 (AB)
    m2 = (vx / 2, vy / 2)    # Mitte eps2 (CD), suedlich
    u1 = versatz(pa1, r1)
    u2 = versatz(pa2, r2)
    lage = {
        "eps1 A": (m1[0] - u1[0] / 2, m1[1] - u1[1] / 2),
        "eps1 B": (m1[0] + u1[0] / 2, m1[1] + u1[1] / 2),
        "eps2 C": (m2[0] - u2[0] / 2, m2[1] - u2[1] / 2),
        "eps2 D": (m2[0] + u2[0] / 2, m2[1] + u2[1] / 2),
    }
    farben = {"eps1 A": t(W, "A"), "eps1 B": t(W, "B"), "eps2 C": t(W, "C"), "eps2 D": t(W, "D")}
    mags = {"eps1 A": e1["m1"], "eps1 B": e1["m2"], "eps2 C": e2["m1"], "eps2 D": e2["m2"]}
    sterne = [dict(name=n, dx_arcsec=round(x, 3), dy_arcsec=round(y_, 3), magnitude=mags[n], b_v=farben[n][0],
                   katalog=farben[n][1], quelle_farbe="TDSC") for n, (x, y_) in lage.items()]
    eps = dict(id="eps_lyr", name="Epsilon Lyrae", typ="doppelstern", quelle_physik="docs/recherche/doppelsterne.md", zustaende=[dict(
        id="eps_lyr_2027",
        name="Epsilon Lyrae (209\", Paare 2,0\" und 2,4\")",
        magnitude=gesamt(mags.values()),
        katalog=[
            dict(wds=W, komponenten="STF2382 AB", sterne=["eps1 A", "eps1 B"], trennung_arcsec=r1, positionswinkel_grad=pa1, epoche=2027.0,
                 quelle=f"ORB6 Doc2020e (Note {n1}), Ephemeride 2027,0; Magnituden WDS"),
            dict(wds=W, komponenten="STF2383 CD", sterne=["eps2 C", "eps2 D"], trennung_arcsec=r2, positionswinkel_grad=pa2, epoche=2027.0,
                 quelle=f"ORB6 Doc2020e (Note {n2}), Ephemeride 2027,0; Magnituden WDS"),
            dict(wds=W, komponenten="STFA 37 AB,CD", sterne=[["eps1 A", "eps1 B"], ["eps2 C", "eps2 D"]], trennung_arcsec=weit["sep"],
                 positionswinkel_grad=float(weit["pa"]), epoche=float(weit["letzte"]),
                 quelle=f"WDS, letzte Messung {weit['letzte']} ({weit['anzahl']} Messungen); im Modell zwischen den Mittelpunkten der Paare (Naeherung, ADR-0003 Nachtrag V2)"),
        ],
        sterne=sterne,
        hinweis_hilfe="Epsilon Lyrae ist ein Mehrfachstern aus zwei Paaren in 209 Bogensekunden Abstand; er ist in seiner echten Lage mit Norden oben gezeigt, die Doppelsterne aus zwei Sternen dagegen fest in Ost-West-Richtung.",
        kommentar=("Mehrfachstern in echter Lage, Norden oben (Entscheidung Herbert 2026-10-29, docs/recherche/README.md Entscheidung 4): "
                   "dx positiv = rechts (Westen), dy positiv = Norden, Osten links; Ursprung in der Mitte zwischen den Mittelpunkten der Paare; "
                   "eps1 (AB) noerdlich, eps2 (CD) suedlich nach WDS STFA 37 (172 Grad, 209,4\"); eps1 nach ORB6 Doc2020e (die neuere der beiden Bahnen, doppelsterne.md 1.2), eps2 ebenso. "
                   "Lagen auf 0,001\" gerundet. " + KOMMENTAR_TDSC))])
    # eps_lyr in der Reihenfolge der Recherche (doppelsterne.md 2.2) hinter zeta_aqr einsetzen
    i = [o["id"] for o in objekte_neu].index("zeta_aqr") + 1
    objekte_neu.insert(i, eps)
    return objekte_neu


def elemente(text):
    """Die Objekte der Liste als (Text, Wert) in der Datei, ohne die Trennzeichen dazwischen."""
    dec = json.JSONDecoder()
    pos = text.index("[") + 1
    teile = []
    while True:
        while text[pos] in " \n\r\t,":
            pos += 1
        if text[pos] == "]":
            return teile
        wert, ende = dec.raw_decode(text, pos)
        teile.append((text[pos:ende], wert))
        pos = ende


def einruecken(obj):
    return "\n".join(("  " + z) if i else z for i, z in enumerate(json.dumps(obj, ensure_ascii=False, indent=2).split("\n")))


def neuer_text(alt, objekte_neu):
    teile = elemente(alt)
    neu = [einruecken(o) for o in objekte_neu]
    ergebnis = []
    eingesetzt = any(w.get("typ") == "doppelstern" for _, w in teile)
    for roh, wert in teile:
        if wert.get("typ") == "doppelstern":
            if neu:
                ergebnis.extend(neu)
                neu = []
            continue
        ergebnis.append(roh)
        if not eingesetzt and wert.get("id") == "saturn":
            ergebnis.extend(neu)
            neu = []
    if neu:
        sys.exit("kein Objekt saturn in objekte.json, Doppelsterne nicht eingesetzt")
    text = "[\n  " + ",\n  ".join(ergebnis) + "\n]\n"
    json.loads(text)
    return text


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--roh", default="data/roh/doppelsterne")
    ap.add_argument("--objekte", default="daten/objekte.json")
    ap.add_argument("--pruefen", action="store_true", help="nur vergleichen, nichts schreiben")
    a = ap.parse_args()
    objekte_neu = erzeuge(a.roh)
    alt = open(a.objekte, encoding="utf-8").read()
    text = neuer_text(alt, objekte_neu)
    for o in objekte_neu:
        z = o["zustaende"][0]
        print(o["id"], z["name"], z["magnitude"], [(s["name"], s["dx_arcsec"], s["dy_arcsec"]) for s in z["sterne"]])
    if a.pruefen:
        if text != alt:
            sys.exit("daten/objekte.json weicht von den Rohdaten ab")
        print("objekte.json stimmt mit den Rohdaten ueberein")
        return
    if text != alt:
        open(a.objekte, "w", encoding="utf-8").write(text)
        print("objekte.json geschrieben")
    else:
        print("objekte.json unveraendert")


if __name__ == "__main__":
    main()
