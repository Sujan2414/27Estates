'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './ContactCTA.module.css';

const ContactCTA: React.FC = () => {
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
                    <motion.a
                        href="mailto:hello@27estates.com"
                        className={styles.ctaPrimary}
                        whileHover={{ y: -2 }}
                    >
                        Contact Us
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
};

export default ContactCTA;

