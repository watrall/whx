import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CircleX } from 'lucide-react';
import { useDialog } from '../lib/useDialog.ts';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  masthead?: ReactNode;
  width?: 'md' | 'lg';
  fill?: boolean;
  children: ReactNode;
  className?: string;
}

const WIDTH = { md: 'max-w-md', lg: 'max-w-lg' } as const;
const PANEL =
  'animate-fade-up w-full rounded-2xl border border-line bg-surface p-5 shadow-float outline-none';
const PANEL_FLOW = 'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain scroll-thin';
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
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, open, (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose();
  });

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
