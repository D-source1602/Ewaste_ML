/**
 * Stepper — horizontal progress through a fixed sequence.
 *
 * Completed steps show a tick, the current step is ringed, later steps stay
 * numbered. Exposed as an ordered list so the sequence and the current position
 * are available to assistive tech, not just visible.
 */

import { Fragment } from 'react';
import Icon from './Icon';
import { cn } from '../lib/cn';

export interface StepperProps {
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="stepper" aria-label="Progress">
      {steps.map((step, i) => (
        <Fragment key={step}>
          {i > 0 ? (
            <span
              className={cn('stepper-line', i <= current && 'done')}
              aria-hidden="true"
            />
          ) : null}

          <li
            className="stepper-cell"
            aria-current={i === current ? 'step' : undefined}
          >
            <span
              className={cn(
                'stepper-dot',
                i === current && 'active',
                i < current && 'done',
              )}
            >
              {i < current ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className={cn('stepper-label', i <= current && 'on')}>
              {step}
            </span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
