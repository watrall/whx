import { countryAliases } from './countryAliases.ts';
import type { Bounds, Site, SiteType } from './types.ts';

export const TYPE_ORDER: SiteType[] = ['cultural', 'natural', 'mixed'];

export const TYPE_LABEL: Record<SiteType, string> = {
  cultural: 'Cultural',
  natural: 'Natural',
  mixed: 'Mixed',
};

export const TYPE_COLOR: Record<SiteType, string> = {
  cultural: 'oklch(var(--type-cultural))',
  natural: 'oklch(var(--type-natural))',
  mixed: 'oklch(var(--type-mixed))',
};

export const TYPE_TINT: Record<SiteType, string> = {
  cultural: 'oklch(var(--type-cultural-tint))',
  natural: 'oklch(var(--type-natural-tint))',
  mixed: 'oklch(var(--type-mixed-tint))',
};

export const TYPE_INK: Record<SiteType, string> = {
  cultural: 'oklch(var(--type-cultural-ink))',
  natural: 'oklch(var(--type-natural-ink))',
  mixed: 'oklch(var(--type-mixed-ink))',
};

export const TYPE_ICON_SHAPE: Record<SiteType, { viewBox: string; path: string }> = {
  cultural: {
    viewBox: '0 0 512 512',
    path: 'M0 80c0 26.5 21.5 48 48 48H64v64h64V128h96v64h64V128h96v64h64V128h16c26.5 0 48-21.5 48-48V13.4C512 6 506 0 498.6 0c-1.7 0-3.4 .3-5 1l-49 19.6C425.7 28.1 405.5 32 385.2 32H126.8c-20.4 0-40.5-3.9-59.4-11.4L18.4 1c-1.6-.6-3.3-1-5-1C6 0 0 6 0 13.4V80zM64 288V480c0 17.7 14.3 32 32 32s32-14.3 32-32V288H384V480c0 17.7 14.3 32 32 32s32-14.3 32-32V288h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H64z',
  },
  natural: {
    viewBox: '0 0 512 512',
    path: 'M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5h88c8.8 0 16 7.2 16 16s-7.2 16-16 16H288 216s0 0 0 0c-16.6 0-32.7 1.9-48.3 5.4c-25.9 5.9-49.9 16.4-71.4 30.7c0 0 0 0 0 0C38.3 298.8 0 364.9 0 440v16c0 13.3 10.7 24 24 24s24-10.7 24-24V440c0-48.7 20.7-92.5 53.8-123.2C121.6 392.3 190.3 448 272 448l1 0c132.1-.7 239-130.9 239-291.4c0-42.6-7.5-83.1-21.1-119.6c-2.6-6.9-12.7-6.6-16.2-.1C455.9 72.1 418.7 96 376 96L272 96z',
  },
  mixed: {
    viewBox: '0 0 448 512',
    path: 'M248 106.6c18.9-9 32-28.3 32-50.6c0-30.9-25.1-56-56-56s-56 25.1-56 56c0 22.3 13.1 41.6 32 50.6l0 98.8c-2.8 1.3-5.5 2.9-8 4.7l-80.1-45.8c1.6-20.8-8.6-41.6-27.9-52.8C57.2 96 23 105.2 7.5 132S1.2 193 28 208.5c1.3 .8 2.6 1.5 4 2.1l0 90.8c-1.3 .6-2.7 1.3-4 2.1C1.2 319-8 353.2 7.5 380S57.2 416 84 400.5c19.3-11.1 29.4-32 27.8-52.8l50.5-28.9c-11.5-11.2-19.9-25.6-23.8-41.7L88 306.1c-2.6-1.8-5.2-3.3-8-4.7l0-90.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-.1 1.4-.2 2.8-.2 4.3c0 22.3 13.1 41.6 32 50.6l0 98.8c-18.9 9-32 28.3-32 50.6c0 30.9 25.1 56 56 56s56-25.1 56-56c0-22.3-13.1-41.6-32-50.6l0-98.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-1.6 20.8 8.6 41.6 27.8 52.8c26.8 15.5 61 6.3 76.5-20.5s6.3-61-20.5-76.5c-1.3-.8-2.7-1.5-4-2.1l0-90.8c1.4-.6 2.7-1.3 4-2.1c26.8-15.5 36-49.7 20.5-76.5S390.8 96 364 111.5c-19.3 11.1-29.4 32-27.8 52.8l-50.6 28.9c11.5 11.2 19.9 25.6 23.8 41.7L360 205.9c2.6 1.8 5.2 3.3 8 4.7l0 90.8c-2.8 1.3-5.5 2.9-8 4.6l-80.1-45.8c.1-1.4 .2-2.8 .2-4.3c0-22.3-13.1-41.6-32-50.6l0-98.8z',
  },
};

function typeIconSvg(type: SiteType): string {
  const { viewBox, path } = TYPE_ICON_SHAPE[type];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
}

/** Canonical UNESCO page for a site: its numeric ID is the number in the address. */
export function unescoUrl(site: Pick<Site, 'id'>): string {
  return `https://whc.unesco.org/en/list/${site.id}/`;
}

/** Commons file page for an image served via Special:FilePath, for attribution. */
export function imageCreditUrl(image: string | null): string | null {
  if (!image) return null;
  try {
    const url = new URL(image);
    const prefix = '/wiki/Special:FilePath/';
    if (!url.pathname.startsWith(prefix)) return null;
    return `https://commons.wikimedia.org/wiki/File:${url.pathname.slice(prefix.length)}`;
  } catch {
    return null;
  }
}

export function photoCreditText(photo: { by: string | null; license: string | null }): string {
  const parts = [photo.by, photo.license].filter(Boolean);
  return parts.length > 0 ? `Photo: ${parts.join(', ')}` : 'Photo: Wikimedia Commons';
}

const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

/** Opens the device's own maps app or site with the site as the destination. */
export function directionsUrl(site: Pick<Site, 'lat' | 'lon' | 'name'>, apple = IS_APPLE): string {
  const point = `${site.lat},${site.lon}`;
  if (apple) {
    return `https://maps.apple.com/?daddr=${point}&q=${encodeURIComponent(site.name)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${point}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatYear(year: number | null): string {
  return year === null ? '—' : String(year);
}

export function formatRange(range: [number, number]): string {
  return `${range[0]}–${range[1]}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

export function countryCount(sites: Site[]): number {
  return new Set(sites.flatMap((site) => site.countries)).size;
}

/** Short country label: one name, "A & B", or "A +N more" for large serial sites. */
export function countryLabel(site: Pick<Site, 'countries' | 'country'>): string {
  const list = site.countries.length > 0 ? site.countries : site.country ? [site.country] : [];
  if (list.length <= 1) return list[0] ?? '';
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list[0]} +${list.length - 1} more`;
}

export function siteMeta(site: Site): string {
  return [countryLabel(site), formatYear(site.year), TYPE_LABEL[site.type]].filter(Boolean).join(' · ');
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Whether a search word is found in a site's search text. Longer words match anywhere, so
 * "cath" finds "Cathedral". Words of one or two letters and numbers must match a whole word,
 * so "uk" does not match Ukraine and "158" does not match site 1158.
 */
export function tokenMatches(text: string, token: string): boolean {
  if (token.length <= 2 || /^\d+$/.test(token)) return ` ${text} `.includes(` ${token} `);
  return text.includes(token);
}

export function siteSearchText(site: Site): string {
  return normalizeSearch(
    [site.name, site.countries.join(' '), countryAliases(site.countries), site.id].filter(Boolean).join(' '),
  );
}

export function markerIconHtml(
  type: SiteType,
  selected = false,
  highlighted = false,
  danger = false,
): string {
  const classes = [
    'wh-marker',
    selected ? 'wh-marker--selected' : '',
    highlighted ? 'wh-marker--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const badge = danger
    ? `<span class="wh-marker__danger" title="In danger"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Zm1 13h-2v-2h2v2Zm0-4h-2V9h2v3Z" fill="currentColor"/></svg></span>`
    : '';
  return `<div class="${classes}" style="--marker-color:${TYPE_COLOR[type]}"><span class="wh-marker__pin"><span class="wh-marker__icon">${typeIconSvg(type)}</span></span>${badge}</div>`;
}

export function clusterSize(count: number): number {
  if (count >= 100) return 58;
  if (count >= 10) return 46;
  return 38;
}

export function typeCounts(types: SiteType[]): Record<SiteType, number> {
  const counts: Record<SiteType, number> = { cultural: 0, natural: 0, mixed: 0 };
  for (const type of types) counts[type] += 1;
  return counts;
}

/** Conic gradient with one arc per type, sized by share of the cluster. */
function clusterRingGradient(counts: Record<SiteType, number>): string {
  const total = TYPE_ORDER.reduce((sum, type) => sum + counts[type], 0) || 1;
  let cursor = 0;
  const stops: string[] = [];
  for (const type of TYPE_ORDER) {
    if (counts[type] === 0) continue;
    const next = cursor + (counts[type] / total) * 100;
    stops.push(`${TYPE_COLOR[type]} ${cursor.toFixed(2)}% ${next.toFixed(2)}%`);
    cursor = next;
  }
  return `conic-gradient(${stops.join(', ')})`;
}

export function clusterIconHtml(count: number, counts: Record<SiteType, number>): string {
  const size = clusterSize(count);
  return `<div class="wh-cluster" style="width:${size}px;height:${size}px;font-size:${count >= 100 ? 14 : 12}px"><span class="wh-cluster__ring" style="background:${clusterRingGradient(counts)}"></span>${count}</div>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function inBounds(site: Site, bounds: Bounds | null): boolean {
  if (!bounds) return true;
  const [[south, west], [north, east]] = bounds;
  const latOk = site.lat >= south && site.lat <= north;
  const lonOk = west <= east ? site.lon >= west && site.lon <= east : site.lon >= west || site.lon <= east;
  return latOk && lonOk;
}
