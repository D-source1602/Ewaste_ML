/**
 * ResultsPage — the valuation, and the reasoning behind it.
 *
 * Structured so the number arrives first and the justification immediately
 * after: the recommended pathway is stated, then the three exit values it was
 * chosen from are shown side by side, so the recommendation can be checked
 * rather than merely trusted.
 */

import { useState } from 'react';
import CountUp from '../components/CountUp';
import DataSecurityCard from '../components/DataSecurityCard';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import NearbyRecyclers from '../components/NearbyRecyclers';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import { useInView } from '../lib/hooks';
import { CATEGORY_BY_DEVICE, RESULT } from '../data/content';
import type { Page, Submission } from '../types';

export interface ResultsPageProps {
  onNavigate: (page: Page) => void;
  /** The device the user submitted; falls back to the demo record if absent. */
  submission?: Submission | null;
}

export default function ResultsPage({ onNavigate, submission }: ResultsPageProps) {
  const [partner, setPartner] = useState('');
  const [meterRef, meterIn] = useInView<HTMLDivElement>();

  /* Identity comes from the intake when there is one, and only the identity —
     the valuation figures stay the demo record's, since the mock model isn't
     recomputing them per device. Falls back cleanly when opened directly. */
  const deviceName = submission
    ? `${submission.brand} ${submission.model}`.trim()
    : RESULT.device;
  const category = submission
    ? CATEGORY_BY_DEVICE[submission.device].label
    : RESULT.category;
  const condition = submission ? submission.condition : RESULT.condition;
  const age = submission
    ? `${submission.age} ${submission.age === 1 ? 'year' : 'years'}`
    : RESULT.age;

  // `RESULT` is `as const`, so `recommended` is the literal 'Resell'. Widening
  // it keeps the comparisons below honest checks rather than compile errors on
  // branches TypeScript can prove are unreachable today but which the routing
  // rule will reach as soon as the data is live.
  const recommended: string = RESULT.recommended;

  const exits = [
    {
      label: 'Resell as-is',
      value: RESULT.resale,
      note: 'Comparable listings, same condition band',
      best: recommended === 'Resell',
    },
    {
      label: 'Refurbish first',
      value: Math.round(RESULT.resale * 1.18),
      note: `Refurbishment score ${RESULT.refurbScore.toFixed(2)} · parts cost deducted`,
      best: recommended === 'Refurbish',
    },
    {
      label: 'Material recovery',
      value: RESULT.material,
      note: 'Recoverable metals at current scrap rates',
      best: recommended === 'Recycle',
    },
  ];

  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Valuation · {RESULT.deviceId}</span>
          <h1 className="h2">
            {deviceName} routes to{' '}
            <span className="grad-text">{RESULT.recommended.toLowerCase()}</span>
          </h1>
          <p className="lead">
            The photo scored <strong>{condition.toLowerCase()}</strong> at{' '}
            {RESULT.confidence}% confidence. Below is what each exit returns, and
            why one of them wins.
          </p>
        </div>

        {/* ═══ HEADLINE PAYOUT ═══ */}
        <Reveal className="card card-accent">
          <div className="grid g3" style={{ gap: '1.5rem', alignItems: 'center' }}>
            <div className="col" style={{ gap: '0.4rem' }}>
              <span className="eyebrow">Your payout</span>
              <CountUp className="stat-num" to={RESULT.payout} prefix="₹" />
              <p className="card-body">
                After an {Math.round((RESULT.platformFee / RESULT.resale) * 100)}%
                platform fee of ₹{RESULT.platformFee.toLocaleString('en-IN')},
                settled once the partner confirms intake.
              </p>
            </div>

            <div className="col" style={{ gap: '0.75rem' }} ref={meterRef}>
              <div className="spread">
                <span className="eyebrow">Condition confidence</span>
                <span className="mono" style={{ color: 'var(--leaf)' }}>
                  {RESULT.confidence}%
                </span>
              </div>
              <div className="meter">
                <i
                  style={{
                    width: meterIn ? `${RESULT.confidence}%` : '0%',
                    background: 'var(--grad)',
                  }}
                />
              </div>
              <p className="card-body">
                Anything below 70% is sent for a human check instead of being
                priced automatically.
              </p>
            </div>

            <div className="col" style={{ gap: '0.55rem' }}>
              <span className="badge">
                <Icon name="check" size={12} />
                {condition}
              </span>
              <span className="badge badge-quiet">{age} old</span>
              <span className="badge badge-teal">{category}</span>
            </div>
          </div>
        </Reveal>

        {/* ═══ THE THREE EXITS ═══ */}
        <div className="grid g3" style={{ marginTop: '1rem' }}>
          {exits.map((exit, i) => (
            <TiltCard
              key={exit.label}
              delay={i * 70}
              className="value-card"
              selected={exit.best}
            >
              <div className="spread">
                <span className="eyebrow">{exit.label}</span>
                {exit.best ? (
                  <span className="badge">
                    <Icon name="sparkle" size={12} />
                    Best exit
                  </span>
                ) : null}
              </div>
              <span
                className="value-num"
                style={{ color: exit.best ? 'var(--leaf-hi)' : 'var(--ink2)' }}
              >
                ₹{exit.value.toLocaleString('en-IN')}
              </span>
              <p className="card-body">{exit.note}</p>
            </TiltCard>
          ))}
        </div>

        <Reveal className="note note-blue" delay={120} style={{ marginTop: '1rem' }}>
          <Icon name="info" size={16} />
          Pathway selection is a published rule, not a model: the highest net
          return wins unless residual life is under twelve months, in which case
          recovery is forced regardless of resale value.
        </Reveal>

        {/* ═══ DATA SECURITY ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">Before it leaves your hands</span>
          <h2 className="h2">Your data is dealt with first</h2>
          <p className="lead">
            The main reason old devices sit in drawers is the fear that personal
            data goes with them. Here is exactly how this one is sanitised — the
            method, the standard it is held to, and the certificate you receive.
          </p>
        </div>

        <Reveal>
          <DataSecurityCard
            device={submission?.device ?? 'Phone'}
            laptop={submission?.laptop}
            reuse={recommended !== 'Recycle'}
            deviceId={RESULT.deviceId}
          />
        </Reveal>

        {/* ═══ PARTNERS ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">Choose a handler</span>
          <h2 className="h2">Certified recyclers near you</h2>
          <p className="lead">
            Live from OpenStreetMap, ranked by real distance from your location.
            These are collection points tagged for electrical and electronic
            waste — allow location access to see the ones closest to you.
          </p>
        </div>

        <Reveal>
          <NearbyRecyclers onSelect={setPartner} />
        </Reveal>

        {/* ═══ CONFIRM ═══ */}
        <Reveal className="card" delay={100} style={{ marginTop: '1.75rem' }}>
          <div className="spread">
            <div className="col" style={{ gap: '0.3rem' }}>
              <h3 className="h3">Hand off to {partner || 'a certified recycler'}</h3>
              <p className="card-body">
                A QR is issued immediately. Custody opens when the courier scans
                it at your door.
              </p>
            </div>

            <div className="row row-wrap">
              <InteractiveHoverButton
                hoverLabel="Value another"
                icon="plus"
                onClick={() => onNavigate('submit')}
              >
                New device
              </InteractiveHoverButton>
              <PearlButton size="lg" sparkle icon="arrow" onClick={() => onNavigate('track')}>
                Confirm handoff
              </PearlButton>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
