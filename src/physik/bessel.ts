// Besselfunktion J1 fuer das Airy-Profil. Quelle: docs/recherche/physik.md, Abschnitt 11 [51]:
// Abramowitz und Stegun, Formeln 9.4.4 (|x| < 3) und 9.4.6 (|x| >= 3), Polynomnaeherungen
// mit Fehler unter 1,3e-8. Keine Bibliothek (Issue #2).

/**
 * J1(x) nach Abramowitz-Stegun 9.4.4 und 9.4.6.
 * Fuer |x| < 3: J1(x)/x als Polynom in (x/3)^2.
 * Fuer |x| >= 3: J1(x) = f1(3/|x|) cos(theta1(3/|x|)) / sqrt(|x|), ungerade fortgesetzt.
 */
export function besselJ1(x: number): number {
  const ax = Math.abs(x);
  if (ax < 3) {
    const y = (x / 3) ** 2;
    return (
      x *
      (0.5 +
        y *
          (-0.56249985 +
            y * (0.21093573 + y * (-0.03954289 + y * (0.00443319 + y * (-0.00031761 + y * 0.00001109))))))
    );
  }
  const y = 3 / ax;
  const f1 =
    0.79788456 +
    y * (0.00000156 + y * (0.01659667 + y * (0.00017105 + y * (-0.00249511 + y * (0.00113653 - y * 0.00020033)))));
  const theta1 =
    ax -
    2.35619449 +
    y * (0.12499612 + y * (0.0000565 + y * (-0.00637879 + y * (0.00074348 + y * (0.00079824 - y * 0.00029166)))));
  const j = (f1 * Math.cos(theta1)) / Math.sqrt(ax);
  return x < 0 ? -j : j;
}
