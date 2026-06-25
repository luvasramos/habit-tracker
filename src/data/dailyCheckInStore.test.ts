import { describe, expect, it } from 'vitest';
import {
  DAILY_CHECKIN_KEY,
  loadDailyCheckInAnswers,
  saveDailyCheckInAnswer,
} from './dailyCheckInStore';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  } as Storage;
};

describe('daily check-in store', () => {
  it('stores yes and no answers separately from habit check-ins', () => {
    const storage = createStorage();

    saveDailyCheckInAnswer('2026-06-25', 'habit-1', 'no', storage);
    saveDailyCheckInAnswer('2026-06-25', 'habit-2', 'yes', storage);

    expect(loadDailyCheckInAnswers('2026-06-25', storage)).toEqual({
      'habit-1': 'no',
      'habit-2': 'yes',
    });
    expect(storage.getItem(DAILY_CHECKIN_KEY)).toContain('2026-06-25');
  });

  it('falls back to empty answers for invalid stored data', () => {
    const storage = createStorage();
    storage.setItem(DAILY_CHECKIN_KEY, JSON.stringify({ version: 1, dates: { bad: [] } }));

    expect(loadDailyCheckInAnswers('2026-06-25', storage)).toEqual({});
  });
});
