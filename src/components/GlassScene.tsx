/**
 * GlassScene — the realistic 3D layer.
 *
 * A single-pass raymarched glass renderer written directly against WebGL2.
 * It reproduces the look normally reached for with three.js MeshPhysicalMaterial
 * (transmission, IOR, clearcoat, iridescence, attenuation) without shipping a
 * 3D engine, so the scene works offline and adds zero bytes of dependency.
 *
 * How the physical look is assembled
 *   • env()          procedural HDR environment — four coloured lobes plus a
 *                    sharp key disc, standing in for a PMREM-prefiltered probe.
 *   • outer march    finds the front surface of the glass.
 *   • inner march    walks the ray *inside* the solid to find the exit surface,
 *                    which is what makes the refraction read as thickness
 *                    rather than a screen-space fake.
 *   • Beer–Lambert   exp(-distance * sigma) tints light by how far it travelled
 *                    through the medium — the reason thick parts go deep green.
 *   • Schlick        Fresnel mix between transmission and reflection.
 *   • thin film      view-dependent hue shift for the iridescent edge sheen.
 *   • ACES + dither  filmic rolloff, then 1/255 noise to kill gradient banding.
 *
 * Performance notes
 *   • All object transforms are precomputed on the CPU and uploaded as mat3
 *     uniforms, so map() contains no trig at all — the knot's cos(3a)/sin(3a)
 *     terms use Chebyshev identities instead of atan.
 *   • The canvas renders at a fraction of CSS resolution and is scaled up by
 *     the compositor; the slight softness reads as depth of field.
 *   • Low-power devices get fewer march steps and a smaller buffer.
 *   • prefers-reduced-motion renders exactly one static frame.
 */

import { useEffect, useRef, useState } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   SHADERS
   ══════════════════════════════════════════════════════════════════════════ */

const VERT = `#version 300 es
precision highp float;
void main() {
  // Full-screen triangle: no attribute buffers needed.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

/** Marker replaced at compile time with quality #defines (see below). */
const QUALITY_MARKER = '/*__QUALITY__*/';

const FRAG = `#version 300 es
precision highp float;

${QUALITY_MARKER}

out vec4 fragColor;

uniform vec2  u_res;
uniform vec3  u_ro;        // ray origin, already in scene space
uniform vec3  u_camR;      // camera basis, already in scene space
uniform vec3  u_camU;
uniform vec3  u_camF;
uniform float u_focal;

uniform mat3  u_heroM;     // world -> hero local (uploaded row-major = transpose)
uniform vec3  u_heroT;
uniform float u_heroS;
uniform vec2  u_heroPhase; // (cos phase, sin phase) for the knot lobes

uniform mat3  u_satM0;
uniform vec3  u_satT0;
uniform vec3  u_satT1;
uniform mat3  u_satM2;
uniform vec3  u_satT2;

uniform float u_exposure;
uniform float u_seed;

#define IOR       1.45
#define SURF      0.0016
#define MAXD      30.0
#define ABSORB    vec3(0.62, 0.16, 0.34)   // per-unit extinction -> green tint

/* ── Signed distance primitives ─────────────────────────────────────────── */

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdOcta(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/* A trefoil-flavoured torus: the tube radius and centreline height are both
   modulated by cos(3a) / sin(3a). Those are evaluated with the triple-angle
   identities so the whole primitive is free of transcendental functions. */
float sdKnot(vec3 p, float R, float r, vec2 phase) {
  float l  = max(length(p.xz), 1e-4);
  float c  = p.x / l;
  float s  = p.z / l;
  float c3 = c * (4.0 * c * c - 3.0);   // cos 3a
  float s3 = s * (3.0 - 4.0 * s * s);   // sin 3a
  float ca = c3 * phase.x - s3 * phase.y;
  float sa = s3 * phase.x + c3 * phase.y;
  vec2  q  = vec2(l - (R + 0.17 * ca), p.y - 0.30 * sa);
  return length(q) - r;
}

/* ── Scene ──────────────────────────────────────────────────────────────── */

float map(vec3 p) {
  vec3 h = u_heroM * (p - u_heroT);
  float d = sdKnot(h / u_heroS, 1.0, 0.34, u_heroPhase) * u_heroS;

  vec3 a = u_satM0 * (p - u_satT0);
  d = min(d, sdOcta(a, 0.30) - 0.055);

  d = min(d, sdSphere(p - u_satT1, 0.29));

  vec3 c = u_satM2 * (p - u_satT2);
  d = min(d, sdBox(c, vec3(0.18)) - 0.055);

  return d;
}

/* Tetrahedral normal — four map() calls instead of six. */
vec3 calcNormal(vec3 p) {
  const float h = 0.0014;
  const vec2  k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(p + k.xyy * h) +
    k.yyx * map(p + k.yyx * h) +
    k.yxy * map(p + k.yxy * h) +
    k.xxx * map(p + k.xxx * h)
  );
}

/* ── Procedural HDR environment ─────────────────────────────────────────── */

vec3 env(vec3 d) {
  vec3 c = vec3(0.014, 0.028, 0.024);

  // Leaf key light, upper right.
  c += vec3(0.30, 1.00, 0.58) *
       pow(max(dot(d, normalize(vec3(0.75, 0.55, 0.35))), 0.0), 3.0) * 0.62;

  // Teal rim, lower left.
  c += vec3(0.05, 0.60, 0.56) *
       pow(max(dot(d, normalize(vec3(-0.85, -0.25, 0.45))), 0.0), 2.6) * 0.42;

  // Mint bounce from below.
  c += vec3(0.62, 1.00, 0.84) *
       pow(max(dot(d, normalize(vec3(0.05, -0.95, -0.30))), 0.0), 4.0) * 0.30;

  // Cool counter-light keeps the shadow side from going muddy green.
  c += vec3(0.14, 0.20, 0.34) *
       pow(max(dot(d, normalize(vec3(-0.20, 0.90, -0.40))), 0.0), 1.6) * 0.26;

  // Small bright disc: the crisp specular streak that sells "polished".
  c += vec3(1.0, 1.0, 0.96) *
       pow(max(dot(d, normalize(vec3(0.42, 0.80, 0.44))), 0.0), 320.0) * 7.5;

  return c;
}

/* ── Tonemap / dither ───────────────────────────────────────────────────── */

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233)) + u_seed) * 43758.5453);
}

/* ── Main ───────────────────────────────────────────────────────────────── */

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / u_res.y;
  vec3 rd = normalize(uv.x * u_camR + uv.y * u_camU + u_focal * u_camF);
  vec3 ro = u_ro;

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < SURF) { hit = true; break; }
    t += d;
    if (t > MAXD) break;
  }

  vec3 col;
  float alpha;

  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    float ndv  = max(dot(-rd, n), 0.0);
    float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

    // Reflection lobe.
    vec3 refl = env(reflect(rd, n));

    // Transmission: walk the interior to the exit surface.
    vec3  rdIn = refract(rd, n, 1.0 / IOR);
    vec3  pIn  = p - n * 0.02;
    float trav = 0.0;
    for (int i = 0; i < ISTEPS; i++) {
      float d = -map(pIn);
      if (d < SURF) break;
      pIn  += rdIn * d;
      trav += d;
      if (trav > 9.0) break;
    }
    vec3 nIn   = -calcNormal(pIn);
    vec3 rdOut = refract(rdIn, nIn, IOR);
    if (dot(rdOut, rdOut) < 0.5) rdOut = reflect(rdIn, nIn);  // total internal reflection

    vec3 trans = env(rdOut);

    // Beer–Lambert: thicker paths absorb more, and absorb unevenly by channel.
    trans *= exp(-ABSORB * trav);

    // Thin-film iridescence, strongest at grazing angles.
    float ir = pow(1.0 - ndv, 2.0);
    vec3 irid = 0.5 + 0.5 * cos(6.28318 * (vec3(0.00, 0.33, 0.67) + ir * 2.2 + 0.15));
    trans *= mix(vec3(1.0), irid, 0.32);

    col = mix(trans, refl, fres);

    // Clearcoat: a second, tighter specular lobe on top of everything.
    vec3 L = normalize(vec3(0.42, 0.80, 0.44));
    vec3 H = normalize(L - rd);
    col += vec3(1.0, 1.0, 0.95) * pow(max(dot(n, H), 0.0), 190.0) * 2.4;

    // Rim bloom so the silhouette separates from the page behind it.
    col += vec3(0.48, 1.00, 0.77) * pow(1.0 - ndv, 3.2) * 0.42;

    alpha = 1.0;
  } else {
    // Misses contribute only the environment's glow, so the CSS wash behind
    // the canvas stays visible instead of being replaced by a black rectangle.
    vec3 e = env(rd);
    col = e * 0.55;
    alpha = clamp(dot(col, vec3(0.299, 0.587, 0.114)) * 1.9, 0.0, 0.82);
  }

  col = aces(col * u_exposure);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(col, alpha);
}`;

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

export interface GlassSceneProps {
  /** Class applied to the wrapping element. */
  className?: string;
  /** Compact mode: no scroll choreography, tighter framing, dimmer key. */
  compact?: boolean;
  /** Exposure multiplier before the filmic curve. */
  exposure?: number;
}

interface Uniforms {
  res: WebGLUniformLocation | null;
  ro: WebGLUniformLocation | null;
  camR: WebGLUniformLocation | null;
  camU: WebGLUniformLocation | null;
  camF: WebGLUniformLocation | null;
  focal: WebGLUniformLocation | null;
  heroM: WebGLUniformLocation | null;
  heroT: WebGLUniformLocation | null;
  heroS: WebGLUniformLocation | null;
  heroPhase: WebGLUniformLocation | null;
  satM0: WebGLUniformLocation | null;
  satT0: WebGLUniformLocation | null;
  satT1: WebGLUniformLocation | null;
  satM2: WebGLUniformLocation | null;
  satT2: WebGLUniformLocation | null;
  exposure: WebGLUniformLocation | null;
  seed: WebGLUniformLocation | null;
}

/* ══════════════════════════════════════════════════════════════════════════
   MATH HELPERS
   Rotation matrices are written row-major into the upload buffer. Because
   uniformMatrix3fv(transpose = false) reads column-major, that upload lands in
   the shader already transposed — which is exactly the world -> local matrix
   we want, at no runtime cost.
   ══════════════════════════════════════════════════════════════════════════ */

/** R = Rx(ax) · Ry(ay), written row-major. */
function writeRotXY(out: Float32Array, ax: number, ay: number): void {
  const sa = Math.sin(ax);
  const ca = Math.cos(ax);
  const sb = Math.sin(ay);
  const cb = Math.cos(ay);
  out[0] = cb;       out[1] = 0;   out[2] = sb;
  out[3] = sa * sb;  out[4] = ca;  out[5] = -sa * cb;
  out[6] = -ca * sb; out[7] = sa;  out[8] = ca * cb;
}

/** R = Rz(az) · Ry(ay), written row-major. */
function writeRotZY(out: Float32Array, az: number, ay: number): void {
  const sg = Math.sin(az);
  const cg = Math.cos(az);
  const sb = Math.sin(ay);
  const cb = Math.cos(ay);
  out[0] = cg * cb; out[1] = -sg; out[2] = cg * sb;
  out[3] = sg * cb; out[4] = cg;  out[5] = sg * sb;
  out[6] = -sb;     out[7] = 0;   out[8] = cb;
}

/** Applies the transpose of a row-major 3x3 to a vector: v -> Rᵀ·v. */
function applyTranspose(
  m: Float32Array,
  x: number,
  y: number,
  z: number,
  out: Float32Array,
): void {
  out[0] = m[0] * x + m[3] * y + m[6] * z;
  out[1] = m[1] * x + m[4] * y + m[7] * z;
  out[2] = m[2] * x + m[5] * y + m[8] * z;
}

function normalize3(v: Float32Array): void {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  v[0] /= l;
  v[1] /= l;
  v[2] /= l;
}

function cross3(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  out: Float32Array,
): void {
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surfaced in the console rather than thrown: a shader failure should
    // degrade to the CSS background, never blank the page.
    console.warn('[GlassScene] shader compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function GlassScene({
  className,
  compact = false,
  exposure = 1.06,
}: GlassSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bumped when the driver restores a lost context. Every GL object dies with
  // the context, so re-running the effect is the only honest way to rebuild them.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const low =
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth < 820 ||
      (navigator.hardwareConcurrency ?? 4) <= 4;

    const steps = low ? 56 : 84;
    const iSteps = low ? 16 : 28;
    const resScale = low ? 0.5 : compact ? 0.68 : 0.62;

    const frag = FRAG.replace(
      QUALITY_MARKER,
      `#define STEPS ${steps}\n#define ISTEPS ${iSteps}`,
    );

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
    const prog = vs && fs ? gl.createProgram() : null;

    // A raymarcher is the first thing a weak driver refuses. Failing quietly to
    // a transparent canvas keeps the page intact, and the shaders are released
    // on every exit path so a refusal costs nothing.
    if (!vs || !fs || !prog) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[GlassScene] link failed:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }
    gl.useProgram(prog);

    const u: Uniforms = {
      res: gl.getUniformLocation(prog, 'u_res'),
      ro: gl.getUniformLocation(prog, 'u_ro'),
      camR: gl.getUniformLocation(prog, 'u_camR'),
      camU: gl.getUniformLocation(prog, 'u_camU'),
      camF: gl.getUniformLocation(prog, 'u_camF'),
      focal: gl.getUniformLocation(prog, 'u_focal'),
      heroM: gl.getUniformLocation(prog, 'u_heroM'),
      heroT: gl.getUniformLocation(prog, 'u_heroT'),
      heroS: gl.getUniformLocation(prog, 'u_heroS'),
      heroPhase: gl.getUniformLocation(prog, 'u_heroPhase'),
      satM0: gl.getUniformLocation(prog, 'u_satM0'),
      satT0: gl.getUniformLocation(prog, 'u_satT0'),
      satT1: gl.getUniformLocation(prog, 'u_satT1'),
      satM2: gl.getUniformLocation(prog, 'u_satM2'),
      satT2: gl.getUniformLocation(prog, 'u_satT2'),
      exposure: gl.getUniformLocation(prog, 'u_exposure'),
      seed: gl.getUniformLocation(prog, 'u_seed'),
    };

    gl.uniform1f(u.exposure, exposure);
    gl.uniform1f(u.focal, compact ? 2.2 : 2.605); // 42° vertical FOV
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );

    /* ── Scratch buffers (allocated once, mutated per frame) ─────────────── */
    const mHero = new Float32Array(9);
    const mSat0 = new Float32Array(9);
    const mSat2 = new Float32Array(9);
    const mRig = new Float32Array(9);
    const vTmp = new Float32Array(3);
    const vRo = new Float32Array(3);
    const vR = new Float32Array(3);
    const vU = new Float32Array(3);
    const vF = new Float32Array(3);
    const vHeroT = new Float32Array(3);
    const vSatT0 = new Float32Array(3);
    const vSatT1 = new Float32Array(3);
    const vSatT2 = new Float32Array(3);

    /* ── Pointer + scroll state, exponentially damped ────────────────────── */
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let scroll = 0;
    let scrollCur = 0;

    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    const readScroll = () => {
      if (compact) {
        scroll = 0;
        return;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    /* ── Reduced-motion still ─────────────────────────────────────────────────
       The pose is composed up front so that the frame `resize` paints below is
       already the intended one, rather than a camera sitting at the origin.
       ──────────────────────────────────────────────────────────────────────── */
    const STILL = 2.4;
    if (reduce) {
      cur.x = 0.18;
      cur.y = 0.1;
      scrollCur = 0;
    }

    /* ── Sizing ──────────────────────────────────────────────────────────── */
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.4 : 1.9);
      const nw = Math.max(1, Math.round(rect.width * dpr * resScale));
      const nh = Math.max(1, Math.round(rect.height * dpr * resScale));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      // Resizing the backing store clears it. The animated path repaints next
      // frame; the reduced-motion path has no loop, so without this the panel
      // goes permanently black the first time the layout moves.
      if (reduce) draw(STILL);
    };

    /* ── Frame ───────────────────────────────────────────────────────────── */
    const draw = (t: number) => {
      const s = scrollCur;

      // Hero: the portfolio's rotation/scale/bob choreography, evaluated on CPU.
      const heroRx = -(t * 0.11 + s * Math.PI * 1.5);
      const heroRy = -(t * 0.16 + s * Math.PI * 2);
      writeRotXY(mHero, heroRx, heroRy);
      const heroS = (1 + Math.sin(t * 0.55) * 0.045) * (1 - s * 0.22) * (compact ? 0.78 : 1);
      vHeroT[0] = 0;
      vHeroT[1] = Math.sin(t * 0.9) * 0.12;
      vHeroT[2] = 0;

      // Satellites: drift on x, rise with scroll on y.
      const lift = s * 2.4;
      writeRotXY(mSat0, t * 0.21, t * 0.34);
      vSatT0[0] = -3.05 + Math.cos(t * 0.41) * 0.14;
      vSatT0[1] = 1.05 + lift + Math.sin(t * 0.55) * 0.22;
      vSatT0[2] = -1.4;

      vSatT1[0] = 2.95 + Math.cos(t * 0.6) * 0.14;
      vSatT1[1] = -1.3 + lift + Math.sin(t * 0.8) * 0.22;
      vSatT1[2] = -0.9;

      writeRotZY(mSat2, t * 0.27, t * 0.19);
      vSatT2[0] = 2.1 + Math.cos(t * 0.5) * 0.14;
      vSatT2[1] = 2.0 + lift + Math.sin(t * 0.67) * 0.22;
      vSatT2[2] = -2.6;

      // Rig: pointer-driven rotation plus a scroll translation. Folding it into
      // the ray keeps map() free of any per-sample rig maths.
      writeRotXY(mRig, -cur.y * 0.22, cur.x * 0.32);
      const rigTy = s * 1.6;
      const rigTz = -s * 2.4;

      // Camera in world space.
      const roX = cur.x * 0.55;
      const roY = cur.y * 0.4 + s * 0.5;
      const roZ = compact ? 5.4 : 6.6;
      const taY = s * 1.2;

      // Forward / right / up.
      vF[0] = 0 - roX;
      vF[1] = taY - roY;
      vF[2] = 0 - roZ;
      normalize3(vF);
      cross3(vF[0], vF[1], vF[2], 0, 1, 0, vR);
      normalize3(vR);
      cross3(vR[0], vR[1], vR[2], vF[0], vF[1], vF[2], vU);

      // Move ray origin and basis into scene space: p_scene = Rrigᵀ·(p_world − T).
      applyTranspose(mRig, roX, roY - rigTy, roZ - rigTz, vRo);
      applyTranspose(mRig, vR[0], vR[1], vR[2], vTmp);
      vR.set(vTmp);
      applyTranspose(mRig, vU[0], vU[1], vU[2], vTmp);
      vU.set(vTmp);
      applyTranspose(mRig, vF[0], vF[1], vF[2], vTmp);
      vF.set(vTmp);

      const phase = t * 0.35;

      gl.uniformMatrix3fv(u.heroM, false, mHero);
      gl.uniform3fv(u.heroT, vHeroT);
      gl.uniform1f(u.heroS, heroS);
      gl.uniform2f(u.heroPhase, Math.cos(phase), Math.sin(phase));
      gl.uniformMatrix3fv(u.satM0, false, mSat0);
      gl.uniform3fv(u.satT0, vSatT0);
      gl.uniform3fv(u.satT1, vSatT1);
      gl.uniformMatrix3fv(u.satM2, false, mSat2);
      gl.uniform3fv(u.satT2, vSatT2);
      gl.uniform3fv(u.ro, vRo);
      gl.uniform3fv(u.camR, vR);
      gl.uniform3fv(u.camU, vU);
      gl.uniform3fv(u.camF, vF);
      gl.uniform1f(u.seed, (t * 60) % 1000);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /* ── Loop / teardown ─────────────────────────────────────────────────── */
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let alive = true;
    let lost = false;

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const onContextLost = (e: Event) => {
      // Without preventDefault the browser never offers a restore.
      e.preventDefault();
      lost = true;
      alive = false;
      cancelAnimationFrame(raf);
    };
    const onContextRestored = () => setGeneration((n) => n + 1);

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // Reduced motion starts nothing: the pose was composed above and `resize`
    // has already painted it, repainting on any size change. No listeners, no
    // loop, exactly one frame per size.
    if (!reduce) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', readScroll, { passive: true });
      window.addEventListener('resize', readScroll);
      readScroll();

      const tick = (now: number) => {
        if (!alive) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        elapsed += dt;

        // Frame-rate independent damping: the same visual easing at 30 or 144Hz.
        const k = 1 - Math.pow(0.0015, dt);
        cur.x += (target.x - cur.x) * k;
        cur.y += (target.y - cur.y) * k;
        const sk = 1 - Math.pow(0.002, dt);
        scrollCur += (scroll - scrollCur) * sk;

        draw(elapsed);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      gl.deleteProgram(prog);
      // Right on unmount, wrong when this run is being replaced after a restore:
      // `getContext` returns the same object, so losing it again would kill the
      // context the next run is about to draw into.
      if (!lost) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [compact, exposure, generation]);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
