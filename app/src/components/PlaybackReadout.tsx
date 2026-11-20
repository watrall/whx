import { formatNumber, pluralize } from '../lib/utils.ts';

interface PlaybackReadoutProps {
  year: number;
  added: number;
  className?: string;
}

/**
 * Big year counter shown while the timeline plays. Decorative: the timeline
 * sliders already expose the year to assistive tech, and announcing every
 * tick would be noise.
 */
export function PlaybackReadout({ year, added, className = '' }: PlaybackReadoutProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none animate-fade-in rounded-2xl border border-line bg-surface px-5 py-2.5 text-center shadow-card ${className}`}
    >
      <div className="text-4xl font-medium leading-none tracking-tight tabular-nums text-ink">
        {year}
      </div>
      <div className="mt-1.5 text-xs text-muted">
        {added > 0 ? `${pluralize(added, 'site')} inscribed` : `${formatNumber(0)} inscribed`}
      </div>
    </div>
  );
}
