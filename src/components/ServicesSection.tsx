'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ExpandOnHover from '@/components/ui/expand-cards';
import styles from './FeaturedProperties.module.css';

const ServicesSection: React.FC = () => {
    return (
        <>
            {/* Header Section */}
            <div className="bg-[#f5f4f3]" style={{ paddingTop: '128px', paddingBottom: '48px' }}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <motion.p
                            className={styles.subtitle}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            Our Services
                        </motion.p>
                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                        >
                            Comprehensive Solutions
                        </motion.h2>
                        <motion.p
                            className={styles.description}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            Comprehensive real estate solutions tailored to your needs.
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Cards Component */}
            <ExpandOnHover />
        </>
    );
};

export default ServicesSection;
