import { useCallback, useState } from 'react';
import type { Basemap, BasemapId } from './basemaps.ts';
import { readStored, writeStored } from './storage.ts';

const STORAGE_KEY = 'wh-basemap';

/** The chosen map style, remembered on this device. A style that is no longer on offer falls back to the first. */
export function useBasemap(basemaps: Basemap[]) {
  const [id, setId] = useState(() => readStored(STORAGE_KEY));
  const basemap = basemaps.find((candidate) => candidate.id === id) ?? basemaps[0];

  const choose = useCallback((next: BasemapId) => {
    setId(next);
    writeStored(STORAGE_KEY, next);
  }, []);

  // Used when a style stops working: switch away without forgetting what the visitor chose.
  const fallBack = useCallback(() => setId(null), []);

  return { basemap, choose, fallBack };
}
