// Internal URL helpers — always prefer slug, fall back to UUID. Use these
// for ALL internal links to projects/properties so the sitemap, schema, and
// link equity all flow to the canonical (slug) URL.

type WithHandle = { id?: string | null; slug?: string | null };

export function projectUrl(p: WithHandle): string {
  const handle = p.slug || p.id;
  if (!handle) throw new Error('projectUrl requires id or slug');
  return `/projects/${handle}`;
}

export function propertyUrl(p: WithHandle): string {
  const handle = p.slug || p.id;
  if (!handle) throw new Error('propertyUrl requires id or slug');
  return `/properties/${handle}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(handle: string): boolean {
  return UUID_RE.test(handle);
}
