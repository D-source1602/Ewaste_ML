/**
 * Icon — single-path stroke glyphs from `data/icons.ts`.
 *
 * Decorative by default (`aria-hidden`). Pass a `title` when the icon is the
 * only content of a control and the label has to come from somewhere.
 */

import { ICON_PATHS } from '../data/icons';
import type { IconName } from '../types';

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Accessible name. Omit for purely decorative icons. */
  title?: string;
}

export default function Icon({
  name,
  size = 18,
  strokeWidth = 1.6,
  className,
  title,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
