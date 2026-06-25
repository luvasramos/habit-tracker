import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarControls } from './components/CalendarControls';
import { DailyCheckIn } from './components/DailyCheckIn';
import { HabitDialog } from './components/HabitDialog';
import { HabitTabs } from './components/HabitTabs';
import { MonthView } from './components/MonthView';
import { Icon } from './components/Icon';
import { StatisticsView } from './components/StatisticsView';
import { WeekView } from './components/WeekView';
import { YearView } from './components/YearView';
import { loadDailyCheckInAnswers } from './data/dailyCheckInStore';
import { useHabits } from './state/HabitProvider';
import type { LocalDateKey, ViewMode } from './state/types';
import { isFutureDay, movePeriod, periodLabel, toLocalDateKey } from './utils/dates';

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
      (habit) => !answers[habit.id] && !state.checkIns[habit.id]?.[toLocalDateKey(new Date())],
    );
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const selectedHabit = state.habits.find((habit) => habit.id === state.selectedHabitId) ?? null;
  const selectedCheckIns = selectedHabit ? state.checkIns[selectedHabit.id] ?? {} : {};
  const label = useMemo(() => periodLabel(view, anchorDate), [view, anchorDate]);
  const hasUnansweredToday = useMemo(() => {
    const answers = loadDailyCheckInAnswers(todayKey);
    return state.habits.some((habit) => !answers[habit.id] && !state.checkIns[habit.id]?.[todayKey]);
  }, [state.checkIns, state.habits, todayKey]);

  useEffect(() => {
    if (!dailyCheckInOpen && hasUnansweredToday) {
      setDailyCheckInOpen(true);
    }
  }, [dailyCheckInOpen, hasUnansweredToday]);

  const handleToggle = (dateKey: LocalDateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!selectedHabit || isFutureDay(new Date(year, month - 1, day))) {
      return;
    }
    toggleCheckIn(selectedHabit.id, dateKey);
  };

  return (
    <div className="app">
      <main className="shell">
        <header className="app-header">
          <div className="primary-nav" aria-label="Primary">
            <button
              type="button"
              className="nav-button"
              aria-pressed={page === 'calendar'}
              onClick={() => setPage('calendar')}
            >
              <Icon name="calendar" />
              Calendar
            </button>
            <button
              type="button"
              className="nav-button"
              aria-pressed={page === 'statistics'}
              onClick={() => setPage('statistics')}
            >
              <Icon name="stats" />
              Statistics
            </button>
          </div>
          <button
            ref={addButtonRef}
            className="button button--primary"
            type="button"
            onClick={() => setAddOpen(true)}
          >
            <Icon name="add" />
            Add habit
          </button>
        </header>

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
        ) : page === 'statistics' ? (
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
            <button
              className="button button--primary"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <Icon name="add" />
              Add habit
            </button>
          </section>
        ) : (
          <>
            <HabitTabs
              habits={state.habits}
              selectedHabitId={state.selectedHabitId}
              onSelect={selectHabit}
              onEdit={() => setEditOpen(true)}
              editButtonRef={editButtonRef}
            />

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
              />
            ) : null}
          </>
        )}
      </main>

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
          isOpen={editOpen}
          duplicateMessage="Another habit already uses this name."
          onClose={() => {
            setEditOpen(false);
            editButtonRef.current?.focus();
          }}
          onSave={(habit) => renameHabit(selectedHabit.id, habit)}
          onDelete={() => deleteHabit(selectedHabit.id)}
          isDuplicate={(name) => isDuplicateName(name, selectedHabit.id)}
        />
      ) : null}
    </div>
  );
};
