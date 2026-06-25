/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties, ReactNode } from 'react';
import type {
  CheckInsByHabit,
  Habit,
  HabitColor,
  HabitIcon,
  HabitIconName,
  HabitPresetColor,
  LocalDateKey,
} from '../state/types';
import { isCompletedCheckIn } from './duration';

type HabitColorOption = {
  name: HabitPresetColor;
  label: string;
  value: string;
};

type HabitIconOption = {
  name: HabitIconName;
  label: string;
  keywords: string[];
  paths: ReactNode;
};

export const habitColorOptions: HabitColorOption[] = [
  { name: 'terracotta', label: 'Terracotta', value: '#b86556' },
  { name: 'orange', label: 'Warm orange', value: '#c17a45' },
  { name: 'yellow', label: 'Ochre', value: '#b89a42' },
  { name: 'acid', label: 'Acid sage', value: '#b6c94f' },
  { name: 'green', label: 'Forest', value: '#4f7f58' },
  { name: 'teal', label: 'Teal', value: '#4b8f86' },
  { name: 'sky', label: 'Sky', value: '#5c93b0' },
  { name: 'blue', label: 'Deep blue', value: '#3d6fa6' },
  { name: 'violet', label: 'Violet', value: '#8067ad' },
  { name: 'lavender', label: 'Lavender', value: '#a383b8' },
  { name: 'magenta', label: 'Magenta', value: '#a85f91' },
  { name: 'rose', label: 'Rose', value: '#a96a78' },
  { name: 'clay', label: 'Clay', value: '#8f6a54' },
  { name: 'sage', label: 'Sage', value: '#8ca58c' },
  { name: 'cream', label: 'Warm cream', value: '#c8b98d' },
  { name: 'slate', label: 'Graphite', value: '#7c8792' },
  { name: 'red', label: 'Red', value: '#a85a55' },
  { name: 'purple', label: 'Purple', value: '#8c6aaa' },
];

export const habitIconOptions: HabitIconOption[] = [
  {
    name: 'star',
    label: 'Star',
    keywords: ['star', 'favorite', 'important', 'priority', 'popular'],
    paths: <path d="m12 4 2.4 5 5.5.8-4 3.9.9 5.4-4.8-2.6-4.8 2.6.9-5.4-4-3.9 5.5-.8L12 4Z" />,
  },
  {
    name: 'circle',
    label: 'Circle',
    keywords: ['circle', 'custom', 'simple', 'dot', 'minimal'],
    paths: <circle cx="12" cy="12" r="6" />,
  },
  {
    name: 'check',
    label: 'Check',
    keywords: ['check', 'done', 'complete', 'task', 'success'],
    paths: <path d="m5 12 4 4 10-10" />,
  },
  {
    name: 'heart',
    label: 'Heart',
    keywords: ['heart', 'health', 'care', 'wellness', 'love'],
    paths: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  },
  {
    name: 'health',
    label: 'Health',
    keywords: ['health', 'heart', 'medicine', 'wellness', 'care'],
    paths: (
      <>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        <path d="M8 12h2l1-2 2 4 1-2h2" />
      </>
    ),
  },
  {
    name: 'flame',
    label: 'Flame',
    keywords: ['flame', 'fire', 'streak', 'duolingo', 'energy'],
    paths: (
      <>
        <path d="M12 21c3.3 0 6-2.4 6-5.8 0-2.7-1.5-4.6-3.4-6.4-.7 1.6-1.7 2.4-2.8 2.9.4-2.8-.8-5.2-3.1-7.2.1 3.4-2.7 5.2-2.7 8.8C6 17.9 8.7 21 12 21Z" />
        <path d="M12 18c1.2 0 2.2-.9 2.2-2.2 0-1-.6-1.7-1.4-2.4-.2.7-.6 1.1-1.1 1.3.1-1-.3-1.8-1.1-2.6 0 1.3-.8 2-.8 3.3C9.8 17 10.8 18 12 18Z" />
      </>
    ),
  },
  {
    name: 'book',
    label: 'Book',
    keywords: ['book', 'reading', 'read', 'study', 'learn', 'journal'],
    paths: (
      <>
        <path d="M5 5h5a3 3 0 0 1 2 1v13a3 3 0 0 0-2-1H5z" />
        <path d="M19 5h-5a3 3 0 0 0-2 1v13a3 3 0 0 1 2-1h5z" />
      </>
    ),
  },
  {
    name: 'reading',
    label: 'Reading',
    keywords: ['reading', 'book', 'read', 'study', 'journal'],
    paths: (
      <>
        <path d="M5 5h5a3 3 0 0 1 2 1v13a3 3 0 0 0-2-1H5z" />
        <path d="M19 5h-5a3 3 0 0 0-2 1v13a3 3 0 0 1 2-1h5z" />
      </>
    ),
  },
  {
    name: 'graduation',
    label: 'Graduation',
    keywords: ['graduation', 'cap', 'learning', 'learn', 'study', 'school', 'course'],
    paths: (
      <>
        <path d="m3 8 9-4 9 4-9 4-9-4Z" />
        <path d="M7 10v5c2.8 2 7.2 2 10 0v-5" />
        <path d="M20 9v5" />
      </>
    ),
  },
  {
    name: 'learning',
    label: 'Learning',
    keywords: ['learning', 'learn', 'study', 'school', 'course', 'graduation'],
    paths: (
      <>
        <path d="m3 8 9-4 9 4-9 4-9-4Z" />
        <path d="M7 10v5c2.8 2 7.2 2 10 0v-5" />
        <path d="M20 9v5" />
      </>
    ),
  },
  {
    name: 'language',
    label: 'Language',
    keywords: ['language', 'speak', 'japanese', 'japan', 'study', 'learn', 'words', 'duolingo'],
    paths: (
      <>
        <path d="M5 5h14v10H9l-4 4V5Z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </>
    ),
  },
  {
    name: 'globe',
    label: 'Globe',
    keywords: ['globe', 'world', 'language', 'travel', 'japanese', 'japan', 'international'],
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16" />
        <path d="M12 4a12 12 0 0 1 0 16" />
        <path d="M12 4a12 12 0 0 0 0 16" />
      </>
    ),
  },
  {
    name: 'flag',
    label: 'Flag',
    keywords: ['flag', 'japan', 'japanese', 'country', 'language', 'goal'],
    paths: (
      <>
        <path d="M6 20V5" />
        <path d="M6 5h11l-2 4 2 4H6" />
      </>
    ),
  },
  {
    name: 'dumbbell',
    label: 'Dumbbell',
    keywords: ['dumbbell', 'fitness', 'gym', 'strength', 'lift', 'weights', 'exercise'],
    paths: (
      <>
        <path d="M5 9v6" />
        <path d="M8 7v10" />
        <path d="M16 7v10" />
        <path d="M19 9v6" />
        <path d="M8 12h8" />
      </>
    ),
  },
  {
    name: 'fitness',
    label: 'Fitness',
    keywords: ['fitness', 'exercise', 'gym', 'movement', 'training', 'dumbbell'],
    paths: (
      <>
        <path d="M5 9v6" />
        <path d="M8 7v10" />
        <path d="M16 7v10" />
        <path d="M19 9v6" />
        <path d="M8 12h8" />
      </>
    ),
  },
  {
    name: 'running',
    label: 'Running',
    keywords: ['running', 'run', 'runner', 'jog', 'cardio', 'gym', 'fitness'],
    paths: (
      <>
        <circle cx="13" cy="5" r="2" />
        <path d="m9 21 2-5-3-3 3-4 3 3 3 1" />
        <path d="m14 12-2 4 4 5" />
        <path d="M7 13H4" />
      </>
    ),
  },
  {
    name: 'walking',
    label: 'Walking',
    keywords: ['walking', 'walk', 'steps', 'movement', 'exercise', 'fitness'],
    paths: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M11 8v5l-2 4" />
        <path d="m13 13 3 4" />
        <path d="m11 10-3 2" />
        <path d="m12 9 3 2" />
      </>
    ),
  },
  {
    name: 'yoga',
    label: 'Yoga',
    keywords: ['yoga', 'stretch', 'mobility', 'mindfulness', 'meditation', 'calm'],
    paths: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 8v5" />
        <path d="m8 11 4 2 4-2" />
        <path d="m6 18 6-5 6 5" />
        <path d="M8 20h8" />
      </>
    ),
  },
  {
    name: 'meditation',
    label: 'Meditation',
    keywords: ['meditation', 'meditate', 'mindfulness', 'calm', 'breathing', 'yoga'],
    paths: (
      <>
        <path d="M12 20c-3.5-2-5-4.5-5-7.2A5 5 0 0 1 12 8a5 5 0 0 1 5 4.8c0 2.7-1.5 5.2-5 7.2Z" />
        <path d="M12 8V4" />
        <path d="M9 6h6" />
      </>
    ),
  },
  {
    name: 'mindfulness',
    label: 'Mindfulness',
    keywords: ['mindfulness', 'meditation', 'meditate', 'breathing', 'calm', 'yoga'],
    paths: (
      <>
        <path d="M12 20c-3.5-2-5-4.5-5-7.2A5 5 0 0 1 12 8a5 5 0 0 1 5 4.8c0 2.7-1.5 5.2-5 7.2Z" />
        <path d="M12 8V4" />
        <path d="M9 6h6" />
      </>
    ),
  },
  {
    name: 'music',
    label: 'Music',
    keywords: ['music', 'song', 'practice', 'instrument', 'note'],
    paths: (
      <>
        <path d="M9 18a3 3 0 1 1-2-2.8V6l10-2v10" />
        <path d="M17 16a3 3 0 1 1-2-2.8" />
        <path d="M9 9 17 7" />
      </>
    ),
  },
  {
    name: 'note',
    label: 'Note',
    keywords: ['note', 'music', 'song', 'practice', 'sound'],
    paths: (
      <>
        <path d="M10 18a3 3 0 1 1-2-2.8V5l9-2v10" />
        <path d="M10 8 17 6" />
      </>
    ),
  },
  {
    name: 'calendar',
    label: 'Calendar',
    keywords: ['calendar', 'date', 'schedule', 'plan', 'routine'],
    paths: (
      <>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 8h16" />
        <rect x="4" y="5" width="16" height="15" rx="2" />
      </>
    ),
  },
  {
    name: 'clock',
    label: 'Clock',
    keywords: ['clock', 'time', 'schedule', 'timer', 'morning'],
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
  },
  {
    name: 'work',
    label: 'Work',
    keywords: ['work', 'job', 'office', 'focus', 'briefcase'],
    paths: (
      <>
        <path d="M8 7V5h8v2" />
        <path d="M5 7h14v12H5z" />
        <path d="M5 12h14" />
      </>
    ),
  },
  {
    name: 'laptop',
    label: 'Laptop',
    keywords: ['laptop', 'computer', 'work', 'coding', 'study', 'focus'],
    paths: (
      <>
        <rect x="6" y="5" width="12" height="9" rx="1.5" />
        <path d="M4 18h16l-2-4H6l-2 4Z" />
      </>
    ),
  },
  {
    name: 'money',
    label: 'Money',
    keywords: ['money', 'finance', 'budget', 'saving', 'cash'],
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M14.5 9.5A3 3 0 0 0 12 8.4c-1.5 0-2.4.7-2.4 1.7 0 2.6 5 1.2 5 3.8 0 1.1-1 1.9-2.7 1.9a3.9 3.9 0 0 1-3-1.2" />
        <path d="M12 6.8v10.4" />
      </>
    ),
  },
  {
    name: 'finance',
    label: 'Finance',
    keywords: ['finance', 'money', 'budget', 'saving', 'cash'],
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M14.5 9.5A3 3 0 0 0 12 8.4c-1.5 0-2.4.7-2.4 1.7 0 2.6 5 1.2 5 3.8 0 1.1-1 1.9-2.7 1.9a3.9 3.9 0 0 1-3-1.2" />
        <path d="M12 6.8v10.4" />
      </>
    ),
  },
  {
    name: 'food',
    label: 'Food',
    keywords: ['food', 'meal', 'cook', 'nutrition', 'eat'],
    paths: (
      <>
        <path d="M7 4v8" />
        <path d="M5 4v4a2 2 0 0 0 4 0V4" />
        <path d="M7 12v8" />
        <path d="M16 4c2 1.6 2.8 4.6 1 7v9" />
      </>
    ),
  },
  {
    name: 'water',
    label: 'Water',
    keywords: ['water', 'hydrate', 'drink', 'health'],
    paths: <path d="M12 21a6 6 0 0 0 6-6c0-4-6-11-6-11S6 11 6 15a6 6 0 0 0 6 6Z" />,
  },
  {
    name: 'sleep',
    label: 'Sleep',
    keywords: ['sleep', 'rest', 'night', 'recovery', 'moon'],
    paths: (
      <>
        <path d="M18 14.5A7 7 0 0 1 9.5 6a6 6 0 1 0 8.5 8.5Z" />
        <path d="M15 5h4l-4 4h4" />
      </>
    ),
  },
  {
    name: 'sun',
    label: 'Sun',
    keywords: ['sun', 'morning', 'day', 'outside', 'light'],
    paths: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 6.3 1.4-1.4" />
      </>
    ),
  },
  {
    name: 'moon',
    label: 'Moon',
    keywords: ['moon', 'night', 'sleep', 'rest', 'evening'],
    paths: <path d="M18 14.5A7 7 0 0 1 9.5 6a6 6 0 1 0 8.5 8.5Z" />,
  },
  {
    name: 'home',
    label: 'Home',
    keywords: ['home', 'house', 'chores', 'clean', 'family'],
    paths: (
      <>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 10v10h12V10" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  },
  {
    name: 'travel',
    label: 'Travel',
    keywords: ['travel', 'trip', 'walk', 'commute', 'plane'],
    paths: (
      <>
        <path d="M4 13 20 6l-7 16-2-7-7-2Z" />
        <path d="m11 15 4-4" />
      </>
    ),
  },
  {
    name: 'plane',
    label: 'Plane',
    keywords: ['plane', 'travel', 'trip', 'flight', 'vacation'],
    paths: (
      <>
        <path d="M3 11 21 4l-7 17-3-7-8-3Z" />
        <path d="m11 14 4-4" />
      </>
    ),
  },
  {
    name: 'bike',
    label: 'Bike',
    keywords: ['bike', 'cycle', 'cycling', 'fitness', 'commute'],
    paths: (
      <>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M8 17h4l3-6h-4l-3 6Z" />
        <path d="M12 17 9 10" />
        <path d="M15 11l2 6" />
        <path d="M13 8h3" />
      </>
    ),
  },
  {
    name: 'camera',
    label: 'Camera',
    keywords: ['camera', 'photo', 'creative', 'memory', 'art'],
    paths: (
      <>
        <path d="M8 7 9.5 5h5L16 7h3v12H5V7h3Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
  },
  {
    name: 'plant',
    label: 'Plant',
    keywords: ['plant', 'garden', 'grow', 'nature', 'green'],
    paths: (
      <>
        <path d="M12 20V9" />
        <path d="M12 12c-4 0-6-2-7-6 4 0 6 2 7 6Z" />
        <path d="M12 10c4 0 6-2 7-6-4 0-6 2-7 6Z" />
      </>
    ),
  },
  {
    name: 'target',
    label: 'Target',
    keywords: ['target', 'goal', 'focus', 'aim', 'objective'],
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
  },
  {
    name: 'trophy',
    label: 'Trophy',
    keywords: ['trophy', 'win', 'goal', 'achievement', 'reward'],
    paths: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H5a3 3 0 0 0 3 5" />
        <path d="M16 6h3a3 3 0 0 1-3 5" />
        <path d="M12 13v4" />
        <path d="M9 21h6" />
        <path d="M10 17h4" />
      </>
    ),
  },
  {
    name: 'custom',
    label: 'Custom',
    keywords: ['custom', 'circle', 'simple', 'minimal'],
    paths: <circle cx="12" cy="12" r="6" />,
  },
];

export const defaultHabitColor = (index: number): HabitPresetColor =>
  habitColorOptions[Math.max(index, 0) % habitColorOptions.length].name;

export const defaultHabitIcon: HabitIcon = { type: 'svg', name: 'custom' };

export const hexColorPattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const normalizeHexColor = (value: unknown): `#${string}` | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!hexColorPattern.test(withHash)) {
    return null;
  }

  const normalized = withHash.toLowerCase();
  if (normalized.length === 4) {
    const [, red, green, blue] = normalized;
    return `#${red}${red}${green}${green}${blue}${blue}` as `#${string}`;
  }

  return normalized as `#${string}`;
};

export const isPresetHabitColor = (value: unknown): value is HabitPresetColor =>
  typeof value === 'string' &&
  habitColorOptions.some((option) => option.name === value);

export const isHabitColor = (value: unknown): value is HabitColor =>
  isPresetHabitColor(value) || normalizeHexColor(value) !== null;

export const isHabitIconName = (value: unknown): value is HabitIconName =>
  typeof value === 'string' &&
  habitIconOptions.some((option) => option.name === value);

export const normalizeEmojiValue = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, 6);
};

export const isHabitIcon = (value: unknown): value is HabitIcon => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const icon = value as Record<string, unknown>;
  return (
    (icon.type === 'svg' && isHabitIconName(icon.name)) ||
    (icon.type === 'emoji' && normalizeEmojiValue(icon.value).length > 0)
  );
};

export const normalizeHabitIcon = (icon: unknown): HabitIcon =>
  isHabitIcon(icon)
    ? icon.type === 'emoji'
      ? { type: 'emoji', value: normalizeEmojiValue(icon.value) }
      : icon
    : defaultHabitIcon;

export const getHabitColorName = (habit: Pick<Habit, 'color'>, index = 0): HabitColor =>
  isPresetHabitColor(habit.color)
    ? habit.color
    : normalizeHexColor(habit.color) ?? defaultHabitColor(index);

export const getHabitColorValue = (habit: Pick<Habit, 'color'>, index = 0): string => {
  const color = getHabitColorName(habit, index);
  return isPresetHabitColor(color) ? `var(--habit-${color})` : color;
};

export const getHabitColorVar = (
  habit: Pick<Habit, 'id' | 'color'> | string,
  habits: Pick<Habit, 'id' | 'color'>[],
) => {
  const target =
    typeof habit === 'string'
      ? habits.find((candidate) => candidate.id === habit) ?? { id: habit, color: undefined }
      : habit;
  const index =
    typeof habit === 'string'
      ? habits.findIndex((candidate) => candidate.id === habit)
      : habits.findIndex((candidate) => candidate.id === habit.id);
  return getHabitColorValue(target, index);
};

export const getDateCompletions = (
  dateKey: LocalDateKey,
  habits: Habit[],
  checkIns: CheckInsByHabit,
) =>
  habits
    .filter((habit) => isCompletedCheckIn(checkIns[habit.id]?.[dateKey]))
    .map((habit) => ({
      habit,
      color: getHabitColorVar(habit, habits),
    }));

export const habitIconStyle = (color: string): CSSProperties =>
  ({ '--habit-color': color } as CSSProperties);

export const HabitIconView = ({
  habit,
  className = '',
}: {
  habit: Pick<Habit, 'icon' | 'color'>;
  className?: string;
}) => {
  const icon = normalizeHabitIcon(habit.icon);
  const classNames = `habit-icon ${icon.type === 'emoji' ? 'habit-icon--emoji' : 'habit-icon--svg'}${className ? ` ${className}` : ''}`;

  if (icon.type === 'emoji') {
    return (
      <span className={classNames} aria-hidden="true">
        {icon.value}
      </span>
    );
  }

  const option =
    habitIconOptions.find((item) => item.name === icon.name) ??
    habitIconOptions[habitIconOptions.length - 1];

  return (
    <svg
      className={classNames}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {option.paths}
    </svg>
  );
};
