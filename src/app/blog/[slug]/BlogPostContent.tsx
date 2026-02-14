'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, ArrowRight, Share2 } from 'lucide-react';
import { BlogPost } from '@/lib/blog-data';
import styles from './blogpost.module.css';

interface BlogPostContentProps {
    post: BlogPost;
    relatedPosts?: BlogPost[];
}

// Social share icons as inline SVGs for clean rendering
const TwitterIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const CopyLinkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

export default function BlogPostContent({ post, relatedPosts: relatedPostsProp }: BlogPostContentProps) {
    const heroRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const relatedPosts = relatedPostsProp || [];

    // Progress bar
    const [progress, setProgress] = React.useState(0);
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        };
        window.addEventListener('scroll', updateProgress, { passive: true });
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    // Share handlers
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `${post.title} — 27 Estates`;

    const handleShare = (platform: string) => {
        const urls: Record<string, string> = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(pageUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
            return;
        }

        window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
    };

    // Render article content with inline images between h2 sections
    const renderContentWithImages = () => {
        const contentParts = post.content.split('</h2>');

        return contentParts.map((part, index) => {
            if (!part.trim() && index === contentParts.length - 1) return null;

            return (
                <React.Fragment key={index}>
                    <div
                        dangerouslySetInnerHTML={{ __html: part + (index < contentParts.length - 1 ? '</h2>' : '') }}
                        className={styles.blogContent}
                    />
                </React.Fragment>
            );
        });
    };

    return (
        <main className={styles.main}>
            {/* Reading Progress Bar */}
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />

            {/* Hero Section */}
            <section ref={heroRef} className={styles.hero}>
                <motion.div className={styles.heroImageWrap} style={{ y: heroY }}>
                    <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        priority
                        className="object-cover"
                    />
                </motion.div>

                {/* Overlay */}
                <div className={styles.heroOverlay} />

                {/* Hero Content */}
                <motion.div className={styles.heroContent} style={{ opacity: heroOpacity }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={styles.heroBadge}>
                            {post.category}
                        </div>

                        <h1 className={styles.heroTitle}>
                            {post.title}
                        </h1>

                        <div className={styles.heroMeta}>
                            <div className={styles.heroMetaItem}>
                                <Calendar size={14} />
                                <span>{post.date}</span>
                            </div>
                            <div className={styles.heroMetaItem}>
                                <Clock size={14} />
                                <span>{post.readTime}</span>
                            </div>
                            <div className={styles.heroMetaItem}>
                                <span className={styles.heroAuthorDot} />
                                <span>{post.author}</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Content area with sticky share sidebar */}
            <div className={styles.contentArea}>
                <div className={styles.contentLayout}>

                    {/* Sticky Share Sidebar - Left */}
                    <aside className={styles.shareSidebar}>
                        <div className={styles.shareSticky}>
                            <span className={styles.shareLabel}>
                                <Share2 size={14} />
                                Share
                            </span>
                            <div className={styles.shareDivider} />
                            <button
                                className={styles.shareBtn}
                                onClick={() => handleShare('twitter')}
                                title="Share on X (Twitter)"
                            >
                                <TwitterIcon />
                            </button>
                            <button
                                className={styles.shareBtn}
                                onClick={() => handleShare('facebook')}
                                title="Share on Facebook"
                            >
                                <FacebookIcon />
                            </button>
                            <button
                                className={styles.shareBtn}
                                onClick={() => handleShare('linkedin')}
                                title="Share on LinkedIn"
                            >
                                <LinkedInIcon />
                            </button>
                            <button
                                className={styles.shareBtn}
                                onClick={() => handleShare('whatsapp')}
                                title="Share on WhatsApp"
                            >
                                <WhatsAppIcon />
                            </button>
                            <div className={styles.shareDivider} />
                            <button
                                className={`${styles.shareBtn} ${copied ? styles.shareBtnCopied : ''}`}
                                onClick={() => handleShare('copy')}
                                title="Copy link"
                            >
                                {copied ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <CopyLinkIcon />
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Main Article Column */}
                    <div className={styles.articleColumn}>
                        {/* Back Link */}
                        <div className={styles.backLink}>
                            <Link href="/blog" className={styles.backLinkAnchor}>
                                <ArrowLeft size={13} />
                                Back to Insights
                            </Link>
                        </div>

                        {/* Article Content */}
                        <article className={styles.article}>
                            {/* Featured Image */}
                            {post.contentImages && post.contentImages.length > 0 && (
                                <figure className={styles.featuredImage}>
                                    <div className={styles.featuredImageInner}>
                                        <Image
                                            src={post.contentImages[0]}
                                            alt={`${post.title} - illustration`}
                                            width={1200}
                                            height={680}
                                            className={styles.featuredImg}
                                        />
                                    </div>
                                </figure>
                            )}

                            {renderContentWithImages()}
                        </article>

                        {/* Tags */}
                        <div className={styles.tagsSection}>
                            <div className={styles.tagsList}>
                                {post.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Share Row */}
                        <div className={styles.mobileShareRow}>
                            <span className={styles.mobileShareLabel}>
                                <Share2 size={14} />
                                Share this article
                            </span>
                            <div className={styles.mobileShareBtns}>
                                <button className={styles.mobileShareBtn} onClick={() => handleShare('twitter')} title="X">
                                    <TwitterIcon />
                                </button>
                                <button className={styles.mobileShareBtn} onClick={() => handleShare('facebook')} title="Facebook">
                                    <FacebookIcon />
                                </button>
                                <button className={styles.mobileShareBtn} onClick={() => handleShare('linkedin')} title="LinkedIn">
                                    <LinkedInIcon />
                                </button>
                                <button className={styles.mobileShareBtn} onClick={() => handleShare('whatsapp')} title="WhatsApp">
                                    <WhatsAppIcon />
                                </button>
                                <button
                                    className={`${styles.mobileShareBtn} ${copied ? styles.shareBtnCopied : ''}`}
                                    onClick={() => handleShare('copy')}
                                    title="Copy link"
                                >
                                    {copied ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <CopyLinkIcon />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                    <section className={styles.relatedSection}>
                        <div className={styles.relatedContainer}>
                            <div className={styles.relatedHeader}>
                                <div>
                                    <p className={styles.relatedSubtitle}>Continue Reading</p>
                                    <h2 className={styles.relatedTitle}>Similar Articles</h2>
                                </div>
                                <Link href="/blog" className={styles.relatedViewAll}>
                                    View All <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className={styles.relatedGrid}>
                                {relatedPosts.map((relatedPost) => (
                                    <article key={relatedPost.id} className={styles.relatedCard}>
                                        <Link
                                            href={`/blog/${relatedPost.slug}`}
                                            className={styles.relatedCardLink}
                                        >
                                            <div className={styles.relatedCardImage}>
                                                <Image
                                                    src={relatedPost.thumbnailImage}
                                                    alt={relatedPost.title}
                                                    fill
                                                    className={styles.relatedCardImg}
                                                />
                                                <div className={styles.relatedCardBadge}>
                                                    {relatedPost.category}
                                                </div>
                                            </div>
                                            <div className={styles.relatedCardMeta}>
                                                <span>{relatedPost.date}</span>
                                                <span className={styles.relatedCardDot} />
                                                <span>{relatedPost.readTime}</span>
                                            </div>
                                            <h3 className={styles.relatedCardTitle}>
                                                {relatedPost.title}
                                            </h3>
                                            <p className={styles.relatedCardExcerpt}>
                                                {relatedPost.excerpt}
                                            </p>
                                        </Link>
                                    </article>
                                ))}
                            </div>

                            <div className={styles.relatedMobileViewAll}>
                                <Link href="/blog" className={styles.relatedMobileBtn}>
                                    View All Articles
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
