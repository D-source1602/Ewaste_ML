/**
 * PearlButton — the primary call to action.
 *
 * The dome is entirely CSS (see `.pearl` in `styles/ui.css`); this component
 * only assembles the layers: outer shell for the shadow stack, inner face for
 * the masked label, and the optional sparkle pair that swaps glyph on hover.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon';
import { cn } from '../lib/cn';
import type { IconName } from '../types';

export interface PearlButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  /** Leading sparkle that becomes a bolt on hover. */
  sparkle?: boolean;
  /** Trailing icon. */
  icon?: IconName;
}

export default function PearlButton({
  children,
  size = 'md',
  block = false,
  sparkle = false,
  icon,
  className,
  type = 'button',
  ...rest
}: PearlButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'pearl',
        size === 'sm' && 'pearl-sm',
        size === 'lg' && 'pearl-lg',
        block && 'pearl-block',
        className,
      )}
      {...rest}
    >
      <span className="pearl-face">
        {sparkle ? (
          <span className="pearl-spark" aria-hidden="true">
            <span className="s1">
              <Icon name="sparkle" size={14} />
            </span>
            <span className="s2">
              <Icon name="zap" size={14} />
            </span>
          </span>
        ) : null}
        {children}
        {icon ? <Icon name={icon} size={16} /> : null}
      </span>
    </button>
  );
}
