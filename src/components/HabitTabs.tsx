import type { CSSProperties, RefObject } from 'react';
import type { Habit } from '../state/types';
import { getHabitColorVar, HabitIconView } from '../utils/habitAppearance';
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
            style={{ '--habit-color': getHabitColorVar(habit.id, habits) } as CSSProperties}
            onClick={() => onSelect(habit.id)}
          >
            <span className="habit-tab__color" />
            <HabitIconView habit={habit} />
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
