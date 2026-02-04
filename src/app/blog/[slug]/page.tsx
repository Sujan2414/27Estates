import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
import { blogPosts, getBlogBySlug } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import BlogPostContent from './BlogPostContent';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for export if using static generation
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const resolvedParams = await params;
    const post = getBlogBySlug(resolvedParams.slug);

    if (!post) {
        notFound();
    }

    return (
        <PageTransition>
            <main className="min-h-screen bg-white">
                <Navigation />
                <BlogPostContent post={post} />
                <Footer />
            </main>
        </PageTransition>
    );
}
