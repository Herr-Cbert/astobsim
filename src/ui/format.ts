// Zahlenformatierung fuer die Oberflaeche: deutsches Dezimalkomma, feste Nachkommastellen.
// Unabhaengig von der Locale des Browsers, damit Anzeige und Tests gleich sind.

/** wert mit stellen Nachkommastellen und Dezimalkomma; -0 wird 0, nicht endliche Werte ein Gedankenstrich. */
export function zahl(wert: number, stellen: number): string {
  if (!Number.isFinite(wert)) return "–";
  const text = wert.toFixed(stellen);
  // toFixed liefert fuer kleine negative Werte "-0.00"; das soll als 0 erscheinen.
  const ohneMinusNull = Number(text) === 0 ? text.replace(/^-/, "") : text;
  return ohneMinusNull.replace(".", ",");
}
