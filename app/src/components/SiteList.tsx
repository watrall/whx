import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TriangleAlert } from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { TYPE_COLOR, siteMeta } from '../lib/utils.ts';
import { SiteThumb } from './SiteImage.tsx';

/** How long the list keeps the selected row centred after a selection, while the map settles. */
const SETTLE_MS = 1500;

interface SiteListProps {
  sites: Site[];
  selectedId: string | null;
  highlightedId: string | null;
  onSelect: (site: Site) => void;
  onHover: (site: Site | null) => void;
  rowHeight?: number;
  /** Scroll the list to the row of the site hovered on the map. Off for very long lists. */
  followHighlight?: boolean;
  /** Extra text after the site's meta line, such as a distance. */
  extraMeta?: (site: Site) => string | null;
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
  followHighlight = true,
  extraMeta,
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

  // Bring the selected row into view when the selection changes, such as a click on a map pin
  // while the list shows every site. The map often moves right after a selection, which changes
  // which sites the list holds, so keep the row centred while that settles.
  const lastSelectedRef = useRef<string | null>(null);
  const followUntilRef = useRef(0);
  useEffect(() => {
    if (!selectedId) {
      lastSelectedRef.current = null;
      return;
    }
    const index = sites.findIndex((site) => site.id === selectedId);
    if (index < 0) return;
    if (selectedId !== lastSelectedRef.current) {
      lastSelectedRef.current = selectedId;
      followUntilRef.current = Date.now() + SETTLE_MS;
    } else if (Date.now() > followUntilRef.current) {
      return;
    }
    // Wait a frame: on first mount the scroll area has not been measured yet.
    window.requestAnimationFrame(() => virtualizer.scrollToIndex(index, { align: 'center' }));
  }, [selectedId, sites, virtualizer]);

  useEffect(() => {
    if (!followHighlight || !highlightedId) return;
    const index = sites.findIndex((site) => site.id === highlightedId);
    if (index < 0) return;
    virtualizer.scrollToIndex(index, { align: 'auto' });
  }, [followHighlight, highlightedId, sites, virtualizer]);

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
              className={`focus-ring absolute left-0 top-0 flex w-full items-center gap-3 border-b border-line/60 px-4 text-left transition-colors ${
                selected
                  ? 'bg-sunken'
                  : highlighted
                    ? 'bg-canvas'
                    : 'bg-surface hover:bg-canvas'
              }`}
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <SiteThumb
                site={site}
                size="sm"
                className={selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-sunken' : ''}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium leading-tight text-ink">
                  {site.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5 truncate text-xs leading-none text-muted">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink/10"
                    style={{ backgroundColor: TYPE_COLOR[site.type] }}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {[siteMeta(site), extraMeta?.(site)].filter(Boolean).join(' · ')}
                  </span>
                  {site.danger && (
                    <TriangleAlert
                      className="h-3.5 w-3.5 shrink-0 text-danger"
                      aria-label="In danger"
                    />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
