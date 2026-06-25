/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties, ReactNode } from 'react';
import type {
  Habit,
  HabitColor,
  HabitIcon,
  HabitIconName,
  HabitPresetColor,
  LocalDateKey,
} from '../state/types';

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
    name: 'health',
    label: 'Health',
    keywords: ['health', 'heart', 'medicine', 'wellness'],
    paths: (
      <>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        <path d="M8 12h2l1-2 2 4 1-2h2" />
      </>
    ),
  },
  {
    name: 'fitness',
    label: 'Fitness',
    keywords: ['fitness', 'exercise', 'gym', 'movement', 'training'],
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
    name: 'learning',
    label: 'Learning',
    keywords: ['learning', 'study', 'school', 'course'],
    paths: (
      <>
        <path d="m3 8 9-4 9 4-9 4-9-4Z" />
        <path d="M7 10v5c2.8 2 7.2 2 10 0v-5" />
        <path d="M20 9v5" />
      </>
    ),
  },
  {
    name: 'work',
    label: 'Work',
    keywords: ['work', 'job', 'office', 'focus'],
    paths: (
      <>
        <path d="M8 7V5h8v2" />
        <path d="M5 7h14v12H5z" />
        <path d="M5 12h14" />
      </>
    ),
  },
  {
    name: 'reading',
    label: 'Reading',
    keywords: ['reading', 'book', 'journal'],
    paths: (
      <>
        <path d="M5 5h5a3 3 0 0 1 2 1v13a3 3 0 0 0-2-1H5z" />
        <path d="M19 5h-5a3 3 0 0 0-2 1v13a3 3 0 0 1 2-1h5z" />
      </>
    ),
  },
  {
    name: 'music',
    label: 'Music',
    keywords: ['music', 'song', 'practice', 'instrument'],
    paths: (
      <>
        <path d="M9 18a3 3 0 1 1-2-2.8V6l10-2v10" />
        <path d="M17 16a3 3 0 1 1-2-2.8" />
        <path d="M9 9 17 7" />
      </>
    ),
  },
  {
    name: 'finance',
    label: 'Finance',
    keywords: ['finance', 'money', 'budget', 'saving'],
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
    keywords: ['food', 'meal', 'cook', 'nutrition'],
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
    name: 'travel',
    label: 'Travel',
    keywords: ['travel', 'trip', 'walk', 'commute'],
    paths: (
      <>
        <path d="M4 13 20 6l-7 16-2-7-7-2Z" />
        <path d="m11 15 4-4" />
      </>
    ),
  },
  {
    name: 'mindfulness',
    label: 'Mindfulness',
    keywords: ['mindfulness', 'meditation', 'breathing', 'calm'],
    paths: (
      <>
        <path d="M12 20c-3.5-2-5-4.5-5-7.2A5 5 0 0 1 12 8a5 5 0 0 1 5 4.8c0 2.7-1.5 5.2-5 7.2Z" />
        <path d="M12 8V4" />
        <path d="M9 6h6" />
      </>
    ),
  },
  {
    name: 'sleep',
    label: 'Sleep',
    keywords: ['sleep', 'rest', 'night', 'recovery'],
    paths: (
      <>
        <path d="M18 14.5A7 7 0 0 1 9.5 6a6 6 0 1 0 8.5 8.5Z" />
        <path d="M15 5h4l-4 4h4" />
      </>
    ),
  },
  {
    name: 'custom',
    label: 'Custom',
    keywords: ['custom', 'circle', 'simple'],
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
  checkIns: Record<string, Record<LocalDateKey, true>>,
) =>
  habits
    .filter((habit) => checkIns[habit.id]?.[dateKey])
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
