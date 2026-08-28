/**
 * Reveal — scroll-triggered entrance.
 *
 * Adds `.rv` on mount and `.in` when the element enters the viewport, then
 * stops observing. Deliberately has no tilt behaviour: the reveal keyframes own
 * the element's `transform` while it animates in, so pointer-driven 3D lives in
 * `TiltCard`, which keeps the two transforms on separate elements.
 *
 * The stagger is an `animationDelay` because `.rv` is animation-driven — see the
 * note above `.rv` in `styles/base.css` for why it isn't a transition.
 */

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useInView } from '../lib/hooks';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger, in ms. */
  delay?: number;
  /** Element to render. Defaults to a div. */
  as?: ElementType;
  style?: CSSProperties;
}

export default function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  style,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn('rv', inView && 'in', className)}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
    >
      {children}
    </Tag>
  );
}
