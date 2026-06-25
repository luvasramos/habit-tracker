import { describe, expect, it, vi } from 'vitest';
import { emptyState, habitReducer } from './habitReducer';
import type { HabitDraft } from './types';

const id = (value: string) => value as `${string}-${string}-${string}-${string}-${string}`;
const draft = (name: string): HabitDraft => ({
  name,
  color: 'blue',
  icon: { type: 'svg', name: 'fitness' },
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
    expect(unknownDuration.checkIns['habit-1']['2026-06-18']).toBe(true);
  });
});
