import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { projectUrl, propertyUrl } from '@/lib/seo/urls';

const BASE_URL = 'https://www.27estates.com';

function supabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
    // 0 = static routes, 1 = projects, 2 = properties, 3 = blog
    return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    if (id === 0) return staticRoutes();
    if (id === 1) return projectsSitemap();
    if (id === 2) return propertiesSitemap();
    if (id === 3) return blogSitemap();
    return [];
}

function staticRoutes(): MetadataRoute.Sitemap {
    const now = new Date();
    return [
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
        { url: `${BASE_URL}/invest`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/blog`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/services`, lastModified: now, priority: 0.8, changeFrequency: 'monthly' },
        { url: `${BASE_URL}/careers`, lastModified: now, priority: 0.6, changeFrequency: 'weekly' },
        { url: `${BASE_URL}/llms.txt`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
    ];
}

async function projectsSitemap(): Promise<MetadataRoute.Sitemap> {
    const { data } = await supabase()
        .from('projects')
        .select('id, slug, updated_at');
    return (data ?? []).map((p: { id: string; slug: string | null; updated_at: string | null }) => ({
        url: `${BASE_URL}${projectUrl({ id: p.id, slug: p.slug })}`,
        lastModified: new Date(p.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));
}

async function propertiesSitemap(): Promise<MetadataRoute.Sitemap> {
    const { data } = await supabase()
        .from('properties')
        .select('id, slug, updated_at');
    return (data ?? []).map((p: { id: string; slug: string | null; updated_at: string | null }) => ({
        url: `${BASE_URL}${propertyUrl({ id: p.id, slug: p.slug })}`,
        lastModified: new Date(p.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));
}

async function blogSitemap(): Promise<MetadataRoute.Sitemap> {
    const { data } = await supabase()
        .from('blogs')
        .select('slug, updated_at, published_at')
        .not('published_at', 'is', null);
    return (data ?? []).map((b: { slug: string; updated_at: string | null; published_at: string | null }) => ({
        // Blog detail route is /blog/[slug] (singular). Previous sitemap used
        // /blogs/${id} which 404'd — fixed here.
        url: `${BASE_URL}/blog/${b.slug}`,
        lastModified: new Date(b.updated_at || b.published_at || Date.now()),
        priority: 0.7,
        changeFrequency: 'monthly' as const,
    }));
}
