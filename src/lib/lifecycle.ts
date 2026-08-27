/**
 * lifecycle — age → resale/recycle verdict.
 *
 * The user's question is "given how old this is, is it worth reselling, only
 * worth recycling, or past useful life?" That is answered here with a small
 * research-backed table rather than a model, because the thresholds are public
 * and stable enough to state plainly.
 *
 * Where the numbers come from (age bands in years):
 *   • Laptop  — avg service life 3–5 yrs (HP; Gartner enterprise ≈3.7), up to
 *               ~10 yrs to true EOL (ERI). Resale is also gated by OS-support
 *               windows (Windows 10 end-of-support was 2025-10-14).
 *   • Phone   — >50% used only ~2 yrs; steepest value drop is year one; avg
 *               trade-in age ≈3.8 yrs. Support windows decide usability.
 *   • Tablet  — tracks phones but a little longer.
 *   • TV / AC — large appliances, much longer useful lives.
 *   • HDD     — ~90% survive 4 yrs, ~65% reach 6+ yrs; failure risk climbs
 *               after ~4 yrs (Backblaze Drive Stats).
 *   • SSD     — more durable (no moving parts); ~5–9 yr practical life.
 *   • RAM     — rarely fails; value is set by generation obsolescence, not wear.
 *
 * These are age-only heuristics. Condition, warranty and brand shift the real
 * figure, which is why this is presented as guidance beside the valuation, not
 * as the valuation itself.
 */

import type { DeviceType, LaptopDetails } from '../types';

export type LifecycleStatus = 'safe' | 'moderate' | 'critical' | 'useless';

export interface LifecycleResult {
  status: LifecycleStatus;
  /** Short status word: Safe / Moderate / Critical / End of life. */
  label: string;
  /** The recommended pathway in one or two words. */
  headline: string;
  /** One line of plain guidance. */
  detail: string;
  /** What was actually assessed — "Laptop", "SSD", … */
  subject: string;
  /** What drives this timeline, so the verdict isn't a black box. */
  note: string;
  /** 0–1 position along the useful-life bar, for the meter fill. */
  progress: number;
}

interface Profile {
  subject: string;
  /** age ≤ safeMax → safe. */
  safeMax: number;
  /** age ≤ moderateMax → moderate. */
  moderateMax: number;
  /** age ≤ criticalMax → critical; beyond → useless. */
  criticalMax: number;
  note: string;
}

/** Keyed by the thing being sold: a device category, or a laptop part. */
const PROFILES: Record<string, Profile> = {
  Laptop: {
    subject: 'Laptop',
    safeMax: 3,
    moderateMax: 6,
    criticalMax: 9,
    note: 'Service life averages 3–5 yrs; resale is capped by OS-support windows.',
  },
  Phone: {
    subject: 'Phone',
    safeMax: 2,
    moderateMax: 4,
    criticalMax: 6,
    note: 'Value drops fastest in year one; software-update windows decide reuse.',
  },
  Tablet: {
    subject: 'Tablet',
    safeMax: 3,
    moderateMax: 5,
    criticalMax: 7,
    note: 'Tracks phones but holds a little longer; support windows still bind.',
  },
  TV: {
    subject: 'TV',
    safeMax: 5,
    moderateMax: 9,
    criticalMax: 13,
    note: 'Panels last long; smart-OS support and panel wear set the ceiling.',
  },
  AC: {
    subject: 'AC',
    safeMax: 6,
    moderateMax: 10,
    criticalMax: 14,
    note: 'Long service life; efficiency loss and refrigerant era drive retirement.',
  },
  HDD: {
    subject: 'HDD',
    safeMax: 3,
    moderateMax: 5,
    criticalMax: 7,
    note: 'Mechanical failure risk climbs after ~4 yrs (Backblaze Drive Stats).',
  },
  SSD: {
    subject: 'SSD',
    safeMax: 4,
    moderateMax: 7,
    criticalMax: 9,
    note: 'No moving parts; endurance and data-retention fall with age.',
  },
  RAM: {
    subject: 'RAM',
    safeMax: 5,
    moderateMax: 8,
    criticalMax: 11,
    note: 'Rarely fails — value is set by generation obsolescence (DDR3/4/5).',
  },
};

const VERDICTS: Record<LifecycleStatus, { label: string; headline: string; detail: string }> = {
  safe: {
    label: 'Safe',
    headline: 'Resell',
    detail: 'Strong second-hand demand — list for resale or refurbishment.',
  },
  moderate: {
    label: 'Moderate',
    headline: 'Refurbish',
    detail: 'Resale value is falling; refurbishment or trade-in is the best return.',
  },
  critical: {
    label: 'Critical',
    headline: 'Recycle',
    detail: 'Resale is marginal; route to certified recycling to recover components.',
  },
  useless: {
    label: 'End of life',
    headline: 'Recover materials',
    detail: 'Past useful resale life; safe-dispose and recover raw materials only.',
  },
};

/** Resolve which profile applies: a laptop part when one is being sold, else
   the device category. Falls back to Laptop so the result is always defined. */
export function lifecycleKey(
  device: DeviceType,
  laptop?: LaptopDetails,
): string {
  if (
    device === 'Laptop' &&
    laptop?.sellMode === 'component' &&
    laptop.componentType
  ) {
    return laptop.componentType;
  }
  return device;
}

/** Age (years) + what's being sold → the resale/recycle verdict. */
export function lifecycleFor(
  age: number,
  device: DeviceType,
  laptop?: LaptopDetails,
): LifecycleResult {
  const key = lifecycleKey(device, laptop);
  const p = PROFILES[key] ?? PROFILES.Laptop;

  let status: LifecycleStatus;
  if (age <= p.safeMax) status = 'safe';
  else if (age <= p.moderateMax) status = 'moderate';
  else if (age <= p.criticalMax) status = 'critical';
  else status = 'useless';

  const verdict = VERDICTS[status];
  // The bar fills across the useful life and tops out a little past the
  // critical cut-off, so an ancient device still reads as pinned to the end.
  const span = p.criticalMax * 1.25;
  const progress = Math.min(Math.max(age / span, 0), 1);

  return {
    status,
    label: verdict.label,
    headline: verdict.headline,
    detail: verdict.detail,
    subject: p.subject,
    note: p.note,
    progress,
  };
}
