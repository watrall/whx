import type { Bounds, Site, SiteType } from './types.ts';

export const TYPE_ORDER: SiteType[] = ['cultural', 'natural', 'mixed'];

export const TYPE_LABEL: Record<SiteType, string> = {
  cultural: 'Cultural',
  natural: 'Natural',
  mixed: 'Mixed',
};

export const TYPE_COLOR: Record<SiteType, string> = {
  cultural: 'oklch(0.55 0.17 22)',
  natural: 'oklch(0.55 0.12 165)',
  mixed: 'oklch(0.52 0.14 300)',
};

export const TYPE_ICON: Record<SiteType, string> = {
  cultural: '<i class="fa-solid fa-torii-gate" aria-hidden="true"></i>',
  natural: '<i class="fa-solid fa-leaf" aria-hidden="true"></i>',
  mixed:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path d="M248 106.6c18.9-9 32-28.3 32-50.6c0-30.9-25.1-56-56-56s-56 25.1-56 56c0 22.3 13.1 41.6 32 50.6l0 98.8c-2.8 1.3-5.5 2.9-8 4.7l-80.1-45.8c1.6-20.8-8.6-41.6-27.9-52.8C57.2 96 23 105.2 7.5 132S1.2 193 28 208.5c1.3 .8 2.6 1.5 4 2.1l0 90.8c-1.3 .6-2.7 1.3-4 2.1C1.2 319-8 353.2 7.5 380S57.2 416 84 400.5c19.3-11.1 29.4-32 27.8-52.8l50.5-28.9c-11.5-11.2-19.9-25.6-23.8-41.7L88 306.1c-2.6-1.8-5.2-3.3-8-4.7l0-90.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-.1 1.4-.2 2.8-.2 4.3c0 22.3 13.1 41.6 32 50.6l0 98.8c-18.9 9-32 28.3-32 50.6c0 30.9 25.1 56 56 56s56-25.1 56-56c0-22.3-13.1-41.6-32-50.6l0-98.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-1.6 20.8 8.6 41.6 27.8 52.8c26.8 15.5 61 6.3 76.5-20.5s6.3-61-20.5-76.5c-1.3-.8-2.7-1.5-4-2.1l0-90.8c1.4-.6 2.7-1.3 4-2.1c26.8-15.5 36-49.7 20.5-76.5S390.8 96 364 111.5c-19.3 11.1-29.4 32-27.8 52.8l-50.6 28.9c11.5 11.2 19.9 25.6 23.8 41.7L360 205.9c2.6 1.8 5.2 3.3 8 4.7l0 90.8c-2.8 1.3-5.5 2.9-8 4.6l-80.1-45.8c.1-1.4 .2-2.8 .2-4.3c0-22.3-13.1-41.6-32-50.6l0-98.8z"/></svg>',
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatYear(year: number | null): string {
  return year === null ? '—' : String(year);
}

export function formatRange(range: [number, number]): string {
  return `${range[0]}–${range[1]}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

export function countryCount(sites: Site[]): number {
  return new Set(sites.map((site) => site.country).filter(Boolean)).size;
}

export function siteMeta(site: Site): string {
  return [site.country, formatYear(site.year), TYPE_LABEL[site.type]].filter(Boolean).join(' · ');
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function siteSearchText(site: Site): string {
  return normalizeSearch(
    [site.name, site.country, site.description, site.criteria, site.unescoId]
      .filter(Boolean)
      .join(' '),
  );
}

export function markerIconHtml(type: SiteType, selected = false, highlighted = false): string {
  const classes = [
    'wh-marker',
    selected ? 'wh-marker--selected' : '',
    highlighted ? 'wh-marker--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<div class="${classes}" style="--marker-color:${TYPE_COLOR[type]}"><span class="wh-marker__pin"><span class="wh-marker__icon">${TYPE_ICON[type]}</span></span></div>`;
}

export function clusterSize(count: number): number {
  if (count >= 100) return 58;
  if (count >= 10) return 46;
  return 38;
}

export function clusterIconHtml(count: number, dominant: SiteType): string {
  const size = clusterSize(count);
  return `<div class="wh-cluster" style="width:${size}px;height:${size}px;font-size:${count >= 100 ? 14 : 12}px"><span class="wh-cluster__ring" style="--ring-color:${TYPE_COLOR[dominant]}"></span>${count}</div>`;
}

export function dominantType(types: SiteType[]): SiteType {
  const counts: Record<SiteType, number> = { cultural: 0, natural: 0, mixed: 0 };
  for (const type of types) counts[type] += 1;
  let best: SiteType = 'cultural';
  for (const type of TYPE_ORDER) {
    if (counts[type] > counts[best]) best = type;
  }
  return best;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function siteTooltipHtml(site: Site): string {
  return `<div class="wh-tooltip__title">${escapeHtml(site.name)}</div><div class="wh-tooltip__meta">${escapeHtml(siteMeta(site))}</div>`;
}

export function inBounds(site: Site, bounds: Bounds | null): boolean {
  if (!bounds) return true;
  const [[south, west], [north, east]] = bounds;
  const latOk = site.lat >= south && site.lat <= north;
  const lonOk = west <= east ? site.lon >= west && site.lon <= east : site.lon >= west || site.lon <= east;
  return latOk && lonOk;
}
