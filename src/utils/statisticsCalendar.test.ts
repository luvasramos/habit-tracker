import { describe, expect, it } from 'vitest';
import type { CheckInsByHabit, Habit } from '../state/types';
import { getMonthCells, getWeekDays } from './calendar';
import { getStatisticsDateLabel, getStatisticsDateState } from './statisticsCalendar';

const today = new Date(2026, 5, 25);

const habit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Japanese',
  createdAt: '2026-06-20',
  color: 'blue',
  icon: { type: 'svg', name: 'language' },
  trackingMode: 'duration',
  defaultDurationMinutes: 60,
  ...overrides,
});

const stateFor = ({
  date,
  habits = [habit()],
  checkIns = {
    'habit-1': {
      '2026-06-24': true,
      '2026-06-25': { completed: true, durationMinutes: 60 },
    },
  },
  selectedHabit = habits[0],
}: {
  date: Date;
  habits?: Habit[];
  checkIns?: CheckInsByHabit;
  selectedHabit?: Habit | null;
}) =>
  getStatisticsDateState({
    date,
    habits,
    checkIns,
    selectedHabit,
    today,
  });

describe('statistics calendar date state', () => {
  it('classifies known duration, unknown duration, missed, future, and before-created dates', () => {
    expect(stateFor({ date: new Date(2026, 5, 25) }).state).toBe('completed-known-duration');
    expect(stateFor({ date: new Date(2026, 5, 24) }).state).toBe('completed-unknown-duration');
    expect(stateFor({ date: new Date(2026, 5, 23) }).state).toBe('missed');
    expect(stateFor({ date: new Date(2026, 5, 26) }).state).toBe('future');
    expect(stateFor({ date: new Date(2026, 5, 19) }).state).toBe('before-habit-creation');
  });

  it('labels selected habit states accessibly', () => {
    expect(getStatisticsDateLabel(stateFor({ date: new Date(2026, 5, 25) }), habit())).toContain(
      'Japanese completed, 1h logged',
    );
    expect(getStatisticsDateLabel(stateFor({ date: new Date(2026, 5, 24) }), habit())).toContain(
      'Japanese completed, no time recorded',
    );
    expect(getStatisticsDateLabel(stateFor({ date: new Date(2026, 5, 23) }), habit())).toContain(
      'Japanese not completed',
    );
  });

  it('classifies All habits active, no-activity, future, and unavailable states', () => {
    const habits = [
      habit({ id: 'habit-1', name: 'Japanese', createdAt: '2026-06-20' }),
      habit({ id: 'habit-2', name: 'Gym', createdAt: '2026-06-22', trackingMode: 'completion' }),
    ];
    const checkIns: CheckInsByHabit = {
      'habit-1': { '2026-06-25': { completed: true, durationMinutes: 60 } },
      'habit-2': { '2026-06-25': true },
    };

    const active = stateFor({ date: new Date(2026, 5, 25), habits, checkIns, selectedHabit: null });
    expect(active.state).toBe('active');
    expect(active.completions.map((completion) => completion.name)).toEqual(['Japanese', 'Gym']);
    expect(stateFor({ date: new Date(2026, 5, 23), habits, checkIns, selectedHabit: null }).state).toBe('no-activity');
    expect(stateFor({ date: new Date(2026, 5, 26), habits, checkIns, selectedHabit: null }).state).toBe('future');
    expect(stateFor({ date: new Date(2026, 5, 19), habits, checkIns, selectedHabit: null }).state).toBe(
      'before-all-relevant-habits-existed',
    );
  });

  it('uses Monday-first calendars for weeks, months, and leap years', () => {
    expect(getWeekDays(new Date(2026, 6, 1)).map((cell) => cell.key)).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ]);
    expect(getMonthCells(new Date(2024, 1, 1))[0].key).toBe('2024-01-29');
    expect(getMonthCells(new Date(2024, 1, 1)).some((cell) => cell.key === '2024-02-29')).toBe(true);
  });
});
