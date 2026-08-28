/**
 * TrackPage — custody from doorstep to dismantler.
 *
 * The current position is derived from the data (`at !== null` means reached)
 * rather than held in state, so the timeline and the stepper can never disagree
 * about where the consignment is.
 *
 * The QR preview reads its modules from `QR_MATRIX`. That matrix is a constant
 * on purpose: generating it with `Math.random()` during render would produce a
 * different code on every paint, which is exactly the bug a scannable artefact
 * cannot survive.
 */

import { useState } from 'react';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import Stepper from '../components/Stepper';
import TiltCard from '../components/TiltCard';
import { CATEGORY_BY_DEVICE, QR_MATRIX, RESULT, TRACK_STEPS } from '../data/content';
import { buildPdf, downloadBlob, money } from '../lib/pdf';
import type { PdfBlock } from '../lib/pdf';
import { certificateId, sanitizationFor } from '../lib/sanitization';
import type { SanitizationPlan } from '../lib/sanitization';
import type { Page, Submission, TrackStep } from '../types';

export interface TrackPageProps {
  onNavigate: (page: Page) => void;
  /** The device the user submitted; falls back to the demo record if absent. */
  submission?: Submission | null;
}

/** Resolved device identity — the intake's when present, else the demo record. */
interface Consignment {
  device: string;
  categoryCode: string;
  categoryLabel: string;
  condition: string;
  age: string;
  /** Resolved data-wipe plan + its certificate id. */
  wipe: SanitizationPlan;
  certId: string;
}

/* ── Custody slip ────────────────────────────────────────────────────────────
   Builds an actual PDF of the consignment — device, category, settlement and
   the full custody timeline — from the same data the page renders, then hands
   it to the browser as a download. No print dialog, no server: the bytes are
   assembled in the client (see lib/pdf).
   ──────────────────────────────────────────────────────────────────────────── */

function downloadCustodySlip(device: Consignment, timeline: TrackStep[]): void {
  const issued = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const blocks: PdfBlock[] = [
    { kind: 'title', text: 'EcoCircuit — Custody Slip' },
    { kind: 'subtitle', text: `Consignment ${RESULT.deviceId} · issued ${issued}` },
    { kind: 'rule' },

    { kind: 'heading', text: 'Device' },
    { kind: 'row', label: 'Model', value: device.device },
    { kind: 'row', label: 'Category', value: device.categoryLabel },
    { kind: 'row', label: 'Condition', value: `${device.condition} (${RESULT.confidence}% confidence)` },
    { kind: 'row', label: 'Age', value: device.age },
    { kind: 'row', label: 'Recommended pathway', value: RESULT.recommended },

    { kind: 'heading', text: 'Settlement' },
    { kind: 'row', label: 'Resale band', value: money(RESULT.resale) },
    { kind: 'row', label: 'Platform fee', value: money(RESULT.platformFee) },
    { kind: 'row', label: 'Net payout', value: money(RESULT.payout) },
    { kind: 'row', label: 'Handler', value: 'Attero Recycling' },

    { kind: 'heading', text: 'Data sanitization certificate' },
    { kind: 'row', label: 'Certificate no.', value: device.certId },
    { kind: 'row', label: 'Method', value: device.wipe.method },
    { kind: 'row', label: 'Media', value: device.wipe.media },
    { kind: 'row', label: 'Standard', value: device.wipe.standard },
    { kind: 'para', text: device.wipe.guarantee },
    { kind: 'gap', h: 4 },
    { kind: 'heading', text: 'Custody timeline' },
    ...timeline.flatMap((step): PdfBlock[] => [
      { kind: 'row', label: step.title, value: step.at ?? 'Pending' },
      { kind: 'para', text: step.body },
      { kind: 'gap', h: 4 },
    ]),

    { kind: 'rule' },
    {
      kind: 'para',
      text:
        'Two scans define the chain of custody: one at the door when the courier takes the device, one at the facility when the dismantler confirms intake. A recovery record is issued at processing and stays downloadable for seven years.',
    },
  ];

  downloadBlob(buildPdf(blocks), `EcoCircuit-${RESULT.deviceId}-custody-slip.pdf`);
}

/* ── QR preview ────────────────────────────────────────────────────────────
   A representative render, not a scannable code: the three finder squares and
   the module field are drawn from the constant matrix so the mark is stable
   across paints and identical between sessions.
   ──────────────────────────────────────────────────────────────────────── */

function QrPreview({ code }: { code: string }) {
  return (
    <div
      className="col"
      style={{ gap: '0.85rem', alignItems: 'center' }}
      role="img"
      aria-label={`Handoff code ${code}`}
    >
      <div
        style={{
          padding: '14px',
          borderRadius: 'var(--r)',
          background: '#f2fff8',
          boxShadow: '0 18px 40px -22px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${QR_MATRIX[0].length}, 15px)`,
            gap: '3px',
          }}
        >
          {QR_MATRIX.map((row, y) =>
            row.map((bit, x) => {
              // Three corners are finder patterns on a real code, so they stay
              // solid regardless of what the module field says.
              const finder =
                (y < 2 && x < 2) ||
                (y < 2 && x > row.length - 3) ||
                (y > QR_MATRIX.length - 3 && x < 2);

              return (
                <span
                  key={`${y}-${x}`}
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '2px',
                    background: finder || bit ? '#04120a' : 'transparent',
                  }}
                />
              );
            }),
          )}
        </div>
      </div>

      <span className="mono faint" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
        {code}
      </span>
    </div>
  );
}

export default function TrackPage({ onNavigate, submission }: TrackPageProps) {
  // The two field events — pickup and processing — are opened by real QR scans
  // in production. Here they are held in state so the custody chain can be
  // demonstrated live: each "scan" stamps the step with the actual current time
  // rather than a baked-in one, so the timeline is real for whatever moment the
  // demo runs. Steps that already carry a timestamp in the data keep it.
  const [liveStamps, setLiveStamps] = useState<Record<string, string>>({});

  const timeline: TrackStep[] = TRACK_STEPS.map((step) => ({
    ...step,
    at: step.at ?? liveStamps[step.title] ?? null,
  }));

  // Last checkpoint with a timestamp is where the consignment actually is.
  const reached = timeline.filter((step) => step.at !== null).length;
  const current = Math.min(reached, timeline.length - 1);

  // First step still awaiting its scan, if any — drives the "record scan" action.
  const nextPending = timeline.find((step) => step.at === null) ?? null;
  const processed = timeline[timeline.length - 1].at !== null;

  /** Stamps the next pending checkpoint with the real current time. */
  function recordScan(): void {
    if (!nextPending) return;
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLiveStamps((prev) => ({ ...prev, [nextPending.title]: now }));
  }

  // A recovery-record id derived from the consignment, shown once processed —
  // this is the artefact that would be filed to the CPCB EPR portal.
  const recoveryId = `RR-${RESULT.deviceId.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`;

  const statusBadge = processed
    ? { label: 'Processed', tone: 'badge-teal' as const, icon: 'check' as const }
    : reached >= 3
      ? { label: 'In transit', tone: 'badge-teal' as const, icon: 'truck' as const }
      : { label: 'Awaiting pickup', tone: 'badge-teal' as const, icon: 'truck' as const };

  // Identity from the intake when present, else the demo record.
  // `recommended` widened off the `as const` literal so the reuse check stays a
  // real branch rather than a "no overlap" compile error.
  const recommended: string = RESULT.recommended;
  const reuse = recommended !== 'Recycle';
  const consignment: Consignment = submission
    ? {
        device: `${submission.brand} ${submission.model}`.trim(),
        categoryCode: CATEGORY_BY_DEVICE[submission.device].code,
        categoryLabel: CATEGORY_BY_DEVICE[submission.device].label,
        condition: submission.condition,
        age: `${submission.age} ${submission.age === 1 ? 'year' : 'years'}`,
        wipe: sanitizationFor(submission.device, submission.laptop, reuse),
        certId: certificateId(RESULT.deviceId),
      }
    : {
        device: RESULT.device,
        categoryCode: 'ITEW2',
        categoryLabel: RESULT.category,
        condition: RESULT.condition,
        age: RESULT.age,
        wipe: sanitizationFor('Phone', undefined, reuse),
        certId: certificateId(RESULT.deviceId),
      };

  return (
    <main className="page">
      <div className="wrap wrap-mid">
        <div className="section-head">
          <span className="eyebrow">Consignment · {RESULT.deviceId}</span>
          <h1 className="h2">Track custody</h1>
          <p className="lead">
            Two scans define the chain: one at your door when the courier takes
            the device, one at the facility when the dismantler confirms intake.
            Everything between them is timestamped, not assumed.
          </p>
        </div>

        <Reveal style={{ marginBottom: '2rem' }}>
          <Stepper steps={timeline.map((step) => step.title)} current={current} />
        </Reveal>

        <div className="grid g2" style={{ alignItems: 'start' }}>
          {/* ── Timeline ── */}
          <Reveal className="card">
            <div className="spread" style={{ marginBottom: '1.1rem' }}>
              <h2 className="h3">{consignment.device}</h2>
              <span className={`badge ${statusBadge.tone}`}>
                <Icon name={statusBadge.icon} size={12} />
                {statusBadge.label}
              </span>
            </div>

            <div className="pill-list">
              {timeline.map((step, i) => {
                const done = step.at !== null;
                const active = i === current;

                return (
                  <div
                    className="pill-row"
                    key={step.title}
                    style={{ alignItems: 'flex-start' }}
                  >
                    <i
                      aria-hidden="true"
                      style={{
                        marginTop: '0.42rem',
                        background: done
                          ? 'var(--leaf)'
                          : active
                            ? 'var(--amber)'
                            : 'rgba(255,255,255,0.16)',
                      }}
                    />
                    <div className="col grow" style={{ gap: '0.2rem' }}>
                      <div className="spread" style={{ gap: '0.6rem' }}>
                        <strong style={{ fontWeight: 600 }}>{step.title}</strong>
                        <span className="mono faint" style={{ fontSize: '0.64rem' }}>
                          {step.at ?? 'Pending'}
                        </span>
                      </div>
                      <p className="card-body">{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="note note-amber" style={{ marginTop: '1.15rem' }}>
              <Icon name="clock" size={16} />
              Pickup windows are confirmed by the partner, not by us — the slot
              shown in your email is the one their courier committed to.
            </div>
          </Reveal>

          {/* ── QR + actions ── */}
          <div className="col" style={{ gap: '1rem' }}>
            <TiltCard tilt={false}>
              <div className="col" style={{ gap: '1.2rem', alignItems: 'center' }}>
                <div className="col" style={{ gap: '0.3rem', alignItems: 'center' }}>
                  <span className="eyebrow">Show at pickup</span>
                  <p className="card-body" style={{ textAlign: 'center', maxWidth: '30ch' }}>
                    The courier scans this to open custody. Until it is scanned,
                    the device is still yours.
                  </p>
                </div>

                <QrPreview code={RESULT.deviceId} />

                {nextPending ? (
                  <div className="col" style={{ gap: '0.5rem', alignItems: 'center' }}>
                    <PearlButton size="lg" icon="qr" onClick={recordScan}>
                      {nextPending.title === 'Picked up'
                        ? 'Simulate courier scan'
                        : 'Simulate facility scan'}
                    </PearlButton>
                    <span className="mono faint" style={{ fontSize: '0.6rem', textAlign: 'center', maxWidth: '34ch' }}>
                      Demo of the real event: in production this fires when the{' '}
                      {nextPending.title === 'Picked up' ? 'courier' : 'dismantler'}{' '}
                      scans the QR. It stamps “{nextPending.title}” with the live time.
                    </span>
                  </div>
                ) : (
                  <span className="badge" style={{ alignSelf: 'center' }}>
                    <Icon name="check" size={12} />
                    Custody closed · recovery recorded
                  </span>
                )}

                <InteractiveHoverButton
                  hoverLabel="Save as PDF"
                  icon="download"
                  onClick={() => downloadCustodySlip(consignment, timeline)}
                >
                  Download slip
                </InteractiveHoverButton>
              </div>
            </TiltCard>

            <TiltCard tilt={false} delay={90}>
              <div className="col" style={{ gap: '0.75rem' }}>
                <span className="eyebrow">On the record</span>
                <div className="spread">
                  <span className="card-body">Category</span>
                  <span className="mono" style={{ fontSize: '0.74rem' }}>
                    {consignment.categoryCode}
                  </span>
                </div>
                <div className="spread">
                  <span className="card-body">Handler</span>
                  <span className="mono" style={{ fontSize: '0.74rem' }}>
                    Attero Recycling
                  </span>
                </div>
                <div className="spread">
                  <span className="card-body">Settlement</span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--leaf)' }}>
                    ₹{RESULT.payout.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="spread">
                  <span className="card-body">Data wipe</span>
                  <span className="mono" style={{ fontSize: '0.74rem' }}>
                    {consignment.wipe.label}
                  </span>
                </div>
                {consignment.wipe.dataBearing ? (
                  <div className="spread">
                    <span className="card-body">Certificate</span>
                    <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--leaf)' }}>
                      {consignment.certId}
                    </span>
                  </div>
                ) : null}
                <hr className="rule" style={{ marginBlock: '0.35rem' }} />
                <p className="card-body">
                  A recovery record is issued at processing and stays downloadable
                  for seven years, which is the retention the rules ask for.
                </p>
              </div>
            </TiltCard>

            {processed ? (
              <TiltCard tilt={false} delay={140} className="value-card" selected>
                <div className="spread">
                  <span className="eyebrow">Recovery record issued</span>
                  <span className="badge">
                    <Icon name="check" size={12} />
                    Filed
                  </span>
                </div>
                <div className="spread" style={{ marginTop: '0.6rem' }}>
                  <span className="card-body">Record no.</span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--leaf)' }}>
                    {recoveryId}
                  </span>
                </div>
                <div className="spread">
                  <span className="card-body">EPR category logged</span>
                  <span className="mono" style={{ fontSize: '0.74rem' }}>
                    {consignment.categoryCode}
                  </span>
                </div>
                <div className="spread">
                  <span className="card-body">Diverted from</span>
                  <span className="mono" style={{ fontSize: '0.74rem' }}>
                    Informal sector
                  </span>
                </div>
                <p className="card-body" style={{ marginTop: '0.4rem' }}>
                  On facility intake the dismantler confirms the device and issues
                  this record. The category is logged against the bulk consumer&apos;s
                  EPR target on the CPCB portal — the artefact that turns a routed
                  device into evidenced compliance.
                </p>
              </TiltCard>
            ) : null}
          </div>
        </div>

        <Reveal className="card card-accent" delay={120} style={{ marginTop: '1.75rem' }}>
          <div className="spread">
            <div className="col" style={{ gap: '0.3rem' }}>
              <h3 className="h3">Got another device sitting in a drawer?</h3>
              <p className="card-body">
                Most households have three. The second one takes under a minute
                now that the account exists.
              </p>
            </div>

            <div className="row row-wrap">
              <InteractiveHoverButton
                hoverLabel="Aggregate view"
                icon="chart"
                onClick={() => onNavigate('impact')}
              >
                See impact
              </InteractiveHoverButton>
              <PearlButton size="lg" sparkle icon="plus" onClick={() => onNavigate('submit')}>
                Value another
              </PearlButton>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
