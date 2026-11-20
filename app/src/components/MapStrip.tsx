import { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { useElementWidth } from '../lib/useElementWidth.ts';

interface MapStripProps {
  query: string;
  onQueryChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  /** The type filter; `compact` hides the labels and keeps icons and counts. */
  renderTypes: (compact: boolean) => ReactNode;
  /** The extra filters: all inline when `wide`; Saved and Criteria fold into a Filters menu otherwise. */
  renderFilters: (wide: boolean) => ReactNode;
  /** Active country, shared list, share button: shown only when relevant. */
  extras?: ReactNode;
  isFiltered: boolean;
  onReset: () => void;
}

// Widths of the strip itself, measured from the map area, not the window.
const WIDE_FROM = 1100;
const LABELS_FROM = 840;

/**
 * Search and filters floating over the top of the map. Each control carries
 * its own surface, so the map stays visible between them.
 */
export function MapStrip({
  query,
  onQueryChange,
  searchRef,
  renderTypes,
  renderFilters,
  extras,
  isFiltered,
  onReset,
}: MapStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(rootRef);
  const wide = width >= WIDE_FROM;
  const compact = width > 0 && width < LABELS_FROM;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-x-4 top-4 z-[550] flex flex-wrap items-start gap-2"
    >
      <div className="pointer-events-auto relative min-w-[200px] max-w-[340px] flex-1 basis-[280px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onQueryChange('');
          }}
          placeholder="Search sites or countries"
          aria-label="Search sites or countries"
          spellCheck={false}
          className="focus-ring h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-sm text-ink shadow-card placeholder:text-muted/80"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="focus-ring absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="pointer-events-auto">{renderTypes(compact)}</div>
      <div className="pointer-events-auto flex flex-wrap items-start gap-2">
        {renderFilters(wide)}
      </div>
      {extras && <div className="pointer-events-auto flex flex-wrap items-start gap-2">{extras}</div>}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="focus-ring pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink shadow-card transition hover:bg-canvas"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  );
}
