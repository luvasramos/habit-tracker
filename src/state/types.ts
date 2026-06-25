export type LocalDateKey = string;

export type HabitColor =
  | 'blue'
  | 'sky'
  | 'teal'
  | 'green'
  | 'sage'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'rose'
  | 'purple'
  | 'lavender'
  | 'slate';

export type HabitIconName =
  | 'health'
  | 'fitness'
  | 'learning'
  | 'work'
  | 'reading'
  | 'music'
  | 'finance'
  | 'food'
  | 'travel'
  | 'mindfulness'
  | 'custom';

export type HabitIcon =
  | {
      type: 'svg';
      name: HabitIconName;
    }
  | {
      type: 'emoji';
      value: string;
    };

export type HabitDraft = {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  color?: HabitColor;
  icon?: HabitIcon;
};

export type PersistedState = {
  version: 1;
  habits: Habit[];
  checkIns: Record<string, Record<LocalDateKey, true>>;
  selectedHabitId: string | null;
};

export type HabitState = PersistedState;

export type ViewMode = 'week' | 'month' | 'year';
