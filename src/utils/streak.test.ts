import { describe, expect, it } from 'vitest';
import { calculateActivityStreak } from './streak';
import type { LocalDateKey } from '../state/types';

const today = new Date(2026, 5, 25);

const checkIns = (days: LocalDateKey[]) => ({
  'habit-1': Object.fromEntries(days.map((day) => [day, true as const])),
});

describe('calculateActivityStreak', () => {
  it('returns zero when there are no completed days', () => {
    expect(calculateActivityStreak({}, today)).toBe(0);
  });

  it('counts one completed day', () => {
    expect(calculateActivityStreak(checkIns(['2026-06-25']), today)).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    expect(
      calculateActivityStreak(
        checkIns(['2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25']),
        today,
      ),
    ).toBe(4);
  });

  it('breaks when a calendar day has no completed habits', () => {
    expect(
      calculateActivityStreak(checkIns(['2026-06-22', '2026-06-23', '2026-06-25']), today),
    ).toBe(1);
  });

  it('shows yesterday streak when today is not completed yet', () => {
    expect(
      calculateActivityStreak(checkIns(['2026-06-22', '2026-06-23', '2026-06-24']), today),
    ).toBe(3);
  });

  it('increases the streak when today is completed', () => {
    expect(
      calculateActivityStreak(checkIns(['2026-06-23', '2026-06-24', '2026-06-25']), today),
    ).toBe(3);
  });

  it('recalculates after historical edits', () => {
    const editedCheckIns = {
      'habit-1': {
        '2026-06-21': true,
        '2026-06-22': true,
        '2026-06-24': true,
        '2026-06-25': true,
      },
      'habit-2': {
        '2026-06-23': true,
      },
    } as const;

    expect(calculateActivityStreak(editedCheckIns, today)).toBe(5);
  });
});
