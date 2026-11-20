import { useMemo, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { Pause, Play } from 'lucide-react';
import type { Site, SiteType, YearRange } from '../lib/types.ts';
import { TYPE_COLOR, TYPE_ORDER, formatNumber, formatRange, pluralize } from '../lib/utils.ts';

interface TimelineProps {
  sites: Site[];
  domain: YearRange;
  value: YearRange;
  onChange: (range: YearRange) => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed?: number;
  onCycleSpeed?: () => void;
  count: number;
  compact?: boolean;
  className?: string;
}

type Handle = 'start' | 'end';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function Timeline({
  sites,
  domain,
  value,
  onChange,
  playing,
  onTogglePlay,
  speed = 1,
  onCycleSpeed,
  count,
  compact = false,
  className = '',
}: TimelineProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Handle | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const years = domain[1] - domain[0] + 1;
  const barWidth = 1000 / years;

  const yearCounts = useMemo(() => {
    const counts = new Map<number, Record<SiteType, number>>();
    for (const site of sites) {
      if (site.year === null) continue;
      if (site.year < domain[0] || site.year > domain[1]) continue;
      let entry = counts.get(site.year);
      if (!entry) {
        entry = { cultural: 0, natural: 0, mixed: 0 };
        counts.set(site.year, entry);
      }
      entry[site.type] += 1;
    }
    return counts;
  }, [sites, domain]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const counts of yearCounts.values()) {
      const total = counts.cultural + counts.natural + counts.mixed;
      if (total > max) max = total;
    }
    return max;
  }, [yearCounts]);

  const bars: ReactNode[] = [];
  for (let index = 0; index < years; index += 1) {
    const year = domain[0] + index;
    const counts = yearCounts.get(year);
    if (!counts) continue;
    const total = counts.cultural + counts.natural + counts.mixed;
    if (total === 0) continue;
    const totalHeight = maxCount > 0 ? (total / maxCount) * 48 : 0;
    const culturalHeight = (counts.cultural / total) * totalHeight;
    const naturalHeight = (counts.natural / total) * totalHeight;
    const mixedHeight = (counts.mixed / total) * totalHeight;
    const x = index * barWidth;
    const width = Math.max(barWidth - 0.6, 0.4);
    let y = 48;
    if (culturalHeight > 0) {
      y -= culturalHeight;
      bars.push(
        <rect key={`${year}-c`} x={x} y={y} width={width} height={culturalHeight} fill={TYPE_COLOR.cultural} rx={0.4} />,
      );
    }
    if (naturalHeight > 0) {
      y -= naturalHeight;
      bars.push(
        <rect key={`${year}-n`} x={x} y={y} width={width} height={naturalHeight} fill={TYPE_COLOR.natural} rx={0.4} />,
      );
    }
    if (mixedHeight > 0) {
      y -= mixedHeight;
      bars.push(
        <rect key={`${year}-m`} x={x} y={y} width={width} height={mixedHeight} fill={TYPE_COLOR.mixed} rx={0.4} />,
      );
    }
  }

  const decadeLines: ReactNode[] = [];
  for (let year = Math.ceil(domain[0] / 10) * 10; year <= domain[1]; year += 10) {
    const x = ((year - domain[0]) / years) * 1000;
    decadeLines.push(
      <line
        key={year}
        x1={x}
        y1={0}
        x2={x}
        y2={48}
        style={{ stroke: 'oklch(var(--rule))' }}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />,
    );
  }

  const startPct = ((value[0] - domain[0]) / years) * 100;
  const endPct = ((value[1] - domain[0] + 1) / years) * 100;

  const yearFromClientX = (clientX: number, rect: DOMRect): number => {
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 0.999999);
    return domain[0] + Math.floor(ratio * years);
  };

  const onHandleKeyDown = (handle: Handle, event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    if (handle === 'start') {
      let nextStart = value[0];
      if (event.key === 'ArrowLeft') nextStart = Math.max(domain[0], value[0] - step);
      else if (event.key === 'ArrowRight') nextStart = Math.min(value[1], value[0] + step);
      else if (event.key === 'Home') nextStart = domain[0];
      else if (event.key === 'End') nextStart = value[1];
      else return;
      event.preventDefault();
      if (nextStart !== value[0]) onChange([nextStart, value[1]]);
      return;
    }

    let nextEnd = value[1];
    if (event.key === 'ArrowLeft') nextEnd = Math.max(value[0], value[1] - step);
    else if (event.key === 'ArrowRight') nextEnd = Math.min(domain[1], value[1] + step);
    else if (event.key === 'Home') nextEnd = value[0];
    else if (event.key === 'End') nextEnd = domain[1];
    else return;
    event.preventDefault();
    if (nextEnd !== value[1]) onChange([value[0], nextEnd]);
  };

  const onHandlePointerDown = (handle: Handle, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (handle: Handle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current !== handle) return;
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const year = yearFromClientX(event.clientX, rect);
    if (handle === 'start') {
      const nextStart = Math.min(year, value[1]);
      if (nextStart !== value[0]) onChange([nextStart, value[1]]);
    } else {
      const nextEnd = Math.max(year, value[0]);
      if (nextEnd !== value[1]) onChange([value[0], nextEnd]);
    }
  };

  const onHandlePointerUp = (handle: Handle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current === handle) dragRef.current = null;
    event.stopPropagation();
  };

  const onHandlePointerCancel = () => {
    dragRef.current = null;
  };

  const onHandleLostPointerCapture = () => {
    dragRef.current = null;
  };

  const onHandleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const onChartClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const year = yearFromClientX(event.clientX, rect);
    const startDistance = Math.abs(year - value[0]);
    const endDistance = Math.abs(year - value[1]);
    if (startDistance <= endDistance) {
      const nextStart = Math.min(year, value[1]);
      if (nextStart !== value[0]) onChange([nextStart, value[1]]);
    } else {
      const nextEnd = Math.max(year, value[0]);
      if (nextEnd !== value[1]) onChange([value[0], nextEnd]);
    }
  };

  const onChartDoubleClick = () => {
    onChange([domain[0], domain[1]]);
  };

  const onChartPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (compact) return;
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const year = yearFromClientX(event.clientX, rect);
    setHoverYear(year);
    setHoverX(((event.clientX - rect.left) / rect.width) * 100);
  };

  const onChartPointerLeave = () => {
    setHoverYear(null);
  };

  const hoverCounts = hoverYear === null ? undefined : yearCounts.get(hoverYear);
  const hoverTotal = hoverCounts
    ? hoverCounts.cultural + hoverCounts.natural + hoverCounts.mixed
    : 0;

  const handleStart = (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Start year"
      aria-orientation="horizontal"
      aria-valuemin={domain[0]}
      aria-valuemax={domain[1]}
      aria-valuenow={value[0]}
      aria-valuetext={`${value[0]}`}
      title="Start year"
      className="focus-ring absolute top-0 bottom-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none"
      style={{ left: `${startPct}%` }}
      onKeyDown={(event) => onHandleKeyDown('start', event)}
      onPointerDown={(event) => onHandlePointerDown('start', event)}
      onPointerMove={(event) => onHandlePointerMove('start', event)}
      onPointerUp={(event) => onHandlePointerUp('start', event)}
      onPointerCancel={onHandlePointerCancel}
      onLostPointerCapture={onHandleLostPointerCapture}
      onClick={onHandleClick}
    >
      <span className="absolute left-1/2 top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-surface shadow-card" />
    </div>
  );

  const handleEnd = (
    <div
      role="slider"
      tabIndex={0}
      aria-label="End year"
      aria-orientation="horizontal"
      aria-valuemin={domain[0]}
      aria-valuemax={domain[1]}
      aria-valuenow={value[1]}
      aria-valuetext={`${value[1]}`}
      title="End year"
      className="focus-ring absolute top-0 bottom-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none"
      style={{ left: `${endPct}%` }}
      onKeyDown={(event) => onHandleKeyDown('end', event)}
      onPointerDown={(event) => onHandlePointerDown('end', event)}
      onPointerMove={(event) => onHandlePointerMove('end', event)}
      onPointerUp={(event) => onHandlePointerUp('end', event)}
      onPointerCancel={onHandlePointerCancel}
      onLostPointerCapture={onHandleLostPointerCapture}
      onClick={onHandleClick}
    >
      <span className="absolute left-1/2 top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-surface shadow-card" />
    </div>
  );

  return (
    <div
      className={`relative bg-surface ${compact ? 'h-14' : 'h-[88px] border-t border-line'} ${className}`}
      role="group"
      aria-label="Timeline of inscription years"
    >
      <div className={`flex h-full items-center gap-2 ${compact ? 'px-3' : 'px-4'}`}>
        {compact && (
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? 'Pause timeline' : 'Play timeline'}
            className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink active:scale-95"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
        )}
        <span
          className={`shrink-0 tabular-nums text-muted ${compact ? 'text-xs' : 'text-xs font-medium'}`}
        >
          {domain[0]}
        </span>
        <div
          ref={chartRef}
          className={`relative flex-1 ${compact ? 'h-9' : 'h-12'}`}
          onClick={onChartClick}
          onDoubleClick={onChartDoubleClick}
          onPointerMove={onChartPointerMove}
          onPointerLeave={onChartPointerLeave}
        >
          <svg
            viewBox="0 0 1000 48"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <line
              x1="0"
              y1="48"
              x2="1000"
              y2="48"
              style={{ stroke: 'oklch(var(--rule))' }}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {bars}
            {decadeLines}
          </svg>
          <div
            className="pointer-events-none absolute inset-y-0 bg-canvas/70"
            style={{ left: 0, width: `${startPct}%` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 bg-canvas/70"
            style={{ left: `${endPct}%`, right: 0 }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 border-x border-ink/20 bg-ink/[0.04]"
            style={{ left: `${startPct}%`, width: `${Math.max(endPct - startPct, 0)}%` }}
          />
          {handleStart}
          {handleEnd}
          {hoverYear !== null && !compact && (
            <div
              className="pointer-events-none absolute bottom-full z-[1000] mb-2 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-canvas shadow-float"
              style={{ left: `${hoverX}%` }}
              aria-hidden="true"
            >
              <div className="text-xs font-semibold leading-none">{hoverYear}</div>
              <div className="mt-1 text-xs leading-none text-canvas/70">
                {pluralize(hoverTotal, 'site')}
              </div>
              {hoverCounts && (
                <div className="mt-1.5 flex items-center gap-2 text-xs leading-none">
                  {TYPE_ORDER.map((type) =>
                    hoverCounts[type] > 0 ? (
                      <span key={type} className="inline-flex items-center gap-1 text-canvas/80">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLOR[type] }}
                        />
                        {hoverCounts[type]}
                      </span>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <span
          className={`shrink-0 tabular-nums text-muted ${compact ? 'text-xs' : 'text-xs font-medium'}`}
        >
          {domain[1]}
        </span>
        {!compact && (
          <div className="ml-1 flex shrink-0 items-center gap-2">
            <div className="text-right">
              <div className="text-xs leading-none text-muted">{formatRange(value)}</div>
              <div className="mt-1 text-xs font-semibold leading-none text-ink">
                {pluralize(count, 'site')}
              </div>
            </div>
            {onCycleSpeed && (
              <button
                type="button"
                onClick={onCycleSpeed}
                aria-label={`${speed}× playback speed, change`}
                title="Playback speed"
                className="focus-ring grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold tabular-nums text-muted transition hover:bg-canvas hover:text-ink"
              >
                {speed}×
              </button>
            )}
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={playing ? 'Pause timeline' : 'Play timeline'}
              title={playing ? 'Pause timeline (Space)' : 'Play timeline (Space)'}
              className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
