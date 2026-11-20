import type { Site } from './types.ts';

/**
 * Turns site IDs from older links and saved lists into UNESCO numbers. Sites were once keyed by
 * their Wikidata item ("Q3678596"); they are keyed by UNESCO number now ("20"), and an old ID
 * is mapped through the site's Wikidata item. IDs that match nothing are dropped.
 */
export function canonicalIds(raw: Iterable<string>, sites: Site[]): Set<string> {
  const byId = new Set(sites.map((site) => site.id));
  const byQid = new Map(sites.filter((site) => site.qid).map((site) => [site.qid as string, site.id]));
  const out = new Set<string>();
  for (const id of raw) {
    if (byId.has(id)) out.add(id);
    else if (byQid.has(id)) out.add(byQid.get(id) as string);
  }
  return out;
}

/** The site an ID from a link refers to, whichever scheme it uses. */
export function findSite(id: string | null, sites: Site[]): Site | undefined {
  if (!id) return undefined;
  return sites.find((site) => site.id === id || site.qid === id);
}
