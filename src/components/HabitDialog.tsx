import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { normalizeHabitName } from '../state/habitReducer';
import type {
  Habit,
  HabitColor,
  HabitDraft,
  HabitSaveOptions,
  HabitIcon,
  HabitIconName,
  HabitTrackingMode,
  CheckInEntry,
  LocalDateKey,
} from '../state/types';
import {
  defaultHabitColor,
  defaultHabitIcon,
  getHabitColorValue,
  getHabitColorName,
  habitColorOptions,
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
import { toLocalDateKey } from '../utils/dates';
import { Icon } from './Icon';

type HabitDialogProps = {
  mode: 'add' | 'edit';
  initialName?: string;
  initialHabit?: Habit;
  defaultColorIndex?: number;
  isOpen: boolean;
  duplicateMessage: string;
  onClose: () => void;
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

const popularEmojiOptions = emojiOptions.filter(({ emoji }) =>
  ['⭐', '🔥', '✅', '🏃', '🏋️', '📚', '🎓', '🗣️', '🇯🇵', '💰', '💧', '😴'].includes(emoji),
);

const matchesSearch = (query: string, values: string[]) =>
  values.some((value) => value.toLocaleLowerCase().includes(query));

const selectorPageSize = 6;

const pageCountFor = (total: number) => Math.max(1, Math.ceil(total / selectorPageSize));

const pageItems = <T,>(items: T[], page: number) =>
  items.slice((page - 1) * selectorPageSize, page * selectorPageSize);

type PendingMigration =
  | {
      type: 'enable-duration';
      draft: HabitDraft;
    }
  | {
      type: 'disable-duration';
      draft: HabitDraft;
    };

const formatSessionInput = (minutes?: number) =>
  isValidDurationMinutes(minutes) ? formatMinutes(minutes) : '';

const formatGoalInput = (minutes?: number) =>
  isValidDurationMinutes(minutes) && minutes % 60 === 0 ? String(minutes / 60) : '';

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

type SelectorPaginationProps = {
  page: number;
  pageCount: number;
  label: string;
  onPageChange: (page: number) => void;
};

const SelectorPagination = ({
  page,
  pageCount,
  label,
  onPageChange,
}: SelectorPaginationProps) => (
  <div className="selector-pagination" aria-label={`${label} pages`}>
    <button
      className="icon-button selector-pagination__button"
      type="button"
      aria-label={`Previous ${label} page`}
      disabled={page <= 1}
      onClick={() => onPageChange(Math.max(1, page - 1))}
    >
      <Icon name="previous" />
    </button>
    <span aria-live="polite">
      {page} / {pageCount}
    </span>
    <button
      className="icon-button selector-pagination__button"
      type="button"
      aria-label={`Next ${label} page`}
      disabled={page >= pageCount}
      onClick={() => onPageChange(Math.min(pageCount, page + 1))}
    >
      <Icon name="next" />
    </button>
  </div>
);

export const HabitDialog = ({
  mode,
  initialName = '',
  initialHabit,
  defaultColorIndex = 0,
  isOpen,
  duplicateMessage,
  onClose,
  onSave,
  onDelete,
  isDuplicate,
  initialCheckIns = {},
}: HabitDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<HabitColor>(() =>
    initialHabit ? getHabitColorName(initialHabit) : defaultHabitColor(defaultColorIndex),
  );
  const [iconMode, setIconMode] = useState<HabitIcon['type']>('svg');
  const [svgIcon, setSvgIcon] = useState<HabitIconName>('custom');
  const [emoji, setEmoji] = useState('');
  const [customColor, setCustomColor] = useState('#7c8792');
  const [customDraftColor, setCustomDraftColor] = useState('#7c8792');
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'preset' | 'custom'>(() =>
    initialHabit?.color && !isPresetHabitColor(initialHabit.color) ? 'custom' : 'preset',
  );
  const [colorPage, setColorPage] = useState(1);
  const [iconSearch, setIconSearch] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [iconPage, setIconPage] = useState(1);
  const [emojiPage, setEmojiPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [trackingMode, setTrackingMode] = useState<HabitTrackingMode>('completion');
  const [defaultSessionInput, setDefaultSessionInput] = useState('');
  const [yearlyGoalInput, setYearlyGoalInput] = useState('');
  const [pendingMigration, setPendingMigration] = useState<PendingMigration | null>(null);
  const errorId = useId();
  const colorErrorId = useId();
  const defaultSessionErrorId = useId();
  const yearlyGoalErrorId = useId();
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
  const durationSummary =
    trackingMode === 'duration' && defaultDurationMinutes
      ? [
          `${formatMinutes(defaultDurationMinutes)} per completed day`,
          yearlyGoalMinutes ? `${formatMinutes(yearlyGoalMinutes)} yearly goal` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';
  const formError = error || colorError || defaultSessionError || yearlyGoalError;
  const todayKey = toLocalDateKey(new Date());
  const historicalCompletionsWithoutDuration = Object.entries(initialCheckIns).filter(
    ([dateKey, entry]) =>
      dateKey < todayKey &&
      isCompletedCheckIn(entry) &&
      getCheckInDurationMinutes(entry) === undefined,
  );

  const iconQuery = iconSearch.trim().toLocaleLowerCase();
  const emojiQuery = emojiSearch.trim().toLocaleLowerCase();
  const filteredIcons = iconQuery
    ? habitIconOptions.filter((option) =>
        matchesSearch(iconQuery, [option.label, option.name, ...option.keywords]),
      )
    : habitIconOptions;
  const suggestedIcons = popularIconNames
    .map((name) => habitIconOptions.find((option) => option.name === name))
    .filter((option): option is (typeof habitIconOptions)[number] => Boolean(option));
  const visibleIcons = filteredIcons.length > 0 ? filteredIcons : suggestedIcons;
  const filteredEmojis = emojiQuery
    ? emojiOptions.filter((option) =>
        matchesSearch(emojiQuery, [option.emoji, option.label, ...option.keywords]),
      )
    : emojiOptions;
  const visibleEmojis = filteredEmojis.length > 0 ? filteredEmojis : popularEmojiOptions;
  const colorPageCount = pageCountFor(habitColorOptions.length);
  const iconPageCount = pageCountFor(visibleIcons.length);
  const emojiPageCount = pageCountFor(visibleEmojis.length);
  const visibleColors = pageItems(habitColorOptions, colorPage);
  const pagedIcons = pageItems(visibleIcons, iconPage);
  const pagedEmojis = pageItems(visibleEmojis, emojiPage);

  useEffect(() => {
    setIconPage(1);
  }, [iconSearch]);

  useEffect(() => {
    setEmojiPage(1);
  }, [emojiSearch]);

  useEffect(() => {
    if (iconMode === 'svg') {
      setIconPage(1);
    } else {
      setEmojiPage(1);
    }
  }, [iconMode]);

  useEffect(() => {
    setColorPage((page) => Math.min(page, colorPageCount));
  }, [colorPageCount]);

  useEffect(() => {
    setIconPage((page) => Math.min(page, iconPageCount));
  }, [iconPageCount]);

  useEffect(() => {
    setEmojiPage((page) => Math.min(page, emojiPageCount));
  }, [emojiPageCount]);

  useEffect(() => {
    if (!customColorOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        customColorPanelRef.current?.contains(target) ||
        customColorButtonRef.current?.contains(target)
      ) {
        return;
      }
      setCustomColorOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setCustomColorOpen(false);
        customColorButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [customColorOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const initialIcon = normalizeHabitIcon(initialHabit?.icon ?? defaultHabitIcon);
      setName(initialName);
      const initialColor = initialHabit
        ? getHabitColorName(initialHabit)
        : defaultHabitColor(defaultColorIndex);
      setColor(initialColor);
      setColorMode(isPresetHabitColor(initialColor) ? 'preset' : 'custom');
      setCustomColor(isPresetHabitColor(initialColor) ? '#7c8792' : initialColor);
      setCustomDraftColor(isPresetHabitColor(initialColor) ? '#7c8792' : initialColor);
      setCustomColorOpen(false);
      setColorPage(1);
      setIconMode(initialIcon.type);
      setSvgIcon(initialIcon.type === 'svg' ? initialIcon.name : 'custom');
      setEmoji(initialIcon.type === 'emoji' ? initialIcon.value : '');
      setIconSearch('');
      setEmojiSearch('');
      setIconPage(1);
      setEmojiPage(1);
      setConfirmDelete(false);
      setTrackingMode(initialHabit?.trackingMode ?? 'completion');
      setDefaultSessionInput(formatSessionInput(initialHabit?.defaultDurationMinutes));
      setYearlyGoalInput(formatGoalInput(initialHabit?.yearlyGoalMinutes));
      setPendingMigration(null);
      dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [defaultColorIndex, initialHabit, initialName, isOpen]);

  const buildDraft = (): HabitDraft => ({
    name: trimmed,
    color: colorMode === 'custom' ? normalizedCustomColor ?? color : color,
    icon:
      iconMode === 'emoji'
        ? { type: 'emoji', value: normalizeEmojiValue(emoji) || '•' }
        : { type: 'svg', name: svgIcon },
    trackingMode,
    defaultDurationMinutes:
      trackingMode === 'duration' && defaultDurationMinutes ? defaultDurationMinutes : undefined,
    yearlyGoalMinutes:
      trackingMode === 'duration' && yearlyGoalMinutes ? yearlyGoalMinutes : undefined,
  });
  const saveDraft = (draft: HabitDraft, options?: HabitSaveOptions) => {
    onSave(draft, options);
    onClose();
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
        : { type: 'svg', name: svgIcon },
    trackingMode,
    defaultDurationMinutes:
      trackingMode === 'duration' && defaultDurationMinutes ? defaultDurationMinutes : undefined,
    yearlyGoalMinutes:
      trackingMode === 'duration' && yearlyGoalMinutes ? yearlyGoalMinutes : undefined,
  };
  const previewColor = getHabitColorValue(previewHabit);

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="dialog__body" onSubmit={handleSubmit}>
        <div>
          <h2 id={titleId}>{mode === 'add' ? 'Add habit' : 'Edit habit'}</h2>
          <p className="muted" id={descriptionId}>
            {mode === 'add'
              ? 'Choose a short name and identity.'
              : 'Update this habit or remove it.'}
          </p>
        </div>

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
            <div className="selector-grid swatch-grid">
              {visibleColors.map((option) => (
                <button
                  key={option.name}
                  className="selector-card swatch-button"
                  type="button"
                  aria-label={`Use ${option.label}`}
                  aria-pressed={colorMode === 'preset' && color === option.name}
                  style={{ '--swatch-color': option.value } as CSSProperties}
                  onClick={() => {
                    setColor(option.name);
                    setColorMode('preset');
                    setCustomColorOpen(false);
                  }}
                >
                  <span className="swatch-button__mark" />
                </button>
              ))}
              {Array.from({ length: selectorPageSize - visibleColors.length }).map((_, index) => (
                <span className="selector-card selector-card--empty" key={`color-empty-${index}`} />
              ))}
            </div>
            <SelectorPagination
              page={colorPage}
              pageCount={colorPageCount}
              label="color"
              onPageChange={setColorPage}
            />
            <button
              ref={customColorButtonRef}
              className="custom-color-toggle"
              type="button"
              aria-label="Custom color"
              aria-expanded={customColorOpen}
              aria-pressed={colorMode === 'custom'}
              style={{ '--swatch-color': normalizedCustomColor ?? '#7c8792' } as CSSProperties}
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
                <div
                  className="custom-color__preview"
                  style={{ '--swatch-color': normalizedCustomDraftColor ?? '#7c8792' } as CSSProperties}
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
                      placeholder="#7c8792"
                      onChange={(event) => setCustomDraftColor(event.target.value)}
                    />
                  </label>
                  <label className="native-color-field">
                    <span className="sr-only">Color picker</span>
                    <input
                      type="color"
                      value={normalizedCustomDraftColor ?? '#7c8792'}
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
                style={{ '--swatch-color': normalizedCustomColor ?? '#7c8792' } as CSSProperties}
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
              <>
                <label className="field field--search">
                  <span>Search icons</span>
                  <input
                    value={iconSearch}
                    placeholder="Search"
                    onChange={(event) => setIconSearch(event.target.value)}
                  />
                </label>
                {filteredIcons.length === 0 ? (
                  <p className="muted search-fallback">No exact match. Try one of these.</p>
                ) : null}
                <div className="selector-grid icon-choice-grid">
                  {pagedIcons.map((option) => (
                    <button
                      key={option.name}
                      className="selector-card icon-choice"
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      aria-pressed={svgIcon === option.name}
                      style={{ '--habit-color': previewColor } as CSSProperties}
                      onClick={() => setSvgIcon(option.name)}
                    >
                      <HabitIconView
                        habit={{ color: previewHabit.color, icon: { type: 'svg', name: option.name } }}
                      />
                    </button>
                  ))}
                  {Array.from({ length: selectorPageSize - pagedIcons.length }).map((_, index) => (
                    <span className="selector-card selector-card--empty" key={`icon-empty-${index}`} />
                  ))}
                </div>
                <SelectorPagination
                  page={iconPage}
                  pageCount={iconPageCount}
                  label="icon"
                  onPageChange={setIconPage}
                />
              </>
            ) : (
              <div className="emoji-picker">
                <label className="field field--search">
                  <span>Search emoji</span>
                  <input
                    value={emojiSearch}
                    placeholder="Search"
                    onChange={(event) => setEmojiSearch(event.target.value)}
                  />
                </label>
                {filteredEmojis.length === 0 ? (
                  <p className="muted search-fallback">No exact match. Try one of these.</p>
                ) : null}
                <div className="selector-grid emoji-grid">
                  {pagedEmojis.map((option) => (
                    <button
                      key={option.label}
                      className="selector-card emoji-choice"
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      aria-pressed={emoji === option.emoji}
                      onClick={() => setEmoji(option.emoji)}
                    >
                      <span>{option.emoji}</span>
                    </button>
                  ))}
                  {Array.from({ length: selectorPageSize - pagedEmojis.length }).map((_, index) => (
                    <span className="selector-card selector-card--empty" key={`emoji-empty-${index}`} />
                  ))}
                </div>
                <SelectorPagination
                  page={emojiPage}
                  pageCount={emojiPageCount}
                  label="emoji"
                  onPageChange={setEmojiPage}
                />
                <label className="field emoji-field">
                  <span>Selected emoji</span>
                  <input
                    value={emoji}
                    inputMode="text"
                    maxLength={6}
                    placeholder="✓"
                    onChange={(event) => setEmoji(event.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        {mode === 'edit' && onDelete ? (
          <div className="delete-box">
            <button
              className="button button--danger"
              type="button"
              onClick={() => {
                if (confirmDelete) {
                  onDelete();
                  onClose();
                } else {
                  setConfirmDelete(true);
                }
              }}
            >
              <Icon name="delete" />
              {confirmDelete ? 'Confirm delete' : 'Delete habit'}
            </button>
            {confirmDelete ? (
              <p className="muted">This removes the habit and all of its check-ins.</p>
            ) : null}
          </div>
        ) : null}

        <div className="dialog__actions">
          <button className="button" type="button" onClick={onClose}>
            <Icon name="close" />
            Cancel
          </button>
          <button className="button button--primary" type="submit" disabled={Boolean(formError)}>
            <Icon name="check" />
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
};
