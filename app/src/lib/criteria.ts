export interface Criterion {
  code: string;
  /** Short label for lists and chips. */
  label: string;
  /** UNESCO's wording, lightly shortened. */
  description: string;
}

// Selection criteria from the Operational Guidelines. (i) to (vi) are cultural,
// (vii) to (x) natural.
const CRITERIA: Record<string, Omit<Criterion, 'code'>> = {
  i: {
    label: 'Creative masterpiece',
    description: 'Represents a masterpiece of human creative genius.',
  },
  ii: {
    label: 'Exchange of values',
    description:
      'Shows an important interchange of human values, in architecture, technology, art or town planning.',
  },
  iii: {
    label: 'Living testimony',
    description:
      'Bears a unique or exceptional testimony to a cultural tradition or a civilization, living or vanished.',
  },
  iv: {
    label: 'Defining example',
    description:
      'An outstanding example of a building, ensemble or landscape that illustrates a significant stage in human history.',
  },
  v: {
    label: 'Traditional settlement',
    description:
      'An outstanding example of traditional human settlement or land use, especially one vulnerable to change.',
  },
  vi: {
    label: 'Ideas and beliefs',
    description:
      'Directly associated with events, traditions, ideas, beliefs or works of outstanding universal significance.',
  },
  vii: {
    label: 'Natural beauty',
    description: 'Contains superlative natural phenomena or areas of exceptional natural beauty.',
  },
  viii: {
    label: "Earth's history",
    description:
      "An outstanding example of major stages of Earth's history, including geological processes and landforms.",
  },
  ix: {
    label: 'Ecological processes',
    description:
      'An outstanding example of ongoing ecological and biological processes in the evolution of ecosystems.',
  },
  x: {
    label: 'Biodiversity habitat',
    description:
      'Holds the most important natural habitats for conserving biological diversity, including threatened species.',
  },
};

/** Every criterion in order: (i) to (vi) cultural, (vii) to (x) natural. */
export const ALL_CRITERIA: Criterion[] = Object.entries(CRITERIA).map(([code, entry]) => ({
  code,
  ...entry,
}));

export const CULTURAL_CODES = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];

/** The criteria for a list of codes such as ["ii", "iv"], in criteria order. */
export function criteriaFromCodes(codes: string[]): Criterion[] {
  return ALL_CRITERIA.filter((criterion) => codes.includes(criterion.code));
}

/** Parses Wikidata's "(ii)|(iv)" format into ordered, de-duplicated criteria. */
export function parseCriteria(raw: string | null): Criterion[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: Criterion[] = [];
  for (const match of raw.matchAll(/\(?\b([ivx]+)\b\)?/gi)) {
    const code = match[1].toLowerCase();
    const entry = CRITERIA[code];
    if (!entry || seen.has(code)) continue;
    seen.add(code);
    result.push({ code, ...entry });
  }
  const order = Object.keys(CRITERIA);
  return result.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
}
