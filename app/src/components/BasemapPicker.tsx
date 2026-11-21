import { useCallback, useRef, useState } from 'react';
import type { Basemap, BasemapId } from '../lib/basemaps.ts';
import { thumbnailUrl } from '../lib/basemaps.ts';
import { useDismiss } from '../lib/useDismiss.ts';

interface BasemapPickerProps {
  basemaps: Basemap[];
  value: BasemapId;
  onChange: (id: BasemapId) => void;
  /** On phones the picker folds down to the current style, so it does not cover the map. */
  collapsible: boolean;
  className?: string;
}

function Preview({ basemap, className }: { basemap: Basemap; className: string }) {
  return (
    <img
      src={thumbnailUrl(basemap)}
      alt=""
      draggable={false}
      data-preview={basemap.id}
      className={`bg-canvas object-cover ${className}`}
    />
  );
}

/** Map-style previews that sit on the map beside the controls, as in Google Maps and Mapbox. */
export function BasemapPicker({ basemaps, value, onChange, collapsible, className = '' }: BasemapPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fold = useCallback(() => setExpanded(false), []);
  useDismiss(collapsible && expanded, rootRef, fold);

  const current = basemaps.find((basemap) => basemap.id === value) ?? basemaps[0];

  if (collapsible && !expanded) {
    return (
      <div ref={rootRef} className={`absolute z-[500] ${className}`}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={`Map style: ${current.label}. Change`}
          aria-expanded={false}
          className="focus-ring block overflow-hidden rounded-xl border-2 border-surface shadow-card active:scale-95"
        >
          <Preview basemap={current} className="h-11 w-11" />
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`absolute z-[500] ${className}`}>
      <div
        role="radiogroup"
        aria-label="Map style"
        className="flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-card"
      >
        {basemaps.map((basemap) => {
          const selected = basemap.id === value;
          return (
            <button
              key={basemap.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(basemap.id);
                setExpanded(false);
              }}
              className="focus-ring group flex w-14 flex-col items-center gap-1 rounded-lg p-0.5 text-xs"
            >
              <Preview
                basemap={basemap}
                className={`h-12 w-12 rounded-md border-2 transition ${
                  selected ? 'border-ink' : 'border-transparent group-hover:border-line'
                }`}
              />
              <span className={selected ? 'font-semibold text-ink' : 'text-muted'}>{basemap.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
