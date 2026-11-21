import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Layers } from 'lucide-react';
import type { Basemap, BasemapId } from '../lib/basemaps.ts';
import { thumbnailUrl } from '../lib/basemaps.ts';
import { useDismiss } from '../lib/useDismiss.ts';

/** How long the fold-away animation runs before the row is removed. Keep in step with .wh-fold in index.css. */
const FOLD_MS = 140;

interface BasemapPickerProps {
  basemaps: Basemap[];
  value: BasemapId;
  onChange: (id: BasemapId) => void;
  /** Sizes the tile to match the other map controls. */
  tileClass: string;
  iconClass: string;
  /** Which end of the row sits on the tile: the row grows away from the map's edge. */
  side: 'left' | 'right';
}

function Tooltip({ children }: { children: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

/**
 * One fixed layers tile in the control stack. Pressing it rolls out a preview of each map
 * style; choosing one switches the map and folds the row back into the tile.
 */
export function BasemapPicker({ basemaps, value, onChange, tileClass, iconClass, side }: BasemapPickerProps) {
  const [open, setOpen] = useState(false);
  // The row stays mounted a moment after closing so it can animate away.
  const [shown, setShown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const wasShown = useRef(false);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  useEffect(() => {
    if (open) {
      setShown(true);
      return;
    }
    const timer = window.setTimeout(() => setShown(false), FOLD_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // The tile hides while the styles are showing, so hand focus back to it when they have folded away.
  useEffect(() => {
    if (wasShown.current && !shown) tileRef.current?.focus();
    wasShown.current = shown;
  }, [shown]);

  const frame = `group relative block border border-line shadow-card transition active:scale-95 focus-ring ${tileClass}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={tileRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Map style"
        aria-expanded={open}
        tabIndex={shown ? -1 : 0}
        className={`${frame} grid place-items-center bg-surface text-ink hover:bg-canvas ${shown ? 'invisible' : ''}`}
      >
        <Layers className={iconClass} aria-hidden="true" />
        <Tooltip>Layers</Tooltip>
      </button>
      {shown && (
        <div
          role="radiogroup"
          aria-label="Map style"
          className={`absolute bottom-0 flex gap-1.5 ${side === 'left' ? 'left-0' : 'right-0'}`}
        >
          {basemaps.map((basemap, index) => {
            const selected = basemap.id === value;
            // How many places along the row this style travels from the tile, and in which direction.
            const hops = side === 'left' ? index : basemaps.length - 1 - index;
            const fan = {
              '--hops': hops,
              '--dir': side === 'left' ? -1 : 1,
              animationDelay: `${(open ? hops : 0) * 35}ms`,
            } as CSSProperties;
            return (
              <div key={basemap.id} className={`relative ${open ? 'wh-fan' : 'wh-fold'}`} style={fan}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={basemap.label}
                  autoFocus={selected}
                  onClick={() => {
                    onChange(basemap.id);
                    close();
                  }}
                  className={`${frame} ${selected ? 'ring-2 ring-ink' : ''}`}
                >
                  <img
                    src={thumbnailUrl(basemap)}
                    alt=""
                    draggable={false}
                    data-preview={basemap.id}
                    className="h-full w-full rounded-[inherit] bg-canvas object-cover"
                  />
                  <Tooltip>{basemap.label}</Tooltip>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
