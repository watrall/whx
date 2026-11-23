export type SiteType = 'cultural' | 'natural' | 'mixed';

export interface CommonsPhoto {
  source: 'commons';
  url: string;
  by: string | null;
  license: string | null;
}

export interface UnsplashPhoto {
  source: 'unsplash';
  url: string;
  by: string | null;
  page: string | null;
  byUrl: string | null;
}

export type SitePhoto = CommonsPhoto | UnsplashPhoto;

export interface Site {
  /** UNESCO's numeric ID, such as "20". It is also the number in the UNESCO page address. */
  id: string;
  /** The matching Wikidata item, for the source link. Absent for a few sites. */
  qid: string | null;
  /** UNESCO's official name. */
  name: string;
  /** Primary country, used for sorting and short labels. */
  country: string;
  /** Every country the property spans. */
  countries: string[];
  /** The pin: for a serial site, the component nearest the middle of its parts. */
  lat: number;
  lon: number;
  year: number | null;
  /** On UNESCO's List of World Heritage in Danger. */
  danger: boolean;
  type: SiteType;
  image: string | null;
  /** Selection criteria codes such as ["ii", "iv"]. */
  criteriaCodes: string[];
  /** How many separate places make up the property. 1 for most sites. */
  parts: number;
}

export type YearRange = [number, number];

export type Bounds = [[number, number], [number, number]];
