import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Layers } from 'lucide-react';
import type { Basemap, BasemapId } from '../lib/basemaps.ts';
import { thumbnailUrl } from '../lib/basemaps.ts';
import { useDismiss } from '../lib/useDismiss.ts';
import { MapTooltip } from './MapTooltip.tsx';

/** How long the fold-away animation runs before the row is removed. Keep in step with .wh-fold in index.css. */
const FOLD_MS = 140;

interface BasemapPickerProps {
  basemaps: Basemap[];
  value: BasemapId;
  onChange: (id: BasemapId) => void;
  /** Sizes the tile to match the other map controls. */
  tileClass: string;
  iconClass: string;
  /** Which side of the tile the styles roll out to: away from the edge of the map. */
  side: 'left' | 'right';
}

/**
 * One fixed layers tile in the control stack. Pressing it rolls a preview of each map style
 * out beside it; choosing one switches the map and folds the row back into the tile.
 */
export function BasemapPicker({ basemaps, value, onChange, tileClass, iconClass, side }: BasemapPickerProps) {
  const [open, setOpen] = useState(false);
  // The row stays mounted a moment after closing so it can animate away.
  const [shown, setShown] = useState(false);
  // Keyboard users land on the current style when the row opens; pointer users are left alone.
  const [byKeyboard, setByKeyboard] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const wasShown = useRef(false);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setShown(false), FOLD_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Hand focus back to the tile once the styles have folded away.
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
        onClick={(event) => {
          setByKeyboard(event.detail === 0);
          if (!open) setShown(true);
          setOpen(!open);
        }}
        aria-label="Map style"
        aria-expanded={open}
        className={`${frame} grid place-items-center text-ink hover:bg-canvas ${open ? 'bg-canvas' : 'bg-surface'}`}
      >
        <Layers className={iconClass} aria-hidden="true" />
        {!open && <MapTooltip placement={side === 'left' ? 'right' : 'left'}>Layers</MapTooltip>}
      </button>
      {shown && (
        <div
          role="radiogroup"
          aria-label="Map style"
          className={`absolute bottom-0 flex gap-1.5 ${side === 'left' ? 'left-full ml-1.5' : 'right-full mr-1.5'}`}
        >
          {basemaps.map((basemap, index) => {
            const selected = basemap.id === value;
            // How many places this style rolls out from the tile, and in which direction.
            const hops = side === 'left' ? index + 1 : basemaps.length - index;
            const fan = {
              '--hops': hops,
              '--dir': side === 'left' ? -1 : 1,
              animationDelay: `${(open ? hops - 1 : 0) * 35}ms`,
            } as CSSProperties;
            return (
              <div key={basemap.id} className={`relative ${open ? 'wh-fan' : 'wh-fold'}`} style={fan}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={basemap.label}
                  autoFocus={selected && byKeyboard}
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
                  <MapTooltip>{basemap.label}</MapTooltip>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
