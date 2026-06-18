import { describe, expect, it, vi } from 'vitest';
import { emptyState, habitReducer } from './habitReducer';

const id = (value: string) => value as `${string}-${string}-${string}-${string}-${string}`;

describe('habitReducer', () => {
  it('adds and selects a habit', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const state = habitReducer(emptyState(), { type: 'addHabit', name: ' Gym ' });

    expect(state.habits).toEqual([
      expect.objectContaining({ id: 'habit-1', name: 'Gym' }),
    ]);
    expect(state.selectedHabitId).toBe('habit-1');
    expect(state.checkIns['habit-1']).toEqual({});
  });

  it('prevents duplicate habit names', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce(id('habit-1'))
      .mockReturnValueOnce(id('habit-2'));
    const first = habitReducer(emptyState(), { type: 'addHabit', name: 'Gym' });
    const second = habitReducer(first, { type: 'addHabit', name: 'gym' });

    expect(second.habits).toHaveLength(1);
  });

  it('renames without losing check-ins', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), { type: 'addHabit', name: 'Gym' });
    const checked = habitReducer(added, {
      type: 'toggleCheckIn',
      habitId: 'habit-1',
      dateKey: '2026-06-17',
    });
    const renamed = habitReducer(checked, {
      type: 'renameHabit',
      habitId: 'habit-1',
      name: 'Training',
    });

    expect(renamed.habits[0].name).toBe('Training');
    expect(renamed.checkIns['habit-1']['2026-06-17']).toBe(true);
  });

  it('toggles check-ins and deletes habit data', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id('habit-1'));
    const added = habitReducer(emptyState(), { type: 'addHabit', name: 'Gym' });
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
});
