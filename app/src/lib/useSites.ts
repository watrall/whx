import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSites } from './data.ts';
import type { Site } from './types.ts';

export function useSites(onLoaded: (sites: Site[]) => void) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  useEffect(() => {
    const controller = new AbortController();
    loadSites(controller.signal)
      .then((result) => {
        setSites(result.sites);
        onLoadedRef.current(result.sites);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unexpected loading error');
        setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  return { sites, loading, error, reload };
}
