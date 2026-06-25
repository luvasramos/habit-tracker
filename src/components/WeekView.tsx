import { format } from 'date-fns';
import type { Habit, LocalDateKey } from '../state/types';
import { getWeekDays } from '../utils/calendar';
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
  const days = getWeekDays(anchorDate);
  const count = days.filter((day) => checkIns[day.key]).length;
  const habitColor = getHabitColorVar(habit.id, habits);

  return (
    <section className="calendar-section" aria-label="Week calendar">
      <div className="week-grid">
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
            onClick={() => onToggle(day.key)}
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
