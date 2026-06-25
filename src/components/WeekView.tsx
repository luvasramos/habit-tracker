import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { CheckInsByHabit, CheckInEntry, Habit, LocalDateKey } from '../state/types';
import { getWeekDays } from '../utils/calendar';
import { isFutureDay } from '../utils/dates';
import { formatMinutes, getCheckInDurationMinutes, isCompletedCheckIn } from '../utils/duration';
import { getDateCompletions, getHabitColorVar } from '../utils/habitColors';
import { Icon } from './Icon';
import { DateButton } from './DateButton';

type ViewProps = {
  habit: Habit;
  habits: Habit[];
  anchorDate: Date;
  checkIns: Record<LocalDateKey, CheckInEntry>;
  allCheckIns: CheckInsByHabit;
  onToggle: (dateKey: LocalDateKey) => void;
  onEditTime?: (dateKey: LocalDateKey) => void;
};

export const WeekView = ({
  habit,
  habits,
  anchorDate,
  checkIns,
  allCheckIns,
  onToggle,
  onEditTime,
}: ViewProps) => {
  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const enabledKeys = useMemo(
    () => days.filter((day) => !isFutureDay(day.date)).map((day) => day.key),
    [days],
  );
  const [focusedKey, setFocusedKey] = useState(enabledKeys[0] ?? '');
  const count = days.filter((day) => isCompletedCheckIn(checkIns[day.key])).length;
  const habitColor = getHabitColorVar(habit.id, habits);
  const fallbackEditKey =
    days.find((day) => isCompletedCheckIn(checkIns[day.key]))?.key ?? '';
  const editKey = isCompletedCheckIn(checkIns[focusedKey]) ? focusedKey : fallbackEditKey;
  const editEntry = checkIns[editKey];
  const editDuration = getCheckInDurationMinutes(editEntry);
  const canEditTime =
    habit.trackingMode === 'duration' && isCompletedCheckIn(editEntry) && Boolean(onEditTime);

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
            completed={isCompletedCheckIn(checkIns[day.key])}
            habitColor={habitColor}
            completions={getDateCompletions(day.key, habits, allCheckIns).map(
              ({ habit: completedHabit, color }) => ({
                id: completedHabit.id,
                name: completedHabit.name,
                color,
              }),
            )}
            tabIndex={day.key === focusedKey ? 0 : -1}
            onClick={() => {
              setFocusedKey(day.key);
              onToggle(day.key);
            }}
            onFocus={() => setFocusedKey(day.key)}
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
      {canEditTime ? (
        <button
          className="button button--quiet time-edit-trigger"
          type="button"
          aria-label={`Edit time for ${habit.name}`}
          onClick={() => onEditTime?.(editKey)}
        >
          <Icon name="edit" />
          Edit time
          <span>
            {editDuration ? formatMinutes(editDuration) : 'Unknown time'}
          </span>
        </button>
      ) : null}
    </section>
  );
};
