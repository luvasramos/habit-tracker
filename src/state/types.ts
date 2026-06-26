export type LocalDateKey = string;

export type HabitPresetColor =
  | 'neonCream'
  | 'neonLime'
  | 'neonMagenta'
  | 'neonOrange'
  | 'neonGreen'
  | 'neonPink'
  | 'neonRose'
  | 'neonBlue'
  | 'neonVermilion'
  | 'neonCyan'
  | 'neonViolet'
  | 'neonYellow'
  | 'neonMint'
  | 'neonRed'
  | 'neonAcid'
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
      type: 'iconify';
      id: `tabler:${string}`;
    }
  | {
      type: 'emoji';
      value: string;
    };

export type HabitTrackingMode = 'completion' | 'duration' | 'distance';
export type DistanceUnitPreference = 'km' | 'm' | 'mi';

export type HabitDraft = {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
  trackingMode?: HabitTrackingMode;
  defaultDurationMinutes?: number;
  yearlyGoalMinutes?: number;
  defaultDistanceMeters?: number;
  yearlyDistanceGoalMeters?: number;
  distanceUnitPreference?: DistanceUnitPreference;
};

export type HistoricalDurationMigration = 'keep-empty' | 'apply-default';
export type HistoricalDistanceMigration = 'keep-empty' | 'apply-default';

export type HabitSaveOptions = {
  historicalDurationMigration?: HistoricalDurationMigration;
  historicalDistanceMigration?: HistoricalDistanceMigration;
  todayKey?: LocalDateKey;
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  color?: HabitColor;
  icon?: HabitIcon;
  trackingMode?: HabitTrackingMode;
  defaultDurationMinutes?: number;
  yearlyGoalMinutes?: number;
  defaultDistanceMeters?: number;
  yearlyDistanceGoalMeters?: number;
  distanceUnitPreference?: DistanceUnitPreference;
};

export type CompletedCheckIn = {
  completed: true;
  durationMinutes?: number;
  distanceMeters?: number;
};

export type CheckInEntry = true | CompletedCheckIn;
export type CheckInsByHabit = Record<string, Record<LocalDateKey, CheckInEntry>>;

export type PersistedState = {
  version: 3;
  habits: Habit[];
  checkIns: CheckInsByHabit;
  selectedHabitId: string | null;
};

export type HabitState = PersistedState;

export type ViewMode = 'week' | 'month' | 'year';
