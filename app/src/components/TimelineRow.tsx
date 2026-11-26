import { ChevronDown, ChevronUp, Play, X } from 'lucide-react';
import { decadeTicks } from '../lib/timeline.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { formatRange, pluralize } from '../lib/utils.ts';
import { TimelineChart } from './TimelineChart.tsx';

interface TimelineRowProps {
  e: Explorer;
  /** Whether the tray is open: the button at the end then closes it. */
  open: boolean;
  onToggleTray: () => void;
}

/** The phone timeline, always in view at the top of the tray: play and the range, then a full-width chart with its years. */
export function TimelineRow({ e, open, onToggleTray }: TimelineRowProps) {
  const [first, last] = e.domain;
  const narrowed = e.yearRange[0] !== first || e.yearRange[1] !== last;
  const Chevron = open ? ChevronDown : ChevronUp;
  return (
    <div role="group" aria-label="Timeline of inscription years" className="px-4 pb-1">
      <div className="flex h-11 items-center gap-3">
        <button
          type="button"
          onClick={e.togglePlay}
          aria-label="Play timeline"
          className={`focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-canvas active:scale-95 ${e.showHint ? 'wh-nudge' : ''}`}
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm tabular-nums text-muted">
          <span className="font-semibold text-ink">{formatRange(e.yearRange)}</span> ·{' '}
          {pluralize(e.filtered.length, 'site')}
        </p>
        {narrowed && (
          <button
            type="button"
            onClick={() => e.changeRange([first, last])}
            aria-label="Reset years"
            className="focus-ring relative grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sunken text-ink before:absolute before:-inset-2.5"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleTray}
          aria-expanded={open}
          className="focus-ring -mr-2 inline-flex h-11 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-ink"
        >
          {open ? 'Hide' : 'Browse'}
          <Chevron className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <TimelineChart
        sites={e.timelineSites}
        domain={e.domain}
        value={e.yearRange}
        onChange={e.changeRange}
        hover={false}
        touch
        className="mx-2 mt-1 h-14"
      />
      <div aria-hidden="true" className="relative mx-2 mt-1 h-4 text-xs tabular-nums text-muted">
        {decadeTicks(e.domain).map((tick) => (
          <span key={tick.year} className="absolute -translate-x-1/2" style={{ left: `${tick.left}%` }}>
            {tick.year}
          </span>
        ))}
      </div>
    </div>
  );
}
