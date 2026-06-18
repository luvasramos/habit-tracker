import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { Habit, LocalDateKey } from '../state/types';
import { getYearColumns, getYearMonthLabels } from '../utils/calendar';
import { isFutureDay } from '../utils/dates';
import { getDateCompletions, getHabitColorVar } from '../utils/habitColors';
import { DateButton } from './DateButton';

type YearViewProps = {
  habit: Habit;
  habits: Habit[];
  anchorDate: Date;
  checkIns: Record<LocalDateKey, true>;
  allCheckIns: Record<string, Record<LocalDateKey, true>>;
  onToggle: (dateKey: LocalDateKey) => void;
};

export const YearView = ({ habit, habits, anchorDate, checkIns, allCheckIns, onToggle }: YearViewProps) => {
  const columns = useMemo(() => getYearColumns(anchorDate), [anchorDate]);
  const monthLabels = useMemo(() => getYearMonthLabels(anchorDate), [anchorDate]);
  const cells = columns.flat();
  const enabledKeys = cells
    .filter((cell) => cell.inPeriod && !isFutureDay(cell.date))
    .map((cell) => cell.key);
  const [focusedKey, setFocusedKey] = useState(enabledKeys[0] ?? '');
  const year = anchorDate.getFullYear();
  const habitColor = getHabitColorVar(habit.id, habits);
  const count = Object.keys(checkIns).filter((key) => key.startsWith(`${year}-`)).length;

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
    <section className="calendar-section" aria-label="Year calendar">
      <div className="year-scroll">
        <div
          className="year-grid"
          style={{ gridTemplateColumns: `40px repeat(${columns.length}, 44px)` }}
        >
          <div aria-hidden="true" />
          {monthLabels.map((month) => (
            <div
              className="year-month-label"
              key={`${month.label}-${month.column}`}
              style={{ gridColumn: `${month.column + 2} / span 4` }}
            >
              {month.label}
            </div>
          ))}
          <div className="year-weekday-label year-weekday-label--mon">Mon</div>
          <div className="year-weekday-label year-weekday-label--wed">Wed</div>
          <div className="year-weekday-label year-weekday-label--fri">Fri</div>
          {columns.map((week, columnIndex) => (
            <div
              className="year-column"
              key={week.map((cell) => cell.key).join('-')}
              style={{ gridColumn: columnIndex + 2 }}
            >
              {week.map((cell, rowIndex) =>
                cell.inPeriod ? (
                  <DateButton
                    key={cell.key}
                    date={cell.date}
                    dateKey={cell.key}
                    habitName={habit.name}
                    completed={Boolean(checkIns[cell.key])}
                    habitColor={habitColor}
                    completions={getDateCompletions(cell.key, habits, allCheckIns).map(
                      ({ habit: completedHabit, color }) => ({
                        id: completedHabit.id,
                        name: completedHabit.name,
                        color,
                      }),
                    )}
                    compact
                    tabIndex={cell.key === focusedKey ? 0 : -1}
                    onClick={() => onToggle(cell.key)}
                    onKeyDown={(event) => {
                      const moves: Record<string, number> = {
                        ArrowLeft: -7,
                        ArrowRight: 7,
                        ArrowUp: -1,
                        ArrowDown: 1,
                      };
                      if (event.key in moves) {
                        event.preventDefault();
                        moveFocus(cell.key, moves[event.key]);
                      }
                    }}
                  >
                    <span className="sr-only">{format(cell.date, 'MMM d')}</span>
                  </DateButton>
                ) : (
                  <div
                    className="year-empty-cell"
                    key={`${columnIndex}-${rowIndex}`}
                    aria-hidden="true"
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="summary">{count} completed days in {year}</p>
    </section>
  );
};
