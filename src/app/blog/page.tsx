import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchPublishedBlogs, mapDbBlogToPost } from '@/lib/blog-utils';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import BlogPageClient from './BlogPageClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Real Estate Blog | Bangalore Luxury Property Insights & Market Trends | 27 Estates',
    description:
        'Latest insights on luxury real estate in Bangalore — market trends, area guides, project reviews, RERA updates, and investment advice from 27 Estates.',
    keywords: [
        'bangalore real estate blog',
        'luxury real estate insights bangalore',
        'property market trends bangalore',
        'bangalore real estate news',
        'real estate investment advice bangalore',
    ],
    alternates: { canonical: '/blog' },
    openGraph: {
        title: 'Real Estate Blog | Bangalore Luxury Property Insights | 27 Estates',
        description:
            'Latest insights on luxury real estate in Bangalore from 27 Estates.',
        url: `${SITE_URL}/blog`,
        type: 'website',
    },
};

export default async function BlogPage() {
    const supabase = await createClient();
    const dbBlogs = await fetchPublishedBlogs(supabase);
    const allPosts = dbBlogs.map(mapDbBlogToPost);

    const latestPosts = allPosts.slice(0, 5);
    const remainingPosts = allPosts.slice(5);

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
    ]);

    const itemListSchema = allPosts.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: '27 Estates Real Estate Blog',
            numberOfItems: allPosts.length,
            itemListElement: allPosts.slice(0, 20).map((post, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${SITE_URL}/blog/${post.slug}`,
                name: post.title,
                ...(post.heroImage ? { image: post.heroImage } : {}),
            })),
        }
        : null;

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={itemListSchema} />
            <BlogPageClient latestPosts={latestPosts} remainingPosts={remainingPosts} />
        </>
    );
}
