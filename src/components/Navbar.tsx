/**
 * Navbar — fixed top navigation.
 *
 * Slides down once mounted (`useMounted` gives it a frame in the "from" state so
 * the transition actually plays), and picks up its glass background only after
 * the page has scrolled — over the hero it stays transparent so the 3D scene
 * reads uninterrupted.
 *
 * Below 900px the pill links and the action pair are hidden by CSS and the
 * burger opens a drawer that carries every route plus the session action, so no
 * destination is reachable on desktop only.
 */

import { useEffect, useState } from 'react';
import Icon from './Icon';
import PearlButton from './PearlButton';
import InteractiveHoverButton from './InteractiveHoverButton';
import { cn } from '../lib/cn';
import { useMounted, useScrolledPast } from '../lib/hooks';
import { BRAND } from '../data/content';
import type { IconName, Page } from '../types';

export interface NavbarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

interface NavItem {
  page: Page;
  label: string;
  icon: IconName;
}

/** The four primary destinations. */
const PRIMARY: NavItem[] = [
  { page: 'home', label: 'Home', icon: 'home' },
  { page: 'impact', label: 'Impact', icon: 'chart' },
  { page: 'business', label: 'Business', icon: 'building' },
  { page: 'about', label: 'About', icon: 'info' },
];

/** Flows reachable from the drawer but represented by the actions on desktop. */
const SECONDARY: NavItem[] = [
  { page: 'submit', label: 'Submit device', icon: 'upload' },
  { page: 'track', label: 'Track pickup', icon: 'truck' },
];

export default function Navbar({
  page,
  onNavigate,
  isLoggedIn,
  onLogout,
}: NavbarProps) {
  const mounted = useMounted();
  const solid = useScrolledPast(24);
  const [drawer, setDrawer] = useState(false);

  // A route change should never leave the drawer hanging open over the new page.
  useEffect(() => {
    setDrawer(false);
  }, [page]);

  // Escape closes the drawer; without it the only way out on a phone with a
  // keyboard attached is to hit the burger again.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const go = (next: Page) => {
    setDrawer(false);
    onNavigate(next);
  };

  return (
    <>
      <header className={cn('nav', mounted && 'in', (solid || drawer) && 'solid')}>
        <button
          type="button"
          className="nav-brand"
          onClick={() => go('home')}
          aria-label={`${BRAND.name} — home`}
        >
          <span className="nav-dot" aria-hidden="true" />
          {BRAND.name}
        </button>

        <nav className="nav-links" aria-label="Primary">
          {PRIMARY.map((item) => (
            <button
              type="button"
              key={item.page}
              className={cn('nav-link', page === item.page && 'active')}
              onClick={() => go(item.page)}
              aria-current={page === item.page ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <InteractiveHoverButton
            hoverLabel="Live status"
            icon="truck"
            onClick={() => go('track')}
          >
            Track
          </InteractiveHoverButton>

          <PearlButton size="sm" sparkle onClick={() => go('submit')}>
            Submit Device
          </PearlButton>

          {/* The drawer carries this too, but the drawer is unreachable on
              desktop — without it there'd be no way to end a session here. */}
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={isLoggedIn ? onLogout : () => onNavigate('login')}
          >
            <Icon name={isLoggedIn ? 'lock' : 'user'} size={15} />
            {isLoggedIn ? 'Sign out' : 'Sign in'}
          </button>
        </div>

        <button
          type="button"
          className="nav-burger"
          onClick={() => setDrawer((open) => !open)}
          aria-expanded={drawer}
          aria-controls="nav-drawer"
        >
          <Icon name={drawer ? 'close' : 'menu'} title={drawer ? 'Close menu' : 'Open menu'} />
        </button>
      </header>

      {drawer ? (
        <nav className="drawer" id="nav-drawer" aria-label="All pages">
          {[...PRIMARY, ...SECONDARY].map((item) => (
            <button
              type="button"
              key={item.page}
              className={cn('drawer-link', page === item.page && 'active')}
              onClick={() => go(item.page)}
              aria-current={page === item.page ? 'page' : undefined}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className="drawer-link"
            onClick={() => {
              setDrawer(false);
              if (isLoggedIn) onLogout();
              else onNavigate('login');
            }}
          >
            <Icon name={isLoggedIn ? 'lock' : 'user'} size={17} />
            {isLoggedIn ? 'Sign out' : 'Sign in'}
          </button>
        </nav>
      ) : null}
    </>
  );
}
