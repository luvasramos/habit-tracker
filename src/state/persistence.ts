import { emptyState } from './habitReducer';
import {
  defaultHabitColor,
  defaultHabitIcon,
  isHabitColor,
  isPresetHabitColor,
  normalizeHexColor,
  normalizeHabitIcon,
} from '../utils/habitAppearance';
import type { Habit, HabitState, PersistedState } from './types';

export const STORAGE_KEY = 'habit-grid:v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isHabit = (value: unknown): value is Habit =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.createdAt === 'string';

const isCheckIns = (value: unknown): value is PersistedState['checkIns'] => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) => isRecord(entry) && Object.values(entry).every((item) => item === true),
  );
};

export const isPersistedState = (value: unknown): value is PersistedState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === 1 &&
    Array.isArray(value.habits) &&
    value.habits.every(isHabit) &&
    isCheckIns(value.checkIns) &&
    (typeof value.selectedHabitId === 'string' || value.selectedHabitId === null)
  );
};

export const sanitizeState = (state: PersistedState): HabitState => {
  const habits = state.habits.map((habit, index) => ({
    ...habit,
    color: isHabitColor(habit.color)
      ? isPresetHabitColor(habit.color)
        ? habit.color
        : normalizeHexColor(habit.color) ?? defaultHabitColor(index)
      : defaultHabitColor(index),
    icon: normalizeHabitIcon(habit.icon ?? defaultHabitIcon),
  }));
  const habitIds = new Set(habits.map((habit) => habit.id));
  const checkIns = Object.fromEntries(
    Object.entries(state.checkIns).filter(([habitId]) => habitIds.has(habitId)),
  );
  const selectedHabitId =
    state.selectedHabitId && habitIds.has(state.selectedHabitId)
      ? state.selectedHabitId
      : habits[0]?.id ?? null;

  return {
    version: 1,
    habits,
    checkIns,
    selectedHabitId,
  };
};

export const loadState = (storage: Storage = window.localStorage): HabitState => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPersistedState(parsed) ? sanitizeState(parsed) : emptyState();
  } catch {
    return emptyState();
  }
};

export const saveState = (
  state: HabitState,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};
