/**
 * ImpactPage — aggregate outcomes.
 *
 * The stacked bars animate from zero once the chart scrolls into view: the
 * heights are percentages of a fixed-height stack and `.chart-seg` carries the
 * transition, so the growth is CSS and the component only flips one boolean.
 * That keeps a six-column chart from costing sixty renders.
 */

import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import type { CSSProperties } from 'react';
import { useInView } from '../lib/hooks';
import {
  IMPACT_FEED,
  IMPACT_MONTHS,
  IMPACT_STATS,
  ORE_GOLD_G_PER_TONNE,
  PATHWAY_SPLIT,
  URBAN_MINE,
  URBAN_MINE_TONNES,
} from '../data/content';
import type { Page } from '../types';

export interface ImpactPageProps {
  onNavigate: (page: Page) => void;
}

/** Segment colours, ordered to match the legend and the stack. */
const SERIES = [
  { key: 'resell', label: 'Resell', colour: 'var(--leaf)' },
  { key: 'refurbish', label: 'Refurbish', colour: 'var(--mint)' },
  { key: 'recycle', label: 'Recycle', colour: 'var(--teal)' },
] as const;

export default function ImpactPage({ onNavigate }: ImpactPageProps) {
  const [chartRef, chartIn] = useInView<HTMLDivElement>();
  const [splitRef, splitIn] = useInView<HTMLDivElement>();

  /* Gold carried per tonne of phones (grams) against typical mined ore grade,
     so the "richer than the ground" claim is a computed range, not a slogan. */
  const goldGramsPerTonne = (URBAN_MINE.find((m) => m.symbol === 'Au')?.perTonneKg ?? 0) * 1000;
  const oreLow = Math.round(goldGramsPerTonne / ORE_GOLD_G_PER_TONNE.high);
  const oreHigh = Math.round(goldGramsPerTonne / ORE_GOLD_G_PER_TONNE.low);

  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Impact</span>
          <h1 className="h2">
            What routing actually{' '}
            <span className="grad-text">recovers</span>
          </h1>
          <p className="lead">
            Every figure here is the sum of individual routed devices, not a
            projection. Where a number is modelled rather than measured, it says
            so on the card.
          </p>
        </div>

        {/* ═══ HEADLINE NUMBERS ═══ */}
        <div className="grid g4">
          {IMPACT_STATS.map((stat, i) => (
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

        <Reveal className="note note-blue" delay={120} style={{ marginTop: '1rem' }}>
          <Icon name="info" size={16} />
          CO₂e avoided is modelled, not metered: recovered mass is multiplied by
          published emission factors for virgin material production against a
          landfill baseline. The device count and the value returned are direct
          counts.
        </Reveal>

        {/* ═══ PATHWAY MIX OVER TIME ═══ */}
        <div className="grid g2" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)', alignItems: 'start' }}>
          <Reveal className="card">
            <div className="col" style={{ gap: '1.35rem' }}>
              <div className="col" style={{ gap: '0.35rem' }}>
                <span className="eyebrow">Pathway mix, last six months</span>
                <h2 className="h3">Resale share is climbing</h2>
                <p className="card-body">
                  As condition scoring got better, more devices cleared the bar
                  for resale instead of falling straight to recovery — which is
                  where the value for the owner actually sits.
                </p>
              </div>

              <div className="chart" ref={chartRef}>
                {IMPACT_MONTHS.map((bar) => (
                  <div className="chart-col" key={bar.month}>
                    <div className="chart-stack">
                      {SERIES.map((series) => (
                        <span
                          className="chart-seg"
                          key={series.key}
                          style={{
                            height: chartIn ? `${bar[series.key]}%` : '0%',
                            background: series.colour,
                          }}
                          title={`${series.label} ${bar[series.key]}% in ${bar.month}`}
                        />
                      ))}
                    </div>
                    <span className="chart-x">{bar.month}</span>
                  </div>
                ))}
              </div>

              <div className="legend">
                {SERIES.map((series) => (
                  <span key={series.key}>
                    <i style={{ background: series.colour }} />
                    {series.label}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ═══ SPLIT + LIVE FEED ═══ */}
          <div className="col" style={{ gap: '1rem' }}>
            <TiltCard tilt={false}>
              <div className="col" style={{ gap: '1rem' }} ref={splitRef}>
                <span className="eyebrow">Cumulative split</span>

                {PATHWAY_SPLIT.map((row) => (
                  <div className="col" key={row.pathway} style={{ gap: '0.45rem' }}>
                    <div className="spread">
                      <span className="card-body" style={{ color: 'var(--ink)' }}>
                        {row.pathway}
                      </span>
                      <span className="mono" style={{ fontSize: '0.74rem' }}>
                        {row.pct}%
                      </span>
                    </div>
                    <div className="meter">
                      <i
                        style={{
                          width: splitIn ? `${row.pct}%` : '0%',
                          background: row.colour,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>

            <TiltCard tilt={false} delay={90}>
              <div className="col" style={{ gap: '0.6rem' }}>
                <div className="spread">
                  <span className="eyebrow">Live routing</span>
                  <span className="badge badge-quiet">
                    <Icon name="zap" size={12} />
                    Streaming
                  </span>
                </div>

                <div className="col">
                  {IMPACT_FEED.map((event) => (
                    <div className="feed-item" key={event.text}>
                      <span className="feed-dot" aria-hidden="true" />
                      <span className="grow">{event.text}</span>
                      <span className="mono faint" style={{ fontSize: '0.64rem' }}>
                        {event.at}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* ═══ URBAN MINE ═══ */}
        <div className="section-head" style={{ marginTop: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <span className="eyebrow">The urban mine</span>
          <h2 className="h2">
            What {URBAN_MINE_TONNES.toLocaleString('en-IN')} tonnes of routed
            devices actually <span className="grad-text">hold</span>
          </h2>
          <p className="lead">
            Recovered mass modelled from routed devices at published phone-grade
            yields. A tonne of end-of-life phones carries around{' '}
            {Math.round(goldGramsPerTonne)} g of gold — a tonne of mined ore
            yields {ORE_GOLD_G_PER_TONNE.low}–{ORE_GOLD_G_PER_TONNE.high} g, so
            this stream is {oreLow}–{oreHigh}× the grade of the ground.
          </p>
        </div>

        <div className="grid g4">
          {URBAN_MINE.map((mat, i) => (
            <TiltCard key={mat.symbol} delay={i * 70}>
              <div className="spread" style={{ marginBottom: '0.7rem' }}>
                <span
                  className="metal-chip"
                  style={{ '--metal': mat.colour } as CSSProperties}
                  aria-hidden="true"
                >
                  {mat.symbol}
                </span>
                <span className="badge badge-quiet">{mat.perTonneKg} kg/t</span>
              </div>
              <CountUp
                className="stat-num"
                to={Math.round(mat.perTonneKg * URBAN_MINE_TONNES * 10) / 10}
                suffix=" kg"
                decimals={1}
              />
              <p className="stat-label">{mat.name} recovered</p>
              <p className="faint" style={{ fontSize: '0.72rem', marginTop: '0.3rem' }}>
                {mat.note}
              </p>
            </TiltCard>
          ))}
        </div>

        <Reveal className="note note-blue" delay={120} style={{ marginTop: '1rem' }}>
          <Icon name="info" size={16} />
          Modelled, not assayed: routed mass is multiplied by published
          material-flow yields for end-of-life phones. Actual recovery depends on
          the device mix and each dismantler&apos;s process efficiency.
        </Reveal>

        {/* ═══ CTA ═══ */}
        <Reveal className="card card-accent" delay={100} style={{ marginTop: '1.75rem' }}>
          <div className="spread">
            <div className="col" style={{ gap: '0.3rem' }}>
              <h3 className="h3">Add one device to these numbers</h3>
              <p className="card-body">
                The average phone routed through resale returns ₹11,900 to its
                owner and keeps 0.18 kg of copper in circulation.
              </p>
            </div>

            <div className="row row-wrap">
              <InteractiveHoverButton
                hoverLabel="Bulk & EPR"
                icon="building"
                onClick={() => onNavigate('business')}
              >
                For business
              </InteractiveHoverButton>
              <PearlButton size="lg" sparkle icon="arrow" onClick={() => onNavigate('submit')}>
                Value a device
              </PearlButton>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
