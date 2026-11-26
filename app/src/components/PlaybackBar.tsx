import { Pause } from 'lucide-react';
import type { Explorer } from '../lib/useExplorer.ts';

const SPEED_BUTTON =
  'focus-ring relative grid h-9 min-w-10 place-items-center rounded-full bg-sunken px-2.5 text-sm font-semibold tabular-nums text-ink before:absolute before:-inset-y-1 before:inset-x-0';

/** What replaces the tray while the timeline plays: pause, a progress line and the speed. */
export function PlaybackBar({ e }: { e: Explorer }) {
  const [first, last] = e.domain;
  const progress = ((e.yearRange[1] - first) / (last - first)) * 100;
  return (
    <div
      role="group"
      aria-label="Playback"
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-[850] flex h-16 animate-fade-up items-center gap-3 rounded-2xl border border-line bg-surface pl-2.5 pr-3.5 shadow-float"
    >
      <button
        type="button"
        onClick={e.togglePlay}
        aria-label="Pause timeline"
        className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-canvas active:scale-95"
      >
        <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
      </button>
      <span className="shrink-0 text-xs tabular-nums text-muted">{first}</span>
      <div aria-hidden="true" className="relative h-1.5 flex-1 rounded-full bg-line">
        <div className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${progress}%` }} />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-surface shadow-card"
          style={{ left: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted">{last}</span>
      <button
        type="button"
        onClick={e.cycleSpeed}
        aria-label={`${e.speed}× playback speed, change`}
        className={SPEED_BUTTON}
      >
        {e.speed}×
      </button>
    </div>
  );
}
