import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { projectUrl, propertyUrl } from '@/lib/seo/urls';
import { ALL_AREAS } from '@/data/areas';
import { ALL_DEVELOPERS } from '@/data/developers';

const BASE_URL = 'https://www.27estates.com';

// Single-file sitemap. The previous version used Next.js `generateSitemaps`
// to split into sub-sitemaps, but the parameter shape changed in Next 16
// and all sub-sitemaps were rendering empty. Total URL count (~460) is far
// below the 50,000-per-sitemap limit, so collapsing back into a single
// sitemap.xml is both simpler and unambiguously correct.

function supabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: now, priority: 1.0, changeFrequency: 'daily' },
        { url: `${BASE_URL}/properties`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
        { url: `${BASE_URL}/properties/search`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
        { url: `${BASE_URL}/properties/projects`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
        { url: `${BASE_URL}/properties/commercial`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
        { url: `${BASE_URL}/properties/warehouse`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/bangalore/office-spaces`, lastModified: now, priority: 0.8, changeFrequency: 'daily' },
        { url: `${BASE_URL}/bangalore/commercial`, lastModified: now, priority: 0.8, changeFrequency: 'daily' },
        { url: `${BASE_URL}/bangalore/villas`, lastModified: now, priority: 0.8, changeFrequency: 'daily' },
        { url: `${BASE_URL}/pune/residential`, lastModified: now, priority: 0.8, changeFrequency: 'daily' },
        { url: `${BASE_URL}/about`, lastModified: now, priority: 0.7, changeFrequency: 'monthly' },
        { url: `${BASE_URL}/contact`, lastModified: now, priority: 0.7, changeFrequency: 'monthly' },
        { url: `${BASE_URL}/areas`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/developers`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/mortgage-calculator`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' },
        { url: `${BASE_URL}/invest`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/blog`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/services`, lastModified: now, priority: 0.8, changeFrequency: 'monthly' },
        { url: `${BASE_URL}/careers`, lastModified: now, priority: 0.6, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/llms.txt`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
    ];

    // Areas + Developers — only those flagged published (noindex=false)
    const areaRoutes: MetadataRoute.Sitemap = ALL_AREAS
        .filter((a) => !a.noindex)
        .map((a) => ({
            url: `${BASE_URL}/areas/${a.slug}`,
            lastModified: now,
            priority: 0.85,
            changeFrequency: 'weekly',
        }));
    const developerRoutes: MetadataRoute.Sitemap = ALL_DEVELOPERS
        .filter((d) => !d.noindex)
        .map((d) => ({
            url: `${BASE_URL}/developers/${d.slug}`,
            lastModified: now,
            priority: 0.85,
            changeFrequency: 'weekly',
        }));

    // Database-driven routes — fetch lazily so a build with no env still works
    let projectRoutes: MetadataRoute.Sitemap = [];
    let propertyRoutes: MetadataRoute.Sitemap = [];
    let blogRoutes: MetadataRoute.Sitemap = [];

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const sb = supabase();

        const [{ data: projects }, { data: properties }, { data: blogs }] = await Promise.all([
            sb.from('projects').select('id, slug, updated_at'),
            sb.from('properties').select('id, slug, updated_at'),
            sb.from('blogs').select('slug, updated_at, published_at').not('published_at', 'is', null),
        ]);

        type ProjectRow = { id: string; slug: string | null; updated_at: string | null };
        type PropertyRow = { id: string; slug: string | null; updated_at: string | null };
        type BlogRow = { slug: string; updated_at: string | null; published_at: string | null };

        projectRoutes = ((projects as ProjectRow[] | null) ?? []).map((p) => ({
            url: `${BASE_URL}${projectUrl({ id: p.id, slug: p.slug })}`,
            lastModified: new Date(p.updated_at || Date.now()),
            priority: 0.8,
            changeFrequency: 'weekly',
        }));
        propertyRoutes = ((properties as PropertyRow[] | null) ?? []).map((p) => ({
            url: `${BASE_URL}${propertyUrl({ id: p.id, slug: p.slug })}`,
            lastModified: new Date(p.updated_at || Date.now()),
            priority: 0.8,
            changeFrequency: 'weekly',
        }));
        // Blog detail route is /blog/[slug] (singular). Earlier versions of
        // this sitemap incorrectly emitted /blogs/${id} which 404'd.
        blogRoutes = ((blogs as BlogRow[] | null) ?? []).map((b) => ({
            url: `${BASE_URL}/blog/${b.slug}`,
            lastModified: new Date(b.updated_at || b.published_at || Date.now()),
            priority: 0.7,
            changeFrequency: 'monthly',
        }));
    }

    return [
        ...staticRoutes,
        ...areaRoutes,
        ...developerRoutes,
        ...projectRoutes,
        ...propertyRoutes,
        ...blogRoutes,
    ];
}
