'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './WelcomeSection.module.css';

const WelcomeSection: React.FC = () => {
    return (
        <section id="about" className={styles.section}>
            {/* Decorative Element */}
            <div className={styles.palmShadow} />

            <div className={styles.container}>
                {/* Subtitle */}
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    Welcome to 27 Estates
                </motion.p>

                {/* Main Heading */}
                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    Where Transparency<br />Meets Excellence
                </motion.h2>

                {/* Content */}
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    <p className={styles.text}>
                        At 27 Estates, we believe in transparency, simplicity, and substance.
                        Whether you&apos;re a first-time buyer taking your first step into homeownership
                        or a seasoned investor expanding your portfolio, we&apos;re here to guide you
                        through every decision with clarity and care.
                    </p>

                    <p className={styles.text}>
                        Our curated collection spans premium apartments in Hebbal, Mediterranean villas
                        near the airport, and serene plots at Nandi Hills — each handpicked to meet
                        the highest standards of luxury and value.
                    </p>

                    <div className={styles.signature}>
                        <p className={styles.signatureName}>The 27 Estates Team</p>
                        <p className={styles.signatureTitle}>Luxury Real Estate Advisory</p>
                    </div>
                </motion.div>
            </div>

            {/* Divider */}
            <motion.div
                className={styles.divider}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                <div className={styles.dividerLine} />
                <div className={styles.dividerIcon} />
                <div className={styles.dividerLine} />
            </motion.div>
        </section>
    );
};

export default WelcomeSection;
