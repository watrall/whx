export type SiteType = 'cultural' | 'natural' | 'mixed';

/** One Commons photograph of a site, with the credit its licence asks for. */
export interface SitePhoto {
  /** A Commons Special:FilePath URL, or an Unsplash image URL. */
  url: string;
  /** The author, when Commons names one. */
  by: string | null;
  /** The licence, such as "CC BY-SA 4.0". */
  license: string | null;
  /** Where the photo comes from. Commons photos are credited through their file page. */
  source: 'commons' | 'unsplash';
  /** For an Unsplash photo: its page, and its photographer's page, for the credit links. */
  page: string | null;
  byUrl: string | null;
}

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
  /** The first photo, for list thumbnails. */
  image: string | null;
  /** Up to five photos for the card header, the first being `image`. */
  photos: SitePhoto[];
  /** Selection criteria codes such as ["ii", "iv"]. */
  criteriaCodes: string[];
  /** How many separate places make up the property. 1 for most sites. */
  parts: number;
}

export type YearRange = [number, number];

export type Bounds = [[number, number], [number, number]];
