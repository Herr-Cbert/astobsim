// Abgleich daten/bilder.json gegen die Dateien unter daten/bilder/ (A-X3, A-X4, A-X6), Nachbau von
// tools/bildnachweis_pruefen.py fuer die CI ohne Python: jeder Nachweis hat seine Dateien mit den
// eingetragenen Massen und Bytes, jede Datei gehoert zu einem Nachweis, je Objekt hoechstens 20 MB.
// Die Dateien kommen ueber import.meta.glob mit ?inline als data:-URL (kein node:fs, ADR-0001),
// die Masse aus dem WebP-Kopf (webpkopf.ts).

import { describe, expect, it } from "vitest";
import bilderJson from "../../daten/bilder.json";
import { GRENZE_BYTES_JE_OBJEKT, pruefeBildnachweise } from "./bildnachweise";
import { DatenFehler } from "./fehler";
import { kachelPfad } from "./kacheln";
import { bytesAusDataUrl, webpMasse } from "./webpkopf";

const PRAEFIX = "../../daten/bilder/";
const roh = import.meta.glob("../../daten/bilder/**/*", { query: "?inline", import: "default", eager: true }) as Record<string, string>;
/** Pfad relativ zu daten/bilder/ -> Bytes. */
const dateien = new Map(Object.entries(roh).map(([pfad, url]) => [pfad.slice(PRAEFIX.length), bytesAusDataUrl(url)]));
const nachweise = pruefeBildnachweise(bilderJson);

describe("daten/bilder.json gegen daten/bilder/", () => {
  it("findet Dateien (Glob greift)", () => {
    expect(dateien.size).toBeGreaterThan(0);
  });

  it("jedes Einzelbild hat seine Datei mit den eingetragenen Massen und Bytes", () => {
    for (const n of nachweise.filter((e) => e.kacheln === undefined)) {
      const bytes = dateien.get(n.datei);
      expect(bytes, `${n.id}: Datei ${n.datei} fehlt`).toBeDefined();
      const masse = webpMasse(bytes!, n.datei);
      expect([masse.breite, masse.hoehe], `${n.id}: Masse`).toEqual([n.pixelBreite, n.pixelHoehe]);
      expect(bytes!.length, `${n.id}: datei_bytes`).toBe(n.dateiBytes);
    }
  });

  it("jede Kachelpyramide hat alle Kacheln mit passenden Massen, gesamt_bytes stimmt", () => {
    for (const n of nachweise.filter((e) => e.kacheln !== undefined)) {
      const { kachelPx: k, stufen, gesamtBytes } = n.kacheln!;
      let summe = 0;
      stufen.forEach((s, stufe) => {
        for (let y = 0; y < s.kachelnY; y++) {
          for (let x = 0; x < s.kachelnX; x++) {
            const pfad = kachelPfad(n, { stufe, x, y });
            const bytes = dateien.get(pfad);
            expect(bytes, `${n.id}: Kachel ${pfad} fehlt`).toBeDefined();
            const masse = webpMasse(bytes!, pfad);
            expect([masse.breite, masse.hoehe], pfad).toEqual([Math.min(k, s.breitePx - x * k), Math.min(k, s.hoehePx - y * k)]);
            summe += bytes!.length;
          }
        }
      });
      expect(summe, `${n.id}: kacheln.gesamt_bytes`).toBe(gesamtBytes);
    }
  });

  it("jede Datei gehoert zu einem Nachweis (kein Bild ohne Eintrag, A-X3)", () => {
    const erwartet = new Set<string>();
    for (const n of nachweise) {
      if (n.kacheln === undefined) {
        erwartet.add(n.datei);
        continue;
      }
      n.kacheln.stufen.forEach((s, stufe) => {
        for (let y = 0; y < s.kachelnY; y++) for (let x = 0; x < s.kachelnX; x++) erwartet.add(kachelPfad(n, { stufe, x, y }));
      });
    }
    const ohneEintrag = [...dateien.keys()].filter((p) => !erwartet.has(p));
    expect(ohneEintrag).toEqual([]);
  });

  it("je Objekt hoechstens 20 MB in den Dateien (A-X6)", () => {
    const jeObjekt = new Map<string, number>();
    for (const n of nachweise) {
      const pfade = [...dateien.keys()].filter((p) => (n.kacheln === undefined ? p === n.datei : p.startsWith(n.datei)));
      const summe = pfade.reduce((s, p) => s + dateien.get(p)!.length, 0);
      jeObjekt.set(n.objekt, (jeObjekt.get(n.objekt) ?? 0) + summe);
    }
    for (const [objekt, summe] of jeObjekt) expect(summe, objekt).toBeLessThanOrEqual(GRENZE_BYTES_JE_OBJEKT);
    // Mars: zwei Bilder, zusammen weit unter der Grenze.
    expect(jeObjekt.get("mars")).toBeLessThan(1_000_000);
  });
});

describe("webpMasse", () => {
  /** RIFF-Kopf mit erstem Chunk art und den Chunkdaten daten. */
  function webp(art: string, daten: number[]): Uint8Array {
    const kopf = [..."RIFF"].map((c) => c.charCodeAt(0));
    const b = new Uint8Array(20 + Math.max(daten.length, 10));
    b.set(kopf, 0);
    b.set([..."WEBP"].map((c) => c.charCodeAt(0)), 8);
    b.set([...art].map((c) => c.charCodeAt(0)), 12);
    b.set(daten, 20);
    return b;
  }

  it("liest verlustbehaftete, verlustfreie und erweiterte Koepfe", () => {
    // VP8: Rahmenkopf 3 Byte, Startcode, Breite 960 und Hoehe 768 (Skalierungsbits gesetzt, werden ignoriert).
    expect(webpMasse(webp("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, 960 & 0xff, (960 >> 8) | 0x40, 768 & 0xff, 768 >> 8]))).toEqual({
      art: "VP8 ",
      breite: 960,
      hoehe: 768
    });
    // VP8L: 14 Bit Breite - 1 = 2, 14 Bit Hoehe - 1 = 4.
    const bits = 2 | (4 << 14);
    expect(webpMasse(webp("VP8L", [0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, 0]))).toMatchObject({ breite: 3, hoehe: 5 });
    // VP8X: 24 Bit Leinwand - 1 ab Byte 4.
    expect(webpMasse(webp("VP8X", [0, 0, 0, 0, 0xff, 0x0b, 0, 0x01, 0, 0]))).toMatchObject({ breite: 3072, hoehe: 2 });
  });

  it("weist andere Formate ab", () => {
    expect(() => webpMasse(new Uint8Array(40))).toThrow(DatenFehler);
    expect(() => webpMasse(webp("ALPH", []))).toThrow(DatenFehler);
    expect(() => bytesAusDataUrl("data:image/webp,abc")).toThrow(DatenFehler);
  });
});
