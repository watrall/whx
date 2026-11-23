const MAX_LENGTH = 50;
const MIN_WORD_BREAK = 20;

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= MAX_LENGTH) return slug;
  const cut = slug.slice(0, MAX_LENGTH);
  const lastBreak = cut.lastIndexOf('-');
  return (lastBreak >= MIN_WORD_BREAK ? cut.slice(0, lastBreak) : cut).replace(/-+$/, '');
}
