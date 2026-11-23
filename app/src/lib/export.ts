import type { Site } from './types.ts';
import { TYPE_LABEL, unescoUrl } from './utils.ts';

const COLUMNS = [
  'unesco_id',
  'name',
  'countries',
  'inscribed',
  'type',
  'criteria',
  'in_danger',
  'latitude',
  'longitude',
  'unesco_url',
  'wikidata_id',
] as const;

const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Quotes a CSV cell. Cells that start with a formula character get a leading
 * apostrophe so a spreadsheet shows them as text instead of running them.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (!PLAIN_NUMBER.test(text) && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function row(site: Site): string[] {
  return [
    site.id,
    site.name,
    site.countries.join('; '),
    site.year === null ? '' : String(site.year),
    TYPE_LABEL[site.type],
    site.criteriaCodes.join('; '),
    site.danger ? 'yes' : 'no',
    String(site.lat),
    String(site.lon),
    unescoUrl(site),
    site.qid ?? '',
  ];
}

/** CSV with a UTF-8 byte order mark so Excel reads accents correctly. */
export function toCsv(sites: Site[]): string {
  const lines = [COLUMNS.join(','), ...sites.map((site) => row(site).map(csvCell).join(','))];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function toGeoJson(sites: Site[]): string {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: sites.map((site) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [site.lon, site.lat] },
        properties: {
          unesco_id: site.id,
          name: site.name,
          countries: site.countries,
          inscribed: site.year,
          type: TYPE_LABEL[site.type],
          criteria: site.criteriaCodes,
          in_danger: site.danger,
          unesco_url: unescoUrl(site),
          wikidata_id: site.qid,
        },
      })),
    },
    null,
    1,
  );
}

export function downloadText(filename: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
