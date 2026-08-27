/**
 * AnimatedGradient — the WebGL2 gradient background.
 *
 * This is the "paper-shaders" style field: a soft three-colour blend pushed
 * through domain noise and an iterative swirl, with an optional shape overlay
 * (checks / stripes / edge). The fragment shader and parameter model are the
 * reference implementation; the presets here carry EcoCircuit's palette and are
 * deliberately dark-dominant (colour 1 and often colour 3 are near-black), so
 * the page reads as a dark theme with living green light rather than a bright
 * wash.
 *
 * Kept from this project's own version: no "use client", a global `opacity`
 * uniform, reduced-motion handling, and rebuild-on-context-loss — decoration
 * must never take the page down.
 */

import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

export type PatternShape = 'checks' | 'stripes' | 'edge';

export type GradientPreset =
  | 'mist'
  | 'prism'
  | 'pulse'
  | 'lava'
  | 'plasma'
  | 'vortex';

/** Parameters use the reference's 0–100 ranges so presets stay easy to tune. */
export interface GradientConfig {
  /** Three ramp stops, low → high. Accepts hex, rgb(), rgba(), hsl(), hsla(). */
  colors: [string, string, string];
  rotation: number; // degrees
  proportion: number; // 0–100
  scale: number; // 0–1+
  speed: number; // 0–100
  distortion: number; // 0–100
  swirl: number; // 0–100
  swirlIterations: number; // 1–30
  softness: number; // 0–100
  offset: number; // phase offset
  shape: PatternShape;
  shapeSize: number; // 0–100
}

export interface AnimatedGradientProps {
  preset?: GradientPreset;
  config?: Partial<GradientConfig>;
  /** Layer opacity, applied in the shader's alpha channel. */
  opacity?: number;
  className?: string;
}

const SHAPE_ID: Record<PatternShape, number> = {
  checks: 0,
  stripes: 1,
  edge: 2,
};

/* ══════════════════════════════════════════════════════════════════════════
   PRESETS  (EcoCircuit palette, dark-dominant so the theme stays dark)
   ══════════════════════════════════════════════════════════════════════════ */

const BASE: GradientConfig = {
  colors: ['#04090c', '#0d9488', '#04090c'],
  rotation: 0,
  proportion: 35,
  scale: 0.45,
  speed: 26,
  distortion: 6,
  swirl: 60,
  swirlIterations: 8,
  softness: 100,
  offset: 0,
  shape: 'edge',
  shapeSize: 40,
};

const PRESETS: Record<GradientPreset, Partial<GradientConfig>> = {
  // Home / interior background — a living green nebula drifting over near-black
  // (colour 1 & 3 near-black, colour 2 the leaf green). Soft "checks" field so
  // the swirl reads as slow-moving light rather than a static band.
  mist: {
    colors: ['#04090c', '#17c964', '#03170f'],
    rotation: 12,
    proportion: 42,
    scale: 0.55,
    speed: 32,
    distortion: 8,
    swirl: 72,
    swirlIterations: 6,
    softness: 94,
    offset: -120,
    shape: 'checks',
    shapeSize: 22,
  },
  // Behind the login card — a smoother, deeper prism of teal→mint over black.
  prism: {
    colors: ['#03080b', '#0b6b5f', '#2ce6a0'],
    rotation: -46,
    proportion: 52,
    scale: 0.34,
    speed: 26,
    distortion: 3,
    swirl: 58,
    swirlIterations: 13,
    softness: 60,
    offset: -160,
    shape: 'checks',
    shapeSize: 40,
  },
  // Breathing radial energy — green core fading to black.
  pulse: {
    colors: ['#17c964', '#04090c', '#04090c'],
    rotation: -167,
    proportion: 90,
    scale: 0.12,
    speed: 22,
    distortion: 40,
    swirl: 74,
    swirlIterations: 3,
    softness: 34,
    offset: -813,
    shape: 'checks',
    shapeSize: 78,
  },
  // Warm accent variant for alert / EPR contexts.
  lava: {
    colors: ['#f5a524', '#8a2d0f', '#0a0604'],
    rotation: 114,
    proportion: 100,
    scale: 0.52,
    speed: 26,
    distortion: 7,
    swirl: 20,
    swirlIterations: 18,
    softness: 100,
    offset: 717,
    shape: 'edge',
    shapeSize: 14,
  },
  // High-contrast mint plasma over black — good for short hero moments.
  plasma: {
    colors: ['#7bf1c4', '#04120a', '#04090c'],
    rotation: 0,
    proportion: 60,
    scale: 0.7,
    speed: 28,
    distortion: 5,
    swirl: 60,
    swirlIterations: 5,
    softness: 100,
    offset: -168,
    shape: 'checks',
    shapeSize: 28,
  },
  // Tight spiral pull toward centre.
  vortex: {
    colors: ['#04090c', '#17c964', '#04090c'],
    rotation: 50,
    proportion: 44,
    scale: 0.4,
    speed: 20,
    distortion: 0,
    swirl: 100,
    swirlIterations: 3,
    softness: 12,
    offset: -744,
    shape: 'stripes',
    shapeSize: 78,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   COLOUR PARSING  (#rgb/#rrggbb/#rrggbbaa, rgb(), rgba(), hsl(), hsla())
   ══════════════════════════════════════════════════════════════════════════ */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p: number, q: number, tIn: number) => {
    let t = tIn;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

export function parseColor(input: string): [number, number, number, number] {
  const s = input.trim();

  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
    const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
    const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
    const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [0, 0, 0, 1];
    return [r, g, b, a];
  }

  const hsl = s.match(/hsla?\(([^)]+)\)/i);
  if (hsl) {
    const parts = hsl[1].split(/[,\s/]+/).filter(Boolean);
    const h = (parseFloat(parts[0]) || 0) / 360;
    const sat = (parseFloat(parts[1]) || 0) / 100;
    const li = (parseFloat(parts[2]) || 0) / 100;
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    const [r, g, b] = hslToRgb(h, sat, li);
    return [r, g, b, a];
  }

  const rgb = s.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    return [
      (parseFloat(parts[0]) || 0) / 255,
      (parseFloat(parts[1]) || 0) / 255,
      (parseFloat(parts[2]) || 0) / 255,
      parts[3] !== undefined ? parseFloat(parts[3]) : 1,
    ];
  }

  return [0, 0, 0, 1];
}

/* ══════════════════════════════════════════════════════════════════════════
   SHADERS
   ══════════════════════════════════════════════════════════════════════════ */

const VERT = `#version 300 es
precision highp float;
in vec4 a_position;
void main() { gl_Position = a_position; }`;

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2  u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4  u_color1;
uniform vec4  u_color2;
uniform vec4  u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
uniform float u_opacity;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);
  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);
  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;
  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 s_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(s_uv.x) * cos(s_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 s_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(s_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(
    u_color1, u_color2, u_color3, mixer,
    1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale
  );

  // Premultiplied output scaled by the layer opacity.
  fragColor = color_mix * u_opacity;
}`;

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
    console.warn('[AnimatedGradient] compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function AnimatedGradient({
  preset = 'mist',
  config,
  opacity = 1,
  className,
}: AnimatedGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolved config is a fresh object every render, so the effect keys off a
  // serialised snapshot and reads live values through a ref — an inline config
  // prop can't thrash the GL context, but a real value change still rebuilds.
  const cfg: GradientConfig = { ...BASE, ...PRESETS[preset], ...config };
  const cfgKey = JSON.stringify(cfg);
  const cfgRef = useLatest(cfg);
  const opacityRef = useLatest(opacity);

  // Bumped when the driver restores a lost context: every GL object died with
  // it, so re-running the effect is the only honest way to rebuild them.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const cfg = cfgRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;

    // Failure leaves the layer transparent instead of throwing: this is
    // decoration, and a driver that can't compile it must not take the page
    // down. Shaders are released on every exit, so a rejected compile leaks
    // nothing.
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
      console.warn('[AnimatedGradient] link failed:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }
    gl.useProgram(prog);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const loc = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      time: loc('u_time'),
      res: loc('u_resolution'),
      pr: loc('u_pixelRatio'),
      opacity: loc('u_opacity'),
    };

    // Static uniforms — set once, they never change within a generation.
    const [r1, g1, b1, a1] = parseColor(cfg.colors[0]);
    const [r2, g2, b2, a2] = parseColor(cfg.colors[1]);
    const [r3, g3, b3, a3] = parseColor(cfg.colors[2]);
    gl.uniform4f(loc('u_color1'), r1, g1, b1, a1);
    gl.uniform4f(loc('u_color2'), r2, g2, b2, a2);
    gl.uniform4f(loc('u_color3'), r3, g3, b3, a3);
    gl.uniform1f(loc('u_scale'), cfg.scale);
    gl.uniform1f(loc('u_rotation'), (cfg.rotation * Math.PI) / 180);
    gl.uniform1f(loc('u_proportion'), cfg.proportion / 100);
    gl.uniform1f(loc('u_softness'), cfg.softness / 100);
    gl.uniform1f(loc('u_shape'), SHAPE_ID[cfg.shape]);
    gl.uniform1f(loc('u_shapeScale'), cfg.shapeSize / 100);
    gl.uniform1f(loc('u_distortion'), cfg.distortion / 50);
    gl.uniform1f(loc('u_swirl'), cfg.swirl / 100);
    gl.uniform1f(loc('u_swirlIterations'), cfg.swirl === 0 ? 0 : cfg.swirlIterations);

    // Premultiplied-alpha blending over the dark page background.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const low =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;
    const resScale = low ? 0.45 : 0.65;
    const speed = (cfg.speed / 100) * 5;
    const phase = cfg.offset * 0.01;

    /** Timestamp of the single frame drawn under reduced motion. */
    const STILL = 8;

    let prShader = 1;
    let w = 0;
    let h = 0;

    /* render-loop-placeholder */

    const render = (time: number) => {
      gl.uniform1f(u.time, time * speed + phase);
      gl.uniform1f(u.opacity, opacityRef.current);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      // Buffer size is scaled down for fill-rate; u_pixelRatio carries the same
      // factor so the shader's UV scale stays independent of the buffer size.
      prShader = dpr * resScale;
      const nw = Math.max(1, Math.round(rect.width * prShader));
      const nh = Math.max(1, Math.round(rect.height * prShader));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.pr, prShader);
      // Assigning width/height clears the buffer. The animated path repaints
      // next frame, but the reduced-motion path has no loop to recover.
      if (reduce) render(STILL);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let alive = true;
    let lost = false;

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

    // Under reduced motion nothing loops: `resize` already painted the still
    // frame and repaints on any size change. Exactly one frame per size.
    if (!reduce) {
      const start = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        render((now - start) / 1000);
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
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
      // Releasing the context is right on unmount, but wrong when this run is
      // being replaced after a restore: getContext returns the same object, so
      // losing it again would kill the one the next run needs.
      if (!lost) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [cfgKey, cfgRef, opacityRef, generation]);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
