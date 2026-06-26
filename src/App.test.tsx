import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('adds and selects a habit from the empty state', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole('heading', { name: 'Habits' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).not.toHaveTextContent('Add habit');

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(window.location.hash).toBe('#/habits/new');
    expect(screen.getByRole('heading', { name: 'Add habit' })).toBeInTheDocument();
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

  it('applies and normalizes a custom habit color', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Reading');
    await user.click(screen.getByRole('radio', { name: 'Use #98FC00' }));
    await user.click(screen.getByRole('button', { name: 'Custom color' }));

    expect(screen.getByLabelText('Custom color panel')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Hex'));
    await user.type(screen.getByLabelText('Hex'), 'nope');

    expect(screen.getByText('Use a valid 3- or 6-digit hex color.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Hex'));
    await user.type(screen.getByLabelText('Hex'), '#AbC');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByLabelText('Custom color panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Current custom color #AABBCC' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].color).toBe('#AABBCC');
    await finishDailyCheckIn(user);
  });

  it('saves a neon preset color from the full-page editor', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.type(screen.getByLabelText('Name'), 'Reading');
    await user.click(screen.getByRole('radio', { name: 'Use #98FC00' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].color).toBe('neonLime');
    await finishDailyCheckIn(user);
  });

  it('keeps the habit editor controls compact and non-duplicated', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));

    const editor = screen.getByRole('region', { name: 'Add habit' });
    const colorGrid = screen.getByLabelText('Recommended colors');
    expect(within(colorGrid).getAllByRole('radio')).toHaveLength(6);
    expect(within(colorGrid).getByRole('radio', { name: 'Use #98FC00' })).toBeInTheDocument();
    expect(within(colorGrid).getAllByRole('radio').every((button) => button.classList.contains('recommendation-option'))).toBe(true);
    expect(within(colorGrid).getByRole('radio', { name: 'Use #98FC00' })).toHaveAttribute('aria-checked');
    expect(screen.queryByRole('button', { name: 'Suggested' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Health' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Search icons')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to habits' })).toHaveClass('habit-editor-back');
    expect(screen.getByRole('heading', { name: 'Add habit' }).closest('.habit-editor-header')).not.toHaveClass('is-sticky');
    expect(editor.querySelector('.habit-editor-actions')).toHaveAttribute('data-mode', 'add');
    expect(editor.querySelector('.habit-editor-actions__right')).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
    expect(editor.querySelector('.habit-editor-actions__right')).toContainElement(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('button', { name: 'Delete habit' })).not.toBeInTheDocument();
  });

  it('searches icons inline and selects an Iconify icon', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ icons: ['tabler:star', 'tabler:language'] }),
    } as Response);
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.type(screen.getByLabelText('Name'), 'Icons');
    expect(screen.getByLabelText('Icon picker')).toBeInTheDocument();
    expect(screen.getByText('Suggested icons')).toBeInTheDocument();
    const suggestedIcons = screen.getByText('Suggested icons').parentElement;
    expect(suggestedIcons?.querySelectorAll('.icon-choice')).toHaveLength(6);
    await user.type(screen.getByLabelText('Search icons'), 'star');
    await waitFor(() => expect(window.fetch).toHaveBeenCalled());
    expect(screen.getByText('Search results')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'star' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].icon).toEqual({ type: 'iconify', id: 'tabler:star' });
    expect(JSON.parse(localStorage.getItem('habit-grid:recent-icons') ?? '[]')).toContain('tabler:star');
    await finishDailyCheckIn(user);
  });

  it('shows built-in icon fallback when Iconify search fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('offline'));
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.type(screen.getByLabelText('Search icons'), 'unknown');

    expect(await screen.findByText('Icon search failed. Showing built-in icons.')).toBeInTheDocument();
    expect(screen.getByLabelText('Built-in fallback icons')).toBeInTheDocument();
  });

  it('searches emoji inline, selects emoji, and caches it', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.type(screen.getByLabelText('Name'), 'Japan');
    await user.click(screen.getByRole('button', { name: 'Emoji' }));
    expect(screen.queryByLabelText('Browse all emoji')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Emoji picker')).toBeInTheDocument();
    const suggestedEmoji = screen.getByLabelText('Suggested emoji');
    expect(within(suggestedEmoji).getAllByRole('button')).toHaveLength(6);
    ['Star', 'Flame', 'Check', 'Running', 'Books', 'Strength'].forEach((name) => {
      expect(within(suggestedEmoji).getByRole('button', { name })).toBeInTheDocument();
    });
    expect(within(suggestedEmoji).queryByRole('button', { name: 'Japan flag' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Search emoji'), 'japan');
    expect(screen.queryByLabelText('Suggested emoji')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Japan flag' }));
    expect(screen.getByLabelText('Selected emoji')).toHaveTextContent('🇯🇵');
    expect(screen.queryByLabelText('Browse all emoji')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].icon).toEqual({ type: 'emoji', value: '🇯🇵' });
    expect(JSON.parse(localStorage.getItem('habit-grid:recent-emoji') ?? '[]')).toContain('🇯🇵');
    await finishDailyCheckIn(user);
  });

  it('shows recent emoji before fallback emoji suggestions', async () => {
    const user = userEvent.setup();
    localStorage.setItem('habit-grid:recent-emoji', JSON.stringify(['🇯🇵', '🔥']));
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    await user.click(screen.getByRole('button', { name: 'Emoji' }));

    const recentEmoji = screen.getByLabelText('Recent emoji');
    const buttons = within(recentEmoji).getAllByRole('button');
    expect(buttons).toHaveLength(6);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Japan flag',
      'Flame',
      'Star',
      'Check',
      'Running',
      'Books',
    ]);
  });

  it('cancels custom color changes without changing the selected color', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Reading');
    await user.click(screen.getByRole('button', { name: 'Custom color' }));
    const customColorPanel = screen.getByLabelText('Custom color panel');
    await user.clear(screen.getByLabelText('Hex'));
    await user.type(screen.getByLabelText('Hex'), '#123456');
    await user.click(within(customColorPanel).getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].color).toBe('neonCream');
    await finishDailyCheckIn(user);
  });

  it('loads an existing custom color while editing a habit', async () => {
    const user = userEvent.setup();
    const todayKey = toLocalDateKey(new Date());
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          {
            id: 'habit-1',
            name: 'Reading',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: '#112233',
            icon: { type: 'svg', name: 'book' },
            trackingMode: 'completion',
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );
    saveDailyCheckInAnswer(todayKey, 'habit-1', 'no');
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    expect(window.location.hash).toBe('#/habits/habit-1/edit');
    expect(screen.getByRole('heading', { name: 'Edit habit' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Current custom color #112233' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Custom color' }));
    expect(screen.getByLabelText('Hex')).toHaveValue('#112233');
  });

  it('opens the edit page from a direct hash route', () => {
    const todayKey = toLocalDateKey(new Date());
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        habits: [
          {
            id: 'habit-1',
            name: 'Reading',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: '#112233',
            icon: { type: 'svg', name: 'book' },
            trackingMode: 'completion',
          },
        ],
        checkIns: { 'habit-1': {} },
        selectedHabitId: 'habit-1',
      }),
    );
    saveDailyCheckInAnswer(todayKey, 'habit-1', 'no');
    window.history.replaceState(null, '', '/#/habits/habit-1/edit');

    renderApp();

    expect(screen.getByRole('heading', { name: 'Edit habit' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Reading');
  });

  it('opens the add page from a direct hash route', () => {
    window.history.replaceState(null, '', '/#/habits/new');

    renderApp();

    expect(screen.getByRole('heading', { name: 'Add habit' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('returns from the editor with the Back action and browser back button', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(screen.getByRole('heading', { name: 'Add habit' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to habits' }));
    expect(screen.getByRole('heading', { name: 'Habits' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add habit' }));
    window.history.back();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Habits' })).toBeInTheDocument();
    });
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
    expect(screen.getByText('Delete Training? This will remove the habit and delete its check-in history.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toHaveClass('button--danger');
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(screen.queryByRole('tab', { name: 'Training' })).not.toBeInTheDocument();
    expect(screen.getByText('No habits yet')).toBeInTheDocument();
  });

  it('places edit footer actions on destructive and save sides', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);
    await user.click(screen.getByRole('button', { name: 'Edit habit' }));

    const editor = screen.getByRole('region', { name: 'Edit habit' });
    const actions = editor.querySelector('.habit-editor-actions');
    const left = editor.querySelector('.habit-editor-actions__left');
    const right = editor.querySelector('.habit-editor-actions__right');

    expect(actions).toHaveAttribute('data-mode', 'edit');
    expect(left).toContainElement(screen.getByRole('button', { name: 'Delete habit' }));
    expect(right).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
    expect(right).toContainElement(screen.getByRole('button', { name: 'Save' }));
  });

  it('toggles the same check-in across week and month views', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole('button', { name: 'Add habit' })[0]);
    await user.type(screen.getByLabelText('Name'), 'Gym');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await finishDailyCheckIn(user);

    const checkInButton = document.querySelector<HTMLButtonElement>(`[data-date-key="${toLocalDateKey(new Date())}"]`);
    expect(checkInButton).toBeInTheDocument();
    await user.click(checkInButton!);
    expect(checkInButton).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.completion-dot')).toBeInTheDocument();
    expect(document.querySelector('.date-button.is-complete')).toHaveAttribute(
      'style',
      expect.stringContaining('--habit-color'),
    );

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

    const checkInButton = document.querySelector<HTMLButtonElement>(`[data-date-key="${toLocalDateKey(new Date())}"]`);
    expect(checkInButton).toBeInTheDocument();
    await user.click(checkInButton!);

    await user.click(screen.getByRole('button', { name: 'Statistics' }));

    expect(screen.queryByRole('img', { name: /active day/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Days done: Eligible days/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Days missed: Eligible elapsed days/)).toBeInTheDocument();
    expect(screen.getAllByText('Consistency').length).toBeGreaterThan(0);
    expect(screen.queryByText('Completion rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Habit completions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show no activity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'No activity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Habit list' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Year' }));
    expect(screen.getByLabelText('Yearly activity overview')).toBeInTheDocument();

    expect(screen.getByLabelText(/Days missed: Eligible elapsed days/)).toBeInTheDocument();
  });

  it('shows a statistics empty state when there is no data', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Statistics' }));

    expect(screen.getByText('No habits to analyze yet.')).toBeInTheDocument();
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
    expect(screen.getByText('1 habit completed')).toBeInTheDocument();
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
    expect(screen.getByText('1h')).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: '1 habits remaining today' }));
    await user.click(screen.getByRole('button', { name: 'Mark Study Japanese complete today' }));

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.checkIns['habit-1'][todayKey]).toEqual({
      completed: true,
      durationMinutes: 45,
    });
    expect(screen.getByRole('button', { name: '0 habits remaining today' })).toBeInTheDocument();
  });

  it('returns to the habit editor when historical time migration is cancelled', async () => {
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
            trackingMode: 'completion',
          },
        ],
        checkIns: { 'habit-1': { '2026-06-20': true } },
        selectedHabitId: 'habit-1',
      }),
    );
    saveDailyCheckInAnswer(todayKey, 'habit-1', 'no');
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));
    await user.click(screen.getByRole('button', { name: 'Completion + time' }));
    await user.type(screen.getByLabelText('Default session'), '1h');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Past completed days')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cancel Return to the habit editor/ }));

    expect(screen.queryByText('Past completed days')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Completion + time' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(state.habits[0].trackingMode).toBe('completion');
    expect(state.checkIns['habit-1']['2026-06-20']).toBe(true);
  });

  it('shows duration goal statistics for selected duration habits', async () => {
    const user = userEvent.setup();
    const todayKey = toLocalDateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toLocalDateKey(yesterday);
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
            defaultDurationMinutes: 60,
            yearlyGoalMinutes: 180,
          },
          {
            id: 'habit-2',
            name: 'Piano',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'green',
            icon: { type: 'svg', name: 'music' },
            trackingMode: 'duration',
            defaultDurationMinutes: 30,
          },
          {
            id: 'habit-3',
            name: 'Gym',
            createdAt: '2026-01-01T00:00:00.000Z',
            color: 'red',
            icon: { type: 'svg', name: 'fitness' },
            trackingMode: 'completion',
          },
        ],
        checkIns: {
          'habit-1': {
            [todayKey]: { completed: true, durationMinutes: 60 },
            [yesterdayKey]: true,
          },
          'habit-2': {
            [todayKey]: { completed: true, durationMinutes: 30 },
          },
          'habit-3': {
            [todayKey]: true,
          },
        },
        selectedHabitId: 'habit-1',
      }),
    );
    saveDailyCheckInAnswer(todayKey, 'habit-1', 'no');
    saveDailyCheckInAnswer(todayKey, 'habit-2', 'no');
    saveDailyCheckInAnswer(todayKey, 'habit-3', 'no');
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(screen.getByRole('button', { name: 'Study Japanese' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Time logged')).not.toBeInTheDocument();
    let timeGoal = screen.getByLabelText('Time goal');
    expect(within(timeGoal).queryByText('Piano')).not.toBeInTheDocument();
    expect(within(timeGoal).queryByText('Gym')).not.toBeInTheDocument();
    expect(within(timeGoal).getByText('1h / 3h')).toBeInTheDocument();
    expect(within(timeGoal).getByText('1 completed day has no time recorded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All habits' }));
    const compactTimeGoals = screen.getByLabelText('Time goals');
    expect(within(compactTimeGoals).getByText('Study Japanese')).toBeInTheDocument();
    expect(within(compactTimeGoals).getByText('1h / 3h')).toBeInTheDocument();
    expect(within(compactTimeGoals).queryByText('Piano')).not.toBeInTheDocument();
    expect(within(compactTimeGoals).queryByText('Gym')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Time summary')).not.toBeInTheDocument();
    expect(screen.getAllByText('Consistency').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Piano' }));
    expect(screen.getByRole('button', { name: 'Piano' })).toHaveAttribute('aria-pressed', 'true');
    const timeSummary = screen.getByLabelText('Time summary');
    expect(within(timeSummary).getByText('30m logged in 2026')).toBeInTheDocument();
    expect(within(timeSummary).getByRole('button', { name: 'Add yearly goal' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Study Japanese' }));
    await user.click(screen.getByRole('button', { name: 'Year' }));
    timeGoal = screen.getByLabelText('Time goal');
    expect(within(timeGoal).getByText('33%')).toBeInTheDocument();
    expect(within(timeGoal).getByText('2h remaining')).toBeInTheDocument();
    expect(within(timeGoal).getByText('Approximately 2 sessions at 1h each')).toBeInTheDocument();
  });
});
