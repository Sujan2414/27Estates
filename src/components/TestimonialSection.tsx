'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './TestimonialSection.module.css';

const testimonials = [
    {
        id: 1,
        quote: "27 Estates helped us find our dream villa in North Bangalore. Their transparency and attention to detail were unmatched.",
        name: "Rajesh S.",
        username: "@raj_singh",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    {
        id: 2,
        quote: "As an NRI investor, I needed a partner I could trust blindly. The team's professionalism made the process seamless.",
        name: "Varada M.",
        username: "@varuu_21",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    {
        id: 3,
        quote: "They don't just sell properties; they curate lifestyles. The plots at Nandi Hills are exactly what I was looking for.",
        name: "Arun K.",
        username: "@arun_ofc",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    {
        id: 4,
        quote: "Exceptional service from start to finish. The corporate leasing team understood our requirements perfectly.",
        name: "Sanya J.",
        username: "@sanya_j",
        image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    {
        id: 5,
        quote: "Honest advice and zero pressure. A rare find in the real estate market today. Highly recommended.",
        name: "Vikram R.",
        username: "@dr_vikram_r",
        image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    }
];

const TestimonialSection: React.FC = () => {
    // Triple cards for seamless infinite ticker loop on all devices
    const displayCards = [...testimonials, ...testimonials, ...testimonials];

    return (
        <section className={styles.section}>
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
                        Client Stories
                    </motion.p>
                    <motion.h2
                        className={styles.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        Trusted by the Best
                    </motion.h2>
                    <motion.p
                        className={styles.description}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Hear from our valued clients who found their perfect space with us.
                    </motion.p>
                </div>

                {/* Ticker / Carousel */}
                <div className={styles.tickerWrapper}>
                    <div className={styles.tickerTrack}>
                        {displayCards.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className={styles.card}>
                                <p className={styles.quote}>"{item.quote}"</p>
                                <div className={styles.author}>
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className={styles.avatarImage || styles.avatar} // Use existing avatar class for shape, maybe add new class for image specific styles if needed
                                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div className={styles.info}>
                                        <span className={styles.name}>{item.name}</span>
                                        <span className={styles.role}>{item.username}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialSection;
