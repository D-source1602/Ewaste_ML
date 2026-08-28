/**
 * LoginPage — the first screen, and the only screen before authentication.
 *
 * SCOPE, deliberately narrow: this page contains login options and nothing
 * else. No sign-up toggle, no account-type picker, no password-strength meter,
 * no mission copy, no testimonials, no trust badges, no marketing. Every
 * interactive element on it is a way to sign in, a field required to sign in, or
 * password recovery.
 *
 * Layout is a single centered card holding the sign-in form — no decorative
 * side panel, so there is no empty space and nothing that depends on a WebGL
 * render succeeding.
 */

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import AppInput from '../components/AppInput';
import Icon from '../components/Icon';
import PearlButton from '../components/PearlButton';
import { BRAND } from '../data/content';

export interface LoginPageProps {
  /** Called once credentials are accepted. */
  onAuth: () => void;
}

/* ── Brand marks ───────────────────────────────────────────────────────────
   Local, unexported, and fill-based. The shared `Icon` is a stroke-only
   single-path abstraction; brand marks need multiple filled paths in fixed
   colours, so bending `Icon` to carry them would corrupt it for everything
   else. They live here because nothing else in the app signs you in.
   ──────────────────────────────────────────────────────────────────────── */

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.59-5.15 3.59-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.86-3a7.23 7.23 0 0 1-10.76-3.8H1.34v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.33 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.34a12 12 0 0 0 0 10.78l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.18 15.24 0 12 0A11.99 11.99 0 0 0 1.34 6.61l3.99 3.1A7.15 7.15 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.36 12.72c.02-2.28 1.86-3.38 1.94-3.43-1.06-1.55-2.7-1.76-3.28-1.79-1.4-.11-2.72.81-3.43.81-.72 0-1.8-.79-2.96-.77-1.53.02-2.93.88-3.71 2.24-1.58 2.75-.41 6.82 1.13 9.05.75 1.09 1.65 2.31 2.83 2.27 1.14-.05 1.57-.73 2.94-.73 1.37 0 1.76.73 2.96.71 1.22-.02 2.01-1.11 2.76-2.2.86-1.25 1.22-2.47 1.24-2.53-.03-.01-2.39-.92-2.42-3.63ZM14.2 5.9c.62-.76 1.04-1.8.93-2.85-.9.04-2 .6-2.64 1.35-.58.67-1.08 1.74-.95 2.76 1.01.08 2.03-.51 2.66-1.26Z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#F25022" d="M2 2h9.4v9.4H2z" />
      <path fill="#7FBA00" d="M12.6 2H22v9.4h-9.4z" />
      <path fill="#00A4EF" d="M2 12.6h9.4V22H2z" />
      <path fill="#FFB900" d="M12.6 12.6H22V22h-9.4z" />
    </svg>
  );
}

/* ── Validation ────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage({ onAuth }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');

  const blobRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef(0);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 6;

  // The sign-in beat is a timer, so it has to be cancellable — otherwise a
  // navigation during those 850ms fires onAuth from a dead component.
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  /* The blurred blob follows the pointer across the form panel. Written
     straight to style — a pointermove-driven setState would re-render both
     inputs on every mouse event. */
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const blob = blobRef.current;
    if (!blob) return;
    const rect = e.currentTarget.getBoundingClientRect();
    blob.style.left = `${e.clientX - rect.left}px`;
    blob.style.top = `${e.clientY - rect.top}px`;
  };

  const authenticate = () => {
    if (pending) return;
    setPending(true);
    setNotice('Verifying credentials');
    // Short, honest beat: the button has a resolved state to move through, and
    // an instant jump reads as a broken click rather than a successful one.
    timerRef.current = window.setTimeout(onAuth, 850);
  };

  const onForgot = () => {
    if (pending) return;
    setNotice(
      EMAIL_RE.test(email.trim())
        ? `Reset link sent to ${email.trim()}`
        : 'Enter your email address first',
    );
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid) return;
    authenticate();
  };

  return (
    <main className="login">
      <div className="login-card">
        {/* ── Left: the form, and nothing but the form ── */}
        <div className="login-left" onPointerMove={onPointerMove}>
          <div className="login-blob" ref={blobRef} aria-hidden="true" />

          <form className="login-form" onSubmit={onSubmit} aria-labelledby="login-h">
            <div className="login-brand">
              <span className="tile" aria-hidden="true">
                <Icon name="leaf" size={17} />
              </span>
              {BRAND.name}
            </div>

            <div className="col" style={{ gap: '0.35rem' }}>
              <h1 className="login-heading" id="login-h">
                Sign in
              </h1>
              <p className="login-sub">Continue to your {BRAND.name} account.</p>
            </div>

            <button
              type="button"
              className="login-google"
              onClick={authenticate}
              disabled={pending}
            >
              <GoogleMark />
              Continue with Google
            </button>

            <div className="login-socials">
              <button
                type="button"
                className="social-ring"
                onClick={authenticate}
                disabled={pending}
                aria-label="Continue with Apple"
              >
                <span className="social-ring-fill" aria-hidden="true" />
                <AppleMark />
              </button>

              <button
                type="button"
                className="social-ring"
                onClick={authenticate}
                disabled={pending}
                aria-label="Continue with Microsoft"
              >
                <span className="social-ring-fill" aria-hidden="true" />
                <MicrosoftMark />
              </button>
            </div>

            <div className="login-divide" aria-hidden="true">
              or use email
            </div>

            <AppInput
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AppInput
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              revealToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="button" className="login-forgot" onClick={onForgot}>
              Forgot password?
            </button>

            <PearlButton
              type="submit"
              size="lg"
              block
              sparkle
              icon="arrow"
              disabled={!valid || pending}
            >
              {pending ? 'Signing in' : 'Sign in'}
            </PearlButton>

            <p className="login-state" role="status">
              {notice}
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
