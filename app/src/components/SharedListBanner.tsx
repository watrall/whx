import { ListChecks, X } from 'lucide-react';
import { pluralize } from '../lib/utils.ts';

interface SharedListBannerProps {
  count: number;
  /** How many of the shared sites the visitor has not saved yet. */
  unsaved: number;
  onSaveAll: () => void;
  onShowAll: () => void;
  className?: string;
}

/** Shown when the page was opened from a "Share list" link. */
export function SharedListBanner({
  count,
  unsaved,
  onSaveAll,
  onShowAll,
  className = '',
}: SharedListBannerProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-canvas p-3 text-sm text-ink ${className}`}
      role="status"
    >
      <p className="flex items-center gap-2 font-medium">
        <ListChecks className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        Shared list of {pluralize(count, 'site')}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveAll}
          disabled={unsaved === 0}
          className="focus-ring inline-flex min-h-9 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-canvas transition hover:bg-ink/90 disabled:bg-line-strong disabled:text-muted"
        >
          {unsaved === 0 ? 'All saved' : `Save ${unsaved === count ? 'all' : unsaved}`}
        </button>
        <button
          type="button"
          onClick={onShowAll}
          className="focus-ring inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
        >
          Show all sites
        </button>
      </div>
    </div>
  );
}

interface SharedListChipProps {
  count: number;
  unsaved: number;
  onSaveAll: () => void;
  onShowAll: () => void;
}

/** The same shared list, folded into a single control for the map strip. */
export function SharedListChip({ count, unsaved, onSaveAll, onShowAll }: SharedListChipProps) {
  return (
    <div
      className="inline-flex h-10 items-center gap-1 rounded-xl border border-line bg-surface pl-3 pr-1 text-xs font-medium text-ink shadow-card"
      role="group"
      aria-label={`Shared list of ${pluralize(count, 'site')}`}
    >
      <ListChecks className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
      <span className="pr-1">Shared list · {count}</span>
      <button
        type="button"
        onClick={onSaveAll}
        disabled={unsaved === 0}
        className="focus-ring inline-flex h-8 items-center rounded-lg bg-ink px-2.5 text-xs font-semibold text-canvas transition hover:bg-ink/90 disabled:bg-line-strong disabled:text-muted"
      >
        {unsaved === 0 ? 'All saved' : `Save ${unsaved === count ? 'all' : unsaved}`}
      </button>
      <button
        type="button"
        onClick={onShowAll}
        aria-label="Show all sites"
        title="Show all sites"
        className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
