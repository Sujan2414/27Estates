'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './TestimonialSection.module.css';

const testimonials = [
    {
        id: 1,
        quote: "27 Estates helped us find our dream villa in North Bangalore. Their transparency and attention to detail were unmatched.",
        name: "Rajesh S.",
        role: "Business Owner",
        initial: "R"
    },
    {
        id: 2,
        quote: "As an NRI investor, I needed a partner I could trust blindly. The team's professionalism made the process seamless.",
        name: "Priya M.",
        role: "Tech Executive",
        initial: "P"
    },
    {
        id: 3,
        quote: "They don't just sell properties; they curate lifestyles. The plots at Nandi Hills are exactly what I was looking for.",
        name: "Arun K.",
        role: "Architect",
        initial: "A"
    },
    {
        id: 4,
        quote: "Exceptional service from start to finish. The corporate leasing team understood our requirements perfectly.",
        name: "Sarah J.",
        role: "Director of Ops",
        initial: "S"
    },
    {
        id: 5,
        quote: "Honest advice and zero pressure. A rare find in the real estate market today. Highly recommended.",
        name: "Vikram R.",
        role: "Doctor",
        initial: "V"
    }
];

const TestimonialSection: React.FC = () => {
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

                {/* Ticker */}
                <div className={styles.tickerWrapper}>
                    <motion.div
                        className={styles.tickerTrack}
                        animate={{
                            x: [0, -1775], // Approx width of 5 cards (350px + 32px gap) * 5.  Adjust based on content.
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 30, // Slow speed
                                ease: "linear",
                            },
                        }}
                    >
                        {/* Render twice for seamless loop */}
                        {[...testimonials, ...testimonials, ...testimonials].map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className={styles.card}>
                                <p className={styles.quote}>"{item.quote}"</p>
                                <div className={styles.author}>
                                    <div className={styles.avatar}>
                                        {item.initial}
                                    </div>
                                    <div className={styles.info}>
                                        <span className={styles.name}>{item.name}</span>
                                        <span className={styles.role}>{item.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialSection;
