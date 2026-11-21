import { useCallback, useState } from 'react';
import { canonicalIds } from './ids.ts';
import { readStored, writeStored } from './storage.ts';
import type { Site } from './types.ts';

const STORAGE_KEY = 'wh-saved-sites';
const MAX_SAVED = 150; // keeps a shared link comfortably under URL length limits

function readSaved(): Set<string> {
  const raw = readStored(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((value): value is string => typeof value === 'string' && /^Q?\d+$/.test(value)),
    );
  } catch {
    return new Set();
  }
}

function writeSaved(saved: Set<string>) {
  writeStored(STORAGE_KEY, JSON.stringify([...saved]));
}

/** Sites the visitor has starred, kept in this browser only. */
export function useSavedSites() {
  const [saved, setSaved] = useState<Set<string>>(readSaved);

  const update = useCallback((change: (current: Set<string>) => Set<string>) => {
    setSaved((current) => {
      const next = change(new Set(current));
      writeSaved(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (id: string) =>
      update((next) => {
        if (next.has(id)) next.delete(id);
        else if (next.size < MAX_SAVED) next.add(id);
        return next;
      }),
    [update],
  );

  const addMany = useCallback(
    (ids: Iterable<string>) =>
      update((next) => {
        for (const id of ids) {
          if (next.size >= MAX_SAVED) break;
          next.add(id);
        }
        return next;
      }),
    [update],
  );

  /** Rewrites saves made under Wikidata IDs to UNESCO numbers, once the sites are known. */
  const migrate = useCallback(
    (sites: Site[]) =>
      update((current) =>
        [...current].some((id) => id.startsWith('Q')) ? canonicalIds(current, sites) : current,
      ),
    [update],
  );

  return { saved, toggle, addMany, migrate, atLimit: saved.size >= MAX_SAVED };
}
