import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CircleX } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown above the title row, such as a logo. */
  masthead?: ReactNode;
  /** Panel width: "md" (default) or "lg" for longer reading. */
  width?: 'md' | 'lg';
  /** A fixed-height panel whose children fill it and scroll themselves, for content that swaps. */
  fill?: boolean;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTH = { md: 'max-w-md', lg: 'max-w-lg' } as const;
const PANEL =
  'animate-fade-up w-full rounded-2xl border border-line bg-surface p-5 shadow-float outline-none';
/** Content flows and the whole panel scrolls. */
const PANEL_FLOW = 'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain scroll-thin';
/** A fixed height; the children fill it and scroll themselves. */
const PANEL_FILL = 'flex h-[min(44rem,calc(100dvh-2rem))] flex-col overflow-hidden';

export function Modal({
  open,
  onClose,
  title,
  masthead,
  width = 'md',
  fill = false,
  children,
  className = '',
}: ModalProps) {
  const titleId = useId();
  // A ref, so a parent passing a new function each render does not re-run the effect below.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the dialog itself so its title is announced and no button shows a focus ring yet.
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className={`wh-tint focus-ring -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition duration-150 hover:text-ink lg:-mr-1 lg:h-8 lg:w-8 ${masthead ? '' : '-mt-2 lg:-mt-1'}`}
    >
      <CircleX className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[1200] grid place-items-center bg-ink/20 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${PANEL} ${WIDTH[width]} ${fill ? PANEL_FILL : PANEL_FLOW} ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {masthead ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-4">
              {masthead}
              {closeButton}
            </div>
            <h2 id={titleId} className="mt-4 shrink-0 text-lg font-medium text-ink">
              {title}
            </h2>
          </>
        ) : (
          <div className="flex shrink-0 items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-medium text-ink">
              {title}
            </h2>
            {closeButton}
          </div>
        )}
        <div className={`mt-3 text-sm leading-relaxed text-muted ${fill ? 'min-h-0 flex-1' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
