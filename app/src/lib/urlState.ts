import type { SiteType, YearRange } from './types.ts';

export interface UrlState {
  site: string | null;
  query: string;
  types: SiteType[];
  years: YearRange | null;
  danger: boolean;
  /** Site IDs from a shared list link. */
  list: string[];
  /** Criteria codes such as "vi" and "ix". */
  criteria: string[];
  /** A country name, as UNESCO spells it. */
  country: string | null;
}

/** A UNESCO number, or a Wikidata item from links made before sites were keyed by UNESCO number. */
const SITE_ID = /^(Q?\d+)$/;
const CRITERIA_CODES = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
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
    site: site && SITE_ID.test(site) ? site : null,
    query: params.get('q') ?? '',
    types,
    years,
    danger: params.get('danger') === '1',
    list: (params.get('list') ?? '')
      .split(',')
      .filter((id) => SITE_ID.test(id))
      .slice(0, 150),
    country: (params.get('country') ?? '').slice(0, 80) || null,
    criteria: (params.get('crit') ?? '').split(',').filter((code) => CRITERIA_CODES.includes(code)),
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
  criteria: ReadonlySet<string>;
  country: string | null;
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
  if (state.country) params.set('country', state.country);
  if (state.criteria.size > 0) {
    params.set('crit', CRITERIA_CODES.filter((code) => state.criteria.has(code)).join(','));
  }
  if (state.list && state.list.size > 0) params.set('list', [...state.list].join(','));
  const text = params.toString();
  return text ? `#${text}` : '';
}
