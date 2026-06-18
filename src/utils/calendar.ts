import { addDays, eachMonthOfInterval, format, isSameMonth, isSameYear } from 'date-fns';
import { monthBounds, startOfMondayWeek, toLocalDateKey, yearBounds } from './dates';

export type CalendarCell = {
  date: Date;
  key: string;
  inPeriod: boolean;
};

export const getWeekDays = (anchorDate: Date): CalendarCell[] => {
  const start = startOfMondayWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return { date, key: toLocalDateKey(date), inPeriod: true };
  });
};

export const getMonthCells = (anchorDate: Date): CalendarCell[] => {
  const { start } = monthBounds(anchorDate);
  const gridStart = startOfMondayWeek(start);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: toLocalDateKey(date),
      inPeriod: isSameMonth(date, anchorDate),
    };
  });
};

export const getYearColumns = (anchorDate: Date): CalendarCell[][] => {
  const { start, end } = yearBounds(anchorDate);
  const gridStart = startOfMondayWeek(start);
  const gridEnd = addDays(startOfMondayWeek(end), 6);
  const dayCount = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
  const cells = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: toLocalDateKey(date),
      inPeriod: isSameYear(date, anchorDate),
    };
  });

  return Array.from({ length: Math.ceil(cells.length / 7) }, (_, column) =>
    cells.slice(column * 7, column * 7 + 7),
  );
};

export const getYearMonthLabels = (anchorDate: Date) => {
  const { start, end } = yearBounds(anchorDate);
  const gridStart = startOfMondayWeek(start);

  return eachMonthOfInterval({ start, end }).map((month) => ({
    label: format(month, 'MMM'),
    column: Math.floor((startOfMondayWeek(month).getTime() - gridStart.getTime()) / 86400000 / 7),
  }));
};
