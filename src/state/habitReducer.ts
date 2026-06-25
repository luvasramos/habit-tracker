import { defaultHabitColor, defaultHabitIcon } from '../utils/habitAppearance';
import { createCompletedCheckIn, isCompletedCheckIn } from '../utils/duration';
import type { Habit, HabitDraft, HabitState, LocalDateKey } from './types';

export type HabitAction =
  | { type: 'addHabit'; habit: HabitDraft }
  | { type: 'selectHabit'; habitId: string }
  | { type: 'renameHabit'; habitId: string; habit: HabitDraft }
  | { type: 'deleteHabit'; habitId: string }
  | { type: 'toggleCheckIn'; habitId: string; dateKey: LocalDateKey }
  | {
      type: 'setCheckIn';
      habitId: string;
      dateKey: LocalDateKey;
      completed: boolean;
      durationMinutes?: number;
    };

export const emptyState = (): HabitState => ({
  version: 2,
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
        createdAt: new Date().toISOString(),
        color: action.habit.color ?? defaultHabitColor(state.habits.length),
        icon: action.habit.icon ?? defaultHabitIcon,
        trackingMode: action.habit.trackingMode ?? 'completion',
        defaultDurationMinutes: action.habit.defaultDurationMinutes,
        yearlyGoalMinutes: action.habit.yearlyGoalMinutes,
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

      return {
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
              }
            : {
                ...baseHabit,
                defaultDurationMinutes: undefined,
                yearlyGoalMinutes: undefined,
              };
        }),
      };
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
      if (!state.habits.some((habit) => habit.id === action.habitId)) {
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
            : { ...habitCheckIns, [action.dateKey]: true },
        },
      };
    }

    case 'setCheckIn': {
      if (!state.habits.some((habit) => habit.id === action.habitId)) {
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
                [action.dateKey]: createCompletedCheckIn(action.durationMinutes),
              }
            : remaining,
        },
      };
    }

    default:
      return state;
  }
};
