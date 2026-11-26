import { useEffect, useRef, useState } from 'react';
import { Check, Download } from 'lucide-react';
import { pluralize } from '../lib/utils.ts';

interface ExportMenuProps {
  count: number;
  onExport: (format: 'csv' | 'geojson') => void;
  touch?: boolean;
}

/** Downloads the current results. Descriptions are left out: they are UNESCO's text under CC BY-SA. */
export function ExportMenu({ count, onExport, touch = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
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

  // The button shows a check for a moment, so it is clear the download started.
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 2000);
    return () => window.clearTimeout(timer);
  }, [done]);

  const choose = (format: 'csv' | 'geojson') => {
    onExport(format);
    setOpen(false);
    setDone(true);
  };

  const item =
    'focus-ring flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-ink transition hover:bg-canvas';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Export these results"
        title={done ? 'Download started' : 'Export these results'}
        className={`focus-ring grid place-items-center border border-line bg-surface text-muted transition hover:text-ink ${
          touch ? 'h-10 w-10 rounded-full' : 'h-9 w-9 rounded-md'
        }`}
      >
        {done ? (
          <Check className="h-4 w-4 text-ink" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <span role="status" className="sr-only">
        {done ? 'Download started' : ''}
      </span>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-line bg-surface p-1 shadow-float"
        >
          <p className="px-3 pb-1 pt-2 text-xs text-muted">Export {pluralize(count, 'site')}</p>
          <button type="button" role="menuitem" onClick={() => choose('csv')} className={item}>
            CSV (spreadsheet)
          </button>
          <button type="button" role="menuitem" onClick={() => choose('geojson')} className={item}>
            GeoJSON (maps and GIS)
          </button>
          <p className="px-3 pb-2 pt-1 text-xs leading-snug text-muted">
            Facts and links only. UNESCO descriptions are not included.
          </p>
        </div>
      )}
    </div>
  );
}
