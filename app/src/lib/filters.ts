import type { Site } from './types.ts';

/** Filters beyond type, year and search. Each is off by default. */
export interface ExtraFilters {
  /** Only sites on the List of World Heritage in Danger. */
  danger: boolean;
  /** Only the sites this visitor has saved. */
  savedOnly: boolean;
  /** A shared list from a link: show only these sites. */
  listIds: ReadonlySet<string> | null;
  /** Selection criteria codes; a site matches if it meets any of them. */
  criteria: ReadonlySet<string>;
  /** Only sites in this country (UNESCO's name for it). */
  country: string | null;
}

export const NO_EXTRA: ExtraFilters = {
  danger: false,
  savedOnly: false,
  listIds: null,
  criteria: new Set(),
  country: null,
};

export function hasExtraFilters(filters: ExtraFilters): boolean {
  return (
    filters.danger || filters.savedOnly || filters.listIds !== null ||
    filters.criteria.size > 0 ||
    filters.country !== null
  );
}

export function matchesExtra(site: Site, filters: ExtraFilters, saved: ReadonlySet<string>): boolean {
  if (filters.danger && !site.danger) return false;
  if (filters.savedOnly && !saved.has(site.id)) return false;
  if (filters.listIds && !filters.listIds.has(site.id)) return false;
  if (filters.country && !site.countries.includes(filters.country)) return false;
  if (filters.criteria.size > 0 && !site.criteriaCodes.some((code) => filters.criteria.has(code))) {
    return false;
  }
  return true;
}

/** Link that opens the app showing exactly these sites. */
export function shareListUrl(ids: Iterable<string>, base: string): string {
  const list = [...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  return `${base}#list=${list.join(',')}`;
}
