import { defaultHabitColor, defaultHabitIcon } from '../utils/habitAppearance';
import { toLocalDateKey } from '../utils/dates';
import {
  createCompletedDistanceCheckIn,
  getDefaultDistanceMeters,
  getCheckInDistanceMeters,
  isValidDistanceMeters,
} from '../utils/distance';
import {
  createCompletedCheckIn,
  getDefaultDurationMinutes,
  getCheckInDurationMinutes,
  isCompletedCheckIn,
  isValidDurationMinutes,
} from '../utils/duration';
import type { Habit, HabitDraft, HabitSaveOptions, HabitState, LocalDateKey } from './types';

export type HabitAction =
  | { type: 'addHabit'; habit: HabitDraft }
  | { type: 'selectHabit'; habitId: string }
  | { type: 'renameHabit'; habitId: string; habit: HabitDraft; options?: HabitSaveOptions }
  | { type: 'deleteHabit'; habitId: string }
  | { type: 'toggleCheckIn'; habitId: string; dateKey: LocalDateKey }
  | {
      type: 'setCheckIn';
      habitId: string;
      dateKey: LocalDateKey;
      completed: boolean;
      durationMinutes?: number;
      distanceMeters?: number;
    };

export const emptyState = (): HabitState => ({
  version: 3,
  habits: [],
  checkIns: {},
  selectedHabitId: null,
});

export const normalizeHabitName = (name: string) => name.trim().slice(0, 40);

export const hasDuplicateHabitName = (
  habits: Habit[],
  name: string,
  exceptHabitId?: string,
) => {
  const normalized = normalizeHabitName(name).toLocaleLowerCase();
  return habits.some(
    (habit) =>
      habit.id !== exceptHabitId && habit.name.trim().toLocaleLowerCase() === normalized,
  );
};

export const createHabitId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `habit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const habitReducer = (state: HabitState, action: HabitAction): HabitState => {
  switch (action.type) {
    case 'addHabit': {
      const name = normalizeHabitName(action.habit.name);
      if (!name || hasDuplicateHabitName(state.habits, name)) {
        return state;
      }

      const habit: Habit = {
        id: createHabitId(),
        name,
        createdAt: toLocalDateKey(new Date()),
        color: action.habit.color ?? defaultHabitColor(state.habits.length),
        icon: action.habit.icon ?? defaultHabitIcon,
        trackingMode: action.habit.trackingMode ?? 'completion',
        defaultDurationMinutes: action.habit.defaultDurationMinutes,
        yearlyGoalMinutes: action.habit.yearlyGoalMinutes,
        defaultDistanceMeters: action.habit.defaultDistanceMeters,
        yearlyDistanceGoalMeters: action.habit.yearlyDistanceGoalMeters,
        distanceUnitPreference: action.habit.distanceUnitPreference,
      };

      return {
        ...state,
        habits: [...state.habits, habit],
        checkIns: { ...state.checkIns, [habit.id]: {} },
        selectedHabitId: habit.id,
      };
    }

    case 'selectHabit':
      if (!state.habits.some((habit) => habit.id === action.habitId)) {
        return state;
      }
      return { ...state, selectedHabitId: action.habitId };

    case 'renameHabit': {
      const name = normalizeHabitName(action.habit.name);
      if (!name || hasDuplicateHabitName(state.habits, name, action.habitId)) {
        return state;
      }

      const updatedState = {
        ...state,
        habits: state.habits.map((habit) => {
          if (habit.id !== action.habitId) {
            return habit;
          }

          const trackingMode = action.habit.trackingMode ?? habit.trackingMode ?? 'completion';
          const hasDefaultDuration = Object.prototype.hasOwnProperty.call(
            action.habit,
            'defaultDurationMinutes',
          );
          const hasYearlyGoal = Object.prototype.hasOwnProperty.call(
            action.habit,
            'yearlyGoalMinutes',
          );
          const hasDefaultDistance = Object.prototype.hasOwnProperty.call(
            action.habit,
            'defaultDistanceMeters',
          );
          const hasYearlyDistanceGoal = Object.prototype.hasOwnProperty.call(
            action.habit,
            'yearlyDistanceGoalMeters',
          );
          const hasDistanceUnitPreference = Object.prototype.hasOwnProperty.call(
            action.habit,
            'distanceUnitPreference',
          );
          const baseHabit = {
            ...habit,
            name,
            color: action.habit.color,
            icon: action.habit.icon,
            trackingMode,
          };

          return trackingMode === 'duration'
            ? {
                ...baseHabit,
                defaultDurationMinutes: hasDefaultDuration
                  ? action.habit.defaultDurationMinutes
                  : habit.defaultDurationMinutes,
                yearlyGoalMinutes: hasYearlyGoal
                  ? action.habit.yearlyGoalMinutes
                  : habit.yearlyGoalMinutes,
                defaultDistanceMeters: undefined,
                yearlyDistanceGoalMeters: undefined,
                distanceUnitPreference: undefined,
              }
            : trackingMode === 'distance'
              ? {
                  ...baseHabit,
                  defaultDurationMinutes: undefined,
                  yearlyGoalMinutes: undefined,
                  defaultDistanceMeters: hasDefaultDistance
                    ? action.habit.defaultDistanceMeters
                    : habit.defaultDistanceMeters,
                  yearlyDistanceGoalMeters: hasYearlyDistanceGoal
                    ? action.habit.yearlyDistanceGoalMeters
                    : habit.yearlyDistanceGoalMeters,
                  distanceUnitPreference: hasDistanceUnitPreference
                    ? action.habit.distanceUnitPreference
                    : habit.distanceUnitPreference ?? 'km',
                }
            : {
                ...baseHabit,
                defaultDurationMinutes: undefined,
                yearlyGoalMinutes: undefined,
                defaultDistanceMeters: undefined,
                yearlyDistanceGoalMeters: undefined,
                distanceUnitPreference: undefined,
              };
        }),
      };

      const migrationTodayKey = action.options?.todayKey;
      const migrationDurationMinutes = action.habit.defaultDurationMinutes;
      const migrationDistanceMeters = action.habit.defaultDistanceMeters;
      if (!migrationTodayKey) {
        return updatedState;
      }

      if (
        action.options?.historicalDurationMigration === 'apply-default' &&
        action.habit.trackingMode === 'duration' &&
        isValidDurationMinutes(migrationDurationMinutes)
      ) {
        const habitCheckIns = updatedState.checkIns[action.habitId] ?? {};
        return {
          ...updatedState,
          checkIns: {
            ...updatedState.checkIns,
            [action.habitId]: Object.fromEntries(
              Object.entries(habitCheckIns).map(([dateKey, entry]) => [
                dateKey,
                dateKey < migrationTodayKey &&
                isCompletedCheckIn(entry) &&
                getCheckInDurationMinutes(entry) === undefined
                  ? createCompletedCheckIn(migrationDurationMinutes)
                  : entry,
              ]),
            ),
          },
        };
      }

      if (
        action.options?.historicalDistanceMigration === 'apply-default' &&
        action.habit.trackingMode === 'distance' &&
        isValidDistanceMeters(migrationDistanceMeters)
      ) {
        const habitCheckIns = updatedState.checkIns[action.habitId] ?? {};
        return {
          ...updatedState,
          checkIns: {
            ...updatedState.checkIns,
            [action.habitId]: Object.fromEntries(
              Object.entries(habitCheckIns).map(([dateKey, entry]) => {
                if (
                  dateKey >= migrationTodayKey ||
                  !isCompletedCheckIn(entry) ||
                  getCheckInDistanceMeters(entry) !== undefined
                ) {
                  return [dateKey, entry];
                }

                return [
                  dateKey,
                  {
                    ...(entry === true ? { completed: true as const } : entry),
                    distanceMeters: migrationDistanceMeters,
                  },
                ];
              }),
            ),
          },
        };
      }

      return updatedState;
    }

    case 'deleteHabit': {
      const index = state.habits.findIndex((habit) => habit.id === action.habitId);
      if (index === -1) {
        return state;
      }

      const habits = state.habits.filter((habit) => habit.id !== action.habitId);
      const checkIns = { ...state.checkIns };
      delete checkIns[action.habitId];
      const fallbackHabit = habits[Math.min(index, habits.length - 1)] ?? null;

      return {
        ...state,
        habits,
        checkIns,
        selectedHabitId:
          state.selectedHabitId === action.habitId
            ? fallbackHabit?.id ?? null
            : state.selectedHabitId,
      };
    }

    case 'toggleCheckIn': {
      const habit = state.habits.find((candidate) => candidate.id === action.habitId);
      if (!habit) {
        return state;
      }

      const habitCheckIns = state.checkIns[action.habitId] ?? {};
      const { [action.dateKey]: existing, ...remaining } = habitCheckIns;

      return {
        ...state,
        checkIns: {
          ...state.checkIns,
          [action.habitId]: isCompletedCheckIn(existing)
            ? remaining
            : {
                ...habitCheckIns,
                [action.dateKey]:
                  habit.trackingMode === 'distance'
                    ? createCompletedDistanceCheckIn(getDefaultDistanceMeters(habit))
                    : createCompletedCheckIn(getDefaultDurationMinutes(habit)),
              },
        },
      };
    }

    case 'setCheckIn': {
      const habit = state.habits.find((candidate) => candidate.id === action.habitId);
      if (!habit) {
        return state;
      }

      const habitCheckIns = state.checkIns[action.habitId] ?? {};
      const remaining = { ...habitCheckIns };
      delete remaining[action.dateKey];

      return {
        ...state,
        checkIns: {
          ...state.checkIns,
          [action.habitId]: action.completed
            ? {
                ...habitCheckIns,
                [action.dateKey]:
                  habit.trackingMode === 'distance'
                    ? createCompletedDistanceCheckIn(
                        action.distanceMeters ?? getDefaultDistanceMeters(habit),
                      )
                    : createCompletedCheckIn(
                        action.durationMinutes ?? getDefaultDurationMinutes(habit),
                      ),
              }
            : remaining,
        },
      };
    }

    default:
      return state;
  }
};
