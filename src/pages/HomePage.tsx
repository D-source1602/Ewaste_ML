/**
 * HomePage — the marketing surface.
 *
 * Order is deliberate: the claim, the scale of the problem, what the system
 * actually does (with the AI/rule distinction stated on every card), how it
 * works, how it differs from the incumbents, then the ask.
 */

import { useEffect, useState } from 'react';
import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import Marquee from '../components/Marquee';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import { useReducedMotion } from '../lib/hooks';
import {
  COMPARISON,
  FEATURES,
  HERO_WORDS,
  HOME_STATS,
  HOW_STEPS,
  PARTNER_NAMES,
  TICKER,
} from '../data/content';
import type { Page } from '../types';

export interface HomePageProps {
  onNavigate: (page: Page) => void;
}

/* ── Rotating headline word ─────────────────────────────────────────────── */

type RotorPhase = 'in' | 'out' | 'enter';

function Rotor({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RotorPhase>('in');
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let outTimer = 0;
    let inTimer = 0;

    const cycle = window.setInterval(() => {
      setPhase('out');
      outTimer = window.setTimeout(() => {
        setIndex((n) => (n + 1) % words.length);
        setPhase('enter');
        // The next word has to paint once in its "enter" offset before being
        // released, otherwise there's no from-state and it simply appears.
        inTimer = window.setTimeout(() => setPhase('in'), 50);
      }, 480);
    }, 2900);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(outTimer);
      window.clearTimeout(inTimer);
      // `out` and `enter` are both opacity: 0. Stopping mid-cycle — which is
      // exactly what happens if reduced motion is switched on while the headline
      // is rotating — would otherwise leave the word invisible for good.
      setPhase('in');
    };
  }, [reduced, words.length]);

  return (
    <span className="rotor">
      <span className={phase === 'in' ? undefined : phase}>{words[index]}</span>
    </span>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <main>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-inner">
            <Reveal>
              <span className="badge">
                <Icon name="sparkle" size={12} />
                Smart India Hackathon 2026
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="hero-title">
                Route every device to
                <br />
                <Rotor words={HERO_WORDS} />
              </h1>
            </Reveal>

            <Reveal delay={160} className="lead" style={{ maxWidth: '58ch' }}>
              India generated 13.97 lakh tonnes of e-waste last year and a third
              of it never reached a certified handler. EcoCircuit scores a device
              from one photo, predicts what it is still worth, and routes it to
              the exit that returns the most value — resale, refurbishment or
              recovery.
            </Reveal>

            <Reveal delay={240} className="hero-cta">
              <PearlButton size="lg" sparkle onClick={() => onNavigate('submit')}>
                Value a device
              </PearlButton>
              <InteractiveHoverButton
                hoverLabel="See the numbers"
                icon="chart"
                onClick={() => onNavigate('impact')}
              >
                View impact
              </InteractiveHoverButton>
            </Reveal>

            <Reveal delay={320} className="hero-scroll">
              <i aria-hidden="true" />
              Scroll to explore
            </Reveal>
          </div>
        </div>
      </section>

      <Marquee items={TICKER} />

      {/* ═══ THE PROBLEM, IN NUMBERS ═══ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The problem</span>
            <h2 className="h2">
              A waste stream growing faster than the{' '}
              <span className="grad-text">chain that handles it</span>
            </h2>
            <p className="lead">
              The formal sector has capacity. What it lacks is a way for the
              person holding the device to find it, and a reason to prefer it
              over the scrap dealer down the road.
            </p>
          </div>

          <div className="grid g4">
            {HOME_STATS.map((stat, i) => (
              <TiltCard key={stat.label} delay={i * 70}>
                <CountUp
                  className="stat-num"
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
                <p className="stat-label">{stat.label}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT IT DOES ═══ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The system</span>
            <h2 className="h2">Six parts, and we say which two are models</h2>
            <p className="lead">
              Two components are machine learning. Four are published rules that
              produce the same output for the same input, every time. Labelling
              which is which is the difference between a product and a demo.
            </p>
          </div>

          <div className="grid g3">
            {FEATURES.map((feature, i) => (
              <TiltCard key={feature.title} delay={i * 60} className="col">
                <div className="spread" style={{ marginBottom: '1rem' }}>
                  <span className="tile" aria-hidden="true">
                    <Icon name={feature.icon} size={18} />
                  </span>
                  <span className={feature.ai ? 'badge badge-blue' : 'badge badge-quiet'}>
                    {feature.ai ? 'Model' : 'Rule'}
                  </span>
                </div>

                <h3 className="card-title">{feature.title}</h3>
                <p className="card-body" style={{ marginTop: '0.5rem' }}>
                  {feature.body}
                </p>
                <p
                  className="mono faint"
                  style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.66rem' }}
                >
                  {feature.tag}
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head center">
            <span className="eyebrow">How it works</span>
            <h2 className="h2">Three steps, sixty seconds</h2>
          </div>

          <div className="rail">
            {HOW_STEPS.map((step, i) => (
              <Reveal key={step.title} className="rail-card" delay={i * 90}>
                <span className="rail-num">
                  {String(i + 1).padStart(2, '0')} / 03
                </span>
                <h3 className="h3">{step.title}</h3>
                <p className="card-body" style={{ marginTop: '0.6rem' }}>
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Where it differs</span>
            <h2 className="h2">Against what already exists</h2>
            <p className="lead">
              The incumbents are recyclers with collection arms. EcoCircuit is
              the routing layer in front of them — which is why the comparison
              is about visibility and choice, not capacity.
            </p>
          </div>

          <Reveal className="card card-flush">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>EcoCircuit</th>
                    <th>Attero</th>
                    <th>Karo Sambhav</th>
                    <th>RecycleKaro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label}>
                      <td style={{ color: 'var(--ink)' }}>{row.label}</td>
                      <td className="yes">{row.eco}</td>
                      <td className={row.attero === 'No' ? 'no' : undefined}>
                        {row.attero}
                      </td>
                      <td className={row.karo === 'No' ? 'no' : undefined}>
                        {row.karo}
                      </td>
                      <td className={row.recyclekaro === 'No' ? 'no' : undefined}>
                        {row.recyclekaro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal className="note note-blue" delay={120} style={{ marginTop: '1rem' }}>
            <Icon name="info" size={16} />
            Comparison drawn from each operator&apos;s public service pages and
            CPCB authorisation records as of August 2026. Capacity and
            authorisation scope are not in dispute here — discoverability is.
          </Reveal>
        </div>
      </section>

      {/* ═══ PARTNERS + CTA ═══ */}
      <section className="section">
        <div className="wrap wrap-mid">
          <Reveal className="card card-accent">
            <div className="col" style={{ gap: '1.35rem', alignItems: 'center', textAlign: 'center' }}>
              <span className="eyebrow">Routing into the formal chain</span>
              <h2 className="h2">Every device deserves its highest-value exit</h2>

              <div className="row row-wrap" style={{ justifyContent: 'center' }}>
                {PARTNER_NAMES.map((name) => (
                  <span className="badge badge-quiet" key={name}>
                    {name}
                  </span>
                ))}
              </div>

              <div className="hero-cta" style={{ justifyContent: 'center' }}>
                <PearlButton size="lg" sparkle onClick={() => onNavigate('submit')}>
                  Start with one device
                </PearlButton>
                <InteractiveHoverButton
                  hoverLabel="Bulk & EPR"
                  icon="building"
                  onClick={() => onNavigate('business')}
                >
                  For business
                </InteractiveHoverButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
