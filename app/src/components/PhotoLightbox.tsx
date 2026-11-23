import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Site } from '../lib/types.ts';
import { useDialog } from '../lib/useDialog.ts';
import { useSwipe } from '../lib/useSwipe.ts';
import { PhotoCredit, PhotoDots } from './PhotoChrome.tsx';
import { withWidth } from './SiteImage.tsx';

const LARGE_WIDTH = 1920;
const CARD_WIDTH = 900;
const MARGIN = 24;
const MARGIN_SMALL = 12;
const SMALL_VIEWPORT = 640;

interface Size {
  w: number;
  h: number;
}

function fitFrame(natural: Size, viewport: Size) {
  const margin = viewport.w < SMALL_VIEWPORT ? MARGIN_SMALL : MARGIN;
  const scale = Math.min((viewport.w - margin * 2) / natural.w, (viewport.h - margin * 2) / natural.h);
  return { width: Math.round(natural.w * scale), height: Math.round(natural.h * scale) };
}

interface PhotoLightboxProps {
  site: Site;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function PhotoLightbox({ site, index, onIndexChange, onClose }: PhotoLightboxProps) {
  const { photos } = site;
  const photo = photos[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [viewport, setViewport] = useState<Size>({ w: window.innerWidth, h: window.innerHeight });

  const go = (next: number) => onIndexChange(Math.min(Math.max(next, 0), photos.length - 1));
  const swipe = useSwipe({ onSwipe: (direction) => go(index + direction) });

  useDialog(
    dialogRef,
    true,
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        go(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
      event.stopPropagation();
    },
    true,
  );

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    for (const neighbour of [photos[index - 1], photos[index + 1]]) {
      if (!neighbour) continue;
      new Image().src = withWidth(neighbour.url, CARD_WIDTH);
      new Image().src = withWidth(neighbour.url, LARGE_WIDTH);
    }
  }, [index, photos]);

  if (!photo) return null;
  const frame = natural ? fitFrame(natural, viewport) : null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${site.name}`}
      tabIndex={-1}
      className="animate-fade-in fixed inset-0 z-[1300] grid touch-pan-y place-items-center bg-ink/60 outline-none backdrop-blur-sm"
      onClick={() => {
        if (!swipe.wasDragged()) onClose();
      }}
      {...swipe.handlers}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-sunken shadow-float"
        style={frame ?? { width: 0, height: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <img
          key={`card-${photo.url}`}
          src={withWidth(photo.url, CARD_WIDTH)}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={(event) =>
            setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
        <img
          key={photo.url}
          src={withWidth(photo.url, LARGE_WIDTH)}
          alt={site.name}
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setLoaded(photo.url)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            loaded === photo.url ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/70 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="focus-ring absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface active:scale-95"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <PhotoCredit photo={photo} className="absolute bottom-3 left-4 max-w-[calc(100%-9rem)]" />
        {photos.length > 1 && (
          <PhotoDots
            count={photos.length}
            index={index}
            onChoose={onIndexChange}
            className="absolute bottom-0.5 right-2"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
