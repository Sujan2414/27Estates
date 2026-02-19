'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './ContactCTA.module.css';

import { useRouter } from 'next/navigation';

const ContactCTA: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // On desktop, the ZoomParallax already has a CTA — only show this on mobile
    if (!isMobile) return null;

    return (
        <section id="contact" className={styles.section}>
            {/* Background Image */}
            <motion.div
                className={styles.backgroundWrapper}
                initial={{ scale: 1.04 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className={styles.backgroundImage} />
            </motion.div>

            {/* Overlay */}
            <div className={styles.overlay} />

            {/* Content */}
            <div className={styles.content}>
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    Let&apos;s Connect
                </motion.p>

                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.7 }}
                >
                    Begin Your Journey
                </motion.h2>

                <motion.p
                    className={styles.description}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    Whether you&apos;re buying your first home or expanding your portfolio,
                    our team is here to guide you with transparency and expertise.
                </motion.p>

                <motion.div
                    className={styles.ctas}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <motion.button
                        onClick={() => router.push('/contact')}
                        className={styles.ctaPrimary}
                        whileHover={{ y: -2 }}
                    >
                        Contact Us
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

export default ContactCTA;

