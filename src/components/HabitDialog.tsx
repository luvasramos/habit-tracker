import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { normalizeHabitName } from '../state/habitReducer';

type HabitDialogProps = {
  mode: 'add' | 'edit';
  initialName?: string;
  isOpen: boolean;
  duplicateMessage: string;
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete?: () => void;
  isDuplicate: (name: string) => boolean;
};

export const HabitDialog = ({
  mode,
  initialName = '',
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
      setName(initialName);
      setConfirmDelete(false);
      dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [initialName, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (error) {
      return;
    }
    onSave(trimmed);
    onClose();
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
            {mode === 'add' ? 'Choose a short name.' : 'Rename or delete this habit.'}
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
