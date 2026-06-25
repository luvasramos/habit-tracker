import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { CheckInsByHabit, Habit, LocalDateKey, ViewMode } from '../state/types';
import { getMonthCells, getWeekDays } from '../utils/calendar';
import {
  movePeriod,
  periodLabel,
  fromLocalDateKey,
  toLocalDateKey,
} from '../utils/dates';
import { formatMinutes } from '../utils/duration';
import { getHabitColorVar, HabitIconView } from '../utils/habitAppearance';
import {
  calculateAllHabitsStatistics,
  calculateHabitStatistics,
  getRangeDays,
} from '../utils/statistics';
import { getStatisticsDateLabel, getStatisticsDateState, type StatisticsDateModel } from '../utils/statisticsCalendar';
import { Icon } from './Icon';

type StatisticsViewProps = {
  habits: Habit[];
  checkIns: CheckInsByHabit;
  selectedHabitId: string | null;
  onEditHabit?: (habitId: string) => void;
  onSetCheckIn?: (
    habitId: string,
    dateKey: LocalDateKey,
    completed: boolean,
    durationMinutes?: number,
  ) => void;
  onEditTime?: (habitId: string, dateKey: LocalDateKey) => void;
};

type HabitStat = {
  id: string;
  name: string;
  count: number;
  durationMinutes: number;
  color: string;
  habit?: Habit;
};

const allHabitsId = '__all_habits__';
const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
const weekdayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const metricDescriptions = {
  daysDone: 'Eligible days when the selected habit was completed.',
  daysMissed: 'Eligible elapsed days when the selected habit was not completed.',
  activeDays: 'Elapsed days when at least one habit was completed.',
  noActivity: 'Elapsed days without any habit completion.',
  timeLogged: 'Known duration recorded in the selected period.',
};

const getDateStateClass = (model: StatisticsDateModel, showNoActivity: boolean) => {
  const classes = [
    'stats-date-cell',
    `stats-date-cell--${model.state}`,
    model.isToday ? 'is-today' : '',
    model.isCompleted ? 'is-completed' : '',
    model.isMissed && showNoActivity ? 'is-missed-visible' : '',
    model.isUnavailable ? 'is-unavailable' : '',
  ];

  return classes.filter(Boolean).join(' ');
};

type StatisticsCalendarProps = {
  range: ViewMode;
  anchorDate: Date;
  habits: Habit[];
  checkIns: CheckInsByHabit;
  selectedHabit: Habit | null;
  selectedColor: string;
  showNoActivity: boolean;
  today: Date;
  onSetCheckIn?: StatisticsViewProps['onSetCheckIn'];
  onEditTime?: StatisticsViewProps['onEditTime'];
};

const StatisticsDateCell = ({
  model,
  selectedHabit,
  selectedColor,
  showNoActivity,
  size,
  outside = false,
  onSelect,
}: {
  model: StatisticsDateModel;
  selectedHabit: Habit | null;
  selectedColor: string;
  showNoActivity: boolean;
  size: 'week' | 'month' | 'year';
  outside?: boolean;
  onSelect: (model: StatisticsDateModel, trigger: HTMLButtonElement) => void;
}) => {
  const visibleDots = selectedHabit ? [] : model.completions.slice(0, size === 'year' ? 0 : 4);
  const hiddenCount = selectedHabit ? 0 : Math.max(model.completions.length - visibleDots.length, 0);
  const durationLabel =
    selectedHabit && model.durationMinutes !== undefined ? formatMinutes(model.durationMinutes) : null;

  return (
    <button
      className={`${getDateStateClass(model, showNoActivity)} stats-date-cell--${size}${outside ? ' is-outside' : ''}`}
      type="button"
      aria-label={getStatisticsDateLabel(model, selectedHabit)}
      aria-disabled={model.isUnavailable}
      title={getStatisticsDateLabel(model, selectedHabit)}
      data-date-key={model.dateKey}
      style={{ '--habit-color': selectedHabit ? selectedColor : 'var(--soft)' } as CSSProperties}
      onClick={(event) => onSelect(model, event.currentTarget)}
    >
      {size === 'week' ? (
        <>
          <span className="stats-date-cell__weekday">{format(model.date, 'EEE')}</span>
          <span className="stats-date-cell__number">{format(model.date, 'd')}</span>
          {durationLabel ? <span className="stats-date-cell__duration">{durationLabel}</span> : null}
        </>
      ) : (
        <>
          <span className="stats-date-cell__number">{format(model.date, 'd')}</span>
          {durationLabel && size === 'month' ? (
            <span className="stats-date-cell__duration stats-date-cell__duration--compact">{durationLabel}</span>
          ) : null}
        </>
      )}
      {visibleDots.length > 0 ? (
        <span className="stats-date-cell__dots" aria-hidden="true">
          {visibleDots.map((completion) => (
            <span
              className="stats-date-cell__dot"
              key={completion.id}
              style={{ '--dot-color': completion.color } as CSSProperties}
            />
          ))}
          {hiddenCount > 0 ? <span className="stats-date-cell__more">+{hiddenCount}</span> : null}
        </span>
      ) : null}
      {hiddenCount > 0 ? (
        <span className="sr-only">{hiddenCount} additional completed habits</span>
      ) : null}
    </button>
  );
};

const StatisticsDateDetails = ({
  model,
  selectedHabit,
  habits,
  checkIns,
  today,
  onSetCheckIn,
  onEditTime,
  onClose,
}: {
  model: StatisticsDateModel;
  selectedHabit: Habit | null;
  habits: Habit[];
  checkIns: CheckInsByHabit;
  today: Date;
  onSetCheckIn?: StatisticsViewProps['onSetCheckIn'];
  onEditTime?: StatisticsViewProps['onEditTime'];
  onClose: () => void;
}) => {
  const title = format(model.date, 'MMMM d, yyyy');
  const canEdit = (Boolean(onSetCheckIn) || Boolean(onEditTime)) && !model.isFuture;
  const canChangeCompletion = Boolean(onSetCheckIn) && !model.isFuture;

  return (
    <section
      className="stats-date-details"
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
    >
      <div className="stats-date-details__header">
        <div>
          <h3>{title}</h3>
          <p>{getStatisticsDateLabel(model, selectedHabit)}</p>
        </div>
        <button className="icon-button" type="button" aria-label="Close date details" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {selectedHabit ? (
        <div className="stats-date-details__body">
          <div className="stats-date-details__identity" style={{ '--habit-color': getHabitColorVar(selectedHabit.id, habits) } as CSSProperties}>
            <span className="filter-pill__dot" />
            <HabitIconView habit={selectedHabit} />
            <span>{selectedHabit.name}</span>
          </div>
          <div className="stats-date-details__list">
            <span>{model.isCompleted ? 'Completed' : model.isUnavailable ? 'Unavailable' : 'Missed'}</span>
            {model.durationMinutes !== undefined ? <span>{formatMinutes(model.durationMinutes)} logged</span> : null}
            {model.unknownDuration ? <span>No time recorded</span> : null}
          </div>
          {canEdit && !model.isUnavailable ? (
            <div className="stats-date-details__actions">
              {canChangeCompletion && model.isCompleted ? (
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => onSetCheckIn?.(selectedHabit.id, model.dateKey, false)}
                >
                  Mark incomplete
                </button>
              ) : null}
              {canChangeCompletion && !model.isCompleted ? (
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => onSetCheckIn?.(selectedHabit.id, model.dateKey, true)}
                >
                  Mark complete
                </button>
              ) : null}
              {selectedHabit.trackingMode === 'duration' && model.isCompleted && onEditTime ? (
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => onEditTime(selectedHabit.id, model.dateKey)}
                >
                  <Icon name="edit" />
                  Edit time
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="stats-date-details__habit-list">
          {habits.map((habit) => {
            const habitModel = getStatisticsDateState({
              date: model.date,
              habits,
              checkIns,
              selectedHabit: habit,
              today,
            });
            const durationMinutes = habitModel.durationMinutes;
            const canChangeHabit = canChangeCompletion && !habitModel.isUnavailable;

            return (
              <div
                className="stats-date-details__habit-row"
                key={habit.id}
                style={{ '--habit-color': getHabitColorVar(habit.id, habits) } as CSSProperties}
              >
                <span className="stats-date-details__identity">
                  <span className="filter-pill__dot" />
                  <HabitIconView habit={habit} />
                  <span>{habit.name}</span>
                </span>
                <span className="stats-date-details__status">
                  {habitModel.isCompleted ? 'Completed' : habitModel.isUnavailable ? 'Unavailable' : 'Incomplete'}
                  {durationMinutes !== undefined ? `, ${formatMinutes(durationMinutes)}` : ''}
                  {habitModel.unknownDuration ? ', no time recorded' : ''}
                </span>
                {canChangeHabit ? (
                  <span className="stats-date-details__row-actions">
                    <button
                      className="button button--quiet"
                      type="button"
                      onClick={() => onSetCheckIn?.(habit.id, model.dateKey, !habitModel.isCompleted)}
                    >
                      {habitModel.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    </button>
                    {habit.trackingMode === 'duration' && habitModel.isCompleted && onEditTime ? (
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit time for ${habit.name}`}
                        onClick={() => onEditTime(habit.id, model.dateKey)}
                      >
                        <Icon name="edit" />
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const StatisticsCalendar = ({
  range,
  anchorDate,
  habits,
  checkIns,
  selectedHabit,
  selectedColor,
  showNoActivity,
  today,
  onSetCheckIn,
  onEditTime,
}: StatisticsCalendarProps) => {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(anchorDate.getFullYear(), month, 1)),
    [anchorDate],
  );
  const [selectedDateKey, setSelectedDateKey] = useState<LocalDateKey>(() => toLocalDateKey(today));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const getModel = (date: Date) =>
    getStatisticsDateState({
      date,
      habits,
      checkIns,
      selectedHabit,
      today,
    });
  const selectedModel = getStatisticsDateState({
    date: selectedDateKey ? fromLocalDateKey(selectedDateKey) : today,
    habits,
    checkIns,
    selectedHabit,
    today,
  });
  const closeDetails = () => {
    setDetailsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  const selectModel = (model: StatisticsDateModel, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setSelectedDateKey(model.dateKey);
    setDetailsOpen(true);
  };

  useEffect(() => {
    if (!detailsOpen) {
      return;
    }

    panelRef.current?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      closeDetails();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetails();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailsOpen]);

  const details = detailsOpen ? (
    <div className="stats-date-details-wrap" ref={panelRef} tabIndex={-1}>
      <StatisticsDateDetails
        model={selectedModel}
        selectedHabit={selectedHabit}
        habits={habits}
        checkIns={checkIns}
        today={today}
        onSetCheckIn={onSetCheckIn}
        onEditTime={onEditTime}
        onClose={closeDetails}
      />
    </div>
  ) : null;

  if (range === 'week') {
    return (
      <section className="stats-calendar" aria-label="Weekly statistics calendar">
        <div className="stats-calendar-week">
          {getWeekDays(anchorDate).map((cell) => (
            <StatisticsDateCell
              key={cell.key}
              model={getModel(cell.date)}
              selectedHabit={selectedHabit}
              selectedColor={selectedColor}
              showNoActivity={showNoActivity}
              size="week"
              onSelect={selectModel}
            />
          ))}
        </div>
        {details}
      </section>
    );
  }

  if (range === 'month') {
    return (
      <section className="stats-calendar" aria-label="Monthly statistics calendar">
        <div className="stats-calendar-month" aria-label={format(anchorDate, 'MMMM yyyy')}>
          <div className="stats-calendar-weekdays" aria-hidden="true">
            {weekdayInitials.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="stats-calendar-month__grid">
            {getMonthCells(anchorDate).map((cell) => (
              <StatisticsDateCell
                key={cell.key}
                model={getModel(cell.date)}
                selectedHabit={selectedHabit}
                selectedColor={selectedColor}
                showNoActivity={showNoActivity}
                size="month"
                outside={!cell.inPeriod}
                onSelect={selectModel}
              />
            ))}
          </div>
        </div>
        {details}
      </section>
    );
  }

  return (
    <section className="stats-calendar" aria-label="Yearly statistics calendar">
      <div className="year-months stats-year-months" aria-label="Yearly activity overview">
        {months.map((month) => (
          <section className="year-month-card" key={month.getMonth()} aria-label={format(month, 'MMMM')}>
            <div className="year-month-card__header">
              <h3>{format(month, 'MMM')}</h3>
            </div>
            <div className="year-month-card__weekdays" aria-hidden="true">
              {weekdayInitials.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="year-month-card__grid">
              {getMonthCells(month).map((cell) =>
                cell.inPeriod ? (
                  <StatisticsDateCell
                    key={cell.key}
                    model={getModel(cell.date)}
                    selectedHabit={selectedHabit}
                    selectedColor={selectedColor}
                    showNoActivity={showNoActivity}
                    size="year"
                    onSelect={selectModel}
                  />
                ) : (
                  <span className="stats-date-cell stats-date-cell--year is-outside" key={cell.key} aria-hidden="true" />
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      {details}
    </section>
  );
};

export const StatisticsView = ({
  habits,
  checkIns,
  selectedHabitId,
  onEditHabit,
  onSetCheckIn,
  onEditTime,
}: StatisticsViewProps) => {
  const [range, setRange] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedStatsId, setSelectedStatsId] = useState<string>(() =>
    selectedHabitId && habits.some((habit) => habit.id === selectedHabitId)
      ? selectedHabitId
      : allHabitsId,
  );
  const [showNoActivity, setShowNoActivity] = useState(true);

  useEffect(() => {
    setSelectedStatsId((current) => {
      if (current === allHabitsId || habits.some((habit) => habit.id === current)) {
        return current;
      }

      return selectedHabitId && habits.some((habit) => habit.id === selectedHabitId)
        ? selectedHabitId
        : allHabitsId;
    });
  }, [habits, selectedHabitId]);

  const selectedHabit =
    selectedStatsId === allHabitsId
      ? null
      : habits.find((habit) => habit.id === selectedStatsId) ?? null;
  const selectedHabits = selectedHabit ? [selectedHabit] : habits;
  const selectedColor = selectedHabit ? getHabitColorVar(selectedHabit.id, habits) : 'var(--soft)';
  const rangeDays = useMemo(() => getRangeDays(range, anchorDate), [range, anchorDate]);
  const yearDays = useMemo(() => getRangeDays('year', anchorDate), [anchorDate]);
  const today = new Date();
  const allHabitStats = calculateAllHabitsStatistics(selectedHabits, checkIns, rangeDays, today);
  const habitStatById = new Map(
    allHabitStats.habitStatistics.map((stat) => [stat.habit.id, stat]),
  );

  const habitStats: HabitStat[] = selectedHabits.map((habit) => {
    const habitSummary =
      habitStatById.get(habit.id) ??
      calculateHabitStatistics(habit, checkIns[habit.id], rangeDays, today);
    return {
      id: habit.id,
      name: habit.name,
      count: habitSummary.daysDone,
      durationMinutes: habitSummary.loggedMinutes,
      color: getHabitColorVar(habit.id, habits),
      habit,
    };
  });
  const totalDurationMinutes = habitStats.reduce(
    (sum, stat) => sum + stat.durationMinutes,
    0,
  );
  const durationGoalStats = selectedHabits
    .filter((habit) => habit.trackingMode === 'duration')
    .map((habit) => ({
      habit,
      color: getHabitColorVar(habit.id, habits),
      summary:
        habitStatById.get(habit.id)?.durationSummary ??
        calculateHabitStatistics(habit, checkIns[habit.id], rangeDays, today)
          .durationSummary,
  }));
  const activeDays = allHabitStats.activeDateKeys.length;
  const inactiveDays = allHabitStats.inactiveDateKeys.length;
  const selectedDurationSummary = selectedHabit
    ? durationGoalStats.find(({ habit }) => habit.id === selectedHabit.id)?.summary
    : null;
  const selectedYearDurationSummary =
    selectedHabit?.trackingMode === 'duration'
      ? calculateHabitStatistics(
          selectedHabit,
          checkIns[selectedHabit.id],
          yearDays,
          today,
        ).durationSummary
      : null;
  const selectedHasYearlyGoal = Boolean(
    selectedYearDurationSummary && selectedYearDurationSummary.goalMinutes > 0,
  );
  const allHabitYearGoalStats = selectedHabit
    ? []
    : habits
        .filter((habit) => habit.trackingMode === 'duration' && (habit.yearlyGoalMinutes ?? 0) > 0)
        .map((habit) => ({
          habit,
          color: getHabitColorVar(habit.id, habits),
          summary: calculateHabitStatistics(
            habit,
            checkIns[habit.id],
            yearDays,
            today,
          ).durationSummary,
        }))
        .filter(({ summary }) => summary.goalMinutes > 0);
  const summaryMetrics = selectedHabit
    ? [
        {
          label: 'Days done',
          value: activeDays,
          description: metricDescriptions.daysDone,
        },
        {
          label: 'Days missed',
          value: inactiveDays,
          description: metricDescriptions.daysMissed,
          className: 'metric--inactive',
        },
      ]
    : [
        {
          label: 'Active days',
          value: activeDays,
          description: metricDescriptions.activeDays,
        },
        {
          label: 'Days with no activity',
          value: inactiveDays,
          description: metricDescriptions.noActivity,
          className: 'metric--inactive',
        },
        {
          label: 'Total time logged',
          value: formatMinutes(totalDurationMinutes),
          description: metricDescriptions.timeLogged,
        },
      ];
  const visibleDurationGoalStats = selectedHabit
    ? selectedHabit.trackingMode === 'duration' && selectedDurationSummary && selectedYearDurationSummary
      ? [
          {
            habit: selectedHabit,
            color: selectedColor,
            periodSummary: selectedDurationSummary,
            yearSummary: selectedYearDurationSummary,
          },
        ]
      : []
    : [];

  if (habits.length === 0) {
    return (
      <section className="stats-empty" aria-label="Statistics">
        <span className="stats-empty__icon" aria-hidden="true">
          <Icon name="stats" />
        </span>
        <div className="stats-empty__copy">
          <h2>No habits to analyze yet.</h2>
          <p className="muted">Add a habit to begin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="stats-panel" aria-label="Statistics">
      <div className="stats-top">
        <div className="stats-toolbar">
          <button
            className="activity-toggle"
            type="button"
            aria-pressed={showNoActivity}
            onClick={() => setShowNoActivity((value) => !value)}
          >
            <span className="activity-toggle__box" aria-hidden="true">
              {showNoActivity ? <Icon name="check" /> : null}
            </span>
            Show no activity
          </button>

          <div className="segmented" aria-label="Statistics range">
            {(['week', 'month', 'year'] as ViewMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className="segmented__button"
                aria-pressed={range === item}
                onClick={() => setRange(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="period-controls">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous statistics range"
              onClick={() => setAnchorDate((date) => movePeriod(range, date, -1))}
            >
              <Icon name="previous" />
            </button>
            <h2 className="period-label" aria-live="polite">
              {periodLabel(range, anchorDate)}
            </h2>
            <button
              className="icon-button"
              type="button"
              aria-label="Next statistics range"
              onClick={() => setAnchorDate((date) => movePeriod(range, date, 1))}
            >
              <Icon name="next" />
            </button>
            <button className="button button--quiet" type="button" onClick={() => setAnchorDate(new Date())}>
              Today
            </button>
          </div>
        </div>

        <div className="stats-selector" aria-label="Statistics habit selector">
          <button
            className="filter-pill"
            type="button"
            aria-pressed={selectedStatsId === allHabitsId}
            onClick={() => setSelectedStatsId(allHabitsId)}
            style={{ '--habit-color': 'var(--soft)' } as CSSProperties}
          >
            <span className="filter-pill__dot" />
            All habits
          </button>
          {habits.map((habit) => (
            <button
              key={habit.id}
              className="filter-pill"
              type="button"
              aria-pressed={selectedStatsId === habit.id}
              onClick={() => setSelectedStatsId(habit.id)}
              style={{ '--habit-color': getHabitColorVar(habit.id, habits) } as CSSProperties}
            >
              <span className="filter-pill__dot" />
              <HabitIconView habit={habit} />
              {habit.name}
            </button>
          ))}
        </div>
      </div>

      <div
        className="stats-context"
        style={{ '--habit-color': selectedColor } as CSSProperties}
      >
        {selectedHabit ? (
          <>
            <span className="filter-pill__dot" />
            <HabitIconView habit={selectedHabit} />
            <h2>{selectedHabit.name}</h2>
          </>
        ) : (
          <h2>All habits</h2>
        )}
      </div>

      <>
        <div
          className="stats-summary-grid"
          data-count={summaryMetrics.length}
        >
          {summaryMetrics.map((metric) => (
            <div
              className={`metric${metric.className ? ` ${metric.className}` : ''}`}
              key={metric.label}
              aria-label={`${metric.label}: ${metric.description}`}
              title={metric.description}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        {!selectedHabit && activeDays === 0 ? (
          <p className="stats-note">No activity recorded in this period.</p>
        ) : null}

        {!selectedHabit && totalDurationMinutes === 0 ? (
          <p className="stats-note">No time has been logged in this period.</p>
        ) : null}

        {selectedHabit?.trackingMode === 'duration' &&
        !selectedHasYearlyGoal &&
        selectedDurationSummary &&
        selectedDurationSummary.unknownDurationDays > 0 ? (
          <p className="stats-note">
            {pluralize(selectedDurationSummary.unknownDurationDays, 'completed day')}{' '}
            {selectedDurationSummary.unknownDurationDays === 1 ? 'has' : 'have'} no time recorded
          </p>
        ) : null}

          {visibleDurationGoalStats.length > 0 ? (
            <section
              className="time-goals"
              aria-label={selectedHasYearlyGoal ? 'Time goal' : 'Time summary'}
            >
              {visibleDurationGoalStats.map(({ habit, color, periodSummary, yearSummary }) => {
                const progressPercent = Math.round(yearSummary.progressPercent * 100);
                const visualPercent = Math.round(yearSummary.visualProgressPercent * 100);
                const year = anchorDate.getFullYear();
                const periodContributionLabel =
                  range === 'week'
                    ? 'This week'
                    : range === 'month'
                      ? 'This month'
                      : null;
                const defaultSessionLabel =
                  habit.defaultDurationMinutes && habit.defaultDurationMinutes > 0
                    ? formatMinutes(habit.defaultDurationMinutes)
                    : null;

                if (yearSummary.goalMinutes === 0) {
                  return (
                    <article
                      className="time-goal-card time-goal-card--simple"
                      key={habit.id}
                      style={{ '--habit-color': color } as CSSProperties}
                    >
                      <div className="time-goal-card__title">
                        <span className="filter-pill__dot" />
                        <HabitIconView habit={habit} />
                        <div>
                          <h2>{habit.name}</h2>
                          <p>{year} time</p>
                        </div>
                      </div>
                      <p className="time-goal-card__summary">
                        {formatMinutes(yearSummary.loggedMinutes)} logged in {year}
                      </p>
                      {periodContributionLabel ? (
                        <p className="time-goal-card__subtle">
                          {periodContributionLabel}: {formatMinutes(periodSummary.loggedMinutes)}
                        </p>
                      ) : null}
                      {onEditHabit ? (
                        <button
                          className="button button--quiet time-goal-card__action"
                          type="button"
                          onClick={() => onEditHabit(habit.id)}
                        >
                          Add yearly goal
                        </button>
                      ) : (
                        <span className="time-goal-card__subtle">Add yearly goal</span>
                      )}
                    </article>
                  );
                }

                return (
                  <article
                    className="time-goal-card"
                    key={habit.id}
                    style={{ '--habit-color': color } as CSSProperties}
                  >
                    <div className="time-goal-card__title">
                      <span className="filter-pill__dot" />
                      <HabitIconView habit={habit} />
                      <div>
                        <h2>{habit.name}</h2>
                        <p>{year} time goal</p>
                      </div>
                    </div>
                    {periodContributionLabel ? (
                      <p className="time-goal-card__subtle">
                        {periodContributionLabel}: {formatMinutes(periodSummary.loggedMinutes)}
                      </p>
                    ) : null}
                    <span className="time-goal-card__label">Year total</span>
                    <div className="time-goal-card__main">
                      <strong>
                        {formatMinutes(yearSummary.loggedMinutes)} / {formatMinutes(yearSummary.goalMinutes)}
                      </strong>
                      <span>{progressPercent}%</span>
                    </div>
                    <span
                      className="time-goal-card__bar"
                      role="progressbar"
                      aria-label={`${progressPercent}% of yearly goal`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={visualPercent}
                      aria-valuetext={`${progressPercent}% complete`}
                    >
                      <span style={{ width: `${visualPercent}%` }} />
                    </span>
                    <div className="time-goal-card__remaining">
                      {yearSummary.goalReached
                        ? 'Goal reached'
                        : `${formatMinutes(yearSummary.remainingMinutes)} remaining`}
                    </div>
                    {defaultSessionLabel ? (
                      <p className="time-goal-card__subtle">
                        Approximately {yearSummary.remainingSessions} sessions at {defaultSessionLabel} each
                      </p>
                    ) : null}
                    {yearSummary.unknownDurationDays > 0 ? (
                      <p className="time-goal-row__note">
                        {pluralize(yearSummary.unknownDurationDays, 'completed day')}{' '}
                        {yearSummary.unknownDurationDays === 1 ? 'has' : 'have'} no time recorded
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ) : null}

          {!selectedHabit && allHabitYearGoalStats.length > 0 ? (
            <section className="time-goals time-goals--compact" aria-label="Time goals">
              <div className="time-goals__compact-header">
                <h2>Time goals</h2>
              </div>
              <div className="time-goal-rows">
                {allHabitYearGoalStats.map(({ habit, color, summary }) => {
                  const progressPercent = Math.round(summary.progressPercent * 100);
                  const visualPercent = Math.round(summary.visualProgressPercent * 100);

                  return (
                    <button
                      className="time-goal-row-button"
                      key={habit.id}
                      type="button"
                      style={{ '--habit-color': color } as CSSProperties}
                      onClick={() => setSelectedStatsId(habit.id)}
                    >
                      <span className="time-goal-row-button__habit">
                        <span className="filter-pill__dot" />
                        <HabitIconView habit={habit} />
                        <span>{habit.name}</span>
                      </span>
                      <span className="time-goal-row-button__value">
                        {formatMinutes(summary.loggedMinutes)} / {formatMinutes(summary.goalMinutes)}
                      </span>
                      <span
                        className="time-goal-row-button__bar"
                        aria-hidden="true"
                      >
                        <span style={{ width: `${visualPercent}%` }} />
                      </span>
                      <span className="time-goal-row-button__percent">{progressPercent}%</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <StatisticsCalendar
            range={range}
            anchorDate={anchorDate}
            habits={habits}
            checkIns={checkIns}
            selectedHabit={selectedHabit}
            selectedColor={selectedColor}
            showNoActivity={showNoActivity}
            today={today}
            onSetCheckIn={onSetCheckIn}
            onEditTime={onEditTime}
          />
        </>
    </section>
  );
};
