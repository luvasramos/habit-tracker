import { describe, expect, it, vi } from 'vitest';
import { emptyState, habitReducer } from './habitReducer';
import type { HabitDraft } from './types';

const id = (value: string) => value as `${string}-${string}-${string}-${string}-${string}`;
const draft = (name: string): HabitDraft => ({
  name,
  color: 'blue',
  icon: { type: 'svg', name: 'fitness' },
});
const durationDraft = (name: string, defaultDurationMinutes = 60): HabitDraft => ({
  ...draft(name),
  trackingMode: 'duration',
  defaultDurationMinutes,
});
const migratedState = () => ({
  ...emptyState(),
  habits: [
    {
      id: 'habit-1',
      name: 'Study Japanese',
      createdAt: '2026-01-01T00:00:00.000Z',
      trackingMode: 'completion' as const,
      color: 'blue' as const,
      icon: { type: 'svg' as const, name: 'language' as const },
    },
  ],
  checkIns: {
    'habit-1': {
      '2026-06-20': true as const,
      '2026-06-21': { completed: true as const, durationMinutes: 30 },
      '2026-06-25': true as const,
    },
  },
  selectedHabitId: 'habit-1',
});

describe('habitReducer', () => {
  it('adds and selects a habit', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const state = habitReducer(emptyState(), { type: 'addHabit', habit: draft(' Gym ') });

    expect(state.habits).toEqual([
      expect.objectContaining({
        id: 'habit-1',
        name: 'Gym',
        color: 'blue',
        icon: { type: 'svg', name: 'fitness' },
        trackingMode: 'completion',
      }),
    ]);
    expect(state.selectedHabitId).toBe('habit-1');
    expect(state.checkIns['habit-1']).toEqual({});
  });

  it('prevents duplicate habit names', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce(id('habit-1'))
      .mockReturnValueOnce(id('habit-2'));
    const first = habitReducer(emptyState(), { type: 'addHabit', habit: draft('Gym') });
    const second = habitReducer(first, { type: 'addHabit', habit: draft('gym') });

    expect(second.habits).toHaveLength(1);
  });

  it('renames without losing check-ins', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), { type: 'addHabit', habit: draft('Gym') });
    const checked = habitReducer(added, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });
    const renamed = habitReducer(checked, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: { ...draft('Training'), color: 'green', icon: { type: 'svg', name: 'health' } },
    });

    expect(renamed.habits[0].name).toBe('Training');
    expect(renamed.habits[0].color).toBe('green');
    expect(renamed.habits[0].icon).toEqual({ type: 'svg', name: 'health' });
    expect(renamed.checkIns['habit-1']['2026-06-17']).toBe(true);
  });

  it('toggles check-ins and deletes habit data', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), { type: 'addHabit', habit: draft('Gym') });
    const checked = habitReducer(added, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });
    const unchecked = habitReducer(checked, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });
    const deleted = habitReducer(checked, { type: 'deleteHabit', habitId: 'habit-1' });

    expect(unchecked.checkIns['habit-1']).toEqual({});
    expect(deleted.habits).toEqual([]);
    expect(deleted.checkIns['habit-1']).toBeUndefined();
    expect(deleted.selectedHabitId).toBeNull();
  });

  it('adds duration habits without changing completion-only defaults', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce(id('habit-1'))
      .mockReturnValueOnce(id('habit-2'));

    const completion = habitReducer(emptyState(), { type: 'addHabit', habit: draft('Gym') });
    const duration = habitReducer(completion, {
      type: 'addHabit',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      },
    });

    expect(duration.habits[0]).toEqual(
      expect.objectContaining({
        name: 'Gym',
        trackingMode: 'completion',
      }),
    );
    expect(duration.habits[1]).toEqual(
      expect.objectContaining({
        name: 'Study Japanese',
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      }),
    );
  });

  it('stores known duration check-ins and preserves unknown duration check-ins', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      },
    });

    const knownDuration = habitReducer(added, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
      completed: true,
      durationMinutes: 60,
    });
    const unknownDuration = habitReducer(knownDuration, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-18',
      completed: true,
    });

    expect(unknownDuration.checkIns['habit-1']['2026-06-17']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
    expect(unknownDuration.checkIns['habit-1']['2026-06-18']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
  });

  it('automatically logs the default duration when completing a duration habit', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: durationDraft('Study Japanese', 45),
    });
    const checked = habitReducer(added, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });

    expect(checked.checkIns['habit-1']['2026-06-17']).toEqual({
      completed: true,
      durationMinutes: 45,
    });
  });

  it('keeps completion-only habit check-ins as completion entries', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), { type: 'addHabit', habit: draft('Gym') });
    const checked = habitReducer(added, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });

    expect(checked.checkIns['habit-1']['2026-06-17']).toBe(true);
  });

  it('replaces an existing duration when editing time', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: durationDraft('Study Japanese'),
    });
    const checked = habitReducer(added, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
      completed: true,
      durationMinutes: 60,
    });
    const edited = habitReducer(checked, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
      completed: true,
      durationMinutes: 90,
    });

    expect(edited.checkIns['habit-1']['2026-06-17']).toEqual({
      completed: true,
      durationMinutes: 90,
    });
  });

  it('adds duration to a completed historical day with unknown duration', () => {
    const state = {
      ...emptyState(),
      habits: [
        {
          id: 'habit-1',
          name: 'Study Japanese',
          createdAt: '2026-01-01T00:00:00.000Z',
          trackingMode: 'duration' as const,
          defaultDurationMinutes: 60,
        },
      ],
      checkIns: { 'habit-1': { '2026-06-17': true as const } },
      selectedHabitId: 'habit-1',
    };
    const edited = habitReducer(state, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
      completed: true,
      durationMinutes: 30,
    });

    expect(edited.checkIns['habit-1']['2026-06-17']).toEqual({
      completed: true,
      durationMinutes: 30,
    });
  });

  it('unchecking clears duration for that date', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: durationDraft('Study Japanese'),
    });
    const checked = habitReducer(added, {
      type: 'setCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
      completed: true,
      durationMinutes: 60,
    });
    const unchecked = habitReducer(checked, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });

    expect(unchecked.checkIns['habit-1']).toEqual({});
  });

  it('clears duration settings when a habit changes back to completion only', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      },
    });
    const renamed = habitReducer(added, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'completion',
      },
    });

    expect(renamed.habits[0]).toEqual(
      expect.objectContaining({
        trackingMode: 'completion',
        defaultDurationMinutes: undefined,
        yearlyGoalMinutes: undefined,
      }),
    );
  });

  it('allows clearing an optional yearly goal from a duration habit', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), {
      type: 'addHabit',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'duration',
        defaultDurationMinutes: 60,
        yearlyGoalMinutes: 9000,
      },
    });
    const updated = habitReducer(added, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: {
        ...draft('Study Japanese'),
        trackingMode: 'duration',
        defaultDurationMinutes: 45,
        yearlyGoalMinutes: undefined,
      },
    });

    expect(updated.habits[0]).toEqual(
      expect.objectContaining({
        trackingMode: 'duration',
        defaultDurationMinutes: 45,
        yearlyGoalMinutes: undefined,
      }),
    );
  });

  it('keeps past time empty when duration migration is not applied', () => {
    const updated = habitReducer(migratedState(), {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: durationDraft('Study Japanese', 60),
      options: { historicalDurationMigration: 'keep-empty', todayKey: '2026-06-25' },
    });

    expect(updated.habits[0].trackingMode).toBe('duration');
    expect(updated.checkIns['habit-1']['2026-06-20']).toBe(true);
  });

  it('applies default duration only to past completed days with missing duration', () => {
    const updated = habitReducer(migratedState(), {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: durationDraft('Study Japanese', 60),
      options: { historicalDurationMigration: 'apply-default', todayKey: '2026-06-25' },
    });

    expect(updated.checkIns['habit-1']['2026-06-20']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
    expect(updated.checkIns['habit-1']['2026-06-21']).toEqual({
      completed: true,
      durationMinutes: 30,
    });
    expect(updated.checkIns['habit-1']['2026-06-25']).toBe(true);
    expect(updated.checkIns['habit-1']['2026-06-22']).toBeUndefined();
  });

  it('changing default duration later does not rewrite logged time', () => {
    const state = {
      ...migratedState(),
      habits: [
        {
          ...migratedState().habits[0],
          trackingMode: 'duration' as const,
          defaultDurationMinutes: 60,
        },
      ],
      checkIns: {
        'habit-1': {
          '2026-06-20': { completed: true as const, durationMinutes: 60 },
        },
      },
    };
    const updated = habitReducer(state, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: durationDraft('Study Japanese', 90),
    });

    expect(updated.habits[0].defaultDurationMinutes).toBe(90);
    expect(updated.checkIns['habit-1']['2026-06-20']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
  });

  it('switching tracking modes does not lose logged duration data', () => {
    const state = {
      ...migratedState(),
      habits: [
        {
          ...migratedState().habits[0],
          trackingMode: 'duration' as const,
          defaultDurationMinutes: 60,
        },
      ],
      checkIns: {
        'habit-1': {
          '2026-06-20': { completed: true as const, durationMinutes: 60 },
        },
      },
    };
    const completionOnly = habitReducer(state, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: { ...draft('Study Japanese'), trackingMode: 'completion' },
    });
    const durationAgain = habitReducer(completionOnly, {
      type: 'renameHabit',
      habitId: 'habit-1',
      habit: durationDraft('Study Japanese', 45),
    });

    expect(completionOnly.checkIns['habit-1']['2026-06-20']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
    expect(durationAgain.checkIns['habit-1']['2026-06-20']).toEqual({
      completed: true,
      durationMinutes: 60,
    });
  });
});
