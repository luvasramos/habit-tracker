import type { CSSProperties, KeyboardEvent, RefObject } from 'react';
import type { Habit } from '../state/types';
import { getHabitColorVar, HabitIconView } from '../utils/habitAppearance';
import { Icon } from './Icon';

type HabitTabsProps = {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelect: (habitId: string) => void;
  onEdit: () => void;
  onAdd: () => void;
  editButtonRef?: RefObject<HTMLButtonElement | null>;
  addButtonRef?: RefObject<HTMLButtonElement | null>;
};

export const HabitTabs = ({
  habits,
  selectedHabitId,
  onSelect,
  onEdit,
  onAdd,
  editButtonRef,
  addButtonRef,
}: HabitTabsProps) => {
  const moveTabFocus = (event: KeyboardEvent<HTMLDivElement>, habitId: string) => {
    const currentIndex = habits.findIndex((habit) => habit.id === habitId);
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      Home: -habits.length,
      End: habits.length,
    };

    if (!(event.key in moves)) {
      return;
    }

    event.preventDefault();
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? habits.length - 1
          : (currentIndex + moves[event.key] + habits.length) % habits.length;
    const nextHabit = habits[nextIndex];
    onSelect(nextHabit.id);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(`[data-habit-tab="${nextHabit.id}"]`)?.focus();
    }, 0);
  };

  return (
    <section className="habit-tabs" aria-label="Habits">
      <div className="habit-tabs__heading">
        <h1>Habits</h1>
        <div className="habit-tabs__actions">
          <button
            ref={editButtonRef}
            className="icon-button habit-tabs__edit"
            type="button"
            aria-label="Edit habit"
            data-tooltip="Edit habit"
            title="Edit habit"
            disabled={habits.length === 0}
            onClick={onEdit}
          >
            <Icon name="edit" />
          </button>
          <button
            ref={addButtonRef}
            className="button button--primary habit-tabs__add"
            type="button"
            aria-label="Add habit"
            onClick={onAdd}
          >
            <Icon name="add" />
            <span>Add habit</span>
          </button>
        </div>
      </div>
      {habits.length > 0 ? (
        <div
          className="habit-tabs__scroller"
          role="tablist"
          aria-label="Habit list"
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;
            const habitId = target.closest<HTMLButtonElement>('[data-habit-tab]')?.dataset.habitTab;
            if (habitId) {
              moveTabFocus(event, habitId);
            }
          }}
        >
          {habits.map((habit) => (
            <button
              key={habit.id}
              className="habit-tab"
              type="button"
              role="tab"
              aria-selected={habit.id === selectedHabitId}
              tabIndex={habit.id === selectedHabitId ? 0 : -1}
              data-habit-tab={habit.id}
              style={{ '--habit-color': getHabitColorVar(habit.id, habits) } as CSSProperties}
              onClick={() => onSelect(habit.id)}
            >
              <span className="habit-tab__color" />
              <HabitIconView habit={habit} />
              {habit.name}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};
