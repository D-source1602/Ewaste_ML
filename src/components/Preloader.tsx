/**
 * Preloader — full-screen boot curtain.
 *
 * Runs its own counter, fades itself out, and reports completion once. It
 * covers the first frames while fonts settle and the WebGL contexts compile
 * their shaders, which is exactly when the page looks worst.
 */

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { cn } from '../lib/cn';
import { useLatest, useReducedMotion } from '../lib/hooks';

export interface PreloaderProps {
  /** Fired when the curtain has finished fading. */
  onDone?: () => void;
  duration?: number;
}

export default function Preloader({ onDone, duration = 1500 }: PreloaderProps) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const reduced = useReducedMotion();
  const onDoneRef = useLatest(onDone);
  const firedRef = useRef(false);

  useEffect(() => {
    if (reduced) {
      setPct(100);
      setGone(true);
      if (!firedRef.current) {
        firedRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }

    let raf = 0;
    let hideTimer = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setPct(Math.round((1 - Math.pow(1 - p, 2.4)) * 100));

      if (p < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }

      setGone(true);
      // Matches the .preloader opacity transition, so onDone lands after the fade.
      hideTimer = window.setTimeout(() => {
        if (firedRef.current) return;
        firedRef.current = true;
        onDoneRef.current?.();
      }, 700);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
    };
  }, [duration, reduced, onDoneRef]);

  return (
    <div className={cn('preloader', gone && 'gone')} aria-hidden={gone}>
      <div className="preloader-inner">
        <div className="preloader-mark">
          <Icon name="leaf" size={17} />
          EcoCircuit
        </div>

        <div className="preloader-track">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>

        <div className="preloader-pct">{pct}%</div>
      </div>
    </div>
  );
}
