# Prototyp Deep-Sky-Anblick (Phase 3 Version 2, Wegwerf)

Kernfrage: Ergeben gemeinsame Abbildung, Schwelle per Isophote nach Crumey, Deckkraft nach Blackwell und Mindestsichtbarkeit ein plausibles Bild? Befunde und Entscheidungen: `docs/adr/0004-helligkeit-und-wahrnehmungsschwelle.md`, Abschnitt "Prototyp".

- `deep_sky.py <ziel>`: Modellbilder M31 und M57, Bildreihen mit Delta_min 0, 3, 6 (Stand des Laufs: F = 2, Faktor G).
- `empfindlichkeit.py`: Sichtbarkeit von M31 mit blossem Auge gegen Feldfaktor und Profilhelligkeit.
- `additiv.py`: Gegenprobe additiver Sockel statt Faktor G.

Python 3 mit numpy und Pillow. Nur auf diesem Branch, nicht auf main.
