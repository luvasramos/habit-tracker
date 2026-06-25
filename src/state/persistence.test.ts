import { describe, expect, it } from 'vitest';
import { emptyState } from './habitReducer';
import { createLocalStorageHabitStore } from '../data/habitStore';
import { loadState, saveState, STORAGE_KEY } from './persistence';

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
      version: 1 as const,
      habits: [{ id: 'habit-1', name: 'Gym', createdAt: '2026-01-01T00:00:00.000Z' }],
      checkIns: { 'habit-1': { '2026-06-17': true as const } },
      selectedHabitId: 'habit-1',
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(loadState(storage)).toEqual({
      ...state,
      habits: [
        {
          ...state.habits[0],
          color: 'blue',
          icon: { type: 'svg', name: 'custom' },
        },
      ],
    });
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
        color: 'blue',
        icon: { type: 'svg', name: 'custom' },
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
        color: '#abc',
        icon: { type: 'svg', name: 'reading' },
      }),
    );
  });

  it('recovers from malformed JSON and unsupported shapes', () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEY, '{bad');
    expect(loadState(storage)).toEqual(emptyState());

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }));
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
