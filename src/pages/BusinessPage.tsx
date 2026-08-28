/**
 * BusinessPage — the bulk consumer console.
 *
 * Four views behind a tab strip. The tab lives in state as a plain string
 * because `BUSINESS_TABS` is the single source of the ids; `erasableSyntaxOnly`
 * rules out an enum, and a union declared here would drift from the data the
 * moment a tab is added.
 */

import { useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import { cn } from '../lib/cn';
import { useInView } from '../lib/hooks';
import {
  BUSINESS,
  BUSINESS_DEVICES,
  BUSINESS_TABS,
  EPR_ROWS,
} from '../data/content';
import type { Page } from '../types';

export interface BusinessPageProps {
  onNavigate: (page: Page) => void;
}

/** Status → badge variant. Anything unmapped stays quiet rather than guessing. */
const STATUS_BADGE: Record<string, string> = {
  Processed: 'badge',
  'In transit': 'badge badge-amber',
};

/**
 * The header row the matcher expects. Handed over as a real download rather than
 * described in prose, because a column order that has to be inferred is the most
 * common reason a bulk upload comes back for review.
 */
const TEMPLATE_CSV = [
  'make,model,quantity,purchase_year,site',
  'Dell,Latitude 5420,12,2019,Pune',
  'HP,EliteDisplay E243,40,2018,Pune',
  'Apple,iPhone 11,6,2020,Bengaluru',
].join('\n');

export default function BusinessPage({ onNavigate }: BusinessPageProps) {
  const [tab, setTab] = useState(BUSINESS_TABS[0].id);
  const [file, setFile] = useState('');
  const [queued, setQueued] = useState(false);
  const [over, setOver] = useState(false);
  const [eprRef, eprIn] = useInView<HTMLDivElement>();

  const fileRef = useRef<HTMLInputElement>(null);

  /** A new file invalidates the previous confirmation. */
  const accept = (name: string) => {
    setFile(name);
    setQueued(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) accept(dropped.name);
  };

  const downloadTemplate = () => {
    const blob = new Blob([`${TEMPLATE_CSV}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecocircuit-asset-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Roving tabindex: the strip is one stop in the tab order and the arrow keys
   * move between views inside it, which is what a screen-reader user expects of
   * `role="tablist"` and what four separate tab stops would break.
   */
  const onTabKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();

    const at = BUSINESS_TABS.findIndex((entry) => entry.id === tab);
    const next = BUSINESS_TABS[(at + step + BUSINESS_TABS.length) % BUSINESS_TABS.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <main className="page">
      <div className="wrap">
        {/* ═══ ACCOUNT HEADER ═══ */}
        <Reveal className="card card-accent" style={{ marginBottom: '1.5rem' }}>
          <div className="spread">
            <div className="row" style={{ gap: '1rem' }}>
              <span className="tile tile-lg" aria-hidden="true">
                <Icon name="building" size={21} />
              </span>
              <div className="col" style={{ gap: '0.2rem' }}>
                <h1 className="h3">{BUSINESS.company}</h1>
                <p className="mono faint" style={{ fontSize: '0.68rem' }}>
                  GSTIN {BUSINESS.gstin} · {BUSINESS.seats}
                </p>
              </div>
            </div>

            <span className="badge">
              <Icon name="shield" size={12} />
              EPR {BUSINESS.eprMet}% of target
            </span>
          </div>
        </Reveal>

        {/* ═══ TABS ═══ */}
        <Reveal style={{ marginBottom: '1.5rem' }}>
          <div
            className="tabs"
            role="tablist"
            aria-label="Business views"
            onKeyDown={onTabKeys}
          >
            {BUSINESS_TABS.map((entry) => (
              <button
                type="button"
                key={entry.id}
                role="tab"
                id={`tab-${entry.id}`}
                aria-selected={tab === entry.id}
                aria-controls={`panel-${entry.id}`}
                tabIndex={tab === entry.id ? 0 : -1}
                className={cn('tab', tab === entry.id && 'on')}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' ? (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0}>
            <div className="grid g3">
              <TiltCard>
                <CountUp className="stat-num" to={BUSINESS.commission} prefix="₹" />
                <p className="stat-label">Recovered against asset disposal this quarter</p>
              </TiltCard>
              <TiltCard delay={70}>
                <CountUp className="stat-num" to={BUSINESS.eprMet} suffix="%" />
                <p className="stat-label">Weighted EPR obligation met</p>
              </TiltCard>
              <TiltCard delay={140}>
                <CountUp className="stat-num" to={BUSINESS.materialRecovered} suffix=" kg" />
                <p className="stat-label">Material recovered and evidenced</p>
              </TiltCard>
            </div>

            <div className="grid g2" style={{ marginTop: '1rem', alignItems: 'start' }}>
              <Reveal className="card">
                <div className="col" style={{ gap: '1rem' }}>
                  <span className="eyebrow">What the console is for</span>
                  <h2 className="h3">Evidence, per device, not per consignment</h2>
                  <p className="card-body">
                    A manifest tells an auditor that forty monitors left the
                    building. It does not tell them which category each one was
                    filed under, or that it reached an authorised handler. Routing
                    per device produces that record as a by-product.
                  </p>

                  <div className="pill-list">
                    {[
                      'Category code attached at intake, from the 2022 schedule',
                      'Handler authorisation checked before the match is offered',
                      'Custody closed only on a facility-side scan',
                      'Recovery record retained and exportable for seven years',
                    ].map((line) => (
                      <div className="pill-row" key={line}>
                        <i aria-hidden="true" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <TiltCard tilt={false} delay={80}>
                <div className="col" style={{ gap: '0.85rem' }}>
                  <span className="eyebrow">Next obligation window</span>
                  <h2 className="h3">Filing closes 30 Sep 2026</h2>
                  <p className="card-body">
                    Two categories are short of target. Displays are the larger
                    gap and the easier fix — most of that fleet is already
                    end-of-life on your asset register.
                  </p>

                  <div className="note note-amber">
                    <Icon name="info" size={16} />
                    CEEW1 sits at 68% against a 70% target. Routing 40 more
                    monitors closes it.
                  </div>

                  <PearlButton block sparkle icon="upload" onClick={() => setTab('upload')}>
                    Upload a fleet list
                  </PearlButton>
                </div>
              </TiltCard>
            </div>
          </div>
        ) : null}

        {/* ═══ EPR ═══ */}
        {tab === 'epr' ? (
          <div id="panel-epr" role="tabpanel" aria-labelledby="tab-epr" tabIndex={0}>
            <Reveal className="card">
              <div className="col" style={{ gap: '1.5rem' }} ref={eprRef}>
                <div className="col" style={{ gap: '0.35rem' }}>
                  <span className="eyebrow">Collection against target</span>
                  <h2 className="h3">By category, E-Waste Rules 2022</h2>
                  <p className="card-body">
                    Targets are the FY26 figures. A bar that stops short of its
                    marker is a category you are liable on, regardless of how the
                    weighted total looks.
                  </p>
                </div>

                {EPR_ROWS.map((row) => {
                  const met = row.collected >= row.target;

                  return (
                    <div className="col" key={row.code} style={{ gap: '0.5rem' }}>
                      <div className="spread">
                        <div className="row" style={{ gap: '0.6rem' }}>
                          <span className="mono faint" style={{ fontSize: '0.66rem' }}>
                            {row.code}
                          </span>
                          <span className="card-body" style={{ color: 'var(--ink)' }}>
                            {row.category}
                          </span>
                        </div>

                        <span className={met ? 'badge' : 'badge badge-rose'}>
                          {row.collected}% / {row.target}%
                        </span>
                      </div>

                      <div className="meter">
                        <i
                          style={{
                            width: eprIn ? `${Math.min(100, row.collected)}%` : '0%',
                            background: met ? 'var(--grad)' : 'var(--rose)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="note note-blue">
                  <Icon name="info" size={16} />
                  Percentages are collected mass over the obligation for that
                  category, computed on the sales history you uploaded. Change the
                  history and these move.
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        {/* ═══ HISTORY ═══ */}
        {tab === 'history' ? (
          <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" tabIndex={0}>
            <Reveal className="card card-flush">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Consignment</th>
                      <th>Assets</th>
                      <th>Date</th>
                      <th>Value</th>
                      <th>Pathway</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUSINESS_DEVICES.map((device) => (
                      <tr key={device.id}>
                        <td className="mono" style={{ fontSize: '0.72rem' }}>
                          {device.id}
                        </td>
                        <td style={{ color: 'var(--ink)' }}>{device.name}</td>
                        <td>{device.date}</td>
                        <td className="mono">{device.value}</td>
                        <td>{device.pathway}</td>
                        <td>
                          <span className={STATUS_BADGE[device.status] ?? 'badge badge-quiet'}>
                            {device.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>

            <Reveal className="note" delay={100} style={{ marginTop: '1rem' }}>
              <Icon name="download" size={16} />
              Any row exports as a recovery record with the handler&apos;s
              authorisation number and both custody timestamps attached.
            </Reveal>
          </div>
        ) : null}

        {/* ═══ BULK UPLOAD ═══ */}
        {tab === 'upload' ? (
          <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload" tabIndex={0}>
            <Reveal className="card">
              <div className="col" style={{ gap: '1.35rem' }}>
                <div className="col" style={{ gap: '0.35rem' }}>
                  <span className="eyebrow">Bulk intake</span>
                  <h2 className="h3">Upload an asset list</h2>
                  <p className="card-body">
                    A CSV with make, model, quantity and purchase year is enough.
                    Category codes are assigned from the schedule; anything the
                    schedule can&apos;t place is returned for review rather than
                    guessed at.
                  </p>
                </div>

                <div
                  className={over ? 'dropzone over' : 'dropzone'}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(true);
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={onDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileRef.current?.click();
                    }
                  }}
                  aria-label="Upload a CSV or XLSX asset list"
                >
                  <span className="tile tile-lg" aria-hidden="true">
                    <Icon name={file ? 'check' : 'upload'} size={21} />
                  </span>
                  <p className="card-title">{file || 'Drop a CSV or XLSX, or click to browse'}</p>
                  <p className="card-body" style={{ maxWidth: '40ch' }}>
                    Up to 5,000 rows per file. Larger fleets are better split by
                    site so each consignment routes to the nearest handler.
                  </p>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => {
                      const picked = e.target.files?.[0];
                      if (picked) accept(picked.name);
                    }}
                  />
                </div>

                {queued ? (
                  <div className="note">
                    <Icon name="check" size={16} />
                    {file} is queued. Rows the schedule can place are routed per
                    site and appear under History; anything ambiguous comes back
                    to you rather than being filed on a guess.
                  </div>
                ) : null}

                <div className="row row-wrap">
                  <PearlButton
                    sparkle
                    icon="arrow"
                    disabled={!file || queued}
                    onClick={() => setQueued(true)}
                  >
                    {queued ? 'Queued' : file ? 'Queue for matching' : 'Choose a file first'}
                  </PearlButton>
                  <InteractiveHoverButton
                    hoverLabel="Get the template"
                    icon="download"
                    onClick={downloadTemplate}
                  >
                    CSV template
                  </InteractiveHoverButton>
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        {/* ═══ CTA ═══ */}
        <Reveal className="card" delay={120} style={{ marginTop: '1.75rem' }}>
          <div className="spread">
            <div className="col" style={{ gap: '0.3rem' }}>
              <h3 className="h3">Single device instead?</h3>
              <p className="card-body">
                The consumer flow is the same routing engine without the
                compliance layer on top.
              </p>
            </div>
            <InteractiveHoverButton
              hoverLabel="Value one device"
              icon="arrow"
              onClick={() => onNavigate('submit')}
            >
              Open the consumer flow
            </InteractiveHoverButton>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
