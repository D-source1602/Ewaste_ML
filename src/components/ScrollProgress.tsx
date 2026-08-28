/**
 * ScrollProgress — hairline reading indicator across the top of the viewport.
 *
 * Driven by `scaleX` rather than `width` so the browser can composite it
 * without laying the page out again on every scroll frame.
 */

import { useScrollProgress } from '../lib/hooks';

export default function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div className="scroll-progress" aria-hidden="true">
      <i style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
