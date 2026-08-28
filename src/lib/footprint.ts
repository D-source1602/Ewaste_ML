/**
 * footprint — device + pathway → the sustainability payoff of routing it.
 *
 * The e-waste problem is not only a materials problem; it is a carbon problem.
 * The largest slice of a device's lifetime emissions is embodied — spent once,
 * up front, manufacturing it (mining, refining, wafer fabrication, assembly,
 * freight). Keeping a device in service (resell / refurbish) or recovering its
 * metals (recycle) is what stops those emissions being spent all over again on
 * a replacement, and stops the device being burned or dumped by the informal
 * chain. This module turns that into an honest, per-device number the owner
 * can see at the moment they decide to route it.
 *
 * Every figure is MODELLED from published life-cycle-assessment (LCA) ranges,
 * never metered — the UI says so on the card. Embodied cradle-to-gate carbon
 * per device (kg CO₂e) is taken from manufacturer and academic LCAs:
 *   • Phone  ~55  (smartphone LCAs ≈ 40–80; Apple iPhone cradle-to-gate ≈ 60–70)
 *   • Tablet ~110 (tablet LCAs ≈ 100–130)
 *   • Laptop ~300 (notebook LCAs ≈ 250–400)
 *   • TV     ~350 (large LED display manufacturing ≈ 300–500)
 *   • AC     ~450 (split-AC manufacturing, excluding refrigerant leakage)
 *
 * Displacement is deliberately conservative rather than flattering:
 *   • Reuse (resell/refurbish) displaces 70% of a replacement's embodied
 *     carbon — not 100%, because a reused device does not perfectly remove one
 *     new sale from the market (rebound and second-owner effects).
 *   • Recycle recovers materials but does not extend the device's life, so it
 *     avoids only the virgin-production share of the metals it returns — modelled
 *     at 15% of embodied carbon.
 *
 * The car-kilometre equivalent uses 0.17 kg CO₂e per km for a typical petrol
 * car, purely to make the abstract kilograms relatable.
 */

import type { DeviceType } from '../types';

/** Per-device LCA inputs the model draws from. */
interface DeviceLca {
  /** Embodied cradle-to-gate manufacturing carbon, kg CO₂e. */
  embodiedCo2eKg: number;
  /** Whole-device mass, kg — the e-waste kept out of landfill / open burning. */
  massKg: number;
  /** Copper as a fraction of device mass — the headline recoverable metal. */
  copperFraction: number;
}

const DEVICE_LCA: Record<DeviceType, DeviceLca> = {
  Phone: { embodiedCo2eKg: 55, massKg: 0.19, copperFraction: 0.13 },
  Tablet: { embodiedCo2eKg: 110, massKg: 0.5, copperFraction: 0.1 },
  Laptop: { embodiedCo2eKg: 300, massKg: 2.0, copperFraction: 0.2 },
  TV: { embodiedCo2eKg: 350, massKg: 12, copperFraction: 0.03 },
  AC: { embodiedCo2eKg: 450, massKg: 40, copperFraction: 0.19 },
};

/** Share of embodied carbon avoided, by exit. Conservative on purpose. */
const REUSE_DISPLACEMENT = 0.7;
const RECYCLE_DISPLACEMENT = 0.15;

/** kg CO₂e per kilometre for a typical petrol car — relatability only. */
const CAR_KG_CO2E_PER_KM = 0.17;

export interface Footprint {
  /** kg CO₂e avoided versus buying-new / dumping, modelled. */
  co2eAvoidedKg: number;
  /** Equivalent petrol-car kilometres not driven. */
  carKmEquivalent: number;
  /** kg of device mass kept out of landfill and open burning. */
  ewasteDivertedKg: number;
  /** kg of copper kept in circulation instead of newly mined. */
  copperRecoveredKg: number;
  /** Which exit this was computed for. */
  reuse: boolean;
  /** One plain-English line explaining the dominant lever. */
  headline: string;
}

/**
 * Resolve the environmental footprint of routing one device.
 * @param reuse true for resell/refurbish (device stays in service), false for
 *   recycle/recover (metals returned, life not extended).
 */
export function footprintFor(device: DeviceType, reuse = true): Footprint {
  const lca = DEVICE_LCA[device];

  const share = reuse ? REUSE_DISPLACEMENT : RECYCLE_DISPLACEMENT;
  const co2eAvoidedKg = Math.round(lca.embodiedCo2eKg * share);
  const carKmEquivalent = Math.round(co2eAvoidedKg / CAR_KG_CO2E_PER_KM);
  const ewasteDivertedKg = Math.round(lca.massKg * 100) / 100;
  const copperRecoveredKg = Math.round(lca.massKg * lca.copperFraction * 1000) / 1000;

  const headline = reuse
    ? 'Keeping this device in service avoids most of the carbon of manufacturing a replacement — the single biggest lever.'
    : 'Recovering the metals returns them to circulation and avoids the emissions of mining and refining them from ore.';

  return {
    co2eAvoidedKg,
    carKmEquivalent,
    ewasteDivertedKg,
    copperRecoveredKg,
    reuse,
    headline,
  };
}
