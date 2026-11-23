import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ListFilter } from 'lucide-react';
import { useDismiss } from '../lib/useDismiss.ts';

interface FiltersMenuProps {
  /** How many of the folded filters are on. */
  activeCount: number;
  children: ReactNode;
}

/** One button that holds the extra filters when the strip is too narrow for them inline. */
export function FiltersMenu({ activeCount, children }: FiltersMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Horizontal nudge that keeps the panel inside the viewport.
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const panel = panelRef.current;
      const root = rootRef.current;
      if (!panel || !root) return;
      const margin = 8;
      const left = root.getBoundingClientRect().left;
      const width = panel.offsetWidth;
      const maxLeft = window.innerWidth - margin - width;
      setShift(Math.max(margin, Math.min(left, maxLeft)) - left);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  const active = activeCount > 0;
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`focus-ring inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium shadow-card transition ${
          active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink hover:bg-canvas'
        }`}
      >
        <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
        Filters
        {active && <span className="tabular-nums text-canvas/70">{activeCount}</span>}
      </button>
      {open && (
        <div
          ref={panelRef}
          style={{ left: shift }}
          className="absolute top-full z-30 mt-1 w-[320px] max-w-[calc(100vw-1rem)] space-y-2 rounded-xl border border-line bg-surface p-2 shadow-float"
        >
          {children}
        </div>
      )}
    </div>
  );
}
