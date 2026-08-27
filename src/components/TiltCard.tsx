/**
 * TiltCard — glass card that rotates toward the pointer.
 *
 * Two elements on purpose. The outer one is the reveal wrapper and owns the
 * entrance `transform`; the inner one is the card face and owns the tilt
 * `transform`. Sharing a single element would put two `transition` declarations
 * on the same property and one would silently win.
 *
 * `--mx` / `--my` are written on the face so the `.card::after` sheen tracks
 * the cursor. Both are set through the DOM rather than state, because a
 * pointermove-driven re-render would cost a frame on every mouse event.
 */

import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useInView, useReducedMotion } from '../lib/hooks';

export interface TiltCardProps {
  children: ReactNode;
  /** Classes for the card face. `card` is applied automatically. */
  className?: string;
  /** Stagger, in ms. */
  delay?: number;
  /** Pointer-driven 3D rotation. Sheen still works when false. */
  tilt?: boolean;
  onClick?: () => void;
  /** Marks a chosen card; pairs with `.partner-card.on` and similar. */
  selected?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

export default function TiltCard({
  children,
  className,
  delay = 0,
  tilt = true,
  onClick,
  selected = false,
  ariaLabel,
  style,
}: TiltCardProps) {
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const faceRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = faceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty('--mx', `${x.toFixed(1)}px`);
    el.style.setProperty('--my', `${y.toFixed(1)}px`);

    if (tilt && !reduced) {
      const rx = (0.5 - y / rect.height) * 7;
      const ry = (x / rect.width - 0.5) * 9;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    }
  };

  const onPointerLeave = () => {
    const el = faceRef.current;
    if (el) el.style.transform = '';
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={cn('rv', 'tilt-wrap', inView && 'in')}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div
        ref={faceRef}
        className={cn('card', tilt && 'card-tilt', selected && 'on', className)}
        style={style}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
        onKeyDown={onClick ? onKeyDown : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-pressed={onClick ? selected : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
