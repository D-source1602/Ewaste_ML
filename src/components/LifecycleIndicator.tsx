/**
 * LifecycleIndicator — the resale / recycle / end-of-life verdict.
 *
 * Presentational only: it takes the resolved `LifecycleResult` (or the raw
 * inputs) and renders a coloured status chip, a one-line recommendation and a
 * useful-life meter. Colour and icon are driven by `status`, so the four
 * levels — safe, moderate, critical, useless — read at a glance.
 */

import Icon from './Icon';
import { lifecycleFor } from '../lib/lifecycle';
import type { LifecycleResult, LifecycleStatus } from '../lib/lifecycle';
import type { CSSProperties } from 'react';
import type { DeviceType, IconName, LaptopDetails } from '../types';

interface StatusStyle {
  color: string;
  glow: string;
  icon: IconName;
}

/** Token-based colour per status. Kept here so the meter and chip agree. */
const STYLES: Record<LifecycleStatus, StatusStyle> = {
  safe: { color: 'var(--leaf)', glow: 'rgba(23, 201, 100, 0.4)', icon: 'check' },
  moderate: { color: 'var(--amber)', glow: 'rgba(245, 165, 36, 0.4)', icon: 'clock' },
  critical: { color: 'var(--rose)', glow: 'rgba(244, 63, 94, 0.4)', icon: 'recycle' },
  useless: { color: 'var(--ink3)', glow: 'rgba(120, 140, 132, 0.3)', icon: 'info' },
};

export interface LifecycleIndicatorProps {
  age: number;
  device: DeviceType;
  laptop?: LaptopDetails;
  /** Pass a precomputed result to skip recomputation (optional). */
  result?: LifecycleResult;
  /** `compact` drops the note line — used inline on the intake step. */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function LifecycleIndicator({
  age,
  device,
  laptop,
  result,
  compact = false,
  className,
  style,
}: LifecycleIndicatorProps) {
  const r = result ?? lifecycleFor(age, device, laptop);
  const s = STYLES[r.status];
  const pct = Math.round(r.progress * 100);

  return (
    <div
      className={className ? `lifecycle ${className}` : 'lifecycle'}
      data-status={r.status}
      style={{ '--lc': s.color, '--lc-glow': s.glow, ...style } as CSSProperties}
    >
      <div className="lifecycle-head">
        <span className="lifecycle-chip">
          <Icon name={s.icon} size={13} />
          {r.label}
        </span>
        <span className="lifecycle-verdict">
          {r.headline}
          <span className="faint"> · {r.subject}, {age} {age === 1 ? 'yr' : 'yrs'}</span>
        </span>
      </div>

      <div className="lifecycle-meter" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>

      <p className="lifecycle-detail">{r.detail}</p>
      {!compact ? <p className="lifecycle-note faint">{r.note}</p> : null}
    </div>
  );
}
