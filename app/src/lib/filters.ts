import type { Site } from './types.ts';

/** Filters beyond type, year and search. Each is off by default. */
export interface ExtraFilters {
  /** Only sites on the List of World Heritage in Danger. */
  danger: boolean;
}

export const NO_EXTRA: ExtraFilters = { danger: false };

export function hasExtraFilters(filters: ExtraFilters): boolean {
  return filters.danger;
}

export function matchesExtra(site: Site, filters: ExtraFilters): boolean {
  if (filters.danger && !site.danger) return false;
  return true;
}
