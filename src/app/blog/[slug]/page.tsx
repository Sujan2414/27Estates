import React from 'react';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { createClient } from '@/lib/supabase/server';
import { fetchBlogBySlug, fetchRelatedPosts, mapDbBlogToPost } from '@/lib/blog-utils';
import { notFound } from 'next/navigation';
import BlogPostContent from './BlogPostContent';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const dbBlog = await fetchBlogBySlug(supabase, slug);
    if (!dbBlog) return {};
    const description = dbBlog.excerpt || `Read "${dbBlog.title}" on the 27 Estates blog — luxury real estate insights for Bangalore and beyond.`;
    return {
        title: dbBlog.title,
        description,
        alternates: { canonical: `/blog/${dbBlog.slug}` },
        openGraph: {
            title: dbBlog.title,
            description,
            url: `https://www.27estates.com/blog/${dbBlog.slug}`,
            type: 'article',
            ...(dbBlog.cover_image
                ? { images: [{ url: dbBlog.cover_image, width: 1200, height: 630, alt: dbBlog.title }] }
                : {}),
            publishedTime: dbBlog.published_at ?? dbBlog.created_at,
            modifiedTime: dbBlog.updated_at,
            authors: dbBlog.author ? [dbBlog.author] : undefined,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const resolvedParams = await params;
    const supabase = await createClient();

    const dbBlog = await fetchBlogBySlug(supabase, resolvedParams.slug);
    if (!dbBlog) {
        notFound();
    }

    const post = mapDbBlogToPost(dbBlog);
    const relatedPosts = await fetchRelatedPosts(supabase, dbBlog.slug, dbBlog.tags, 3);

    const articleSchema = buildArticleSchema({
        title: dbBlog.title,
        description: dbBlog.excerpt,
        url: `/blog/${dbBlog.slug}`,
        imageUrl: dbBlog.cover_image,
        authorName: dbBlog.author,
        datePublished: dbBlog.published_at ?? dbBlog.created_at,
        dateModified: dbBlog.updated_at,
    });
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: dbBlog.title, url: `/blog/${dbBlog.slug}` },
    ]);

    return (
        <main className="min-h-screen bg-white">
            <JsonLd data={articleSchema} />
            <JsonLd data={breadcrumbSchema} />
            <Navigation />
            <BlogPostContent post={post} relatedPosts={relatedPosts} />
            <Footer />
        </main>
    );
}
