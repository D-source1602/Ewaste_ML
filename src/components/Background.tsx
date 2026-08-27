/**
 * Background — the composed atmosphere behind every page.
 *
 * Three stacked layers, painted back to front:
 *   1. AnimatedGradient — the slow nebular wash (the base colour field)
 *   2. CircuitCanvas    — PCB traces and travelling signals (texture)
 *   3. GlassScene       — the raymarched glass knot and satellites (the subject)
 * then a vignette to pull focus back toward the centre.
 *
 * All four share `--z-gl`, so DOM order alone decides the stack. Every layer
 * fails soft: if a context can't be created the layer renders nothing and the
 * ambient `body::before` wash still carries the page.
 */

import AnimatedGradient from './AnimatedGradient';
import CircuitCanvas from './CircuitCanvas';
import GlassScene from './GlassScene';
import type { GradientPreset } from './AnimatedGradient';

export interface BackgroundProps {
  /** Gradient mood. `prism` is crisper — used behind the login card. */
  preset?: GradientPreset;
  /**
   * Drops the glass layer. The login page renders its own glass inside the
   * card's right panel, so a second full-screen instance would be two
   * raymarchers competing for the same GPU.
   */
  glass?: boolean;
}

export default function Background({
  preset = 'mist',
  glass = true,
}: BackgroundProps) {
  return (
    <>
      <AnimatedGradient className="bg-layer" preset={preset} opacity={1} />
      <CircuitCanvas className="bg-layer" opacity={0.45} />
      {glass ? <GlassScene className="bg-layer" /> : null}
      {/* Center-clearing tint: lets the animated gradient read through on every
          route while deepening the edges, so the page keeps a dark mood without
          hiding the moving background. */}
      <div className="bg-scrim" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
