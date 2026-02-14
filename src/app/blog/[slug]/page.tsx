import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const resolvedParams = await params;
    const supabase = await createClient();

    const dbBlog = await fetchBlogBySlug(supabase, resolvedParams.slug);
    if (!dbBlog) {
        notFound();
    }

    const post = mapDbBlogToPost(dbBlog);
    const relatedPosts = await fetchRelatedPosts(supabase, dbBlog.slug, dbBlog.tags, 3);

    return (
        <main className="min-h-screen bg-white">
            <Navigation />
            <BlogPostContent post={post} relatedPosts={relatedPosts} />
            <Footer />
        </main>
    );
}
