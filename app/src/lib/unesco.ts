const TEXT_URL = '/data/unesco-text.json';
const PARTS_URL = '/data/unesco-parts.json';

export interface UnescoAttribution {
  holder: string;
  source: string;
  license: string;
  licenseUrl: string;
  note: string;
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

/** [latitude, longitude] of each place that makes up a serial site. */
export type PartPoint = [number, number];

let partsPromise: Promise<Record<string, PartPoint[]> | null> | null = null;

/** Component points for serial sites (about 100KB), loaded the first time one is opened. */
export function loadParts(): Promise<Record<string, PartPoint[]> | null> {
  if (!partsPromise) {
    partsPromise = fetch(PARTS_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (typeof payload !== 'object' || payload === null || !('parts' in payload)) return null;
        const parts = (payload as { parts: unknown }).parts;
        return typeof parts === 'object' && parts !== null ? (parts as Record<string, PartPoint[]>) : null;
      })
      .catch(() => {
        partsPromise = null;
        return null;
      });
  }
  return partsPromise;
}
