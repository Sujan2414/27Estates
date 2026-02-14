'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './PageHero.module.css';

interface PageHeroProps {
    title: string;
    subtitle?: string;
    backgroundImage: string;
}

const PageHero: React.FC<PageHeroProps> = ({ title, subtitle, backgroundImage }) => {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Parallax effect for image
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    // Fade out content on scroll
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={containerRef} className={styles.hero}>
            {/* Background Image with Parallax */}
            <motion.div className={styles.imageContainer} style={{ y }}>
                <div
                    className={styles.backgroundImage}
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
            </motion.div>

            {/* Overlay */}
            <div className={styles.overlay} />

            {/* Content */}
            <motion.div className={styles.content} style={{ opacity }}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {title}
                </motion.h1>

                {subtitle && (
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {subtitle}
                    </motion.p>
                )}
            </motion.div>
        </section>
    );
};

export default PageHero;
