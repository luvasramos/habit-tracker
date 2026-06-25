import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { CalendarControls } from './components/CalendarControls';
import { DailyCheckIn } from './components/DailyCheckIn';
import { HabitDialog } from './components/HabitDialog';
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
  habits: Habit[];
  allHabits: Habit[];
  onCompleteHabit: (habitId: string) => void;
  popoverRef: RefObject<HTMLDivElement | null>;
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
    <button
      ref={reminderButtonRef}
      type="button"
      className={`floating-nav__reminder${remainingCount === 0 ? ' is-complete' : ''}`}
      aria-label={`Today remaining: ${remainingCount}`}
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
  habits,
  allHabits,
  onCompleteHabit,
  popoverRef,
}: TodayRemainingPopoverProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      ref={popoverRef}
      className="today-popover"
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
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [timeEditTarget, setTimeEditTarget] = useState<{
    habitId: string;
    dateKey: LocalDateKey;
  } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const reminderButtonRef = useRef<HTMLButtonElement>(null);
  const reminderPopoverRef = useRef<HTMLDivElement>(null);
  const selectedHabit = state.habits.find((habit) => habit.id === state.selectedHabitId) ?? null;
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
    if (!reminderOpen) {
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
  }, [reminderOpen]);

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
              onEdit={() => setEditOpen(true)}
              onAdd={() => setAddOpen(true)}
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
        isOpen={reminderOpen}
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

      <HabitDialog
        mode="add"
        isOpen={addOpen}
        defaultColorIndex={state.habits.length}
        duplicateMessage="A habit with this name already exists."
        onClose={() => {
          setAddOpen(false);
          addButtonRef.current?.focus();
        }}
        onSave={addHabit}
        isDuplicate={(name) => isDuplicateName(name)}
      />

      {selectedHabit ? (
        <HabitDialog
          mode="edit"
          initialName={selectedHabit.name}
          initialHabit={selectedHabit}
          initialCheckIns={selectedCheckIns}
          isOpen={editOpen}
          duplicateMessage="Another habit already uses this name."
          onClose={() => {
            setEditOpen(false);
            editButtonRef.current?.focus();
          }}
          onSave={(habit, options) => renameHabit(selectedHabit.id, habit, options)}
          onDelete={() => deleteHabit(selectedHabit.id)}
          isDuplicate={(name) => isDuplicateName(name, selectedHabit.id)}
        />
      ) : null}

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
