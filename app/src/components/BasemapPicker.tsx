import { useCallback, useEffect, useRef, useState } from 'react';
import type { Basemap, BasemapId } from '../lib/basemaps.ts';
import { thumbnailUrl } from '../lib/basemaps.ts';
import { useDismiss } from '../lib/useDismiss.ts';

interface BasemapPickerProps {
  basemaps: Basemap[];
  value: BasemapId;
  onChange: (id: BasemapId) => void;
  /** Sizes the tile to match the other map controls. */
  tileClass: string;
  /** Anchors the row of styles to the tile, growing away from the edge of the map. */
  popClass: string;
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

function Preview({ basemap }: { basemap: Basemap }) {
  return (
    <img
      src={thumbnailUrl(basemap)}
      alt=""
      draggable={false}
      data-preview={basemap.id}
      className="h-full w-full rounded-[inherit] bg-canvas object-cover"
    />
  );
}

/**
 * A small map-style tile for the control stack. It shows the style you would switch to;
 * pressing it fans out every style, each named on hover.
 */
export function BasemapPicker({ basemaps, value, onChange, tileClass, popClass }: BasemapPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  // The tile hides while the styles are showing, so hand focus back to it when they fold away.
  useEffect(() => {
    if (wasOpen.current && !open) tileRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Show the last style that is not the current one, so Atlas offers Satellite.
  const offered = [...basemaps].reverse().find((basemap) => basemap.id !== value) ?? basemaps[0];
  const frame = `group relative block border border-line shadow-card transition active:scale-95 focus-ring ${tileClass}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={tileRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Map style"
        aria-expanded={open}
        tabIndex={open ? -1 : 0}
        className={`${frame} ${open ? 'invisible' : ''}`}
      >
        <Preview basemap={offered} />
        {!open && <Tooltip>Layers</Tooltip>}
      </button>
      {open && (
        <div
          role="radiogroup"
          aria-label="Map style"
          className={`absolute bottom-0 flex gap-1.5 ${popClass}`}
        >
          {basemaps.map((basemap) => {
            const selected = basemap.id === value;
            return (
              <div key={basemap.id} className="relative">
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
                  <Preview basemap={basemap} />
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
