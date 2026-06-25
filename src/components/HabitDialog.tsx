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

  const filteredIcons = habitIconOptions.filter((option) => {
    const query = iconSearch.trim().toLocaleLowerCase();
    if (!query) {
      return true;
    }
    return [option.label, option.name, ...option.keywords].some((item) =>
      item.toLocaleLowerCase().includes(query),
    );
  });

  const emojiOptions = [
    { emoji: '💧', label: 'Water', keywords: ['water', 'hydrate', 'drink'] },
    { emoji: '🏃', label: 'Run', keywords: ['run', 'fitness', 'cardio'] },
    { emoji: '🏋️', label: 'Gym', keywords: ['gym', 'lift', 'strength'] },
    { emoji: '📚', label: 'Read', keywords: ['read', 'book', 'study'] },
    { emoji: '✍️', label: 'Write', keywords: ['write', 'journal', 'notes'] },
    { emoji: '🧘', label: 'Meditate', keywords: ['meditate', 'mindfulness', 'calm'] },
    { emoji: '🥗', label: 'Eat well', keywords: ['food', 'meal', 'nutrition'] },
    { emoji: '😴', label: 'Sleep', keywords: ['sleep', 'rest', 'night'] },
    { emoji: '🎵', label: 'Music', keywords: ['music', 'practice', 'song'] },
    { emoji: '💰', label: 'Money', keywords: ['money', 'finance', 'budget'] },
    { emoji: '🧹', label: 'Clean', keywords: ['clean', 'home', 'tidy'] },
    { emoji: '🌱', label: 'Grow', keywords: ['grow', 'plants', 'habit'] },
  ];
  const filteredEmojis = emojiOptions.filter((option) => {
    const query = emojiSearch.trim().toLocaleLowerCase();
    if (!query) {
      return true;
    }
    return [option.emoji, option.label, ...option.keywords].some((item) =>
      item.toLocaleLowerCase().includes(query),
    );
  });
  const colorPickerValue =
    normalizedCustomColor?.length === 4
      ? (`#${normalizedCustomColor
          .slice(1)
          .split('')
          .map((character) => character + character)
          .join('')}` as `#${string}`)
      : normalizedCustomColor?.length === 7
        ? normalizedCustomColor
        : '#7c8792';

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
                  aria-label={option.label}
                  aria-pressed={colorMode === 'preset' && color === option.name}
                  style={{ '--swatch-color': option.value } as CSSProperties}
                  onClick={() => {
                    setColor(option.name);
                    setColorMode('preset');
                  }}
                >
                  <span />
                </button>
              ))}
            </div>
            <div className="custom-color">
              <button
                className="custom-color__toggle"
                type="button"
                aria-pressed={colorMode === 'custom'}
                style={{ '--swatch-color': normalizedCustomColor ?? '#7c8792' } as CSSProperties}
                onClick={() => setColorMode('custom')}
              >
                <span className="custom-color__swatch" />
                Custom color
              </button>
              {colorMode === 'custom' ? (
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
                  <label className="color-picker-label">
                    <span className="sr-only">Pick custom color</span>
                    <input
                      type="color"
                      value={colorPickerValue}
                      onChange={(event) => setCustomColor(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </div>
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
                <div className="icon-choice-grid">
                  {filteredIcons.map((option) => (
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
                {filteredIcons.length === 0 ? (
                  <p className="muted">No icons found.</p>
                ) : null}
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
                <div className="emoji-grid">
                  {filteredEmojis.map((option) => (
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
                {filteredEmojis.length === 0 ? (
                  <p className="muted">No emoji found.</p>
                ) : null}
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
