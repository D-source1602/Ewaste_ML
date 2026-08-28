/**
 * Marquee — continuous horizontal ticker.
 *
 * The item list is rendered twice and the track translates by exactly -50%, so
 * the second copy arrives where the first began and the seam is invisible. The
 * mask on `.marquee` fades both ends instead of cutting them.
 */

import Icon from './Icon';

export interface MarqueeProps {
  items: string[];
}

export default function Marquee({ items }: MarqueeProps) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="row" key={copy}>
            {items.map((item) => (
              <span className="marquee-item" key={`${copy}-${item}`}>
                <Icon name="leaf" size={13} />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
