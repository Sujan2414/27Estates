// City canonicalization — handles the Bangalore/Bengaluru name-variant
// problem (the city was officially renamed in 2014, but databases and
// listing portals still use both names interchangeably).
//
// Use canonicalCity() when:
//   - Building a city dropdown (so users see one entry instead of two/three)
//   - Filtering listings by city (so a "Bangalore" filter also matches
//     rows stored as "Bengaluru")
//
// "Bengaluru Rural" is intentionally NOT collapsed into Bangalore — it's
// a genuinely different administrative district (rural ring outside the
// city corporation).

const SYNONYMS: Record<string, string> = {
    bangalore: 'Bangalore',
    bengaluru: 'Bangalore',
    blr: 'Bangalore',
    bombay: 'Mumbai',
    mumbai: 'Mumbai',
    'new delhi': 'Delhi',
    delhi: 'Delhi',
};

/**
 * Returns the canonical display form of a city name.
 * Falls back to the original (trimmed, title-cased) string if not a known
 * synonym, so newly-added cities flow through unchanged.
 */
export function canonicalCity(raw: string | null | undefined): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const key = trimmed.toLowerCase();
    if (SYNONYMS[key]) return SYNONYMS[key];
    return trimmed;
}

/**
 * Returns true iff two city strings should be treated as the same canonical
 * city (case-insensitive, synonym-aware).
 */
export function citiesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
    const ca = canonicalCity(a);
    const cb = canonicalCity(b);
    if (!ca || !cb) return false;
    return ca.toLowerCase() === cb.toLowerCase();
}

/**
 * Dedupes a list of city strings to canonical forms, preserving order of
 * first occurrence. Empty / null entries are dropped.
 */
export function dedupeCities(raw: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of raw) {
        const canonical = canonicalCity(c);
        if (!canonical) continue;
        const key = canonical.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(canonical);
    }
    return out;
}
