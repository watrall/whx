import type { CSSProperties } from 'react';

export const DESKTOP_QUERY = '(min-width: 1024px)';

/** Phone measurements that more than one piece of the layout has to agree on. */
export const PHONE = {
  /** Collapsed sheet: handle (36) + timeline (56) + gap (8). The safe-area inset comes on top. */
  peek: 100,
  /** Search pill and type chips float over the top of the map down to here. */
  topInset: 132,
  /** The detail card never grows past this share of the screen height. */
  cardMaxVh: 62,
} as const;

/** The same numbers as CSS variables, for the Tailwind classes inside the phone layout. */
export const PHONE_VARS = {
  '--sheet-peek': `${PHONE.peek}px`,
  '--map-top': `${PHONE.topInset}px`,
  '--card-max': `${PHONE.cardMaxVh}dvh`,
} as CSSProperties;
