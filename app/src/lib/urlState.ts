import type { SiteType, YearRange } from './types.ts';

export interface UrlState {
  site: string | null;
  query: string;
  types: SiteType[];
  years: YearRange | null;
  danger: boolean;
  /** Site IDs from a shared list link. */
  list: string[];
}

const TYPES: SiteType[] = ['cultural', 'natural', 'mixed'];

/** Reads app state from a location hash such as `#site=Q123&types=natural&years=1990-2005`. */
export function parseUrlState(hash: string): UrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const types = (params.get('types') ?? '')
    .split(',')
    .filter((value): value is SiteType => TYPES.includes(value as SiteType));

  let years: YearRange | null = null;
  const yearMatch = /^(\d{4})-(\d{4})$/.exec(params.get('years') ?? '');
  if (yearMatch) {
    const start = Number(yearMatch[1]);
    const end = Number(yearMatch[2]);
    if (start <= end) years = [start, end];
  }

  const site = params.get('site');
  return {
    site: site && /^Q\d+$/.test(site) ? site : null,
    query: params.get('q') ?? '',
    types,
    years,
    danger: params.get('danger') === '1',
    list: (params.get('list') ?? '')
      .split(',')
      .filter((id) => /^Q\d+$/.test(id))
      .slice(0, 150),
  };
}

/** Writes only non-default state, so a pristine view has a clean URL. */
export function buildUrlHash(state: {
  site: string | null;
  query: string;
  types: Set<SiteType>;
  years: YearRange;
  domain: YearRange;
  danger: boolean;
  list: ReadonlySet<string> | null;
}): string {
  const params = new URLSearchParams();
  if (state.site) params.set('site', state.site);
  if (state.query.trim()) params.set('q', state.query.trim());
  if (state.types.size > 0) {
    params.set('types', TYPES.filter((type) => state.types.has(type)).join(','));
  }
  if (state.years[0] !== state.domain[0] || state.years[1] !== state.domain[1]) {
    params.set('years', `${state.years[0]}-${state.years[1]}`);
  }
  if (state.danger) params.set('danger', '1');
  if (state.list && state.list.size > 0) params.set('list', [...state.list].join(','));
  const text = params.toString();
  return text ? `#${text}` : '';
}
