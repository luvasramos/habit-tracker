import { describe, expect, it } from 'vitest';
import { emptyState } from './habitReducer';
import { createLocalStorageHabitStore } from '../data/habitStore';
import { LEGACY_STORAGE_KEYS, loadState, saveState, STORAGE_KEY } from './persistence';

const makeStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } satisfies Storage;
};

describe('persistence', () => {
  it('loads valid persisted state', () => {
    const storage = makeStorage();
    const state = {
      version: 2 as const,
      habits: [
        {
          id: 'habit-1',
          name: 'Gym',
          createdAt: '2026-01-01T00:00:00.000Z',
          trackingMode: 'duration' as const,
          defaultDurationMinutes: 45,
          yearlyGoalMinutes: 9000,
        },
      ],
      checkIns: {
        'habit-1': {
          '2026-06-17': { completed: true as const, durationMinutes: 45 },
          '2026-06-18': { completed: true as const },
        },
      },
      selectedHabitId: 'habit-1',
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(loadState(storage)).toEqual({
      ...state,
      habits: [
        {
          ...state.habits[0],
          color: 'neonCream',
          icon: { type: 'svg', name: 'custom' },
          trackingMode: 'duration',
          defaultDurationMinutes: 45,
          yearlyGoalMinutes: 9000,
        },
      ],
    });
  });

  it('migrates old localStorage data to the current schema without losing completions', () => {
    const storage = makeStorage();
    storage.setItem(
      LEGACY_STORAGE_KEYS[0],
      JSON.stringify({
        version: 1,
        habits: [{ id: 'habit-1', name: 'Read', createdAt: '2026-01-01T00:00:00.000Z' }],
        checkIns: { 'habit-1': { '2026-06-17': true } },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage)).toEqual({
      version: 2,
      habits: [
        {
          id: 'habit-1',
          name: 'Read',
          createdAt: '2026-01-01T00:00:00.000Z',
          color: 'neonCream',
          icon: { type: 'svg', name: 'custom' },
          trackingMode: 'completion',
          defaultDurationMinutes: undefined,
          yearlyGoalMinutes: undefined,
        },
      ],
      checkIns: { 'habit-1': { '2026-06-17': true } },
      selectedHabitId: 'habit-1',
    });
    expect(storage.getItem(LEGACY_STORAGE_KEYS[0])).toBeTruthy();
  });

  it('infers missing habit creation date from the earliest habit check-in', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [{ id: 'habit-1', name: 'Read' }],
        checkIns: {
          'habit-1': {
            '2026-06-17': true,
            '2026-06-12': true,
          },
        },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0]).toEqual(
      expect.objectContaining({
        createdAt: '2026-06-12',
        trackingMode: 'completion',
      }),
    );
  });

  it('infers missing habit creation date from persisted app data when a habit has no check-ins', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          { id: 'habit-1', name: 'Read' },
          { id: 'habit-2', name: 'Gym' },
        ],
        checkIns: {
          'habit-1': {},
          'habit-2': {
            '2026-05-01': true,
          },
        },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0].createdAt).toBe('2026-05-01');
  });

  it('sanitizes invalid habit appearance data', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        habits: [
          {
            id: 'habit-1',
            name: 'Gym',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'neon',
            icon: { type: 'emoji', value: '' },
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0]).toEqual(
      expect.objectContaining({
        color: 'neonCream',
        icon: { type: 'svg', name: 'custom' },
        trackingMode: 'completion',
      }),
    );
  });

  it('keeps valid custom hex habit colors', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        habits: [
          {
            id: 'habit-1',
            name: 'Read',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'abc',
            icon: { type: 'svg', name: 'reading' },
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0]).toEqual(
      expect.objectContaining({
        color: '#AABBCC',
        icon: { type: 'svg', name: 'reading' },
        trackingMode: 'completion',
      }),
    );
  });

  it('keeps valid Iconify habit icons', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          {
            id: 'habit-1',
            name: 'Read',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'neonBlue',
            icon: { type: 'iconify', id: 'tabler:star' },
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0]).toEqual(
      expect.objectContaining({
        icon: { type: 'iconify', id: 'tabler:star' },
      }),
    );
  });

  it('preserves legacy preset habit colors', () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          {
            id: 'habit-1',
            name: 'Read',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'terracotta',
            icon: { type: 'svg', name: 'reading' },
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );

    expect(loadState(storage).habits[0]).toEqual(
      expect.objectContaining({
        color: 'terracotta',
        icon: { type: 'svg', name: 'reading' },
      }),
    );
  });

  it('recovers from malformed JSON and unsupported shapes', () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEY, '{bad');
    expect(loadState(storage)).toEqual(emptyState());

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 3 }));
    expect(loadState(storage)).toEqual(emptyState());
  });

  it('saves state under the versioned key', () => {
    const storage = makeStorage();
    const state = emptyState();
    saveState(state, storage);

    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '')).toEqual(state);
  });

  it('exposes localStorage through the habit store abstraction', () => {
    const storage = makeStorage();
    const store = createLocalStorageHabitStore(storage);
    const state = emptyState();

    store.save(state);

    expect(store.load()).toEqual(state);
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});
