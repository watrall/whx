import type { Site } from './types.ts';

const FACTS_URL = 'data/unesco.json';
const TEXT_URL = 'data/unesco-text.json';

export interface UnescoAttribution {
  holder: string;
  source: string;
  license: string;
  licenseUrl: string;
  note: string;
}

interface UnescoFacts {
  countries: string[];
  year: number | null;
  danger: boolean;
}

/** Numeric UNESCO ID without extension suffixes: "710bis" and "686rev" give "710" and "686". */
export function unescoNumber(unescoId: string | null): string | null {
  return unescoId?.match(/^\d+/)?.[0] ?? null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Official country lists and inscription years from UNESCO. Optional: if the
 * file is missing the app keeps Wikidata's values.
 */
export async function loadUnescoFacts(signal?: AbortSignal): Promise<Record<string, UnescoFacts>> {
  try {
    const response = await fetch(FACTS_URL, { signal });
    if (!response.ok) return {};
    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || !('sites' in payload)) return {};
    const sites = (payload as { sites: unknown }).sites;
    if (typeof sites !== 'object' || sites === null) return {};

    const facts: Record<string, UnescoFacts> = {};
    for (const [id, value] of Object.entries(sites)) {
      if (typeof value !== 'object' || value === null) continue;
      const record = value as { countries?: unknown; year?: unknown; danger?: unknown };
      facts[id] = {
        countries: isStringArray(record.countries) ? record.countries : [],
        year: typeof record.year === 'number' ? record.year : null,
        danger: record.danger === true,
      };
    }
    return facts;
  } catch {
    return {};
  }
}

/** Prefers UNESCO's countries and year; keeps Wikidata's when UNESCO has no record. */
export function applyUnescoFacts(sites: Site[], facts: Record<string, UnescoFacts>): Site[] {
  return sites.map((site) => {
    const number = unescoNumber(site.unescoId);
    const record = number ? facts[number] : undefined;
    if (!record) return site;
    const countries = record.countries.length > 0 ? record.countries : site.countries;
    return {
      ...site,
      countries,
      country: countries[0] ?? site.country,
      // Wikidata's name stays searchable ("Turkey" still finds "Türkiye").
      countryAlias: site.country && site.country !== countries[0] ? site.country : '',
      year: record.year ?? site.year,
      danger: record.danger,
    };
  });
}

export interface UnescoText {
  attribution: UnescoAttribution;
  text: Record<string, string[]>;
}

let textPromise: Promise<UnescoText | null> | null = null;

/** Descriptions are large (about 0.75MB), so they load once, on first use. */
export function loadUnescoText(): Promise<UnescoText | null> {
  if (!textPromise) {
    textPromise = fetch(TEXT_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (typeof payload !== 'object' || payload === null) return null;
        const { attribution, text } = payload as Partial<UnescoText>;
        if (!attribution || !text) return null;
        return { attribution, text };
      })
      .catch(() => {
        textPromise = null; // allow a retry on the next card
        return null;
      });
  }
  return textPromise;
}
