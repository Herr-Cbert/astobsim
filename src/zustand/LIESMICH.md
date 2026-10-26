# zustand: Konfiguration in der URL

Startkonfiguration (A-D9) und Konfiguration in die URL und zurueck (A-D8, A-T4: keine Cookies, kein localStorage). Reine Funktionen ohne DOM; `history.replaceState` ruft erst die UI auf.

## Interface

```ts
interface Kataloge { geraete: readonly Geraeteeintrag[]; objekte: readonly Objekt[]; nachweise: readonly Bildnachweis[] }

voreinstellung(kataloge: Kataloge): Konfiguration
inUrl(konfiguration: Konfiguration, kataloge: Kataloge): string   // "?v=1&g=...", mit fuehrendem "?"
ausUrl(search: string, kataloge: Kataloge): Konfiguration        // search mit oder ohne "?"
```

Abweichung von Issue #16 (`voreinstellung()`, `inUrl(k)`, `ausUrl(search)`): Die Konfiguration traegt das volle `Geraet` und den vollen `Objektzustand`, die URL nur ids und Zahlen. Um daraus eine Konfiguration zu bauen, brauchen die Funktionen die geladenen Listen aus `daten`. `inUrl` braucht die Geraeteliste, um ein Listengeraet als id zu schreiben; der Einheitlichkeit halber bekommen alle drei denselben Parameter `Kataloge`.

`voreinstellung` wirft `DatenFehler`, wenn `refraktor-80-600-ed` oder `mond_ev` in den Katalogen fehlen (kaputte Daten). `ausUrl` wirft sonst nie.

## Parameter (Version 1)

| Name | Bedeutung | Einheit, Werte | Wann geschrieben |
|---|---|---|---|
| `v` | Version des URL-Formats | `1` | immer |
| `g` | Geraet aus der Geraeteliste | id aus `daten/geraete.json` | Listengeraet |
| `a` | Art des freien Geraets | `fernrohr`, `fernglas`, `auge` | freies Geraet (statt `g`) |
| `ba` | Bauart | `refraktor`, `newton`, `schmidt-cassegrain`, `maksutov` | freies Fernrohr |
| `d` | Oeffnung | mm | freies Fernrohr, freies Fernglas |
| `f` | Brennweite | mm | freies Fernrohr |
| `o` | Obstruktion | Verhaeltnis 0 bis 0,5, nicht Prozent | freies Fernrohr |
| `vg` | Vergroesserung | fach | freies Fernglas |
| `wg` | Wahres Gesichtsfeld | Grad | freies Fernglas |
| `ok` | Okularbrennweite | mm | jedes Fernrohr |
| `sg` | Scheinbares Gesichtsfeld des Okulars | Grad | jedes Fernrohr |
| `z` | Zustand des Objekts | Zustands-id aus `daten/objekte.json`, z. B. `mond_ev`, `jup_47` | immer |
| `s` | Seeing (FWHM im Zenit) | Bogensekunden | immer |
| `b` | Himmelshelligkeit | Bortle-Stufe 1 bis 9 | immer |
| `t` | Transparenz | `klar`, `leicht-diesig`, `diesig` | immer |
| `h` | Hoehe ueber dem Horizont | Grad | immer |

Beispiel (Voreinstellung): `?v=1&g=refraktor-80-600-ed&ok=10&sg=50&z=mond_ev&s=2&b=5&t=klar&h=45`

Ein eigener Objekt-Parameter (`obj`) entfaellt: Zustands-ids sind global eindeutig (`pruefeObjekte`), das Objekt folgt aus dem Zustand.

## Regeln

- **Zahlen** stehen als kuerzeste verlustfreie Dezimaldarstellung (`String(zahl)`), so dass `ausUrl(inUrl(k))` gleich `k` ist.
- **Listengeraet**: Ein Geraet gilt als Listengeraet, wenn seine Felder ohne Okular mit einem Listeneintrag uebereinstimmen (generischer Feldvergleich). Sonst wird es als freies Geraet mit `a` und Zahlen geschrieben.
- **Okular** (`ok`, `sg`) gibt es nur beim Fernrohr. Bei Fernglas und blossem Auge wird es weder geschrieben noch gelesen.
- **Lesen des Geraets**: bekannte id in `g`, sonst freies Geraet nach `a`, sonst das Geraet der Voreinstellung (mit Okular aus `ok`, `sg`).
- **Rueckfall je Parameter**: Fehlt ein Parameter oder ist er unlesbar (leer, keine endliche Zahl, unbekannter Wert), gilt der Wert der Voreinstellung, und zwar nur fuer diesen Parameter. Unbekannte Zustands-id: Zustand der Voreinstellung. Im Einzelnen:
  - freies Fernrohr: `d`, `f`, Bauart aus dem Startgeraet; fehlt `o`, gilt der Vorschlagswert der Bauart (`vorschlagObstruktionProzent` aus `daten`, A-F1).
  - freies Fernglas: Die Voreinstellung hat kein Fernglas; `d`, `vg`, `wg` fallen auf das erste Fernglas der Geraeteliste zurueck, ohne Fernglas in der Liste auf das Startgeraet.
  - Okular: Okular der Voreinstellung (10 mm, 50 Grad).
- **Begrenzung**: Nach dem Lesen geht die Konfiguration durch `begrenze()` aus `physik`, die einzige Stelle fuer die Bereiche A-F8, A-B1, A-B2, A-B4. Werte ausserhalb kommen geschnitten zurueck, die Bortle-Stufe gerundet. `inUrl` schneidet nichts.
- **Version**: `inUrl` schreibt `v=1`. `ausUrl` liest heute jede Version (auch fehlend) wie Version 1; aendert sich das Format, verzweigt `ausUrl` hier und liest alte Links weiter.
- **Geraete.art**: Die Invariante "nur `optik()` und `begrenze()` verzweigen ueber `Geraet.art`" hat hier eine dritte Ausnahme: Schreiben und Lesen eines freien Geraets brauchen je Art andere Felder. Es wird nichts aus der Art berechnet.
