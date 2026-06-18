import type { ViewMode } from '../state/types';

type CalendarControlsProps = {
  view: ViewMode;
  label: string;
  onViewChange: (view: ViewMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

const views: ViewMode[] = ['week', 'month', 'year'];

export const CalendarControls = ({
  view,
  label,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarControlsProps) => (
  <section className="calendar-controls" aria-label="Calendar controls">
    <div className="segmented" aria-label="Calendar view">
      {views.map((item) => (
        <button
          key={item}
          type="button"
          className="segmented__button"
          aria-pressed={view === item}
          onClick={() => onViewChange(item)}
        >
          {item[0].toUpperCase() + item.slice(1)}
        </button>
      ))}
    </div>

    <div className="period-controls">
      <button className="icon-button" type="button" aria-label="Previous period" onClick={onPrevious}>
        ‹
      </button>
      <h2 className="period-label" aria-live="polite">
        {label}
      </h2>
      <button className="icon-button" type="button" aria-label="Next period" onClick={onNext}>
        ›
      </button>
      <button className="button button--quiet" type="button" onClick={onToday}>
        Today
      </button>
    </div>
  </section>
);
