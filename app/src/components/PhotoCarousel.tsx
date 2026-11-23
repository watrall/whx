import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Site } from '../lib/types.ts';
import { useMediaQuery } from '../lib/useMediaQuery.ts';
import { imageCreditUrl, photoCreditText } from '../lib/utils.ts';

const UNSPLASH_URL = 'https://unsplash.com/?utm_source=whx&utm_medium=referral';
// Underlined at rest, so it is plain to a reader (and to Unsplash's reviewers) that both are links.
const CREDIT_LINK = 'focus-ring rounded underline decoration-surface/60 underline-offset-2 hover:decoration-surface';
import { SiteImage } from './SiteImage.tsx';

/** How far a drag must go, in pixels, to turn the page. */
const SWIPE_DISTANCE = 50;
/** How long each photo stays before the next one, while the carousel is playing. */
const ADVANCE_MS = 5000;

/**
 * The photos of a site. They advance on their own, once through, and the active dot fills to
 * show how long is left. Hovering or focusing the header pauses it, and any swipe or dot click
 * stops it for that site. Visitors who prefer reduced motion get no auto-advance. The credit at
 * the bottom left follows the photo and links to its Commons page.
 */
export function PhotoCarousel({ site }: { site: Site }) {
  const { photos } = site;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const startRef = useRef<number | null>(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    setIndex(0);
    setDragX(0);
    setPlaying(true);
  }, [site.id]);

  const last = photos.length - 1;
  // The fill on the active dot drives the timing, so what you see is what happens: it pauses
  // while held, and advancing happens when it completes.
  const advancing = playing && !reducedMotion && index < last;

  /** A choice made by the visitor ends the automatic advance for this site. */
  const choose = (next: number) => {
    setPlaying(false);
    setIndex(Math.min(Math.max(next, 0), last));
  };
  const current = photos[index];
  const creditUrl = current ? (current.source === 'unsplash' ? current.page : imageCreditUrl(current.url)) : null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (last < 1) return;
    startRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (startRef.current === null) return;
    const offset = event.clientX - startRef.current;
    // Resist at either end, where there is nothing further to show.
    const atEdge = (index === 0 && offset > 0) || (index === last && offset < 0);
    setDragX(atEdge ? offset / 4 : offset);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (startRef.current === null) return;
    const offset = event.clientX - startRef.current;
    startRef.current = null;
    setDragX(0);
    if (offset <= -SWIPE_DISTANCE) choose(index + 1);
    else if (offset >= SWIPE_DISTANCE) choose(index - 1);
  };

  const dragging = dragX !== 0;

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
      <div
        className="h-full w-full touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(event) => event.preventDefault()}
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
              {/* Only the photo on show and its neighbours are fetched. */}
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

      {(creditUrl || last > 0) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/70 to-transparent" />
      )}

      {current && creditUrl && current.source === 'unsplash' && (
        // Unsplash asks for the photographer's full name and Unsplash, each with a link. A long
        // name wraps onto a second line; it is never cut short.
        <p className="absolute bottom-2 left-3 flex max-w-[calc(100%-9rem)] flex-wrap items-baseline gap-x-1 text-xs leading-snug text-surface">
          <span className="shrink-0">Photo by</span>
          <a href={current.byUrl ?? creditUrl} target="_blank" rel="noreferrer" className={CREDIT_LINK}>
            {current.by ?? 'Unsplash photographer'}
          </a>
          <span className="shrink-0">on</span>
          <a href={UNSPLASH_URL} target="_blank" rel="noreferrer" className={`${CREDIT_LINK} shrink-0`}>
            Unsplash
          </a>
        </p>
      )}
      {current && creditUrl && current.source !== 'unsplash' && (
        <a
          href={creditUrl}
          target="_blank"
          rel="noreferrer"
          title={photoCreditText(current)}
          className="focus-ring absolute bottom-2 left-3 max-w-[calc(100%-9rem)] rounded text-xs leading-snug text-surface hover:underline"
        >
          {photoCreditText(current)}
        </a>
      )}

      {last > 0 && (
        <div
          role="group"
          aria-label="Choose a photo"
          className="absolute bottom-0 right-1 flex items-center"
        >
          {photos.map((photo, position) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => choose(position)}
              aria-label={`Photo ${position + 1} of ${photos.length}`}
              aria-current={position === index ? 'true' : undefined}
              className="focus-ring grid h-11 min-w-6 place-items-center rounded-full px-1"
            >
              {position === index && advancing ? (
                // The active dot is a short bar that fills over the time this photo stays.
                <span className="block h-1.5 w-4 overflow-hidden rounded-full bg-surface/40">
                  <span
                    key={`${site.id}-${index}`}
                    className="wh-dot-fill block h-full w-full origin-left rounded-full bg-surface"
                    style={{
                      animationDuration: `${ADVANCE_MS}ms`,
                      animationPlayState: held || dragging ? 'paused' : 'running',
                    }}
                    onAnimationEnd={() => setIndex((value) => Math.min(value + 1, last))}
                  />
                </span>
              ) : (
                <span
                  className={`block rounded-full bg-surface transition-opacity duration-200 ${
                    position === index ? 'h-2 w-2 opacity-100' : 'h-1.5 w-1.5 opacity-55'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
