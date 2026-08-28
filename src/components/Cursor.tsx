/**
 * Cursor — a dot that tracks the pointer exactly and a ring that lags behind.
 *
 * The lag is the whole effect: the ring eases toward the pointer with
 * `k = 1 - 0.0015^dt`, which is frame-rate independent, so the trail feels the
 * same at 60Hz and 144Hz. Both elements are positioned by writing `transform`
 * directly — routing pointer coordinates through React state would re-render
 * the tree on every mouse event.
 *
 * Renders nothing on touch devices or when reduced motion is requested; in
 * those cases CSS also restores the native cursor.
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../lib/hooks';

/** Elements that should widen the ring on hover. */
const INTERACTIVE =
  'button, a, input, select, textarea, [role="button"], .card, .tab, .dropzone, .nav-link';

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let last = performance.now();
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;

      const dot = dotRef.current;
      if (dot) dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

      const target = e.target;
      const big = target instanceof Element && target.closest(INTERACTIVE) !== null;
      ringRef.current?.classList.toggle('big', big);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Exponential approach, normalised by dt so the feel is display-agnostic.
      const k = 1 - Math.pow(0.0015, dt);
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;

      const ring = ringRef.current;
      if (ring) {
        ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <>
      <div className="cur" ref={dotRef} aria-hidden="true" />
      <div className="cur-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
