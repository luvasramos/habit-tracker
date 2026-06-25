import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { CalendarControls } from './components/CalendarControls';
import { DailyCheckIn } from './components/DailyCheckIn';
import { HabitEditorPage } from './components/HabitEditorPage';
import { HabitTabs } from './components/HabitTabs';
import { MonthView } from './components/MonthView';
import { Icon } from './components/Icon';
import { StatisticsView } from './components/StatisticsView';
import { StreakPill } from './components/StreakPill';
import { TimeEditDialog } from './components/TimeEditDialog';
import { WeekView } from './components/WeekView';
import { YearView } from './components/YearView';
import { loadDailyCheckInAnswers } from './data/dailyCheckInStore';
import { useHabits } from './state/HabitProvider';
import type { Habit, LocalDateKey, ViewMode } from './state/types';
import {
  fromLocalDateKey,
  fullDateLabel,
  isFutureDay,
  movePeriod,
  periodLabel,
  toLocalDateKey,
} from './utils/dates';
import { getCheckInDurationMinutes, isCompletedCheckIn } from './utils/duration';
import { getHabitColorVar, HabitIconView } from './utils/habitAppearance';
import { calculateActivityStreak } from './utils/streak';

type FloatingNavigationProps = {
  page: 'calendar' | 'statistics';
  streak: number;
  remainingCount: number;
  reminderOpen: boolean;
  onPageChange: (page: 'calendar' | 'statistics') => void;
  onToggleReminder: () => void;
  reminderButtonRef: RefObject<HTMLButtonElement | null>;
};

type TodayRemainingPopoverProps = {
  isOpen: boolean;
  isClosing: boolean;
  habits: Habit[];
  allHabits: Habit[];
  onCompleteHabit: (habitId: string) => void;
  popoverRef: RefObject<HTMLDivElement | null>;
};

type AppRoute =
  | { name: 'home' }
  | { name: 'newHabit' }
  | { name: 'editHabit'; habitId: string };

const parseHashRoute = (hash: string): AppRoute => {
  const route = hash.replace(/^#/, '');
  if (route === '/habits/new') {
    return { name: 'newHabit' };
  }

  const editMatch = route.match(/^\/habits\/([^/]+)\/edit$/);
  if (editMatch) {
    return { name: 'editHabit', habitId: decodeURIComponent(editMatch[1]) };
  }

  return { name: 'home' };
};

const navigateToHash = (hash: string) => {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = hash;
};

const FloatingNavigation = ({
  page,
  streak,
  remainingCount,
  reminderOpen,
  onPageChange,
  onToggleReminder,
  reminderButtonRef,
}: FloatingNavigationProps) => (
  <nav className="floating-nav" aria-label="Primary">
    <StreakPill streak={streak} />
    <div
      className="floating-nav__pages"
      data-active-page={page}
      role="group"
      aria-label="Main sections"
    >
      <span className="floating-nav__indicator" aria-hidden="true" />
      <button
        type="button"
        className="floating-nav__item"
        aria-label="Calendar"
        aria-current={page === 'calendar' ? 'page' : undefined}
        onClick={() => onPageChange('calendar')}
      >
        <Icon name="calendar" />
        <span>Calendar</span>
      </button>
      <button
        type="button"
        className="floating-nav__item"
        aria-label="Statistics"
        aria-current={page === 'statistics' ? 'page' : undefined}
        onClick={() => onPageChange('statistics')}
      >
        <Icon name="stats" />
        <span>Statistics</span>
      </button>
    </div>
    <button
      ref={reminderButtonRef}
      type="button"
      className="floating-nav__reminder"
      aria-label={`${remainingCount} habits remaining today`}
      aria-expanded={reminderOpen}
      aria-controls="today-remaining-popover"
      onClick={onToggleReminder}
    >
      <Icon name="bell" />
      <span>{remainingCount}</span>
    </button>
  </nav>
);

const TodayRemainingPopover = ({
  isOpen,
  isClosing,
  habits,
  allHabits,
  onCompleteHabit,
  popoverRef,
}: TodayRemainingPopoverProps) => {
  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <aside
      ref={popoverRef}
      className={`today-popover${isClosing ? ' is-closing' : ''}`}
      id="today-remaining-popover"
      aria-label="Today remaining habits"
    >
      <div className="today-popover__header">
        <h2>Today</h2>
        <span>{habits.length} left</span>
      </div>
      {habits.length === 0 ? (
        <p className="today-popover__empty">All done for today.</p>
      ) : (
        <ul className="today-popover__list">
          {habits.map((habit) => (
            <li
              className="today-popover__item"
              key={habit.id}
              style={{ '--habit-color': getHabitColorVar(habit.id, allHabits) } as CSSProperties}
            >
              <span className="today-popover__identity">
                <span className="habit-tab__color" />
                <HabitIconView habit={habit} />
                <span>{habit.name}</span>
              </span>
              <button
                className="icon-button today-popover__check"
                type="button"
                aria-label={`Mark ${habit.name} complete today`}
                onClick={() => onCompleteHabit(habit.id)}
              >
                <Icon name="check" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export const App = () => {
  const {
    state,
    addHabit,
    selectHabit,
    renameHabit,
    deleteHabit,
    toggleCheckIn,
    setCheckIn,
    isDuplicateName,
  } = useHabits();
  const [view, setView] = useState<ViewMode>('week');
  const [page, setPage] = useState<'calendar' | 'statistics'>('calendar');
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute(window.location.hash));
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [todayKey] = useState(() => toLocalDateKey(new Date()));
  const [dailyCheckInOpen, setDailyCheckInOpen] = useState(() => {
    const answers = loadDailyCheckInAnswers(toLocalDateKey(new Date()));
    return state.habits.some(
      (habit) =>
        !answers[habit.id] &&
        !isCompletedCheckIn(state.checkIns[habit.id]?.[toLocalDateKey(new Date())]),
    );
  });
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderClosing, setReminderClosing] = useState(false);
  const [timeEditTarget, setTimeEditTarget] = useState<{
    habitId: string;
    dateKey: LocalDateKey;
  } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const reminderButtonRef = useRef<HTMLButtonElement>(null);
  const reminderPopoverRef = useRef<HTMLDivElement>(null);
  const selectedHabit = state.habits.find((habit) => habit.id === state.selectedHabitId) ?? null;
  const editingHabit =
    route.name === 'editHabit'
      ? state.habits.find((habit) => habit.id === route.habitId) ?? null
      : null;
  const editingCheckIns = editingHabit ? state.checkIns[editingHabit.id] ?? {} : {};
  const selectedCheckIns = selectedHabit ? state.checkIns[selectedHabit.id] ?? {} : {};
  const timeEditHabit =
    state.habits.find((habit) => habit.id === timeEditTarget?.habitId) ?? null;
  const timeEditEntry = timeEditTarget
    ? state.checkIns[timeEditTarget.habitId]?.[timeEditTarget.dateKey]
    : undefined;
  const label = useMemo(() => periodLabel(view, anchorDate), [view, anchorDate]);
  const activityStreak = useMemo(
    () => calculateActivityStreak(state.checkIns),
    [state.checkIns],
  );
  const hasUnansweredToday = useMemo(() => {
    const answers = loadDailyCheckInAnswers(todayKey);
    return state.habits.some(
      (habit) => !answers[habit.id] && !isCompletedCheckIn(state.checkIns[habit.id]?.[todayKey]),
    );
  }, [state.checkIns, state.habits, todayKey]);
  const remainingTodayHabits = useMemo(
    () =>
      state.habits.filter(
        (habit) => !isCompletedCheckIn(state.checkIns[habit.id]?.[todayKey]),
      ),
    [state.checkIns, state.habits, todayKey],
  );

  useEffect(() => {
    if (!dailyCheckInOpen && hasUnansweredToday) {
      setDailyCheckInOpen(true);
    }
  }, [dailyCheckInOpen, hasUnansweredToday]);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (reminderOpen) {
      setReminderVisible(true);
      setReminderClosing(false);
      return;
    }

    if (!reminderVisible) {
      return;
    }

    setReminderClosing(true);
    const timeout = window.setTimeout(() => {
      setReminderVisible(false);
      setReminderClosing(false);
    }, 170);

    return () => window.clearTimeout(timeout);
  }, [reminderOpen, reminderVisible]);

  useEffect(() => {
    if (!reminderVisible) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        reminderPopoverRef.current?.contains(target) ||
        reminderButtonRef.current?.contains(target)
      ) {
        return;
      }
      setReminderOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setReminderOpen(false);
        reminderButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [reminderVisible]);

  const handleToggle = (dateKey: LocalDateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!selectedHabit || isFutureDay(new Date(year, month - 1, day))) {
      return;
    }
    toggleCheckIn(selectedHabit.id, dateKey);
  };

  const openTimeEdit = (dateKey: LocalDateKey) => {
    if (!selectedHabit) {
      return;
    }

    setTimeEditTarget({ habitId: selectedHabit.id, dateKey });
  };

  const closeEditor = () => {
    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setRoute({ name: 'home' });
    } else {
      setRoute({ name: 'home' });
    }
  };

  if (route.name === 'newHabit') {
    return (
      <div className="app app--editor">
        <HabitEditorPage
          mode="add"
          defaultColorIndex={state.habits.length}
          duplicateMessage="A habit with this name already exists."
          onBack={closeEditor}
          onSave={addHabit}
          isDuplicate={(name) => isDuplicateName(name)}
        />
      </div>
    );
  }

  if (route.name === 'editHabit') {
    return (
      <div className="app app--editor">
        {editingHabit ? (
          <HabitEditorPage
            mode="edit"
            initialName={editingHabit.name}
            initialHabit={editingHabit}
            initialCheckIns={editingCheckIns}
            duplicateMessage="Another habit already uses this name."
            onBack={closeEditor}
            onSave={(habit, options) => renameHabit(editingHabit.id, habit, options)}
            onDelete={() => deleteHabit(editingHabit.id)}
            isDuplicate={(name) => isDuplicateName(name, editingHabit.id)}
          />
        ) : (
          <section className="habit-editor-page" aria-label="Habit not found">
            <header className="habit-editor-header">
              <div>
                <h1>Edit habit</h1>
                <p className="muted">This habit is no longer available.</p>
              </div>
              <button className="button habit-editor-back" type="button" aria-label="Back to habits" onClick={closeEditor}>
                <Icon name="previous" />
                Back
              </button>
            </header>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <main className="shell">
        {dailyCheckInOpen ? (
          <DailyCheckIn
            habits={state.habits}
            checkIns={state.checkIns}
            onAnswer={(habitId, dateKey, completed) => setCheckIn(habitId, dateKey, completed)}
            onComplete={() => {
              setPage('calendar');
              setDailyCheckInOpen(false);
            }}
          />
        ) : (
          <>
            <HabitTabs
              habits={state.habits}
              selectedHabitId={state.selectedHabitId}
              onSelect={selectHabit}
              onEdit={() => {
                if (selectedHabit) {
                  navigateToHash(`#/habits/${encodeURIComponent(selectedHabit.id)}/edit`);
                }
              }}
              onAdd={() => navigateToHash('#/habits/new')}
              editButtonRef={editButtonRef}
              addButtonRef={addButtonRef}
            />

            {page === 'statistics' ? (
              <StatisticsView habits={state.habits} checkIns={state.checkIns} />
            ) : state.habits.length === 0 ? (
              <section className="empty-state">
                <span className="empty-state__icon" aria-hidden="true">
                  <Icon name="habits" />
                </span>
                <div className="empty-state__copy">
                  <h2>No habits yet</h2>
                  <p>Add one small routine to begin.</p>
                </div>
              </section>
            ) : (
              <>
                <CalendarControls
                  view={view}
                  label={label}
                  onViewChange={setView}
                  onPrevious={() => setAnchorDate((date) => movePeriod(view, date, -1))}
                  onNext={() => setAnchorDate((date) => movePeriod(view, date, 1))}
                  onToday={() => setAnchorDate(new Date())}
                />

                {selectedHabit && view === 'week' ? (
                  <WeekView
                    habit={selectedHabit}
                    habits={state.habits}
                    anchorDate={anchorDate}
                    checkIns={selectedCheckIns}
                    allCheckIns={state.checkIns}
                    onToggle={handleToggle}
                    onEditTime={openTimeEdit}
                  />
                ) : null}
                {selectedHabit && view === 'month' ? (
                  <MonthView
                    habit={selectedHabit}
                    habits={state.habits}
                    anchorDate={anchorDate}
                    checkIns={selectedCheckIns}
                    allCheckIns={state.checkIns}
                    onToggle={handleToggle}
                    onEditTime={openTimeEdit}
                  />
                ) : null}
                {selectedHabit && view === 'year' ? (
                  <YearView
                    habit={selectedHabit}
                    habits={state.habits}
                    anchorDate={anchorDate}
                    checkIns={selectedCheckIns}
                    allCheckIns={state.checkIns}
                    onToggle={handleToggle}
                    onEditTime={openTimeEdit}
                  />
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      <TodayRemainingPopover
        isOpen={reminderVisible}
        isClosing={reminderClosing}
        habits={remainingTodayHabits}
        allHabits={state.habits}
        popoverRef={reminderPopoverRef}
        onCompleteHabit={(habitId) => setCheckIn(habitId, todayKey, true)}
      />

      <FloatingNavigation
        page={page}
        streak={activityStreak}
        remainingCount={remainingTodayHabits.length}
        reminderOpen={reminderOpen}
        onPageChange={setPage}
        onToggleReminder={() => setReminderOpen((open) => !open)}
        reminderButtonRef={reminderButtonRef}
      />

      <TimeEditDialog
        isOpen={Boolean(timeEditTarget && timeEditHabit)}
        habit={timeEditHabit}
        dateLabel={
          timeEditTarget ? fullDateLabel(fromLocalDateKey(timeEditTarget.dateKey)) : ''
        }
        initialMinutes={getCheckInDurationMinutes(timeEditEntry)}
        onClose={() => setTimeEditTarget(null)}
        onSave={(durationMinutes) => {
          if (!timeEditTarget) {
            return;
          }
          setCheckIn(timeEditTarget.habitId, timeEditTarget.dateKey, true, durationMinutes);
        }}
      />
    </div>
  );
};
