import { format } from 'date-fns';
import type { CheckInEntry, Habit, LocalDateKey } from '../state/types';
import { fromLocalDateKey } from '../utils/dates';
import { formatMinutes, getCheckInDurationMinutes, isCompletedCheckIn } from '../utils/duration';
import { HabitIconView } from '../utils/habitAppearance';
import { Icon } from './Icon';

type CalendarDateDetailsProps = {
  habit: Habit;
  dateKey: LocalDateKey;
  entry: CheckInEntry | undefined;
  onEditTime?: (dateKey: LocalDateKey) => void;
};

export const CalendarDateDetails = ({
  habit,
  dateKey,
  entry,
  onEditTime,
}: CalendarDateDetailsProps) => {
  if (!dateKey) {
    return null;
  }

  const completed = isCompletedCheckIn(entry);
  const durationMinutes = getCheckInDurationMinutes(entry);
  const canEditTime = habit.trackingMode === 'duration' && completed && Boolean(onEditTime);
  const date = fromLocalDateKey(dateKey);

  return (
    <aside className="calendar-date-details" aria-label={`${format(date, 'MMM d')} details`}>
      <div className="calendar-date-details__identity">
        <HabitIconView habit={habit} />
        <div>
          <span>{habit.name}</span>
          <small>{format(date, 'EEE, MMM d')}</small>
        </div>
      </div>
      <div className="calendar-date-details__meta">
        <span>{completed ? 'Completed' : 'Not completed'}</span>
        {habit.trackingMode === 'duration' && completed ? (
          <span>
            {durationMinutes ? `${formatMinutes(durationMinutes)} logged` : 'Time not logged'}
          </span>
        ) : null}
      </div>
      {canEditTime ? (
        <button
          className="button button--quiet time-edit-trigger"
          type="button"
          aria-label={`Edit time for ${habit.name} on ${format(date, 'MMMM d')}`}
          onClick={() => onEditTime?.(dateKey)}
        >
          <Icon name="edit" />
          Edit time
        </button>
      ) : null}
    </aside>
  );
};
