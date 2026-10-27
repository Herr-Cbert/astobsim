// Zeiger und Tastatur fuer ein Bild der Anzeige (Gesichtsfeld, Zoomansicht): Ziehen und
// Pfeiltasten verschieben die Fenstermitte (A-D2, Grenzen und Richtungen in verschieben.ts), ein
// Klick ohne Ziehen, Eingabe- und Leertaste wechseln die Ansicht (A-D3). Alles laeuft ueber die
// Steuerung (verschiebe, zoome); hier steckt nur die Zuordnung der Ereignisse.

import type { Steuerung } from "./steuerung";
import { type Mitte, mitteNachTaste, mitteNachZiehen } from "./verschieben";
import type { Verschiebelage } from "./zoom";

/** Ab dieser Bewegung in CSS-Pixeln ist ein Druck ein Ziehen und kein Klick. */
export const KLICK_TOLERANZ_PX = 4;

export interface Bildbedienung {
  steuerung: Steuerung;
  /** Lage in der Ansicht dieses Elements (verschiebelage aus zoom.ts). */
  lage(): Verschiebelage | undefined;
  /** Angezeigte Breite eines Bilds in CSS-Pixeln; lage().breite verteilt sich darauf. */
  breitePx(): number;
  /** Klick ohne Ziehen oder Eingabetaste: Ansicht wechseln. */
  wechsle(): void;
}

/** Haengt Ziehen, Klick und Tasten an element. */
export function verbindeBild(element: HTMLElement, b: Bildbedienung): void {
  const { steuerung } = b;

  // Ziehen: Start merken, jede Bewegung rechnet vom Start aus (verschieben.ts). Die Steuerung
  // fasst mehrere Bewegungen je Frame zu einer Rechnung zusammen.
  let ziehen: { zeiger: number; x: number; y: number; start: Mitte } | undefined;
  /**
   * Ort des letzten Drucks; wer danach weiter als KLICK_TOLERANZ_PX zieht, wechselt beim Loslassen
   * nicht die Ansicht, auch wenn sich nichts verschieben laesst.
   */
  let druck: { x: number; y: number } | undefined;
  let gezogen = false;

  element.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    druck = { x: e.clientX, y: e.clientY };
    gezogen = false;
    if (b.lage()?.erlaubt !== true) return;
    ziehen = { zeiger: e.pointerId, x: e.clientX, y: e.clientY, start: { ...steuerung.stand.mitte } };
    element.setPointerCapture(e.pointerId);
    element.classList.add("zieht");
    element.focus({ preventScroll: true });
    e.preventDefault();
  });
  element.addEventListener("pointermove", (e) => {
    if (druck !== undefined && e.buttons !== 0 && Math.hypot(e.clientX - druck.x, e.clientY - druck.y) > KLICK_TOLERANZ_PX) gezogen = true;
    if (ziehen === undefined || e.pointerId !== ziehen.zeiger) return;
    // Taste los, ohne dass pointerup ankam (z. B. ausserhalb des Fensters losgelassen): Ziehen endet.
    if (e.buttons === 0) {
      ende(e);
      return;
    }
    const dx = e.clientX - ziehen.x;
    const dy = e.clientY - ziehen.y;
    const lage = b.lage();
    const breitePx = b.breitePx();
    if (lage === undefined || !lage.erlaubt || !(breitePx > 0)) return;
    const m = mitteNachZiehen(ziehen.start, dx, dy, lage.breite / breitePx, lage.durchmesser);
    steuerung.verschiebe(m.xArcsec, m.yArcsec);
  });
  function ende(e: PointerEvent): void {
    if (ziehen === undefined || e.pointerId !== ziehen.zeiger) return;
    ziehen = undefined;
    element.classList.remove("zieht");
    if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);
  }
  element.addEventListener("pointerup", ende);
  element.addEventListener("pointercancel", ende);
  element.addEventListener("lostpointercapture", ende);

  element.addEventListener("click", (e) => {
    if (e.button !== 0 || gezogen) return;
    b.wechsle();
  });

  element.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Enter" || e.key === " ") {
      // Leertaste wie Eingabetaste (role "button"), ohne die Seite zu rollen. Gehaltene Taste
      // schaltet nicht hin und her.
      e.preventDefault();
      if (!e.repeat) b.wechsle();
      return;
    }
    const lage = b.lage();
    if (lage === undefined || !lage.erlaubt) return;
    const m = mitteNachTaste(steuerung.stand.mitte, e.key, e.shiftKey, lage.breite, lage.durchmesser);
    if (m === undefined) return;
    e.preventDefault();
    steuerung.verschiebe(m.xArcsec, m.yArcsec);
  });
}
