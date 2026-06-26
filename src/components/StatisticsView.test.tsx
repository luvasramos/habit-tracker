import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckInsByHabit, Habit, LocalDateKey } from '../state/types';
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
  onSetCheckIn,
  onEditTime,
}: {
  habit?: Habit;
  habits?: Habit[];
  checkIns?: CheckInsByHabit[string];
  allCheckIns?: CheckInsByHabit;
  selectedHabitId?: string | null;
  onEditHabit?: (habitId: string) => void;
  onSetCheckIn?: (
    habitId: string,
    dateKey: LocalDateKey,
    completed: boolean,
    durationMinutes?: number,
  ) => void;
  onEditTime?: (habitId: string, dateKey: LocalDateKey) => void;
} = {}) =>
  render(
    <StatisticsView
      habits={habits ?? [habit]}
      checkIns={allCheckIns ?? { [habit.id]: checkIns }}
      selectedHabitId={selectedHabitId ?? habit.id}
      onEditHabit={onEditHabit}
      onSetCheckIn={onSetCheckIn}
      onEditTime={onEditTime}
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

  it('renders a Monday-first Month statistics calendar with missed dates visible', () => {
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
    expect(screen.queryByRole('button', { name: 'Show no activity' })).not.toBeInTheDocument();
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
    expect(screen.getByRole('dialog', { name: 'June 25, 2026' })).toHaveTextContent('Japanese');
    expect(screen.getByRole('dialog', { name: 'June 25, 2026' })).toHaveTextContent('1h');
    expect(screen.getByRole('dialog', { name: 'June 25, 2026' })).toHaveTextContent('Gym');
  });

  it('shows compact All habits time goals and selects a focused habit from a row', () => {
    const habits = [
      makeHabit({ id: 'habit-1', name: 'Japanese', yearlyGoalMinutes: 180 }),
      makeHabit({
        id: 'habit-2',
        name: 'Painting',
        color: 'lavender',
        icon: { type: 'emoji', value: '🎨' },
        yearlyGoalMinutes: 300,
      }),
      makeHabit({
        id: 'habit-3',
        name: 'Walking',
        trackingMode: 'completion',
        icon: { type: 'svg', name: 'walking' },
      }),
    ];
    renderStats({
      habits,
      selectedHabitId: null,
      allCheckIns: {
        'habit-1': { '2026-06-25': { completed: true, durationMinutes: 60 } },
        'habit-2': { '2026-06-25': { completed: true, durationMinutes: 60 } },
        'habit-3': { '2026-06-25': true },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'All habits' }));
    const timeGoals = screen.getByLabelText('Time goals');
    expect(timeGoals).toHaveTextContent('Japanese');
    expect(timeGoals).toHaveTextContent('1h / 3h');
    expect(timeGoals).toHaveTextContent('33%');
    expect(timeGoals).toHaveTextContent('Painting');
    expect(timeGoals).not.toHaveTextContent('Walking');
    expect(timeGoals).not.toHaveTextContent('remaining');

    fireEvent.click(within(timeGoals).getByRole('button', { name: /Painting/ }));
    expect(screen.getByRole('button', { name: 'Painting' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Time goal')).toHaveTextContent('Painting');
  });

  it('opens and closes date details while restoring focus to the date cell', () => {
    renderStats();

    const missedDay = screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ });
    fireEvent.click(missedDay);
    expect(screen.getByRole('dialog', { name: 'June 23, 2026' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    vi.advanceTimersByTime(0);

    expect(screen.queryByRole('dialog', { name: 'June 23, 2026' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(missedDay);
  });

  it('closes date details when clicking outside', () => {
    renderStats();

    fireEvent.click(screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ }));
    expect(screen.getByRole('dialog', { name: 'June 23, 2026' })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('dialog', { name: 'June 23, 2026' })).not.toBeInTheDocument();
  });

  it('marks an individual habit complete and incomplete with immediate recalculation', () => {
    const habit = makeHabit({ yearlyGoalMinutes: 180 });

    const StatefulStats = () => {
      const [checkIns, setCheckIns] = useState<CheckInsByHabit>({
        [habit.id]: { '2026-06-25': { completed: true, durationMinutes: 60 } },
      });

      return (
        <StatisticsView
          habits={[habit]}
          checkIns={checkIns}
          selectedHabitId={habit.id}
          onSetCheckIn={(habitId, dateKey, completed) => {
            setCheckIns((current) => {
              const habitCheckIns = current[habitId] ?? {};
              const nextHabitCheckIns = { ...habitCheckIns };
              if (completed) {
                nextHabitCheckIns[dateKey] = { completed: true, durationMinutes: 60 };
              } else {
                delete nextHabitCheckIns[dateKey];
              }
              return { ...current, [habitId]: nextHabitCheckIns };
            });
          }}
        />
      );
    };

    render(<StatefulStats />);

    expect(screen.getByLabelText(/Days done/)).toHaveTextContent('1');
    const missedDay = screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ });
    fireEvent.click(missedDay);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));

    expect(screen.getByLabelText(/Days done/)).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese completed, 1h logged/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark incomplete' }));
    expect(screen.getByLabelText(/Days done/)).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Tuesday, June 23, 2026, Japanese not completed/ })).toBeInTheDocument();
  });

  it('offers Edit time for known and unknown duration completions', () => {
    const onEditTime = vi.fn();
    renderStats({
      checkIns: {
        '2026-06-24': true,
        '2026-06-25': { completed: true, durationMinutes: 60 },
      },
      onEditTime,
    });

    fireEvent.click(screen.getByRole('button', { name: /Wednesday, June 24, 2026, Japanese completed, no time recorded/ }));
    expect(screen.getByRole('dialog', { name: 'June 24, 2026' })).toHaveTextContent('No time recorded');
    fireEvent.click(screen.getByRole('button', { name: 'Edit time' }));
    expect(onEditTime).toHaveBeenCalledWith('habit-1', '2026-06-24');
  });

  it('lets All habits date details update individual rows', () => {
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
    const onSetCheckIn = vi.fn();
    renderStats({
      habits,
      selectedHabitId: null,
      allCheckIns: {
        'habit-1': { '2026-06-25': { completed: true, durationMinutes: 60 } },
        'habit-2': {},
      },
      onSetCheckIn,
    });

    fireEvent.click(screen.getByRole('button', { name: 'All habits' }));
    fireEvent.click(screen.getByRole('button', { name: /Thursday, June 25, 2026, active: Japanese, 1h/ }));
    const details = screen.getByRole('dialog', { name: 'June 25, 2026' });
    expect(details).toHaveTextContent('Japanese');
    expect(details).toHaveTextContent('Gym');

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onSetCheckIn).toHaveBeenCalledWith('habit-2', '2026-06-25', true);
  });
});
