import type { LocalDateKey } from '../state/types';
import { fullDateLabel, isFutureDay, isSameLocalDay } from '../utils/dates';

type DateButtonProps = {
  date: Date;
  dateKey: LocalDateKey;
  habitName: string;
  completed: boolean;
  children: React.ReactNode;
  compact?: boolean;
  tabIndex?: number;
  disabled?: boolean;
  onClick: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const DateButton = ({
  date,
  dateKey,
  habitName,
  completed,
  children,
  compact = false,
  tabIndex,
  disabled,
  onClick,
  onKeyDown,
}: DateButtonProps) => {
  const future = disabled ?? isFutureDay(date);
  const state = completed ? 'completed' : 'not completed';
  const label = `${habitName}, ${fullDateLabel(date)}, ${state}`;

  return (
    <button
      type="button"
      className={`date-button${completed ? ' is-complete' : ''}${isSameLocalDay(date, new Date()) ? ' is-today' : ''}${compact ? ' date-button--compact' : ''}`}
      data-date-key={dateKey}
      aria-label={label}
      aria-pressed={future ? undefined : completed}
      disabled={future}
      tabIndex={tabIndex}
      title={`${fullDateLabel(date)}: ${state}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
      {completed ? <span className="check-mark" aria-hidden="true">✓</span> : null}
    </button>
  );
};
