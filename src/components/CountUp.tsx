/**
 * CountUp — animates a number once it scrolls into view.
 *
 * Cubic ease-out (`1 - (1-p)³`) so the value sprints then settles, which reads
 * as a counter rather than a linear ramp. Formatted `en-IN`, so 1397000 renders
 * as 13,97,000.
 */

import { useEffect, useState } from 'react';
import { useInView, useReducedMotion } from '../lib/hooks';

export interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export default function CountUp({
  to,
  prefix,
  suffix,
  duration = 1900,
  decimals = 0,
  className,
}: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (reduced) {
      setValue(to);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  const shown = value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
