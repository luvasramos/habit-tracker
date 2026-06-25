import { describe, expect, it } from 'vitest';
import {
  calculateRemainingDefaultSessions,
  calculateRemainingTimeMinutes,
  calculateYearlyGoalProgress,
  formatMinutes,
  getCheckInDurationMinutes,
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
    });
    expect(calculateRemainingTimeMinutes(9000, 9000)).toBe(0);
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
});
