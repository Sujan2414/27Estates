'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogPost } from '@/lib/blog-data';
import { createClient } from '@/lib/supabase/client';
import { mapDbBlogToPost, DbBlog } from '@/lib/blog-utils';
import styles from './blogs.module.css';

interface BlogCardsProps {
    subtitle?: string;
    title?: string;
    description?: string;
    posts?: BlogPost[];
    showViewAll?: boolean;
    limit?: number;
    flush?: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const
        }
    }
};

const BlogCards: React.FC<BlogCardsProps> = ({
    subtitle = 'From Our Blog',
    title = 'Insights & Perspectives',
    description = 'Expert analysis, market trends, and investment strategies from the 27 Estates research team.',
    posts,
    showViewAll = true,
    limit = 3,
    flush = false
}) => {
    const [fetchedPosts, setFetchedPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        if (!posts) {
            const supabase = createClient();
            supabase
                .from('blogs')
                .select('*')
                .not('published_at', 'is', null)
                .order('published_at', { ascending: false })
                .limit(limit)
                .then(({ data }) => {
                    if (data) {
                        setFetchedPosts((data as DbBlog[]).map(mapDbBlogToPost));
                    }
                });
        }
    }, [posts, limit]);

    const displayPosts = posts || fetchedPosts;

    return (
        <section className={flush ? styles.sectionFlush : styles.section}>
            <div className={styles.container}>
                <div className={flush ? styles.contentCardFlush : styles.contentCard}>
                    {/* Header */}
                    <div className={styles.header}>
                        <motion.p
                            className={styles.subtitle}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6 }}
                        >
                            {subtitle}
                        </motion.p>
                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                        >
                            {title}
                        </motion.h2>
                        <motion.p
                            className={styles.description}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            {description}
                        </motion.p>
                    </div>

                    {/* Blog Grid */}
                    <motion.div
                        className={styles.grid}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        {displayPosts.map((post) => (
                            <motion.div key={post.id} variants={itemVariants}>
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className={styles.card}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={post.thumbnailImage}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className={styles.image}
                                        />
                                    </div>
                                    <div className={styles.content}>
                                        <span className={styles.category}>
                                            {post.category}
                                        </span>
                                        <h3 className={styles.cardTitle}>
                                            {post.title}
                                        </h3>
                                        <p className={styles.excerpt}>
                                            {post.excerpt}
                                        </p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.meta}>
                                                {post.date} &middot; {post.readTime}
                                            </span>
                                            <span className={styles.readMore}>
                                                Read More
                                                <ArrowRight
                                                    size={14}
                                                    className={styles.arrowIcon}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* View All */}
                    {showViewAll && (
                        <motion.div
                            className={styles.viewAllWrapper}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                        >
                            <Link href="/blog" className={styles.viewAllBtn}>
                                View All Articles
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BlogCards;
