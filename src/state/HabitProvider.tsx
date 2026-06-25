/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { habitStore, type HabitStore } from '../data/habitStore';
import { habitReducer, hasDuplicateHabitName } from './habitReducer';
import type { HabitState, LocalDateKey } from './types';

type HabitContextValue = {
  state: HabitState;
  addHabit: (name: string) => void;
  selectHabit: (habitId: string) => void;
  renameHabit: (habitId: string, name: string) => void;
  deleteHabit: (habitId: string) => void;
  toggleCheckIn: (habitId: string, dateKey: LocalDateKey) => void;
  setCheckIn: (habitId: string, dateKey: LocalDateKey, completed: boolean) => void;
  isDuplicateName: (name: string, exceptHabitId?: string) => boolean;
};

const HabitContext = createContext<HabitContextValue | null>(null);

export const HabitProvider = ({
  children,
  store = habitStore,
}: {
  children: ReactNode;
  store?: HabitStore;
}) => {
  const [state, dispatch] = useReducer(habitReducer, undefined, () => store.load());

  useEffect(() => {
    store.save(state);
  }, [state, store]);

  const value = useMemo<HabitContextValue>(
    () => ({
      state,
      addHabit: (name) => dispatch({ type: 'addHabit', name }),
      selectHabit: (habitId) => dispatch({ type: 'selectHabit', habitId }),
      renameHabit: (habitId, name) => dispatch({ type: 'renameHabit', habitId, name }),
      deleteHabit: (habitId) => dispatch({ type: 'deleteHabit', habitId }),
      toggleCheckIn: (habitId, dateKey) =>
        dispatch({ type: 'toggleCheckIn', habitId, dateKey }),
      setCheckIn: (habitId, dateKey, completed) =>
        dispatch({ type: 'setCheckIn', habitId, dateKey, completed }),
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
