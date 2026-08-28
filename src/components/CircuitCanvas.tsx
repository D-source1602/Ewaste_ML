/**
 * CircuitCanvas — Canvas2D PCB-trace layer.
 *
 * A deterministic lattice of pads joined by 45°-chamfered traces, with signal
 * packets travelling the traces and pads breathing on their own phase offsets.
 * Sits between the gradient wash and the glass render to give the background
 * the texture of a board rather than a poster.
 *
 * Deterministic by design: the layout comes from a seeded PRNG, so the same
 * viewport always produces the same board. Nothing is randomised per frame.
 */

import { useEffect, useRef } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

interface Pt {
  x: number;
  y: number;
}

interface Pad {
  x: number;
  y: number;
  r: number;
  /** Phase offset so pads never breathe in unison. */
  phase: number;
  /** true → drawn as a square land, false → a round via. */
  square: boolean;
}

interface Trace {
  pts: Pt[];
  /** Cumulative arc length at each point; last entry is the total. */
  cum: number[];
  len: number;
}

interface Signal {
  trace: number;
  /** Normalised progress along the trace, 0–1. */
  t: number;
  /** Progress per second. */
  speed: number;
  /** 0 = leaf, 1 = mint, 2 = teal. */
  tint: number;
}

export interface CircuitCanvasProps {
  className?: string;
  /** Grid spacing in CSS pixels. Smaller = denser board. */
  spacing?: number;
  /** Layer opacity. */
  opacity?: number;
  /** Layout seed — change it for a different board. */
  seed?: number;
}

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

/** mulberry32 — small, fast, and repeatable across reloads. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Routes a from → b as run / 45° chamfer / run, the way a real autorouter
 * would. Pure right angles read as a wireframe; the chamfer reads as copper.
 */
function route(a: Pt, b: Pt): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = Math.min(Math.abs(dx), Math.abs(dy));
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (k < 1) return [a, b];
  return [
    a,
    { x: b.x - sx * k, y: a.y },
    { x: b.x, y: a.y + sy * k },
    b,
  ];
}

function measure(pts: Pt[]): Trace {
  const cum: number[] = [0];
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cum.push(len);
  }
  return { pts, cum, len };
}

/** Point at normalised progress `t` along a measured trace. */
function pointAt(tr: Trace, t: number, out: Pt): void {
  const d = t * tr.len;
  let i = 1;
  while (i < tr.cum.length - 1 && tr.cum[i] < d) i++;
  const seg = tr.cum[i] - tr.cum[i - 1] || 1;
  const f = (d - tr.cum[i - 1]) / seg;
  const p0 = tr.pts[i - 1];
  const p1 = tr.pts[i];
  out.x = p0.x + (p1.x - p0.x) * f;
  out.y = p0.y + (p1.y - p0.y) * f;
}

const TINTS: [number, number, number][] = [
  [23, 201, 100], // leaf
  [123, 241, 196], // mint
  [13, 148, 136], // teal
];

/** Pre-rendered radial glow. Blitting a sprite beats shadowBlur per dot. */
function makeGlow(rgb: [number, number, number], size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;
  const half = size / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  const [r, gg, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gg},${b},0.95)`);
  grad.addColorStop(0.22, `rgba(${r},${gg},${b},0.45)`);
  grad.addColorStop(0.55, `rgba(${r},${gg},${b},0.1)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function CircuitCanvas({
  className,
  spacing = 148,
  opacity = 1,
  seed = 20260826,
}: CircuitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const gap = coarse ? spacing * 1.25 : spacing;

    /** Timestamp of the single frame drawn under reduced motion. */
    const STILL = 3.1;

    const glows = TINTS.map((t) => makeGlow(t, 64));

    let w = 0;
    let h = 0;
    let pads: Pad[] = [];
    let traces: Trace[] = [];
    let signals: Signal[] = [];

    /** Rebuilds the board for the current size. Deterministic given `seed`. */
    const build = () => {
      const rng = makeRng(seed);
      const cols = Math.max(3, Math.round(w / gap));
      const rows = Math.max(3, Math.round(h / gap));
      const cw = w / cols;
      const ch = h / rows;

      const grid: Pad[][] = [];
      pads = [];

      for (let r = 0; r <= rows; r++) {
        const row: Pad[] = [];
        for (let c = 0; c <= cols; c++) {
          const pad: Pad = {
            x: c * cw + (rng() - 0.5) * cw * 0.42,
            y: r * ch + (rng() - 0.5) * ch * 0.42,
            r: 1.5 + rng() * 2.2,
            phase: rng() * Math.PI * 2,
            square: rng() > 0.62,
          };
          row.push(pad);
          if (rng() > 0.34) pads.push(pad);
        }
        grid.push(row);
      }

      traces = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const a = grid[r][c];
          // Rightward link.
          if (c < cols && rng() > 0.3) {
            traces.push(measure(route(a, grid[r][c + 1])));
          }
          // Downward link.
          if (r < rows && rng() > 0.42) {
            traces.push(measure(route(a, grid[r + 1][c])));
          }
          // Occasional long diagonal jump for visual rhythm.
          if (r < rows && c < cols && rng() > 0.86) {
            traces.push(measure(route(a, grid[r + 1][c + 1])));
          }
        }
      }

      const count = Math.min(
        coarse ? 12 : 26,
        Math.max(4, Math.round(traces.length * 0.22)),
      );
      signals = [];
      for (let i = 0; i < count; i++) {
        signals.push({
          trace: Math.floor(rng() * traces.length),
          t: rng(),
          speed: 0.1 + rng() * 0.22,
          tint: Math.floor(rng() * 3),
        });
      }
    };

    const head: Pt = { x: 0, y: 0 };
    const tail: Pt = { x: 0, y: 0 };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = opacity;

      // ── Copper ────────────────────────────────────────────────────────
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(123,241,196,0.075)';
      ctx.beginPath();
      for (const tr of traces) {
        ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (let i = 1; i < tr.pts.length; i++) {
          ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
        }
      }
      ctx.stroke();

      // ── Pads ──────────────────────────────────────────────────────────
      for (const p of pads) {
        const puls = 0.5 + 0.5 * Math.sin(time * 0.9 + p.phase);
        ctx.fillStyle = `rgba(23,201,100,${(0.1 + puls * 0.26).toFixed(3)})`;
        if (p.square) {
          ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Signal packets ────────────────────────────────────────────────
      ctx.globalCompositeOperation = 'lighter';
      for (const s of signals) {
        const tr = traces[s.trace];
        if (!tr) continue;

        pointAt(tr, s.t, head);

        // Short comet tail: three fading blits behind the head.
        for (let k = 3; k >= 1; k--) {
          const bt = s.t - k * 0.026;
          if (bt < 0) continue;
          pointAt(tr, bt, tail);
          const a = 0.1 / k;
          ctx.globalAlpha = opacity * a;
          const sz = 16 - k * 2;
          ctx.drawImage(glows[s.tint], tail.x - sz / 2, tail.y - sz / 2, sz, sz);
        }

        ctx.globalAlpha = opacity * 0.85;
        ctx.drawImage(glows[s.tint], head.x - 13, head.y - 13, 26, 26);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * pr);
      canvas.height = Math.round(h * pr);
      // setTransform, not scale: scale() multiplies into the existing matrix,
      // so calling it on every resize would compound the DPR factor.
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
      build();
      // The assignments above blank the canvas and `build` reseeds the layout,
      // so the reduced-motion path — which has no animation loop to recover on
      // the next frame — has to repaint here or the trace disappears.
      if (reduce) draw(STILL);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let alive = true;

    // Reduced motion starts nothing: `resize` above has already drawn the still
    // trace and redraws it whenever the layout changes.
    if (!reduce) {
      let last = performance.now();
      const start = last;
      const tick = (now: number) => {
        if (!alive) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        for (const s of signals) {
          s.t += s.speed * dt;
          if (s.t > 1) s.t -= 1;
        }
        draw((now - start) / 1000);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [spacing, opacity, seed]);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
