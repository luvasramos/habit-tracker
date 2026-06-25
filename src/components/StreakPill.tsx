import { Icon } from './Icon';

type StreakPillProps = {
  streak: number;
};

export const StreakPill = ({ streak }: StreakPillProps) => {
  const label = streak === 1 ? 'Current streak: 1 day' : `Current streak: ${streak} days`;

  return (
    <div className={`streak-pill${streak === 0 ? ' is-empty' : ''}`} aria-label={label} title={label}>
      <Icon name="flame" />
      <span>{streak}</span>
    </div>
  );
};
