/**
 * AboutPage — the honesty page.
 *
 * Its whole purpose is the AI/not-AI split: two components are models, four are
 * published rules, and saying so is what separates a system from a pitch. Judges
 * ask this question first; answering it before it is asked is the point.
 */

import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import {
  AI_NO,
  AI_YES,
  BRAND,
  DATA_SOURCES,
  PROBLEM_STATS,
  TARGET_PARTNERS,
} from '../data/content';
import type { Page } from '../types';

export interface AboutPageProps {
  onNavigate: (page: Page) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <main className="page">
      <div className="wrap">
        {/* ═══ PREMISE ═══ */}
        <div className="section-head">
          <span className="eyebrow">About</span>
          <h1 className="h2">
            {BRAND.name} is a routing layer, not a{' '}
            <span className="grad-text">recycler</span>
          </h1>
          <p className="lead">
            {BRAND.mission} India already has the capacity to process its
            e-waste — 322 authorised recyclers of it. What the person holding a
            dead laptop lacks is a reason to prefer that chain over the scrap
            dealer, and a way to find it in under a minute.
          </p>
        </div>

        <div className="grid g4">
          {PROBLEM_STATS.map((stat, i) => (
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

        {/* ═══ WHAT IS AND ISN'T A MODEL ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">Being precise about the AI</span>
          <h2 className="h2">Two models, four rules</h2>
          <p className="lead">
            &ldquo;AI-powered&rdquo; is doing a lot of unearned work in this
            category. Here is the split, component by component, so the claim can
            be checked instead of taken.
          </p>
        </div>

        <div className="grid g2" style={{ alignItems: 'start' }}>
          <Reveal className="card">
            <div className="col" style={{ gap: '1rem' }}>
              <div className="row" style={{ gap: '0.75rem' }}>
                <span className="tile" aria-hidden="true">
                  <Icon name="cpu" size={17} />
                </span>
                <div className="col">
                  <h3 className="card-title">Machine learning</h3>
                  <span className="mono faint" style={{ fontSize: '0.66rem' }}>
                    Probabilistic · returns a confidence
                  </span>
                </div>
              </div>

              <div className="pill-list">
                {AI_YES.map((line) => (
                  <div className="pill-row" key={line} style={{ alignItems: 'flex-start' }}>
                    <i aria-hidden="true" style={{ marginTop: '0.42rem' }} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="card" delay={90}>
            <div className="col" style={{ gap: '1rem' }}>
              <div className="row" style={{ gap: '0.75rem' }}>
                <span
                  className="tile"
                  aria-hidden="true"
                  style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--blue)' }}
                >
                  <Icon name="shield" size={17} />
                </span>
                <div className="col">
                  <h3 className="card-title">Deterministic rules</h3>
                  <span className="mono faint" style={{ fontSize: '0.66rem' }}>
                    Published · same input, same output
                  </span>
                </div>
              </div>

              <div className="pill-list">
                {AI_NO.map((line) => (
                  <div className="pill-row" key={line} style={{ alignItems: 'flex-start' }}>
                    <i
                      aria-hidden="true"
                      style={{ marginTop: '0.42rem', background: 'var(--blue)' }}
                    />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="note note-amber" delay={120} style={{ marginTop: '1rem' }}>
          <Icon name="info" size={16} />
          Routing is deliberately not learned. A recycler denied a consignment is
          entitled to know why, and a weighted sum can be shown to them. A model
          cannot, which makes it the wrong tool for that decision no matter how
          well it scores.
        </Reveal>

        {/* ═══ DATA SOURCES ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">Where the numbers come from</span>
          <h2 className="h2">Sources, in full</h2>
          <p className="lead">
            Every figure on this site traces to one of these three. Nothing is
            estimated without saying so on the card it appears on.
          </p>
        </div>

        <div className="grid g3">
          {DATA_SOURCES.map((source, i) => (
            <TiltCard key={source.name} delay={i * 70} className="col">
              <span className="tile" aria-hidden="true">
                <Icon name="chart" size={17} />
              </span>
              <h3 className="card-title" style={{ marginTop: '0.9rem' }}>
                {source.name}
              </h3>
              <p className="card-body" style={{ marginTop: '0.45rem' }}>
                {source.body}
              </p>
              <p
                className="mono faint"
                style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.64rem' }}
              >
                {source.meta}
              </p>
            </TiltCard>
          ))}
        </div>

        {/* ═══ PARTNER TARGETS ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">Who we route into</span>
          <h2 className="h2">Target partner network</h2>
          <p className="lead">
            Named as intended integration targets, drawn from the CPCB authorised
            register. No commercial agreement is claimed or implied by their
            appearance here.
          </p>
        </div>

        <div className="grid g2">
          {TARGET_PARTNERS.map((entry, i) => (
            <TiltCard key={entry.name} delay={i * 60}>
              <div className="row" style={{ gap: '0.85rem', alignItems: 'flex-start' }}>
                <span className="tile" aria-hidden="true">
                  <Icon name="building" size={17} />
                </span>
                <div className="col grow" style={{ gap: '0.25rem' }}>
                  <h3 className="card-title">{entry.name}</h3>
                  <p className="card-body">{entry.note}</p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* ═══ CTA ═══ */}
        <Reveal className="card card-accent" delay={100} style={{ marginTop: '1.75rem' }}>
          <div
            className="col"
            style={{ gap: '1.35rem', alignItems: 'center', textAlign: 'center' }}
          >
            <span className="eyebrow">Smart India Hackathon 2026</span>
            <h2 className="h2">{BRAND.mission}</h2>
            <p className="lead" style={{ maxWidth: '54ch' }}>
              Built as a working routing layer rather than a prototype: the rules
              are published, the sources are cited, and the two models say when
              they are unsure.
            </p>

            <div className="hero-cta" style={{ justifyContent: 'center' }}>
              <PearlButton size="lg" sparkle icon="arrow" onClick={() => onNavigate('submit')}>
                Value a device
              </PearlButton>
              <InteractiveHoverButton
                hoverLabel="See the numbers"
                icon="chart"
                onClick={() => onNavigate('impact')}
              >
                View impact
              </InteractiveHoverButton>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
