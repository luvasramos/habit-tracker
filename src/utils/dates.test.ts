import { describe, expect, it } from 'vitest';
import { getMonthCells, getWeekDays, getYearColumns } from './calendar';
import { fromLocalDateKey, startOfMondayWeek, toLocalDateKey } from './dates';

describe('date utilities', () => {
  it('creates local date keys without UTC conversion', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(fromLocalDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5));
  });

  it('starts weeks on Monday', () => {
    expect(toLocalDateKey(startOfMondayWeek(new Date(2026, 5, 21)))).toBe('2026-06-15');
    expect(getWeekDays(new Date(2026, 5, 21)).map((day) => day.key)).toEqual([
      '2026-06-15',
      '2026-06-16',
      '2026-06-17',
      '2026-06-18',
      '2026-06-19',
      '2026-06-20',
      '2026-06-21',
    ]);
  });

  it('builds a fixed 42-cell month grid', () => {
    const cells = getMonthCells(new Date(2026, 1, 1));
    expect(cells).toHaveLength(42);
    expect(cells[0].key).toBe('2026-01-26');
    expect(cells.some((cell) => cell.key === '2026-02-28' && cell.inPeriod)).toBe(true);
  });

  it('includes leap day in leap-year month and year grids', () => {
    expect(getMonthCells(new Date(2024, 1, 1)).some((cell) => cell.key === '2024-02-29')).toBe(true);
    expect(getYearColumns(new Date(2024, 0, 1)).flat().some((cell) => cell.key === '2024-02-29')).toBe(true);
  });

  it('covers each real year date once', () => {
    const realDates = getYearColumns(new Date(2026, 0, 1))
      .flat()
      .filter((cell) => cell.inPeriod)
      .map((cell) => cell.key);

    expect(realDates).toHaveLength(365);
    expect(new Set(realDates).size).toBe(365);
    expect(realDates[0]).toBe('2026-01-01');
    expect(realDates[realDates.length - 1]).toBe('2026-12-31');
  });
});
