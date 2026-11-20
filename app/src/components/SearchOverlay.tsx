import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { formatNumber, siteMeta } from '../lib/utils.ts';
import { SiteThumb } from './SiteImage.tsx';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  sites: Site[];
  selectedId: string | null;
  recent: string[];
  onSelect: (site: Site) => void;
  onClearRecent: () => void;
  mobile?: boolean;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchOverlay({
  open,
  onClose,
  query,
  onQueryChange,
  sites,
  selectedId,
  recent,
  onSelect,
  onClearRecent,
  mobile = false,
  className = '',
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => sites.slice(0, 20), [sites]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(0, results.length - 1));
    }
  }, [activeIndex, results.length]);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = (site: Site) => {
    onSelect(site);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, results.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      const site = results[activeIndex];
      if (site) {
        event.preventDefault();
        handleSelect(site);
      }
    }
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null,
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[1150] bg-ink/25 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search sites"
        onKeyDown={handlePanelKeyDown}
        onClick={(event) => event.stopPropagation()}
        className={
          mobile
            ? `flex h-full flex-col bg-surface ${className}`
            : `animate-fade-up mx-auto mt-20 flex max-h-[80vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float ${className}`
        }
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-label="Search sites"
            placeholder="Search sites or countries"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted/70 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="focus-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition hover:bg-canvas hover:text-ink"
          >
            {mobile ? 'Cancel' : <X className="h-4 w-4" />}
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {query === '' && recent.length > 0 && (
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="focus-ring text-xs font-medium text-muted transition hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      onQueryChange(term);
                      inputRef.current?.focus();
                    }}
                    className="focus-ring inline-flex h-8 items-center rounded-full border border-line bg-canvas px-3 text-xs text-ink transition hover:border-ink/20 hover:bg-surface"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 ? (
            <div id="search-results" role="listbox" aria-label="Search results">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  {formatNumber(sites.length)} {sites.length === 1 ? 'site' : 'sites'}
                </p>
                {sites.length > results.length && (
                  <p className="text-xs text-muted">Showing first {results.length}</p>
                )}
              </div>
              {results.map((site, index) => {
                const active = index === activeIndex;
                const selected = site.id === selectedId;
                return (
                  <button
                    key={site.id}
                    ref={active ? activeRowRef : undefined}
                    id={`search-result-${index}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    aria-label={`${site.name}, ${siteMeta(site)}`}
                    onClick={() => handleSelect(site)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-3 border-b border-line/60 px-4 py-2.5 text-left transition-colors ${
                      active ? 'bg-canvas' : 'bg-surface hover:bg-canvas/70'
                    }`}
                  >
                    <SiteThumb site={site} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-base font-medium leading-tight text-ink">
                        {site.name}
                      </span>
                      <span className="mt-1 block truncate text-xs leading-none text-muted">
                        {siteMeta(site)}
                      </span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-ink" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center px-6 py-12 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-canvas text-muted">
                <Search className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">No sites match</p>
              <p className="mt-1 max-w-[28ch] text-xs leading-relaxed text-muted">
                Try a country, a site name, or a broader keyword.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange('');
                    inputRef.current?.focus();
                  }}
                  className="focus-ring mt-3 inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {!mobile && (
          <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-2 text-xs text-muted">
            <span>↑↓ to navigate · ↵ to select · Esc to close</span>
            <span className="hidden sm:inline">Search runs across all sites</span>
          </div>
        )}
      </div>
    </div>
  );
}
