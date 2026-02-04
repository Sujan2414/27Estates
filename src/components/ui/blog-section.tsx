'use client';

import React from 'react';
import Link from 'next/link';
import { LazyImage } from './lazy-image';

interface BlogPost {
    title: string;
    slug: string;
    description: string;
    image: string;
    createdAt: string;
    author: string;
    readTime?: string;
    category?: string;
}

interface BlogSectionProps {
    heading?: string;
    description?: string;
    posts: BlogPost[];
}

export function BlogSection({
    heading = "More Insights",
    description = "Expert analysis and research on real estate trends, investment strategies, and property market updates.",
    posts = []
}: BlogSectionProps) {
    return (
        <section className="py-20" style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
            <div className="mx-auto w-full max-w-[1600px] px-[clamp(1.5rem,4vw,4rem)]">
                {/* Header */}
                {heading && (
                    <div className="text-center mb-12">
                        <h2
                            className="mb-4 text-2xl font-semibold md:text-3xl tracking-tight"
                            style={{
                                fontFamily: 'var(--font-heading)',
                                color: '#1a1a1a'
                            }}
                        >
                            {heading}
                        </h2>
                        <p
                            className="mx-auto max-w-2xl text-base md:text-lg"
                            style={{ color: '#555555' }}
                        >
                            {description}
                        </p>
                    </div>
                )}

                {/* Blog Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Link
                            href={post.slug}
                            key={post.title}
                            className="group flex flex-col gap-3 rounded-lg p-3 transition-all duration-200 hover:bg-white hover:shadow-lg"
                        >
                            <LazyImage
                                src={post.image}
                                fallback="https://placehold.co/640x360?text=21+Estates"
                                inView={true}
                                alt={post.title}
                                ratio={16 / 9}
                                className="transition-transform duration-500 group-hover:scale-105"
                                AspectRatioClassName="border-gray-200"
                            />
                            <div className="space-y-2 px-1 pb-2">
                                {/* Meta info */}
                                <div
                                    className="flex flex-wrap items-center gap-2 text-xs"
                                    style={{ color: '#888888' }}
                                >
                                    <span>by {post.author}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                                    <span>{post.createdAt}</span>
                                    {post.readTime && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                                            <span>{post.readTime}</span>
                                        </>
                                    )}
                                </div>

                                {/* Category tag */}
                                {post.category && (
                                    <span
                                        className="inline-block text-xs font-medium uppercase tracking-wider"
                                        style={{ color: 'var(--gold, #BFA270)' }}
                                    >
                                        {post.category}
                                    </span>
                                )}

                                {/* Title */}
                                <h3
                                    className="line-clamp-2 text-lg leading-tight font-semibold tracking-tight"
                                    style={{ color: '#1a1a1a' }}
                                >
                                    {post.title}
                                </h3>

                                {/* Description */}
                                <p
                                    className="line-clamp-3 text-sm leading-relaxed"
                                    style={{ color: '#555555' }}
                                >
                                    {post.description}
                                </p>

                                {/* Read more link */}
                                <span
                                    className="inline-flex items-center text-sm font-medium mt-2 group-hover:underline"
                                    style={{ color: 'var(--dark-turquoise, #1F524B)' }}
                                >
                                    Read more →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default BlogSection;
