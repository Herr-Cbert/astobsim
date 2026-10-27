# Plan: Zerlegung in Arbeitspakete (Phase 4)

Ergebnis von Phase 4, erstellt am 2026-10-26. Einziger Input fuer Phase 5 (Umsetzung). Die Arbeitspakete liegen als Issues im Repo `herr-cbert/astobsim`; dieses Dokument ordnet sie Milestones zu, nennt die Abhaengigkeiten und die Reihenfolge. Die Issue-Texte selbst (Ziel, Kontext, Akzeptanzkriterien, Module, Abhaengigkeiten, Hinweise fuer den Agenten) stehen nur auf GitHub und folgen der Schablone in `docs/prozess.md`.

Grundlagen: `docs/anforderungen.md` (Kennungen A-...), `docs/architektur.md` (Module, Naht, Reihenfolge in Abschnitt 3), ADR-0001 bis 0003, `GLOSSARY.md`, Empfehlungen in `docs/recherche/`.

## 1. Labels und Milestones

Labels nach Modul: `physik`, `bild`, `daten`, `ui` (umfasst `zustand`), `infra`; dazu `kann` fuer Kann-Anforderungen.

| Milestone | Zielbild | Fertig, wenn |
|---|---|---|
| M1 Mond im 80 mm Refraktor sichtbar | Erster durchgehender Pfad (architektur.md Abschnitt 3): Mond, feste Startkonfiguration A-D9, JavaScript-Falter, ein Fenster, ohne Trabanten, online auf GitHub Pages | #1 bis #10 geschlossen, Seite zeigt den Mond, Bild entspricht dem Prototyp (Fall T3) |
| M2 Alle Objekte und volle Bedienung | Alle Muss-Anforderungen: vier Objekte mit Trabanten, Geraeteliste, Bedingungen, Gesichtsfeld mit Verschieben, Zoom, URL, WebGL2 | #11 bis #20 geschlossen, jede Muss-Kennung einem PR zuordenbar |
| M3 Version 1 | Validierung der Testfaelle (Phase 6), Sicherheit und Vereinfachung, Abschluss (Phase 7) | #21 bis #23 geschlossen, A-Q3 erfuellt |
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

**Welle 4 (M3):** #21, #22, #23 sequentiell; #21 braucht Herberts Urteil zu den Testfaellen. #21 am 2026-10-27 im Plan-Modus geklaert (Masszahl Profildelle statt MTF, Screenshots per Skript), Ergebnis `docs/validierung.md`.

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
