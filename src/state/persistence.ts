import { emptyState } from './habitReducer';
import {
  defaultHabitColor,
  defaultHabitIcon,
  isHabitColor,
  isPresetHabitColor,
  normalizeHexColor,
  normalizeHabitIcon,
} from '../utils/habitAppearance';
import { toLocalDateKey } from '../utils/dates';
import {
  isValidDistanceMeters,
  normalizeDistanceUnitPreference,
} from '../utils/distance';
import { isValidDurationMinutes, normalizeCheckInEntry } from '../utils/duration';
import type { CheckInsByHabit, Habit, HabitState, PersistedState } from './types';

export const CURRENT_SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'habit-grid:v3';
export const LEGACY_STORAGE_KEYS = ['habit-grid:v2', 'habit-grid:v1'];

type LegacyPersistedState = Omit<PersistedState, 'version'> & { version: 1 | 2 };
type RawHabit = Omit<Habit, 'createdAt'> & { createdAt?: string };
type RawPersistedState =
  | (Omit<PersistedState, 'habits'> & {
      appCreatedAt?: string;
      createdAt?: string;
      habits: RawHabit[];
    })
  | (Omit<LegacyPersistedState, 'habits'> & {
      appCreatedAt?: string;
      createdAt?: string;
      habits: RawHabit[];
    });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isHabit = (value: unknown): value is RawHabit =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  (typeof value.createdAt === 'string' || value.createdAt === undefined);

const isHabitTrackingMode = (value: unknown) =>
  value === 'completion' || value === 'duration' || value === 'distance';

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
    (value.version === 1 || value.version === 2 || value.version === CURRENT_SCHEMA_VERSION) &&
    Array.isArray(value.habits) &&
    value.habits.every(isHabit) &&
    isCheckIns(value.checkIns) &&
    (typeof value.selectedHabitId === 'string' || value.selectedHabitId === null)
  );
};

const getEarliestDateKey = (checkIns: CheckInsByHabit) => {
  const dateKeys = Object.values(checkIns).flatMap((habitCheckIns) => Object.keys(habitCheckIns));
  return dateKeys.sort()[0];
};

const inferCreatedAt = (
  habit: RawHabit,
  checkIns: CheckInsByHabit,
  appCreatedAt: string | undefined,
  fallbackDateKey = toLocalDateKey(new Date()),
) => {
  if (typeof habit.createdAt === 'string' && habit.createdAt.trim()) {
    return habit.createdAt;
  }

  return (
    Object.keys(checkIns[habit.id] ?? {}).sort()[0] ??
    appCreatedAt ??
    getEarliestDateKey(checkIns) ??
    fallbackDateKey
  );
};

export const sanitizeState = (state: RawPersistedState): HabitState => {
  const appCreatedAt =
    typeof state.appCreatedAt === 'string' && state.appCreatedAt.trim()
      ? state.appCreatedAt
      : typeof state.createdAt === 'string' && state.createdAt.trim()
        ? state.createdAt
        : undefined;
  const normalizedCheckIns = Object.fromEntries(
    Object.entries(state.checkIns).map(([habitId, habitCheckIns]) => [
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
  const habits = state.habits.map((habit, index) => {
    const trackingMode = isHabitTrackingMode(habit.trackingMode)
      ? habit.trackingMode
      : 'completion';

    return {
      ...habit,
      createdAt: inferCreatedAt(habit, normalizedCheckIns, appCreatedAt),
      color: isHabitColor(habit.color)
        ? isPresetHabitColor(habit.color)
          ? habit.color
          : normalizeHexColor(habit.color) ?? defaultHabitColor(index)
        : defaultHabitColor(index),
      icon: normalizeHabitIcon(habit.icon ?? defaultHabitIcon),
      trackingMode,
      defaultDurationMinutes: isValidDurationMinutes(habit.defaultDurationMinutes)
        ? habit.defaultDurationMinutes
        : undefined,
      yearlyGoalMinutes: isValidDurationMinutes(habit.yearlyGoalMinutes)
        ? habit.yearlyGoalMinutes
        : undefined,
      defaultDistanceMeters:
        trackingMode === 'distance' && isValidDistanceMeters(habit.defaultDistanceMeters)
          ? habit.defaultDistanceMeters
          : undefined,
      yearlyDistanceGoalMeters:
        trackingMode === 'distance' && isValidDistanceMeters(habit.yearlyDistanceGoalMeters)
          ? habit.yearlyDistanceGoalMeters
          : undefined,
      distanceUnitPreference:
        trackingMode === 'distance'
          ? normalizeDistanceUnitPreference(habit.distanceUnitPreference)
          : undefined,
    };
  });
  const habitIds = new Set(habits.map((habit) => habit.id));
  const checkIns = Object.fromEntries(
    Object.entries(normalizedCheckIns)
      .filter(([habitId]) => habitIds.has(habitId))
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
