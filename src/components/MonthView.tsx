import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { CheckInsByHabit, CheckInEntry, Habit, LocalDateKey } from '../state/types';
import { getMonthCells } from '../utils/calendar';
import { isFutureDay, monthBounds } from '../utils/dates';
import { formatDistance, getCheckInDistanceMeters } from '../utils/distance';
import { formatMinutes, getCheckInDurationMinutes, isCompletedCheckIn } from '../utils/duration';
import { getDateCompletions, getHabitColorVar } from '../utils/habitColors';
import { CalendarDateDetails } from './CalendarDateDetails';
import { DateButton } from './DateButton';

type MonthViewProps = {
  habit: Habit;
  habits: Habit[];
  anchorDate: Date;
  checkIns: Record<LocalDateKey, CheckInEntry>;
  allCheckIns: CheckInsByHabit;
  onToggle: (dateKey: LocalDateKey) => void;
  onEditTime?: (dateKey: LocalDateKey) => void;
  onEditDistance?: (dateKey: LocalDateKey) => void;
};

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthView = ({
  habit,
  habits,
  anchorDate,
  checkIns,
  allCheckIns,
  onToggle,
  onEditTime,
  onEditDistance,
}: MonthViewProps) => {
  const cells = useMemo(() => getMonthCells(anchorDate), [anchorDate]);
  const enabledKeys = cells
    .filter((cell) => cell.inPeriod && !isFutureDay(cell.date))
    .map((cell) => cell.key);
  const [focusedKey, setFocusedKey] = useState(enabledKeys[0] ?? '');
  const { start, end } = monthBounds(anchorDate);
  const habitColor = getHabitColorVar(habit.id, habits);
  const fallbackEditKey =
    cells.find((cell) => cell.inPeriod && isCompletedCheckIn(checkIns[cell.key]))?.key ?? '';
  const detailKey = focusedKey || fallbackEditKey;
  const count = Object.keys(checkIns).filter((key) => {
    const cell = cells.find((item) => item.key === key);
    return cell?.inPeriod && isCompletedCheckIn(checkIns[key]);
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
              completed={isCompletedCheckIn(checkIns[cell.key])}
              habitColor={habitColor}
              completions={getDateCompletions(cell.key, habits, allCheckIns).map(
                ({ habit: completedHabit, color }) => {
                  const durationMinutes = getCheckInDurationMinutes(
                    allCheckIns[completedHabit.id]?.[cell.key],
                  );
                  const distanceMeters = getCheckInDistanceMeters(
                    allCheckIns[completedHabit.id]?.[cell.key],
                  );
                  return {
                    id: completedHabit.id,
                    name: completedHabit.name,
                    color,
                    durationLabel: durationMinutes
                      ? formatMinutes(durationMinutes)
                      : distanceMeters
                        ? formatDistance(distanceMeters, completedHabit.distanceUnitPreference ?? 'km')
                        : undefined,
                  };
                },
              )}
              tabIndex={cell.key === focusedKey ? 0 : -1}
              onClick={() => {
                setFocusedKey(cell.key);
                onToggle(cell.key);
              }}
              onFocus={() => setFocusedKey(cell.key)}
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
              <span className="month-day-number">{format(cell.date, 'd')}</span>
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
      <CalendarDateDetails
        habit={habit}
        dateKey={detailKey}
        entry={checkIns[detailKey]}
        onEditTime={onEditTime}
        onEditDistance={onEditDistance}
      />
    </section>
  );
};
