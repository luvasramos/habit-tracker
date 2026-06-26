import type { CheckInsByHabit, Habit, LocalDateKey } from '../state/types';
import { formatDistance, getCheckInDistanceMeters } from './distance';
import { formatMinutes, getCheckInDurationMinutes, isCompletedCheckIn } from './duration';
import { fullDateLabel, fromLocalDateKey, isFutureDay, isSameLocalDay, toLocalDateKey } from './dates';
import { getHabitColorVar } from './habitAppearance';
import { getHabitCreatedDate, isHabitEligibleOnDate } from './statistics';

export type IndividualStatisticsDateState =
  | 'completed'
  | 'missed'
  | 'future'
  | 'before-habit-creation'
  | 'today'
  | 'completed-known-duration'
  | 'completed-unknown-duration';

export type AllHabitsStatisticsDateState =
  | 'active'
  | 'no-activity'
  | 'future'
  | 'before-all-relevant-habits-existed'
  | 'today';

export type StatisticsDateCompletion = {
  id: string;
  name: string;
  color: string;
  durationMinutes?: number;
  unknownDuration: boolean;
  distanceMeters?: number;
  unknownDistance: boolean;
};

export type StatisticsDateModel = {
  date: Date;
  dateKey: LocalDateKey;
  state: IndividualStatisticsDateState | AllHabitsStatisticsDateState;
  isAllHabits: boolean;
  isToday: boolean;
  isFuture: boolean;
  isUnavailable: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  durationMinutes?: number;
  unknownDuration: boolean;
  distanceMeters?: number;
  unknownDistance: boolean;
  completions: StatisticsDateCompletion[];
};

type StatisticsDateStateOptions = {
  date: Date;
  habits: Habit[];
  checkIns: CheckInsByHabit;
  selectedHabit: Habit | null;
  today?: Date;
};

export const getStatisticsDateState = ({
  date,
  habits,
  checkIns,
  selectedHabit,
  today = new Date(),
}: StatisticsDateStateOptions): StatisticsDateModel => {
  const dateKey = toLocalDateKey(date);
  const todayDate = fromLocalDateKey(toLocalDateKey(today));
  const isToday = isSameLocalDay(date, todayDate);
  const isFuture = isFutureDay(date, todayDate);

  if (selectedHabit) {
    const createdKey = toLocalDateKey(getHabitCreatedDate(selectedHabit, todayDate));
    const entry = checkIns[selectedHabit.id]?.[dateKey];
    const completed = isCompletedCheckIn(entry);
    const durationMinutes = getCheckInDurationMinutes(entry);
    const distanceMeters = getCheckInDistanceMeters(entry);
    const beforeCreation = dateKey < createdKey;
    const unknownDuration =
      selectedHabit.trackingMode === 'duration' &&
      completed &&
      durationMinutes === undefined;
    const completedWithKnownDuration =
      selectedHabit.trackingMode === 'duration' &&
      completed &&
      durationMinutes !== undefined;
    const unknownDistance =
      selectedHabit.trackingMode === 'distance' &&
      completed &&
      distanceMeters === undefined;
    const completedWithKnownDistance =
      selectedHabit.trackingMode === 'distance' &&
      completed &&
      distanceMeters !== undefined;
    const state: IndividualStatisticsDateState = isFuture
      ? 'future'
      : beforeCreation
        ? 'before-habit-creation'
        : completedWithKnownDuration || completedWithKnownDistance
          ? 'completed-known-duration'
          : unknownDuration || unknownDistance
            ? 'completed-unknown-duration'
            : completed
              ? 'completed'
              : isToday
                ? 'today'
                : 'missed';

    return {
      date,
      dateKey,
      state,
      isAllHabits: false,
      isToday,
      isFuture,
      isUnavailable: isFuture || beforeCreation,
      isCompleted: completed && !isFuture && !beforeCreation,
      isMissed: state === 'missed' || state === 'today',
      durationMinutes,
      unknownDuration,
      distanceMeters,
      unknownDistance,
      completions: completed
        ? [
            {
              id: selectedHabit.id,
              name: selectedHabit.name,
              color: getHabitColorVar(selectedHabit.id, habits),
              durationMinutes,
              unknownDuration,
              distanceMeters,
              unknownDistance,
            },
          ]
        : [],
    };
  }

  const eligibleHabits = habits.filter((habit) => isHabitEligibleOnDate(habit, dateKey, todayDate));
  const completions = eligibleHabits
    .filter((habit) => isCompletedCheckIn(checkIns[habit.id]?.[dateKey]))
    .map((habit) => {
      const entry = checkIns[habit.id]?.[dateKey];
      const durationMinutes = getCheckInDurationMinutes(entry);
      const distanceMeters = getCheckInDistanceMeters(entry);
      return {
        id: habit.id,
        name: habit.name,
        color: getHabitColorVar(habit.id, habits),
        durationMinutes,
        unknownDuration:
          habit.trackingMode === 'duration' &&
          isCompletedCheckIn(entry) &&
          durationMinutes === undefined,
        distanceMeters,
        unknownDistance:
          habit.trackingMode === 'distance' &&
          isCompletedCheckIn(entry) &&
          distanceMeters === undefined,
      };
    });
  const noRelevantHabits = eligibleHabits.length === 0;
  const state: AllHabitsStatisticsDateState = isFuture
    ? 'future'
    : noRelevantHabits
      ? 'before-all-relevant-habits-existed'
      : completions.length > 0
        ? 'active'
        : isToday
          ? 'today'
          : 'no-activity';

  return {
    date,
    dateKey,
    state,
    isAllHabits: true,
    isToday,
    isFuture,
    isUnavailable: isFuture || noRelevantHabits,
    isCompleted: completions.length > 0 && !isFuture,
    isMissed: state === 'no-activity' || state === 'today',
    unknownDuration: completions.some((completion) => completion.unknownDuration),
    unknownDistance: completions.some((completion) => completion.unknownDistance),
    completions,
  };
};

export const getStatisticsDateLabel = (
  model: StatisticsDateModel,
  selectedHabit: Habit | null,
) => {
  const dateLabel = fullDateLabel(model.date);

  if (model.isFuture) {
    return `${dateLabel}, future date`;
  }

  if (model.state === 'before-habit-creation') {
    return `${dateLabel}, before ${selectedHabit?.name ?? 'habit'} was created`;
  }

  if (model.state === 'before-all-relevant-habits-existed') {
    return `${dateLabel}, before any selected habit existed`;
  }

  if (selectedHabit) {
    if (model.isCompleted) {
      const timeLabel =
        model.durationMinutes !== undefined
          ? `, ${formatMinutes(model.durationMinutes)} logged`
        : model.unknownDuration
            ? ', no time recorded'
            : '';
      const distanceLabel =
        model.distanceMeters !== undefined
          ? `, ${formatDistance(model.distanceMeters, selectedHabit.distanceUnitPreference ?? 'km')} logged`
          : model.unknownDistance
            ? ', no distance recorded'
            : '';
      return `${dateLabel}, ${selectedHabit.name} completed${timeLabel}${distanceLabel}`;
    }

    return `${dateLabel}, ${selectedHabit.name} not completed`;
  }

  if (model.completions.length > 0) {
    const completionLabel = model.completions
      .map((completion) =>
        completion.durationMinutes !== undefined
          ? `${completion.name}, ${formatMinutes(completion.durationMinutes)}`
          : completion.distanceMeters !== undefined
            ? `${completion.name}, ${formatDistance(completion.distanceMeters)}`
          : completion.unknownDuration
            ? `${completion.name}, no time recorded`
            : completion.unknownDistance
              ? `${completion.name}, no distance recorded`
            : completion.name,
      )
      .join(', ');
    return `${dateLabel}, active: ${completionLabel}`;
  }

  return `${dateLabel}, no activity`;
};
