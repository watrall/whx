import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Link2, X } from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { parseCriteria } from '../lib/criteria.ts';
import { TYPE_INK, TYPE_LABEL, TYPE_TINT, imageCreditUrl, siteMeta } from '../lib/utils.ts';
import { SiteImage } from './SiteImage.tsx';
import { TypeIcon } from './TypeIcon.tsx';

/** Wikidata descriptions are lowercase fragments; start them like a sentence. */
function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface SiteDetailProps {
  site: Site;
  onClose: () => void;
  variant?: 'desktop' | 'mobile';
  /** Position within the current results, to step through them. */
  position?: { index: number; total: number } | null;
  onStep?: (delta: -1 | 1) => void;
}

export function SiteDetail({
  site,
  onClose,
  variant = 'desktop',
  position = null,
  onStep,
}: SiteDetailProps) {
  const criteria = parseCriteria(site.criteria);
  const creditUrl = imageCreditUrl(site.image);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const dragStartRef = useRef<number | null>(null);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStartRef.current = event.clientY;
    dragYRef.current = 0;
    setDragging(true);
    setDragY(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const delta = Math.max(0, event.clientY - dragStartRef.current);
    dragYRef.current = delta;
    setDragY(delta);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const delta = dragYRef.current;
    dragStartRef.current = null;
    dragYRef.current = 0;
    setDragging(false);
    event.stopPropagation();
    if (delta > 80) {
      onClose();
      return;
    }
    setDragY(0);
  };

  const resetDrag = () => {
    dragStartRef.current = null;
    dragYRef.current = 0;
    setDragging(false);
    setDragY(0);
  };

  const mobile = variant === 'mobile';

  return (
    <div
      role="region"
      aria-label={site.name}
      className={`animate-fade-up flex flex-col overflow-hidden border border-line bg-surface shadow-float ${
        mobile
          ? 'fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[1100] max-h-[62dvh] rounded-2xl'
          : 'absolute right-6 top-6 z-[600] max-h-[calc(100%-3rem)] w-[400px] rounded-2xl'
      }`}
      style={
        mobile
          ? {
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition: dragging ? 'none' : 'transform 220ms ease, opacity 220ms ease',
              opacity: dragY > 0 ? Math.max(0.35, 1 - dragY / 400) : 1,
            }
          : undefined
      }
    >
      {mobile && (
        <div
          className="absolute left-1/2 top-0 z-20 flex h-11 w-11 -translate-x-1/2 touch-none select-none items-start justify-center pt-2"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={resetDrag}
          onLostPointerCapture={resetDrag}
        >
          <span className="h-1.5 w-11 rounded-full bg-line shadow-sm" />
        </div>
      )}

      <div
        className={`relative w-full shrink-0 overflow-hidden bg-sunken ${mobile ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
      >
        <SiteImage
          site={site}
          alt={site.name}
          loading="eager"
          className="h-full w-full"
        />
        {creditUrl && (
          <a
            href={creditUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-6 text-xs text-surface hover:underline"
          >
            Photo: Wikimedia Commons
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close site details"
          className="focus-ring absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin min-h-0 overflow-y-auto overscroll-contain p-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold leading-none"
          style={{
            backgroundColor: TYPE_TINT[site.type],
            color: TYPE_INK[site.type],
          }}
        >
          <TypeIcon type={site.type} className="h-3 w-3" />
          {TYPE_LABEL[site.type]}
        </span>

        <h2 className="mt-2 break-words text-xl font-medium leading-tight text-ink">
          {site.name}
        </h2>
        <p className="mt-1 text-xs text-muted">{siteMeta(site)}</p>

        {site.description && (
          <p className="mt-3 break-words text-sm leading-relaxed text-muted">{sentenceCase(site.description)}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
          <div>
            <dt className="text-muted">UNESCO ID</dt>
            <dd className="mt-0.5 font-medium text-ink">{site.unescoId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Inscribed</dt>
            <dd className="mt-0.5 font-medium text-ink">{site.year ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Country</dt>
            <dd className="mt-0.5 font-medium text-ink">{site.country || '—'}</dd>
          </div>
        </dl>

        {criteria.length > 0 && (
          <section className="mt-5" aria-labelledby={`criteria-${site.id}`}>
            <h3
              id={`criteria-${site.id}`}
              className="text-xs font-semibold uppercase tracking-[0.1em] text-muted"
            >
              Why it is listed
            </h3>
            <ul className="mt-2 space-y-2.5">
              {criteria.map((criterion) => (
                <li key={criterion.code} className="flex gap-3">
                  <span
                    className="mt-0.5 grid h-6 min-w-8 shrink-0 place-items-center rounded-md px-1.5 text-xs font-semibold tabular-nums"
                    style={{ backgroundColor: TYPE_TINT[site.type], color: TYPE_INK[site.type] }}
                  >
                    {criterion.code}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{criterion.label}</span>
                    <span className="block text-xs leading-snug text-muted">
                      {criterion.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="sr-only" role="status">
          {copied ? 'Link copied to clipboard' : ''}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {site.officialUrl && (
            <a
              href={site.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-canvas transition hover:bg-ink/90"
            >
              View on UNESCO
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink transition hover:bg-canvas"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <a
            href={`https://www.wikidata.org/wiki/${site.id}`}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink transition hover:bg-canvas"
          >
            Wikidata
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {position && onStep && (
        <nav
          className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-2 py-1.5"
          aria-label="Step through results"
        >
          <button
            type="button"
            onClick={() => onStep(-1)}
            disabled={position.index <= 0}
            className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-medium text-ink transition hover:bg-canvas disabled:text-muted/50 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-xs tabular-nums text-muted" aria-live="polite">
            {position.index + 1} of {position.total}
          </span>
          <button
            type="button"
            onClick={() => onStep(1)}
            disabled={position.index >= position.total - 1}
            className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-medium text-ink transition hover:bg-canvas disabled:text-muted/50 disabled:hover:bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
