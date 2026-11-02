# Retrospektive (Phase 7)

Abschnitte 1 bis 7: Version 1. Ab Abschnitt 8: Version 2.

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

## 8. Version 2: Ergebnis in Zahlen

Ergebnis von Issue #114. Entwurf von Claude am 2026-11-02 aus dem Git-Log seit dem Abschluss von Version 1 (0a5b71d), den PRs #115 bis #157 und den Arbeitsnotizen zu den Wellen; der Abschnitt 13 ist fuer Herberts Sicht. Kennzeichnung wie in `docs/validierung.md` 15: [G] geprueft, [R] gerechnet, [V] vermutet.

- Laufzeit: 2026-10-29 bis 2026-11-02, drei Arbeitstage (29. und 30. Oktober, 2. November) [G].
- 158 Commits seit 0a5b71d, davon 41 auf der ersten Elternlinie von `main`; 31 gemergte Pull Requests #115 bis #157 [G].
- 20 Issues aus Phase 4 (#95 bis #114) plus #36, dazu 7 Folge-Issues im Milestone "Version 2" (#133, #135, #136, #139, #141, #145, #146) und 6 neue Issues im Milestone "Spaeter" (#94, #143, #147, #148, #151, #153) [G].
- Code [G, Zeilen per `wc -l`]: `src/` ohne Tests 11 600 Zeilen (Version 1: 7 800), Tests 10 700 Zeilen in 66 Dateien (5 800), 1006 Vitest-Faelle (550); Python- und Node-Werkzeuge 7 500 Zeilen (2 000); Dokumentation in `docs/` 7 100 Zeilen (3 700).
- Daten: 7 neue Bilder (insgesamt 13), drei Sternlisten (M45 44, M42 9, M13 531 Sterne), 14 Doppelsterne. Erstladen 0,44 MB, mit dem Startobjekt hoechstens 1,7 MB, groesstes Objekt Vollmond 1,9 MB (`docs/validierung.md` 15.4) [G].
- Alle Muss-V2-Anforderungen nachgewiesen, T1 bis T12 bestanden bis auf T11d (#147, Spaeter); offen sind Firefox (A-T3), die Entscheidung zu T11d und der Tag `v2.0` (`docs/validierung.md` 16) [G].

## 9. Version 2: Ablauf der Phasen

Zeiten sind die Commit-Zeiten auf `main` (MEZ), also das Ende des Abschnitts [G].

| Phase | Zeitraum | Ergebnis | Arbeitsweise |
|---|---|---|---|
| 1 Anforderungen | 29.10., bis 07:41 | Stufe Muss V2 in `docs/anforderungen.md` | Interview mit Herbert |
| 2 Recherche | 29.10., bis 09:11 | `docs/recherche/` Version 2 (Wahrnehmung, Doppelsterne, Deep-Sky, Bilder, Helligkeit), Testfaelle T7 bis T12 | vier Recherche-Agenten parallel; Messung der Anzeigehelligkeit in der Hauptsession |
| 3 Architektur | 29.10., bis 09:52 | Naht Version 2 (`architektur.md` 5), ADR-0004, Nachtrag ADR-0003, Branch `prototyp-deep-sky` | zwei Design-it-twice-Agenten, Hybrid; Python-Prototyp in der Hauptsession |
| 4 Zerlegung | 29.10., bis 10:18 | 20 Issues, `docs/plan.md` 7 bis 9 | ohne Subagenten |
| 5 Welle 0 | 29.10., bis 11:18 | #95 Naht ohne Verhaltensaenderung | sequentiell vor allen Wellen |
| 5 Welle 1 | 29.10., bis 12:02 | #96 bis #99, #101, #102 (Physik, Bild, Datenformat) | sechs Agenten in Worktrees, Integrationsprobe, Zusammenfuehrungs-Commit |
| 5 Welle 2 | 29.10., bis 14:46 | #100 (auswerten V2), #103 Doppelsterne, #104 M45, #105 M57 | vier Agenten; Downloads und Lizenzpruefung durch die Agenten |
| 5 Welle 3 | 29.10., bis 15:52 | #109 UI-Durchstich, #36 Mondphasen | zwei Agenten |
| 5 Welle 4 | 29.10. nachmittags bis 30.10. 08:30 | #106 M31, #107 M42 (WFI-Rohdaten), #108 M13, #110 Infopanel | vier Agenten, je eine bis zwei Nacharbeiten |
| 5 Welle 5 | 30.10., bis 11:52 | #133 Umlaute, #111 Konstanten und T12, #135 Quadrat, #136 M32, #141, #139 M43 | ein bis zwei Agenten parallel; #111, #136, #139 erst nur Messung und Varianten |
| 6 Validierung | 30.10. 12:46, Nacharbeit 2.11. bis 08:18 | #112 T7 bis T11, Abweichungen #145 bis #148; #145 und #146 behoben | ein Agent je Issue, Urteil Herbert am Bild |
| 6 Sicherheit, Vereinfachung | 2.11., bis 08:56 | #113, `validierung.md` 15, gestapelte PRs #154 bis #157 | ein Agent mit drei Subagenten fuer die Bestandsaufnahme |
| 7 Abschluss | 2.11. | #114: Nachweis A-Q4, README, diese Abschnitte, Vorlage Firefox | ein Agent |

Die Phasen 1 bis 4 waren in Version 2 an einem Vormittag erledigt (in Version 1 der 23. Oktober und der Morgen des 26.): Phasenplan, Issue-Schablone und Dokumente standen, die Recherche konnte an die vorhandenen Dateien anschliessen.

## 10. Version 2: Aufwand

Aus den Arbeitsnotizen der Wellen; Minuten sind Laufzeit des Agenten, Tokens seine Gesamtmenge, Nacharbeiten nach den Reviews eingerechnet, wo angegeben [G fuer die Einzelwerte aus den Notizen].

| Abschnitt | Agenten | Umsetzung je Agent | Review je PR |
|---|---|---|---|
| Phase 2 Recherche | 4 | 14 bis 44 min, 200 bis 226k | Stichproben vom Hauptagenten, kein Fehler |
| Phase 3 Naht-Entwuerfe | 2 | 5,5 bis 7 min, rund 180k | - (dazu Python-Prototyp, rund 30 min in der Hauptsession) |
| Welle 1 (#96 bis #99, #101, #102) | 6 | 4,5 bis 11 min, 114 bis 188k; Nacharbeit 1 bis 3 min | 1 Agent, 2,5 bis 7,5 min, 97 bis 153k |
| Welle 2 (#100, #103 bis #105) | 4 | 11 bis 27 min, 183 bis 368k | 1 Agent, 4,5 bis 9 min, 121 bis 199k |
| Welle 3 (#109, #36) | 2 | 13 und 27 min, 220 und 314k; mit Nacharbeiten rund 290 und 350k | 1 Agent, rund 5 min, 141 bis 155k |
| Welle 4 (#106 bis #108, #110) | 4 | 19 bis 59 min, 282 bis 411k; mit Nacharbeiten 341 bis 540k | 1 Agent, 4,5 bis 13,4 min, 150 bis 227k |
| Welle 5 (#133, #111, #135, #136, #141, #139) | je 1 | 12 bis 36 min, 183 bis 421k (#136 zusaetzlich 180k fuer die Varianten) | nur #140: 10 min, 166k |
| Validierung #112 | 1 | 24 min, 286k, dazu Runde 2 rund 15 min | - |
| #145 Einsattelung | 1 | 22 + 16 min, 285 + 172k | - |
| #146 Farbe des Begleiters | 1 + Literatur | rund 2 h, rund 300k plus 67k Literaturrecherche | - |
| #113 Sicherheit, Vereinfachung | 1 + 3 | Bestandsaufnahme 30 min, rund 620k; Umsetzung 60 min, 250k | Pruefung durch den Hauptagenten |

Summen [R, grob aus der Tabelle, ohne den Hauptagenten]: Umsetzung etwa 8 Mio. Tokens, Reviews etwa 2,6 Mio., Recherche und Entwuerfe etwa 1,2 Mio. Die Agenten der Daten-Issues mit Downloads (M31, M42, M13, Mondphasen, Doppelsterne) brauchten zwei- bis dreimal so lange wie reine Code-Issues; am laengsten lief M42 (59 min, 2,9 GB Rohdaten aus dem ESO-Archiv gestapelt). Die eigene Schaetzung der Agenten zur Dauer lag drei- bis viermal zu hoch (Welle 3, #112) [G].

## 11. Version 2: Was gut lief

- **Vorlagen aus Version 1.** Prozess, Schablone, Brief an die Agenten und die Liste der Lehren (Abschnitt 7) standen; die Phasen 1 bis 4 liefen an einem Vormittag, die Wellen hielten die Lehren aus Version 1 ein (Integrationsprobe, Screenshots je Welle, Kennzeichnung im Bericht).
- **Phase-1-Agenten, die nur messen und Varianten zeigen.** Bei #111 (Konstanten), #136 (M32), #139 (M43), #146 (Antares-Farbe) und #113 lieferte der Agent zuerst Messung, Varianten und Bilder ohne Commit; Herbert entschied am Bild, derselbe Agent setzte danach um. Das hat Fehlinvestitionen verhindert: #136 Variante C (Region-Schwelle) zeigte ein dunkles Loch und fiel weg, #139 wurde nach der Literaturprobe auf einen Hinweis reduziert und der Rest (#143) nach "Spaeter" verschoben.
- **Vorab vergebene Abschnittsnummern und Reihenfolgen.** Ab Welle 2 bekam jeder Agent seine Abschnitte in `physik.md` und `validierung.md` und den Platz in `objekte.json` vorab; die Konflikte der Integrationsprobe waren danach fast nur Anhaenge. Gemergt wurde per `git commit-tree` mit den Baeumen der Integrationsprobe, so mussten Konflikte nicht zweimal geloest werden.
- **Reviews mit Nachrechnen am Bild.** Die wichtigsten Funde kamen wieder aus Proben, nicht aus dem Lesen: Sternlisten spiegelverkehrt (Vorzeichen von dx), Sternentfernung in M31 ersetzte 59 % der Pixel, Zickzack-Tonkurve in M13, Beugungsspikes des Trapezes in M42, Flaechenschwelle unter Nullhintergrund (#96). Das Review von #132 hat den WFI-Stapel bytegleich nachgerechnet.
- **Validierung per Bild ansehen.** Der Hauptagent hat die Screenshots selbst angesehen (Read auf die PNG) und so gefunden, was kein Test zeigte: Quadrate um helle Sterne (#127), ein helles Quadrat um Planeten mit blossem Auge (#135), eine Stadion-Form des Halos nach #145, den blauen Fleck des nicht getrennten Antares B (#146).
- **Rohdaten und Werkzeuge reproduzierbar.** Rohdaten liegen nur im Hauptrepo unter `data/roh/` mit Herkunft und SHA-256 in `data/roh/LIESMICH.md`; jedes Bild und jede Sternliste entsteht aus einem Skript in `tools/`, Reviews konnten sie bytegleich neu erzeugen.
- **Gestapelte PRs mit Vorabfreigabe.** Die Bereinigung aus #113 lief als Stapel A, B, C und Doku (#154 bis #157); Herbert hat den Merge vorab nach gruener CI freigegeben, alle vier waren in einer Minute auf `main`.

## 12. Version 2: Was schlecht lief oder Nacharbeit kostete

- **Fremde PR-Texte ueberschrieben.** Dreimal hat ein Agent den Text eines anderen PR ersetzt: einmal den PR eines parallelen Agenten (#127 bekam "Closes #36", #109 blieb deshalb offen), zweimal ueber eine gemeinsame Datei `pr.md` im Scratchpad (#129, #130). Abhilfe: je Agent ein eigener Scratchpad-Unterordner, die eigene PR-Nummer im Brief, PR-Texte vor dem Merge pruefen.
- **Worktrees mit Rohdaten-Symlinks.** `data/roh` als Ganzes zu verlinken verdeckt die versionierte `data/roh/LIESMICH.md` und zeigt den Symlink als neue Datei; die Rohdateien muessen einzeln verlinkt werden, `node_modules` als Symlink spart das `npm ci` je Worktree.
- **Shell-Fallen.** Backticks in einem doppelt gequoteten Shell-String (etwa `gh pr create --body "..."`) fuehrt die Shell als Befehl aus; PR- und Issue-Texte gehoeren in eine Datei (`--body-file`). `gh issue view` und `gh pr view` brechen weiter am Feld der Projects (classic) ab. Der Auto-Modus lehnte Kommentare per `gh` und das Loeschen von Worktrees und Branches ab; das blieb bei Herbert.
- **Laufrauschen der Screenshots.** Chrome headless liefert nicht immer bytegleiche Bilder: um bis zu 3 Kodes an Schriftkanten (Infosymbol) und einmal an T12b und T7b. "Bytegleich" als Kriterium fuer "keine Aenderung" braucht deshalb einen zweiten Lauf, bevor ein Unterschied als echt gilt.
- **Konventionen zwischen Recherche und Naht.** Die Recherche schrieb "dx positiv = Osten", die Naht rechnet +x = Westen; die Sternlisten von Epsilon Lyrae und M45 waren spiegelverkehrt, das Review fand es nur in einem der beiden PRs.
- **Zielkonflikte in den Anforderungen spaet erkannt.** Die Maria des Vollmonds mit blossem Auge (#36) und das Weiss aus A-P13 (T12) schliessen sich mit der Kubikwurzel-Kompression aus; erst das Review von #128 hat das gerechnet, Herbert hat das Kriterium aufgegeben.
- **Viele Folge-Issues aus dem Bild.** #135, #136, #139, #145 und #146 entstanden erst, als die Objekte am Bild zu sehen waren; Tests und Reviews der Wellen konnten sie nicht finden, weil Erwartungen fuer den Anblick fehlten. Die Validierung (#112) kam erst nach allen Wellen.
- **Wechselwirkungen ohne Merge-Konflikt.** Die Summenpruefung von `quellweiss_eichen.py` aus #108 traf M42 aus #107, der Fetch-Ersatz in einem Test von #103 kannte die Sternlisten aus #104 nicht; beides zeigte nur die Integrationsprobe.
- **CI langsamer als lokal.** Ein Test mit 1,7 s lokal lief auf dem Runner ueber das Timeout von 5 s.
- **Firefox wieder nicht automatisiert.** Die Pruefung bleibt Handarbeit (`docs/validierung.md` 17).

## 13. Version 2: Sicht Herbert

_Platz fuer Herberts Rueckblick auf Version 2._

## 14. Version 2: Empfehlungen

Die Empfehlungen aus Abschnitt 7 gelten weiter; neu aus Version 2:

1. Wo Ermessen im Spiel ist (Konstanten, Darstellung, Modellvarianten), den Agenten zuerst nur messen und Varianten mit Bildern zeigen lassen, ohne Commit; der Mensch entscheidet am Bild, derselbe Agent setzt um.
2. Im Brief an jeden parallelen Agenten: eigener Scratchpad-Unterordner, eigene PR-Nummer oder Branch, vorab vergebene Abschnittsnummern, die geltenden Konventionen (Vorzeichen, Einheiten, Koordinaten) aus `GLOSSARY.md`; PR-Texte vor dem Merge pruefen.
3. Worktree-Vorlage: `node_modules` als Symlink, Rohdaten einzeln verlinkt, versionierte Dateien nicht ueberdecken.
4. Texte fuer `gh` immer aus einer Datei (`--body-file`, `-F`), nie Backticks in doppelt gequoteten Strings.
5. Bildvergleiche mit Toleranz oder zweitem Lauf; "bytegleich" nur als Hinweis, nicht als Beweis.
6. Anforderungen in Phase 3 mit dem Prototyp auf Zielkonflikte pruefen (z. B. Weiss gegen Kontrast), bevor sie Testfaelle werden.
7. Fuer jedes neue Objekt eine Erwartung an den Anblick schon im Daten-Issue festlegen und dort am Bild pruefen, nicht erst in der Validierung.
8. Reine Bereinigungen als gestapelte PRs mit Vorabfreigabe nach gruener CI.
9. Firefox-Pruefung als feste Liste von URLs (wie `docs/validierung.md` 17) in jeder Version; ob sich Firefox ueber sein Remote-Protokoll ohne neue Abhaengigkeit steuern laesst, waere ein eigenes Issue [V].
