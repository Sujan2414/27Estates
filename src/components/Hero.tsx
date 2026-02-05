'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import styles from './Hero.module.css';

const heroImages = [
    // Stunning modern luxury villa with infinity pool at dusk
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    // Elegant modern living room with floor-to-ceiling windows
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80",
    // Luxurious contemporary home exterior with warm lighting
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    // Premium villa with garden and stunning architecture
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    // Modern luxury apartment building with ambient evening glow
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
];

const Hero: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { showAuthModal } = useAuth();
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["Luxury", "Lifestyle", "Excellence"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <section ref={containerRef} className={styles.hero}>
            {/* Background Image Carousel with Zoom */}
            <motion.div className={styles.imageContainer} style={{ y }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentImageIndex}
                        className={styles.backgroundImage}
                        style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 1.5 },
                            scale: { duration: 7, ease: "linear" }
                        }}
                    />
                </AnimatePresence>
            </motion.div>

            {/* Subtle Overlay */}
            <div className={styles.overlay} />

            {/* Content */}
            <motion.div
                className={styles.content}
                style={{ opacity }}
            >
                <div className={styles.container}>
                    <div className={styles.textContent}>
                        {/* Subtitle */}
                        <motion.p
                            className={styles.subtitle}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Luxury Real Estate Advisory
                        </motion.p>

                        {/* Headline */}
                        <motion.h1
                            className={styles.headline}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Experience&nbsp;True<br />
                            <span className={styles.rotatingWrapper}>
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className={styles.rotatingWord}
                                        initial={{ opacity: 0, y: "-100" }}
                                        animate={
                                            titleNumber === index
                                                ? { y: 0, opacity: 1 }
                                                : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                                        }
                                        transition={{ type: "spring", stiffness: 50 }}
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            className={styles.description}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Premium apartments, villas, and plots in Bangalore&apos;s most
                            coveted locations. Your journey to extraordinary living starts here.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className={styles.ctas}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.button
                                onClick={() => showAuthModal('/properties')}
                                className={styles.ctaPrimary}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                View Listings
                            </motion.button>
                            <motion.a
                                href="#contact"
                                className={styles.ctaSecondary}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Contact Agent
                            </motion.a>
                        </motion.div>

                        {/* Trust Text */}
                        <motion.p
                            className={styles.trustText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                        >
                            Trusted by premium homeowners & investors
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
