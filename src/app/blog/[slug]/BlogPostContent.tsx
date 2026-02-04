'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Section from '@/components/ui/Section';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, User, Share2, ArrowRight } from 'lucide-react';
import { BlogPost, getRelatedPosts } from '@/lib/blog-data';

interface BlogPostContentProps {
    post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax and fade effect for hero
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
    const heroY = useTransform(scrollY, [0, 400], [0, 100]);
    const contentY = useTransform(scrollY, [0, 300], [0, -50]);

    // Get related posts
    const relatedPosts = getRelatedPosts(post.slug, 3);

    // Generate content with inline images
    const renderContentWithImages = () => {
        const contentParts = post.content.split('</h2>');

        return contentParts.map((part, index) => {
            const hasImage = post.contentImages && post.contentImages[index];
            return (
                <React.Fragment key={index}>
                    <div dangerouslySetInnerHTML={{ __html: part + (index < contentParts.length - 1 ? '</h2>' : '') }} />
                    {hasImage && index < contentParts.length - 1 && (
                        <motion.figure
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="my-10"
                        >
                            <div className="rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={post.contentImages[index]}
                                    alt={`${post.title} - illustration ${index + 1}`}
                                    width={1200}
                                    height={675}
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </motion.figure>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <>
            {/* Hero Section with Scroll Overlay Effect */}
            <div
                ref={heroRef}
                className="relative h-[80vh] min-h-[600px] flex items-end pb-20 overflow-hidden"
            >
                {/* Background with parallax */}
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: heroScale, y: heroY }}
                >
                    <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        priority
                        className="object-cover"
                    />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30"
                        style={{ opacity: heroOpacity }}
                    />
                </motion.div>

                {/* Dark overlay that stays visible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <motion.div
                    className="max-w-[1600px] mx-auto px-[clamp(1.5rem,4vw,4rem)] relative z-10 text-white w-full"
                    style={{ y: contentY }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6"
                    >
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-white/80 hover:text-white transition-colors uppercase tracking-widest text-xs font-semibold"
                        >
                            <ArrowLeft size={16} className="mr-2" /> Back to Insights
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <span
                            className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded mb-5"
                            style={{
                                backgroundColor: 'var(--gold, #BFA270)',
                                color: 'var(--dark-turquoise, #1F524B)'
                            }}
                        >
                            {post.category}
                        </span>
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-6 max-w-4xl"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 font-medium">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{post.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{post.readTime}</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Overlay Transition */}
            <div className="relative z-20 -mt-20">
                <div
                    className="h-24"
                    style={{
                        background: 'linear-gradient(to bottom, transparent, white)'
                    }}
                />
            </div>

            {/* Content Section */}
            <Section className="bg-white pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8 lg:col-start-3">
                        {/* Excerpt */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-xl leading-relaxed mb-10 pb-10 border-b border-gray-100"
                            style={{ color: 'var(--dark-grey, #0E110F)' }}
                        >
                            {post.excerpt}
                        </motion.p>

                        {/* Article Content with Inline Images */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="prose prose-lg prose-headings:font-heading prose-headings:text-[var(--dark-turquoise)] prose-headings:font-medium prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-[var(--dark-turquoise)] prose-a:no-underline hover:prose-a:underline max-w-none"
                        >
                            {renderContentWithImages()}
                        </motion.div>

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-full"
                                        style={{
                                            backgroundColor: 'rgba(191, 162, 112, 0.1)',
                                            color: 'var(--gold, #BFA270)'
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Share Section */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-[var(--dark-grey)] font-medium">
                                Share this article:
                            </div>
                            <div className="flex gap-4">
                                <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[var(--dark-turquoise)] hover:text-white transition-all">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Similar Blogs Section */}
            {relatedPosts.length > 0 && (
                <section className="similar-blogs-section">
                    <div className="max-w-[1600px] mx-auto px-[clamp(1.5rem,4vw,4rem)]">
                        <div className="text-center mb-12">
                            <p
                                className="text-xs font-normal tracking-[0.2em] uppercase mb-3"
                                style={{ color: 'var(--gold, #BFA270)' }}
                            >
                                Continue Reading
                            </p>
                            <h2
                                className="font-medium tracking-[-0.02em]"
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                                    color: 'var(--dark-turquoise, #1F524B)'
                                }}
                            >
                                Similar Articles
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedPosts.map((relatedPost, index) => (
                                <motion.article
                                    key={relatedPost.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    className="similar-blog-card"
                                >
                                    <Link href={`/blog/${relatedPost.slug}`}>
                                        <div className="overflow-hidden">
                                            <Image
                                                src={relatedPost.thumbnailImage}
                                                alt={relatedPost.title}
                                                width={400}
                                                height={225}
                                                className="similar-blog-card img"
                                            />
                                        </div>
                                        <div className="similar-blog-card-content">
                                            <p className="similar-blog-card-category">
                                                {relatedPost.category}
                                            </p>
                                            <h3 className="similar-blog-card-title">
                                                {relatedPost.title}
                                            </h3>
                                            <div
                                                className="flex items-center text-sm"
                                                style={{ color: 'var(--dark-grey, #0E110F)', opacity: 0.6 }}
                                            >
                                                <span>{relatedPost.date}</span>
                                                <span className="mx-2">•</span>
                                                <span>{relatedPost.readTime}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>

                        {/* View All Articles Button */}
                        <div className="text-center mt-12">
                            <Link
                                href="/blog"
                                className="inline-flex items-center justify-center py-3.5 px-7 text-sm font-semibold tracking-[0.08em] uppercase transition-all duration-300 hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: 'var(--dark-turquoise, #1F524B)',
                                    color: '#ffffff',
                                }}
                            >
                                View All Articles
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
