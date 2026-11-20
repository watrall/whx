import { LocateFixed, Shuffle } from 'lucide-react';

interface DiscoverActionsProps {
  onSurprise: () => void;
  onNearMe: () => void;
  /** Short message such as a denied location permission. */
  notice?: string | null;
  className?: string;
}

const BUTTON =
  'focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:bg-canvas active:scale-[0.98]';

/** Two low-key ways into the map for people who do not know what to search for. */
export function DiscoverActions({ onSurprise, onNearMe, notice, className = '' }: DiscoverActionsProps) {
  return (
    <div className={className}>
      <div className="flex gap-2">
        <button type="button" onClick={onSurprise} className={BUTTON}>
          <Shuffle className="h-4 w-4 text-muted" aria-hidden="true" />
          Surprise me
        </button>
        <button type="button" onClick={onNearMe} className={BUTTON}>
          <LocateFixed className="h-4 w-4 text-muted" aria-hidden="true" />
          Near me
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted empty:hidden" role="status">
        {notice ?? ''}
      </p>
    </div>
  );
}
