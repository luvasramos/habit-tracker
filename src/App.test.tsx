import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { saveDailyCheckInAnswer } from './data/dailyCheckInStore';
import { HabitProvider } from './state/HabitProvider';
import { STORAGE_KEY } from './state/persistence';
import { toLocalDateKey } from './utils/dates';

const renderApp = () =>
  render(
    <HabitProvider>
      <App />
    </HabitProvider>,
  );

const finishDailyCheckIn = async (user: ReturnType<typeof userEvent.setup>, answer: 'No' | 'Yes' = 'No') => {
  await user.click(screen.getByRole('button', { name: answer }));
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Daily check-in' })).not.toBeInTheDocument();
  }, { timeout: 2400 });
};

describe('Habit Grid app', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and selects a habit from the empty state', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('region', { name: 'Daily check-in' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Gym. Did you complete this today?' })).toBeInTheDocument();
    await finishDailyCheckIn(user);

    expect(screen.getByRole('tab', { name: 'Gym' })).toHaveAttribute('aria-selected', 'true');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Gym');
  });

  it('validates duplicate habit names', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);
    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.type(screen.getByLabelText('Name'), 'gym');

    expect(screen.getByText('A habit with this name already exists.')).toBeInTheDocument();
  });

  it('renames and deletes a habit with confirmation', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);
    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Training');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('tab', { name: 'Training' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    await user.click(screen.getByRole('button', { name: 'Delete habit' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(screen.queryByRole('tab', { name: 'Training' })).not.toBeInTheDocument();
    expect(screen.getByText('No habits yet')).toBeInTheDocument();
  });

  it('toggles the same check-in across week and month views', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);

    const checkInButton = screen
      .getAllByRole('button', { name: /Gym, .*not completed/ })
      .find((button) => !button.hasAttribute('disabled'));
    expect(checkInButton).toBeDefined();
    await user.click(checkInButton!);
    expect(checkInButton).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.completion-dot')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Month' }));
    expect(screen.getByText(/1 completed days in/)).toBeInTheDocument();
  });

  it('shows statistics counts for completed habits', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);

    const checkInButton = screen
      .getAllByRole('button', { name: /Gym, .*not completed/ })
      .find((button) => !button.hasAttribute('disabled'));
    expect(checkInButton).toBeDefined();
    await user.click(checkInButton!);

    await user.click(screen.getByRole('button', { name: 'Statistics' }));

    expect(screen.getByLabelText(/1 completion day and \d+ inactive days/)).toBeInTheDocument();
    expect(screen.getByLabelText('Gym, 1 completion')).toBeInTheDocument();
    expect(screen.getByLabelText(/No activity, \d+ days/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No activity' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Year' }));
    expect(screen.getByLabelText('Yearly activity overview')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gym' }));
    expect(screen.getByLabelText(/No activity, \d+ days/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'No activity' }));
    expect(screen.getByText('No data selected')).toBeInTheDocument();
  });

  it('shows a statistics empty state when there is no data', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Statistics' }));

    expect(screen.getByText('No statistics yet')).toBeInTheDocument();
  });

  it('logs the default duration from the daily check-in flow', async () => {
    const user = userEvent.setup();
    const todayKey = toLocalDateKey(new Date());
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Study Japanese');
    await user.click(screen.getByRole('button', { name: 'Completion + time' }));
    await user.type(screen.getByLabelText('Default session'), '1h');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('group', { name: 'Study Japanese. Did you complete this today?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('1h logged')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Daily check-in' })).not.toBeInTheDocument();
    }, { timeout: 2400 });

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const habitId = state.habits[0].id;
    expect(state.checkIns[habitId][todayKey]).toEqual({
      completed: true,
      durationMinutes: 60,
    });
    expect(Object.keys(state.checkIns[habitId])).toEqual([todayKey]);
  });

  it('logs the default duration from the Today remaining popover', async () => {
    const user = userEvent.setup();
    const todayKey = toLocalDateKey(new Date());
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          {
            id: 'habit-1',
            name: 'Study Japanese',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'blue',
            icon: { type: 'svg', name: 'language' },
            trackingMode: 'duration',
            defaultDurationMinutes: 45,
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );
    saveDailyCheckInAnswer(todayKey, 'habit-1', 'no');
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Today remaining: 1' }));
    await user.click(screen.getByRole('button', { name: 'Mark Study Japanese complete today' }));

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.checkIns['habit-1'][todayKey]).toEqual({
      completed: true,
      durationMinutes: 45,
    });
    expect(screen.getByRole('button', { name: 'Today remaining: 0' })).toBeInTheDocument();
  });
});
