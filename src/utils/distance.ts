import type {
  CheckInEntry,
  CheckInsByHabit,
  DistanceUnitPreference,
  Habit,
  LocalDateKey,
} from '../state/types';

const METERS_PER_MILE = 1609.344;

const compactNumber = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

export const metersFromKilometers = (kilometers: number) =>
  Math.round(kilometers * 1000);

export const metersFromMiles = (miles: number) => Math.round(miles * METERS_PER_MILE);

export const kilometersFromMeters = (meters: number) => meters / 1000;

export const milesFromMeters = (meters: number) => meters / METERS_PER_MILE;

export const isValidDistanceMeters = (value: unknown): value is number =>
  Number.isInteger(value) && typeof value === 'number' && value > 0;

export const isDistanceUnitPreference = (
  value: unknown,
): value is DistanceUnitPreference => value === 'km' || value === 'm' || value === 'mi';

export const normalizeDistanceUnitPreference = (
  value: unknown,
): DistanceUnitPreference => (isDistanceUnitPreference(value) ? value : 'km');

const isCompletedDistanceCheckIn = (entry: unknown): entry is CheckInEntry =>
  entry === true ||
  (typeof entry === 'object' &&
    entry !== null &&
    !Array.isArray(entry) &&
    (entry as { completed?: unknown }).completed === true);

export const getCheckInDistanceMeters = (entry: CheckInEntry | undefined) => {
  if (entry === true || !entry) {
    return undefined;
  }

  return isValidDistanceMeters(entry.distanceMeters) ? entry.distanceMeters : undefined;
};

export const createCompletedDistanceCheckIn = (distanceMeters?: number): CheckInEntry =>
  isValidDistanceMeters(distanceMeters)
    ? { completed: true, distanceMeters }
    : true;

export const getDefaultDistanceMeters = (
  habit: Pick<Habit, 'trackingMode' | 'defaultDistanceMeters'>,
) =>
  habit.trackingMode === 'distance' && isValidDistanceMeters(habit.defaultDistanceMeters)
    ? habit.defaultDistanceMeters
    : undefined;

export const sumLoggedDistanceMeters = (
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

        return habitTotal + (getCheckInDistanceMeters(entry) ?? 0);
      }, 0)
    );
  }, 0);
};

export const formatDistance = (
  meters: number,
  unitPreference: DistanceUnitPreference = 'km',
) => {
  const safeMeters = Math.max(0, Math.trunc(meters));

  if (unitPreference === 'm' || (unitPreference === 'km' && safeMeters < 1000)) {
    return `${compactNumber.format(safeMeters)} m`;
  }

  if (unitPreference === 'mi') {
    return `${compactNumber.format(milesFromMeters(safeMeters))} mi`;
  }

  return `${compactNumber.format(kilometersFromMeters(safeMeters))} km`;
};

export const calculateYearlyDistanceGoalProgress = (
  loggedMeters: number,
  yearlyDistanceGoalMeters?: number,
) => {
  const safeLoggedMeters = Math.max(0, Math.trunc(loggedMeters));

  if (!isValidDistanceMeters(yearlyDistanceGoalMeters)) {
    return {
      loggedMeters: safeLoggedMeters,
      goalMeters: 0,
      remainingMeters: 0,
      percent: 0,
      visualPercent: 0,
    };
  }

  const remainingMeters = Math.max(yearlyDistanceGoalMeters - safeLoggedMeters, 0);
  const percent = safeLoggedMeters / yearlyDistanceGoalMeters;

  return {
    loggedMeters: safeLoggedMeters,
    goalMeters: yearlyDistanceGoalMeters,
    remainingMeters,
    percent,
    visualPercent: Math.min(percent, 1),
  };
};

export const calculateRemainingDistanceMeters = (
  loggedMeters: number,
  yearlyDistanceGoalMeters?: number,
) =>
  calculateYearlyDistanceGoalProgress(loggedMeters, yearlyDistanceGoalMeters).remainingMeters;

export const calculateRemainingDefaultDistanceSessions = (
  loggedMeters: number,
  habit: Pick<Habit, 'defaultDistanceMeters' | 'yearlyDistanceGoalMeters'>,
) => {
  const remainingMeters = calculateRemainingDistanceMeters(
    loggedMeters,
    habit.yearlyDistanceGoalMeters,
  );

  if (!isValidDistanceMeters(habit.defaultDistanceMeters)) {
    return 0;
  }

  return Math.ceil(remainingMeters / habit.defaultDistanceMeters);
};

export const calculateAverageDistanceMeters = (loggedMeters: number, loggedDays: number) =>
  loggedDays > 0 ? Math.round(loggedMeters / loggedDays) : 0;

export const getDistanceHabitSummary = (
  habit: Pick<Habit, 'defaultDistanceMeters' | 'yearlyDistanceGoalMeters'>,
  habitCheckIns: Record<LocalDateKey, CheckInEntry> | undefined,
  dateKeys: LocalDateKey[],
) => {
  const summary = dateKeys.reduce(
    (current, dateKey) => {
      const entry = habitCheckIns?.[dateKey];
      if (!isCompletedDistanceCheckIn(entry)) {
        return current;
      }

      const distanceMeters = getCheckInDistanceMeters(entry);
      return {
        completedDays: current.completedDays + 1,
        loggedDays: distanceMeters ? current.loggedDays + 1 : current.loggedDays,
        unknownDistanceDays:
          distanceMeters === undefined
            ? current.unknownDistanceDays + 1
            : current.unknownDistanceDays,
        loggedMeters: current.loggedMeters + (distanceMeters ?? 0),
      };
    },
    {
      completedDays: 0,
      loggedDays: 0,
      unknownDistanceDays: 0,
      loggedMeters: 0,
    },
  );
  const goal = calculateYearlyDistanceGoalProgress(
    summary.loggedMeters,
    habit.yearlyDistanceGoalMeters,
  );

  return {
    ...summary,
    averageMetersPerLoggedDay: calculateAverageDistanceMeters(
      summary.loggedMeters,
      summary.loggedDays,
    ),
    goalMeters: goal.goalMeters,
    progressPercent: goal.percent,
    visualProgressPercent: goal.visualPercent,
    remainingMeters: goal.remainingMeters,
    remainingSessions: calculateRemainingDefaultDistanceSessions(summary.loggedMeters, habit),
    goalReached: goal.goalMeters > 0 && summary.loggedMeters >= goal.goalMeters,
  };
};
