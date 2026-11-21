import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Calls onDismiss on Escape or a press outside the element, while it is open. */
export function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, ref, onDismiss]);
}
