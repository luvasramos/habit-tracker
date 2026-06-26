import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { RecommendationOption } from './RecommendationOption';

type FullEmojiBrowserProps = {
  selectedEmoji: string;
  suggestions: Array<{ emoji: string; label: string; keywords: string[] }>;
  recentEmoji: string[];
  onSelect: (emoji: string) => void;
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
  recentEmoji,
  onSelect,
}: FullEmojiBrowserProps) => {
  const pickerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Suggested');
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
    const recentOptions = recentEmoji
      .map((emoji) => suggestions.find((option) => option.emoji === emoji))
      .filter((option): option is (typeof suggestions)[number] => Boolean(option));
    const base =
      category === 'Recent'
        ? recentOptions
        : category === 'Suggested'
          ? suggestions
          : suggestions.filter((option) =>
              [option.label, ...option.keywords].some((value) =>
                value.toLocaleLowerCase().includes(category.toLocaleLowerCase()),
              ),
            );

    if (!normalized) {
      return base.slice(0, 6);
    }

    return base
      .filter((option) =>
        [option.emoji, option.label, ...option.keywords].some((value) =>
          value.toLocaleLowerCase().includes(normalized),
        ),
      )
      .slice(0, 36);
  }, [category, query, recentEmoji, suggestions]);

  const categoryOptions = ['Suggested', 'Recent', 'Language', 'Fitness', 'Study', 'Music', 'Finance', 'Sleep'];
  const recentOptions = recentEmoji
    .map((emoji) => suggestions.find((option) => option.emoji === emoji))
    .filter((option): option is (typeof suggestions)[number] => Boolean(option))
    .slice(0, 6);
  const recommendationOptions = (recentOptions.length > 0 ? recentOptions : suggestions).slice(0, 6);
  const recommendationLabel = recentOptions.length > 0 ? 'Recent emoji' : 'Suggested emoji';
  const isSearching = query.trim().length > 0;

  return (
    <section className="emoji-picker" aria-label="Emoji picker">
      <div className="emoji-picker__preview" aria-label="Selected emoji">
        <span>{selectedEmoji || '•'}</span>
        <span>{selectedEmoji ? 'Selected emoji' : 'No emoji selected'}</span>
      </div>
      {recommendationOptions.length > 0 && !isSearching ? (
        <div className="emoji-picker__recent" aria-label={recommendationLabel}>
          {recommendationOptions.map((option) => (
            <RecommendationOption
              className="emoji-choice"
              key={`${option.label}-${option.emoji}`}
              accessibleName={option.label}
              isSelected={selectedEmoji === option.emoji}
              onClick={() => onSelect(option.emoji)}
            >
              <span>{option.emoji}</span>
            </RecommendationOption>
          ))}
        </div>
      ) : null}
      <div className="emoji-picker-shell">
        {loaded
          ? createElement('emoji-picker', {
              ref: (node: HTMLElement | null) => {
                pickerRef.current = node;
              },
              class: 'full-emoji-picker',
            })
          : (
            <div className="emoji-picker__fallback">
              <label className="field emoji-picker__search">
                <span>Search emoji</span>
                <input
                  value={query}
                  placeholder="japan, star, study, gym"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="emoji-picker__categories" aria-label="Emoji categories">
                {categoryOptions.map((option) => (
                  <button
                    className="icon-picker__category"
                    type="button"
                    key={option}
                    aria-pressed={category === option}
                    onClick={() => setCategory(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="selector-grid emoji-grid" aria-label="Emoji search results">
                {filteredSuggestions.map((option) => (
                  <RecommendationOption
                    className="emoji-choice"
                    key={`${option.label}-${option.emoji}`}
                    accessibleName={option.label}
                    isSelected={selectedEmoji === option.emoji}
                    onClick={() => onSelect(option.emoji)}
                  >
                    <span>{option.emoji}</span>
                  </RecommendationOption>
                ))}
              </div>
              {filteredSuggestions.length === 0 ? <p className="muted">No exact match.</p> : null}
            </div>
          )}
      </div>
    </section>
  );
};
