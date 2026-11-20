import { useCallback, useState } from 'react';

const STORAGE_KEY = 'wh-saved-sites';
const MAX_SAVED = 150; // keeps a shared link comfortably under URL length limits

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((value): value is string => typeof value === 'string' && /^Q\d+$/.test(value)),
    );
  } catch {
    return new Set();
  }
}

function writeSaved(saved: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
  } catch {
    // Private mode or full storage: saves last for this visit only.
  }
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

  return { saved, toggle, addMany, atLimit: saved.size >= MAX_SAVED };
}
