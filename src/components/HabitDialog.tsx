import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { normalizeHabitName } from '../state/habitReducer';
import type { Habit, HabitColor, HabitDraft, HabitIcon, HabitIconName } from '../state/types';
import {
  defaultHabitColor,
  defaultHabitIcon,
  getHabitColorName,
  habitColorOptions,
  habitIconOptions,
  HabitIconView,
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errorId = useId();
  const trimmed = normalizeHabitName(name);
  const error =
    name.length > 40
      ? 'Use 40 characters or fewer.'
      : !trimmed
        ? 'Habit name is required.'
        : isDuplicate(trimmed)
          ? duplicateMessage
          : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const initialIcon = normalizeHabitIcon(initialHabit?.icon ?? defaultHabitIcon);
      setName(initialName);
      setColor(
        initialHabit ? getHabitColorName(initialHabit) : defaultHabitColor(defaultColorIndex),
      );
      setIconMode(initialIcon.type);
      setSvgIcon(initialIcon.type === 'svg' ? initialIcon.name : 'custom');
      setEmoji(initialIcon.type === 'emoji' ? initialIcon.value : '');
      setConfirmDelete(false);
      dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [defaultColorIndex, initialHabit, initialName, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (error) {
      return;
    }
    onSave({
      name: trimmed,
      color,
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
    color,
    icon:
      iconMode === 'emoji'
        ? { type: 'emoji', value: normalizeEmojiValue(emoji) || '•' }
        : { type: 'svg', name: svgIcon },
  };

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <form className="dialog__body" onSubmit={handleSubmit}>
        <div>
          <h2>{mode === 'add' ? 'Add habit' : 'Edit habit'}</h2>
          <p className="muted">
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
          <div className="appearance-preview" style={{ '--habit-color': `var(--habit-${color})` } as CSSProperties}>
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
                  aria-pressed={color === option.name}
                  style={{ '--swatch-color': option.value } as CSSProperties}
                  onClick={() => setColor(option.name)}
                >
                  <span />
                </button>
              ))}
            </div>
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
                SVG
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
              <div className="icon-choice-grid">
                {habitIconOptions.map((option) => (
                  <button
                    key={option.name}
                    className="icon-choice"
                    type="button"
                    aria-label={option.label}
                    aria-pressed={svgIcon === option.name}
                    style={{ '--habit-color': `var(--habit-${color})` } as CSSProperties}
                    onClick={() => setSvgIcon(option.name)}
                  >
                    <HabitIconView
                      habit={{ color, icon: { type: 'svg', name: option.name } }}
                    />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <label className="field emoji-field">
                <span>Emoji</span>
                <input
                  value={emoji}
                  inputMode="text"
                  maxLength={6}
                  placeholder="✓"
                  onChange={(event) => setEmoji(event.target.value)}
                />
              </label>
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
          <button className="button button--primary" type="submit" disabled={Boolean(error)}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
};
