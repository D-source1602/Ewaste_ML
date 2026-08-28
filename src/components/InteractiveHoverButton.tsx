/**
 * InteractiveHoverButton — secondary action.
 *
 * A small dot parked inside the pill inflates on hover until it floods the
 * whole button, while the resting label slides out to the right and the hover
 * label slides in behind it. The hover layer is `aria-hidden` so screen readers
 * announce one label, not two.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon';
import { cn } from '../lib/cn';
import type { IconName } from '../types';

export interface InteractiveHoverButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Text shown on hover. Defaults to the resting label. */
  hoverLabel?: ReactNode;
  /** Glyph on the hover layer. */
  icon?: IconName;
}

export default function InteractiveHoverButton({
  children,
  hoverLabel,
  icon = 'arrow',
  className,
  type = 'button',
  ...rest
}: InteractiveHoverButtonProps) {
  return (
    <button type={type} className={cn('ihb', className)} {...rest}>
      <span className="ihb-dot" aria-hidden="true" />
      <span className="ihb-rest">{children}</span>
      <span className="ihb-hover" aria-hidden="true">
        {hoverLabel ?? children}
        <Icon name={icon} size={15} />
      </span>
    </button>
  );
}
