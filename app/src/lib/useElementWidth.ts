import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Tracks an element's width so a layout can switch tiers without media queries. */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (typeof next === 'number') setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
