import { Play, X } from 'lucide-react';

interface PlayHintProps {
  onDismiss: () => void;
  placement: 'desktop' | 'mobile';
}

/**
 * A one-time note pointing at the timeline's play button. Playback is the best way into the
 * data and the button is small, so first-time visitors get a nudge. It never blocks the map
 * and goes away on its own, on dismissal, or when playback starts.
 */
export function PlayHint({ onDismiss, placement }: PlayHintProps) {
  const desktop = placement === 'desktop';
  return (
    <div
      role="note"
      className={`animate-fade-up z-[700] w-64 rounded-xl border border-line bg-surface p-3 shadow-float ${
        desktop
          ? 'absolute bottom-[124px] right-4'
          : 'fixed bottom-[calc(152px+env(safe-area-inset-bottom)+40px)] left-4'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-canvas">
          <Play className="h-3 w-3 fill-current" aria-hidden="true" />
        </span>
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
        className={`absolute h-3 w-3 rotate-45 border-b border-r border-line bg-surface ${
          desktop ? '-bottom-1.5 right-6' : '-bottom-1.5 left-9'
        }`}
      />
    </div>
  );
}
