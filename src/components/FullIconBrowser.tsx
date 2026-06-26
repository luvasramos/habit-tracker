import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import type { Habit, HabitIconName } from '../state/types';
import { habitIconOptions, HabitIconView } from '../utils/habitAppearance';
import { Icon } from './Icon';

type IconSearchResult = {
  icons?: string[];
  total?: number;
};

type IconPickerProps = {
  selectedIconId: string;
  previewColor: string;
  fallbackHabit: Pick<Habit, 'color'>;
  suggestedIconIds: string[];
  onSelect: (iconId: `tabler:${string}`) => void;
  onSelectLocal: (iconName: HabitIconName) => void;
};

const popularTablerIcons = [
  'tabler:star',
  'tabler:language',
  'tabler:book',
  'tabler:school',
  'tabler:barbell',
  'tabler:run',
  'tabler:moon',
  'tabler:wallet',
  'tabler:music',
  'tabler:flag',
  'tabler:world',
  'tabler:heart',
] as const;

const resultPageSize = 12;

const tablerAliasResults: Record<string, string[]> = {
  gym: ['tabler:barbell', 'tabler:run', 'tabler:stretching', 'tabler:heartbeat'],
  japan: ['tabler:flag', 'tabler:language', 'tabler:world', 'tabler:map-pin'],
  japanese: ['tabler:flag', 'tabler:language', 'tabler:world'],
  study: ['tabler:book', 'tabler:school', 'tabler:pencil', 'tabler:language'],
  finance: ['tabler:wallet', 'tabler:coin', 'tabler:chart-line', 'tabler:cash'],
  sleep: ['tabler:moon', 'tabler:bed', 'tabler:zzz'],
};

const normalizeIconName = (icon: string): `tabler:${string}` =>
  (icon.startsWith('tabler:') ? icon : `tabler:${icon}`) as `tabler:${string}`;

export const IconPicker = ({
  selectedIconId,
  previewColor,
  fallbackHabit,
  suggestedIconIds,
  onSelect,
  onSelectLocal,
}: IconPickerProps) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [icons, setIcons] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim().toLocaleLowerCase()), 240);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const aliases = tablerAliasResults[debouncedQuery] ?? [];

    if (!debouncedQuery) {
      setIcons([]);
      setStatus('ready');
      setPage(1);
      return undefined;
    }

    const runSearch = async () => {
      setStatus('loading');
      try {
        const params = new URLSearchParams({
          prefix: 'tabler',
          query: debouncedQuery,
          limit: '96',
        });
        const response = await fetch(`https://api.iconify.design/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Icon search failed');
        }
        const data = (await response.json()) as IconSearchResult;
        const merged = [...aliases, ...(data.icons ?? []).map(normalizeIconName)];
        const unique = Array.from(new Set(merged));
        if (!cancelled) {
          setIcons(unique);
          setPage(1);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setIcons(aliases);
          setPage(1);
          setStatus('error');
        }
      }
    };

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const suggestedIcons = useMemo(() => {
    const merged = [...suggestedIconIds, ...popularTablerIcons];
    return Array.from(new Set(merged)).slice(0, 6);
  }, [suggestedIconIds]);
  const displayedIcons = debouncedQuery ? icons : suggestedIcons;
  const visibleIcons = useMemo(
    () => displayedIcons.slice((page - 1) * resultPageSize, page * resultPageSize),
    [displayedIcons, page],
  );
  const pageCount = Math.max(1, Math.ceil(displayedIcons.length / resultPageSize));
  const fallbackIcons = habitIconOptions.slice(0, 12);
  const hasSearch = debouncedQuery.length > 0;

  return (
    <section className="icon-picker" aria-label="Icon picker">
      <label className="field icon-picker__search">
        <span>Search icons</span>
        <input value={query} placeholder="star, japan, study, gym" onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p className="icon-picker__label">{hasSearch ? 'Search results' : 'Suggested icons'}</p>
      {status === 'loading' ? <p className="muted">Loading icons...</p> : null}
      {status === 'error' ? (
        <div className="icon-picker__notice">
          <p className="muted">Icon search failed. Showing built-in icons.</p>
          <button className="button" type="button" onClick={() => setDebouncedQuery(query.trim().toLocaleLowerCase())}>
            Retry
          </button>
        </div>
      ) : null}
      {visibleIcons.length > 0 ? (
        <div className="selector-grid icon-choice-grid">
          {visibleIcons.map((iconId) => (
            <button
              className="selector-card icon-choice"
              type="button"
              key={iconId}
              aria-label={iconId.replace('tabler:', '').split('-').join(' ')}
              aria-pressed={selectedIconId === iconId}
              style={{ '--habit-color': previewColor } as CSSProperties}
              onClick={() => {
                if (iconId.startsWith('tabler:')) {
                  onSelect(normalizeIconName(iconId));
                } else {
                  onSelectLocal(iconId as HabitIconName);
                }
              }}
            >
              {iconId.startsWith('tabler:') ? (
                <IconifyIcon icon={iconId} width="1.2em" height="1.2em" />
              ) : (
                <HabitIconView habit={{ ...fallbackHabit, icon: { type: 'svg', name: iconId as HabitIconName } }} />
              )}
            </button>
          ))}
        </div>
      ) : null}
      {status === 'error' || visibleIcons.length === 0 ? (
        <div className="selector-grid icon-choice-grid" aria-label="Built-in fallback icons">
          {fallbackIcons.map((option) => (
            <button
              className="selector-card icon-choice"
              type="button"
              key={option.name}
              aria-label={option.label}
              aria-pressed={selectedIconId === option.name}
              style={{ '--habit-color': previewColor } as CSSProperties}
              onClick={() => onSelectLocal(option.name)}
            >
              <HabitIconView habit={{ ...fallbackHabit, icon: { type: 'svg', name: option.name } }} />
            </button>
          ))}
        </div>
      ) : null}
      {pageCount > 1 ? (
        <div className="selector-pagination">
          <button className="icon-button selector-pagination__button" type="button" aria-label="Previous icon results" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <Icon name="previous" />
          </button>
          <span>{page} / {pageCount}</span>
          <button className="icon-button selector-pagination__button" type="button" aria-label="Next icon results" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            <Icon name="next" />
          </button>
        </div>
      ) : null}
    </section>
  );
};
