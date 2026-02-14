'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './FeaturedProperties.module.css';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import FeaturedAdCard from '@/components/FeaturedAdCard';

interface FeaturedProperty {
    id: string;
    title: string;
    location: string;
    city: string | null;
    price: number;
    price_text: string | null;
    category: string;
    property_type: string;
    bedrooms: number;
    sqft: number;
    images: string[];
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

const formatPrice = (price: number, priceText: string | null) => {
    if (priceText) return priceText;
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
};

const FeaturedProperties: React.FC = () => {
    const { checkAuthAndNavigate, showAuthModal } = useAuth();
    const [properties, setProperties] = useState<FeaturedProperty[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchFeatured = async () => {
            const { data } = await supabase
                .from('properties')
                .select('id, title, location, city, price, price_text, category, property_type, bedrooms, sqft, images')
                .eq('is_featured', true)
                .limit(6);

            if (data) setProperties(data);
        };
        fetchFeatured();
    }, [supabase]);

    if (properties.length === 0) return null;

    return (
        <section id="properties" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.contentCard}>
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
                            <motion.div
                                key={property.id}
                                variants={itemVariants}
                            >
                                <FeaturedAdCard
                                    id={property.id}
                                    type="property"
                                    image={property.images?.[0] || '/placeholder-property.jpg'}
                                    title={property.title}
                                    location={property.location}
                                    city={property.city || undefined}
                                    price={formatPrice(property.price, property.price_text)}
                                    category={property.category}
                                    bhk={property.bedrooms ? `${property.bedrooms} BHK` : undefined}
                                    area={property.sqft ? `${property.sqft.toLocaleString()} sqft` : undefined}
                                    onCardClick={checkAuthAndNavigate}
                                />
                            </motion.div>
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
                        <button
                            className={styles.viewAllBtn}
                            onClick={() => showAuthModal('/properties')}
                        >
                            View All Properties
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProperties;
