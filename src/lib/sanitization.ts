/**
 * sanitization — device → a certified data-wipe plan.
 *
 * The single biggest reason Indian households hoard old phones and laptops
 * rather than reselling or recycling them is fear that personal data leaves
 * with the device (CPCB / industry surveys; the informal chain gives no
 * guarantee at all). This module answers "what happens to my data?" up front,
 * with a method that is auditable rather than a vague promise.
 *
 * The method is mapped from NIST SP 800-88 Rev. 2 "Guidelines for Media
 * Sanitization", which nearly every certificate of destruction cites, and is
 * framed against India's DPDP Act 2023 duty to erase personal data once its
 * purpose ends:
 *   • Clear   — logical overwrite via normal write commands (factory reset).
 *   • Purge   — recovery infeasible even in a lab: cryptographic erase for
 *               self-encrypting flash, verified secure-overwrite for magnetic.
 *               Leaves the media reusable, so it fits a resale/refurbish exit.
 *   • Destroy — physical shredding/degauss; recovery infeasible, media not
 *               reusable, so it fits a recycle/recover exit.
 *
 * Which of Purge vs Destroy applies is decided by whether the device is being
 * reused (resell/refurbish) or broken for materials (recycle/recover), so the
 * data plan and the pathway can never contradict each other.
 */

import type { DeviceType, LaptopDetails } from '../types';

export type WipeAction = 'purge' | 'destroy' | 'reset' | 'none';

export interface SanitizationPlan {
  /** True when the item can hold personal data that must be erased. */
  dataBearing: boolean;
  action: WipeAction;
  /** Short chip word: Certified wipe / Shredded / Factory reset / Not needed. */
  label: string;
  /** The NIST method, spelled out for the user. */
  method: string;
  /** Standard(s) the method is held to. */
  standard: string;
  /** What physically gets sanitized. */
  media: string;
  /** One plain-English guarantee line. */
  guarantee: string;
}

const NIST = 'NIST SP 800-88 Rev. 2';
const DPDP = 'India DPDP Act 2023';

/** Which storage lives inside the thing being sold, and whether it holds data. */
function mediaFor(
  device: DeviceType,
  laptop?: LaptopDetails,
): { media: string; kind: 'flash' | 'magnetic' | 'volatile' | 'account' | 'none' } {
  if (device === 'Laptop' && laptop?.sellMode === 'component') {
    switch (laptop.componentType) {
      case 'SSD':
        return { media: 'Solid-state drive (flash)', kind: 'flash' };
      case 'HDD':
        return { media: 'Hard disk drive (magnetic)', kind: 'magnetic' };
      case 'RAM':
        return { media: 'Memory module (volatile)', kind: 'volatile' };
    }
  }
  switch (device) {
    case 'Laptop':
      return { media: 'Internal storage (SSD / HDD)', kind: 'flash' };
    case 'Phone':
    case 'Tablet':
      return { media: 'Onboard flash (eMMC / UFS)', kind: 'flash' };
    case 'TV':
      return { media: 'Smart-TV app & account storage', kind: 'account' };
    case 'AC':
      return { media: 'No user-data storage', kind: 'none' };
  }
}

/**
 * Resolve the data-wipe plan.
 * @param reuse true when the exit keeps the device/part intact (resell or
 *   refurbish) → Purge; false when it is broken down (recycle/recover) → Destroy.
 */
export function sanitizationFor(
  device: DeviceType,
  laptop?: LaptopDetails,
  reuse = true,
): SanitizationPlan {
  const { media, kind } = mediaFor(device, laptop);

  if (kind === 'none') {
    return {
      dataBearing: false,
      action: 'none',
      label: 'No data',
      method: 'No sanitization required',
      standard: 'Not applicable',
      media,
      guarantee: 'This device stores no personal data — nothing to erase.',
    };
  }

  if (kind === 'volatile') {
    return {
      dataBearing: false,
      action: 'none',
      label: 'Self-clearing',
      method: 'Volatile memory — contents lost on power-off',
      standard: NIST,
      media,
      guarantee: 'RAM holds no data once unpowered; no wipe is needed.',
    };
  }

  if (kind === 'account') {
    return {
      dataBearing: true,
      action: 'reset',
      label: 'Factory reset',
      method: 'Clear — factory reset with signed-in accounts de-linked',
      standard: `${NIST} · ${DPDP}`,
      media,
      guarantee:
        'Streaming logins and Wi-Fi credentials are removed and the panel is reset to factory state before handoff.',
    };
  }

  // Data-bearing storage. Reuse exits Purge (drive survives); recycle/recover
  // exits Destroy (drive is shredded, which sanitizes by construction).
  if (!reuse) {
    return {
      dataBearing: true,
      action: 'destroy',
      label: 'Shredded',
      method:
        kind === 'magnetic'
          ? 'Destroy — degauss, then cross-cut shred to ≤ 6 mm particles'
          : 'Destroy — cross-cut shred to ≤ 2 mm particles',
      standard: `${NIST} · ${DPDP}`,
      media,
      guarantee:
        'Because this exit recovers materials, the storage is physically destroyed — data recovery is infeasible and a certificate is issued.',
    };
  }

  return {
    dataBearing: true,
    action: 'purge',
    label: 'Certified wipe',
    method:
      kind === 'magnetic'
        ? 'Purge — verified single-pass secure overwrite'
        : 'Purge — cryptographic erase (CE) of the encryption key',
    standard: `${NIST} · ${DPDP}`,
    media,
    guarantee:
      'Data is purged to a lab-infeasible standard while keeping the drive reusable, and a certificate of sanitization is issued with the payout.',
  };
}

/** Deterministic certificate id from the consignment id, so it is stable across
   paints and reproducible on the slip. */
export function certificateId(deviceId: string): string {
  let h = 0;
  for (let i = 0; i < deviceId.length; i += 1) {
    h = (h * 31 + deviceId.charCodeAt(i)) >>> 0;
  }
  return `DS-${h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}
