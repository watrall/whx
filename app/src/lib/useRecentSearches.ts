import { useCallback, useState } from 'react';

const STORAGE_KEY = 'wh-recent-searches';
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
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
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable in private contexts; keep the in-memory list.
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  return { recent, addRecent, clearRecent };
}
