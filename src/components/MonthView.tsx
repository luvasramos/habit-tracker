import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { Habit, LocalDateKey } from '../state/types';
import { getMonthCells } from '../utils/calendar';
import { isFutureDay, monthBounds } from '../utils/dates';
import { DateButton } from './DateButton';

type MonthViewProps = {
  habit: Habit;
  anchorDate: Date;
  checkIns: Record<LocalDateKey, true>;
  onToggle: (dateKey: LocalDateKey) => void;
};

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthView = ({ habit, anchorDate, checkIns, onToggle }: MonthViewProps) => {
  const cells = useMemo(() => getMonthCells(anchorDate), [anchorDate]);
  const enabledKeys = cells
    .filter((cell) => cell.inPeriod && !isFutureDay(cell.date))
    .map((cell) => cell.key);
  const [focusedKey, setFocusedKey] = useState(enabledKeys[0] ?? '');
  const { start, end } = monthBounds(anchorDate);
  const count = Object.keys(checkIns).filter((key) => {
    const cell = cells.find((item) => item.key === key);
    return cell?.inPeriod;
  }).length;

  useEffect(() => {
    if (!enabledKeys.includes(focusedKey)) {
      setFocusedKey(enabledKeys[0] ?? '');
    }
  }, [enabledKeys, focusedKey]);

  const moveFocus = (currentKey: string, delta: number) => {
    const currentIndex = cells.findIndex((cell) => cell.key === currentKey);
    let nextIndex = currentIndex + delta;
    while (nextIndex >= 0 && nextIndex < cells.length) {
      const next = cells[nextIndex];
      if (next.inPeriod && !isFutureDay(next.date)) {
        setFocusedKey(next.key);
        window.setTimeout(() => {
          document.querySelector<HTMLButtonElement>(`[data-date-key="${next.key}"]`)?.focus();
        }, 0);
        return;
      }
      nextIndex += delta > 0 ? 1 : -1;
    }
  };

  return (
    <section className="calendar-section" aria-label="Month calendar">
      <div className="month-grid" role="grid" aria-label={`${format(start, 'MMMM yyyy')} calendar`}>
        {weekdayLabels.map((label) => (
          <div className="weekday-heading" key={label} role="columnheader">
            {label}
          </div>
        ))}
        {cells.map((cell) =>
          cell.inPeriod ? (
            <DateButton
              key={cell.key}
              date={cell.date}
              dateKey={cell.key}
              habitName={habit.name}
              completed={Boolean(checkIns[cell.key])}
              tabIndex={cell.key === focusedKey ? 0 : -1}
              onClick={() => onToggle(cell.key)}
              onKeyDown={(event) => {
                const moves: Record<string, number> = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                };
                if (event.key in moves) {
                  event.preventDefault();
                  moveFocus(cell.key, moves[event.key]);
                }
              }}
            >
              <span>{format(cell.date, 'd')}</span>
            </DateButton>
          ) : (
            <div className="date-placeholder" key={cell.key} aria-hidden="true" />
          ),
        )}
      </div>
      <p className="summary">
        {count} completed days in {format(start, 'MMMM')}
        <span className="sr-only">, from {format(start, 'MMMM d')} to {format(end, 'MMMM d, yyyy')}</span>
      </p>
    </section>
  );
};
