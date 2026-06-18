import { describe, expect, it } from 'vitest';
import { emptyState } from './habitReducer';
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

    expect(loadState(storage)).toEqual(state);
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
});
