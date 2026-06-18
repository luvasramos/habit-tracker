import { loadState, saveState } from '../state/persistence';
import type { HabitState } from '../state/types';

export type HabitStore = {
  load: () => HabitState;
  save: (state: HabitState) => void;
};

export const createLocalStorageHabitStore = (
  storage: Storage = window.localStorage,
): HabitStore => ({
  load: () => loadState(storage),
  save: (state) => saveState(state, storage),
});

export const habitStore = createLocalStorageHabitStore();
