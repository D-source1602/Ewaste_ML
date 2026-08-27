/**
 * DataSecurityCard — "what happens to my data?" answered before handoff.
 *
 * Data-security fear is the top reason devices are hoarded instead of recycled,
 * so this states the sanitization method plainly, cites the standard it is held
 * to, and — for data-bearing media — shows a stable certificate id. Purely
 * presentational: the plan comes from `sanitizationFor`.
 */

import Icon from './Icon';
import { certificateId, sanitizationFor } from '../lib/sanitization';
import type { WipeAction } from '../lib/sanitization';
import type { CSSProperties } from 'react';
import type { DeviceType, IconName, LaptopDetails } from '../types';

interface ActionStyle {
  color: string;
  glow: string;
  icon: IconName;
}

const STYLES: Record<WipeAction, ActionStyle> = {
  purge: { color: 'var(--leaf)', glow: 'rgba(23, 201, 100, 0.4)', icon: 'lock' },
  reset: { color: 'var(--leaf)', glow: 'rgba(23, 201, 100, 0.4)', icon: 'shield' },
  destroy: { color: 'var(--amber)', glow: 'rgba(245, 165, 36, 0.4)', icon: 'shield' },
  none: { color: 'var(--ink3)', glow: 'rgba(120, 140, 132, 0.3)', icon: 'check' },
};

export interface DataSecurityCardProps {
  device: DeviceType;
  laptop?: LaptopDetails;
  /** True for resell/refurbish exits (Purge), false for recycle/recover (Destroy). */
  reuse?: boolean;
  /** Consignment id, used to derive a stable certificate number. */
  deviceId: string;
  className?: string;
  style?: CSSProperties;
}

export default function DataSecurityCard({
  device,
  laptop,
  reuse = true,
  deviceId,
  className,
  style,
}: DataSecurityCardProps) {
  const plan = sanitizationFor(device, laptop, reuse);
  const s = STYLES[plan.action];

  return (
    <div
      className={className ? `datawipe ${className}` : 'datawipe'}
      data-action={plan.action}
      style={{ '--dw': s.color, '--dw-glow': s.glow, ...style } as CSSProperties}
    >
      <div className="datawipe-head">
        <span className="tile" aria-hidden="true">
          <Icon name={s.icon} size={17} />
        </span>
        <div className="col" style={{ gap: '0.15rem' }}>
          <span className="eyebrow">Data security</span>
          <strong className="datawipe-method">{plan.method}</strong>
        </div>
        <span className="datawipe-chip">{plan.label}</span>
      </div>

      <p className="card-body">{plan.guarantee}</p>

      <div className="datawipe-meta">
        <span className="spread">
          <span className="faint">Media</span>
          <span className="mono">{plan.media}</span>
        </span>
        <span className="spread">
          <span className="faint">Held to</span>
          <span className="mono">{plan.standard}</span>
        </span>
        {plan.dataBearing ? (
          <span className="spread">
            <span className="faint">Certificate</span>
            <span className="mono" style={{ color: 'var(--dw)' }}>
              {certificateId(deviceId)}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
