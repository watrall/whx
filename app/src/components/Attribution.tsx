import { Info } from 'lucide-react';
import { Fragment, useCallback, useRef, useState } from 'react';
import type { Basemap } from '../lib/basemaps.ts';
import { useDismiss } from '../lib/useDismiss.ts';

interface AttributionProps extends Pick<Basemap, 'credits' | 'sources'> {
  /** Smaller type, with the data providers behind an info button. */
  compact?: boolean;
  className?: string;
}

function SourcesInfo({ sources }: { sources: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  return (
    <span ref={rootRef} className="contents">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Map data sources"
        aria-expanded={open}
        className="focus-ring relative -my-1 grid h-5 w-5 shrink-0 place-items-center before:absolute before:-inset-3"
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </button>
      {open && (
        <p className="absolute bottom-full right-0 mb-1 w-max max-w-[240px] rounded-md border border-line bg-surface p-2 leading-snug shadow-card">
          {sources}
        </p>
      )}
    </span>
  );
}

export function Attribution({ credits, sources, compact = false, className = '' }: AttributionProps) {
  return (
    <div
      className={`flex items-center gap-1 leading-none text-muted ${compact ? 'text-[10px]' : 'text-xs'} ${className}`}
    >
      <p>
        {credits.map((credit, index) => (
          <Fragment key={credit.text}>
            {index > 0 && ' · '}
            {credit.href ? (
              <a
                href={credit.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line underline-offset-2 hover:text-ink"
              >
                {credit.text}
              </a>
            ) : (
              credit.text
            )}
          </Fragment>
        ))}
        {sources && !compact && ` · ${sources}`}
      </p>
      {sources && compact && <SourcesInfo sources={sources} />}
    </div>
  );
}
