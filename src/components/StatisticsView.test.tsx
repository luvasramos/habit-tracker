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
  habits,
  checkIns = {},
  allCheckIns,
  selectedHabitId,
  onEditHabit = vi.fn(),
}: {
  habit?: Habit;
  habits?: Habit[];
  checkIns?: CheckInsByHabit[string];
  allCheckIns?: CheckInsByHabit;
  selectedHabitId?: string | null;
  onEditHabit?: (habitId: string) => void;
} = {}) =>
  render(
    <StatisticsView
      habits={habits ?? [habit]}
      checkIns={allCheckIns ?? { [habit.id]: checkIns }}
      selectedHabitId={selectedHabitId ?? habit.id}
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

  it('renders a seven-day Week statistics calendar with duration and unavailable states', () => {
    renderStats({
      checkIns: {
        '2026-06-24': true,
        '2026-06-25': { completed: true, durationMinutes: 60 },
      },
    });

    expect(screen.getByLabelText('Weekly statistics calendar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wednesday, June 24, 2026, Japanese completed, no time recorded/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thursday, June 25, 2026, Japanese completed, 1h logged/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Friday, June 26, 2026, future date/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('renders a Monday-first Month statistics calendar and respects Show no activity', () => {
    renderStats({
      habit: makeHabit({ createdAt: '2026-06-10' }),
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 60 } },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Month' }));

    const calendar = screen.getByLabelText('Monthly statistics calendar');
    expect(calendar).toBeInTheDocument();
    expect(screen.getByLabelText('June 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wednesday, July 1, 2026, future date/ })).toHaveClass('is-outside');
    expect(screen.getByRole('button', { name: /Tuesday, June 9, 2026, before Japanese was created/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ })).toHaveClass('is-missed-visible');

    fireEvent.click(screen.getByRole('button', { name: 'Show no activity' }));
    expect(screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ })).not.toHaveClass('is-missed-visible');
  });

  it('renders the Year statistics calendar as twelve mini-months', () => {
    renderStats({
      checkIns: { '2026-06-25': { completed: true, durationMinutes: 60 } },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Year' }));

    expect(screen.getByLabelText('Yearly statistics calendar')).toBeInTheDocument();
    expect(screen.getByLabelText('Yearly activity overview')).toBeInTheDocument();
    expect(screen.getByLabelText('January')).toBeInTheDocument();
    expect(screen.getByLabelText('December')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thursday, June 25, 2026, Japanese completed, 1h logged/ })).toBeInTheDocument();
  });

  it('shows All habits indicators and date details without treating no activity as a habit', () => {
    const habits = [
      makeHabit({ id: 'habit-1', name: 'Japanese', yearlyGoalMinutes: 180 }),
      makeHabit({
        id: 'habit-2',
        name: 'Gym',
        color: 'green',
        icon: { type: 'svg', name: 'fitness' },
        trackingMode: 'completion',
      }),
    ];
    renderStats({
      habits,
      selectedHabitId: null,
      allCheckIns: {
        'habit-1': { '2026-06-25': { completed: true, durationMinutes: 60 } },
        'habit-2': { '2026-06-25': true },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'All habits' }));
    const activeDay = screen.getByRole('button', { name: /Thursday, June 25, 2026, active: Japanese, 1h, Gym/ });
    expect(activeDay.querySelectorAll('.stats-date-cell__dot')).toHaveLength(2);

    fireEvent.click(activeDay);
    expect(screen.getByLabelText('Selected date details')).toHaveTextContent('Japanese, 1h');
    expect(screen.getByLabelText('Selected date details')).toHaveTextContent('Gym');
  });
});
