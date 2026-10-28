# Retrospektive Version 1 (Phase 7)

Ergebnis von Issue #23. Entwurf von Claude am 2026-10-28 aus dem Git-Log, den PR-Texten und den Arbeitsnotizen im Second Brain (Aufwand der Subagenten); der Abschnitt 6 ist fuer Herberts Sicht.

## 1. Ergebnis in Zahlen

- Laufzeit: 2026-10-23 bis 2026-10-28, vier Arbeitstage (23., 26., 27., 28. Oktober).
- 132 Commits auf `main`, Pull Requests #39 bis #91, 38 Issues aus Phase 4 plus 12 Folge-Issues (#51, #55, #63 bis #66, #71, #72, #76 bis #79).
- Code: rund 7600 Zeilen TypeScript in `src/` ohne Tests, 5600 Zeilen Tests in 49 Dateien (550 Vitest-Faelle), 2000 Zeilen Python- und Node-Werkzeuge, 3600 Zeilen Dokumentation in `docs/`.
- Erstladen 0,11 MB (Grenze 5 MB), Mondkacheln 1,77 MB, Planetenbilder je unter 0,2 MB.
- Alle 50 Muss-Anforderungen nachgewiesen (`docs/validierung.md` Abschnitt 8), die Testfaelle T1 bis T6 erfuellt, die Kann-Punkte als Issues #24 bis #38.

## 2. Ablauf der Phasen

| Phase | Zeitraum | Ergebnis | Arbeitsweise |
|---|---|---|---|
| 1 Anforderungen | 23.10., 11:22 bis 11:58 | `docs/anforderungen.md` | Dialog mit Herbert im Plan-Modus |
| 2 Recherche | 23.10., bis 12:38 | `docs/recherche/` (Physik, Geraete, Objekte, Bilder) | vier Recherche-Agenten parallel, je 13 bis 24 min, rund 200k Tokens, 390 bis 500 Zeilen; Herbert entscheidet die offenen Fragen |
| 3 Architektur | 23.10., bis 13:11, Prototyp danach | ADR-0001 bis 0003, `docs/architektur.md`, Branch `prototyp-faltung` | drei Design-it-twice-Agenten fuer die Naht Physik zu Bild (je 4 bis 5 min, 90k), Hybrid daraus; Wegwerf-Prototyp (eine HTML-Datei, headless Chrome) in etwa einer Stunde |
| 4 Zerlegung | 26.10., bis 07:53 | 38 Issues, Milestones, `docs/plan.md` | ohne Subagenten, Issues per `gh issue create` aus Skripten |
| 5 Umsetzung | 26.10. 08:06 bis 27.10. 13:13 | M1 (26.10. abends), M2 (27.10. mittags) | Stufe A sequentiell, danach Wellen mit 3 bis 5 Agenten in Worktrees, Vorbereitungs-PRs, Review je PR, Integrationsprobe, Merge durch Herbert |
| 6 Validierung | 27.10., bis 15:26 | `docs/validierung.md`, Tabellen-Tests | Screenshots per Skript, Urteile am Bild, Kontrastschwelle eingefroren, vier Abweichungen als Issues |
| M3 | 27.10. 15:30 bis 28.10. | #22 (Sicherheit, Vereinfachung), #63, #66, #76 bis #79 | ein Hauptagent, Recherche und Bestandsaufnahme als Subagenten |
| 7 Abschluss | 28.10. | `LICENSE`, Bildnachweise im Seitenfuss, README, diese Datei | Plan-Modus, ein Hauptagent |

## 3. Aufwand

Aus den Arbeitsnotizen (Second Brain, `memory/recherche-agenten-erfahrung.md`); Minuten sind Laufzeit des Agenten, Tokens seine Gesamtmenge.

| Abschnitt | Agenten | Umsetzung je Agent | Review je PR |
|---|---|---|---|
| Phase 2 Recherche | 4 | 13 bis 24 min, rund 200k | Stichproben vom Hauptagenten, kein Fehler |
| Phase 3 Naht-Entwuerfe | 3 | 4 bis 5 min, rund 90k | - |
| Stufe A (#1 bis #3) | sequentiell | etwa 1 h je Issue inkl. Plan | 2 Agenten (Standards, Spec), je rund 100k, 2 min |
| Welle 1 (#4, #6, #7, #10) | 4 | 6 bis 19 min, 68 bis 183k | 2 Agenten, 1,5 bis 4 min, 55 bis 110k |
| Folge-Issues (#5, #8, #11, #15) | 4 | 3 bis 11 min, 85 bis 150k | 1 Agent, 2,5 bis 4,5 min, rund 105k |
| Welle 2 (#9, #12, #16) | 3 | 4,5 bis 19 min, 108 bis 274k | 1 Agent, 2,5 bis 4,5 min, 90 bis 155k |
| Welle 3 (#13, #17, #18, #19, #55) | 5 | 7 bis 15 min, 130 bis 211k | 1 Agent, 5 bis 9 min, 110 bis 160k |
| Welle 3b (#14, #20, #64, #65) | 3 | 7 bis 11 min, 137 bis 199k | 1 Agent, 4,5 bis 8 min, 123 bis 181k |
| M3, Recherche Mars-Bild (#78) | 1 | 6 min, 122k | - |
| Phase 7, Bestandsaufnahme Anforderungen | 1 | 2 min, 75k | - |

Nacharbeiten nach den Reviews kosteten je PR 1,5 bis 5 min und 10 bis 45k Tokens. Faustwert fuer einen gruendlichen Agenten: etwa 10 bis 20 Minuten und 150 bis 200k Tokens; ein Review mit eigenem Nachrechnen etwa 5 Minuten und 120k.

## 4. Was gut lief

- **Phasenplan mit Ergebnisdatei je Phase.** Jede Phase endete mit einem Dokument im Repo; spaetere Agenten bekamen damit denselben Stand ohne Vorgeschichte. Die Anforderungs-IDs (A-...) zogen sich bis in die Kommentare und machten den Nachweis in Phase 7 zu einer Tabellenarbeit.
- **Recherche vor dem Code, mit Quellenpflicht.** Formeln und Testwerte standen in `docs/recherche/physik.md`, bevor eine Zeile Physik geschrieben war; kein Review fand einen Rechenfehler in den Formeln.
- **Prototyp zum Wegwerfen.** Die Modellfrage (Faltung im Ortsraum, Arbeitsmassstab) war nach einer Stunde beantwortet und hat den Architekturentscheid abgesichert.
- **Vorbereitungs-PRs vor parallelen Wellen.** Gemeinsame Typen und Helfer zuerst (PRs #46, #52, #57), danach liefen drei bis fuenf Agenten in Worktrees ohne nennenswerte Merge-Konflikte.
- **Reviews mit eigenem Nachrechnen.** Die wertvollsten Funde kamen aus Proben der Reviewer, nicht aus dem Lesen: Verhungern beim Dauerziehen (Modell input vor rAF), Quellweiss als Scheibenmittel statt Pixelwert 1,0, schiefe Jupiter-Baender (Profil-Korrelation), eine Behauptung im Kommentar (Umlaute statt Escapes, per `od` geprueft).
- **Validierung am Bild mit eingefrorenen Zahlen.** Screenshots per Skript und Tabellen-Tests (Delle gegen Schwelle) machten Abweichungen sichtbar und reproduzierbar; vier Abweichungen wurden Issues statt stiller Korrekturen.
- **Entscheidungen beim Menschen.** Fragen mit Optionen und Empfehlung (AskUserQuestion) hielten Herbert bei den fachlichen Weichen (Mond als Rendering, Maske auf der Fenstermitte, Detail im Zoom) mit kurzer Antwortzeit im Spiel.

## 5. Was schlecht lief oder Nacharbeit kostete

- **Inhaltliche Konflikte ohne Merge-Konflikt.** In Welle 2 doppelte ein synthetischer Testkatalog Mars aus einem anderen PR; erst die Integrationsprobe zeigte es. Lehre: Integrationsprobe aller PRs einer Welle vor dem Merge.
- **Fehler, die alle Reviews uebersahen.** Zwei fehlende CSS-Klammern auf `main` liessen die Regeln aus #17 bis #19 wirkungslos; gefunden hat sie ein Umsetzungsagent nebenbei. Tests decken CSS nicht ab, nur der Blick aufs Bild.
- **Gruene Tests, falsches Bild.** Der Mond war nach dem Durchstich zu dunkel, Trabanten kaum sichtbar, Jupiter zu kontrastreich; alles erst am Bild aufgefallen (#55, #72, #79). Screenshots frueher in jede Welle nehmen.
- **Behauptungen von Agenten.** Berichte von Subagenten kommen im selben sicheren Ton, ob geprueft oder vermutet. Beispiel aus #78: das Zitat "map-projected onto a sphere" gehoerte zu einer anderen Seite. Lehre: im Brief verlangen, Geprueftes und Vermutetes zu kennzeichnen, und Kernaussagen selbst nachlesen.
- **Werkzeugfallen.** `gh issue view` und `gh pr edit` brechen am Projects-classic-Feld ab (Ausweg `--json` oder REST); `diff.external` auf `sam` startet vimdiff (`--no-ext-diff`); `npm test | grep` verdeckt den Exit-Code, ein Commit lief einmal mit rotem Test; headless Chrome mit `--virtual-time-budget` laesst `createImageBitmap` haengen.
- **Sitzungslimit.** Ein Agent wurde mitten in den Nacharbeiten gestoppt (429) und nach dem Reset per SendMessage fortgesetzt; der Worktree war sauber, die Nacharbeit begann von vorn.
- **Merge im Auto-Modus.** Die Berechtigungspruefung hat den Merge von PR #90 nach `main` als "Merge ohne Review" verweigert, PR #89 kurz davor nicht. Das ist als Schutz richtig, macht den Ablauf aber unvorhersehbar und verzoegert Folge-PRs, deren Konflikte erst nach dem ersten Merge loesbar sind; die Freigabe zum Merge gehoert ausdruecklich in die Anweisung.
- **Firefox nicht automatisiert.** A-T3 nennt Firefox; die Testskripte steuern nur Chrome ueber das DevTools-Protokoll, Firefox headless macht nur einen Screenshot beim Laden.

## 6. Sicht Herbert

_Platz fuer Herberts Rueckblick: was beim Lernen mit Claude Code wichtig war, was ueberrascht hat, was beim naechsten Projekt anders laufen soll._

## 7. Empfehlungen fuer das naechste Projekt

1. Den Phasenplan beibehalten, mit Ergebnisdatei je Phase und Anforderungs-IDs bis in Kommentare und Tests.
2. Vor jeder Welle paralleler Agenten einen Vorbereitungs-PR fuer gemeinsame Typen; Worktrees mit Symlinks fuer gitignorierte Rohdaten.
3. Reviews mit dem Auftrag, selbst nachzurechnen und zu messen; ein Agent fuer Standards und Spec zusammen reicht.
4. Integrationsprobe aller PRs einer Welle in einem Wegwerf-Worktree vor dem Merge.
5. Ab dem ersten Durchstich bei jeder Welle Screenshots ansehen, nicht erst in der Validierung; ein Skript dafuer frueh bauen.
6. Briefe an Subagenten verlangen die Kennzeichnung "geprueft / gerechnet / vermutet"; Lizenz- und Quellenangaben immer selbst gegenlesen.
7. Werkzeugfallen sofort in `CLAUDE.md` oder das Second Brain schreiben, nicht erst am Ende.
8. Browserziele, die nicht automatisch getestet werden, als expliziten Pruefpunkt fuer den Menschen in den Plan nehmen.
