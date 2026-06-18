import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  getDay,
  isAfter,
  isSameDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import type { LocalDateKey, ViewMode } from '../state/types';

const pad = (value: number) => value.toString().padStart(2, '0');

export const toLocalDateKey = (date: Date): LocalDateKey =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromLocalDateKey = (key: LocalDateKey): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const startOfMondayWeek = (date: Date): Date => {
  const day = getDay(date);
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(stripTime(date), offset);
};

export const stripTime = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isFutureDay = (date: Date, today = new Date()) =>
  isAfter(stripTime(date), stripTime(today));

export const fullDateLabel = (date: Date) => format(date, 'EEEE, MMMM d, yyyy');

export const periodLabel = (view: ViewMode, anchorDate: Date) => {
  if (view === 'week') {
    const start = startOfMondayWeek(anchorDate);
    const end = addDays(start, 6);
    if (start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }

  if (view === 'month') {
    return format(anchorDate, 'MMMM yyyy');
  }

  return format(anchorDate, 'yyyy');
};

export const movePeriod = (view: ViewMode, anchorDate: Date, direction: -1 | 1) => {
  if (view === 'week') {
    return addWeeks(anchorDate, direction);
  }
  if (view === 'month') {
    return addMonths(anchorDate, direction);
  }
  return addYears(anchorDate, direction);
};

export const isSameLocalDay = (a: Date, b: Date) => isSameDay(stripTime(a), stripTime(b));

export const daysBetweenInclusive = (start: Date, end: Date) => {
  const cleanStart = stripTime(start);
  const cleanEnd = stripTime(end);
  const days = differenceInCalendarDays(cleanEnd, cleanStart);
  return Array.from({ length: days + 1 }, (_, index) => addDays(cleanStart, index));
};

export const monthBounds = (date: Date) => ({
  start: startOfMonth(date),
  end: endOfMonth(date),
});

export const yearBounds = (date: Date) => ({
  start: startOfYear(date),
  end: endOfYear(date),
});
