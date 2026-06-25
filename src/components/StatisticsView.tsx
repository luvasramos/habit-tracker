import { format } from 'date-fns';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CheckInsByHabit, Habit, LocalDateKey, ViewMode } from '../state/types';
import { getMonthCells } from '../utils/calendar';
import {
  fromLocalDateKey,
  isFutureDay,
  movePeriod,
  periodLabel,
} from '../utils/dates';
import { formatMinutes, isCompletedCheckIn } from '../utils/duration';
import { getHabitColorVar, HabitIconView } from '../utils/habitAppearance';
import {
  calculateAllHabitsStatistics,
  calculateHabitStatistics,
  getRangeDays,
  isHabitEligibleOnDate,
} from '../utils/statistics';
import { Icon } from './Icon';

type StatisticsViewProps = {
  habits: Habit[];
  checkIns: CheckInsByHabit;
  selectedHabitId: string | null;
  onEditHabit?: (habitId: string) => void;
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

export const StatisticsView = ({
  habits,
  checkIns,
  selectedHabitId,
  onEditHabit,
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
  const comparisonMonths = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(anchorDate.getFullYear(), month, 1)),
    [anchorDate],
  );
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

  const getSelectedCompletions = (dateKey: LocalDateKey) =>
    selectedHabits
      .filter(
        (habit) =>
          isHabitEligibleOnDate(habit, dateKey, today) &&
          isCompletedCheckIn(checkIns[habit.id]?.[dateKey]),
      )
      .map((habit) => ({
        habit,
        color: getHabitColorVar(habit.id, habits),
      }));

  if (habits.length === 0) {
    return (
      <section className="stats-empty" aria-label="Statistics">
        <span className="stats-empty__icon" aria-hidden="true">
          <Icon name="stats" />
        </span>
        <div className="stats-empty__copy">
          <h2>No statistics yet</h2>
          <p className="muted">Add a habit and mark a day to see the pattern.</p>
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

          {range === 'year' ? (
            <div className="comparison-section">
              <div className="year-months" aria-label="Yearly activity overview">
                {comparisonMonths.map((month) => (
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
                      {getMonthCells(month).map((cell) => {
                        if (!cell.inPeriod) {
                          return <span className="year-month-day is-outside" key={cell.key} aria-hidden="true" />;
                        }

                        const date = fromLocalDateKey(cell.key);
                        const future = isFutureDay(date);
                        const completions = getSelectedCompletions(cell.key);
                        const eligible = allHabitStats.eligibleDateKeys.includes(cell.key);
                        const inactive = !future && eligible && completions.length === 0;
                        const visibleInactive = inactive && showNoActivity;
                        const visibleCompletions = completions.slice(0, 4);
                        const title = `${format(date, 'MMM d')}: ${
                          future
                            ? 'future'
                            : completions.length > 0
                              ? completions.map(({ habit }) => habit.name).join(', ')
                              : 'no activity'
                        }`;

                        return (
                          <span
                            className={`year-month-day${visibleInactive ? ' is-inactive' : ''}${future ? ' is-future' : ''}`}
                            key={cell.key}
                            title={title}
                            aria-label={title}
                          >
                            {visibleCompletions.length > 0 ? (
                              <span className="year-month-day__dots" aria-hidden="true">
                                {visibleCompletions.map(({ habit, color }) => (
                                  <span
                                    className="year-month-day__dot"
                                    key={habit.id}
                                    style={{ '--dot-color': color } as CSSProperties}
                                  />
                                ))}
                              </span>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </>
    </section>
  );
};
