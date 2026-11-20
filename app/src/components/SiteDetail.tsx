import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { TYPE_INK, TYPE_LABEL, TYPE_TINT, siteMeta } from '../lib/utils.ts';
import { SiteImage } from './SiteImage.tsx';
import { TypeIcon } from './TypeIcon.tsx';

interface SiteDetailProps {
  site: Site;
  onClose: () => void;
  variant?: 'desktop' | 'mobile';
}

export function SiteDetail({ site, onClose, variant = 'desktop' }: SiteDetailProps) {
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
          : 'absolute right-6 top-6 z-[600] max-h-[calc(100%-3rem)] w-[360px] rounded-2xl'
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

      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-canvas">
        <SiteImage
          site={site}
          alt={site.name}
          loading="eager"
          className="h-full w-full"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close site details"
          className="focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface active:scale-95"
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

        <h2 className="mt-2 text-lg font-semibold leading-tight tracking-tight text-ink">
          {site.name}
        </h2>
        <p className="mt-1 text-xs text-muted">{siteMeta(site)}</p>

        {site.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{site.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
          <div>
            <dt className="text-muted">UNESCO ID</dt>
            <dd className="mt-0.5 font-medium text-ink">{site.unescoId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Criteria</dt>
            <dd className="mt-0.5 font-medium text-ink">{site.criteria ?? '—'}</dd>
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
    </div>
  );
}
