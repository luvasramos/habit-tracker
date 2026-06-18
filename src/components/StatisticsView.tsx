import type { Habit, LocalDateKey } from '../state/types';
import { Icon } from './Icon';

type StatisticsViewProps = {
  habits: Habit[];
  checkIns: Record<string, Record<LocalDateKey, true>>;
};

type HabitStat = {
  id: string;
  name: string;
  count: number;
  percent: number;
  dashOffset: number;
};

const radius = 38;
const circumference = 2 * Math.PI * radius;

export const StatisticsView = ({ habits, checkIns }: StatisticsViewProps) => {
  const total = habits.reduce(
    (sum, habit) => sum + Object.keys(checkIns[habit.id] ?? {}).length,
    0,
  );
  let runningOffset = 0;
  const stats: HabitStat[] = habits.map((habit) => {
    const count = Object.keys(checkIns[habit.id] ?? {}).length;
    const percent = total > 0 ? count / total : 0;
    const dashOffset = runningOffset;
    runningOffset -= percent * circumference;

    return {
      id: habit.id,
      name: habit.name,
      count,
      percent,
      dashOffset,
    };
  });

  const totalLabel = `${total} completed day${total === 1 ? '' : 's'} across all habits`;

  if (total === 0) {
    return (
      <section className="stats-empty" aria-label="Statistics">
        <Icon name="stats" className="stats-empty__icon" />
        <p>No completed days yet.</p>
        <p className="muted">Mark a day in the calendar to see habit counts here.</p>
      </section>
    );
  }

  return (
    <section className="stats-view" aria-label="Statistics">
      <div className="donut-wrap">
        <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={totalLabel}>
          <circle className="donut__track" cx="60" cy="60" r={radius} />
          {stats
            .filter((stat) => stat.count > 0)
            .map((stat, index) => (
              <circle
                key={stat.id}
                className="donut__slice"
                cx="60"
                cy="60"
                r={radius}
                pathLength={circumference}
                strokeDasharray={`${stat.percent * circumference} ${circumference}`}
                strokeDashoffset={stat.dashOffset}
                style={{ opacity: 0.95 - index * 0.12 }}
              />
            ))}
        </svg>
        <div className="donut-total">
          <strong>{total}</strong>
          <span>completed days</span>
        </div>
      </div>

      <div className="stat-list">
        {stats.map((stat) => (
          <div
            className="stat-row"
            key={stat.id}
            aria-label={`${stat.name}, ${stat.count} completed day${stat.count === 1 ? '' : 's'}`}
          >
            <span className="stat-row__name">{stat.name}</span>
            <span className="stat-row__count">{stat.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
