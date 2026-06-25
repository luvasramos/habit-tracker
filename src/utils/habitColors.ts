import type { Habit, LocalDateKey } from '../state/types';

export const habitColorNames = ['blue', 'forest', 'lavender', 'sage', 'acid'] as const;

export const getHabitColorName = (habitId: string, habits: Pick<Habit, 'id'>[]) => {
  const index = habits.findIndex((habit) => habit.id === habitId);
  return habitColorNames[Math.max(index, 0) % habitColorNames.length];
};

export const getHabitColorVar = (habitId: string, habits: Pick<Habit, 'id'>[]) =>
  `var(--task-${getHabitColorName(habitId, habits)})`;

export const getDateCompletions = (
  dateKey: LocalDateKey,
  habits: Habit[],
  checkIns: Record<string, Record<LocalDateKey, true>>,
) =>
  habits
    .filter((habit) => checkIns[habit.id]?.[dateKey])
    .map((habit) => ({
      habit,
      color: getHabitColorVar(habit.id, habits),
    }));
