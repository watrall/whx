import { useCallback, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { useDismiss } from '../lib/useDismiss.ts';

interface MoreMenuProps {
  onAbout: () => void;
  onGuide: () => void;
}

const ITEM =
  'focus-ring flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-ink transition hover:bg-canvas';

/** The phone tray's overflow menu: the project's About panel and the World Heritage explainer. */
export function MoreMenu({ onAbout, onGuide }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  const choose = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="More"
        className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink"
      >
        <Ellipsis className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-line bg-surface p-1 shadow-float"
        >
          <button type="button" role="menuitem" onClick={choose(onGuide)} className={ITEM}>
            What is World Heritage?
          </button>
          <button type="button" role="menuitem" onClick={choose(onAbout)} className={ITEM}>
            About
          </button>
        </div>
      )}
    </div>
  );
}
