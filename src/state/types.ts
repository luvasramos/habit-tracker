export type LocalDateKey = string;

export type HabitPresetColor =
  | 'terracotta'
  | 'blue'
  | 'sky'
  | 'teal'
  | 'green'
  | 'sage'
  | 'yellow'
  | 'acid'
  | 'orange'
  | 'red'
  | 'rose'
  | 'purple'
  | 'violet'
  | 'lavender'
  | 'magenta'
  | 'clay'
  | 'cream'
  | 'slate';

export type HabitColor = HabitPresetColor | `#${string}`;

export type HabitIconName =
  | 'health'
  | 'fitness'
  | 'learning'
  | 'star'
  | 'circle'
  | 'check'
  | 'heart'
  | 'flame'
  | 'book'
  | 'graduation'
  | 'dumbbell'
  | 'running'
  | 'walking'
  | 'yoga'
  | 'meditation'
  | 'language'
  | 'globe'
  | 'flag'
  | 'work'
  | 'laptop'
  | 'reading'
  | 'music'
  | 'note'
  | 'calendar'
  | 'clock'
  | 'finance'
  | 'money'
  | 'food'
  | 'water'
  | 'travel'
  | 'plane'
  | 'bike'
  | 'camera'
  | 'plant'
  | 'target'
  | 'trophy'
  | 'mindfulness'
  | 'sleep'
  | 'sun'
  | 'moon'
  | 'home'
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
