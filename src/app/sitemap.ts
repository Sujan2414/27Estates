import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient();
    const baseUrl = 'https://www.27estates.com';

    // Fetch dynamic routes
    const { data: properties } = await supabase.from('properties').select('id, updated_at');
    const { data: projects } = await supabase.from('projects').select('id, updated_at');
    const { data: blogs } = await supabase.from('blogs').select('id, updated_at');

    const propertyUrls = (properties || []).map((property) => ({
        url: `${baseUrl}/properties/${property.id}`,
        lastModified: new Date(property.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));

    const projectUrls = (projects || []).map((project) => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: new Date(project.updated_at || Date.now()),
        priority: 0.8,
        changeFrequency: 'weekly' as const,
    }));

    const blogUrls = (blogs || []).map((blog) => ({
        url: `${baseUrl}/blogs/${blog.id}`,
        lastModified: new Date(blog.updated_at || Date.now()),
        priority: 0.7,
        changeFrequency: 'monthly' as const,
    }));

    const staticRoutes = [
        '',
        '/properties',
        '/projects',
        '/about',
        '/contact',
        '/invest',
        '/blogs',
        '/login',
        '/admin/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        priority: route === '' ? 1.0 : 0.8,
        changeFrequency: 'daily' as const,
    }));

    return [...staticRoutes, ...propertyUrls, ...projectUrls, ...blogUrls];
}
