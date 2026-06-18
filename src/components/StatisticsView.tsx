import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { Habit, LocalDateKey, ViewMode } from '../state/types';
import { getWeekDays } from '../utils/calendar';
import {
  daysBetweenInclusive,
  fromLocalDateKey,
  isFutureDay,
  movePeriod,
  monthBounds,
  periodLabel,
  toLocalDateKey,
  yearBounds,
} from '../utils/dates';
import { Icon } from './Icon';
import type { CSSProperties } from 'react';

type StatisticsViewProps = {
  habits: Habit[];
  checkIns: Record<string, Record<LocalDateKey, true>>;
};

type HabitStat = {
  id: string;
  name: string;
  count: number;
  percent: number;
  color: string;
};

const accentNames = ['blue', 'forest', 'lavender', 'sage', 'acid', 'offwhite'] as const;
const donutRadius = 38;
const donutCircumference = 2 * Math.PI * donutRadius;
const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getRangeDays = (range: ViewMode, anchorDate: Date) => {
  if (range === 'week') {
    return getWeekDays(anchorDate).map((day) => day.date);
  }

  if (range === 'month') {
    const { start, end } = monthBounds(anchorDate);
    return daysBetweenInclusive(start, end);
  }

  const { start, end } = yearBounds(anchorDate);
  return daysBetweenInclusive(start, end);
};

export const StatisticsView = ({ habits, checkIns }: StatisticsViewProps) => {
  const [range, setRange] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(() =>
    habits.map((habit) => habit.id),
  );

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
  const measurableDays = useMemo(() => rangeDays.filter((day) => !isFutureDay(day)), [rangeDays]);
  const rangeKeys = useMemo(() => measurableDays.map(toLocalDateKey), [measurableDays]);
  const comparisonKeys = useMemo(() => rangeDays.map(toLocalDateKey), [rangeDays]);

  const habitStats: HabitStat[] = selectedHabits.map((habit, index) => {
    const count = rangeKeys.filter((key) => checkIns[habit.id]?.[key]).length;
    return {
      id: habit.id,
      name: habit.name,
      count,
      percent: 0,
      color: `var(--task-${accentNames[index % accentNames.length]})`,
    };
  });
  const totalCompletions = habitStats.reduce((sum, stat) => sum + stat.count, 0);
  const stats = habitStats.map((stat) => ({
    ...stat,
    percent: totalCompletions > 0 ? stat.count / totalCompletions : 0,
  }));
  const activeDays = rangeKeys.filter((key) =>
    selectedHabits.some((habit) => checkIns[habit.id]?.[key]),
  ).length;
  const inactiveDays = selectedHabits.length === 0 ? rangeKeys.length : rangeKeys.length - activeDays;
  const completionPercent = rangeKeys.length > 0 ? Math.round((activeDays / rangeKeys.length) * 100) : 0;
  const hasCompletions = totalCompletions > 0;
  const noHabitsSelected = habits.length > 0 && selectedHabits.length === 0;
  const activityLabel = `${pluralize(activeDays, 'completion day')} and ${pluralize(
    inactiveDays,
    'inactive day',
  )}`;
  let runningOffset = 0;

  const toggleHabit = (habitId: string) => {
    setSelectedHabitIds((current) =>
      current.includes(habitId)
        ? current.filter((id) => id !== habitId)
        : [...current, habitId],
    );
  };

  if (habits.length === 0) {
    return (
      <section className="stats-empty" aria-label="Statistics">
        <Icon name="stats" className="stats-empty__icon" />
        <p>No completed days yet.</p>
        <p className="muted">Add a habit and mark a day to see statistics.</p>
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

      <div className="filter-row" aria-label="Habit filters">
        {habits.map((habit, index) => (
          <button
            key={habit.id}
            className="filter-pill"
            type="button"
            aria-pressed={selectedHabitIds.includes(habit.id)}
            onClick={() => toggleHabit(habit.id)}
            style={{ '--habit-color': `var(--task-${accentNames[index % accentNames.length]})` } as CSSProperties}
          >
            <span className="filter-pill__dot" />
            {habit.name}
          </button>
        ))}
      </div>

      {noHabitsSelected ? (
        <div className="stats-empty stats-empty--compact">
          <Icon name="habits" className="stats-empty__icon" />
          <p>No habits selected.</p>
          <p className="muted">Select at least one habit to compare activity.</p>
        </div>
      ) : (
        <>
          <div className="stats-summary-grid">
            <div className="metric">
              <span>Completion days</span>
              <strong>{activeDays}</strong>
            </div>
            <div className="metric">
              <span>No activity</span>
              <strong>{inactiveDays}</strong>
            </div>
            <div className="metric">
              <span>Completion rate</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="metric">
              <span>Total completions</span>
              <strong>{totalCompletions}</strong>
            </div>
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
                {stats
                  .filter((stat) => stat.count > 0)
                  .map((stat) => {
                    const offset = runningOffset;
                    runningOffset -= stat.percent * donutCircumference;
                    return (
                      <circle
                        key={stat.id}
                        className="donut__slice"
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        pathLength={donutCircumference}
                        strokeDasharray={`${stat.percent * donutCircumference} ${donutCircumference}`}
                        strokeDashoffset={offset}
                        style={{ stroke: stat.color }}
                      />
                    );
                  })}
                {!hasCompletions ? <circle className="donut__inactive" cx="60" cy="60" r={donutRadius} /> : null}
              </svg>
              <div className="donut-total">
                <strong>{activeDays}</strong>
                <span>active days</span>
              </div>
            </div>

            <div className="stat-list">
              {stats.map((stat) => (
                <div
                  className="stat-row"
                  key={stat.id}
                  aria-label={`${stat.name}, ${pluralize(stat.count, 'completion')}`}
                  style={{ '--habit-color': stat.color } as CSSProperties}
                >
                  <span className="stat-row__name">
                    <span className="legend-dot" />
                    {stat.name}
                  </span>
                  <span className="stat-row__bar" aria-hidden="true">
                    <span style={{ width: `${stat.percent * 100}%` }} />
                  </span>
                  <span className="stat-row__count">{stat.count}</span>
                </div>
              ))}
              <div className="stat-row stat-row--inactive" aria-label={`No activity, ${inactiveDays} days`}>
                <span className="stat-row__name">
                  <span className="legend-dot legend-dot--inactive" />
                  No activity
                </span>
                <span className="stat-row__bar" aria-hidden="true">
                  <span style={{ width: `${rangeKeys.length > 0 ? (inactiveDays / rangeKeys.length) * 100 : 0}%` }} />
                </span>
                <span className="stat-row__count">{inactiveDays}</span>
              </div>
            </div>
          </div>

          {range === 'year' ? (
            <div className="comparison-section">
              <div className="comparison-legend" aria-label="Legend">
                {stats.map((stat) => (
                  <span key={stat.id} style={{ '--habit-color': stat.color } as CSSProperties}>
                    <span className="legend-dot" />
                    {stat.name}
                  </span>
                ))}
                <span>
                  <span className="legend-dot legend-dot--inactive" />
                  No activity
                </span>
              </div>
              <div className="habit-heatmap" aria-label="Yearly habit comparison">
                {stats.map((stat) => (
                  <div className="heatmap-row" key={stat.id}>
                    <span className="heatmap-row__label">{stat.name}</span>
                    <div
                      className="heatmap-row__cells"
                      style={
                        {
                          '--habit-color': stat.color,
                          gridTemplateColumns: `repeat(${comparisonKeys.length}, 10px)`,
                        } as CSSProperties
                      }
                    >
                      {comparisonKeys.map((key) => {
                        const completed = Boolean(checkIns[stat.id]?.[key]);
                        const future = isFutureDay(fromLocalDateKey(key));
                        return (
                          <span
                            key={key}
                            className={`heatmap-cell${completed ? ' is-active' : ''}${future ? ' is-future' : ''}`}
                            title={`${stat.name}, ${format(fromLocalDateKey(key), 'MMM d')}: ${
                              future ? 'future' : completed ? 'completed' : 'no activity'
                            }`}
                            aria-label={`${stat.name}, ${key}, ${
                              future ? 'future' : completed ? 'completed' : 'no activity'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};
