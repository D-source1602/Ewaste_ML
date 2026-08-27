/**
 * FluxLoader — the progressive flux progress bar.
 *
 * Time-driven rather than state-chained: progress is `elapsed / duration`, and
 * the active phase is derived from progress during render. One rAF loop, one
 * piece of state, no cascading effects — which also means the phase label and
 * the fill can never disagree.
 *
 * `onDone` is read through a ref so changing the callback never restarts the
 * animation, and a latch guarantees exactly one call.
 */

import { useEffect, useRef, useState } from 'react';
import { useLatest, useReducedMotion } from '../lib/hooks';

export interface FluxLoaderProps {
  /** Phase labels, walked through in order across `duration`. */
  phases: string[];
  /** Total run time in ms. */
  duration?: number;
  /** Fired once, when progress reaches 100%. */
  onDone?: () => void;
  /** Small caption under the bar, left of the phase counter. */
  caption?: string;
}

export default function FluxLoader({
  phases,
  duration = 3600,
  onDone,
  caption,
}: FluxLoaderProps) {
  const [pct, setPct] = useState(0);
  const reduced = useReducedMotion();
  const onDoneRef = useLatest(onDone);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;

    // Reduced motion: skip the sweep, hold at full, still report completion.
    if (reduced) {
      setPct(100);
      const id = window.setTimeout(() => {
        if (firedRef.current) return;
        firedRef.current = true;
        onDoneRef.current?.();
      }, 400);
      return () => window.clearTimeout(id);
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // Ease-out so the bar decelerates into place instead of stopping dead.
      setPct(Math.round((1 - Math.pow(1 - p, 2.2)) * 100));

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!firedRef.current) {
        firedRef.current = true;
        onDoneRef.current?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, reduced, onDoneRef]);

  const total = Math.max(1, phases.length);
  const index = Math.min(total - 1, Math.floor((pct / 100) * total));
  const label = phases[index] ?? '';

  return (
    <div
      className="flux"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${label} — ${pct}%`}
    >
      <div className="flux-stage">
        {/* key on the phase index restarts the fly-in for each new label */}
        <div className="flux-label" key={index}>
          {Array.from(label).map((ch, i) => (
            <span
              className="flux-char"
              key={`${index}-${i}`}
              style={{ animationDelay: `${i * 22}ms` }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className="flux-track">
        <div className="flux-fill" style={{ width: `${pct}%` }}>
          <i className="flux-sheen" />
        </div>
      </div>

      <div className="flux-meta">
        <span aria-live="polite">
          {caption ?? `Phase ${index + 1} / ${total}`}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
