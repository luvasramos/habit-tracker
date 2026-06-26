import { describe, expect, it } from 'vitest';
import type { CheckInsByHabit, Habit } from '../state/types';
import {
  calculateAllHabitsStatistics,
  calculateHabitStatistics,
  getHabitCreatedDate,
  getHabitEligibleDateKeys,
  getRangeDays,
  isHabitEligibleOnDate,
} from './statistics';
import { toLocalDateKey } from './dates';

const today = new Date(2026, 5, 25);

const habit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Study',
  createdAt: '2026-06-10',
  color: 'blue',
  icon: { type: 'svg', name: 'book' },
  trackingMode: 'completion',
  ...overrides,
});

describe('statistics utilities', () => {
  it('uses local dates for habit creation date parsing', () => {
    const created = getHabitCreatedDate(habit({ createdAt: '2026-06-25' }), today);

    expect(toLocalDateKey(created)).toBe('2026-06-25');
  });

  it('uses the local date portion of ISO creation timestamps', () => {
    const created = getHabitCreatedDate(habit({ createdAt: '2026-01-01T00:00:00.000Z' }), today);

    expect(toLocalDateKey(created)).toBe('2026-01-01');
  });

  it('excludes dates before a habit created midway through a year', () => {
    const rangeDays = getRangeDays('year', today);

    expect(getHabitEligibleDateKeys(habit({ createdAt: '2026-06-10' }), rangeDays, today)).toHaveLength(16);
  });

  it('excludes dates before a habit created midway through a month', () => {
    const rangeDays = getRangeDays('month', today);

    expect(getHabitEligibleDateKeys(habit({ createdAt: '2026-06-20' }), rangeDays, today)).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
    ]);
  });

  it('excludes future dates from eligible days', () => {
    const rangeDays = getRangeDays('month', today);

    expect(getHabitEligibleDateKeys(habit({ createdAt: '2026-06-24' }), rangeDays, today)).toEqual([
      '2026-06-24',
      '2026-06-25',
    ]);
  });

  it('handles a week range that spans two months', () => {
    const rangeDays = getRangeDays('week', new Date(2026, 6, 1));

    expect(getHabitEligibleDateKeys(habit({ createdAt: '2026-06-30' }), rangeDays, new Date(2026, 6, 3))).toEqual([
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ]);
  });

  it('calculates completed days, missed days, known duration, and unknown duration', () => {
    const rangeDays = getRangeDays('month', today);
    const stats = calculateHabitStatistics(
      habit({
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 180,
      }),
      {
        '2026-06-09': true,
        '2026-06-10': true,
        '2026-06-11': { completed: true, durationMinutes: 60 },
        '2026-06-12': { completed: true },
        '2026-06-30': { completed: true, durationMinutes: 60 },
      },
      rangeDays,
      today,
    );

    expect(stats.daysDone).toBe(3);
    expect(stats.daysMissed).toBe(13);
    expect(stats.loggedMinutes).toBe(60);
    expect(stats.completedDaysWithoutTime).toBe(2);
    expect(stats.durationSummary).toEqual(
      expect.objectContaining({
        completedDays: 3,
        loggedDays: 1,
        unknownDurationDays: 2,
        loggedMinutes: 60,
      }),
    );
  });

  it('calculates individual days done and missed without future dates', () => {
    const fixedToday = new Date(2026, 5, 26);
    const stats = calculateHabitStatistics(
      habit({ createdAt: '2026-06-20' }),
      {
        '2026-06-19': true,
        '2026-06-20': true,
        '2026-06-26': true,
        '2026-06-27': true,
      },
      getRangeDays('month', fixedToday),
      fixedToday,
    );

    expect(stats.eligibleDateKeys).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
    ]);
    expect(stats.daysDone).toBe(2);
    expect(stats.daysMissed).toBe(5);
  });

  it('calculates all-habits active days and no-activity days from eligible dates', () => {
    const habits = [
      habit({ id: 'habit-1', createdAt: '2026-06-10' }),
      habit({ id: 'habit-2', createdAt: '2026-06-24' }),
    ];
    const checkIns: CheckInsByHabit = {
      'habit-1': {
        '2026-06-10': true,
        '2026-06-24': true,
      },
      'habit-2': {
        '2026-06-23': true,
        '2026-06-25': true,
      },
    };

    const stats = calculateAllHabitsStatistics(habits, checkIns, getRangeDays('month', today), today);

    expect(stats.activeDateKeys).toEqual(['2026-06-10', '2026-06-24', '2026-06-25']);
    expect(stats.inactiveDateKeys).toHaveLength(13);
    expect(stats.eligibleDateKeys[0]).toBe('2026-06-10');
    expect(stats.eligibleDateKeys[stats.eligibleDateKeys.length - 1]).toBe('2026-06-25');
  });

  it('calculates one activity day in a full year range without counting future dates', () => {
    const fixedToday = new Date(2026, 5, 26);
    const stats = calculateAllHabitsStatistics(
      [habit({ createdAt: '2026-01-01' })],
      { 'habit-1': { '2026-06-26': true } },
      getRangeDays('year', fixedToday),
      fixedToday,
    );

    expect(stats.eligibleDateKeys).toHaveLength(177);
    expect(stats.activeDateKeys).toEqual(['2026-06-26']);
    expect(stats.inactiveDateKeys).toHaveLength(176);
  });

  it('starts All habits eligibility at the earliest included habit creation date', () => {
    const fixedToday = new Date(2026, 5, 26);
    const stats = calculateAllHabitsStatistics(
      [
        habit({ id: 'habit-1', createdAt: '2026-06-20' }),
        habit({ id: 'habit-2', createdAt: '2026-06-24' }),
      ],
      { 'habit-1': { '2026-06-26': true }, 'habit-2': {} },
      getRangeDays('year', fixedToday),
      fixedToday,
    );

    expect(stats.eligibleDateKeys).toHaveLength(7);
    expect(stats.eligibleDateKeys[0]).toBe('2026-06-20');
    expect(stats.eligibleDateKeys[stats.eligibleDateKeys.length - 1]).toBe('2026-06-26');
    expect(stats.activeDateKeys).toEqual(['2026-06-26']);
    expect(stats.inactiveDateKeys).toHaveLength(6);
  });

  it('counts leap-year eligible dates through today', () => {
    const leapToday = new Date(2024, 1, 29);
    const stats = calculateHabitStatistics(
      habit({ createdAt: '2024-02-28' }),
      { '2024-02-29': true },
      getRangeDays('month', leapToday),
      leapToday,
    );

    expect(stats.eligibleDateKeys).toEqual(['2024-02-28', '2024-02-29']);
    expect(stats.daysDone).toBe(1);
    expect(stats.daysMissed).toBe(1);
  });

  it('does not treat unknown duration as zero in goal calculations', () => {
    const stats = calculateHabitStatistics(
      habit({
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 120,
      }),
      {
        '2026-06-10': true,
        '2026-06-11': { completed: true, durationMinutes: 30 },
      },
      getRangeDays('month', today),
      today,
    );

    expect(stats.durationSummary.loggedMinutes).toBe(30);
    expect(stats.durationSummary.remainingMinutes).toBe(90);
    expect(stats.durationSummary.remainingSessions).toBe(2);
  });

  it('caps visual goal progress while keeping exceeded text progress available', () => {
    const stats = calculateHabitStatistics(
      habit({
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 120,
      }),
      {
        '2026-06-10': { completed: true, durationMinutes: 180 },
      },
      getRangeDays('month', today),
      today,
    );

    expect(stats.durationSummary.progressPercent).toBe(1.5);
    expect(stats.durationSummary.visualProgressPercent).toBe(1);
    expect(stats.durationSummary.remainingMinutes).toBe(0);
    expect(stats.durationSummary.remainingSessions).toBe(0);
    expect(stats.durationSummary.goalReached).toBe(true);
  });

  it('checks individual habit eligibility for year overview cells', () => {
    expect(isHabitEligibleOnDate(habit({ createdAt: '2026-06-10' }), '2026-06-09', today)).toBe(false);
    expect(isHabitEligibleOnDate(habit({ createdAt: '2026-06-10' }), '2026-06-10', today)).toBe(true);
    expect(isHabitEligibleOnDate(habit({ createdAt: '2026-06-10' }), '2026-06-26', today)).toBe(false);
  });
});
