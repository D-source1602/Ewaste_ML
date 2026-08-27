/**
 * Shared hooks.
 *
 * Kept in one module so the components stay declarative and so the
 * reduced-motion contract is enforced in exactly one place.
 */

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   MOTION PREFERENCE
   ══════════════════════════════════════════════════════════════════════════ */

/** Tracks `prefers-reduced-motion` live, so a mid-session change takes effect. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEWPORT
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Reports whether the referenced element has entered the viewport.
 * `once` (the default) disconnects after the first entry, which is what reveal
 * and count-up animations want — they should not replay on scroll-back.
 */
export function useInView<T extends Element>(
  once = true,
  threshold = 0.16,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold]);

  return [ref, inView];
}

/* ══════════════════════════════════════════════════════════════════════════
   SCROLL
   ══════════════════════════════════════════════════════════════════════════ */

/** Document scroll position as 0–1, sampled on a frame so it never thrashes. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let queued = false;

    const sample = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(sample);
    };

    sample();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

/** True once the page has scrolled past `offset` pixels. */
export function useScrolledPast(offset = 24): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return past;
}

/* ══════════════════════════════════════════════════════════════════════════
   MOUNT
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Flips to true one frame after mount. Entry transitions need the element to
 * paint in its "from" state first, so a rAF tick is the correct trigger — a
 * plain effect can be batched into the same paint.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return mounted;
}

/**
 * Holds the latest value in a ref. Lets an animation loop read fresh props
 * without listing them as effect dependencies and restarting the loop.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
