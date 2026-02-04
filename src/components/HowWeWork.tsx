'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './HowWeWork.module.css';

const steps = [
    {
        number: '01',
        title: 'Buy a Property',
        description: 'We help you find your dream home or investment property by offering a wide range of listings with expert guidance. From modern apartments to luxury villas, we ensure a seamless buying experience.',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1973&q=80'
    },
    {
        number: '02',
        title: 'Rent a Property',
        description: 'Whether you\'re a landlord or a tenant, we make renting easy. Our platform offers a wide selection of properties with flexible lease options and secure agreements.',
        image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=1996&q=80'
    },
    {
        number: '03',
        title: 'Sell a Property',
        description: 'Get the best value for your property with our professional listing services. We provide market analysis, staging advice, and extensive marketing to attract potential buyers quickly.',
        image: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    },
    {
        number: '04',
        title: 'Property Management',
        description: 'We handle everything from tenant screening to maintenance and rent collection. Our property management services ensure landlords get stress-free income from their investments.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    },
    {
        number: '05',
        title: 'Real Estate Consultation',
        description: 'Need expert advice on buying, selling, or investing? Our experienced real estate consultants provide insights on market trends, legal requirements, and financial planning.',
        image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'
    }
];

const HowWeWork: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section className={styles.section} ref={containerRef}>
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
                        How we work
                    </motion.p>
                    <motion.h2
                        className={styles.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        Let's turn your big ideas into reality
                    </motion.h2>
                    <motion.p
                        className={styles.description}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        A clear and seamless process designed for your success
                    </motion.p>
                </div>

                {/* Steps Navigation */}
                <div className={styles.stepsNav}>
                    {steps.map((step, index) => (
                        <motion.button
                            key={index}
                            className={`${styles.stepNavBtn} ${activeStep === index ? styles.active : ''}`}
                            onClick={() => setActiveStep(index)}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <span className={styles.stepNavNumber}>Step</span>
                            <span className={styles.stepNavDigit}>{step.number}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Content Area */}
                <div className={styles.contentWrapper}>
                    {/* Image Side */}
                    <motion.div 
                        className={styles.imageContainer}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <img
                            src={steps[activeStep].image}
                            alt={steps[activeStep].title}
                            className={styles.image}
                            key={activeStep}
                        />
                    </motion.div>

                    {/* Text Side */}
                    <div className={styles.textContainer}>
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className={styles.stepLabel}>STEP</span>
                            <span className={styles.stepNumber}>{steps[activeStep].number}</span>
                            <h3 className={styles.stepTitle}>{steps[activeStep].title}</h3>
                            <p className={styles.stepDescription}>{steps[activeStep].description}</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowWeWork;