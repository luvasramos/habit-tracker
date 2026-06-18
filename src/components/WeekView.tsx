import { format } from 'date-fns';
import type { Habit, LocalDateKey } from '../state/types';
import { getWeekDays } from '../utils/calendar';
import { DateButton } from './DateButton';

type ViewProps = {
  habit: Habit;
  anchorDate: Date;
  checkIns: Record<LocalDateKey, true>;
  onToggle: (dateKey: LocalDateKey) => void;
};

export const WeekView = ({ habit, anchorDate, checkIns, onToggle }: ViewProps) => {
  const days = getWeekDays(anchorDate);
  const count = days.filter((day) => checkIns[day.key]).length;

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
            onClick={() => onToggle(day.key)}
          >
            <span>{format(day.date, 'EEE')}</span>
            <strong>{format(day.date, 'd')}</strong>
          </DateButton>
        ))}
      </div>
      <p className="summary">{count} completed days this week</p>
    </section>
  );
};
