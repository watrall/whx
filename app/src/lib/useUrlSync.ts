import { useEffect } from 'react';
import { buildUrlHash } from './urlState.ts';
import type { SiteType, YearRange } from './types.ts';

const BASE_TITLE = document.title;

interface UrlSyncOptions {
  ready: boolean;
  site: string | null;
  siteName: string | null;
  query: string;
  types: Set<SiteType>;
  years: YearRange;
  domain: YearRange;
  danger: boolean;
  list: ReadonlySet<string> | null;
  criteria: ReadonlySet<string>;
  country: string | null;
}

export function useUrlSync({ ready, siteName, ...state }: UrlSyncOptions) {
  const { site, query, types, years, domain, danger, list, criteria, country } = state;

  useEffect(() => {
    if (!ready) return;
    const hash = buildUrlHash({ site, query, types, years, domain, danger, list, criteria, country });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, [ready, site, query, types, years, domain, danger, list, criteria, country]);

  useEffect(() => {
    document.title = siteName ? `${siteName} · WHX` : BASE_TITLE;
  }, [siteName]);
}
