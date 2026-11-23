import { useEffect, useRef } from 'react';
import { buildUrl } from './urlState.ts';
import type { LinkState } from './urlState.ts';

const BASE_TITLE = document.title;

interface UrlSyncOptions extends LinkState {
  ready: boolean;
}

export function useUrlSync({ ready, ...state }: UrlSyncOptions) {
  const { site, siteName, query, types, years, domain, danger, list, criteria, country } = state;
  const synced = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const url = buildUrl({ site, siteName, query, types, years, domain, danger, list, criteria, country });
    const current = `${window.location.pathname}${window.location.search}`;
    if (url !== current || window.location.hash) {
      const opensOrCloses = window.location.pathname.startsWith('/site/') !== (site !== null);
      if (synced.current && opensOrCloses) window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    }
    synced.current = true;
  }, [ready, site, siteName, query, types, years, domain, danger, list, criteria, country]);

  useEffect(() => {
    document.title = siteName ? `${siteName} · WHX` : BASE_TITLE;
  }, [siteName]);
}
