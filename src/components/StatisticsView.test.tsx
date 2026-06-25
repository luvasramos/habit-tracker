import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckInsByHabit, Habit } from '../state/types';
import { StatisticsView } from './StatisticsView';

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Japanese',
  createdAt: '2026-01-01',
  color: 'blue',
  icon: { type: 'svg', name: 'language' },
  trackingMode: 'duration',
  defaultDurationMinutes: 60,
  ...overrides,
});

const renderStats = ({
  habit = makeHabit({ yearlyGoalMinutes: 180 }),
  checkIns = {},
  onEditHabit = vi.fn(),
}: {
  habit?: Habit;
  checkIns?: CheckInsByHabit[string];
  onEditHabit?: (habitId: string) => void;
} = {}) =>
  render(
    <StatisticsView
      habits={[habit]}
      checkIns={{ [habit.id]: checkIns }}
      selectedHabitId={habit.id}
      onEditHabit={onEditHabit}
    />,
  );

describe('StatisticsView time goal card', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 25));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a compact no-goal time summary with an add goal action', () => {
    const onEditHabit = vi.fn();
    renderStats({
      habit: makeHabit({ yearlyGoalMinutes: undefined }),
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 60 } },
      onEditHabit,
    });

    expect(screen.getByLabelText('Time summary')).toBeInTheDocument();
    expect(screen.getByText('1h logged in 2026')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add yearly goal' }));
    expect(onEditHabit).toHaveBeenCalledWith('habit-1');
  });

  it('shows zero progress for an active goal with no logged time', () => {
    renderStats();

    expect(screen.getByText('0m / 3h')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows partial progress, remaining time, and remaining sessions', () => {
    renderStats({
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 60 } },
    });

    expect(screen.getByText('This week: 1h')).toBeInTheDocument();
    expect(screen.getByText('Year total')).toBeInTheDocument();
    expect(screen.getByText('1h / 3h')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByText('2h remaining')).toBeInTheDocument();
    expect(screen.getByText('Approximately 2 sessions at 1h each')).toBeInTheDocument();
  });

  it('shows a reached goal at exactly 100 percent', () => {
    renderStats({
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 180 } },
    });

    expect(screen.getByText('3h / 3h')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Goal reached')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('allows exceeded goal text while keeping the progress bar full', () => {
    renderStats({
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 240 } },
    });

    expect(screen.getByText('4h / 3h')).toBeInTheDocument();
    expect(screen.getByText('133%')).toBeInTheDocument();
    expect(screen.getByText('Goal reached')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows missing duration quietly', () => {
    renderStats({
      checkIns: {
        '2026-06-24': true,
        '2026-06-25': { completed: true, durationMinutes: 60 },
      },
    });

    expect(screen.getByText('1 completed day has no time recorded')).toBeInTheDocument();
  });

  it('shows month contribution without changing the yearly goal', () => {
    renderStats({
      habit: makeHabit({ yearlyGoalMinutes: 360 }),
      checkIns: {
        '2026-05-01': { completed: true, durationMinutes: 60 },
        '2026-06-01': { completed: true, durationMinutes: 60 },
        '2026-06-25': { completed: true, durationMinutes: 60 },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Month' }));

    expect(screen.getByText('This month: 2h')).toBeInTheDocument();
    expect(screen.getByText('3h / 6h')).toBeInTheDocument();
  });

  it('shows year total without a fake period contribution in Year view', () => {
    renderStats({
      habit: makeHabit({ yearlyGoalMinutes: 360 }),
      checkIns: {
        '2026-05-01': { completed: true, durationMinutes: 60 },
        '2026-06-01': { completed: true, durationMinutes: 60 },
        '2026-06-25': { completed: true, durationMinutes: 60 },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Year' }));

    expect(screen.queryByText(/This week|This month/)).not.toBeInTheDocument();
    expect(screen.getByText('3h / 6h')).toBeInTheDocument();
  });
});
