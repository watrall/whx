import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
  Navigation,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { formatDistance } from '../lib/geo.ts';
import type { NearbySite } from '../lib/geo.ts';
import { criteriaFromCodes } from '../lib/criteria.ts';
import { TYPE_INK, TYPE_LABEL, TYPE_TINT, directionsUrl, formatNumber, unescoUrl } from '../lib/utils.ts';
import { DangerNote } from './DangerNote.tsx';
import { SiteDescription } from './SiteDescription.tsx';
import { PhotoCarousel } from './PhotoCarousel.tsx';
import { SiteThumb } from './SiteImage.tsx';
import { TypeIcon } from './TypeIcon.tsx';

interface SiteDetailProps {
  site: Site;
  onClose: () => void;
  variant?: 'desktop' | 'mobile';
  /** Position within the current results, to step through them. */
  position?: { index: number; total: number } | null;
  onStep?: (delta: -1 | 1) => void;
  /** The closest other sites, nearest first. */
  nearby?: NearbySite[];
  /** "nearest" relabels the section when nothing is within day-trip distance. */
  nearbyMode?: 'nearby' | 'nearest';
  onSelectNearby?: (site: Site) => void;
  saved?: boolean;
  onToggleSaved?: () => void;
  /** Filter the map to one of the site's countries. */
  onFilterCountry?: (country: string) => void;
  /** Sites inscribed in this year or later get a "New" badge. */
  newFromYear?: number;
}

export function SiteDetail({
  site,
  onClose,
  variant = 'desktop',
  position = null,
  onStep,
  nearby = [],
  nearbyMode = 'nearby',
  onSelectNearby,
  saved = false,
  onToggleSaved,
  onFilterCountry,
  newFromYear,
}: SiteDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // A soft fade at the foot of the card shows there is more to read below.
  const [moreBelow, setMoreBelow] = useState(false);

  // Stepping or picking a nearby site swaps the content in place; start at the top.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0 });
    const update = () => setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    update();
    el.addEventListener('scroll', update, { passive: true });
    // Content changes height when the description expands or the card is resized.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [site.id]);

  const criteria = criteriaFromCodes(site.criteriaCodes);
  const officialUrl = unescoUrl(site);
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
  // One height for every action button; 44px on touch.
  const action = mobile ? 'min-h-11' : 'min-h-10';
  const secondary =
    'focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 text-xs font-medium text-ink transition hover:bg-canvas';

  return (
    <div
      role="region"
      aria-label={site.name}
      className={`animate-fade-up flex flex-col overflow-hidden border border-line bg-surface shadow-float ${
        mobile
          ? 'fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[1100] max-h-[var(--card-max)] rounded-2xl'
          : 'absolute right-6 top-[4.5rem] z-[600] max-h-[calc(100%-6rem)] w-[400px] rounded-2xl'
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
        className={`relative w-full shrink-0 overflow-hidden bg-sunken ${
          mobile ? 'aspect-[16/9]' : 'aspect-[3/2] [@media(max-height:900px)]:aspect-[16/9]'
        }`}
      >
        <PhotoCarousel site={site} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close site details"
          className="focus-ring absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-col">
        <div ref={scrollRef} className="scroll-thin min-h-0 overflow-y-auto overscroll-contain p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold leading-none"
              style={{
                backgroundColor: TYPE_TINT[site.type],
                color: TYPE_INK[site.type],
              }}
            >
              <TypeIcon type={site.type} className="h-3.5 w-3.5" />
              {TYPE_LABEL[site.type]}
            </span>
            {newFromYear !== undefined && site.year !== null && site.year >= newFromYear && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-ink px-2.5 text-xs font-semibold leading-none text-ink">
                New in {site.year}
              </span>
            )}
            {site.danger && (
              <span
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-danger px-2.5 text-xs font-semibold leading-none text-canvas"
                title="Listed by UNESCO as World Heritage in Danger"
              >
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                In danger
              </span>
            )}
          </div>

          <h2 className="mt-3 text-balance break-words text-xl font-medium leading-tight text-ink">
            {site.name}
          </h2>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            {site.countries.length > 0 && onFilterCountry
              ? site.countries.map((name, index) => (
                  <span key={name}>
                    {index > 0 && ', '}
                    <button
                      type="button"
                      onClick={() => onFilterCountry(name)}
                      title={`Show only sites in ${name}`}
                      className="focus-ring rounded text-left underline decoration-line-strong underline-offset-2 transition hover:text-ink hover:decoration-ink"
                    >
                      {name}
                    </button>
                  </span>
                ))
              : site.countries.length > 0
                ? site.countries.join(', ')
                : site.country}
            {site.year !== null && (
              <>
                {(site.countries.length > 0 || site.country) && ' · '}
                Inscribed {site.year}
              </>
            )}
          </p>

          <DangerNote site={site} />

          {site.parts > 1 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Made up of {site.parts} places, all shown on the map
            </p>
          )}

          <p className="sr-only" role="status">
            {copied ? 'Link copied to clipboard' : ''}
          </p>
          <div className="mt-4 space-y-2">
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
                className={`focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 ${action}`}
              >
                View on UNESCO
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={directionsUrl(site)}
                target="_blank"
                rel="noreferrer"
                className={`${secondary} ${action}`}
              >
                <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Directions
              </a>
              {onToggleSaved && (
                <button
                  type="button"
                  onClick={onToggleSaved}
                  aria-pressed={saved}
                  className={`${secondary} ${action} ${saved ? 'border-ink bg-ink/5' : ''}`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 shrink-0 ${saved ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  {saved ? 'Saved' : 'Save'}
                </button>
              )}
              <button type="button" onClick={copyLink} className={`${secondary} ${action}`}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          <SiteDescription site={site} />

          {criteria.length > 0 && (
            <section className="mt-6" aria-labelledby={`criteria-${site.id}`}>
              <h3
                id={`criteria-${site.id}`}
                className="text-xs font-semibold uppercase tracking-[0.1em] text-muted"
              >
                Why it is listed
              </h3>
              <ul className="mt-2.5 space-y-3">
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
                      <span className="block text-xs leading-snug text-muted">{criterion.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {nearby.length > 0 && onSelectNearby && (
            <section className="mt-6" aria-labelledby={`nearby-${site.id}`}>
              <h3
                id={`nearby-${site.id}`}
                className="text-xs font-semibold uppercase tracking-[0.1em] text-muted"
              >
                {nearbyMode === 'nearby' ? 'Nearby' : 'Nearest sites'}
              </h3>
              <ul className="mt-2 space-y-1">
                {nearby.map(({ site: other, km }) => (
                  <li key={other.id}>
                    <button
                      type="button"
                      onClick={() => onSelectNearby(other)}
                      className="focus-ring -mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-canvas"
                    >
                      <SiteThumb site={other} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-tight text-ink">
                          {other.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {formatDistance(km)} away · {TYPE_LABEL[other.type]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            UNESCO ID {site.id}
            {site.qid && (
              <>
                {' · '}Photo and links from{' '}
                <a
                  href={`https://www.wikidata.org/wiki/${site.qid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line-strong underline-offset-2 hover:text-ink"
                >
                  Wikidata {site.qid}
                </a>
              </>
            )}
          </p>
        </div>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent transition-opacity duration-200 ${
            moreBelow ? 'opacity-100' : 'opacity-0'
          }`}
        />
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
            {formatNumber(position.index + 1)} of {formatNumber(position.total)}
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
