/**
 * SubmitPage — the four-step intake flow.
 *
 * One piece of state per answer and a single `step` index. The analysing step
 * renders `FluxLoader` and hands it `onDone`; the loader routes that callback
 * through `useLatest`, so navigation fires from the animation's own completion
 * rather than from a timer this component has to remember to cancel.
 *
 * Each step gates its own "continue": you cannot reach the analysing step
 * without the inputs the model needs, because a valuation produced from blanks
 * would be a fabrication.
 */

import { useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import AppInput from '../components/AppInput';
import FluxLoader from '../components/FluxLoader';
import Icon from '../components/Icon';
import InteractiveHoverButton from '../components/InteractiveHoverButton';
import LifecycleIndicator from '../components/LifecycleIndicator';
import PearlButton from '../components/PearlButton';
import Reveal from '../components/Reveal';
import Stepper from '../components/Stepper';
import TiltCard from '../components/TiltCard';
import {
  ANALYSING_PHASES,
  BRANDS_BY_DEVICE,
  CAPACITIES,
  COMPONENT_TYPES,
  CONDITIONS,
  DEVICE_TYPES,
  RAM_TYPES,
  STORAGE_TYPES,
  SUBMIT_STEPS,
} from '../data/content';
import type {
  Condition,
  ComponentType,
  DeviceType,
  LaptopDetails,
  Page,
  SellMode,
  Submission,
} from '../types';

export interface SubmitPageProps {
  onNavigate: (page: Page) => void;
  /** Records the completed intake so downstream pages describe this device. */
  onSubmit: (submission: Submission) => void;
}

/** Index of the analysing step — derived, so reordering the labels can't drift. */
const ANALYSING = SUBMIT_STEPS.length - 1;

export default function SubmitPage({ onNavigate, onSubmit }: SubmitPageProps) {
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<DeviceType | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [age, setAge] = useState(3);
  const [condition, setCondition] = useState<Condition | ''>('');
  const [photo, setPhoto] = useState('');
  const [over, setOver] = useState(false);

  /* Laptop sub-intake. `sellMode` splits the flow into a whole-unit sale
     (processor / graphics) or a single salvaged part (memory / storage spec).
     `warrantyOver` is asked for laptops either way. All inert unless the chosen
     category is Laptop. */
  const [sellMode, setSellMode] = useState<SellMode | ''>('');
  const [processor, setProcessor] = useState('');
  const [graphics, setGraphics] = useState('');
  const [componentType, setComponentType] = useState<ComponentType | ''>('');
  const [memoryType, setMemoryType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [warrantyOver, setWarrantyOver] = useState(false);

  const isLaptop = device === 'Laptop';

  /* Brand options track the chosen category, so a phone maker never appears for
     an AC. Empty until a device is picked (step 0 gates step 1 anyway). */
  const brandOptions = device ? BRANDS_BY_DEVICE[device] : [];

  const fileRef = useRef<HTMLInputElement>(null);

  /* The laptop sub-intake is only complete once its branch has the fields the
     valuation needs: a whole-unit sale needs a processor, a component sale
     needs which part plus its capacity. */
  const laptopReady =
    !isLaptop ||
    (sellMode === 'whole' && processor.trim().length >= 2) ||
    (sellMode === 'component' && componentType !== '' && capacity !== '');

  const canContinue =
    (step === 0 && device !== null) ||
    (step === 1 &&
      brand !== '' &&
      model.trim().length >= 2 &&
      condition !== '' &&
      laptopReady) ||
    step === 2;

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setPhoto(file.name);
  };

  /* Advance one step. On the press that starts the analysis, freeze the answers
     into a `Submission` and hand them up — this is the point every required
     field is guaranteed present, so the result can finally speak about the
     device the user actually chose. */
  const advance = () => {
    const next = step + 1;
    if (next === ANALYSING && device !== null && condition !== '') {
      // Assemble the laptop branch only when it applies, keeping only the
      // fields that belong to the chosen sale mode.
      let laptop: LaptopDetails | undefined;
      if (isLaptop && sellMode !== '') {
        laptop =
          sellMode === 'whole'
            ? {
                sellMode,
                processor: processor.trim(),
                graphics: graphics.trim(),
              }
            : {
                sellMode,
                componentType: componentType || undefined,
                memoryType: memoryType || undefined,
                capacity: capacity || undefined,
              };
      }
      onSubmit({
        device,
        brand,
        model: model.trim(),
        age,
        condition,
        warrantyOver: isLaptop ? warrantyOver : undefined,
        laptop,
      });
    }
    setStep(next);
  };

  return (
    <main className="page">
      <div className="wrap wrap-mid">
        <div className="section-head">
          <span className="eyebrow">Step {step + 1} of {SUBMIT_STEPS.length}</span>
          <h1 className="h2">Value a device</h1>
          <p className="lead">
            Four short steps. The photo is what the condition model reads — the
            rest narrows the comparable listings the value estimate is drawn
            from.
          </p>
        </div>

        <Reveal style={{ marginBottom: '2.25rem' }}>
          <Stepper steps={SUBMIT_STEPS} current={step} />
        </Reveal>

        {/* ═══ STEP 1 — CATEGORY ═══ */}
        {step === 0 ? (
          <>
            <div className="grid g3">
              {DEVICE_TYPES.map((entry, i) => (
                <TiltCard
                  key={entry.type}
                  delay={i * 60}
                  className="col"
                  selected={device === entry.type}
                  onClick={() => {
                    setDevice(entry.type);
                    setBrand('');
                  }}
                  ariaLabel={`${entry.type}, category ${entry.hint}`}
                >
                  <div className="spread">
                    <span className="tile" aria-hidden="true">
                      <Icon name={entry.icon} size={18} />
                    </span>
                    {device === entry.type ? (
                      <span className="badge">
                        <Icon name="check" size={12} />
                        Chosen
                      </span>
                    ) : null}
                  </div>

                  <h3 className="card-title" style={{ marginTop: '0.9rem' }}>
                    {entry.type}
                  </h3>
                  <p className="mono faint" style={{ fontSize: '0.66rem' }}>
                    {entry.hint}
                  </p>
                </TiltCard>
              ))}
            </div>

            <Reveal className="note note-blue" delay={140} style={{ marginTop: '1.25rem' }}>
              <Icon name="info" size={16} />
              The category sets the E-Waste Rules 2022 code the device is filed
              under, which is what makes it countable against an EPR target
              later.
            </Reveal>
          </>
        ) : null}

        {/* ═══ STEP 2 — DETAILS ═══ */}
        {step === 1 ? (
          <Reveal className="card">
            <div className="grid g2" style={{ gap: '1.15rem' }}>
              <div className="field">
                <label className="field-label" htmlFor="brand">
                  Brand
                </label>
                <select
                  id="brand"
                  className="select"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">Select a brand</option>
                  {brandOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <AppInput
                label="Model"
                name="model"
                placeholder="Galaxy S21, Latitude 5420…"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />

              <div className="field">
                <label className="field-label" htmlFor="condition">
                  Condition, as you&apos;d describe it
                </label>
                <select
                  id="condition"
                  className="select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as Condition)}
                >
                  <option value="">Select a condition</option>
                  {CONDITIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="age">
                  Age — {age} {age === 1 ? 'year' : 'years'}
                </label>
                <input
                  id="age"
                  className="range"
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  style={{ '--fill': `${age * 10}%` } as CSSProperties}
                />
                <p className="faint" style={{ fontSize: '0.72rem' }}>
                  Age drives depreciation harder than any other input.
                </p>
              </div>
            </div>

            {/* ─── Laptop sub-intake — whole unit vs a salvaged part ─── */}
            {isLaptop ? (
              <div className="col" style={{ gap: '1.1rem', marginTop: '1.6rem' }}>
                <hr className="rule" />

                <div className="col" style={{ gap: '0.75rem' }}>
                  <span className="eyebrow">What are you selling?</span>
                  <div className="grid g2" style={{ gap: '0.75rem' }}>
                    <button
                      type="button"
                      className={
                        sellMode === 'whole' ? 'choice choice-on' : 'choice'
                      }
                      aria-pressed={sellMode === 'whole'}
                      onClick={() => setSellMode('whole')}
                    >
                      <span className="tile" aria-hidden="true">
                        <Icon name="laptop" size={16} />
                      </span>
                      <span className="col" style={{ gap: '0.15rem' }}>
                        <b>The whole laptop</b>
                        <span className="faint" style={{ fontSize: '0.72rem' }}>
                          Working or repairable complete unit
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        sellMode === 'component' ? 'choice choice-on' : 'choice'
                      }
                      aria-pressed={sellMode === 'component'}
                      onClick={() => setSellMode('component')}
                    >
                      <span className="tile" aria-hidden="true">
                        <Icon name="cpu" size={16} />
                      </span>
                      <span className="col" style={{ gap: '0.15rem' }}>
                        <b>A single part</b>
                        <span className="faint" style={{ fontSize: '0.72rem' }}>
                          HDD / SSD / RAM pulled from the unit
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Whole-unit spec */}
                {sellMode === 'whole' ? (
                  <div className="grid g2" style={{ gap: '1.15rem' }}>
                    <AppInput
                      label="Processor"
                      name="processor"
                      placeholder="Intel i5-1135G7, Ryzen 5 5600H…"
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                    />
                    <AppInput
                      label="Graphics card"
                      name="graphics"
                      placeholder="Integrated, RTX 3050, MX450…"
                      value={graphics}
                      onChange={(e) => setGraphics(e.target.value)}
                    />
                  </div>
                ) : null}

                {/* Component spec */}
                {sellMode === 'component' ? (
                  <div className="grid g3" style={{ gap: '1.15rem' }}>
                    <div className="field">
                      <label className="field-label" htmlFor="componentType">
                        Part
                      </label>
                      <select
                        id="componentType"
                        className="select"
                        value={componentType}
                        onChange={(e) => {
                          setComponentType(e.target.value as ComponentType);
                          setMemoryType('');
                        }}
                      >
                        <option value="">Select a part</option>
                        {COMPONENT_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="memoryType">
                        {componentType === 'RAM' ? 'RAM type' : 'Storage type'}
                      </label>
                      <select
                        id="memoryType"
                        className="select"
                        value={memoryType}
                        onChange={(e) => setMemoryType(e.target.value)}
                      >
                        <option value="">
                          {componentType === 'RAM'
                            ? 'Select a RAM type'
                            : 'Select a storage type'}
                        </option>
                        {(componentType === 'RAM'
                          ? RAM_TYPES
                          : STORAGE_TYPES
                        ).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="capacity">
                        {componentType === 'RAM' ? 'Memory size' : 'Storage size'}
                      </label>
                      <select
                        id="capacity"
                        className="select"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                      >
                        <option value="">Select a size</option>
                        {CAPACITIES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {/* Warranty status — asked for laptops either way */}
                <div className="col" style={{ gap: '0.6rem' }}>
                  <span className="field-label">Manufacturer warranty</span>
                  <div className="grid g2" style={{ gap: '0.75rem' }}>
                    <button
                      type="button"
                      className={!warrantyOver ? 'choice choice-on' : 'choice'}
                      aria-pressed={!warrantyOver}
                      onClick={() => setWarrantyOver(false)}
                    >
                      <span className="tile" aria-hidden="true">
                        <Icon name="shield" size={16} />
                      </span>
                      <b>Still under warranty</b>
                    </button>
                    <button
                      type="button"
                      className={warrantyOver ? 'choice choice-on' : 'choice'}
                      aria-pressed={warrantyOver}
                      onClick={() => setWarrantyOver(true)}
                    >
                      <span className="tile" aria-hidden="true">
                        <Icon name="clock" size={16} />
                      </span>
                      <b>Warranty is over</b>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="note note-amber" style={{ marginTop: '1.35rem' }}>
              <Icon name="info" size={16} />
              Your own condition rating is recorded but not trusted blindly — the
              photo score is what the valuation uses, and the two are shown side
              by side on the result.
            </div>

            {/* Live resale / recycle verdict — updates with age, and with the
                laptop part when a component sale is chosen. */}
            {device ? (
              <LifecycleIndicator
                style={{ marginTop: '1.35rem' }}
                age={age}
                device={device}
                laptop={
                  isLaptop && sellMode === 'component' && componentType
                    ? { sellMode, componentType }
                    : undefined
                }
              />
            ) : null}
          </Reveal>
        ) : null}

        {/* ═══ STEP 3 — PHOTO ═══ */}
        {step === 2 ? (
          <Reveal className="card">
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
              aria-label="Add a photo of the device"
            >
              <span className="tile tile-lg" aria-hidden="true">
                <Icon name={photo ? 'check' : 'camera'} size={21} />
              </span>
              <p className="card-title">
                {photo ? photo : 'Drop a photo, or click to browse'}
              </p>
              <p className="card-body" style={{ maxWidth: '38ch' }}>
                One clear, well-lit shot of the whole device. Screen on if it
                powers up — a lit display is the strongest signal the classifier
                has.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhoto(file.name);
                }}
              />
            </div>

            <div className="note" style={{ marginTop: '1.25rem' }}>
              <Icon name="shield" size={16} />
              The photo is used for condition scoring only. It is not published
              to partners, and you can skip it — the estimate then falls back to
              your own condition rating and widens its band.
            </div>
          </Reveal>
        ) : null}

        {/* ═══ STEP 4 — ANALYSING ═══ */}
        {step === ANALYSING ? (
          <Reveal className="card">
            <div className="col" style={{ gap: '1.6rem' }}>
              <div className="spread">
                <div className="col" style={{ gap: '0.3rem' }}>
                  <span className="eyebrow">Analysing</span>
                  <h2 className="h3">
                    {brand} {model} · {device}
                  </h2>
                </div>
                <span className="badge badge-blue">
                  <Icon name="cpu" size={12} />
                  2 models running
                </span>
              </div>

              <FluxLoader
                phases={ANALYSING_PHASES}
                duration={3600}
                onDone={() => onNavigate('results')}
              />

              <p className="card-body">
                Condition is read from the photo, the resale band comes from
                comparable listings, and the pathway is decided by the published
                scoring rule — in that order, because each step feeds the next.
              </p>
            </div>
          </Reveal>
        ) : null}

        {/* ═══ NAVIGATION ═══ */}
        {step < ANALYSING ? (
          <div className="spread" style={{ marginTop: '1.75rem' }}>
            {step === 0 ? (
              <InteractiveHoverButton
                hoverLabel="Back to home"
                icon="home"
                onClick={() => onNavigate('home')}
              >
                Cancel
              </InteractiveHoverButton>
            ) : (
              <InteractiveHoverButton
                hoverLabel="Previous step"
                icon="arrow"
                onClick={() => setStep((n) => n - 1)}
              >
                Back
              </InteractiveHoverButton>
            )}

            <PearlButton
              size="lg"
              sparkle
              icon="arrow"
              disabled={!canContinue}
              onClick={advance}
            >
              {step === ANALYSING - 1 ? 'Analyse device' : 'Continue'}
            </PearlButton>
          </div>
        ) : null}
      </div>
    </main>
  );
}
