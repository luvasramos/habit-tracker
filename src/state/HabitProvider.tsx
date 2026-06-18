/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { habitReducer, hasDuplicateHabitName } from './habitReducer';
import { loadState, saveState } from './persistence';
import type { HabitState, LocalDateKey } from './types';

type HabitContextValue = {
  state: HabitState;
  addHabit: (name: string) => void;
  selectHabit: (habitId: string) => void;
  renameHabit: (habitId: string, name: string) => void;
  deleteHabit: (habitId: string) => void;
  toggleCheckIn: (habitId: string, dateKey: LocalDateKey) => void;
  isDuplicateName: (name: string, exceptHabitId?: string) => boolean;
};

const HabitContext = createContext<HabitContextValue | null>(null);

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(habitReducer, undefined, () => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<HabitContextValue>(
    () => ({
      state,
      addHabit: (name) => dispatch({ type: 'addHabit', name }),
      selectHabit: (habitId) => dispatch({ type: 'selectHabit', habitId }),
      renameHabit: (habitId, name) => dispatch({ type: 'renameHabit', habitId, name }),
      deleteHabit: (habitId) => dispatch({ type: 'deleteHabit', habitId }),
      toggleCheckIn: (habitId, dateKey) =>
        dispatch({ type: 'toggleCheckIn', habitId, dateKey }),
      isDuplicateName: (name, exceptHabitId) =>
        hasDuplicateHabitName(state.habits, name, exceptHabitId),
    }),
    [state],
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

export const useHabits = () => {
  const value = useContext(HabitContext);
  if (!value) {
    throw new Error('useHabits must be used within HabitProvider');
  }
  return value;
};
