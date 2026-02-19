'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogCards from '@/components/ui/blogs';
import { LuminaInsightsHero } from '@/components/ui/lumina-insights-hero';
import { BlogPost } from '@/lib/blog-data';

interface BlogPageClientProps {
    latestPosts: BlogPost[];
    remainingPosts: BlogPost[];
}

export default function BlogPageClient({ latestPosts, remainingPosts }: BlogPageClientProps) {
    const [heroKey] = useState(() => Date.now());

    return (
        <main className="min-h-screen" style={{ backgroundColor: '#F6F6F5' }}>
            <Navigation alwaysScrolled={false} />

            <LuminaInsightsHero key={heroKey} posts={latestPosts} />

            <div style={{
                position: 'relative',
                zIndex: 10,
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                marginTop: '-24px',
            }}>
                <BlogCards
                    subtitle="More From Us"
                    title="More Insights"
                    description="Expert analysis and research on real estate trends, investment strategies, and property market updates."
                    posts={remainingPosts}
                    showViewAll={false}
                    flush
                />

                <Footer />
            </div>
        </main>
    );
}
