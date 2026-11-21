import type { YearRange } from './types.ts';

/**
 * The range after clicking a year's bar: just that year, or back to the full range when that
 * year is already the only one selected. A year with no inscriptions changes nothing.
 */
export function rangeAfterYearClick(
  year: number,
  current: YearRange,
  domain: YearRange,
  hasSites: boolean,
): YearRange {
  if (!hasSites) return current;
  if (current[0] === year && current[1] === year) return [domain[0], domain[1]];
  return [year, year];
}
