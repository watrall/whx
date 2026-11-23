import { useCallback, useMemo } from 'react';
import { matchesExtra } from './filters.ts';
import type { ExtraFilters } from './filters.ts';
import type { Site, SiteType, YearRange } from './types.ts';
import { normalizeSearch, siteSearchText, tokenMatches } from './utils.ts';

interface FilterState {
  query: string;
  types: Set<SiteType>;
  extra: ExtraFilters;
  saved: Set<string>;
  yearRange: YearRange;
  domain: YearRange;
}

/** The sites that pass every filter, plus the counts and predicates the filter controls show. */
export function useSiteFilters(
  sites: Site[],
  { query, types, extra, saved, yearRange, domain }: FilterState,
) {
  const normalizedQuery = normalizeSearch(query);
  const tokens = useMemo(() => normalizedQuery.split(/\s+/).filter(Boolean), [normalizedQuery]);

  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const site of sites) index.set(site.id, siteSearchText(site));
    return index;
  }, [sites]);

  const matchesQuery = useCallback(
    (site: Site) => {
      if (tokens.length === 0) return true;
      const text = searchIndex.get(site.id) ?? '';
      return tokens.every((token) => tokenMatches(text, token));
    },
    [searchIndex, tokens],
  );

  const matchesYear = useCallback(
    (site: Site) => {
      if (site.year === null) {
        return yearRange[0] <= domain[0] && yearRange[1] >= domain[1];
      }
      return site.year >= yearRange[0] && site.year <= yearRange[1];
    },
    [domain, yearRange],
  );

  const filtered = useMemo(
    () =>
      sites.filter(
        (site) =>
          (types.size === 0 || types.has(site.type)) &&
          matchesYear(site) &&
          matchesQuery(site) &&
          matchesExtra(site, extra, saved),
      ),
    [sites, types, matchesYear, matchesQuery, extra, saved],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<SiteType, number> = { cultural: 0, natural: 0, mixed: 0 };
    for (const site of sites) {
      if (!matchesYear(site) || !matchesQuery(site) || !matchesExtra(site, extra, saved)) continue;
      counts[site.type] += 1;
    }
    return counts;
  }, [sites, matchesYear, matchesQuery, extra, saved]);

  // Danger count ignores the danger filter itself, so the chip shows what turning it on would give.
  const dangerCount = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.danger &&
          (types.size === 0 || types.has(site.type)) &&
          matchesYear(site) &&
          matchesQuery(site) &&
          matchesExtra(site, { ...extra, danger: false }, saved),
      ).length,
    [sites, types, matchesYear, matchesQuery, extra, saved],
  );

  const timelineSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          (types.size === 0 || types.has(site.type)) &&
          matchesQuery(site) &&
          matchesExtra(site, extra, saved),
      ),
    [sites, types, matchesQuery, extra, saved],
  );

  return { filtered, typeCounts, dangerCount, timelineSites, matchesYear, matchesQuery };
}
