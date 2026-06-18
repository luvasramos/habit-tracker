import type { RefObject } from 'react';
import type { Habit } from '../state/types';
import { Icon } from './Icon';

type HabitTabsProps = {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelect: (habitId: string) => void;
  onEdit: () => void;
  editButtonRef?: RefObject<HTMLButtonElement | null>;
};

export const HabitTabs = ({
  habits,
  selectedHabitId,
  onSelect,
  onEdit,
  editButtonRef,
}: HabitTabsProps) => {
  if (habits.length === 0) {
    return null;
  }

  return (
    <section className="habit-tabs" aria-label="Habits">
      <div className="habit-tabs__scroller" role="tablist" aria-label="Habit list">
        {habits.map((habit) => (
          <button
            key={habit.id}
            className="habit-tab"
            type="button"
            role="tab"
            aria-selected={habit.id === selectedHabitId}
            onClick={() => onSelect(habit.id)}
          >
            <Icon name="habits" />
            {habit.name}
          </button>
        ))}
      </div>
      <button ref={editButtonRef} className="button button--quiet" type="button" onClick={onEdit}>
        <Icon name="edit" />
        Edit habit
      </button>
    </section>
  );
};
