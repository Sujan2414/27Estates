'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './FeaturedProperties.module.css';

interface Property {
    id: number;
    title: string;
    location: string;
    price: string;
    type: string;
    size: string;
    image: string;
}

const properties: Property[] = [
    {
        id: 1,
        title: "L&T Elara Celestia",
        location: "Hebbal, Bangalore",
        price: "Starting ₹2.4 Cr",
        type: "3 BHK Apartments",
        size: "From 1,850 sq.ft",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        title: "Surya Valencia",
        location: "Near Airport, Bangalore",
        price: "Starting ₹4.2 Cr",
        type: "4-5 BHK Villas",
        size: "3,100 - 3,950 sq.ft",
        image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        title: "Divyashree Whispers",
        location: "Nandi Hills, Bangalore",
        price: "Starting ₹48 L",
        type: "Premium Plots",
        size: "1,200 - 4,000 sq.ft",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

const FeaturedProperties: React.FC = () => {
    return (
        <section id="properties" className={styles.section}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        Featured Properties
                    </motion.p>
                    <motion.h2
                        className={styles.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        Curated Selection
                    </motion.h2>
                    <motion.p
                        className={styles.description}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Handpicked properties across Bangalore&apos;s most
                        coveted locations.
                    </motion.p>
                </div>

                {/* Properties Grid */}
                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {properties.map((property) => (
                        <motion.article
                            key={property.id}
                            className={styles.card}
                            variants={itemVariants}
                        >
                            {/* Image */}
                            <div className={styles.imageWrapper}>
                                <motion.img
                                    src={property.image}
                                    alt={property.title}
                                    className={styles.image}
                                    whileHover={{ scale: 1.04 }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                />
                            </div>

                            {/* Content */}
                            <div className={styles.content}>
                                <span className={styles.type}>{property.type}</span>
                                <h3 className={styles.propertyTitle}>{property.title}</h3>
                                <p className={styles.location}>{property.location}</p>

                                <div className={styles.details}>
                                    <span className={styles.size}>{property.size}</span>
                                </div>

                                <div className={styles.footer}>
                                    <span className={styles.price}>{property.price}</span>
                                    <motion.a
                                        href="#contact"
                                        className={styles.viewBtn}
                                        whileHover={{ x: 4 }}
                                    >
                                        Enquire →
                                    </motion.a>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>

                {/* View All Link */}
                <motion.div
                    className={styles.viewAllWrapper}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <a href="/properties" className={styles.viewAllBtn}>
                        View All Properties
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturedProperties;
