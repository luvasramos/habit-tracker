import { describe, expect, it } from 'vitest';
import {
  calculateRemainingDefaultDistanceSessions,
  calculateRemainingDistanceMeters,
  calculateYearlyDistanceGoalProgress,
  createCompletedDistanceCheckIn,
  formatDistance,
  getCheckInDistanceMeters,
  getDefaultDistanceMeters,
  getDistanceHabitSummary,
  isValidDistanceMeters,
  kilometersFromMeters,
  metersFromKilometers,
  metersFromMiles,
  milesFromMeters,
  sumLoggedDistanceMeters,
} from './distance';
import type { CheckInsByHabit } from '../state/types';

describe('distance utilities', () => {
  it('validates integer distance meters', () => {
    expect(isValidDistanceMeters(5000)).toBe(true);
    expect(isValidDistanceMeters(0)).toBe(false);
    expect(isValidDistanceMeters(1.5)).toBe(false);
    expect(isValidDistanceMeters('5000')).toBe(false);
  });

  it('converts kilometers and miles to meters', () => {
    expect(metersFromKilometers(5)).toBe(5000);
    expect(metersFromKilometers(1.5)).toBe(1500);
    expect(metersFromMiles(3.1)).toBe(4989);
  });

  it('converts meters to kilometers and miles', () => {
    expect(kilometersFromMeters(1500)).toBe(1.5);
    expect(milesFromMeters(1609.344)).toBe(1);
  });

  it('distinguishes known distance, unknown distance, and not completed', () => {
    expect(getCheckInDistanceMeters({ completed: true, distanceMeters: 5000 })).toBe(5000);
    expect(getCheckInDistanceMeters(true)).toBeUndefined();
    expect(getCheckInDistanceMeters({ completed: true })).toBeUndefined();
    expect(getCheckInDistanceMeters(undefined)).toBeUndefined();
  });

  it('creates completed check-ins with optional distance', () => {
    expect(createCompletedDistanceCheckIn(5000)).toEqual({
      completed: true,
      distanceMeters: 5000,
    });
    expect(createCompletedDistanceCheckIn()).toBe(true);
  });

  it('uses default distance only for distance habits', () => {
    expect(
      getDefaultDistanceMeters({
        trackingMode: 'distance',
        defaultDistanceMeters: 5000,
      }),
    ).toBe(5000);
    expect(
      getDefaultDistanceMeters({
        trackingMode: 'completion',
        defaultDistanceMeters: 5000,
      }),
    ).toBeUndefined();
  });

  it('formats distance compactly', () => {
    expect(formatDistance(500, 'km')).toBe('500 m');
    expect(formatDistance(1000, 'km')).toBe('1 km');
    expect(formatDistance(1500, 'km')).toBe('1.5 km');
    expect(formatDistance(5000, 'km')).toBe('5 km');
    expect(formatDistance(5000, 'mi')).toBe('3.1 mi');
    expect(formatDistance(500, 'm')).toBe('500 m');
  });

  it('sums only known logged distance without treating unknown distance as zero state', () => {
    const checkIns: CheckInsByHabit = {
      'habit-1': {
        '2026-01-01': { completed: true, distanceMeters: 5000 },
        '2026-01-02': true,
        '2026-01-03': { completed: true },
      },
      'habit-2': {
        '2026-01-01': { completed: true, distanceMeters: 3000 },
      },
    };

    expect(sumLoggedDistanceMeters(checkIns)).toBe(8000);
    expect(sumLoggedDistanceMeters(checkIns, ['habit-1'])).toBe(5000);
    expect(sumLoggedDistanceMeters(checkIns, undefined, ['2026-01-01'])).toBe(8000);
  });

  it('calculates yearly distance goal progress and remaining distance', () => {
    expect(calculateYearlyDistanceGoalProgress(5000, 10000)).toEqual({
      loggedMeters: 5000,
      goalMeters: 10000,
      remainingMeters: 5000,
      percent: 0.5,
      visualPercent: 0.5,
    });
    expect(calculateRemainingDistanceMeters(10000, 10000)).toBe(0);
  });

  it('allows distance goal percentages above 100 while capping visual progress', () => {
    expect(calculateYearlyDistanceGoalProgress(12500, 10000)).toEqual({
      loggedMeters: 12500,
      goalMeters: 10000,
      remainingMeters: 0,
      percent: 1.25,
      visualPercent: 1,
    });
  });

  it('calculates remaining default distance sessions', () => {
    expect(
      calculateRemainingDefaultDistanceSessions(5000, {
        defaultDistanceMeters: 1000,
        yearlyDistanceGoalMeters: 10000,
      }),
    ).toBe(5);
    expect(
      calculateRemainingDefaultDistanceSessions(9500, {
        defaultDistanceMeters: 1000,
        yearlyDistanceGoalMeters: 10000,
      }),
    ).toBe(1);
  });

  it('summarizes distance totals, averages, goals, and unknown records', () => {
    const checkIns = {
      '2026-01-01': { completed: true, distanceMeters: 5000 },
      '2026-01-02': { completed: true, distanceMeters: 3000 },
      '2026-01-03': true,
    } as const;

    expect(
      getDistanceHabitSummary(
        { defaultDistanceMeters: 1000, yearlyDistanceGoalMeters: 10000 },
        checkIns,
        ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'],
      ),
    ).toEqual({
      completedDays: 3,
      loggedDays: 2,
      unknownDistanceDays: 1,
      loggedMeters: 8000,
      averageMetersPerLoggedDay: 4000,
      goalMeters: 10000,
      progressPercent: 0.8,
      visualProgressPercent: 0.8,
      remainingMeters: 2000,
      remainingSessions: 2,
      goalReached: false,
    });
  });

  it('summarizes distance habits without yearly goals', () => {
    expect(
      getDistanceHabitSummary(
        { defaultDistanceMeters: 5000 },
        { '2026-01-01': { completed: true, distanceMeters: 5000 } },
        ['2026-01-01'],
      ),
    ).toEqual({
      completedDays: 1,
      loggedDays: 1,
      unknownDistanceDays: 0,
      loggedMeters: 5000,
      averageMetersPerLoggedDay: 5000,
      goalMeters: 0,
      progressPercent: 0,
      visualProgressPercent: 0,
      remainingMeters: 0,
      remainingSessions: 0,
      goalReached: false,
    });
  });
});
