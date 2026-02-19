'use client';

import React from 'react';
import { StickyScroll } from '@/components/ui/sticky-scroll-reveal';
import styles from './HowWeWork.module.css';
import { motion } from 'framer-motion';

const steps = [
    {
        title: 'Buy a Property',
        description: (
            <div className="space-y-6">
                <p>
                    We help you find your dream home or investment property by offering a wide range of listings with expert guidance. From modern apartments to luxury villas, we ensure a seamless buying experience tailored to your needs.
                </p>
                <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-loose marker:text-black mt-6">
                    <li>Exclusive access to premium listings</li>
                    <li>Expert negotiation and deal structuring</li>
                    <li>Complete legal documentation support</li>
                    <li>Post-purchase assistance</li>
                </ul>
            </div>
        ),
        content: (
            <div className="h-full w-full flex items-center justify-center text-white">
                <img
                    src="/images/Buy.jpg"
                    className="h-full w-full object-cover"
                    alt="Buy a Property"
                />
            </div>
        ),
    },
    {
        title: 'Rent a Property',
        description: (
            <div className="space-y-8">
                <p>
                    Whether you're a landlord or a tenant, we make renting easy. Our platform offers a wide selection of properties with flexible lease options and secure agreements ensuring peace of mind for both parties.
                </p>
                <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-loose marker:text-black mt-6">
                    <li>Verified tenant screening process</li>
                    <li>Drafting of secure lease agreements</li>
                    <li>Efficient move-in/move-out coordination</li>
                    <li>Ongoing tenancy support</li>
                </ul>
            </div>
        ),
        content: (
            <div className="h-full w-full flex items-center justify-center text-white">
                <img
                    src="/images/Rent.jpg"
                    className="h-full w-full object-cover"
                    alt="Rent a Property"
                />
            </div>
        ),
    },
    {
        title: 'Sell a Property',
        description: (
            <div className="space-y-8">
                <p>
                    Get the best value for your property with our professional listing services. We provide market analysis, staging advice, and extensive marketing to attract potential buyers quickly and efficiently.
                </p>
                <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-loose marker:text-black mt-6">
                    <li>Comprehensive market valuation</li>
                    <li>Professional photography and staging</li>
                    <li>Multi-channel marketing campaigns</li>
                    <li>Seamless closing process management</li>
                </ul>
            </div>
        ),
        content: (
            <div className="h-full w-full flex items-center justify-center text-white">
                <img
                    src="/images/sell.jpg"
                    className="h-full w-full object-cover"
                    alt="Sell a Property"
                />
            </div>
        ),
    },
    {
        title: 'Property Management',
        description: (
            <div className="space-y-8">
                <p>
                    We handle everything from tenant screening to maintenance and rent collection. Our property management services ensure landlords get stress-free income from their investments while maintaining asset value.
                </p>
                <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-loose marker:text-black mt-6">
                    <li>Timely rent collection and payout</li>
                    <li>Regular property inspections</li>
                    <li>24/7 maintenance coordination</li>
                    <li>Detailed financial reporting</li>
                </ul>
            </div>
        ),
        content: (
            <div className="h-full w-full flex items-center justify-center text-white">
                <img
                    src="/images/Propertymanagement.jpg"
                    className="h-full w-full object-cover"
                    alt="Property Management"
                />
            </div>
        ),
    },
    {
        title: 'Real Estate Consultation',
        description: (
            <div className="space-y-8">
                <p>
                    Need expert advice on buying, selling, or investing? Our experienced real estate consultants provide insights on market trends, legal requirements, and financial planning to help you make informed decisions.
                </p>
                <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-loose marker:text-black mt-6">
                    <li>In-depth market trend analysis</li>
                    <li>Investment portfolio review</li>
                    <li>Legal and regulatory guidance</li>
                    <li>Customized financial planning</li>
                </ul>
            </div>
        ),
        content: (
            <div className="h-full w-full flex items-center justify-center text-white">
                <img
                    src="/images/Consulting.jpg"
                    className="h-full w-full object-cover"
                    alt="Real Estate Consultation"
                />
            </div>
        ),
    },
];

const HowWeWork: React.FC = () => {
    return (
        <section className="py-20 bg-[var(--background)]">
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
                        Our Process
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

                {/* Sticky Scroll Component */}
                <div className="mt-10">
                    <StickyScroll content={steps} />
                </div>
            </div>
        </section>
    );
};

export default HowWeWork;