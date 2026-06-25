import { format } from 'date-fns';
import { useMemo } from 'react';
import type { Habit, LocalDateKey } from '../state/types';
import { getMonthCells } from '../utils/calendar';
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

const weekdayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const YearView = ({ habit, habits, anchorDate, checkIns, allCheckIns, onToggle }: YearViewProps) => {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(anchorDate.getFullYear(), month, 1)),
    [anchorDate],
  );
  const year = anchorDate.getFullYear();
  const habitColor = getHabitColorVar(habit.id, habits);
  const count = Object.keys(checkIns).filter((key) => key.startsWith(`${year}-`)).length;

  return (
    <section className="calendar-section" aria-label="Year calendar">
      <div className="year-months calendar-year-months">
        {months.map((month) => (
          <section className="year-month-card" key={month.getMonth()} aria-label={format(month, 'MMMM')}>
            <div className="year-month-card__header">
              <h3>{format(month, 'MMM')}</h3>
            </div>
            <div className="year-month-card__weekdays" aria-hidden="true">
              {weekdayInitials.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="year-month-card__grid">
              {getMonthCells(month).map((cell) =>
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
                    onClick={() => onToggle(cell.key)}
                  >
                    <span className="sr-only">{format(cell.date, 'MMM d')}</span>
                  </DateButton>
                ) : (
                  <span className="year-month-day is-outside" key={cell.key} aria-hidden="true" />
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="summary">{count} completed days in {year}</p>
    </section>
  );
};
