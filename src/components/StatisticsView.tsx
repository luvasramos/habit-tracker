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
};

type HabitStat = {
  id: string;
  name: string;
  count: number;
  durationMinutes: number;
  percent: number;
  color: string;
  kind: 'habit' | 'inactive';
  habit?: Habit;
};

const noActivityId = '__no_activity__';
const donutRadius = 38;
const donutCircumference = 2 * Math.PI * donutRadius;
const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
const weekdayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StatisticsView = ({ habits, checkIns }: StatisticsViewProps) => {
  const [range, setRange] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(() =>
    habits.map((habit) => habit.id),
  );
  const [showNoActivity, setShowNoActivity] = useState(true);

  useEffect(() => {
    setSelectedHabitIds((current) => {
      const habitIds = habits.map((habit) => habit.id);
      const kept = current.filter((id) => habitIds.includes(id));
      const additions = habitIds.filter((id) => !current.includes(id));
      return [...kept, ...additions];
    });
  }, [habits]);

  const selectedHabits = habits.filter((habit) => selectedHabitIds.includes(habit.id));
  const rangeDays = useMemo(() => getRangeDays(range, anchorDate), [range, anchorDate]);
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
      percent: 0,
      color: getHabitColorVar(habit.id, habits),
      kind: 'habit',
      habit,
    };
  });
  const totalCompletions = habitStats.reduce((sum, stat) => sum + stat.count, 0);
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
  const eligibleDays = allHabitStats.eligibleDateKeys.length;
  const completionPercent = eligibleDays > 0 ? Math.round((activeDays / eligibleDays) * 100) : 0;
  const inactiveStat: HabitStat = {
    id: noActivityId,
    name: 'No activity',
    count: inactiveDays,
    durationMinutes: 0,
    percent: eligibleDays > 0 ? inactiveDays / eligibleDays : 0,
    color: 'var(--inactive)',
    kind: 'inactive',
  };
  const stats = habitStats.map((stat) => ({
    ...stat,
    percent: totalCompletions > 0 ? stat.count / totalCompletions : 0,
  }));
  const displayStats = showNoActivity ? [...stats, inactiveStat] : stats;
  const distributionTotal =
    stats.reduce((sum, stat) => sum + stat.count, 0) + (showNoActivity ? inactiveDays : 0);
  const hasVisibleSegments = displayStats.some((stat) => stat.count > 0);
  const nothingSelected = selectedHabits.length === 0 && !showNoActivity;
  const activityLabel = `${pluralize(activeDays, 'active day')} and ${pluralize(
    inactiveDays,
    'day with no activity',
    'days with no activity',
  )}`;
  let runningOffset = 0;

  const toggleHabit = (habitId: string) => {
    setSelectedHabitIds((current) =>
      current.includes(habitId)
        ? current.filter((id) => id !== habitId)
        : [...current, habitId],
    );
  };

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
      <div className="stats-toolbar">
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

      <div className="filter-row" aria-label="Statistics filters">
        {habits.map((habit) => (
          <button
            key={habit.id}
            className="filter-pill"
            type="button"
            aria-pressed={selectedHabitIds.includes(habit.id)}
            onClick={() => toggleHabit(habit.id)}
            style={{ '--habit-color': getHabitColorVar(habit.id, habits) } as CSSProperties}
          >
            <span className="filter-pill__dot" />
            <HabitIconView habit={habit} />
            {habit.name}
          </button>
        ))}
        <button
          className="filter-pill filter-pill--inactive"
          type="button"
          aria-pressed={showNoActivity}
          onClick={() => setShowNoActivity((value) => !value)}
          style={{ '--habit-color': 'var(--inactive)' } as CSSProperties}
        >
          <span className="filter-pill__dot" />
          No activity
        </button>
      </div>

      {nothingSelected ? (
        <div className="stats-empty stats-empty--compact">
          <span className="stats-empty__icon" aria-hidden="true">
            <Icon name="habits" />
          </span>
          <div className="stats-empty__copy">
            <h2>No data selected</h2>
            <p className="muted">Select a habit or no activity to compare the range.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-summary-grid">
            <div className="metric">
              <span>Active days</span>
              <strong>{activeDays}</strong>
            </div>
            {showNoActivity ? (
              <div className="metric metric--inactive">
                <span>No activity</span>
                <strong>{inactiveDays}</strong>
              </div>
            ) : null}
            <div className="metric">
              <span>Completion rate</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="metric">
              <span>Habit completions</span>
              <strong>{totalCompletions}</strong>
            </div>
            {totalDurationMinutes > 0 ? (
              <div className="metric">
                <span>Time logged</span>
                <strong>{formatMinutes(totalDurationMinutes)}</strong>
              </div>
            ) : null}
          </div>

          <div className="stats-view">
            <div className="donut-wrap">
              <svg
                className="donut"
                viewBox="0 0 120 120"
                role="img"
                aria-label={activityLabel}
              >
                <circle className="donut__track" cx="60" cy="60" r={donutRadius} />
                {displayStats
                  .filter((stat) => stat.count > 0)
                  .map((stat) => {
                    const segment = distributionTotal > 0 ? stat.count / distributionTotal : 0;
                    const offset = runningOffset;
                    runningOffset -= segment * donutCircumference;
                    return (
                      <circle
                        key={stat.id}
                        className={`donut__slice${stat.kind === 'inactive' ? ' donut__slice--inactive' : ''}`}
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        pathLength={donutCircumference}
                        strokeDasharray={`${segment * donutCircumference} ${donutCircumference}`}
                        strokeDashoffset={offset}
                        style={{ stroke: stat.color }}
                      />
                    );
                  })}
                {!hasVisibleSegments ? (
                  <circle className="donut__inactive" cx="60" cy="60" r={donutRadius} />
                ) : null}
              </svg>
              <div className="donut-total">
                <strong>{activeDays}</strong>
                <span>active days</span>
              </div>
            </div>

            <div className="stat-list">
              {displayStats.map((stat) => {
                const barPercent =
                  stat.kind === 'inactive'
                    ? stat.percent * 100
                    : totalCompletions > 0
                      ? stat.percent * 100
                      : 0;
                const label =
                  stat.kind === 'inactive'
                    ? `${stat.name}, ${pluralize(stat.count, 'day')}`
                    : `${stat.name}, ${pluralize(stat.count, 'day done', 'days done')}`;
                return (
                  <div
                    className={`stat-row${stat.kind === 'inactive' ? ' stat-row--inactive' : ''}`}
                    key={stat.id}
                    aria-label={label}
                    style={{ '--habit-color': stat.color } as CSSProperties}
                  >
                    <span className="stat-row__name">
                      {stat.habit ? (
                        <HabitIconView habit={stat.habit} />
                      ) : (
                        <span className="legend-dot" />
                      )}
                      {stat.name}
                    </span>
                    <span className="stat-row__bar" aria-hidden="true">
                      <span style={{ width: `${barPercent}%` }} />
                    </span>
                    <span className="stat-row__count">{stat.count}</span>
                    {stat.durationMinutes > 0 ? (
                      <span className="stat-row__time">{formatMinutes(stat.durationMinutes)}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {durationGoalStats.length > 0 ? (
            <section className="time-goals" aria-label="Time goals">
              <div className="time-goals__header">
                <h2>Time goals</h2>
                <p className="muted">
                  Known logged time for selected duration habits.
                </p>
              </div>
              <div className="time-goal-list">
                {durationGoalStats.map(({ habit, color, summary }) => {
                  const hasGoal = summary.goalMinutes > 0;
                  const progressPercent = Math.round(summary.progressPercent * 100);
                  const visualPercent = Math.round(summary.visualProgressPercent * 100);
                  const averageLabel =
                    summary.averageMinutesPerLoggedDay > 0
                      ? formatMinutes(summary.averageMinutesPerLoggedDay)
                      : '0m';
                  const defaultSessionLabel =
                    habit.defaultDurationMinutes && habit.defaultDurationMinutes > 0
                      ? formatMinutes(habit.defaultDurationMinutes)
                      : null;

                  return (
                    <article
                      className="time-goal-row"
                      key={habit.id}
                      style={{ '--habit-color': color } as CSSProperties}
                    >
                      <div className="time-goal-row__title">
                        <span className="filter-pill__dot" />
                        <HabitIconView habit={habit} />
                        <h3>{habit.name}</h3>
                      </div>
                      <div className="time-goal-row__main">
                        <span>
                          {formatMinutes(summary.loggedMinutes)}
                          {hasGoal ? ` / ${formatMinutes(summary.goalMinutes)}` : ' logged'}
                        </span>
                        {hasGoal && range === 'year' ? (
                          <span>{progressPercent}% complete</span>
                        ) : null}
                      </div>
                      {hasGoal && range === 'year' ? (
                        <span
                          className="time-goal-row__bar"
                          aria-label={`${progressPercent}% complete`}
                        >
                          <span style={{ width: `${visualPercent}%` }} />
                        </span>
                      ) : null}
                      <div className="time-goal-row__meta">
                        <span>{pluralize(summary.completedDays, 'completed day')}</span>
                        <span>{averageLabel} average logged day</span>
                        {defaultSessionLabel ? (
                          <span>{defaultSessionLabel} default session</span>
                        ) : null}
                        {hasGoal && range === 'year' ? (
                          <>
                            <span>
                              {summary.goalReached
                                ? 'Goal reached'
                                : `${formatMinutes(summary.remainingMinutes)} remaining`}
                            </span>
                            <span>
                              {summary.goalReached
                                ? '0 sessions remaining'
                                : `${summary.remainingSessions} sessions remaining`}
                            </span>
                          </>
                        ) : null}
                      </div>
                      {summary.unknownDurationDays > 0 ? (
                        <p className="time-goal-row__note">
                          {pluralize(summary.unknownDurationDays, 'completed day')}{' '}
                          {summary.unknownDurationDays === 1 ? 'has' : 'have'} no time logged
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
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
      )}
    </section>
  );
};
