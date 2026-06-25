import type { CheckInEntry, CheckInsByHabit, Habit, LocalDateKey } from '../state/types';

export const isValidDurationMinutes = (value: unknown): value is number =>
  Number.isInteger(value) && typeof value === 'number' && value > 0;

export const isCompletedCheckIn = (entry: unknown): entry is CheckInEntry =>
  entry === true ||
  (typeof entry === 'object' &&
    entry !== null &&
    !Array.isArray(entry) &&
    (entry as { completed?: unknown }).completed === true);

export const getCheckInDurationMinutes = (entry: CheckInEntry | undefined) => {
  if (entry === true || !entry) {
    return undefined;
  }

  return isValidDurationMinutes(entry.durationMinutes) ? entry.durationMinutes : undefined;
};

export const normalizeCheckInEntry = (entry: unknown): CheckInEntry | null => {
  if (entry === true) {
    return true;
  }

  if (!isCompletedCheckIn(entry)) {
    return null;
  }

  const durationMinutes = (entry as { durationMinutes?: unknown }).durationMinutes;
  return isValidDurationMinutes(durationMinutes)
    ? { completed: true, durationMinutes }
    : { completed: true };
};

export const createCompletedCheckIn = (durationMinutes?: number): CheckInEntry =>
  isValidDurationMinutes(durationMinutes)
    ? { completed: true, durationMinutes }
    : true;

export const sumLoggedDurationMinutes = (
  checkIns: CheckInsByHabit,
  habitIds?: string[],
  dateKeys?: LocalDateKey[],
) => {
  const habitIdSet = habitIds ? new Set(habitIds) : null;
  const dateKeySet = dateKeys ? new Set(dateKeys) : null;

  return Object.entries(checkIns).reduce((total, [habitId, habitCheckIns]) => {
    if (habitIdSet && !habitIdSet.has(habitId)) {
      return total;
    }

    return (
      total +
      Object.entries(habitCheckIns).reduce((habitTotal, [dateKey, entry]) => {
        if (dateKeySet && !dateKeySet.has(dateKey)) {
          return habitTotal;
        }

        return habitTotal + (getCheckInDurationMinutes(entry) ?? 0);
      }, 0)
    );
  }, 0);
};

export const formatMinutes = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.trunc(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const calculateYearlyGoalProgress = (loggedMinutes: number, yearlyGoalMinutes?: number) => {
  if (!isValidDurationMinutes(yearlyGoalMinutes)) {
    return {
      loggedMinutes: Math.max(0, Math.trunc(loggedMinutes)),
      goalMinutes: 0,
      remainingMinutes: 0,
      percent: 0,
    };
  }

  const safeLoggedMinutes = Math.max(0, Math.trunc(loggedMinutes));
  const remainingMinutes = Math.max(yearlyGoalMinutes - safeLoggedMinutes, 0);

  return {
    loggedMinutes: safeLoggedMinutes,
    goalMinutes: yearlyGoalMinutes,
    remainingMinutes,
    percent: Math.min(safeLoggedMinutes / yearlyGoalMinutes, 1),
  };
};

export const calculateRemainingTimeMinutes = (
  loggedMinutes: number,
  yearlyGoalMinutes?: number,
) => calculateYearlyGoalProgress(loggedMinutes, yearlyGoalMinutes).remainingMinutes;

export const calculateRemainingDefaultSessions = (
  loggedMinutes: number,
  habit: Pick<Habit, 'defaultDurationMinutes' | 'yearlyGoalMinutes'>,
) => {
  const remainingMinutes = calculateRemainingTimeMinutes(loggedMinutes, habit.yearlyGoalMinutes);

  if (!isValidDurationMinutes(habit.defaultDurationMinutes)) {
    return 0;
  }

  return Math.ceil(remainingMinutes / habit.defaultDurationMinutes);
};
