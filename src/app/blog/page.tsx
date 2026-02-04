'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
import { BlogSection } from '@/components/ui/blog-section';
import { LuminaInsightsHero } from '@/components/ui/lumina-insights-hero';
import { blogPosts, getLatestPosts } from '@/lib/blog-data';

export default function BlogPage() {
    // Get latest 5 posts for hero
    const latestPosts = getLatestPosts(5);

    // Get remaining posts for listing (posts 6-15)
    const remainingPosts = blogPosts.slice(5);

    // Convert to BlogSection format
    const blogSectionPosts = remainingPosts.map(post => ({
        title: post.title,
        slug: `/blog/${post.slug}`,
        description: post.excerpt,
        image: post.thumbnailImage,
        createdAt: post.date,
        author: post.author,
        readTime: post.readTime,
        category: post.category,
    }));

    return (
        <PageTransition>
            <main className="min-h-screen" style={{ backgroundColor: '#F6F6F5' }}>
                <Navigation alwaysScrolled={false} />

                {/* Lumina Interactive Hero with Latest 5 Blogs */}
                <LuminaInsightsHero posts={latestPosts} />

                {/* Blog Listing Section */}
                <BlogSection
                    heading="More Insights"
                    description="Expert analysis and research on real estate trends, investment strategies, and property market updates."
                    posts={blogSectionPosts}
                />

                <Footer />
            </main>
        </PageTransition>
    );
}
