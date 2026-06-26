import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { DistanceUnitPreference, Habit } from '../state/types';
import {
  formatDistance,
  isDistanceUnitPreference,
  isValidDistanceMeters,
  metersFromKilometers,
  metersFromMiles,
} from '../utils/distance';
import { Icon } from './Icon';

type DistanceEditDialogProps = {
  isOpen: boolean;
  habit: Habit | null;
  dateLabel: string;
  initialMeters?: number;
  onClose: () => void;
  onSave: (distanceMeters: number) => void;
};

const basePresets = [1000, 3000, 5000, 10000];

const formatDistanceInput = (meters: number | undefined, unit: DistanceUnitPreference) => {
  if (!isValidDistanceMeters(meters)) {
    return '';
  }

  if (unit === 'm') {
    return String(meters);
  }

  const value = unit === 'mi' ? meters / 1609.344 : meters / 1000;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
};

const parseDistanceMeters = (value: string, unit: DistanceUnitPreference) => {
  const input = value.trim();
  if (!input) {
    return null;
  }

  if (!/^\d+(?:[.,]\d+)?$/.test(input)) {
    return null;
  }

  const numericValue = Number(input.replace(',', '.'));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  if (unit === 'm') {
    return Math.round(numericValue);
  }

  return unit === 'mi' ? metersFromMiles(numericValue) : metersFromKilometers(numericValue);
};

export const DistanceEditDialog = ({
  isOpen,
  habit,
  dateLabel,
  initialMeters,
  onClose,
  onSave,
}: DistanceEditDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const unit = habit?.distanceUnitPreference ?? 'km';
  const [distance, setDistance] = useState(() => formatDistanceInput(initialMeters, unit));
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnitPreference>(unit);
  const presets = useMemo(
    () =>
      Array.from(
        new Set([
          ...(isValidDistanceMeters(habit?.defaultDistanceMeters)
            ? [habit.defaultDistanceMeters]
            : []),
          ...basePresets,
        ]),
      ).slice(0, 5),
    [habit?.defaultDistanceMeters],
  );
  const distanceMeters = parseDistanceMeters(distance, distanceUnit);
  const error =
    distanceMeters === null || !isValidDistanceMeters(distanceMeters)
      ? 'Enter a distance greater than zero.'
      : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const nextUnit = habit?.distanceUnitPreference ?? 'km';
      setDistanceUnit(nextUnit);
      setDistance(formatDistanceInput(initialMeters, nextUnit));
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [habit?.distanceUnitPreference, initialMeters, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (error || !distanceMeters) {
      return;
    }

    onSave(distanceMeters);
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
          <h2 id={titleId}>Edit distance</h2>
          <p className="muted" id={descriptionId}>
            {habit.name} · {dateLabel}
          </p>
        </div>

        <p className="time-editor__current">
          Current distance:{' '}
          {initialMeters ? formatDistance(initialMeters, habit.distanceUnitPreference ?? 'km') : 'Unknown'}
        </p>

        <div className="time-preset-grid" aria-label="Distance presets">
          {presets.map((preset) => (
            <button
              className="button button--quiet"
              type="button"
              key={preset}
              onClick={() => {
                setDistance(formatDistanceInput(preset, distanceUnit));
              }}
            >
              {formatDistance(preset, distanceUnit)}
            </button>
          ))}
        </div>

        <div className="time-editor__fields distance-editor__fields">
          <label className="field field--compact">
            <span>Distance</span>
            <input
              value={distance}
              inputMode="decimal"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setDistance(event.target.value)}
            />
          </label>
          <label className="field field--compact">
            <span>Unit</span>
            <select
              value={distanceUnit}
              aria-label="Distance unit"
              onChange={(event) => {
                const value = event.target.value;
                if (isDistanceUnitPreference(value)) {
                  setDistanceUnit(value);
                }
              }}
            >
              <option value="km">km</option>
              <option value="m">m</option>
              <option value="mi">mi</option>
            </select>
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
