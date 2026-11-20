export type SiteType = 'cultural' | 'natural' | 'mixed';

export interface Site {
  id: string;
  name: string;
  country: string;
  description: string;
  lat: number;
  lon: number;
  year: number | null;
  type: SiteType;
  image: string | null;
  officialUrl: string | null;
  unescoId: string | null;
  criteria: string | null;
}

export type YearRange = [number, number];

export type Bounds = [[number, number], [number, number]];
