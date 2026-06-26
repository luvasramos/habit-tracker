import type { CheckInsByHabit, Habit, LocalDateKey, ViewMode } from '../state/types';
import { getWeekDays } from './calendar';
import {
  daysBetweenInclusive,
  fromLocalDateKey,
  isFutureDay,
  monthBounds,
  stripTime,
  toLocalDateKey,
  yearBounds,
} from './dates';
import {
  getCheckInDurationMinutes,
  getDurationHabitSummary,
  isCompletedCheckIn,
} from './duration';

const localDateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const leadingLocalDateKeyPattern = /^(\d{4}-\d{2}-\d{2})/;

export const getRangeDays = (range: ViewMode, anchorDate: Date) => {
  if (range === 'week') {
    return getWeekDays(anchorDate).map((day) => day.date);
  }

  if (range === 'month') {
    const { start, end } = monthBounds(anchorDate);
    return daysBetweenInclusive(start, end);
  }

  const { start, end } = yearBounds(anchorDate);
  return daysBetweenInclusive(start, end);
};

export const getHabitCreatedDate = (habit: Pick<Habit, 'createdAt'>, fallback = new Date()) => {
  if (localDateKeyPattern.test(habit.createdAt)) {
    return fromLocalDateKey(habit.createdAt);
  }

  const localDateMatch = habit.createdAt.match(leadingLocalDateKeyPattern);
  if (localDateMatch) {
    return fromLocalDateKey(localDateMatch[1]);
  }

  const createdAt = new Date(habit.createdAt);
  return Number.isNaN(createdAt.getTime()) ? stripTime(fallback) : stripTime(createdAt);
};

export const getHabitEligibleDateKeys = (
  habit: Pick<Habit, 'createdAt'>,
  periodDays: Date[],
  today = new Date(),
) => {
  const createdKey = toLocalDateKey(getHabitCreatedDate(habit, today));

  return periodDays
    .filter((day) => !isFutureDay(day, today))
    .map(toLocalDateKey)
    .filter((dateKey) => dateKey >= createdKey);
};

export const isHabitEligibleOnDate = (
  habit: Pick<Habit, 'createdAt'>,
  dateKey: LocalDateKey,
  today = new Date(),
) => {
  const date = fromLocalDateKey(dateKey);
  return !isFutureDay(date, today) && dateKey >= toLocalDateKey(getHabitCreatedDate(habit, today));
};

export const calculateHabitStatistics = (
  habit: Habit,
  habitCheckIns: CheckInsByHabit[string] | undefined,
  periodDays: Date[],
  today = new Date(),
) => {
  const eligibleDateKeys = getHabitEligibleDateKeys(habit, periodDays, today);
  const daysDone = eligibleDateKeys.filter((dateKey) =>
    isCompletedCheckIn(habitCheckIns?.[dateKey]),
  ).length;
  const loggedMinutes = eligibleDateKeys.reduce(
    (sum, dateKey) => sum + (getCheckInDurationMinutes(habitCheckIns?.[dateKey]) ?? 0),
    0,
  );
  const completedDaysWithoutTime = eligibleDateKeys.filter((dateKey) => {
    const entry = habitCheckIns?.[dateKey];
    return isCompletedCheckIn(entry) && getCheckInDurationMinutes(entry) === undefined;
  }).length;

  return {
    habit,
    eligibleDateKeys,
    daysDone,
    daysMissed: Math.max(eligibleDateKeys.length - daysDone, 0),
    loggedMinutes,
    completedDaysWithoutTime,
    durationSummary: getDurationHabitSummary(habit, habitCheckIns, eligibleDateKeys),
  };
};

export const calculateAllHabitsStatistics = (
  habits: Habit[],
  checkIns: CheckInsByHabit,
  periodDays: Date[],
  today = new Date(),
) => {
  const habitStatistics = habits.map((habit) =>
    calculateHabitStatistics(habit, checkIns[habit.id], periodDays, today),
  );
  const eligibleDateKeys = Array.from(
    new Set(habitStatistics.flatMap((stat) => stat.eligibleDateKeys)),
  ).sort();
  const activeDateKeys = eligibleDateKeys.filter((dateKey) =>
    habits.some(
      (habit) =>
        isHabitEligibleOnDate(habit, dateKey, today) &&
        isCompletedCheckIn(checkIns[habit.id]?.[dateKey]),
    ),
  );
  const activeDateKeySet = new Set(activeDateKeys);
  const inactiveDateKeys = eligibleDateKeys.filter((dateKey) => !activeDateKeySet.has(dateKey));

  return {
    habitStatistics,
    eligibleDateKeys,
    activeDateKeys,
    inactiveDateKeys,
    totalLoggedMinutes: habitStatistics.reduce((sum, stat) => sum + stat.loggedMinutes, 0),
  };
};

export const calculateAllHabitsActiveDayBreakdown = (
  habits: Habit[],
  checkIns: CheckInsByHabit,
  eligibleDateKeys: LocalDateKey[],
  today = new Date(),
) =>
  habits.map((habit) => {
    let activeDayShare = 0;
    let completedDays = 0;

    eligibleDateKeys.forEach((dateKey) => {
      if (!isHabitEligibleOnDate(habit, dateKey, today)) {
        return;
      }

      const completedHabitsForDate = habits.filter(
        (candidate) =>
          isHabitEligibleOnDate(candidate, dateKey, today) &&
          isCompletedCheckIn(checkIns[candidate.id]?.[dateKey]),
      );

      if (!completedHabitsForDate.some((candidate) => candidate.id === habit.id)) {
        return;
      }

      completedDays += 1;
      activeDayShare += 1 / completedHabitsForDate.length;
    });

    return {
      habit,
      activeDayShare,
      completedDays,
    };
  });
