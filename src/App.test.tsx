import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { HabitProvider } from './state/HabitProvider';
import { STORAGE_KEY } from './state/persistence';

const renderApp = () =>
  render(
    <HabitProvider>
      <App />
    </HabitProvider>,
  );

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

    expect(screen.getByRole('tab', { name: 'Gym' })).toHaveAttribute('aria-selected', 'true');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Gym');
  });

  it('validates duplicate habit names', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
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
    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Training');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('tab', { name: 'Training' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    await user.click(screen.getByRole('button', { name: 'Delete habit' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(screen.queryByRole('tab', { name: 'Training' })).not.toBeInTheDocument();
    expect(screen.getByText('Add a habit to start marking completed days.')).toBeInTheDocument();
  });

  it('toggles the same check-in across week and month views', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));

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
    expect(screen.getByText('No data selected.')).toBeInTheDocument();
  });

  it('shows a statistics empty state when there is no data', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Statistics' }));

    expect(screen.getByText('No completed days yet.')).toBeInTheDocument();
  });
});
