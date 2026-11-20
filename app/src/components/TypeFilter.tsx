import { Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SiteType } from '../lib/types.ts';
import { TYPE_COLOR, TYPE_LABEL, TYPE_ORDER, formatNumber } from '../lib/utils.ts';
import { TypeIcon } from './TypeIcon.tsx';

interface TypeFilterProps {
  types: Set<SiteType>;
  counts: Record<SiteType, number>;
  total: number;
  onToggle: (type: SiteType) => void;
  onClear: () => void;
  variant?: 'desktop' | 'mobile';
  /** Extra on/off filters (such as In danger), shown after the types. */
  extras?: ReactNode;
  className?: string;
}

export function TypeFilter({
  types,
  counts,
  total,
  onToggle,
  onClear,
  variant = 'desktop',
  extras,
  className = '',
}: TypeFilterProps) {
  const allActive = types.size === 0;

  if (variant === 'mobile') {
    return (
      <div
        className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}
        role="group"
        aria-label="Filter by site type"
      >
        <button
          type="button"
          onClick={onClear}
          aria-pressed={allActive}
          className={`focus-ring inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
            allActive
              ? 'border-ink bg-ink text-canvas'
              : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink'
          }`}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          All
          <span className={allActive ? 'text-canvas/70' : 'text-muted'}>{formatNumber(total)}</span>
        </button>
        {TYPE_ORDER.map((type) => {
          const active = types.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              aria-pressed={active}
              className={`focus-ring inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
                active
                  ? 'border-transparent text-canvas'
                  : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink'
              }`}
              style={active ? { backgroundColor: TYPE_COLOR[type] } : undefined}
            >
              <TypeIcon type={type} className="h-4 w-4" />
              {TYPE_LABEL[type]}
              <span className={active ? 'text-canvas/75' : 'text-muted'}>
                {formatNumber(counts[type])}
              </span>
            </button>
          );
        })}
        {extras}
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-canvas p-1.5 ${className}`}
        role="group"
        aria-label="Filter by site type"
      >
        <button
          type="button"
          onClick={onClear}
          aria-pressed={allActive}
          className={`focus-ring flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-xs font-medium transition ${
            allActive ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            All
          </span>
          <span className="text-xs tabular-nums text-muted">{formatNumber(total)}</span>
        </button>
        {TYPE_ORDER.map((type) => {
          const active = types.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              aria-pressed={active}
              className={`focus-ring flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-xs font-medium transition ${
                active ? 'text-canvas shadow-card' : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
              style={active ? { backgroundColor: TYPE_COLOR[type] } : undefined}
            >
              <span className="flex items-center gap-2">
                <TypeIcon type={type} className="h-3.5 w-3.5" />
                {TYPE_LABEL[type]}
              </span>
              <span className={`text-xs tabular-nums ${active ? 'text-canvas/75' : 'text-muted'}`}>
                {formatNumber(counts[type])}
              </span>
            </button>
          );
        })}
      </div>
      {extras && <div className="mt-2 grid grid-cols-2 gap-2">{extras}</div>}
    </>
  );
}
