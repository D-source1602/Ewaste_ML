/**
 * AppInput — labelled field with pointer-tracking border light.
 *
 * Two 2px bars sit on the shell's top and bottom edges. On pointer move a
 * radial gradient centred on the cursor's x is written straight to their
 * `background`, so the border lights only where the pointer is. Written via
 * refs rather than state — a pointermove-driven `setState` would re-render the
 * field on every mouse event.
 */

import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, PointerEvent as ReactPointerEvent } from 'react';
import Icon from './Icon';
import { cn } from '../lib/cn';

export interface AppInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  /** Adds a show/hide control. Only meaningful for `type="password"`. */
  revealToggle?: boolean;
  className?: string;
}

export default function AppInput({
  label,
  revealToggle = false,
  type = 'text',
  id,
  className,
  ...rest
}: AppInputProps) {
  const autoId = useId();
  const fieldId = id ?? `f-${autoId}`;

  const shellRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLSpanElement>(null);
  const bottomRef = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  const showToggle = revealToggle && type === 'password';
  const inputType = showToggle && revealed ? 'text' : type;

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const gradient = `radial-gradient(34px circle at ${x.toFixed(1)}px 50%, var(--mint), transparent 100%)`;
    if (topRef.current) topRef.current.style.background = gradient;
    if (bottomRef.current) bottomRef.current.style.background = gradient;
  };

  return (
    <div className={cn('field', className)}>
      <label className="field-label" htmlFor={fieldId}>
        {label}
      </label>

      <div className="field-shell" ref={shellRef} onPointerMove={onPointerMove}>
        <span className="field-bar top" ref={topRef} aria-hidden="true" />
        <span className="field-bar bottom" ref={bottomRef} aria-hidden="true" />

        <input
          id={fieldId}
          type={inputType}
          className={cn('field-input', showToggle && 'has-icon')}
          {...rest}
        />

        {showToggle ? (
          <button
            type="button"
            className="field-icon"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
