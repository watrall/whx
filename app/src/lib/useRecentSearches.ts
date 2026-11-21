import { useCallback, useState } from 'react';
import { readStored, removeStored, writeStored } from './storage.ts';

const STORAGE_KEY = 'wh-recent-searches';
const MAX_RECENT = 6;

function readRecent(): string[] {
  const raw = readStored(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(readRecent);

  const addRecent = useCallback((query: string) => {
    const value = query.trim();
    if (!value) return;
    setRecent((current) => {
      const next = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      writeStored(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    removeStored(STORAGE_KEY);
  }, []);

  return { recent, addRecent, clearRecent };
}
