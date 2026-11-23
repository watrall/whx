import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null,
  );
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function useDialog(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onKeyDown: (event: KeyboardEvent) => void,
  capture = false,
) {
  const keyRef = useRef(onKeyDown);

  useEffect(() => {
    keyRef.current = onKeyDown;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const handle = (event: KeyboardEvent) => {
      keyRef.current(event);
      if (event.key === 'Tab' && ref.current) trapFocus(event, ref.current);
    };
    document.addEventListener('keydown', handle, capture);
    return () => {
      document.removeEventListener('keydown', handle, capture);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, ref, capture]);
}
