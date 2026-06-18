import { useMemo, useRef, useState } from 'react';
import { CalendarControls } from './components/CalendarControls';
import { HabitDialog } from './components/HabitDialog';
import { HabitTabs } from './components/HabitTabs';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { YearView } from './components/YearView';
import { useHabits } from './state/HabitProvider';
import type { LocalDateKey, ViewMode } from './state/types';
import { isFutureDay, movePeriod, periodLabel } from './utils/dates';

export const App = () => {
  const {
    state,
    addHabit,
    selectHabit,
    renameHabit,
    deleteHabit,
    toggleCheckIn,
    isDuplicateName,
  } = useHabits();
  const [view, setView] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const selectedHabit = state.habits.find((habit) => habit.id === state.selectedHabitId) ?? null;
  const selectedCheckIns = selectedHabit ? state.checkIns[selectedHabit.id] ?? {} : {};
  const label = useMemo(() => periodLabel(view, anchorDate), [view, anchorDate]);

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
          <div>
            <h1>Habit Grid</h1>
            {state.habits.length === 0 ? (
              <p className="muted">Track completed days for one habit at a time.</p>
            ) : null}
          </div>
          <button
            ref={addButtonRef}
            className="button button--primary"
            type="button"
            onClick={() => setAddOpen(true)}
          >
            Add habit
          </button>
        </header>

        {state.habits.length === 0 ? (
          <section className="empty-state">
            <p>Add a habit to start marking completed days.</p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setAddOpen(true)}
            >
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
                anchorDate={anchorDate}
                checkIns={selectedCheckIns}
                onToggle={handleToggle}
              />
            ) : null}
            {selectedHabit && view === 'month' ? (
              <MonthView
                habit={selectedHabit}
                anchorDate={anchorDate}
                checkIns={selectedCheckIns}
                onToggle={handleToggle}
              />
            ) : null}
            {selectedHabit && view === 'year' ? (
              <YearView
                habit={selectedHabit}
                anchorDate={anchorDate}
                checkIns={selectedCheckIns}
                onToggle={handleToggle}
              />
            ) : null}
          </>
        )}
      </main>

      <HabitDialog
        mode="add"
        isOpen={addOpen}
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
          isOpen={editOpen}
          duplicateMessage="Another habit already uses this name."
          onClose={() => {
            setEditOpen(false);
            editButtonRef.current?.focus();
          }}
          onSave={(name) => renameHabit(selectedHabit.id, name)}
          onDelete={() => deleteHabit(selectedHabit.id)}
          isDuplicate={(name) => isDuplicateName(name, selectedHabit.id)}
        />
      ) : null}
    </div>
  );
};
