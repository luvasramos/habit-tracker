import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Habit } from '../state/types';
import { formatMinutes, isValidDurationMinutes } from '../utils/duration';
import { Icon } from './Icon';

type TimeEditDialogProps = {
  isOpen: boolean;
  habit: Habit | null;
  dateLabel: string;
  initialMinutes?: number;
  onClose: () => void;
  onSave: (durationMinutes: number) => void;
};

const presets = [15, 30, 45, 60, 90];

const splitMinutes = (minutes?: number) => {
  const safeMinutes = isValidDurationMinutes(minutes) ? minutes : 0;
  return {
    hours: safeMinutes > 0 ? String(Math.floor(safeMinutes / 60)) : '',
    minutes: safeMinutes > 0 ? String(safeMinutes % 60) : '',
  };
};

const parseTimePart = (value: string) => {
  if (!value.trim()) {
    return 0;
  }

  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  return Number(value);
};

export const TimeEditDialog = ({
  isOpen,
  habit,
  dateLabel,
  initialMinutes,
  onClose,
  onSave,
}: TimeEditDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const initialParts = useMemo(() => splitMinutes(initialMinutes), [initialMinutes]);
  const [hours, setHours] = useState(initialParts.hours);
  const [minutes, setMinutes] = useState(initialParts.minutes);

  const parsedHours = parseTimePart(hours);
  const parsedMinutes = parseTimePart(minutes);
  const durationMinutes =
    parsedHours === null || parsedMinutes === null ? null : parsedHours * 60 + parsedMinutes;
  const error =
    durationMinutes === null || !isValidDurationMinutes(durationMinutes)
      ? 'Enter a duration longer than zero.'
      : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const nextParts = splitMinutes(initialMinutes);
      setHours(nextParts.hours);
      setMinutes(nextParts.minutes);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [initialMinutes, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (error || !durationMinutes) {
      return;
    }

    onSave(durationMinutes);
    onClose();
  };

  if (!isOpen || !habit) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog--small"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="dialog__body time-editor" onSubmit={handleSubmit}>
        <div>
          <h2 id={titleId}>Edit time</h2>
          <p className="muted" id={descriptionId}>
            {habit.name} · {dateLabel}
          </p>
        </div>

        <p className="time-editor__current">
          Current duration: {initialMinutes ? formatMinutes(initialMinutes) : 'Unknown'}
        </p>

        <div className="time-preset-grid" aria-label="Time presets">
          {presets.map((preset) => (
            <button
              className="button button--quiet"
              type="button"
              key={preset}
              onClick={() => {
                const parts = splitMinutes(preset);
                setHours(parts.hours);
                setMinutes(parts.minutes);
              }}
            >
              {formatMinutes(preset)}
            </button>
          ))}
        </div>

        <div className="time-editor__fields">
          <label className="field field--compact">
            <span>Hours</span>
            <input
              value={hours}
              inputMode="numeric"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>
          <label className="field field--compact">
            <span>Minutes</span>
            <input
              value={minutes}
              inputMode="numeric"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
        </div>

        {error ? (
          <p className="form-error" id={errorId}>
            {error}
          </p>
        ) : null}

        <div className="dialog__actions">
          <button className="button" type="button" onClick={onClose}>
            <Icon name="close" />
            Cancel
          </button>
          <button className="button button--primary" type="submit" disabled={Boolean(error)}>
            <Icon name="check" />
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
};
