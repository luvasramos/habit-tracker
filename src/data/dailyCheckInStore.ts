import type { LocalDateKey } from '../state/types';

export type DailyCheckInAnswer = 'yes' | 'no';

type DailyCheckInState = {
  version: 1;
  dates: Record<LocalDateKey, Record<string, DailyCheckInAnswer>>;
};

export const DAILY_CHECKIN_KEY = 'habit-grid:daily-checkin:v1';

const emptyDailyCheckInState = (): DailyCheckInState => ({
  version: 1,
  dates: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAnswer = (value: unknown): value is DailyCheckInAnswer =>
  value === 'yes' || value === 'no';

const isDailyCheckInState = (value: unknown): value is DailyCheckInState =>
  isRecord(value) &&
  value.version === 1 &&
  isRecord(value.dates) &&
  Object.values(value.dates).every(
    (answers) => isRecord(answers) && Object.values(answers).every(isAnswer),
  );

export const loadDailyCheckInAnswers = (
  dateKey: LocalDateKey,
  storage: Storage = window.localStorage,
) => {
  const raw = storage.getItem(DAILY_CHECKIN_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isDailyCheckInState(parsed) ? parsed.dates[dateKey] ?? {} : {};
  } catch {
    return {};
  }
};

export const saveDailyCheckInAnswer = (
  dateKey: LocalDateKey,
  habitId: string,
  answer: DailyCheckInAnswer,
  storage: Storage = window.localStorage,
) => {
  let state = emptyDailyCheckInState();
  const raw = storage.getItem(DAILY_CHECKIN_KEY);

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      state = isDailyCheckInState(parsed) ? parsed : emptyDailyCheckInState();
    } catch {
      state = emptyDailyCheckInState();
    }
  }

  storage.setItem(
    DAILY_CHECKIN_KEY,
    JSON.stringify({
      version: 1,
      dates: {
        ...state.dates,
        [dateKey]: {
          ...(state.dates[dateKey] ?? {}),
          [habitId]: answer,
        },
      },
    }),
  );
};
