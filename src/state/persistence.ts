import { emptyState } from './habitReducer';
import {
  defaultHabitColor,
  defaultHabitIcon,
  isHabitColor,
  isPresetHabitColor,
  normalizeHexColor,
  normalizeHabitIcon,
} from '../utils/habitAppearance';
import { isValidDurationMinutes, normalizeCheckInEntry } from '../utils/duration';
import type { CheckInsByHabit, Habit, HabitState, PersistedState } from './types';

export const CURRENT_SCHEMA_VERSION = 2;
export const STORAGE_KEY = 'habit-grid:v2';
export const LEGACY_STORAGE_KEYS = ['habit-grid:v1'];

type LegacyPersistedState = Omit<PersistedState, 'version'> & { version: 1 };
type RawPersistedState = PersistedState | LegacyPersistedState;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isHabit = (value: unknown): value is Habit =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.createdAt === 'string';

const isHabitTrackingMode = (value: unknown) =>
  value === 'completion' || value === 'duration';

const isCheckIns = (value: unknown): value is CheckInsByHabit => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) =>
      isRecord(entry) &&
      Object.values(entry).every((item) => normalizeCheckInEntry(item) !== null),
  );
};

export const isPersistedState = (value: unknown): value is RawPersistedState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.version === 1 || value.version === CURRENT_SCHEMA_VERSION) &&
    Array.isArray(value.habits) &&
    value.habits.every(isHabit) &&
    isCheckIns(value.checkIns) &&
    (typeof value.selectedHabitId === 'string' || value.selectedHabitId === null)
  );
};

export const sanitizeState = (state: RawPersistedState): HabitState => {
  const habits = state.habits.map((habit, index) => ({
    ...habit,
    color: isHabitColor(habit.color)
      ? isPresetHabitColor(habit.color)
        ? habit.color
        : normalizeHexColor(habit.color) ?? defaultHabitColor(index)
      : defaultHabitColor(index),
    icon: normalizeHabitIcon(habit.icon ?? defaultHabitIcon),
    trackingMode: isHabitTrackingMode(habit.trackingMode) ? habit.trackingMode : 'completion',
    defaultDurationMinutes: isValidDurationMinutes(habit.defaultDurationMinutes)
      ? habit.defaultDurationMinutes
      : undefined,
    yearlyGoalMinutes: isValidDurationMinutes(habit.yearlyGoalMinutes)
      ? habit.yearlyGoalMinutes
      : undefined,
  }));
  const habitIds = new Set(habits.map((habit) => habit.id));
  const checkIns = Object.fromEntries(
    Object.entries(state.checkIns)
      .filter(([habitId]) => habitIds.has(habitId))
      .map(([habitId, habitCheckIns]) => [
        habitId,
        Object.fromEntries(
          Object.entries(habitCheckIns)
            .map(([dateKey, entry]) => [dateKey, normalizeCheckInEntry(entry)] as const)
            .filter((entry): entry is readonly [string, NonNullable<typeof entry[1]>] =>
              entry[1] !== null,
            ),
        ),
      ]),
  );
  const selectedHabitId =
    state.selectedHabitId && habitIds.has(state.selectedHabitId)
      ? state.selectedHabitId
      : habits[0]?.id ?? null;

  return {
    version: CURRENT_SCHEMA_VERSION,
    habits,
    checkIns,
    selectedHabitId,
  };
};

export const loadState = (storage: Storage = window.localStorage): HabitState => {
  const raw =
    storage.getItem(STORAGE_KEY) ??
    LEGACY_STORAGE_KEYS.map((key) => storage.getItem(key)).find(Boolean);
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
