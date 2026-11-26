import { X } from 'lucide-react';

interface PlayHintProps {
  onDismiss: () => void;
  placement: 'desktop' | 'mobile';
}

/**
 * A one-time note pointing at the timeline's play button. It has no play icon of its own, so
 * it cannot be mistaken for the button. Playback is the best way into the
 * data and the button is small, so first-time visitors get a nudge. It never blocks the map
 * and goes away on its own, on dismissal, or when playback starts.
 */
export function PlayHint({ onDismiss, placement }: PlayHintProps) {
  const desktop = placement === 'desktop';
  return (
    <div
      role="note"
      className={`animate-fade-up w-64 rounded-xl border border-line-strong bg-surface p-3 shadow-float ${
        desktop
          ? 'absolute bottom-[124px] right-4 z-[700]'
          : 'fixed bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom)+48px)] left-4 z-[850]'
      }`}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
          Press play to watch the List grow, year by year.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss hint"
          className="focus-ring -mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {/* Arrow toward the play button. */}
      <span
        aria-hidden="true"
        className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-line bg-surface ${
          desktop ? 'right-3' : 'left-8'
        }`}
      />
    </div>
  );
}
