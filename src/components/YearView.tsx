import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import type { CheckInsByHabit, CheckInEntry, Habit, LocalDateKey } from '../state/types';
import { getMonthCells } from '../utils/calendar';
import { formatMinutes, getCheckInDurationMinutes, isCompletedCheckIn } from '../utils/duration';
import { getDateCompletions, getHabitColorVar } from '../utils/habitColors';
import { CalendarDateDetails } from './CalendarDateDetails';
import { DateButton } from './DateButton';

type YearViewProps = {
  habit: Habit;
  habits: Habit[];
  anchorDate: Date;
  checkIns: Record<LocalDateKey, CheckInEntry>;
  allCheckIns: CheckInsByHabit;
  onToggle: (dateKey: LocalDateKey) => void;
  onEditTime?: (dateKey: LocalDateKey) => void;
};

const weekdayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const YearView = ({
  habit,
  habits,
  anchorDate,
  checkIns,
  allCheckIns,
  onToggle,
  onEditTime,
}: YearViewProps) => {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(anchorDate.getFullYear(), month, 1)),
    [anchorDate],
  );
  const [activeKey, setActiveKey] = useState<LocalDateKey>('');
  const year = anchorDate.getFullYear();
  const habitColor = getHabitColorVar(habit.id, habits);
  const count = Object.entries(checkIns).filter(
    ([key, entry]) => key.startsWith(`${year}-`) && isCompletedCheckIn(entry),
  ).length;
  const fallbackEditKey =
    Object.entries(checkIns).find(
      ([key, entry]) => key.startsWith(`${year}-`) && isCompletedCheckIn(entry),
    )?.[0] ?? '';
  const detailKey = activeKey || fallbackEditKey;

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
                    completed={isCompletedCheckIn(checkIns[cell.key])}
                    habitColor={habitColor}
                    completions={getDateCompletions(cell.key, habits, allCheckIns).map(
                      ({ habit: completedHabit, color }) => {
                        const durationMinutes = getCheckInDurationMinutes(
                          allCheckIns[completedHabit.id]?.[cell.key],
                        );
                        return {
                          id: completedHabit.id,
                          name: completedHabit.name,
                          color,
                          durationLabel: durationMinutes ? formatMinutes(durationMinutes) : undefined,
                        };
                      },
                    )}
                    compact
                    onClick={() => {
                      setActiveKey(cell.key);
                      onToggle(cell.key);
                    }}
                    onFocus={() => setActiveKey(cell.key)}
                  >
                    <span className="year-day-number">{format(cell.date, 'd')}</span>
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
      <CalendarDateDetails
        habit={habit}
        dateKey={detailKey}
        entry={checkIns[detailKey]}
        onEditTime={onEditTime}
      />
    </section>
  );
};
