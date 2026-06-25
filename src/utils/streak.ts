import { addDays } from 'date-fns';
import type { LocalDateKey } from '../state/types';
import { stripTime, toLocalDateKey } from './dates';

type CheckInsByHabit = Record<string, Record<LocalDateKey, true>>;

export const getCompletedActivityDays = (checkIns: CheckInsByHabit) => {
  const completedDays = new Set<LocalDateKey>();

  Object.values(checkIns).forEach((habitCheckIns) => {
    Object.entries(habitCheckIns).forEach(([dateKey, completed]) => {
      if (completed) {
        completedDays.add(dateKey);
      }
    });
  });

  return completedDays;
};

export const calculateActivityStreak = (
  checkIns: CheckInsByHabit,
  today = new Date(),
) => {
  const completedDays = getCompletedActivityDays(checkIns);
  const todayDate = stripTime(today);
  const todayKey = toLocalDateKey(todayDate);
  let cursor = completedDays.has(todayKey) ? todayDate : addDays(todayDate, -1);
  let streak = 0;

  while (completedDays.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};
