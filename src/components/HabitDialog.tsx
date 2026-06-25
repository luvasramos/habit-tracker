import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { normalizeHabitName } from '../state/habitReducer';
import type { Habit, HabitColor, HabitDraft, HabitIcon, HabitIconName } from '../state/types';
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
import { Icon } from './Icon';

type HabitDialogProps = {
  mode: 'add' | 'edit';
  initialName?: string;
  initialHabit?: Habit;
  defaultColorIndex?: number;
  isOpen: boolean;
  duplicateMessage: string;
  onClose: () => void;
  onSave: (habit: HabitDraft) => void;
  onDelete?: () => void;
  isDuplicate: (name: string) => boolean;
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
  const [colorMode, setColorMode] = useState<'preset' | 'custom'>(() =>
    initialHabit?.color && !isPresetHabitColor(initialHabit.color) ? 'custom' : 'preset',
  );
  const [iconSearch, setIconSearch] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errorId = useId();
  const colorErrorId = useId();
  const titleId = useId();
  const descriptionId = useId();
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
  const colorError =
    colorMode === 'custom' && !normalizedCustomColor
      ? 'Use a valid 3- or 6-digit hex color.'
      : '';
  const formError = error || colorError;

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
      setIconMode(initialIcon.type);
      setSvgIcon(initialIcon.type === 'svg' ? initialIcon.name : 'custom');
      setEmoji(initialIcon.type === 'emoji' ? initialIcon.value : '');
      setIconSearch('');
      setEmojiSearch('');
      setConfirmDelete(false);
      dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [defaultColorIndex, initialHabit, initialName, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (formError) {
      return;
    }
    onSave({
      name: trimmed,
      color: colorMode === 'custom' ? normalizedCustomColor ?? color : color,
      icon:
        iconMode === 'emoji'
          ? { type: 'emoji', value: normalizeEmojiValue(emoji) || '•' }
          : { type: 'svg', name: svgIcon },
    });
    onClose();
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

        <section className="appearance-editor" aria-label="Habit appearance">
          <div className="appearance-preview" style={{ '--habit-color': previewColor } as CSSProperties}>
            <span className="appearance-preview__icon">
              <HabitIconView habit={previewHabit} />
            </span>
            <span>{previewHabit.name}</span>
          </div>

          <div className="appearance-group">
            <span className="appearance-label">Color</span>
            <div className="swatch-grid">
              {habitColorOptions.map((option) => (
                <button
                  key={option.name}
                  className="swatch-button"
                  type="button"
                  aria-label={`Use ${option.label}`}
                  aria-pressed={colorMode === 'preset' && color === option.name}
                  style={{ '--swatch-color': option.value } as CSSProperties}
                  onClick={() => {
                    setColor(option.name);
                    setColorMode('preset');
                  }}
                >
                  <span className="swatch-button__mark" />
                  <span className="swatch-button__name">{option.label}</span>
                </button>
              ))}
              <button
                className="swatch-button swatch-button--custom"
                type="button"
                aria-label="Use custom color"
                aria-pressed={colorMode === 'custom'}
                style={{ '--swatch-color': normalizedCustomColor ?? '#7c8792' } as CSSProperties}
                onClick={() => setColorMode('custom')}
              >
                <span className="swatch-button__mark" />
                <span className="swatch-button__name">Custom</span>
              </button>
            </div>
            {colorMode === 'custom' ? (
              <div className="custom-color">
                <div
                  className="custom-color__preview"
                  style={{ '--swatch-color': normalizedCustomColor ?? '#7c8792' } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="custom-color__swatch" />
                  <span>{normalizedCustomColor ?? 'Preview'}</span>
                </div>
                <div className="custom-color__fields">
                  <label className="field field--compact">
                    <span>Hex</span>
                    <input
                      value={customColor}
                      aria-invalid={Boolean(colorError)}
                      aria-describedby={colorError ? colorErrorId : undefined}
                      placeholder="#7c8792"
                      onChange={(event) => setCustomColor(event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ) : null}
            {colorError ? (
              <p className="form-error" id={colorErrorId}>
                {colorError}
              </p>
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
                <div className="icon-choice-grid">
                  {visibleIcons.map((option) => (
                    <button
                      key={option.name}
                      className="icon-choice"
                      type="button"
                      aria-label={option.label}
                      aria-pressed={svgIcon === option.name}
                      style={{ '--habit-color': previewColor } as CSSProperties}
                      onClick={() => setSvgIcon(option.name)}
                    >
                      <HabitIconView
                        habit={{ color: previewHabit.color, icon: { type: 'svg', name: option.name } }}
                      />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
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
                <div className="emoji-grid">
                  {visibleEmojis.map((option) => (
                    <button
                      key={option.label}
                      className="emoji-choice"
                      type="button"
                      aria-label={option.label}
                      aria-pressed={emoji === option.emoji}
                      onClick={() => setEmoji(option.emoji)}
                    >
                      <span>{option.emoji}</span>
                    </button>
                  ))}
                </div>
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
            Cancel
          </button>
          <button className="button button--primary" type="submit" disabled={Boolean(formError)}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
};
