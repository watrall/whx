import type { SitePhoto } from '../lib/types.ts';
import { imageCreditUrl, photoCreditText } from '../lib/utils.ts';

const UNSPLASH_URL = 'https://unsplash.com/?utm_source=whx&utm_medium=referral';
const CREDIT_LINK = 'focus-ring rounded underline decoration-surface/60 underline-offset-2 hover:decoration-surface';

export function PhotoCredit({ photo, className = '' }: { photo: SitePhoto; className?: string }) {
  if (photo.source === 'unsplash') {
    if (!photo.page) return null;
    return (
      <p className={`flex flex-wrap items-baseline gap-x-1 text-xs leading-snug text-surface ${className}`}>
        <span className="shrink-0">Photo by</span>
        <a href={photo.byUrl ?? photo.page} target="_blank" rel="noreferrer" className={CREDIT_LINK}>
          {photo.by ?? 'Unsplash photographer'}
        </a>
        <span className="shrink-0">on</span>
        <a href={UNSPLASH_URL} target="_blank" rel="noreferrer" className={`${CREDIT_LINK} shrink-0`}>
          Unsplash
        </a>
      </p>
    );
  }

  const creditUrl = imageCreditUrl(photo.url);
  if (!creditUrl) return null;
  return (
    <a
      href={creditUrl}
      target="_blank"
      rel="noreferrer"
      title={photoCreditText(photo)}
      className={`focus-ring rounded text-xs leading-snug text-surface hover:underline ${className}`}
    >
      {photoCreditText(photo)}
    </a>
  );
}

interface PhotoDotsProps {
  count: number;
  index: number;
  onChoose: (index: number) => void;
  fill?: { duration: number; paused: boolean; resetKey: string; onFillEnd: () => void } | null;
  className?: string;
}

export function PhotoDots({ count, index, onChoose, fill = null, className = '' }: PhotoDotsProps) {
  return (
    <div role="group" aria-label="Choose a photo" className={`flex items-center ${className}`}>
      {Array.from({ length: count }, (_, position) => (
        <button
          key={position}
          type="button"
          onClick={() => onChoose(position)}
          aria-label={`Photo ${position + 1} of ${count}`}
          aria-current={position === index ? 'true' : undefined}
          className="focus-ring grid h-11 min-w-6 place-items-center rounded-full px-1"
        >
          {position === index && fill ? (
            <span className="block h-1.5 w-4 overflow-hidden rounded-full bg-surface/40">
              <span
                key={fill.resetKey}
                className="wh-dot-fill block h-full w-full origin-left rounded-full bg-surface"
                style={{
                  animationDuration: `${fill.duration}ms`,
                  animationPlayState: fill.paused ? 'paused' : 'running',
                }}
                onAnimationEnd={fill.onFillEnd}
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
  );
}
