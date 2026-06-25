import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import type { LocalDateKey } from '../state/types';
import { fullDateLabel, isFutureDay, isSameLocalDay } from '../utils/dates';
import { Icon } from './Icon';

type DateButtonProps = {
  date: Date;
  dateKey: LocalDateKey;
  habitName: string;
  completed: boolean;
  habitColor: string;
  completions?: Array<{ id: string; name: string; color: string }>;
  children: ReactNode;
  compact?: boolean;
  tabIndex?: number;
  disabled?: boolean;
  onClick: () => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

export const DateButton = ({
  date,
  dateKey,
  habitName,
  completed,
  habitColor,
  completions = [],
  children,
  compact = false,
  tabIndex,
  disabled,
  onClick,
  onFocus,
  onKeyDown,
}: DateButtonProps) => {
  const future = disabled ?? isFutureDay(date);
  const state = completed ? 'completed' : 'not completed';
  const completionLabel =
    completions.length > 0
      ? `${completions.map((completion) => completion.name).join(', ')} completed`
      : undefined;
  const label = `${habitName}, ${fullDateLabel(date)}, ${state}${completionLabel ? `. ${completionLabel}.` : ''}`;

  return (
    <button
      type="button"
      className={`date-button${completed ? ' is-complete' : ''}${completions.length > 0 ? ' has-completions' : ''}${isSameLocalDay(date, new Date()) ? ' is-today' : ''}${compact ? ' date-button--compact' : ''}`}
      data-date-key={dateKey}
      aria-label={label}
      aria-pressed={future ? undefined : completed}
      disabled={future}
      tabIndex={tabIndex}
      title={`${fullDateLabel(date)}: ${state}`}
      style={{ '--habit-color': habitColor } as CSSProperties}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      {children}
      {completions.length > 0 ? (
        <span className="completion-dots" aria-label={completionLabel}>
          {completions.slice(0, 4).map((completion) => (
            <span
              className="completion-dot"
              key={completion.id}
              style={{ '--dot-color': completion.color } as CSSProperties}
            />
          ))}
        </span>
      ) : null}
      {completed ? <Icon name="check" className="check-mark" /> : null}
    </button>
  );
};
