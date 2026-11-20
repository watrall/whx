import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ListFilter } from 'lucide-react';

interface FiltersMenuProps {
  /** How many of the folded filters are on. */
  activeCount: number;
  children: ReactNode;
}

/** One button that holds the extra filters when the strip is too narrow for them inline. */
export function FiltersMenu({ activeCount, children }: FiltersMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const active = activeCount > 0;
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`focus-ring inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium shadow-card transition ${
          active
            ? 'border-ink bg-ink text-canvas'
            : 'border-line bg-surface text-ink hover:bg-canvas'
        }`}
      >
        <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
        Filters
        {active && <span className="tabular-nums text-canvas/70">{activeCount}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[320px] space-y-2 rounded-xl border border-line bg-surface p-2 shadow-float">
          {children}
        </div>
      )}
    </div>
  );
}
