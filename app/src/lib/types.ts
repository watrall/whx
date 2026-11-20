export type SiteType = 'cultural' | 'natural' | 'mixed';

export interface Site {
  id: string;
  name: string;
  /** Primary country, used for sorting and short labels. */
  country: string;
  /** Every country the property spans, from UNESCO where available. */
  countries: string[];
  /** Wikidata's country name when it differs from UNESCO's, kept for search. */
  countryAlias: string;
  description: string;
  lat: number;
  lon: number;
  year: number | null;
  /** On UNESCO's List of World Heritage in Danger. */
  danger: boolean;
  type: SiteType;
  image: string | null;
  officialUrl: string | null;
  unescoId: string | null;
  criteria: string | null;
}

export type YearRange = [number, number];

export type Bounds = [[number, number], [number, number]];
