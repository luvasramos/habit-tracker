import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { HexColorPicker } from 'react-colorful';
import { normalizeHabitName } from '../state/habitReducer';
import type {
  Habit,
  HabitColor,
  HabitDraft,
  HabitSaveOptions,
  HabitIconName,
  HabitTrackingMode,
  CheckInEntry,
  LocalDateKey,
  DistanceUnitPreference,
} from '../state/types';
import {
  defaultHabitColor,
  defaultHabitIcon,
  getHabitColorValue,
  getHabitColorName,
  habitIconOptions,
  HabitIconView,
  isPresetHabitColor,
  normalizeHexColor,
  normalizeEmojiValue,
  normalizeHabitIcon,
} from '../utils/habitAppearance';
import {
  formatMinutes,
  getCheckInDurationMinutes,
  isCompletedCheckIn,
  isValidDurationMinutes,
} from '../utils/duration';
import {
  formatDistance,
  getCheckInDistanceMeters,
  isDistanceUnitPreference,
  isValidDistanceMeters,
  metersFromKilometers,
  metersFromMiles,
} from '../utils/distance';
import { toLocalDateKey } from '../utils/dates';
import { Icon } from './Icon';
import { IconPicker } from './FullIconBrowser';
import { FullEmojiBrowser } from './FullEmojiBrowser';
import { RecommendationOption } from './RecommendationOption';

type HabitEditorPageProps = {
  mode: 'add' | 'edit';
  initialName?: string;
  initialHabit?: Habit;
  defaultColorIndex?: number;
  duplicateMessage: string;
  onBack: () => void;
  onSave: (habit: HabitDraft, options?: HabitSaveOptions) => void;
  onDelete?: () => void;
  isDuplicate: (name: string) => boolean;
  initialCheckIns?: Record<LocalDateKey, CheckInEntry>;
};

type EmojiOption = {
  emoji: string;
  label: string;
  keywords: string[];
};

const popularIconNames: HabitIconName[] = [
  'star',
  'book',
  'graduation',
  'language',
  'dumbbell',
  'running',
  'meditation',
  'money',
  'water',
  'sleep',
  'target',
  'custom',
];

type IconChoice = HabitIconName | `tabler:${string}`;

const recentIconStorageKey = 'habit-grid:recent-icons';
const recentEmojiStorageKey = 'habit-grid:recent-emoji';

const isIconifyChoice = (value: IconChoice): value is `tabler:${string}` =>
  value.startsWith('tabler:');

const readRecentList = (key: string) => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeRecentList = (key: string, value: string) => {
  const next = [value, ...readRecentList(key).filter((item) => item !== value)].slice(0, 12);
  window.localStorage.setItem(key, JSON.stringify(next));
  return next;
};

const emojiOptions: EmojiOption[] = [
  { emoji: '🇯🇵', label: 'Japan flag', keywords: ['japan', 'japanese', 'language', 'country', 'flag'] },
  { emoji: '⭐', label: 'Star', keywords: ['star', 'favorite', 'priority', 'important'] },
  { emoji: '🔥', label: 'Flame', keywords: ['flame', 'fire', 'streak', 'energy'] },
  { emoji: '✅', label: 'Check', keywords: ['check', 'done', 'complete', 'success'] },
  { emoji: '🏃', label: 'Running', keywords: ['running', 'run', 'fitness', 'cardio', 'jog'] },
  { emoji: '🚶', label: 'Walking', keywords: ['walking', 'walk', 'steps', 'fitness'] },
  { emoji: '🏋️', label: 'Fitness', keywords: ['fitness', 'gym', 'lift', 'strength', 'weights'] },
  { emoji: '💪', label: 'Strength', keywords: ['strength', 'gym', 'fitness', 'muscle'] },
  { emoji: '🧘', label: 'Meditation', keywords: ['meditation', 'meditate', 'mindfulness', 'yoga', 'calm'] },
  { emoji: '📚', label: 'Books', keywords: ['books', 'book', 'study', 'read', 'reading'] },
  { emoji: '📖', label: 'Reading', keywords: ['reading', 'read', 'book', 'study'] },
  { emoji: '🎓', label: 'Learning', keywords: ['learning', 'study', 'school', 'course', 'graduation'] },
  { emoji: '🗣️', label: 'Language', keywords: ['language', 'speak', 'japanese', 'japan', 'study'] },
  { emoji: '🌏', label: 'Globe Asia', keywords: ['globe', 'world', 'asia', 'japan', 'japanese', 'travel'] },
  { emoji: '🌍', label: 'Globe', keywords: ['globe', 'world', 'language', 'travel'] },
  { emoji: '🎵', label: 'Music', keywords: ['music', 'song', 'practice', 'note'] },
  { emoji: '🎹', label: 'Piano', keywords: ['piano', 'music', 'practice', 'instrument'] },
  { emoji: '🎸', label: 'Guitar', keywords: ['guitar', 'music', 'practice', 'instrument'] },
  { emoji: '💰', label: 'Finance', keywords: ['finance', 'money', 'budget', 'saving'] },
  { emoji: '💵', label: 'Cash', keywords: ['cash', 'money', 'finance', 'saving'] },
  { emoji: '📈', label: 'Investing', keywords: ['investing', 'chart', 'finance', 'money'] },
  { emoji: '🍎', label: 'Apple', keywords: ['apple', 'food', 'nutrition', 'healthy'] },
  { emoji: '🥗', label: 'Salad', keywords: ['salad', 'food', 'nutrition', 'meal'] },
  { emoji: '🥦', label: 'Vegetables', keywords: ['vegetables', 'food', 'nutrition', 'healthy'] },
  { emoji: '🍳', label: 'Cooking', keywords: ['cooking', 'cook', 'food', 'meal'] },
  { emoji: '💧', label: 'Water', keywords: ['water', 'hydrate', 'drink', 'health'] },
  { emoji: '☕', label: 'Coffee', keywords: ['coffee', 'drink', 'morning', 'caffeine'] },
  { emoji: '😴', label: 'Sleep', keywords: ['sleep', 'rest', 'night', 'recovery'] },
  { emoji: '🌙', label: 'Moon', keywords: ['moon', 'night', 'sleep', 'rest'] },
  { emoji: '☀️', label: 'Sun', keywords: ['sun', 'morning', 'day', 'outside'] },
  { emoji: '✈️', label: 'Travel', keywords: ['travel', 'plane', 'flight', 'trip'] },
  { emoji: '🚲', label: 'Bike', keywords: ['bike', 'cycle', 'cycling', 'fitness'] },
  { emoji: '🚗', label: 'Car', keywords: ['car', 'drive', 'commute', 'travel'] },
  { emoji: '🏠', label: 'Home', keywords: ['home', 'house', 'chores', 'family'] },
  { emoji: '🧹', label: 'Clean', keywords: ['clean', 'tidy', 'chores', 'home'] },
  { emoji: '🐶', label: 'Pet', keywords: ['pet', 'dog', 'animal', 'walk'] },
  { emoji: '🐱', label: 'Cat', keywords: ['cat', 'pet', 'animal'] },
  { emoji: '🌱', label: 'Plant', keywords: ['plant', 'grow', 'garden', 'nature'] },
  { emoji: '🪴', label: 'Houseplant', keywords: ['houseplant', 'plant', 'water', 'garden'] },
  { emoji: '🎯', label: 'Goal', keywords: ['goal', 'target', 'focus', 'aim'] },
  { emoji: '🏆', label: 'Trophy', keywords: ['trophy', 'win', 'achievement', 'goal'] },
  { emoji: '💻', label: 'Laptop', keywords: ['laptop', 'computer', 'work', 'coding'] },
  { emoji: '🧑‍💻', label: 'Coding', keywords: ['coding', 'computer', 'work', 'programming'] },
  { emoji: '📝', label: 'Notes', keywords: ['notes', 'write', 'journal', 'study'] },
  { emoji: '✍️', label: 'Writing', keywords: ['writing', 'write', 'journal', 'notes'] },
  { emoji: '📅', label: 'Calendar', keywords: ['calendar', 'date', 'schedule', 'plan'] },
  { emoji: '⏰', label: 'Alarm', keywords: ['alarm', 'clock', 'time', 'morning'] },
  { emoji: '⏱️', label: 'Timer', keywords: ['timer', 'time', 'focus', 'clock'] },
  { emoji: '📷', label: 'Camera', keywords: ['camera', 'photo', 'creative'] },
  { emoji: '🎨', label: 'Art', keywords: ['art', 'paint', 'creative'] },
  { emoji: '🧠', label: 'Brain', keywords: ['brain', 'learn', 'focus', 'mind'] },
  { emoji: '🫀', label: 'Heart organ', keywords: ['heart', 'health', 'cardio'] },
  { emoji: '🫁', label: 'Breathing', keywords: ['breathing', 'breath', 'health', 'mindfulness'] },
  { emoji: '🦷', label: 'Teeth', keywords: ['teeth', 'brush', 'dental', 'health'] },
  { emoji: '🛁', label: 'Bath', keywords: ['bath', 'self care', 'clean', 'relax'] },
  { emoji: '🛏️', label: 'Bed', keywords: ['bed', 'sleep', 'rest'] },
  { emoji: '🧺', label: 'Laundry', keywords: ['laundry', 'clean', 'chores', 'home'] },
  { emoji: '🛒', label: 'Shopping', keywords: ['shopping', 'groceries', 'food', 'errands'] },
  { emoji: '📦', label: 'Package', keywords: ['package', 'organize', 'home', 'errand'] },
  { emoji: '📌', label: 'Pin', keywords: ['pin', 'task', 'important', 'reminder'] },
  { emoji: '🔁', label: 'Repeat', keywords: ['repeat', 'routine', 'habit', 'cycle'] },
  { emoji: '🔒', label: 'Lock', keywords: ['lock', 'privacy', 'focus', 'secure'] },
  { emoji: '🔑', label: 'Key', keywords: ['key', 'home', 'routine'] },
  { emoji: '🧩', label: 'Puzzle', keywords: ['puzzle', 'brain', 'learn', 'challenge'] },
  { emoji: '🎧', label: 'Headphones', keywords: ['headphones', 'music', 'listen', 'language'] },
  { emoji: '🎤', label: 'Microphone', keywords: ['microphone', 'sing', 'voice', 'language'] },
  { emoji: '📞', label: 'Call', keywords: ['call', 'phone', 'connect', 'family'] },
  { emoji: '💬', label: 'Chat', keywords: ['chat', 'message', 'language', 'talk'] },
  { emoji: '🤝', label: 'Handshake', keywords: ['handshake', 'social', 'work', 'meet'] },
  { emoji: '🙏', label: 'Gratitude', keywords: ['gratitude', 'pray', 'mindfulness', 'thanks'] },
  { emoji: '😊', label: 'Smile', keywords: ['smile', 'mood', 'happy', 'mindfulness'] },
  { emoji: '🧊', label: 'Cold', keywords: ['cold', 'ice', 'shower', 'recovery'] },
  { emoji: '🏊', label: 'Swimming', keywords: ['swimming', 'fitness', 'exercise'] },
  { emoji: '⚽', label: 'Soccer', keywords: ['soccer', 'sport', 'fitness'] },
  { emoji: '🏀', label: 'Basketball', keywords: ['basketball', 'sport', 'fitness'] },
  { emoji: '🎾', label: 'Tennis', keywords: ['tennis', 'sport', 'fitness'] },
  { emoji: '🥾', label: 'Hiking', keywords: ['hiking', 'walk', 'travel', 'nature'] },
  { emoji: '🏕️', label: 'Camping', keywords: ['camping', 'outside', 'travel', 'nature'] },
  { emoji: '🌊', label: 'Ocean', keywords: ['ocean', 'water', 'outside', 'calm'] },
  { emoji: '💡', label: 'Idea', keywords: ['idea', 'learn', 'creative', 'focus'] },
  { emoji: '📒', label: 'Journal', keywords: ['journal', 'write', 'notes', 'diary'] },
  { emoji: '🕯️', label: 'Candle', keywords: ['candle', 'calm', 'mindfulness', 'evening'] },
  { emoji: '🧭', label: 'Compass', keywords: ['compass', 'travel', 'direction', 'goal'] },
  { emoji: '🧪', label: 'Experiment', keywords: ['experiment', 'science', 'study', 'learn'] },
  { emoji: '🪙', label: 'Coin', keywords: ['coin', 'money', 'finance', 'saving'] },
];

const selectorPageSize = 6;

const recommendedColorOptions = [
  { name: 'neonLime', value: '#98FC00' },
  { name: 'neonOrange', value: '#FF7135' },
  { name: 'neonMagenta', value: '#FE01E8' },
  { name: 'neonBlue', value: '#0163FF' },
  { name: 'neonYellow', value: '#FFD400' },
  { name: 'neonViolet', value: '#7C4DFF' },
] as const;

type PendingMigration =
  | {
      type: 'enable-duration';
      draft: HabitDraft;
    }
  | {
      type: 'disable-duration';
      draft: HabitDraft;
    }
  | {
      type: 'enable-distance';
      draft: HabitDraft;
    };

const formatSessionInput = (minutes?: number) =>
  isValidDurationMinutes(minutes) ? formatMinutes(minutes) : '';

const formatGoalInput = (minutes?: number) =>
  isValidDurationMinutes(minutes) && minutes % 60 === 0 ? String(minutes / 60) : '';

const formatDistanceInput = (meters: number | undefined, unit: DistanceUnitPreference) => {
  if (!isValidDistanceMeters(meters)) {
    return '';
  }

  if (unit === 'm') {
    return String(meters);
  }

  const value = unit === 'mi' ? meters / 1609.344 : meters / 1000;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
};

const parseSessionDuration = (value: string) => {
  const input = value.trim().toLocaleLowerCase();
  if (!input) {
    return null;
  }

  const compact = input.replace(/\s+/g, ' ');
  const hourMatch = compact.match(/(\d+)\s*h(?:ours?|rs?)?/);
  const minuteMatch = compact.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  const bareMinutesMatch = compact.match(/^\d+$/);

  if (!hourMatch && !minuteMatch && !bareMinutesMatch) {
    return null;
  }

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch
    ? Number(minuteMatch[1])
    : bareMinutesMatch
      ? Number(compact)
      : 0;
  const durationMinutes = hours * 60 + minutes;

  return isValidDurationMinutes(durationMinutes) ? durationMinutes : null;
};

const parseYearlyGoal = (value: string) => {
  const input = value.trim().toLocaleLowerCase().replace(/\s*(hours?|hrs?|h)\s*$/, '');
  if (!input) {
    return undefined;
  }

  if (!/^\d+$/.test(input)) {
    return null;
  }

  const hours = Number(input);
  return hours > 0 ? hours * 60 : null;
};

const parseDistanceMeters = (value: string, unit: DistanceUnitPreference) => {
  const input = value.trim();
  if (!input) {
    return undefined;
  }

  if (!/^\d+(?:[.,]\d+)?$/.test(input)) {
    return null;
  }

  const numericValue = Number(input.replace(',', '.'));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  if (unit === 'm') {
    return Math.round(numericValue);
  }

  return unit === 'mi' ? metersFromMiles(numericValue) : metersFromKilometers(numericValue);
};

export const HabitEditorPage = ({
  mode,
  initialName = '',
  initialHabit,
  defaultColorIndex = 0,
  duplicateMessage,
  onBack,
  onSave,
  onDelete,
  isDuplicate,
  initialCheckIns = {},
}: HabitEditorPageProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<HabitColor>(() =>
    initialHabit ? getHabitColorName(initialHabit) : defaultHabitColor(defaultColorIndex),
  );
  const [iconMode, setIconMode] = useState<'svg' | 'emoji'>('svg');
  const [svgIcon, setSvgIcon] = useState<IconChoice>('custom');
  const [emoji, setEmoji] = useState('');
  const [recentIcons, setRecentIcons] = useState<string[]>(() => readRecentList(recentIconStorageKey));
  const [recentEmoji, setRecentEmoji] = useState<string[]>(() => readRecentList(recentEmojiStorageKey));
  const [customColor, setCustomColor] = useState('#7C8792');
  const [customDraftColor, setCustomDraftColor] = useState('#7C8792');
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'preset' | 'custom'>(() =>
    initialHabit?.color && !isPresetHabitColor(initialHabit.color) ? 'custom' : 'preset',
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [trackingMode, setTrackingMode] = useState<HabitTrackingMode>('completion');
  const [defaultSessionInput, setDefaultSessionInput] = useState('');
  const [yearlyGoalInput, setYearlyGoalInput] = useState('');
  const [defaultDistanceInput, setDefaultDistanceInput] = useState('');
  const [yearlyDistanceGoalInput, setYearlyDistanceGoalInput] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnitPreference>('km');
  const [yearlyDistanceGoalUnit, setYearlyDistanceGoalUnit] =
    useState<DistanceUnitPreference>('km');
  const [pendingMigration, setPendingMigration] = useState<PendingMigration | null>(null);
  const errorId = useId();
  const colorErrorId = useId();
  const defaultSessionErrorId = useId();
  const yearlyGoalErrorId = useId();
  const defaultDistanceErrorId = useId();
  const yearlyDistanceGoalErrorId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const customColorPanelRef = useRef<HTMLDivElement>(null);
  const customColorButtonRef = useRef<HTMLButtonElement>(null);
  const trimmed = normalizeHabitName(name);
  const error =
    name.length > 40
      ? 'Use 40 characters or fewer.'
      : !trimmed
        ? 'Habit name is required.'
        : isDuplicate(trimmed)
          ? duplicateMessage
          : '';
  const normalizedCustomColor = normalizeHexColor(customColor);
  const normalizedCustomDraftColor = normalizeHexColor(customDraftColor);
  const colorError =
    customColorOpen && !normalizedCustomDraftColor
      ? 'Use a valid 3- or 6-digit hex color.'
      : '';
  const defaultDurationMinutes =
    trackingMode === 'duration' ? parseSessionDuration(defaultSessionInput) : undefined;
  const yearlyGoalMinutes =
    trackingMode === 'duration' ? parseYearlyGoal(yearlyGoalInput) : undefined;
  const defaultSessionError =
    trackingMode === 'duration' && !defaultDurationMinutes
      ? 'Enter a session longer than zero.'
      : '';
  const yearlyGoalError =
    trackingMode === 'duration' && yearlyGoalMinutes === null
      ? 'Enter whole hours greater than zero.'
      : '';
  const defaultDistanceMeters =
    trackingMode === 'distance' ? parseDistanceMeters(defaultDistanceInput, distanceUnit) : undefined;
  const yearlyDistanceGoalMeters =
    trackingMode === 'distance'
      ? parseDistanceMeters(yearlyDistanceGoalInput, yearlyDistanceGoalUnit)
      : undefined;
  const defaultDistanceError =
    trackingMode === 'distance' && !defaultDistanceMeters
      ? 'Enter a distance greater than zero.'
      : '';
  const yearlyDistanceGoalError =
    trackingMode === 'distance' && yearlyDistanceGoalMeters === null
      ? 'Enter a goal distance greater than zero.'
      : '';
  const durationSummary =
    trackingMode === 'duration' && defaultDurationMinutes
      ? [
          `${formatMinutes(defaultDurationMinutes)} per completed day`,
          yearlyGoalMinutes ? `${formatMinutes(yearlyGoalMinutes)} yearly goal` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';
  const distanceSummary =
    trackingMode === 'distance' && defaultDistanceMeters
      ? [
          `${formatDistance(defaultDistanceMeters, distanceUnit)} per completed day`,
          yearlyDistanceGoalMeters
            ? `${formatDistance(yearlyDistanceGoalMeters, yearlyDistanceGoalUnit)} yearly goal`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';
  const formError =
    error ||
    colorError ||
    defaultSessionError ||
    yearlyGoalError ||
    defaultDistanceError ||
    yearlyDistanceGoalError;
  const todayKey = toLocalDateKey(new Date());
  const historicalCompletionsWithoutDuration = Object.entries(initialCheckIns).filter(
    ([dateKey, entry]) =>
      dateKey < todayKey &&
      isCompletedCheckIn(entry) &&
      getCheckInDurationMinutes(entry) === undefined,
  );
  const historicalCompletionsWithoutDistance = Object.entries(initialCheckIns).filter(
    ([dateKey, entry]) =>
      dateKey < todayKey &&
      isCompletedCheckIn(entry) &&
      getCheckInDistanceMeters(entry) === undefined,
  );

  const suggestedIcons = popularIconNames
    .map((name) => habitIconOptions.find((option) => option.name === name))
    .filter((option): option is (typeof habitIconOptions)[number] => Boolean(option));
  const defaultIconChoices = useMemo<IconChoice[]>(() => {
    const recent = recentIcons.filter((item): item is IconChoice =>
      item.startsWith('tabler:') || habitIconOptions.some((option) => option.name === item),
    );
    const popular = suggestedIcons.map((option) => option.name);
    return Array.from(new Set([...recent, ...popular])).slice(0, selectorPageSize);
  }, [recentIcons, suggestedIcons]);
  useEffect(() => {
    const initialIcon = normalizeHabitIcon(initialHabit?.icon ?? defaultHabitIcon);
    setName(initialName);
    const initialColor = initialHabit
      ? getHabitColorName(initialHabit)
      : defaultHabitColor(defaultColorIndex);
    setColor(initialColor);
    setColorMode(isPresetHabitColor(initialColor) ? 'preset' : 'custom');
    setCustomColor(isPresetHabitColor(initialColor) ? '#7C8792' : initialColor);
    setCustomDraftColor(isPresetHabitColor(initialColor) ? '#7C8792' : initialColor);
    setCustomColorOpen(false);
    setIconMode(initialIcon.type === 'emoji' ? 'emoji' : 'svg');
    setSvgIcon(
      initialIcon.type === 'iconify'
        ? initialIcon.id
        : initialIcon.type === 'svg'
          ? initialIcon.name
          : 'custom',
    );
    setEmoji(initialIcon.type === 'emoji' ? initialIcon.value : '');
    setConfirmDelete(false);
    const initialTrackingMode = initialHabit?.trackingMode ?? 'completion';
    const initialDistanceUnit = initialHabit?.distanceUnitPreference ?? 'km';
    setTrackingMode(initialTrackingMode);
    setDefaultSessionInput(formatSessionInput(initialHabit?.defaultDurationMinutes));
    setYearlyGoalInput(formatGoalInput(initialHabit?.yearlyGoalMinutes));
    setDistanceUnit(initialDistanceUnit);
    setYearlyDistanceGoalUnit(initialDistanceUnit);
    setDefaultDistanceInput(
      formatDistanceInput(initialHabit?.defaultDistanceMeters, initialDistanceUnit),
    );
    setYearlyDistanceGoalInput(
      formatDistanceInput(initialHabit?.yearlyDistanceGoalMeters, initialDistanceUnit),
    );
    setPendingMigration(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [defaultColorIndex, initialHabit, initialName]);

  const buildDraft = (): HabitDraft => ({
    name: trimmed,
    color: colorMode === 'custom' ? normalizedCustomColor ?? color : color,
    icon:
      iconMode === 'emoji'
        ? { type: 'emoji', value: normalizeEmojiValue(emoji) || '•' }
        : isIconifyChoice(svgIcon)
          ? { type: 'iconify', id: svgIcon }
          : { type: 'svg', name: svgIcon },
    trackingMode,
    defaultDurationMinutes:
      trackingMode === 'duration' && defaultDurationMinutes ? defaultDurationMinutes : undefined,
    yearlyGoalMinutes:
      trackingMode === 'duration' && yearlyGoalMinutes ? yearlyGoalMinutes : undefined,
    defaultDistanceMeters:
      trackingMode === 'distance' && defaultDistanceMeters ? defaultDistanceMeters : undefined,
    yearlyDistanceGoalMeters:
      trackingMode === 'distance' && yearlyDistanceGoalMeters
        ? yearlyDistanceGoalMeters
        : undefined,
    distanceUnitPreference: trackingMode === 'distance' ? distanceUnit : undefined,
  });
  const saveDraft = (draft: HabitDraft, options?: HabitSaveOptions) => {
    onSave(draft, options);
    onBack();
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (formError) {
      return;
    }

    const draft = buildDraft();
    const initialTrackingMode = initialHabit?.trackingMode ?? 'completion';

    if (
      mode === 'edit' &&
      initialTrackingMode !== 'duration' &&
      trackingMode === 'duration' &&
      historicalCompletionsWithoutDuration.length > 0
    ) {
      setPendingMigration({ type: 'enable-duration', draft });
      return;
    }

    if (
      mode === 'edit' &&
      initialTrackingMode !== 'distance' &&
      trackingMode === 'distance' &&
      historicalCompletionsWithoutDistance.length > 0
    ) {
      setPendingMigration({ type: 'enable-distance', draft });
      return;
    }

    if (
      mode === 'edit' &&
      initialTrackingMode === 'duration' &&
      trackingMode === 'completion'
    ) {
      setPendingMigration({ type: 'disable-duration', draft });
      return;
    }

    saveDraft(draft);
  };

  const previewHabit: Habit = {
    id: initialHabit?.id ?? 'preview',
    name: trimmed || 'Habit',
    createdAt: initialHabit?.createdAt ?? '',
    color: colorMode === 'custom' ? normalizedCustomColor ?? color : color,
    icon:
      iconMode === 'emoji'
        ? { type: 'emoji', value: normalizeEmojiValue(emoji) || '•' }
        : isIconifyChoice(svgIcon)
          ? { type: 'iconify', id: svgIcon }
          : { type: 'svg', name: svgIcon },
    trackingMode,
    defaultDurationMinutes:
      trackingMode === 'duration' && defaultDurationMinutes ? defaultDurationMinutes : undefined,
    yearlyGoalMinutes:
      trackingMode === 'duration' && yearlyGoalMinutes ? yearlyGoalMinutes : undefined,
    defaultDistanceMeters:
      trackingMode === 'distance' && defaultDistanceMeters ? defaultDistanceMeters : undefined,
    yearlyDistanceGoalMeters:
      trackingMode === 'distance' && yearlyDistanceGoalMeters
        ? yearlyDistanceGoalMeters
        : undefined,
    distanceUnitPreference: trackingMode === 'distance' ? distanceUnit : undefined,
  };
  const previewColor = getHabitColorValue(previewHabit);

  const selectIconChoice = (choice: IconChoice) => {
    setSvgIcon(choice);
    setIconMode('svg');
    setRecentIcons(writeRecentList(recentIconStorageKey, choice));
  };

  const selectEmojiChoice = (value: string) => {
    setEmoji(value);
    setIconMode('emoji');
    setRecentEmoji(writeRecentList(recentEmojiStorageKey, value));
  };

  return (
    <section className="habit-editor-page" aria-labelledby={titleId}>
      <header className="habit-editor-header">
        <div>
          <h1 id={titleId}>{mode === 'add' ? 'Add habit' : 'Edit habit'}</h1>
          <p className="muted" id={descriptionId}>
            {mode === 'add' ? 'Choose a short name and identity.' : 'Update this habit or remove it.'}
          </p>
        </div>
        <button className="button habit-editor-back" type="button" aria-label="Back to habits" onClick={onBack}>
          <Icon name="previous" />
          Back
        </button>
      </header>

      <form className="habit-editor-form" aria-describedby={descriptionId} onSubmit={handleSubmit}>

        {pendingMigration?.type === 'enable-duration' ? (
          <section className="migration-prompt" aria-label="Historical time migration">
            <div>
              <h3>Past completed days</h3>
              <p className="muted">
                {historicalCompletionsWithoutDuration.length} completed day
                {historicalCompletionsWithoutDuration.length === 1
                  ? ' does'
                  : 's do'} not have time logged.
              </p>
            </div>
            <button
              className="migration-choice migration-choice--recommended"
              type="button"
              onClick={() =>
                saveDraft(pendingMigration.draft, {
                  historicalDurationMigration: 'keep-empty',
                  todayKey,
                })
              }
            >
              <span>Keep past time empty</span>
              <span>
                Past completed days will still count as completed days, but they will not contribute to total hours.
              </span>
            </button>
            <button
              className="migration-choice"
              type="button"
              onClick={() =>
                saveDraft(pendingMigration.draft, {
                  historicalDurationMigration: 'apply-default',
                  todayKey,
                })
              }
            >
              <span>Apply default time to past completed days</span>
              <span>
                Every past completed day without time will receive the current default session duration.
              </span>
            </button>
            <button
              className="button button--quiet migration-cancel"
              type="button"
              onClick={() => setPendingMigration(null)}
            >
              <Icon name="close" />
              Cancel
              <span>Return to the habit editor without changing the tracking mode.</span>
            </button>
          </section>
        ) : null}

        {pendingMigration?.type === 'disable-duration' ? (
          <section className="migration-prompt" aria-label="Tracking mode confirmation">
            <div>
              <h3>Switch to completion only?</h3>
              <p className="muted">
                Logged hours will be preserved internally and can be used again if this habit is switched back to time tracking.
              </p>
            </div>
            <button
              className="migration-choice migration-choice--recommended"
              type="button"
              onClick={() => saveDraft(pendingMigration.draft)}
            >
              <span>Preserve logged time and switch</span>
              <span>Future check-ins will count as completed days only.</span>
            </button>
            <button
              className="button button--quiet migration-cancel"
              type="button"
              onClick={() => setPendingMigration(null)}
            >
              <Icon name="close" />
              Cancel
              <span>Return to the habit editor without changing the tracking mode.</span>
            </button>
          </section>
        ) : null}

        {pendingMigration?.type === 'enable-distance' ? (
          <section className="migration-prompt" aria-label="Historical distance migration">
            <div>
              <h3>Past completed days</h3>
              <p className="muted">
                {historicalCompletionsWithoutDistance.length} completed day
                {historicalCompletionsWithoutDistance.length === 1
                  ? ' does'
                  : 's do'} not have distance logged.
              </p>
            </div>
            <button
              className="migration-choice migration-choice--recommended"
              type="button"
              onClick={() =>
                saveDraft(pendingMigration.draft, {
                  historicalDistanceMigration: 'keep-empty',
                  todayKey,
                })
              }
            >
              <span>Keep past distance empty</span>
              <span>
                Past completed days will still count as completed days, but they will not contribute to distance totals.
              </span>
            </button>
            <button
              className="migration-choice"
              type="button"
              onClick={() =>
                saveDraft(pendingMigration.draft, {
                  historicalDistanceMigration: 'apply-default',
                  todayKey,
                })
              }
            >
              <span>Apply default distance to past completed days</span>
              <span>
                Every past completed day without distance will receive the current default distance.
              </span>
            </button>
            <button
              className="button button--quiet migration-cancel"
              type="button"
              onClick={() => setPendingMigration(null)}
            >
              <Icon name="close" />
              Cancel
              <span>Return to the habit editor without changing the tracking mode.</span>
            </button>
          </section>
        ) : null}

        <label className="field">
          <span>Name</span>
          <input
            ref={inputRef}
            value={name}
            maxLength={41}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {error ? (
          <p className="form-error" id={errorId}>
            {error}
          </p>
        ) : null}

        <section className="tracking-settings" aria-label="Tracking">
          <span className="appearance-label">Tracking</span>
          <div className="segmented segmented--compact" aria-label="Tracking mode">
            <button
              className="segmented__button"
              type="button"
              aria-pressed={trackingMode === 'completion'}
              onClick={() => setTrackingMode('completion')}
            >
              Completion only
            </button>
            <button
              className="segmented__button"
              type="button"
              aria-pressed={trackingMode === 'duration'}
              onClick={() => setTrackingMode('duration')}
            >
              Completion + time
            </button>
            <button
              className="segmented__button"
              type="button"
              aria-pressed={trackingMode === 'distance'}
              onClick={() => setTrackingMode('distance')}
            >
              Completion + distance
            </button>
          </div>

          {trackingMode === 'duration' ? (
            <div className="tracking-settings__details">
              <div className="tracking-settings__fields">
                <label className="field field--compact">
                  <span>Default session</span>
                  <input
                    value={defaultSessionInput}
                    placeholder="1h"
                    aria-invalid={Boolean(defaultSessionError)}
                    aria-describedby={defaultSessionError ? defaultSessionErrorId : undefined}
                    onChange={(event) => setDefaultSessionInput(event.target.value)}
                  />
                </label>
                <label className="field field--compact">
                  <span>Yearly goal</span>
                  <input
                    value={yearlyGoalInput}
                    placeholder="150 hours"
                    inputMode="numeric"
                    aria-invalid={Boolean(yearlyGoalError)}
                    aria-describedby={yearlyGoalError ? yearlyGoalErrorId : undefined}
                    onChange={(event) => setYearlyGoalInput(event.target.value)}
                  />
                </label>
              </div>
              {defaultSessionError ? (
                <p className="form-error" id={defaultSessionErrorId}>
                  {defaultSessionError}
                </p>
              ) : null}
              {yearlyGoalError ? (
                <p className="form-error" id={yearlyGoalErrorId}>
                  {yearlyGoalError}
                </p>
              ) : null}
              {durationSummary ? <p className="tracking-summary">{durationSummary}</p> : null}
            </div>
          ) : null}

          {trackingMode === 'distance' ? (
            <div className="tracking-settings__details">
              <div className="tracking-settings__fields">
                <div className="tracking-distance-field">
                  <label className="field field--compact">
                    <span>Default distance</span>
                    <input
                      value={defaultDistanceInput}
                      placeholder="5"
                      inputMode="decimal"
                      aria-invalid={Boolean(defaultDistanceError)}
                      aria-describedby={
                        defaultDistanceError ? defaultDistanceErrorId : undefined
                      }
                      onChange={(event) => setDefaultDistanceInput(event.target.value)}
                    />
                  </label>
                  <label className="field field--compact tracking-unit-field">
                    <span>Unit</span>
                    <select
                      value={distanceUnit}
                      aria-label="Default distance unit"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (isDistanceUnitPreference(value)) {
                          setDistanceUnit(value);
                        }
                      }}
                    >
                      <option value="km">km</option>
                      <option value="m">m</option>
                      <option value="mi">mi</option>
                    </select>
                  </label>
                </div>
                <div className="tracking-distance-field">
                  <label className="field field--compact">
                    <span>Yearly distance goal</span>
                    <input
                      value={yearlyDistanceGoalInput}
                      placeholder="500"
                      inputMode="decimal"
                      aria-invalid={Boolean(yearlyDistanceGoalError)}
                      aria-describedby={
                        yearlyDistanceGoalError ? yearlyDistanceGoalErrorId : undefined
                      }
                      onChange={(event) => setYearlyDistanceGoalInput(event.target.value)}
                    />
                  </label>
                  <label className="field field--compact tracking-unit-field">
                    <span>Unit</span>
                    <select
                      value={yearlyDistanceGoalUnit}
                      aria-label="Yearly distance goal unit"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (isDistanceUnitPreference(value)) {
                          setYearlyDistanceGoalUnit(value);
                        }
                      }}
                    >
                      <option value="km">km</option>
                      <option value="m">m</option>
                      <option value="mi">mi</option>
                    </select>
                  </label>
                </div>
              </div>
              {defaultDistanceError ? (
                <p className="form-error" id={defaultDistanceErrorId}>
                  {defaultDistanceError}
                </p>
              ) : null}
              {yearlyDistanceGoalError ? (
                <p className="form-error" id={yearlyDistanceGoalErrorId}>
                  {yearlyDistanceGoalError}
                </p>
              ) : null}
              {distanceSummary ? <p className="tracking-summary">{distanceSummary}</p> : null}
            </div>
          ) : null}
        </section>

        <section className="appearance-editor" aria-label="Habit appearance">
          <div className="appearance-preview" style={{ '--habit-color': previewColor } as CSSProperties}>
            <span className="appearance-preview__icon">
              <HabitIconView habit={previewHabit} />
            </span>
            <span>{previewHabit.name}</span>
          </div>

          <div className="appearance-group">
            <span className="appearance-label">Color</span>
            <div
              className="selector-grid swatch-grid swatch-grid--recommended"
              role="radiogroup"
              aria-label="Recommended colors"
            >
              {recommendedColorOptions.map((option) => (
                <RecommendationOption
                  key={option.name}
                  className="swatch-button"
                  accessibleName={`Use ${option.value}`}
                  isSelected={colorMode === 'preset' && color === option.name}
                  selectionRole="radio"
                  style={{ '--swatch-color': option.value } as CSSProperties}
                  onClick={() => {
                    setColor(option.name);
                    setColorMode('preset');
                    setCustomColorOpen(false);
                  }}
                >
                  <span className="swatch-button__mark" />
                </RecommendationOption>
              ))}
            </div>
            <button
              ref={customColorButtonRef}
              className="custom-color-toggle"
              type="button"
              aria-label="Custom color"
              aria-expanded={customColorOpen}
              aria-pressed={colorMode === 'custom'}
              style={{ '--swatch-color': normalizedCustomColor ?? '#7C8792' } as CSSProperties}
              onClick={() => {
                setCustomDraftColor(normalizedCustomColor ?? customColor);
                setCustomColorOpen((open) => !open);
              }}
            >
              <span className="custom-color__swatch" />
              Custom color
            </button>
            {customColorOpen ? (
              <div className="custom-color" ref={customColorPanelRef} aria-label="Custom color panel">
                <HexColorPicker color={normalizedCustomDraftColor ?? '#7C8792'} onChange={setCustomDraftColor} />
                <div
                  className="custom-color__preview"
                  style={{ '--swatch-color': normalizedCustomDraftColor ?? '#7C8792' } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="custom-color__swatch" />
                  <span>{normalizedCustomDraftColor ?? 'Preview'}</span>
                </div>
                <div className="custom-color__fields">
                  <label className="field field--compact">
                    <span>Hex</span>
                    <input
                      value={customDraftColor}
                      aria-invalid={Boolean(colorError)}
                      aria-describedby={colorError ? colorErrorId : undefined}
                      placeholder="#7C8792"
                      onChange={(event) => setCustomDraftColor(event.target.value)}
                    />
                  </label>
                </div>
                {colorError ? (
                  <p className="form-error" id={colorErrorId}>
                    {colorError}
                  </p>
                ) : null}
                <div className="custom-color__actions">
                  <button
                    className="button button--quiet"
                    type="button"
                    onClick={() => {
                      setCustomDraftColor(customColor);
                      setCustomColorOpen(false);
                    }}
                  >
                    <Icon name="close" />
                    Cancel
                  </button>
                  <button
                    className="button button--primary"
                    type="button"
                    disabled={!normalizedCustomDraftColor}
                  onClick={() => {
                    if (!normalizedCustomDraftColor) {
                      return;
                    }
                    setCustomColor(normalizedCustomDraftColor);
                      setColor(normalizedCustomDraftColor);
                      setColorMode('custom');
                      setCustomColorOpen(false);
                    }}
                  >
                    <Icon name="check" />
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
            {colorMode === 'custom' && !customColorOpen ? (
              <button
                className="custom-color-current"
                type="button"
                aria-label={`Current custom color ${normalizedCustomColor ?? customColor}`}
                style={{ '--swatch-color': normalizedCustomColor ?? '#7C8792' } as CSSProperties}
                onClick={() => {
                  setCustomDraftColor(normalizedCustomColor ?? customColor);
                  setCustomColorOpen(true);
                }}
              >
                <span className="custom-color__swatch" />
                <span>{normalizedCustomColor ?? customColor}</span>
              </button>
            ) : null}
          </div>

          <div className="appearance-group">
            <span className="appearance-label">Icon</span>
            <div className="segmented segmented--compact" aria-label="Icon type">
              <button
                className="segmented__button"
                type="button"
                aria-pressed={iconMode === 'svg'}
                onClick={() => setIconMode('svg')}
              >
                Icons
              </button>
              <button
                className="segmented__button"
                type="button"
                aria-pressed={iconMode === 'emoji'}
                onClick={() => setIconMode('emoji')}
              >
                Emoji
              </button>
            </div>

            {iconMode === 'svg' ? (
              <IconPicker
                selectedIconId={svgIcon}
                previewColor={previewColor}
                fallbackHabit={{ color: previewHabit.color }}
                suggestedIconIds={defaultIconChoices}
                onSelect={selectIconChoice}
                onSelectLocal={selectIconChoice}
              />
            ) : (
              <FullEmojiBrowser
                selectedEmoji={emoji}
                suggestions={emojiOptions}
                recentEmoji={recentEmoji}
                onSelect={selectEmojiChoice}
              />
            )}
          </div>
        </section>

        {confirmDelete && initialHabit ? (
          <p className="delete-confirmation" role="status">
            Delete {initialHabit.name}? This will remove the habit and delete its check-in history.
          </p>
        ) : null}

        <div className="habit-editor-actions" data-mode={mode}>
          <div className="habit-editor-actions__left">
            {mode === 'edit' && onDelete ? (
              <button
                className="button button--danger habit-editor-delete"
                type="button"
                onClick={() => {
                  if (confirmDelete) {
                    onDelete();
                    onBack();
                  } else {
                    setConfirmDelete(true);
                  }
                }}
              >
                <Icon name="delete" />
                {confirmDelete ? 'Confirm delete' : 'Delete habit'}
              </button>
            ) : null}
          </div>
          <div className="habit-editor-actions__right">
            <button className="button button--quiet" type="button" onClick={onBack}>
              <Icon name="close" />
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={Boolean(formError)}>
              <Icon name="check" />
              Save
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
