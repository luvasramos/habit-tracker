export type LocalDateKey = string;

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
};

export type PersistedState = {
  version: 1;
  habits: Habit[];
  checkIns: Record<string, Record<LocalDateKey, true>>;
  selectedHabitId: string | null;
};

export type HabitState = PersistedState;

export type ViewMode = 'week' | 'month' | 'year';
