import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Site } from '../lib/types.ts';
import { TYPE_COLOR, siteMeta } from '../lib/utils.ts';
import { SiteThumb } from './SiteImage.tsx';

interface SiteListProps {
  sites: Site[];
  selectedId: string | null;
  highlightedId: string | null;
  onSelect: (site: Site) => void;
  onHover: (site: Site | null) => void;
  rowHeight?: number;
  emptyState?: ReactNode;
  className?: string;
}

export function SiteList({
  sites,
  selectedId,
  highlightedId,
  onSelect,
  onHover,
  rowHeight = 72,
  emptyState,
  className = '',
}: SiteListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sites.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    getItemKey: (index) => sites[index]?.id ?? index,
  });

  useEffect(() => {
    if (!highlightedId) return;
    const index = sites.findIndex((site) => site.id === highlightedId);
    if (index < 0) return;
    virtualizer.scrollToIndex(index, { align: 'auto' });
  }, [highlightedId, sites, virtualizer]);

  if (sites.length === 0) {
    return <div className={`h-full ${className}`}>{emptyState}</div>;
  }

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-y-auto overscroll-contain scroll-thin ${className}`}
      aria-label="Sites in view"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const site = sites[item.index];
          if (!site) return null;
          const selected = site.id === selectedId;
          const highlighted = site.id === highlightedId;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onSelect(site)}
              onMouseEnter={() => onHover(site)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(site)}
              onBlur={() => onHover(null)}
              aria-current={selected ? 'true' : undefined}
              aria-label={`${site.name}, ${siteMeta(site)}`}
              className={`focus-ring absolute left-0 top-0 flex w-full items-center gap-3 border-l-2 border-b border-line/60 px-4 text-left transition-colors ${
                selected
                  ? 'border-l-ink bg-ink/5'
                  : highlighted
                    ? 'border-l-transparent bg-canvas'
                    : 'border-l-transparent bg-surface hover:bg-canvas'
              }`}
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <SiteThumb site={site} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-tight text-ink">
                  {site.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] leading-none text-muted">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink/10"
                    style={{ backgroundColor: TYPE_COLOR[site.type] }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{siteMeta(site)}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
