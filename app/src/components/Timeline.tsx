import { Pause, Play } from 'lucide-react';
import type { Site, YearRange } from '../lib/types.ts';
import { formatRange, pluralize } from '../lib/utils.ts';
import { MapTooltip } from './MapTooltip.tsx';
import { TimelineChart } from './TimelineChart.tsx';

interface TimelineProps {
  sites: Site[];
  domain: YearRange;
  value: YearRange;
  onChange: (range: YearRange) => void;
  playing: boolean;
  onTogglePlay: () => void;
  /** Gives the play button a faint pulse while the first-visit hint points at it. */
  nudgePlay?: boolean;
  speed: number;
  onCycleSpeed: () => void;
  count: number;
  className?: string;
}

/** The desktop timeline bar: the chart between the first and last year, with the range, speed and play. */
export function Timeline({
  sites,
  domain,
  value,
  onChange,
  playing,
  onTogglePlay,
  nudgePlay = false,
  speed,
  onCycleSpeed,
  count,
  className = '',
}: TimelineProps) {
  return (
    <div
      className={`relative h-[88px] border-t border-line bg-surface ${className}`}
      role="group"
      aria-label="Timeline of inscription years"
    >
      <div className="flex h-full items-center gap-2 px-4">
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted">{domain[0]}</span>
        <TimelineChart sites={sites} domain={domain} value={value} onChange={onChange} />
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted">{domain[1]}</span>
        <div className="ml-1 flex shrink-0 items-center gap-2">
          <div className="w-28 text-right tabular-nums">
            <div className="whitespace-nowrap text-xs leading-none text-muted">{formatRange(value)}</div>
            <div className="mt-1 whitespace-nowrap text-xs font-semibold leading-none text-ink">
              {pluralize(count, 'site')}
            </div>
          </div>
          <button
            type="button"
            onClick={onCycleSpeed}
            aria-label={`${speed}× playback speed, change`}
            className="group relative focus-ring grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold tabular-nums text-muted transition hover:bg-canvas hover:text-ink"
          >
            {speed}×<MapTooltip>Playback speed</MapTooltip>
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? 'Pause timeline' : 'Play timeline'}
            className={`group relative focus-ring grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${nudgePlay && !playing ? 'wh-nudge' : ''}`}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            <MapTooltip placement="aboveEnd">{playing ? 'Pause (Space)' : 'Play (Space)'}</MapTooltip>
          </button>
        </div>
      </div>
    </div>
  );
}
