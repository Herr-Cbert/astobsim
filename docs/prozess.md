# Prozess: astobsim mit Claude Code von der Planung bis zur Fertigstellung

Dieses Dokument ist der rote Faden des Projekts. Es beschreibt die Phasen, ihre Ergebnisse und die Rollenverteilung zwischen Herbert und Claude. Der aktuelle Stand steht in der `README.md`.

## Grundprinzipien

1. **Ein Dokument pro Phase als Uebergabe.** Jede Phase endet mit einer Datei in `docs/`, die die naechste Phase als einzigen Input braucht. So kann jede Phase in einer frischen Session laufen.
2. **Eine Phase pro Session.** Zwischen den Phasen neue Session. Dauerwissen kommt ins Second Brain, nicht in den Chat.
3. **Rollen.** Herbert entscheidet (Anforderungen, Architektur, Abnahme). Claude recherchiert, schlaegt vor, setzt um, reviewt. Reviews durch Claude bereiten den menschlichen Blick vor, sie ersetzen ihn nicht.
4. **Klein anfangen, dann parallelisieren.** Erst zwei, drei Issues sequentiell, dann Worktrees und Subagenten.
5. **Jede Phase beginnt im Plan-Modus.**

## Phasen

| Phase | Ziel | Werkzeug | Ergebnis |
|---|---|---|---|
| 0 Geruest | Repo, Remote, Second Brain, `CLAUDE.md` | Bash, gh | Repo auf GitHub |
| 1 Anforderungen | Idee zu pruefbaren Anforderungen schaerfen | Skill `grilling` | `docs/anforderungen.md` |
| 2 Recherche | Physik, Fernrohrliste, Bildquellen | Skill `research`, parallele Subagenten | `docs/recherche/*.md` |
| 3 Architektur | Stack, Simulationsmodell, Datenformat, Modulschnitt; Risiko-Prototyp | Skills `domain-modeling`, `prototype`, `codebase-design` | `docs/adr/*.md`, `GLOSSARY.md` |
| 4 Zerlegung | Arbeitspakete als GitHub-Issues mit Abnahmekriterien | gh | Issues, `docs/plan.md` |
| 5 Umsetzung | Issues abarbeiten, erst sequentiell, dann parallel | Skills `tdd`, `pr`, `code-review`; Worktrees, Agenten | PRs, Milestones |
| 6 Validierung | Vergleich mit Beobachtungserfahrung, Sicherheit, Vereinfachung | Skills `security-review`, `simplify` | `docs/validierung.md` |
| 7 Abschluss | README, Lizenzen, Second Brain, Retrospektive | | `docs/retrospektive.md` |

### Phase 1: Anforderungen

Erwartbare Fragen: Zielgruppe, welche Objekte (Mond, Planeten, Deep-Sky), welche Fernrohr-Parameter (Oeffnung, Brennweite, Okular, Obstruktion, Optikqualitaet), welche Umgebungsparameter (Seeing, Himmelshelligkeit, Transparenz, Hoehe ueber Horizont), was "Ergebnis" genau heisst (Bild im Gesichtsfeld mit Okular oder nur Aufloesung), Browser-only oder Server, Offline, Hosting, Lizenz der Bilder. Ergebnis mit Muss, Kann, Nicht-Ziel.

### Phase 2: Recherche

Drei unabhaengige Auftraege, parallel delegierbar:

1. Physik: Rayleigh, Dawes, Airy-Scheibchen, Seeing als Langzeit-PSF, Obstruktion und MTF, Austrittspupille, Grenzgroesse, Augenempfindlichkeit. Mit Formeln und Quellen.
2. Fernrohre: gaengige Geraete mit Oeffnung, Brennweite, Obstruktion, Vorschlag fuer Datenformat.
3. Bilder: frei verwendbare hochaufgeloeste Bilder (NASA, ESA, USGS, ...) mit Winkelgroesse und Lizenz je Objekt. Bilder erst nach Lizenzpruefung holen.

Herbert prueft fachlich. Gesichertes wandert ins Second Brain.

### Phase 3: Architektur

- ADR-001 Stack, ADR-002 Simulationsmodell (PSF-Faltung mit Seeing und Kontrastabsenkung), ADR-003 Datenformat.
- Wegwerf-Prototyp fuer die Kernfrage: Sieht ein Mondbild nach Faltung mit plausibler PSF ueberzeugend aus, und ist das im Browser schnell genug?
- Modulschnitt: Physik als reine, testbare Funktionen; Bildpipeline; Daten; UI.
- Danach `CLAUDE.md` um Stack-Regeln ergaenzen und Toolchain installieren.

### Phase 4: Zerlegung

Erwartbare Teilprojekte: Geruest und Build, Daten Fernrohre, Daten Objekte und Bilder, Physik-Modul, Bildpipeline, UI Fernrohr, UI Bedingungen, Ergebnisansicht, Deploy, Validierung. Labels `physik`, `daten`, `ui`, `infra`. Milestone M1: "Mond im 80 mm Refraktor sichtbar" als erster durchgehender Pfad.

### Phase 5: Umsetzung

Stufe A, sequentiell: Branch `issue-<n>-<kurzname>`, Plan-Modus mit "Setze Issue #n um", PR, Review-Skill, menschliches Review, Merge. Nach jedem Issue: Was gehoert in `CLAUDE.md` oder ins Second Brain?

Stufe B, parallel: pro Issue ein Worktree und ein Subagent, Review gebuendelt. Merge-Konflikte zeigen, wo der Modulschnitt nicht sauber war.

### Phase 6: Validierung

Testfaelle aus Beobachtungserfahrung, z. B. Jupiter im 70 mm zeigt zwei Baender, Cassini-Teilung ab etwa 100 mm, Kratergrenze bei gegebenem Seeing. Abweichungen werden Issues.

## Issue-Schablone

```
## Ziel
Ein Satz.

## Kontext
Verweis auf docs/anforderungen.md Abschnitt X, ADR-00n.

## Akzeptanzkriterien
- [ ] pruefbar 1
- [ ] pruefbar 2

## Betroffene Module
src/...

## Abhaengigkeiten
Blockiert durch #n.

## Hinweise fuer den Agenten
Nicht anfassen: ...
Tests: ...
```
