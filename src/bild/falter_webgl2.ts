// WebGL2-Adapter fuer Falter (ADR-0002: direkte Faltung mit kleinem Kern im Fragment-Shader,
// Rand geklemmt) und die Wahl zwischen WebGL2 und JavaScript (Issue #15). Muss bis auf eine
// 8-Bit-Stufe dasselbe liefern wie FalterJs; der Gleichheitstest laeuft im Browser
// (test/browser/, npm run test:browser). In Node gibt es kein WebGL2: waehleFalter liefert dort
// FalterJs, FalterWebgl2 wird nie angelegt.

import type { Kern } from "../naht/simulationsparameter";
import { FalterJs, pruefeKern, type Falter } from "./falter";
import { BildFehler } from "./fehler";
import { neuesRaster, pruefeRaster, type Kanaele, type Raster } from "./raster";

/** Ohne WebGL2 wird die Anzeige auf diese Kantenlaenge begrenzt (ADR-0002, A-D7). */
export const ANZEIGEGRENZE_OHNE_WEBGL2_PX = 1024;

/** Der Kontext ist verloren (webglcontextlost); der Aufrufer weicht auf FalterJs aus. */
export class KontextVerloren extends Error {
  constructor() {
    super("WebGL2-Kontext verloren");
    this.name = "KontextVerloren";
  }
}

/**
 * Das Raster passt nicht in eine Textur (MAX_TEXTURE_SIZE). Betrifft nur diesen Auftrag: der
 * Aufrufer rechnet ihn mit FalterJs, ohne WebGL2 abzuschalten.
 */
export class ZuGrossFuerTextur extends Error {
  constructor(breite: number, hoehe: number, grenze: number) {
    super(`WebGL2: Textur ${breite} x ${hoehe} ueber der Grenze ${grenze} px`);
    this.name = "ZuGrossFuerTextur";
  }
}

/** Zeichenflaeche fuer den Kontext: im Fenster ein Canvas-Element, im Worker ein OffscreenCanvas. */
export type Zeichenflaeche = HTMLCanvasElement | OffscreenCanvas;

/**
 * Bis zu dieser Kerngroesse rechnet der ausgerollte Shader (Kern als Uniform, 157 vec4 bei 25 px,
 * unter dem WebGL2-Minimum von 224). Groessere Kerne (die Naht erlaubt bis 81 px, aus dem
 * Arbeitsmassstab entstehen hoechstens 17 px, ADR-0002) laufen ueber den Schleifen-Shader. Der ist
 * deutlich langsamer: 1024 px, Kern 27, drei Kanaele etwa 540 ms in SwiftShader und etwa 17 ms auf
 * der GPU (RTX 4090).
 */
const GROESSTER_AUSGEROLLTER_KERN = 25;

// Ein Dreieck ueber die ganze Flaeche; die Pixelposition kommt aus gl_FragCoord.
const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const KOPF = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D bild;
out vec4 farbe;
`;

/** Zahl der RGBA-Texel, die ein Fragment des ausgerollten Shaders je Kernzeile liest. */
function texelJeZeile(n: number, kanaele: Kanaele): number {
  return Math.floor((kanaele * (n - 1) + 3) / 4) + 1;
}

/**
 * Ausgerollter Shader (schnell, bis GROESSTER_AUSGEROLLTER_KERN). Die Eingabe liegt gepolstert vor
 * (Rand geklemmt, je radius Pixel), eine Rasterzeile als Folge von Floats (Kanaele verschraenkt),
 * vier Floats je RGBA-Texel. Ein Fragment rechnet die vier Floats eines Ausgabetexels: Float f
 * der Ausgabezeile y ist Summe ueber (t, u) von kern[t][u] mal gepolstert[y + 2R - t][f + K(2R - u)]
 * mit K Kanaelen, also dieselbe echte Faltung wie FalterJs. Alle Indizes sind Konstanten im
 * Quelltext; so liest jedes Fragment je Kernzeile nur wenige Texel und SwiftShader braucht kein
 * Laufzeit-Indexieren (gemessen 1024 px, Kern 25, ein Kanal: 40 ms statt 420 ms mit Schleifen).
 */
function ausgerollterShader(n: number, kanaele: Kanaele): string {
  const r = (n - 1) / 2;
  const m = texelJeZeile(n, kanaele);
  const komp = "xyzw";
  const zeilen: string[] = [];
  for (let t = 0; t < n; t++) {
    const lesen: string[] = [];
    for (let j = 0; j < m; j++) lesen.push(`vec4 v${j} = texelFetch(bild, ivec2(p.x + ${j}, y), 0);`);
    const summen: string[] = [];
    for (let u = 0; u < n; u++) {
      const i = t * n + u;
      const versatz = kanaele * (2 * r - u);
      const werte = [0, 1, 2, 3].map((q) => `v${(versatz + q) >> 2}.${komp[(versatz + q) & 3]}`);
      summen.push(`s += kern[${i >> 2}].${komp[i & 3]} * vec4(${werte.join(", ")});`);
    }
    zeilen.push(`  { int y = p.y + ${2 * r - t};\n    ${lesen.join(" ")}\n    ${summen.join("\n    ")} }`);
  }
  return `${KOPF}uniform vec4 kern[${Math.ceil((n * n) / 4)}];
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec4 s = vec4(0.0);
${zeilen.join("\n")}
  farbe = s;
}`;
}

/**
 * Schleifen-Shader fuer grosse Kerne: Eingabe ungepolstert als R32F oder RGB32F, Kern als
 * R32F-Textur, Rand per clamp; ein Fragment je Pixel. Gleiche Faltung wie oben.
 */
function schleifenShader(n: number, kanaele: Kanaele): string {
  const typ = kanaele === 1 ? "float" : "vec3";
  const auswahl = kanaele === 1 ? "r" : "rgb";
  const ausgabe = kanaele === 1 ? "vec4(s, 0.0, 0.0, 1.0)" : "vec4(s, 1.0)";
  return `${KOPF}uniform sampler2D kernTextur;
#define N ${n}
#define R ${(n - 1) / 2}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 hoechst = textureSize(bild, 0) - 1;
  ${typ} s = ${typ}(0.0);
  for (int t = 0; t < N; t++) {
    int y = clamp(p.y - t + R, 0, hoechst.y);
    for (int u = 0; u < N; u++) {
      int x = clamp(p.x - u + R, 0, hoechst.x);
      s += texelFetch(kernTextur, ivec2(u, t), 0).r * texelFetch(bild, ivec2(x, y), 0).${auswahl};
    }
  }
  farbe = ${ausgabe};
}`;
}

/** Holt einen WebGL2-Kontext, der in Float-Texturen rendern kann, oder null. */
function holeKontext(flaeche: Zeichenflaeche): WebGL2RenderingContext | null {
  const gl = flaeche.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance"
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;
  // Rendern in RGBA32F braucht EXT_color_buffer_float (in Chrome und Firefox vorhanden).
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  return gl;
}

interface Programm {
  programm: WebGLProgram;
  bild: WebGLUniformLocation | null;
  kern: WebGLUniformLocation | null;
}

/**
 * Faltung auf der GPU. Eingabe als Float-Textur, Ergebnis in eine RGBA32F-Textur gerendert und
 * als Float zurueckgelesen, also wieder ein Float-Raster ohne Rundung auf 8 Bit. Je Kerngroesse
 * und Kanalzahl ein Programm, beim ersten Gebrauch uebersetzt und behalten (in SwiftShader kostet
 * der erste Aufruf mit neuer Kerngroesse einige 100 ms). Wirft KontextVerloren, wenn der Kontext
 * weg ist, BildFehler bei unstimmigem Raster oder Kern.
 */
export class FalterWebgl2 implements Falter {
  private readonly gl: WebGL2RenderingContext;
  private readonly programme = new Map<string, Programm>();
  private readonly texBild: WebGLTexture;
  private readonly texKern: WebGLTexture;
  private readonly texZiel: WebGLTexture;
  private readonly ziel: WebGLFramebuffer;
  private readonly vao: WebGLVertexArrayObject;
  private zielBreite = 0;
  private zielHoehe = 0;
  private verlorenFlag = false;
  private readonly maxTextur: number;
  private readonly maxUniformVektoren: number;

  /**
   * Legt den Falter auf der Zeichenflaeche an, oder liefert null, wenn es dort kein WebGL2 mit
   * Float-Rendering gibt. Ohne Angabe entsteht eine eigene Flaeche (Canvas-Element oder
   * OffscreenCanvas). Wirft nicht; ein Fehler beim Anlegen gilt als "kein WebGL2".
   */
  static erzeuge(flaeche?: Zeichenflaeche): FalterWebgl2 | null {
    try {
      const f = flaeche ?? neueZeichenflaeche();
      if (!f) return null;
      const gl = holeKontext(f);
      if (!gl || gl.isContextLost()) return null;
      return new FalterWebgl2(gl, f);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, flaeche: Zeichenflaeche) {
    this.gl = gl;
    this.maxTextur = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    this.maxUniformVektoren = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
    // Fester Zustand: der Kontext gehoert dem Falter allein, also einmal setzen statt je Faltung.
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.SCISSOR_TEST);
    flaeche.addEventListener("webglcontextlost", () => {
      this.verlorenFlag = true;
    });
    this.texBild = neueTextur(gl);
    this.texKern = neueTextur(gl);
    this.texZiel = neueTextur(gl);
    this.ziel = pruefeObjekt(gl.createFramebuffer());
    this.vao = pruefeObjekt(gl.createVertexArray());
  }

  /** true, sobald der Kontext verloren ist; danach wirft falte immer KontextVerloren. */
  get verloren(): boolean {
    return this.verlorenFlag || this.gl.isContextLost();
  }

  falte(raster: Raster, kern: Kern): Raster {
    pruefeRaster(raster);
    pruefeKern(kern);
    if (this.verloren) throw new KontextVerloren();
    const ausgerollt =
      kern.groesse <= GROESSTER_AUSGEROLLTER_KERN && Math.ceil((kern.groesse * kern.groesse) / 4) + 8 <= this.maxUniformVektoren;
    const ergebnis = ausgerollt ? this.falteAusgerollt(raster, kern) : this.falteSchleife(raster, kern);
    // Ging der Kontext waehrend des Rechnens verloren, ist das Ergebnis leer: nicht ausgeben.
    if (this.verloren) throw new KontextVerloren();
    return ergebnis;
  }

  /**
   * Gibt Texturen, Programme, Framebuffer und den Kontext selbst frei (WEBGL_lose_context), damit
   * der Browser nicht an die Grenze offener Kontexte stoesst. Der Falter ist danach nicht mehr nutzbar.
   */
  freigeben(): void {
    const gl = this.gl;
    if (gl.isContextLost()) {
      this.verlorenFlag = true;
      return;
    }
    for (const p of this.programme.values()) gl.deleteProgram(p.programm);
    this.programme.clear();
    gl.deleteTexture(this.texBild);
    gl.deleteTexture(this.texKern);
    gl.deleteTexture(this.texZiel);
    gl.deleteFramebuffer(this.ziel);
    gl.deleteVertexArray(this.vao);
    this.verlorenFlag = true;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  /** Gepolsterte Eingabe, vier Floats je Texel; Ausgabe ein Texel je vier Floats einer Zeile. */
  private falteAusgerollt(raster: Raster, kern: Kern): Raster {
    const { breite, hoehe, kanaele, daten } = raster;
    const n = kern.groesse;
    const r = kern.radius;
    const floatsJeZeile = kanaele * breite;
    const zielBreite = Math.ceil(floatsJeZeile / 4);
    const texelBreite = zielBreite + texelJeZeile(n, kanaele) - 1;
    const texelHoehe = hoehe + 2 * r;
    this.pruefeGroesse(texelBreite, texelHoehe);

    // Polstern: Float f einer gepolsterten Zeile gehoert zu Pixel f / K - r (geklemmt), Kanal f % K.
    const zeile = texelBreite * 4;
    const quelle = new Int32Array(zeile);
    for (let f = 0; f < zeile; f++) {
      const xp = Math.floor(f / kanaele);
      const x = Math.min(breite - 1, Math.max(0, xp - r));
      quelle[f] = x * kanaele + (f - xp * kanaele);
    }
    const gepolstert = new Float32Array(zeile * texelHoehe);
    for (let yp = 0; yp < texelHoehe; yp++) {
      const von = Math.min(hoehe - 1, Math.max(0, yp - r)) * floatsJeZeile;
      const nach = yp * zeile;
      for (let f = 0; f < zeile; f++) gepolstert[nach + f] = daten[von + (quelle[f] as number)] as number;
    }

    const gl = this.gl;
    const p = this.programm(`a|${n}|${kanaele}`, "kern", () => ausgerollterShader(n, kanaele));
    this.ladeBild(gl.RGBA32F, gl.RGBA, texelBreite, texelHoehe, gepolstert);
    gl.useProgram(p.programm);
    const gewichte = new Float32Array(Math.ceil((n * n) / 4) * 4);
    gewichte.set(kern.daten);
    gl.uniform4fv(p.kern, gewichte);
    const rgba = this.zeichne(p, zielBreite, hoehe);

    const ergebnis = neuesRaster(breite, hoehe, kanaele);
    for (let y = 0; y < hoehe; y++) {
      const von = y * zielBreite * 4;
      ergebnis.daten.set(rgba.subarray(von, von + floatsJeZeile), y * floatsJeZeile);
    }
    return ergebnis;
  }

  /** Ungepolsterte Eingabe, Kern als Textur, ein Fragment je Pixel. */
  private falteSchleife(raster: Raster, kern: Kern): Raster {
    const { breite, hoehe, kanaele } = raster;
    const n = kern.groesse;
    this.pruefeGroesse(breite, hoehe);
    const gl = this.gl;
    const p = this.programm(`s|${n}|${kanaele}`, "kernTextur", () => schleifenShader(n, kanaele));
    if (kanaele === 1) this.ladeBild(gl.R32F, gl.RED, breite, hoehe, raster.daten);
    else this.ladeBild(gl.RGB32F, gl.RGB, breite, hoehe, raster.daten);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texKern);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, n, n, 0, gl.RED, gl.FLOAT, kern.daten);
    gl.useProgram(p.programm);
    gl.uniform1i(p.kern, 1);
    const rgba = this.zeichne(p, breite, hoehe);

    const ergebnis = neuesRaster(breite, hoehe, kanaele);
    const aus = ergebnis.daten;
    const pixel = breite * hoehe;
    for (let i = 0; i < pixel; i++) {
      for (let c = 0; c < kanaele; c++) aus[i * kanaele + c] = rgba[4 * i + c] as number;
    }
    return ergebnis;
  }

  private pruefeGroesse(breite: number, hoehe: number): void {
    if (breite > this.maxTextur || hoehe > this.maxTextur) {
      throw new ZuGrossFuerTextur(breite, hoehe, this.maxTextur);
    }
  }

  private ladeBild(format: number, quellformat: number, breite: number, hoehe: number, daten: Float32Array): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texBild);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, breite, hoehe, 0, quellformat, gl.FLOAT, daten);
  }

  /** Zeichnet breite x hoehe Fragmente in die Zieltextur und liest sie als RGBA-Floats zurueck. */
  private zeichne(p: Programm, breite: number, hoehe: number): Float32Array {
    const gl = this.gl;
    this.bereiteZielVor(breite, hoehe);
    gl.viewport(0, 0, breite, hoehe);
    gl.uniform1i(p.bild, 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // readPixels wartet auf das Ende der Faltung. RGBA/FLOAT ist fuer RGBA32F immer erlaubt.
    const rgba = new Float32Array(breite * hoehe * 4);
    gl.readPixels(0, 0, breite, hoehe, gl.RGBA, gl.FLOAT, rgba);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    return rgba;
  }

  /** Programm nach Schluessel, beim ersten Gebrauch uebersetzt. */
  private programm(schluessel: string, kernUniform: string, quelltext: () => string): Programm {
    const vorhanden = this.programme.get(schluessel);
    if (vorhanden) return vorhanden;
    const gl = this.gl;
    const vs = uebersetze(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    let fs: WebGLShader | null = null;
    let programm: WebGLProgram;
    try {
      fs = uebersetze(gl, gl.FRAGMENT_SHADER, quelltext());
      programm = pruefeObjekt(gl.createProgram());
      gl.attachShader(programm, vs);
      gl.attachShader(programm, fs);
      gl.linkProgram(programm);
    } finally {
      // Auch wenn der Fragment-Shader scheitert: kein verwaister Vertex-Shader.
      gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    }
    if (!gl.getProgramParameter(programm, gl.LINK_STATUS)) {
      if (this.verloren) throw new KontextVerloren();
      const log = gl.getProgramInfoLog(programm);
      gl.deleteProgram(programm);
      throw new Error(`WebGL2: Shader-Programm nicht gebunden: ${log ?? ""}`);
    }
    const p: Programm = {
      programm,
      bild: gl.getUniformLocation(programm, "bild"),
      kern: gl.getUniformLocation(programm, kernUniform)
    };
    this.programme.set(schluessel, p);
    return p;
  }

  /** Zieltextur (nur bei Groessenwechsel neu) an den Framebuffer haengen. */
  private bereiteZielVor(breite: number, hoehe: number): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.ziel);
    if (breite === this.zielBreite && hoehe === this.zielHoehe) return;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.texZiel);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, breite, hoehe, 0, gl.RGBA, gl.FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texZiel, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      if (this.verloren) throw new KontextVerloren();
      throw new Error(`WebGL2: Framebuffer unvollstaendig (${status})`);
    }
    this.zielBreite = breite;
    this.zielHoehe = hoehe;
  }
}

function neueZeichenflaeche(): Zeichenflaeche | null {
  if (typeof document !== "undefined") return document.createElement("canvas");
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(1, 1);
  return null;
}

function neueTextur(gl: WebGL2RenderingContext): WebGLTexture {
  const t = pruefeObjekt(gl.createTexture());
  gl.bindTexture(gl.TEXTURE_2D, t);
  // Float-Texturen sind nicht filterbar; texelFetch braucht keinen Filter, NEAREST haelt sie vollstaendig.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

function uebersetze(gl: WebGL2RenderingContext, typ: number, quelltext: string): WebGLShader {
  const shader = pruefeObjekt(gl.createShader(typ));
  gl.shaderSource(shader, quelltext);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (gl.isContextLost()) throw new KontextVerloren();
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL2: Shader nicht uebersetzt: ${log ?? ""}`);
  }
  return shader;
}

/** create* liefert bei verlorenem Kontext null. */
function pruefeObjekt<T>(objekt: T | null): T {
  if (objekt === null) throw new KontextVerloren();
  return objekt;
}

// ---------- Wahl des Falters ----------

/** Welcher Adapter rechnet. */
export type FalterArt = "webgl2" | "javascript";

/**
 * Warum: "webgl2" (verfuegbar), "kein-webgl2" (kein Kontext oder kein Float-Rendering, auch in
 * Node), "kontextverlust" (WebGL2 lief, der Kontext ging verloren), "webgl2-fehler" (Shader oder
 * Framebuffer versagten). Die UI macht daraus einen Hinweis (Texte in src/texte.ts).
 */
export type FalterGrund = "webgl2" | "kein-webgl2" | "kontextverlust" | "webgl2-fehler";

export interface FalterWahlOptionen {
  /** Flaeche fuer den Kontext; ohne Angabe legt FalterWebgl2 eine eigene an. */
  flaeche?: Zeichenflaeche;
  /** Ersatz fuer FalterWebgl2.erzeuge, z. B. um WebGL2 abzuschalten (liefert null). */
  erzeugeWebgl2?: () => Falter | null;
  /** Wird gerufen, wenn der Falter von WebGL2 auf JavaScript wechselt (UI: Hinweis, Anzeigegrenze). */
  beiWechsel?: (wahl: Falterwahl) => void;
}

/**
 * Ergebnis von waehleFalter, selbst ein Falter: rechnet mit WebGL2, solange es geht, und danach
 * mit FalterJs. art, grund und anzeigeGrenzePx geben den aktuellen Stand fuer die UI.
 */
export interface Falterwahl extends Falter {
  readonly art: FalterArt;
  readonly grund: FalterGrund;
  /** ANZEIGEGRENZE_OHNE_WEBGL2_PX, solange JavaScript rechnet, sonst null (keine Grenze). */
  readonly anzeigeGrenzePx: number | null;
}

class GewaehlterFalter implements Falterwahl {
  private webgl2: Falter | null;
  private readonly js = new FalterJs();
  grund: FalterGrund;

  constructor(webgl2: Falter | null, private readonly beiWechsel?: (wahl: Falterwahl) => void) {
    this.webgl2 = webgl2;
    this.grund = webgl2 ? "webgl2" : "kein-webgl2";
  }

  get art(): FalterArt {
    return this.webgl2 ? "webgl2" : "javascript";
  }

  get anzeigeGrenzePx(): number | null {
    return this.webgl2 ? null : ANZEIGEGRENZE_OHNE_WEBGL2_PX;
  }

  falte(raster: Raster, kern: Kern): Raster {
    if (this.webgl2) {
      try {
        return this.webgl2.falte(raster, kern);
      } catch (fehler) {
        // Fehler in Raster oder Kern gelten fuer beide Adapter: weiterwerfen, nicht wechseln.
        if (fehler instanceof BildFehler) throw fehler;
        // Zu grosses Raster: nur diesen Auftrag mit JavaScript rechnen, WebGL2 bleibt gewaehlt.
        if (fehler instanceof ZuGrossFuerTextur) return this.js.falte(raster, kern);
        this.wechsle(fehler instanceof KontextVerloren ? "kontextverlust" : "webgl2-fehler", fehler);
      }
    }
    return this.js.falte(raster, kern);
  }

  private wechsle(grund: FalterGrund, fehler: unknown): void {
    const alt = this.webgl2;
    this.webgl2 = null;
    this.grund = grund;
    if (alt instanceof FalterWebgl2 && grund !== "kontextverlust") alt.freigeben();
    console.warn(`Faltung: WebGL2 abgeschaltet (${grund}), weiter mit JavaScript`, fehler);
    this.beiWechsel?.(this);
  }
}

/**
 * Waehlt den Falter: WebGL2, wenn ein Kontext mit Float-Rendering zu haben ist, sonst FalterJs
 * (auch in Node, ohne Fehler). Das Ergebnis meldet die Wahl und faellt bei Kontextverlust oder
 * WebGL2-Fehler dauerhaft auf FalterJs zurueck, statt abzustuerzen.
 */
export function waehleFalter(optionen: FalterWahlOptionen = {}): Falterwahl {
  const erzeuge = optionen.erzeugeWebgl2 ?? (() => FalterWebgl2.erzeuge(optionen.flaeche));
  let webgl2: Falter | null = null;
  try {
    webgl2 = erzeuge();
  } catch {
    webgl2 = null;
  }
  return new GewaehlterFalter(webgl2, optionen.beiWechsel);
}
