# Plan: Zerlegung in Arbeitspakete (Phase 4)

Ergebnis von Phase 4, erstellt am 2026-10-26. Einziger Input fuer Phase 5 (Umsetzung). Die Arbeitspakete liegen als Issues im Repo `herr-cbert/astobsim`; dieses Dokument ordnet sie Milestones zu, nennt die Abhaengigkeiten und die Reihenfolge. Die Issue-Texte selbst (Ziel, Kontext, Akzeptanzkriterien, Module, Abhaengigkeiten, Hinweise fuer den Agenten) stehen nur auf GitHub und folgen der Schablone in `docs/prozess.md`.

Grundlagen: `docs/anforderungen.md` (Kennungen A-...), `docs/architektur.md` (Module, Naht, Reihenfolge in Abschnitt 3), ADR-0001 bis 0003, `GLOSSARY.md`, Empfehlungen in `docs/recherche/`.

## 1. Labels und Milestones

Labels nach Modul: `physik`, `bild`, `daten`, `ui` (umfasst `zustand`), `infra`; dazu `kann` fuer Kann-Anforderungen.

| Milestone | Zielbild | Fertig, wenn |
|---|---|---|
| M1 Mond im 80 mm Refraktor sichtbar | Erster durchgehender Pfad (architektur.md Abschnitt 3): Mond, feste Startkonfiguration A-D9, JavaScript-Falter, ein Fenster, ohne Trabanten, online auf GitHub Pages | #1 bis #10 geschlossen, Seite zeigt den Mond, Bild entspricht dem Prototyp (Fall T3) |
| M2 Alle Objekte und volle Bedienung | Alle Muss-Anforderungen: vier Objekte mit Trabanten, Geraeteliste, Bedingungen, Gesichtsfeld mit Verschieben, Zoom, URL, WebGL2 | #11 bis #20 geschlossen, jede Muss-Kennung einem PR zuordenbar |
| M3 Version 1 | Validierung der Testfaelle (Phase 6), Sicherheit und Vereinfachung, Abschluss (Phase 7) | #21 bis #23 und #76 bis #79 geschlossen, A-Q3 erfuellt |
| Nach Version 1 | Kann-Anforderungen, angelegt, nicht umgesetzt (A-Q3) | nicht Teil von Version 1 |

## 2. Issues fuer Version 1

| Nr | Titel | Label | Milestone | Blockiert durch |
|---|---|---|---|---|
| #1 | Naht-Typen und Konfigurationstypen | physik | M1 | - |
| #2 | Physik Stufe 0: Einzelformeln mit Tests gegen physik.md Abschnitt 8 | physik | M1 | #1 |
| #3 | Physik Stufe 1: optik, atmosphaere, aufloesung, helligkeit, arbeitsmassstab, kernbeschreibung, begrenze | physik | M1 | #2 |
| #4 | Physik Stufe 2: baueKern mit FFT, Ueberabtastung und Testhelfern | physik | M1 | #2 |
| #5 | Physik Stufe 3: auswerten mit Anzeigewerten, Warnungen und Wiederverwendung | physik | M1 | #3, #4 |
| #6 | Bild: JavaScript-Falter und rendere mit synthetischen Tests | bild | M1 | #1 |
| #7 | Daten: Mondbild aufbereiten und Kachelpyramide erzeugen | daten | M1 | - |
| #8 | Daten-Modul: Laden, Validieren, Quelle mit Kachelpyramide | daten | M1 | #1, #7 |
| #9 | UI-Durchstich: Mond im 80 mm Refraktor auf dem Canvas | ui | M1 | #5, #6, #8 |
| #10 | Infra: CI und Deploy nach GitHub Pages | infra | M1 | - |
| #11 | Daten: Geraeteliste geraete.json mit Validierung | daten | M2 | #1 |
| #12 | Daten: Werkzeuge fuer Planetenbilder und Mars in drei Zustaenden | daten | M2 | #7 |
| #13 | Daten: Jupiter und Saturn mit Trabanten in objekte.json | daten | M2 | #12 |
| #14 | Trabanten: punktquellen in physik und Scheibchen malen in bild | physik, bild | M2 | #5, #6, #13 |
| #15 | Bild: WebGL2-Falter mit Gleichheitstest und Fallback | bild | M2 | #6 |
| #16 | Zustand: Konfiguration in URL und zurueck, Voreinstellung | ui | M2 | #3 |
| #17 | UI Geraet und Okular: Liste, freie Eingabe, Presets, Begrenzung | ui | M2 | #9, #11, #16 |
| #18 | UI Bedingungen, Objektwahl und Hilfetexte | ui | M2 | #9, #16 |
| #19 | UI Gesichtsfeld: Verschieben, Infopanel, Warnungen, Live-Rechnung | ui | M2 | #9, #15 |
| #20 | UI Zoomansicht mit Vergleichsbild | ui | M2 | #19 |
| #21 | Validierung: Testfaelle T1 bis T6 und Tabellen-Tests einfrieren | physik | M3 | #14, #17, #18, #19, #20 |
| #22 | Sicherheit und Vereinfachung vor Version 1 | infra | M3 | #21 |
| #23 | Abschluss Version 1: README, Lizenzen, Bildnachweise, Retrospektive | infra | M3 | #22 |

Zuordnung der Muss-Anforderungen: Geraete A-F1 bis A-F8 in #11, #16, #17 (Begrenzung in #3); Bedingungen A-B1 bis A-B4 in #3, #18; Modell A-P1 bis A-P7 in #2 bis #5, #14; Darstellung A-D1 bis A-D11 in #9, #16 bis #20; Daten A-X1 bis A-X6 in #7, #8, #12, #13; Technik A-T1 bis A-T5 in #10, #22, #23; Qualitaet A-Q1 in #2 bis #4, A-Q2 in #21, A-Q3 in #23.

## 3. Abhaengigkeiten und Reihenfolge

```
#1 Naht ──┬─> #2 Stufe 0 ──┬─> #3 Stufe 1 ──┬─> #5 auswerten ──┐
          │                └─> #4 Kern ─────┘                  │
          │                      #3 ──> #16 URL                │
          ├─> #6 Bild JS ──> #15 WebGL2                        ├─> #9 Durchstich ──> M1
          ├─> #8 Daten-Modul <── #7 Mondkacheln                │
          └─> #11 Geraeteliste          #10 CI/Deploy ─────────┘
#7 ──> #12 Mars + Werkzeuge ──> #13 Jupiter/Saturn ──> #14 Trabanten (braucht #5, #6)
#9, #11, #16 ──> #17 UI Geraet        #9, #16 ──> #18 UI Bedingungen
#9, #15 ──> #19 UI Gesichtsfeld ──> #20 Zoom
#14, #17, #18, #19, #20 ──> #21 Validierung ──> #22 Sicherheit ──> #23 Abschluss
```

**Stufe A, sequentiell (lernen):** #1, #2, #3 in dieser Reihenfolge, je ein Branch, ein PR, Review. Nach jedem Issue pruefen, was in `CLAUDE.md` (Build, Konventionen, Stolpersteine) oder ins Second Brain gehoert. Erst danach parallelisieren.

**Stufe B, parallel (Worktrees und Subagenten), Welle 1:** vier unabhaengige Straenge, die sich keine Dateien teilen:

- Physik: #4, danach #5.
- Bild: #6, danach #15.
- Daten: #7, danach #8; parallel dazu #11.
- Infra: #10.

**Welle 2:** #9 (Durchstich, schliesst M1) und parallel #16 (URL), #12 (Mars).

**Welle 3 (M2):** #13 und #14 (Daten, dann Trabanten); #17, #18 parallel (teilen `src/texte.ts` und ein Feld-Hilfsmodul: vorher abstimmen oder #17 zuerst); #19, danach #20.

Umgesetzt ab 2026-10-27: Vorbereitungs-PR `vorbereitung-welle-3` (Steuerung mit Rechenschleife, Feld- und Hilfemodul, Seitengeruest mit Platzhaltern fuer die Formulare, Abschnitte in `src/texte.ts`), darauf parallel #13, #17, #18, #19 und #55 (Leuchtdichte, neu aus #9). #14 folgt nach #13, #20 nach #19 (Welle 3b).

**Welle 4a (M2, Folge-Issues aus Welle 3b):** #71 (Quellweiss eichen) und #51 (Kachelstufen linear) parallel, danach #72 (Trabanten als eigene Punktebene, Ansatz 2026-10-27 im Plan-Modus mit Herbert geklaert; loest auch die Begrenzung von Mars am Anzeigeweiss). Umgesetzt 2026-10-27, PRs #73 bis #75.

**Welle 4 (M3):** #21, #22, #23 sequentiell; #21 braucht Herberts Urteil zu den Testfaellen. #21 am 2026-10-27 im Plan-Modus geklaert (Masszahl Profildelle statt MTF, Screenshots per Skript), Ergebnis `docs/validierung.md`, gemerged mit PR #80. Die Abweichungen #76 bis #79 (Cassini/Seeing, Mond-Zoom, Mars-Polkappe, Jupiter-Kontrast) gehoeren zu M3. Reihenfolge (Herbert, 2026-10-27): #22, #76, #79, danach #66 (Kachel-Cache), #77 und #78, zuletzt #23. #22 erledigt 2026-10-27 mit PRs #81 bis #86 (Sicherheit, #63, Vereinfachungen A bis D). #76 am 2026-10-27 im Plan-Modus entschieden: Erwartung T2 zu optimistisch fuer das Langzeitmittel, Modell bleibt, A-Q2 angepasst (physik.md 15); der zu dunkle Saturn-A-Ring im Quellbild geht in #79.

Merge-Konflikte in Stufe B zeigen, wo der Modulschnitt nicht sauber war; sie werden in der Retrospektive (#23) festgehalten.

## 4. Spielregeln je Issue (aus `docs/prozess.md`, Phase 5)

1. Branch `issue-<n>-<kurzname>` von `main`; bei Parallelarbeit ein Worktree je Issue.
2. Start im Plan-Modus mit "Setze Issue #n um"; der Agent liest das Issue, `CLAUDE.md`, `docs/architektur.md` und die im Issue genannten Abschnitte, nicht mehr.
3. Grenzen des Issues einhalten: "Nicht anfassen" gilt; Fehler in fremden Modulen werden Issues, keine stillen Korrekturen.
4. Vor jedem Commit `npm test` und `npm run build`. Commit-Messages auf Deutsch.
5. PR gegen `main` mit "Closes #n", Beschreibung nach Skill `pr`, Review mit Skill `code-review` (Achsen Standards und Spec), danach menschliches Review und Merge durch Herbert.
6. Nach dem Merge: Was gehoert in `CLAUDE.md` oder ins Second Brain? Kurz nachtragen.
7. Kein Bild ohne Lizenz und Nachweis (A-X3), keine Formel ohne Quelle in `docs/recherche/physik.md` (A-P1), keine neue Abhaengigkeit ohne Ruecksprache (ADR-0001).

## 5. Nicht Teil von Version 1

Die 14 Kann-Anforderungen (A-Z8, A-Z9, A-Z10, A-F9, A-B5, A-B6, A-P8, A-D12 bis A-D16, A-X7, A-X8) und das eigene Mond-Rendering aus LROC WAC und LOLA (ADR-0002) sind als Issues #24 bis #38 im Milestone "Nach Version 1" mit Label `kann` angelegt. Sie enthalten Ziel, Kontext und betroffene Module; Akzeptanzkriterien folgen, wenn sie eingeplant werden. Nicht-Ziele aus den Anforderungen bekommen kein Issue.

## 6. Offene Punkte, die Phase 5 mitnimmt

- Bildformat WebP gegen JPEG: Entscheidung in #7, Nachtrag in ADR-0003.
- Kerngroesse 81 px bei grosser Anzeige mit blossem Auge: Test in #4 (architektur.md Abschnitt 4).
- Worker fuer die JavaScript-Faltung: Version 1 ohne Worker (architektur.md Abschnitt 4); wird nur noetig, wenn #19 die 0,5 s im Fallback verfehlt.
- Kontrastschwelle "erkennbar": in #21 am Bild festgelegt (0,125, Delle eines gefalteten Stufenprofils) und in `src/physik/validierung.test.ts` eingefroren, siehe `docs/validierung.md`.
- Hubble-Lizenzlesart: beide Angaben im Bildnachweis (#12), siehe `docs/recherche/bilder.md` 6.3.

---

# Version 2: Zerlegung in Arbeitspakete (Phase 4 Version 2)

Ergebnis von Phase 4 Version 2, erstellt am 2026-10-29. Einziger Input fuer Phase 5 (Umsetzung) von Version 2. Die Issue-Texte stehen nur auf GitHub (Schablone `docs/prozess.md`), dieses Dokument nennt Abhaengigkeiten, Wellen und Zuordnung.

Grundlagen: `docs/anforderungen.md` (Stufe Muss V2), `docs/architektur.md` Abschnitt 5 (Naht V2, verbindlich; Reihenfolge in 5.7), ADR-0003 Nachtrag V2, ADR-0004, `docs/recherche/README.md` Abschnitt "Recherche Version 2" mit den Testfaellen T7 bis T12.

Entscheidungen Herbert (2026-10-29): T7 bis T12 und A-Q4 bestaetigt (T11 und die Tabellen in `docs/recherche/wahrnehmung.md` in dieser Phase auf F = 1,4 umgerechnet); ein Milestone "Version 2" ohne Zwischenziele; #93, #25 und #26 bleiben als **Sammel-Issues** mit GitHub-Sub-Issues und schliessen, wenn alle Teile fertig sind; #36 bleibt ein normales Arbeitspaket; die vier neuen Physik-Dateien als vier parallele Issues.

## 7. Issues fuer Version 2

Labels wie in Version 1. Alle im Milestone "Version 2".

| Nr | Titel | Label | Sammel | Blockiert durch |
|---|---|---|---|---|
| #95 | Vorbereitung Naht Version 2: Typen und Konstanten ohne Verhaltensaenderung | physik | #93 | - |
| #96 | Physik: Wahrnehmungsschwelle und Grenzgroesse (schwelle.ts) | physik | #26 | #95 |
| #97 | Physik: Mischgewicht unaufgeloest und Sockel (mischung.ts) | physik | #93 | #95 |
| #98 | Physik: Sternfarbe aus B-V (sternfarbe.ts) | physik | #25 | #95 |
| #99 | Physik: Freies Paar und Ueberstrahlungshinweis (doppelstern.ts) | physik | #25 | #95 |
| #100 | Physik: auswerten Version 2 mit Schwelle, Sternen, Mischgewicht und neuen Konstanten | physik | #93 | #96 bis #99 |
| #101 | Bild: Tonwert Version 2 mit Deep-Sky-Ebene, Mischgewicht und Sternfaerbung | bild | #93 | #95 |
| #102 | Daten: Objektklassen, Sterne, Flaechentabelle, log-Kennlinie und QuelleLeer | daten | #26 | #95 |
| #36 | Mondphasen: Sichel, Vollmond, letztes Viertel | daten | - | #100 |
| #103 | Daten: Doppelsternkatalog und Nachweis der Sterndaten | daten | #25 | #102 |
| #104 | Daten: Plejaden (M45) als Sternliste aus Gaia DR3 | daten | #26 | #102 |
| #105 | Tools: Deep-Sky-Aufbereitung mit Flaechentabelle, erstes Objekt M57 | daten | #26 | #102 |
| #106 | Daten: Andromedagalaxie (M31) mit Tonkurve gegen das Profil | daten | #26 | #105 |
| #107 | Daten: Orionnebel (M42) mit Trapez | daten | #26 | #105 |
| #108 | Daten: Kugelsternhaufen M13 aus Bild und Katalogsternen | daten | #26 | #105 |
| #109 | UI-Durchstich Objektklassen: gruppierte Auswahl, freies Paar, URL | ui | #25 | #100, #101, #102, #103 |
| #110 | UI: Infopanel, Hilfetexte und Vergleichsbild fuer Version 2 | ui | #26 | #109 |
| #111 | Helligkeit: Konstanten nachmessen und T12 | physik | #93 | #100, #101, #109 |
| #112 | Validierung Version 2: Testfaelle T7 bis T12 | physik | - | #111, #110, #104, #106 bis #108, #36 |
| #113 | Sicherheit und Vereinfachung vor Version 2 | infra | - | #112 |
| #114 | Abschluss Version 2: README, Lizenzen, Retrospektive, Tag v2.0 | infra | - | #113 |

Zuordnung der Muss-V2-Anforderungen: A-Z9 Doppelsterne in #99, #100, #103, #109; A-Z10 Deep-Sky in #96, #100, #101, #102, #104 bis #108; A-P4 V2 und A-P13 in #100, #111; A-P10 in #97, #100, #101, #110; A-P11 in #96, #100, #110; A-P12 in #98, #100, #101; A-B2 V2 in #96, #110; A-D18 in #109; A-X7 in #36; A-X9 V2 in #102 bis #104, #108; A-X11 in #102, #106, #107, #110; A-Q5 in #112 (Testfaelle bestaetigt in Phase 4); A-Q4 in #114.

## 8. Abhaengigkeiten und Reihenfolge Version 2

```
#95 Naht V2 ──┬─> #96 schwelle ──┐
              ├─> #97 mischung ──┤
              ├─> #98 sternfarbe ┼─> #100 auswerten V2 ──┬─> #36 Mondphasen
              ├─> #99 doppelstern┘                       │
              ├─> #101 bild tonwert ─────────────────────┤
              └─> #102 daten ──┬─> #103 Doppelsterne ────┴─> #109 UI-Durchstich ──> #110 Infopanel
                               ├─> #104 M45                        │
                               └─> #105 Tools + M57 ──> #106 M31, #107 M42, #108 M13
#100, #101, #109 ──> #111 Konstanten, T12
#111, #110, #104, #106 bis #108, #36 ──> #112 Validierung ──> #113 Sicherheit ──> #114 Abschluss, v2.0
```

**Welle 0, sequentiell:** #95 allein (wie PR #46 in Version 1). Danach liegen alle gemeinsamen Typen und Konstanten an ihrem Platz; die Validierungsbilder sind byte-gleich.

**Welle 1, parallel (vier Worktrees):** #96, #97, #98, #99. Jede legt eine neue Datei in `src/physik/` an; gemeinsam beruehrt werden nur `src/physik/index.ts` (Exportzeilen) und `docs/recherche/physik.md` (Quellen), Konflikte dort sind trivial. #99 aendert zusaetzlich `begrenze.ts`.

**Welle 2, parallel (drei Worktrees):** #100 (physik), #101 (bild), #102 (daten). #101 und #102 koennen schon mit Welle 1 starten, da sie nur von #95 abhaengen; #101 testet mit synthetischen `Simulationsparameter`.

**Welle 3, parallel (Daten je Objekt):** #103, #104, #105 und #36 zuerst (#103 und #104 teilen den Abschnitt "Sterndaten": #103 legt ihn an, #104 ergaenzt); danach #106, #107, #108 parallel. Die Daten-Issues brauchen Herberts Freigabe der Lizenzen und Rohdaten in `data/roh/` (Symlinks in Worktrees, Lehre aus Version 1).

**Welle 4, UI:** #109 (Durchstich, sobald #100 bis #103 gemerged sind; ab hier ist ein Doppelstern auf der Seite), danach #110. Welle 3 und 4 laufen ueberlappend.

**Welle 5, sequentiell:** #111 (Herbert legt die Konstanten am Bild fest), #112, #113, #114.

Lehren aus Version 1, die jede Welle einhaelt (`docs/retrospektive.md` 7): Integrationsprobe aller PRs einer Welle in einem Wegwerf-Worktree vor dem Merge; Screenshots je Welle ansehen, nicht erst in der Validierung; Agenten kennzeichnen Geprueftes, Gerechnetes und Vermutetes; Lizenzangaben selbst gegenlesen; die Freigabe zum Merge steht ausdruecklich in der Anweisung.

Spielregeln je Issue wie Abschnitt 4. Bei Sammel-Issues verweist der PR mit "Closes #n" auf das Sub-Issue.

## 9. Offene Punkte, die Phase 5 Version 2 mitnimmt

- Vergleichsbild der Zoomansicht bei Deep-Sky (architektur.md 5.7): Vorschlag und Entscheidung in #110.
- M13 Bild maskieren oder Sterne plus Restlicht (5.7): Entscheidung in #108.
- Deckkraft am gefalteten q als Naeherung (5.7): Pruefung bei M57 am 80 mm in #112 (T10), erster Blick schon in #105.
- Mischfarbe ueberlappender Sterne (Antares B im Halo von A, 5.7): Pruefung in #112 (T9).
- Konstanten Anzeigeweiss 9,2 und Punktweiss 6,4 sind Startwerte; Festlegung am Bild in #111.
- Magnitude je Mondphase mit Quelle (Krisciunas und Schaefer) fehlt noch in `docs/recherche/objekte.md`: in #36.
- M31-Profil innen moeglicherweise zu schwach (ADR-0004 Befund 2): T11 erwartet mit F = 1,4 bei Bortle 5 nur einen Hauch; Pruefung in #106 und #112.
