import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const baseUrl = 'https://www.27estates.com';

    // Fetch dynamic routes from database
    const [propertiesRes, projectsRes, blogsRes] = await Promise.all([
        supabase.from('properties').select('id, updated_at'),
        supabase.from('projects').select('id, updated_at'),
        supabase.from('blogs').select('id, updated_at'),
    ]);

    const propertyUrls = (propertiesRes.data || []).map((property) => ({
        url: `${baseUrl}/properties/${property.id}`,
        lastModified: new Date(property.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));

    const projectUrls = (projectsRes.data || []).map((project) => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: new Date(project.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));

    const blogUrls = (blogsRes.data || []).map((blog) => ({
        url: `${baseUrl}/blogs/${blog.id}`,
        lastModified: new Date(blog.updated_at || Date.now()),
        priority: 0.7,
        changeFrequency: 'monthly' as const,
    }));

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            priority: 1.0,
            changeFrequency: 'daily',
        },
        {
            url: `${baseUrl}/properties`,
            lastModified: new Date(),
            priority: 0.9,
            changeFrequency: 'daily',
        },
        {
            url: `${baseUrl}/projects`,
            lastModified: new Date(),
            priority: 0.9,
            changeFrequency: 'daily',
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            priority: 0.7,
            changeFrequency: 'monthly',
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            priority: 0.7,
            changeFrequency: 'monthly',
        },
        {
            url: `${baseUrl}/invest`,
            lastModified: new Date(),
            priority: 0.8,
            changeFrequency: 'weekly',
        },
        {
            url: `${baseUrl}/blogs`,
            lastModified: new Date(),
            priority: 0.8,
            changeFrequency: 'weekly',
        },
    ];

    return [...staticRoutes, ...propertyUrls, ...projectUrls, ...blogUrls];
}
