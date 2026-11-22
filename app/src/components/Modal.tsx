import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown above the title row, such as a logo. */
  masthead?: ReactNode;
  /** Panel width: "md" (default) or "lg" for longer reading. */
  width?: 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  masthead,
  width = 'md',
  children,
  className = '',
}: ModalProps) {
  const titleId = useId();
  // Read through a ref so a parent that passes a fresh function each render does not re-run
  // the effect below, which would move focus back to the close button.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

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
      if (event.shiftKey && document.activeElement === first) {
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
        className={`animate-fade-up max-h-[calc(100dvh-2rem)] w-full ${width === 'lg' ? 'max-w-lg' : 'max-w-md'} overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-5 shadow-float scroll-thin ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {(() => {
          const closeButton = (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className={`focus-ring -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink ${masthead ? '' : '-mt-2'}`}
            >
              <X className="h-4 w-4" />
            </button>
          );
          // With a masthead, the logo shares the top row with the close button and the title sits below.
          return masthead ? (
            <>
              <div className="flex items-center justify-between gap-4">
                {masthead}
                {closeButton}
              </div>
              <h2 id={titleId} className="mt-4 text-lg font-medium text-ink">
                {title}
              </h2>
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-medium text-ink">
                {title}
              </h2>
              {closeButton}
            </div>
          );
        })()}
        <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}
