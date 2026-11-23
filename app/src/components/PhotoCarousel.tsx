import { useState } from 'react';
import type { Site } from '../lib/types.ts';
import { useMediaQuery } from '../lib/useMediaQuery.ts';
import { useSitePhotos } from '../lib/useSitePhotos.ts';
import { useSwipe } from '../lib/useSwipe.ts';
import { PhotoCredit, PhotoDots } from './PhotoChrome.tsx';
import { PhotoLightbox } from './PhotoLightbox.tsx';
import { SiteImage } from './SiteImage.tsx';

const ADVANCE_MS = 5000;
const EDGE_RESISTANCE = 4;

export function PhotoCarousel({ site }: { site: Site }) {
  return <Carousel key={site.id} site={site} />;
}

function Carousel({ site }: { site: Site }) {
  const photos = useSitePhotos(site);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const last = photos.length - 1;
  const current = photos[index];
  const advancing = playing && !reducedMotion && index < last && !lightbox;
  const dragging = dragX !== 0;

  const choose = (next: number) => {
    setPlaying(false);
    setIndex(Math.min(Math.max(next, 0), last));
  };

  const open = () => {
    setPlaying(false);
    setLightbox(true);
  };

  const swipe = useSwipe({
    capture: true,
    onSwipe: (direction) => choose(index + direction),
    onDrag: (offset) => {
      const atEdge = (index === 0 && offset > 0) || (index === last && offset < 0);
      setDragX(last < 1 ? 0 : atEdge ? offset / EDGE_RESISTANCE : offset);
    },
  });

  return (
    <div
      className="absolute inset-0"
      role="group"
      aria-roledescription="carousel"
      aria-label={`Photos of ${site.name}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {current && (
        <button
          type="button"
          onClick={open}
          className="focus-ring sr-only z-20 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
        >
          View photo larger
        </button>
      )}
      <div
        className={`h-full w-full touch-pan-y overflow-hidden ${current ? 'cursor-zoom-in' : ''}`}
        onDragStart={(event) => event.preventDefault()}
        onClick={() => {
          if (current && !swipe.wasDragged()) open();
        }}
        {...swipe.handlers}
      >
        <div
          className={`flex h-full ${dragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}
        >
          {photos.length === 0 && <SiteImage site={site} alt={site.name} className="h-full w-full" />}
          {photos.map((photo, position) => (
            <div
              key={photo.url}
              className="h-full w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${photos.length}`}
              aria-hidden={position !== index}
            >
              {Math.abs(position - index) <= 1 && (
                <SiteImage
                  site={site}
                  image={photo.url}
                  alt={position === index ? site.name : ''}
                  loading={position === index ? 'eager' : 'lazy'}
                  className="h-full w-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {current && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/70 to-transparent" />
      )}

      {current && (
        <PhotoCredit photo={current} className="absolute bottom-2 left-3 max-w-[calc(100%-9rem)]" />
      )}

      {last > 0 && (
        <PhotoDots
          count={photos.length}
          index={index}
          onChoose={choose}
          fill={
            advancing
              ? {
                  duration: ADVANCE_MS,
                  paused: held || dragging,
                  resetKey: `${site.id}-${index}`,
                  onFillEnd: () => setIndex((value) => Math.min(value + 1, last)),
                }
              : null
          }
          className="absolute bottom-0 right-1"
        />
      )}

      {lightbox && (
        <PhotoLightbox
          site={site}
          photos={photos}
          index={index}
          onIndexChange={choose}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}
