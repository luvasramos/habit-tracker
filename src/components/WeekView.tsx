import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { Habit, LocalDateKey } from '../state/types';
import { getWeekDays } from '../utils/calendar';
import { isFutureDay } from '../utils/dates';
import { getDateCompletions, getHabitColorVar } from '../utils/habitColors';
import { DateButton } from './DateButton';

type ViewProps = {
  habit: Habit;
  habits: Habit[];
  anchorDate: Date;
  checkIns: Record<LocalDateKey, true>;
  allCheckIns: Record<string, Record<LocalDateKey, true>>;
  onToggle: (dateKey: LocalDateKey) => void;
};

export const WeekView = ({ habit, habits, anchorDate, checkIns, allCheckIns, onToggle }: ViewProps) => {
  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const enabledKeys = useMemo(
    () => days.filter((day) => !isFutureDay(day.date)).map((day) => day.key),
    [days],
  );
  const [focusedKey, setFocusedKey] = useState(enabledKeys[0] ?? '');
  const count = days.filter((day) => checkIns[day.key]).length;
  const habitColor = getHabitColorVar(habit.id, habits);

  useEffect(() => {
    if (!enabledKeys.includes(focusedKey)) {
      setFocusedKey(enabledKeys[0] ?? '');
    }
  }, [enabledKeys, focusedKey]);

  const moveFocus = (currentKey: string, delta: number) => {
    const currentIndex = days.findIndex((day) => day.key === currentKey);
    let nextIndex = currentIndex + delta;
    while (nextIndex >= 0 && nextIndex < days.length) {
      const next = days[nextIndex];
      if (!isFutureDay(next.date)) {
        setFocusedKey(next.key);
        window.setTimeout(() => {
          document.querySelector<HTMLButtonElement>(`[data-date-key="${next.key}"]`)?.focus();
        }, 0);
        return;
      }
      nextIndex += delta > 0 ? 1 : -1;
    }
  };

  const focusDate = (dateKey: LocalDateKey) => {
    setFocusedKey(dateKey);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(`[data-date-key="${dateKey}"]`)?.focus();
    }, 0);
  };

  return (
    <section className="calendar-section" aria-label="Week calendar">
      <div className="week-grid" role="grid" aria-label={`${format(days[0].date, 'MMM d')} week`}>
        {days.map((day) => (
          <DateButton
            key={day.key}
            date={day.date}
            dateKey={day.key}
            habitName={habit.name}
            completed={Boolean(checkIns[day.key])}
            habitColor={habitColor}
            completions={getDateCompletions(day.key, habits, allCheckIns).map(
              ({ habit: completedHabit, color }) => ({
                id: completedHabit.id,
                name: completedHabit.name,
                color,
              }),
            )}
            tabIndex={day.key === focusedKey ? 0 : -1}
            onClick={() => onToggle(day.key)}
            onKeyDown={(event) => {
              const moves: Record<string, number> = {
                ArrowLeft: -1,
                ArrowRight: 1,
              };
              if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                focusDate(
                  event.key === 'Home'
                    ? enabledKeys[0]
                    : enabledKeys[enabledKeys.length - 1],
                );
                return;
              }
              if (event.key in moves) {
                event.preventDefault();
                moveFocus(day.key, moves[event.key]);
              }
            }}
          >
            <span className="week-day-label">{format(day.date, 'EEE')}</span>
            <span className="week-day-number">{format(day.date, 'd')}</span>
          </DateButton>
        ))}
      </div>
      <p className="summary">{count} completed days this week</p>
    </section>
  );
};
