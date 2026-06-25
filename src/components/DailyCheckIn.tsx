import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  loadDailyCheckInAnswers,
  saveDailyCheckInAnswer,
  type DailyCheckInAnswer,
} from '../data/dailyCheckInStore';
import type { CheckInsByHabit, Habit, LocalDateKey } from '../state/types';
import { toLocalDateKey } from '../utils/dates';
import {
  formatMinutes,
  getDefaultDurationMinutes,
  isCompletedCheckIn,
} from '../utils/duration';
import { getHabitColorVar, HabitIconView } from '../utils/habitAppearance';
import { Icon } from './Icon';

type DailyCheckInProps = {
  habits: Habit[];
  checkIns: CheckInsByHabit;
  onAnswer: (habitId: string, dateKey: LocalDateKey, completed: boolean) => void;
  onComplete: () => void;
};

const swipeThreshold = 72;

export const DailyCheckIn = ({ habits, checkIns, onAnswer, onComplete }: DailyCheckInProps) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toLocalDateKey(today), [today]);
  const [answers, setAnswers] = useState(() => loadDailyCheckInAnswers(todayKey));
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [leaving, setLeaving] = useState<DailyCheckInAnswer | null>(null);
  const [done, setDone] = useState(false);
  const [loggedMessage, setLoggedMessage] = useState('');
  const startXRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const loggedTimerRef = useRef<number | null>(null);
  const answeredHabitIds = useMemo(
    () =>
      new Set([
        ...Object.keys(answers),
        ...habits
          .filter((habit) => isCompletedCheckIn(checkIns[habit.id]?.[todayKey]))
          .map((habit) => habit.id),
      ]),
    [answers, checkIns, habits, todayKey],
  );
  const queue = habits.filter((habit) => !answeredHabitIds.has(habit.id));
  const currentHabit = queue[Math.min(index, queue.length - 1)] ?? null;
  const progressTotal = habits.length;
  const answeredCount = Math.min(progressTotal, progressTotal - queue.length);

  useEffect(() => {
    if (index >= queue.length && queue.length > 0) {
      setIndex(Math.max(queue.length - 1, 0));
    }
  }, [index, queue.length]);

  useEffect(() => {
    if (habits.length > 0 && queue.length === 0 && !done) {
      setDone(true);
    }
  }, [done, habits.length, queue.length]);

  useEffect(() => {
    if (!done) {
      return undefined;
    }

    completeTimerRef.current = window.setTimeout(onComplete, 720);
    return () => {
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
      if (loggedTimerRef.current) {
        window.clearTimeout(loggedTimerRef.current);
      }
    };
  }, [done, onComplete]);

  const answerCurrent = (answer: DailyCheckInAnswer) => {
    if (!currentHabit || leaving) {
      return;
    }

    const completed = answer === 'yes';
    const loggedMinutes = completed ? getDefaultDurationMinutes(currentHabit) : undefined;
    setLeaving(answer);
    if (loggedTimerRef.current) {
      window.clearTimeout(loggedTimerRef.current);
    }
    setLoggedMessage(loggedMinutes ? `${formatMinutes(loggedMinutes)} logged` : '');
    if (loggedMinutes) {
      loggedTimerRef.current = window.setTimeout(() => setLoggedMessage(''), 900);
    }
    saveDailyCheckInAnswer(todayKey, currentHabit.id, answer);
    onAnswer(currentHabit.id, todayKey, completed);

    window.setTimeout(() => {
      setAnswers((current) => ({ ...current, [currentHabit.id]: answer }));
      setIndex((current) => current + 1);
      setDragX(0);
      setLeaving(null);
    }, 180);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || leaving) {
      return;
    }

    setDragX(Math.max(-120, Math.min(120, event.clientX - startXRef.current)));
  };

  const handlePointerEnd = () => {
    if (startXRef.current === null) {
      return;
    }

    if (dragX <= -swipeThreshold) {
      answerCurrent('no');
    } else if (dragX >= swipeThreshold) {
      answerCurrent('yes');
    } else {
      setDragX(0);
    }
    startXRef.current = null;
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <section
      className="daily-checkin"
      aria-label="Daily check-in"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          answerCurrent('no');
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          answerCurrent('yes');
        }
      }}
    >
      <div className="daily-checkin__topline">
        <span>{format(today, 'EEEE, MMMM d')}</span>
        <span>
          {answeredCount}/{progressTotal}
        </span>
      </div>

      {done || !currentHabit ? (
        <div className="daily-checkin__done" aria-live="polite">
          <span className="daily-checkin__done-mark">
            <Icon name="check" />
          </span>
          <h2>Check-in complete</h2>
          {loggedMessage ? <p className="checkin-log-note">{loggedMessage}</p> : null}
        </div>
      ) : currentHabit ? (
        <>
          <p className="sr-only" id="daily-checkin-instructions">
            Swipe left or press the left arrow for no. Swipe right or press the right arrow for yes.
          </p>
          <div
            className={`checkin-card${leaving ? ` is-leaving-${leaving}` : ''}`}
            style={
              {
                '--habit-color': getHabitColorVar(currentHabit.id, habits),
                '--drag-x': `${dragX}px`,
                '--drag-rotate': `${dragX / 18}deg`,
              } as CSSProperties
            }
            tabIndex={0}
            role="group"
            aria-label={`${currentHabit.name}. Did you complete this today?`}
            aria-describedby="daily-checkin-instructions"
            aria-keyshortcuts="ArrowLeft ArrowRight"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <div className="checkin-card__identity">
              <span className="checkin-card__icon">
                <HabitIconView habit={currentHabit} />
              </span>
              <span className="checkin-card__color" />
            </div>
            <div className="checkin-card__copy">
              <h2>{currentHabit.name}</h2>
              <p>Did you complete this today?</p>
            </div>
          </div>

          <div className="daily-checkin__actions" aria-label="Answer daily check-in">
            <button
              className="checkin-action checkin-action--no"
              type="button"
              aria-label="No"
              onClick={() => answerCurrent('no')}
            >
              <Icon name="close" />
            </button>
            <button
              className="checkin-action checkin-action--yes"
              type="button"
              aria-label="Yes"
              onClick={() => answerCurrent('yes')}
            >
              <Icon name="check" />
            </button>
          </div>
          <p className="checkin-log-note" aria-live="polite">
            {loggedMessage}
          </p>
        </>
      ) : null}
    </section>
  );
};
