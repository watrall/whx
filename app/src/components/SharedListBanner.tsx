import { ListChecks } from 'lucide-react';
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
