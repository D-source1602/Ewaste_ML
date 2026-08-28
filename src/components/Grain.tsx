/**
 * Grain — animated SVG turbulence over the whole viewport.
 *
 * Large flat gradients band on 8-bit displays; a low-opacity noise field breaks
 * the gradient up so the eye reads a smooth surface. Stepped animation keeps it
 * feeling like film rather than TV static.
 */

export default function Grain() {
  return (
    <svg className="grain" aria-hidden="true">
      <filter id="ec-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.82"
          numOctaves={3}
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#ec-grain)" />
    </svg>
  );
}
