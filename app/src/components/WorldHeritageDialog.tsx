import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { AnimationEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { Modal } from './Modal.tsx';
import { GuidePane, IntroPane } from './WorldHeritageContent.tsx';

type View = 'intro' | 'guide';

interface DialogProps {
  open: boolean;
  view: View;
  /** True when the guide was reached from the first-visit card, so there is a card to return to. */
  canGoBack: boolean;
  onReadMore: () => void;
  onBack: () => void;
  /** `remember` is true when the visitor ticked "Don't show this again". */
  onClose: (remember: boolean) => void;
  onAbout: (remember: boolean) => void;
}

/**
 * The first-visit card and the longer guide, in one dialog. Moving between them wipes the body
 * sideways, and the guide has a back arrow when it was opened from the card.
 */
export function WorldHeritageDialog({
  open,
  view,
  canGoBack,
  onReadMore,
  onBack,
  onClose,
  onAbout,
}: DialogProps) {
  const [remember, setRemember] = useState(false);
  // The pane being wiped away stays visible underneath until the animation ends.
  const [leaving, setLeaving] = useState<View | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const prevViewRef = useRef(view);
  const wasOpenRef = useRef(open);
  const backRef = useRef<HTMLButtonElement>(null);
  const readMoreRef = useRef<HTMLButtonElement>(null);
  const checkId = useId();

  // Opening the dialog straight onto a view is not a transition; only a change while open is.
  useLayoutEffect(() => {
    const previous = prevViewRef.current;
    const wasOpen = wasOpenRef.current;
    prevViewRef.current = view;
    wasOpenRef.current = open;
    if (!open) {
      setLeaving(null);
      return;
    }
    if (!wasOpen || previous === view) return;
    setLeaving(previous);
    setDirection(view === 'guide' ? 'forward' : 'back');
    (view === 'guide' ? backRef : readMoreRef).current?.focus();
  }, [view, open]);

  const endWipe = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setLeaving(null);
  };

  const paneClass = (pane: View) => {
    if (pane === view) {
      const wipe = leaving ? (direction === 'forward' ? 'wh-wipe-forward' : 'wh-wipe-back') : '';
      return `z-10 ${wipe}`;
    }
    return leaving === pane ? 'z-0' : 'invisible';
  };

  // The logo and back arrow share one slot and crossfade. Opened straight onto the guide there
  // is no card to go back to, so there is no slot at all.
  const showLogo = view === 'intro';
  const masthead =
    showLogo || canGoBack ? (
      <div className="grid">
        <div
          aria-hidden="true"
          inert={!showLogo}
          className={`col-start-1 row-start-1 transition-opacity duration-150 ${showLogo ? 'opacity-100' : 'opacity-0'}`}
        >
          <Logo asHeading={false} />
        </div>
        {canGoBack && (
          <button
            ref={backRef}
            type="button"
            onClick={onBack}
            aria-label="Back to introduction"
            inert={showLogo}
            className={`wh-tint focus-ring col-start-1 row-start-1 -ml-2 grid h-11 w-11 shrink-0 place-items-center self-center justify-self-start rounded-full text-muted transition-[opacity,background-color,color] duration-150 hover:text-ink lg:-ml-1 lg:h-8 lg:w-8 ${showLogo ? 'opacity-0' : 'opacity-100'}`}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={() => onClose(remember)}
      title="What is World Heritage?"
      masthead={masthead}
      width="lg"
      fill
    >
      <div className="relative h-full overflow-hidden">
        <div
          className={`absolute inset-0 flex flex-col bg-surface ${paneClass('intro')}`}
          inert={view !== 'intro'}
          onAnimationEnd={endWipe}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-thin">
            <IntroPane />
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
            <label
              htmlFor={checkId}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-xs text-muted"
            >
              <input
                id={checkId}
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 accent-[oklch(var(--ink))]"
              />
              Don't show this again
            </label>
            <div className="flex items-center gap-2">
              <button
                ref={readMoreRef}
                type="button"
                onClick={onReadMore}
                className="focus-ring min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-canvas active:scale-95 lg:min-h-9"
              >
                Read more
              </button>
              <button
                type="button"
                onClick={() => onClose(remember)}
                className="focus-ring min-h-11 rounded-lg bg-ink px-4 text-sm font-medium text-canvas transition active:scale-95 lg:min-h-9"
              >
                Explore the map
              </button>
            </div>
          </div>
        </div>
        <div
          className={`absolute inset-0 overflow-y-auto overscroll-contain bg-surface scroll-thin ${paneClass('guide')}`}
          inert={view !== 'guide'}
          onAnimationEnd={endWipe}
        >
          <GuidePane onAbout={() => onAbout(remember)} />
        </div>
      </div>
    </Modal>
  );
}
