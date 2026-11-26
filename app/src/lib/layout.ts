import type { CSSProperties } from 'react';

export const DESKTOP_QUERY = '(min-width: 1024px)';

/** Phone measurements that more than one piece of the layout has to agree on. */
export const PHONE = {
  /** Collapsed sheet: handle (28) + timeline (44 + 60 + 20) + photo strip and padding (64). The safe-area inset comes on top. */
  peek: 216,
  /** The playback bar and its margin. */
  transport: 88,
  /** Where the search pill and chip row end (12 inset + 52 pill + 4 gap + 44 chip row), plus a little air. */
  topInset: 124,
  /** The detail card never grows past this share of the screen height. */
  cardMaxVh: 62,
} as const;

/** The same numbers as CSS variables, for the Tailwind classes inside the phone layout. */
export const PHONE_VARS = {
  '--sheet-peek': `${PHONE.peek}px`,
  '--map-top': `${PHONE.topInset}px`,
  '--card-max': `${PHONE.cardMaxVh}dvh`,
} as CSSProperties;
