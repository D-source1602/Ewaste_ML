/**
 * Footer — closing band.
 *
 * Carries the mission line, every route as a flat link row, and the fine print.
 * The links duplicate the navbar on purpose: at the bottom of a long page the
 * nav is 4000px away, and scrolling back up to change section is friction.
 */

import Icon from './Icon';
import { BRAND } from '../data/content';
import type { Page } from '../types';

export interface FooterProps {
  onNavigate: (page: Page) => void;
}

const LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'submit', label: 'Submit' },
  { page: 'track', label: 'Track' },
  { page: 'impact', label: 'Impact' },
  { page: 'business', label: 'Business' },
  { page: 'about', label: 'About' },
];

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="spread row-wrap" style={{ gap: '1.6rem' }}>
          <div className="col" style={{ gap: '0.5rem' }}>
            <div className="nav-brand" style={{ marginRight: 0 }}>
              <span className="nav-dot" aria-hidden="true" />
              {BRAND.name}
            </div>
            <p className="faint" style={{ maxWidth: '30ch' }}>
              {BRAND.mission}
            </p>
          </div>

          <nav className="footer-links" aria-label="Footer">
            {LINKS.map((link) => (
              <button
                type="button"
                key={link.page}
                onClick={() => onNavigate(link.page)}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="rule" />

        <div className="spread row-wrap" style={{ gap: '0.9rem' }}>
          <span className="footer-fine">
            © {BRAND.year} {BRAND.name} — {BRAND.tagline}
          </span>
          <span className="footer-fine row" style={{ gap: '0.45rem' }}>
            <Icon name="shield" size={12} />
            Built for Smart India Hackathon {BRAND.year}
          </span>
        </div>
      </div>
    </footer>
  );
}
