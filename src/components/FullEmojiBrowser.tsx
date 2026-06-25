import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';

type FullEmojiBrowserProps = {
  selectedEmoji: string;
  suggestions: Array<{ emoji: string; label: string; keywords: string[] }>;
  onSelect: (emoji: string) => void;
  onBack: () => void;
};

type EmojiClickEvent = CustomEvent<{ unicode?: string; emoji?: { unicode?: string; string?: string } }>;

const canUseNativeEmojiPicker = () => {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  if (navigator.userAgent.toLocaleLowerCase().includes('jsdom')) {
    return false;
  }

  const canvas = document.createElement('canvas');
  try {
    return Boolean(canvas.getContext('2d'));
  } catch {
    return false;
  }
};

export const FullEmojiBrowser = ({
  selectedEmoji,
  suggestions,
  onSelect,
  onBack,
}: FullEmojiBrowserProps) => {
  const pickerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canUseNativeEmojiPicker()) {
      return undefined;
    }

    let cancelled = false;
    import('emoji-picker-element')
      .then(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) {
      return undefined;
    }

    const handleEmojiClick = (event: Event) => {
      const detail = (event as EmojiClickEvent).detail;
      const value = detail.unicode ?? detail.emoji?.unicode ?? detail.emoji?.string;
      if (value) {
        onSelect(value);
      }
    };

    picker.addEventListener('emoji-click', handleEmojiClick);
    return () => picker.removeEventListener('emoji-click', handleEmojiClick);
  }, [onSelect, loaded]);

  const filteredSuggestions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) {
      return suggestions.slice(0, 36);
    }

    return suggestions
      .filter((option) =>
        [option.emoji, option.label, ...option.keywords].some((value) =>
          value.toLocaleLowerCase().includes(normalized),
        ),
      )
      .slice(0, 36);
  }, [query, suggestions]);

  return (
    <section className="catalog-browser" aria-label="Browse all emoji">
      <div className="catalog-browser__header">
        <div>
          <h2>Browse all emoji</h2>
          <p className="muted">Search emoji by name, category, or keyword.</p>
        </div>
        <button className="button" type="button" onClick={onBack}>
          <Icon name="previous" />
          Back to editor
        </button>
      </div>
      <label className="field catalog-browser__search">
        <span>Search emoji</span>
        <input value={query} placeholder="japan, star, study, gym" onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="catalog-grid catalog-grid--emoji" aria-label="Emoji search results">
        {filteredSuggestions.map((option) => (
          <button
            className="selector-card emoji-choice"
            type="button"
            key={`${option.label}-${option.emoji}`}
            aria-label={option.label}
            aria-pressed={selectedEmoji === option.emoji}
            onClick={() => onSelect(option.emoji)}
          >
            <span>{option.emoji}</span>
          </button>
        ))}
      </div>
      {filteredSuggestions.length === 0 ? <p className="muted">No exact match. Try the full picker below.</p> : null}
      <div className="emoji-picker-shell">
        {!loaded ? <p className="muted">Loading emoji picker...</p> : null}
        {loaded
          ? createElement('emoji-picker', {
              ref: (node: HTMLElement | null) => {
                pickerRef.current = node;
              },
              class: 'full-emoji-picker',
            })
          : null}
      </div>
    </section>
  );
};
