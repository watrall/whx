const DANGER_URL = '/data/danger.json';

export interface DangerAttribution {
  holder: string;
  page: string;
  source: string;
  revision: number;
  license: string;
  licenseUrl: string;
}

export interface DangerNote {
  /** Year the site went on the List of World Heritage in Danger. */
  since: number;
  reason?: string;
}

export interface DangerData {
  attribution: DangerAttribution;
  sites: Record<string, DangerNote>;
}

let promise: Promise<DangerData | null> | null = null;

/** Small (about 7 KB), so it loads once, the first time a card for an endangered site opens. */
export function loadDangerNotes(): Promise<DangerData | null> {
  if (!promise) {
    promise = fetch(DANGER_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (typeof payload !== 'object' || payload === null) return null;
        const { attribution, sites } = payload as Partial<DangerData>;
        if (!attribution || !sites || typeof sites !== 'object') return null;
        return { attribution, sites };
      })
      .catch(() => {
        promise = null; // allow a retry on the next card
        return null;
      });
  }
  return promise;
}

/** Sentence-style ending for terse reasons such as "Russo-Ukrainian War". */
export function withPeriod(text: string): string {
  return /[.!?”"]$/.test(text) ? text : `${text}.`;
}
