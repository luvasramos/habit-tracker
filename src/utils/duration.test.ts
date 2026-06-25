import { describe, expect, it } from 'vitest';
import {
  calculateRemainingDefaultSessions,
  calculateRemainingTimeMinutes,
  calculateYearlyGoalProgress,
  formatMinutes,
  getCheckInDurationMinutes,
  getDurationHabitSummary,
  isCompletedCheckIn,
  isValidDurationMinutes,
  sumLoggedDurationMinutes,
} from './duration';
import type { CheckInsByHabit } from '../state/types';

describe('duration utilities', () => {
  it('validates integer duration minutes', () => {
    expect(isValidDurationMinutes(60)).toBe(true);
    expect(isValidDurationMinutes(0)).toBe(false);
    expect(isValidDurationMinutes(1.5)).toBe(false);
    expect(isValidDurationMinutes('60')).toBe(false);
  });

  it('distinguishes known duration, unknown duration, and not completed', () => {
    expect(isCompletedCheckIn({ completed: true, durationMinutes: 60 })).toBe(true);
    expect(getCheckInDurationMinutes({ completed: true, durationMinutes: 60 })).toBe(60);
    expect(isCompletedCheckIn(true)).toBe(true);
    expect(getCheckInDurationMinutes(true)).toBeUndefined();
    expect(isCompletedCheckIn(undefined)).toBe(false);
  });

  it('formats minutes as readable time', () => {
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(1500)).toBe('25h');
  });

  it('sums only logged known duration without treating unknown duration as zero state', () => {
    const checkIns: CheckInsByHabit = {
      'habit-1': {
        '2026-01-01': { completed: true, durationMinutes: 60 },
        '2026-01-02': true,
        '2026-01-03': { completed: true },
      },
      'habit-2': {
        '2026-01-01': { completed: true, durationMinutes: 30 },
      },
    };

    expect(sumLoggedDurationMinutes(checkIns)).toBe(90);
    expect(sumLoggedDurationMinutes(checkIns, ['habit-1'])).toBe(60);
    expect(sumLoggedDurationMinutes(checkIns, undefined, ['2026-01-01'])).toBe(90);
  });

  it('calculates yearly goal progress and remaining time', () => {
    expect(calculateYearlyGoalProgress(1500, 9000)).toEqual({
      loggedMinutes: 1500,
      goalMinutes: 9000,
      remainingMinutes: 7500,
      percent: 1 / 6,
      visualPercent: 1 / 6,
    });
    expect(calculateRemainingTimeMinutes(9000, 9000)).toBe(0);
  });

  it('allows goal percentages above 100 while capping visual progress', () => {
    expect(calculateYearlyGoalProgress(9900, 9000)).toEqual({
      loggedMinutes: 9900,
      goalMinutes: 9000,
      remainingMinutes: 0,
      percent: 1.1,
      visualPercent: 1,
    });
  });

  it('calculates remaining default sessions', () => {
    expect(
      calculateRemainingDefaultSessions(1500, {
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      }),
    ).toBe(125);
    expect(
      calculateRemainingDefaultSessions(8950, {
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      }),
    ).toBe(1);
  });

  it('summarizes period duration totals, averages, goals, and unknown records', () => {
    const checkIns = {
      '2026-01-01': { completed: true, durationMinutes: 60 },
      '2026-01-02': { completed: true, durationMinutes: 30 },
      '2026-01-03': true,
    } as const;

    expect(
      getDurationHabitSummary(
        { defaultDurationMinutes: 30, yearlyGoalMinutes: 180 },
        checkIns,
        ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'],
      ),
    ).toEqual({
      completedDays: 3,
      loggedDays: 2,
      unknownDurationDays: 1,
      loggedMinutes: 90,
      averageMinutesPerLoggedDay: 45,
      goalMinutes: 180,
      progressPercent: 0.5,
      visualProgressPercent: 0.5,
      remainingMinutes: 90,
      remainingSessions: 3,
      goalReached: false,
    });
  });

  it('summarizes habits without yearly goals', () => {
    expect(
      getDurationHabitSummary(
        { defaultDurationMinutes: 60 },
        { '2026-01-01': { completed: true, durationMinutes: 60 } },
        ['2026-01-01'],
      ),
    ).toEqual({
      completedDays: 1,
      loggedDays: 1,
      unknownDurationDays: 0,
      loggedMinutes: 60,
      averageMinutesPerLoggedDay: 60,
      goalMinutes: 0,
      progressPercent: 0,
      visualProgressPercent: 0,
      remainingMinutes: 0,
      remainingSessions: 0,
      goalReached: false,
    });
  });
});
